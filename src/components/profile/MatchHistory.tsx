'use client';

import SportsMmaIcon from '@mui/icons-material/SportsMma';
import { alpha, useTheme } from '@mui/material';
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
  const theme = useTheme();

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
      <Card
        elevation={0}
        sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider' }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Historique des matchs
          </Typography>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={72}
              sx={{ mb: 1, borderRadius: 2 }}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 6,
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(180deg, ${alpha(
          theme.palette.background.paper,
          0.8,
        )} 0%, ${alpha(theme.palette.background.default, 0.5)} 100%)`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <SportsMmaIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Historique des matchs
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              mr: 1,
            },
            '& .Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          <Tab label={`Tous (${matches.length})`} />
          <Tab
            label={`Victoires (${matches.filter((m) => m.winner?.id === userId).length})`}
          />
          <Tab
            label={`Défaites (${
              matches.filter((m) => m.winner?.id && m.winner.id !== userId)
                .length
            })`}
          />
        </Tabs>

        {filteredMatches.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              borderRadius: 4,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              fontWeight="medium"
            >
              Aucun match trouvé pour cette catégorie
            </Typography>
          </Box>
        ) : (
          <List
            disablePadding
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
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
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.1),
                      transform: 'translateX(4px)',
                      borderColor: isWin ? 'success.main' : 'error.main',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={opponent.profile?.avatarUrl}
                      sx={{
                        bgcolor: isWin ? 'success.main' : 'error.main',
                        border: '2px solid',
                        borderColor: 'background.paper',
                      }}
                    >
                      {opponentName[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography variant="body1" fontWeight="bold">
                          vs {opponentName}
                        </Typography>
                        <Chip
                          label={isWin ? 'Victoire' : 'Défaite'}
                          size="small"
                          color={isWin ? 'success' : 'error'}
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                          }}
                        />
                        {match.score && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight="medium"
                            sx={{ ml: 'auto' }}
                          >
                            {match.score}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
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
