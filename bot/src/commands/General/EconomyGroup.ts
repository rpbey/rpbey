import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { inject, injectable } from 'tsyringe';

import { Colors, RPB } from '../../lib/constants.js';
import { PrismaService } from '../../lib/prisma.js';

// ─── Config ─────────────────────────────────────────────────────────────────

const GACHA_COST = 50;
const MULTI_PULL_COUNT = 10;
const MULTI_PULL_COST = GACHA_COST * MULTI_PULL_COUNT - 50; // 450 (10% discount)

// Daily tiers (Mudae-inspired)
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

// Streak bonuses
const STREAK_BONUSES = [
  { days: 3, bonus: 50, label: '3 jours' },
  { days: 7, bonus: 150, label: '1 semaine' },
  { days: 14, bonus: 300, label: '2 semaines' },
  { days: 30, bonus: 750, label: '1 mois' },
] as const;

// Collection badges (milestones)
const BADGES = [
  { count: 5, reward: 200, name: 'Débutant', emoji: '🥉' },
  { count: 10, reward: 500, name: 'Collectionneur', emoji: '🥈' },
  { count: 15, reward: 750, name: 'Expert', emoji: '🥇' },
  { count: 20, reward: 1000, name: 'Maître', emoji: '🏆' },
  { count: 25, reward: 1500, name: 'Champion', emoji: '👑' },
  { count: 31, reward: 3000, name: 'Légende (100%)', emoji: '⭐' },
] as const;

