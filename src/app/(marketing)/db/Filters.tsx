'use client';

import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';

export interface FilterState {
  system: string[];
  type: string[];
  spin: string;
}

interface FiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

const BEY_TYPE_LABELS: Record<string, string> = {
  ATTACK: 'Attaque',
  DEFENSE: 'Défense',
  STAMINA: 'Endurance',
  BALANCE: 'Équilibre',
};

export function Filters({ filters, onChange }: FiltersProps) {
  const handleSystemChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.name;
    const newSystem = event.target.checked
      ? [...filters.system, value]
      : filters.system.filter((s) => s !== value);
    onChange({ ...filters, system: newSystem });
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.name;
    const newType = event.target.checked
      ? [...filters.type, value]
      : filters.type.filter((t) => t !== value);
    onChange({ ...filters, type: newType });
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, bgcolor: 'background.paper', height: 'fit-content' }}
    >
      <Stack spacing={3}>
        <Box>
          <FormLabel
            component="legend"
            sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}
          >
            Système
          </FormLabel>
          <FormGroup>
            {['BX', 'UX', 'CX'].map((sys) => (
              <FormControlLabel
                key={sys}
                control={
                  <Checkbox
                    checked={filters.system.includes(sys)}
                    onChange={handleSystemChange}
                    name={sys}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{sys}</Typography>}
              />
            ))}
          </FormGroup>
        </Box>

        <Box>
          <FormLabel
            component="legend"
            sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}
          >
            Type de Bey
          </FormLabel>
          <FormGroup>
            {['ATTACK', 'DEFENSE', 'STAMINA', 'BALANCE'].map((type) => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox
                    checked={filters.type.includes(type)}
                    onChange={handleTypeChange}
                    name={type}
                    size="small"
                    sx={{
                      color:
                        type === 'ATTACK'
                          ? 'error.main'
                          : type === 'DEFENSE'
                            ? 'info.main'
                            : type === 'STAMINA'
                              ? 'success.main'
                              : 'secondary.main',
                      '&.Mui-checked': {
                        color:
                          type === 'ATTACK'
                            ? 'error.main'
                            : type === 'DEFENSE'
                              ? 'info.main'
                              : type === 'STAMINA'
                                ? 'success.main'
                                : 'secondary.main',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2">
                    {BEY_TYPE_LABELS[type]}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </Box>

        <Box>
          <FormLabel
            component="legend"
            sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}
          >
            Sens de Rotation
          </FormLabel>
          <RadioGroup
            value={filters.spin}
            onChange={(e) => onChange({ ...filters, spin: e.target.value })}
          >
            <FormControlLabel
              value="ALL"
              control={<Radio size="small" />}
              label={<Typography variant="body2">Tout</Typography>}
            />
            <FormControlLabel
              value="Right"
              control={<Radio size="small" />}
              label={<Typography variant="body2">Droite</Typography>}
            />
            <FormControlLabel
              value="Left"
              control={<Radio size="small" />}
              label={<Typography variant="body2">Gauche</Typography>}
            />
          </RadioGroup>
        </Box>
      </Stack>
    </Paper>
  );
}
