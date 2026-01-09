import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import prisma from '@/lib/prisma';

// Initialize MCP Server
export const mcpServer = new McpServer({
  name: 'rpb-dashboard-mcp',
  version: '1.0.0',
});

// === RESOURCES ===
// Expose read-only data for LLMs

// 1. List of recent tournaments
mcpServer.resource('tournaments', 'tournaments://recent', async (uri) => {
  const tournaments = await prisma.tournament.findMany({
    take: 10,
    orderBy: { date: 'desc' },
    select: {
      id: true,
      name: true,
      date: true,
      status: true,
      format: true,
    },
  });

  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify(tournaments, null, 2),
      },
    ],
  };
});

// 2. Specific Tournament Details Resource Template
mcpServer.resource(
  'tournament-details',
  new ResourceTemplate('tournaments://{id}/details', { list: undefined }),
  async (uri, { id }) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: typeof id === 'string' ? id : '' },
      include: {
        participants: {
          take: 50,
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!tournament) {
      throw new Error(`Tournament ${id} not found`);
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(tournament, null, 2),
        },
      ],
    };
  },
);

// === TOOLS ===
// Expose actions and queries

// 1. Search Users
mcpServer.tool(
  'search-users',
  {
    query: z.string().describe('Search term for username or email'),
  },
  async ({ query }) => {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { profile: { bladerName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: {
            bladerName: true,
            experience: true,
            wins: true,
            losses: true,
          },
        },
      },
      take: 5,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(users, null, 2),
        },
      ],
    };
  },
);

// 2. Get Global Stats
mcpServer.tool('get-global-stats', {}, async () => {
  const [userCount, tournamentCount, matchCount] = await Promise.all([
    prisma.user.count(),
    prisma.tournament.count(),
    prisma.tournamentMatch.count(),
  ]);

  const stats = {
    users: userCount,
    tournaments: tournamentCount,
    matches: matchCount,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(stats, null, 2),
      },
    ],
  };
});

// 3. Create Tournament (Action)
mcpServer.tool(
  'create-tournament',
  {
    name: z.string().describe('Name of the tournament'),
    date: z.string().describe('Date of the tournament (ISO-8601 string)'),
    format: z
      .enum([
        'single elimination',
        'double elimination',
        'round robin',
        'swiss',
      ])
      .optional()
      .describe('Tournament format'),
    maxPlayers: z.number().optional().describe('Maximum number of players'),
  },
  async ({ name, date, format, maxPlayers }) => {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        date: new Date(date),
        format: format || '3on3 Double Elimination',
        maxPlayers: maxPlayers || 64,
        status: 'UPCOMING',
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created tournament: ${tournament.name} (ID: ${tournament.id})`,
        },
      ],
    };
  },
);
