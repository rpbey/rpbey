import {
  AuditLogEvent,
  EmbedBuilder,
  type Guild,
  type GuildTextBasedChannel,
} from 'discord.js';
import { type ArgsOf, Discord, On } from 'discordx';
import { injectable } from 'tsyringe';

import { Colors } from '../lib/constants.js';
import { logger } from '../lib/logger.js';

@Discord()
@injectable()
export class AdvancedLogs {
  private getLogChannel(guild: Guild) {
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (!logChannelId) return null;
    return guild.channels.cache.get(logChannelId) as
      | GuildTextBasedChannel
      | undefined;
  }

  // --- Member Update: role changes & boosts ---
  @On({ event: 'guildMemberUpdate' })
  async onMemberUpdate([oldMember, newMember]: ArgsOf<'guildMemberUpdate'>) {
    const channel = this.getLogChannel(newMember.guild);
    if (!channel) return;

    // Detect role additions
    const addedRoles = newMember.roles.cache.filter(
      (r) => !oldMember.roles.cache.has(r.id),
    );
    for (const [, role] of addedRoles) {
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Rôle Ajouté')
        .setDescription(`Le rôle **${role.name}** a été ajouté à ${newMember}.`)
        .setColor(Colors.Success)
        .setTimestamp();

      await channel
        .send({ embeds: [embed] })
        .catch((err) =>
          logger.error('[AdvancedLogs] Failed to send role add log:', err),
        );
    }

    // Detect role removals
    const removedRoles = oldMember.roles.cache.filter(
      (r) => !newMember.roles.cache.has(r.id) && r.id !== newMember.guild.id,
    );
    for (const [, role] of removedRoles) {
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Rôle Retiré')
        .setDescription(
          `Le rôle **${role.name}** a été retiré de ${newMember}.`,
        )
        .setColor(Colors.Warning)
        .setTimestamp();

      await channel
        .send({ embeds: [embed] })
        .catch((err) =>
          logger.error('[AdvancedLogs] Failed to send role remove log:', err),
        );
    }

    // Detect new boost
    if (!oldMember.premiumSince && newMember.premiumSince) {
      const embed = new EmbedBuilder()
        .setTitle('🚀 Nouveau Boost !')
        .setDescription(`Merci ${newMember} pour le boost du serveur ! 💎`)
        .setColor(0xff73fa)
        .setThumbnail(newMember.user.displayAvatarURL())
        .setTimestamp();

      await channel
        .send({ content: '🎉🚀🎉', embeds: [embed] })
        .catch((err) =>
          logger.error('[AdvancedLogs] Failed to send boost log:', err),
        );
    }

    // Detect nickname change
    if (oldMember.nickname !== newMember.nickname) {
      const embed = new EmbedBuilder()
        .setTitle('✏️ Pseudo Modifié')
        .setDescription(
          `${newMember} a changé de pseudo.\n**Avant :** ${oldMember.nickname || '*aucun*'}\n**Après :** ${newMember.nickname || '*aucun*'}`,
        )
        .setColor(Colors.Info)
        .setTimestamp();

      await channel
        .send({ embeds: [embed] })
        .catch((err) =>
          logger.error('[AdvancedLogs] Failed to send nickname log:', err),
        );
    }
  }

