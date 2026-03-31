import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  type CommandInteraction,
  ComponentType,
  EmbedBuilder,
  type Message,
  StringSelectMenuBuilder,
  type User,
} from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';
import { inject, injectable } from 'tsyringe';

import { Colors, RPB } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';
import { PrismaService } from '../../lib/prisma.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CHALLENGE_TIMEOUT = 60_000;
const SELECTION_TIMEOUT = 90_000;
const ROUND_DELAY = 3_000;
const DUEL_COOLDOWN = 3 * 60_000;

const RARITY_POWER: Record<string, number> = {
  COMMON: 0,
  RARE: 12,
  SUPER_RARE: 28,
  LEGENDARY: 50,
  SECRET: 70,
};

const RARITY_EMOJI: Record<string, string> = {
  COMMON: '⚪',
  RARE: '🔵',
  SUPER_RARE: '🟣',
  LEGENDARY: '🟡',
  SECRET: '🔴',
};

const RARITY_LABEL: Record<string, string> = {
  COMMON: 'Commune',
  RARE: 'Rare',
  SUPER_RARE: 'Super Rare',
  LEGENDARY: 'Légendaire',
  SECRET: 'Secrète',
};

const ELEMENT_EMOJI: Record<string, string> = {
  FEU: '🔥',
  EAU: '💧',
  TERRE: '🌍',
  VENT: '🌪️',
  OMBRE: '🌑',
  LUMIERE: '✨',
  NEUTRAL: '⚪',
};

const ELEMENT_NAME: Record<string, string> = {
  FEU: 'Feu',
  EAU: 'Eau',
  TERRE: 'Terre',
  VENT: 'Vent',
  OMBRE: 'Ombre',
  LUMIERE: 'Lumière',
  NEUTRAL: 'Neutre',
};

const ELEMENT_BEATS: Record<string, string> = {
  FEU: 'VENT',
  VENT: 'TERRE',
  TERRE: 'EAU',
  EAU: 'FEU',
  OMBRE: 'LUMIERE',
  LUMIERE: 'OMBRE',
};

const FINISH_TYPES = [
  { min: 1.6, msg: '⚡ X-TREME FINISH !', emoji: '⚡', color: 0xfbbf24 },
  { min: 1.35, msg: '💥 BURST FINISH !', emoji: '💥', color: 0xef4444 },
  { min: 1.1, msg: '🔄 OVER FINISH !', emoji: '🔄', color: 0x8b5cf6 },
  { min: 0, msg: '🌀 SPIN FINISH !', emoji: '🌀', color: 0x22c55e },
];

const ROUND_INTROS = [
  ['Le sol tremble...', 'Les Beyblades sont lancées !', "C'est parti !"],
  ['La tension monte...', 'Deuxième confrontation !', 'Les arènes vibrent !'],
  [
    'Round décisif !',
    'Tout se joue maintenant !',
    "Dernière chance... C'est le moment de vérité !",
  ],
];

// Prevent concurrent duels
const activePlayers = new Set<string>();
const cooldowns = new Map<string, number>();

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DuelCard {
  id: string;
  name: string;
  rarity: string;
  element: string;
  att: number;
  def: number;
  end: number;
  equilibre: number;
  imageUrl: string | null;
  specialMove: string | null;
  beyblade: string | null;
  series: string;
}

