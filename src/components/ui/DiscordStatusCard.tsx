'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { DiscordStats, TeamGroup } from '@/lib/discord-data';
import { LOGO_VARIANTS } from '@/lib/role-colors';
import { api } from '@/lib/standard-api';
import { DiscordRoleBadge } from './DiscordRoleBadge';

interface DiscordStatusCardProps {
  initialStats?: DiscordStats | null;
  initialTeam?: TeamGroup[];
}

export function DiscordStatusCard({
  initialStats,
  initialTeam,
}: DiscordStatusCardProps) {
  const [stats, setStats] = useState<DiscordStats | null>(initialStats || null);
  const [team, setTeam] = useState<TeamGroup[]>(initialTeam || []);
  const [loading, setLoading] = useState(!initialStats);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogoIndex((prev) => (prev + 1) % LOGO_VARIANTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, teamData] = await Promise.all([
          api.get<DiscordStats>('/api/discord/stats', { cache: 'no-store' }),
          api.get<{ team: TeamGroup[] }>('/api/discord/team', {
            cache: 'no-store',
          }),
        ]);
        setStats(statsData);
        setTeam(teamData.team);
      } catch (error) {
        console.error('Failed to fetch discord data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!initialStats) {
      fetchData();
    }

    // Poll for updates every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [initialStats]);

  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        width="100%"
        height={320}
        sx={{ maxWidth: 450, borderRadius: 4 }}
      />
    );
  }

  const onlineCount = stats?.onlineCount || 0;
  const totalCount = stats?.memberCount || 0;
  const serverName = stats?.serverName || 'RPB Community';

  return (
    <Card
      variant="outlined"
      sx={{
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 450,
        width: '100%',
        bgcolor: 'surface.containerLow',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: '#dc2626', // RPB Red
          boxShadow: '0 12px 48px rgba(220, 38, 38, 0.15)',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          pb: 2,
          bgcolor: (theme) => alpha(theme.palette.divider, 0.03),
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              position: 'relative',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={LOGO_VARIANTS[currentLogoIndex]?.src}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  src={LOGO_VARIANTS[currentLogoIndex]?.src || '/logo.png'}
                  alt={`${LOGO_VARIANTS[currentLogoIndex]?.role || 'RPB'} Logo`}
                  width={48}
                  height={48}
                  style={{
                    objectFit: 'contain',
                    filter: `drop-shadow(0 0 8px ${alpha(LOGO_VARIANTS[currentLogoIndex]?.color || '#dc2626', 0.6)})`,
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{ color: 'text.primary', lineHeight: 1.2, mb: 0.5 }}
            >
              {serverName.toUpperCase()}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'text.disabled',
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {totalCount.toLocaleString()} MEMBRES
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Divider />

      {/* Team Section */}
      <Box
        sx={{
          p: 2,
          maxHeight: 280,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: '4px',
          },
        }}
      >
        <Stack spacing={2.5}>
          {team.map((group) => (
            <Box key={group.roleId}>
              <Box sx={{ mb: 1.5, display: 'flex' }}>
                <DiscordRoleBadge
                  roleType={group.roleType}
                  size="small"
                  variant="glow"
                  duration={2}
                />
              </Box>
              <Stack spacing={1}>
                <AnimatePresence>
                  {group.members.map((member, idx) => (
                    <Box
                      component={motion.div}
                      key={member.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 0.8,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: (theme) =>
                            alpha(theme.palette.action.hover, 0.05),
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Avatar
                        src={member.avatar || undefined}
                        sx={{
                          width: 32,
                          height: 32,
                          border: '1.5px solid',
                          borderColor: (theme) =>
                            alpha(theme.palette.divider, 0.1),
                        }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: 'text.primary' }}
                      >
                        {member.displayName}
                      </Typography>
                      {/* Removed username to reduce clutter/basic info feel, kept display name only? 
                          Or keep username but maybe style it differently? 
                          The user said "no discord basic info", maybe they mean the 'status' text?
                          I'll keep username as it's useful identity. 
                      */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.disabled',
                          opacity: 0.7,
                          ml: 'auto',
                        }}
                      >
                        @{member.username}
                      </Typography>
                    </Box>
                  ))}
                </AnimatePresence>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Button
          component="a"
          href="https://discord.gg/rpb"
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          fullWidth
          sx={{
            bgcolor: '#5865F2',
            color: 'white',
            '&:hover': {
              bgcolor: '#4752C4',
              boxShadow: '0 4px 12px rgba(88, 101, 242, 0.4)',
            },
            py: 1.2,
            fontSize: '0.9rem',
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 800,
            letterSpacing: '0.02em',
          }}
        >
          REJOINDRE LE SERVEUR
        </Button>
      </Box>
    </Card>
  );
}
