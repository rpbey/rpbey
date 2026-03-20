import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { inject, injectable } from 'tsyringe';

import {
  generateCollectionCard,
  generateGachaCard,
  generateGachaMissCard,
} from '../../lib/canvas-utils.js';
import { Colors, RPB } from '../../lib/constants.js';
import { PrismaService } from '../../lib/prisma.js';

// ─── Config ─────────────────────────────────────────────────────────────────

const GACHA_COST = 50;
const MULTI_PULL_COUNT = 10;
const MULTI_PULL_COST = GACHA_COST * MULTI_PULL_COUNT - 50; // 450

const DAILY_TIERS = [
  {
    weight: 60,
    min: 80,
    max: 120,
    msg: '+**{n}** pièces ajoutées à ta collection !',
  },
  { weight: 25, min: 150, max: 200, msg: 'Beau tirage ! +**{n}** pièces !' },
  {
    weight: 10,
    min: 250,
    max: 350,
    msg: 'Excellent ! Une vraie pépite ! +**{n}** pièces !',
  },
  {
    weight: 4,
    min: 500,
    max: 700,
    msg: '🌟 Incroyable ! Un trésor ultra-rare ! +**{n}** pièces !',
  },
  {
    weight: 1,
    min: 1000,
    max: 1500,
    msg: '💎✨ JACKPOT LÉGENDAIRE !!! +**{n}** pièces !!!',
  },
] as const;

const STREAK_BONUSES = [
  { days: 3, bonus: 50, label: '3 jours' },
  { days: 7, bonus: 150, label: '1 semaine' },
  { days: 14, bonus: 300, label: '2 semaines' },
  { days: 30, bonus: 750, label: '1 mois' },
] as const;

const BADGES = [
  { count: 5, reward: 200, name: 'Débutant', emoji: '🥉' },
  { count: 10, reward: 500, name: 'Collectionneur', emoji: '🥈' },
  { count: 15, reward: 750, name: 'Expert', emoji: '🥇' },
  { count: 20, reward: 1000, name: 'Maître', emoji: '🏆' },
  { count: 25, reward: 1500, name: 'Champion', emoji: '👑' },
  { count: 31, reward: 3000, name: 'Légende (100%)', emoji: '⭐' },
] as const;

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

const MISS_MESSAGES = [
  "La toupie s'est éjectée du stadium... Tu n'as rien obtenu !",
  'Burst ! Ta toupie a explosé avant le tirage... Raté !',
  "Le Bey Spirit n'était pas avec toi cette fois...",
  "Tu as lancé trop faible... La toupie s'est arrêtée.",
  "Un Ring Out ! Tu n'as attrapé aucune carte.",
  'Doji a volé ta carte avant que tu ne la voies...',
  'La Dark Nebula a intercepté ton tirage !',
  "Storm Pegasus t'a repoussé hors du stadium...",
  'L-Drago a absorbé toute ton énergie de tirage...',
];

type CardRarityType = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'SECRET';

interface UserProfile {
  userId: string; // Internal DB user ID
  profile: {
    id: string;
    currency: number;
    lastDaily: Date | null;
    dailyStreak: number;
  };
}

interface PullResult {
  rarity: CardRarityType | null;
  card: {
    name: string;
    nameJp: string | null;
    series: string;
    description: string | null;
    beyblade: string | null;
    imageUrl: string | null;
    id: string;
  } | null;
  isDuplicate: boolean;
  isWished: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function rollRarity(): CardRarityType | null {
  const roll = Math.random();
  let cum = 0;
  cum += RARITY_RATES.MISS;
  if (roll < cum) return null;
  cum += RARITY_RATES.COMMON;
  if (roll < cum) return 'COMMON';
  cum += RARITY_RATES.RARE;
  if (roll < cum) return 'RARE';
  cum += RARITY_RATES.EPIC;
  if (roll < cum) return 'EPIC';
  cum += RARITY_RATES.LEGENDARY;
  if (roll < cum) return 'LEGENDARY';
  return 'SECRET';
}

function rollDaily(): { amount: number; msg: string; tier: number } {
  const totalWeight = DAILY_TIERS.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < DAILY_TIERS.length; i++) {
    const t = DAILY_TIERS[i]!;
    roll -= t.weight;
    if (roll <= 0) {
      const amount = Math.floor(Math.random() * (t.max - t.min + 1)) + t.min;
      return {
        amount,
        msg: t.msg.replace('{n}', amount.toLocaleString('fr-FR')),
        tier: i,
      };
    }
  }
  return { amount: 100, msg: '+**100** pièces !', tier: 0 };
}

