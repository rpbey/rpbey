import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

function generateKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fixBTS2() {
    const exportsDir = resolve(process.cwd(), 'data/exports');
    const bts2Path = resolve(exportsDir, 'B_TS2.json');
    const bts3Path = resolve(exportsDir, 'B_TS3.json');
    const mapperPath = resolve(exportsDir, 'participants_map.json');

    const bts2 = JSON.parse(readFileSync(bts2Path, 'utf-8'));
    const bts3 = JSON.parse(readFileSync(bts3Path, 'utf-8'));
    const mapper = JSON.parse(readFileSync(mapperPath, 'utf-8'));

    // Invert mapper to get canonical key from any name
    const aliasToKey = new Map<string, string>();
    for (const [key, data] of Object.entries(mapper)) {
        for (const alias of (data as any).aliases) {
            aliasToKey.set(alias, key);
        }
    }

    // Get B_TS3 stats per player
    const bts3Stats = new Map<string, {wins: number, losses: number}>();
    for (const p of bts3.participants) {
        const key = aliasToKey.get(p.name) || generateKey(p.name);
        bts3Stats.set(key, {
            wins: p.exactWins || 0,
            losses: p.exactLosses || 0
        });
    }

    // Fix B_TS2 stats
    for (const p of bts2.participants) {
        const key = aliasToKey.get(p.name) || generateKey(p.name);
        
        // p.exactWins currently holds TOTAL wins (from standalone_ranking.json)
        // We need to subtract B_TS3 wins to get B_TS2 only wins
        if (p.exactWins !== undefined) {
            const p3Stats = bts3Stats.get(key) || { wins: 0, losses: 0 };
            const bts2WinsOnly = Math.max(0, p.exactWins - p3Stats.wins);
            const bts2LossesOnly = Math.max(0, (p.exactLosses || 0) - p3Stats.losses);
            
            p.exactWins = bts2WinsOnly;
            p.exactLosses = bts2LossesOnly;
        }
    }

    writeFileSync(bts2Path, JSON.stringify(bts2, null, 2));
    console.log("✅ Fixed B_TS2.json stats by subtracting B_TS3 stats");
}

fixBTS2();
