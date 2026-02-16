import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';

import { logger } from '../../lib/logger.js';
import type { PrismaService } from '../../lib/prisma.js';

@Discord()
@SlashGroup({
  name: 'satr',
  description: 'Commandes liées à SATR',
})
@SlashGroup('satr')
@injectable()
export class SatrCommand {
  constructor(private prisma: PrismaService) {}

  @Slash({
    name: 'classement',
    description: 'Afficher le top 10 de la saison 2',
  })
  async ranking(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
      const top10 = await this.prisma.satrRanking.findMany({
        orderBy: { rank: 'asc' },
        take: 10,
      });

      if (top10.length === 0) {
        return interaction.editReply(
          '❌ Aucun classement disponible pour le moment.',
        );
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 SATR - Top 10 Saison 2')
        .setColor(0xfbbf24)
        .setThumbnail('https://rpbey.fr/satr-logo.webp')
        .setDescription(
          top10
            .map(
              (r) =>
                `**#${r.rank}** | **${r.playerName}** - \`${r.score} pts\` (${r.winRate})`,
            )
            .join('\n'),
        )
        .setFooter({
          text: 'Classements SATR : rpbey.fr/tournaments/satr • challonge.com/communities/sunafterthereign',
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('[SatrCommand]', error);
      return interaction.editReply(
        '❌ Erreur lors de la récupération du classement.',
      );
    }
  }

  @Slash({
    name: 'profil',
    description: 'Voir les statistiques de carrière SATR',
  })
  async profile(
    @SlashOption({
      name: 'joueur',
      description: 'Le nom du joueur à rechercher',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    searchName: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const name = searchName || interaction.user.displayName;

      const blader = await this.prisma.satrBlader.findFirst({
        where: {
          name: { contains: name, mode: 'insensitive' },
        },
      });

      if (!blader) {
        return interaction.editReply(
          `❌ Aucun profil de carrière trouvé pour "${name}".`,
        );
      }

      const history = blader.history as any[];
      const winRate =
        blader.totalWins + blader.totalLosses > 0
          ? (
              (blader.totalWins / (blader.totalWins + blader.totalLosses)) *
              100
            ).toFixed(1)
          : '0';

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Carrière SATR - ${blader.name}`)
        .setColor(0xdc2626)
        .addFields(
          {
            name: '⚔️ Victoires',
            value: `\`${blader.totalWins}\``,
            inline: true,
          },
          {
            name: '💀 Défaites',
            value: `\`${blader.totalLosses}\``,
            inline: true,
          },
          { name: '📈 Winrate', value: `\`${winRate}%\``, inline: true },
          {
            name: '🏆 Tournois',
            value: `\`${blader.tournamentsCount}\``,
            inline: true,
          },
        )
        .setDescription(
          `**Historique récent :**\n` +
            history
              .slice(-5)
              .reverse()
              .map(
                (h) =>
                  `• \`${h.tournament}\`: Rang **#${h.rank || '?'}** (${h.wins}W - ${h.losses}L)`,
              )
              .join('\n'),
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('[SatrCommand Profile]', error);
      return interaction.editReply('❌ Erreur lors de la recherche du profil.');
    }
  }
}
