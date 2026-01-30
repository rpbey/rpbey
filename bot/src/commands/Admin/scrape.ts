import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from '@sapphire/framework';
import { CheerioCrawler } from 'crawlee';
import { PermissionFlagsBits } from 'discord.js';

export class ScrapeCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Scrape une page web pour enrichir la base de connaissances',
      preconditions: ['ModeratorOnly'],
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('aspirer')
        .setDescription("Aspire le contenu d'une page web pour l'IA")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption((opt) =>
          opt
            .setName('url')
            .setDescription("L'URL de la page à analyser (ex: Wiki Beyblade)")
            .setRequired(true),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const url = interaction.options.getString('url', true);
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
      this.container.logger.error('[Scrape] Error:', error);
      return interaction.editReply(
        '❌ Une erreur est survenue lors du scraping.',
      );
    }
  }
}
