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
export class BanCommand {
  @Slash({
    name: 'bannir',
    description: 'Bannir un membre du serveur',
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
  })
  async ban(
    @SlashOption({
      name: 'membre',
      description: 'Le membre à bannir',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target:
      | GuildMember
      | { id: string; tag: string; displayAvatarURL: () => string },
    @SlashOption({
      name: 'raison',
      description: 'Raison du bannissement',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'Aucune raison fournie',
    @SlashOption({
      name: 'supprimer_jours',
      description: 'Jours de messages à supprimer (0-7)',
      required: false,
      type: ApplicationCommandOptionType.Integer,
      minValue: 0,
      maxValue: 7,
    })
    deleteDays: number = 0,
    interaction: CommandInteraction,
  ) {
    const member = interaction.guild?.members.cache.get(target.id);

    if (member && !member.bannable) {
      return interaction.reply({
        content: '❌ Je ne peux pas bannir ce membre.',
        ephemeral: true,
      });
    }

    try {
      await interaction.guild?.bans.create(target.id, {
        reason: `${reason} | Banni par ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      const userTag = 'tag' in target ? target.tag : target.user.tag;
      const avatarURL =
        'displayAvatarURL' in target
          ? target.displayAvatarURL()
          : (target as GuildMember).displayAvatarURL();

      const embed = new EmbedBuilder()
        .setTitle('🔨 Membre banni')
        .setColor(0xff0000)
        .addFields(
          {
            name: 'Membre',
            value: `${userTag} (${target.id})`,
            inline: true,
          },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Raison', value: reason },
          {
            name: 'Messages supprimés',
            value: `${deleteDays} jour(s)`,
            inline: true,
          },
        )
        .setThumbnail(avatarURL)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Ban command error:', error);
      return interaction.reply({
        content: '❌ Échec du bannissement du membre.',
        ephemeral: true,
      });
    }
  }
}