function randomMiss(): string {
  return MISS_MESSAGES[Math.floor(Math.random() * MISS_MESSAGES.length)]!;
}

// ─── Command Group ──────────────────────────────────────────────────────────

@Discord()
@SlashGroup({
  name: 'gacha',
  description: 'Système de cartes à collectionner RPB',
})
@SlashGroup('gacha')
@injectable()
export class EconomyGroup {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  /** Resolve Discord user → DB User → Profile */
  private async resolve(interaction: CommandInteraction): Promise<UserProfile> {
    const discordId = interaction.user.id;
    const displayName = interaction.user.displayName;

    let user = await this.prisma.user.findUnique({ where: { discordId } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          discordId,
          name: displayName,
          email: `${discordId}@discord.rpbey.fr`,
        },
      });
    }

    let profile = await this.prisma.profile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      profile = await this.prisma.profile.create({
        data: { userId: user.id, currency: 0 },
      });
    }

    return { userId: user.id, profile };
  }

  private async checkBadges(
    userId: string,
    profileId: string,
  ): Promise<string | null> {
    const uniqueCount = await this.prisma.cardInventory.count({
      where: { userId },
    });
    for (const badge of BADGES) {
      if (uniqueCount >= badge.count) {
        const existing = await this.prisma.currencyTransaction.findFirst({
          where: { userId, type: 'BADGE_REWARD', note: `Badge: ${badge.name}` },
        });
        if (!existing) {
          await this.prisma.profile.update({
            where: { id: profileId },
            data: { currency: { increment: badge.reward } },
          });
          await this.prisma.currencyTransaction.create({
            data: {
              userId,
              amount: badge.reward,
              type: 'BADGE_REWARD',
              note: `Badge: ${badge.name}`,
            },
          });
          return `${badge.emoji} **Badge "${badge.name}" débloqué !** +${badge.reward} 🪙`;
        }
      }
    }
    return null;
  }

  private async pullCard(
    userId: string,
    profileId: string,
  ): Promise<PullResult> {
    const rarity = rollRarity();
    if (!rarity)
      return { rarity: null, card: null, isDuplicate: false, isWished: false };

    const cards = await this.prisma.gachaCard.findMany({
      where: { rarity, isActive: true },
    });
    if (cards.length === 0)
      return { rarity, card: null, isDuplicate: false, isWished: false };

    const card = cards[Math.floor(Math.random() * cards.length)]!;
    await this.prisma.cardInventory.upsert({
      where: { userId_cardId: { userId, cardId: card.id } },
      create: { userId, cardId: card.id, count: 1 },
      update: { count: { increment: 1 } },
    });

    const inv = await this.prisma.cardInventory.findUnique({
      where: { userId_cardId: { userId, cardId: card.id } },
    });
    const isDuplicate = inv ? inv.count > 1 : false;
    const isWished = !!(await this.prisma.cardWishlist.findUnique({
      where: { profileId_cardId: { profileId, cardId: card.id } },
    }));

    return { rarity, card, isDuplicate, isWished };
  }

  private buildPullEmbed(result: PullResult, balance: number): EmbedBuilder {
    if (!result.card || !result.rarity) {
      return new EmbedBuilder()
        .setColor(0x4b5563)
        .setTitle('💨 Raté !')
        .setDescription(
          `${randomMiss()}\n\n💰 Solde : **${balance.toLocaleString('fr-FR')}** 🪙`,
        )
        .setFooter({ text: 'Retente ta chance !' });
    }
    const cfg = RARITY_CONFIG[result.rarity]!;
    let title = `${cfg.emoji} Carte ${cfg.label} obtenue !`;
    if (result.rarity === 'SECRET') title = '✨🔴 CARTE SECRÈTE !!! 🔴✨';
    else if (result.rarity === 'LEGENDARY')
      title = '⭐🟡 Carte LÉGENDAIRE ! 🟡⭐';

    const embed = new EmbedBuilder()
      .setColor(result.isWished ? 0xfbbf24 : cfg.color)
      .setTitle(result.isWished ? `⭐ ${title}` : title)
      .setDescription(
        `**${result.card.name}**${result.card.nameJp ? ` (${result.card.nameJp})` : ''}\n${result.card.series.replace(/_/g, ' ')}\n\n${result.card.description || ''}` +
          (result.card.beyblade
            ? `\n\n🌀 **Toupie :** ${result.card.beyblade}`
            : '') +
          (result.isWished ? '\n\n⭐ **CARTE SOUHAITÉE !**' : '') +
          (result.isDuplicate ? '\n📋 *Doublon — `/gacha vendre`*' : ''),
      )
      .setFooter({ text: `💰 Solde : ${balance.toLocaleString('fr-FR')} 🪙` });
    if (result.card.imageUrl) embed.setThumbnail(result.card.imageUrl);
    return embed;
  }

  // ═══ /gacha aide ═══
  @Slash({ name: 'aide', description: 'Guide complet du système gacha' })
  async help(interaction: CommandInteraction) {
    const embed1 = new EmbedBuilder()
      .setColor(RPB.Color)
      .setTitle('🎰 Guide du Gacha RPB')
      .setDescription(
        'Collectionne les **31 cartes** de personnages Beyblade Metal Masters & Metal Fury !\nGagne des pièces, tire des cartes, complète ta collection.',
      )
      .addFields(
        {
          name: '🪙 Gagner des pièces',
          value:
            '`/gacha daily` — Réclame tes pièces (toutes les **20h**)\n> 60% : 80-120🪙 · 25% : 150-200🪙 · 10% : 250-350🪙\n> 4% : 500-700🪙 ⭐ · **1% : 1000-1500🪙** 💎\n\n`/gacha vendre` — Vends un doublon (⚪5 · 🔵15 · 🟣50 · 🟡150 · 🔴500 🪙)',
        },
        {
          name: '🔥 Streak',
          value:
            'Bonus : **3j** +50🪙 · **7j** +150🪙 · **14j** +300🪙 · **30j** +750🪙\n⚠️ >48h sans daily = streak reset',
        },
      );
    const embed2 = new EmbedBuilder().setColor(RPB.GoldColor).addFields(
      {
        name: '🃏 Tirer des cartes',
        value:
          '`/gacha gacha` — x1 (**50🪙**) · `/gacha multi` — x10 (**450🪙**, -10%)\n\n> 💨 Raté **35%** · ⚪ **30%** · 🔵 **20%** · 🟣 **10%** · 🟡 **4%** · 🔴 **1%**',
      },
      {
        name: '⭐ Wishlist',
        value:
          '`/gacha wish <nom>` — Ajoute à ta wishlist\n`/gacha wishlist` — Affiche · Embed doré quand tu drop une carte souhaitée !',
      },
      {
        name: '📖 Consulter',
        value:
          '`/gacha solde` · `/gacha collection` · `/gacha catalogue` · `/gacha classement` · `/gacha taux`',
      },
    );
    const embed3 = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .addFields(
        {
          name: '🏅 Badges',
          value:
            '🥉 5 cartes +200🪙 · 🥈 10 +500🪙 · 🥇 15 +750🪙\n🏆 20 +1000🪙 · 👑 25 +1500🪙 · ⭐ 31/31 +3000🪙',
        },
        {
          name: '💡 Astuces',
          value:
            '• `/gacha daily` chaque jour · `/gacha multi` pour -10%\n• Wishlist tes cartes préférées · Vends les doublons\n• **Ryuga L-Drago Destructor** 🔴 = 1% de chance !',
        },
        {
          name: '📦 Cartes',
          value:
            '**Metal Masters** 17 cartes · **Metal Fury** 14 cartes\n🔴1 Secrète · 🟡3 Légendaires · 🟣8 Épiques · 🔵7 Rares · ⚪12 Communes',
        },
      )
      .setFooter({ text: 'RPB Gacha — Collectionne-les tous ! 🌀' });
    return interaction.reply({ embeds: [embed1, embed2, embed3] });
  }

  // ═══ /gacha daily ═══
  @Slash({ name: 'daily', description: 'Réclame tes pièces quotidiennes' })
  async daily(interaction: CommandInteraction) {
    await interaction.deferReply();
    const { userId, profile } = await this.resolve(interaction);
    const now = new Date();

    if (profile.lastDaily) {
      const hoursLeft =
        20 - (now.getTime() - profile.lastDaily.getTime()) / 3_600_000;
      if (hoursLeft > 0) {
        const h = Math.floor(hoursLeft);
        const m = Math.floor((hoursLeft - h) * 60);
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Warning)
              .setTitle('⏳ Trop tôt !')
              .setDescription(
                `Reviens dans **${h}h ${m}min**.\n🔥 Streak : **${profile.dailyStreak} jours**`,
              ),
          ],
        });
      }
    }

    let newStreak = 1;
    if (
      profile.lastDaily &&
      (now.getTime() - profile.lastDaily.getTime()) / 3_600_000 < 48
    ) {
      newStreak = profile.dailyStreak + 1;
    }

    const { amount, msg, tier } = rollDaily();
    let streakBonus = 0;
    let streakMsg = '';
    for (const sb of STREAK_BONUSES) {
      if (newStreak === sb.days) {
        streakBonus = sb.bonus;
        streakMsg = `\n\n🔥 **Bonus streak ${sb.label} !** +${sb.bonus} 🪙`;
        break;
      }
    }
    const totalGain = amount + streakBonus;

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        currency: { increment: totalGain },
        lastDaily: now,
        dailyStreak: newStreak,
      },
    });
    await this.prisma.currencyTransaction.create({
      data: {
        userId,
        amount: totalGain,
        type: 'DAILY_CLAIM',
        note: `Tier ${tier + 1} — Streak ${newStreak}`,
      },
    });
    if (streakBonus > 0)
      await this.prisma.currencyTransaction.create({
        data: {
          userId,
          amount: streakBonus,
          type: 'STREAK_BONUS',
          note: `Streak ${newStreak}j`,
        },
      });

    const tierColors = [
      Colors.Info,
      Colors.Success,
      Colors.Warning,
      0xfbbf24,
      0xef4444,
    ];
    const streakBar =
      '🔥'.repeat(Math.min(newStreak, 7)) +
      (newStreak > 7 ? ` x${newStreak}` : '');
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(tierColors[tier] ?? Colors.Info)
          .setTitle(
            tier >= 3 ? '💎 DAILY EXCEPTIONNEL !' : '🪙 Récompense quotidienne',
          )
          .setDescription(
            `${msg}${streakMsg}\n\n💰 Solde : **${(profile.currency + totalGain).toLocaleString('fr-FR')} pièces**\n${streakBar}`,
          )
          .setFooter({
            text: `Streak : ${newStreak} jour${newStreak > 1 ? 's' : ''} · Prochain dans 20h`,
          }),
      ],
    });
  }

  // ═══ /gacha solde ═══
  @Slash({ name: 'solde', description: 'Affiche ton profil économie' })
  async balance(interaction: CommandInteraction) {
    const { userId, profile } = await this.resolve(interaction);
    const [uniqueCards, totalCopies, totalCards, wishCount] = await Promise.all(
      [
        this.prisma.cardInventory.count({ where: { userId } }),
        this.prisma.cardInventory.aggregate({
          where: { userId },
          _sum: { count: true },
        }),
        this.prisma.gachaCard.count({ where: { isActive: true } }),
        this.prisma.cardWishlist.count({ where: { profileId: profile.id } }),
      ],
    );
    const pct =
      totalCards > 0 ? Math.round((uniqueCards / totalCards) * 100) : 0;
    const progressBar =
      '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
    let currentBadge = '';
    for (const b of [...BADGES].reverse()) {
      if (uniqueCards >= b.count) {
        currentBadge = `${b.emoji} ${b.name}`;
        break;
      }
    }
    const nextBadge = BADGES.find((b) => b.count > uniqueCards);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.GoldColor)
          .setTitle(`💰 ${interaction.user.displayName}`)
          .setThumbnail(interaction.user.displayAvatarURL())
          .addFields(
            {
              name: '🪙 Pièces',
              value: `**${profile.currency.toLocaleString('fr-FR')}**`,
              inline: true,
            },
            {
              name: '🔥 Streak',
              value: `**${profile.dailyStreak}** jour${profile.dailyStreak !== 1 ? 's' : ''}`,
              inline: true,
            },
            { name: '⭐ Wishlist', value: `**${wishCount}**`, inline: true },
            {
              name: `🃏 Collection (${pct}%)`,
              value: `${progressBar}\n**${uniqueCards}** / ${totalCards} cartes · ${totalCopies._sum.count || 0} copies`,
            },
            ...(currentBadge
              ? [
                  {
                    name: '🏅 Badge',
                    value:
                      currentBadge +
                      (nextBadge
                        ? ` → ${nextBadge.emoji} ${nextBadge.name} (${nextBadge.count})`
                        : ' ✨ MAX'),
                    inline: false,
                  },
                ]
              : []),
          )
          .setFooter({
            text: `Tirage : ${GACHA_COST}🪙 · Multi x10 : ${MULTI_PULL_COST}🪙`,
          }),
      ],
    });
  }

  // ═══ /gacha gacha ═══
  @Slash({ name: 'gacha', description: `Tire une carte (${GACHA_COST} 🪙)` })
  async gacha(interaction: CommandInteraction) {
    await interaction.deferReply();
    const { userId, profile } = await this.resolve(interaction);
    if (profile.currency < GACHA_COST)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Error)
            .setTitle('❌ Pièces insuffisantes')
            .setDescription(
              `Il te faut **${GACHA_COST}** 🪙 · Solde : **${profile.currency}** 🪙\n\n\`/gacha daily\` !`,
            ),
        ],
      });

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { currency: { decrement: GACHA_COST } },
    });
    await this.prisma.currencyTransaction.create({
      data: {
        userId,
        amount: -GACHA_COST,
        type: 'GACHA_PULL',
        note: 'Tirage x1',
      },
    });

    const result = await this.pullCard(userId, profile.id);
    const bal = profile.currency - GACHA_COST;

    try {
      if (result.card && result.rarity) {
        const cardBuffer = await generateGachaCard({
          name: result.card.name,
          nameJp: result.card.nameJp,
          series: result.card.series,
          rarity: result.rarity,
          beyblade: result.card.beyblade,
          description: result.card.description,
          imageUrl: result.card.imageUrl,
          isDuplicate: result.isDuplicate,
          isWished: result.isWished,
          balance: bal,
        });
        const attachment = new AttachmentBuilder(cardBuffer, {
          name: 'gacha-card.png',
        });
        const reply = await interaction.editReply({ files: [attachment] });
        const bm = await this.checkBadges(userId, profile.id);
        if (bm) await reply.reply({ content: bm });
      } else {
        const missBuffer = await generateGachaMissCard(randomMiss(), bal);
        const attachment = new AttachmentBuilder(missBuffer, {
          name: 'gacha-miss.png',
        });
        await interaction.editReply({ files: [attachment] });
      }
    } catch {
      // Fallback to embed if canvas fails
      await interaction.editReply({
        embeds: [this.buildPullEmbed(result, bal)],
      });
    }
  }

  // ═══ /gacha multi ═══
  @Slash({
    name: 'multi',
    description: `Tire 10 cartes (${MULTI_PULL_COST} 🪙, -10%)`,
  })
  async multi(interaction: CommandInteraction) {
    await interaction.deferReply();
    const { userId, profile } = await this.resolve(interaction);
    if (profile.currency < MULTI_PULL_COST)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Error)
            .setTitle('❌ Pièces insuffisantes')
            .setDescription(
              `Multi x10 : **${MULTI_PULL_COST}** 🪙 · Solde : **${profile.currency}** 🪙`,
            ),
        ],
      });

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { currency: { decrement: MULTI_PULL_COST } },
    });
    await this.prisma.currencyTransaction.create({
      data: {
        userId,
        amount: -MULTI_PULL_COST,
        type: 'MULTI_PULL',
        note: 'Tirage x10',
      },
    });

    const results: PullResult[] = [];
    for (let i = 0; i < MULTI_PULL_COUNT; i++)
      results.push(await this.pullCard(userId, profile.id));

    const hits = results.filter((r) => r.card);
    const misses = results.filter((r) => !r.card);
    const lines = results.map((r) =>
      r.card
        ? `${RARITY_CONFIG[r.rarity!]?.emoji} **${r.card.name}** — ${RARITY_CONFIG[r.rarity!]?.label}${r.isDuplicate ? ' *(dbl)*' : ' ✨'}`
        : '💨 *Raté*',
    );

    const bestRarity = hits.reduce((best, r) => {
      const o: CardRarityType[] = [
        'COMMON',
        'RARE',
        'EPIC',
        'LEGENDARY',
        'SECRET',
      ];
      return o.indexOf(r.rarity!) > o.indexOf(best) ? r.rarity! : best;
    }, 'COMMON' as CardRarityType);
    const color =
      hits.length > 0
        ? (RARITY_CONFIG[bestRarity]?.color ?? Colors.Info)
        : 0x4b5563;

    const reply = await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setTitle(`🎰 Multi-Pull x${MULTI_PULL_COUNT}`)
          .setDescription(lines.join('\n'))
          .addFields(
            {
              name: 'Résultat',
              value: `✅ **${hits.length}** cartes · 💨 **${misses.length}** ratés`,
              inline: true,
            },
            {
              name: '💰 Solde',
              value: `**${(profile.currency - MULTI_PULL_COST).toLocaleString('fr-FR')}** 🪙`,
              inline: true,
            },
          )
          .setFooter({
            text: `Économie : ${GACHA_COST * MULTI_PULL_COUNT - MULTI_PULL_COST}🪙 vs tirages individuels`,
          }),
      ],
    });
    if (hits.length > 0) {
      const bm = await this.checkBadges(userId, profile.id);
      if (bm) await reply.reply({ content: bm });
    }
  }

  // ═══ /gacha wish ═══
  @Slash({
    name: 'wish',
    description: 'Ajoute/retire une carte de ta wishlist',
  })
  async wish(
    @SlashOption({
      name: 'carte',
      description: 'Nom de la carte',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    cardName: string,
    interaction: CommandInteraction,
  ) {
    const { profile } = await this.resolve(interaction);
    const card = await this.prisma.gachaCard.findFirst({
      where: {
        OR: [
          { name: { contains: cardName, mode: 'insensitive' } },
          { slug: { contains: cardName.toLowerCase().replace(/\s+/g, '-') } },
        ],
        isActive: true,
      },
    });
    if (!card)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Error)
            .setDescription(
              `Carte "${cardName}" introuvable. \`/gacha catalogue\``,
            ),
        ],
        ephemeral: true,
      });

    const existing = await this.prisma.cardWishlist.findUnique({
      where: { profileId_cardId: { profileId: profile.id, cardId: card.id } },
    });
    if (existing) {
      await this.prisma.cardWishlist.delete({ where: { id: existing.id } });
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setDescription(`❌ **${card.name}** retirée de ta wishlist.`),
        ],
      });
    }
    await this.prisma.cardWishlist.create({
      data: { profileId: profile.id, cardId: card.id },
    });
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(RARITY_CONFIG[card.rarity]?.color)
          .setTitle('⭐ Wishlist')
          .setDescription(
            `${RARITY_CONFIG[card.rarity]?.emoji} **${card.name}** ajoutée !\nEmbed doré quand tu la drop.`,
          )
          .setThumbnail(card.imageUrl || ''),
      ],
    });
  }

  // ═══ /gacha wishlist ═══
  @Slash({ name: 'wishlist', description: 'Affiche ta wishlist' })
  async wishlist(interaction: CommandInteraction) {
    const { userId, profile } = await this.resolve(interaction);
    const wishes = await this.prisma.cardWishlist.findMany({
      where: { profileId: profile.id },
      include: { card: true },
    });
    if (wishes.length === 0)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Info)
            .setDescription('Wishlist vide. `/gacha wish <carte>`'),
        ],
      });

    const owned = await this.prisma.cardInventory.findMany({
      where: { userId, cardId: { in: wishes.map((w) => w.cardId) } },
    });
    const ownedIds = new Set(owned.map((o) => o.cardId));
    const lines = wishes.map(
      (w) =>
        `${RARITY_CONFIG[w.card.rarity]?.emoji} **${w.card.name}**${ownedIds.has(w.cardId) ? ' ✅' : ''}`,
    );
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.GoldColor)
          .setTitle(`⭐ Wishlist de ${interaction.user.displayName}`)
          .setDescription(lines.join('\n')),
      ],
    });
  }

  // ═══ /gacha catalogue ═══
  @Slash({ name: 'catalogue', description: 'Toutes les cartes disponibles' })
  async catalogue(
    @SlashOption({
      name: 'série',
      description: 'Filtrer',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    series: string | undefined,
    interaction: CommandInteraction,
  ) {
    const where: {
      isActive: boolean;
      series?: { contains: string; mode: 'insensitive' };
    } = { isActive: true };
    if (series) where.series = { contains: series, mode: 'insensitive' };
    const cards = await this.prisma.gachaCard.findMany({
      where,
      orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
    });
    if (cards.length === 0)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setDescription('Aucune carte trouvée.'),
        ],
        ephemeral: true,
      });

    const byRarity: Record<string, string[]> = {};
    for (const c of cards) {
      if (!byRarity[c.rarity]) byRarity[c.rarity] = [];
      byRarity[c.rarity]?.push(
        `${RARITY_CONFIG[c.rarity]?.emoji} **${c.name}** — ${c.beyblade || 'N/A'}`,
      );
    }
    const embed = new EmbedBuilder()
      .setColor(RPB.Color)
      .setTitle('📖 Catalogue')
      .setDescription(`**${cards.length}** cartes`);
    for (const r of ['SECRET', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON']) {
      if (byRarity[r]?.length)
        embed.addFields({
          name: `${RARITY_CONFIG[r]?.emoji} ${RARITY_CONFIG[r]?.label} (${byRarity[r]?.length})`,
          value: byRarity[r]?.join('\n'),
        });
    }
    return interaction.reply({ embeds: [embed] });
  }

  // ═══ /gacha collection ═══
  @Slash({ name: 'collection', description: 'Affiche ta collection' })
  async collection(interaction: CommandInteraction) {
    await interaction.deferReply();
    const { userId, profile } = await this.resolve(interaction);
    const inventory = await this.prisma.cardInventory.findMany({
      where: { userId },
      include: { card: true },
      orderBy: [{ card: { rarity: 'desc' } }, { card: { name: 'asc' } }],
    });
    if (inventory.length === 0)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Info)
            .setTitle('🃏 Collection vide')
            .setDescription('`/gacha gacha` pour commencer !'),
        ],
      });

    const totalCards = await this.prisma.gachaCard.count({
      where: { isActive: true },
    });
    const badgesList = BADGES.filter((b) => inventory.length >= b.count).map(
      (b) => `${b.emoji} ${b.name}`,
    );

    try {
      const cardBuffer = await generateCollectionCard({
        username: interaction.user.displayName,
        avatarUrl: interaction.user.displayAvatarURL({
          extension: 'png',
          size: 128,
        }),
        currency: profile.currency,
        streak: profile.dailyStreak,
        cards: inventory.map((inv) => ({
          name: inv.card.name,
          rarity: inv.card.rarity,
          count: inv.count,
          imageUrl: inv.card.imageUrl,
        })),
        totalCards,
        badges: badgesList,
      });
      const attachment = new AttachmentBuilder(cardBuffer, {
        name: 'collection.png',
      });
      return interaction.editReply({ files: [attachment] });
    } catch {
      // Fallback to embed
      const pct = Math.round((inventory.length / totalCards) * 100);
      const byRarity: Record<string, string[]> = {};
      for (const inv of inventory) {
        const r = inv.card.rarity;
        if (!byRarity[r]) byRarity[r] = [];
        byRarity[r]?.push(
          `${RARITY_CONFIG[r]?.emoji} ${inv.card.name}${inv.count > 1 ? ` (x${inv.count})` : ''}`,
        );
      }
      const embed = new EmbedBuilder()
        .setColor(RPB.GoldColor)
        .setTitle(`🃏 Collection de ${interaction.user.displayName}`)
        .setDescription(`**${inventory.length}** / ${totalCards} (${pct}%)`)
        .setThumbnail(interaction.user.displayAvatarURL());
      for (const r of ['SECRET', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON']) {
        if (byRarity[r]?.length)
          embed.addFields({
            name: `${RARITY_CONFIG[r]?.emoji} ${RARITY_CONFIG[r]?.label} (${byRarity[r]?.length})`,
            value: byRarity[r]?.join('\n'),
          });
      }
      if (badgesList.length > 0)
        embed.addFields({ name: '🏅 Badges', value: badgesList.join(' · ') });
      return interaction.editReply({ embeds: [embed] });
    }
  }

  // ═══ /gacha vendre ═══
  @Slash({ name: 'vendre', description: 'Vends un doublon' })
  async sell(interaction: CommandInteraction) {
    await interaction.deferReply();
    const { userId } = await this.resolve(interaction);
    const dup = await this.prisma.cardInventory.findFirst({
      where: { userId, count: { gt: 1 } },
      include: { card: true },
      orderBy: { card: { rarity: 'asc' } },
    });
    if (!dup)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setDescription('Aucun doublon à vendre.'),
        ],
      });

    const cfg = RARITY_CONFIG[dup.card.rarity]!;
    await this.prisma.cardInventory.update({
      where: { id: dup.id },
      data: { count: { decrement: 1 } },
    });
    await this.prisma.profile.update({
      where: { userId },
      data: { currency: { increment: cfg.sellPrice } },
    });
    await this.prisma.currencyTransaction.create({
      data: {
        userId,
        amount: cfg.sellPrice,
        type: 'SELL_CARD',
        note: `Vente: ${dup.card.name}`,
      },
    });
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Success)
          .setDescription(
            `${cfg.emoji} **${dup.card.name}** vendue pour **${cfg.sellPrice}** 🪙 · Reste : ${dup.count - 1}`,
          ),
      ],
    });
  }

  // ═══ /gacha classement ═══
  @Slash({ name: 'classement', description: 'Top collectionneurs' })
  async leaderboard(interaction: CommandInteraction) {
    await interaction.deferReply();
    const top = await this.prisma.cardInventory.groupBy({
      by: ['userId'],
      _count: { cardId: true },
      orderBy: { _count: { cardId: 'desc' } },
      take: 10,
    });
    if (top.length === 0)
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Info)
            .setDescription("Personne n'a de cartes !"),
        ],
      });
    const medals = ['🥇', '🥈', '🥉'];
    const lines: string[] = [];
    for (let i = 0; i < top.length; i++) {
      const u = await this.prisma.user.findUnique({
        where: { id: top[i]?.userId },
        select: { name: true, globalName: true },
      });
      lines.push(
        `${medals[i] || `**${i + 1}.**`} ${u?.globalName || u?.name || '?'} — **${top[i]?._count.cardId}** cartes`,
      );
    }
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.GoldColor)
          .setTitle('🏆 Classement')
          .setDescription(lines.join('\n')),
      ],
    });
  }

  // ═══ /gacha taux ═══
  @Slash({ name: 'taux', description: 'Mécaniques et taux' })
  async rates(interaction: CommandInteraction) {
    const total = await this.prisma.gachaCard.count({
      where: { isActive: true },
    });
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.Color)
          .setTitle('🎰 Mécaniques du Gacha')
          .setDescription(
            `**${total} cartes** · x1 : **${GACHA_COST}🪙** · x10 : **${MULTI_PULL_COST}🪙**`,
          )
          .addFields(
            {
              name: '📊 Drop',
              value:
                '💨 Raté **35%** · ⚪ **30%** · 🔵 **20%** · 🟣 **10%** · 🟡 **4%** · 🔴 **1%**',
            },
            {
              name: '🪙 Daily (20h)',
              value:
                '60%: 80-120 · 25%: 150-200 · 10%: 250-350 · 4%: 500-700 · 1%: 1000-1500',
              inline: true,
            },
            {
              name: '🔥 Streak',
              value: STREAK_BONUSES.map(
                (s) => `${s.label}: +${s.bonus}🪙`,
              ).join('\n'),
              inline: true,
            },
            {
              name: '🏅 Badges',
              value: BADGES.map(
                (b) => `${b.emoji} ${b.count}: +${b.reward}🪙`,
              ).join('\n'),
            },
          ),
      ],
    });
  }

  // ═══ /gacha admin-give — Admin only ═══
  @Slash({
    name: 'admin-give',
    description: '[ADMIN] Donner des pièces à un membre',
  })
  async adminGive(
    @SlashOption({
      name: 'membre',
      description: 'Le membre',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: { id: string; displayName: string },
    @SlashOption({
      name: 'montant',
      description: 'Nombre de pièces',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    amount: number,
    @SlashOption({
      name: 'raison',
      description: 'Raison',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string | undefined,
    interaction: CommandInteraction,
  ) {
    // Admin check
    const caller = await this.prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });
    if (!caller || (caller.role !== 'admin' && caller.role !== 'superadmin')) {
      return interaction.reply({
        content: '❌ Réservé aux administrateurs.',
        ephemeral: true,
      });
    }

    if (amount === 0)
      return interaction.reply({
        content: '❌ Montant invalide.',
        ephemeral: true,
      });

    // Resolve target
    let targetUser = await this.prisma.user.findUnique({
      where: { discordId: target.id },
    });
    if (!targetUser) {
      targetUser = await this.prisma.user.create({
        data: {
          discordId: target.id,
          name: target.displayName,
          email: `${target.id}@discord.rpbey.fr`,
        },
      });
    }
    let profile = await this.prisma.profile.findUnique({
      where: { userId: targetUser.id },
    });
    if (!profile) {
      profile = await this.prisma.profile.create({
        data: { userId: targetUser.id, currency: 0 },
      });
    }

    const isGive = amount > 0;
    const absAmount = Math.abs(amount);

    // Prevent negative balance
    if (!isGive && profile.currency < absAmount) {
      return interaction.reply({
        content: `❌ ${target.displayName} n'a que **${profile.currency}** 🪙.`,
        ephemeral: true,
      });
    }

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        currency: isGive ? { increment: absAmount } : { decrement: absAmount },
      },
    });
    await this.prisma.currencyTransaction.create({
      data: {
        userId: targetUser.id,
        amount,
        type: isGive ? 'ADMIN_GIVE' : 'ADMIN_TAKE',
        note: reason || `Par ${interaction.user.displayName}`,
      },
    });

    const newBalance = profile.currency + amount;

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(isGive ? Colors.Success : Colors.Warning)
          .setTitle(isGive ? '🪙 Pièces ajoutées' : '🪙 Pièces retirées')
          .setDescription(
            `${isGive ? '+' : ''}**${amount.toLocaleString('fr-FR')}** 🪙 ${isGive ? 'donnés à' : 'retirés de'} **${target.displayName}**` +
              (reason ? `\n📝 *${reason}*` : '') +
              `\n\n💰 Nouveau solde : **${newBalance.toLocaleString('fr-FR')}** 🪙`,
          )
          .setFooter({ text: `Par ${interaction.user.displayName}` }),
      ],
    });
  }
}
