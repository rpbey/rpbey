import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { AttachmentBuilder } from 'discord.js';
import { generateLeaderboardCard } from '../../lib/canvas-utils.js';
import prisma from '../../lib/prisma.js';

@ApplyOptions<Command.Options>({
  description: 'Afficher le classement officiel des bladers RPB',
})
export class LeaderboardCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('classement')
        .setDescription('Afficher le classement des bladers RPB')
        .addStringOption((option) =>
          option
            .setName('format')
            .setDescription("Format de l'affichage")
            .setRequired(false)
            .addChoices(
              { name: 'Image (Top 10)', value: 'image' },
              { name: 'Texte Complet (.txt)', value: 'text' },
              { name: 'CSV Complet (.csv)', value: 'csv' },
            ),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();
    const format = interaction.options.getString('format') || 'image';

    try {
      // Common Query Logic
      const profiles = await prisma.profile.findMany({
        where: {
          userId: {
            notIn: [
              'Y5gdJ6ZpfAHfsNcJQc0PMbAqyVeQAiHE', // Yoyo
              'O3Q8olZegE8dfLZTbrQtuD5T3ZqVUkxJ', // Loteux
            ],
          },
          user: {
            name: {
              notIn: ['Yoyo', 'Loteux', '𝓡𝓟𝓑 | LOTTEUX!'],
            },
          },
          rankingPoints: { gt: 0 }, // Only show players with points
        },
        orderBy: [
          { rankingPoints: 'desc' },
          { tournamentWins: 'desc' },
          { wins: 'desc' },
        ],
        // Take all if text/csv, else take 10
        take: format === 'image' ? 10 : undefined,
        include: {
          user: true,
        },
      });

      if (profiles.length === 0) {
        return interaction.editReply('Aucun blader classé pour le moment.');
      }

      if (format === 'image') {
        // Generate Card Data (Top 10)
        const leaderboardEntries = profiles.map((p, index) => {
          const totalMatches = p.wins + p.losses;
          const winRate =
            totalMatches > 0 ? ((p.wins / totalMatches) * 100).toFixed(1) : '0';

          return {
            rank: index + 1,
            name: p.bladerName || p.user.name || 'Blader',
            points: p.rankingPoints,
            winRate,
            avatarUrl:
              p.user.image ||
              p.user.serverAvatar ||
              'https://cdn.discordapp.com/embed/avatars/0.png',
          };
        });

        const buffer = await generateLeaderboardCard(leaderboardEntries);
        const attachment = new AttachmentBuilder(buffer, {
          name: 'leaderboard.png',
        });

        // Find self rank
        const user = await prisma.user.findUnique({
          where: { discordId: interaction.user.id },
          include: { profile: true },
        });

        let content = '';
        if (user?.profile && user.profile.rankingPoints > 0) {
          const rank =
            (await prisma.profile.count({
              where: {
                rankingPoints: { gt: user.profile.rankingPoints },
                userId: {
                  notIn: [
                    'Y5gdJ6ZpfAHfsNcJQc0PMbAqyVeQAiHE', // Yoyo
                    'O3Q8olZegE8dfLZTbrQtuD5T3ZqVUkxJ', // Loteux
                  ],
                },
              },
            })) + 1;
          content = `Tu es actuellement **#${rank}** avec **${user.profile.rankingPoints} pts**.`;
        }

        return interaction.editReply({
          content,
          files: [attachment],
        });
      }

      if (format === 'text') {
        // Generate formatted text table
        let textOutput = 'CLASSEMENT OFFICIEL RPB\n=======================\n\n';
        textOutput +=
          'RANG | BLADER               | PTS   | WIN% | W   | L   | TOURNOIS\n';
        textOutput +=
          '-----+----------------------+-------+------+-----+-----+---------\n';

        profiles.forEach((p, index) => {
          const rank = (index + 1).toString().padEnd(4);
          const name = (p.bladerName || p.user.name || 'Inconnu')
            .substring(0, 20)
            .padEnd(20);
          const points = p.rankingPoints.toString().padEnd(5);
          const totalMatches = p.wins + p.losses;
          const winRate = (
            totalMatches > 0
              ? ((p.wins / totalMatches) * 100).toFixed(1)
              : '0.0'
          ).padStart(4);
          const wins = p.wins.toString().padEnd(3);
          const losses = p.losses.toString().padEnd(3);
          const tourneys = p.tournamentWins.toString().padStart(8); // Center-ish

          textOutput += `${rank} | ${name} | ${points} | ${winRate}% | ${wins} | ${losses} | ${tourneys}\n`;
        });

        textOutput += `\nTotal: ${profiles.length} bladers classés.\n`;
        textOutput += `Généré le ${new Date().toLocaleString('fr-FR')}`;

        const buffer = Buffer.from(textOutput, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
          name: 'classement-rpb.txt',
        });

        return interaction.editReply({
          content: `📄 Voici le classement complet (${profiles.length} joueurs) :`,
          files: [attachment],
        });
      }

      if (format === 'csv') {
        // Generate CSV
        const header =
          'Rang,Blader,Pseudo Discord,Points,Victoires,Defaites,Matches,Winrate,Tournois,DateInscription\n';
        const rows = profiles
          .map((p, index) => {
            const totalMatches = p.wins + p.losses;
            const winRate =
              totalMatches > 0
                ? ((p.wins / totalMatches) * 100).toFixed(2)
                : '0';
            const name = `"${(p.bladerName || p.user.name || '').replace(/"/g, '""')}"`;
            const discordTag = `"${(p.user.discordTag || p.user.username || '').replace(/"/g, '""')}"`;

            return `${index + 1},${name},${discordTag},${p.rankingPoints},${p.wins},${p.losses},${totalMatches},${winRate},${p.tournamentWins},${p.user.createdAt.toISOString()}`;
          })
          .join('\n');

        const csvContent = header + rows;
        const buffer = Buffer.from(csvContent, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
          name: 'classement-rpb.csv',
        });

        return interaction.editReply({
          content: `📊 Export CSV complet (${profiles.length} joueurs) :`,
          files: [attachment],
        });
      }
    } catch (error) {
      this.container.logger.error(error);
      return interaction.editReply(
        '❌ Une erreur est survenue lors de la récupération du classement.',
      );
    }
  }
}
