import { Command } from '@sapphire/framework';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { generateComboCard } from '../../lib/canvas-utils.js';
import { RPB } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';

export class RandomBeyCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Génère une combinaison Beyblade aléatoire !',
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('aleatoire')
        .setDescription('Génère une combinaison Beyblade X aléatoire !'),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();

    // Fetch parts from DB
    const [blades, ratchets, bits] = await Promise.all([
      prisma.part.findMany({ where: { type: 'BLADE' } }),
      prisma.part.findMany({ where: { type: 'RATCHET' } }),
      prisma.part.findMany({ where: { type: 'BIT' } }),
    ]);

    if (blades.length === 0 || ratchets.length === 0 || bits.length === 0) {
      return interaction.editReply(
        '❌ Impossible de générer un combo : base de données incomplète.',
      );
    }

    const blade = this.random(blades);
    const ratchet = this.random(ratchets);
    const bit = this.random(bits);

    const combo = `${blade.name} ${ratchet.name} ${bit.name}`;

    // Helper to parse stats
    const p = (val: string | null) => parseInt(val || '0', 10);
    const w = (val: number | null) => val || 0;

    // Calculate real stats
    const attack = p(blade.attack) + p(ratchet.attack) + p(bit.attack);
    const defense = p(blade.defense) + p(ratchet.defense) + p(bit.defense);
    const stamina = p(blade.stamina) + p(ratchet.stamina) + p(bit.stamina);
    const dash = p(blade.dash) + p(ratchet.dash) + p(bit.dash);
    const weight = (
      w(blade.weight) +
      w(ratchet.weight) +
      w(bit.weight)
    ).toFixed(1);

    // Determine type based on Blade (or Bit as fallback)
    const typeMap: Record<
      string,
      { name: string; emoji: string; color: number }
    > = {
      ATTACK: { name: 'Attaque', emoji: '⚔️', color: 0xef4444 },
      DEFENSE: { name: 'Défense', emoji: '🛡️', color: 0x3b82f6 },
      STAMINA: { name: 'Endurance', emoji: '🌀', color: 0x22c55e },
      BALANCE: { name: 'Équilibre', emoji: '⚖️', color: 0xfbbf24 },
    };

    const typeKey = blade.beyType || bit.beyType || 'BALANCE';
    const type = typeMap[typeKey] || typeMap.BALANCE;

    // Generate visual combo card
    const cardBuffer = await generateComboCard({
      name: combo,
      blade: blade.name,
      ratchet: ratchet.name,
      bit: bit.name,
      type: type.name,
      attack,
      defense,
      stamina,
      dash,
      weight: weight,
      color: type.color,
      bladeImageUrl: blade.imageUrl,
    });

    const attachment = new AttachmentBuilder(cardBuffer, {
      name: `combo-${interaction.id}.png`,
    });

    const embed = new EmbedBuilder()
      .setColor(type.color)
      .setImage(`attachment://combo-${interaction.id}.png`)
      .setFooter({ text: `${RPB.FullName} | Let it rip!` })
      .setTimestamp();

    return interaction.editReply({
      embeds: [embed],
      files: [attachment],
    });
  }

  private random<T>(array: readonly T[]): T {
    const index = Math.floor(Math.random() * array.length);
    const item = array[index];
    if (item === undefined) throw new Error('Array is empty');
    return item;
  }

  private randomStat(): number {
    return Math.floor(Math.random() * 60) + 40; // 40-100
  }
}
