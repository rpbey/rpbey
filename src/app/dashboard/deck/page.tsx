'use client';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { PageHeader } from '@/components/ui';

export default function DeckRedirectPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container maxWidth="md">
      <PageHeader
        title="📦 Gestion des Decks"
        description="Les outils de gestion de decks ont déménagé !"
      />

      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" fontWeight="800" gutterBottom>
            Tout se passe maintenant sur Discord !
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Pour simplifier l'expérience et faciliter les tournois, la création
            et la gestion de vos decks se fait désormais directement via notre
            bot.
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🚀 Comment créer un deck ?
              </Typography>
              <Typography color="text.secondary" paragraph>
                Utilisez la commande suivante dans n'importe quel salon du
                serveur Discord RPB :
              </Typography>
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  p: 2,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  component="code"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    color: 'primary.main',
                  }}
                >
                  /deck create nom:MonDeck
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopy('/deck create nom:MonDeck')}
                >
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🛠️ Comment modifier mon deck ?
              </Typography>
              <Typography color="text.secondary" paragraph>
                Une fois votre deck créé (et actif), vous pouvez modifier ses 3
                slots (emplacements) un par un. Le bot vous proposera
                automatiquement les pièces disponibles.
              </Typography>
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  p: 2,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  component="code"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: 'text.primary',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  /deck edit slot:1 blade:DranSword ratchet:3-60 bit:Flat
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  *Exemple pour modifier la 1ère toupie du deck actif.*
                </Typography>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🎲 Générateur Aléatoire
              </Typography>
              <Typography color="text.secondary" paragraph>
                Besoin d'inspiration ? Le générateur aléatoire est aussi
                disponible sur Discord :
              </Typography>
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  p: 2,
                  borderRadius: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Chip
                  label="/aleatoire"
                  color="secondary"
                  sx={{ fontWeight: 'bold' }}
                />
                <Typography variant="body2">
                  Génère un combo complet avec ses stats !
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
