import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function run() {
  const dataDir = join(process.cwd(), 'data', 'satr_history');
  const files = (await readdir(dataDir)).filter(f => f.endsWith('.json'));

  const champions = [];

  for (const file of files) {
    const content = await readFile(join(dataDir, file), 'utf-8');
    const data = JSON.parse(content);
    const tournamentName = data.metadata.url.split('/').pop()?.toUpperCase() || file;

    // Trouver le joueur avec le rang #1
    const winner = data.participants.find((p: any) => p.finalRank === 1);

    if (winner) {
      champions.push({
        tournament: tournamentName,
        winner: winner.name,
        date: tournamentName.match(/\d+/) ? `BBT #${tournamentName.match(/\d+/)[0]}` : tournamentName
      });
    }
  }

  // Trier par numéro de tournoi décroissant
  champions.sort((a, b) => {
      const numA = parseInt(a.tournament.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.tournament.match(/\d+/)?.[0] || '0');
      return numB - numA;
  });

  const outputPath = join(process.cwd(), 'data', 'satr_champions.json');
  await writeFile(outputPath, JSON.stringify(champions, null, 2));
  console.log(`🏆 Liste des champions générée (${champions.length} tournois)`);
}

run().catch(console.error);
