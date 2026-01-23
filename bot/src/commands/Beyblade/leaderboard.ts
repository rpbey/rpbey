import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { Colors, RPB } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';

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

      const totalCount = await prisma.profile.count({
        where: {
            userId: {
              notIn: [
                'Y5gdJ6ZpfAHfsNcJQc0PMbAqyVeQAiHE', // Yoyo
                'O3Q8olZegE8dfLZTbrQtuD5T3ZqVUkxJ', // Loteux
              ],
            },
            rankingPoints: { gt: 0 }
        }
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.Primary)
        .setTitle('🏆 Classement Officiel RPB')
        .setDescription(
            `Voici le Top 10 des meilleurs bladers de la République.\n` +
            `Voir le classement complet sur [rpbey.fr/rankings](https://rpbey.fr/rankings)`
        )
        .setFooter({ text: `Total: ${totalCount} bladers classés` })
        .setTimestamp();

      if (profiles.length === 0) {
        embed.setDescription('Aucun blader classé pour le moment.');
      } else {
        const lines = profiles.map((p, index) => {
          let medal = '';
          if (index === 0) medal = '🥇';
          else if (index === 1) medal = '🥈';
          else if (index === 2) medal = '🥉';
          else medal = `**#${index + 1}**`;

          const name = p.bladerName || p.user.name || 'Blader inconnu';
          const points = p.rankingPoints;
          const wins = p.tournamentWins > 0 ? ` | 🏆 ${p.tournamentWins}` : '';

          return `${medal} **${name}** — ${points} pts${wins}`;
        });

        embed.addFields({ name: 'Top 10', value: lines.join('\n') });
      }

      // Check user's own rank
      const userProfile = await prisma.profile.findUnique({
        where: { userId: interaction.user.id }, // Assuming Discord ID map isn't needed or is handled by userId matching?
        // Wait, profile.userId is the database ID (CUID or similar), NOT Discord ID directly.
        // We need to find the user first by Discord ID.
      });
      
      // Correct way to find self rank
      const user = await prisma.user.findUnique({
          where: { discordId: interaction.user.id },
          include: { profile: true }
      });

      if (user && user.profile && user.profile.rankingPoints > 0) {
          // Calculate rank
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
          
          embed.addFields({
              name: 'Ton rang',
              value: `Tu es actuellement **#${rank}** avec **${user.profile.rankingPoints} pts**.`
          });
      }

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      this.container.logger.error(error);
      return interaction.editReply('❌ Une erreur est survenue lors de la récupération du classement.');
    }
  }
}
