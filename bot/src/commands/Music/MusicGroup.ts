import {
  ApplicationCommandOptionType,
  type AutocompleteInteraction,
  type CommandInteraction,
  EmbedBuilder,
  type GuildMember,
} from 'discord.js';
import { QueryType, useMainPlayer } from 'discord-player';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';

import { Colors } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';

@Discord()
@SlashGroup({ name: 'musique', description: 'Commandes de lecture musicale' })
@SlashGroup('musique')
export class MusicGroup {
  @Slash({
    name: 'jouer',
    description: 'Jouer une musique depuis YouTube, Spotify ou SoundCloud',
  })
  async play(
    @SlashOption({
      name: 'recherche',
      description: 'Nom ou URL de la musique (YouTube privilégié)',
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: async (interaction: AutocompleteInteraction) => {
        const player = useMainPlayer();
        const focusedValue = interaction.options.getFocused();
        if (!focusedValue) return interaction.respond([]);
        try {
          const results = await player.search(focusedValue, {
            searchEngine: QueryType.YOUTUBE_SEARCH,
          });
          return interaction.respond(
            results.tracks.slice(0, 10).map((t) => ({
              name: `${t.title} (${t.duration})`.substring(0, 100),
              value: t.url,
            })),
          );
        } catch {
          return interaction.respond([]);
        }
      },
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    const member = interaction.member as GuildMember;
    if (!member.voice.channel)
      return interaction.reply({
        content: '❌ Tu dois être dans un salon vocal !',
        ephemeral: true,
      });

    await interaction.deferReply();
    const player = useMainPlayer();

    try {
      const { track } = await player.play(member.voice.channel as any, query, {
        nodeOptions: {
          metadata: interaction,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 30000,
          leaveOnEnd: false,
          selfDeaf: true,
        },
      });

      const embed = new EmbedBuilder()
        .setTitle('🎶 Lecture RPB')
        .setDescription(`Lecture de : **[${track.title}](${track.url})**`)
        .setThumbnail(track.thumbnail)
        .addFields(
          { name: '👤 Chaîne', value: track.author, inline: true },
          { name: '⏱️ Durée', value: track.duration, inline: true },
        )
        .setColor(Colors.Primary)
        .setFooter({ text: `Demandé par ${interaction.user.username}` });

      return interaction.editReply({ embeds: [embed] });
    } catch (e) {
      logger.error('[Music] Play error:', e);
      return interaction.editReply(
        `❌ Impossible de lire cette piste. Vérifie l'URL ou réessaie plus tard.`,
      );
    }
  }

  @Slash({ name: 'stop', description: 'Arrêter la musique et vider la file' })
  async stop(interaction: CommandInteraction) {
    const player = useMainPlayer();
    const queue = player.nodes.get(interaction.guildId!);
    if (!queue)
      return interaction.reply({
        content: '❌ Aucune musique en cours.',
        ephemeral: true,
      });

    queue.delete();
    return interaction.reply('🛑 La musique a été arrêtée.');
  }

  @Slash({ name: 'passer', description: 'Passer à la musique suivante' })
  async skip(interaction: CommandInteraction) {
    const player = useMainPlayer();
    const queue = player.nodes.get(interaction.guildId!);
    if (!queue || !queue.isPlaying())
      return interaction.reply({
        content: '❌ Aucune musique en cours.',
        ephemeral: true,
      });

    queue.node.skip();
    return interaction.reply('⏭️ Passage à la musique suivante.');
  }

  @Slash({ name: 'file', description: "Afficher la file d'attente actuelle" })
  async queue(interaction: CommandInteraction) {
    const player = useMainPlayer();
    const queue = player.nodes.get(interaction.guildId!);
    if (!queue)
      return interaction.reply({
        content: '❌ La file est vide.',
        ephemeral: true,
      });

    const tracks = queue.tracks.toArray().slice(0, 10);
    const embed = new EmbedBuilder()
      .setTitle("📋 File d'attente RPB")
      .setDescription(
        tracks
          .map((t, i) => `**${i + 1}.** ${t.title} (${t.duration})`)
          .join('\n') || 'Aucune musique à venir.',
      )
      .setColor(Colors.Info);

    return interaction.reply({ embeds: [embed] });
  }
}
