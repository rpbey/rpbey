import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  type AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';

import { generateDeckCard } from '../../lib/canvas-utils.js';
import { Colors } from '../../lib/constants.js';
import type { PrismaService } from '../../lib/prisma.js';

const parseStat = (val: string | number | null | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

@Discord()
@SlashGroup({ name: 'deck', description: 'Gestion des équipements et decks' })
@SlashGroup('deck')
@injectable()
export class DeckCommand {
  constructor(private prisma: PrismaService) {}

  static async autocomplete(
    interaction: AutocompleteInteraction,
    prisma: PrismaService,
  ) {
    const focusedOption = interaction.options.getFocused(true);
    const query = focusedOption.value.toLowerCase();

    if (focusedOption.name === 'deck') {
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
        include: { decks: true },
      });
      if (!user) return interaction.respond([]);
      return interaction.respond(
        user.decks
          .filter((d) => d.name.toLowerCase().includes(query))
          .slice(0, 25)
          .map((d) => ({ name: d.name, value: d.id })),
      );
    }

    let type: 'BLADE' | 'RATCHET' | 'BIT' = 'BLADE';
    if (
      focusedOption.name === 'ratchet' ||
      interaction.options.getSubcommand() === 'ratchet'
    )
      type = 'RATCHET';
    if (
      focusedOption.name === 'bit' ||
      interaction.options.getSubcommand() === 'bit'
    )
      type = 'BIT';

    const parts = await prisma.part.findMany({
      where: { type, name: { contains: query, mode: 'insensitive' } },
      take: 25,
      orderBy: { name: 'asc' },
    });

    return interaction.respond(
      parts.map((p) => ({ name: p.name, value: p.id })),
    );
  }

  @Slash({ name: 'liste', description: 'Lister tes decks' })
  async list(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const user = await this.prisma.user.findFirst({
        where: { discordId: interaction.user.id },
        include: {
          decks: {
            orderBy: { isActive: 'desc' },
            include: {
              items: {
                orderBy: { position: 'asc' },
                include: { blade: true, ratchet: true, bit: true },
              },
            },
          },
        },
      });

      if (!user) return interaction.editReply("❌ Tu n'es pas inscrit.");
      if (user.decks.length === 0)
        return interaction.editReply(
          "📦 Tu n'as pas de deck. Utilise `/deck creer`.",
        );

      const embeds: EmbedBuilder[] = [];
      const files: AttachmentBuilder[] = [];

      for (const deck of user.decks.slice(0, 5)) {
        const embed = new EmbedBuilder()
          .setTitle(deck.isActive ? `⭐ ${deck.name}` : deck.name)
          .setColor(deck.isActive ? Colors.Primary : Colors.Secondary);

        const beyLines = deck.items.map((item) => {
          if (!item.blade || !item.ratchet || !item.bit)
            return `**${item.position}**. ⚠️ Bey incomplet`;
          const atk =
            parseStat(item.blade.attack) +
            parseStat(item.ratchet.attack) +
            parseStat(item.bit.attack);
          const def =
            parseStat(item.blade.defense) +
            parseStat(item.ratchet.defense) +
            parseStat(item.bit.defense);
          return `**${item.position}**. ${item.blade.name} ${item.ratchet.name} ${item.bit.name}\n└ ⚔️${atk} 🛡️${def}`;
        });

        embed.setDescription(
          beyLines.length > 0 ? beyLines.join('\n\n') : '*Deck vide*',
        );
        if (deck.isActive && deck.items.every((i) => i.blade)) {
          const buffer = await generateDeckCard({
            name: deck.name,
            beys: deck.items.map((i) => ({
              name: i.blade?.name || '?',
              imageUrl: i.blade?.imageUrl || null,
            })),
          });
          const attachment = new AttachmentBuilder(buffer, {
            name: `deck-${deck.id}.png`,
          });
          files.push(attachment);
          embed.setImage(`attachment://deck-${deck.id}.png`);
        }
        embeds.push(embed);
      }

      return interaction.editReply({
        embeds,
        files,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('Gérer en ligne')
              .setURL('https://rpbey.fr/dashboard/deck')
              .setStyle(ButtonStyle.Link),
          ),
        ],
      });
    } catch (_e) {
      return interaction.editReply('❌ Erreur récupération.');
    }
  }

  @Slash({ name: 'creer', description: 'Créer un nouveau deck' })
  async create(
    @SlashOption({
      name: 'nom',
      description: 'Nom du deck',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    name: string,
    interaction: CommandInteraction,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });
    if (!user) return interaction.reply("❌ Inscris-toi d'abord.");
    const count = await this.prisma.deck.count({ where: { userId: user.id } });
    if (count >= 10) return interaction.reply('❌ Max 10 decks.');
    await this.prisma.deck.create({
      data: {
        userId: user.id,
        name,
        isActive: count === 0,
        items: { create: [{ position: 1 }, { position: 2 }, { position: 3 }] },
      },
    });
    return interaction.reply(`✅ Deck **${name}** créé !`);
  }

  @Slash({ name: 'modifier', description: 'Modifier le deck ACTIF' })
  async edit(
    @SlashOption({
      name: 'slot',
      description: 'Position (1-3)',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      maxValue: 3,
    })
    slot: number,
    @SlashOption({
      name: 'blade',
      description: 'Blade',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    bladeId: string,
    @SlashOption({
      name: 'ratchet',
      description: 'Ratchet',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    ratchetId: string,
    @SlashOption({
      name: 'bit',
      description: 'Bit',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    bitId: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    const user = await this.prisma.user.findUnique({
      where: { discordId: interaction.user.id },
      include: {
        decks: { where: { isActive: true }, include: { items: true } },
      },
    });
    if (!user || !user.decks[0])
      return interaction.editReply('❌ Pas de deck actif.');

    await this.prisma.deckItem.updateMany({
      where: { deckId: user.decks[0].id, position: slot },
      data: { bladeId, ratchetId, bitId },
    });

    return interaction.editReply(`✅ Slot ${slot} mis à jour !`);
  }

  @Slash({ name: 'piece', description: "Statistiques d'une pièce" })
  async part(
    @SlashChoice({ name: 'Blade', value: 'BLADE' })
    @SlashChoice({ name: 'Ratchet', value: 'RATCHET' })
    @SlashChoice({ name: 'Bit', value: 'BIT' })
    @SlashOption({
      name: 'type',
      description: 'Type de pièce',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    type: 'BLADE' | 'RATCHET' | 'BIT',
    @SlashOption({
      name: 'nom',
      description: 'Nom de la pièce',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    partId: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    const part = await this.prisma.part.findUnique({ where: { id: partId } });
    if (!part) return interaction.editReply('❌ Pièce introuvable.');

    const embed = new EmbedBuilder()
      .setTitle(`${part.system || 'BX'} | ${part.name}`)
      .setColor(
        type === 'BLADE' ? 0xdc2626 : type === 'RATCHET' ? 0x3b82f6 : 0x22c55e,
      )
      .addFields(
        { name: 'Poids', value: `${part.weight || '?'}g`, inline: true },
        { name: 'Attaque', value: String(part.attack || '?'), inline: true },
        { name: 'Défense', value: String(part.defense || '?'), inline: true },
        { name: 'Endurance', value: String(part.stamina || '?'), inline: true },
      );
    if (part.imageUrl) embed.setThumbnail(`https://rpbey.fr${part.imageUrl}`);
    return interaction.editReply({ embeds: [embed] });
  }
}
