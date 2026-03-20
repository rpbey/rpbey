import { type CommandInteraction, EmbedBuilder } from 'discord.js';
import { Discord, Slash } from 'discordx';
import { injectable } from 'tsyringe';

import { Colors, RPB } from '../../lib/constants.js';

const COMMAND_CATEGORIES = [
  {
    name: '🌀 Beyblade',
    commands: [
      { name: '/beys', desc: 'Parcourir la bibliothèque Beyblade X' },
      { name: '/deck', desc: 'Gérer vos decks (créer, modifier, supprimer)' },
      {
        name: '/classement profil',
        desc: 'Voir votre profil de classement RPB',
      },
      { name: '/classement top', desc: 'Top 10 du classement' },
      { name: '/meta', desc: 'Analyse méta (top, catégorie, combo, pièce)' },
      { name: '/wiki', desc: 'Règles et formats officiels' },
      { name: '/produit', desc: 'Rechercher des produits Beyblade X' },
    ],
  },
  {
    name: '🏆 Tournois',
    commands: [
      { name: '/inscription rejoindre', desc: "S'inscrire à un tournoi" },
      { name: '/inscription quitter', desc: 'Se désinscrire' },
      {
        name: '/inscription statut',
        desc: "Vérifier son statut d'inscription",
      },
      { name: '/challonge lier', desc: 'Lier votre compte Challonge' },
    ],
  },
  {
    name: '🎮 Jeux & Fun',
    commands: [
      { name: '/jeu combat', desc: 'Lancer un combat contre un blader' },
      { name: '/jeu aleatoire', desc: 'Générer un combo aléatoire' },
      { name: '/jeu fun-wanted', desc: 'Affiche WANTED' },
      { name: '/jeu fun-agrandir', desc: 'Agrandir un émoji' },
    ],
  },
  {
    name: '💰 Économie',
    commands: [
      { name: '/economie quotidien', desc: 'Récompense journalière' },
      { name: '/economie solde', desc: 'Consulter votre solde' },
      { name: '/economie parier', desc: 'Quitte ou double' },
      { name: '/economie transfert', desc: 'Transférer des pièces' },
      { name: '/economie classement', desc: 'Top des plus riches' },
    ],
  },
  {
    name: '🔧 Utilitaires',
    commands: [
      { name: '/utilitaire membre', desc: "Infos détaillées d'un membre" },
      { name: '/utilitaire avatar', desc: "Voir l'avatar en grand" },
      { name: '/utilitaire sondage', desc: 'Créer un sondage' },
      { name: '/utilitaire suggestion', desc: 'Soumettre une suggestion' },
    ],
  },
  {
    name: 'ℹ️ Informations',
    commands: [
      { name: '/info bot', desc: 'Statistiques du bot' },
      { name: '/info serveur', desc: 'Infos du serveur' },
      { name: '/info staff', desc: "L'équipe RPB" },
      { name: '/info partenaire', desc: 'Nos partenaires' },
      { name: '/info promo', desc: 'Codes promos actifs' },
      { name: '/ping', desc: 'Latence du bot' },
    ],
  },
  {
    name: '🎁 Événements',
    commands: [
      { name: '/tirage créer', desc: 'Lancer un giveaway' },
      { name: '/tirage fin', desc: 'Terminer un giveaway' },
      { name: '/tirage liste', desc: 'Voir les giveaways actifs' },
    ],
  },
];

@Discord()
@injectable()
export class HelpCommand {
  @Slash({
    name: 'aide',
    description: 'Affiche la liste de toutes les commandes disponibles',
  })
  async help(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Commandes du RPB Bot')
      .setDescription(
        `Bienvenue sur le bot de la **${RPB.FullName}** !\nVoici toutes les commandes disponibles :`,
      )
      .setColor(Colors.Primary)
      .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }));

    for (const category of COMMAND_CATEGORIES) {
      embed.addFields({
        name: category.name,
        value: category.commands
          .map((c) => `\`${c.name}\` — ${c.desc}`)
          .join('\n'),
      });
    }

    embed
      .setFooter({
        text: `${RPB.FullName} | Utilisez /aide pour revoir ce message`,
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
