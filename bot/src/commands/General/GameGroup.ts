import fs from 'node:fs';

import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  type CommandInteraction,
  EmbedBuilder,
  type User,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { inject, injectable } from 'tsyringe';

import { p as parseNum } from '../../lib/battle-utils.js';
import {
  type ComboCardData,
  generateBattleCard,
  generateComboCard,
} from '../../lib/canvas-utils.js';
import { Colors, RPB } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';
import { resolveDataPath } from '../../lib/paths.js';
import { PrismaService } from '../../lib/prisma.js';

// ─── Static JSON Stats ─────────────────────────────────────────────────────
interface BladeJson {
  name: string;
  spin: string;
  stats: { attack: string; defense: string; stamina: string; weight: number };
}
interface RatchetJson {
  name: string;
  stats: { attack: string; defense: string; stamina: string; weight: number };
}
interface BitJson {
  name: string;
  code: string;
  stats: {
    attack: string;
    defense: string;
    stamina: string;
    dash: string;
    burst: string;
    weight: number;
    type: string;
  };
}

function loadJsonData<T>(filename: string): T[] {
  const candidates = [resolveDataPath('cleaned', filename)];
  for (const p of candidates) {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }
  return [];
}

const BLADE_DATA = loadJsonData<BladeJson>('blades.json');
const RATCHET_DATA = loadJsonData<RatchetJson>('ratchets.json');
const BIT_DATA = loadJsonData<BitJson>('bits.json');

function normalize(name: string) {
  return name.replace(/[\s-]/g, '').toLowerCase();
}
function findBladeStats(name: string) {
  return BLADE_DATA.find((b) => normalize(b.name) === normalize(name));
}
function findRatchetStats(name: string) {
  return RATCHET_DATA.find((r) => normalize(r.name) === normalize(name));
}
function findBitStats(name: string) {
  return BIT_DATA.find(
    (b) => normalize(b.name) === normalize(name) || b.code === name,
  );
}

const FINISH_TYPES = [
  { result: 'xtreme', message: '⚡ X-TREME FINISH !', points: 3, emoji: '⚡' },
  { result: 'burst', message: '💥 BURST FINISH !', points: 2, emoji: '💥' },
  { result: 'over', message: '🔄 OVER FINISH !', points: 2, emoji: '🔄' },
  { result: 'spin', message: '🌀 SPIN FINISH !', points: 1, emoji: '🌀' },
];

interface ComboStats {
  attack: number;
  defense: number;
  stamina: number;
  dash: number;
  burst: number;
  weight: number;
}

function computeComboStats(
  blade: BladeJson | undefined,
  ratchet: RatchetJson | undefined,
  bit: BitJson | undefined,
): ComboStats {
  return {
    attack:
      parseNum(blade?.stats.attack) +
      parseNum(ratchet?.stats.attack) +
      parseNum(bit?.stats.attack),
    defense:
      parseNum(blade?.stats.defense) +
      parseNum(ratchet?.stats.defense) +
      parseNum(bit?.stats.defense),
    stamina:
      parseNum(blade?.stats.stamina) +
      parseNum(ratchet?.stats.stamina) +
      parseNum(bit?.stats.stamina),
    dash: parseNum(bit?.stats.dash),
    burst: parseNum(bit?.stats.burst),
    weight:
      (blade?.stats.weight ?? 0) +
      (ratchet?.stats.weight ?? 0) +
      (bit?.stats.weight ?? 0),
  };
}

function getTypeColor(beyType: string | null): number {
  switch (beyType) {
    case 'ATTACK':
      return 0xef4444;
    case 'DEFENSE':
      return 0x3b82f6;
    case 'STAMINA':
      return 0x22c55e;
    case 'BALANCE':
      return 0xa855f7;
    default:
      return Colors.Beyblade;
  }
}
function getTypeEmoji(beyType: string | null): string {
  switch (beyType) {
    case 'ATTACK':
      return '⚔️';
    case 'DEFENSE':
      return '🛡️';
    case 'STAMINA':
      return '🌀';
    case 'BALANCE':
      return '⚖️';
    default:
      return '🌀';
  }
}

