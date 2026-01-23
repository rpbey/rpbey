import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { Colors } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';
import { generateLeaderboardCard } from '../../lib/canvas-utils.js';

@ApplyOptions<Command.Options>({
  description: 'Afficher le classement officiel des bladers RPB',
})
export class LeaderboardCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('classement')
        .setDescription('Afficher le Top 10 des bladers RPB'),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      // Logic mirrors src/app/(marketing)/rankings/page.tsx
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
                notIn: ['Yoyo', 'Loteux', '𝓡𝓟𝓑 | LOTTEUX!']
            }
          },
          rankingPoints: { gt: 0 }, // Only show players with points
        },
        orderBy: [
          { rankingPoints: 'desc' },
          { tournamentWins: 'desc' },
          { wins: 'desc' },
        ],
        take: 10,
        include: {
          user: true,
        },
      });

      if (profiles.length === 0) {
        return interaction.editReply('Aucun blader classé pour le moment.');
      }

      // Generate Card Data
      const leaderboardEntries = profiles.map((p, index) => {
        const totalMatches = p.wins + p.losses;
        const winRate = totalMatches > 0 
            ? ((p.wins / totalMatches) * 100).toFixed(1) 
            : '0';

        return {
            rank: index + 1,
            name: p.bladerName || p.user.name || 'Blader',
            points: p.rankingPoints,
            winRate,
            avatarUrl: p.user.image || p.user.serverAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'
        };
      });

      const buffer = await generateLeaderboardCard(leaderboardEntries);
      const attachment = new AttachmentBuilder(buffer, { name: 'leaderboard.png' });

      // Find self rank logic remains same
      const user = await prisma.user.findUnique({
          where: { discordId: interaction.user.id },
          include: { profile: true }
      });

      let content = '';
      if (user && user.profile && user.profile.rankingPoints > 0) {
          const rank = await prisma.profile.count({
              where: {
                  rankingPoints: { gt: user.profile.rankingPoints },
                  userId: {
                    notIn: [
                      'Y5gdJ6ZpfAHfsNcJQc0PMbAqyVeQAiHE', // Yoyo
                      'O3Q8olZegE8dfLZTbrQtuD5T3ZqVUkxJ', // Loteux
                    ]
                  }
              }
          }) + 1;
          content = `Tu es actuellement **#${rank}** avec **${user.profile.rankingPoints} pts**.`;
      }

      return interaction.editReply({ 
          content,
          files: [attachment] 
      });

    } catch (error) {
      this.container.logger.error(error);
      return interaction.editReply('❌ Une erreur est survenue lors de la récupération du classement.');
    }
  }
}
