import type { Prisma } from '@prisma/client';

// Re-export full Prisma types
export * from '@prisma/client';

// === Extended Types ===

// User with Profile
export type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true };
}>;

// Full Beyblade with Parts
export type BeybladeWithParts = Prisma.BeybladeGetPayload<{
  include: {
    blade: true;
    ratchet: true;
    bit: true;
  };
}>;

// Deck with Items and their Parts
export type DeckWithItems = Prisma.DeckGetPayload<{
  include: {
    items: {
      include: {
        bey: true;
        blade: true;
        overBlade: true,
        ratchet: true,
        bit: true,
        lockChip: true,
        assistBlade: true,
      };
      orderBy: { position: 'asc' };
    };
  };
}>;

// DeckItem with Parts
export type DeckItemWithParts = Prisma.DeckItemGetPayload<{
  include: {
    bey: true;
    blade: true;
    overBlade: true,
    ratchet: true,
    bit: true,
    lockChip: true,
    assistBlade: true,
  };
}>;

// Tournament with Participants and Matches
export type TournamentFull = Prisma.TournamentGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          include: { profile: true };
        };
        deck: {
          include: {
            items: {
              include: {
                bey: true;
                blade: true;
                overBlade: true,
                ratchet: true,
                bit: true,
                lockChip: true,
                assistBlade: true,
              };
              orderBy: { position: 'asc' };
            };
          };
        };
      };
    };
    matches: {
      include: {
        player1: { include: { profile: true } };
        player2: { include: { profile: true } };
        winner: { include: { profile: true } };
      };
    };
  };
}>;

// Match with Players
export type MatchWithPlayers = Prisma.TournamentMatchGetPayload<{
  include: {
    player1: { include: { profile: true } };
    player2: { include: { profile: true } };
    winner: { include: { profile: true } };
    tournament: true;
  };
}>;
