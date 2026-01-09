import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define allowed actions for better type safety and documentation
type GeminiAction =
  | 'status'
  | 'get_schema'
  | 'sql_query'
  | 'read_log'
  | 'manage_user';

export async function POST(req: Request) {
  const headersList = await headers();
  const token = headersList.get('x-gemini-token');

  // Security Check
  const authorized =
    (process.env.GEMINI_API_KEY && token === process.env.GEMINI_API_KEY) ||
    (process.env.BOT_API_KEY && token === process.env.BOT_API_KEY);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action: GeminiAction = body.action;
    const payload = body.payload || {};

    switch (action) {
      case 'status': {
        const [users, tournaments, profiles, activeTournaments] =
          await Promise.all([
            prisma.user.count(),
            prisma.tournament.count(),
            prisma.profile.count(),
            prisma.tournament.count({ where: { status: 'REGISTRATION_OPEN' } }),
          ]);

        return NextResponse.json({
          status: 'operational',
          timestamp: new Date().toISOString(),
          system: {
            nodeEnv: process.env.NODE_ENV,
            dbConnection: 'active',
          },
          stats: { users, tournaments, profiles, activeTournaments },
        });
      }

      case 'get_schema': {
        // Dynamic introspection of Prisma models usually requires reading the schema file
        // or using the dmmf. For now, we return a static map of key models.
        return NextResponse.json({
          models: [
            'User',
            'Tournament',
            'Profile',
            'Beyblade',
            'Part',
            'Deck',
            'TournamentMatch',
          ],
          documentation: '/docs/prisma/schema.prisma',
        });
      }

      case 'sql_query': {
        // POWERFUL: Only allow SELECT statements for safety in this iteration
        // In a real production agent scenario, you might allow UPDATE/DELETE with strict controls.
        const query = payload.query;
        if (!query || typeof query !== 'string') {
          return NextResponse.json(
            { error: 'Missing query payload' },
            { status: 400 },
          );
        }

        const upperQuery = query.trim().toUpperCase();
        if (!upperQuery.startsWith('SELECT') && !payload.forceUnsafe) {
          return NextResponse.json(
            {
              error:
                'Only SELECT queries are allowed by default. Use forceUnsafe: true to override.',
            },
            { status: 403 },
          );
        }

        try {
          const result = await prisma.$queryRawUnsafe(query);
          // Handle BigInt serialization
          const sanitized = JSON.parse(
            JSON.stringify(result, (_, v) =>
              typeof v === 'bigint' ? v.toString() : v,
            ),
          );
          return NextResponse.json({ result: sanitized });
        } catch (dbError) {
          return NextResponse.json({ error: String(dbError) }, { status: 500 });
        }
      }

      case 'read_log': {
        // Safe file reading limited to specific log files
        const logType = payload.type || 'app'; // 'app' or 'bot'

        // In a real scenario, ensure path traversal is prevented
        // For this demo, we just try to read the bot log if requested
        if (logType === 'bot') {
          try {
            const content = await readFile(
              join(process.cwd(), 'bot/bot.log'),
              'utf-8',
            );
            // Return last 2000 chars
            return NextResponse.json({ content: content.slice(-2000) });
          } catch {
            return NextResponse.json(
              { error: 'Log file not found or empty' },
              { status: 404 },
            );
          }
        }
        return NextResponse.json({ message: 'Log type not supported' });
      }

      case 'manage_user': {
        const { userId, action: userAction, reason } = payload;
        if (!userId || !userAction)
          return NextResponse.json(
            { error: 'Missing userId or action' },
            { status: 400 },
          );

        if (userAction === 'ban') {
          const user = await prisma.user.update({
            where: { id: userId },
            data: {
              banned: true,
              banReason: reason || 'Banned by Gemini Agent',
            },
          });
          return NextResponse.json({
            success: true,
            user: { id: user.id, banned: user.banned },
          });
        }

        if (userAction === 'promote_admin') {
          const user = await prisma.user.update({
            where: { id: userId },
            data: { role: 'admin' },
          });
          return NextResponse.json({
            success: true,
            user: { id: user.id, role: user.role },
          });
        }

        return NextResponse.json(
          { error: 'Unknown user action' },
          { status: 400 },
        );
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[Gemini API] Critical Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
