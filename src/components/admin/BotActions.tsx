'use client';

import {
  Refresh as RefreshIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui';

export function BotActions() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestartBot = async () => {
    if (!confirm('Êtes-vous sûr de vouloir redémarrer le bot ?')) return;

    setIsRestarting(true);
    try {
      const response = await fetch('/api/admin/bot/restart', {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Redémarrage du bot demandé...', 'success');
      } else {
        showToast('Erreur lors du redémarrage du bot', 'error');
      }
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<RefreshIcon />}
            fullWidth
            onClick={handleRestartBot}
            disabled={isRestarting}
          >
            {isRestarting ? 'Redémarrage...' : 'Redémarrer le bot'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<TerminalIcon />}
            fullWidth
            onClick={() => router.push('/admin/bot/logs')}
          >
            Voir les logs
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
