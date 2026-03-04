import {
  ApplicationCommandOptionType,
  type AutocompleteInteraction,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';

import prisma from '../../lib/prisma.js';

@Discord()
@SlashGroup({
  name: 'piece',
  description: "Obtenir les statistiques d'une pièce",
})
@SlashGroup('piece')
export class PartCommand {
  static async autocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    const query = focusedOption.value.toLowerCase();

    // Déduire le type de pièce selon le nom de la sous-commande
    let type: 'BLADE' | 'RATCHET' | 'BIT' = 'BLADE';
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'ratchet') type = 'RATCHET';
    if (subcommand === 'bit') type = 'BIT';

    const parts = await prisma.part.findMany({
      where: {
        type: type,
        name: { contains: query, mode: 'insensitive' },
      },
      take: 25,
      orderBy: { name: 'asc' },
    });

    return interaction.respond(
      parts.map((p) => ({ name: p.name, value: p.name })),
    );
  }

  @Slash({ name: 'blade', description: "Statistiques d'une Blade" })
  async blade(
    @SlashOption({
      name: 'nom',
      description: 'Nom de la Blade (ex: Dran Sword)',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: PartCommand.autocomplete,
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const part = await prisma.part.findFirst({
      where: {
        type: 'BLADE',
        name: { contains: query, mode: 'insensitive' },
      },
    });

    if (!part) {
      return interaction.editReply(`❌ Aucune Blade trouvée pour "${query}".`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`${part.system || 'BX'} | ${part.name}`)
      .setColor(0xdc2626)
      .addFields(
        { name: 'Type', value: part.beyType || 'Balance', inline: true },
        { name: 'Poids', value: `${part.weight || '?'}g`, inline: true },
        {
          name: 'Rotation',
          value: part.spinDirection || 'Right',
          inline: true,
        },
        { name: 'Attaque', value: part.attack || '?', inline: true },
        { name: 'Défense', value: part.defense || '?', inline: true },
        { name: 'Endurance', value: part.stamina || '?', inline: true },
      )
      .setFooter({ text: `RPB Database • ${part.externalId}` });

    if (part.imageUrl) {
      embed.setThumbnail(`https://rpbey.fr${part.imageUrl}`);
    }

    return interaction.editReply({ embeds: [embed] });
  }

  @Slash({ name: 'ratchet', description: "Statistiques d'un Ratchet" })
  async ratchet(
    @SlashOption({
      name: 'nom',
      description: 'Nom du Ratchet (ex: 3-60)',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: PartCommand.autocomplete,
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const part = await prisma.part.findFirst({
      where: {
        type: 'RATCHET',
        name: { contains: query, mode: 'insensitive' },
      },
    });

    if (!part) {
      return interaction.editReply(`❌ Aucun Ratchet trouvé pour "${query}".`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`${part.system || 'BX'} | ${part.name}`)
      .setColor(0x3b82f6)
      .addFields(
        {
          name: 'Hauteur',
          value: String(part.height || part.name.split('-')[0] || '?'),
          inline: true,
        },
        { name: 'Poids', value: `${part.weight || '?'}g`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Attaque', value: part.attack || '?', inline: true },
        { name: 'Défense', value: part.defense || '?', inline: true },
        { name: 'Endurance', value: part.stamina || '?', inline: true },
      )
      .setFooter({ text: `RPB Database` });

    if (part.imageUrl) {
      embed.setThumbnail(`https://rpbey.fr${part.imageUrl}`);
    }

    return interaction.editReply({ embeds: [embed] });
  }

  @Slash({ name: 'bit', description: "Statistiques d'un Bit" })
  async bit(
    @SlashOption({
      name: 'nom',
      description: 'Nom du Bit (ex: Flat)',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: PartCommand.autocomplete,
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const part = await prisma.part.findFirst({
      where: {
        type: 'BIT',
        name: { contains: query, mode: 'insensitive' },
      },
    });

    if (!part) {
      return interaction.editReply(`❌ Aucun Bit trouvé pour "${query}".`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`${part.system || 'BX'} | ${part.name}`)
      .setColor(0x22c55e)
      .addFields(
        { name: 'Type', value: part.beyType || '?', inline: true },
        { name: 'Poids', value: `${part.weight || '?'}g`, inline: true },
        { name: 'Burst Res.', value: part.burst || '?', inline: true },
        { name: 'Attaque', value: part.attack || '?', inline: true },
        { name: 'Défense', value: part.defense || '?', inline: true },
        { name: 'Endurance', value: part.stamina || '?', inline: true },
        { name: 'Dash', value: part.dash || '?', inline: true },
      )
      .setFooter({ text: `RPB Database` });

    if (part.imageUrl) {
      embed.setThumbnail(`https://rpbey.fr${part.imageUrl}`);
    }

    return interaction.editReply({ embeds: [embed] });
  }
}
