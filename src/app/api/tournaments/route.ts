import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { date: "desc" },
      include: {
        participants: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, date, maxPlayers, challongeId } = body

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        date: new Date(date),
        maxPlayers: maxPlayers ?? 64,
        challongeId,
        status: "UPCOMING",
      },
    })

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}

// DELETE all fake tournaments (without challongeId)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deleteAll = searchParams.get("all") === "true"
    
    if (deleteAll) {
      // Delete all tournaments (admin action)
      const deleted = await prisma.tournament.deleteMany({})
      return NextResponse.json({ deleted: deleted.count, message: "All tournaments deleted" })
    }
    
    // Delete only fake tournaments (no challongeId)
    const deleted = await prisma.tournament.deleteMany({
      where: { challongeId: null }
    })
    
    return NextResponse.json({ deleted: deleted.count, message: "Fake tournaments deleted" })
  } catch (error) {
    console.error("Error deleting tournaments:", error)
    return NextResponse.json({ error: "Failed to delete tournaments" }, { status: 500 })
  }
}
