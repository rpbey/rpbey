import fs from 'node:fs';
import path from 'node:path';
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';

import { Colors } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';

// --- Meta data types ---
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

@Discord()
@SlashGroup({ name: 'wiki', description: 'Base de connaissances Beyblade X' })
@SlashGroup('wiki')
@injectable()
export class WikiGroup {
  @Slash({ name: 'regles', description: 'Rechercher un point de règle' })
  @SlashGroup('wiki')
  async rules(
    @SlashOption({
      name: 'sujet',
      description: 'Ex: faute, burst, lancer',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    try {
      const dataPath = path.resolve(process.cwd(), '..', 'data/wbo_rules.json');
      if (!fs.existsSync(dataPath))
        return interaction.editReply('❌ Base de données indisponible.');
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const paragraphs = (data.translatedMarkdown || data.markdown).split('\n');
      const match = paragraphs.find((p: string) =>
        p.toLowerCase().includes(query.toLowerCase()),
      );
      if (!match)
        return interaction.editReply(`❌ Aucun résultat pour "${query}".`);

      const embed = new EmbedBuilder()
        .setTitle(`📖 Wiki : ${query}`)
        .setDescription(
          match.length > 1000 ? `${match.substring(0, 1000)}...` : match,
        )
        .setColor(Colors.Info)
        .setFooter({ text: 'Source: worldbeyblade.org' });
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply('❌ Erreur wiki.');
    }
  }

  @Slash({
    name: 'meta',
    description: 'Rankings des pièces et combos populaires du moment',
  })
  @SlashGroup('wiki')
  async meta(
    @SlashOption({
      name: 'categorie',
      description: "Voir le détail d'une catégorie",
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: (interaction) => {
        const choices = [
          { name: '⚔️ Blade', value: 'Blade' },
          { name: '⚙️ Ratchet', value: 'Ratchet' },
          { name: '🔩 Bit', value: 'Bit' },
          { name: '🔒 Lock Chip', value: 'Lock Chip' },
          { name: '🛡️ Assist Blade', value: 'Assist Blade' },
        ];
        const focused = interaction.options.getFocused().toLowerCase();
        return interaction.respond(
          choices.filter((c) => c.name.toLowerCase().includes(focused)),
        );
      },
    })
    category: string | undefined,
    @SlashOption({
      name: 'periode',
      description: "Fenêtre d'analyse (défaut: 2 semaines)",
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: (interaction) => {
        const choices = [
          { name: '📅 2 semaines', value: '2weeks' },
          { name: '📅 4 semaines', value: '4weeks' },
        ];
        const focused = interaction.options.getFocused().toLowerCase();
        return interaction.respond(
          choices.filter((c) => c.name.toLowerCase().includes(focused)),
        );
      },
    })
    periodKey: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const dataPath = path.resolve(
        process.cwd(),
        '..',
        'data/bbx-weekly.json',
      );
      if (!fs.existsSync(dataPath)) {
        return interaction.editReply({
          embeds: [this.metaFallbackEmbed()],
        });
      }

      const data = JSON.parse(
        fs.readFileSync(dataPath, 'utf-8'),
      ) as MetaFileData;

      const pKey = periodKey === '4weeks' ? '4weeks' : '2weeks';
      const period = data.periods[pKey];
      if (!period?.categories?.length) {
        return interaction.editReply({
          embeds: [this.metaFallbackEmbed()],
        });
      }

      if (category) {
        return this.metaCategoryDetail(
          interaction,
          data,
          period,
          pKey,
          category,
        );
      }
      return this.metaOverview(interaction, data, period, pKey);
    } catch (err) {
      logger.error('Failed to load meta data:', err);
      return interaction.editReply({ embeds: [this.metaFallbackEmbed()] });
    }
  }

  // --- Meta: overview (no category filter) ---
  private async metaOverview(
    interaction: CommandInteraction,
    data: MetaFileData,
    period: MetaPeriod,
    pKey: string,
  ) {
    const { metadata } = period;
    const dateRange = this.formatDateRange(
      metadata.startDate,
      metadata.endDate,
    );
    const periodLabel = pKey === '2weeks' ? '2 semaines' : '4 semaines';

    // Build best combo from #1 of each category
    const bestCombo = this.buildBestCombo(period);

    const mainEmbed = new EmbedBuilder()
      .setTitle('📊 Méta Beyblade X')
      .setDescription(
        `**${dateRange}** (${periodLabel})\n` +
          `${metadata.eventsScanned} tournois · ${metadata.partsAnalyzed} pièces analysées\n` +
          `Source : [bbxweekly.com](https://bbxweekly.com)\n\n` +
          `🏆 **Combo du moment**\n` +
          `\`\`\`${bestCombo}\`\`\``,
      )
      .setColor(0xfbbf24)
      .setFooter({
        text: 'Utilisez /wiki meta categorie:Blade pour le détail · rpbey.fr/meta',
      })
      .setTimestamp(new Date(data.scrapedAt));

    for (const cat of period.categories) {
      const emoji = CATEGORY_EMOJIS[cat.category] || '📦';
      const top = cat.components.slice(0, 5);
      const lines = top.map((c, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '▪️';
        const trend = this.formatTrend(c.position_change);
        const bar = this.scoreBar(c.score);
        return `${medal} **${c.name}** ${bar} ${c.score}${trend}`;
      });

      // Add top synergy hint for #1
      const top1 = cat.components[0];
      if (top1?.synergy?.length) {
        const topSyn = top1.synergy
          .slice(0, 3)
          .map((s) => s.name)
          .join(', ');
        lines.push(`└ *Se combine avec : ${topSyn}*`);
      }

      mainEmbed.addFields({
        name: `${emoji} ${cat.category}`,
        value: lines.join('\n'),
        inline: true,
      });
    }

    return interaction.editReply({ embeds: [mainEmbed] });
  }

  // --- Meta: detail view for a single category ---
  private async metaCategoryDetail(
    interaction: CommandInteraction,
    data: MetaFileData,
    period: MetaPeriod,
    pKey: string,
    categoryName: string,
  ) {
    const cat = period.categories.find(
      (c) => c.category.toLowerCase() === categoryName.toLowerCase(),
    );
    if (!cat) {
      return interaction.editReply(
        `❌ Catégorie "${categoryName}" introuvable. Catégories disponibles : ${period.categories.map((c) => c.category).join(', ')}`,
      );
    }

    const { metadata } = period;
    const dateRange = this.formatDateRange(
      metadata.startDate,
      metadata.endDate,
    );
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

    // Show all components with full details
    for (const comp of cat.components.slice(0, 10)) {
      const trend = this.formatTrend(comp.position_change);
      const bar = this.scoreBar(comp.score);

      let value = `Score : ${bar} **${comp.score}/100**${trend}\n`;

      if (comp.synergy?.length) {
        const synLines = comp.synergy.slice(0, 5).map((s) => {
          const synBar = this.scoreBar(s.score);
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
  }

  // --- Meta: helpers ---
  private metaFallbackEmbed() {
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

  private formatDateRange(start: string, end: string): string {
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

  private formatTrend(change: number | 'NEW'): string {
    if (change === 'NEW') return ' 🆕';
    if (change > 0) return ` ↑${change}`;
    if (change < 0) return ` ↓${Math.abs(change)}`;
    return '';
  }

  private scoreBar(score: number): string {
    const filled = Math.round(score / 10);
    return `\`${'█'.repeat(filled)}${'░'.repeat(10 - filled)}\``;
  }

  private buildBestCombo(period: MetaPeriod): string {
    const top = (name: string) =>
      period.categories.find((c) => c.category === name)?.components[0]?.name ||
      '?';
    const blade = top('Blade');
    const ratchet = top('Ratchet');
    const bit = top('Bit');
    const chip = top('Lock Chip');
    const assist = top('Assist Blade');
    return `${chip} ${blade} ${assist} ${ratchet} ${bit}`;
  }

  @Slash({ name: 'formats', description: 'Formats de tournoi officiels' })
  @SlashGroup('wiki')
  async formats(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🏆 Formats de Tournoi RPB')
      .setColor(Colors.Secondary)
      .setDescription(
        'Voici les formats utilisés lors des tournois organisés par la RPB et ses partenaires.',
      )
      .addFields(
        {
          name: '⚔️ 3on3 (Standard)',
          value:
            'Chaque joueur prépare un deck de **3 Beyblades**. Format le plus courant en compétition.\n' +
            '• Double Élimination (bracket Winners + Losers)\n' +
            '• First to 3 points par match',
          inline: false,
        },
        {
          name: '🎯 1on1',
          value:
            'Un seul Beyblade par joueur. Teste la maîtrise technique pure.\n' +
            '• First to 5 points\n' +
            '• Changement de combo autorisé entre les rounds',
          inline: false,
        },
        {
          name: '🔒 Deck Limited',
          value:
            'Format avec restrictions sur certaines pièces méta.\n' +
            '• Banlist mise à jour chaque saison\n' +
            '• Encourage la diversité des combos',
          inline: false,
        },
        {
          name: '🔄 Round Robin',
          value:
            "Tous les joueurs s'affrontent entre eux.\n" +
            '• Classement par victoires/défaites\n' +
            '• Idéal pour les petits groupes (8-16 joueurs)',
          inline: false,
        },
      )
      .setFooter({
        text: 'Règlement complet sur rpbey.fr/reglement',
      });
    return interaction.reply({ embeds: [embed] });
  }
}
