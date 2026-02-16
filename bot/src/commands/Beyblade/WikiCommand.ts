import fs from 'node:fs';
import path from 'node:path';

import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';

import { Colors } from '../../lib/constants.js';

@Discord()
export class WikiCommand {
  @Slash({
    name: 'wiki',
    description: 'Rechercher une info dans le wiki officiel Beyblade X',
  })
  async wiki(
    @SlashOption({
      name: 'recherche',
      description: 'Le mot clé à chercher (ex: contact, faute, lancer)',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const dataPath = path.resolve(process.cwd(), '..', 'data/wbo_rules.json');
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const content = data.translatedMarkdown || data.markdown;

      const paragraphs = content.split('\n');
      const matches = paragraphs.filter((p: string) =>
        p.toLowerCase().includes(query.toLowerCase()),
      );

      if (matches.length === 0) {
        return interaction.editReply(
          `❌ Aucun résultat trouvé pour "**${query}**" dans les règles officielles.`,
        );
      }

      const result =
        matches[0].length > 1000
          ? `${matches[0].substring(0, 1000)}...`
          : matches[0];

      const embed = new EmbedBuilder()
        .setTitle(`📖 Wiki Beyblade X : ${query}`)
        .setDescription(result)
        .setURL(data.url)
        .setColor(Colors.Info)
        .setFooter({ text: 'Source : worldbeyblade.org' });

      return interaction.editReply({ embeds: [embed] });
    } catch (_error) {
      return interaction.editReply('❌ Erreur lors de la lecture du wiki.');
    }
  }
}
