/**
 * RPB - Match History Component
 * Displays recent match results
 */

'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import useSWR from 'swr';

interface Match {
  id: string;
  round: number;
  score: string | null;
  state: string;
  createdAt: string;
  tournament: {
    id: string;
    name: string;
  };
  player1: {
    id: string;
    name: string;
    profile?: { bladerName: string; avatarUrl?: string };
  };
  player2: {
    id: string;
    name: string;
    profile?: { bladerName: string; avatarUrl?: string };
  };
  winner?: {
    id: string;
  };
}

interface MatchHistoryProps {
  userId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MatchHistory({ userId }: MatchHistoryProps) {
  const [tab, setTab] = useState(0);

  const { data, isLoading } = useSWR<{ data: Match[] }>(
    `/api/users/${userId}/matches`,
    fetcher,
  );

  const matches = data?.data ?? [];

  const filteredMatches =
    tab === 0
      ? matches
      : tab === 1
        ? matches.filter((m) => m.winner?.id === userId)
        : matches.filter((m) => m.winner?.id && m.winner.id !== userId);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Historique des matchs
          </Typography>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={72}
              sx={{ mb: 1, borderRadius: 1 }}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Historique des matchs
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Tous (${matches.length})`} />
          <Tab
            label={`Victoires (${matches.filter((m) => m.winner?.id === userId).length})`}
          />
          <Tab
            label={`Défaites (${matches.filter((m) => m.winner?.id && m.winner.id !== userId).length})`}
          />
        </Tabs>

        {filteredMatches.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Aucun match trouvé
          </Typography>
        ) : (
          <List disablePadding>
            {filteredMatches.slice(0, 10).map((match) => {
              const isPlayer1 = match.player1.id === userId;
              const opponent = isPlayer1 ? match.player2 : match.player1;
              const isWin = match.winner?.id === userId;
              const opponentName =
                opponent.profile?.bladerName ?? opponent.name;

              return (
                <ListItem
                  key={match.id}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'action.hover',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={opponent.profile?.avatarUrl}
                      sx={{
                        bgcolor: isWin ? 'success.main' : 'error.main',
                      }}
                    >
                      {opponentName[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body1" fontWeight="medium">
                          vs {opponentName}
                        </Typography>
                        <Chip
                          label={isWin ? 'Victoire' : 'Défaite'}
                          size="small"
                          color={isWin ? 'success' : 'error'}
                        />
                        {match.score && (
                          <Typography variant="body2" color="text.secondary">
                            {match.score}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {match.tournament.name} • Round {match.round} •{' '}
                        {new Date(match.createdAt).toLocaleDateString('fr-FR')}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
