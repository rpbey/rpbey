import { Node } from '@discordx/music';
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  type GuildMember,
} from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { injectable, singleton } from 'tsyringe';

import { bot } from '../../lib/bot.js';
import { logger } from '../../lib/logger.js';

@singleton()
export class MusicNode extends Node {
  constructor() {
    super(bot as any);
  }
}

@Discord()
@SlashGroup({
  name: 'radio',
  description: 'Système audio alternatif via DiscordX Music',
})
@SlashGroup('radio')
@injectable()
export class RadioGroup {
  constructor(private node: MusicNode) {}

  @Slash({
    name: 'lancer',
    description: 'Jouer un flux audio via DiscordX Music',
  })
  async play(
    @SlashOption({
      name: 'url',
      description: "L'URL du flux audio (YouTube, Stream, etc.)",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    url: string,
    interaction: CommandInteraction,
  ) {
    const member = interaction.member as GuildMember;
    if (!member || !member.voice.channel) {
      return interaction.reply({
        content: '❌ Tu dois être dans un salon vocal.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      this.node.join({
        guildId: interaction.guildId!,
        channelId: member.voice.channel.id,
      });

      this.node.play({
        guildId: interaction.guildId!,
        payload: { query: url },
      });

      return interaction.editReply(
        `🎵 Lecture lancée via DiscordX Music : ${url}`,
      );
    } catch (error) {
      logger.error('[MusicX] Play error:', error);
      return interaction.editReply('❌ Impossible de lire ce flux.');
    }
  }

  @Slash({ name: 'quitter', description: 'Déconnecter le bot du salon vocal' })
  async leave(interaction: CommandInteraction) {
    this.node.disconnect({ guildId: interaction.guildId! });
    return interaction.reply('👋 Déconnexion réussie.');
  }
}
