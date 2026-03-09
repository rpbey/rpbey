import 'reflect-metadata';
import 'dotenv/config';
import { DefaultExtractors } from '@discord-player/extractor';
import { tsyringeDependencyRegistryEngine } from '@discordx/di';
import { dirname, importx } from '@discordx/importer';
import { PermissionsBitField } from 'discord.js';
import { Player } from 'discord-player';
import { DIService } from 'discordx';
import { container } from 'tsyringe';

import { startApiServer } from './lib/api-server.js';
import { bot } from './lib/bot.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

async function run() {
  // Config DI
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

  // Import Commands/Events
  await importx(
    `${dirname(import.meta.url)}/{events,commands,interaction-handlers}/**/*.{ts,js}`,
  );

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

  // Login
  if (!process.env.DISCORD_TOKEN)
    throw Error('Could not find DISCORD_TOKEN in environment');

  await bot.login(process.env.DISCORD_TOKEN);

  bot.once('ready', async () => {
    try {
      const guildId = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;

      // 1. Clear ALL global commands (to remove duplicates)
      await bot.clearApplicationCommands();
      logger.info('[Bot] Global commands cleared.');

      if (guildId) {
        logger.info(`[Bot] Syncing commands ONLY for guild: ${guildId}`);

        // 2. Register all commands to internal registry
        await bot.initApplicationCommands();

        const guild = await bot.guilds.fetch(guildId);
        if (guild) {
          // 3. Force update of guild commands
          // discordx toJSON() returns ApplicationCommandData-compatible objects
          await guild.commands.set(
            bot.applicationCommands.map(
              (c) => c.toJSON() as Parameters<typeof guild.commands.set>[0][0],
            ),
          );
          logger.info(
            `[Bot] Successfully synchronized ${bot.applicationCommands.length} commands to guild.`,
          );
        }
      }
      logger.info(
        `[Bot] Logged in as ${bot.user?.tag} and commands are ready.`,
      );
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

  // Start API
  const apiPort = parseInt(process.env.BOT_API_PORT ?? '3001', 10);
  startApiServer(apiPort);
}

// Global Rejection Handler
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

void run().catch((err) => {
  logger.error('Fatal Startup Error:', err);
  process.exit(1);
});
