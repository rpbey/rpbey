import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { generateBattleCard } from '../../lib/canvas-utils.js';
import { Colors, RPB } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';
import { pendingBattles } from '../../lib/state.js';
import { pickRandom } from '../../lib/utils.js';

// Helper to parse stats
const p = (val: string | number | null | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
};

const battleResults = [
  { result: 'burst', message: '💥 **BURST FINISH !**', points: 2, emoji: '💥', type: 'ATTACK' },
  { result: 'over', message: '🔄 **OVER FINISH !**', points: 1, emoji: '🔄', type: 'DEFENSE' },
  { result: 'spin', message: '🌀 **SPIN FINISH !**', points: 1, emoji: '🌀', type: 'STAMINA' },
  { result: 'xtreme', message: '⚡ **X-TREME FINISH !**', points: 3, emoji: '⚡', type: 'ATTACK' },
];

export class BattleCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Lance un combat Beyblade virtuel !',
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('combat')
        .setDescription(
          'Lance un combat Beyblade virtuel contre un autre membre !',
        )
        .addUserOption((opt) =>
          opt
            .setName('adversaire')
            .setDescription('Ton adversaire')
            .setRequired(true),
        )
        .addBooleanOption((opt) =>
          opt
            .setName('rapide')
            .setDescription('Combat rapide sans confirmation')
            .setRequired(false),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const opponent = interaction.options.getUser('adversaire', true);
    const quickBattle = interaction.options.getBoolean('rapide') ?? false;
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

    // Quick battle mode (old behavior)
    if (quickBattle) {
      return this.executeQuickBattle(interaction, challenger, opponent);
    }

    // Challenge mode with accept/decline buttons
    pendingBattles.set(challenger.id, {
      opponentId: opponent.id,
      channelId: interaction.channelId,
      timestamp: Date.now(),
    });

    // Auto-expire after 5 minutes
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

  private async getDeckStats(discordId: string) {
    const user = await prisma.user.findFirst({
      where: { discordId },
      include: {
        decks: {
          where: { isActive: true },
          include: { items: { include: { blade: true, ratchet: true, bit: true } } }
        }
      }
    });

    // Default stats if no deck
    let stats = { attack: 100, defense: 100, stamina: 100, dash: 50, power: 350 };

    if (user && user.decks.length > 0) {
      const deck = user.decks[0];
      let atk = 0, def = 0, sta = 0, dsh = 0;
      
      for (const item of deck.items) {
        const parts = [item.blade, item.ratchet, item.bit];
        atk += parts.reduce((acc, part) => acc + p(part?.attack), 0);
        def += parts.reduce((acc, part) => acc + p(part?.defense), 0);
        sta += parts.reduce((acc, part) => acc + p(part?.stamina), 0);
        dsh += parts.reduce((acc, part) => acc + p(part?.dash), 0);
      }
      
      // Average per bey (approx) to keep scale consistent or just sum
      // Let's use Sum as Power
      stats = { 
        attack: atk, 
        defense: def, 
        stamina: sta, 
        dash: dsh,
        power: atk + def + sta + (dsh * 0.5) // Dash weighted less for raw power
      };
    } else {
        // Boost random stats a bit to be competitive with a starter deck
        stats.power = 400 + Math.random() * 100;
    }

    return stats;
  }

  private async executeQuickBattle(
    interaction: Command.ChatInputCommandInteraction,
    challenger: {
      id: string;
      displayName: string;
      tag: string;
      displayAvatarURL: (opts: {
        size: number;
        extension?: 'png' | 'webp' | 'jpg' | 'jpeg';
      }) => string;
    },
    opponent: {
      id: string;
      displayName: string;
      tag: string;
      displayAvatarURL: (opts: {
        size: number;
        extension?: 'png' | 'webp' | 'jpg' | 'jpeg';
      }) => string;
    },
  ) {
    // Initial message
    const startEmbed = new EmbedBuilder()
      .setTitle('⚔️ Combat Beyblade !')
      .setDescription(
        `**${challenger.displayName}** VS **${opponent.displayName}**\n\n` +
          '🌀 3... 2... 1... **LET IT RIP !**',
      )
      .setColor(Colors.Secondary)
      .setFooter({ text: RPB.FullName });

    await interaction.reply({ embeds: [startEmbed] });

    // Fetch Stats
    const [statsA, statsB] = await Promise.all([
        this.getDeckStats(challenger.id),
        this.getDeckStats(opponent.id)
    ]);

    // Simulate battle with suspense
    await this.sleep(2000);

    // Determine winner based on Power Ratio
    // Add randomness factor (Luck) +/- 20%
    const luckA = 0.8 + Math.random() * 0.4;
    const luckB = 0.8 + Math.random() * 0.4;
    
    const scoreA = statsA.power * luckA;
    const scoreB = statsB.power * luckB;

    const winner = scoreA > scoreB ? challenger : opponent;
    const loser = winner.id === challenger.id ? opponent : challenger;
    const winnerStats = winner.id === challenger.id ? statsA : statsB;

    // Determine Finish Type based on Winner Stats
    // Normalize stats to find highest attribute
    const total = winnerStats.attack + winnerStats.defense + winnerStats.stamina;
    const atkRatio = winnerStats.attack / total;
    const defRatio = winnerStats.defense / total;
    const staRatio = winnerStats.stamina / total;
    const dashBonus = winnerStats.dash > 50 ? 0.2 : 0; // High dash increases Xtreme chance

    let finishType;
    const roll = Math.random();

    // Xtreme Finish (High Attack + Dash)
    if (roll < (atkRatio * 0.5 + dashBonus)) {
        finishType = battleResults.find(r => r.result === 'xtreme')!;
    } 
    // Burst Finish (High Attack)
    else if (roll < (atkRatio * 0.8 + dashBonus)) {
        finishType = battleResults.find(r => r.result === 'burst')!;
    }
    // Spin Finish (High Stamina)
    else if (roll < (atkRatio * 0.8 + staRatio)) {
        finishType = battleResults.find(r => r.result === 'spin')!;
    }
    // Over Finish (Default/Defense/Luck)
    else {
        finishType = battleResults.find(r => r.result === 'over')!;
    }

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
    );

    return interaction.editReply({
      embeds: [resultEmbed],
      files: [attachment],
      components: [row],
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
