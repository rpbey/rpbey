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

  @Slash({ name: 'meta', description: 'Combos populaires du moment' })
  @SlashGroup('wiki')
  async meta(interaction: CommandInteraction) {
    await interaction.deferReply();

    const CATEGORY_EMOJIS: Record<string, string> = {
      Blade: '⚔️',
      Ratchet: '⚙️',
      Bit: '🔩',
      'Lock Chip': '🔒',
      'Assist Blade': '🛡️',
    };

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

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as {
        scrapedAt: string;
        periods: {
          '2weeks': {
            metadata: {
              startDate: string;
              endDate: string;
              eventsScanned: number;
            };
            categories: {
              category: string;
              components: {
                name: string;
                score: number;
                position_change: number | 'NEW';
              }[];
            }[];
          };
        };
      };

      const period = data.periods['2weeks'];
      if (!period?.categories?.length) {
        return interaction.editReply({
          embeds: [this.metaFallbackEmbed()],
        });
      }

      const { metadata } = period;
      const startDate = new Date(metadata.startDate).toLocaleDateString(
        'fr-FR',
        { day: 'numeric', month: 'short' },
      );
      const endDate = new Date(metadata.endDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const embed = new EmbedBuilder()
        .setTitle('📊 Méta Beyblade X')
        .setDescription(
          `Période : **${startDate} — ${endDate}**\n` +
            `${metadata.eventsScanned} tournois analysés · Source : [bbxweekly.com](https://bbxweekly.com)`,
        )
        .setColor(0xfbbf24)
        .setFooter({
          text: 'Détails complets sur rpbey.fr/meta',
        })
        .setTimestamp(new Date(data.scrapedAt));

      for (const cat of period.categories) {
        const emoji = CATEGORY_EMOJIS[cat.category] || '📦';
        const top = cat.components.slice(0, 5);
        const lines = top.map((c, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '▪️';
          const trend =
            c.position_change === 'NEW'
              ? ' 🆕'
              : c.position_change > 0
                ? ` ↑${c.position_change}`
                : c.position_change < 0
                  ? ` ↓${Math.abs(c.position_change)}`
                  : '';
          return `${medal} **${c.name}** — ${c.score}pts${trend}`;
        });
        embed.addFields({
          name: `${emoji} ${cat.category}`,
          value: lines.join('\n'),
          inline: true,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Failed to load meta data:', err);
      return interaction.editReply({ embeds: [this.metaFallbackEmbed()] });
    }
  }

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
