'use client';

import { Box, Card, Paper, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function LiveConsoleClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleLog = (log: LogEntry) => {
      setLogs((prev) => {
        const newLogs = [...prev, log];
        if (newLogs.length > 500) newLogs.shift();
        return newLogs;
      });
    };

    socket.on('log_new', handleLog);
    socket.connect();

    return () => {
      socket.off('log_new', handleLog);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <Card
      sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}
    >
      <Typography variant="h6" gutterBottom>
        Console Live du Bot
      </Typography>
      <Paper
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          bgcolor: '#1e1e1e',
          color: '#d4d4d4',
          p: 2,
          fontFamily: 'monospace',
          fontSize: '0.85rem',
        }}
      >
        {logs.length === 0 && (
          <Typography color="text.secondary">En attente de logs...</Typography>
        )}
        {logs.map((log, i) => (
          <Box key={i} sx={{ mb: 0.5, display: 'flex', gap: 1 }}>
            <span style={{ color: '#888' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span
              style={{
                color:
                  log.level === 'INFO'
                    ? '#4caf50'
                    : log.level === 'WARN'
                      ? '#ff9800'
                      : log.level === 'ERROR'
                        ? '#f44336'
                        : '#2196f3',
                fontWeight: 'bold',
              }}
            >
              [{log.level}]
            </span>
            <span>{log.message}</span>
          </Box>
        ))}
      </Paper>
    </Card>
  );
}
