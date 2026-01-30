import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { Colors } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';

// Helper to parse stats from DB (which might be strings or numbers)
const parseStat = (val: string | number | null | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export class DeckCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Gérer tes decks Beyblade X',
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('deck')
        .setDescription('Afficher tes decks Beyblade X')
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Find user and their decks
      const user = await prisma.user.findFirst({
        where: { discordId: interaction.user.id },
        include: {
          decks: {
            orderBy: { isActive: 'desc' }, // Active deck first
            include: {
              items: {
                orderBy: { position: 'asc' },
                include: {
                  blade: true,
                  ratchet: true,
                  bit: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return interaction.editReply({
          content: "❌ Tu n'es pas encore inscrit sur le dashboard. Utilise `/inscription rejoindre`.",
        });
      }

      if (user.decks.length === 0) {
        return interaction.editReply({
          content: "📦 Tu n'as pas encore créé de deck. Utilise le dashboard pour créer ton premier deck : https://rpbey.fr/dashboard/deck",
        });
      }

      const embeds: EmbedBuilder[] = [];

      // Limit to 10 decks for Discord embed limits
      const decksToShow = user.decks.slice(0, 10);

      for (const deck of decksToShow) {
        const embed = new EmbedBuilder()
          .setTitle(deck.isActive ? `⭐ ${deck.name} (Actif)` : deck.name)
          .setColor(deck.isActive ? Colors.Primary : Colors.Secondary)
          .setFooter({ text: `ID: ${deck.id.slice(-6)}` });

        // Build list of beys with stats
        const beyLines = deck.items.map((item) => {
          const partsAvailable = item.blade && item.ratchet && item.bit;
          
          if (!partsAvailable) {
            return `**${item.position}**. ⚠️ Bey incomplet`;
          }

          const beyName = `${item.blade?.name} ${item.ratchet?.name} ${item.bit?.name}`;
          
          // Calculate Stats
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
          .setStyle(ButtonStyle.Link)
      );

      return interaction.editReply({
        content: `📦 **Tes Decks (${user.decks.length})**`,
        embeds: embeds,
        components: [row],
      });

    } catch (error) {
      this.container.logger.error('Deck command error:', error);
      return interaction.editReply({
        content: '❌ Une erreur est survenue lors de la récupération de tes decks.',
      });
    }
  }
}
