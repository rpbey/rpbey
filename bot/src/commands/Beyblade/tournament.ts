import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { getChallongeClient } from '../../lib/challonge.js';
import {
  importTournament,
  syncParticipants,
} from '../../lib/challonge-sync.js';
import { Colors, RPB } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';

export class TournamentCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Gestion des tournois Beyblade via Challonge',
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('tournoi')
        .setDescription('Gestion des tournois Beyblade')
        .addSubcommand((sub) =>
          sub
            .setName('liste')
            .setDescription('Affiche la liste des tournois actifs'),
        )
        .addSubcommand((sub) =>
          sub
            .setName('info')
            .setDescription("Affiche les infos d'un tournoi")
            .addStringOption((opt) =>
              opt
                .setName('id')
                .setDescription('ID ou URL du tournoi Challonge')
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('participants')
            .setDescription("Liste les participants d'un tournoi")
            .addStringOption((opt) =>
              opt
                .setName('id')
                .setDescription('ID ou URL du tournoi Challonge')
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('matches')
            .setDescription("Liste les matches d'un tournoi")
            .addStringOption((opt) =>
              opt
                .setName('id')
                .setDescription('ID ou URL du tournoi Challonge')
                .setRequired(true),
            )
            .addStringOption((opt) =>
              opt
                .setName('état')
                .setDescription('Filtrer par état')
                .addChoices(
                  { name: '🟡 En attente', value: 'pending' },
                  { name: '🟢 En cours', value: 'open' },
                  { name: '✅ Terminé', value: 'complete' },
                ),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('règles')
            .setDescription('Affiche les règles des tournois RPB'),
        )
        .addSubcommand((sub) =>
          sub
            .setName('créer')
            .setDescription('Créer un nouveau tournoi (Admin)')
            .addStringOption((opt) =>
              opt
                .setName('nom')
                .setDescription('Nom du tournoi')
                .setRequired(true),
            )
            .addStringOption((opt) =>
              opt
                .setName('type')
                .setDescription('Type de bracket')
                .addChoices(
                  { name: 'Single Elimination', value: 'single elimination' },
                  { name: 'Double Elimination', value: 'double elimination' },
                  { name: 'Round Robin', value: 'round robin' },
                  { name: 'Swiss', value: 'swiss' },
                ),
            )
            .addStringOption((opt) =>
              opt
                .setName('description')
                .setDescription('Description du tournoi'),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('importer')
            .setDescription(
              'Importer un tournoi Challonge en base de données (Admin)',
            )
            .addStringOption((opt) =>
              opt
                .setName('id')
                .setDescription('ID ou URL du tournoi Challonge')
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('sync')
            .setDescription(
              "Synchroniser les participants d'un tournoi (Admin)",
            )
            .addStringOption((opt) =>
              opt
                .setName('id')
                .setDescription('ID ou URL du tournoi Challonge')
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('local')
            .setDescription(
              'Affiche les tournois depuis la base de données locale',
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('verifier-liens')
            .setDescription(
              'Vérifie les comptes non liés sur un tournoi et notifie le salon dédié (Admin)',
            )
            .addStringOption((opt) =>
              opt
                .setName('id')
                .setDescription('ID ou URL du tournoi Challonge')
                .setRequired(true),
            ),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'liste':
        return this.listTournaments(interaction);
      case 'info':
        return this.showTournament(interaction);
      case 'participants':
        return this.listParticipants(interaction);
      case 'matches':
        return this.listMatches(interaction);
      case 'règles':
        return this.showRules(interaction);
      case 'créer':
        return this.createTournament(interaction);
      case 'importer':
        return this.importTournament(interaction);
      case 'sync':
        return this.syncTournament(interaction);
      case 'local':
        return this.listLocalTournaments(interaction);
      case 'verifier-liens':
        return this.checkLinks(interaction);
      default:
        return interaction.reply({
          content: '❌ Sous-commande inconnue.',
          ephemeral: true,
        });
    }
  }

  private async checkLinks(interaction: Command.ChatInputCommandInteraction) {
    // Check admin permissions
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '❌ Seuls les administrateurs peuvent effectuer cette vérification.',
        ephemeral: true,
      });
    }

    const challongeId = interaction.options.getString('id', true);
    await interaction.deferReply();

    try {
      const challonge = getChallongeClient();
      const [tournamentRes, participantsRes] = await Promise.all([
        challonge.getTournament(challongeId),
        challonge.listParticipants(challongeId),
      ]);

      const tournament = tournamentRes.data;
      const participants = participantsRes.data;

      if (!participants || participants.length === 0) {
        return interaction.editReply('📭 Aucun participant inscrit à ce tournoi.');
      }

      const unlinkedParticipants: string[] = [];

      for (const p of participants) {
        // 1. Check if already linked in Challonge metadata (misc field)
        if (p.attributes.misc) continue;

        // 2. Check if linked via Profile name matching
        const user = await prisma.user.findFirst({
          where: {
            profile: {
              challongeUsername: {
                equals: p.attributes.name,
                mode: 'insensitive',
              },
            },
          },
        });

        if (!user) {
          unlinkedParticipants.push(p.attributes.name);
        }
      }

      if (unlinkedParticipants.length === 0) {
        return interaction.editReply('✅ Tous les participants ont un compte Discord lié !');
      }

      // Send report to the specific channel
      const targetChannelId = '1456760750893826293';
      const targetChannel = await interaction.client.channels.fetch(targetChannelId);

      if (targetChannel && targetChannel.type === ChannelType.GuildText) {
        const embed = new EmbedBuilder()
          .setTitle(`⚠️ Comptes non liés - ${tournament.attributes.name}`)
          .setDescription(
            `Les participants Challonge suivants n'ont pas encore lié leur compte Discord :\n\n` +
            unlinkedParticipants.map(name => `• **${name}**`).join('\n') +
            `\n\n👉 Utilisez la commande \`/challonge lier <pseudo>\` pour lier votre compte et apparaître dans le classement !`
          )
          .setColor(Colors.Warning)
          .setFooter({ text: `${unlinkedParticipants.length} compte(s) non lié(s)` })
          .setTimestamp();

        await targetChannel.send({
          content: '<@&1451549606608371814>',
          embeds: [embed]
        });

        return interaction.editReply(
          `✅ Rapport envoyé dans <#${targetChannelId}>. ${unlinkedParticipants.length} participants non liés détectés.`
        );
      } else {
        return interaction.editReply(
          `❌ Impossible de trouver ou d'écrire dans le salon <#${targetChannelId}>.`
        );
      }

    } catch (error) {
      this.container.logger.error('Check links error:', error);
      return interaction.editReply('❌ Erreur lors de la vérification des liens.');
    }
  }

  private async listTournaments(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const challonge = getChallongeClient();
      const response = await challonge.listTournaments({ per_page: 10 });

      if (!response.data || response.data.length === 0) {
        return interaction.editReply('📭 Aucun tournoi trouvé.');
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Tournois RPB')
        .setColor(Colors.Secondary)
        .setDescription('Liste des tournois sur Challonge')
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      for (const tournament of response.data.slice(0, 10)) {
        const stateEmoji = this.getStateEmoji(tournament.attributes.state);
        embed.addFields({
          name: `${stateEmoji} ${tournament.attributes.name}`,
          value:
            `📊 ${tournament.attributes.participantsCount} participants\n` +
            `🔗 [Voir sur Challonge](https://challonge.com/${tournament.attributes.url})`,
          inline: true,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('Challonge API error:', error);
      return interaction.editReply(
        '❌ Erreur lors de la récupération des tournois. Vérifie la clé API.',
      );
    }
  }

  private async showTournament(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const tournamentId = interaction.options.getString('id', true);
    await interaction.deferReply();

    try {
      const challonge = getChallongeClient();
      const response = await challonge.getTournament(tournamentId);
      const t = response.data;

      const stateEmoji = this.getStateEmoji(t.attributes.state);
      const embed = new EmbedBuilder()
        .setTitle(`${stateEmoji} ${t.attributes.name}`)
        .setColor(Colors.Primary)
        .setDescription(t.attributes.description ?? 'Pas de description')
        .addFields(
          {
            name: '📊 Participants',
            value: `${t.attributes.participantsCount}`,
            inline: true,
          },
          {
            name: '🎮 Jeu',
            value: t.attributes.gameName ?? 'Beyblade',
            inline: true,
          },
          { name: '🏷️ Type', value: t.attributes.tournamentType, inline: true },
          { name: '📅 État', value: t.attributes.state, inline: true },
        )
        .setFooter({ text: `ID: ${t.id}` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Voir sur Challonge')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://challonge.com/${t.attributes.url}`)
          .setEmoji('🔗'),
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      this.container.logger.error('Challonge API error:', error);
      return interaction.editReply('❌ Tournoi non trouvé ou erreur API.');
    }
  }

  private async listParticipants(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const tournamentId = interaction.options.getString('id', true);
    await interaction.deferReply();

    try {
      const challonge = getChallongeClient();
      const response = await challonge.listParticipants(tournamentId);

      if (!response.data || response.data.length === 0) {
        return interaction.editReply('📭 Aucun participant inscrit.');
      }

      const participants = response.data
        .sort((a, b) => a.attributes.seed - b.attributes.seed)
        .map(
          (p, i) =>
            `${i + 1}. **${p.attributes.name}** ${p.attributes.checkedIn ? '✅' : ''}`,
        )
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('👥 Participants')
        .setColor(Colors.Info)
        .setDescription(participants.slice(0, 4000))
        .addFields({
          name: '📊 Total',
          value: `${response.data.length} participant(s)`,
        })
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('Challonge API error:', error);
      return interaction.editReply(
        '❌ Erreur lors de la récupération des participants.',
      );
    }
  }

  private async listMatches(interaction: Command.ChatInputCommandInteraction) {
    const tournamentId = interaction.options.getString('id', true);
    const state = interaction.options.getString('état') as
      | 'open'
      | 'pending'
      | 'complete'
      | null;
    await interaction.deferReply();

    try {
      const challonge = getChallongeClient();
      const [matchesRes, participantsRes] = await Promise.all([
        challonge.listMatches(tournamentId, state ? { state } : undefined),
        challonge.listParticipants(tournamentId),
      ]);

      if (!matchesRes.data || matchesRes.data.length === 0) {
        return interaction.editReply('📭 Aucun match trouvé.');
      }

      // Create participant ID to name map
      const participantMap = new Map<string, string>();
      for (const p of participantsRes.data) {
        participantMap.set(p.id, p.attributes.name);
      }

      const matches = matchesRes.data.slice(0, 15).map((m) => {
        const p1 = participantMap.get(m.attributes.player1Id ?? '') ?? 'TBD';
        const p2 = participantMap.get(m.attributes.player2Id ?? '') ?? 'TBD';
        const stateEmoji = this.getMatchStateEmoji(m.attributes.state);
        const score = m.attributes.scores || 'vs';
        return `${stateEmoji} **${p1}** ${score} **${p2}** (Round ${m.attributes.round})`;
      });

      const embed = new EmbedBuilder()
        .setTitle('⚔️ Matches')
        .setColor(Colors.Primary)
        .setDescription(matches.join('\n').slice(0, 4000))
        .setFooter({
          text: `${matchesRes.data.length} match(es) | ${RPB.FullName}`,
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('Challonge API error:', error);
      return interaction.editReply(
        '❌ Erreur lors de la récupération des matches.',
      );
    }
  }

  private async createTournament(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    // Check admin permissions
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '❌ Seuls les administrateurs peuvent créer des tournois.',
        ephemeral: true,
      });
    }

    const name = interaction.options.getString('nom', true);
    const type = interaction.options.getString('type') as
      | 'single elimination'
      | 'double elimination'
      | 'round robin'
      | 'swiss'
      | null;
    const description = interaction.options.getString('description');

    await interaction.deferReply();

    try {
      const challonge = getChallongeClient();
      const response = await challonge.createTournament({
        name,
        tournamentType: type ?? 'single elimination',
        description: description ?? `Tournoi organisé par ${RPB.FullName}`,
        gameName: 'Beyblade',
        openSignup: true,
      });

      const t = response.data;
      const embed = new EmbedBuilder()
        .setTitle('🎉 Tournoi créé !')
        .setColor(Colors.Success)
        .setDescription(`**${t.attributes.name}** a été créé avec succès !`)
        .addFields(
          { name: '🏷️ Type', value: t.attributes.tournamentType, inline: true },
          {
            name: '🔗 URL',
            value: `https://challonge.com/${t.attributes.url}`,
            inline: false,
          },
        )
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Gérer sur Challonge')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://challonge.com/${t.attributes.url}`)
          .setEmoji('⚙️'),
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      this.container.logger.error('Challonge API error:', error);
      return interaction.editReply('❌ Erreur lors de la création du tournoi.');
    }
  }

  private async showRules(interaction: Command.ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('📜 Règles des Tournois RPB')
      .setColor(Colors.Info)
      .addFields(
        {
          name: '1️⃣ Format Standard',
          value:
            '• Match en **Best of 3** (2 victoires)\n' +
            '• Points: Burst Finish = 2pts, Over/Spin = 1pt\n' +
            '• Premier à 3 points gagne',
          inline: false,
        },
        {
          name: '2️⃣ Équipement',
          value:
            '• Seules les toupies **officielles Takara Tomy/Hasbro** sont autorisées\n' +
            '• Pas de modifications\n' +
            '• Stadium officiel requis',
          inline: false,
        },
        {
          name: '3️⃣ Comportement',
          value:
            '• Respect des adversaires et arbitres\n' +
            '• Pas de triche ou comportement antisportif\n' +
            '• Fun avant tout ! 🎉',
          inline: false,
        },
        {
          name: '4️⃣ X-Treme Finish (Beyblade X)',
          value:
            '• Éjection via le rail X-treme = **3 points**\n' +
            '• Finit immédiatement le match !',
          inline: false,
        },
      )
      .setFooter({ text: `${RPB.FullName} | Let it rip!` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  private async importTournament(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    // Check admin permissions
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '❌ Seuls les administrateurs peuvent importer des tournois.',
        ephemeral: true,
      });
    }

    const challongeId = interaction.options.getString('id', true);
    await interaction.deferReply();

    try {
      const result = await importTournament(challongeId);

      if (!result.success) {
        return interaction.editReply(`❌ Erreur: ${result.error}`);
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Tournoi importé !')
        .setColor(Colors.Success)
        .setDescription(
          `Le tournoi a été importé en base de données.\n\n` +
            `**ID Challonge:** ${challongeId}\n` +
            `**Participants importés:** ${result.participantsCount}\n` +
            `**Requêtes API utilisées:** ${result.apiRequestsUsed}`,
        )
        .addFields({
          name: '💡 Info',
          value:
            'Le tournoi est maintenant en cache. Les participants seront synchronisés ' +
            'automatiquement 24h avant le début du tournoi.',
        })
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('Import tournament error:', error);
      return interaction.editReply("❌ Erreur lors de l'import du tournoi.");
    }
  }

  private async syncTournament(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    // Check admin permissions
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content:
          '❌ Seuls les administrateurs peuvent synchroniser les tournois.',
        ephemeral: true,
      });
    }

    const challongeId = interaction.options.getString('id', true);
    await interaction.deferReply();

    try {
      const result = await syncParticipants(challongeId);

      if (!result.success) {
        return interaction.editReply(`❌ Erreur: ${result.error}`);
      }

      const embed = new EmbedBuilder()
        .setTitle('🔄 Synchronisation terminée')
        .setColor(Colors.Success)
        .setDescription(
          `**ID Challonge:** ${challongeId}\n` +
            `**Participants synchronisés:** ${result.participantsCount}\n` +
            `**Requêtes API utilisées:** ${result.apiRequestsUsed}`,
        )
        .addFields({
          name: '⚠️ Attention',
          value:
            'Chaque sync consomme 1 requête API. ' +
            'Limite: 500 requêtes/mois. Utilisez avec parcimonie !',
        })
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('Sync tournament error:', error);
      return interaction.editReply('❌ Erreur lors de la synchronisation.');
    }
  }

  private async listLocalTournaments(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const tournaments = await prisma.tournament.findMany({
        orderBy: { date: 'asc' },
        include: {
          _count: { select: { participants: true } },
        },
        take: 10,
      });

      if (tournaments.length === 0) {
        return interaction.editReply('📭 Aucun tournoi en base de données.');
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Tournois RPB (Local)')
        .setColor(Colors.Primary)
        .setDescription(
          'Tournois stockés en base de données (pas de requête API)',
        )
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      for (const t of tournaments) {
        const stateEmoji = this.getLocalStateEmoji(t.status);
        const date = t.date
          ? `<t:${Math.floor(t.date.getTime() / 1000)}:R>`
          : 'Non défini';

        embed.addFields({
          name: `${stateEmoji} ${t.name}`,
          value:
            `📊 ${t._count.participants} participants\n` +
            `📅 ${date}\n` +
            (t.challongeId
              ? `🔗 [Challonge](https://challonge.com/${t.challongeId})`
              : ''),
          inline: true,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('List local tournaments error:', error);
      return interaction.editReply(
        '❌ Erreur lors de la récupération des tournois.',
      );
    }
  }

  private getLocalStateEmoji(status: string): string {
    switch (status) {
      case 'UPCOMING':
        return '📅';
      case 'REGISTRATION_OPEN':
        return '🟡';
      case 'REGISTRATION_CLOSED':
        return '🔒';
      case 'CHECKIN':
        return '📋';
      case 'UNDERWAY':
        return '🟢';
      case 'COMPLETE':
        return '✅';
      case 'CANCELLED':
        return '❌';
      default:
        return '⚪';
    }
  }

  private getStateEmoji(state: string): string {
    switch (state) {
      case 'pending':
        return '🟡';
      case 'underway':
      case 'in_progress':
        return '🟢';
      case 'complete':
      case 'ended':
        return '✅';
      default:
        return '⚪';
    }
  }

  private getMatchStateEmoji(state: string): string {
    switch (state) {
      case 'pending':
        return '⏳';
      case 'open':
        return '🟢';
      case 'complete':
        return '✅';
      default:
        return '⚪';
    }
  }
}