// Drop rates: MISS=35%, COMMON=30%, RARE=20%, EPIC=10%, LEGENDARY=4%, SECRET=1%
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

  private async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.profile.create({
        data: { userId, currency: 0 },
      });
    }
    return profile;
  }

  // Check and award badge milestones
  private async checkBadges(
    userId: string,
    profileId: string,
  ): Promise<string | null> {
    const uniqueCount = await this.prisma.cardInventory.count({
      where: { userId },
    });

    for (const badge of BADGES) {
      if (uniqueCount >= badge.count) {
        // Check if already awarded
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

  // ═══════════════════════════════════════════════════════════════════════════
  // /gacha aide — Guide complet
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'aide', description: 'Guide complet du système gacha' })
  async help(interaction: CommandInteraction) {
    const embed1 = new EmbedBuilder()
      .setColor(RPB.Color)
      .setTitle('🎰 Guide du Gacha RPB')
      .setDescription(
        'Collectionne les **31 cartes** de personnages Beyblade Metal Masters & Metal Fury !\n' +
          'Gagne des pièces, tire des cartes, complète ta collection.',
      )
      .addFields(
        {
          name: '🪙 Gagner des pièces',
          value: [
            '`/gacha daily` — Réclame tes pièces (toutes les **20h**)',
            '> 5 tiers de récompense aléatoires :',
            '> 60% : 80-120🪙 · 25% : 150-200🪙 · 10% : 250-350🪙',
            '> 4% : 500-700🪙 ⭐ · **1% : 1000-1500🪙** 💎',
            '',
            '`/gacha vendre` — Vends un doublon pour des pièces',
            '> ⚪5 · 🔵15 · 🟣50 · 🟡150 · 🔴500 🪙',
          ].join('\n'),
        },
        {
          name: '🔥 Streak (série de jours)',
          value: [
            'Connecte-toi chaque jour pour maintenir ton streak !',
            'Bonus débloqués automatiquement :',
            '> **3 jours** → +50🪙 · **7 jours** → +150🪙',
            '> **14 jours** → +300🪙 · **30 jours** → +750🪙',
            '⚠️ Si tu sautes un jour (>48h), le streak repart à 0.',
          ].join('\n'),
        },
      );

    const embed2 = new EmbedBuilder().setColor(RPB.GoldColor).addFields(
      {
        name: '🃏 Tirer des cartes',
        value: [
          '`/gacha gacha` — Tirage unique (**50🪙**)',
          '`/gacha multi` — Tirage x10 (**450🪙**, -10%)',
          '',
          '**Taux de drop :**',
          '> 💨 Raté — **35%** (tu perds tes pièces !)',
          '> ⚪ Commune — **30%** · 🔵 Rare — **20%**',
          '> 🟣 Épique — **10%** · 🟡 Légendaire — **4%**',
          '> 🔴 Secrète — **1%** (Ryuga L-Drago Destructor)',
        ].join('\n'),
      },
      {
        name: '⭐ Wishlist',
        value: [
          '`/gacha wish <nom>` — Ajoute une carte à ta wishlist',
          '`/gacha wishlist` — Affiche ta wishlist',
          '',
          'Quand une carte souhaitée tombe, tu reçois un **embed doré** spécial !',
          'Réutilise `/gacha wish <nom>` pour retirer une carte.',
        ].join('\n'),
      },
      {
        name: '📖 Consulter',
        value: [
          '`/gacha solde` — Ton profil : pièces, streak, progression, badge',
          '`/gacha collection` — Tes cartes obtenues par rareté',
          '`/gacha catalogue [série]` — Toutes les cartes du jeu',
          '`/gacha classement` — Top 10 des collectionneurs',
          '`/gacha taux` — Tableau récapitulatif des mécaniques',
        ].join('\n'),
      },
    );

    const embed3 = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .addFields(
        {
          name: '🏅 Badges de collection',
          value: [
            'Des badges sont débloqués automatiquement quand tu atteins un palier :',
            '',
            '> 🥉 **Débutant** (5 cartes) → +200🪙',
            '> 🥈 **Collectionneur** (10 cartes) → +500🪙',
            '> 🥇 **Expert** (15 cartes) → +750🪙',
            '> 🏆 **Maître** (20 cartes) → +1 000🪙',
            '> 👑 **Champion** (25 cartes) → +1 500🪙',
            '> ⭐ **Légende** (31/31 cartes) → +3 000🪙',
          ].join('\n'),
        },
        {
          name: '💡 Astuces',
          value: [
            '• Commence par `/gacha daily` chaque jour pour accumuler des pièces',
            '• Utilise `/gacha multi` pour optimiser tes tirages (-10%)',
            '• Mets en wishlist les cartes que tu veux le plus',
            '• Vends tes doublons pour financer de nouveaux tirages',
            '• Le streak est crucial : 30 jours = +750🪙 bonus !',
            '• La carte **Ryuga L-Drago Destructor** 🔴 a 1% de chance — bonne chance !',
          ].join('\n'),
        },
        {
          name: '📦 Cartes disponibles',
          value: [
            '**Metal Masters** — 17 cartes (Gingka, Kyoya, Masamune, Julian, Damian...)',
            '**Metal Fury** — 14 cartes (Cosmic Gingka, Ryuga, Chris, Aguma, King...)',
            '',
            '🔴 1 carte Secrète · 🟡 3 Légendaires · 🟣 8 Épiques · 🔵 7 Rares · ⚪ 12 Communes',
          ].join('\n'),
        },
      )
      .setFooter({ text: 'RPB Gacha — Collectionne-les tous ! 🌀' });

    return interaction.reply({ embeds: [embed1, embed2, embed3] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /gacha daily — Récompense quotidienne avec tiers + streak
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'daily', description: 'Réclame tes pièces quotidiennes' })
  async daily(interaction: CommandInteraction) {
    await interaction.deferReply();
    const profile = await this.getOrCreateProfile(interaction.user.id);
    const now = new Date();

    // Cooldown check (20h like Mudae)
    if (profile.lastDaily) {
      const diff = now.getTime() - profile.lastDaily.getTime();
      const hoursLeft = 20 - diff / 3_600_000;
      if (hoursLeft > 0) {
        const h = Math.floor(hoursLeft);
        const m = Math.floor((hoursLeft - h) * 60);
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Warning)
              .setTitle('⏳ Trop tôt !')
              .setDescription(
                `Reviens dans **${h}h ${m}min**.\n\n🔥 Streak actuel : **${profile.dailyStreak} jours**`,
              ),
          ],
        });
      }
    }

    // Streak: consecutive if last daily was < 48h ago
    let newStreak = 1;
    if (profile.lastDaily) {
      const hoursSince =
        (now.getTime() - profile.lastDaily.getTime()) / 3_600_000;
      if (hoursSince < 48) {
        newStreak = profile.dailyStreak + 1;
      }
      // else streak resets to 1
    }

    // Roll tier
    const { amount, msg, tier } = rollDaily();
    const tierColors = [
      Colors.Info,
      Colors.Success,
      Colors.Warning,
      0xfbbf24,
      0xef4444,
    ];

    // Streak bonus
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
      where: { userId: interaction.user.id },
      data: {
        currency: { increment: totalGain },
        lastDaily: now,
        dailyStreak: newStreak,
      },
    });

    await this.prisma.currencyTransaction.create({
      data: {
        userId: interaction.user.id,
        amount: totalGain,
        type: 'DAILY_CLAIM',
        note: `Tier ${tier + 1} — Streak ${newStreak}`,
      },
    });

    if (streakBonus > 0) {
      await this.prisma.currencyTransaction.create({
        data: {
          userId: interaction.user.id,
          amount: streakBonus,
          type: 'STREAK_BONUS',
          note: `Streak ${newStreak} jours`,
        },
      });
    }

    const newBalance = profile.currency + totalGain;
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
            `${msg}${streakMsg}\n\n💰 Solde : **${newBalance.toLocaleString('fr-FR')} pièces**\n${streakBar}`,
          )
          .setFooter({
            text: `Streak : ${newStreak} jour${newStreak > 1 ? 's' : ''} · Prochain dans 20h`,
          }),
      ],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco solde — Profil enrichi
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'solde', description: 'Affiche ton profil économie' })
  async balance(interaction: CommandInteraction) {
    const profile = await this.getOrCreateProfile(interaction.user.id);
    const [uniqueCards, totalCopies, totalCards, wishCount] = await Promise.all(
      [
        this.prisma.cardInventory.count({
          where: { userId: interaction.user.id },
        }),
        this.prisma.cardInventory.aggregate({
          where: { userId: interaction.user.id },
          _sum: { count: true },
        }),
        this.prisma.gachaCard.count({ where: { isActive: true } }),
        this.prisma.cardWishlist.count({ where: { profileId: profile.id } }),
      ],
    );

    // Calculate collection percentage
    const pct =
      totalCards > 0 ? Math.round((uniqueCards / totalCards) * 100) : 0;
    const progressBar =
      '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));

    // Current badge
    let currentBadge = '';
    for (const badge of [...BADGES].reverse()) {
      if (uniqueCards >= badge.count) {
        currentBadge = `${badge.emoji} ${badge.name}`;
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
            {
              name: '⭐ Wishlist',
              value: `**${wishCount}** carte${wishCount !== 1 ? 's' : ''}`,
              inline: true,
            },
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
                        ? ` → ${nextBadge.emoji} ${nextBadge.name} (${nextBadge.count} cartes)`
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

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco gacha — Tirage unique
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'gacha', description: `Tire une carte (${GACHA_COST} 🪙)` })
  async gacha(interaction: CommandInteraction) {
    await interaction.deferReply();
    const profile = await this.getOrCreateProfile(interaction.user.id);

    if (profile.currency < GACHA_COST) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Error)
            .setTitle('❌ Pièces insuffisantes')
            .setDescription(
              `Il te faut **${GACHA_COST}** 🪙 · Ton solde : **${profile.currency}** 🪙\n\nUtilise \`/eco daily\` !`,
            ),
        ],
      });
    }

    await this.prisma.profile.update({
      where: { userId: interaction.user.id },
      data: { currency: { decrement: GACHA_COST } },
    });
    await this.prisma.currencyTransaction.create({
      data: {
        userId: interaction.user.id,
        amount: -GACHA_COST,
        type: 'GACHA_PULL',
        note: 'Tirage x1',
      },
    });

    const result = await this.pullCard(interaction.user.id, profile.id);
    const embed = this.buildPullEmbed(result, profile.currency - GACHA_COST);

    const reply = await interaction.editReply({ embeds: [embed] });

    // Check badges after pull
    if (result.card) {
      const badgeMsg = await this.checkBadges(interaction.user.id, profile.id);
      if (badgeMsg) {
        await reply.reply({ content: badgeMsg });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco multi — Multi-pull x10 (discount)
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({
    name: 'multi',
    description: `Tire 10 cartes d'un coup (${MULTI_PULL_COST} 🪙, -10%)`,
  })
  async multi(interaction: CommandInteraction) {
    await interaction.deferReply();
    const profile = await this.getOrCreateProfile(interaction.user.id);

    if (profile.currency < MULTI_PULL_COST) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Error)
            .setTitle('❌ Pièces insuffisantes')
            .setDescription(
              `Multi x10 coûte **${MULTI_PULL_COST}** 🪙 · Ton solde : **${profile.currency}** 🪙`,
            ),
        ],
      });
    }

    await this.prisma.profile.update({
      where: { userId: interaction.user.id },
      data: { currency: { decrement: MULTI_PULL_COST } },
    });
    await this.prisma.currencyTransaction.create({
      data: {
        userId: interaction.user.id,
        amount: -MULTI_PULL_COST,
        type: 'MULTI_PULL',
        note: 'Tirage x10',
      },
    });

    // Pull 10
    const results: PullResult[] = [];
    for (let i = 0; i < MULTI_PULL_COUNT; i++) {
      results.push(await this.pullCard(interaction.user.id, profile.id));
    }

    // Build summary
    const hits = results.filter((r) => r.card);
    const misses = results.filter((r) => !r.card);
    const lines: string[] = [];

    for (const r of results) {
      if (r.card) {
        const cfg = RARITY_CONFIG[r.rarity!]!;
        const dupe = r.isDuplicate ? ' *(doublon)*' : ' ✨';
        lines.push(`${cfg.emoji} **${r.card.name}** — ${cfg.label}${dupe}`);
      } else {
        lines.push('💨 *Raté*');
      }
    }

    const bestRarity = hits.reduce((best, r) => {
      const order: CardRarityType[] = [
        'COMMON',
        'RARE',
        'EPIC',
        'LEGENDARY',
        'SECRET',
      ];
      const rIdx = order.indexOf(r.rarity!);
      const bIdx = order.indexOf(best);
      return rIdx > bIdx ? r.rarity! : best;
    }, 'COMMON' as CardRarityType);

    const color =
      hits.length > 0
        ? (RARITY_CONFIG[bestRarity]?.color ?? Colors.Info)
        : 0x4b5563;

    const embed = new EmbedBuilder()
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
        text: `Économie : ${GACHA_COST * MULTI_PULL_COUNT - MULTI_PULL_COST}🪙 par rapport à ${MULTI_PULL_COUNT} tirages individuels`,
      });

    const reply = await interaction.editReply({ embeds: [embed] });

    // Check badges
    if (hits.length > 0) {
      const badgeMsg = await this.checkBadges(interaction.user.id, profile.id);
      if (badgeMsg) await reply.reply({ content: badgeMsg });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco wish — Wishlist
  // ═══════════════════════════════════════════════════════════════════════════
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
    const profile = await this.getOrCreateProfile(interaction.user.id);

    // Find card
    const card = await this.prisma.gachaCard.findFirst({
      where: {
        OR: [
          { name: { contains: cardName, mode: 'insensitive' } },
          { slug: { contains: cardName.toLowerCase().replace(/\s+/g, '-') } },
        ],
        isActive: true,
      },
    });

    if (!card) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Error)
            .setDescription(
              `Carte "${cardName}" introuvable. Utilise \`/eco catalogue\` pour voir les cartes.`,
            ),
        ],
        ephemeral: true,
      });
    }

    // Toggle wishlist
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
    const cfg = RARITY_CONFIG[card.rarity]!;
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(cfg.color)
          .setTitle('⭐ Wishlist')
          .setDescription(
            `${cfg.emoji} **${card.name}** ajoutée à ta wishlist !\n\nQuand tu la drop, tu auras un message spécial.`,
          )
          .setThumbnail(card.imageUrl || ''),
      ],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco wishlist — Voir sa wishlist
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'wishlist', description: 'Affiche ta wishlist' })
  async wishlist(interaction: CommandInteraction) {
    const profile = await this.getOrCreateProfile(interaction.user.id);
    const wishes = await this.prisma.cardWishlist.findMany({
      where: { profileId: profile.id },
      include: { card: true },
    });

    if (wishes.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Info)
            .setDescription(
              'Ta wishlist est vide. Utilise `/eco wish <carte>` pour en ajouter !',
            ),
        ],
      });
    }

    // Check which ones are owned
    const owned = await this.prisma.cardInventory.findMany({
      where: {
        userId: interaction.user.id,
        cardId: { in: wishes.map((w) => w.cardId) },
      },
    });
    const ownedIds = new Set(owned.map((o) => o.cardId));

    const lines = wishes.map((w) => {
      const cfg = RARITY_CONFIG[w.card.rarity]!;
      const status = ownedIds.has(w.cardId) ? ' ✅' : '';
      return `${cfg.emoji} **${w.card.name}**${status}`;
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.GoldColor)
          .setTitle(`⭐ Wishlist de ${interaction.user.displayName}`)
          .setDescription(lines.join('\n'))
          .setFooter({
            text: `${wishes.length} carte${wishes.length > 1 ? 's' : ''} souhaitée${wishes.length > 1 ? 's' : ''}`,
          }),
      ],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco catalogue — Voir toutes les cartes
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({
    name: 'catalogue',
    description: 'Affiche toutes les cartes disponibles',
  })
  async catalogue(
    @SlashOption({
      name: 'série',
      description: 'Filtrer par série',
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

    if (cards.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setDescription('Aucune carte trouvée.'),
        ],
        ephemeral: true,
      });
    }

    const byRarity: Record<string, string[]> = {};
    for (const c of cards) {
      const r = c.rarity;
      if (!byRarity[r]) byRarity[r] = [];
      const cfg = RARITY_CONFIG[r]!;
      byRarity[r]?.push(`${cfg.emoji} **${c.name}** — ${c.beyblade || 'N/A'}`);
    }

    const embed = new EmbedBuilder()
      .setColor(RPB.Color)
      .setTitle('📖 Catalogue des cartes')
      .setDescription(`**${cards.length}** cartes disponibles`);

    for (const r of ['SECRET', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON']) {
      if (byRarity[r]?.length) {
        embed.addFields({
          name: `${RARITY_CONFIG[r]?.emoji} ${RARITY_CONFIG[r]?.label} (${byRarity[r]?.length})`,
          value: byRarity[r]?.join('\n'),
        });
      }
    }

    return interaction.reply({ embeds: [embed] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco collection — Collection avec badges
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'collection', description: 'Affiche ta collection' })
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
              'Utilise `/eco gacha` pour commencer ta collection !',
            ),
        ],
      });
    }

    const totalCards = await this.prisma.gachaCard.count({
      where: { isActive: true },
    });
    const pct = Math.round((inventory.length / totalCards) * 100);

    const byRarity: Record<string, string[]> = {};
    for (const inv of inventory) {
      const r = inv.card.rarity;
      if (!byRarity[r]) byRarity[r] = [];
      const cfg = RARITY_CONFIG[r]!;
      const dupe = inv.count > 1 ? ` (x${inv.count})` : '';
      byRarity[r]?.push(`${cfg.emoji} ${inv.card.name}${dupe}`);
    }

    const embed = new EmbedBuilder()
      .setColor(RPB.GoldColor)
      .setTitle(`🃏 Collection de ${interaction.user.displayName}`)
      .setDescription(
        `**${inventory.length}** / ${totalCards} cartes (${pct}%)`,
      )
      .setThumbnail(interaction.user.displayAvatarURL());

    for (const r of ['SECRET', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON']) {
      if (byRarity[r]?.length) {
        embed.addFields({
          name: `${RARITY_CONFIG[r]?.emoji} ${RARITY_CONFIG[r]?.label} (${byRarity[r]?.length})`,
          value: byRarity[r]?.join('\n'),
        });
      }
    }

    // Show earned badges
    const badgesList = BADGES.filter((b) => inventory.length >= b.count).map(
      (b) => `${b.emoji} ${b.name}`,
    );
    if (badgesList.length > 0) {
      embed.addFields({ name: '🏅 Badges', value: badgesList.join(' · ') });
    }

    return interaction.editReply({ embeds: [embed] });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco vendre — Vendre doublons
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'vendre', description: 'Vends un doublon' })
  async sell(interaction: CommandInteraction) {
    await interaction.deferReply();
    const duplicate = await this.prisma.cardInventory.findFirst({
      where: { userId: interaction.user.id, count: { gt: 1 } },
      include: { card: true },
      orderBy: { card: { rarity: 'asc' } },
    });

    if (!duplicate) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setDescription('Aucun doublon à vendre.'),
        ],
      });
    }

    const cfg = RARITY_CONFIG[duplicate.card.rarity]!;
    await this.prisma.cardInventory.update({
      where: { id: duplicate.id },
      data: { count: { decrement: 1 } },
    });
    await this.prisma.profile.update({
      where: { userId: interaction.user.id },
      data: { currency: { increment: cfg.sellPrice } },
    });
    await this.prisma.currencyTransaction.create({
      data: {
        userId: interaction.user.id,
        amount: cfg.sellPrice,
        type: 'SELL_CARD',
        note: `Vente: ${duplicate.card.name}`,
      },
    });

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Success)
          .setDescription(
            `${cfg.emoji} **${duplicate.card.name}** vendue pour **${cfg.sellPrice}** 🪙\nCopies restantes : ${duplicate.count - 1}`,
          ),
      ],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco classement — Leaderboard
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'classement', description: 'Classement des collectionneurs' })
  async leaderboard(interaction: CommandInteraction) {
    await interaction.deferReply();

    // Top by unique cards
    const topCollectors = await this.prisma.cardInventory.groupBy({
      by: ['userId'],
      _count: { cardId: true },
      orderBy: { _count: { cardId: 'desc' } },
      take: 10,
    });

    if (topCollectors.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Info)
            .setDescription("Personne n'a encore de cartes !"),
        ],
      });
    }

    const lines: string[] = [];
    const medals = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < topCollectors.length; i++) {
      const tc = topCollectors[i]!;
      const user = await this.prisma.user.findUnique({
        where: { id: tc.userId },
        select: { name: true, globalName: true },
      });
      const name = user?.globalName || user?.name || 'Inconnu';
      const medal = medals[i] || `**${i + 1}.**`;
      lines.push(`${medal} ${name} — **${tc._count.cardId}** cartes`);
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.GoldColor)
          .setTitle('🏆 Classement des collectionneurs')
          .setDescription(lines.join('\n')),
      ],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // /eco taux — Taux de drop
  // ═══════════════════════════════════════════════════════════════════════════
  @Slash({ name: 'taux', description: 'Affiche les taux et mécaniques' })
  async rates(interaction: CommandInteraction) {
    const totalCards = await this.prisma.gachaCard.count({
      where: { isActive: true },
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(RPB.Color)
          .setTitle('🎰 Mécaniques du Gacha')
          .setDescription(
            `**${totalCards} cartes** · Tirage : **${GACHA_COST}** 🪙 · Multi x10 : **${MULTI_PULL_COST}** 🪙`,
          )
          .addFields(
            {
              name: '📊 Taux de drop',
              value: [
                `💨 **Raté** — 35%`,
                `⚪ **Commune** — 30% (vente : 5🪙)`,
                `🔵 **Rare** — 20% (vente : 15🪙)`,
                `🟣 **Épique** — 10% (vente : 50🪙)`,
                `🟡 **Légendaire** — 4% (vente : 150🪙)`,
                `🔴 **Secrète** — 1% (vente : 500🪙)`,
              ].join('\n'),
            },
            {
              name: '🪙 Daily (toutes les 20h)',
              value: [
                `60% : 80-120🪙`,
                `25% : 150-200🪙`,
                `10% : 250-350🪙`,
                `4% : 500-700🪙 ⭐`,
                `1% : 1000-1500🪙 💎`,
              ].join('\n'),
              inline: true,
            },
            {
              name: '🔥 Bonus Streak',
              value: STREAK_BONUSES.map(
                (s) => `${s.label} : +${s.bonus}🪙`,
              ).join('\n'),
              inline: true,
            },
            {
              name: '🏅 Badges Collection',
              value: BADGES.map(
                (b) => `${b.emoji} ${b.count} cartes : +${b.reward}🪙`,
              ).join('\n'),
            },
          ),
      ],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Internal: Pull a single card
  // ═══════════════════════════════════════════════════════════════════════════
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

    // Check wishlist
    const isWished = await this.prisma.cardWishlist.findUnique({
      where: { profileId_cardId: { profileId, cardId: card.id } },
    });

    return { rarity, card, isDuplicate, isWished: !!isWished };
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

    const wishText = result.isWished
      ? '\n\n⭐ **CARTE SOUHAITÉE !** Cette carte était dans ta wishlist !'
      : '';
    const dupeText = result.isDuplicate
      ? `\n📋 *Doublon — Revends avec \`/eco vendre\`*`
      : '';

    const embed = new EmbedBuilder()
      .setColor(result.isWished ? 0xfbbf24 : cfg.color)
      .setTitle(result.isWished ? `⭐ ${title}` : title)
      .setDescription(
        `**${result.card.name}**${result.card.nameJp ? ` (${result.card.nameJp})` : ''}\n` +
          `${result.card.series.replace(/_/g, ' ')}\n\n` +
          `${result.card.description || ''}` +
          (result.card.beyblade
            ? `\n\n🌀 **Toupie :** ${result.card.beyblade}`
            : '') +
          wishText +
          dupeText,
      )
      .setFooter({ text: `💰 Solde : ${balance.toLocaleString('fr-FR')} 🪙` });

    if (result.card.imageUrl) embed.setThumbnail(result.card.imageUrl);
    return embed;
  }
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
