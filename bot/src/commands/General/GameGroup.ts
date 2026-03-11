import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  type CommandInteraction,
  EmbedBuilder,
  type User,
} from 'discord.js';
import DIG from 'discord-image-generation';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { inject, injectable } from 'tsyringe';

import { Colors } from '../../lib/constants.js';
import { PrismaService } from '../../lib/prisma.js';

@Discord()
@SlashGroup({ name: 'jeu', description: 'Activités ludiques et Beyblade' })
@SlashGroup('jeu')
@injectable()
export class GameGroup {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  @Slash({
    name: 'combat',
    description: 'Lancer un combat amical contre un autre blader',
  })
  @SlashGroup('jeu')
  async battle(
    @SlashOption({
      name: 'adversaire',
      description: 'Le blader à défier',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    interaction: CommandInteraction,
  ) {
    if (target.id === interaction.user.id)
      return interaction.reply('❌ Tu ne peux pas te battre contre toi-même !');

    const win = Math.random() > 0.5;
    const winner = win ? interaction.user : target;

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Duel de Bladers')
      .setDescription(
        `Le combat fait rage entre **${interaction.user.username}** et **${target.username}** !`,
      )
      .addFields({ name: '🏆 Vainqueur', value: winner.toString() })
      .setColor(Colors.Primary)
      .setImage('https://www.rpbey.fr/rpb.gif');

    return interaction.reply({ embeds: [embed] });
  }

  @Slash({
    name: 'aleatoire',
    description: 'Générer un combo Beyblade X aléatoire',
  })
  @SlashGroup('jeu')
  async random(interaction: CommandInteraction) {
    const parts = await this.prisma.part.findMany({ take: 500 });

    const blades = parts.filter((p) => p.type === 'BLADE');
    const ratchets = parts.filter((p) => p.type === 'RATCHET');
    const bits = parts.filter((p) => p.type === 'BIT');

    if (blades.length === 0 || ratchets.length === 0 || bits.length === 0) {
      return interaction.reply(
        '❌ Pas assez de pièces en base de données pour générer un combo.',
      );
    }

    const b = blades[Math.floor(Math.random() * blades.length)]!;
    const r = ratchets[Math.floor(Math.random() * ratchets.length)]!;
    const bit = bits[Math.floor(Math.random() * bits.length)]!;

    const embed = new EmbedBuilder()
      .setTitle('🎲 Combo Aléatoire')
      .setDescription(`**${b.name} ${r.name} ${bit.name}**`)
      .addFields(
        { name: '⚔️ Blade', value: b.name, inline: true },
        { name: '🔩 Ratchet', value: r.name, inline: true },
        { name: '💎 Bit', value: bit.name, inline: true },
      )
      .setColor(Colors.Beyblade)
      .setFooter({ text: 'Bonne chance avec ce combo !' });

    return interaction.reply({ embeds: [embed] });
  }

  @Slash({ name: 'fun-wanted', description: 'Générer une affiche WANTED' })
  @SlashGroup('jeu')
  async wanted(
    @SlashOption({
      name: 'cible',
      description: "L'utilisateur ciblé",
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser: User | undefined,
    interaction: CommandInteraction,
  ) {
    const target = targetUser ?? interaction.user;
    await interaction.deferReply();
    const avatar = target.displayAvatarURL({ extension: 'png', size: 512 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DIG lacks proper type exports
    const image = await new (DIG as Record<string, any>).Wanted().getImage(
      avatar,
      '€',
    );
    return interaction.editReply({
      files: [new AttachmentBuilder(image, { name: 'wanted.png' })],
    });
  }

  @Slash({ name: 'fun-agrandir', description: 'Agrandir un émoji' })
  @SlashGroup('jeu')
  async emote(
    @SlashOption({
      name: 'emoji',
      description: "L'émoji à agrandir",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    emoji: string,
    interaction: CommandInteraction,
  ) {
    const match = emoji.match(/<(a?):(\w+):(\d+)>/);
    if (!match) return interaction.reply('❌ Émoji invalide.');
    return interaction.reply(
      `https://cdn.discordapp.com/emojis/${match[3]}.${match[1] ? 'gif' : 'png'}?size=512`,
    );
  }
}
