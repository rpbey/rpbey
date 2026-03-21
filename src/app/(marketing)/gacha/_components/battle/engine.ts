// ── Battle Engine: 5v5 TCG Card Combat ──

export interface BattleCard {
  id: string;
  slug: string;
  name: string;
  nameJp?: string | null;
  series: string;
  rarity: string;
  beyblade?: string | null;
  imageUrl?: string | null;
  atk: number;
  def: number;
  spd: number;
  hp: number;
  element: string;
  // Runtime state
  currentHp: number;
  isDefeated: boolean;
}

export interface BattleTeam {
  name: string;
  image?: string | null;
  cards: BattleCard[];
  activeIndex: number;
}

export interface BattleEvent {
  round: number;
  type:
    | 'attack'
    | 'critical'
    | 'element_bonus'
    | 'defeated'
    | 'switch'
    | 'dodge'
    | 'counter';
  attacker: string;
  defender: string;
  damage: number;
  remainingHp: number;
  message: string;
}

export interface BattleResult {
  winner: 'team1' | 'team2' | 'draw';
  team1: BattleTeam;
  team2: BattleTeam;
  events: BattleEvent[];
  totalRounds: number;
  mvp: BattleCard;
  finishMessage: string;
}

// Element matchups: attacker → list of elements it's strong against
const ELEMENT_ADVANTAGE: Record<string, string[]> = {
  FEU: ['VENT'],
  VENT: ['TERRE'],
  TERRE: ['EAU'],
  EAU: ['FEU'],
  OMBRE: ['LUMIERE'],
  LUMIERE: ['OMBRE'],
  NEUTRAL: [],
};

const RARITY_MULTIPLIER: Record<string, number> = {
  COMMON: 0.85,
  RARE: 1.0,
  EPIC: 1.15,
  LEGENDARY: 1.35,
  SECRET: 1.55,
};

const MAX_ROUNDS = 25;

