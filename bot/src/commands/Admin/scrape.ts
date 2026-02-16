import * as fs from 'node:fs';
import * as path from 'node:path';

import { CheerioCrawler } from 'crawlee';
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { Discord, Guard, Slash, SlashOption } from 'discordx';

import { ModeratorOnly } from '../../guards/ModeratorOnly.js';
import { logger } from '../../lib/logger.js';

@Discord()
@Guard(ModeratorOnly)
export class ScrapeCommand {
  @Slash({
    name: 'aspirer',
    description: "Aspire le contenu d'une page web pour l'IA",
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
  })
  async scrape(
    @SlashOption({
      name: 'url',
      description: "L'URL de la page à analyser (ex: Wiki Beyblade)",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    url: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const kbPath = path.resolve(process.cwd(), 'data', 'knowledge_base.txt');
      const scrapedData: string[] = [];

      // Initialize Crawlee
      const crawler = new CheerioCrawler({
        // Limit to 1 page to avoid spiraling out of control
        maxRequestsPerCrawl: 1,
        async requestHandler({ $, log, request }) {
          log.info(`Processing ${request.url}...`);

          // Extract title
          const title = $('title').text().trim();

          // Extract main content - adjust selectors for Fandom/Wiki if needed
          // General purpose selector for main text content
          const content = $('p, h1, h2, h3, li')
            .map((_, el) => $(el).text().trim())
            .get()
            .filter((text) => text.length > 20) // Filter out short junk
            .join('\n');

          scrapedData.push(`Source: ${title} (${request.url})\n${content}`);
        },
      });

      await crawler.run([url]);

      if (scrapedData.length === 0) {
        return interaction.editReply(
          "❌ Impossible d'extraire du contenu textuel de cette page.",
        );
      }

      // Append to Knowledge Base
      const newEntry = `\n\n--- INFO IMPORTÉE LE ${new Date().toLocaleDateString()} ---\n${scrapedData.join('\n')}`;
      fs.appendFileSync(kbPath, newEntry);

      return interaction.editReply(
        "✅ **Succès !**\nLe contenu de la page a été ajouté à la base de connaissances.\nL'IA peut maintenant répondre aux questions sur ce sujet !",
      );
    } catch (error) {
      logger.error('[Scrape] Error:', error);
      return interaction.editReply(
        '❌ Une erreur est survenue lors du scraping.',
      );
    }
  }
}
