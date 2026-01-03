import { NextResponse } from "next/server"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Get current user
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create user profile
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: session.user.id,
          discordId: session.user.id, // Will be updated with real Discord ID
          bladerName: session.user.name,
        },
      })
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { participants: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Check if already registered
    const existingParticipant = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_profileId: {
          tournamentId: id,
          profileId: profile.id,
        },
      },
    })

    if (existingParticipant) {
      return NextResponse.json({ error: "Already registered" }, { status: 400 })
    }

    // Check if tournament is full
    if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 })
    }

    // Register participant
    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: id,
        profileId: profile.id,
      },
      include: {
        profile: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error("Error registering for tournament:", error)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Get current user
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Delete registration
    await prisma.tournamentParticipant.delete({
      where: {
        tournamentId_profileId: {
          tournamentId: id,
          profileId: profile.id,
        },
      },
    })

    return NextResponse.json({ message: "Unregistered from tournament" })
  } catch (error) {
    console.error("Error unregistering from tournament:", error)
    return NextResponse.json({ error: "Failed to unregister" }, { status: 500 })
  }
}
