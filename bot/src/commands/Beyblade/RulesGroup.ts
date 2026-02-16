import { type CommandInteraction, EmbedBuilder } from 'discord.js';
import { Discord, Slash, SlashGroup } from 'discordx';

import { Colors } from '../../lib/constants.js';

@Discord()
@SlashGroup({ name: 'regles', description: 'Règles officielles de Beyblade X' })
@SlashGroup('regles')
export class RulesGroup {
  @Slash({
    name: 'points',
    description: 'Consulter le barème des points en match',
  })
  async points(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🔢 Comptage des Points - Beyblade X')
      .setDescription(
        "Voici comment sont attribués les points lors d'un combat officiel.",
      )
      .setColor(Colors.Beyblade)
      .addFields(
        {
          name: '🌀 Xtreme Finish (3 pts)',
          value: 'Envoyer la toupie adverse dans la zone Xtreme.',
        },
        {
          name: '💥 Burst Finish (2 pts)',
          value: 'La toupie adverse explose en morceaux.',
        },
        {
          name: '🕳️ Over Finish (2 pts)',
          value: 'Envoyer la toupie adverse dans une poche (Over Zone).',
        },
        {
          name: '⏱️ Spin Finish (1 pt)',
          value: "La toupie adverse s'arrête de tourner en premier.",
        },
      )
      .setFooter({ text: 'Règles officielles WBO / RPB' });

    return interaction.reply({ embeds: [embed] });
  }

  @Slash({
    name: 'deck',
    description: "Règles de construction d'un Deck (3on3)",
  })
  async deck(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🗃️ Règles du Deck (3on3 / 5on5)')
      .setDescription('Les règles de base pour construire un deck compétitif.')
      .setColor(Colors.Beyblade)
      .addFields(
        {
          name: '🚫 Unicité des pièces',
          value:
            'Un deck ne peut pas contenir deux fois la même pièce (Lame, Ratchet ou Bit), même en couleur différente.',
        },
        {
          name: '⚖️ Poids & Équilibre',
          value:
            'Chaque combinaison doit être validée avant le début du tournoi.',
        },
        {
          name: '🛡️ Pièces bannies',
          value:
            'Le Bit **Metal Needle (MN)** est actuellement banni car il endommage les stadiums.',
        },
      )
      .setFooter({
        text: 'Assurez-vous de respecter ces règles sous peine de disqualification.',
      });

    return interaction.reply({ embeds: [embed] });
  }

  @Slash({ name: 'formats', description: 'Les différents formats de tournoi' })
  async formats(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🏆 Formats de Match RPB')
      .setDescription(
        'Les différents types de rencontres que vous pouvez disputer.',
      )
      .setColor(Colors.Beyblade)
      .addFields(
        {
          name: '🥇 Match standard (4 points)',
          value: 'Le premier blader à atteindre 4 points remporte le match.',
        },
        {
          name: '⚔️ Format 3on3',
          value:
            "Utilisation d'un deck de 3 toupies dans un ordre fixe ou choisi selon le type de tournoi.",
        },
        {
          name: '🔥 Finale (7 points)',
          value:
            'Utilisé généralement pour les grandes finales de tournois majeurs.',
        },
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
}
