import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  ChannelType,
  type CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  type TextChannel,
} from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import { ButtonComponent, Discord, Slash, SlashGroup } from 'discordx';
import { injectable } from 'tsyringe';

import { Colors, RPB } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';

@Discord()
@SlashGroup({ name: 'tickets', description: 'Système de support par tickets' })
@SlashGroup('tickets')
@injectable()
export class TicketSystem {
  @Slash({
    name: 'configurer',
    description: 'Déployer le panneau de création de tickets',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
  })
  async setup(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel as TextChannel;
    if (!channel)
      return interaction.editReply(
        '❌ Cette commande doit être utilisée dans un salon textuel.',
      );

    const embed = new EmbedBuilder()
      .setTitle('🎫 Support RPB')
      .setDescription(
        "Besoin d'aide ? Cliquez sur le bouton ci-dessous pour ouvrir un ticket.\n\nNotre équipe de modération vous assistera dans les plus brefs délais.",
      )
      .setColor(Colors.Primary)
      .setThumbnail(RPB.RoleIcons.Default)
      .setFooter({ text: 'République Populaire du Beyblade' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('create-ticket')
        .setLabel('Ouvrir un Ticket')
        .setEmoji('📩')
        .setStyle(ButtonStyle.Primary),
    );

    await channel.send({ embeds: [embed], components: [row] });
    return interaction.editReply(
      '✅ Le panneau de support a été installé avec succès.',
    );
  }

  @ButtonComponent({ id: 'create-ticket' })
  async createTicket(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    if (!guild) return;

    const existingChannel = guild.channels.cache.find(
      (c) =>
        c.name ===
        `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    );
    if (existingChannel) {
      return interaction.editReply(
        `❌ Vous avez déjà un ticket ouvert ici : ${existingChannel}.`,
      );
    }

    try {
      const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: (interaction.channel as TextChannel).parentId,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AttachFiles,
            ],
          },
          {
            id: RPB.Roles.Modo,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ],
          },
          {
            id: RPB.Roles.Admin,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ],
          },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle(`Ticket de ${interaction.user.username}`)
        .setDescription(
          'Bienvenue sur votre espace de support. Expliquez votre demande ici.\nPour clore cette discussion, utilisez le bouton 🔒 ci-dessous.',
        )
        .setColor(Colors.Info);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('close-ticket')
          .setLabel('Fermer le Ticket')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger),
      );

      await ticketChannel.send({
        content: `Bonjour ${interaction.user}, un membre de l'équipe <@&${RPB.Roles.Modo}> va s'occuper de vous.`,
        embeds: [embed],
        components: [row],
      });
      return interaction.editReply(
        `✅ Votre ticket a été créé : ${ticketChannel}`,
      );
    } catch (error) {
      logger.error(error);
      return interaction.editReply(
        '❌ Une erreur est survenue lors de la création du ticket.',
      );
    }
  }

  @ButtonComponent({ id: 'close-ticket' })
  async closeTicket(interaction: ButtonInteraction) {
    await interaction.deferReply();
    const channel = interaction.channel as TextChannel;

    const attachment = await createTranscript(
      channel as any,
      {
        limit: -1,
        returnType: 'attachment',
        filename: `${channel.name}-archive.html`,
        saveImages: true,
        poweredBy: false,
      } as any,
    );

    const logChannel = interaction.guild?.channels.cache.get(
      RPB.Channels.Announcements,
    ) as TextChannel;

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('Discussion Clôturée')
        .addFields(
          { name: 'Fermé par', value: interaction.user.tag, inline: true },
          { name: 'Salon original', value: channel.name, inline: true },
        )
        .setColor(Colors.Error)
        .setTimestamp();

      await logChannel.send({ embeds: [embed], files: [attachment] });
    }

    await channel.delete();
  }
}
