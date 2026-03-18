import fs from 'node:fs';
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';

import { logger } from '../../lib/logger.js';
import { resolveDataPath } from '../../lib/paths.js';

// --- Types ---
interface MetaSynergy {
  name: string;
  score: number;
}

interface MetaComponent {
  name: string;
  score: number;
  position_change: number | 'NEW';
  synergy: MetaSynergy[];
}

interface MetaCategory {
  category: string;
  components: MetaComponent[];
}

interface MetaPeriod {
  metadata: {
    dataSource: string;
    weekId: string;
    startDate: string;
    endDate: string;
    eventsScanned: number;
    partsAnalyzed: number;
  };
  categories: MetaCategory[];
}

interface MetaFileData {
  scrapedAt: string;
  periods: {
    '2weeks': MetaPeriod;
    '4weeks': MetaPeriod;
  };
}

// --- Constants ---
const CATEGORY_EMOJIS: Record<string, string> = {
  Blade: '⚔️',
  Ratchet: '⚙️',
  Bit: '🔩',
  'Lock Chip': '🔒',
  'Assist Blade': '🛡️',
};

const CATEGORY_HEX: Record<string, number> = {
  Blade: 0xdc2626,
  Ratchet: 0xfbbf24,
  Bit: 0x22c55e,
  'Lock Chip': 0x60a5fa,
  'Assist Blade': 0xa855f7,
};

const CATEGORY_CHOICES = [
  { name: '⚔️ Blade', value: 'Blade' },
  { name: '⚙️ Ratchet', value: 'Ratchet' },
  { name: '🔩 Bit', value: 'Bit' },
  { name: '🔒 Lock Chip', value: 'Lock Chip' },
  { name: '🛡️ Assist Blade', value: 'Assist Blade' },
];

const PERIOD_CHOICES = [
  { name: '📅 2 semaines', value: '2weeks' },
  { name: '📅 4 semaines', value: '4weeks' },
];

// --- Helpers ---
function loadMetaData(): MetaFileData | null {
  const dataPath = resolveDataPath('bbx-weekly.json');
  if (!fs.existsSync(dataPath)) return null;
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as MetaFileData;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  const e = new Date(end).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${s} — ${e}`;
}

function formatTrend(change: number | 'NEW'): string {
  if (change === 'NEW') return ' 🆕';
  if (change > 0) return ` ↑${change}`;
  if (change < 0) return ` ↓${Math.abs(change)}`;
  return '';
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return `\`${'█'.repeat(filled)}${'░'.repeat(10 - filled)}\``;
}

function fallbackEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('📊 Méta Beyblade X')
    .setColor(0xfbbf24)
    .setDescription(
      'Les données méta ne sont pas disponibles actuellement.\n\n' +
        '**Consultez la page dédiée pour les informations à jour :**\n' +
        '[rpbey.fr/meta](https://rpbey.fr/meta)',
    )
    .setFooter({ text: 'Données mises à jour régulièrement sur le site.' });
}

function resolvePeriod(
  data: MetaFileData,
  key: string | undefined,
): { period: MetaPeriod; pKey: string } | null {
  const pKey = key === '4weeks' ? '4weeks' : '2weeks';
  const period = data.periods[pKey];
  if (!period?.categories?.length) return null;
  return { period, pKey };
}

