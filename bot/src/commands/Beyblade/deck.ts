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

  // --- Shared: get or create user ---
  private async getOrCreateUser(discordId: string, displayName: string) {
    let user = await this.prisma.user.findUnique({ where: { discordId } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          discordId,
          name: displayName,
          email: `${discordId}@discord.rpbey.fr`,
        },
      });
    }
    return user;
  }

  // --- Autocomplete handler ---
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
          .map((d) => ({
            name: `${d.isActive ? '⭐ ' : ''}${d.name}`,
            value: d.id,
          })),
      );
    }

    // Part autocomplete — detect type from option name
    let type: 'BLADE' | 'RATCHET' | 'BIT' = 'BLADE';
    if (focusedOption.name.includes('ratchet')) type = 'RATCHET';
    else if (focusedOption.name.includes('bit')) type = 'BIT';
    else if (focusedOption.name.includes('blade')) type = 'BLADE';

    const parts = await prisma.part.findMany({
      where: { type, name: { contains: query, mode: 'insensitive' } },
      take: 25,
      orderBy: { name: 'asc' },
    });

    return interaction.respond(
      parts.map((p) => ({ name: p.name, value: p.id })),
    );
  }

  // =============================================
  // /deck liste — View all decks
  // =============================================
  @Slash({ name: 'liste', description: 'Afficher tes decks' })
  @SlashGroup('deck')
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
          "📦 Tu n'as pas de deck. Utilise `/deck creer` ou `/deck rapide`.",
        );

      const embeds: EmbedBuilder[] = [];
      const files: AttachmentBuilder[] = [];

      for (const deck of user.decks.slice(0, 5)) {
        const hasItems = deck.items.some((i) => i.blade);

        if (hasItems) {
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
          files.push(new AttachmentBuilder(buffer, { name: filename }));
          embeds.push(
            new EmbedBuilder()
              .setColor(deck.isActive ? Colors.Primary : Colors.Secondary)
              .setImage(`attachment://${filename}`),
          );
        } else {
          embeds.push(
            new EmbedBuilder()
              .setTitle(deck.isActive ? `⭐ ${deck.name}` : deck.name)
              .setColor(Colors.Secondary)
              .setDescription(
                '*Deck vide — `/deck ajouter` ou `/deck rapide`*',
              ),
          );
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

  // =============================================
  // /deck creer — Create empty deck
  // =============================================
  @Slash({ name: 'creer', description: 'Créer un nouveau deck vide' })
  @SlashGroup('deck')
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
    const user = await this.getOrCreateUser(
      interaction.user.id,
      interaction.user.displayName,
    );
    const count = await this.prisma.deck.count({ where: { userId: user.id } });
    if (count >= 10)
      return interaction.reply({
        content: '❌ Max 10 decks.',
        ephemeral: true,
      });

    await this.prisma.deck.create({
      data: {
        userId: user.id,
        name,
        isActive: count === 0,
        items: { create: [{ position: 1 }, { position: 2 }, { position: 3 }] },
      },
    });
    return interaction.reply(
      `✅ Deck **${name}** créé ! Ajoute des beys avec \`/deck ajouter\` ou \`/deck rapide\`.`,
    );
  }

  // =============================================
  // /deck rapide — Create + fill all 3 slots at once
  // =============================================
  @Slash({
    name: 'rapide',
    description: 'Créer un deck complet en une commande (3 beys)',
  })
  @SlashGroup('deck')
  async quick(
    @SlashOption({
      name: 'nom',
      description: 'Nom du deck',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    name: string,
    @SlashOption({
      name: 'blade1',
      description: 'Blade du bey 1',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    blade1: string,
    @SlashOption({
      name: 'ratchet1',
      description: 'Ratchet du bey 1',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    ratchet1: string,
    @SlashOption({
      name: 'bit1',
      description: 'Bit du bey 1',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    bit1: string,
    @SlashOption({
      name: 'blade2',
      description: 'Blade du bey 2',
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    blade2: string | undefined,
    @SlashOption({
      name: 'ratchet2',
      description: 'Ratchet du bey 2',
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    ratchet2: string | undefined,
    @SlashOption({
      name: 'bit2',
      description: 'Bit du bey 2',
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    bit2: string | undefined,
    @SlashOption({
      name: 'blade3',
      description: 'Blade du bey 3',
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    blade3: string | undefined,
    @SlashOption({
      name: 'ratchet3',
      description: 'Ratchet du bey 3',
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    ratchet3: string | undefined,
    @SlashOption({
      name: 'bit3',
      description: 'Bit du bey 3',
      required: false,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    bit3: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const user = await this.getOrCreateUser(
      interaction.user.id,
      interaction.user.displayName,
    );
    const count = await this.prisma.deck.count({ where: { userId: user.id } });
    if (count >= 10) return interaction.editReply('❌ Max 10 decks.');

    // Build slot data
    const slots: { bladeId: string; ratchetId: string; bitId: string }[] = [
      { bladeId: blade1, ratchetId: ratchet1, bitId: bit1 },
    ];
    if (blade2 && ratchet2 && bit2)
      slots.push({ bladeId: blade2, ratchetId: ratchet2, bitId: bit2 });
    if (blade3 && ratchet3 && bit3)
      slots.push({ bladeId: blade3, ratchetId: ratchet3, bitId: bit3 });

    const deck = await this.prisma.deck.create({
      data: {
        userId: user.id,
        name,
        isActive: count === 0,
        items: {
          create: [
            { position: 1, ...slots[0] },
            {
              position: 2,
              ...(slots[1] || {}),
            },
            {
              position: 3,
              ...(slots[2] || {}),
            },
          ],
        },
      },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: { blade: true, ratchet: true, bit: true },
        },
      },
    });

    // Generate deck card
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
    const attachment = new AttachmentBuilder(buffer, { name: filename });

    return interaction.editReply({
      content: `✅ Deck **${name}** créé avec ${slots.length} bey${slots.length > 1 ? 's' : ''} !`,
      files: [attachment],
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Primary)
          .setImage(`attachment://${filename}`),
      ],
    });
  }

  // =============================================
  // /deck ajouter — Add a bey to the next empty slot
  // =============================================
  @Slash({
    name: 'ajouter',
    description: 'Ajouter un bey au prochain slot libre du deck actif',
  })
  @SlashGroup('deck')
  async add(
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
        decks: {
          where: { isActive: true },
          include: { items: { orderBy: { position: 'asc' } } },
        },
      },
    });
    if (!user || !user.decks[0])
      return interaction.editReply(
        '❌ Pas de deck actif. Crée-en un avec `/deck creer` ou `/deck rapide`.',
      );

    const deck = user.decks[0];
    const emptySlot = deck.items.find((i) => !i.bladeId);
    if (!emptySlot)
      return interaction.editReply(
        '❌ Deck plein ! Utilise `/deck modifier` pour remplacer un slot.',
      );

    await this.prisma.deckItem.update({
      where: { id: emptySlot.id },
      data: { bladeId, ratchetId, bitId },
    });

    const blade = await this.prisma.part.findUnique({
      where: { id: bladeId },
      select: { name: true },
    });

    return interaction.editReply(
      `✅ **${blade?.name || 'Bey'}** ajouté au slot ${emptySlot.position} de **${deck.name}** !`,
    );
  }

  // =============================================
  // /deck modifier — Edit a specific slot
  // =============================================
  @Slash({ name: 'modifier', description: 'Modifier un slot du deck actif' })
  @SlashGroup('deck')
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

  // =============================================
  // /deck activer — Switch active deck
  // =============================================
  @Slash({ name: 'activer', description: 'Changer de deck actif' })
  @SlashGroup('deck')
  async activate(
    @SlashOption({
      name: 'deck',
      description: 'Le deck à activer',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    deckId: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    const user = await this.prisma.user.findUnique({
      where: { discordId: interaction.user.id },
      include: { decks: true },
    });
    if (!user) return interaction.editReply("❌ Tu n'es pas inscrit.");

    const deck = user.decks.find((d) => d.id === deckId);
    if (!deck) return interaction.editReply('❌ Deck introuvable.');

    // Deactivate all, activate selected
    await this.prisma.deck.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });
    await this.prisma.deck.update({
      where: { id: deckId },
      data: { isActive: true },
    });

    return interaction.editReply(
      `✅ **${deck.name}** est maintenant ton deck actif !`,
    );
  }

  // =============================================
  // /deck supprimer — Delete a deck
  // =============================================
  @Slash({ name: 'supprimer', description: 'Supprimer un deck' })
  @SlashGroup('deck')
  async remove(
    @SlashOption({
      name: 'deck',
      description: 'Le deck à supprimer',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
    })
    deckId: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    const user = await this.prisma.user.findUnique({
      where: { discordId: interaction.user.id },
      include: { decks: true },
    });
    if (!user) return interaction.editReply("❌ Tu n'es pas inscrit.");

    const deck = user.decks.find((d) => d.id === deckId);
    if (!deck) return interaction.editReply('❌ Deck introuvable.');

    // Delete items first, then deck
    await this.prisma.deckItem.deleteMany({ where: { deckId } });
    await this.prisma.deck.delete({ where: { id: deckId } });

    // If deleted deck was active, activate the first remaining one
    if (deck.isActive) {
      const remaining = await this.prisma.deck.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });
      if (remaining) {
        await this.prisma.deck.update({
          where: { id: remaining.id },
          data: { isActive: true },
        });
      }
    }

    return interaction.editReply(`🗑️ Deck **${deck.name}** supprimé.`);
  }

  // =============================================
  // /deck piece — View part stats
  // =============================================
  @Slash({ name: 'piece', description: "Statistiques d'une pièce" })
  @SlashGroup('deck')
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
    const p = await this.prisma.part.findUnique({ where: { id: partId } });
    if (!p) return interaction.editReply('❌ Pièce introuvable.');

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
    const atk = parseStat(p.attack);
    const def = parseStat(p.defense);
    const sta = parseStat(p.stamina);
    const dash = parseStat(p.dash);
    const burst = parseStat(p.burst);

    const bar = (v: number, max = 100) => {
      const filled = Math.round((v / max) * 10);
      return (
        '█'.repeat(Math.min(filled, 10)) + '░'.repeat(10 - Math.min(filled, 10))
      );
    };

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${p.name}`)
      .setColor(color);

    const badges: string[] = [];
    if (p.system) badges.push(`\`${p.system}\``);
    if (p.beyType) {
      const btEmoji =
        p.beyType === 'ATTACK'
          ? '⚔️'
          : p.beyType === 'DEFENSE'
            ? '🛡️'
            : p.beyType === 'STAMINA'
              ? '🌀'
              : '⚖️';
      badges.push(`${btEmoji} ${p.beyType}`);
    }
    if (p.spinDirection)
      badges.push(p.spinDirection === 'L' ? '↺ Left' : '↻ Right');
    if (badges.length) embed.setDescription(badges.join(' · '));

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

    const infoFields: { name: string; value: string }[] = [];
    if (p.weight) infoFields.push({ name: '⚖️ Poids', value: `${p.weight}g` });
    if (p.height)
      infoFields.push({ name: '📏 Hauteur', value: `${p.height}mm` });
    if (p.tipType) infoFields.push({ name: '💎 Type', value: p.tipType });
    if (p.gearRatio) infoFields.push({ name: '⚙️ Ratio', value: p.gearRatio });
    if (p.releaseDate) {
      infoFields.push({
        name: '📅 Sortie',
        value: new Date(p.releaseDate).toLocaleDateString('fr-FR'),
      });
    }
    for (const f of infoFields) {
      embed.addFields({ ...f, inline: true });
    }

    if (p.imageUrl) embed.setImage(`https://rpbey.fr${p.imageUrl}`);
    embed.setFooter({ text: 'rpbey.fr/db · Données Beyblade X' });

    return interaction.editReply({ embeds: [embed] });
  }
}
