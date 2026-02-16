import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  type TextChannel,
  type User,
} from 'discord.js';
import { Discord, Guard, Slash, SlashOption } from 'discordx';

import { ModeratorOnly } from '../../guards/ModeratorOnly.js';
import { logger } from '../../lib/logger.js';

@Discord()
@Guard(ModeratorOnly)
export class ClearCommand {
  @Slash({
    name: 'effacer',
    description: 'Supprimer plusieurs messages à la fois',
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
  })
  async clear(
    @SlashOption({
      name: 'nombre',
      description: 'Nombre de messages à supprimer (1-100)',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      maxValue: 100,
    })
    amount: number,
    @SlashOption({
      name: 'utilisateur',
      description: 'Supprimer uniquement les messages de cet utilisateur',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetOption: User | GuildMember | undefined,
    interaction: CommandInteraction,
  ) {
    let targetUser: User | undefined;
    if (targetOption) {
      targetUser =
        targetOption instanceof GuildMember ? targetOption.user : targetOption;
    }

    const channel = interaction.channel as TextChannel;

    if (!channel || !('bulkDelete' in channel)) {
      return interaction.reply({
        content: '❌ Impossible de supprimer des messages dans ce salon.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await channel.messages.fetch({ limit: amount });

      if (targetUser) {
        messages = messages.filter((m) => m.author.id === targetUser.id);
      }

      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter((m) => m.createdTimestamp > twoWeeksAgo);

      const deleted = await channel.bulkDelete(messages, true);

      const embed = new EmbedBuilder()
        .setTitle('🧹 Messages supprimés')
        .setColor(0x00ff00)
        .addFields(
          {
            name: 'Supprimés',
            value: `${deleted.size} message(s)`,
            inline: true,
          },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
        )
        .setTimestamp();

      if (targetUser) {
        embed.addFields({
          name: "De l'utilisateur",
          value: targetUser.tag,
          inline: true,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Clear command error:', error);
      return interaction.editReply({
        content: '❌ Échec de la suppression des messages.',
      });
    }
  }
}
