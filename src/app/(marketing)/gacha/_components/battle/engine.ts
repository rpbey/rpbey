// ── Battle Engine v2: 5v5 TCG Card Combat ──

export interface BattleCard {
  id: string;
  slug: string;
  name: string;
  nameJp?: string | null;
  series: string;
  rarity: string;
  beyblade?: string | null;
  imageUrl?: string | null;
  specialMove?: string | null;
  atk: number;
  def: number;
  spd: number;
  hp: number;
  element: string;
  // Runtime state
  maxHp: number;
  currentHp: number;
  isDefeated: boolean;
  specialCharge: number; // 0-100, triggers at 100
  kills: number;
  totalDamage: number;
  comboCount: number; // consecutive attacks
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
    | 'special_move'
    | 'element_bonus'
    | 'element_weak'
    | 'defeated'
    | 'switch'
    | 'dodge'
    | 'combo';
  attacker: string;
  defender: string;
  damage: number;
  remainingHp: number;
  maxHp: number;
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

// ── Element system ──
// FEU > VENT > TERRE > EAU > FEU (cycle)
// OMBRE <> LUMIERE (mutual)
// NEUTRAL = no interactions
const ELEMENT_ADVANTAGE: Record<string, string[]> = {
  FEU: ['VENT'],
  VENT: ['TERRE'],
  TERRE: ['EAU'],
  EAU: ['FEU'],
  OMBRE: ['LUMIERE'],
  LUMIERE: ['OMBRE'],
  NEUTRAL: [],
};

const ELEMENT_WEAKNESS: Record<string, string[]> = {
  FEU: ['EAU'],
  VENT: ['FEU'],
  TERRE: ['VENT'],
  EAU: ['TERRE'],
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

const MAX_ROUNDS = 30;
const SPECIAL_CHARGE_PER_HIT = 18; // ~6 hits to charge
const SPECIAL_CHARGE_ON_TAKE_DMG = 12; // taking damage charges faster
const SPECIAL_MOVE_MULTIPLIER = 1.8;
const CRIT_CHANCE = 0.1;
const CRIT_MULTIPLIER = 1.5;
const ELEMENT_ADVANTAGE_MUL = 1.3;
const ELEMENT_WEAKNESS_MUL = 0.75;
const COMBO_BONUS_PER_STACK = 0.08; // +8% per consecutive attack, max 3 stacks

function hasAdvantage(attElement: string, defElement: string): boolean {
  return ELEMENT_ADVANTAGE[attElement]?.includes(defElement) ?? false;
}

function hasWeakness(attElement: string, defElement: string): boolean {
  return ELEMENT_WEAKNESS[attElement]?.includes(defElement) ?? false;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

interface DamageResult {
  damage: number;
  isCritical: boolean;
  isSpecialMove: boolean;
  elementAdvantage: boolean;
  elementWeakness: boolean;
  comboBonus: number;
}

function calcDamage(attacker: BattleCard, defender: BattleCard): DamageResult {
  const rarityMul = RARITY_MULTIPLIER[attacker.rarity] ?? 1.0;

  // Element matchups
  const elementAdvantage = hasAdvantage(attacker.element, defender.element);
  const elementWeakness = hasWeakness(attacker.element, defender.element);
  const elementMul = elementAdvantage
    ? ELEMENT_ADVANTAGE_MUL
    : elementWeakness
      ? ELEMENT_WEAKNESS_MUL
      : 1.0;

  // Special Move check: triggers when charge is full
  const isSpecialMove =
    attacker.specialCharge >= 100 && attacker.specialMove != null;
  const specialMul = isSpecialMove ? SPECIAL_MOVE_MULTIPLIER : 1.0;

  // Critical: can't crit AND special at the same time
  const isCritical = !isSpecialMove && Math.random() < CRIT_CHANCE;
  const critMul = isCritical ? CRIT_MULTIPLIER : 1.0;

  // Combo bonus: capped at 3 stacks (+24% max)
  const comboStacks = Math.min(attacker.comboCount, 3);
  const comboMul = 1 + comboStacks * COMBO_BONUS_PER_STACK;

  const variance = randomBetween(0.88, 1.12);

  // Raw damage
  const rawDamage =
    attacker.atk *
    rarityMul *
    elementMul *
    critMul *
    specialMul *
    comboMul *
    variance;

  // DEF reduction with diminishing returns: def / (def + 80)
  // At DEF 40: 33% reduction. At DEF 80: 50%. At DEF 100: 55%.
  const defenderRarityMul = RARITY_MULTIPLIER[defender.rarity] ?? 1.0;
  const effectiveDef = defender.def * defenderRarityMul;
  const defReduction = effectiveDef / (effectiveDef + 80);
  const finalDamage = Math.max(3, Math.round(rawDamage * (1 - defReduction)));

  return {
    damage: finalDamage,
    isCritical,
    isSpecialMove,
    elementAdvantage,
    elementWeakness,
    comboBonus: comboStacks,
  };
}

function getActiveCard(team: BattleTeam): BattleCard | null {
  if (team.activeIndex >= team.cards.length) return null;
  const card = team.cards[team.activeIndex];
  if (!card || card.isDefeated) {
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

function switchToNextCard(team: BattleTeam): BattleCard | null {
  for (let i = 0; i < team.cards.length; i++) {
    const c = team.cards[i];
    if (c && !c.isDefeated) {
      team.activeIndex = i;
      return c;
    }
  }
  return null;
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
  specialMove?: string | null;
  atk: number;
  def: number;
  spd: number;
  hp: number;
  element: string;
}): BattleCard {
  const rarityMul = RARITY_MULTIPLIER[card.rarity] ?? 1.0;
  const maxHp = Math.max(Math.round(card.hp * rarityMul * 3), 30);
  return {
    ...card,
    maxHp,
    currentHp: maxHp,
    isDefeated: false,
    specialCharge: 0,
    kills: 0,
    totalDamage: 0,
    comboCount: 0,
  };
}

// Process one side attacking the other, returns events and whether defender died
function processAttack(
  round: number,
  attacker: BattleCard,
  defender: BattleCard,
  _attackerTeam: BattleTeam,
  defenderTeam: BattleTeam,
  events: BattleEvent[],
): boolean {
  // Dodge check: SPD-based, diminishing returns
  // dodge% = spd / (spd + 200), so 50 spd = 20%, 80 spd = 28.5%, 100 spd = 33%
  const dodgeChance = defender.spd / (defender.spd + 200);
  if (Math.random() < dodgeChance) {
    events.push({
      round,
      type: 'dodge',
      attacker: attacker.name,
      defender: defender.name,
      damage: 0,
      remainingHp: defender.currentHp,
      maxHp: defender.maxHp,
      message: `💨 ${defender.name} esquive l'attaque de ${attacker.name} !`,
    });
    // Reset combo on miss
    attacker.comboCount = 0;
    return false;
  }

  const result = calcDamage(attacker, defender);

  // Apply damage
  defender.currentHp = Math.max(0, defender.currentHp - result.damage);
  attacker.totalDamage += result.damage;
  attacker.comboCount++;

  // Charge special: attacker gains charge on hit, defender gains on taking damage
  if (!result.isSpecialMove) {
    attacker.specialCharge = Math.min(
      100,
      attacker.specialCharge + SPECIAL_CHARGE_PER_HIT,
    );
  } else {
    attacker.specialCharge = 0; // Reset after using special
  }
  defender.specialCharge = Math.min(
    100,
    defender.specialCharge + SPECIAL_CHARGE_ON_TAKE_DMG,
  );

  // Element events (before damage event for context)
  if (result.elementAdvantage) {
    events.push({
      round,
      type: 'element_bonus',
      attacker: attacker.name,
      defender: defender.name,
      damage: 0,
      remainingHp: defender.currentHp,
      maxHp: defender.maxHp,
      message: `🔺 Avantage élémentaire ! ${attacker.element} > ${defender.element} (×${ELEMENT_ADVANTAGE_MUL})`,
    });
  } else if (result.elementWeakness) {
    events.push({
      round,
      type: 'element_weak',
      attacker: attacker.name,
      defender: defender.name,
      damage: 0,
      remainingHp: defender.currentHp,
      maxHp: defender.maxHp,
      message: `🔻 Désavantage élémentaire ! ${attacker.element} < ${defender.element} (×${ELEMENT_WEAKNESS_MUL})`,
    });
  }

  // Combo event
  if (result.comboBonus >= 2) {
    events.push({
      round,
      type: 'combo',
      attacker: attacker.name,
      defender: defender.name,
      damage: 0,
      remainingHp: defender.currentHp,
      maxHp: defender.maxHp,
      message: `🔗 Combo ×${result.comboBonus} ! (+${result.comboBonus * 8}% dégâts)`,
    });
  }

  // Main damage event
  if (result.isSpecialMove) {
    events.push({
      round,
      type: 'special_move',
      attacker: attacker.name,
      defender: defender.name,
      damage: result.damage,
      remainingHp: defender.currentHp,
      maxHp: defender.maxHp,
      message: `🌟 ${attacker.name} déclenche ${attacker.specialMove} ! ${result.damage} dégâts à ${defender.name} !`,
    });
  } else if (result.isCritical) {
    events.push({
      round,
      type: 'critical',
      attacker: attacker.name,
      defender: defender.name,
      damage: result.damage,
      remainingHp: defender.currentHp,
      maxHp: defender.maxHp,
      message: `💥 COUP CRITIQUE ! ${attacker.name} inflige ${result.damage} dégâts à ${defender.name} !`,
    });
  } else {
    events.push({
      round,
      type: 'attack',
      attacker: attacker.name,
      defender: defender.name,
      damage: result.damage,
      remainingHp: defender.currentHp,
      maxHp: defender.maxHp,
      message: `⚔️ ${attacker.name} attaque ${defender.name} pour ${result.damage} dégâts`,
    });
  }

  // Check KO
  if (defender.currentHp <= 0) {
    defender.isDefeated = true;
    attacker.kills++;
    events.push({
      round,
      type: 'defeated',
      attacker: attacker.name,
      defender: defender.name,
      damage: 0,
      remainingHp: 0,
      maxHp: defender.maxHp,
      message: `💀 ${defender.name} est K.O. !`,
    });

    // Check team elimination
    if (getAliveCount(defenderTeam) === 0) return true;

    // Switch to next card in DEFENDER's team
    const nextCard = switchToNextCard(defenderTeam);
    if (nextCard) {
      events.push({
        round,
        type: 'switch',
        attacker: defender.name,
        defender: nextCard.name,
        damage: 0,
        remainingHp: nextCard.currentHp,
        maxHp: nextCard.maxHp,
        message: `🔄 ${nextCard.name} entre en combat !`,
      });
    }
    return true;
  }

  return false;
}

export function simulateBattle(
  team1: BattleTeam,
  team2: BattleTeam,
): BattleResult {
  const events: BattleEvent[] = [];

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const card1 = getActiveCard(team1);
    const card2 = getActiveCard(team2);

    if (!card1 || !card2) break;

    // Speed determines attack order, with randomness on tie
    const spdDiff = card1.spd - card2.spd;
    const t1First =
      spdDiff > 0 ? true : spdDiff < 0 ? false : Math.random() < 0.5;

    const firstCard = t1First ? card1 : card2;
    const firstTeam = t1First ? team1 : team2;
    const secondCard = t1First ? card2 : card1;
    const secondTeam = t1First ? team2 : team1;

    // First attacker strikes
    const defenderDied = processAttack(
      round,
      firstCard,
      secondCard,
      firstTeam,
      secondTeam,
      events,
    );

    // Check for team elimination
    if (getAliveCount(secondTeam) === 0) break;

    // If defender died, skip counter-attack (new card just entered)
    if (defenderDied) continue;

    // Counter-attack by second card
    const attackerDied = processAttack(
      round,
      secondCard,
      firstCard,
      secondTeam,
      firstTeam,
      events,
    );

    if (getAliveCount(firstTeam) === 0) break;

    // Reset combo if card was KO'd (new card enters with 0 combo)
    if (attackerDied) {
      // The new active card starts fresh
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

  // MVP = card with best score (kills × 1000 + totalDamage)
  const allCards = [...team1.cards, ...team2.cards];
  const mvp = allCards.reduce((best, card) => {
    const score = card.kills * 1000 + card.totalDamage;
    const bestScore = best.kills * 1000 + best.totalDamage;
    return score > bestScore ? card : best;
  }, allCards[0]!);

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
  const rarityWeights: Record<string, Record<string, number>> = {
    easy: { COMMON: 50, RARE: 30, EPIC: 15, LEGENDARY: 4, SECRET: 1 },
    normal: { COMMON: 15, RARE: 25, EPIC: 35, LEGENDARY: 20, SECRET: 5 },
    hard: { COMMON: 5, RARE: 10, EPIC: 25, LEGENDARY: 40, SECRET: 20 },
  };
  const weights = rarityWeights[difficulty] ?? rarityWeights.normal!;

  const selected: BattleCard[] = [];
  const usedIds = new Set<string>();

  // For hard: try to pick diverse elements
  const usedElements = new Set<string>();

  while (selected.length < 5 && usedIds.size < allCards.length) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let targetRarity = 'COMMON';
    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (roll < cumulative) {
        targetRarity = rarity;
        break;
      }
    }

    // Hard AI: prefer diverse elements
    let candidates = allCards.filter(
      (c) => c.rarity === targetRarity && !usedIds.has(c.id),
    );

    if (difficulty === 'hard' && candidates.length > 0) {
      const diverseCandidates = candidates.filter(
        (c) => !usedElements.has(c.element),
      );
      if (diverseCandidates.length > 0) candidates = diverseCandidates;
    }

    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
      selected.push(pick);
      usedIds.add(pick.id);
      usedElements.add(pick.element);
    } else {
      // Fallback: any unused card
      const fallback = allCards.find((c) => !usedIds.has(c.id));
      if (fallback) {
        selected.push(fallback);
        usedIds.add(fallback.id);
        usedElements.add(fallback.element);
      } else {
        break;
      }
    }
  }

  return selected;
}
