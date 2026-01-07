'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  MenuItem,
  Stack,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  EmojiEvents as MedalIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useSession } from '@/lib/auth-client'
import { useToast, TrophyIcon } from '@/components/ui'
import type { BeyType, ExperienceLevel, Profile } from '@prisma/client'

import SecuritySettings from '@/components/profile/SecuritySettings'

const BEYBLADE_TYPES: { value: BeyType; label: string }[] = [
  { value: 'ATTACK', label: 'Attaque' },
  { value: 'DEFENSE', label: 'Défense' },
  { value: 'STAMINA', label: 'Endurance' },
  { value: 'BALANCE', label: 'Équilibre' },
]

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Débutant' },
  { value: 'INTERMEDIATE', label: 'Intermédiaire' },
  { value: 'ADVANCED', label: 'Avancé' },
  { value: 'EXPERT', label: 'Expert' },
  { value: 'LEGEND', label: 'Légende' },
]

export default function ProfilePage() {
  const { data: session, isPending: sessionPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<(Profile & { wins?: number, losses?: number, tournamentWins?: number }) | null>(null)
  const [formData, setFormData] = useState({
    bladerName: '',
    favoriteType: 'ATTACK' as BeyType,
    experience: 'BEGINNER' as ExperienceLevel,
    bio: '',
  })

  const { showToast } = useToast()

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          bladerName: data.bladerName || session?.user.name || '',
          favoriteType: data.favoriteType || 'ATTACK',
          experience: data.experience || 'BEGINNER',
          bio: data.bio || '',
        })
      } else if (response.status === 404) {
        // Profile doesn't exist yet, we'll create it on first save or just show empty form
        setFormData((prev) => ({
          ...prev,
          bladerName: session?.user.name || '',
        }))
      }
    } catch {
      showToast('Erreur lors de la récupération du profil', 'error')
    } finally {
      setLoading(false)
    }
  }, [session, showToast])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session, fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        showToast('Profil mis à jour avec succès', 'success')
      } else {
        throw new Error('Failed to update')
      }
    } catch {
      showToast('Erreur lors de la mise à jour', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (sessionPending || (loading && session)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return (
      <Container maxWidth="sm" sx={{ py: 20, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Accès restreint
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Veuillez vous connecter pour accéder à votre profil.
        </Typography>
        <Button variant="contained" href="/sign-in">
          Se connecter
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Mon Profil
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
        Gérez votre identité de Blader et suivez vos performances
      </Typography>

      <Grid container spacing={4}>
        {/* Profile Card & Identity */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
                pt: 4,
                pb: 2,
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  src={session.user.image || undefined}
                  sx={{ width: 120, height: 120, mx: 'auto', border: '4px solid', borderColor: 'primary.main' }}
                >
                  {session.user.name?.charAt(0)}
                </Avatar>
                {profile?.experience === 'LEGEND' && (
                  <Chip
                    label="LÉGENDE"
                    color="warning"
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      fontWeight: 'bold',
                      boxShadow: 2,
                    }}
                  />
                )}
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {formData.bladerName || session.user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {session.user.email}
              </Typography>
              <Box sx={{ mt: 2, px: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {profile?.wins || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Victoires</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {profile?.losses || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Défaites</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {profile?.tournamentWins || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Titres</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MedalIcon color="primary" /> Badges
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Participez à des tournois pour débloquer des badges !
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Edit Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
                Paramètres du Blader
              </Typography>

              <Stack spacing={4}>
                <TextField
                  label="Nom de Blader"
                  fullWidth
                  value={formData.bladerName}
                  onChange={(e) => setFormData({ ...formData, bladerName: e.target.value })}
                  helperText="C'est le nom qui sera affiché dans les classements et tournois"
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="Type de Beyblade favori"
                      fullWidth
                      value={formData.favoriteType}
                      onChange={(e) => setFormData({ ...formData, favoriteType: e.target.value as BeyType })}
                    >
                      {BEYBLADE_TYPES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="Niveau d'expérience"
                      fullWidth
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value as ExperienceLevel })}
                    >
                      {EXPERIENCE_LEVELS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <TextField
                  label="Bio / Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Parlez-nous de vous et de vos combos préférés..."
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ px: 4 }}
                  >
                    Enregistrer les modifications
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <SecuritySettings />

          {/* Tournament History placeholder */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon color="primary" /> Mes Tournois
            </Typography>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                mt: 2,
              }}
            >
              <CardContent sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Vous n'avez pas encore participé à des tournois officiels.
                </Typography>
                <Button variant="text" href="/tournaments" sx={{ mt: 1 }}>
                  Voir les prochains tournois
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}
