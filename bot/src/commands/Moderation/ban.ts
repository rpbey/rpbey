import { Command } from '@sapphire/framework';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export class BanCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Bannir un membre du serveur',
      preconditions: ['ModeratorOnly'],
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('bannir')
        .setDescription('Bannir un membre du serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setContexts(0)
        .addUserOption((opt) =>
          opt
            .setName('membre')
            .setDescription('Le membre à bannir')
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('raison').setDescription('Raison du bannissement'),
        )
        .addIntegerOption((opt) =>
          opt
            .setName('supprimer_jours')
            .setDescription('Jours de messages à supprimer (0-7)')
            .setMinValue(0)
            .setMaxValue(7),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const target = interaction.options.getUser('membre', true);
    const reason =
      interaction.options.getString('raison') ?? 'Aucune raison fournie';
    const deleteDays = interaction.options.getInteger('supprimer_jours') ?? 0;
    const member = interaction.guild?.members.cache.get(target.id);

    if (member && !member.bannable) {
      return interaction.reply({
        content: '❌ Je ne peux pas bannir ce membre.',
        ephemeral: true,
      });
    }

    try {
      await interaction.guild?.bans.create(target.id, {
        reason: `${reason} | Banni par ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      const embed = new EmbedBuilder()
        .setTitle('🔨 Membre banni')
        .setColor(0xff0000)
        .addFields(
          {
            name: 'Membre',
            value: `${target.tag} (${target.id})`,
            inline: true,
          },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Raison', value: reason },
          {
            name: 'Messages supprimés',
            value: `${deleteDays} jour(s)`,
            inline: true,
          },
        )
        .setThumbnail(target.displayAvatarURL())
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('Ban command error:', error);
      return interaction.reply({
        content: '❌ Échec du bannissement du membre.',
        ephemeral: true,
      });
    }
  }
}
