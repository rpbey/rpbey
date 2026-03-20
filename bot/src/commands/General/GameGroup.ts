import fs from 'node:fs';

import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  type CommandInteraction,
  EmbedBuilder,
  type User,
} from 'discord.js';
import DIG from 'discord-image-generation';
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

// ─── Static JSON Stats (cleaned data) ───
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

// Normalize name for matching: remove spaces, lowercase
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

// Battle finish types
const FINISH_TYPES = [
  {
    result: 'xtreme',
    message: '⚡ X-TREME FINISH !',
    points: 3,
    emoji: '⚡',
  },
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

@Discord()
@SlashGroup({ name: 'jeu', description: 'Activités ludiques et Beyblade' })
@SlashGroup('jeu')
@injectable()
export class GameGroup {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  @Slash({
    name: 'combat',
    description: 'Lancer un combat amical contre un autre blader',
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

    // Generate random combos for both players
    const blades = await this.prisma.part.findMany({
      where: { type: 'BLADE' },
    });
    const ratchets = await this.prisma.part.findMany({
      where: { type: 'RATCHET' },
    });
    const bits = await this.prisma.part.findMany({ where: { type: 'BIT' } });

    if (blades.length === 0 || ratchets.length === 0 || bits.length === 0) {
      return interaction.editReply(
        '❌ La base de données ne contient pas assez de pièces. Un admin doit lancer la synchronisation.',
      );
    }

    const comboA = {
      blade: pick(blades),
      ratchet: pick(ratchets),
      bit: pick(bits),
    };
    const comboB = {
      blade: pick(blades),
      ratchet: pick(ratchets),
      bit: pick(bits),
    };

    const statsJsonA = {
      blade: findBladeStats(comboA.blade.name),
      ratchet: findRatchetStats(comboA.ratchet.name),
      bit: findBitStats(comboA.bit.name),
    };
    const statsJsonB = {
      blade: findBladeStats(comboB.blade.name),
      ratchet: findRatchetStats(comboB.ratchet.name),
      bit: findBitStats(comboB.bit.name),
    };

    const sA = computeComboStats(
      statsJsonA.blade,
      statsJsonA.ratchet,
      statsJsonA.bit,
    );
    const sB = computeComboStats(
      statsJsonB.blade,
      statsJsonB.ratchet,
      statsJsonB.bit,
    );

    // Power calculation with luck factor
    const powerA = sA.attack + sA.defense + sA.stamina + sA.dash * 0.5;
    const powerB = sB.attack + sB.defense + sB.stamina + sB.dash * 0.5;
    const luckA = 0.75 + Math.random() * 0.5;
    const luckB = 0.75 + Math.random() * 0.5;
    const scoreA = powerA * luckA;
    const scoreB = powerB * luckB;

    const challengerWins = scoreA >= scoreB;
    const winner = challengerWins ? interaction.user : target;
    const loser = challengerWins ? target : interaction.user;
    const winnerStats = challengerWins ? sA : sB;
    const winnerCombo = challengerWins ? comboA : comboB;

    // Determine finish type based on winner's stats
    const total =
      winnerStats.attack + winnerStats.defense + winnerStats.stamina;
    const atkRatio = total > 0 ? winnerStats.attack / total : 0.33;
    const staRatio = total > 0 ? winnerStats.stamina / total : 0.33;
    const dashBonus = winnerStats.dash > 30 ? 0.15 : 0;

    let finishType: (typeof FINISH_TYPES)[number];
    const roll = Math.random();
    if (roll < atkRatio * 0.4 + dashBonus) {
      finishType = FINISH_TYPES[0]!; // xtreme
    } else if (roll < atkRatio * 0.7 + dashBonus) {
      finishType = FINISH_TYPES[1]!; // burst
    } else if (roll < atkRatio * 0.7 + staRatio * 0.5) {
      finishType = FINISH_TYPES[3]!; // spin
    } else {
      finishType = FINISH_TYPES[2]!; // over
    }

    // Generate battle card
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

    const embed = new EmbedBuilder()
      .setTitle(`${finishType.emoji} ${finishType.message}`)
      .setDescription(
        `**${interaction.user.displayName}** ${getTypeEmoji(comboA.blade.beyType)} vs ${getTypeEmoji(comboB.blade.beyType)} **${target.displayName}**`,
      )
      .addFields(
        {
          name: `${interaction.user.displayName}`,
          value: [
            `**${comboNameA}**`,
            `ATK \`${statBar(sA.attack)}\` **${sA.attack}**`,
            `DEF \`${statBar(sA.defense)}\` **${sA.defense}**`,
            `STA \`${statBar(sA.stamina)}\` **${sA.stamina}**`,
            `DSH \`${statBar(sA.dash)}\` **${sA.dash}**`,
            `⚖️ **${sA.weight.toFixed(1)}g**`,
          ].join('\n'),
          inline: true,
        },
        {
          name: `${target.displayName}`,
          value: [
            `**${comboNameB}**`,
            `ATK \`${statBar(sB.attack)}\` **${sB.attack}**`,
            `DEF \`${statBar(sB.defense)}\` **${sB.defense}**`,
            `STA \`${statBar(sB.stamina)}\` **${sB.stamina}**`,
            `DSH \`${statBar(sB.dash)}\` **${sB.dash}**`,
            `⚖️ **${sB.weight.toFixed(1)}g**`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '🏆 Vainqueur',
          value: `**${winner.displayName}** avec **${challengerWins ? comboNameA : comboNameB}**\n${finishType.emoji} ${finishType.message} (+${finishType.points} pts)`,
          inline: false,
        },
      )
      .setColor(getTypeColor(winnerCombo.blade.beyType))
      .setImage(`attachment://${filename}`)
      .setFooter({ text: `${RPB.FullName} | Combo aléatoire` })
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

    return interaction.editReply({
      embeds: [embed],
      files: [attachment],
    });
  }

  @Slash({
    name: 'aleatoire',
    description: 'Générer un combo Beyblade X aléatoire',
  })
  @SlashGroup('jeu')
  async random(interaction: CommandInteraction) {
    await interaction.deferReply();

    const blades = await this.prisma.part.findMany({
      where: { type: 'BLADE' },
    });
    const ratchets = await this.prisma.part.findMany({
      where: { type: 'RATCHET' },
    });
    const bits = await this.prisma.part.findMany({ where: { type: 'BIT' } });

    if (blades.length === 0 || ratchets.length === 0 || bits.length === 0) {
      return interaction.editReply(
        '❌ La base de données ne contient pas assez de pièces. Un admin doit lancer la synchronisation.',
      );
    }

    const blade = pick(blades);
    const ratchet = pick(ratchets);
    const bit = pick(bits);

    // Lookup stats from cleaned JSON
    const bladeJson = findBladeStats(blade.name);
    const ratchetJson = findRatchetStats(ratchet.name);
    const bitJson = findBitStats(bit.name);

    const stats = computeComboStats(bladeJson, ratchetJson, bitJson);
    const comboName = `${blade.name} ${ratchet.name} ${bit.name}`;
    const color = getTypeColor(blade.beyType);

    // Generate combo card image
    const cardData: ComboCardData = {
      color,
      name: comboName,
      type: blade.beyType || 'BALANCE',
      blade: blade.name,
      ratchet: ratchet.name,
      bit: bit.name,
      bladeImageUrl: blade.imageUrl,
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

    const embed = new EmbedBuilder()
      .setTitle(`🎲 ${comboName}`)
      .setDescription(
        `${getTypeEmoji(blade.beyType)} **${blade.beyType || 'BALANCE'}** | ${spinDir}`,
      )
      .addFields(
        {
          name: '⚔️ Blade',
          value: [
            `**${blade.name}**`,
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
            `**${ratchet.name}**`,
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
            `**${bit.name}** (${bitType})`,
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
          inline: false,
        },
      )
      .setColor(color)
      .setImage(`attachment://${filename}`)
      .setFooter({
        text: `${RPB.FullName} | /jeu aleatoire pour un autre combo`,
      })
      .setTimestamp();

    // If blade has an image in DB, show it as thumbnail
    if (blade.imageUrl) {
      embed.setThumbnail(`https://rpbey.fr${blade.imageUrl}`);
    }

    return interaction.editReply({
      embeds: [embed],
      files: [attachment],
    });
  }

  @Slash({
    name: 'interaction',
    description: "Calculer le score d'interaction entre deux membres",
  })
  @SlashGroup('jeu')
  async interaction(
    @SlashOption({
      name: 'membre',
      description: "Le membre avec qui calculer l'interaction",
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

    const [userA, userB] = await Promise.all([
      this.prisma.user.findFirst({
        where: { discordId: interaction.user.id },
        include: { profile: true },
      }),
      this.prisma.user.findFirst({
        where: { discordId: target.id },
        include: { profile: true },
      }),
    ]);

    let directMatches = 0;
    let coTournaments = 0;
    let h2hA = 0;
    let h2hB = 0;

    if (userA && userB) {
      // Direct tournament matches (faced each other)
      directMatches = await this.prisma.tournamentMatch.count({
        where: {
          OR: [
            { player1Id: userA.id, player2Id: userB.id },
            { player1Id: userB.id, player2Id: userA.id },
          ],
        },
      });

      // Wins for each side
      [h2hA, h2hB] = await Promise.all([
        this.prisma.tournamentMatch.count({
          where: {
            OR: [
              { player1Id: userA.id, player2Id: userB.id },
              { player1Id: userB.id, player2Id: userA.id },
            ],
            winnerId: userA.id,
          },
        }),
        this.prisma.tournamentMatch.count({
          where: {
            OR: [
              { player1Id: userA.id, player2Id: userB.id },
              { player1Id: userB.id, player2Id: userA.id },
            ],
            winnerId: userB.id,
          },
        }),
      ]);

      // Co-participation in same tournaments
      const tournamentsA = await this.prisma.tournamentParticipant.findMany({
        where: { userId: userA.id },
        select: { tournamentId: true },
      });
      const tournamentIdsA = new Set(tournamentsA.map((t) => t.tournamentId));

      if (tournamentIdsA.size > 0) {
        coTournaments = await this.prisma.tournamentParticipant.count({
          where: {
            userId: userB.id,
            tournamentId: { in: [...tournamentIdsA] },
          },
        });
      }
    }

    // Shared roles on the server
    let sharedRoles = 0;
    const guild = interaction.guild;
    if (guild) {
      const [memberA, memberB] = await Promise.all([
        guild.members.fetch(interaction.user.id).catch(() => null),
        guild.members.fetch(target.id).catch(() => null),
      ]);
      if (memberA && memberB) {
        const rolesA = memberA.roles.cache.filter((r) => r.id !== guild.id);
        const rolesB = new Set(memberB.roles.cache.map((r) => r.id));
        sharedRoles = rolesA.filter((r) => rolesB.has(r.id)).size;
      }
    }

    // Account age proximity (closer = more affinity)
    const ageA = interaction.user.createdTimestamp;
    const ageB = target.createdTimestamp;
    const ageDiffDays = Math.abs(ageA - ageB) / (1000 * 60 * 60 * 24);
    const ageBonus =
      ageDiffDays < 30 ? 15 : ageDiffDays < 180 ? 8 : ageDiffDays < 365 ? 3 : 0;

    // Calculate score
    const matchPoints = directMatches * 12;
    const coTournamentPoints = coTournaments * 8;
    const rolePoints = sharedRoles * 3;
    // Deterministic seed from both user IDs for consistent "random" bonus
    const seed =
      ([...interaction.user.id].reduce((a, c) => a + c.charCodeAt(0), 0) +
        [...target.id].reduce((a, c) => a + c.charCodeAt(0), 0)) %
      20;

    const rawScore =
      matchPoints + coTournamentPoints + rolePoints + ageBonus + seed;
    const score = Math.min(rawScore, 100);

    // Score label & color
    const { label, emoji, color } =
      score >= 80
        ? { label: 'Rivaux légendaires', emoji: '🔥', color: 0xef4444 }
        : score >= 60
          ? { label: 'Bons compagnons', emoji: '⚡', color: 0xfbbf24 }
          : score >= 40
            ? { label: 'Camarades', emoji: '🤝', color: 0x3b82f6 }
            : score >= 20
              ? { label: 'Connaissances', emoji: '👋', color: 0x8b5cf6 }
              : { label: 'Inconnus', emoji: '❓', color: 0x6b7280 };

    const bar =
      '█'.repeat(Math.round(score / 10)) +
      '░'.repeat(10 - Math.round(score / 10));

    const embed = new EmbedBuilder()
      .setTitle(
        `${emoji} ${interaction.user.displayName} & ${target.displayName}`,
      )
      .setDescription(
        `**${label}** — Score d'interaction : **${score}/100**\n\`${bar}\``,
      )
      .setColor(color)
      .addFields(
        {
          name: '⚔️ Matchs directs',
          value:
            directMatches > 0
              ? `**${directMatches}** confrontation${directMatches > 1 ? 's' : ''} (${h2hA}V - ${h2hB}D)`
              : 'Aucune confrontation',
          inline: true,
        },
        {
          name: '🏆 Tournois communs',
          value: `**${coTournaments}** tournoi${coTournaments > 1 ? 's' : ''} ensemble`,
          inline: true,
        },
        {
          name: '🎭 Rôles partagés',
          value: `**${sharedRoles}** rôle${sharedRoles > 1 ? 's' : ''} en commun`,
          inline: true,
        },
      )
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: `${RPB.FullName} | /jeu interaction`,
        iconURL: interaction.user.displayAvatarURL({ size: 64 }),
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  @Slash({ name: 'fun-wanted', description: 'Générer une affiche WANTED' })
  @SlashGroup('jeu')
  async wanted(
    @SlashOption({
      name: 'cible',
      description: "L'utilisateur ciblé",
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser: User | undefined,
    interaction: CommandInteraction,
  ) {
    const target = targetUser ?? interaction.user;
    await interaction.deferReply();
    const avatar = target.displayAvatarURL({ extension: 'png', size: 512 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DIG lacks proper type exports
    const image = await new (DIG as Record<string, any>).Wanted().getImage(
      avatar,
      '€',
    );
    return interaction.editReply({
      files: [new AttachmentBuilder(image, { name: 'wanted.png' })],
    });
  }

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
