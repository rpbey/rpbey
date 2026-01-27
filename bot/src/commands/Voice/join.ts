import { joinVoiceChannel } from '@discordjs/voice';
import { Command } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';

export class JoinCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'rejoindre',
      description: 'Rejoint votre salon vocal',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    if (!interaction.guildId || !interaction.member) return;

    const member = interaction.member as GuildMember;
    const channel = member.voice.channel;

    if (!channel) {
      return interaction.reply({
        content: 'Vous devez être dans un salon vocal !',
        ephemeral: true,
      });
    }

    joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild?.voiceAdapterCreator,
      selfDeaf: false,
    });

    return interaction.reply(`✅ Connecté à **${channel.name}**`);
  }
}
