'use client';

import { Send as SendIcon } from '@mui/icons-material';
import {
  Alert,
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
import { useEffect, useState } from 'react';

interface Channel {
  id: string;
  name: string;
}

export function BotMessenger() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/bot/config');
        if (response.ok) {
          const data = await response.json();
          const channelList = Object.entries(data.constants.Channels).map(
            ([name, id]) => ({
              id: id as string,
              name: name,
            }),
          );
          setChannels(channelList);
          if (channelList.length > 0) {
            setChannelId(channelList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch channels:', err);
      }
    };
    fetchChannels();
  }, []);

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
        setError(data.error || "Erreur lors de l'envoi");
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
              disabled={channels.length === 0}
            >
              {channels.map((ch) => (
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

          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">Message envoyé avec succès !</Alert>
          )}

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={loading || !content.trim() || !channelId}
          >
            {loading ? 'Envoi...' : 'Envoyer le message'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
