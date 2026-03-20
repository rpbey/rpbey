import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  ChannelType,
  type CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  type TextChannel,
  type User,
} from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import {
  ButtonComponent,
  Discord,
  Slash,
  SlashChoice,
  SlashOption,
} from 'discordx';
import { injectable } from 'tsyringe';

import { Colors, RPB } from '../../lib/constants.js';

@Discord()
@injectable()
export class ModerationCommands {
  @Slash({
    name: 'clear',
    description: 'Supprimer un nombre de messages',
    defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
  })
  async clear(
    @SlashOption({
      name: 'nombre',
      description: 'Nombre de messages (1-100)',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      maxValue: 100,
    })
    amount: number,
    interaction: CommandInteraction,
  ) {
    const channel = interaction.channel as TextChannel;
    if (!channel)
      return interaction.reply({
        content: '❌ Salon texte uniquement.',
        ephemeral: true,
      });
    await channel.bulkDelete(amount);
    return interaction.reply({
      content: `✅ **${amount}** messages supprimés.`,
      ephemeral: true,
    });
  }

  @Slash({
    name: 'ban',
    description: 'Bannir un membre du serveur',
    defaultMemberPermissions: PermissionFlagsBits.BanMembers,
  })
  async ban(
    @SlashOption({
      name: 'cible',
      description: 'Le membre à bannir',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    @SlashOption({
      name: 'raison',
      description: 'Raison du ban',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'Aucune raison spécifiée',
    interaction: CommandInteraction,
  ) {
    if (target.id === interaction.user.id)
      return interaction.reply({
        content: '❌ Tu ne peux pas te bannir toi-même.',
        ephemeral: true,
      });
    if (target.bot)
      return interaction.reply({
        content: '❌ Impossible de bannir un bot via cette commande.',
        ephemeral: true,
      });
    const member = await interaction.guild?.members
      .fetch(target.id)
      .catch(() => null);
    if (member && !member.bannable)
      return interaction.reply({
        content:
          '❌ Impossible de bannir ce membre (rôle trop élevé ou permissions insuffisantes).',
        ephemeral: true,
      });
    await interaction.guild?.members.ban(target, { reason });
    return interaction.reply(
      `🔨 **${target.tag}** a été banni. Raison : ${reason}`,
    );
  }

  @Slash({
    name: 'kick',
    description: 'Expulser un membre du serveur',
    defaultMemberPermissions: PermissionFlagsBits.KickMembers,
  })
  async kick(
    @SlashOption({
      name: 'cible',
      description: 'Le membre à expulser',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    @SlashOption({
      name: 'raison',
      description: "Raison de l'expulsion",
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'Aucune raison spécifiée',
    interaction: CommandInteraction,
  ) {
    if (target.id === interaction.user.id)
      return interaction.reply({
        content: "❌ Tu ne peux pas t'expulser toi-même.",
        ephemeral: true,
      });
    const member = await interaction.guild?.members
      .fetch(target.id)
      .catch(() => null);
    if (!member || !member.kickable)
      return interaction.reply({
        content: "❌ Impossible d'expulser ce membre.",
        ephemeral: true,
      });
    await member.kick(reason);
    return interaction.reply(
      `👢 **${target.tag}** a été expulsé. Raison : ${reason}`,
    );
  }

  @Slash({
    name: 'mute',
    description: 'Rendre muet un membre temporairement',
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  })
  async mute(
    @SlashOption({
      name: 'cible',
      description: 'Le membre à rendre muet',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    @SlashChoice({ name: '60 secondes', value: 60 * 1000 })
    @SlashChoice({ name: '5 minutes', value: 5 * 60 * 1000 })
    @SlashChoice({ name: '10 minutes', value: 10 * 60 * 1000 })
    @SlashChoice({ name: '1 heure', value: 60 * 60 * 1000 })
    @SlashChoice({ name: '1 jour', value: 24 * 60 * 60 * 1000 })
    @SlashOption({
      name: 'durée',
      description: 'Durée du mute',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    duration: number,
    @SlashOption({
      name: 'raison',
      description: 'Raison',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'Aucune raison spécifiée',
    interaction: CommandInteraction,
  ) {
    if (target.id === interaction.user.id)
      return interaction.reply({
        content: '❌ Tu ne peux pas te mute toi-même.',
        ephemeral: true,
      });
    const member = await interaction.guild?.members
      .fetch(target.id)
      .catch(() => null);
    if (!member || !member.moderatable)
      return interaction.reply({
        content:
          "❌ Impossible d'agir sur ce membre (rôle trop élevé ou introuvable).",
        ephemeral: true,
      });
    await member.timeout(duration, reason);
    const durationLabel =
      duration >= 86400000
        ? `${duration / 86400000} jour(s)`
        : duration >= 3600000
          ? `${duration / 3600000} heure(s)`
          : `${duration / 60000} minute(s)`;
    return interaction.reply(
      `🔇 **${target.tag}** muet pendant ${durationLabel}. Raison : ${reason}`,
    );
  }

  @Slash({
    name: 'tickets',
    description: 'Déployer le panneau de support',
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
  })
  async setupTickets(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Support RPB')
      .setDescription("Besoin d'aide ? Cliquez sur 📩 pour ouvrir un ticket.")
      .setColor(Colors.Primary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('create-ticket')
        .setLabel('Ouvrir un Ticket')
        .setEmoji('📩')
        .setStyle(ButtonStyle.Primary),
    );
    await (interaction.channel as TextChannel).send({
      embeds: [embed],
      components: [row],
    });
    return interaction.reply({
      content: '✅ Panneau installé.',
      ephemeral: true,
    });
  }

  @ButtonComponent({ id: 'create-ticket' })
  async handleCreate(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild!;
    const name = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (guild.channels.cache.find((c) => c.name === name))
      return interaction.editReply('❌ Ticket déjà ouvert.');

    const ticketChannel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: (interaction.channel as TextChannel).parentId,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          id: RPB.Roles.Modo,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ],
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('close-ticket')
        .setLabel('Fermer')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
    );
    await ticketChannel.send({
      content: `Bonjour ${interaction.user}, expliquez votre demande ici.`,
      components: [row],
    });
    return interaction.editReply(`✅ Ticket créé : ${ticketChannel}`);
  }

  @ButtonComponent({ id: 'close-ticket' })
  async handleClose(interaction: ButtonInteraction) {
    await interaction.deferReply();
    const channel = interaction.channel as TextChannel;
    const attachment = await (createTranscript as Function)(channel, {
      filename: `${channel.name}.html`,
    });
    const logChannel = interaction.guild?.channels.cache.get(
      RPB.Channels.Announcements,
    ) as TextChannel;
    if (logChannel)
      await logChannel.send({
        content: `Ticket clos par ${interaction.user.tag}`,
        files: [attachment],
      });
    await channel.delete();
  }
}
