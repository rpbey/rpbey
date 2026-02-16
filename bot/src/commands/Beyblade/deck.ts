import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  type AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';

import { Colors } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';
import prisma from '../../lib/prisma.js';

const parseStat = (val: string | number | null | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

@Discord()
@SlashGroup({ name: 'deck', description: 'Gérer tes decks Beyblade X' })
@SlashGroup('deck')
export class DeckCommand {
  // Autocomplete handler
  static async autocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    const query = focusedOption.value.toLowerCase();

    if (focusedOption.name === 'deck') {
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
        include: { decks: true },
      });

      if (!user) return interaction.respond([]);

      const filtered = user.decks.filter((d) =>
        d.name.toLowerCase().includes(query),
      );
      return interaction.respond(
        filtered.slice(0, 25).map((d) => ({ name: d.name, value: d.id })),
      );
    }

    let type: 'BLADE' | 'RATCHET' | 'BIT' = 'BLADE';
    if (focusedOption.name === 'ratchet') type = 'RATCHET';
    if (focusedOption.name === 'bit') type = 'BIT';

    const parts = await prisma.part.findMany({
      where: {
        type: type,
        name: { contains: query, mode: 'insensitive' },
      },
      take: 25,
      orderBy: { name: 'asc' },
    });

    return interaction.respond(
      parts.map((p) => ({ name: p.name, value: p.id })),
    );
  }

  @Slash({ name: 'list', description: 'Lister tes decks' })
  async list(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await prisma.user.findFirst({
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

      if (!user) {
        return interaction.editReply(
          "❌ Tu n'es pas inscrit. Utilise `/inscription rejoindre`.",
        );
      }

      if (user.decks.length === 0) {
        return interaction.editReply(
          "📦 Tu n'as pas de deck. Utilise `/deck create` pour en créer un !",
        );
      }

      const embeds: EmbedBuilder[] = [];
      const decksToShow = user.decks.slice(0, 10);

      for (const deck of decksToShow) {
        const embed = new EmbedBuilder()
          .setTitle(deck.isActive ? `⭐ ${deck.name} (Actif)` : deck.name)
          .setColor(deck.isActive ? Colors.Primary : Colors.Secondary)
          .setFooter({ text: `ID: ${deck.id.slice(-6)}` });

        const beyLines = deck.items.map((item) => {
          const partsAvailable = item.blade && item.ratchet && item.bit;
          if (!partsAvailable) return `**${item.position}**. ⚠️ Bey incomplet`;

          const beyName = `${item.blade?.name} ${item.ratchet?.name} ${item.bit?.name}`;
          const parts = [item.blade, item.ratchet, item.bit];
          const atk = parts.reduce((acc, p) => acc + parseStat(p?.attack), 0);
          const def = parts.reduce((acc, p) => acc + parseStat(p?.defense), 0);
          const sta = parts.reduce((acc, p) => acc + parseStat(p?.stamina), 0);
          const dash = parts.reduce((acc, p) => acc + parseStat(p?.dash), 0);

          return `**${item.position}**. ${beyName}\n└ ⚔️${atk} 🛡️${def} 🔋${sta} 🚀${dash}`;
        });

        if (beyLines.length > 0) {
          embed.setDescription(beyLines.join('\n\n'));
        } else {
          embed.setDescription('*Ce deck est vide.*');
        }
        embeds.push(embed);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Gérer mes Decks')
          .setURL('https://rpbey.fr/dashboard/deck')
          .setStyle(ButtonStyle.Link),
      );

      return interaction.editReply({
        content: `📦 **Tes Decks (${user.decks.length})**`,
        embeds: embeds,
        components: [row],
      });
    } catch (_error) {
      return interaction.editReply('❌ Erreur lors de la récupération.');
    }
  }

  @Slash({ name: 'create', description: 'Créer un nouveau deck' })
  async create(
    @SlashOption({
      name: 'nom',
      description: 'Le nom de ton deck',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    name: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!user) return interaction.editReply("❌ Tu n'es pas inscrit.");

      const count = await prisma.deck.count({ where: { userId: user.id } });
      if (count >= 10) {
        return interaction.editReply('❌ Tu as atteint la limite de 10 decks.');
      }

      const isActive = count === 0;

      const deck = await prisma.deck.create({
        data: {
          userId: user.id,
          name,
          isActive,
          items: {
            create: [{ position: 1 }, { position: 2 }, { position: 3 }],
          },
        },
      });

      return interaction.editReply(
        `✅ Deck **${deck.name}** créé ! Utilise \`/deck edit\` pour ajouter des Beys.`,
      );
    } catch (_e) {
      return interaction.editReply('❌ Erreur création deck.');
    }
  }

  @Slash({ name: 'edit', description: 'Modifier le deck ACTIF' })
  async edit(
    @SlashOption({
      name: 'slot',
      description: 'Emplacement (1, 2 ou 3)',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      maxValue: 3,
    })
    slot: number,
    @SlashOption({
      name: 'blade',
      description: 'La Blade (anneau)',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: DeckCommand.autocomplete,
    })
    bladeId: string,
    @SlashOption({
      name: 'ratchet',
      description: 'Le Ratchet (axe)',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: DeckCommand.autocomplete,
    })
    ratchetId: string,
    @SlashOption({
      name: 'bit',
      description: 'Le Bit (pointe)',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: DeckCommand.autocomplete,
    })
    bitId: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
        include: {
          decks: { where: { isActive: true }, include: { items: true } },
        },
      });

      if (!user) return interaction.editReply('❌ Inconnu.');

      const activeDeck = user.decks[0];
      if (!activeDeck) {
        return interaction.editReply(
          "❌ Tu n'as pas de deck actif. Crées-en un ou actives-en un.",
        );
      }

      const [blade, ratchet, bit] = await Promise.all([
        prisma.part.findUnique({ where: { id: bladeId, type: 'BLADE' } }),
        prisma.part.findUnique({ where: { id: ratchetId, type: 'RATCHET' } }),
        prisma.part.findUnique({ where: { id: bitId, type: 'BIT' } }),
      ]);

      if (!blade || !ratchet || !bit) {
        return interaction.editReply(
          '❌ Une des pièces sélectionnées est invalide.',
        );
      }

      const item = activeDeck.items.find((i) => i.position === slot);

      if (item) {
        await prisma.deckItem.update({
          where: { id: item.id },
          data: { bladeId, ratchetId, bitId },
        });
      } else {
        await prisma.deckItem.create({
          data: {
            deckId: activeDeck.id,
            position: slot,
            bladeId,
            ratchetId,
            bitId,
          },
        });
      }

      const beyName = `${blade.name} ${ratchet.name} ${bit.name}`;
      return interaction.editReply(
        `✅ Slot ${slot} mis à jour : **${beyName}**`,
      );
    } catch (e) {
      logger.error(e);
      return interaction.editReply('❌ Erreur lors de la modification.');
    }
  }

  @Slash({ name: 'active', description: 'Choisir ton deck actif' })
  async active(
    @SlashOption({
      name: 'deck',
      description: 'Le deck à activer',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: DeckCommand.autocomplete,
    })
    deckId: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });
      if (!user) return interaction.editReply('❌ Inconnu.');

      await prisma.deck.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });

      const deck = await prisma.deck.update({
        where: { id: deckId, userId: user.id },
        data: { isActive: true },
      });

      return interaction.editReply(`⭐ Deck **${deck.name}** activé !`);
    } catch (_e) {
      return interaction.editReply('❌ Deck introuvable ou erreur.');
    }
  }
}
