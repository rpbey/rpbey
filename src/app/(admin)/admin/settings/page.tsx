'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { Refresh } from '@mui/icons-material'

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<{ env: Record<string, string> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/config')
      if (!res.ok) throw new Error('Failed to fetch config')
      const data = await res.json()
      setConfig(data)
    } catch {
      setError('Erreur lors du chargement de la configuration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Variables d'environnement du Dashboard
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton onClick={fetchConfig} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : config ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardHeader title="Variables d'environnement" />
          <CardContent>
            <Grid container spacing={2}>
              {Object.entries(config.env).map(([key, value]) => (
                <Grid size={{ xs: 12, md: 6 }} key={key}>
                  <TextField
                    fullWidth
                    label={key}
                    value={value}
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
        </Card>
      ) : null}
    </Container>
  )
}
