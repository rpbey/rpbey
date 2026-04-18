/**
 * Fix corrupted/missing episode titles across all anime series.
 * - Updates English titles (title) where generic "Episode X"
 * - Fixes corrupted French titles (titleFr) that were copy-pasted from wrong series
 * - Adds correct French titles where available
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface TitleFix {
  title: string;
  titleFr: string | null;
}

// ══════════════ METAL MASTERS ══════════════
const METAL_MASTERS: Record<number, TitleFix> = {
  1: { title: 'Seeking the Legend', titleFr: 'La toupie légendaire' },
  2: { title: 'The Persistent Challenger', titleFr: 'Le bladeur obstiné' },
  3: { title: 'A New Challenge', titleFr: 'Un nouveau défi' },
  4: { title: 'Ticket to the World', titleFr: 'Un ticket pour le monde' },
  5: { title: 'Final Battle! Leone vs. Eagle', titleFr: 'Le dernier combat! Leone contre Eagle!' },
  6: { title: 'Soar into the World!', titleFr: 'À la face du monde!' },
  7: { title: 'The Beylin Temple in the Sky', titleFr: 'Entrainement à la chinoise' },
  8: { title: 'The Third Man', titleFr: 'Le troisième bladeur' },
  9: { title: 'The World Championships Begin!', titleFr: 'Le championnat du monde commence' },
  10: { title: "Lacerta's Will", titleFr: 'La volonté de Lacerta' },
  11: { title: 'The 4000 Year Old Secret', titleFr: 'Le secret de 4000 ans' },
  12: { title: "The Bey with a Hero's Name", titleFr: 'La toupie au nom héroïque' },
  13: { title: 'The Wintry Land Of Russia', titleFr: 'Les plaines glacées de Russie' },
  14: { title: 'How Grand! The Cage Match!', titleFr: 'Le stadium sans issue' },
  15: { title: 'Libra Departs for the Front!', titleFr: 'Le premier duel de Libra' },
  16: { title: 'The Festival of Warriors', titleFr: 'Le Festival des Guerriers' },
  17: { title: 'We Meet Again! Wang Hu Zhong', titleFr: 'Comme on se retrouve, Wang Hu Zhong!' },
  18: { title: 'The Scorching Hot Lion', titleFr: 'La fureur brûlante du Lion' },
  19: { title: 'The Shocking Wild Fang', titleFr: 'Wild Fang, la terreur' },
  20: { title: 'Horuseus vs. Striker', titleFr: 'Horuseus contre Striker' },
  21: { title: 'Eternal Rivals', titleFr: 'Les éternels rivaux' },
  22: { title: 'The Third Match: On the Edge', titleFr: 'Le troisième duel: sur le fil' },
  23: { title: 'The End of a Fierce Struggle!', titleFr: "La fin d'une lutte féroce" },
  24: { title: 'The Creeping Darkness', titleFr: "L'invasion des ténèbres" },
  25: { title: 'The Axe of Destruction', titleFr: "L'Axe de la Destruction" },
  26: { title: 'The Dragon Emperor Returns', titleFr: "Le retour de l'Empereur Dragon" },
  27: { title: 'Exceed the Limit!', titleFr: 'Au-delà des limites' },
  28: { title: 'Dark Eagle', titleFr: "L'Aigle Obscur" },
  29: { title: 'Gravity Destroyer', titleFr: 'Gravity Destroyer' },
  30: { title: 'The Midday Street Battle', titleFr: 'Bataille de rue' },
  31: { title: 'The Brazilian Trap', titleFr: 'Piège Brésilien' },
  32: { title: 'The Explosive Cyclone Battle!', titleFr: 'Le combat de cyclone explosive' },
  33: { title: 'Charge! Ray Gil', titleFr: 'Charge, Ray Gill!' },
  34: { title: 'The Friend\'s Name is Zeo', titleFr: 'Mon ami Zeo' },
  35: { title: 'Our Slogan Is "Number 1"', titleFr: 'Numéro Un, c\'est notre devise!' },
  36: { title: 'The Plot Thickens', titleFr: "Le Mystère S'épaissit" },
  37: { title: 'The Compass Of Fate: Byxis', titleFr: 'La boussole de Fate: Byxis' },
  38: { title: 'The Wicked Peacock: Befall', titleFr: 'Le Paon maléfique: Befall' },
  39: { title: 'The Guard Dog Of Hades: Kerbecs', titleFr: 'Hades Kerbecs, le gardien des enfers' },
  40: { title: 'The Furious DJ Battle!?', titleFr: 'Le duel effroyable des bladeurs DJ' },
  41: { title: 'The Final Countdown', titleFr: 'Le Compte à Rebours Final' },
  42: { title: 'The Dragon Emperor Descends', titleFr: "L'entrée de l'empereur dragon" },
  43: { title: "Spirits' Last Battle", titleFr: 'Le dernier duel des esprits' },
  44: { title: 'Showdown! Gingka Vs. Damian', titleFr: 'Le clash final! Gingka contre Damian' },
  45: { title: 'The Miraculous Spiral Force', titleFr: 'La miraculeuse énergie spirale' },
  46: { title: 'Charge! Hades City', titleFr: 'Vous ne perdez rien pour attendre, Ziggurat!' },
  47: { title: 'The Fallen Emperor', titleFr: "L'Empereur Déchu" },
  48: { title: "Beafall's Trap", titleFr: 'Le piège de Befall' },
  49: { title: 'The Wild Beast Unleashed', titleFr: 'Le rugissement de Leone' },
  50: { title: 'Rampage! Tempo', titleFr: 'Tempo se déchaîne' },
  51: { title: 'Galaxy Heart', titleFr: 'Le coup final de Pegasus' },
};

// ══════════════ METAL FURY ══════════════
const METAL_FURY: Record<number, TitleFix> = {
  1: { title: 'Star Fragment', titleFr: "Fragment d'Étoile" },
  2: { title: 'Legendary Bladers', titleFr: 'Bladers Légendaires' },
  3: { title: 'The Monster Cat, Lynx', titleFr: 'Le Chat Sauvage : Lynx' },
  4: { title: 'L-Drago Destructor', titleFr: 'L-Drago Destructor' },
  5: { title: 'Awaken Anubius!', titleFr: "Le réveil d'Anubius" },
  6: { title: 'Requirements of a Warrior', titleFr: "N'est pas Bladeur Légendaire Qui Veut" },
  7: { title: "Kenta's Determination", titleFr: 'La Détermination De Kenta' },
  8: { title: 'The Crimson Flash', titleFr: "L'éclair Pourpre" },
  9: { title: 'The Greatest Tag-Team Tournament', titleFr: 'Le Grand Tournoi De Combats En Duo' },
  10: { title: 'A New Roar!', titleFr: 'Le Nouveau Rugissement!' },
  11: { title: 'Cosmic Tornado', titleFr: 'Tornade Cosmique' },
  12: { title: 'The God of Saturn, Kronos', titleFr: 'Le Dieu de Saturne : Kronos' },
  13: { title: 'Showdown at The Tower of Babel', titleFr: 'Confrontations à la tour de Babel' },
  14: { title: 'The New Team Dungeon!', titleFr: 'La nouvelle équipe Dungeon' },
  15: { title: 'Destroyer Dome', titleFr: 'Le Dôme de la Destruction' },
  16: { title: 'The New Striker is Complete!', titleFr: 'Le Nouveau Striker est Fin Prêt!' },
  17: { title: 'I am the Champion!', titleFr: "Le Champion, c'est Moi!" },
  18: { title: 'The Maze of Mist Mountain', titleFr: 'Le Labyrinthe de la Montagne de Brume' },
  19: { title: "The Lion's Pride", titleFr: 'La Fierté du Lion' },
  20: { title: 'The Guardian of the Temple, Dynamis', titleFr: 'Dynamis, le Gardien du Temple' },
  21: { title: "The Legend of Nemesis' Revival", titleFr: 'La Légende Du Retour De Nemesis' },
  22: { title: 'The Four Season Bladers', titleFr: 'Les Bladers des Quatre Saisons' },
  23: { title: 'The Battle of Beyster Island', titleFr: "Le combat de l'Ile de Toupâque" },
  24: { title: 'Two Big, Fierce Battles!', titleFr: 'Deux Duels Impitoyables' },
  25: { title: 'The Unseen Opponent', titleFr: "L'adversaire invisible" },
  26: { title: "Orion's Whereabouts", titleFr: 'Le blader mercenaire' },
  27: { title: 'The Lion in the Wilderness', titleFr: 'Le lion dans la savane' },
  28: { title: 'The God of Venus: Quetzalcoatl', titleFr: 'Quetzalcoatl, le Dieu de Venus' },
  29: { title: "The God of Destruction's Revival!?", titleFr: 'La résurrection du dieu de la destruction!' },
  30: { title: 'The Child of Nemesis', titleFr: 'Le Descendant de Némésis' },
  31: { title: 'Four Hearts', titleFr: 'Les quatre coeurs' },
  32: { title: 'Come Together, Legendary Bladers!', titleFr: 'Tous ensemble, Bladers Légendaires!' },
  33: { title: 'Diablo Nemesis', titleFr: 'Diablo Nemesis' },
  34: { title: 'To the Final Battle Ground', titleFr: "En route vers l'ultime combat" },
  35: { title: 'The Lost Kingdom', titleFr: 'Le royaume perdu' },
  36: { title: 'The Missing Star of the Four Seasons', titleFr: "L'étoile manquante des quatre saisons" },
  37: { title: 'Flash Sagittario', titleFr: 'Flash Sagittario' },
  38: { title: "Hades' Persistance", titleFr: 'Hades résiste!' },
  39: { title: 'A Ray of Hope', titleFr: 'Le dernier combat!' },
};

// ══════════════ SHOGUN STEEL ══════════════
const SHOGUN_STEEL: Record<number, TitleFix> = {
  1: { title: 'A New Age Arrives!', titleFr: "Le début d'une nouvelle ère" },
  2: { title: 'Zero-G Battle!', titleFr: "Le début d'une nouvelle ère" },
  3: { title: 'Fierce Training of Hell', titleFr: 'Battre Orochi le pirate' },
  4: { title: 'Defeat Pirate Orochi!', titleFr: 'Battre Orochi le pirate' },
  5: { title: 'Showdown! Revenge Match', titleFr: 'Le coup spécial foudroyant' },
  6: { title: 'The Blazing Special Move!', titleFr: 'Le coup spécial foudroyant' },
  7: { title: "Revizer's Challenge", titleFr: 'Deux toupies en une' },
  8: { title: 'The Extraordinary Synchrome!', titleFr: 'Deux toupies en une' },
  9: { title: 'The Crimson Challenger', titleFr: 'La force du lien' },
  10: { title: 'The Strength of a Bond', titleFr: 'La force du lien' },
  11: { title: 'The Hawk Has Landed', titleFr: 'La rafale de feu fantôme' },
  12: { title: 'Explode: Phantom Fire Shot!', titleFr: 'La rafale de feu fantôme' },
  13: { title: 'Terror! The Midsummer Beach', titleFr: "L'attaque du Kraken" },
  14: { title: 'Kraken Attacks', titleFr: "L'attaque du Kraken" },
  15: { title: 'Assault! The Mysterious Blader', titleFr: 'Le dragon noir' },
  16: { title: 'The Jet Black Dragon', titleFr: 'Le dragon noir' },
  17: { title: "The Gargole's Trap", titleFr: 'Zyro contre Sakyo' },
  18: { title: 'Clash! Zyro VS Sakyo', titleFr: 'Zyro contre Sakyo' },
  19: { title: 'The Strongest Man Defense', titleFr: 'Le Golem blindé' },
  20: { title: 'The Ironclad Golem', titleFr: 'Le Golem blindé' },
  21: { title: 'A Heated Battle of Friendship', titleFr: 'Combats et amitiés' },
  22: { title: 'Roar! Orojya Revizer', titleFr: 'Combats et amitiés' },
  23: { title: "Break the Iron Wall's Defense", titleFr: 'Le terrible Behemoth' },
  24: { title: 'The Ruthless Behemoth', titleFr: 'Le terrible Behemoth' },
  25: { title: 'Win! The Right to Challenge', titleFr: 'La bataille synchrome fait rage' },
  26: { title: 'A Fierce Synchrome Battle', titleFr: 'La bataille synchrome fait rage' },
  27: { title: 'Evil Gene', titleFr: 'Les Neo Battle Bladers' },
  28: { title: 'Neo Battle Bladers', titleFr: 'Les Neo Battle Bladers' },
  29: { title: 'The DNA Shutdown Coalition', titleFr: 'Les huit meilleurs sont là!' },
  30: { title: 'The Best 8 Decided!', titleFr: 'Les huit meilleurs sont là!' },
  31: { title: 'Get Pumped for The Finals!', titleFr: 'Quatre matches au sommet' },
  32: { title: 'Hot-Blooded! Zero VS Takanosuke', titleFr: 'Quatre matches au sommet' },
  33: { title: 'A Pledge with Friends', titleFr: 'La rencontre prédestinée de deux rivaux' },
  34: { title: 'A Fated Showdown Between Rivals', titleFr: 'La rencontre prédestinée de deux rivaux' },
  35: { title: 'The Ultimate Emperor of Destruction: Bahamoote', titleFr: "Bahamoote, l'empereur de la destruction" },
  36: { title: 'Entrusted Emotions', titleFr: "Bahamoote, l'empereur de la destruction" },
  37: { title: 'Sublime! The Final Match', titleFr: "Une attaque pleine d'esprit" },
  38: { title: 'A Spirit-Filled Attack!', titleFr: "Une attaque pleine d'esprit" },
  39: { title: 'A New Fight', titleFr: 'Un nouveau combat' },
  40: { title: 'The Legend and the Evil Combine', titleFr: "L'alliance de la légende et du mal" },
  41: { title: "Doji's Stronghold", titleFr: 'Le Repaire de Doji' },
  42: { title: 'Entering The Trap', titleFr: 'Pris au piège' },
};

// ══════════════ BURST EVOLUTION ══════════════
const BURST_EVOLUTION: Record<number, TitleFix> = {
  1: { title: "Fresh Start! Valtryek's Evolution!", titleFr: null },
  2: { title: 'Fighting Spirit! Berserk Roktavor!', titleFr: null },
  3: { title: 'Drain Fafnir! Winding Up!', titleFr: null },
  4: { title: 'Whirlwind! Tempest Wyvron!', titleFr: null },
  5: { title: 'Surprise Attack! Kinetic Satomb!', titleFr: null },
  6: { title: 'Squad Shake Up!', titleFr: null },
  7: { title: 'Journey to the Top!', titleFr: null },
  8: { title: 'Season Opener! European League!', titleFr: null },
  9: { title: 'Alter Cognite! The Shape Shifter!', titleFr: null },
  10: { title: 'Free to Launch!', titleFr: null },
  11: { title: 'BC Sol! A Team Divided!', titleFr: null },
  12: { title: 'The Return of Doomscizor!', titleFr: null },
  13: { title: 'Twin Scythes! Double Strike!', titleFr: null },
  14: { title: 'Attack! Maximus Garuda!', titleFr: null },
  15: { title: 'Ghasem! The Airborne Blader!', titleFr: null },
  16: { title: 'The Search for Shu!', titleFr: null },
  17: { title: 'Shadow Magic! The Snake Pit!', titleFr: null },
  18: { title: 'The Underground Maze!', titleFr: null },
  19: { title: 'Secret Fire! Red Eye!', titleFr: null },
  20: { title: 'New Teammates! New Rivals!', titleFr: null },
  21: { title: 'Joshua vs. the Space Ninjas!', titleFr: null },
  22: { title: 'Blast Jinnius! Caller of Storms!', titleFr: null },
  23: { title: "Infinity Stadium! Raul's Challenge!", titleFr: null },
  24: { title: 'World League! Setting the Stage!', titleFr: null },
  25: { title: 'Showdown! Surge Xcalius!', titleFr: null },
  26: { title: 'Genesis Reboot!', titleFr: null },
  27: { title: 'Worlds Collide! Home Turf!', titleFr: null },
  28: { title: 'Vampire! Deep Caynox!', titleFr: null },
  29: { title: 'The Fortress! Shelter Regulus!', titleFr: null },
  30: { title: 'Collision Course! To the Finals!', titleFr: null },
  31: { title: 'Big 5! Breaking Through!', titleFr: null },
  32: { title: 'Unrivaled! Triple Saber!', titleFr: null },
  33: { title: 'The World League Final!', titleFr: null },
  34: { title: 'Full Power! Spring Attack!', titleFr: null },
  35: { title: 'To the Podium!', titleFr: null },
  36: { title: 'Luinor vs. Spryzen!', titleFr: null },
  37: { title: 'Challenge of Champions!', titleFr: null },
  38: { title: 'Requiem Project! Spryzen Unleashed!', titleFr: null },
  39: { title: 'Emperor of the Underground!', titleFr: null },
  40: { title: 'Bow Down! Boom Khalzar!', titleFr: null },
  41: { title: 'Colossus Hammer! Twin Noctemis!', titleFr: null },
  42: { title: 'BC Sol Scorcher!', titleFr: null },
  43: { title: 'White Hot Rivals!', titleFr: null },
  44: { title: 'Epic Evolution! Strike Valtryek!', titleFr: null },
  45: { title: 'Spryzen the Destroyer!', titleFr: null },
  46: { title: 'No Limits! Free vs. Lui!', titleFr: null },
  47: { title: 'Full Force! Charging Up!', titleFr: null },
  48: { title: 'Teamwork! To the Semi-Finals!', titleFr: null },
  49: { title: 'The Fierce Four!', titleFr: null },
  50: { title: 'Breaking Point! Bursting Through!', titleFr: null },
  51: { title: 'A Champion is Crowned!', titleFr: null },
};

// ══════════════ BURST RISE ══════════════
const BURST_RISE: Record<number, TitleFix> = {
  1: { title: 'Ace Dragon! On The Rise!', titleFr: null },
  2: { title: "Lookin' Awesome! Bushin Ashindra!", titleFr: null },
  3: { title: 'Abracadabra! Wizard Fafnir!', titleFr: null },
  4: { title: 'From The Flames! Glyph Dragon!', titleFr: null },
  5: { title: 'Dragon Vs. Fafnir!', titleFr: null },
  6: { title: 'Explosive Speed! Glyph Strike!', titleFr: null },
  7: { title: 'Inspiration! Challenging Valt!', titleFr: null },
  8: { title: 'Get Hype! Bey Carnival!', titleFr: null },
  9: { title: 'All-In! Judgement Joker!', titleFr: null },
  10: { title: 'Rising Battles! Semifinals!', titleFr: null },
  11: { title: 'The Final Hand!', titleFr: null },
  12: { title: 'Heavy Steel! Zone Luinor!', titleFr: null },
  13: { title: 'Bey Carnival! Epic Final!', titleFr: null },
  14: { title: 'Rise and Shine! Hyper-Flux!', titleFr: null },
  15: { title: 'Dante vs. Delta!', titleFr: null },
  16: { title: 'The Demon Bey! Devolos!', titleFr: null },
  17: { title: 'Flying High! Harmony Pegasus!', titleFr: null },
  18: { title: 'Dangerous Art! Dusk Balkesh!', titleFr: null },
  19: { title: 'Flash of Light! Shining Crux!', titleFr: null },
  20: { title: 'Dante vs. Pheng!', titleFr: null },
  21: { title: 'Battle in the Skies!', titleFr: null },
  22: { title: 'Showdown at Battle Island!', titleFr: null },
  23: { title: 'Spin! Advance! Survive!', titleFr: null },
  24: { title: 'Stand-Off! Pheng vs. Delta!', titleFr: null },
  25: { title: 'The Final Stage! Facing Aiger!', titleFr: null },
  26: { title: 'Rise Up! Dante vs. Aiger!', titleFr: null },
  27: { title: 'Shining Bright! Hyper-Flux!', titleFr: null },
  28: { title: 'Turbo Battle! Aiger vs. Delta!', titleFr: null },
  29: { title: 'Invasion! The New King!', titleFr: null },
  30: { title: 'Bey of Annihilation! Apocalypse!', titleFr: null },
  31: { title: 'Rebirth! Command Dragon!', titleFr: null },
  32: { title: 'Battle at The Infernal Tower!', titleFr: null },
  33: { title: 'Genesis in Motion!', titleFr: null },
  34: { title: "Devolos's Revenge!", titleFr: null },
  35: { title: 'Dragon vs. Apocalypse!', titleFr: null },
  36: { title: 'Put to The Test! Unburstable Bey!', titleFr: null },
  37: { title: 'Dragon vs. Genesis!', titleFr: null },
  38: { title: 'Aurora! Superior Flux!', titleFr: null },
  39: { title: 'Rebirth! Master Devolos!', titleFr: null },
  40: { title: 'Burning Bright! Master Smash!', titleFr: null },
  41: { title: 'Ultimate Creation! Eclipse Genesis!', titleFr: null },
  42: { title: 'Hyper Training! Exhibition Match!', titleFr: null },
  43: { title: 'Shining Ashindra!', titleFr: null },
  44: { title: 'Rising Battles! Victories vs. Inferno!', titleFr: null },
  45: { title: "Dragon's Ultimate Awakening!", titleFr: null },
  46: { title: 'Pitch Black! Dusk Gyro!', titleFr: null },
  47: { title: 'Rising Ferocity! Tag Battle!', titleFr: null },
  48: { title: 'The Flawless Equation!', titleFr: null },
  49: { title: 'The Greatest Tag Battle Ever!', titleFr: null },
  50: { title: 'We Are Victories!', titleFr: null },
  51: { title: 'Rising Friendship! Master Dragon!', titleFr: null },
  52: { title: 'Rise Up! Dante vs. Gwyn!', titleFr: null },
};

// ══════════════ BURST SURGE ══════════════
const BURST_SURGE: Record<number, TitleFix> = {
  1: { title: 'The Blading Revolution!', titleFr: null },
  2: { title: 'Beys of The Sun! Hyperion and Helios!', titleFr: null },
  3: { title: 'Locked On! Lightning Launch!', titleFr: null },
  4: { title: 'Knock Out Ragnaruk!', titleFr: null },
  5: { title: 'Persistance! Kolossal Strike!', titleFr: null },
  6: { title: "Curse Satan's Challenge!", titleFr: null },
  7: { title: "Listen to Your Bey's Voice!", titleFr: null },
  8: { title: 'Meet the Monster: Free De La Hoya!', titleFr: null },
  9: { title: 'Illusory Dragon! Mirage Fafnir!', titleFr: null },
  10: { title: 'Attack Not Good!? Attack Not Good!!', titleFr: null },
  11: { title: 'Dream Team! Tag Battle!', titleFr: null },
  12: { title: "Shirasagijo x The Mythological Island of Demons!", titleFr: null },
  13: { title: "Conquering the Ogre's Dungeon!", titleFr: null },
  14: { title: 'Fierce Storm! Rage Longinus!', titleFr: null },
  15: { title: 'The Jet-Black Sun! Vex Lucius!', titleFr: null },
  16: { title: 'Barrier! Variant Wall!', titleFr: null },
  17: { title: 'Is This a Dream?! Or Is It a Nightmare?!', titleFr: null },
  18: { title: 'GT is Here!', titleFr: null },
  19: { title: 'Rise to Victory! Triumph Dragon!', titleFr: null },
  20: { title: 'Flare of Tyranny: Lean!', titleFr: null },
  21: { title: 'The Great Revolution! Legend Festival!', titleFr: null },
  22: { title: 'Super Z! Infinite Achilles!', titleFr: null },
  23: { title: 'Hyuga and Lain vs. Hikaru and Aiger!', titleFr: null },
  24: { title: 'A God Battle of Friendship!', titleFr: null },
  25: { title: "A True Hero! Tag Battle Style!", titleFr: null },
  26: { title: 'GT vs. Super Z!', titleFr: null },
  27: { title: 'Gotta Win! Going All-Out!', titleFr: null },
  28: { title: 'Strongest and Unbeatable vs. The New Generation!', titleFr: null },
  29: { title: 'Defeat Valt!', titleFr: null },
  30: { title: 'Explosive Battle!', titleFr: null },
  31: { title: 'Grand Finale! Valt vs. Lain!', titleFr: null },
  32: { title: 'Limit Break! Hyperion & Helios!', titleFr: null },
  33: { title: 'Spirit of Fire! World Spryzen!', titleFr: null },
  34: { title: 'Tag Showdown! Valt & Shu!', titleFr: null },
  35: { title: 'Counterattack! Lucius Endbringer!', titleFr: null },
  36: { title: 'Computer! Beyblade Virtual!', titleFr: null },
  37: { title: 'Tag-Team! Ultimate Partner!', titleFr: null },
  38: { title: 'It Begins! Legend Super Tag League!', titleFr: null },
  39: { title: 'Raging Battle! Defeating the Storm!', titleFr: null },
  40: { title: 'Crash! All of Their Bonds!', titleFr: null },
  41: { title: 'Crash and Clash! Battle of Legends!', titleFr: null },
  42: { title: 'Burn, Flare! Spark!!', titleFr: null },
  43: { title: 'Friendly Fire?! Final Limit Breaker!', titleFr: null },
  44: { title: 'Next-Level Training! Jet Wyvern!', titleFr: null },
  45: { title: 'Scorching Battle! Dauntless Bravery!', titleFr: null },
  46: { title: 'Mad Storm! Raging Tempest!', titleFr: null },
  47: { title: 'We Can Do It! Or Maybe Not!', titleFr: null },
  48: { title: 'The Bonds Between Beys', titleFr: null },
  49: { title: 'Confidence! Cowardice? Carefree-ness?!', titleFr: null },
  50: { title: 'Surpass Your Limits! Defeat the Legends!', titleFr: null },
  51: { title: 'Revolution! The Final Showdown!', titleFr: null },
  52: { title: 'Break Through Our Limits! Our Flare!', titleFr: null },
};

// ══════════════ BURST QUADDRIVE ══════════════
const BURST_QUADDRIVE: Record<number, TitleFix> = {
  1: { title: 'The Dark Prince! Destruction Belfyre!', titleFr: null },
  2: { title: 'Belial vs. Longinus!', titleFr: null },
  3: { title: "Graveyard of Beys! Phantom's Gate!", titleFr: null },
  4: { title: 'Sturm und Drang! Cyclone Ragnaruk!', titleFr: null },
  5: { title: 'Changing Modes! Highs and Lows!', titleFr: null },
  6: { title: 'Rival and Amiigo!', titleFr: null },
  7: { title: 'Theater of the Abyss! Bel vs. Valt!', titleFr: null },
  8: { title: 'Counterattack! Dynamite Bomber!', titleFr: null },
  9: { title: 'To the Skies! World Domination!', titleFr: null },
  10: { title: 'The Solitary Vanish Fafnir!', titleFr: null },
  11: { title: 'The Other Valtryek!', titleFr: null },
  12: { title: "Belial's Upgrade!", titleFr: null },
  13: { title: 'Flipping the Script! Belfyre vs. Fafnir!', titleFr: null },
  14: { title: 'Explosive Sword! Savior Valkyrie!', titleFr: null },
  15: { title: "Dragon's Howl! Roar Balkesh!", titleFr: null },
  16: { title: 'Crashing Awakening! Valkyrie vs. Valkyrie!', titleFr: null },
  17: { title: 'Lift Off! The Great Aerial Tour!', titleFr: null },
  18: { title: 'Earthquake at the Sacred Grounds! Battle of Beigoma Academy!', titleFr: null },
  19: { title: 'Novas Collide! Bel vs. Rashad!', titleFr: null },
  20: { title: 'The Crimson Super Star: Astral Spriggan!', titleFr: null },
  21: { title: 'The Dark Prince Strikes! Bel vs. Free!', titleFr: null },
  22: { title: 'Onigashima Battle Royale!', titleFr: null },
  23: { title: 'Dark Prince One Day! Minion the Next!', titleFr: null },
  24: { title: 'Crimson Dance! Magma Ifrit!', titleFr: null },
  25: { title: 'Knight of Dragons! Guilty Luinor!', titleFr: null },
  26: { title: "The Battle at Onigashima's Summit!", titleFr: null },
  27: { title: "MVP! Great Aerial Tour's Landing!", titleFr: null },
  28: { title: 'The Decisive Aerial Battle! Dynamite Battle!', titleFr: null },
  29: { title: 'The Dark Prince Returns! Devastate Belfyre!', titleFr: null },
  30: { title: "The Supreme King of Light's Descent!", titleFr: null },
  31: { title: 'Ring of Light! Glory Regnar!', titleFr: null },
  32: { title: 'Demon King vs. Supreme King! The Deciding Battle for the Strongest Team!', titleFr: null },
  33: { title: 'Reversal! Reversal! Great Counterattack!', titleFr: null },
  34: { title: '3rd Round! Battle Royale!', titleFr: null },
  35: { title: 'Disbanded! The Dark Prince Goes Rogue?!', titleFr: null },
  36: { title: 'Pumped Up! Overthrow the Monarchy!', titleFr: null },
  37: { title: "Regnar's Wrath! Glory Pendulum!", titleFr: null },
  38: { title: 'The Ultimate Bond! Ultimate Valkyrie!', titleFr: null },
  39: { title: 'Reckless Panic! Bag of Tricks!', titleFr: null },
  40: { title: 'High and Low! The Hybrid Stadium!', titleFr: null },
  41: { title: 'Rekindled Flames! Prominence Phoenix!', titleFr: null },
  42: { title: 'Dangerous! An Explosive Breakthrough!', titleFr: null },
  43: { title: 'Scarlet Flurry! Prominence Shaker!', titleFr: null },
  44: { title: 'The Shield Trap of Hatred!', titleFr: null },
  45: { title: 'Aurora Bound! Chasing the Phoenix!', titleFr: null },
  46: { title: 'Scorching-Hot! Battle with the Supreme King!', titleFr: null },
  47: { title: "Disturbing Disturbance! Phantom's Gate!", titleFr: null },
  48: { title: 'My Partner! Extreme Battle!', titleFr: null },
  49: { title: 'Ultimate Collision! Devastation and Ring of Light!', titleFr: null },
  50: { title: 'Bonds! Valt vs. Rashad!', titleFr: null },
  51: { title: 'Prince vs. Prince! Darkness and Light!', titleFr: null },
  52: { title: 'Explosion! The Final Battle!', titleFr: null },
};

// ══════════════ BURST QUADSTRIKE ══════════════
const BURST_QUADSTRIKE: Record<number, TitleFix> = {
  1: { title: 'Thunder and Lightning! Elemental Power!', titleFr: null },
  2: { title: 'The Rebirth! Divine Belfyre!', titleFr: null },
  3: { title: 'Rise Up! Gambit Dragon Soars!', titleFr: null },
  4: { title: 'Depths Below! Abyssal Tournament!', titleFr: null },
  5: { title: 'Dragon vs. Pandora! Rising Tides!', titleFr: null },
  6: { title: 'Howls of Terror! Kerbeus Returns!', titleFr: null },
  7: { title: 'Theater of the Dark Prince! Monstrous Missions!', titleFr: null },
  8: { title: 'Peerless! Xiphoid Xcalius!', titleFr: null },
  9: { title: 'Striking Flames! Ferocious Battle!', titleFr: null },
  10: { title: 'Dark Devotion! Mighty Sword!', titleFr: null },
  11: { title: 'Surge Ahead! Battle Camp Clash!', titleFr: null },
  12: { title: 'Hurricane Winds! Twister Pandora!!', titleFr: null },
  13: { title: 'Tag-Team! Break the Limit!', titleFr: null },
  14: { title: 'Turbo Time! Zeal Achilles!', titleFr: null },
  15: { title: 'Chivalry Unbound! Whirl Knight!', titleFr: null },
  16: { title: 'Wild Dash! Battle Marathon!', titleFr: null },
  17: { title: 'Blazing Battles! Aether Stadium!', titleFr: null },
  18: { title: 'Darkness Unleashed! Winds of Change!', titleFr: null },
  19: { title: "Champion's Challenge! Radiant Finals!", titleFr: null },
  20: { title: 'Invincible Shadows! Aiger vs. Bel!', titleFr: null },
  21: { title: 'Dire Destiny! Ruin Pandemonium!', titleFr: null },
  22: { title: 'Shining Stars! Lodestar Battle Tournament!', titleFr: null },
  23: { title: "Vroom-Vroom Revolution! A Hero's Journey!", titleFr: null },
  24: { title: 'Achilles vs. Pandemonium! Clashes of Light!', titleFr: null },
  25: { title: 'Resonance vs. Elemental!', titleFr: null },
  26: { title: 'Elemental Battle! Ultimate Showdown!', titleFr: null },
};

// ══════════════ BEYBLADE X ══════════════
const BEYBLADE_X: Record<number, TitleFix> = {
  1: { title: 'X', titleFr: 'X' },
  2: { title: 'Multi-Colored Ambush', titleFr: 'Une embuscade multicolore' },
  3: { title: 'Team Persona', titleFr: "L'équipe Persona" },
  4: { title: 'Bey Sponsor', titleFr: 'Sponsor Bey' },
  5: { title: 'To The X', titleFr: 'À la X' },
  6: { title: "Lion's Jungle", titleFr: 'Jungle du Lion' },
  7: { title: 'Team Zooganic', titleFr: "L'équipe Zooganic" },
  8: { title: 'The Mask and the King', titleFr: 'Le masque et le roi' },
  9: { title: 'Beycrafter', titleFr: 'Beycrafter' },
  10: { title: 'The Pro Realm', titleFr: 'Le Royaume Pro' },
  11: { title: "Warden's Exam", titleFr: null },
  12: { title: 'The Final Battle', titleFr: null },
  13: { title: 'The First Fan', titleFr: null },
  14: { title: 'Jax-ercise', titleFr: null },
  15: { title: 'Riddles and Beys', titleFr: null },
  16: { title: 'Noblesse Oblige', titleFr: null },
  17: { title: 'Bey Timeshift', titleFr: null },
  18: { title: 'Pride', titleFr: null },
  19: { title: 'Zip and Zoom', titleFr: null },
  20: { title: 'Memories of Sushi', titleFr: null },
  21: { title: 'Pop Production', titleFr: null },
  22: { title: 'Black and White', titleFr: null },
  23: { title: 'True Heart', titleFr: null },
  24: { title: 'Arrival of the Fastest', titleFr: null },
  25: { title: 'Proof of the Fastest', titleFr: null },
  26: { title: 'Invitation', titleFr: null },
  27: { title: 'The End of Persistence', titleFr: null },
  28: { title: 'The King and the Phoenix', titleFr: null },
  29: { title: 'Mask and Meat Buns', titleFr: null },
  30: { title: 'Riddles and Pop', titleFr: null },
  31: { title: 'My Teammates', titleFr: null },
  32: { title: 'New Partner', titleFr: null },
  33: { title: 'Our Promise', titleFr: null },
  34: { title: 'A Rainbow Guest', titleFr: null },
  35: { title: 'The Dream Contest', titleFr: null },
  36: { title: 'Bladership', titleFr: null },
  37: { title: 'Unpredictable', titleFr: null },
  38: { title: 'Return of the Queen', titleFr: null },
  39: { title: 'The Greatest Blader', titleFr: null },
  40: { title: 'The Other Mask', titleFr: null },
  41: { title: 'The Three Masks', titleFr: null },
  42: { title: 'XYZ', titleFr: null },
  43: { title: 'Pendragon, Back Then', titleFr: null },
  44: { title: 'Family, Back Then', titleFr: null },
  45: { title: 'You, Back Then', titleFr: null },
  46: { title: 'Time Off', titleFr: null },
  47: { title: 'Battle at the Top', titleFr: null },
  48: { title: 'The Nana-iro Showdown', titleFr: null },
  49: { title: 'Something Xtraordinary', titleFr: null },
  50: { title: 'The Two Xs', titleFr: null },
  51: { title: 'The Most Fun Ever', titleFr: null },
  52: { title: 'Restart', titleFr: null },
  53: { title: 'Signs of a New Era', titleFr: null },
  54: { title: 'Path of Resolve', titleFr: null },
  55: { title: 'Advance Bey Timeshift', titleFr: null },
  56: { title: 'Star Plot', titleFr: null },
  57: { title: 'Tri-Blader Battle', titleFr: null },
  58: { title: 'Triple Battle', titleFr: null },
  59: { title: 'Blader S', titleFr: null },
  60: { title: 'Multi-Colored Trial', titleFr: null },
  61: { title: 'Invincible', titleFr: null },
  62: { title: 'The Prestigious Bey Academy', titleFr: null },
  63: { title: 'The Manju Clan', titleFr: null },
  64: { title: 'The Shapeless Shadow', titleFr: null },
  65: { title: 'First Flight', titleFr: null },
  66: { title: 'Something Captivating', titleFr: null },
  67: { title: 'Silver Wolf', titleFr: null },
  68: { title: 'Light and Dark', titleFr: null },
  69: { title: 'Shadowy Underground', titleFr: null },
  70: { title: 'Dread Dragon', titleFr: null },
  71: { title: 'To That Place', titleFr: null },
  72: { title: 'Labyrinth of Riddles and Terror', titleFr: null },
  73: { title: 'The Star Battle', titleFr: null },
  74: { title: 'Cursed', titleFr: null },
  75: { title: 'Return of the Knight', titleFr: null },
};

// ══════════════ ALL SERIES TO UPDATE ══════════════
const SERIES_DATA: {
  slug: string;
  data: Record<number, TitleFix>;
  clearCorruptedFr: boolean; // true = overwrite titleFr even if null (to clear corrupted data)
}[] = [
  { slug: 'metal-fight-beyblade-baku', data: METAL_MASTERS, clearCorruptedFr: true },
  { slug: 'metal-fight-beyblade-4d', data: METAL_FURY, clearCorruptedFr: true },
  { slug: 'beyblade-shogun-steel', data: SHOGUN_STEEL, clearCorruptedFr: true },
  { slug: 'beyblade-burst-god', data: BURST_EVOLUTION, clearCorruptedFr: true },
  { slug: 'beyblade-burst-gt', data: BURST_RISE, clearCorruptedFr: false },
  { slug: 'beyblade-burst-superking', data: BURST_SURGE, clearCorruptedFr: false },
  { slug: 'beyblade-burst-db', data: BURST_QUADDRIVE, clearCorruptedFr: false },
  { slug: 'beyblade-burst-quadstrike', data: BURST_QUADSTRIKE, clearCorruptedFr: false },
  { slug: 'beyblade-x', data: BEYBLADE_X, clearCorruptedFr: false },
];

async function main() {
  console.log('🎬 Fixing episode titles...\n');

  let totalUpdated = 0;

  for (const { slug, data, clearCorruptedFr } of SERIES_DATA) {
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

      // Always update English title
      if (ep.title !== fix.title) {
        updateData.title = fix.title;
      }

      // Update French title
      if (fix.titleFr !== null) {
        // We have a correct French title — set it
        if (ep.titleFr !== fix.titleFr) {
          updateData.titleFr = fix.titleFr;
        }
      } else if (clearCorruptedFr && ep.titleFr) {
        // No French title available but current one is corrupted — clear it
        updateData.titleFr = null;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.animeEpisode.update({
          where: { id: ep.id },
          data: updateData,
        });
        updated++;
      }
    }

    const icon = updated > 0 ? '✅' : '⏭️';
    console.log(`  ${icon} ${(series.titleFr || series.title).padEnd(30)} ${updated} épisodes mis à jour`);
    totalUpdated += updated;
  }

  console.log(`\n✅ Total: ${totalUpdated} épisodes corrigés`);
  await pool.end();
}

main();
