import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { PermissionFlagsBits } from 'discord.js';
import { scrapeAndSyncTournament } from '../../lib/challonge-sync.js';

@ApplyOptions<Subcommand.Options>({
  description: 'Gérer les tournois Challonge',
  preconditions: ['GuildOnly'],
  subcommands: [
    {
      name: 'sync',
      chatInputRun: 'chatInputSync',
    },
  ],
})
export class TournamentCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('tournament')
        .setDescription('Commandes de gestion des tournois')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addSubcommand((command) =>
          command
            .setName('sync')
            .setDescription('Synchronisation profonde via scraping furtif')
            .addStringOption((option) =>
              option
                .setName('url')
                .setDescription('URL complète ou slug du tournoi (ex: fr/B_TS2)')
                .setRequired(true),
            ),
        ),
    );
  }

  public async chatInputSync(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const url = interaction.options.getString('url', true);
    
    await interaction.deferReply({ ephemeral: false }); // Visible car ça peut prendre du temps

    try {
      interaction.editReply(`🕵️ **Démarrage de la synchronisation furtive...**\nURL: 
${url}
(Cette opération peut prendre 15-30 secondes)`);
      
      const result = await scrapeAndSyncTournament(url);

      if (result.success) {
        return interaction.editReply(
          `✅ **Synchronisation terminée !**\n\n` +
          `🏆 Tournoi mis à jour en base de données.\n` +
          `👥 **${result.participantsCount}** joueurs synchronisés.\n` +
          `⚔️ **${result.matchesCount}** matchs importés.\n\n` +
          `👉 Voir sur : https://rpbey.fr/admin/tournaments`
        );
      } else {
        return interaction.editReply(
          `❌ **Échec de la synchronisation.**\nErreur: 
${result.error}
`
        );
      }
    } catch (error) {
      this.container.logger.error('[TournamentSync]', error);
      return interaction.editReply(
        `💥 **Erreur critique lors de l'opération.**\n
${error instanceof Error ? error.message : String(error)}
`
      );
    }
  }
}
