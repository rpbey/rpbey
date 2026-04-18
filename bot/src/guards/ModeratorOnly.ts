import {
  type CommandInteraction,
  type GuildMember,
  PermissionFlagsBits,
} from 'discord.js';
import { type GuardFunction } from '@aphrody/discordx';

export const ModeratorOnly: GuardFunction<CommandInteraction> = async (
  interaction,
  _client,
  next,
) => {
  const member = interaction.member as GuildMember;

  if (!member) {
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: 'Cette commande ne peut être utilisée que sur un serveur.',
        ephemeral: true,
      });
    }
    return;
  }

  const hasModPermissions = member.permissions.has([
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.BanMembers,
  ]);

  if (hasModPermissions) {
    await next();
  } else {
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: 'Seuls les modérateurs peuvent utiliser cette commande.',
        ephemeral: true,
      });
    }
  }
};
