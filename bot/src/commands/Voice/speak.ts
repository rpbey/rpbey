import { Command } from '@sapphire/framework';
import { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import { synthesizeSpeech } from '../../lib/transcriber.js';
import fs from 'node:fs';

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
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);
    const guildId = interaction.guildId;

    if (!guildId) {
      return interaction.reply({ content: 'Cette commande ne fonctionne que sur un serveur.', ephemeral: true });
    }

    const connection = getVoiceConnection(guildId);

    if (!connection) {
      return interaction.reply({ content: 'Je ne suis pas connecté à un salon vocal. Utilisez d\'abord /join.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const filePath = await synthesizeSpeech(message);
      
      const player = createAudioPlayer();
      const resource = createAudioResource(filePath);
      
      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Idle, () => {
        player.stop();
        // Clean up file
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
            console.error('Failed to cleanup TTS file', e);
        }
      });

      return interaction.editReply(`🗣️ **Dit :** "${message}"`);

    } catch (error) {
      console.error(error);
      return interaction.editReply('❌ Erreur lors de la synthèse vocale.');
    }
  }
}
