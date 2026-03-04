import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashChoice, SlashOption } from 'discordx';

import { Colors, RPB } from '../../lib/constants.js';

interface SynergyItem {
  name: string;
  score: number;
}

interface ComponentData {
  name: string;
  score: number;
  position_change: number | 'NEW';
  synergy: SynergyItem[];
}

interface CategoryData {
  category: string;
  components: ComponentData[];
}

interface PeriodMetadata {
  dataSource: string;
  weekId: string;
  startDate: string;
  endDate: string;
  eventsScanned: number;
  partsAnalyzed: number;
}

interface PeriodData {
  metadata: PeriodMetadata;
  categories: CategoryData[];
}

interface BbxWeeklyData {
  scrapedAt: string;
  periods: {
    '2weeks': PeriodData;
    '4weeks': PeriodData;
  };
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Blade: '⚔️',
  Ratchet: '⚙️',
  Bit: '💎',
  'Lock Chip': '🔒',
  'Assist Blade': '🛡️',
};

const CATEGORY_ORDER = ['Blade', 'Ratchet', 'Bit', 'Lock Chip', 'Assist Blade'];

function loadBbxData(): BbxWeeklyData | null {
  // Try multiple paths: Docker (/app/data), dev (../data)
  const candidates = [
    resolve(process.cwd(), 'data', 'bbx-weekly.json'),
    resolve(process.cwd(), '..', 'data', 'bbx-weekly.json'),
  ];
  for (const filePath of candidates) {
    try {
      const raw = readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as BbxWeeklyData;
    } catch {}
  }
  return null;
}

function changeIndicator(change: number | 'NEW'): string {
  if (change === 'NEW') return '🆕';
  if (change > 0) return `▲${change}`;
  if (change < 0) return `▼${Math.abs(change)}`;
  return '—';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

@Discord()
export class MetaCommand {
  @Slash({
    name: 'meta',
    description: 'Rankings des pièces Beyblade X basés sur les tournois WBO',
  })
  async meta(
    @SlashChoice({ name: '2 Semaines', value: '2weeks' })
    @SlashChoice({ name: '4 Semaines', value: '4weeks' })
    @SlashOption({
      name: 'periode',
      description: 'Période de calcul des scores',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    period: '2weeks' | '4weeks' | undefined,

    @SlashChoice({ name: 'Blade', value: 'Blade' })
    @SlashChoice({ name: 'Ratchet', value: 'Ratchet' })
    @SlashChoice({ name: 'Bit', value: 'Bit' })
    @SlashChoice({ name: 'Lock Chip', value: 'Lock Chip' })
    @SlashChoice({ name: 'Assist Blade', value: 'Assist Blade' })
    @SlashOption({
      name: 'categorie',
      description: 'Filtrer par catégorie de pièce',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    category: string | undefined,

    interaction: CommandInteraction,
  ) {
    const data = loadBbxData();

    if (!data) {
      return interaction.reply({
        content:
          '❌ Les données meta ne sont pas encore disponibles. Elles seront mises à jour automatiquement chaque vendredi.',
        ephemeral: true,
      });
    }

    const selectedPeriod = period || '2weeks';
    const periodData = data.periods[selectedPeriod];

    if (!periodData || periodData.categories.length === 0) {
      return interaction.reply({
        content: '❌ Aucune donnée disponible pour cette période.',
        ephemeral: true,
      });
    }

    const { metadata } = periodData;
    const periodLabel =
      selectedPeriod === '2weeks' ? '2 Semaines' : '4 Semaines';
    const dateRange =
      metadata.startDate && metadata.endDate
        ? `${formatDate(metadata.startDate)} — ${formatDate(metadata.endDate)}`
        : '';

    // If a specific category is selected, show detailed view
    if (category) {
      const cat = periodData.categories.find((c) => c.category === category);
      if (!cat) {
        return interaction.reply({
          content: `❌ Catégorie "${category}" non trouvée dans les données.`,
          ephemeral: true,
        });
      }

      const emoji = CATEGORY_EMOJIS[cat.category] || '📊';
      const top = cat.components.slice(0, 15);

      const lines = top.map((comp, i) => {
        const rank = `\`#${String(i + 1).padStart(2, ' ')}\``;
        const change = changeIndicator(comp.position_change);
        const synTop = comp.synergy
          .slice(0, 3)
          .map((s) => s.name)
          .join(', ');
        const synText = synTop ? ` *(${synTop})*` : '';
        return `${rank} **${comp.name}** — \`${comp.score}\` ${change}${synText}`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`${emoji} Meta ${cat.category} — ${periodLabel}`)
        .setDescription(lines.join('\n'))
        .setColor(Colors.Beyblade)
        .setFooter({
          text: `${metadata.weekId} • ${dateRange} • ${metadata.eventsScanned} events • rpbey.fr/meta`,
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // Overview: show top 3 per category
    const sorted = [...periodData.categories].sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a.category);
      const ib = CATEGORY_ORDER.indexOf(b.category);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const fields = sorted.map((cat) => {
      const emoji = CATEGORY_EMOJIS[cat.category] || '📊';
      const top3 = cat.components.slice(0, 5).map((comp, i) => {
        const medal =
          i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`${i + 1}.\``;
        const change = changeIndicator(comp.position_change);
        return `${medal} **${comp.name}** \`${comp.score}\` ${change}`;
      });

      return {
        name: `${emoji} ${cat.category}`,
        value: top3.join('\n'),
        inline: true,
      };
    });

    // Stats line
    const statsLine = [
      metadata.weekId,
      dateRange,
      metadata.eventsScanned > 0 ? `${metadata.eventsScanned} tournois` : null,
      metadata.partsAnalyzed > 0 ? `${metadata.partsAnalyzed} combos` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    const embed = new EmbedBuilder()
      .setTitle(`📊 Meta Beyblade X — ${periodLabel}`)
      .setDescription(
        `Rankings basés sur les podiums des tournois [WBO](https://worldbeyblade.org)\n${statsLine}`,
      )
      .setColor(Colors.Beyblade)
      .addFields(fields)
      .setFooter({
        text: `${RPB.FullName} • rpbey.fr/meta`,
      })
      .setTimestamp(new Date(data.scrapedAt));

    return interaction.reply({ embeds: [embed] });
  }
}
