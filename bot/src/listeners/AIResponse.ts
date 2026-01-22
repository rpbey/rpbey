import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  type Message,
} from 'discord.js';
import { aiService } from '../lib/ai.js';
import { Colors, RPB } from '../lib/constants.js';

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class AIResponse extends Listener {
  public async run(message: Message) {
    // Ignore bots and empty messages
    if (message.author.bot || !message.content) return;

    const isDM = message.channel.type === ChannelType.DM;
    const botId = this.container.client.user?.id;
    const isMention = botId
      ? message.mentions.has(botId) && !message.mentions.everyone
      : false;

    // We only respond automatically to direct mentions or DMs
    if (!isMention && !isDM) return;

    // 1. Try to answer with AI if it looks like a question
    const isQuestion =
      message.content.includes('?') ||
      message.content.toLowerCase().includes('comment') ||
      message.content.toLowerCase().includes("c'est quoi") ||
      isDM; // In DMs, we assume any message is a potential query

    if (isQuestion) {
      const question = message.content
        .replace(/<@!?[0-9]+>/g, '') // Remove mention
        .trim();

      const context = aiService.getKnowledgeBase();

      if (context && question.length > 3) {
        const answers = await aiService.answerQuestion(question, context);

        // Confident answer
        if (answers && answers.length > 0 && answers[0].score > 0.8) {
          const answer = answers[0].text;
          const aiEmbed = new EmbedBuilder()
            .setTitle('🤖 Assistant IA RPB')
            .setDescription(answer)
            .setColor(Colors.Info)
            .setFooter({
              text: `Confiance : ${Math.round(answers[0].score * 10)}%`,
            });

          return message.reply({ embeds: [aiEmbed] });
        }
      }
    }

    // 2. Fallback to standard greeting/menu if not a clear question or in a guild mention
    if (isMention) {
      const description = [
        `Je suis le **${RPB.Name}**, l'assistant IA officiel de la **${RPB.FullName}**.`,
        '',
        'Je peux répondre à tes questions sur le serveur et le Beyblade X.',
        'Pose moi une question avec `/ask` ou ici même !',
      ].join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`👋 Bonjour ${message.author.displayName} !`)
        .setDescription(description)
        .setColor(Colors.Primary)
        .addFields(
          {
            name: '📜 Règles Officielles',
            value:
              '[World Beyblade Org](https://worldbeyblade.org/Thread-Beyblade-X-Rules)',
            inline: true,
          },
          {
            name: '🛒 Produits X',
            value:
              '[Takara Tomy](https://beyblade.takaratomy.co.jp/beyblade-x/lineup/)',
            inline: true,
          },
          {
            name: '📊 Classement',
            value: '[RPB Rankings](https://rpbey.fr/rankings)',
            inline: true,
          },
          {
            name: '🏆 Tournois',
            value: '`/annonce tournoi`',
            inline: true,
          },
          {
            name: '👤 Mon Profil',
            value: '`/profile`',
            inline: true,
          },
          {
            name: '⚔️ Combat',
            value: '`/battle`',
            inline: true,
          },
        )
        .setThumbnail(this.container.client.user?.displayAvatarURL() ?? null)
        .setFooter({ text: 'Données certifiées par la RPB' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Voir le site')
          .setStyle(ButtonStyle.Link)
          .setURL('https://rpbey.fr'),
        new ButtonBuilder()
          .setLabel('Discord')
          .setStyle(ButtonStyle.Link)
          .setURL(RPB.Discord),
      );

      await message.reply({ embeds: [embed], components: [row] });
    }
  }
}
