import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder } from 'discord.js';
import prisma from '../../lib/prisma.js';

export class PartCommand extends Subcommand {
  public constructor(
    context: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(context, {
      ...options,
      name: 'piece',
      description: "Obtenir les statistiques d'une pièce",
      subcommands: [
        { name: 'blade', chatInputRun: 'chatInputBlade' },
        { name: 'ratchet', chatInputRun: 'chatInputRatchet' },
        { name: 'bit', chatInputRun: 'chatInputBit' },
      ],
    });
  }

  override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('piece')
        .setDescription("Obtenir les statistiques d'une pièce")
        .addSubcommand((command) =>
          command
            .setName('blade')
            .setDescription("Statistiques d'une Blade")
            .addStringOption((option) =>
              option
                .setName('nom')
                .setDescription('Nom de la Blade (ex: Dran Sword)')
                .setRequired(true),
            ),
        )
        .addSubcommand((command) =>
          command
            .setName('ratchet')
            .setDescription("Statistiques d'un Ratchet")
            .addStringOption((option) =>
              option
                .setName('nom')
                .setDescription('Nom du Ratchet (ex: 3-60)')
                .setRequired(true),
            ),
        )
        .addSubcommand((command) =>
          command
            .setName('bit')
            .setDescription("Statistiques d'un Bit")
            .addStringOption((option) =>
              option
                .setName('nom')
                .setDescription('Nom du Bit (ex: Flat)')
                .setRequired(true),
            ),
        ),
    );
  }

  public async chatInputBlade(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();
    const query = interaction.options.getString('nom', true);

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

  public async chatInputRatchet(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();
    const query = interaction.options.getString('nom', true);

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

  public async chatInputBit(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();
    const query = interaction.options.getString('nom', true);

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
