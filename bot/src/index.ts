import 'reflect-metadata';
import 'dotenv/config';
import { DefaultExtractors } from '@discord-player/extractor';
import { tsyringeDependencyRegistryEngine } from '@discordx/di';
import { dirname, importx } from '@discordx/importer';
import { PermissionsBitField } from 'discord.js';
import { Player } from 'discord-player';
import { DIService } from 'discordx';
import { container } from 'tsyringe';
import { bot } from './lib/bot.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

// Check Discord session availability via REST API
async function waitForSessions(token: string): Promise<void> {
  const { REST, Routes } = await import('discord.js');
  const rest = new REST().setToken(token);
  const CHECK_INTERVAL = 5 * 60_000; // Re-check every 5 minutes

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const gateway = (await rest.get(Routes.gatewayBot())) as {
        session_start_limit: {
          total: number;
          remaining: number;
          reset_after: number;
        };
      };
      const { remaining, reset_after } = gateway.session_start_limit;
      logger.info(
        `[Bot] Sessions: ${remaining} remaining (resets in ${Math.round(reset_after / 60000)}min)`,
      );

      if (remaining > 0) {
        logger.info('[Bot] Sessions available, proceeding to login...');
        return;
      }

      const waitMs = Math.min(reset_after + 5000, CHECK_INTERVAL);
      logger.warn(
        `[Bot] No sessions remaining. Re-checking in ${Math.round(waitMs / 60000)}min...`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    } catch (e) {
      logger.warn('[Bot] Could not check session limit, retrying in 5min:', e);
      await new Promise((r) => setTimeout(r, CHECK_INTERVAL));
    }
  }
}

async function run() {
  // Config DI
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

  // Import Commands/Events/Components
  await importx(
    `${dirname(import.meta.url)}/{events,commands,components}/**/*.{ts,js}`,
  );

  // Login
  if (!process.env.DISCORD_TOKEN)
    throw Error('Could not find DISCORD_TOKEN in environment');

  // Wait for sessions to be available before connecting
  await waitForSessions(process.env.DISCORD_TOKEN);

  // Config Player
  const player = new Player(
    bot as unknown as ConstructorParameters<typeof Player>[0],
  );
  await player.extractors.loadMulti(DefaultExtractors);

  // Verify FFmpeg async
  void import('node:child_process').then(({ spawnSync }) => {
    try {
      const ffmpeg = spawnSync('ffmpeg', ['-version']);
      if (ffmpeg.status === 0)
        logger.info('[Music] FFmpeg verified successfully.');
      else logger.warn('[Music] FFmpeg not found in PATH.');
    } catch {
      logger.warn('[Music] Failed to verify FFmpeg.');
    }
  });

  // Player Events
  player.events.on('error', (_queue, error) =>
    logger.error(`[Music] Queue error: ${error.message}`),
  );
  player.events.on('playerError', (_queue, error) =>
    logger.error(`[Music] Player error: ${error.message}`),
  );
  player.events.on('playerStart', (queue, track) => {
    logger.info(`[Music] Started playing: ${track.title}`);
    const meta = queue.metadata as
      | { channel?: { send: (msg: string) => Promise<unknown> } }
      | undefined;
    if (meta?.channel) {
      void meta.channel
        .send(`▶️ **Lecture en cours :** ${track.title}`)
        .catch(() => null);
    }
  });

  await bot.login(process.env.DISCORD_TOKEN);

  bot.once('ready', async () => {
    try {
      const guildId = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;

      // Clear global commands to avoid duplicates
      await bot.clearApplicationCommands();
      logger.info('[Bot] Global commands cleared.');

      if (guildId) {
        logger.info(`[Bot] Syncing commands for guild: ${guildId}`);
      }

      // Register commands via discordx (handles guild registration automatically)
      await bot.initApplicationCommands();

      logger.info(
        `[Bot] Logged in as ${bot.user?.tag} — ${bot.applicationCommands.length} commands registered.`,
      );

      // Start scheduled tasks
      const { setupCronJobs } = await import('./cron/index.js');
      setupCronJobs();
    } catch (e) {
      logger.error('[Bot] Failed to init application commands:', e);
    }
  });

  bot.on('interactionCreate', async (interaction) => {
    try {
      const settingsBlock = await prisma.contentBlock.findUnique({
        where: { slug: 'bot-settings' },
      });

      if (settingsBlock?.content) {
        const settings = JSON.parse(settingsBlock.content);

        // 1. Check Global Maintenance Mode
        if (settings.maintenanceMode && interaction.isCommand()) {
          const perms = interaction.member?.permissions;
          const isAdmin =
            perms instanceof PermissionsBitField
              ? perms.has('Administrator')
              : false;
          if (!isAdmin) {
            return interaction.reply({
              content:
                "🛠️ **Le bot est actuellement en maintenance.**\nNous revenons très vite ! Suivez les annonces pour plus d'infos.",
              ephemeral: true,
            });
          }
        }

        // 2. Check Specific Disabled Commands
        if (interaction.isCommand()) {
          const { disabledCommands = [] } = settings;
          if (disabledCommands.includes(interaction.commandName)) {
            return interaction.reply({
              content:
                '⚠️ Cette commande est temporairement désactivée par un administrateur.',
              ephemeral: true,
            });
          }
        }
      }
      void bot.executeInteraction(interaction);
    } catch (e) {
      logger.error('[Bot] Interaction error:', e);
    }
  });

  bot.on('messageCreate', async (message) => {
    try {
      // Global Disabled Commands Check
      const prefix = '!';
      if (message.content.startsWith(prefix)) {
        const cmdName = message.content.slice(prefix.length).split(' ')[0];
        const settingsBlock = await prisma.contentBlock.findUnique({
          where: { slug: 'bot-settings' },
        });
        if (settingsBlock?.content) {
          const { disabledCommands = [] } = JSON.parse(settingsBlock.content);
          if (disabledCommands.includes(cmdName)) {
            return message.reply(
              '⚠️ Cette commande est temporairement désactivée.',
            );
          }
        }
      }
      void bot.executeCommand(message);
    } catch (e) {
      logger.error('[Bot] Message command error:', e);
    }
  });
}

// Global Rejection Handler
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

void run().catch(async (err) => {
  logger.error('Fatal Startup Error:', err);
  // Wait 60s before exiting to avoid rapid restart loops burning Discord sessions
  logger.info('[Bot] Waiting 60s before exit to prevent session burn...');
  await new Promise((r) => setTimeout(r, 60_000));
  process.exit(1);
});
