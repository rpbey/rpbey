'use client';

/**
 * DeckBuilderModal - Modal for creating/editing decks
 */

import { useMediaQuery, useTheme } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { validateDeck } from '@/lib/tournament-logic';
import type { BeyData } from './BeyBuilder';
import { BeyBuilder } from './BeyBuilder';
import type { Deck } from './DeckCard';
import { TripleDeckBox } from './TripleDeckBox';

interface DeckBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  deck?: Deck | null;
}

const emptyBey: BeyData = {
  blade: null,
  ratchet: null,
  bit: null,
  nickname: '',
};

export function DeckBuilderModal({
  open,
  onClose,
  onSave,
  deck,
}: DeckBuilderModalProps) {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [beys, setBeys] = useState<[BeyData, BeyData, BeyData]>([
    { ...emptyBey },
    { ...emptyBey },
    { ...emptyBey },
  ]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modelMapping, setModelMapping] = useState<Record<string, any>>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load model mapping
  useEffect(() => {
    fetch('/data/part-model-map.json')
      .then((res) => res.json())
      .then((mapping) => setModelMapping(mapping))
      .catch((err) => console.error('Failed to load model mapping', err));
  }, []);

  // Reset form when modal opens/closes or deck changes
  useEffect(() => {
    if (open) {
      if (deck) {
        setName(deck.name);
        setIsActive(deck.isActive);
        const sortedBeys = [...deck.beys].sort(
          (a, b) => a.position - b.position,
        );
        setBeys([
          {
            blade: sortedBeys[0]?.blade ?? null,
            ratchet: sortedBeys[0]?.ratchet ?? null,
            bit: sortedBeys[0]?.bit ?? null,
            nickname: sortedBeys[0]?.nickname ?? '',
          },
          {
            blade: sortedBeys[1]?.blade ?? null,
            ratchet: sortedBeys[1]?.ratchet ?? null,
            bit: sortedBeys[1]?.bit ?? null,
            nickname: sortedBeys[1]?.nickname ?? '',
          },
          {
            blade: sortedBeys[2]?.blade ?? null,
            ratchet: sortedBeys[2]?.ratchet ?? null,
            bit: sortedBeys[2]?.bit ?? null,
            nickname: sortedBeys[2]?.nickname ?? '',
          },
        ]);
      } else {
        setName('');
        setIsActive(false);
        setBeys([{ ...emptyBey }, { ...emptyBey }, { ...emptyBey }]);
      }
      setSelectedIdx(0);
      setError(null);
      setValidationErrors([]);
    }
  }, [open, deck]);

  // Real-time validation
  useEffect(() => {
    // Only validate if we have at least some parts to avoid noise on empty deck
    const hasParts = beys.some((b) => b.blade || b.ratchet || b.bit);
    if (!hasParts) {
      setValidationErrors([]);
      return;
    }

    const deckToValidate = {
      beys: beys.map((b) => ({
        bladeId: b.blade?.id || '',
        ratchetId: b.ratchet?.id || '',
        bitId: b.bit?.id || '',
        bladeName: b.blade?.name,
      })),
    };

    // Only run full validation if all slots are filled, otherwise just check duplicates so far?
    // actually validateDeck checks full deck size too.
    // Let's filter out completely empty beys for partial validation if needed,
    // but the rules require 3 beys.
    // For the UI, we might want to show errors only when the user thinks they are done
    // OR we can show them as warnings.
    // For now, let's just validate what we have.

    // We pass empty strings for missing parts, which validateDeck will flag as duplicates if multiple missing
    // We should probably only validate fully defined beys or adjust the validator?
    // The validator checks for duplicates. '' == '' is a duplicate.
    // Let's only validate if all 3 beys have at least one part?
    // Or better: Let's run validation but ignore "missing part" errors from the logic
    // and rely on the UI "isValid" check for completeness.
    // Our validateDeck primarily checks UNIQUNESS and BANNED parts.

    // BUT: validateDeck treats "" as a ID. If multiple beys have missing parts, it will say "Blade is duplicated".
    // We should map missing parts to unique temporary IDs to avoid false duplicate errors on empty slots?
    // No, easier to just check if isComplete before validating full rules.

    const isFullDeck = beys.every((b) => b.blade && b.ratchet && b.bit);

    if (isFullDeck) {
      const result = validateDeck(deckToValidate);
      setValidationErrors(result.isValid ? [] : result.errors);
    } else {
      setValidationErrors([]);
    }
  }, [beys]);

  const handleBeyChange = (index: number, data: BeyData) => {
    const newBeys = [...beys] as [BeyData, BeyData, BeyData];
    newBeys[index] = data;
    setBeys(newBeys);
  };

  // Get all used part IDs across all beys
  const usedPartIds = beys.flatMap((bey) =>
    [bey.blade?.id, bey.ratchet?.id, bey.bit?.id].filter(Boolean),
  ) as string[];

  const isComplete = beys.every((bey) => bey.blade && bey.ratchet && bey.bit);
  const isValid = name.trim() && isComplete && validationErrors.length === 0;

  const handleSave = async () => {
    if (!isValid) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        isActive,
        beys: beys.map((bey, index) => ({
          position: index + 1,
          nickname: bey.nickname || null,
          bladeId: bey.blade?.id,
          ratchetId: bey.ratchet?.id,
          bitId: bey.bit?.id,
        })),
      };

      const url = deck ? `/api/decks/${deck.id}` : '/api/decks';
      const method = deck ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Impossible d'enregistrer le deck");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const currentBeysModels = beys.map((b) =>
    b.blade ? modelMapping[b.blade.id] : null,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: '#0a0a0a',
          backgroundImage:
            'url("https://www.transparenttextures.com/patterns/dark-matter.png")',
        },
      }}
    >
      <DialogTitle
        sx={{
          color: 'white',
          borderBottom: '1px solid #222',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: 2 }}>
          {deck ? "MODIFIER L'ÉQUIPEMENT" : 'NOUVELLE DECK BOX'}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              color="warning"
            />
          }
          label={
            <Typography
              variant="caption"
              sx={{ color: '#aaa', fontWeight: 'bold' }}
            >
              ACTIF POUR TOURNOIS
            </Typography>
          }
        />
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {validationErrors.length > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              {validationErrors[0]}
            </Alert>
          )}

          {/* 3D Overview */}
          <Box sx={{ position: 'relative' }}>
            <TripleDeckBox
              selectedIdx={selectedIdx}
              onSelect={setSelectedIdx}
              beysModels={currentBeysModels}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: '#666', letterSpacing: 1, fontWeight: 'bold' }}
              >
                CLIQUEZ SUR UN COMPARTIMENT POUR LE CONFIGURER
              </Typography>
            </Box>
          </Box>

          {/* Selected Slot Editor */}
          <Box
            sx={{
              bgcolor: '#111',
              borderRadius: 4,
              border: '2px solid #222',
              p: 3,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="NOM DU DECK"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                variant="standard"
                placeholder="Equipe RPB"
                sx={{
                  flexGrow: 1,
                  '& .MuiInputBase-root': {
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: '900',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#555',
                    fontWeight: 'bold',
                  },
                }}
              />
            </Box>

            <BeyBuilder
              position={selectedIdx + 1}
              data={beys[selectedIdx]!}
              onChange={(data) => handleBeyChange(selectedIdx, data)}
              usedPartIds={usedPartIds}
              disabled={saving}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ bgcolor: '#0a0a0a', borderTop: '1px solid #222', p: 3 }}
      >
        <Button onClick={onClose} disabled={saving} sx={{ color: '#555' }}>
          ANNULER
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="error"
          disabled={!isValid || saving}
          startIcon={
            saving ? <CircularProgress size={20} color="inherit" /> : null
          }
          sx={{
            fontWeight: '900',
            px: 6,
            py: 1.5,
            borderRadius: 2,
            letterSpacing: 2,
          }}
        >
          {saving ? 'CHARGEMENT...' : "VALIDER L'ÉQUIPEMENT"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
