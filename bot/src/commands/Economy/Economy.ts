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

  @Slash({
    name: 'transfert',
    description: 'Transférer des pièces à un autre membre',
  })
  async transfer(
    @SlashOption({
      name: 'destinataire',
      description: 'Le membre à qui envoyer les pièces',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: { id: string; username: string; bot?: boolean },
    @SlashOption({
      name: 'montant',
      description: 'Le montant à transférer (minimum 1)',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
    })
    amount: number,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    if (target.id === interaction.user.id) {
      return interaction.editReply(
        '❌ Tu ne peux pas te transférer des pièces à toi-même.',
      );
    }
    if (target.bot) {
      return interaction.editReply(
        '❌ Tu ne peux pas envoyer des pièces à un bot.',
      );
    }

    const sender = await this.prisma.user.findFirst({
      where: { discordId: interaction.user.id },
      include: { profile: true },
    });

    const senderBalance = sender?.profile?.currency ?? 0;
    if (senderBalance < amount) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Fonds insuffisants')
        .setDescription(
          `Tu n'as que **${senderBalance.toLocaleString('fr-FR')} pièces** mais tu veux en envoyer **${amount.toLocaleString('fr-FR')}**.`,
        )
        .setColor(Colors.Error);
      return interaction.editReply({ embeds: [embed] });
    }

    let receiver = await this.prisma.user.findFirst({
      where: { discordId: target.id },
      include: { profile: true },
    });

    if (!receiver) {
      receiver = await this.prisma.user.create({
        data: {
          discordId: target.id,
          discordTag: target.username,
          name: target.username,
          email: `${target.id}@discord.placeholder`,
          profile: { create: {} },
        },
        include: { profile: true },
      });
    }
    if (!receiver.profile) {
      await this.prisma.profile.create({ data: { userId: receiver.id } });
    }

    await this.prisma.$transaction([
      this.prisma.profile.update({
        where: { userId: sender?.id },
        data: { currency: { decrement: amount } },
      }),
      this.prisma.profile.update({
        where: { userId: receiver.id },
        data: { currency: { increment: amount } },
      }),
    ]);

    const embed = new EmbedBuilder()
      .setTitle('💸 Transfert effectué')
      .setDescription(
        `**${interaction.user.displayName}** a envoyé **${amount.toLocaleString('fr-FR')} pièces** à **${target.username}** !`,
      )
      .addFields(
        {
          name: '📤 Expéditeur',
          value: `${(senderBalance - amount).toLocaleString('fr-FR')} pièces restantes`,
          inline: true,
        },
        {
          name: '📥 Destinataire',
          value: `+${amount.toLocaleString('fr-FR')} pièces`,
          inline: true,
        },
      )
      .setColor(Colors.Success)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  @Slash({
    name: 'classement',
    description: 'Top 10 des membres les plus riches',
  })
  async leaderboard(interaction: CommandInteraction) {
    await interaction.deferReply();

    const topProfiles = await this.prisma.profile.findMany({
      where: { currency: { gt: 0 } },
      orderBy: { currency: 'desc' },
      take: 10,
      include: { user: true },
    });

    if (topProfiles.length === 0) {
      return interaction.editReply(
        '❌ Personne ne possède de pièces pour le moment.',
      );
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = topProfiles.map((p, i) => {
      const prefix = medals[i] ?? `**${i + 1}.**`;
      const name =
        p.user.globalName || p.user.name || p.user.discordTag || 'Inconnu';
      return `${prefix} ${name} — **${p.currency.toLocaleString('fr-FR')}** pièces`;
    });

    const userProfile = await this.prisma.profile.findFirst({
      where: { user: { discordId: interaction.user.id } },
    });
    const userRank = userProfile
      ? (await this.prisma.profile.count({
          where: { currency: { gt: userProfile.currency } },
        })) + 1
      : null;

    const embed = new EmbedBuilder()
      .setTitle('💰 Classement Économie')
      .setDescription(lines.join('\n'))
      .setColor(Colors.Secondary)
      .setTimestamp();

    if (userRank && userProfile) {
      embed.setFooter({
        text: `Votre rang : #${userRank} (${userProfile.currency.toLocaleString('fr-FR')} pièces)`,
      });
    }

    return interaction.editReply({ embeds: [embed] });
  }
}
