import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import { prisma } from '@/lib/prisma';

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

// 4. Discord Speak (Action)
mcpServer.tool(
  'discord-speak',
  {
    channelId: z
      .string()
      .describe('The Discord channel ID to send the message to'),
    content: z.string().describe('The content of the message to send'),
  },
  async ({ channelId, content }) => {
    const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3001';
    const botApiKey = process.env.BOT_API_KEY;

    try {
      const response = await fetch(`${botApiUrl}/api/agent/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': botApiKey || '',
        },
        body: JSON.stringify({
          action: 'send_message',
          params: { channelId, content },
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        content: [
          {
            type: 'text',
            text: `Successfully sent message to Discord: ${JSON.stringify(result)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to send message to Discord: ${String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// === PROMPTS ===
// Pre-defined prompts for common tasks

mcpServer.prompt(
  'draft-tournament-announcement',
  {
    tournamentId: z.string().describe('The ID of the tournament'),
  },
  async ({ tournamentId }) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Tournament with ID ${tournamentId} not found.`,
            },
          },
        ],
      };
    }

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please draft an announcement for the following Beyblade tournament:\nName: ${tournament.name}\nDate: ${tournament.date.toDateString()}\nFormat: ${tournament.format}\nStatus: ${tournament.status}\n\nMake it exciting and ready to post on Discord!`,
          },
        },
      ],
    };
  },
);

// === SAMPLING (LLM) ===
// Tools that use the connected LLM to perform tasks

mcpServer.tool(
  'summarize-bot-logs',
  {
    tail: z
      .number()
      .optional()
      .default(20)
      .describe('Number of lines to summarize'),
  },
  async ({ tail }) => {
    // 1. Fetch Logs
    const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3001';
    const botApiKey = process.env.BOT_API_KEY;
    let logsText = '';

    try {
      const response = await fetch(`${botApiUrl}/api/logs?tail=${tail}`, {
        headers: { 'x-api-key': botApiKey || '' },
      });
      if (response.ok) {
        const { logs } = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logsText = logs.map((l: any) => `[${l.level}] ${l.message}`).join('\n');
      }
    } catch {
      logsText = 'Failed to fetch logs.';
    }

    // 2. Use Sampling to Summarize
    try {
      const result = await mcpServer.server.createMessage({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Summarize the following bot logs, highlighting any errors or warnings:\n\n${logsText}`,
            },
          },
        ],
        maxTokens: 300,
      });

      const summary =
        result.content.type === 'text'
          ? result.content.text
          : 'No summary generated.';

      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to sample LLM: ${String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// === ADVANCED RESOURCES (COMPLETION) ===
// Resource with argument completion

mcpServer.resource(
  'tournament-matches',
  new ResourceTemplate('tournaments://{id}/matches', {
    list: undefined,
    complete: {
      id: async (value) => {
        // Find tournaments starting with the value
        const tournaments = await prisma.tournament.findMany({
          where: { id: { startsWith: value } },
          take: 10,
          select: { id: true },
        });
        return tournaments.map((t) => t.id);
      },
    },
  }),
  async (uri, { id }) => {
    const matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId: typeof id === 'string' ? id : '' },
      take: 20,
      include: {
        player1: { select: { name: true } },
        player2: { select: { name: true } },
      },
    });

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(matches, null, 2),
        },
      ],
    };
  },
);

// 6. Run Gemini -p
mcpServer.tool(
  'run-gemini-p',
  {
    prompt: z.string().describe('The prompt to pass to gemini -p'),
  },
  async ({ prompt }) => {
    const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3001';
    const botApiKey = process.env.BOT_API_KEY;

    try {
      const response = await fetch(`${botApiUrl}/api/agent/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': botApiKey || '',
        },
        body: JSON.stringify({
          action: 'run_gemini',
          params: { args: ['-p', prompt] },
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        content: [
          {
            type: 'text',
            text: `Gemini command triggered: ${JSON.stringify(result)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to trigger Gemini command: ${String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);
