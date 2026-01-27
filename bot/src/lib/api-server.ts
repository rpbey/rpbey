import { spawn } from 'node:child_process';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { container } from '@sapphire/framework';
import type {
  Collection,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
} from 'discord.js';
import { type RawData, WebSocket, WebSocketServer } from 'ws';
import { Colors, RPB } from './constants.js';

const logs: { timestamp: string; level: string; message: string }[] = [];
const MAX_LOGS = 1000;
let wss: WebSocketServer | null = null;
let isPlaying = false; // Global flag to prevent transcription during playback

// Member fetch throttling
let lastMemberFetch = 0;
let memberFetchPromise: Promise<
  Collection<string, GuildMember> | undefined
> | null = null;
const MEMBER_FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

async function ensureMembers(guild: Guild) {
  if (memberFetchPromise) return memberFetchPromise;
  if (Date.now() - lastMemberFetch < MEMBER_FETCH_COOLDOWN) return;

  memberFetchPromise = guild.members
    .fetch()
    .then((members) => {
      lastMemberFetch = Date.now();
      return members;
    })
    .catch((err) => {
      container.logger.error('Failed to fetch members:', err);
      return undefined;
    })
    .finally(() => {
      memberFetchPromise = null;
    });

  return memberFetchPromise;
}

export function addLog(level: string, message: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  logs.push(logEntry);
  if (logs.length > MAX_LOGS) logs.shift();

  // Broadcast to WS clients
  if (wss) {
    const payload = JSON.stringify({ type: 'log', data: logEntry });
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

export function getLogs(tail = 100) {
  return logs.slice(-tail);
}

export async function getBotStatus() {
  const client = container.client;
  const guild = await client.guilds
    .fetch({
      guild: process.env.GUILD_ID ?? '',
      withCounts: true,
    })
    .catch(() => null);

  return {
    status: client.isReady() ? 'running' : 'starting',
    uptime: client.uptime ?? 0,
    uptimeFormatted: formatUptime(client.uptime ?? 0),
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    memberCount: guild?.approximateMemberCount ?? guild?.memberCount ?? 0,
    onlineCount: guild?.approximatePresenceCount ?? 0,
    ping: client.ws.ping,
    memoryUsage: formatMemory(process.memoryUsage().heapUsed),
    nodeVersion: process.version,
  };
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatMemory(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, message: string, status = 400) {
  sendJSON(res, { error: message }, status);
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.BOT_API_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    return sendError(res, 'Unauthorized', 401);
  }

  const url = new URL(
    req.url ?? '/',
    `http://${req.headers.host ?? 'localhost'}`,
  );

  try {
    switch (url.pathname) {
      case '/health':
      case '/api/health':
        return sendJSON(res, { ok: true });

      case '/api/status':
        return sendJSON(res, await getBotStatus());

      case '/api/logs': {
        const tail = parseInt(url.searchParams.get('tail') ?? '100', 10);
        return sendJSON(res, { logs: getLogs(tail) });
      }

      case '/api/restart':
      case '/api/sync-commands': {
        if (req.method !== 'POST')
          return sendError(res, 'Method not allowed', 405);
        sendJSON(res, { ok: true, message: 'Bot syncing/restarting...' });
        container.logger.info(
          'Sync/Restart requested via API. Exiting in 1s...',
        );
        setTimeout(() => process.exit(0), 1000);
        return;
      }

      case '/api/roles': {
        const guildId = process.env.GUILD_ID;
        if (!guildId) return sendError(res, 'GUILD_ID not configured');
        const guild = container.client.guilds.cache.get(guildId);
        if (!guild) return sendError(res, 'Guild not found in cache', 404);
        const roles = guild.roles.cache
          .filter((role) => role.name !== '@everyone')
          .map((role) => ({
            id: role.id,
            name: role.name,
            color: role.hexColor,
            position: role.position,
            managed: role.managed,
          }))
          .sort((a, b) => b.position - a.position);
        return sendJSON(res, { roles });
      }

      case '/api/member': {
        const userId = url.searchParams.get('userId');
        const guildId = process.env.GUILD_ID;
        if (!userId || !guildId)
          return sendError(res, 'Missing userId or GUILD_ID');
        try {
          const guild = container.client.guilds.cache.get(guildId);
          if (!guild) return sendError(res, 'Guild not found', 404);
          const member = await guild.members.fetch(userId).catch(() => null);
          if (!member) return sendError(res, 'Member not found', 404);
          return sendJSON(res, {
            member: {
              id: member.id,
              username: member.user.username,
              displayName: member.displayName,
              avatar: member.user.displayAvatarURL({
                extension: 'png',
                size: 256,
              }),
              nickname: member.nickname,
              joinedAt: member.joinedAt,
              premiumSince: member.premiumSince,
              roles: member.roles.cache.map((r) => ({
                name: r.name,
                color: r.hexColor,
                id: r.id,
              })),
              status: member.presence?.status,
              activities: member.presence?.activities,
              serverAvatar: member.avatarURL({ extension: 'png', size: 256 }),
              globalName: member.user.globalName,
              createdAt: member.user.createdAt,
            },
          });
        } catch (e) {
          container.logger.error(`Error in member fetch for ${userId}:`, e);
          return sendError(res, `Internal error: ${String(e)}`, 500);
        }
      }

      case '/api/members-by-role': {
        const roleId = url.searchParams.get('roleId');
        const guildId = process.env.GUILD_ID;
        if (!roleId || !guildId)
          return sendError(res, 'Missing roleId or GUILD_ID');
        try {
          const guild = container.client.guilds.cache.get(guildId);
          if (!guild) return sendError(res, 'Guild not found', 404);
          await ensureMembers(guild);
          const role = guild.roles.cache.get(roleId);
          if (!role) return sendError(res, 'Role not found', 404);
          const members = role.members.map((m) => ({
            id: m.id,
            username: m.user.username,
            displayName: m.displayName,
            avatar: m.user.displayAvatarURL({ extension: 'png', size: 256 }),
            nickname: m.nickname,
            joinedAt: m.joinedAt,
            premiumSince: m.premiumSince,
            roles: m.roles.cache.map((r) => ({
              name: r.name,
              color: r.hexColor,
              id: r.id,
            })),
            status: m.presence?.status,
            activities: m.presence?.activities,
            serverAvatar: m.avatarURL({ extension: 'png', size: 256 }),
            globalName: m.user.globalName,
            createdAt: m.user.createdAt,
          }));
          return sendJSON(res, { members });
        } catch (e) {
          container.logger.error(
            `Error in members-by-role for role ${roleId}:`,
            e,
          );
          return sendError(res, `Internal error: ${String(e)}`, 500);
        }
      }

      case '/api/config': {
        const safeEnvKeys = ['NODE_ENV', 'GUILD_ID', 'OWNER_IDS'];
        const env: Record<string, string> = {};
        for (const key of safeEnvKeys) {
          if (process.env[key]) env[key] = process.env[key];
        }
        const colorsFormatted: Record<string, string> = {};
        for (const [key, value] of Object.entries(Colors)) {
          colorsFormatted[key] = `0x${value.toString(16).padStart(6, '0')}`;
        }
        return sendJSON(res, {
          env,
          constants: {
            RPB: {
              Name: RPB.Name,
              FullName: RPB.FullName,
              Discord: RPB.Discord,
            },
            Colors: colorsFormatted,
            Channels: RPB.Channels,
            Roles: RPB.Roles,
            Partners: RPB.Partners,
          },
        });
      }

      case '/api/commands': {
        const commands = container.stores.get('commands');
        const list = commands.map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          category: cmd.category ?? 'Uncategorized',
          enabled: cmd.enabled,
        }));
        return sendJSON(res, { commands: list });
      }

      case '/api/webhook/twitch': {
        if (req.method !== 'POST')
          return sendError(res, 'Method not allowed', 405);
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            if (data.event?.type === 'live') {
              const channel = container.client.channels.cache.get(
                RPB.Channels.Social,
              );
              if (channel?.isTextBased()) {
                const mention = RPB.Roles.Events
                  ? `<@&${RPB.Roles.Events}>`
                  : '@everyone';
                await (channel as GuildTextBasedChannel).send({
                  content: `${mention} 🔴 **${data.event.broadcaster_user_name} est en LIVE !**\nhttps://www.twitch.tv/${data.event.broadcaster_user_login}`,
                });
              }
            }
            sendJSON(res, { ok: true });
          } catch {
            sendError(res, 'Invalid JSON', 400);
          }
        });
        return;
      }

      case '/api/webhook/youtube': {
        if (req.method !== 'POST')
          return sendError(res, 'Method not allowed', 405);
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            if (data.event?.type === 'video.upload') {
              // Channel ID provided by user: 1333203623471087708
              // or fallback to Social channel if configured
              const targetChannelId = '1333203623471087708';

              const channel =
                container.client.channels.cache.get(targetChannelId);

              if (channel?.isTextBased()) {
                const { title, authorName, url } = data.event;
                // You might want to mention a role here too if desired
                const content = `🎥 **Nouvelle vidéo de ${authorName} !**\n**${title}**\n${url}`;

                await (channel as GuildTextBasedChannel).send({ content });
              } else {
                container.logger.warn(
                  `[YouTube] Channel ${targetChannelId} not found or not text-based.`,
                );
              }
            }
            sendJSON(res, { ok: true });
          } catch (e) {
            container.logger.error('[YouTube] Error processing webhook:', e);
            sendError(res, 'Internal Error', 500);
          }
        });
        return;
      }

      case '/api/webhook/twitch/verify': {
        if (req.method !== 'GET')
          return sendError(res, 'Method not allowed', 405);
        const challenge = url.searchParams.get('hub.challenge');
        container.logger.info(
          `[TwitchVerify] Received challenge: ${challenge}`,
        );
        if (challenge) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(challenge);
          return;
        }
        return sendError(res, 'No challenge provided', 400);
      }

      case '/api/agent/dispatch': {
        if (req.method !== 'POST')
          return sendError(res, 'Method not allowed', 405);
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const { action, params } = JSON.parse(body);
            const client = container.client;
            const guild = client.guilds.cache.get(process.env.GUILD_ID ?? '');
            if (!guild) return sendError(res, 'Guild not found', 500);

            switch (action) {
              case 'send_message': {
                if (!params?.channelId || !params?.content)
                  return sendError(res, 'Missing params');
                const channel = await client.channels.fetch(params.channelId);
                if (!channel || !channel.isTextBased())
                  return sendError(res, 'Invalid channel');
                const msg = await (channel as GuildTextBasedChannel).send(
                  params.content,
                );
                return sendJSON(res, { success: true, id: msg.id });
              }
              case 'send_dm': {
                if (!params?.userId || !params?.content)
                  return sendError(res, 'Missing params');
                const user = await client.users.fetch(params.userId);
                const msg = await user.send(params.content);
                return sendJSON(res, { success: true, id: msg.id });
              }
              case 'add_role': {
                if (!params?.userId || !params?.roleId)
                  return sendError(res, 'Missing params');
                const member = await guild.members.fetch(params.userId);
                await member.roles.add(params.roleId);
                return sendJSON(res, { success: true });
              }
              case 'remove_role': {
                if (!params?.userId || !params?.roleId)
                  return sendError(res, 'Missing params');
                const member = await guild.members.fetch(params.userId);
                await member.roles.remove(params.roleId);
                return sendJSON(res, { success: true });
              }

              case 'join_voice': {
                if (!params?.channelId)
                  return sendError(res, 'Missing channelId');
                const {
                  joinVoiceChannel,
                  VoiceConnectionStatus,
                  entersState,
                  EndBehaviorType,
                  createAudioPlayer,
                  createAudioResource,
                  AudioPlayerStatus,
                } = await import('@discordjs/voice');
                const prism = await import('prism-media');
                const { detectKeyword } = await import('./detector.js');

                const channel = await client.channels.fetch(params.channelId);
                if (!channel || !channel.isVoiceBased())
                  return sendError(res, 'Invalid voice channel');

                const connection = joinVoiceChannel({
                  channelId: channel.id,
                  guildId: channel.guild.id,
                  adapterCreator: channel.guild.voiceAdapterCreator,
                  selfDeaf: false,
                  selfMute: false,
                });

                connection.on(VoiceConnectionStatus.Ready, () => {
                  container.logger.info(
                    `[Voice] Connected to ${channel.name}. Listening for 'RPBEY'...`,
                  );

                  const receiver = connection.receiver;

                  receiver.speaking.on('start', (userId) => {
                    if (isPlaying) return;

                    // container.logger.info(`[Voice] 🎙️ Analyzing user ${userId}...`);

                    const opusStream = receiver.subscribe(userId, {
                      end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: 500,
                      },
                    });

                    // Decode Opus to PCM
                    const opusDecoder = new prism.default.opus.Decoder({
                      rate: 48000,
                      channels: 2,
                      frameSize: 960,
                    });
                    const pcmStream = opusStream.pipe(opusDecoder);

                    const chunks: Buffer[] = [];
                    pcmStream.on('data', (chunk: Buffer) => {
                      chunks.push(chunk);
                    });

                    pcmStream.on('end', async () => {
                      const pcmBuffer = Buffer.concat(chunks);
                      // Require at least 0.5 sec of audio
                      if (pcmBuffer.length < 48000) return;

                      try {
                        const isKeyword = await detectKeyword(pcmBuffer);
                        if (isKeyword) {
                          container.logger.info(
                            `[Voice] 🚨 KEYWORD 'RPBEY' DETECTED from ${userId}!`,
                          );
                          addLog(
                            'INFO',
                            `[Voice] User ${userId} said the keyword!`,
                          );

                          if (!isPlaying) {
                            isPlaying = true;

                            // 1. Acknowledge
                            const { synthesizeSpeech, transcribePcm } =
                              await import('./transcriber.js');
                            const ackPath = await synthesizeSpeech('Oui ?');

                            const player = createAudioPlayer();
                            const resource = createAudioResource(ackPath);
                            connection.subscribe(player);
                            player.play(resource);

                            await new Promise<void>((resolve) => {
                              player.on(AudioPlayerStatus.Idle, () => {
                                import('node:fs').then((fs) =>
                                  fs.unlinkSync(ackPath),
                                );
                                resolve();
                              });
                            });

                            // 2. Listen for Command (Next 5 seconds of speech)
                            container.logger.info(
                              '[Voice] 👂 Listening for command...',
                            );
                            isPlaying = false; // Allow recording again

                            // We need to capture the *next* utterance.
                            // For simplicity, we'll start a new subscription or just use the existing one?
                            // The existing subscription is per-speaking event.
                            // If the user pauses, 'end' triggers. We need to catch the *next* 'speaking' event from the same user.

                            const commandReceiver = connection.receiver;

                            const commandHandler = (speakingUserId: string) => {
                              if (speakingUserId !== userId) return; // Only listen to the same user? Or anyone?
                              commandReceiver.speaking.off(
                                'start',
                                commandHandler,
                              ); // One-shot

                              container.logger.info(
                                `[Voice] 🎙️ Recording command from ${speakingUserId}...`,
                              );

                              const cmdOpusStream = commandReceiver.subscribe(
                                speakingUserId,
                                {
                                  end: {
                                    behavior: EndBehaviorType.AfterSilence,
                                    duration: 1000,
                                  },
                                },
                              );

                              const cmdOpusDecoder =
                                new prism.default.opus.Decoder({
                                  rate: 48000,
                                  channels: 2,
                                  frameSize: 960,
                                });
                              const cmdPcmStream =
                                cmdOpusStream.pipe(cmdOpusDecoder);
                              const cmdChunks: Buffer[] = [];

                              cmdPcmStream.on('data', (c: Buffer) =>
                                cmdChunks.push(c),
                              );

                              cmdPcmStream.on('end', async () => {
                                const cmdBuffer = Buffer.concat(cmdChunks);
                                if (cmdBuffer.length < 10000) return; // Too short

                                try {
                                  // 3. Transcribe
                                  const text = await transcribePcm(cmdBuffer);
                                  container.logger.info(
                                    `[Voice] 📝 Transcribed: "${text}"`,
                                  );

                                  // 4. Query AI
                                  const { aiService } = await import('./ai.js');
                                  const context = aiService.getKnowledgeBase();
                                  const answers =
                                    await aiService.answerQuestion(
                                      text,
                                      context,
                                    );

                                  let responseText = "Je n'ai pas compris.";
                                  if (
                                    answers &&
                                    answers.length > 0 &&
                                    answers[0].score > 0.1
                                  ) {
                                    responseText = answers[0].text;
                                  } else if (
                                    text.toLowerCase().includes('bonjour')
                                  ) {
                                    responseText = 'Bonjour ! Comment ça va ?';
                                  }

                                  container.logger.info(
                                    `[Voice] 🤖 AI Answer: "${responseText}"`,
                                  );

                                  // 5. Speak Answer
                                  if (!isPlaying) {
                                    isPlaying = true;
                                    const responseAudio =
                                      await synthesizeSpeech(responseText);
                                    const answerPlayer = createAudioPlayer();
                                    const answerResource =
                                      createAudioResource(responseAudio);
                                    connection.subscribe(answerPlayer);
                                    answerPlayer.play(answerResource);

                                    answerPlayer.on(
                                      AudioPlayerStatus.Idle,
                                      () => {
                                        isPlaying = false;
                                        import('node:fs').then((fs) =>
                                          fs.unlinkSync(responseAudio),
                                        );
                                      },
                                    );
                                  }
                                } catch (e) {
                                  container.logger.error(
                                    '[Voice] Command processing failed',
                                    e,
                                  );
                                }
                              });
                            };

                            // Wait for them to speak again
                            commandReceiver.speaking.on(
                              'start',
                              commandHandler,
                            );

                            // Timeout if they don't speak within 10s
                            setTimeout(() => {
                              commandReceiver.speaking.off(
                                'start',
                                commandHandler,
                              );
                            }, 10000);
                          }
                        }
                      } catch (err) {
                        container.logger.error(
                          '[Voice] Detection failed:',
                          err,
                        );
                      }
                    });
                  });
                });

                try {
                  await entersState(
                    connection,
                    VoiceConnectionStatus.Ready,
                    5000,
                  );
                } catch (e) {
                  container.logger.error('[Voice] Failed to join within 5s', e);
                }

                return sendJSON(res, {
                  success: true,
                  message: `Joined ${channel.name}`,
                });
              }

              case 'leave_voice': {
                if (!params?.guildId) return sendError(res, 'Missing guildId');
                const { getVoiceConnection } = await import('@discordjs/voice');
                const connection = getVoiceConnection(params.guildId);
                if (connection) {
                  connection.destroy();
                  return sendJSON(res, {
                    success: true,
                    message: 'Left voice channel',
                  });
                }
                return sendError(
                  res,
                  'Not connected to any voice channel in this guild',
                  404,
                );
              }

              case 'play_audio': {
                if (!params?.guildId || !params?.filePath)
                  return sendError(res, 'Missing guildId or filePath');

                const {
                  getVoiceConnection,
                  createAudioPlayer,
                  createAudioResource,
                  AudioPlayerStatus,
                } = await import('@discordjs/voice');

                const connection = getVoiceConnection(params.guildId);

                if (!connection)
                  return sendError(
                    res,
                    'Bot is not connected to a voice channel in this guild',
                    404,
                  );

                const player = createAudioPlayer();

                // Let discord.js/ffmpeg handle the format (wav, mp3, etc.) automatically
                // This is safer than manual raw PCM handling which caused static noise
                const resource = createAudioResource(params.filePath);

                connection.subscribe(player);
                player.play(resource);

                player.on(AudioPlayerStatus.Playing, () => {
                  isPlaying = true;
                  container.logger.info(
                    `[Voice] 🎵 Started playing: ${params.filePath}`,
                  );
                });

                player.on(AudioPlayerStatus.Idle, () => {
                  isPlaying = false;
                  container.logger.info('[Voice] ⏹️ Finished playing');
                  player.stop();
                });

                player.on('error', (error) => {
                  isPlaying = false;
                  container.logger.error('[Voice] Audio player error:', error);
                });

                return sendJSON(res, {
                  success: true,
                  message: 'Playback started',
                });
              }

              case 'speak_text': {
                if (!params?.guildId || !params?.text)
                  return sendError(res, 'Missing guildId or text');

                const { synthesizeSpeech } = await import('./transcriber.js');

                try {
                  container.logger.info(
                    `[Voice] 🗣️ Synthesizing: "${params.text}"...`,
                  );
                  const filePath = await synthesizeSpeech(params.text);

                  // Use standard playback logic (auto-detect format via ffmpeg)
                  const {
                    getVoiceConnection,
                    createAudioPlayer,
                    createAudioResource,
                    AudioPlayerStatus,
                  } = await import('@discordjs/voice');
                  const connection = getVoiceConnection(params.guildId);

                  if (!connection)
                    return sendError(
                      res,
                      'Bot is not connected to a voice channel in this guild',
                      404,
                    );

                  const player = createAudioPlayer();
                  const resource = createAudioResource(filePath);

                  connection.subscribe(player);
                  player.play(resource);

                  player.on(AudioPlayerStatus.Playing, () => {
                    isPlaying = true;
                    container.logger.info(`[Voice] 🎵 Speaking TTS...`);
                  });

                  player.on(AudioPlayerStatus.Idle, () => {
                    isPlaying = false;
                    container.logger.info('[Voice] ⏹️ Finished speaking');
                    player.stop();
                    // Clean up file
                    import('node:fs').then((fs) => fs.unlinkSync(filePath));
                  });

                  return sendJSON(res, {
                    success: true,
                    message: 'TTS started',
                  });
                } catch (e) {
                  container.logger.error('[Voice] TTS failed:', e);
                  return sendError(res, 'TTS generation failed', 500);
                }
              }

              case 'record_sample': {
                // params: { guildId, duration: 2000, label: 'rpbey' }
                if (!params?.guildId || !params?.label)
                  return sendError(res, 'Missing guildId or label');

                const { getVoiceConnection, EndBehaviorType } = await import(
                  '@discordjs/voice'
                );
                const prism = await import('prism-media');
                const { pipeline } = await import('node:stream');
                const { createWriteStream } = await import('node:fs');
                const path = await import('node:path');

                const connection = getVoiceConnection(params.guildId);
                if (!connection)
                  return sendError(res, 'Bot not connected', 404);

                const receiver = connection.receiver;
                // Get the first speaking user or wait?
                // For simplicity, we'll listen to the next speaking event

                container.logger.info(
                  `[Voice] 🔴 Waiting for speech to record as '${params.label}'...`,
                );

                const speakingHandler = (userId: string) => {
                  // Remove listener to record only once per request
                  receiver.speaking.off('start', speakingHandler);

                  container.logger.info(
                    `[Voice] 🎙️ Recording ${params.label} from ${userId}...`,
                  );

                  const opusStream = receiver.subscribe(userId, {
                    end: {
                      behavior: EndBehaviorType.AfterSilence,
                      duration: 500, // Short silence to cut
                    },
                  });

                  const filename = `${params.label}-${Date.now()}.pcm`;
                  const filepath = path.join(
                    process.cwd(),
                    'temp',
                    'dataset',
                    filename,
                  );

                  // Ensure dir exists
                  const datasetDir = path.join(
                    process.cwd(),
                    'temp',
                    'dataset',
                  );
                  import('node:fs').then((fs) => {
                    if (!fs.existsSync(datasetDir))
                      fs.mkdirSync(datasetDir, { recursive: true });
                    const out = createWriteStream(filepath);
                    const opusDecoder = new prism.default.opus.Decoder({
                      rate: 48000,
                      channels: 2,
                      frameSize: 960,
                    });

                    pipeline(opusStream, opusDecoder, out, (err) => {
                      if (err)
                        container.logger.error(
                          `[Voice] Recording failed:`,
                          err,
                        );
                      else
                        container.logger.info(
                          `[Voice] ✅ Saved sample: ${filename}`,
                        );
                    });
                  });
                };

                receiver.speaking.on('start', speakingHandler);

                return sendJSON(res, {
                  success: true,
                  message: `Ready to record '${params.label}'. Please speak now.`,
                });
              }

              case 'run_gemini': {
                if (!params?.args) return sendError(res, 'Missing args');
                const args = params.args;
                container.logger.info(
                  `[AgentDispatch] Launching Gemini with args: ${args.join(' ')}`,
                );
                spawn('gemini', args, {
                  shell: true,
                  env: { ...process.env },
                });
                // We don't wait for completion here for simplicity in HTTP response,
                // but we could stream logs if using WS.
                return sendJSON(res, {
                  success: true,
                  message: 'Gemini started',
                });
              }

              default:
                return sendError(res, `Unknown action: ${action}`, 400);
            }
          } catch (e) {
            container.logger.error('[AgentDispatch] Error:', e);
            sendError(res, String(e), 500);
          }
        });
        return;
      }

      default:
        return sendError(res, 'Not found', 404);
    }
  } catch (error) {
    container.logger.error('API Server Error:', error);
    return sendError(res, `Internal server error: ${String(error)}`, 500);
  }
}

