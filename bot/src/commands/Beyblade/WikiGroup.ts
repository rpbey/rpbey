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
      console.error('Failed to load meta data:', err);
    }

    // Fallback to hardcoded meta
    const currentMonth = new Date().toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    const embed = new EmbedBuilder()
      .setTitle(`📊 Méta Beyblade X (${currentMonth})`)
      .setColor(0xfbbf24)
      .addFields(
        {
          name: '🚀 Attaque',
          value: '• Dran Buster 1-60 Flat\n• Phoenix Wing 9-60 Rush',
          inline: true,
        },
        {
          name: '🔋 Endurance',
          value: '• Rod 9-60 Ball\n• Wizard Rod 5-70 Ball',
          inline: true,
        },
        {
          name: '🛡️ Défense',
          value: '• Knight Shield 3-80 High Needle',
          inline: true,
        },
      )
      .setFooter({ text: 'Consultez rpbey.fr/meta pour plus de détails.' });
    return interaction.editReply({ embeds: [embed] });
  }

  @Slash({ name: 'formats', description: 'Formats de tournoi officiels' })
  @SlashGroup('wiki')
  async formats(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🏆 Formats de Tournoi RPB')
      .setColor(Colors.Secondary)
      .addFields(
        {
          name: 'Standard (3 Beys)',
          value: 'Le format classique de la 3on3 Battle.',
        },
        {
          name: 'Deck (Limited)',
          value: 'Restrictions sur certaines pièces méta.',
        },
        { name: 'Extreme', value: 'Points doublés sur les lignes X.' },
      );
    return interaction.reply({ embeds: [embed] });
  }
}
