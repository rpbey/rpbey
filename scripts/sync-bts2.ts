import 'dotenv/config';
import { getChallongeService } from '../src/lib/challonge';
import { prisma } from '../src/lib/prisma';

async function main() {
  const challonge = getChallongeService();
  const TOURNAMENT_SLUG = 'B_TS2'; // Try direct URL first
  const FALLBACK_SLUG = 'fr-B_TS2';

  console.log(`🔌 Connecting to Challonge for ${TOURNAMENT_SLUG}...`);

  let tournament;
  try {
    tournament = await challonge.getTournament(TOURNAMENT_SLUG);
  } catch (e) {
    console.warn(`Failed to fetch ${TOURNAMENT_SLUG}, trying ${FALLBACK_SLUG}...`);
    try {
      tournament = await challonge.getTournament(FALLBACK_SLUG);
    } catch (e2) {
      console.error('Could not find tournament on Challonge API.');
      throw e2;
    }
  }

  console.log(`✅ Found Tournament: ${tournament.attributes.name} (${tournament.id})`);
  console.log(`📅 Date: ${tournament.attributes.startAt}`);
  console.log(`👥 Status: ${tournament.attributes.state}`);

  // Upsert Tournament
  const tournamentId = 'cm-bts2-auto-imported'; // Keep ID from previous script for consistency
  
  await prisma.tournament.upsert({
    where: { id: tournamentId },
    update: {
      name: tournament.attributes.name,
      description: tournament.attributes.description || "Tournoi qualificatif pour la collaboration LFBX ! Premier des quatre tournois qualificatifs.",
      date: tournament.attributes.startAt ? new Date(tournament.attributes.startAt) : new Date('2026-02-08T13:00:00Z'),
      status: mapStatus(tournament.attributes.state),
      challongeId: tournament.id,
      challongeUrl: tournament.attributes.url,
      challongeState: tournament.attributes.state,
      updatedAt: new Date(),
    },
    create: {
      id: tournamentId,
      name: tournament.attributes.name,
      description: tournament.attributes.description || "Tournoi qualificatif pour la collaboration LFBX ! Premier des quatre tournois qualificatifs.",
      date: tournament.attributes.startAt ? new Date(tournament.attributes.startAt) : new Date('2026-02-08T13:00:00Z'),
      location: "Dernier Bar Avant la Fin du Monde, 19 Avenue Victoria, 75001 Paris",
      format: "3on3 Double Elimination",
      status: mapStatus(tournament.attributes.state),
      challongeId: tournament.id,
      challongeUrl: tournament.attributes.url,
      challongeState: tournament.attributes.state,
    },
  });

  console.log('🏆 Tournament synced in DB.');

  // Sync Participants
  console.log('👥 Syncing participants...');
  const participants = await challonge.listParticipants(tournament.id);
  console.log(`Found ${participants.length} participants in Challonge.`);

  for (const p of participants) {
    // Try to find user by name or username or tag
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: p.attributes.name, mode: 'insensitive' } },
          { username: { equals: p.attributes.name, mode: 'insensitive' } },
          { discordTag: { equals: p.attributes.name, mode: 'insensitive' } },
          // Also check profile challongeUsername if available
           { profile: { challongeUsername: { equals: p.attributes.name, mode: 'insensitive' } } }
        ]
      }
    });

    if (user) {
      await prisma.tournamentParticipant.upsert({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId: user.id
          }
        },
        update: {
          challongeParticipantId: p.id,
          seed: p.attributes.seed,
          checkedIn: p.attributes.checkedIn,
          updatedAt: new Date(),
        },
        create: {
          tournamentId,
          userId: user.id,
          challongeParticipantId: p.id,
          seed: p.attributes.seed,
          checkedIn: p.attributes.checkedIn,
        }
      });
      console.log(`✅ Linked ${p.attributes.name} to user ${user.name}`);
    } else {
      console.log(`⚠️ User not found for participant: ${p.attributes.name}`);
    }
  }

  console.log('✨ Sync complete.');
}

function mapStatus(challongeState: string): 'UPCOMING' | 'REGISTRATION_OPEN' | 'UNDERWAY' | 'COMPLETE' {
  switch (challongeState) {
    case 'pending': return 'REGISTRATION_OPEN'; // Or UPCOMING
    case 'underway': return 'UNDERWAY';
    case 'complete': return 'COMPLETE';
    default: return 'REGISTRATION_OPEN';
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });