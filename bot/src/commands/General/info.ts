import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  version as djsVersion,
  EmbedBuilder,
  GuildMember,
  type User,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';

import { Colors, RPB } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';

@Discord()
@SlashGroup({ name: 'info', description: 'Affiche les informations' })
@SlashGroup('info')
export class InfoCommand {
  @Slash({ name: 'bot', description: 'Statistiques et infos du bot' })
  async bot(interaction: CommandInteraction) {
    const client = interaction.client;
    const memoryUsage = process.memoryUsage();

    const totalUsers = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0,
    );

    const totalChannels = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.channels.cache.size,
      0,
    );

    const uptime = client.uptime ?? 0;
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const uptimeStr = `${days}j ${hours}h ${minutes}m`;

    const embed = new EmbedBuilder()
      .setTitle('🤖 RPB Bot')
      .setColor(Colors.Primary)
      .setThumbnail(RPB.RoleIcons.Default)
      .addFields(
        {
          name: '📊 Serveurs',
          value: `${client.guilds.cache.size}`,
          inline: true,
        },
        {
          name: '👥 Utilisateurs',
          value: `${totalUsers.toLocaleString('fr-FR')}`,
          inline: true,
        },
        {
          name: '💬 Salons',
          value: `${totalChannels}`,
          inline: true,
        },
        { name: '📦 Discord.js', value: `v${djsVersion}`, inline: true },
        { name: '⚡ Discordx', value: `v11`, inline: true },
        { name: '🟢 Node.js', value: process.version, inline: true },
        {
          name: '💾 Mémoire',
          value: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} Mo`,
          inline: true,
        },
        {
          name: '⏱️ Uptime',
          value: uptimeStr,
          inline: true,
        },
        {
          name: '📡 Ping',
          value: `${client.ws.ping}ms`,
          inline: true,
        },
      )
      .setFooter({ text: RPB.FullName })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  @Slash({ name: 'serveur', description: 'Informations sur le serveur' })
  async server(interaction: CommandInteraction) {
    const { guild } = interaction;
    if (!guild) {
      return interaction.reply({
        content: '❌ Cette commande ne peut être utilisée que sur un serveur.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const fetchedGuild = await guild.fetch();

    const textChannels = guild.channels.cache.filter(
      (c) => c.isTextBased() && !c.isThread(),
    ).size;
    const voiceChannels = guild.channels.cache.filter((c) =>
      c.isVoiceBased(),
    ).size;
    const categories = guild.channels.cache.filter((c) => c.type === 4).size;

    let onlineCount = 0;
    try {
      const members = await guild.members.fetch({ withPresences: true });
      onlineCount = members.filter(
        (m) => m.presence?.status && m.presence.status !== 'offline',
      ).size;
    } catch {
      onlineCount = 0;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🌀 ${fetchedGuild.name}`)
      .setColor(Colors.Primary)
      .setThumbnail(fetchedGuild.iconURL({ size: 256 }))
      .addFields(
        {
          name: '👑 Propriétaire',
          value: `<@${fetchedGuild.ownerId}>`,
          inline: true,
        },
        {
          name: '👥 Membres',
          value:
            onlineCount > 0
              ? `${fetchedGuild.memberCount.toLocaleString('fr-FR')} (🟢 ${onlineCount})`
              : `${fetchedGuild.memberCount.toLocaleString('fr-FR')}`,
          inline: true,
        },
        {
          name: '💬 Salons',
          value: `📝 ${textChannels} | 🔊 ${voiceChannels} | 📁 ${categories}`,
          inline: true,
        },
        { name: '🎭 Rôles', value: `${guild.roles.cache.size}`, inline: true },
        {
          name: '😀 Emojis',
          value: `${guild.emojis.cache.size}`,
          inline: true,
        },
        {
          name: '🚀 Boosts',
          value: `${fetchedGuild.premiumSubscriptionCount ?? 0} (Niveau ${fetchedGuild.premiumTier})`,
          inline: true,
        },
        {
          name: '📅 Créé',
          value: `<t:${Math.floor(fetchedGuild.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: '🔒 Vérification',
          value:
            ['Aucune', 'Faible', 'Moyenne', 'Haute', 'Très haute'][
              fetchedGuild.verificationLevel
            ] ?? 'Inconnue',
          inline: true,
        },
      )
      .setFooter({ text: `ID: ${fetchedGuild.id}` })
      .setTimestamp();

    if (fetchedGuild.bannerURL()) {
      embed.setImage(fetchedGuild.bannerURL({ size: 512 }));
    }

    return interaction.editReply({ embeds: [embed] });
  }

  @Slash({ name: 'membre', description: 'Informations sur un membre' })
  async member(
    @SlashOption({
      name: 'cible',
      description: 'Le membre à afficher',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetOption: User | GuildMember | undefined,
    interaction: CommandInteraction,
  ) {
    let target: User;
    if (!targetOption) {
      target = interaction.user;
    } else if (targetOption instanceof GuildMember) {
      target = targetOption.user;
    } else {
      target = targetOption;
    }

    const member = interaction.guild?.members.cache.get(target.id);
    const fetchedUser = await interaction.client.users.fetch(target.id, {
      force: true,
    });

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${member?.nickname ?? target.displayName}`)
      .setColor(member?.displayColor ?? Colors.Primary)
      .setThumbnail(
        member?.displayAvatarURL({ size: 256 }) ??
          target.displayAvatarURL({ size: 256 }),
      )
      .addFields(
        { name: '🏷️ Pseudo', value: target.tag, inline: true },
        { name: '🆔 ID', value: target.id, inline: true },
        { name: '🤖 Bot', value: target.bot ? 'Oui' : 'Non', inline: true },
        {
          name: '📅 Compte créé',
          value: `<t:${Math.floor(target.createdTimestamp / 1000)}:f> (<t:${Math.floor(target.createdTimestamp / 1000)}:R>)`,
          inline: false,
        },
      );

    const bannerUrl = fetchedUser.bannerURL({ size: 512 });
    if (bannerUrl) {
      embed.setImage(bannerUrl);
    }

    if (member) {
      const statusMap: Record<string, string> = {
        online: '🟢 En ligne',
        idle: '🌙 Absent',
        dnd: '⛔ Ne pas déranger',
        offline: '⚫ Hors ligne',
        invisible: '⚫ Hors ligne',
      };

      const status =
        (member.presence?.status && statusMap[member.presence.status]) ||
        '⚫ Hors ligne';

      const activity = member.presence?.activities[0];
      let activityText = 'Aucune activité';
      if (activity) {
        if (activity.type === 4 && activity.state) {
          activityText = `${activity.emoji ? `${activity.emoji.name} ` : ''}${activity.state}`;
        } else {
          activityText = `${activity.name} ${activity.details ? `(${activity.details})` : ''}`;
        }
      }

      embed.addFields(
        {
          name: '📥 A rejoint le serveur',
          value: member.joinedAt
            ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:f> (<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>)`
            : 'Inconnu',
          inline: false,
        },
        {
          name: '✨ Statut',
          value: status,
          inline: true,
        },
        {
          name: '🎮 Activité',
          value: activityText,
          inline: true,
        },
      );

      if (member.premiumSince) {
        embed.addFields({
          name: '🚀 Server Booster',
          value: `Depuis <t:${Math.floor(member.premiumSince.getTime() / 1000)}:R>`,
          inline: true,
        });
      }

      const roles = member.roles.cache
        .filter((r) => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map((r) => r.toString())
        .slice(0, 10);

      if (roles.length > 0) {
        embed.addFields({
          name: `🎭 Rôles (${member.roles.cache.size - 1})`,
          value: roles.join(' ') || 'Aucun rôle affichable',
          inline: false,
        });
      }
    }

    embed.setFooter({ text: RPB.FullName }).setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  @Slash({ name: 'staff', description: 'Affiche la liste du staff RPB' })
  async staff(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
      const staffMembers = await prisma.staffMember.findMany({
        where: { isActive: true },
        orderBy: [{ teamId: 'asc' }, { displayIndex: 'asc' }],
      });

      if (staffMembers.length === 0) {
        return interaction.editReply({
          content:
            "❌ Aucune information sur l'équipe n'est disponible pour le moment.",
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎖️ Équipe RPB')
        .setDescription(
          'Voici les membres de la République Populaire du Beyblade qui font vivre la communauté.\n' +
            'Retrouvez plus de détails sur [notre site](https://rpbey.fr/notre-equipe) !',
        )
        .setColor(Colors.Primary)
        .setThumbnail(RPB.RoleIcons.Staff)
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      const teams: Record<string, typeof staffMembers> = {};
      for (const member of staffMembers) {
        if (!teams[member.teamId]) teams[member.teamId] = [];
        teams[member.teamId].push(member);
      }

      const teamNames: Record<string, string> = {
        admin: '⭐ Administration',
        mod: '🛡️ Modération',
        event: '🎮 Événementiel',
        dev: '💻 Développement',
        content: '🎬 Créateurs',
      };

      for (const [teamId, members] of Object.entries(teams)) {
        const memberList = members
          .map((m) => {
            const discordMention = m.discordId ? `<@${m.discordId}>` : '';
            return `• **${m.name}** (${m.role}) ${discordMention}`;
          })
          .join('\n');

        embed.addFields({
          name: teamNames[teamId] || teamId.toUpperCase(),
          value: memberList || 'Aucun membre',
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Staff info error:', error);
      return interaction.editReply({
        content: "❌ Erreur lors de la récupération de l'équipe.",
      });
    }
  }
}
