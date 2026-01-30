import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  type TextChannel,
} from 'discord.js';
import { RPB } from '../../lib/constants.js';
import { ROLE_PANELS } from '../../lib/role-panels.js';

@ApplyOptions<Command.Options>({
  description: 'Poste les panneaux de rôles réaction',
  preconditions: ['GuildOnly', 'OwnerOnly'],
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('config-roles')
        .setDescription('Configure les messages de rôles réaction')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((opt) =>
          opt
            .setName('salon')
            .setDescription('Le salon où envoyer les panneaux (défaut: #rôles)')
            .addChannelTypes(ChannelType.GuildText),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    const defaultChannelId = RPB.Channels.Roles;
    const channel = (interaction.options.getChannel('salon') ??
      interaction.guild?.channels.cache.get(defaultChannelId)) as TextChannel;

    if (!channel) {
      return interaction.editReply(
        `❌ Impossible de trouver le salon cible (ID: ${defaultChannelId}).`,
      );
    }

    try {
      let sentCount = 0;

      for (const panel of ROLE_PANELS) {
        const embed = new EmbedBuilder()
          .setTitle(panel.title)
          .setDescription(panel.description)
          .setColor(panel.color);

        if (panel.image) {
          embed.setImage(panel.image);
        }

        const row = new ActionRowBuilder<ButtonBuilder>();

        for (const btn of panel.buttons) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(btn.customId)
              .setLabel(btn.label)
              .setEmoji(btn.emoji)
              .setStyle(btn.style),
          );
        }

        await channel.send({
          embeds: [embed],
          components: [row],
        });
        sentCount++;
      }

      return interaction.editReply(
        `✅ ${sentCount} panneaux de rôles envoyés dans ${channel} !`,
      );
    } catch (error) {
      this.container.logger.error('Setup roles error:', error);
      return interaction.editReply(
        "❌ Une erreur est survenue lors de l'envoi des panneaux.",
      );
    }
  }
}
