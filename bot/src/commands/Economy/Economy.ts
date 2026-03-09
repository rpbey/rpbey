import {
  ApplicationCommandOptionType,
  type CommandInteraction,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { inject, injectable } from 'tsyringe';

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

    if (
      lastDaily &&
      new Date(lastDaily).getDate() === now.getDate() &&
      new Date(lastDaily).getMonth() === now.getMonth() &&
      new Date(lastDaily).getFullYear() === now.getFullYear()
    ) {
      return interaction.editReply(
        "❌ Tu as déjà récupéré ta récompense aujourd'hui ! Reviens demain.",
      );
    }

    const reward = 100 + Math.floor(Math.random() * 50);

    await this.prisma.profile.update({
      where: { userId: user?.id },
      data: {
        currency: { increment: reward },
        lastDaily: now,
      },
    });

    return interaction.editReply(
      `💰 Tu as reçu **${reward} pièces** ! Reviens demain pour tenter ta chance à nouveau.`,
    );
  }

  @Slash({ name: 'solde', description: 'Consulter votre balance de pièces' })
  async balance(
    @SlashOption({
      name: 'membre',
      description: 'Le membre dont vous voulez voir le solde',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser: { id: string; username: string } | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    const target = targetUser || interaction.user;

    const user = await this.prisma.user.findFirst({
      where: { discordId: target.id },
      include: { profile: true },
    });

    const balance = user?.profile?.currency ?? 0;

    return interaction.editReply(
      `💳 **${target.username}** possède actuellement **${balance} pièces**.`,
    );
  }

  @Slash({
    name: 'parier',
    description: 'Tentez de doubler votre mise (Quitte ou Double)',
  })
  async gamble(
    @SlashOption({
      name: 'montant',
      description: 'Le montant de pièces à mettre en jeu',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    amount: number,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    if (amount < 10)
      return interaction.editReply('❌ La mise minimale est de 10 pièces.');

    const user = await this.prisma.user.findFirst({
      where: { discordId: interaction.user.id },
      include: { profile: true },
    });

    const balance = user?.profile?.currency ?? 0;
    if (balance < amount)
      return interaction.editReply(
        `❌ Tu n'as pas assez de pièces (Solde actuel : ${balance}).`,
      );

    const win = Math.random() > 0.5;
    const newBalance = win ? balance + amount : balance - amount;

    await this.prisma.profile.update({
      where: { userId: user?.id },
      data: { currency: newBalance },
    });

    const text = win
      ? `🎰 **BRAVO !** Tu remportes **${amount} pièces** ! Ton nouveau solde est de **${newBalance}**.`
      : `🎰 **DOMMAGE...** Tu as perdu **${amount} pièces**. Il te reste **${newBalance}** pièces.`;

    return interaction.editReply({ content: text });
  }
}
