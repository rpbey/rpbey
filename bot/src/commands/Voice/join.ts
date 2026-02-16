import { joinVoiceChannel } from '@discordjs/voice';
import type { CommandInteraction, GuildMember } from 'discord.js';
import { Discord, Slash } from 'discordx';

@Discord()
export class JoinCommand {
  @Slash({ name: 'rejoindre', description: 'Rejoint votre salon vocal' })
  async join(interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.member) return;

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
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator as any,
      selfDeaf: false,
    });

    return interaction.reply(`✅ Connecté à **${channel.name}**`);
  }
}
