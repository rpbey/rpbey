'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  CardHeader,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Collapse,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material'

interface BotConfig {
  env: Record<string, string>
  constants: {
    RPB: Record<string, string>
    Colors: Record<string, string>
    Channels: Record<string, string>
    Roles: Record<string, string>
  }
}

const sectionIcons: Record<string, string> = {
  RPB: '🏷️',
  Colors: '🎨',
  Channels: '📢',
  Roles: '👥',
}

export default function BotConfigPage() {
  const [config, setConfig] = useState<BotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    env: true,
    RPB: true,
    Colors: false,
    Channels: false,
    Roles: false,
  })
  const [showSecrets, setShowSecrets] = useState(false)

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/bot/config')
      if (!response.ok) throw new Error('Failed to fetch config')
      
      const data = await response.json()
      setConfig(data)
      setError(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const isSensitive = (key: string) => {
    const sensitivePatterns = ['TOKEN', 'SECRET', 'PASSWORD', 'KEY', 'PRIVATE']
    return sensitivePatterns.some((p) => key.toUpperCase().includes(p))
  }

  const formatColorValue = (value: string) => {
    // Convert hex number to CSS color
    if (value.startsWith('0x')) {
      return `#${value.slice(2).padStart(6, '0')}`
    }
    return value
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          ⚙️ Configuration du Bot
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title={showSecrets ? 'Masquer les secrets' : 'Afficher les secrets'}>
            <IconButton onClick={() => setShowSecrets(!showSecrets)}>
              {showSecrets ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchConfig} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Cette page affiche la configuration actuelle du bot. Les modifications doivent être faites via les fichiers de configuration et nécessitent un redémarrage du bot.
      </Alert>

      {config && (
        <Grid container spacing={3}>
          {/* Environment Variables */}
          <Grid size={12}>
            <Card>
              <CardHeader
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6">🔐 Variables d'environnement</Typography>
                    <Chip label={Object.keys(config.env).length} size="small" />
                  </Stack>
                }
                action={
                  <IconButton onClick={() => toggleSection('env')}>
                    {expandedSections.env ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                }
                sx={{ cursor: 'pointer' }}
                onClick={() => toggleSection('env')}
              />
              <Collapse in={expandedSections.env}>
                <CardContent>
                  <Grid container spacing={2}>
                    {Object.entries(config.env).map(([key, value]) => (
                      <Grid size={{ xs: 12, md: 6 }} key={key}>
                        <TextField
                          fullWidth
                          label={key}
                          value={
                            isSensitive(key) && !showSecrets
                              ? '••••••••'
                              : value
                          }
                          size="small"
                          slotProps={{
                            input: {
                              readOnly: true,
                              sx: { fontFamily: 'monospace' },
                            },
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>

          {/* Constants Sections */}
          {Object.entries(config.constants).map(([section, values]) => (
            <Grid size={{ xs: 12, md: 6 }} key={section}>
              <Card>
                <CardHeader
                  title={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6">
                        {sectionIcons[section] || '📋'} {section}
                      </Typography>
                      <Chip label={Object.keys(values).length} size="small" />
                    </Stack>
                  }
                  action={
                    <IconButton onClick={() => toggleSection(section)}>
                      {expandedSections[section] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  }
                  sx={{ cursor: 'pointer' }}
                  onClick={() => toggleSection(section)}
                />
                <Collapse in={expandedSections[section]}>
                  <CardContent>
                    {Object.keys(values).length === 0 ? (
                      <Typography color="text.secondary" textAlign="center" py={2}>
                        Aucune valeur définie
                      </Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {Object.entries(values).map(([key, value]) => (
                          <Box key={key}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                fontFamily="monospace"
                              >
                                {key}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {section === 'Colors' && (
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: formatColorValue(value),
                                      border: '2px solid',
                                      borderColor: 'divider',
                                    }}
                                  />
                                )}
                                <Typography
                                  variant="body1"
                                  fontFamily="monospace"
                                  sx={{
                                    bgcolor: 'action.hover',
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                  }}
                                >
                                  {value}
                                </Typography>
                              </Stack>
                            </Stack>
                            <Divider sx={{ mt: 1.5 }} />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Collapse>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
