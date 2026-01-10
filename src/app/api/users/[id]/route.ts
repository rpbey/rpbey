/**
 * RPB - Single User API
 * Get user details by ID
 */

import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        discordTag: true,
        profile: {
          select: {
            bladerName: true,
            favoriteType: true,
            experience: true,
            bio: true,
            wins: true,
            losses: true,
            tournamentWins: true,
            twitterHandle: true,
            tiktokHandle: true,
          },
        },
        decks: {
          where: { isActive: true },
          include: {
            items: {
              include: {
                bey: true,
                blade: true,
                ratchet: true,
                bit: true,
              },
            },
          },
        },
        _count: {
          select: {
            tournaments: true,
            player1Matches: true,
            player2Matches: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
