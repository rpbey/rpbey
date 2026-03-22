'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';

const TYPE_COLORS: Record<string, string> = {
  ATTACK: '#ef4444',
  DEFENSE: '#3b82f6',
  STAMINA: '#22c55e',
  BALANCE: '#a855f7',
};

// Type advantage: ATTACK > STAMINA > DEFENSE > ATTACK, BALANCE neutral
function getTypeAdvantage(atk: string | null, def: string | null): number {
  if (!atk || !def || atk === 'BALANCE' || def === 'BALANCE') return 1;
  if (atk === 'ATTACK' && def === 'STAMINA') return 1.3;
  if (atk === 'STAMINA' && def === 'DEFENSE') return 1.3;
  if (atk === 'DEFENSE' && def === 'ATTACK') return 1.3;
  if (atk === 'STAMINA' && def === 'ATTACK') return 0.7;
  if (atk === 'DEFENSE' && def === 'STAMINA') return 0.7;
  if (atk === 'ATTACK' && def === 'DEFENSE') return 0.7;
  return 1;
}

function parseStat(val: string | number | null | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = String(val).match(/^(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

interface BeyCombo {
  blade: Part | null;
  ratchet: Part | null;
  bit: Part | null;
}

function getComboStats(combo: BeyCombo) {
  const parts = [combo.blade, combo.ratchet, combo.bit].filter(
    Boolean,
  ) as Part[];
  return {
    attack: parts.reduce((s, p) => s + parseStat(p.attack), 0),
    defense: parts.reduce((s, p) => s + parseStat(p.defense), 0),
    stamina: parts.reduce((s, p) => s + parseStat(p.stamina), 0),
    dash: parts.reduce((s, p) => s + parseStat(p.dash), 0),
    burst: parts.reduce((s, p) => s + parseStat(p.burst), 0),
    type: combo.blade?.beyType || 'BALANCE',
  };
}

function PartSelector({
  label,
  parts,
  value,
  onChange,
}: {
  label: string;
  parts: Part[];
  value: Part | null;
  onChange: (part: Part | null) => void;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="caption"
        fontWeight="900"
        color="text.secondary"
        sx={{ mb: 0.5, display: 'block' }}
      >
        {label}
      </Typography>
      <Select
        size="small"
        fullWidth
        value={value?.id || ''}
        onChange={(e) => {
          const part = parts.find((p) => p.id === e.target.value) || null;
          onChange(part);
        }}
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          fontSize: '0.85rem',
          '& .MuiSelect-select': { py: 1 },
        }}
        displayEmpty
      >
        <MenuItem value="">
          <em>Sélectionner...</em>
        </MenuItem>
        {parts.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

function ComboCard({
  title,
  combo,
  blades,
  ratchets,
  bits,
  onUpdate,
  color,
}: {
  title: string;
  combo: BeyCombo;
  blades: Part[];
  ratchets: Part[];
  bits: Part[];
  onUpdate: (combo: BeyCombo) => void;
  color: string;
}) {
  const stats = getComboStats(combo);
  const isComplete = combo.blade && combo.ratchet && combo.bit;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '2px solid',
        borderColor: alpha(color, 0.3),
        bgcolor: alpha(color, 0.03),
        flex: 1,
        minWidth: 280,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight="900" sx={{ color, mb: 2 }}>
          {title}
        </Typography>

        <PartSelector
          label="Blade"
          parts={blades}
          value={combo.blade}
          onChange={(p) => onUpdate({ ...combo, blade: p })}
        />
        <PartSelector
          label="Ratchet"
          parts={ratchets}
          value={combo.ratchet}
          onChange={(p) => onUpdate({ ...combo, ratchet: p })}
        />
        <PartSelector
          label="Bit"
          parts={bits}
          value={combo.bit}
          onChange={(p) => onUpdate({ ...combo, bit: p })}
        />

        {isComplete && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {combo.blade?.beyType && (
              <Chip
                label={combo.blade.beyType}
                size="small"
                sx={{
                  fontWeight: 900,
                  bgcolor: TYPE_COLORS[combo.blade.beyType] || '#888',
                  color: '#fff',
                  alignSelf: 'flex-start',
                }}
              />
            )}
            {[
              { label: 'ATK', value: stats.attack, color: '#ef4444' },
              { label: 'DEF', value: stats.defense, color: '#3b82f6' },
              { label: 'END', value: stats.stamina, color: '#22c55e' },
              { label: 'DSH', value: stats.dash, color: '#fbbf24' },
            ].map((s) => (
              <Box key={s.label}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.3,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {s.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight="900"
                    sx={{ color: s.color, fontSize: '0.7rem' }}
                  >
                    {s.value}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(s.value / 3, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(s.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: s.color,
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

interface BattleResult {
  winner: 'p1' | 'p2';
  p1Hp: number;
  p2Hp: number;
  log: string[];
}

function simulateBattle(p1: BeyCombo, p2: BeyCombo): BattleResult {
  const s1 = getComboStats(p1);
  const s2 = getComboStats(p2);

  const typeAdv1 = getTypeAdvantage(s1.type, s2.type);
  const typeAdv2 = getTypeAdvantage(s2.type, s1.type);

  let hp1 = 100;
  let hp2 = 100;
  const log: string[] = [];

  // Name helper
  const n1 = p1.blade?.name || 'Joueur 1';
  const n2 = p2.blade?.name || 'Joueur 2';

  if (typeAdv1 > 1) log.push(`${n1} a l'avantage de type !`);
  if (typeAdv2 > 1) log.push(`${n2} a l'avantage de type !`);

  // 10 rounds of combat
  for (let round = 1; round <= 10 && hp1 > 0 && hp2 > 0; round++) {
    // P1 attacks P2
    const atk1 = (s1.attack * typeAdv1 * (0.8 + Math.random() * 0.4)) / 10;
    const def2 = (s2.defense * 0.5) / 10;
    const dmg1 = Math.max(1, Math.round(atk1 - def2 + s1.dash * 0.1));
    hp2 = Math.max(0, hp2 - dmg1);

    // Burst check
    const burstChance1 = Math.max(0, (s1.attack - s2.burst) * 0.5);
    if (Math.random() * 100 < burstChance1 && round > 3) {
      log.push(`Tour ${round}: ${n1} BURST FINISH ! 💥`);
      hp2 = 0;
      break;
    }

    // P2 attacks P1
    const atk2 = (s2.attack * typeAdv2 * (0.8 + Math.random() * 0.4)) / 10;
    const def1 = (s1.defense * 0.5) / 10;
    const dmg2 = Math.max(1, Math.round(atk2 - def1 + s2.dash * 0.1));
    hp1 = Math.max(0, hp1 - dmg2);

    // Burst check P2
    const burstChance2 = Math.max(0, (s2.attack - s1.burst) * 0.5);
    if (Math.random() * 100 < burstChance2 && round > 3) {
      log.push(`Tour ${round}: ${n2} BURST FINISH ! 💥`);
      hp1 = 0;
      break;
    }

    // Stamina drain
    const staminaDrain1 = Math.max(0.5, 10 - s1.stamina * 0.08);
    const staminaDrain2 = Math.max(0.5, 10 - s2.stamina * 0.08);
    hp1 = Math.max(0, hp1 - staminaDrain1);
    hp2 = Math.max(0, hp2 - staminaDrain2);

    if (round % 3 === 0 || round === 10) {
      log.push(
        `Tour ${round}: ${n1} ${Math.round(hp1)}% — ${n2} ${Math.round(hp2)}%`,
      );
    }
  }

  // If both alive, winner by remaining HP (stamina out-spin)
  if (hp1 > 0 && hp2 > 0) {
    log.push(
      hp1 > hp2
        ? `${n1} gagne par Spin Finish !`
        : `${n2} gagne par Spin Finish !`,
    );
  }

  return {
    winner: hp1 >= hp2 ? 'p1' : 'p2',
    p1Hp: Math.round(Math.max(0, hp1)),
    p2Hp: Math.round(Math.max(0, hp2)),
    log,
  };
}

interface CombatTabProps {
  blades: Part[];
  ratchets: Part[];
  bits: Part[];
}

export function CombatTab({ blades, ratchets, bits }: CombatTabProps) {
  const [p1, setP1] = useState<BeyCombo>({
    blade: null,
    ratchet: null,
    bit: null,
  });
  const [p2, setP2] = useState<BeyCombo>({
    blade: null,
    ratchet: null,
    bit: null,
  });
  const [battling, setBattling] = useState(false);
  const [showVfx, setShowVfx] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [vfxFrame, setVfxFrame] = useState(0);

  const canBattle =
    p1.blade && p1.ratchet && p1.bit && p2.blade && p2.ratchet && p2.bit;

  const handleBattle = useCallback(() => {
    if (!canBattle) return;
    setBattling(true);
    setShowVfx(true);
    setResult(null);

    // VFX animation then resolve
    setTimeout(() => {
      setShowVfx(false);
      const res = simulateBattle(p1, p2);
      setResult(res);
      setBattling(false);
    }, 3000);
  }, [canBattle, p1, p2]);

  // VFX frame animation
  useEffect(() => {
    if (!showVfx) return;
    const interval = setInterval(() => {
      setVfxFrame((f) => (f + 1) % 8);
    }, 100);
    return () => clearInterval(interval);
  }, [showVfx]);

  const randomize = useCallback(() => {
    const randPart = (parts: Part[]) =>
      parts[Math.floor(Math.random() * parts.length)] || null;
    setP1({
      blade: randPart(blades),
      ratchet: randPart(ratchets),
      bit: randPart(bits),
    });
    setP2({
      blade: randPart(blades),
      ratchet: randPart(ratchets),
      bit: randPart(bits),
    });
    setResult(null);
  }, [blades, ratchets, bits]);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h6" fontWeight="900">
          Simulateur de Combat
        </Typography>
        <Button
          size="small"
          onClick={randomize}
          sx={{ fontWeight: 900, borderRadius: 2 }}
        >
          Aléatoire
        </Button>
      </Box>

      {/* Two combo selectors */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <ComboCard
          title="Joueur 1"
          combo={p1}
          blades={blades}
          ratchets={ratchets}
          bits={bits}
          onUpdate={setP1}
          color="#ef4444"
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h4"
            fontWeight="900"
            sx={{ color: 'text.disabled' }}
          >
            VS
          </Typography>
        </Box>

        <ComboCard
          title="Joueur 2"
          combo={p2}
          blades={blades}
          ratchets={ratchets}
          bits={bits}
          onUpdate={setP2}
          color="#3b82f6"
        />
      </Box>

      {/* Battle button */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          disabled={!canBattle || battling}
          onClick={handleBattle}
          sx={{
            fontWeight: 900,
            borderRadius: 3,
            px: 6,
            py: 2,
            fontSize: '1.1rem',
            bgcolor: '#dc2626',
            letterSpacing: 2,
            '&:hover': { bgcolor: '#b91c1c' },
          }}
        >
          {battling ? 'COMBAT EN COURS...' : 'LANCER LE COMBAT'}
        </Button>
      </Box>

      {/* VFX overlay */}
      {showVfx && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            bgcolor: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <img
            src={`/app-assets/vfx/BattleScreen_Center_Sparks_Seq_${vfxFrame}.png`}
            alt=""
            style={{ width: 300, height: 300, objectFit: 'contain' }}
          />
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.5rem',
              letterSpacing: 5,
              textTransform: 'uppercase',
              animation: 'pulse 1s infinite',
            }}
          >
            Combat !
          </Typography>
        </Box>
      )}

      {/* Result */}
      {result && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '2px solid',
            borderColor: result.winner === 'p1' ? '#ef4444' : '#3b82f6',
            bgcolor: alpha(
              result.winner === 'p1' ? '#ef4444' : '#3b82f6',
              0.03,
            ),
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{
                textAlign: 'center',
                mb: 2,
                color: result.winner === 'p1' ? '#ef4444' : '#3b82f6',
              }}
            >
              {result.winner === 'p1' ? p1.blade?.name : p2.blade?.name} GAGNE !
            </Typography>

            {/* HP bars */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  fontWeight="900"
                  sx={{ color: '#ef4444' }}
                >
                  {p1.blade?.name} — {result.p1Hp}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={result.p1Hp}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: alpha('#ef4444', 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#ef4444',
                      borderRadius: 6,
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  fontWeight="900"
                  sx={{ color: '#3b82f6' }}
                >
                  {p2.blade?.name} — {result.p2Hp}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={result.p2Hp}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: alpha('#3b82f6', 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#3b82f6',
                      borderRadius: 6,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Battle log */}
            <Box
              sx={{
                bgcolor: alpha('#000', 0.3),
                borderRadius: 2,
                p: 2,
                fontFamily: 'monospace',
              }}
            >
              {result.log.map((line, i) => (
                <Typography
                  key={i}
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: line.includes('BURST')
                      ? '#f59e0b'
                      : line.includes('gagne')
                        ? '#22c55e'
                        : 'text.secondary',
                    fontWeight:
                      line.includes('BURST') || line.includes('gagne')
                        ? 900
                        : 400,
                    fontSize: '0.75rem',
                    lineHeight: 1.8,
                  }}
                >
                  {line}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
