import { type CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Discord, Slash, SlashGroup } from 'discordx';
import { injectable } from 'tsyringe';
import { syncRankingRolesTask } from '../../cron/tasks/SyncRankingRoles.js';
import { logger } from '../../lib/logger.js';
import type { PrismaService } from '../../lib/prisma.js';

@Discord()
@SlashGroup({
  name: 'admin',
  description: "Commandes d'administration du bot",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
})
@SlashGroup('admin')
@injectable()
export class AdminGroup {
  constructor(private prisma: PrismaService) {}

  @Slash({
    name: 'synchroniser-roles',
    description: 'Synchronise les rôles de paliers de points',
  })
  async syncRoles(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      await syncRankingRolesTask();
      return interaction.editReply(
        '✅ Synchronisation des rôles de points terminée.',
      );
    } catch (error) {
      logger.error(error);
      return interaction.editReply('❌ Erreur lors de la synchronisation.');
    }
  }

  @Slash({
    name: 'classement-raz',
    description: 'RAZ complet des points de classement',
  })
  async resetRanking(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const result = await this.prisma.profile.updateMany({
        data: { rankingPoints: 0 },
      });
      return interaction.editReply(
        `✅ Classement réinitialisé (${result.count} profils).`,
      );
    } catch (error) {
      logger.error(error);
      return interaction.editReply('❌ Erreur.');
    }
  }
}
