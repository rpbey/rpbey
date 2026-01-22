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
        .setName('randombey')
        .setDescription('Génère une combinaison Beyblade X aléatoire !'),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();

    // Fetch parts from DB
    const [blades, ratchets, bits] = await Promise.all([
      prisma.part.findMany({ where: { type: 'BLADE' }, select: { name: true } }),
      prisma.part.findMany({ where: { type: 'RATCHET' }, select: { name: true } }),
      prisma.part.findMany({ where: { type: 'BIT' }, select: { name: true } }),
    ]);

    // Fallback if DB is empty
    const bladeList = blades.length > 0 ? blades.map(p => p.name) : [
      'Dran Sword', 'Hells Scythe', 'Wizard Arrow', 'Knight Shield', 
      'Leon Claw', 'Phoenix Wing', 'Shark Edge', 'Unicorn Sting'
    ];
    const ratchetList = ratchets.length > 0 ? ratchets.map(p => p.name) : [
      '3-60', '4-60', '5-60', '3-80', '4-80', '5-80'
    ];
    const bitList = bits.length > 0 ? bits.map(p => p.name) : [
      'Flat', 'Ball', 'Point', 'Needle', 'Taper', 'Rush'
    ];

    const types = [
      { name: 'Attaque', emoji: '⚔️', color: 0xef4444 },
      { name: 'Défense', emoji: '🛡️', color: 0x3b82f6 },
      { name: 'Endurance', emoji: '🌀', color: 0x22c55e },
      { name: 'Équilibre', emoji: '⚖️', color: 0xfbbf24 },
    ];

    const blade = this.random(bladeList);
    const ratchet = this.random(ratchetList);
    const bit = this.random(bitList);
    const type = this.random(types);

    const combo = `${blade} ${ratchet} ${bit}`;

    // Generate random stats (placeholder)
    const attack = this.randomStat();
    const defense = this.randomStat();
    const stamina = this.randomStat();
    const weight = (Math.random() * 20 + 40).toFixed(1);

    // Generate visual combo card
    const cardBuffer = await generateComboCard({
      name: combo,
      blade,
      ratchet,
      bit,
      type: type.name,
      attack,
      defense,
      stamina,
      weight,
      color: type.color,
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