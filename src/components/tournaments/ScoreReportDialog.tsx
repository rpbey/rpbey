'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Avatar,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material'

interface ScoreReportDialogProps {
  open: boolean
  onClose: () => void
  onReport: (data: { winnerId: string; score: string }) => void
  match: {
    player1: { id: string; name: string; avatarUrl?: string } | null
    player2: { id: string; name: string; avatarUrl?: string } | null
  }
}

export function ScoreReportDialog({ open, onClose, onReport, match }: ScoreReportDialogProps) {
  const [score1, setScore1] = useState('0')
  const [score2, setScore2] = useState('0')
  const [winnerId, setWinnerId] = useState<string>('')

  const handleSubmit = () => {
    if (!winnerId) return
    onReport({
      winnerId,
      score: `${score1}-${score2}`
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Signaler le Score</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <RadioGroup value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
            <Stack spacing={2}>
              {/* Player 1 */}
              <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar src={match.player1?.avatarUrl} sx={{ width: 32, height: 32 }} />
                  <Typography variant="body1" fontWeight={winnerId === match.player1?.id ? 'bold' : 'normal'}>
                    {match.player1?.name || 'Joueur 1'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TextField
                    size="small"
                    type="number"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    sx={{ width: 60 }}
                  />
                  <FormControlLabel
                    value={match.player1?.id || '1'}
                    control={<Radio />}
                    label="Gagnant"
                    labelPlacement="start"
                  />
                </Stack>
              </Stack>

              {/* Player 2 */}
              <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar src={match.player2?.avatarUrl} sx={{ width: 32, height: 32 }} />
                  <Typography variant="body1" fontWeight={winnerId === match.player2?.id ? 'bold' : 'normal'}>
                    {match.player2?.name || 'Joueur 2'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TextField
                    size="small"
                    type="number"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    sx={{ width: 60 }}
                  />
                  <FormControlLabel
                    value={match.player2?.id || '2'}
                    control={<Radio />}
                    label="Gagnant"
                    labelPlacement="start"
                  />
                </Stack>
              </Stack>
            </Stack>
          </RadioGroup>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!winnerId}>
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