// --- Command ---
@Discord()
@SlashGroup({
  name: 'meta',
  description: 'Méta Beyblade X — rankings et combos populaires',
})
@SlashGroup('meta')
@injectable()
export class MetaCommand {
  @Slash({
    name: 'top',
    description: 'Classement global des pièces par catégorie',
  })
  @SlashGroup('meta')
  async top(
    @SlashOption({
      name: 'periode',
      description: "Fenêtre d'analyse (défaut: 2 semaines)",
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: (interaction) => {
        const focused = interaction.options.getFocused().toLowerCase();
        return interaction.respond(
          PERIOD_CHOICES.filter((c) => c.name.toLowerCase().includes(focused)),
        );
      },
    })
    periodKey: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const data = loadMetaData();
      if (!data) return interaction.editReply({ embeds: [fallbackEmbed()] });

      const resolved = resolvePeriod(data, periodKey);
      if (!resolved)
        return interaction.editReply({ embeds: [fallbackEmbed()] });

      const { period, pKey } = resolved;
      const { metadata } = period;
      const dateRange = formatDateRange(metadata.startDate, metadata.endDate);
      const periodLabel = pKey === '2weeks' ? '2 semaines' : '4 semaines';

      const embed = new EmbedBuilder()
        .setTitle('📊 Méta Beyblade X')
        .setDescription(
          `**${dateRange}** (${periodLabel})\n` +
            `${metadata.eventsScanned} tournois · ${metadata.partsAnalyzed} pièces analysées\n` +
            `Source : [bbxweekly.com](https://bbxweekly.com)`,
        )
        .setColor(0xfbbf24)
        .setFooter({
          text: '/meta combo · /meta categorie · rpbey.fr/meta',
        })
        .setTimestamp(new Date(data.scrapedAt));

      for (const cat of period.categories) {
        const emoji = CATEGORY_EMOJIS[cat.category] || '📦';
        const top = cat.components.slice(0, 5);
        const lines = top.map((c, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '▪️';
          const trend = formatTrend(c.position_change);
          const bar = scoreBar(c.score);
          return `${medal} **${c.name}** ${bar} ${c.score}${trend}`;
        });

        const top1 = cat.components[0];
        if (top1?.synergy?.length) {
          const topSyn = top1.synergy
            .slice(0, 3)
            .map((s) => s.name)
            .join(', ');
          lines.push(`└ *Se combine avec : ${topSyn}*`);
        }

        embed.addFields({
          name: `${emoji} ${cat.category}`,
          value: lines.join('\n'),
          inline: true,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Failed to load meta data:', err);
      return interaction.editReply({ embeds: [fallbackEmbed()] });
    }
  }

  @Slash({
    name: 'categorie',
    description: "Détail complet d'une catégorie de pièces",
  })
  @SlashGroup('meta')
  async categorie(
    @SlashOption({
      name: 'type',
      description: 'Catégorie à afficher',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: (interaction) => {
        const focused = interaction.options.getFocused().toLowerCase();
        return interaction.respond(
          CATEGORY_CHOICES.filter((c) =>
            c.name.toLowerCase().includes(focused),
          ),
        );
      },
    })
    categoryName: string,
    @SlashOption({
      name: 'periode',
      description: "Fenêtre d'analyse (défaut: 2 semaines)",
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: (interaction) => {
        const focused = interaction.options.getFocused().toLowerCase();
        return interaction.respond(
          PERIOD_CHOICES.filter((c) => c.name.toLowerCase().includes(focused)),
        );
      },
    })
    periodKey: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const data = loadMetaData();
      if (!data) return interaction.editReply({ embeds: [fallbackEmbed()] });

      const resolved = resolvePeriod(data, periodKey);
      if (!resolved)
        return interaction.editReply({ embeds: [fallbackEmbed()] });

      const { period, pKey } = resolved;
      const cat = period.categories.find(
        (c) => c.category.toLowerCase() === categoryName.toLowerCase(),
      );
      if (!cat) {
        return interaction.editReply(
          `❌ Catégorie "${categoryName}" introuvable. Disponibles : ${period.categories.map((c) => c.category).join(', ')}`,
        );
      }

      const { metadata } = period;
      const dateRange = formatDateRange(metadata.startDate, metadata.endDate);
      const periodLabel = pKey === '2weeks' ? '2 semaines' : '4 semaines';
      const emoji = CATEGORY_EMOJIS[cat.category] || '📦';

      const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${cat.category} — Méta détaillée`)
        .setDescription(
          `**${dateRange}** (${periodLabel}) · ${metadata.eventsScanned} tournois`,
        )
        .setColor(CATEGORY_HEX[cat.category] || 0xfbbf24)
        .setFooter({ text: 'rpbey.fr/meta pour les graphiques complets' })
        .setTimestamp(new Date(data.scrapedAt));

      for (const comp of cat.components.slice(0, 10)) {
        const trend = formatTrend(comp.position_change);
        const bar = scoreBar(comp.score);

        let value = `Score : ${bar} **${comp.score}/100**${trend}\n`;

        if (comp.synergy?.length) {
          const synLines = comp.synergy.slice(0, 5).map((s) => {
            const synBar = scoreBar(s.score);
            return `${synBar} **${s.name}** (${s.score})`;
          });
          value += `**Synergies :**\n${synLines.join('\n')}`;
        }

        embed.addFields({
          name: comp.name,
          value,
          inline: cat.components.length <= 4,
        });
      }

      if (cat.components.length > 10) {
        embed.addFields({
          name: '\u200b',
          value: `*… et ${cat.components.length - 10} autres pièces sur rpbey.fr/meta*`,
          inline: false,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Failed to load meta category:', err);
      return interaction.editReply({ embeds: [fallbackEmbed()] });
    }
  }

  @Slash({
    name: 'combo',
    description: 'Le meilleur combo du moment basé sur les données de tournois',
  })
  @SlashGroup('meta')
  async combo(
    @SlashOption({
      name: 'periode',
      description: "Fenêtre d'analyse (défaut: 2 semaines)",
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: (interaction) => {
        const focused = interaction.options.getFocused().toLowerCase();
        return interaction.respond(
          PERIOD_CHOICES.filter((c) => c.name.toLowerCase().includes(focused)),
        );
      },
    })
    periodKey: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const data = loadMetaData();
      if (!data) return interaction.editReply({ embeds: [fallbackEmbed()] });

      const resolved = resolvePeriod(data, periodKey);
      if (!resolved)
        return interaction.editReply({ embeds: [fallbackEmbed()] });

      const { period, pKey } = resolved;
      const { metadata } = period;
      const dateRange = formatDateRange(metadata.startDate, metadata.endDate);
      const periodLabel = pKey === '2weeks' ? '2 semaines' : '4 semaines';

      const getTop = (name: string) => {
        const cat = period.categories.find((c) => c.category === name);
        return cat?.components[0] || null;
      };

      const blade = getTop('Blade');
      const ratchet = getTop('Ratchet');
      const bit = getTop('Bit');
      const chip = getTop('Lock Chip');
      const assist = getTop('Assist Blade');

      const parts = [
        { label: '🔒 Lock Chip', comp: chip },
        { label: '⚔️ Blade', comp: blade },
        { label: '🛡️ Assist Blade', comp: assist },
        { label: '⚙️ Ratchet', comp: ratchet },
        { label: '🔩 Bit', comp: bit },
      ];

      const comboStr = parts.map((p) => p.comp?.name || '?').join(' ');

      const embed = new EmbedBuilder()
        .setTitle('🏆 Combo du moment')
        .setDescription(
          `**${dateRange}** (${periodLabel})\n` +
            `Basé sur ${metadata.eventsScanned} tournois\n\n` +
            `\`\`\`${comboStr}\`\`\``,
        )
        .setColor(0xfbbf24)
        .setFooter({ text: 'rpbey.fr/meta' })
        .setTimestamp(new Date(data.scrapedAt));

      for (const { label, comp } of parts) {
        if (!comp) continue;
        const bar = scoreBar(comp.score);
        let value = `${bar} **${comp.score}/100**\n`;

        if (comp.synergy?.length) {
          const topSyn = comp.synergy
            .slice(0, 3)
            .map((s) => `${s.name} (${s.score})`)
            .join(' · ');
          value += `Synergies : ${topSyn}`;
        }

        embed.addFields({
          name: `${label} — ${comp.name}`,
          value,
          inline: true,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Failed to load meta combo:', err);
      return interaction.editReply({ embeds: [fallbackEmbed()] });
    }
  }

  @Slash({
    name: 'piece',
    description: "Rechercher les stats et synergies d'une pièce",
  })
  @SlashGroup('meta')
  async piece(
    @SlashOption({
      name: 'nom',
      description: 'Nom de la pièce (ex: Shark Scale, 1-60, Hexa)',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    pieceName: string,
    @SlashOption({
      name: 'periode',
      description: "Fenêtre d'analyse (défaut: 2 semaines)",
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: (interaction) => {
        const focused = interaction.options.getFocused().toLowerCase();
        return interaction.respond(
          PERIOD_CHOICES.filter((c) => c.name.toLowerCase().includes(focused)),
        );
      },
    })
    periodKey: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const data = loadMetaData();
      if (!data) return interaction.editReply({ embeds: [fallbackEmbed()] });

      const resolved = resolvePeriod(data, periodKey);
      if (!resolved)
        return interaction.editReply({ embeds: [fallbackEmbed()] });

      const { period, pKey } = resolved;
      const query = pieceName.toLowerCase();

      // Search across all categories
      let foundComp: MetaComponent | null = null;
      let foundCategory = '';
      for (const cat of period.categories) {
        const match = cat.components.find(
          (c) => c.name.toLowerCase() === query,
        );
        if (match) {
          foundComp = match;
          foundCategory = cat.category;
          break;
        }
      }

      // Fuzzy fallback
      if (!foundComp) {
        for (const cat of period.categories) {
          const match = cat.components.find((c) =>
            c.name.toLowerCase().includes(query),
          );
          if (match) {
            foundComp = match;
            foundCategory = cat.category;
            break;
          }
        }
      }

      if (!foundComp) {
        return interaction.editReply(
          `❌ Pièce "${pieceName}" introuvable dans les données méta.`,
        );
      }

      const { metadata } = period;
      const dateRange = formatDateRange(metadata.startDate, metadata.endDate);
      const periodLabel = pKey === '2weeks' ? '2 semaines' : '4 semaines';
      const emoji = CATEGORY_EMOJIS[foundCategory] || '📦';
      const trend = formatTrend(foundComp.position_change);
      const bar = scoreBar(foundComp.score);

      const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${foundComp.name}`)
        .setDescription(
          `**${foundCategory}** · ${dateRange} (${periodLabel})\n\n` +
            `Score : ${bar} **${foundComp.score}/100**${trend}`,
        )
        .setColor(CATEGORY_HEX[foundCategory] || 0xfbbf24)
        .setFooter({ text: 'rpbey.fr/meta' })
        .setTimestamp(new Date(data.scrapedAt));

      if (foundComp.synergy?.length) {
        const synLines = foundComp.synergy.map((s) => {
          const synBar = scoreBar(s.score);
          return `${synBar} **${s.name}** — ${s.score}`;
        });
        embed.addFields({
          name: `🔗 Synergies (${foundComp.synergy.length})`,
          value: synLines.join('\n'),
          inline: false,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Failed to search meta piece:', err);
      return interaction.editReply({ embeds: [fallbackEmbed()] });
    }
  }
}
