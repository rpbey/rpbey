import { type CommandInteraction, EmbedBuilder } from 'discord.js';
import { Discord, Slash } from 'discordx';

import { Colors } from '../../lib/constants.js';

@Discord()
export class MetaCommand {
  @Slash({
    name: 'meta',
    description: 'Conseils sur la méta actuelle de Beyblade X',
  })
  async meta(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🌪️ Guide de la Méta - Beyblade X')
      .setDescription(
        'Voici un aperçu des forces et faiblesses des différents types.',
      )
      .setColor(Colors.Beyblade)
      .addFields(
        {
          name: '🔴 ATTAQUE',
          value:
            'Cherche le contact immédiat pour un Xtreme Finish. Faible endurance.',
          inline: true,
        },
        {
          name: '🔵 DÉFENSE',
          value:
            "Occupe le centre et résiste aux impacts. Solide face à l'attaque.",
          inline: true,
        },
        {
          name: '🟢 ENDURANCE',
          value:
            'Vise la victoire au Spin Finish. Vulnérable aux gros impacts.',
          inline: true,
        },
        {
          name: '🟡 ÉQUILIBRE',
          value:
            'Polyvalent, peut changer de comportement selon le Ratchet/Bit.',
          inline: true,
        },
        {
          name: '💡 Astuce',
          value:
            'Actuellement, le combo **Rod / Ball** est extrêmement populaire pour son endurance massive.',
        },
      )
      .setFooter({ text: 'Consulte /regles deck pour les restrictions.' });

    return interaction.reply({ embeds: [embed] });
  }
}
