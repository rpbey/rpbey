'use client';

import { Search as SearchIcon } from '@mui/icons-material';
import {
  Autocomplete,
  Avatar,
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { searchBladers } from '@/server/actions/search';

interface SearchOption {
  name: string;
  image: string | null;
}

export default function RankingSearch({
  defaultValue = '',
}: {
  defaultValue?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedValue = useDebounce(value, 300);

  // Effect for fetching suggestions
  useEffect(() => {
    let active = true;

    if (debouncedValue.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);

    (async () => {
      try {
        const results = await searchBladers(debouncedValue);
        if (active) {
          setOptions(results);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedValue]);

  // Effect for updating URL (the main search logic)
  useEffect(() => {
    // Only trigger URL update if user explicitly typed something
    // We don't want to trigger on initial load if defaultValue is present
    if (value === defaultValue && !searchParams.get('search')) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      params.set('search', debouncedValue);
    } else {
      params.delete('search');
    }
    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [debouncedValue, value, router, pathname, searchParams, defaultValue]);

  return (
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.name
      }
      filterOptions={(x) => x} // Disable client-side filtering, we do it server-side
      inputValue={value}
      onInputChange={(_, newValue) => setValue(newValue)}
      loading={loading}
      renderOption={(props, option) => (
        <li {...props} key={option.name}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              src={option.image || undefined}
              sx={{ width: 24, height: 24 }}
            >
              {option.name[0]}
            </Avatar>
            <Typography variant="body2">{option.name}</Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Rechercher un Blader..."
          variant="outlined"
          size="small"
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color={value ? 'primary' : 'action'} />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading || isPending ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              borderRadius: 3,
              pr: '39px !important', // Fix overlap with clear button
              transition: 'all 0.2s',
              '&.Mui-focused': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              },
            },
          }}
        />
      )}
    />
  );
}
