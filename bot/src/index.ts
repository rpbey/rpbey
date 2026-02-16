import 'reflect-metadata';
import 'dotenv/config';
import { DefaultExtractors } from '@discord-player/extractor';
import { tsyringeDependencyRegistryEngine } from '@discordx/di';
import { dirname, importx } from '@discordx/importer';
import logs from 'discord-logs';
import { Player } from 'discord-player';
import { DIService } from 'discordx';
import { container } from 'tsyringe';

import { setupCronJobs } from './cron/index.js';
import { startApiServer } from './lib/api-server.js';
import { bot } from './lib/bot.js';
import { generateCustomCommands } from './lib/command-generator.js';
import { setupLogCapture } from './lib/log-capture.js';
import { logger } from './lib/logger.js';
import prisma from './lib/prisma.js'; // Added
import { twitchBot } from './lib/twitch-bot.js';

// Initialize DI
DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

async function run() {
  setupLogCapture();

  // Initialize discord-logs
  logs(bot as any);

  // Parallelize independent initializations
  logger.info('[Bot] Starting initializations...');
  await importx(
    `${dirname(import.meta.url)}/{events,commands,components}/**/*.{ts,js}`,
  );
  logger.info('[Bot] Files imported.');

  await Promise.all([
    generateCustomCommands().catch((e) =>
      logger.error('[Init] Custom Commands failed:', e),
    ),
    twitchBot.init().catch((e) => logger.error('[Init] Twitch Bot failed:', e)),
  ]);

  // Setup Cron
  setupCronJobs();

  // Initialize Discord Player
  const player = new Player(bot as any);
  await player.extractors.loadMulti(DefaultExtractors);
  logger.info('[Music] Discord Player extractors loaded.');

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
    const interaction = queue.metadata as any;
    if (interaction?.channel) {
      void (interaction.channel as any)
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
      await bot.initApplicationCommands();
      logger.info(`[Bot] Logged in as ${bot.user?.tag}`);
    } catch (e) {
      logger.error('[Bot] Failed to init application commands:', e);
    }
  });

  bot.on('interactionCreate', async (interaction) => {
    try {
      // Global Disabled Commands Check
      if (interaction.isCommand()) {
        const settingsBlock = await prisma.contentBlock.findUnique({
          where: { slug: 'bot-settings' },
        });
        if (settingsBlock?.content) {
          const { disabledCommands = [] } = JSON.parse(settingsBlock.content);
          if (disabledCommands.includes(interaction.commandName)) {
            return (interaction as any).reply({
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
      const prefix = '!'; // Default prefix for simple commands
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