function statBar(value: number, max = 100): string {
  const filled = Math.round((value / max) * 10);
  return (
    '█'.repeat(Math.min(filled, 10)) + '░'.repeat(10 - Math.min(filled, 10))
  );
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ─── Combo type from deck or random ─────────────────────────────────────────
interface PlayerCombo {
  blade: { name: string; beyType: string | null; imageUrl: string | null };
  ratchet: { name: string };
  bit: { name: string };
  fromDeck: boolean;
  deckName?: string;
}

@Discord()
@SlashGroup({ name: 'jeu', description: 'Activités ludiques et Beyblade' })
@SlashGroup('jeu')
@injectable()
export class GameGroup {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  /** Get active deck combo for a discord user, or null */
  private async getPlayerCombo(discordId: string): Promise<PlayerCombo | null> {
    const user = await this.prisma.user.findUnique({ where: { discordId } });
    if (!user) return null;

    const deck = await this.prisma.deck.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        items: {
          orderBy: { position: 'asc' },
          take: 1, // Use first item from deck
          include: {
            blade: { select: { name: true, beyType: true, imageUrl: true } },
            ratchet: { select: { name: true } },
            bit: { select: { name: true } },
          },
        },
      },
    });

    if (!deck || deck.items.length === 0) return null;

    const item = deck.items[0]!;
    if (!item.blade || !item.ratchet || !item.bit) return null;

    return {
      blade: item.blade,
      ratchet: item.ratchet,
      bit: item.bit,
      fromDeck: true,
      deckName: deck.name,
    };
  }

  /** Get a random combo from DB parts */
  private async getRandomCombo(): Promise<PlayerCombo | null> {
    const blades = await this.prisma.part.findMany({
      where: { type: 'BLADE' },
    });
    const ratchets = await this.prisma.part.findMany({
      where: { type: 'RATCHET' },
    });
    const bits = await this.prisma.part.findMany({ where: { type: 'BIT' } });

    if (blades.length === 0 || ratchets.length === 0 || bits.length === 0)
      return null;

    const blade = pick(blades);
    const ratchet = pick(ratchets);
    const bit = pick(bits);

    return {
      blade: {
        name: blade.name,
        beyType: blade.beyType,
        imageUrl: blade.imageUrl,
      },
      ratchet: { name: ratchet.name },
      bit: { name: bit.name },
      fromDeck: false,
    };
  }

  private computeFinishType(winnerStats: ComboStats) {
    const total =
      winnerStats.attack + winnerStats.defense + winnerStats.stamina;
    const atkRatio = total > 0 ? winnerStats.attack / total : 0.33;
    const staRatio = total > 0 ? winnerStats.stamina / total : 0.33;
    const dashBonus = winnerStats.dash > 30 ? 0.15 : 0;
    const roll = Math.random();
    if (roll < atkRatio * 0.4 + dashBonus) return FINISH_TYPES[0]!;
    if (roll < atkRatio * 0.7 + dashBonus) return FINISH_TYPES[1]!;
    if (roll < atkRatio * 0.7 + staRatio * 0.5) return FINISH_TYPES[3]!;
    return FINISH_TYPES[2]!;
  }

  // ═══ /jeu combat ═══
  @Slash({
    name: 'combat',
    description: 'Lancer un combat contre un autre blader',
  })
  @SlashGroup('jeu')
  async battle(
    @SlashOption({
      name: 'adversaire',
      description: 'Le blader à défier',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    interaction: CommandInteraction,
  ) {
    if (target.id === interaction.user.id)
      return interaction.reply({
        content: '❌ Tu ne peux pas te battre contre toi-même !',
        ephemeral: true,
      });
    if (target.bot)
      return interaction.reply({
        content: '❌ Tu ne peux pas défier un bot !',
        ephemeral: true,
      });

    await interaction.deferReply();

    // Get combos: deck if available, random otherwise
    const [comboA, comboB] = await Promise.all([
      this.getPlayerCombo(interaction.user.id).then(
        (c) => c || this.getRandomCombo(),
      ),
      this.getPlayerCombo(target.id).then((c) => c || this.getRandomCombo()),
    ]);

    if (!comboA || !comboB)
      return interaction.editReply(
        '❌ Pas assez de pièces en base de données.',
      );

    const statsA = computeComboStats(
      findBladeStats(comboA.blade.name),
      findRatchetStats(comboA.ratchet.name),
      findBitStats(comboA.bit.name),
    );
    const statsB = computeComboStats(
      findBladeStats(comboB.blade.name),
      findRatchetStats(comboB.ratchet.name),
      findBitStats(comboB.bit.name),
    );

    // Power + luck
    const scoreA =
      (statsA.attack + statsA.defense + statsA.stamina + statsA.dash * 0.5) *
      (0.75 + Math.random() * 0.5);
    const scoreB =
      (statsB.attack + statsB.defense + statsB.stamina + statsB.dash * 0.5) *
      (0.75 + Math.random() * 0.5);

    const challengerWins = scoreA >= scoreB;
    const winner = challengerWins ? interaction.user : target;
    const loser = challengerWins ? target : interaction.user;
    const winnerStats = challengerWins ? statsA : statsB;
    const winnerCombo = challengerWins ? comboA : comboB;
    const finishType = this.computeFinishType(winnerStats);

    // Canvas battle card
    const cardBuffer = await generateBattleCard({
      winnerName: winner.displayName,
      winnerAvatarUrl: winner.displayAvatarURL({ extension: 'png', size: 512 }),
      loserName: loser.displayName,
      loserAvatarUrl: loser.displayAvatarURL({ extension: 'png', size: 512 }),
      finishType: finishType.result,
      finishMessage: finishType.message,
      finishEmoji: finishType.emoji,
    });

    const filename = `battle-${Date.now()}.png`;
    const attachment = new AttachmentBuilder(cardBuffer, { name: filename });

    const comboNameA = `${comboA.blade.name} ${comboA.ratchet.name} ${comboA.bit.name}`;
    const comboNameB = `${comboB.blade.name} ${comboB.ratchet.name} ${comboB.bit.name}`;
    const deckTagA = comboA.fromDeck
      ? `\n📦 Deck: *${comboA.deckName}*`
      : '\n🎲 *Aléatoire*';
    const deckTagB = comboB.fromDeck
      ? `\n📦 Deck: *${comboB.deckName}*`
      : '\n🎲 *Aléatoire*';

    const embed = new EmbedBuilder()
      .setTitle(`${finishType.emoji} ${finishType.message}`)
      .setDescription(
        `**${interaction.user.displayName}** ${getTypeEmoji(comboA.blade.beyType)} vs ${getTypeEmoji(comboB.blade.beyType)} **${target.displayName}**`,
      )
      .addFields(
        {
          name: interaction.user.displayName,
          value: [
            `**${comboNameA}**${deckTagA}`,
            `ATK \`${statBar(statsA.attack)}\` **${statsA.attack}**`,
            `DEF \`${statBar(statsA.defense)}\` **${statsA.defense}**`,
            `STA \`${statBar(statsA.stamina)}\` **${statsA.stamina}**`,
            `DSH \`${statBar(statsA.dash)}\` **${statsA.dash}**`,
            `⚖️ **${statsA.weight.toFixed(1)}g**`,
          ].join('\n'),
          inline: true,
        },
        {
          name: target.displayName,
          value: [
            `**${comboNameB}**${deckTagB}`,
            `ATK \`${statBar(statsB.attack)}\` **${statsB.attack}**`,
            `DEF \`${statBar(statsB.defense)}\` **${statsB.defense}**`,
            `STA \`${statBar(statsB.stamina)}\` **${statsB.stamina}**`,
            `DSH \`${statBar(statsB.dash)}\` **${statsB.dash}**`,
            `⚖️ **${statsB.weight.toFixed(1)}g**`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '🏆 Vainqueur',
          value: `**${winner.displayName}** avec **${challengerWins ? comboNameA : comboNameB}**\n${finishType.emoji} ${finishType.message} (+${finishType.points} pts)`,
        },
      )
      .setColor(getTypeColor(winnerCombo.blade.beyType))
      .setImage(`attachment://${filename}`)
      .setFooter({
        text: `${RPB.FullName} | ${comboA.fromDeck || comboB.fromDeck ? 'Deck actif utilisé' : 'Combo aléatoire'}`,
      })
      .setTimestamp();

    // Update DB stats
    try {
      const dbWinner = await this.prisma.user.upsert({
        where: { discordId: winner.id },
        update: {},
        create: {
          discordId: winner.id,
          name: winner.displayName,
          email: `${winner.id}@discord.rpbey.fr`,
        },
      });
      await this.prisma.profile.upsert({
        where: { userId: dbWinner.id },
        update: { wins: { increment: 1 } },
        create: { userId: dbWinner.id, wins: 1 },
      });
      const dbLoser = await this.prisma.user.upsert({
        where: { discordId: loser.id },
        update: {},
        create: {
          discordId: loser.id,
          name: loser.displayName,
          email: `${loser.id}@discord.rpbey.fr`,
        },
      });
      await this.prisma.profile.upsert({
        where: { userId: dbLoser.id },
        update: { losses: { increment: 1 } },
        create: { userId: dbLoser.id, losses: 1 },
      });
    } catch (e) {
      logger.error('[Battle] DB update error:', e);
    }

    return interaction.editReply({ embeds: [embed], files: [attachment] });
  }

  // ═══ /jeu aleatoire ═══
  @Slash({
    name: 'aleatoire',
    description: 'Générer un combo Beyblade X (ou afficher ton deck)',
  })
  @SlashGroup('jeu')
  async random(interaction: CommandInteraction) {
    await interaction.deferReply();

    // Try to use active deck first
    const deckCombo = await this.getPlayerCombo(interaction.user.id);
    const combo = deckCombo || (await this.getRandomCombo());

    if (!combo)
      return interaction.editReply(
        '❌ Pas assez de pièces en base de données.',
      );

    const bladeJson = findBladeStats(combo.blade.name);
    const ratchetJson = findRatchetStats(combo.ratchet.name);
    const bitJson = findBitStats(combo.bit.name);
    const stats = computeComboStats(bladeJson, ratchetJson, bitJson);
    const comboName = `${combo.blade.name} ${combo.ratchet.name} ${combo.bit.name}`;
    const color = getTypeColor(combo.blade.beyType);

    const cardData: ComboCardData = {
      color,
      name: comboName,
      type: combo.blade.beyType || 'BALANCE',
      blade: combo.blade.name,
      ratchet: combo.ratchet.name,
      bit: combo.bit.name,
      bladeImageUrl: combo.blade.imageUrl,
      attack: stats.attack,
      defense: stats.defense,
      stamina: stats.stamina,
      dash: stats.dash,
      weight: stats.weight,
    };

    const cardBuffer = await generateComboCard(cardData);
    const filename = `combo-${Date.now()}.png`;
    const attachment = new AttachmentBuilder(cardBuffer, { name: filename });

    const bitType = bitJson?.stats.type || 'Inconnu';
    const spinDir = bladeJson?.spin === 'L' ? '↺ Gauche' : '↻ Droite';
    const source = combo.fromDeck
      ? `📦 **Deck : ${combo.deckName}**`
      : '🎲 **Combo aléatoire**';

    const embed = new EmbedBuilder()
      .setTitle(`${combo.fromDeck ? '📦' : '🎲'} ${comboName}`)
      .setDescription(
        `${getTypeEmoji(combo.blade.beyType)} **${combo.blade.beyType || 'BALANCE'}** | ${spinDir}\n${source}`,
      )
      .addFields(
        {
          name: '⚔️ Blade',
          value: [
            `**${combo.blade.name}**`,
            bladeJson
              ? `ATK ${parseNum(bladeJson.stats.attack)} | DEF ${parseNum(bladeJson.stats.defense)} | STA ${parseNum(bladeJson.stats.stamina)}`
              : '_Stats indisponibles_',
            bladeJson ? `⚖️ ${bladeJson.stats.weight}g` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          inline: true,
        },
        {
          name: '🔩 Ratchet',
          value: [
            `**${combo.ratchet.name}**`,
            ratchetJson
              ? `ATK ${parseNum(ratchetJson.stats.attack)} | DEF ${parseNum(ratchetJson.stats.defense)} | STA ${parseNum(ratchetJson.stats.stamina)}`
              : '_Stats indisponibles_',
            ratchetJson ? `⚖️ ${ratchetJson.stats.weight}g` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          inline: true,
        },
        {
          name: '💎 Bit',
          value: [
            `**${combo.bit.name}** (${bitType})`,
            bitJson
              ? `ATK ${parseNum(bitJson.stats.attack)} | DEF ${parseNum(bitJson.stats.defense)} | STA ${parseNum(bitJson.stats.stamina)}`
              : '_Stats indisponibles_',
            bitJson
              ? `DSH ${parseNum(bitJson.stats.dash)} | BRS ${parseNum(bitJson.stats.burst)}`
              : '',
            bitJson ? `⚖️ ${bitJson.stats.weight}g` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          inline: true,
        },
        {
          name: '📊 Stats Totales',
          value: [
            `ATK \`${statBar(stats.attack)}\` **${stats.attack}**`,
            `DEF \`${statBar(stats.defense)}\` **${stats.defense}**`,
            `STA \`${statBar(stats.stamina)}\` **${stats.stamina}**`,
            `DSH \`${statBar(stats.dash)}\` **${stats.dash}**`,
            `BRS \`${statBar(stats.burst)}\` **${stats.burst}**`,
            `⚖️ **${stats.weight.toFixed(1)}g**`,
          ].join('\n'),
        },
      )
      .setColor(color)
      .setImage(`attachment://${filename}`)
      .setFooter({
        text: `${RPB.FullName} | ${combo.fromDeck ? 'Ton deck actif' : '/jeu aleatoire pour un autre combo'}`,
      })
      .setTimestamp();

    if (combo.blade.imageUrl)
      embed.setThumbnail(`https://rpbey.fr${combo.blade.imageUrl}`);

    return interaction.editReply({ embeds: [embed], files: [attachment] });
  }

  // ═══ /jeu interaction ═══
  @Slash({
    name: 'interaction',
    description: 'Compter les mentions mutuelles entre deux membres',
  })
  @SlashGroup('jeu')
  async interaction(
    @SlashOption({
      name: 'membre',
      description: 'Le membre',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    interaction: CommandInteraction,
  ) {
    if (target.id === interaction.user.id)
      return interaction.reply({
        content: '❌ Choisis un autre membre que toi-même !',
        ephemeral: true,
      });
    if (target.bot)
      return interaction.reply({
        content: '❌ Impossible de calculer avec un bot.',
        ephemeral: true,
      });

    await interaction.deferReply();

    const { getMentions, getScanMeta } = await import('../../lib/redis.js');
    const [mentionsAtoB, mentionsBtoA, scanMeta] = await Promise.all([
      getMentions(interaction.user.id, target.id),
      getMentions(target.id, interaction.user.id),
      getScanMeta(),
    ]);
    const total = mentionsAtoB + mentionsBtoA;
    const score = Math.min(total, 100);
    const { label, color } =
      score >= 50
        ? { label: 'Inséparables', color: 0xef4444 }
        : score >= 30
          ? { label: 'Meilleurs potes', color: 0xfbbf24 }
          : score >= 15
            ? { label: 'Bons amis', color: 0x3b82f6 }
            : score >= 5
              ? { label: 'Connaissances', color: 0x8b5cf6 }
              : { label: 'Inconnus', color: 0x6b7280 };

    const { generateInteractionCard } = await import(
      '../../lib/canvas-utils.js'
    );
    const cardBuffer = await generateInteractionCard({
      userAName: interaction.user.displayName,
      userAAvatarUrl: interaction.user.displayAvatarURL({
        extension: 'png',
        size: 256,
      }),
      userBName: target.displayName,
      userBAvatarUrl: target.displayAvatarURL({ extension: 'png', size: 256 }),
      mentionsAtoB,
      mentionsBtoA,
      total,
      score,
      label,
      color,
    });

    const filename = `interaction-${Date.now()}.png`;
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setImage(`attachment://${filename}`)
          .setFooter({
            text: `${scanMeta.channelsScanned} salons · ${scanMeta.messagesScanned.toLocaleString('fr-FR')} messages analysés`,
          }),
      ],
      files: [new AttachmentBuilder(cardBuffer, { name: filename })],
    });
  }

  // ═══ /jeu wanted ═══
  @Slash({ name: 'wanted', description: 'Générer une affiche WANTED' })
  @SlashGroup('jeu')
  async wanted(
    @SlashOption({
      name: 'cible',
      description: "L'utilisateur ciblé",
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser: User | undefined,
    @SlashOption({
      name: 'crime',
      description: 'Le crime commis',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    customCrime: string | undefined,
    @SlashOption({
      name: 'prime',
      description: 'Montant de la prime',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    customBounty: string | undefined,
    interaction: CommandInteraction,
  ) {
    const target = targetUser ?? interaction.user;
    await interaction.deferReply();

    const crimes = [
      'A volé toutes les Cobalt Drake du tournoi',
      'Combo trop puissant, interdit de compétition',
      "A lancé sans autorisation de l'arbitre",
      'Refuse de jouer autre chose que Shark Edge',
      'A caché un aimant dans son launcher',
      'Burst au premier tour, 12 fois de suite',
      'Dealer clandestin de Random Boosters',
      'A spoilé les prochaines sorties UX',
      'Collectionne les Beyblades sans jouer',
      'A mis du WD-40 sur son Bit',
    ];
    const bounties = [
      '500 000 B₿',
      '1 000 000 B₿',
      '2 500 000 B₿',
      '10 000 000 B₿',
      '50 000 B₿',
      '999 999 B₿',
      '7 777 777 B₿',
    ];

    const crime =
      customCrime || crimes[Math.floor(Math.random() * crimes.length)]!;
    const bounty =
      customBounty || bounties[Math.floor(Math.random() * bounties.length)]!;

    const { generateWantedImage } = await import('../../lib/canvas-utils.js');
    const buffer = await generateWantedImage(
      target.displayName,
      target.displayAvatarURL({ extension: 'png', size: 512 }),
      bounty,
      crime,
    );

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x8b0000)
          .setImage('attachment://wanted.png')
          .setFooter({ text: `Demandé par ${interaction.user.displayName}` }),
      ],
      files: [new AttachmentBuilder(buffer, { name: 'wanted.png' })],
    });
  }

  // ═══ /jeu fun-agrandir ═══
  @Slash({ name: 'fun-agrandir', description: 'Agrandir un émoji' })
  @SlashGroup('jeu')
  async emote(
    @SlashOption({
      name: 'emoji',
      description: "L'émoji à agrandir",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    emoji: string,
    interaction: CommandInteraction,
  ) {
    const match = emoji.match(/<(a?):(\w+):(\d+)>/);
    if (!match) return interaction.reply('❌ Émoji invalide.');
    return interaction.reply(
      `https://cdn.discordapp.com/emojis/${match[3]}.${match[1] ? 'gif' : 'png'}?size=512`,
    );
  }
}
