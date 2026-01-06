/**
 * RPB - Tournament Bracket Component
 * Visualizes tournament bracket structure
 */

'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import { alpha } from '@mui/material/styles'

interface Player {
  id: string
  name: string
  profile?: {
    bladerName?: string
    avatarUrl?: string
  }
}

interface Match {
  id: string
  round: number
  state: string
  score: string | null
  player1: Player | null
  player2: Player | null
  winner: Player | null
}

interface TournamentBracketProps {
  matches: Match[]
  format?: 'single' | 'double'
}

interface MatchCardProps {
  match: Match
}

function MatchCard({ match }: MatchCardProps) {
  const player1Name = match.player1?.profile?.bladerName ?? match.player1?.name ?? 'TBD'
  const player2Name = match.player2?.profile?.bladerName ?? match.player2?.name ?? 'TBD'
  const isComplete = match.state === 'complete'
  const scores = match.score?.split('-') ?? ['0', '0']

  return (
    <Card
      sx={{
        minWidth: 200,
        bgcolor: isComplete ? 'background.paper' : 'action.hover',
        border: 1,
        borderColor: isComplete ? 'divider' : 'action.disabled',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Player 1 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: match.winner?.id === match.player1?.id
              ? (theme) => alpha(theme.palette.success.main, 0.1)
              : 'transparent',
          }}
        >
          <Avatar
            src={match.player1?.profile?.avatarUrl}
            sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
          >
            {player1Name[0]}
          </Avatar>
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              fontWeight: match.winner?.id === match.player1?.id ? 'bold' : 'normal',
              color: match.player1 ? 'text.primary' : 'text.disabled',
            }}
          >
            {player1Name}
          </Typography>
          {isComplete && (
            <Chip
              label={scores[0]}
              size="small"
              color={match.winner?.id === match.player1?.id ? 'success' : 'default'}
              sx={{ minWidth: 28, height: 20 }}
            />
          )}
        </Box>

        {/* Player 2 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: match.winner?.id === match.player2?.id
              ? (theme) => alpha(theme.palette.success.main, 0.1)
              : 'transparent',
          }}
        >
          <Avatar
            src={match.player2?.profile?.avatarUrl}
            sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
          >
            {player2Name[0]}
          </Avatar>
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              fontWeight: match.winner?.id === match.player2?.id ? 'bold' : 'normal',
              color: match.player2 ? 'text.primary' : 'text.disabled',
            }}
          >
            {player2Name}
          </Typography>
          {isComplete && (
            <Chip
              label={scores[1]}
              size="small"
              color={match.winner?.id === match.player2?.id ? 'success' : 'default'}
              sx={{ minWidth: 28, height: 20 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

function getRoundName(round: number, maxRound: number): string {
  if (round === maxRound) return 'Finale'
  if (round === maxRound - 1) return 'Demi-finales'
  if (round === maxRound - 2) return 'Quarts de finale'
  if (round === maxRound - 3) return 'Huitièmes de finale'
  return `Round ${round}`
}

export function TournamentBracket({ matches, format = 'single' }: TournamentBracketProps) {
  // Group matches by round
  const rounds = matches.reduce(
    (acc, match) => {
      const r = match.round
      if (!acc[r]) acc[r] = []
      acc[r].push(match)
      return acc
    },
    {} as Record<number, Match[]>
  )

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .filter((r) => r > 0) // Only winners bracket for now
    .sort((a, b) => a - b)

  const maxRound = Math.max(...roundNumbers)

  if (roundNumbers.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          Le bracket sera généré au lancement du tournoi
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        pb: 2,
        minHeight: 400,
      }}
    >
      {roundNumbers.map((roundNum) => (
        <Box
          key={roundNum}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 220,
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            textAlign="center"
            fontWeight="bold"
          >
            {getRoundName(roundNum, maxRound)}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              justifyContent: 'space-around',
              flex: 1,
            }}
          >
            {rounds[roundNum]?.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
