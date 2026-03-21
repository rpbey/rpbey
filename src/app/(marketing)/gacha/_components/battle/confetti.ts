import { confetti } from '@tsparticles/confetti';

const RARITY_COLORS: Record<string, string[]> = {
  COMMON: ['#9ca3af', '#d1d5db', '#6b7280'],
  RARE: ['#3b82f6', '#60a5fa', '#2563eb'],
  EPIC: ['#8b5cf6', '#a78bfa', '#7c3aed'],
  LEGENDARY: ['#fbbf24', '#fcd34d', '#f59e0b', '#ffffff'],
  SECRET: ['#ef4444', '#f87171', '#dc2626', '#fbbf24', '#ffffff'],
};

/** Victory confetti — big burst from both sides */
export async function fireVictoryConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  // Initial big burst
  await Promise.all([
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.25, y: 0.5 },
      colors: ['#22c55e', '#fbbf24', '#ffffff', '#8b5cf6'],
      ticks: 200,
      gravity: 0.8,
    }),
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.75, y: 0.5 },
      colors: ['#22c55e', '#fbbf24', '#ffffff', '#8b5cf6'],
      ticks: 200,
      gravity: 0.8,
    }),
  ]);

  // Continuous rain
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#22c55e', '#fbbf24'],
      ticks: 150,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#22c55e', '#fbbf24'],
      ticks: 150,
    });
    if (Date.now() < end) {
      setTimeout(frame, 40);
    }
  };
  frame();
}

/** Defeat effect — red/gray particles falling */
export async function fireDefeatConfetti() {
  await confetti({
    particleCount: 40,
    spread: 120,
    origin: { x: 0.5, y: 0.4 },
    colors: ['#ef4444', '#6b7280', '#374151'],
    gravity: 1.5,
    scalar: 0.8,
    ticks: 100,
  });
}

/** KO explosion when a card is defeated */
export async function fireKOConfetti() {
  await confetti({
    particleCount: 25,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#ef4444', '#f97316', '#fbbf24'],
    startVelocity: 15,
    gravity: 0.6,
    scalar: 0.6,
    ticks: 80,
  });
}

/** Card reveal effect — based on rarity */
export async function fireCardRevealConfetti(rarity: string) {
  const colors = RARITY_COLORS[rarity] || RARITY_COLORS.COMMON;

  if (rarity === 'SECRET') {
    // Massive burst for SECRET
    await Promise.all([
      confetti({
        particleCount: 120,
        spread: 180,
        origin: { x: 0.5, y: 0.5 },
        colors,
        startVelocity: 35,
        gravity: 0.7,
        scalar: 1.3,
        ticks: 250,
      }),
      confetti({
        particleCount: 50,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#fbbf24', '#ffffff'],
        startVelocity: 20,
        gravity: 0.3,
        scalar: 0.8,
        ticks: 300,
      }),
    ]);
  } else if (rarity === 'LEGENDARY') {
    // Golden shower
    await confetti({
      particleCount: 80,
      spread: 120,
      origin: { x: 0.5, y: 0.4 },
      colors,
      startVelocity: 30,
      gravity: 0.8,
      scalar: 1.1,
      ticks: 200,
    });
  } else if (rarity === 'EPIC') {
    // Purple burst
    await confetti({
      particleCount: 50,
      spread: 90,
      origin: { x: 0.5, y: 0.5 },
      colors,
      startVelocity: 25,
      gravity: 0.9,
      ticks: 150,
    });
  } else if (rarity === 'RARE') {
    // Blue sparkle
    await confetti({
      particleCount: 30,
      spread: 60,
      origin: { x: 0.5, y: 0.5 },
      colors,
      startVelocity: 20,
      ticks: 120,
    });
  }
  // COMMON = no confetti
}

/** Critical hit flash */
export async function fireCriticalConfetti() {
  await confetti({
    particleCount: 15,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#fbbf24', '#ffffff'],
    startVelocity: 10,
    gravity: 0.5,
    scalar: 0.5,
    ticks: 60,
  });
}
