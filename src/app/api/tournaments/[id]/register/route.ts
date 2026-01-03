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

    // Ensure user profile exists
    await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
        bladerName: session.user.name,
      },
    })

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
        tournamentId_userId: {
          tournamentId: id,
          userId: session.user.id,
        },
      },
    })

    if (existingParticipant) {
      return NextResponse.json({ error: "Already registered" }, { status: 400 })
    }

    // Check if tournament is full
    if (tournament.maxPlayers && tournament.participants.length >= tournament.maxPlayers) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 })
    }

    // Register participant
    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: id,
        userId: session.user.id,
      },
      include: {
        user: {
          include: {
            profile: true,
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

    // Delete registration
    await prisma.tournamentParticipant.delete({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ message: "Unregistered from tournament" })
  } catch (error) {
    console.error("Error unregistering from tournament:", error)
    return NextResponse.json({ error: "Failed to unregister" }, { status: 500 })
  }
}
