import { Send as SendIcon, Person as PersonIcon, Forum as ChannelIcon } from '@mui/icons-material';
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
  ToggleButtonGroup,
  ToggleButton,
  Box,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

interface Channel {
  id: string;
  name: string;
}

function BotMessengerContent() {
  const searchParams = useSearchParams();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [mode, setMode] = useState<'channel' | 'dm'>((searchParams.get('mode') as 'channel' | 'dm') || 'channel');
  const [channelId, setChannelId] = useState('');
  const [userId, setUserId] = useState(searchParams.get('userId') || '');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/bot/channels');
        if (response.ok) {
          const data = await response.json();
          setChannels(data.channels || []);
          if (data.channels?.length > 0) {
            setChannelId(data.channels[0].id);
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
    if (mode === 'channel' && !channelId) return;
    if (mode === 'dm' && !userId) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/bot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channelId: mode === 'channel' ? channelId : undefined,
          userId: mode === 'dm' ? userId : undefined,
          content 
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setContent('');
        if (mode === 'dm' && !searchParams.get('userId')) setUserId('');
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
          Messagerie Bot
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Envoyez un message via le bot RPB vers un salon ou un utilisateur.
        </Typography>

        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, next) => next && setMode(next)}
              size="small"
              color="primary"
            >
              <ToggleButton value="channel" sx={{ px: 3 }}>
                <ChannelIcon sx={{ mr: 1, fontSize: 18 }} /> Salon
              </ToggleButton>
              <ToggleButton value="dm" sx={{ px: 3 }}>
                <PersonIcon sx={{ mr: 1, fontSize: 18 }} /> DM (Privé)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {mode === 'channel' ? (
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
          ) : (
            <TextField
              fullWidth
              size="small"
              label="Discord ID de l'utilisateur"
              placeholder="Ex: 790281823212273734"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            placeholder={mode === 'dm' ? "Message privé..." : "Message public..."}
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
            disabled={loading || !content.trim() || (mode === 'channel' ? !channelId : !userId)}
          >
            {loading ? 'Envoi...' : mode === 'dm' ? 'Envoyer le DM' : 'Envoyer dans le salon'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function BotMessenger() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BotMessengerContent />
    </Suspense>
  );
}
