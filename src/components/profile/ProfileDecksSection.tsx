'use client';

import { Build } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import useSWR from 'swr';
import { DeckCard, type Deck } from '@/components/deck/DeckCard';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ProfileDecksSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ProfileDecksSection({ userId, isOwnProfile }: ProfileDecksSectionProps) {
  const { data, isLoading } = useSWR<{ data: Deck[] }>(
    isOwnProfile ? '/api/decks' : null,
    fetcher,
  );

  const decks = data?.data;

  // Only show for own profile (decks are private)
  if (!isOwnProfile) return null;

  if (isLoading) {
    return (
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[0, 1, 2].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="800">
            Mes Decks
          </Typography>
          <Button
            component={Link}
            href="/builder"
            size="small"
            startIcon={<Build />}
            variant="outlined"
            sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
          >
            Deck Builder
          </Button>
        </Box>

        {!decks || decks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" gutterBottom>
              Aucun deck sauvegardé
            </Typography>
            <Button
              component={Link}
              href="/builder"
              variant="contained"
              startIcon={<Build />}
              sx={{ mt: 1, borderRadius: 2, fontWeight: 'bold' }}
            >
              Créer mon premier deck
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {decks.map((deck) => (
              <Grid key={deck.id} size={{ xs: 12, sm: 6 }}>
                <DeckCard deck={deck} />
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
