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
    try {
      const dataPath = path.resolve(process.cwd(), '..', 'data/meta.json');
      if (fs.existsSync(dataPath)) {
        const meta = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as {
          updatedAt?: string;
          categories?: { name: string; emoji: string; combos: string[] }[];
        };
        const date = meta.updatedAt
          ? new Date(meta.updatedAt).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })
          : new Date().toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            });
        const embed = new EmbedBuilder()
          .setTitle(`📊 Méta Beyblade X (${date})`)
          .setColor(0xfbbf24)
          .setFooter({
            text: 'Consultez rpbey.fr/meta pour plus de détails.',
          });

        if (meta.categories) {
          for (const cat of meta.categories.slice(0, 6)) {
            embed.addFields({
              name: `${cat.emoji} ${cat.name}`,
              value: cat.combos.map((c) => `• ${c}`).join('\n') || 'N/A',
              inline: true,
            });
          }
        }
        return interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      logger.error('Failed to load meta data:', err);
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Méta Beyblade X')
      .setColor(0xfbbf24)
      .setDescription(
        'Les données méta ne sont pas disponibles actuellement.\n\n' +
          '**Consultez la page dédiée pour les informations à jour :**\n' +
          '[rpbey.fr/meta](https://rpbey.fr/meta)',
      )
      .setFooter({ text: 'Données mises à jour régulièrement sur le site.' });
    return interaction.editReply({ embeds: [embed] });
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
