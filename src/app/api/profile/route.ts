import { NextResponse } from "next/server"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        tournaments: {
          include: {
            tournament: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bladerName, favoriteBey, beybladeType, experienceLevel, bio } = body

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        bladerName,
        favoriteBey,
        beybladeType,
        experienceLevel,
        bio,
      },
      create: {
        userId: session.user.id,
        discordId: session.user.id,
        bladerName: bladerName ?? session.user.name,
        favoriteBey,
        beybladeType,
        experienceLevel,
        bio,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
