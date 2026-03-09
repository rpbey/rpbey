import {
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type GuildTextBasedChannel,
  type Role,
} from 'discord.js';
import { Discord, On } from 'discordx';
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

  @On({ event: 'guildMemberRoleAdd' as 'guildMemberUpdate' })
  async onRoleAdd([member, role]: [GuildMember, Role]) {
    logger.info(`Rôle ${role.name} ajouté à ${member.user.tag}`);

    const channel = this.getLogChannel(member.guild);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Rôle Ajouté')
      .setDescription(`Le rôle **${role.name}** a été ajouté à ${member}.`)
      .setColor(Colors.Success)
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => null);
  }

  @On({ event: 'guildMemberBoost' as 'guildMemberUpdate' })
  async onBoost([member]: [GuildMember]) {
    const channel = this.getLogChannel(member.guild);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🚀 Nouveau Boost !')
      .setDescription(`Merci ${member} pour le boost du serveur ! 💎`)
      .setColor(0xff73fa)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    await channel
      .send({ content: '🎉🚀🎉', embeds: [embed] })
      .catch(() => null);
  }
}
