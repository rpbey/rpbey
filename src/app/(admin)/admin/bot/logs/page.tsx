'use client';

import {
  Clear as ClearIcon,
  Download as DownloadIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const levelColors: Record<LogEntry['level'], string> = {
  INFO: '#4caf50',
  WARN: '#ff9800',
  ERROR: '#f44336',
  DEBUG: '#2196f3',
};

export default function BotLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('');
  const [tail, setTail] = useState(100);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/bot/logs?tail=${tail}`);
      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [tail]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return (
      log.message.toLowerCase().includes(searchLower) ||
      log.level.toLowerCase().includes(searchLower)
    );
  });

  const handleDownload = () => {
    const content = logs
      .map((log) => `${log.timestamp} - ${log.level} - ${log.message}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={600}>
          🤖 Logs du Bot
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {autoRefresh ? (
                  <PlayIcon fontSize="small" />
                ) : (
                  <PauseIcon fontSize="small" />
                )}
                <Typography variant="body2">Auto-refresh</Typography>
              </Stack>
            }
          />

          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchLogs} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Télécharger">
            <IconButton onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          size="small"
          placeholder="Filtrer les logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 300 }}
          slotProps={{
            input: {
              endAdornment: filter && (
                <IconButton size="small" onClick={() => setFilter('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            },
          }}
        />

        <TextField
          size="small"
          type="number"
          label="Lignes"
          value={tail}
          onChange={(e) => setTail(Number(e.target.value))}
          sx={{ width: 100 }}
        />

        <Stack direction="row" spacing={1}>
          {(['INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map((level) => {
            const count = logs.filter((l) => l.level === level).length;
            return (
              <Chip
                key={level}
                label={`${level}: ${count}`}
                size="small"
                sx={{
                  bgcolor: `${levelColors[level]}20`,
                  color: levelColors[level],
                  fontWeight: 500,
                }}
                onClick={() => setFilter(level)}
              />
            );
          })}
        </Stack>
      </Stack>

      <Paper
        ref={containerRef}
        sx={{
          bgcolor: '#0d1117',
          color: '#c9d1d9',
          p: 2,
          borderRadius: 2,
          height: 'calc(100vh - 280px)',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
        }}
      >
        {loading && logs.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress size={40} />
          </Box>
        ) : filteredLogs.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Aucun log trouvé
          </Typography>
        ) : (
          <>
            {filteredLogs.map((log, index) => (
              <Box
                key={`${log.timestamp}-${index}`}
                sx={{
                  py: 0.5,
                  px: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                <Typography component="span" sx={{ color: '#8b949e', mr: 2 }}>
                  {formatTimestamp(log.timestamp)}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: levelColors[log.level],
                    fontWeight: 600,
                    mr: 2,
                    minWidth: 50,
                    display: 'inline-block',
                  }}
                >
                  {log.level}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: log.level === 'ERROR' ? '#f44336' : '#c9d1d9',
                  }}
                >
                  {log.message}
                </Typography>
              </Box>
            ))}
            <div ref={logsEndRef} />
          </>
        )}
      </Paper>

      <Stack direction="row" justifyContent="space-between" mt={2}>
        <Typography variant="body2" color="text.secondary">
          {filteredLogs.length} / {logs.length} logs affichés
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </Typography>
      </Stack>
    </Box>
  );
}
