import { Command } from '@sapphire/framework';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export class KickCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Expulser un membre du serveur',
      preconditions: ['ModeratorOnly'],
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('expulser')
        .setDescription('Expulser un membre du serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setContexts(0)
        .addUserOption((opt) =>
          opt
            .setName('membre')
            .setDescription('Le membre à expulser')
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('raison').setDescription("Raison de l'expulsion"),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const target = interaction.options.getUser('membre', true);
    const reason =
      interaction.options.getString('raison') ?? 'Aucune raison fournie';
    const member = interaction.guild?.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({
        content: '❌ Membre introuvable.',
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: '❌ Je ne peux pas expulser ce membre.',
        ephemeral: true,
      });
    }

    try {
      await member.kick(`${reason} | Expulsé par ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setTitle('👢 Membre expulsé')
        .setColor(0xffa500)
        .addFields(
          {
            name: 'Membre',
            value: `${target.tag} (${target.id})`,
            inline: true,
          },
          { name: 'Modérateur', value: interaction.user.tag, inline: true },
          { name: 'Raison', value: reason },
        )
        .setThumbnail(target.displayAvatarURL())
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('Kick command error:', error);
      return interaction.reply({
        content: "❌ Échec de l'expulsion du membre.",
        ephemeral: true,
      });
    }
  }
}
