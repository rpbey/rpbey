import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function run() {
  const dataDir = join(process.cwd(), 'data', 'wb_history');
  const files = (await readdir(dataDir)).filter(f => f.endsWith('.json'));

  const champions = [];

  for (const file of files) {
    const content = await readFile(join(dataDir, file), 'utf-8');
    const data = JSON.parse(content);

    // Extract UB number from file name (wb_ub{N}.json)
    const ubMatch = file.match(/wb_ub(\d+)\.json/);
    const ubNumber = ubMatch ? parseInt(ubMatch[1]) : 0;
    const slug = file.replace('.json', '');

    const winner = data.participants.find((p: any) => p.finalRank === 1);

    if (winner) {
      // Clean winner name: take only the part before "/" if it contains combos
      const cleanName = winner.name.includes('/')
        ? winner.name.split('/')[0].trim()
        : winner.name.trim();

      champions.push({
        tournament: slug,
        winner: cleanName,
        date: `UB #${ubNumber}`,
      });
    }
  }

  // Sort by UB number descending
  champions.sort((a, b) => {
    const numA = parseInt(a.date.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.date.match(/\d+/)?.[0] || '0');
    return numB - numA;
  });

  const outputPath = join(process.cwd(), 'data', 'wb_champions.json');
  await writeFile(outputPath, JSON.stringify(champions, null, 2));
  console.log(`🏆 Liste des champions WB générée (${champions.length} tournois)`);
}

run().catch(console.error);
