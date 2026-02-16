import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
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

  @Slash({
    name: 'apprendre',
    description: "Enseigner quelque chose à l'IA du bot",
  })
  async teach(
    @SlashOption({
      name: 'sujet',
      description: 'Le sujet (ex: Dranzer)',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    topic: string,
    @SlashOption({
      name: 'contenu',
      description: 'Le contenu informatif',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    content: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    try {
      await this.prisma.contentBlock.upsert({
        where: { slug: topic.toLowerCase() },
        create: { slug: topic.toLowerCase(), title: topic, content },
        update: { content },
      });
      return interaction.editReply(
        `✅ Information sur **${topic}** enregistrée.`,
      );
    } catch (error) {
      logger.error(error);
      return interaction.editReply('❌ Erreur.');
    }
  }
}
