import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { aiService } from '../../lib/ai.js';
import { Colors } from '../../lib/constants.js';

export class AskCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "Pose une question à l'IA de la RPB",
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('ask')
        .setDescription('Pose une question sur RPB ou le Beyblade X')
        .addStringOption((opt) =>
          opt
            .setName('question')
            .setDescription("Ta question (ex: Comment s'inscrire ?)")
            .setRequired(true),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const question = interaction.options.getString('question', true);

    await interaction.deferReply();

    try {
      const context = aiService.getKnowledgeBase();
      if (!context) {
        return interaction.editReply(
          '❌ Ma base de connaissances est vide ou introuvable.',
        );
      }

      const answers = await aiService.answerQuestion(question, context);

      if (!answers || answers.length === 0 || answers[0].score < 0.5) {
        return interaction.editReply(
          "🤔 Je n'ai pas trouvé de réponse précise dans ma base de données. " +
            'Essaye de reformuler ou contacte un membre du staff !',
        );
      }

      const bestAnswer = answers[0];
      const embed = new EmbedBuilder()
        .setTitle("🤖 Réponse de l'IA")
        .setDescription(bestAnswer.text)
        .setColor(Colors.Info)
        .addFields({
          name: '🎯 Question posée',
          value: question,
        })
        .setFooter({
          text: `Confiance : ${Math.round(bestAnswer.score * 10)}% | Basé sur la base de connaissances RPB`,
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.container.logger.error('[AI] Ask command error:', error);
      return interaction.editReply(
        "❌ Une erreur est survenue lors de l'analyse de la question.",
      );
    }
  }
}
