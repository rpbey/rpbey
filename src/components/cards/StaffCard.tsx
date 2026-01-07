'use client'

import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  alpha,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material'
import { motion } from 'framer-motion'
import { DiscordIcon } from '@/components/ui/Icons'
import { RoleColors, DiscordRoleMapping } from '@/lib/role-colors'
import { RoleLogo } from '@/components/ui/RoleLogo'

interface StaffCardProps {
  member: {
    name: string
    role: string
    imageUrl?: string | null
    teamId: string
    discordId?: string | null
  }
}

const TEAM_LABELS: Record<string, string> = {
  admin: 'Administration',
  rh: 'Ressources Humaines',
  mod: 'Modération',
  staff: 'Staff',
  dev: 'Développement',
  event: 'Événementiel',
  media: 'Média / Design',
}

const TEAM_COLORS: Record<string, string> = {
  admin: RoleColors.ADMIN.hex,
  rh: RoleColors.RH.hex,
  mod: RoleColors.MODO.hex,
  staff: RoleColors.STAFF.hex,
  dev: '#10b981',
  event: '#f59e0b',
  media: '#8b5cf6',
}

export function StaffCard({ member }: StaffCardProps) {
  const theme = useTheme()
  const color = TEAM_COLORS[member.teamId] || theme.palette.primary.main
  const teamLabel = TEAM_LABELS[member.teamId] || member.teamId
  const roleType = member.discordId ? DiscordRoleMapping[member.discordId] : undefined

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -8 }}
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.3s',
        '&:hover': {
          borderColor: alpha(color, 0.5),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: color,
        },
      }}
    >
      <CardContent sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
        {member.discordId && (
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <Tooltip title="Profil Discord" arrow>
              <IconButton
                size="small"
                component="a"
                href={`https://discord.com/users/${member.discordId}`}
                target="_blank"
                sx={{
                  color: 'text.disabled',
                  '&:hover': { color: '#5865F2', bgcolor: alpha('#5865F2', 0.1) },
                }}
              >
                <DiscordIcon size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {roleType ? (
          <Box sx={{ mx: 'auto', mb: 2, display: 'flex', justifyContent: 'center' }}>
            <RoleLogo role={roleType} size={100} />
          </Box>
        ) : (
          <Avatar
            src={member.imageUrl || undefined}
            sx={{
              width: 100,
              height: 100,
              mx: 'auto',
              mb: 2,
              border: `4px solid ${alpha(color, 0.1)}`,
              fontSize: '2rem',
              fontWeight: 'bold',
              bgcolor: alpha(color, 0.1),
              color: color,
              boxShadow: `0 8px 16px ${alpha(color, 0.15)}`,
            }}
          >
            {member.name.charAt(0)}
          </Avatar>
        )}
        
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
          {member.name}
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            color: color,
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            mb: 2,
          }}
        >
          {member.role}
        </Typography>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: 10,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: color,
              mr: 1,
            }}
          />
          <Typography variant="caption" fontWeight="medium" color="text.secondary">
            {teamLabel}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
