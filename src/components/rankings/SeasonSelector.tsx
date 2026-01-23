'use client';

import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';

interface Season {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export default function SeasonSelector({ seasons }: { seasons: Season[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSlug = searchParams.get('season') || 'current';

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams);
    
    if (value === 'current') {
      params.delete('season');
    } else {
      params.set('season', value);
    }
    // Reset page on season change
    params.set('page', '1');
    
    router.push(`/rankings?${params.toString()}`);
  };

  return (
    <FormControl sx={{ minWidth: 200, mb: 4 }} size="small">
      <InputLabel id="season-select-label">Saison</InputLabel>
      <Select
        labelId="season-select-label"
        value={currentSlug}
        label="Saison"
        onChange={handleChange}
      >
        <MenuItem value="current">
          Saison Actuelle (En cours)
        </MenuItem>
        {seasons
          .filter(s => !s.isActive)
          .map((season) => (
            <MenuItem key={season.id} value={season.slug}>
              {season.name}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
