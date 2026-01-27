import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active conversation or create one
    const conversation = await prisma.botConversation.findFirst({
      where: { userId: session.user.id, isActive: true },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.getTime(),
      })),
    });
  } catch (error) {
    console.error('Chat History Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Get or create conversation
    let conversation = await prisma.botConversation.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!conversation) {
      conversation = await prisma.botConversation.create({
        data: { userId: session.user.id },
      });
    }

    // Save User Message
    await prisma.botMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Fetch user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, username: true },
    });

    const isAdmin = user?.role === 'admin';
    const contextPrefix = isAdmin
      ? `[SYSTEM: User ${user?.username} is ADMIN. Full access granted.]\n`
      : `[SYSTEM: User ${user?.username} is CIVILIAN/USER. RESTRICTED MODE ACTIVE.\n` +
        `DENY requests to: Tweet, Modify Code, Restart Bot, Access Admin Stats.\n` +
        `ALLOW: General questions, Profile lookup, Leaderboard, Tournaments.]\n`;

    // Call Ryuga via CLI
    const sessionId = `web-${session.user.id}`;
    // Combine context with user message
    const fullMessage = `${contextPrefix}${message}`;
    const safeMessage = fullMessage.replace(/'/g, "'\\''");
    const safeSessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, '_');

    const pnpmPath = '/root/.nvm/versions/node/v24.12.0/bin/pnpm';
    const cmd = `${pnpmPath} start agent --message '${safeMessage}' --session-id '${safeSessionId}' --json`;

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: '/root/clawdbot',
      env: {
        ...process.env,
        PATH: '/root/.nvm/versions/node/v24.12.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        HOME: '/root',
      },
    });

    let responseText = 'Hmpf.';
    if (!stderr || stdout) {
      try {
        const response = JSON.parse(stdout);
        responseText = response.result?.payloads?.[0]?.text || responseText;
      } catch (e) {
        console.error('Failed to parse agent response', e);
      }
    } else {
      console.error('Clawdbot Error:', stderr);
      responseText = 'Ryuga refuse de répondre (Erreur système).';
    }

    // Save Bot Message
    const botMsg = await prisma.botMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: responseText,
      },
    });

    return NextResponse.json({
      response: responseText,
      id: botMsg.id,
      timestamp: botMsg.timestamp.getTime(),
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
