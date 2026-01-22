import {
  InteractionHandler,
  InteractionHandlerTypes,
} from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { generateBattleCard } from '../lib/canvas-utils.js';
import { Colors, RPB } from '../lib/constants.js';
import prisma from '../lib/prisma.js';
import { pendingBattles } from '../lib/state.js';
import { pickRandom } from '../lib/utils.js';

const battleResults = [
  { result: 'burst', message: '💥 **BURST FINISH !**', points: 2, emoji: '💥' },
  { result: 'over', message: '🔄 **OVER FINISH !**', points: 1, emoji: '🔄' },
  { result: 'spin', message: '🌀 **SPIN FINISH !**', points: 1, emoji: '🌀' },
  {
    result: 'xtreme',
    message: '⚡ **X-TREME FINISH !**',
    points: 3,
    emoji: '⚡',
  },
];

// Store pending battles via shared state in lib/state.ts
export class BattleButtonHandler extends InteractionHandler {
  public constructor(context: InteractionHandler.LoaderContext) {
    super(context, {
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith('battle-')) {
      return this.none();
    }

    const [, action, challengerId] = interaction.customId.split('-');
    return this.some({ action, challengerId });
  }

  public async run(
    interaction: ButtonInteraction,
    { action, challengerId }: { action: string; challengerId: string },
  ) {
    switch (action) {
      case 'accept':
        return this.handleAccept(interaction, challengerId);
      case 'decline':
        return this.handleDecline(interaction, challengerId);
      case 'rematch':
        return this.handleRematch(interaction, challengerId);
      case 'challenge':
        return this.handleChallenge(interaction, challengerId);
      case 'stats':
        return this.handleStats(interaction);
      default:
        return interaction.reply({
          content: '❌ Action inconnue.',
          ephemeral: true,
        });
    }
  }

  private async handleAccept(
    interaction: ButtonInteraction,
    challengerId: string,
  ) {
    const battle = pendingBattles.get(challengerId);

    if (!battle) {
      return interaction.reply({
        content: "❌ Ce défi a expiré ou n'existe plus.",
        ephemeral: true,
      });
    }

    if (interaction.user.id !== battle.opponentId) {
      return interaction.reply({
        content: "❌ Ce défi n'est pas pour toi !",
        ephemeral: true,
      });
    }

    // Remove from pending
    pendingBattles.delete(challengerId);

    // Get challenger user
    const challenger = await interaction.client.users
      .fetch(challengerId)
      .catch(() => null);

    if (!challenger) {
      return interaction.reply({
        content: "❌ Le challenger n'a pas pu être trouvé.",
        ephemeral: true,
      });
    }

    // Start battle animation
    await interaction.update({
      content: null,
      embeds: [
        new EmbedBuilder()
          .setTitle('⚔️ Combat Beyblade !')
          .setDescription(
            `**${challenger.displayName}** VS **${interaction.user.displayName}**\n\n` +
              '🌀 3... 2... 1... **LET IT RIP !**',
          )
          .setColor(Colors.Secondary)
          .setFooter({ text: RPB.FullName }),
      ],
      components: [],
    });

    // Simulate battle
    await this.sleep(2500);

    // Determine winner
    const winner = Math.random() > 0.5 ? challenger : interaction.user;
    const loser = winner.id === challenger.id ? interaction.user : challenger;
    const finishType = pickRandom(battleResults);

    // Update stats in DB
    try {
      const dbWinner = await prisma.user.upsert({
        where: { discordId: winner.id },
        update: {},
        create: {
          discordId: winner.id,
          discordTag: winner.tag,
          name: winner.displayName,
          email: `${winner.id}@discord.rpbey.fr`,
        },
      });

      await prisma.profile.upsert({
        where: { userId: dbWinner.id },
        update: { wins: { increment: 1 } },
        create: { userId: dbWinner.id, wins: 1 },
      });

      const dbLoser = await prisma.user.upsert({
        where: { discordId: loser.id },
        update: {},
        create: {
          discordId: loser.id,
          discordTag: loser.tag,
          name: loser.displayName,
          email: `${loser.id}@discord.rpbey.fr`,
        },
      });

      await prisma.profile.upsert({
        where: { userId: dbLoser.id },
        update: { losses: { increment: 1 } },
        create: { userId: dbLoser.id, losses: 1 },
      });
    } catch (e) {
      this.container.logger.error('Failed to update battle stats:', e);
    }

    // Generate visual battle card
    const cardBuffer = await generateBattleCard({
      winnerName: winner.displayName,
      winnerAvatarUrl: winner.displayAvatarURL({ extension: 'png', size: 512 }),
      loserName: loser.displayName,
      loserAvatarUrl: loser.displayAvatarURL({ extension: 'png', size: 512 }),
      finishType: finishType.result,
      finishMessage: finishType.message,
      finishEmoji: finishType.emoji,
    });

    const attachment = new AttachmentBuilder(cardBuffer, {
      name: `battle-${interaction.id}.png`,
    });

    const resultEmbed = new EmbedBuilder()
      .setColor(Colors.Primary)
      .setImage(`attachment://battle-${interaction.id}.png`)
      .setFooter({ text: `${RPB.FullName} | GG !` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle-rematch-${loser.id}`)
        .setLabel('Revanche !')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄'),
      new ButtonBuilder()
        .setCustomId(`battle-stats-${winner.id}`)
        .setLabel('Voir stats')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊'),
    );

    return interaction.editReply({
      embeds: [resultEmbed],
      files: [attachment],
      components: [row],
    });
  }

  private async handleDecline(
    interaction: ButtonInteraction,
    challengerId: string,
  ) {
    const battle = pendingBattles.get(challengerId);

    if (!battle) {
      return interaction.reply({
        content: "❌ Ce défi a expiré ou n'existe plus.",
        ephemeral: true,
      });
    }

    if (interaction.user.id !== battle.opponentId) {
      return interaction.reply({
        content: "❌ Ce défi n'est pas pour toi !",
        ephemeral: true,
      });
    }

    pendingBattles.delete(challengerId);

    const embed = new EmbedBuilder()
      .setTitle('😔 Défi refusé')
      .setDescription(`**${interaction.user.displayName}** a refusé le combat.`)
      .setColor(Colors.Error)
      .setTimestamp();

    return interaction.update({ embeds: [embed], components: [] });
  }

  private async handleRematch(
    interaction: ButtonInteraction,
    challengerId: string,
  ) {
    // The person who lost can request a rematch
    const opponent = await interaction.client.users
      .fetch(challengerId)
      .catch(() => null);

    if (!opponent) {
      return interaction.reply({
        content: "❌ Impossible de trouver l'adversaire.",
        ephemeral: true,
      });
    }

    if (opponent.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ Tu ne peux pas te défier toi-même !',
        ephemeral: true,
      });
    }

    // Store pending battle
    pendingBattles.set(interaction.user.id, {
      opponentId: opponent.id,
      channelId: interaction.channelId,
      timestamp: Date.now(),
    });

    // Auto-expire after 5 minutes
    setTimeout(
      () => {
        pendingBattles.delete(interaction.user.id);
      },
      5 * 60 * 1000,
    );

    const embed = new EmbedBuilder()
      .setTitle('🔄 Demande de revanche !')
      .setDescription(
        `**${interaction.user.displayName}** veut une revanche contre **${opponent.displayName}** !\n\n` +
          `${opponent}, acceptes-tu le défi ?`,
      )
      .setColor(Colors.Secondary)
      .setFooter({ text: 'Le défi expire dans 5 minutes' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle-accept-${interaction.user.id}`)
        .setLabel('Accepter')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId(`battle-decline-${interaction.user.id}`)
        .setLabel('Refuser')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  private async handleChallenge(
    interaction: ButtonInteraction,
    opponentId: string,
  ) {
    const opponent = await interaction.client.users
      .fetch(opponentId)
      .catch(() => null);

    if (!opponent) {
      return interaction.reply({
        content: '❌ Impossible de trouver cet adversaire.',
        ephemeral: true,
      });
    }

    if (opponent.id === interaction.user.id) {
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

    // Store pending battle
    pendingBattles.set(interaction.user.id, {
      opponentId: opponent.id,
      channelId: interaction.channelId,
      timestamp: Date.now(),
    });

    // Auto-expire after 5 minutes
    setTimeout(
      () => {
        pendingBattles.delete(interaction.user.id);
      },
      5 * 60 * 1000,
    );

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Défi Beyblade !')
      .setDescription(
        `**${interaction.user.displayName}** défie **${opponent.displayName}** en combat !\n\n` +
          `${opponent}, acceptes-tu le défi ?`,
      )
      .setColor(Colors.Secondary)
      .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: '🎯 Challenger', value: interaction.user.tag, inline: true },
        { name: '🎮 Adversaire', value: opponent.tag, inline: true },
      )
      .setFooter({ text: `${RPB.FullName} | Le défi expire dans 5 minutes` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle-accept-${interaction.user.id}`)
        .setLabel('Accepter le défi')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId(`battle-decline-${interaction.user.id}`)
        .setLabel('Refuser')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  private async handleStats(interaction: ButtonInteraction) {
    const targetId = interaction.customId.split('-')[2] || interaction.user.id;

    try {
      const profile = await prisma.profile.findFirst({
        where: { user: { discordId: targetId } },
        include: { user: true },
      });

      if (!profile) {
        return interaction.reply({
          content:
            "❌ Ce blader n'a pas encore de profil enregistré. Utilise `/inscription rejoindre` pour créer ton profil !",
          ephemeral: true,
        });
      }

      const totalBattles = profile.wins + profile.losses;
      const winRate =
        totalBattles > 0
          ? ((profile.wins / totalBattles) * 100).toFixed(1)
          : '0';

      const embed = new EmbedBuilder()
        .setTitle(
          `📊 Stats de Blader : ${profile.bladerName || profile.user.name}`,
        )
        .setColor(Colors.Primary)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '🏆 Victoires', value: `${profile.wins}`, inline: true },
          { name: '💔 Défaites', value: `${profile.losses}`, inline: true },
          { name: '📈 Winrate', value: `${winRate}%`, inline: true },
          {
            name: '🎖️ Tournois gagnés',
            value: `${profile.tournamentWins}`,
            inline: true,
          },
          {
            name: '✨ Expérience',
            value: profile.experience,
            inline: true,
          },
        )
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      this.container.logger.error('Failed to fetch blader stats:', error);
      return interaction.reply({
        content: '❌ Erreur lors de la récupération des statistiques.',
        ephemeral: true,
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
