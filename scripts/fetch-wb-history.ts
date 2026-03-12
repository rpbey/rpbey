import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import 'dotenv/config';

/**
 * Fetch WB tournament history via Challonge API v1 (fast, no browser needed)
 * Usage: pnpm tsx scripts/fetch-wb-history.ts
 */

const API_KEY = process.env.CHALLONGE_API_KEY || 'e41242ded972296d1fddf85f9879b20a3718f6eaeee6f0df';

const TOURNAMENT_MAP: Record<string, number> = {
  WildBreakersUltimeBataille3: 3,
  WildBreakersUltimeBataille4: 4,
  WildBreakersUltimeBataille5: 5,
  fbzzxt43: 6,
  WildBreakersUltimeBataille7: 7,
  WildBreakersUltimeBataille8: 8,
  i2ltr3yr: 9,
  go8qg261: 10,
  WildBreakersUltimeBataille11: 11,
  UB12: 12,
  UB13: 13,
};

interface ApiParticipant {
  participant: {
    id: number;
    name: string;
    seed: number;
    final_rank: number | null;
    challonge_username: string | null;
  };
}

interface ApiMatch {
  match: {
    id: number;
    identifier: string;
    round: number;
    player1_id: number | null;
    player2_id: number | null;
    winner_id: number | null;
    loser_id: number | null;
    scores_csv: string;
    state: string;
  };
}

async function fetchTournament(slug: string) {
  const url = `https://api.challonge.com/v1/tournaments/${slug}.json?api_key=${API_KEY}&include_participants=1&include_matches=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${slug}`);
  const data = await res.json();
  const t = data.tournament;

  const participants = (t.participants as ApiParticipant[]).map((p) => ({
    id: p.participant.id,
    name: p.participant.name,
    seed: p.participant.seed,
    finalRank: p.participant.final_rank || 0,
    challongeUsername: p.participant.challonge_username || undefined,
  }));

  const matches = (t.matches as ApiMatch[]).map((m) => ({
    id: m.match.id,
    identifier: m.match.identifier,
    round: m.match.round,
    player1Id: m.match.player1_id,
    player2Id: m.match.player2_id,
    winnerId: m.match.winner_id,
    loserId: m.match.loser_id,
    scores: m.match.scores_csv || '',
    state: m.match.state,
  }));

  return {
    metadata: {
      id: t.id,
      name: t.name,
      url: `https://challonge.com/fr/${slug}`,
      state: t.state,
      type: t.tournament_type,
      participantsCount: t.participants_count,
    },
    participants,
    matches,
  };
}

async function run() {
  const resultsDir = join(process.cwd(), 'data', 'wb_history');
  await mkdir(resultsDir, { recursive: true });

  const slugs = Object.entries(TOURNAMENT_MAP);
  console.log(`🎯 Fetching ${slugs.length} tournois via API Challonge...\n`);

  for (const [slug, ubNumber] of slugs) {
    try {
      const data = await fetchTournament(slug);
      const fileName = `wb_ub${ubNumber}.json`;
      await writeFile(join(resultsDir, fileName), JSON.stringify(data, null, 2));
      console.log(`✅ UB #${ubNumber}: ${data.participants.length} joueurs, ${data.matches.length} matchs`);
    } catch (error) {
      console.error(`❌ UB #${ubNumber} (${slug}):`, error);
    }
  }

  console.log('\n✨ Fetch terminé.');
}

run().catch(console.error);
