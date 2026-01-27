import {
  ApplicationCommandRegistries,
  container,
  RegisterBehavior,
  SapphireClient,
} from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-scheduled-tasks/register';
import '@sapphire/plugin-subcommands/register';
import { GatewayIntentBits, Partials } from 'discord.js';
import 'dotenv/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DefaultExtractors } from '@discord-player/extractor';
import { Player } from 'discord-player';
import { startApiServer } from './lib/api-server.js';
import { generateCustomCommands } from './lib/command-generator.js';
import { setupLogCapture } from './lib/log-capture.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Set default behavior for application commands
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
  RegisterBehavior.BulkOverwrite,
);

// If GUILD_ID is provided in .env, set it as default for faster command registration
// We do this even in production for this specific community bot to ensure instant updates
if (process.env.GUILD_ID) {
  ApplicationCommandRegistries.setDefaultGuildIds([process.env.GUILD_ID]);
}

try {
  // Generate custom commands from DB before starting
  await generateCustomCommands();

  const client = new SapphireClient({
    baseUserDirectory: __dirname,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildPresences, // Required for tracking online status
      GatewayIntentBits.GuildVoiceStates, // Required for voice
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
    loadMessageCommandListeners: true,
    logger: {
      level: process.env.NODE_ENV === 'development' ? 20 : 30, // Debug in dev, Info in prod
    },
    tasks: {
      bull: {
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          password: process.env.REDIS_PASSWORD,
        },
      },
    },
  });

  // Initialize Discord Player
  // biome-ignore lint/suspicious/noExplicitAny: Discord Player type compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const player = new Player(client as any);

  // Load extractors
  await player.extractors.loadMulti(DefaultExtractors);

  container.logger.info('[Music] Discord Player extractors loaded.');

  // Verify FFmpeg
  try {
    const { spawnSync } = await import('node:child_process');
    const ffmpeg = spawnSync('ffmpeg', ['-version']);
    if (ffmpeg.status === 0) {
      container.logger.info('[Music] FFmpeg verified successfully.');
    } else {
      container.logger.warn(
        '[Music] FFmpeg not found in PATH, relying on ffmpeg-static.',
      );
    }
  } catch {
    container.logger.warn('[Music] Failed to verify FFmpeg.');
  }

  // Debugging Player Events
  player.events.on('error', (_queue, error) => {
    container.logger.error(
      `[Music] Error emitted from the queue: ${error.message}`,
    );
  });
  player.events.on('playerError', (_queue, error) => {
    container.logger.error(
      `[Music] Error emitted from the player: ${error.message}`,
    );
    console.error(error);
  });
  player.events.on('playerStart', (queue, track) => {
    container.logger.info(`[Music] Started playing: **${track.title}**`);
    // biome-ignore lint/suspicious/noExplicitAny: Metadata is untyped
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const interaction = queue.metadata as any;
    if (interaction?.channel) {
      interaction.channel.send(`▶️ **Lecture en cours :** ${track.title}`);
    }
  });
  player.events.on('audioTrackAdd', (_queue, track) => {
    container.logger.info(`[Music] Track added to queue: **${track.title}**`);
  });
  player.events.on('connection', (queue) => {
    container.logger.info(
      `[Music] Connected to voice channel in ${queue.guild.name}`,
    );
  });
  player.events.on('emptyQueue', (_queue) => {
    container.logger.info('[Music] Queue is empty.');
  });
  player.events.on('emptyChannel', (_queue) => {
    container.logger.info('[Music] Voice channel is empty, leaving...');
  });
  player.events.on('debug', (_queue, message) => {
    container.logger.info(`[Music Debug] ${message}`);
  });

  // Setup log capture for API/Dashboard
  setupLogCapture();

  await client.login(process.env.DISCORD_TOKEN);

  client.on('ready', () => {
    const commands = client.stores.get('commands');
    container.logger.info(`[Bot] Loaded ${commands.size} commands.`);
    // List first 5 commands to verify
    const cmdNames = Array.from(commands.keys()).slice(0, 10).join(', ');
    container.logger.info(`[Bot] Sample commands: ${cmdNames}`);
  });

  // Start API server for dashboard integration after login
  const apiPort = parseInt(process.env.BOT_API_PORT ?? '3001', 10);
  startApiServer(apiPort);
} catch (err) {
  // Use console.error if logger isn't ready
  if (container.logger) {
    container.logger.error('Failed to start bot:', err);
  } else {
    console.error('Failed to start bot:', err);
  }
  process.exitCode = 1;
}
