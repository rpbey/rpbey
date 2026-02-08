import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { scrapeAndSyncTournament } from '../../lib/challonge-sync.js';
import { Colors } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';
import type {
  ScrapedStanding,
  ScrapedStation,
} from '../../lib/scrapers/challonge-scraper.js';

@ApplyOptions<Subcommand.Options>({
  description: 'Gérer les tournois Challonge',
  preconditions: ['GuildOnly'],
  subcommands: [
    {
      name: 'synchroniser',
      chatInputRun: 'chatInputSynchroniser',
    },
    {
      name: 'live',
      chatInputRun: 'chatInputLive',
    },
  ],
})
export class TournamentCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('tournoi')
        .setDescription('Commandes de gestion des tournois')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addSubcommand((command) =>
          command
            .setName('synchroniser')
            .setDescription('Synchronisation profonde via scraping furtif')
            .addStringOption((option) =>
              option
                .setName('url')
                .setDescription(
                  'URL complète ou slug du tournoi (ex: fr/B_TS2)',
                )
                .setRequired(true),
            ),
        )
        .addSubcommand((command) =>
          command
            .setName('live')
            .setDescription("Affiche le statut live d'un tournoi en cours")
            .addStringOption((option) =>
              option
                .setName('tournoi')
                .setDescription(
                  'Nom ou ID Challonge du tournoi (par défaut: premier tournoi en cours)',
                )
                .setRequired(false),
            ),
        ),
    );
  }

  public async chatInputSynchroniser(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const url = interaction.options.getString('url', true);

    await interaction.deferReply({ ephemeral: false });

    try {
      await interaction.editReply(
        `🕵️ **Démarrage de la synchronisation furtive...**\nURL: \`${url}\`\n(Cette opération peut prendre 15-30 secondes)`,
      );

      const result = await scrapeAndSyncTournament(url);

      if (result.success) {
        return interaction.editReply(
          `✅ **Synchronisation terminée !**\n\n` +
            `🏆 Tournoi mis à jour en base de données.\n` +
            `👥 **${result.participantsCount}** joueurs synchronisés.\n` +
            `⚔️ **${result.matchesCount}** matchs importés.\n` +
            `🏅 **${result.standingsCount}** standings récupérés.\n` +
            `📡 **${result.stationsCount}** stations détectées.\n` +
            `📜 **${result.logEntriesCount}** entrées de log.\n\n` +
            `👉 Voir sur : https://rpbey.fr/admin/tournaments`,
        );
      } else {
        return interaction.editReply(
          `❌ **Échec de la synchronisation.**\nErreur: \`${result.error}\``,
        );
      }
    } catch (error) {
      this.container.logger.error('[TournamentSync]', error);
      return interaction.editReply(
        `💥 **Erreur critique lors de l'opération.**\n\`${error instanceof Error ? error.message : String(error)}\``,
      );
    }
  }

  public async chatInputLive(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const search = interaction.options.getString('tournoi');

    await interaction.deferReply({ ephemeral: false });

    try {
      // Chercher le tournoi en cours
      const tournament = search
        ? await prisma.tournament.findFirst({
            where: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { challongeId: search },
              ],
              status: 'UNDERWAY',
            },
          })
        : await prisma.tournament.findFirst({
            where: { status: 'UNDERWAY' },
            orderBy: { date: 'desc' },
          });

      if (!tournament) {
        return interaction.editReply(
          `❌ Aucun tournoi en cours trouvé${search ? ` pour "${search}"` : ''}.`,
        );
      }

      const standings =
        (tournament.standings as ScrapedStanding[] | null) || [];
      const stations = (tournament.stations as ScrapedStation[] | null) || [];
      const participantCount = await prisma.tournamentParticipant.count({
        where: { tournamentId: tournament.id },
      });
      const matchCount = await prisma.tournamentMatch.count({
        where: { tournamentId: tournament.id },
      });
      const completedMatches = await prisma.tournamentMatch.count({
        where: { tournamentId: tournament.id, state: 'complete' },
      });

      // Top 5 standings
      const top5 = standings.slice(0, 5);
      const standingsText =
        top5.length > 0
          ? top5
              .map(
                (s) => `**${s.rank}.** ${s.name} (${s.wins}W - ${s.losses}L)`,
              )
              .join('\n')
          : '*Standings non disponibles*';

      // Stations actives
      const activeStations = stations.filter((s) => s.status === 'active');
      const stationsText =
        activeStations.length > 0
          ? activeStations
              .map((s) => {
                const match = s.currentMatch;
                return match
                  ? `**${s.name}** : ${match.player1 || '?'} vs ${match.player2 || '?'} (${match.scores})`
                  : `**${s.name}** : En cours`;
              })
              .join('\n')
          : '*Aucune station active*';

      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${tournament.name}`)
        .setColor(Colors.Primary)
        .addFields(
          {
            name: '📊 Progression',
            value: `${completedMatches}/${matchCount} matchs terminés | ${participantCount} participants`,
            inline: false,
          },
          {
            name: '🏅 Top 5',
            value: standingsText,
            inline: true,
          },
          {
            name: `📡 Stations (${activeStations.length}/${stations.length})`,
            value: stationsText,
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({ text: 'Dernière sync' });

      if (tournament.challongeUrl) {
        embed.setURL(tournament.challongeUrl);
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('[TournamentLive]', error);
      return interaction.editReply(
        `💥 **Erreur lors de la récupération des données live.**\n\`${error instanceof Error ? error.message : String(error)}\``,
      );
    }
  }
}