interface RoundResult {
  cardA: DuelCard;
  cardB: DuelCard;
  powerA: number;
  powerB: number;
  winner: 'A' | 'B';
  events: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATTLE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function computePower(
  card: DuelCard,
  opponentElement: string,
): { power: number; events: string[] } {
  const events: string[] = [];

  // Base power from real card stats
  const base =
    card.att * 1.2 + card.def * 0.6 + card.end * 0.8 + card.equilibre * 0.4;
  const rarityBonus = RARITY_POWER[card.rarity] ?? 0;

  let mult = 1.0;

  // Element advantage (×1.5)
  if (ELEMENT_BEATS[card.element] === opponentElement) {
    mult *= 1.5;
    events.push(
      `${ELEMENT_EMOJI[card.element] ?? ''} **${ELEMENT_NAME[card.element]}** domine **${ELEMENT_NAME[opponentElement]}** !`,
    );
  }
  // Element disadvantage (×0.75)
  else if (ELEMENT_BEATS[opponentElement] === card.element) {
    mult *= 0.75;
  }

  // Critical hit (12%)
  if (Math.random() < 0.12) {
    mult *= 1.4;
    events.push('⚡ **Coup critique** — puissance décuplée !');
  }

  // Special move trigger (10% if card has one)
  if (card.specialMove && Math.random() < 0.1) {
    mult *= 1.35;
    events.push(`💫 **${card.specialMove}** déclenché !`);
  }

  // Defense wall (8% — defender absorbs damage)
  if (card.def > 60 && Math.random() < 0.08) {
    mult *= 0.7;
    events.push('🛡️ **Mur de défense** — impact absorbé !');
  }

  // Random variance (±15%)
  const variance = 0.85 + Math.random() * 0.3;

  return {
    power: Math.round((base + rarityBonus) * mult * variance * 100) / 100,
    events,
  };
}

function resolveRound(cardA: DuelCard, cardB: DuelCard): RoundResult {
  const a = computePower(cardA, cardB.element);
  const b = computePower(cardB, cardA.element);

  return {
    cardA,
    cardB,
    powerA: a.power,
    powerB: b.power,
    winner: a.power >= b.power ? 'A' : 'B',
    events: [...a.events, ...b.events],
  };
}

function getFinish(avgRatio: number) {
  return FINISH_TYPES.find((f) => avgRatio >= f.min) ?? FINISH_TYPES[3]!;
}

function cardSortPower(c: {
  att: number;
  def: number;
  end: number;
  equilibre: number;
}): number {
  return c.att + c.def + c.end + c.equilibre;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND
// ═══════════════════════════════════════════════════════════════════════════════

@Discord()
@injectable()
export class DuelCommand {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  private async ensureProfile(discordId: string, displayName: string) {
    let user = await this.prisma.user.findUnique({
      where: { discordId },
      include: { profile: true },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          discordId,
          name: displayName,
          email: `${discordId}@discord.rpbey.fr`,
          profile: { create: {} },
        },
        include: { profile: true },
      });
    }
    if (!user.profile) {
      const profile = await this.prisma.profile.create({
        data: { userId: user.id },
      });
      return { ...user, profile };
    }
    return user;
  }

