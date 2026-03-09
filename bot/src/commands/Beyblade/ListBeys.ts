import { Pagination } from '@discordx/pagination';
import { type CommandInteraction, EmbedBuilder } from 'discord.js';
import { Discord, Slash } from 'discordx';
import { inject, injectable } from 'tsyringe';

import { Colors, RPB } from '../../lib/constants.js';
import { PrismaService } from '../../lib/prisma.js';

@Discord()
@injectable()
export class ListBeysCommand {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  @Slash({
    name: 'beys',
    description: 'Liste toutes les toupies Beyblade X enregistrées',
  })
  async list(interaction: CommandInteraction) {
    await interaction.deferReply();

    const blades = await this.prisma.beyblade.findMany({
      orderBy: { name: 'asc' },
    });

    if (blades.length === 0) {
      return interaction.editReply(
        '❌ Aucune toupie trouvée dans la base de données.',
      );
    }

    const pageSize = 5;
    const pages = [];

    for (let i = 0; i < blades.length; i += pageSize) {
      const current = blades.slice(i, i + pageSize);
      const embed = new EmbedBuilder()
        .setTitle('🌀 Beyblade X - Bibliothèque')
        .setColor(Colors.Beyblade)
        .setFooter({
          text: `${RPB.FullName} | Page ${Math.floor(i / pageSize) + 1} / ${Math.ceil(blades.length / pageSize)}`,
        })
        .setTimestamp();

      for (const blade of current) {
        embed.addFields({
          name: `${blade.name} (${blade.beyType || 'Inconnu'})`,
          value: `Poids: ${blade.totalWeight || 'Inconnu'}g`,
        });
      }

      pages.push({ embeds: [embed] });
    }

    const pagination = new Pagination(interaction, pages);
    await pagination.send();
  }
}
