'use client';

import {
  CheckCircle,
  Error as ErrorIcon,
  FilterList,
  Pause,
  PlayArrow,
  Refresh,
  Terminal,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useCallback, useEffect, useRef, useState } from 'react';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface BotStatus {
  status: 'running' | 'starting' | 'offline';
  uptimeFormatted: string;
  ping: number;
  memoryUsage: string;
  guilds: number;
  users: number;
}

const LEVEL_COLORS: Record<string, string> = {
  INFO: '#4caf50',
  WARN: '#ff9800',
  ERROR: '#f44336',
  DEBUG: '#2196f3',
};

const POLL_INTERVAL = 3000;

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) setStatus(await res.json());
      else setStatus(null);
    } catch {
      setStatus(null);
    }
  }, []);

  const fetchLogs = useCallback(
    async (initial = false) => {
      if (paused && !initial) return;
      try {
        const params = new URLSearchParams({ tail: '500' });
        if (!initial && lastTimestamp.current) {
          params.set('since', lastTimestamp.current);
        }
        const res = await fetch(`/api/bot/logs?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        const newLogs = data.logs as LogEntry[];

        if (initial) {
          setLogs(newLogs);
        } else if (newLogs.length > 0) {
          setLogs((prev) => {
            const combined = [...prev, ...newLogs];
            return combined.length > 1000
              ? combined.slice(combined.length - 1000)
              : combined;
          });
        }

        if (newLogs.length > 0) {
          lastTimestamp.current =
            newLogs[newLogs.length - 1]?.timestamp ?? null;
        }
      } catch {
        // Silently fail on poll errors
      }
    },
    [paused],
  );

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchLogs(true)]);
      setLoading(false);
    };
    void init();
  }, [fetchStatus, fetchLogs]);

  // Polling
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      void fetchLogs();
      void fetchStatus();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [paused, fetchLogs, fetchStatus]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [autoScroll]);

  const handleRefresh = async () => {
    lastTimestamp.current = null;
    setLoading(true);
    await Promise.all([fetchStatus(), fetchLogs(true)]);
    setLoading(false);
  };

  const handleFilterChange = (
    _: React.MouseEvent<HTMLElement>,
    newFilter: string[],
  ) => {
    setFilter(newFilter);
  };

  const filteredLogs =
    filter.length > 0 ? logs.filter((l) => filter.includes(l.level)) : logs;

  const isOnline = status?.status === 'running';

  return (
    <Box sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Console & Logs
          </Typography>
          <Typography color="text.secondary">
            Surveillance en temps réel du bot Discord
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={isOnline ? <CheckCircle /> : <ErrorIcon />}
            label={isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
            color={isOnline ? 'success' : 'error'}
            variant="outlined"
          />
          <IconButton onClick={handleRefresh} size="small" disabled={loading}>
            <Refresh />
          </IconButton>
        </Stack>
      </Box>

      {/* Status Cards */}
      {status && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Uptime', value: status.uptimeFormatted },
            { label: 'Ping', value: `${status.ping}ms` },
            { label: 'Mémoire', value: status.memoryUsage },
            { label: 'Utilisateurs', value: String(status.users) },
          ].map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Controls */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ mb: 2 }}
        flexWrap="wrap"
        useFlexGap
      >
        <Button
          variant={paused ? 'contained' : 'outlined'}
          color={paused ? 'warning' : 'primary'}
          startIcon={paused ? <PlayArrow /> : <Pause />}
          onClick={() => setPaused(!paused)}
          size="small"
        >
          {paused ? 'Reprendre' : 'Pause'}
        </Button>

        <Stack direction="row" spacing={1} alignItems="center">
          <FilterList fontSize="small" color="action" />
          <ToggleButtonGroup
            value={filter}
            onChange={handleFilterChange}
            size="small"
          >
            <ToggleButton value="INFO" sx={{ color: LEVEL_COLORS.INFO }}>
              INFO
            </ToggleButton>
            <ToggleButton value="WARN" sx={{ color: LEVEL_COLORS.WARN }}>
              WARN
            </ToggleButton>
            <ToggleButton value="ERROR" sx={{ color: LEVEL_COLORS.ERROR }}>
              ERROR
            </ToggleButton>
            <ToggleButton value="DEBUG" sx={{ color: LEVEL_COLORS.DEBUG }}>
              DEBUG
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 'auto' }}
        >
          {filteredLogs.length} entrées
          {paused && ' (en pause)'}
        </Typography>
      </Stack>

      {/* Log Console */}
      <Card sx={{ height: '65vh', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#1a1a2e',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Terminal sx={{ fontSize: 18, color: '#4caf50' }} />
          <Typography
            variant="caption"
            sx={{ color: '#aaa', fontFamily: 'monospace' }}
          >
            rpb-bot — live console
          </Typography>
          {loading && <CircularProgress size={14} sx={{ ml: 1 }} />}
        </Box>
        <Paper
          ref={scrollRef}
          onScroll={() => {
            if (!scrollRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
          }}
          sx={{
            flex: 1,
            overflowY: 'auto',
            bgcolor: '#0d1117',
            color: '#c9d1d9',
            p: 2,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            borderRadius: 0,
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-track': { bgcolor: '#161b22' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#30363d',
              borderRadius: 4,
            },
          }}
        >
          {filteredLogs.length === 0 && !loading && (
            <Typography sx={{ color: '#484f58', fontStyle: 'italic' }}>
              En attente de logs...
            </Typography>
          )}
          {filteredLogs.map((log, i) => (
            <Box
              key={`${log.timestamp}-${i}`}
              sx={{
                display: 'flex',
                gap: 1.5,
                py: 0.15,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
              }}
            >
              <span style={{ color: '#484f58', flexShrink: 0 }}>
                {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
              </span>
              <span
                style={{
                  color: LEVEL_COLORS[log.level] || '#8b949e',
                  fontWeight: 700,
                  flexShrink: 0,
                  minWidth: 42,
                }}
              >
                {log.level}
              </span>
              <span
                style={{
                  color:
                    log.level === 'ERROR'
                      ? '#ffa198'
                      : log.level === 'WARN'
                        ? '#f0c674'
                        : '#c9d1d9',
                  wordBreak: 'break-word',
                }}
              >
                {log.message}
              </span>
            </Box>
          ))}
        </Paper>
      </Card>
    </Box>
  );
}
