import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { inject, injectable } from 'tsyringe';

import { Colors } from '../../lib/constants.js';
import { PrismaService } from '../../lib/prisma.js';

@Discord()
@SlashGroup({ name: 'economie', description: 'Système économique de la RPB' })
@SlashGroup('economie')
@injectable()
export class EconomyCommand {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  @Slash({
    name: 'quotidien',
    description: 'Récupérer votre récompense en pièces du jour',
  })
  async daily(interaction: CommandInteraction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    let user = await this.prisma.user.findFirst({
      where: { discordId: userId },
      include: { profile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          discordId: userId,
          discordTag: interaction.user.tag,
          name: interaction.user.username,
          email: `${userId}@discord.placeholder`,
          profile: { create: {} },
        },
        include: { profile: true },
      });
    }

    if (!user.profile) {
      await this.prisma.profile.create({ data: { userId: user.id } });
      user = await this.prisma.user.findFirst({
        where: { discordId: userId },
        include: { profile: true },
      });
    }

    const profile = user?.profile;
    const lastDaily = profile?.lastDaily;

    if (lastDaily && new Date(lastDaily) >= todayStart) {
      const tomorrow = new Date(todayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const resetTimestamp = Math.floor(tomorrow.getTime() / 1000);

      const embed = new EmbedBuilder()
        .setTitle('⏰ Déjà récupéré !')
        .setDescription(
          `Tu as déjà récupéré ta récompense aujourd'hui.\nProchaine récompense : <t:${resetTimestamp}:R>`,
        )
        .setColor(Colors.Warning);
      return interaction.editReply({ embeds: [embed] });
    }

    const reward = 100 + Math.floor(Math.random() * 50);
    const newBalance = (profile?.currency ?? 0) + reward;

    await this.prisma.profile.update({
      where: { userId: user?.id },
      data: {
        currency: { increment: reward },
        lastDaily: now,
      },
    });

    const embed = new EmbedBuilder()
      .setTitle('💰 Récompense quotidienne')
      .setDescription(
        `Tu as reçu **${reward} pièces** !\nNouveau solde : **${newBalance} pièces**`,
      )
      .setColor(Colors.Success)
      .setFooter({ text: 'Reviens demain pour une nouvelle récompense !' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  @Slash({ name: 'solde', description: 'Consulter votre balance de pièces' })
  async balance(
    @SlashOption({
      name: 'membre',
      description: 'Le membre dont vous voulez voir le solde',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser:
      | { id: string; username: string; displayAvatarURL?: () => string }
      | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    const target = targetUser || interaction.user;

    const user = await this.prisma.user.findFirst({
      where: { discordId: target.id },
      include: { profile: true },
    });

    const balance = user?.profile?.currency ?? 0;

    const embed = new EmbedBuilder()
      .setTitle(`💳 Solde de ${target.username}`)
      .setDescription(`**${balance.toLocaleString('fr-FR')}** pièces`)
      .setColor(Colors.Info)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  @Slash({
    name: 'parier',
    description: 'Tentez de doubler votre mise (Quitte ou Double)',
  })
  async gamble(
    @SlashOption({
      name: 'montant',
      description: 'Le montant de pièces à mettre en jeu (10 - 10 000)',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 10,
      maxValue: 10000,
    })
    amount: number,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const user = await this.prisma.user.findFirst({
      where: { discordId: interaction.user.id },
      include: { profile: true },
    });

    const balance = user?.profile?.currency ?? 0;
    if (balance < amount) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Fonds insuffisants')
        .setDescription(
          `Tu n'as pas assez de pièces.\n**Solde actuel :** ${balance.toLocaleString('fr-FR')} pièces\n**Mise demandée :** ${amount.toLocaleString('fr-FR')} pièces`,
        )
        .setColor(Colors.Error);
      return interaction.editReply({ embeds: [embed] });
    }

    const win = Math.random() > 0.5;
    const newBalance = win ? balance + amount : balance - amount;

    await this.prisma.profile.update({
      where: { userId: user?.id },
      data: { currency: newBalance },
    });

    const embed = new EmbedBuilder()
      .setTitle(win ? '🎰 VICTOIRE !' : '🎰 Perdu...')
      .setDescription(
        win
          ? `Tu remportes **${amount.toLocaleString('fr-FR')} pièces** !`
          : `Tu perds **${amount.toLocaleString('fr-FR')} pièces**...`,
      )
      .addFields(
        {
          name: '💰 Mise',
          value: `${amount.toLocaleString('fr-FR')}`,
          inline: true,
        },
        {
          name: win ? '📈 Gain' : '📉 Perte',
          value: `${win ? '+' : '-'}${amount.toLocaleString('fr-FR')}`,
          inline: true,
        },
        {
          name: '💳 Nouveau solde',
          value: `${newBalance.toLocaleString('fr-FR')}`,
          inline: true,
        },
      )
      .setColor(win ? Colors.Success : Colors.Error)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
}