function hasAdvantage(attElement: string, defElement: string): boolean {
  return ELEMENT_ADVANTAGE[attElement]?.includes(defElement) ?? false;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function calcDamage(
  attacker: BattleCard,
  defender: BattleCard,
): { damage: number; isCritical: boolean; elementBonus: boolean } {
  const rarityMul = RARITY_MULTIPLIER[attacker.rarity] ?? 1.0;
  const elementBonus = hasAdvantage(attacker.element, defender.element);
  const elementMul = elementBonus ? 1.25 : 1.0;
  const isCritical = Math.random() < 0.12; // 12% crit chance
  const critMul = isCritical ? 1.5 : 1.0;
  const variance = randomBetween(0.85, 1.15);

  const rawDamage = attacker.atk * rarityMul * elementMul * critMul * variance;
  const defReduction = defender.def * 0.3 * randomBetween(0.7, 1.0);
  const finalDamage = Math.max(2, Math.round(rawDamage - defReduction));

  return { damage: finalDamage, isCritical, elementBonus };
}

function getActiveCard(team: BattleTeam): BattleCard | null {
  if (team.activeIndex >= team.cards.length) return null;
  const card = team.cards[team.activeIndex];
  if (!card || card.isDefeated) {
    // Find next alive card
    for (let i = team.activeIndex + 1; i < team.cards.length; i++) {
      const c = team.cards[i];
      if (c && !c.isDefeated) {
        team.activeIndex = i;
        return c;
      }
    }
    return null;
  }
  return card;
}

function getAliveCount(team: BattleTeam): number {
  return team.cards.filter((c) => !c.isDefeated).length;
}

function getTotalRemainingHp(team: BattleTeam): number {
  return team.cards.reduce(
    (sum, c) => sum + (c.isDefeated ? 0 : c.currentHp),
    0,
  );
}

export function prepareBattleCard(card: {
  id: string;
  slug: string;
  name: string;
  nameJp?: string | null;
  series: string;
  rarity: string;
  beyblade?: string | null;
  imageUrl?: string | null;
  atk: number;
  def: number;
  spd: number;
  hp: number;
  element: string;
}): BattleCard {
  // HP pool = base hp stat × rarity multiplier × 3 (to make battles last)
  const rarityMul = RARITY_MULTIPLIER[card.rarity] ?? 1.0;
  const maxHp = Math.round(card.hp * rarityMul * 3);
  return {
    ...card,
    currentHp: Math.max(maxHp, 30),
    isDefeated: false,
  };
}

export function simulateBattle(
  team1: BattleTeam,
  team2: BattleTeam,
): BattleResult {
  const events: BattleEvent[] = [];
  const damageDealt: Map<string, number> = new Map();

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const card1 = getActiveCard(team1);
    const card2 = getActiveCard(team2);

    if (!card1 || !card2) break;

    // Speed determines attack order
    const t1First = card1.spd >= card2.spd;
    const first = t1First
      ? { card: card1, team: team1, opponent: card2, opTeam: team2 }
      : { card: card2, team: team2, opponent: card1, opTeam: team1 };
    const second = t1First
      ? { card: card2, team: team2, opponent: card1, opTeam: team1 }
      : { card: card1, team: team1, opponent: card2, opTeam: team2 };

    // First attacker
    const dodge1 = Math.random() < second.card.spd * 0.002; // up to ~20% dodge at 100 spd
    if (dodge1) {
      events.push({
        round,
        type: 'dodge',
        attacker: first.card.name,
        defender: second.card.name,
        damage: 0,
        remainingHp: second.card.currentHp,
        message: `${second.card.name} esquive l'attaque de ${first.card.name} !`,
      });
    } else {
      const result1 = calcDamage(first.card, second.card);
      second.card.currentHp = Math.max(
        0,
        second.card.currentHp - result1.damage,
      );
      damageDealt.set(
        first.card.id,
        (damageDealt.get(first.card.id) || 0) + result1.damage,
      );

      if (result1.elementBonus) {
        events.push({
          round,
          type: 'element_bonus',
          attacker: first.card.name,
          defender: second.card.name,
          damage: result1.damage,
          remainingHp: second.card.currentHp,
          message: `${first.card.name} a l'avantage élémentaire ! (×1.25)`,
        });
      }

      events.push({
        round,
        type: result1.isCritical ? 'critical' : 'attack',
        attacker: first.card.name,
        defender: second.card.name,
        damage: result1.damage,
        remainingHp: second.card.currentHp,
        message: result1.isCritical
          ? `💥 ${first.card.name} inflige un COUP CRITIQUE de ${result1.damage} dégâts à ${second.card.name} !`
          : `⚔️ ${first.card.name} attaque ${second.card.name} pour ${result1.damage} dégâts`,
      });

      if (second.card.currentHp <= 0) {
        second.card.isDefeated = true;
        events.push({
          round,
          type: 'defeated',
          attacker: first.card.name,
          defender: second.card.name,
          damage: 0,
          remainingHp: 0,
          message: `💀 ${second.card.name} est K.O. !`,
        });

        // Check if team is eliminated
        if (getAliveCount(second.opTeam) === 0) break;

        // Switch to next card
        const nextIdx = second.opTeam.cards.findIndex(
          (c, i) => i > second.opTeam.activeIndex && !c.isDefeated,
        );
        if (nextIdx >= 0) {
          second.opTeam.activeIndex = nextIdx;
          const nextCard = second.opTeam.cards[nextIdx];
          if (nextCard) {
            events.push({
              round,
              type: 'switch',
              attacker: second.card.name,
              defender: nextCard.name,
              damage: 0,
              remainingHp: nextCard.currentHp,
              message: `🔄 ${nextCard.name} entre en combat !`,
            });
          }
        }
        continue; // Skip second attacker since they're KO
      }
    }

    // Second attacker (counter-attack)
    if (!second.card.isDefeated) {
      const dodge2 = Math.random() < first.card.spd * 0.002;
      if (dodge2) {
        events.push({
          round,
          type: 'dodge',
          attacker: second.card.name,
          defender: first.card.name,
          damage: 0,
          remainingHp: first.card.currentHp,
          message: `${first.card.name} esquive la contre-attaque de ${second.card.name} !`,
        });
      } else {
        const result2 = calcDamage(second.card, first.card);
        first.card.currentHp = Math.max(
          0,
          first.card.currentHp - result2.damage,
        );
        damageDealt.set(
          second.card.id,
          (damageDealt.get(second.card.id) || 0) + result2.damage,
        );

        if (result2.elementBonus) {
          events.push({
            round,
            type: 'element_bonus',
            attacker: second.card.name,
            defender: first.card.name,
            damage: result2.damage,
            remainingHp: first.card.currentHp,
            message: `${second.card.name} a l'avantage élémentaire ! (×1.25)`,
          });
        }

        events.push({
          round,
          type: result2.isCritical ? 'critical' : 'attack',
          attacker: second.card.name,
          defender: first.card.name,
          damage: result2.damage,
          remainingHp: first.card.currentHp,
          message: result2.isCritical
            ? `💥 ${second.card.name} inflige un COUP CRITIQUE de ${result2.damage} dégâts à ${first.card.name} !`
            : `⚔️ ${second.card.name} attaque ${first.card.name} pour ${result2.damage} dégâts`,
        });

        if (first.card.currentHp <= 0) {
          first.card.isDefeated = true;
          events.push({
            round,
            type: 'defeated',
            attacker: second.card.name,
            defender: first.card.name,
            damage: 0,
            remainingHp: 0,
            message: `💀 ${first.card.name} est K.O. !`,
          });

          if (getAliveCount(first.opTeam) === 0) break;

          const nextIdx = first.opTeam.cards.findIndex(
            (c, i) => i > first.opTeam.activeIndex && !c.isDefeated,
          );
          if (nextIdx >= 0) {
            first.opTeam.activeIndex = nextIdx;
            const nextCard = first.opTeam.cards[nextIdx];
            if (nextCard) {
              events.push({
                round,
                type: 'switch',
                attacker: first.card.name,
                defender: nextCard.name,
                damage: 0,
                remainingHp: nextCard.currentHp,
                message: `🔄 ${nextCard.name} entre en combat !`,
              });
            }
          }
        }
      }
    }
  }

  // Determine winner
  const alive1 = getAliveCount(team1);
  const alive2 = getAliveCount(team2);
  let winner: 'team1' | 'team2' | 'draw';
  let finishMessage: string;

  if (alive1 > alive2) {
    winner = 'team1';
    finishMessage = `${team1.name} remporte la victoire avec ${alive1} carte${alive1 > 1 ? 's' : ''} restante${alive1 > 1 ? 's' : ''} !`;
  } else if (alive2 > alive1) {
    winner = 'team2';
    finishMessage = `${team2.name} remporte la victoire avec ${alive2} carte${alive2 > 1 ? 's' : ''} restante${alive2 > 1 ? 's' : ''} !`;
  } else {
    // Same alive count → compare remaining HP
    const hp1 = getTotalRemainingHp(team1);
    const hp2 = getTotalRemainingHp(team2);
    if (hp1 > hp2) {
      winner = 'team1';
      finishMessage = `${team1.name} gagne aux PV restants (${hp1} vs ${hp2}) !`;
    } else if (hp2 > hp1) {
      winner = 'team2';
      finishMessage = `${team2.name} gagne aux PV restants (${hp2} vs ${hp1}) !`;
    } else {
      winner = 'draw';
      finishMessage = 'Égalité parfaite ! Les deux équipes sont à égalité.';
    }
  }

  // MVP = card that dealt most damage
  let mvpId = '';
  let maxDmg = 0;
  damageDealt.forEach((dmg, id) => {
    if (dmg > maxDmg) {
      maxDmg = dmg;
      mvpId = id;
    }
  });
  const allCards = [...team1.cards, ...team2.cards];
  const mvp = allCards.find((c) => c.id === mvpId) || allCards[0]!;

  return {
    winner,
    team1,
    team2,
    events,
    totalRounds:
      events.length > 0 ? (events[events.length - 1]?.round ?? 0) : 0,
    mvp,
    finishMessage,
  };
}

