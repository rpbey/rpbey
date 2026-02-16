import type { CommandInteraction } from 'discord.js';
import type { GuardFunction } from 'discordx';

export const OwnerOnly: GuardFunction<CommandInteraction> = async (
  interaction,
  _client,
  next,
) => {
  const owners = process.env.OWNER_IDS?.split(',') ?? [];
  if (owners.includes(interaction.user.id)) {
    await next();
  } else {
    await interaction.reply({
      content: '❌ Cette commande est réservée aux propriétaires du bot.',
      ephemeral: true,
    });
  }
};
