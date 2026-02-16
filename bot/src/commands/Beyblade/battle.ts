import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  type CommandInteraction,
  EmbedBuilder,
  type User,
} from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';

import { getDeckStats, runBattleSimulation } from '../../lib/battle-utils.js';
import { Colors, RPB } from '../../lib/constants.js';
import { pendingBattles } from '../../lib/state.js';

@Discord()
export class BattleCommand {
  @Slash({
    name: 'combat',
    description: 'Lance un combat Beyblade virtuel contre un autre membre !',
  })
  async battle(
    @SlashOption({
      name: 'adversaire',
      description: 'Ton adversaire',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    opponent: User,
    @SlashOption({
      name: 'rapide',
      description: 'Combat rapide sans confirmation',
      required: false,
      type: ApplicationCommandOptionType.Boolean,
    })
    quickBattle: boolean = false,
    interaction: CommandInteraction,
  ) {
    const challenger = interaction.user;

    if (opponent.id === challenger.id) {
      return interaction.reply({
        content: '❌ Tu ne peux pas te battre contre toi-même !',
        ephemeral: true,
      });
    }

    if (opponent.bot) {
      return interaction.reply({
        content: '❌ Tu ne peux pas défier un bot !',
        ephemeral: true,
      });
    }

    if (quickBattle) {
      await interaction.deferReply();

      const [statsA, statsB] = await Promise.all([
        getDeckStats(challenger.id),
        getDeckStats(opponent.id),
      ]);

      if (!statsA || !statsB) {
        const embed = new EmbedBuilder()
          .setTitle('⚠️ Decks manquants')
          .setDescription(
            `L'un des joueurs (ou les deux) n'a pas de deck actif.\nVoulez-vous lancer un **Combat Aléatoire** ?`,
          )
          .setColor(Colors.Warning);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`battle-random-${opponent.id}`)
            .setLabel('🎲 Combat Aléatoire')
            .setStyle(ButtonStyle.Primary),
        );

        return interaction.editReply({ embeds: [embed], components: [row] });
      }

      const startEmbed = new EmbedBuilder()
        .setTitle('⚔️ Combat Beyblade !')
        .setDescription(
          `**${challenger.displayName}** VS **${opponent.displayName}**\n\n` +
            '🌀 3... 2... 1... **LET IT RIP !**',
        )
        .setColor(Colors.Secondary)
        .setFooter({ text: RPB.FullName });

      await interaction.editReply({ embeds: [startEmbed] });
      await this.sleep(2000);
      return runBattleSimulation(
        interaction,
        challenger,
        opponent,
        statsA,
        statsB,
      );
    }

    pendingBattles.set(challenger.id, {
      opponentId: opponent.id,
      channelId: interaction.channelId,
      timestamp: Date.now(),
    });

    setTimeout(
      () => {
        pendingBattles.delete(challenger.id);
      },
      5 * 60 * 1000,
    );

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Défi Beyblade !')
      .setDescription(
        `**${challenger.displayName}** défie **${opponent.displayName}** en combat !\n\n` +
          `${opponent}, acceptes-tu le défi ?`,
      )
      .setColor(Colors.Secondary)
      .setThumbnail(challenger.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: '🎯 Challenger', value: challenger.tag, inline: true },
        { name: '🎮 Adversaire', value: opponent.tag, inline: true },
      )
      .setFooter({ text: `${RPB.FullName} | Le défi expire dans 5 minutes` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle-accept-${challenger.id}`)
        .setLabel('Accepter le défi')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId(`battle-decline-${challenger.id}`)
        .setLabel('Refuser')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
