import { Listener } from '@sapphire/framework';
import {
  AttachmentBuilder,
  EmbedBuilder,
  Events,
  type GuildMember,
  type TextChannel,
} from 'discord.js';
import { generateWelcomeImage } from '../../lib/canvas-utils.js';
import { Colors, RPB } from '../../lib/constants.js';

export class MemberJoinListener extends Listener<typeof Events.GuildMemberAdd> {
  constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.GuildMemberAdd,
    });
  }

  override async run(member: GuildMember) {
    this.container.logger.info(
      `Nouveau membre: ${member.user.tag} sur ${member.guild.name}`,
    );

    // 1. Image Generation (Safe Mode)
    let attachmentItems: AttachmentBuilder[] = [];
    let hasImage = false;

    try {
      const avatarUrl = member.displayAvatarURL({
        extension: 'png',
        size: 256,
        forceStatic: true,
      });
      const imageBuffer = await generateWelcomeImage(
        member.displayName,
        avatarUrl,
        member.guild.memberCount,
      );
      attachmentItems = [
        new AttachmentBuilder(imageBuffer, { name: 'welcome.png' }),
      ];
      hasImage = true;
    } catch (err) {
      this.container.logger.error(
        'Failed to generate welcome image, falling back to text:',
        err,
      );
      // Continue execution without image
    }

    // 2. Channel Resolution (Robust Mode)
    const findChannel = (search: string) =>
      member.guild.channels.cache.find(
        (c) =>
          c.id === search ||
          (c.name &&
            c.name.toLowerCase().replace(/[^a-z0-9]/g, '') ===
              search.toLowerCase().replace(/[^a-z0-9]/g, '')),
      ) as TextChannel | undefined;

    let welcomeChannel = findChannel(RPB.Channels.Welcome);

    // Ultimate fallback: System Channel (where Discord sends default welcome messages)
    if (!welcomeChannel?.isTextBased()) {
      welcomeChannel = member.guild.systemChannel as TextChannel;
    }

    // If absolutely no channel is found (rare), abort
    if (!welcomeChannel?.isTextBased()) {
      this.container.logger.warn(
        `No welcome channel found for ${member.guild.name}`,
      );
      return;
    }

    // 3. Helper for channel mentions
    const rulesChannel = findChannel(RPB.Channels.Rules);
    const rolesChannel = findChannel(RPB.Channels.Roles);
    const generalChannel = findChannel(RPB.Channels.GeneralChat);

    const getMention = (
      channel: { id: string } | undefined,
      fallback: string,
    ) => (channel?.id ? `<#${channel.id}>` : fallback);

    // 4. Build Embed
    const embed = new EmbedBuilder()
      .setTitle('🌀 Bienvenue à la RPB !')
      .setDescription(
        `Bienvenue ${member.toString()} dans la **${RPB.FullName}** !\n\n` +
          `📜 Lis le ${getMention(rulesChannel, '#règlement')} pour connaître les règles\n` +
          `🎭 Récupère tes rôles dans ${getMention(rolesChannel, '#rôles')}\n` +
          `💬 Viens discuter dans ${getMention(generalChannel, '#chat-general')}\n\n` +
          `**Let it rip !** 🌀`,
      )
      .setColor(Colors.Primary)
      .addFields(
        { name: '👤 Membre', value: member.user.tag, inline: true },
        {
          name: '🔢 Membre #',
          value: `${member.guild.memberCount}`,
          inline: true,
        },
      )
      .setFooter({
        text: RPB.FullName,
        iconURL: member.guild.iconURL() ?? undefined,
      })
      .setTimestamp();

    // Attach image only if generation succeeded
    if (hasImage) {
      embed.setImage('attachment://welcome.png');
    }

    // 5. Send Message (Safe Send)
    try {
      await welcomeChannel.send({
        content: `Bienvenue ${member.toString()} !`, // Ping user
        embeds: [embed],
        files: attachmentItems,
      });
      this.container.logger.info(
        `Welcome message sent to ${welcomeChannel.name} for ${member.user.tag}`,
      );
    } catch (error) {
      this.container.logger.error(
        'CRITICAL: Failed to send welcome message:',
        error,
      );
    }
  }
}
