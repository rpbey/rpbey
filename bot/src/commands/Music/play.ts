import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';
import { useMainPlayer } from 'discord-player';

@ApplyOptions<Command.Options>({
  description: 'Joue de la musique depuis YouTube',
  preconditions: ['GuildOnly'],
})
export class PlayCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('play')
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('recherche')
            .setDescription('Lien ou nom de la vidéo YouTube')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const query = interaction.options.getString('recherche', true);
    const member = interaction.member as GuildMember;
    const channel = member.voice.channel;

    if (!channel) {
      return interaction.reply({
        content: '❌ Vous devez être connecté à un salon vocal !',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const player = useMainPlayer();
      if (!player) {
        return interaction.editReply(
          "❌ Le lecteur musical n'est pas initialisé.",
        );
      }

      this.container.logger.info(`[Music] Searching for: ${query}`);

      // Refine query if not a URL
      let searchResult: any;
      try {
        new URL(query);
        searchResult = await player.search(query, {
          requestedBy: interaction.user as any,
        });
      } catch {
        searchResult = await player.search(`ytsearch:${query}`, {
          requestedBy: interaction.user as any,
        });
      }

      if (!searchResult || !searchResult.tracks.length) {
        return interaction.editReply(
          `❌ Aucun résultat trouvé pour "${query}"`,
        );
      }

      const { track } = await player.play(channel as any, searchResult, {
        nodeOptions: {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 300000,
          leaveOnEnd: false,
          leaveOnEndCooldown: 300000,
          selfDeaf: true,
        },
      });

      this.container.logger.info(`[Music] Playing/Enqueuing: ${track.title}`);

      return interaction.editReply(
        `🎵 **${player.nodes.get(interaction.guildId!)?.isPlaying() ? "Ajouté à la file d'attente" : 'Lecture de'} :** ${track.title}\n🔗 ${track.url}`,
      );
    } catch (error) {
      console.error('[Music] Play Error:', error);
      return interaction.editReply(
        '❌ Erreur : Impossible de jouer cette musique.',
      );
    }
  }
}
