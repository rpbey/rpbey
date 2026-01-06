/**
 * RPB - Profile Card Image Generation
 * Generates a shareable profile card image using Canvas
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserStats } from '@/lib/stats'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Canvas dimensions
const CARD_WIDTH = 800
const CARD_HEIGHT = 400

function getRankTitle(elo: number): string {
  if (elo >= 1500) return 'Champion'
  if (elo >= 1300) return 'Expert'
  if (elo >= 1150) return 'Confirmé'
  if (elo >= 1000) return 'Intermédiaire'
  return 'Débutant'
}

function getRankColor(rank: number): string {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return '#6B7280'
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params

    // Get user and stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stats = await getUserStats(userId)
    if (!stats) {
      return NextResponse.json({ error: 'Stats not found' }, { status: 404 })
    }

    const bladerName = stats.bladerName || user.name || '?'

    // Dynamic import of canvas (server-side only)
    const { createCanvas, loadImage } = await import('canvas')
    
    const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT)
    const ctx = canvas.getContext('2d')

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f0f23')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Add decorative elements
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 50)
    ctx.lineTo(CARD_WIDTH, 50)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'
    ctx.beginPath()
    ctx.moveTo(0, CARD_HEIGHT - 50)
    ctx.lineTo(CARD_WIDTH, CARD_HEIGHT - 50)
    ctx.stroke()

    // Avatar circle placeholder
    const avatarX = 100
    const avatarY = 150
    const avatarRadius = 60

    ctx.beginPath()
    ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2)
    ctx.fillStyle = getRankColor(stats.rank)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#2a2a4a'
    ctx.fill()

    // Avatar initial
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const initial = bladerName?.charAt(0) || '?'
    ctx.fillText(initial.toUpperCase(), avatarX, avatarY)

    // Blader name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(bladerName, 190, 100)

    // Rank badge
    ctx.fillStyle = getRankColor(stats.rank)
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText(`#${stats.rank}`, 190, 145)

    // Title
    ctx.fillStyle = '#dc2626'
    ctx.font = '18px sans-serif'
    ctx.fillText(getRankTitle(stats.elo), 240, 145)

    // ELO
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText(`${stats.elo} ELO`, 350, 145)

    // Stats section
    const statsY = 220
    const statsSpacing = 140

    // Matches
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    ctx.fillText('Matchs', 190, statsY)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText(`${stats.wins}V - ${stats.losses}D`, 190, statsY + 20)

    // Win rate
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    ctx.fillText('Taux de victoire', 190 + statsSpacing, statsY)
    ctx.fillStyle = stats.winRate >= 50 ? '#22c55e' : '#ef4444'
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText(`${stats.winRate.toFixed(1)}%`, 190 + statsSpacing, statsY + 20)

    // Tournaments
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    ctx.fillText('Tournois gagnés', 190 + statsSpacing * 2, statsY)
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText(`${stats.tournamentsWon}`, 190 + statsSpacing * 2, statsY + 20)

    // Streak
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    ctx.fillText('Série', 190 + statsSpacing * 3, statsY)
    ctx.fillStyle = stats.currentStreak > 0 ? '#22c55e' : '#9ca3af'
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText(`${stats.currentStreak}🔥`, 190 + statsSpacing * 3, statsY + 20)

    // Recent form
    const formY = 310
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    ctx.fillText('Forme récente', 190, formY)

    stats.recentForm.slice(0, 10).forEach((result, i) => {
      ctx.fillStyle = result === 'W' ? '#22c55e' : '#ef4444'
      ctx.fillRect(190 + i * 30, formY + 20, 24, 24)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(result, 190 + i * 30 + 12, formY + 36)
    })
    ctx.textAlign = 'left'

    // Footer - RPB branding
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('République Populaire du Beyblade • rpbey.fr', CARD_WIDTH - 20, CARD_HEIGHT - 20)

    // Convert to PNG
    const buffer = canvas.toBuffer('image/png')

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${bladerName}-card.png"`,
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    console.error('Error generating profile card:', error)
    return NextResponse.json(
      { error: 'Failed to generate card' },
      { status: 500 }
    )
  }
}
