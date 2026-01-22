import { Command } from '@sapphire/framework';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { generateComboCard } from '../../lib/canvas-utils.js';
import { RPB } from '../../lib/constants.js';

// Beyblade parts database
const parts = {
  blades: [
    'Dran Sword',
    'Hells Scythe',
    'Wizard Arrow',
    'Knight Shield',
    'Leon Claw',
    'Phoenix Wing',
    'Shark Edge',
    'Unicorn Sting',
    'Cobalt Drake',
    'Viper Tail',
  ],
  ratchets: ['3-60', '4-60', '5-60', '3-80', '4-80', '5-80', '9-60', '9-80'],
  bits: [
    'Flat',
    'Ball',
    'Point',
    'Needle',
    'Accel',
    'Rush',
    'High Needle',
    'Low Flat',
    'Gear Point',
    'Gear Flat',
    'Taper',
    'Orb',
  ],
  types: [
    { name: 'Attaque', emoji: '⚔️', color: 0xef4444 },
    { name: 'Défense', emoji: '🛡️', color: 0x3b82f6 },
    { name: 'Endurance', emoji: '🌀', color: 0x22c55e },
    { name: 'Équilibre', emoji: '⚖️', color: 0xfbbf24 },
  ],
};

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

    const blade = this.random(parts.blades);
    const ratchet = this.random(parts.ratchets);
    const bit = this.random(parts.bits);
    const type = this.random(parts.types);

    const combo = `${blade} ${ratchet}${bit}`;

    // Generate random stats
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
