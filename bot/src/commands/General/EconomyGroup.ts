import { type CommandInteraction, EmbedBuilder } from 'discord.js';
import { Discord, Slash, SlashGroup } from 'discordx';
import { inject, injectable } from 'tsyringe';

import { Colors, RPB } from '../../lib/constants.js';
import { PrismaService } from '../../lib/prisma.js';

// ─── Drop Rates ─────────────────────────────────────────────────────────────
// MISS = 35%, COMMON = 30%, RARE = 20%, EPIC = 10%, LEGENDARY = 4%, SECRET = 1%
const RARITY_RATES = {
  MISS: 0.35,
  COMMON: 0.3,
  RARE: 0.2,
  EPIC: 0.1,
  LEGENDARY: 0.04,
  SECRET: 0.01,
} as const;

const RARITY_CONFIG: Record<
  string,
  { emoji: string; color: number; label: string; sellPrice: number }
> = {
  COMMON: { emoji: '⚪', color: 0x9ca3af, label: 'Commune', sellPrice: 5 },
  RARE: { emoji: '🔵', color: 0x3b82f6, label: 'Rare', sellPrice: 15 },
  EPIC: { emoji: '🟣', color: 0x8b5cf6, label: 'Épique', sellPrice: 50 },
  LEGENDARY: {
    emoji: '🟡',
    color: 0xfbbf24,
    label: 'Légendaire',
    sellPrice: 150,
  },
  SECRET: { emoji: '🔴', color: 0xef4444, label: 'Secrète', sellPrice: 500 },
};

const GACHA_COST = 50;
const DAILY_AMOUNT = 100;

function rollRarity(): string | null {
  const roll = Math.random();
  let cumulative = 0;

  cumulative += RARITY_RATES.MISS;
  if (roll < cumulative) return null; // RATÉ

  cumulative += RARITY_RATES.COMMON;
  if (roll < cumulative) return 'COMMON';

  cumulative += RARITY_RATES.RARE;
  if (roll < cumulative) return 'RARE';

  cumulative += RARITY_RATES.EPIC;
  if (roll < cumulative) return 'EPIC';

  cumulative += RARITY_RATES.LEGENDARY;
  if (roll < cumulative) return 'LEGENDARY';

  return 'SECRET';
}