export function startApiServer(port = 3001) {
  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });

  // Initialize WebSocket Server
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    container.logger.info('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'info', message: 'Connected to RPB Bot' }));

    // Send recent logs
    ws.send(JSON.stringify({ type: 'logs_history', data: getLogs(20) }));

    ws.on('message', async (message: RawData) => {
      try {
        const raw = message.toString();
        const payload = JSON.parse(raw);
        container.logger.info(`[WS] Received: ${payload.type}`);

        switch (payload.type) {
          case 'speak': {
            // { type: 'speak', channelId: '...', content: '...' }
            const { channelId, content } = payload;
            if (channelId && content) {
              const channel = container.client.channels.cache.get(channelId);
              if (channel?.isTextBased()) {
                await (channel as GuildTextBasedChannel).send(content);
                ws.send(
                  JSON.stringify({
                    type: 'response',
                    success: true,
                    action: 'speak',
                  }),
                );
              } else {
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Invalid channel',
                  }),
                );
              }
            }
            break;
          }

          case 'launch_gemini': {
            // { type: 'launch_gemini', args: ['-p', '...'] }
            const args = payload.args || [];
            container.logger.info(
              `[WS] Launching Gemini with args: ${args.join(' ')}`,
            );

            const child = spawn('gemini', args, {
              shell: true,
              env: { ...process.env },
            });

            child.stdout.on('data', (data) => {
              ws.send(
                JSON.stringify({
                  type: 'gemini_stdout',
                  data: data.toString(),
                }),
              );
            });

            child.stderr.on('data', (data) => {
              ws.send(
                JSON.stringify({
                  type: 'gemini_stderr',
                  data: data.toString(),
                }),
              );
            });

            child.on('close', (code) => {
              ws.send(
                JSON.stringify({
                  type: 'gemini_exit',
                  code,
                }),
              );
            });
            break;
          }

          case 'eval': {
            // Dangerous, but useful for 'modifying code' or hot-patching?
            // User asked to 'modify code of the bot in case of error'.
            // That usually implies editing files. I (Gemini) can do that via filesystem tools.
            // This 'eval' might be for runtime inspection.
            // I'll leave it out for security unless explicitly requested.
            break;
          }

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown type' }));
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: String(e) }));
      }
    });
  });

  server.listen(port, '0.0.0.0', () => {
    container.logger.info(`Bot API server listening on port ${port}`);
  });

  return server;
}