// Generate AI team from all cards pool
export function generateAITeam(
  allCards: BattleCard[],
  difficulty: 'easy' | 'normal' | 'hard',
): BattleCard[] {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  const rarityWeights: Record<string, Record<string, number>> = {
    easy: { COMMON: 50, RARE: 30, EPIC: 15, LEGENDARY: 4, SECRET: 1 },
    normal: { COMMON: 20, RARE: 30, EPIC: 30, LEGENDARY: 15, SECRET: 5 },
    hard: { COMMON: 5, RARE: 15, EPIC: 30, LEGENDARY: 35, SECRET: 15 },
  };
  const weights = rarityWeights[difficulty] || rarityWeights.normal;

  // Weighted selection
  const selected: BattleCard[] = [];
  const usedIds = new Set<string>();

  while (selected.length < 5 && shuffled.length > 0) {
    // Pick based on rarity weights
    const roll = Math.random() * 100;
    let cumulative = 0;
    let targetRarity = 'COMMON';
    for (const [rarity, weight] of Object.entries(weights!)) {
      cumulative += weight;
      if (roll < cumulative) {
        targetRarity = rarity;
        break;
      }
    }

    const candidate = shuffled.find(
      (c) => c.rarity === targetRarity && !usedIds.has(c.id),
    );
    if (candidate) {
      selected.push(candidate);
      usedIds.add(candidate.id);
    } else {
      // Fallback: pick any unused card
      const fallback = shuffled.find((c) => !usedIds.has(c.id));
      if (fallback) {
        selected.push(fallback);
        usedIds.add(fallback.id);
      } else {
        break;
      }
    }
  }

  return selected;
}
