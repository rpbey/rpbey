/**
 * Shared name normalization and alias map for WB (Wild Breakers) players.
 * Used by build-wb-profiles.ts, import-wb-bladers.ts, and sync-wb-ranking.ts.
 */

// Canonical name overrides: lowercase raw name → display name
export const WB_NAME_OVERRIDES: Record<string, string> = {
  // Staff/org prefixes
  'staff wb azure': 'Azure',
  'wb fulguris': 'Fulguris',
  'wb| fulguris': 'Fulguris',

  // (-1) prefix (DQ/penalty markers)
  '(-1) aichouxx': 'Aichouxx',
  '(-1) beyjawad': 'Beyjawad',
  '(-1) darkhater': 'Darkhater',

  // Combo names (player name + deck info)
  'azure tp660lr hc760w fbjaggy160c': 'Azure',
  'gotek cr 680w': 'Gotek',
  'snipblast db 6-60lr, cdragoon 5-60 l,  hw 7-60 k.': 'Snipblast',
  'zeln dbuster160lr': 'zeLn',
  'rg | jojokirino db160r cdragoon560p pw360f': 'JojoKirino',

  // Team/org prefixes
  'bp | legoshi': 'Legoshi',
  'bp | sabo': 'Sabo',
  'rg | jojokirino': 'JojoKirino',
  'satr | mewxy': 'Mewxy',
  'team arc_kreepy': 'Kreepy',
  'team_arc kreepy': 'Kreepy',
  'le king joker': 'King Joker',

  // Spacing/formatting variants
  'dark houmous': 'DarkHoumous',
  'darkhoumous': 'DarkHoumous',
  'fission fusion': 'FissionFusion',
  'fissionfusion': 'FissionFusion',
  'jojo kirino': 'JojoKirino',
  'jojokirino': 'JojoKirino',
  'mr. fantome': 'Mr.Fantome',
  'mr.fantom': 'Mr.Fantome',
  'mr.fantome': 'Mr.Fantome',

  // Same player, different spellings
  'fulgu': 'Fulguris',
  'gelofi': 'Gelofy',
  'ghotek': 'Gotek',
  'kaious': 'Kaiouss',
  'kmn 83': 'Kmn83',
  'legøshi': 'Legoshi',
  'lewis 973': 'Lewis',
  'lewis97351': 'Lewis',
  'nthanb_': 'Nthanb',
  'nouham blader x': 'Nouhan Blader X',
  'rayou95': 'Rayou',
  'rayou_95': 'Rayou',
  'sewpoo_0192': 'Sewpoo',
  'sweepoo': 'Sewpoo',
  'spinach.exe': 'Spinach',
  'thepridefullord': 'PridefulLord',
  'yaya': 'Yayaa',
  'younsi (invitation pending)': 'Younsi',
  'eromyx': 'Xymore',
  'zeln': 'zeLn',
};

/**
 * Normalize a player name:
 * 1. Split on "/", take first part, trim
 * 2. Apply NAME_OVERRIDES map (case-insensitive)
 */
export function normalizeWbName(rawName: string): string {
  const [beforeSlash] = rawName.split('/');
  let name = (beforeSlash ?? rawName).trim();
  const key = name.toLowerCase();
  const override = WB_NAME_OVERRIDES[key];
  if (override) name = override;
  return name;
}