  @Slash({
    name: 'duel',
    description:
      '⚔️ Duel stratégique — Choisis 3 cartes et affronte un adversaire !',
  })
  async duel(
    @SlashOption({
      name: 'adversaire',
      description: 'Le joueur à défier',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    @SlashOption({
      name: 'mise',
      description: 'Mise en pièces (0 = amical)',
      required: false,
      type: ApplicationCommandOptionType.Integer,
      minValue: 0,
      maxValue: 5000,
    })
    bet: number = 0,
    interaction: CommandInteraction,
  ) {
    // ── Validations ──

    if (target.id === interaction.user.id)
      return interaction.reply({
        content: '❌ Tu ne peux pas te défier toi-même !',
        ephemeral: true,
      });
    if (target.bot)
      return interaction.reply({
        content: '❌ Pas de duel contre un bot !',
        ephemeral: true,
      });
    if (activePlayers.has(interaction.user.id) || activePlayers.has(target.id))
      return interaction.reply({
        content: '❌ Un des joueurs est déjà en duel !',
        ephemeral: true,
      });

    const now = Date.now();
    const cd = cooldowns.get(interaction.user.id) ?? 0;
    if (now < cd) {
      const secs = Math.ceil((cd - now) / 1000);
      return interaction.reply({
        content: `⏳ Cooldown : **${secs}s** avant un nouveau duel.`,
        ephemeral: true,
      });
    }

    const [userA, userB] = await Promise.all([
      this.ensureProfile(interaction.user.id, interaction.user.displayName),
      this.ensureProfile(target.id, target.displayName),
    ]);

    const [invA, invB] = await Promise.all([
      this.prisma.cardInventory.findMany({
        where: { userId: userA.id },
        include: { card: true },
      }),
      this.prisma.cardInventory.findMany({
        where: { userId: userB.id },
        include: { card: true },
      }),
    ]);

    if (invA.length < 3)
      return interaction.reply({
        content: `❌ Il te faut **3 cartes** minimum ! (${invA.length}/3) — \`/gacha gacha\``,
        ephemeral: true,
      });
    if (invB.length < 3)
      return interaction.reply({
        content: `❌ **${target.displayName}** a besoin de **3 cartes** minimum ! (${invB.length}/3)`,
        ephemeral: true,
      });

    if (bet > 0 && (userA.profile?.currency ?? 0) < bet)
      return interaction.reply({
        content: `❌ Solde insuffisant ! (${userA.profile?.currency ?? 0} 🪙)`,
        ephemeral: true,
      });
    if (bet > 0 && (userB.profile?.currency ?? 0) < bet)
      return interaction.reply({
        content: `❌ **${target.displayName}** n'a pas assez de 🪙 !`,
        ephemeral: true,
      });

    // ── Lock players ──

    activePlayers.add(interaction.user.id);
    activePlayers.add(target.id);
    const cleanup = () => {
      activePlayers.delete(interaction.user.id);
      activePlayers.delete(target.id);
    };

    try {
      await this.runDuel(interaction, target, bet, userA, userB, invA, invB);
    } catch (err) {
      logger.error('[Duel] Unexpected error:', err);
      try {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Erreur')
              .setDescription('Le duel a été interrompu.')
              .setColor(Colors.Error),
          ],
          components: [],
        });
      } catch {
        /* already cleaned up */
      }
    } finally {
      cleanup();
    }
  }

  private async runDuel(
    interaction: CommandInteraction,
    target: User,
    bet: number,
    userA: { id: string; profile: { currency: number } | null },
    userB: { id: string; profile: { currency: number } | null },
    invA: Array<{
      card: {
        id: string;
        name: string;
        rarity: string;
        element: string;
        att: number;
        def: number;
        end: number;
        equilibre: number;
        imageUrl: string | null;
        specialMove: string | null;
        beyblade: string | null;
        series: string;
      };
    }>,
    invB: Array<{
      card: {
        id: string;
        name: string;
        rarity: string;
        element: string;
        att: number;
        def: number;
        end: number;
        equilibre: number;
        imageUrl: string | null;
        specialMove: string | null;
        beyblade: string | null;
        series: string;
      };
    }>,
  ) {
    const nameA = interaction.user.displayName;
    const nameB = target.displayName;
    const duelId = Date.now().toString(36);

    // ══════════════ PHASE 1: CHALLENGE ══════════════

    const challengeEmbed = new EmbedBuilder()
      .setTitle('⚔️ Défi en Duel !')
      .setDescription(
        `**${interaction.user}** défie **${target}** !\n\n` +
          `📋 **Format :** Best of 3 — Choisis 3 cartes\n` +
          `🎯 **Matchup :** Les cartes sont triées par puissance et opposées rang par rang\n` +
          `💰 **Mise :** ${bet > 0 ? `**${bet}** 🪙 chacun` : 'Aucune (amical)'}\n\n` +
          `${target}, acceptes-tu le défi ?`,
      )
      .setColor(Colors.Primary)
      .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
      .setFooter({ text: 'Expire dans 60 secondes' });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`duel-accept-${duelId}`)
        .setLabel('⚔️ Accepter')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`duel-decline-${duelId}`)
        .setLabel('Refuser')
        .setStyle(ButtonStyle.Secondary),
    );

    const challengeMsg = (await interaction.reply({
      embeds: [challengeEmbed],
      components: [buttons],
      fetchReply: true,
    })) as Message;

    // Wait for opponent
    let btnResponse;
    try {
      btnResponse = await challengeMsg.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === target.id,
        time: CHALLENGE_TIMEOUT,
      });
    } catch {
      return interaction.editReply({
        embeds: [
          challengeEmbed
            .setDescription(
              `⏰ **${nameB}** n'a pas répondu à temps.\nLe défi est annulé.`,
            )
            .setColor(Colors.Warning),
        ],
        components: [],
      });
    }

    if (btnResponse.customId.includes('decline')) {
      return btnResponse.update({
        embeds: [
          challengeEmbed
            .setDescription(`${nameB} a **refusé** le duel.`)
            .setColor(Colors.Error),
        ],
        components: [],
      });
    }

    // ══════════════ PHASE 2: CARD SELECTION ══════════════

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎴 Sélection des cartes...')
          .setDescription(
            `${nameA} et ${nameB} choisissent leurs 3 cartes.\n⏳ **90 secondes** pour décider.`,
          )
          .setColor(Colors.Secondary),
      ],
      components: [],
    });

    const buildOptions = (inv: typeof invA) =>
      inv
        .sort((a, b) => cardSortPower(b.card) - cardSortPower(a.card))
        .slice(0, 25)
        .map((item) => {
          const c = item.card;
          const pwr = c.att + c.def + c.end;
          const el = ELEMENT_EMOJI[c.element] ?? '⚪';
          const rar = RARITY_LABEL[c.rarity] ?? c.rarity;
          let desc = `${rar} · ${el} ${ELEMENT_NAME[c.element] ?? c.element} · PWR ${pwr}`;
          if (desc.length > 100) desc = `${desc.slice(0, 97)}...`;
          let label = c.name;
          if (label.length > 100) label = `${label.slice(0, 97)}...`;
          return { label, description: desc, value: c.id };
        });

    const menuA = new StringSelectMenuBuilder()
      .setCustomId(`duel-sel-a-${duelId}`)
      .setPlaceholder('Choisis 3 cartes...')
      .setMinValues(3)
      .setMaxValues(3)
      .addOptions(buildOptions(invA));

    const menuB = new StringSelectMenuBuilder()
      .setCustomId(`duel-sel-b-${duelId}`)
      .setPlaceholder('Choisis 3 cartes...')
      .setMinValues(3)
      .setMaxValues(3)
      .addOptions(buildOptions(invB));

    const [selMsgA, selMsgB] = await Promise.all([
      interaction.followUp({
        content:
          '🎴 **Choisis 3 cartes** pour le duel :\n> Tes cartes seront opposées **rang par rang** (forte vs forte).',
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menuA),
        ],
        ephemeral: true,
      }),
      btnResponse.reply({
        content:
          '🎴 **Choisis 3 cartes** pour le duel :\n> Tes cartes seront opposées **rang par rang** (forte vs forte).',
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menuB),
        ],
        ephemeral: true,
        fetchReply: true,
      }),
    ]);

    // Wait for both selections
    const awaitSel = (msg: Message, userId: string): Promise<string[]> =>
      new Promise((resolve, reject) => {
        const collector = msg.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          filter: (i) => i.user.id === userId,
          time: SELECTION_TIMEOUT,
          max: 1,
        });
        collector.on('collect', async (i) => {
          await i.update({
            content:
              '✅ Cartes sélectionnées ! En attente de ton adversaire...',
            components: [],
          });
          resolve(i.values);
        });
        collector.on('end', (collected) => {
          if (collected.size === 0) reject(new Error('timeout'));
        });
      });

    let picksA: string[];
    let picksB: string[];
    try {
      [picksA, picksB] = await Promise.all([
        awaitSel(selMsgA as Message, interaction.user.id),
        awaitSel(selMsgB as Message, target.id),
      ]);
    } catch {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⏰ Temps écoulé !')
            .setDescription(
              "Un joueur n'a pas sélectionné ses cartes à temps.\nLe duel est annulé.",
            )
            .setColor(Colors.Error),
        ],
      });
    }

    // ══════════════ PHASE 3: BATTLE ══════════════

    const toCard = (inv: typeof invA, ids: string[]): DuelCard[] =>
      ids
        .map((id) => {
          const item = inv.find((i) => i.card.id === id);
          if (!item) return null;
          const c = item.card;
          return {
            id: c.id,
            name: c.name,
            rarity: c.rarity,
            element: c.element,
            att: c.att,
            def: c.def,
            end: c.end,
            equilibre: c.equilibre,
            imageUrl: c.imageUrl,
            specialMove: c.specialMove,
            beyblade: c.beyblade ?? '???',
            series: c.series,
          };
        })
        .filter(Boolean) as DuelCard[];

    // Sort by power rank for matchups (strongest vs strongest)
    const cardsA = toCard(invA, picksA).sort(
      (a, b) => cardSortPower(b) - cardSortPower(a),
    );
    const cardsB = toCard(invB, picksB).sort(
      (a, b) => cardSortPower(b) - cardSortPower(a),
    );

    if (cardsA.length < 3 || cardsB.length < 3) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription('❌ Erreur lors de la résolution des cartes.')
            .setColor(Colors.Error),
        ],
      });
    }

    // Deduct bets
    if (bet > 0) {
      await Promise.all([
        this.prisma.profile.update({
          where: { userId: userA.id },
          data: { currency: { decrement: bet } },
        }),
        this.prisma.profile.update({
          where: { userId: userB.id },
          data: { currency: { decrement: bet } },
        }),
      ]);
    }

    // Play 3 rounds with dramatic reveals
    const rounds: RoundResult[] = [];
    let scoreA = 0;
    let scoreB = 0;

    for (let i = 0; i < 3; i++) {
      const result = resolveRound(cardsA[i]!, cardsB[i]!);
      rounds.push(result);
      if (result.winner === 'A') scoreA++;
      else scoreB++;

      const intro = randomPick(ROUND_INTROS[i]!);
      const winName = result.winner === 'A' ? nameA : nameB;
      const elA = ELEMENT_EMOJI[result.cardA.element] ?? '⚪';
      const elB = ELEMENT_EMOJI[result.cardB.element] ?? '⚪';
      const rarA = RARITY_EMOJI[result.cardA.rarity] ?? '⚪';
      const rarB = RARITY_EMOJI[result.cardB.rarity] ?? '⚪';

      const roundEmbed = new EmbedBuilder()
        .setTitle(`⚔️ Round ${i + 1} — ${intro}`)
        .addFields(
          {
            name: `${nameA}`,
            value:
              `${rarA} **${result.cardA.name}**\n` +
              `${elA} ${ELEMENT_NAME[result.cardA.element] ?? 'Neutre'}\n` +
              `ATT \`${result.cardA.att}\` · DEF \`${result.cardA.def}\` · END \`${result.cardA.end}\`\n` +
              `**Puissance : ${Math.round(result.powerA)}**`,
            inline: true,
          },
          {
            name: 'VS',
            value: '⚔️',
            inline: true,
          },
          {
            name: `${nameB}`,
            value:
              `${rarB} **${result.cardB.name}**\n` +
              `${elB} ${ELEMENT_NAME[result.cardB.element] ?? 'Neutre'}\n` +
              `ATT \`${result.cardB.att}\` · DEF \`${result.cardB.def}\` · END \`${result.cardB.end}\`\n` +
              `**Puissance : ${Math.round(result.powerB)}**`,
            inline: true,
          },
        )
        .setColor(result.winner === 'A' ? 0x22c55e : 0xef4444);

      if (result.events.length > 0) {
        roundEmbed.addFields({
          name: '💥 Événements',
          value: result.events.join('\n'),
        });
      }

      roundEmbed
        .addFields({
          name: 'Résultat',
          value: `🏆 **${winName}** remporte le round !`,
        })
        .setFooter({ text: `Score : ${scoreA} — ${scoreB}` });

      await interaction.editReply({ embeds: [roundEmbed] });

      // Early win check (2-0)
      if (scoreA >= 2 || scoreB >= 2) {
        if (i < 2) {
          // Skip remaining rounds
          break;
        }
      }

      if (i < 2) {
        await new Promise((r) => setTimeout(r, ROUND_DELAY));
      }
    }

    // ══════════════ PHASE 4: RESULTS ══════════════

    const matchWinner = scoreA > scoreB ? 'A' : 'B';
    const winnerName = matchWinner === 'A' ? nameA : nameB;
    const loserId = matchWinner === 'A' ? userB.id : userA.id;
    const winnerId = matchWinner === 'A' ? userA.id : userB.id;
    const winnerDiscordId =
      matchWinner === 'A' ? interaction.user.id : target.id;

    // Finish type
    const avgRatio =
      rounds.reduce((sum, r) => {
        const w = r.winner === 'A' ? r.powerA : r.powerB;
        const l = r.winner === 'A' ? r.powerB : r.powerA;
        return sum + w / Math.max(l, 1);
      }, 0) / rounds.length;
    const finish = getFinish(avgRatio);

    // Reward calculation
    const baseReward = Math.round(
      rounds.reduce((s, r) => s + Math.max(r.powerA, r.powerB), 0) / 4,
    );
    const totalReward =
      bet > 0 ? bet * 2 : Math.max(15, Math.min(baseReward, 200));
    const loserReward = bet > 0 ? 0 : 5; // Participation reward if no bet

    // Award
    await Promise.all([
      this.prisma.profile.update({
        where: { userId: winnerId },
        data: { currency: { increment: totalReward } },
      }),
      this.prisma.currencyTransaction.create({
        data: {
          userId: winnerId,
          amount: totalReward,
          type: 'DUEL_REWARD',
          note: `Duel victoire (${scoreA}-${scoreB}) — ${finish.msg}`,
        },
      }),
      ...(loserReward > 0
        ? [
            this.prisma.profile.update({
              where: { userId: loserId },
              data: { currency: { increment: loserReward } },
            }),
            this.prisma.currencyTransaction.create({
              data: {
                userId: loserId,
                amount: loserReward,
                type: 'DUEL_REWARD',
                note: `Duel défaite (participation)`,
              },
            }),
          ]
        : []),
    ]);

    // Save match
    const match = await this.prisma.duelMatch.create({
      data: {
        challengerId: interaction.user.id,
        opponentId: target.id,
        winnerId: winnerDiscordId,
        bet,
        score: `${scoreA}-${scoreB}`,
        finishType: finish.msg,
        rounds: rounds.map((r) => ({
          cardA: {
            name: r.cardA.name,
            rarity: r.cardA.rarity,
            element: r.cardA.element,
          },
          cardB: {
            name: r.cardB.name,
            rarity: r.cardB.rarity,
            element: r.cardB.element,
          },
          powerA: Math.round(r.powerA),
          powerB: Math.round(r.powerB),
          winner: r.winner,
          events: r.events,
        })),
      },
    });

    // Set cooldowns
    cooldowns.set(interaction.user.id, Date.now() + DUEL_COOLDOWN);
    cooldowns.set(target.id, Date.now() + DUEL_COOLDOWN);

    // Brief pause for suspense
    await new Promise((r) => setTimeout(r, 1500));

    // Generate canvas
    try {
      const { generateDuelArenaCard } = await import(
        '../../lib/canvas-utils.js'
      );

      const buffer = await generateDuelArenaCard({
        playerA: {
          name: nameA,
          avatarUrl: interaction.user.displayAvatarURL({
            extension: 'png',
            size: 128,
          }),
        },
        playerB: {
          name: nameB,
          avatarUrl: target.displayAvatarURL({ extension: 'png', size: 128 }),
        },
        rounds: rounds.map((r) => ({
          cardA: {
            name: r.cardA.name,
            rarity: r.cardA.rarity,
            element: r.cardA.element,
            imageUrl: r.cardA.imageUrl,
            power: Math.round(r.powerA),
            beyblade: r.cardA.beyblade,
          },
          cardB: {
            name: r.cardB.name,
            rarity: r.cardB.rarity,
            element: r.cardB.element,
            imageUrl: r.cardB.imageUrl,
            power: Math.round(r.powerB),
            beyblade: r.cardB.beyblade,
          },
          winner: r.winner,
          events: r.events,
        })),
        score: [scoreA, scoreB],
        winner: matchWinner,
        bet,
        coinReward: totalReward,
        finishMessage: finish.msg,
        matchId: match.id.slice(-8),
      });

      await interaction.editReply({
        embeds: [],
        files: [new AttachmentBuilder(buffer, { name: 'duel-arena.png' })],
        components: [],
      });
    } catch (err) {
      logger.error('[Duel] Canvas failed:', err);
    }

    // Final summary (always sent as followUp so everyone sees it)
    const summaryLines = rounds.map((r, i) => {
      const wEmoji = r.winner === 'A' ? '🟢' : '🔴';
      return `**R${i + 1}** ${wEmoji} ${r.cardA.name} (${Math.round(r.powerA)}) vs ${r.cardB.name} (${Math.round(r.powerB)})`;
    });

    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${finish.emoji} ${finish.msg}`)
          .setDescription(
            `🏆 **${winnerName}** remporte le duel ! (**${scoreA}**—**${scoreB}**)\n\n` +
              summaryLines.join('\n') +
              '\n\n' +
              `💰 **+${totalReward} 🪙** pour ${winnerName}` +
              (loserReward > 0 ? ` · +${loserReward} 🪙 participation` : '') +
              (bet > 0 ? `\n🎰 Mise : ${bet} 🪙 chacun` : ''),
          )
          .setColor(finish.color)
          .setFooter({ text: `Match #${match.id.slice(-8)} · ${RPB.Name}` })
          .setTimestamp(),
      ],
    });
  }
}
