
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

// Types basés sur le JSON extrait
interface ChallongePlayer {
  id: number;
  display_name: string;
  portrait_url: string | null;
}

interface ChallongeMatch {
  id: number;
  tournament_id: number;
  state: string;
  round: number;
  identifier: number;
  player1?: ChallongePlayer;
  player2?: ChallongePlayer;
  winner_id?: number;
  loser_id?: number;
  scores: number[]; // [p1Score, p2Score]
}

interface Standing {
  rank: number;
  name: string;
  stats: {
    matchRecord: string;
    gameRecord: string;
  };
}

async function importBTS1() {
  console.log('🚀 Démarrage de l\'importation locale de B_TS1...');

  // 1. Lecture des fichiers de données
  const detailsPath = path.resolve(process.cwd(), 'data/B_TS1_full_details.json');
  const standingsPath = path.resolve(process.cwd(), 'data/B_TS1_standings.json');

  if (!fs.existsSync(detailsPath) || !fs.existsSync(standingsPath)) {
    console.error('❌ Fichiers de données manquants. Lancez les scripts de scraping d\'abord.');
    return;
  }

  const rawDetails = JSON.parse(fs.readFileSync(detailsPath, 'utf-8'));
  const rawStandings = JSON.parse(fs.readFileSync(standingsPath, 'utf-8')) as Standing[];

  // Extraction des données utiles du store Challonge
  const tournamentData = rawDetails.data.tournament;
  const matchesByRound = rawDetails.data.matches_by_round;

  // 2. Récupération ou création du Tournoi
  let tournament = await prisma.tournament.findFirst({
    where: {
      OR: [
        { challongeId: 'B_TS1' },
        { challongeUrl: { contains: 'B_TS1' } }
      ]
    }
  });

  if (!tournament) {
    console.log('⚠️ Tournoi non trouvé, création...');
    tournament = await prisma.tournament.create({
      data: {
        name: 'BEY-TAMASHII SERIES #1',
        date: new Date('2026-01-11T14:00:00Z'),
        status: 'COMPLETE',
        format: '3on3 Double Elimination',
        challongeUrl: 'https://challonge.com/fr/B_TS1',
        challongeId: String(tournamentData.id), // On utilise l\'ID numérique réel maintenant
        description: "Importé depuis l\'historique Challonge."
      }
    });
  } else {
    // Mise à jour avec l\'ID réel
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { 
        challongeId: String(tournamentData.id),
        status: 'COMPLETE'
      }
    });
  }

  console.log(`✅ Tournoi synchronisé : ${tournament.name} (${tournament.id})`);

  // 3. Extraction et Création des Participants
  // On parcourt tous les matchs pour trouver les joueurs uniques
  const playersMap = new Map<number, string>(); // ID Challonge -> Nom
  const allMatches: ChallongeMatch[] = [];

  Object.values(matchesByRound).forEach((roundMatches: any) => {
    roundMatches.forEach((m: ChallongeMatch) => {
      allMatches.push(m);
      if (m.player1) playersMap.set(m.player1.id, m.player1.display_name.replace('✅', '').trim());
      if (m.player2) playersMap.set(m.player2.id, m.player2.display_name.replace('✅', '').trim());
    });
  });

  console.log(`👥 ${playersMap.size} participants détectés.`);

  // Map pour lier ID Challonge -> ID User DB
  const challongeIdToUserId = new Map<number, string>();

  for (const [cId, name] of playersMap.entries()) {
    // Nettoyage du nom pour créer un pseudo/email unique
    const cleanName = name.replace(/\s+/g, '_').toLowerCase();
    const stubEmail = `${cleanName}@import.bts1`;

    // Recherche d\'un utilisateur existant (par pseudo Discord ou username)
    // C\'est une heuristique, idéalement on aurait les Discord IDs
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: name, mode: 'insensitive' } },
          { name: { equals: name, mode: 'insensitive' } },
          { email: stubEmail } // Cas où on l\'a déjà importé
        ]
      }
    });

    if (!user) {
      // Création d\'un utilisateur "Stub" pour l\'historique
      user = await prisma.user.create({
        data: {
          name: name,
          username: `bts1_${cleanName}`.substring(0, 30), // Limite de taille
          email: stubEmail,
          role: 'user',
          image: '/logo.png' // Image par défaut
        }
      });
      console.log(`➕ Utilisateur créé : ${name}`);
    }

    challongeIdToUserId.set(cId, user.id);

    // Création de l\'entrée TournamentParticipant
    // On essaie de trouver le rang final dans les standings
    const standing = rawStandings.find(s => s.name.includes(name));
    const finalPlacement = standing ? standing.rank : undefined;

    await prisma.tournamentParticipant.upsert({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId: user.id
        }
      },
      create: {
        tournamentId: tournament.id,
        userId: user.id,
        challongeParticipantId: String(cId),
        checkedIn: true,
        finalPlacement: finalPlacement,
      },
      update: {
        challongeParticipantId: String(cId),
        finalPlacement: finalPlacement
      }
    });
  }

  console.log('✅ Participants importés.');

  // 4. Importation des Matchs
  console.log(`⚔️ Importation de ${allMatches.length} matchs...`);

  for (const m of allMatches) {
    if (!m.player1 || !m.player2) continue; // Matchs incomplets ou byes

    const p1UserId = challongeIdToUserId.get(m.player1.id);
    const p2UserId = challongeIdToUserId.get(m.player2.id);
    
    // Détermination du gagnant
    let winnerUserId = null;
    if (m.winner_id) {
        winnerUserId = challongeIdToUserId.get(m.winner_id);
    }

    if (p1UserId && p2UserId) {
      await prisma.tournamentMatch.upsert({
        where: {
          tournamentId_challongeMatchId: {
            tournamentId: tournament.id,
            challongeMatchId: String(m.id)
          }
        },
        create: {
          tournamentId: tournament.id,
          challongeMatchId: String(m.id),
          round: m.round,
          player1Id: p1UserId,
          player2Id: p2UserId,
          winnerId: winnerUserId,
          score: m.scores ? `${m.scores[0]}-${m.scores[1]}` : '0-0',
          state: m.state
        },
        update: {
          winnerId: winnerUserId,
          score: m.scores ? `${m.scores[0]}-${m.scores[1]}` : '0-0',
          state: m.state
        }
      });
    }
  }

  console.log('🎉 Importation terminée avec succès !');
}

importBTS1()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
