/**
 * Fix episode titles for the original Beyblade trilogy (Bakuten, V-Force, G-Revolution)
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface TitleFix {
  title: string;
  titleFr: string | null;
}

// ══════════════ BAKUTEN SHOOT BEYBLADE ══════════════
const BAKUTEN: Record<number, TitleFix> = {
  1: { title: 'The Blade Raider', titleFr: 'Le voleur de toupies' },
  2: { title: 'Day of the Dragoon', titleFr: 'Le jour du dragon' },
  3: { title: 'Take It To The Max!', titleFr: 'Le maximum' },
  4: { title: 'The Qualifier Begins', titleFr: 'Les qualifications commencent' },
  5: { title: 'Draciel of Approval', titleFr: 'Draciel' },
  6: { title: 'Dragoon Storm', titleFr: "L'orage de Dragoon" },
  7: { title: 'Thirteen Candles', titleFr: 'Treize bougies' },
  8: { title: "Bladin' in the Streets", titleFr: 'Duels de rues' },
  9: { title: 'Showdown in Hong Kong', titleFr: 'Rencontre à Hong-Kong' },
  10: { title: 'Battle in the Sky', titleFr: 'Duel en plein ciel' },
  11: { title: 'Bye Bye Bit Beast', titleFr: 'Le tricheur' },
  12: { title: 'Adios Bladebreakers', titleFr: 'À la recherche du spectre' },
  13: { title: 'Crouching Lion, Hidden Tiger', titleFr: 'Le tigre caché' },
  14: { title: 'The Race is On!', titleFr: 'Passons aux choses sérieuses !' },
  15: { title: 'Going for the Gold', titleFr: "Pour l'or" },
  16: { title: 'My Enemy, My Friend', titleFr: 'Ami ou ennemi' },
  17: { title: 'A Score to Settle', titleFr: 'Jeu décisif' },
  18: { title: 'A Star is Born!', titleFr: "La naissance d'une star" },
  19: { title: 'Under the Microscope', titleFr: 'Sous le microscope' },
  20: { title: "It's all Relative", titleFr: 'Tout est relatif' },
  21: { title: 'Practice Makes Perfect', titleFr: 'Atteindre la perfection' },
  22: { title: 'Blading with the Stars', titleFr: 'Duel dans les étoiles' },
  23: { title: 'Showdown in Vegas', titleFr: 'Révélation à Las Vegas' },
  24: { title: 'Viva Las Vegas', titleFr: 'Vive Las Vegas' },
  25: { title: 'My Way or the Highway', titleFr: 'Autoroute vers la gloire' },
  26: { title: 'Catch a Shooting All-Star', titleFr: 'Affronter un All Starz' },
  27: { title: 'The Battle Of America', titleFr: 'Le grand tournoi américain' },
  28: { title: 'Bottom of the Ninth', titleFr: 'La finale' },
  29: { title: 'Play it Again, Dizzi', titleFr: 'Mémoires vives' },
  30: { title: 'Cruising For A Bruising', titleFr: 'Rencontre en mer' },
  31: { title: 'London Calling', titleFr: "L'appel de Londres" },
  32: { title: 'Darkness at the End of the Tunnel...', titleFr: 'Le tunnel hanté' },
  33: { title: 'Last Tangle in Paris', titleFr: 'Les mystères de Paris' },
  34: { title: 'Art Attack', titleFr: 'Une visite à Paris' },
  35: { title: 'When in Rome... Beyblade!', titleFr: 'Duel à Rome' },
  36: { title: 'Déjà vu all Over Again', titleFr: 'Déjà vu' },
  37: { title: 'A Knight to Remember!', titleFr: 'Échec et mat' },
  38: { title: 'Olympia Challenge', titleFr: 'Défi à Olympie' },
  39: { title: 'A Majestic Battle... a Majestic Victory?', titleFr: "Un travail d'équipe" },
  40: { title: 'Hot Battle In A Cold Town', titleFr: 'Ça chauffe au pays du froid' },
  41: { title: 'Out Of The Past', titleFr: 'Les ombres du passé' },
  42: { title: 'Drawn To The Darkness', titleFr: 'Plongeon dans les ténèbres' },
  43: { title: 'Live And Let Kai!', titleFr: 'Trahison' },
  44: { title: 'Losing Kai', titleFr: 'Adieu Kai !' },
  45: { title: 'Breaking The Ice', titleFr: 'Briser la glace' },
  46: { title: 'First Strike', titleFr: 'Le premier raid' },
  47: { title: 'A Lesson For Tyson', titleFr: 'Une leçon pour Tyson' },
  48: { title: 'Victory In Defeat', titleFr: 'La victoire dans la défaite' },
  49: { title: 'A Wicked Wind Blows', titleFr: 'Qui sème le vent...' },
  50: { title: 'New And Cyber-Improved...', titleFr: 'Le cyber-beyblader' },
  51: { title: 'Final Showdown', titleFr: "Feu d'artifice final" },
};

// ══════════════ BEYBLADE V-FORCE ══════════════
const VFORCE: Record<number, TitleFix> = {
  1: { title: 'Shot Down in Flames', titleFr: 'Plus dure sera la chute' },
  2: { title: 'The Search for Mr.X', titleFr: 'À la recherche de Mister X' },
  3: { title: 'Unseen and Unleashed', titleFr: "L'ennemi invisible" },
  4: { title: 'Searching For Dragoon', titleFr: 'À la recherche de Dragoon' },
  5: { title: "Guess Who's Back in Town?", titleFr: 'Devine qui vient jouer ce soir' },
  6: { title: 'The Magtram Threat', titleFr: 'La menace de Magtram' },
  7: { title: 'The Reunion Begins', titleFr: 'Un pour tous, tous pour un' },
  8: { title: 'Return of The Bladebreakers!', titleFr: 'Le retour des Bladebreakers' },
  9: { title: 'La Isla Bey-Nita', titleFr: "L'île du docteur B" },
  10: { title: 'The Island of No Return', titleFr: "L'île sans retour" },
  11: { title: 'The Evil Island of Dr. B', titleFr: 'Dernier combat' },
  12: { title: 'Bring Me Dranzer', titleFr: 'Je veux Dranzer !' },
  13: { title: 'Testing One, Two, Three', titleFr: "À l'essai" },
  14: { title: 'Gideon Raises Gerry', titleFr: "Création d'un spectre" },
  15: { title: 'Show Me The Bit Beasts!', titleFr: "L'obsession d'Hilary" },
  16: { title: "Psykick's New Recruit", titleFr: 'Une recrue de choix' },
  17: { title: "Hilary's Bey-B-Cue", titleFr: "Le barbecue d'Hilary" },
  18: { title: "When Friend's Become Foes", titleFr: 'Ennemis intimes' },
  19: { title: 'Their Own Private Battles', titleFr: 'Victoire à tout prix ?' },
  20: { title: 'The Power Half Hour', titleFr: 'Une bonne résolution' },
  21: { title: 'The Battle Tower Showdown', titleFr: 'La tour de combat' },
  22: { title: 'Max Takes One For The Team', titleFr: 'Max vainqueur ?' },
  23: { title: 'The Bigger The Cyber Driger... The Harder It Falls...', titleFr: 'Plus grand sera Cyber Driger... Plus dure sera la chute' },
  24: { title: 'Ghost in The Machine', titleFr: 'Le fantôme dans le brouillard' },
  25: { title: 'Raising Kane', titleFr: 'Maître ou esclave ?' },
  26: { title: 'Cyber Dragoon Takes Control!', titleFr: 'Le méga cyber' },
  27: { title: 'Building the Perfect Bit Beast', titleFr: 'La fin du cauchemar' },
  28: { title: 'Hot Rock', titleFr: 'Pas de répit pour les héros' },
  29: { title: 'Bad Seed in The Big Apple', titleFr: 'Mauvaise graine à New York' },
  30: { title: 'Get a Piece of The Rock!', titleFr: 'Le secret du docteur Zagart' },
  31: { title: 'Attack of The Rock Bit Beast', titleFr: 'Nouvelle confrontation' },
  32: { title: 'Lots Of Questions... Few Answers', titleFr: 'Beaucoup de questions, peu de réponses' },
  33: { title: 'Rock Bottom!', titleFr: 'Gardiens ou vauriens' },
  34: { title: 'Itzy Bey-Itzy Spider', titleFr: "La toile d'araignée" },
  35: { title: 'See No Bit-Beast, Hear No Bit-Beast', titleFr: 'La tornade meurtrière' },
  36: { title: 'Friends and Enemies', titleFr: 'Max et Miriam' },
  37: { title: 'Beybattle at the Bit Beast Corral', titleFr: 'Duel au soleil' },
  38: { title: 'The Fate of The Spark Battle', titleFr: "L'issue de la bataille d'étincelles" },
  39: { title: 'The Bit Beast Bond', titleFr: "Pour l'honneur" },
  40: { title: 'Squeeze Play', titleFr: 'Zeo, pas zéro' },
  41: { title: "Who's Your Daddy?", titleFr: 'Qui est ton père ?' },
  42: { title: 'Fortunes Dear and Dire', titleFr: 'Les chasseurs de pièces détachées' },
  43: { title: "Kai's Royal Flush", titleFr: 'Kai pique sa crise' },
  44: { title: 'The Calm Before The Storm', titleFr: 'Le calme avant la tempête' },
  45: { title: 'Zeo VS Ozuma', titleFr: 'Zeo contre Ozuma' },
  46: { title: 'Black & White Evil Powers', titleFr: 'Royale révolution' },
  47: { title: 'Deceit From Above', titleFr: 'Déception en haut lieu' },
  48: { title: 'Phoenix Falling', titleFr: 'La chute du phœnix' },
  49: { title: 'The Enemy Within', titleFr: 'Le déserteur' },
  50: { title: 'Clash of the Tyson', titleFr: "Le plus grand match de l'histoire du Beyblade" },
  51: { title: 'Destiny of The Final Battle', titleFr: "L'heure de vérité" },
};

// ══════════════ BEYBLADE G-REVOLUTION ══════════════
const GREVOLUTION: Record<number, TitleFix> = {
  1: { title: 'New Kid in Town', titleFr: 'Un petit caïd arrive en ville' },
  2: { title: 'A Team Divided', titleFr: 'Une équipe divisée' },
  3: { title: 'Invitation to Battle', titleFr: 'Tenue de combat exigée' },
  4: { title: 'We Were Once Bladebreakers...', titleFr: 'Nous étions les Bladebreakers' },
  5: { title: 'A League of His Own', titleFr: 'La feinte du caméléon' },
  6: { title: "You're The Man, Kai!", titleFr: 'Le retour du frère' },
  7: { title: 'Take Your Best Shot!', titleFr: 'Le meilleur de soi-même' },
  8: { title: 'Roughing It', titleFr: 'A la dure' },
  9: { title: 'Swiped On The Streets', titleFr: 'Pépins dans la grosse pomme' },
  10: { title: "It's a Battle Royale...!", titleFr: 'Une bataille royale' },
  11: { title: 'The Blame Game', titleFr: "L'impossible défaite" },
  12: { title: 'When in Rome... Let it Rip!', titleFr: 'Arène romaine' },
  13: { title: "Kenny's Big Battle", titleFr: 'La grande bataille de Kenny' },
  14: { title: 'Picking Up The Pieces', titleFr: 'La leçon de Kenny' },
  15: { title: 'Sleepless in Madrid', titleFr: 'Insomnie à Madrid' },
  16: { title: 'Fire and Water', titleFr: "L'eau et le feu" },
  17: { title: 'Same Old Dirty Tricks...', titleFr: 'Mauvais tours' },
  18: { title: 'Beyblade Like an Egyptian', titleFr: 'Escale en Egypte' },
  19: { title: 'One For All...Free For All', titleFr: 'Un pour tous, liberté pour tous' },
  20: { title: 'Burdens of a Champion', titleFr: 'Un champion sous pression' },
  21: { title: 'Under Pressure', titleFr: 'Seul au sommet' },
  22: { title: 'Sibling Rivalry', titleFr: 'Rivalité fraternelle' },
  23: { title: 'Ray and Kai: The Ultimate Face Off!', titleFr: 'Ultime face à face entre Kay et Ray' },
  24: { title: 'Down Under Thunder', titleFr: 'Un héros est né' },
  25: { title: 'Max Attacks!', titleFr: 'Max attaque !' },
  26: { title: 'Familiar Faces', titleFr: 'Du neuf avec du vieux' },
  27: { title: 'What a Blast!', titleFr: 'En finale !' },
  28: { title: 'Changing Gears', titleFr: "Changement d'engrenage" },
  29: { title: 'And Then There Were Two', titleFr: 'Les deux derniers' },
  30: { title: 'Let the Games Begin...Again!', titleFr: 'Ultime combat' },
  31: { title: 'Runaway Daichi', titleFr: "Daishi s'en va" },
  32: { title: 'Beyblade Idol', titleFr: 'Ming Ming' },
  33: { title: 'Out of Their League', titleFr: 'La ligue' },
  34: { title: 'The Mysterious Mystel', titleFr: 'Mystel, le beyblader mystérieux' },
  35: { title: 'Pros and Ex-cons', titleFr: 'Un compte à régler' },
  36: { title: 'Boris, The Blade Stops Here!', titleFr: 'Echec à la ligne' },
  37: { title: 'The BEGA Challenge', titleFr: 'Le défi de Bega' },
  38: { title: 'BEGA on the Rise', titleFr: 'La montée en puissance de Bega' },
  39: { title: 'Rebel Alliance', titleFr: 'Résistance' },
  40: { title: 'Back to Basics', titleFr: 'Rappel des bases' },
  41: { title: 'And Justice-Five For All', titleFr: 'Le choc des titans' },
  42: { title: 'When You Wish Upon A Star', titleFr: 'Confrontation !' },
  43: { title: 'Sing Ming Ming Sing!', titleFr: 'Chante, ming ming !' },
  44: { title: 'Refuse to Lose', titleFr: 'La rage de vaincre' },
  45: { title: 'Max to the Max', titleFr: 'Maxi Max !' },
  46: { title: 'The Return of Kai', titleFr: 'Le retour de Kai' },
  47: { title: "Now You're Making Me Mad", titleFr: 'La revanche de Kai' },
  48: { title: 'The Beyblading Spirit', titleFr: "L'esprit du Beyblade" },
  49: { title: 'Principles of Victory', titleFr: 'Les principes de la victoire' },
  50: { title: 'Welcome to my Nightmare!', titleFr: 'Le cauchemar' },
  51: { title: "Brooklyn's Back", titleFr: 'Un autre monde' },
  52: { title: 'Beybattle for the Ages', titleFr: "Bataille pour l'éternité" },
};

const SERIES_DATA = [
  { slug: 'bakuten-shoot-beyblade', data: BAKUTEN },
  { slug: 'beyblade-v-force', data: VFORCE },
  { slug: 'beyblade-g-revolution', data: GREVOLUTION },
];

async function main() {
  console.log('🎬 Fixing Bakuten trilogy episode titles...\n');

  let totalUpdated = 0;

  for (const { slug, data } of SERIES_DATA) {
    const series = await prisma.animeSeries.findUnique({ where: { slug } });
    if (!series) {
      console.log(`  ⚠️  Series not found: ${slug}`);
      continue;
    }

    const episodes = await prisma.animeEpisode.findMany({
      where: { seriesId: series.id, isPublished: true },
      orderBy: { number: 'asc' },
      select: { id: true, number: true, title: true, titleFr: true },
    });

    let updated = 0;
    for (const ep of episodes) {
      const fix = data[ep.number];
      if (!fix) continue;

      const updateData: { title?: string; titleFr?: string | null } = {};

      if (ep.title !== fix.title) updateData.title = fix.title;
      if (fix.titleFr && ep.titleFr !== fix.titleFr) updateData.titleFr = fix.titleFr;

      if (Object.keys(updateData).length > 0) {
        await prisma.animeEpisode.update({
          where: { id: ep.id },
          data: updateData,
        });
        updated++;
      }
    }

    console.log(`  ✅ ${(series.titleFr || series.title).padEnd(30)} ${updated} épisodes mis à jour`);
    totalUpdated += updated;
  }

  console.log(`\n✅ Total: ${totalUpdated} épisodes corrigés`);
  await pool.end();
}

main();
