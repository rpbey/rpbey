'use client';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { alpha, Box, Card, Stack, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

// Types for our Bracket Structure
type MatchParticipant = {
  name: string;
  score?: number;
  isWinner?: boolean;
  avatar?: string;
};

type Match = {
  id: string;
  p1: MatchParticipant;
  p2: MatchParticipant;
  status: 'upcoming' | 'ongoing' | 'completed';
};

type Round = {
  name: string;
  matches: Match[];
};

// Hardcoded Data for BEY-TAMASHII SERIES #1 (Top 8 / Finals)
const BRACKET_DATA: Round[] = [
  {
    name: 'Quarts de Finale',
    matches: [
      {
        id: 'qf1',
        status: 'completed',
        p1: { name: 'Kaïous-sama', score: 3, isWinner: true },
        p2: { name: 'BladerX', score: 1 },
      },
      {
        id: 'qf2',
        status: 'completed',
        p1: { name: 'Masamune', score: 3, isWinner: true },
        p2: { name: 'Ryuga', score: 2 },
      },
      {
        id: 'qf3',
        status: 'completed',
        p1: { name: 'Yoyo', score: 0 },
        p2: { name: 'Gingka', score: 3, isWinner: true },
      },
      {
        id: 'qf4',
        status: 'completed',
        p1: { name: 'Tyson', score: 3, isWinner: true },
        p2: { name: 'Kyoya', score: 1 },
      },
    ],
  },
  {
    name: 'Demi-Finale',
    matches: [
      {
        id: 'sf1',
        status: 'completed',
        p1: { name: 'Kaïous-sama', score: 2 },
        p2: { name: 'Masamune', score: 3, isWinner: true },
      },
      {
        id: 'sf2',
        status: 'completed',
        p1: { name: 'Gingka', score: 1 },
        p2: { name: 'Tyson', score: 3, isWinner: true },
      },
    ],
  },
  {
    name: 'Grande Finale',
    matches: [
      {
        id: 'gf1',
        status: 'completed',
        p1: { name: 'Masamune', score: 3, isWinner: true },
        p2: { name: 'Tyson', score: 2 },
      },
    ],
  },
];

const MatchCard = ({ match }: { match: Match }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        width: 200,
        bgcolor: 'surface.container',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
      }}
    >
      {/* Player 1 */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: match.p1.isWinner
            ? alpha(theme.palette.primary.main, 0.1)
            : 'transparent',
        }}
      >
        <Typography
          variant="body2"
          fontWeight={match.p1.isWinner ? 700 : 500}
          color={match.p1.isWinner ? 'text.primary' : 'text.secondary'}
          noWrap
        >
          {match.p1.name}
        </Typography>
        <Box
          sx={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: match.p1.isWinner ? 'primary.main' : 'action.selected',
            color: match.p1.isWinner ? 'white' : 'text.disabled',
            borderRadius: 1,
            fontWeight: 'bold',
            fontSize: '0.8rem',
          }}
        >
          {match.p1.score}
        </Box>
      </Box>

      <Box sx={{ height: 1, bgcolor: 'divider' }} />

      {/* Player 2 */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: match.p2.isWinner
            ? alpha(theme.palette.primary.main, 0.1)
            : 'transparent',
        }}
      >
        <Typography
          variant="body2"
          fontWeight={match.p2.isWinner ? 700 : 500}
          color={match.p2.isWinner ? 'text.primary' : 'text.secondary'}
          noWrap
        >
          {match.p2.name}
        </Typography>
        <Box
          sx={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: match.p2.isWinner ? 'primary.main' : 'action.selected',
            color: match.p2.isWinner ? 'white' : 'text.disabled',
            borderRadius: 1,
            fontWeight: 'bold',
            fontSize: '0.8rem',
          }}
        >
          {match.p2.score}
        </Box>
      </Box>
    </Card>
  );
};

export function NativeBracket() {
  return (
    <Box sx={{ width: '100%', overflowX: 'auto', py: 4, px: 2 }}>
      <Box
        sx={{
          display: 'inline-flex',
          minWidth: '100%',
          justifyContent: 'center',
          gap: { xs: 4, md: 8 },
        }}
      >
        {BRACKET_DATA.map((round, roundIndex) => (
          <Stack key={round.name} spacing={4} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                color:
                  roundIndex === BRACKET_DATA.length - 1
                    ? 'secondary.main'
                    : 'text.secondary',
              }}
            >
              {roundIndex === BRACKET_DATA.length - 1 && <EmojiEventsIcon />}
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing={1}
              >
                {round.name}
              </Typography>
            </Box>

            <Stack
              spacing={roundIndex === 0 ? 2 : roundIndex === 1 ? 14 : 0}
              justifyContent="center"
              sx={{ height: '100%' }}
            >
              {round.matches.map((match, matchIndex) => (
                <Box
                  key={match.id}
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: roundIndex * 0.2 + matchIndex * 0.1 }}
                  sx={{ position: 'relative' }}
                >
                  <MatchCard match={match} />

                  {/* Connector Logic (Simplified visual connectors) */}
                  {roundIndex < BRACKET_DATA.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: -32, // (Gap / 2)
                        top: '50%',
                        width: 32,
                        height: 2,
                        bgcolor: 'divider',
                        zIndex: 0,
                        display: { xs: 'none', md: 'block' },
                      }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
