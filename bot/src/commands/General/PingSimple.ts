import { Discord, SimpleCommand, type SimpleCommandMessage } from 'discordx';

@Discord()
export class PingSimpleCommand {
  @SimpleCommand({ name: 'ping' })
  ping(command: SimpleCommandMessage) {
    command.message.reply('Pong! 🏓');
  }
}