  // --- Member Join ---
  @On({ event: 'guildMemberAdd' })
  async onMemberJoin([member]: ArgsOf<'guildMemberAdd'>) {
    const channel = this.getLogChannel(member.guild);
    if (!channel) return;

    const created = Math.floor(member.user.createdTimestamp / 1000);
    const embed = new EmbedBuilder()
      .setTitle('📥 Membre Rejoint')
      .setDescription(
        `${member} (**${member.user.tag}**) a rejoint le serveur.`,
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setColor(Colors.Success)
      .addFields(
        {
          name: '📅 Compte créé',
          value: `<t:${created}:R>`,
          inline: true,
        },
        {
          name: '🔢 Membres',
          value: `${member.guild.memberCount}`,
          inline: true,
        },
      )
      .setTimestamp();

    await channel
      .send({ embeds: [embed] })
      .catch((err) =>
        logger.error('[AdvancedLogs] Failed to send join log:', err),
      );
  }

  // --- Member Leave ---
  @On({ event: 'guildMemberRemove' })
  async onMemberLeave([member]: ArgsOf<'guildMemberRemove'>) {
    const channel = this.getLogChannel(member.guild);
    if (!channel) return;

    const roles = member.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .map((r) => r.name)
      .join(', ');

    const embed = new EmbedBuilder()
      .setTitle('📤 Membre Parti')
      .setDescription(`${member} (**${member.user.tag}**) a quitté le serveur.`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setColor(Colors.Error)
      .addFields(
        {
          name: '🎭 Rôles',
          value: roles || '*aucun*',
          inline: false,
        },
        {
          name: '🔢 Membres',
          value: `${member.guild.memberCount}`,
          inline: true,
        },
      )
      .setTimestamp();

    await channel
      .send({ embeds: [embed] })
      .catch((err) =>
        logger.error('[AdvancedLogs] Failed to send leave log:', err),
      );
  }

  // --- Message Delete ---
  @On({ event: 'messageDelete' })
  async onMessageDelete([message]: ArgsOf<'messageDelete'>) {
    if (!message.guild || message.author?.bot) return;

    const channel = this.getLogChannel(message.guild);
    if (!channel) return;

    const content = message.content
      ? message.content.slice(0, 1024)
      : '*contenu non disponible*';

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Message Supprimé')
      .setDescription(
        `Message de ${message.author ?? '*inconnu*'} supprimé dans <#${message.channelId}>`,
      )
      .setColor(Colors.Error)
      .addFields({ name: '💬 Contenu', value: content })
      .setTimestamp();

    if (message.attachments.size > 0) {
      embed.addFields({
        name: '📎 Pièces jointes',
        value: message.attachments.map((a) => a.name).join(', '),
      });
    }

    await channel
      .send({ embeds: [embed] })
      .catch((err) =>
        logger.error('[AdvancedLogs] Failed to send message delete log:', err),
      );
  }

  // --- Message Edit ---
  @On({ event: 'messageUpdate' })
  async onMessageUpdate([oldMessage, newMessage]: ArgsOf<'messageUpdate'>) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const channel = this.getLogChannel(newMessage.guild);
    if (!channel) return;

    const before = oldMessage.content
      ? oldMessage.content.slice(0, 1024)
      : '*non disponible*';
    const after = newMessage.content
      ? newMessage.content.slice(0, 1024)
      : '*non disponible*';

    const embed = new EmbedBuilder()
      .setTitle('✏️ Message Modifié')
      .setDescription(
        `Message de ${newMessage.author} modifié dans <#${newMessage.channelId}> — [Voir](${newMessage.url})`,
      )
      .setColor(Colors.Warning)
      .addFields(
        { name: '📝 Avant', value: before },
        { name: '📝 Après', value: after },
      )
      .setTimestamp();

    await channel
      .send({ embeds: [embed] })
      .catch((err) =>
        logger.error('[AdvancedLogs] Failed to send message edit log:', err),
      );
  }

  // --- Member Ban ---
  @On({ event: 'guildBanAdd' })
  async onBan([ban]: ArgsOf<'guildBanAdd'>) {
    const channel = this.getLogChannel(ban.guild);
    if (!channel) return;

    let reason = ban.reason ?? '*non spécifiée*';
    try {
      const logs = await ban.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanAdd,
        limit: 1,
      });
      const entry = logs.entries.first();
      if (entry?.target?.id === ban.user.id) {
        reason = entry.reason ?? reason;
      }
    } catch {
      // Audit log fetch can fail, use default reason
    }

    const embed = new EmbedBuilder()
      .setTitle('🔨 Membre Banni')
      .setDescription(`**${ban.user.tag}** a été banni du serveur.`)
      .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
      .setColor(Colors.Error)
      .addFields({ name: '📋 Raison', value: reason })
      .setTimestamp();

    await channel
      .send({ embeds: [embed] })
      .catch((err) =>
        logger.error('[AdvancedLogs] Failed to send ban log:', err),
      );
  }

  // --- Member Unban ---
  @On({ event: 'guildBanRemove' })
  async onUnban([ban]: ArgsOf<'guildBanRemove'>) {
    const channel = this.getLogChannel(ban.guild);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🔓 Membre Débanni')
      .setDescription(`**${ban.user.tag}** a été débanni du serveur.`)
      .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
      .setColor(Colors.Success)
      .setTimestamp();

    await channel
      .send({ embeds: [embed] })
      .catch((err) =>
        logger.error('[AdvancedLogs] Failed to send unban log:', err),
      );
  }
}
