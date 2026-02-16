import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
  type GuildMember,
  PermissionFlagsBits,
} from 'discord.js';
import { Discord, Guard, Slash, SlashOption } from 'discordx';

import { ModeratorOnly } from '../../guards/ModeratorOnly.js';
import { logger } from '../../lib/logger.js';

@Discord()
@Guard(ModeratorOnly)
export class KickCommand {
  @Slash({
    name: 'expulser',
    description: 'Expulser un membre du serveur',
    defaultMemberPermissions: PermissionFlagsBits.KickMembers,
  })
  async kick(
    @SlashOption({
      name: 'membre',
      description: 'Le membre à expulser',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target:
      | GuildMember
      | { id: string; tag: string; displayAvatarURL: () => string },
    @SlashOption({
      name: 'raison',
      description: "Raison de l'expulsion",
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'Aucune raison fournie',
    interaction: CommandInteraction,
  ) {
    const member = interaction.guild?.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({
        content: '❌ Membre introuvable.',
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: '❌ Je ne peux pas expulser ce membre.',
        ephemeral: true,
      });
    }

    try {
      await member.kick(`${reason} | Expulsé par ${interaction.user.tag}`);

      const userTag = 'tag' in target ? target.tag : target.user.tag;
      const avatarURL =
        'displayAvatarURL' in target
          ? target.displayAvatarURL()
          : (target as GuildMember).displayAvatarURL();

      const embed = new EmbedBuilder()
        .setTitle('👢 Membre expulsé')
        .setColor(0xffa500)
        .addFields(
          {
            name: 'Membre',
            value: `${userTag} (${target.id})`,
            inline: true,
          },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Raison', value: reason },
        )
        .setThumbnail(avatarURL)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Kick command error:', error);
      return interaction.reply({
        content: "❌ Échec de l'expulsion du membre.",
        ephemeral: true,
      });
    }
  }
}
