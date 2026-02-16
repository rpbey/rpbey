import { Client } from 'discordx';

export const bot = new Client({
  botId: 'rpb-bot',
  intents: [
    'Guilds',
    'GuildMembers',
    'GuildMessages',
    'MessageContent',
    'GuildModeration',
    'GuildPresences',
    'GuildVoiceStates',
  ],
  // We will configure more options in index.ts or here
  silent: false,
  simpleCommand: {
    prefix: '!',
  },
});
