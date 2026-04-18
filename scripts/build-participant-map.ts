import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Fonction de nettoyage de pseudo
function normalizeName(name: string): string {
  if (!name) return 'unknown';
  return name
    .replace(/✅/g, '') // Remove checkmarks
    .replace(/\[.*?\]/g, '') // Remove tags in brackets like [SATR]
    .replace(/Team(?:_|\s)?Arc\s*\|?/ig, '') // Remove Team Arc
    .replace(/RPB\s*\|?/ig, '') // Remove RPB tag
    .replace(/BTS\s*\|?/ig, '') // Remove BTS tag
    .trim();
}

function generateKey(normalizedName: string): string {
  return normalizedName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function buildMapper() {
  console.log("🚀 Building Participant Mapper...");
  const exportsDir = resolve(process.cwd(), 'data/exports');
  
  const bts2 = JSON.parse(readFileSync(resolve(exportsDir, 'B_TS2.json'), 'utf-8'));
  const bts3 = JSON.parse(readFileSync(resolve(exportsDir, 'B_TS3.json'), 'utf-8'));
  
  const playerMap = new Map<string, any>();

  const processTournament = (tournament: any, tId: string) => {
    if (!tournament.participants) return;
    
    for (const p of tournament.participants) {
      if (!p.name || p.name === 'Inscription' || p.name === 'Player' || p.name === 'Participant') continue;
      
      const cleanName = normalizeName(p.name);
      // Préférer le challongeUsername comme clé s'il existe et est pertinent, sinon le nom nettoyé
      let key = generateKey(cleanName);
      
      // Cas particuliers observés
      if (p.challongeUsername && p.challongeUsername !== 'new' && !p.challongeUsername.startsWith('participant')) {
        // On pourrait utiliser le challongeUsername, mais le pseudo est souvent plus lisible
        // On va garder la clé basée sur le pseudo pour l'affichage, mais lier le challongeUsername
      }

      if (!playerMap.has(key)) {
        playerMap.set(key, {
          key: key,
          primaryName: cleanName, // Le nom le plus propre
          challongeUsername: p.challongeUsername !== 'new' ? p.challongeUsername : null,
          aliases: new Set([p.name]),
          tournaments: new Set([tId])
        });
      } else {
        const existing = playerMap.get(key);
        existing.aliases.add(p.name);
        existing.tournaments.add(tId);
        if (!existing.challongeUsername && p.challongeUsername !== 'new') {
          existing.challongeUsername = p.challongeUsername;
        }
        // Garder le nom le plus court/propre comme primaryName si l'actuel est plus long
        if (cleanName.length < existing.primaryName.length && cleanName.length > 2) {
          existing.primaryName = cleanName;
        }
      }
    }
  };

  processTournament(bts2, 'bts2');
  processTournament(bts3, 'bts3');

  // Convert Sets to Arrays for JSON serialization
  const finalMapping: Record<string, any> = {};
  playerMap.forEach((val, key) => {
    finalMapping[key] = {
      ...val,
      aliases: Array.from(val.aliases),
      tournaments: Array.from(val.tournaments)
    };
  });

  const outputPath = resolve(exportsDir, 'participants_map.json');
  writeFileSync(outputPath, JSON.stringify(finalMapping, null, 2));
  
  console.log(`✅ Mapper generated at ${outputPath}`);
  console.log(`📊 Unique players found: ${playerMap.size}`);
}

buildMapper();
