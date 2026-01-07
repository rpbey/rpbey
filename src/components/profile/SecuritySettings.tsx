'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material'
import {
  Security as SecurityIcon,
  Smartphone as SmartphoneIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { authClient } from '@/lib/auth-client'
import { useToast } from '@/components/ui'

export default function SecuritySettings() {
  const { data: session } = authClient.useSession()
  const [openEnable, setOpenEnable] = useState(false)
  const [openDisable, setOpenDisable] = useState(false)
  const [step, setStep] = useState<'password' | 'qr' | 'backup'>('password')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [totpURI, setTotpURI] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const { showToast } = useToast()

  // We assume 2FA is enabled if the user object has the flag (added via schema update)
  // or via checking a specific endpoint. 
  // For now, we rely on session.user.twoFactorEnabled if available, or we might need to fetch it.
  // Since we just updated the schema, the session might not have it yet unless we re-login or Better Auth syncs it.
  // We'll trust the session property if it exists.
  const is2FAEnabled = (session?.user as any)?.twoFactorEnabled || false

  const handleEnableStart = () => {
    setStep('password')
    setPassword('')
    setOpenEnable(true)
  }

  const handlePasswordSubmit = async () => {
    setLoading(true)
    try {
      const res = await authClient.twoFactor.enable({
        password,
      })
      if (res.error) {
        showToast(res.error.message || 'Mot de passe incorrect', 'error')
      } else {
        setTotpURI(res.data.totpURI)
        setBackupCodes(res.data.backupCodes)
        setStep('qr')
      }
    } catch (e) {
      showToast('Une erreur est survenue', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyTOTP = async () => {
    setLoading(true)
    try {
      const res = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: true,
      })
      if (res.error) {
        showToast(res.error.message || 'Code invalide', 'error')
      } else {
        showToast('A2F activée avec succès', 'success')
        setStep('backup')
      }
    } catch (e) {
      showToast('Une erreur est survenue', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      const res = await authClient.twoFactor.disable({
        password,
      })
      if (res.error) {
        showToast(res.error.message || 'Mot de passe incorrect', 'error')
      } else {
        showToast('A2F désactivée', 'success')
        setOpenDisable(false)
        setPassword('')
        // Optionally refresh session
        window.location.reload()
      }
    } catch (e) {
      showToast('Une erreur est survenue', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        mt: 4,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" /> Sécurité
        </Typography>

        <Stack spacing={3} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Authentification à deux facteurs (A2F)
                {is2FAEnabled ? (
                  <Chip label="Activé" color="success" size="small" />
                ) : (
                  <Chip label="Désactivé" color="default" size="small" />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Protégez votre compte avec une couche de sécurité supplémentaire.
              </Typography>
            </Box>
            
            {is2FAEnabled ? (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setOpenDisable(true)}
              >
                Désactiver l'A2F
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleEnableStart}
              >
                Activer l'A2F
              </Button>
            )}
          </Box>
        </Stack>
      </CardContent>

      {/* Enable 2FA Dialog */}
      <Dialog open={openEnable} onClose={() => setOpenEnable(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configuration de l'A2F</DialogTitle>
        <DialogContent>
          {step === 'password' && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography>
                Pour activer l'authentification à deux facteurs, veuillez confirmer votre mot de passe.
              </Typography>
              <Alert severity="info">
                Si vous vous connectez uniquement via Discord, vous devez d'abord définir un mot de passe pour utiliser cette fonctionnalité.
              </Alert>
              <TextField
                type="password"
                label="Mot de passe"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Stack>
          )}

          {step === 'qr' && (
            <Stack spacing={3} sx={{ pt: 1, alignItems: 'center' }}>
              <Typography align="center">
                Scannez ce QR Code avec votre application d'authentification (Google Authenticator, Authy, etc.).
              </Typography>
              
              <Box 
                component="img"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpURI)}`}
                alt="QR Code A2F"
                sx={{ width: 200, height: 200, border: '1px solid #eee', borderRadius: 2 }}
              />

              <TextField
                label="Code de vérification (6 chiffres)"
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value)}
                slotProps={{
                    htmlInput: { maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }
                }}
              />
            </Stack>
          )}

          {step === 'backup' && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="warning">
                IMPORTANT : Sauvegardez ces codes de secours en lieu sûr. Ils vous permettront d'accéder à votre compte si vous perdez votre appareil d'authentification.
              </Alert>
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, fontFamily: 'monospace' }}>
                <Grid container spacing={1}>
                  {/* Need to import Grid from MUI or use Box */}
                  {backupCodes.map((code) => (
                    <Box key={code} component="span" sx={{ display: 'block', width: '50%', float: 'left' }}>
                      {code}
                    </Box>
                  ))}
                  <Box sx={{ clear: 'both' }} />
                </Grid>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEnable(false)}>Annuler</Button>
          {step === 'password' && (
            <Button 
                onClick={handlePasswordSubmit} 
                variant="contained" 
                disabled={loading || !password}
            >
              {loading ? <CircularProgress size={24} /> : 'Continuer'}
            </Button>
          )}
          {step === 'qr' && (
            <Button 
                onClick={handleVerifyTOTP} 
                variant="contained"
                disabled={loading || code.length < 6}
            >
              {loading ? <CircularProgress size={24} /> : 'Vérifier'}
            </Button>
          )}
          {step === 'backup' && (
            <Button 
                onClick={() => {
                    setOpenEnable(false)
                    window.location.reload()
                }} 
                variant="contained"
            >
              J'ai sauvegardé mes codes
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={openDisable} onClose={() => setOpenDisable(false)}>
        <DialogTitle>Désactiver l'A2F</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
                <Typography>
                    Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs ? Votre compte sera moins sécurisé.
                </Typography>
                <TextField
                    type="password"
                    label="Confirmez votre mot de passe"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDisable(false)}>Annuler</Button>
          <Button 
            onClick={handleDisable} 
            color="error" 
            variant="contained"
            disabled={loading || !password}
          >
            {loading ? <CircularProgress size={24} /> : 'Désactiver'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
