import { createSchema } from 'graphql-yoga';
import { prisma } from '@/lib/prisma';

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    enum BeyType {
      ATTACK
      DEFENSE
      STAMINA
      BALANCE
    }

    enum PartType {
      BLADE
      RATCHET
      BIT
    }

    enum TournamentStatus {
      UPCOMING
      PENDING
      ACTIVE
      COMPLETE
      CANCELLED
    }

    # ── Rankings ──────────────────────────────────────

    type Blader {
      id: ID!
      playerName: String!
      points: Int!
      wins: Int!
      losses: Int!
      tournamentWins: Int!
      tournamentsCount: Int!
      avatarUrl: String
      winRate: Float!
    }

    type Season {
      id: ID!
      name: String!
      slug: String!
      isActive: Boolean!
      startDate: String!
      endDate: String
      entries(limit: Int = 50, offset: Int = 0): [SeasonEntry!]!
    }

    type SeasonEntry {
      id: ID!
      playerName: String
      points: Int!
      wins: Int!
      losses: Int!
      tournamentWins: Int!
      rank: Int
    }

    # ── Parts & Beyblades ────────────────────────────

    type Part {
      id: ID!
      externalId: String!
      name: String!
      nameJp: String
      type: PartType!
      beyType: BeyType
      weight: Float
      attack: String
      defense: String
      stamina: String
      burst: String
      dash: String
      imageUrl: String
      rarity: String
      spinDirection: String
      system: String
    }

    type Beyblade {
      id: ID!
      code: String!
      name: String!
      nameEn: String
      nameFr: String
      beyType: BeyType
      totalAttack: Int
      totalDefense: Int
      totalStamina: Int
      totalBurst: Int
      totalDash: Int
      totalWeight: Float
      imageUrl: String
      blade: Part!
      ratchet: Part!
      bit: Part!
    }

    # ── Tournaments ──────────────────────────────────

    type Tournament {
      id: ID!
      name: String!
      description: String
      date: String!
      location: String
      format: String!
      maxPlayers: Int!
      status: TournamentStatus!
      challongeUrl: String
      participantCount: Int!
      category: TournamentCategory
    }

    type TournamentCategory {
      id: ID!
      name: String!
      multiplier: Float!
      color: String
    }

    # ── Profiles ─────────────────────────────────────

    type Profile {
      id: ID!
      bladerName: String
      favoriteType: BeyType
      bio: String
      wins: Int!
      losses: Int!
      tournamentWins: Int!
      rankingPoints: Int!
      challongeUsername: String
      user: PublicUser
    }

    type PublicUser {
      id: ID!
      name: String
      image: String
      discordTag: String
    }

    # ── Anime ────────────────────────────────────────

    type AnimeSeries {
      id: ID!
      slug: String!
      title: String!
      titleFr: String
      titleJp: String
      generation: String!
      synopsis: String
      posterUrl: String
      bannerUrl: String
      year: Int!
      episodeCount: Int!
    }

    # ── Root Query ───────────────────────────────────

    type Query {
      """Top bladers from the global ranking"""
      rankings(limit: Int = 50, offset: Int = 0): [Blader!]!

      """Get a blader by name"""
      blader(name: String!): Blader

      """All ranking seasons"""
      seasons: [Season!]!

      """A single season by slug"""
      season(slug: String!): Season

      """All parts, optionally filtered by type"""
      parts(type: PartType, limit: Int = 100, offset: Int = 0): [Part!]!

      """A single part by externalId"""
      part(externalId: String!): Part

      """All beyblades"""
      beyblades(limit: Int = 100, offset: Int = 0): [Beyblade!]!

      """A beyblade by code"""
      beyblade(code: String!): Beyblade

      """Tournaments, optionally filtered by status"""
      tournaments(status: TournamentStatus, limit: Int = 20, offset: Int = 0): [Tournament!]!

      """A tournament by ID"""
      tournament(id: ID!): Tournament

      """A blader profile by user ID"""
      profile(userId: ID!): Profile

      """Search bladers by name"""
      searchBladers(query: String!, limit: Int = 10): [Blader!]!

      """All published anime series"""
      animeSeries: [AnimeSeries!]!
    }
  `,
  resolvers: {
    Query: {
      rankings: async (
        _: unknown,
        { limit, offset }: { limit: number; offset: number },
      ) => {
        const rows = await prisma.globalRanking.findMany({
          where: { points: { gt: 0 } },
          orderBy: [{ points: 'desc' }, { wins: 'desc' }],
          take: Math.min(limit, 100),
          skip: offset,
        });
        return rows.map((r) => ({
          ...r,
          winRate:
            r.wins + r.losses > 0
              ? Math.round((r.wins / (r.wins + r.losses)) * 10000) / 100
              : 0,
        }));
      },

      blader: async (_: unknown, { name }: { name: string }) => {
        const r = await prisma.globalRanking.findUnique({
          where: { playerName: name },
        });
        if (!r) return null;
        return {
          ...r,
          winRate:
            r.wins + r.losses > 0
              ? Math.round((r.wins / (r.wins + r.losses)) * 10000) / 100
              : 0,
        };
      },

      searchBladers: async (
        _: unknown,
        { query, limit }: { query: string; limit: number },
      ) => {
        const rows = await prisma.globalRanking.findMany({
          where: {
            playerName: { contains: query, mode: 'insensitive' },
            points: { gt: 0 },
          },
          orderBy: { points: 'desc' },
          take: Math.min(limit, 25),
        });
        return rows.map((r) => ({
          ...r,
          winRate:
            r.wins + r.losses > 0
              ? Math.round((r.wins / (r.wins + r.losses)) * 10000) / 100
              : 0,
        }));
      },

      seasons: () =>
        prisma.rankingSeason.findMany({
          orderBy: { startDate: 'desc' },
        }),

      season: (_: unknown, { slug }: { slug: string }) =>
        prisma.rankingSeason.findUnique({ where: { slug } }),

      parts: (
        _: unknown,
        {
          type,
          limit,
          offset,
        }: { type?: string; limit: number; offset: number },
      ) =>
        prisma.part.findMany({
          where: type ? { type: type as never } : undefined,
          orderBy: { name: 'asc' },
          take: Math.min(limit, 200),
          skip: offset,
        }),

      part: (_: unknown, { externalId }: { externalId: string }) =>
        prisma.part.findUnique({ where: { externalId } }),

      beyblades: (
        _: unknown,
        { limit, offset }: { limit: number; offset: number },
      ) =>
        prisma.beyblade.findMany({
          include: { blade: true, ratchet: true, bit: true },
          orderBy: { name: 'asc' },
          take: Math.min(limit, 200),
          skip: offset,
        }),

      beyblade: (_: unknown, { code }: { code: string }) =>
        prisma.beyblade.findUnique({
          where: { code },
          include: { blade: true, ratchet: true, bit: true },
        }),

      tournaments: (
        _: unknown,
        {
          status,
          limit,
          offset,
        }: { status?: string; limit: number; offset: number },
      ) =>
        prisma.tournament.findMany({
          where: status ? { status: status as never } : undefined,
          include: {
            category: true,
            _count: { select: { participants: true } },
          },
          orderBy: { date: 'desc' },
          take: Math.min(limit, 50),
          skip: offset,
        }),

      tournament: (_: unknown, { id }: { id: string }) =>
        prisma.tournament.findUnique({
          where: { id },
          include: {
            category: true,
            _count: { select: { participants: true } },
          },
        }),

      profile: (_: unknown, { userId }: { userId: string }) =>
        prisma.profile.findUnique({
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                discordTag: true,
              },
            },
          },
        }),

      animeSeries: () =>
        prisma.animeSeries.findMany({
          where: { isPublished: true },
          orderBy: [{ generation: 'asc' }, { sortOrder: 'asc' }],
        }),
    },

    Season: {
      entries: (
        parent: { id: string },
        { limit, offset }: { limit: number; offset: number },
      ) =>
        prisma.seasonEntry.findMany({
          where: { seasonId: parent.id },
          orderBy: { points: 'desc' },
          take: Math.min(limit, 100),
          skip: offset,
        }),
    },

    Tournament: {
      participantCount: (parent: { _count?: { participants: number } }) =>
        parent._count?.participants ?? 0,
    },
  },
});
