import { NextRequest, NextResponse } from "next/server"
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions"

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-signature-ed25519")
  const timestamp = request.headers.get("x-signature-timestamp")
  const body = await request.text()

  // Verify the request signature
  const isValidRequest = verifyKey(
    body,
    signature ?? "",
    timestamp ?? "",
    DISCORD_PUBLIC_KEY
  )

  if (!isValidRequest) {
    return NextResponse.json({ error: "Invalid request signature" }, { status: 401 })
  }

  const interaction = JSON.parse(body)

  // Handle PING (required for Discord to validate the endpoint)
  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG })
  }

  // Handle Application Commands
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name } = interaction.data

    // Example command handler
    if (name === "ping") {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Pong depuis le dashboard RPB !",
        },
      })
    }

    // Default response for unknown commands
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Commande non reconnue.",
        flags: 64, // Ephemeral
      },
    })
  }

  // Handle other interaction types (buttons, modals, etc.)
  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    const { custom_id } = interaction.data

    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Interaction: ${custom_id}`,
        flags: 64,
      },
    })
  }

  return NextResponse.json({ error: "Unknown interaction type" }, { status: 400 })
}