@Discord()
@SlashGroup({ name: 'eco', description: "Système d'économie et gacha RPB" })
@SlashGroup('eco')
@injectable()
export class EconomyGroup {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  private async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.profile.create({
        data: { userId, currency: 0 },
      });
    }
    return profile;
  }

  // ─── /eco daily ───
  @Slash({
    name: 'daily',
    description: 'Réclame tes pièces quotidiennes (100 🪙)',
  })
  async daily(interaction: CommandInteraction) {
    await interaction.deferReply();

    const profile = await this.getOrCreateProfile(interaction.user.id);
    const now = new Date();
    const lastDaily = profile.lastDaily;

    // Check 24h cooldown
    if (lastDaily) {
      const diff = now.getTime() - lastDaily.getTime();
      const hoursLeft = 24 - diff / (1000 * 60 * 60);
      if (hoursLeft > 0) {
        const h = Math.floor(hoursLeft);
        const m = Math.floor((hoursLeft - h) * 60);
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Warning)
              .setTitle('⏳ Trop tôt !')
              .setDescription(
                `Tu as déjà réclamé tes pièces aujourd'hui.\nReviens dans **${h}h ${m}min**.`,
              )
              .setFooter({ text: RPB.Name }),
          ],
        });
      }
    }

    // Give daily
    await this.prisma.profile.update({
      where: { userId: interaction.user.id },
      data: {
        currency: { increment: DAILY_AMOUNT },
        lastDaily: now,
      },
    });

    // Log transaction
    await this.prisma.currencyTransaction.create({
      data: {
        userId: interaction.user.id,
        amount: DAILY_AMOUNT,
        type: 'DAILY_CLAIM',
        note: 'Récompense quotidienne',
      },
    });

    const newBalance = profile.currency + DAILY_AMOUNT;

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Success)
          .setTitle('🪙 Récompense quotidienne !')
          .setDescription(
            `Tu as reçu **${DAILY_AMOUNT} pièces** !\n\n💰 Solde : **${newBalance.toLocaleString('fr-FR')} pièces**`,
          )
          .setFooter({ text: 'Reviens demain pour une nouvelle récompense !' }),
      ],
    });
  }

  // ─── /eco balance ───
  @Slash({ name: 'solde', description: 'Affiche ton solde de pièces' })
  async balance(interaction: CommandInteraction) {
    const profile = await this.getOrCreateProfile(interaction.user.id);

    // Count cards
    const cardCount = await this.prisma.cardInventory.count({
      where: { userId: interaction.user.id },
    });

    const uniqueCards = await this.prisma.cardInventory.count({
      where: { userId: interaction.user.id },
    });

    const totalCards = await this.prisma.gachaCard.count({
      where: { isActive: true },
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.Color)
          .setTitle(`💰 Solde de ${interaction.user.displayName}`)
          .addFields(
            {
              name: '🪙 Pièces',
              value: `**${profile.currency.toLocaleString('fr-FR')}**`,
              inline: true,
            },
            {
              name: '🃏 Cartes',
              value: `**${uniqueCards}** / ${totalCards}`,
              inline: true,
            },
            {
              name: '📦 Total copies',
              value: `**${cardCount}**`,
              inline: true,
            },
          )
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: `Coût d'un tirage : ${GACHA_COST} pièces` }),
      ],
    });
  }

  // ─── /eco gacha ───
  @Slash({
    name: 'gacha',
    description: `Tire une carte aléatoire (${GACHA_COST} 🪙)`,
  })
  async gacha(interaction: CommandInteraction) {
    await interaction.deferReply();

    const profile = await this.getOrCreateProfile(interaction.user.id);

    // Check balance
    if (profile.currency < GACHA_COST) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Error)
            .setTitle('❌ Pièces insuffisantes')
            .setDescription(
              `Il te faut **${GACHA_COST} pièces** pour tirer.\nTon solde : **${profile.currency} pièces**\n\nUtilise \`/eco daily\` pour gagner des pièces !`,
            ),
        ],
      });
    }

    // Deduct cost
    await this.prisma.profile.update({
      where: { userId: interaction.user.id },
      data: { currency: { decrement: GACHA_COST } },
    });

    await this.prisma.currencyTransaction.create({
      data: {
        userId: interaction.user.id,
        amount: -GACHA_COST,
        type: 'GACHA_PULL',
        note: 'Tirage gacha',
      },
    });

    // Roll rarity
    const rarity = rollRarity();

    // ── RATÉ ──
    if (rarity === null) {
      const missMessages = [
        "La toupie s'est éjectée du stadium... Tu n'as rien obtenu !",
        'Burst ! Ta toupie a explosé avant le tirage... Raté !',
        "Le Bey Spirit n'était pas avec toi cette fois... Rien du tout !",
        "Tu as lancé trop faible... La toupie s'est arrêtée. Raté !",
        "Un Ring Out ! Tu n'as attrapé aucune carte.",
        'Doji a volé ta carte avant que tu ne la voies... Raté !',
        'La Dark Nebula a intercepté ton tirage ! Rien cette fois.',
      ];
      const msg = missMessages[Math.floor(Math.random() * missMessages.length)];

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x4b5563)
            .setTitle('💨 Raté !')
            .setDescription(
              `${msg}\n\n💰 Solde restant : **${(profile.currency - GACHA_COST).toLocaleString('fr-FR')} pièces**`,
            )
            .setFooter({
              text: `Taux de raté : ${RARITY_RATES.MISS * 100}% — Retente ta chance !`,
            }),
        ],
      });
    }

    // ── DROP ──
    // Get random card of this rarity
    const cards = await this.prisma.gachaCard.findMany({
      where: {
        rarity: rarity as 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'SECRET',
        isActive: true,
      },
    });

    if (cards.length === 0) {
      // Refund if no cards of this rarity exist
      await this.prisma.profile.update({
        where: { userId: interaction.user.id },
        data: { currency: { increment: GACHA_COST } },
      });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setDescription(
              'Aucune carte disponible pour cette rareté. Remboursé !',
            ),
        ],
      });
    }

    const card = cards[Math.floor(Math.random() * cards.length)]!;
    const config = RARITY_CONFIG[rarity]!;

    // Add to inventory (increment if already owned)
    await this.prisma.cardInventory.upsert({
      where: {
        userId_cardId: {
          userId: interaction.user.id,
          cardId: card.id,
        },
      },
      create: {
        userId: interaction.user.id,
        cardId: card.id,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    // Check if duplicate
    const inv = await this.prisma.cardInventory.findUnique({
      where: {
        userId_cardId: {
          userId: interaction.user.id,
          cardId: card.id,
        },
      },
    });
    const isDuplicate = inv && inv.count > 1;

    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setTitle(`${config.emoji} Carte ${config.label} obtenue !`)
      .setDescription(
        `**${card.name}**${card.nameJp ? ` (${card.nameJp})` : ''}\n` +
          `${card.series.replace('_', ' ')}\n\n` +
          `${card.description || ''}` +
          (card.beyblade ? `\n\n🌀 **Toupie :** ${card.beyblade}` : '') +
          (isDuplicate
            ? `\n\n📋 *Doublon (x${inv?.count})* — Revends avec \`/eco vendre\``
            : ''),
      )
      .setFooter({
        text: `💰 Solde : ${(profile.currency - GACHA_COST).toLocaleString('fr-FR')} pièces`,
      });

    if (card.imageUrl) {
      embed.setThumbnail(card.imageUrl);
    }

    // Special effects for high rarity
    if (rarity === 'SECRET') {
      embed.setTitle('✨🔴 CARTE SECRÈTE !!! 🔴✨');
    } else if (rarity === 'LEGENDARY') {
      embed.setTitle('⭐🟡 Carte LÉGENDAIRE ! 🟡⭐');
    }

    return interaction.editReply({ embeds: [embed] });
  }

  // ─── /eco collection ───
  @Slash({ name: 'collection', description: 'Affiche ta collection de cartes' })
  async collection(interaction: CommandInteraction) {
    await interaction.deferReply();

    const inventory = await this.prisma.cardInventory.findMany({
      where: { userId: interaction.user.id },
      include: { card: true },
      orderBy: [{ card: { rarity: 'desc' } }, { card: { name: 'asc' } }],
    });

    if (inventory.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Info)
            .setTitle('🃏 Collection vide')
            .setDescription(
              "Tu n'as encore aucune carte. Utilise `/eco gacha` pour en obtenir !",
            ),
        ],
      });
    }

    const totalCards = await this.prisma.gachaCard.count({
      where: { isActive: true },
    });

    // Group by rarity
    const byRarity: Record<string, string[]> = {};
    for (const inv of inventory) {
      const r = inv.card.rarity;
      if (!byRarity[r]) byRarity[r] = [];
      const config = RARITY_CONFIG[r]!;
      const dupe = inv.count > 1 ? ` (x${inv.count})` : '';
      byRarity[r]?.push(`${config.emoji} ${inv.card.name}${dupe}`);
    }

    const embed = new EmbedBuilder()
      .setColor(RPB.GoldColor)
      .setTitle(`🃏 Collection de ${interaction.user.displayName}`)
      .setDescription(`**${inventory.length}** / ${totalCards} cartes`)
      .setThumbnail(interaction.user.displayAvatarURL());

    const order = ['SECRET', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'];
    for (const rarity of order) {
      const cards = byRarity[rarity];
      if (cards && cards.length > 0) {
        const label = RARITY_CONFIG[rarity]?.label;
        embed.addFields({
          name: `${RARITY_CONFIG[rarity]?.emoji} ${label} (${cards.length})`,
          value: cards.join('\n'),
        });
      }
    }

    return interaction.editReply({ embeds: [embed] });
  }

  // ─── /eco vendre ───
  @Slash({
    name: 'vendre',
    description: 'Vends un doublon de carte pour des pièces',
  })
  async sell(interaction: CommandInteraction) {
    await interaction.deferReply();

    // Find first duplicate
    const duplicate = await this.prisma.cardInventory.findFirst({
      where: {
        userId: interaction.user.id,
        count: { gt: 1 },
      },
      include: { card: true },
      orderBy: { card: { rarity: 'asc' } }, // Sell cheapest first
    });

    if (!duplicate) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setTitle('📦 Aucun doublon')
            .setDescription("Tu n'as pas de doublons à vendre."),
        ],
      });
    }

    const config = RARITY_CONFIG[duplicate.card.rarity]!;
    const sellPrice = config.sellPrice;

    // Remove one copy
    await this.prisma.cardInventory.update({
      where: { id: duplicate.id },
      data: { count: { decrement: 1 } },
    });

    // Add currency
    await this.prisma.profile.update({
      where: { userId: interaction.user.id },
      data: { currency: { increment: sellPrice } },
    });

    await this.prisma.currencyTransaction.create({
      data: {
        userId: interaction.user.id,
        amount: sellPrice,
        type: 'SELL_CARD',
        note: `Vente de ${duplicate.card.name}`,
      },
    });

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Success)
          .setTitle('💸 Carte vendue !')
          .setDescription(
            `${config.emoji} **${duplicate.card.name}** vendue pour **${sellPrice} pièces** !\n` +
              `Copies restantes : ${duplicate.count - 1}`,
          ),
      ],
    });
  }

  // ─── /eco rates ───
  @Slash({ name: 'taux', description: 'Affiche les taux de drop du gacha' })
  async rates(interaction: CommandInteraction) {
    const totalCards = await this.prisma.gachaCard.count({
      where: { isActive: true },
    });
    const bySeries: Record<string, number> = {};
    const byRarity: Record<string, number> = {};

    const cards = await this.prisma.gachaCard.findMany({
      where: { isActive: true },
    });
    for (const c of cards) {
      bySeries[c.series] = (bySeries[c.series] || 0) + 1;
      byRarity[c.rarity] = (byRarity[c.rarity] || 0) + 1;
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.Color)
          .setTitle('🎰 Taux de drop du Gacha')
          .setDescription(
            `**${totalCards} cartes** disponibles · Coût : **${GACHA_COST} 🪙** par tirage`,
          )
          .addFields(
            {
              name: '📊 Probabilités',
              value: [
                `💨 **Raté** — ${RARITY_RATES.MISS * 100}%`,
                `⚪ **Commune** — ${RARITY_RATES.COMMON * 100}% (vente : 5🪙)`,
                `🔵 **Rare** — ${RARITY_RATES.RARE * 100}% (vente : 15🪙)`,
                `🟣 **Épique** — ${RARITY_RATES.EPIC * 100}% (vente : 50🪙)`,
                `🟡 **Légendaire** — ${RARITY_RATES.LEGENDARY * 100}% (vente : 150🪙)`,
                `🔴 **Secrète** — ${RARITY_RATES.SECRET * 100}% (vente : 500🪙)`,
              ].join('\n'),
            },
            {
              name: '📦 Cartes par série',
              value:
                Object.entries(bySeries)
                  .map(([s, c]) => `${s.replace('_', ' ')} : **${c}** cartes`)
                  .join('\n') || 'Aucune',
              inline: true,
            },
            {
              name: '🏷️ Cartes par rareté',
              value: ['SECRET', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON']
                .map(
                  (r) =>
                    `${RARITY_CONFIG[r]?.emoji} ${RARITY_CONFIG[r]?.label} : **${byRarity[r] || 0}**`,
                )
                .join('\n'),
              inline: true,
            },
          )
          .setFooter({ text: 'Utilise /eco daily pour 100🪙 par jour' }),
      ],
    });
  }
}
