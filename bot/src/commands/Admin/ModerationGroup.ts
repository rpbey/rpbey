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
  SlashGroup,
  SlashOption,
} from 'discordx';
import { injectable } from 'tsyringe';

import { Colors, RPB } from '../../lib/constants.js';

@Discord()
@SlashGroup({
  name: 'moderation',
  description: 'Moderation and support tools',
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
})
@SlashGroup('moderation')
@injectable()
export class ModerationGroup {
  @Slash({ name: 'clear', description: 'Delete a number of messages' })
  @SlashGroup('moderation')
  async clear(
    @SlashOption({
      name: 'amount',
      description: 'Number of messages (1-100)',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      maxValue: 100,
    })
    amount: number,
    interaction: CommandInteraction,
  ) {
    const channel = interaction.channel as TextChannel;
    if (!channel) return interaction.reply('❌ Text channel only.');
    await channel.bulkDelete(amount);
    return interaction.reply({
      content: `✅ **${amount}** messages deleted.`,
      ephemeral: true,
    });
  }

  @Slash({ name: 'ban', description: 'Ban a member from the server' })
  @SlashGroup('moderation')
  async ban(
    @SlashOption({
      name: 'target',
      description: 'The member to ban',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    @SlashOption({
      name: 'reason',
      description: 'Reason for the ban',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'No reason specified',
    interaction: CommandInteraction,
  ) {
    const member = interaction.guild?.members.cache.get(target.id);
    if (member && !member.bannable)
      return interaction.reply('❌ I cannot ban this member.');
    await interaction.guild?.members.ban(target, { reason });
    return interaction.reply(
      `🔨 **${target.tag}** has been banned. Reason: ${reason}`,
    );
  }

  @Slash({ name: 'kick', description: 'Kick a member from the server' })
  @SlashGroup('moderation')
  async kick(
    @SlashOption({
      name: 'target',
      description: 'The member to kick',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    @SlashOption({
      name: 'reason',
      description: 'Reason for the kick',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'No reason specified',
    interaction: CommandInteraction,
  ) {
    const member = interaction.guild?.members.cache.get(target.id);
    if (!member || !member.kickable)
      return interaction.reply('❌ I cannot kick this member.');
    await member.kick(reason);
    return interaction.reply(
      `👢 **${target.tag}** has been kicked. Reason: ${reason}`,
    );
  }

  @Slash({
    name: 'mute',
    description: 'Timeout a member',
  })
  @SlashGroup('moderation')
  async mute(
    @SlashOption({
      name: 'target',
      description: 'The member to mute',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target: User,
    @SlashChoice({ name: '60 seconds', value: 60 * 1000 })
    @SlashChoice({ name: '5 minutes', value: 5 * 60 * 1000 })
    @SlashChoice({ name: '10 minutes', value: 10 * 60 * 1000 })
    @SlashChoice({ name: '1 hour', value: 60 * 60 * 1000 })
    @SlashChoice({ name: '1 day', value: 24 * 60 * 60 * 1000 })
    @SlashOption({
      name: 'duration',
      description: 'Mute duration',
      required: true,
      type: ApplicationCommandOptionType.Integer,
    })
    duration: number,
    @SlashOption({
      name: 'reason',
      description: 'Reason',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'No reason specified',
    interaction: CommandInteraction,
  ) {
    const member = interaction.guild?.members.cache.get(target.id);
    if (!member || !member.moderatable)
      return interaction.reply('❌ I cannot act on this member.');
    await member.timeout(duration, reason);
    return interaction.reply(
      `🔇 **${target.tag}** muted for ${duration / 60000} min. Reason: ${reason}`,
    );
  }

  @Slash({ name: 'tickets', description: 'Deploy the support panel' })
  @SlashGroup('moderation')
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
