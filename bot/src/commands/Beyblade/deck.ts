import { Subcommand } from '@sapphire/plugin-subcommands';
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { Colors } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';

// Helper to parse stats
const parseStat = (val: string | number | null | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export class DeckCommand extends Subcommand {
  constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
    super(context, {
      ...options,
      description: 'Gérer tes decks Beyblade X',
      subcommands: [
        {
          name: 'list',
          chatInputRun: 'chatInputList',
          default: true,
        },
        {
          name: 'create',
          chatInputRun: 'chatInputCreate',
        },
        {
          name: 'edit',
          chatInputRun: 'chatInputEdit',
        },
        {
          name: 'active',
          chatInputRun: 'chatInputActive',
        },
      ],
    });
  }

  override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('deck')
        .setDescription('Gérer tes decks Beyblade X')
        .addSubcommand((command) =>
          command.setName('list').setDescription('Lister tes decks'),
        )
        .addSubcommand((command) =>
          command
            .setName('create')
            .setDescription('Créer un nouveau deck')
            .addStringOption((option) =>
              option
                .setName('nom')
                .setDescription('Le nom de ton deck')
                .setRequired(true),
            ),
        )
        .addSubcommand((command) =>
          command
            .setName('edit')
            .setDescription('Modifier le deck ACTIF')
            .addIntegerOption((option) =>
              option
                .setName('slot')
                .setDescription('Emplacement (1, 2 ou 3)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(3),
            )
            .addStringOption((option) =>
              option
                .setName('blade')
                .setDescription('La Blade (anneau)')
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption((option) =>
              option
                .setName('ratchet')
                .setDescription('Le Ratchet (axe)')
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption((option) =>
              option
                .setName('bit')
                .setDescription('Le Bit (pointe)')
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand((command) =>
          command
            .setName('active')
            .setDescription('Choisir ton deck actif')
            .addStringOption((option) =>
              option
                .setName('deck')
                .setDescription('Le deck à activer')
                .setRequired(true)
                .setAutocomplete(true),
            ),
        ),
    );
  }

  // --- AUTOCOMPLETE ---
  public async autocompleteRun(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    const query = focusedOption.value.toLowerCase();

    if (focusedOption.name === 'deck') {
      // Search user's decks
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

    // Search Parts
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

  // --- LIST ---
  public async chatInputList(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
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
    } catch (error) {
      return interaction.editReply('❌ Erreur lors de la récupération.');
    }
  }

  // --- CREATE ---
  public async chatInputCreate(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    const name = interaction.options.getString('nom', true);

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!user) return interaction.editReply("❌ Tu n'es pas inscrit.");

      // Check deck count limit (e.g. 10)
      const count = await prisma.deck.count({ where: { userId: user.id } });
      if (count >= 10) {
        return interaction.editReply('❌ Tu as atteint la limite de 10 decks.');
      }

      // If first deck, make it active
      const isActive = count === 0;

      const deck = await prisma.deck.create({
        data: {
          userId: user.id,
          name,
          isActive,
          // Create 3 empty slots
          items: {
            create: [{ position: 1 }, { position: 2 }, { position: 3 }],
          },
        },
      });

      return interaction.editReply(
        `✅ Deck **${deck.name}** créé ! Utilise \`/deck edit\` pour ajouter des Beys.`,
      );
    } catch (e) {
      return interaction.editReply('❌ Erreur création deck.');
    }
  }

  // --- ACTIVE ---
  public async chatInputActive(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    const deckId = interaction.options.getString('deck', true);

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });
      if (!user) return interaction.editReply('❌ Inconnu.');

      // Deactivate all
      await prisma.deck.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });

      // Activate target
      const deck = await prisma.deck.update({
        where: { id: deckId, userId: user.id },
        data: { isActive: true },
      });

      return interaction.editReply(`⭐ Deck **${deck.name}** activé !`);
    } catch (e) {
      return interaction.editReply('❌ Deck introuvable ou erreur.');
    }
  }

  // --- EDIT ---
  public async chatInputEdit(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    const slot = interaction.options.getInteger('slot', true);
    const bladeId = interaction.options.getString('blade', true);
    const ratchetId = interaction.options.getString('ratchet', true);
    const bitId = interaction.options.getString('bit', true);

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

      // Verify parts exist
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

      // Update slot
      // Check if slot exists
      let item = activeDeck.items.find((i) => i.position === slot);

      if (item) {
        await prisma.deckItem.update({
          where: { id: item.id },
          data: { bladeId, ratchetId, bitId },
        });
      } else {
        // Should exist from creation, but safety fallback
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
      this.container.logger.error(e);
      return interaction.editReply('❌ Erreur lors de la modification.');
    }
  }
}
