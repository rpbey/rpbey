import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  StreamType,
} from '@discordjs/voice';
import { Command } from '@sapphire/framework';
import { synthesizeSpeechStream } from '../../lib/transcriber.js';

export class SpeakCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'parle',
      description: 'Fait parler le bot dans le salon vocal',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('Le message à lire')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const message = interaction.options.getString('message', true);
    const guildId = interaction.guildId;

    if (!guildId) {
      return interaction.reply({
        content: 'Cette commande ne fonctionne que sur un serveur.',
        ephemeral: true,
      });
    }

    const connection = getVoiceConnection(guildId);

    if (!connection) {
      return interaction.reply({
        content:
          "Je ne suis pas connecté à un salon vocal. Utilisez d'abord /rejoindre.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      console.log(`[Speak] Requesting TTS for: "${message}"`);
      // Use streaming for instant playback
      const audioStream = synthesizeSpeechStream(message);

      const player = createAudioPlayer();
      // Use Arbitrary to force FFmpeg to detect format (MP3) and convert to Opus
      const resource = createAudioResource(audioStream, {
        inputType: StreamType.Arbitrary,
      });

      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Playing, () => {
        console.log('[Speak] Player started playing');
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log('[Speak] Player finished');
        player.stop();
      });

      player.on('error', (error) => {
        console.error('[Speak] Player error:', error);
      });

      return interaction.editReply(`🗣️ **Dit :** "${message}"`);
    } catch (error) {
      console.error(error);
      return interaction.editReply('❌ Erreur lors de la synthèse vocale.');
    }
  }
}
