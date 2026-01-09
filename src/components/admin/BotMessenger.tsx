'use client';

import { Send as SendIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

const CHANNELS = [
  { id: '1333203623471087708', name: 'Général / Social' },
  { id: 'annonces', name: 'Annonces (Auto-détection)' },
  { id: 'annonce-tournois', name: 'Annonce Tournois (Auto-détection)' },
];

export function BotMessenger() {
  const [channelId, setChannelId] = useState(CHANNELS[0]!.id);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/bot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, content }),
      });

      if (response.ok) {
        setSuccess(true);
        setContent('');
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Envoyer un message Discord
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Envoyez un message instantané via le bot RPB.
        </Typography>

        <Stack spacing={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="channel-select-label">Canal</InputLabel>
            <Select
              labelId="channel-select-label"
              value={channelId}
              label="Canal"
              onChange={(e) => setChannelId(e.target.value)}
            >
              {CHANNELS.map((ch) => (
                <MenuItem key={ch.id} value={ch.id}>
                  {ch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            placeholder="Écrivez votre message ici..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {error && (
            <Alert severity="error" size="small">
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" size="small">
              Message envoyé avec succès !
            </Alert>
          )}

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={loading || !content.trim()}
          >
            {loading ? 'Envoi...' : 'Envoyer le message'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
