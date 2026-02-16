import { Readable } from 'node:stream';
import {
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
} from '@discordjs/voice';
import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  type GuildMember,
} from 'discord.js';
import { Discord, Slash, SlashChoice, SlashOption } from 'discordx';
import { Communicate } from 'edge-tts-universal';
import { logger } from '../../lib/logger.js';

@Discord()
export class VoiceInteraction {
  @Slash({
    name: 'parle',
    description: 'Transformer un texte en parole (Edge TTS Haute Qualité)',
  })
  async speak(
    @SlashOption({
      name: 'texte',
      description: 'Le message à dire',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    text: string,

    @SlashOption({
      name: 'volume',
      description: 'Volume (0.1 à 1.0)',
      required: false,
      type: ApplicationCommandOptionType.Number,
    })
    volume: number | undefined,

    @SlashChoice({
      name: 'Vivienne (Féminin)',
      value: 'fr-FR-VivienneMultilingualNeural',
    })
    @SlashChoice({ name: 'Remy (Masculin)', value: 'fr-FR-RemyNeural' })
    @SlashChoice({ name: 'Eloise (Féminin)', value: 'fr-FR-EloiseNeural' })
    @SlashChoice({ name: 'Denise (Féminin)', value: 'fr-FR-DeniseNeural' })
    @SlashChoice({ name: 'Henri (Masculin)', value: 'fr-FR-HenriNeural' })
    @SlashOption({
      name: 'voix',
      description: 'La voix à utiliser',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    voice: string | undefined,

    interaction: CommandInteraction,
  ) {
    // FORCE LOG IMMEDIATELY
    console.log(
      `[DEBUG-TTS] Method called with: text=${text}, volume=${volume}, voice=${voice}`,
    );

    const actualVolume = volume ?? 1.0;
    const actualVoice = voice ?? 'fr-FR-VivienneMultilingualNeural';

    if (!interaction) {
      logger.error('[TTS] INTERACTION IS UNDEFINED!');
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member?.voice?.channel) {
      return interaction.reply({
        content: '❌ Tu dois être en vocal !',
        ephemeral: true,
      });
    }

    if (!text || text.length === 0) {
      return interaction.reply({
        content: '❌ Le texte est vide.',
        ephemeral: true,
      });
    }

    if (text.length > 500) {
      return interaction.reply({
        content: '❌ Texte trop long (max 500 caractères).',
        ephemeral: true,
      });
    }

    try {
      await interaction.deferReply();

      const connection = joinVoiceChannel({
        channelId: member.voice.channel.id,
        guildId: member.guild.id,
        adapterCreator: member.guild.voiceAdapterCreator as any,
      });

      const communicate = new Communicate(text, { voice: actualVoice });
      const audioStream = new Readable({ read() {} });

      // Start streaming audio
      void (async () => {
        try {
          for await (const chunk of communicate.stream()) {
            if (chunk.type === 'audio' && chunk.data) {
              audioStream.push(chunk.data);
            }
          }
        } catch (e) {
          logger.error('[TTS] Stream error:', e);
        } finally {
          audioStream.push(null);
        }
      })();

      const player = createAudioPlayer();
      const resource = createAudioResource(audioStream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });

      if (resource.volume) {
        resource.volume.setVolume(Math.max(0.1, Math.min(actualVolume, 1.0)));
      }

      player.play(resource);
      connection.subscribe(player);

      const voiceName =
        actualVoice.split('-')[2]?.replace('Neural', '') || 'Vivienne';
      return interaction.editReply(`🗣️ **[${voiceName}]** : ${text}`);
    } catch (e) {
      logger.error('[TTS] Command error:', e);
      if (interaction.deferred) {
        return interaction.editReply('❌ Erreur lors de la synthèse vocale.');
      } else {
        return interaction.reply({
          content: '❌ Erreur lors de la synthèse vocale.',
          ephemeral: true,
        });
      }
    }
  }

  @Slash({ name: 'quitter', description: 'Déconnecter le bot du vocal' })
  async leave(interaction: CommandInteraction) {
    const connection = getVoiceConnection(interaction.guildId!);
    if (connection) {
      connection.destroy();
      return interaction.reply('👋 Déconnecté.');
    }
    return interaction.reply({
      content: '❌ Je ne suis pas en vocal.',
      ephemeral: true,
    });
  }
}
