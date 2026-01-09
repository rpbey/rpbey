/**
 * RPB - Tournament Logic
 * Implements WBO Beyblade X rules for scoring and deck validation.
 * Based on data/beyblade_x_logic_rules.json
 */

import rules from '../../data/beyblade_x_logic_rules.json';

export type FinishType =
  | 'xtreme_finish'
  | 'over_finish'
  | 'burst_finish'
  | 'spin_finish'
  | 'own_finish'
  | 'penalty_point';

export interface BattleResult {
  winnerId: string | null; // null if draw
  finishType: FinishType;
  points: number;
}

export type MatchType =
  | '4_point_match'
  | '5_point_match'
  | '7_point_match'
  | 'best_of_3_4_point';

export interface MatchScore {
  player1Points: number;
  player2Points: number;
  player1Sets: number;
  player2Sets: number;
  isFinished: boolean;
  winnerId: string | null;
}

/**
 * Calculates the current match score based on battle results
 */
export function calculateMatchScore(
  player1Id: string,
  player2Id: string,
  battles: BattleResult[],
  matchType: MatchType = '4_point_match',
): MatchScore {
  const config = rules.match_types[matchType as keyof typeof rules.match_types];
  const score: MatchScore = {
    player1Points: 0,
    player2Points: 0,
    player1Sets: 0,
    player2Sets: 0,
    isFinished: false,
    winnerId: null,
  };

  // Handle standard point matches (4, 5, 7)
  if ('points_to_win' in config) {
    const target = config.points_to_win;
    for (const battle of battles) {
      if (battle.winnerId === player1Id) {
        score.player1Points += battle.points;
      } else if (battle.winnerId === player2Id) {
        score.player2Points += battle.points;
      }

      if (score.player1Points >= target) {
        score.player1Points = target; // Cap at target
        score.isFinished = true;
        score.winnerId = player1Id;
        break;
      }
      if (score.player2Points >= target) {
        score.player2Points = target;
        score.isFinished = true;
        score.winnerId = player2Id;
        break;
      }
    }
  }
  // Handle Best of 3 sets
  else if ('points_to_win_set' in config) {
    const targetPoints = config.points_to_win_set;
    const targetSets = config.sets_to_win;

    let p1Points = 0;
    let p2Points = 0;

    for (const battle of battles) {
      if (battle.winnerId === player1Id) {
        p1Points += battle.points;
      } else if (battle.winnerId === player2Id) {
        p2Points += battle.points;
      }

      if (p1Points >= targetPoints) {
        score.player1Sets++;
        p1Points = 0;
        p2Points = 0;
      } else if (p2Points >= targetPoints) {
        score.player2Sets++;
        p1Points = 0;
        p2Points = 0;
      }

      if (score.player1Sets >= targetSets) {
        score.isFinished = true;
        score.winnerId = player1Id;
        break;
      }
      if (score.player2Sets >= targetSets) {
        score.isFinished = true;
        score.winnerId = player2Id;
        break;
      }
    }
    score.player1Points = p1Points;
    score.player2Points = p2Points;
  }

  return score;
}

/**
 * Validates a deck according to uniqueness rules.
 * Currently supports Blade, Ratchet, and Bit uniqueness.
 * TODO: Implement CX lock chip exception once part sub-components are modeled.
 */
export function validateDeck(deck: {
  beys: Array<{
    bladeId: string;
    ratchetId: string;
    bitId: string;
    bladeName?: string;
  }>;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (deck.beys.length !== rules.deck_rules.size) {
    errors.push(
      `Un deck doit contenir exactement ${rules.deck_rules.size} Beys.`,
    );
    return { isValid: false, errors };
  }

  const usedParts = new Set<string>();

  deck.beys.forEach((bey, index) => {
    const pos = index + 1;

    // Check uniqueness (Standard parts)
    if (usedParts.has(bey.bladeId)) {
      errors.push(`Le Blade du Bey #${pos} est déjà utilisé dans le deck.`);
    }
    if (usedParts.has(bey.ratchetId)) {
      errors.push(`Le Ratchet du Bey #${pos} est déjà utilisé dans le deck.`);
    }
    if (usedParts.has(bey.bitId)) {
      errors.push(`Le Bit du Bey #${pos} est déjà utilisé dans le deck.`);
    }

    usedParts.add(bey.bladeId);
    usedParts.add(bey.ratchetId);
    usedParts.add(bey.bitId);

    // Check banned parts
    for (const banned of rules.equipment_regulations.banned_parts) {
      // Simple check based on name if available, or ID if we had a mapping
      if (bey.bladeName?.includes(banned.part)) {
        errors.push(
          `Le Bey #${pos} contient une pièce bannie : ${banned.part} (${banned.reason})`,
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
