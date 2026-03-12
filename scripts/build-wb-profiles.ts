import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { normalizeWbName } from './wb-name-aliases.js';

interface ScrapedParticipant {
  id: number;
  name: string;
  seed: number;
  finalRank?: number;
}

interface ScrapedMatch {
  id: number;
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  loserId: number | null;
  scores: string;
  state: string;
}

interface ScrapedTournament {
  metadata: { name: string; url: string };
  participants: ScrapedParticipant[];
  matches: ScrapedMatch[];
}

interface BladerProfile {
  name: string;
  totalWins: number;
  totalLosses: number;
  tournamentWins: number;
  tournamentsPlayed: number;
  history: Array<{
    tournament: string;
    rank?: number;
    wins: number;
    losses: number;
  }>;
}

async function run() {
  const dataDir = join(process.cwd(), 'data', 'wb_history');
  const files = (await readdir(dataDir)).filter(f => f.endsWith('.json'));

  // Canonical name map: lowercase -> display name (first occurrence wins)
  const canonicalNames = new Map<string, string>();
  // Blader profiles keyed by lowercase normalized name
  const bladerMap = new Map<string, BladerProfile>();

  console.log(`📊 Traitement de ${files.length} fichiers de tournois WB...`);

  for (const file of files) {
    const content = await readFile(join(dataDir, file), 'utf-8');
    const data: ScrapedTournament = JSON.parse(content);
    const tournamentName = data.metadata.url.split('/').pop() || file;

    for (const p of data.participants) {
      const normalized = normalizeWbName(p.name);
      const key = normalized.toLowerCase();

      if (!canonicalNames.has(key)) canonicalNames.set(key, normalized);
      const displayName = canonicalNames.get(key)!;

      if (!bladerMap.has(key)) {
        bladerMap.set(key, {
          name: displayName,
          totalWins: 0,
          totalLosses: 0,
          tournamentWins: 0,
          tournamentsPlayed: 0,
          history: [],
        });
      }

      const profile = bladerMap.get(key)!;

      let tWins = 0;
      let tLosses = 0;
      for (const m of data.matches) {
        if (m.state !== 'complete') continue;
        if (m.winnerId === p.id) tWins++;
        if (m.loserId === p.id) tLosses++;
      }

      profile.totalWins += tWins;
      profile.totalLosses += tLosses;
      if (p.finalRank === 1) profile.tournamentWins += 1;
      profile.tournamentsPlayed += 1;
      profile.history.push({
        tournament: tournamentName,
        rank: p.finalRank,
        wins: tWins,
        losses: tLosses,
      });
    }
  }

  const allProfiles = Array.from(bladerMap.values());
  console.log(`✅ ${allProfiles.length} profils de bladers WB uniques générés.`);

  const outputPath = join(process.cwd(), 'data', 'wb_blader_profiles.json');
  await writeFile(outputPath, JSON.stringify(allProfiles, null, 2));
  console.log(`📂 Profils sauvegardés dans ${outputPath}`);
}

run().catch(console.error);
