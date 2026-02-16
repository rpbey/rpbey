import {
  ApplicationCommandOptionType,
  ChannelType,
  type CommandInteraction,
  EmbedBuilder,
  type GuildMember,
  PermissionFlagsBits,
} from 'discord.js';
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';

import { ModeratorOnly } from '../../guards/ModeratorOnly.js';
import { logger } from '../../lib/logger.js';

const MUTED_CHANNEL_ID = process.env.MUTED_CHANNEL_ID ?? '1456761597245784260';
const MUTED_ROLE_NAME = 'Muted';

@Discord()
@SlashGroup({
  name: 'muet',
  description: "Gérer le mute d'un membre",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
})
@SlashGroup('muet')
@Guard(ModeratorOnly)
export class MuteCommand {
  @Slash({
    name: 'ajouter',
    description: "Mute un membre (ne peut voir qu'un seul salon)",
  })
  async mute(
    @SlashOption({
      name: 'membre',
      description: 'Le membre à mute',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target:
      | GuildMember
      | { id: string; tag: string; displayAvatarURL: () => string },
    @SlashOption({
      name: 'raison',
      description: 'Raison du mute',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    reason: string = 'Aucune raison fournie',
    interaction: CommandInteraction,
  ) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: '❌ Cette commande doit être utilisée sur un serveur.',
        ephemeral: true,
      });
    }

    const member = guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({
        content: '❌ Membre introuvable sur ce serveur.',
        ephemeral: true,
      });
    }

    const mutedRole = guild.roles.cache.find((r) => r.name === MUTED_ROLE_NAME);

    if (!mutedRole) {
      return interaction.reply({
        content:
          "❌ Le rôle **Muted** n'existe pas. Utilisez `/muet config` d'abord.",
        ephemeral: true,
      });
    }

    if (member.roles.cache.has(mutedRole.id)) {
      return interaction.reply({
        content: '⚠️ Ce membre est déjà mute.',
        ephemeral: true,
      });
    }

    try {
      await member.roles.add(
        mutedRole,
        `Mute par ${interaction.user.tag}: ${reason}`,
      );

      const userTag = 'tag' in target ? target.tag : target.user.tag;
      const avatarURL =
        'displayAvatarURL' in target
          ? target.displayAvatarURL()
          : (target as GuildMember).displayAvatarURL();

      const embed = new EmbedBuilder()
        .setTitle('🔇 Membre mute')
        .setColor(0xff6b00)
        .addFields(
          {
            name: 'Membre',
            value: `${userTag} (${target.id})`,
            inline: true,
          },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Raison', value: reason },
          {
            name: 'Salon accessible',
            value: `<#${MUTED_CHANNEL_ID}>`,
            inline: true,
          },
        )
        .setThumbnail(avatarURL)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Mute command error:', error);
      return interaction.reply({
        content: '❌ Échec du mute. Vérifiez mes permissions.',
        ephemeral: true,
      });
    }
  }

  @Slash({ name: 'retirer', description: "Retire le mute d'un membre" })
  async unmute(
    @SlashOption({
      name: 'membre',
      description: 'Le membre à unmute',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    target:
      | GuildMember
      | { id: string; tag: string; displayAvatarURL: () => string },
    interaction: CommandInteraction,
  ) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: '❌ Cette commande doit être utilisée sur un serveur.',
        ephemeral: true,
      });
    }

    const member = guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({
        content: '❌ Membre introuvable sur ce serveur.',
        ephemeral: true,
      });
    }

    const mutedRole = guild.roles.cache.find((r) => r.name === MUTED_ROLE_NAME);

    if (!mutedRole || !member.roles.cache.has(mutedRole.id)) {
      return interaction.reply({
        content: "⚠️ Ce membre n'est pas mute.",
        ephemeral: true,
      });
    }

    try {
      await member.roles.remove(
        mutedRole,
        `Unmute par ${interaction.user.tag}`,
      );

      const userTag = 'tag' in target ? target.tag : target.user.tag;
      const avatarURL =
        'displayAvatarURL' in target
          ? target.displayAvatarURL()
          : (target as GuildMember).displayAvatarURL();

      const embed = new EmbedBuilder()
        .setTitle('🔊 Membre unmute')
        .setColor(0x00ff00)
        .addFields(
          {
            name: 'Membre',
            value: `${userTag} (${target.id})`,
            inline: true,
          },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
        )
        .setThumbnail(avatarURL)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Unmute command error:', error);
      return interaction.reply({
        content: '❌ Échec du unmute. Vérifiez mes permissions.',
        ephemeral: true,
      });
    }
  }

  @Slash({
    name: 'config',
    description: 'Configure le rôle Muted et les permissions des salons',
  })
  async setupMutedRole(interaction: CommandInteraction) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: '❌ Cette commande doit être utilisée sur un serveur.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const existingRole = guild.roles.cache.find(
        (r) => r.name === MUTED_ROLE_NAME,
      );

      const mutedRole =
        existingRole ??
        (await guild.roles.create({
          name: MUTED_ROLE_NAME,
          color: 0x808080,
          reason: 'Rôle pour les utilisateurs mutes',
          permissions: [],
        }));

      if (!existingRole) {
        logger.info(`Rôle ${MUTED_ROLE_NAME} créé`);
      }

      const channels = guild.channels.cache.filter(
        (c) =>
          c.type === ChannelType.GuildText ||
          c.type === ChannelType.GuildVoice ||
          c.type === ChannelType.GuildForum ||
          c.type === ChannelType.GuildCategory,
      );

      let updated = 0;
      let errors = 0;

      for (const [, channel] of channels) {
        try {
          if (channel.id === MUTED_CHANNEL_ID) {
            await channel.permissionOverwrites.edit(mutedRole, {
              ViewChannel: true,
              SendMessages: true,
              AddReactions: false,
              AttachFiles: false,
              EmbedLinks: false,
            });
          } else {
            await channel.permissionOverwrites.edit(mutedRole, {
              ViewChannel: false,
              SendMessages: false,
            });
          }
          updated++;
        } catch (err) {
          errors++;
          logger.warn(
            `Impossible de modifier les permissions de ${channel.name}:`,
            err,
          );
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Configuration du rôle Muted terminée')
        .setColor(0x00ff00)
        .addFields(
          { name: 'Rôle', value: `<@&${mutedRole.id}>`, inline: true },
          {
            name: 'Salon accessible',
            value: `<#${MUTED_CHANNEL_ID}>`,
            inline: true,
          },
          {
            name: 'Salons configurés',
            value: `${updated} salons`,
            inline: true,
          },
        )
        .setDescription(
          'Les utilisateurs avec le rôle **Muted** ne peuvent voir que le salon désigné.',
        )
        .setTimestamp();

      if (errors > 0) {
        embed.addFields({
          name: '⚠️ Erreurs',
          value: `${errors} salon(s) n'ont pas pu être configurés (permissions insuffisantes)`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Setup muted role error:', error);
      return interaction.editReply({
        content:
          "❌ Échec de la configuration. Vérifiez que j'ai la permission de gérer les rôles et les salons.",
      });
    }
  }
}
