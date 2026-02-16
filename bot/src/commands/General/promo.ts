import { type CommandInteraction, EmbedBuilder } from 'discord.js';
import { Discord, Slash } from 'discordx';

import { Colors } from '../../lib/constants.js';

@Discord()
export class PromoCommand {
  @Slash({
    name: 'promo',
    description: 'Obtenir le code promo du sponsor officiel FeedMy',
  })
  async promo(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🎁 Sponsor Officiel : FeedMy x RPB')
      .setColor(Colors.Primary)
      .setDescription(
        `
**La RPB est fière de vous présenter son sponsor officiel : FeedMy !**
Le spécialiste de l'importation japonaise pour vos Beyblade X.

💸 **Code Promo :** 
Profitez de **-10%** sur tout le site !

📦 **Livraison :**
Offerte dès **100€** d'achats.

🏆 **Soutien :**
En commandant chez FeedMy, vous soutenez directement la RPB et nous permettez de vous proposer des lots et tournois de qualité !
      `,
      )
      .addFields({
        name: '🔗 Accéder à la boutique',
        value:
          '[Cliquez ici pour profiter du code promo !](https://feedmy.fr/discount/RPB10)',
      })
      .setImage(
        'https://media.discordapp.net/attachments/1323816859337752626/1460340266518052887/IMG_2856.png?ex=69668f5b&is=69653ddb&hm=83ebfd2a353f5a265c8e3fc5603ea2145e8a32cac3b23c722008938cefcc17ed&=&format=webp&quality=lossless&width=1039&height=1469',
      )
      .setFooter({
        text: 'République Populaire du Beyblade',
        iconURL: 'https://rpbey.fr/logo.png',
      });

    return interaction.reply({ embeds: [embed] });
  }
}
