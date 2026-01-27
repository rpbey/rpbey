import { NextResponse, connection } from 'next/server';
import { getBotStatus } from '@/lib/bot';

export async function GET() {
  await connection();
  try {
    const status = await getBotStatus();

    if (!status) {
      return NextResponse.json(
        { onlineCount: 0, memberCount: 0, status: 'offline' },
        { status: 200 },
      );
    }

    // Return only public information
    return NextResponse.json({
      onlineCount: status.onlineCount,
      memberCount: status.memberCount,
      status: status.status,
    });
  } catch (error) {
    console.error('Error fetching public bot status:', error);
    return NextResponse.json(
      { onlineCount: 0, memberCount: 0, status: 'error' },
      { status: 500 },
    );
  }
}
