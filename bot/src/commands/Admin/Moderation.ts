import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  type TextChannel,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';

import { Colors, RPB } from '../../lib/constants.js';

@Discord()
@SlashGroup({
  name: 'moderation',
  description: 'Commandes de modération du serveur',
})
@SlashGroup('moderation')
export class ModerationCommand {
  @Slash({
    name: 'nettoyer',
    description: 'Supprime un nombre défini de messages',
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
  })
  async clear(
    @SlashOption({
      name: 'quantite',
      description: 'Nombre de messages à effacer (entre 1 et 100)',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    amount: number,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    if (amount < 1 || amount > 100)
      return interaction.editReply(
        '❌ Vous devez choisir un nombre entre 1 et 100.',
      );

    const channel = interaction.channel as TextChannel;
    if (!channel)
      return interaction.editReply(
        "❌ Impossible d'effectuer cette action ici.",
      );

    try {
      await channel.bulkDelete(amount, true);
      return interaction.editReply(
        `✅ Suppression de ${amount} messages effectuée.`,
      );
    } catch (_error) {
      return interaction.editReply(
        '❌ Erreur : Certains messages sont peut-être trop anciens pour être supprimés en masse.',
      );
    }
  }

  @Slash({
    name: 'suggestion',
    description: "Soumettre une idée pour l'amélioration du serveur",
  })
  async suggestion(
    @SlashOption({
      name: 'idee',
      description: 'Votre proposition détaillée',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    content: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.guild?.channels.cache.get(
      RPB.Channels.Suggestions,
    ) as TextChannel;
    if (!channel)
      return interaction.editReply(
        '❌ Le salon des suggestions est introuvable.',
      );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle('💡 Nouvelle Suggestion')
      .setDescription(content)
      .setColor(Colors.Secondary)
      .setFooter({ text: 'Utilisez les réactions pour voter !' })
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await Promise.all([msg.react('✅'), msg.react('❌')]);

    return interaction.editReply('✅ Merci ! Votre suggestion a été publiée.');
  }
}
