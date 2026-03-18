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
import { inject, injectable } from 'tsyringe';

import { generateDeckCard } from '../../lib/canvas-utils.js';
import { Colors } from '../../lib/constants.js';
import { PrismaService } from '../../lib/prisma.js';

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
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

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
        const hasItems = deck.items.some((i) => i.blade);

        if (hasItems) {
          // Generate rich deck card image
          const buffer = await generateDeckCard({
            name: deck.name,
            ownerName: interaction.user.displayName,
            isActive: deck.isActive,
            beys: deck.items.map((item) => ({
              bladeName: item.blade?.name || '?',
              ratchetName: item.ratchet?.name || '?',
              bitName: item.bit?.name || '?',
              bladeImageUrl: item.blade?.imageUrl || null,
              beyType: item.blade?.beyType || null,
              atk:
                parseStat(item.blade?.attack) +
                parseStat(item.ratchet?.attack) +
                parseStat(item.bit?.attack),
              def:
                parseStat(item.blade?.defense) +
                parseStat(item.ratchet?.defense) +
                parseStat(item.bit?.defense),
              sta:
                parseStat(item.blade?.stamina) +
                parseStat(item.ratchet?.stamina) +
                parseStat(item.bit?.stamina),
            })),
          });
          const filename = `deck-${deck.id}.png`;
          const attachment = new AttachmentBuilder(buffer, {
            name: filename,
          });
          files.push(attachment);

          const embed = new EmbedBuilder()
            .setColor(deck.isActive ? Colors.Primary : Colors.Secondary)
            .setImage(`attachment://${filename}`);
          embeds.push(embed);
        } else {
          const embed = new EmbedBuilder()
            .setTitle(deck.isActive ? `⭐ ${deck.name}` : deck.name)
            .setColor(Colors.Secondary)
            .setDescription(
              '*Deck vide — utilise `/deck modifier` pour ajouter des beys*',
            );
          embeds.push(embed);
        }
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
    @SlashChoice({ name: 'Lock Chip', value: 'LOCK_CHIP' })
    @SlashChoice({ name: 'Assist Blade', value: 'ASSIST_BLADE' })
    @SlashOption({
      name: 'type',
      description: 'Type de pièce',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    type: string,
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

    const TYPE_COLORS: Record<string, number> = {
      BLADE: 0xdc2626,
      RATCHET: 0xfbbf24,
      BIT: 0x22c55e,
      LOCK_CHIP: 0x60a5fa,
      ASSIST_BLADE: 0xa855f7,
    };
    const TYPE_EMOJIS: Record<string, string> = {
      BLADE: '⚔️',
      RATCHET: '⚙️',
      BIT: '🔩',
      LOCK_CHIP: '🔒',
      ASSIST_BLADE: '🛡️',
    };

    const color = TYPE_COLORS[type] || Colors.Beyblade;
    const emoji = TYPE_EMOJIS[type] || '🌀';
    const atk = parseStat(part.attack);
    const def = parseStat(part.defense);
    const sta = parseStat(part.stamina);
    const dash = parseStat(part.dash);
    const burst = parseStat(part.burst);

    const bar = (v: number, max = 100) => {
      const filled = Math.round((v / max) * 10);
      return (
        '█'.repeat(Math.min(filled, 10)) + '░'.repeat(10 - Math.min(filled, 10))
      );
    };

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${part.name}`)
      .setColor(color);

    // System + type badge
    const badges: string[] = [];
    if (part.system) badges.push(`\`${part.system}\``);
    if (part.beyType) {
      const btEmoji =
        part.beyType === 'ATTACK'
          ? '⚔️'
          : part.beyType === 'DEFENSE'
            ? '🛡️'
            : part.beyType === 'STAMINA'
              ? '🌀'
              : '⚖️';
      badges.push(`${btEmoji} ${part.beyType}`);
    }
    if (part.spinDirection)
      badges.push(part.spinDirection === 'L' ? '↺ Left' : '↻ Right');
    if (badges.length) embed.setDescription(badges.join(' · '));

    // Stats section
    const statLines: string[] = [];
    if (atk || def || sta) {
      statLines.push(`ATK \`${bar(atk)}\` **${atk}**`);
      statLines.push(`DEF \`${bar(def)}\` **${def}**`);
      statLines.push(`STA \`${bar(sta)}\` **${sta}**`);
    }
    if (dash) statLines.push(`DSH \`${bar(dash)}\` **${dash}**`);
    if (burst) statLines.push(`BRS \`${bar(burst)}\` **${burst}**`);
    if (statLines.length) {
      embed.addFields({
        name: '📊 Statistiques',
        value: statLines.join('\n'),
        inline: false,
      });
    }

    // Info row
    const infoFields: { name: string; value: string }[] = [];
    if (part.weight)
      infoFields.push({ name: '⚖️ Poids', value: `${part.weight}g` });
    if (part.height)
      infoFields.push({ name: '📏 Hauteur', value: `${part.height}mm` });
    if (part.tipType) infoFields.push({ name: '💎 Type', value: part.tipType });
    if (part.gearRatio)
      infoFields.push({ name: '⚙️ Ratio', value: part.gearRatio });
    if (part.releaseDate) {
      infoFields.push({
        name: '📅 Sortie',
        value: new Date(part.releaseDate).toLocaleDateString('fr-FR'),
      });
    }
    for (const f of infoFields) {
      embed.addFields({ ...f, inline: true });
    }

    // Image
    if (part.imageUrl) {
      embed.setImage(`https://rpbey.fr${part.imageUrl}`);
    }

    embed.setFooter({ text: 'rpbey.fr/db · Données Beyblade X' });

    return interaction.editReply({ embeds: [embed] });
  }
}
