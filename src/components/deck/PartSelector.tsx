'use client'

/**
 * PartSelector - Autocomplete component for selecting Beyblade parts
 */

import { useState, useEffect, useCallback } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import type { Part, PartType, BeyType } from '@prisma/client'

interface PartSelectorProps {
  type: PartType
  value: Part | null
  onChange: (part: Part | null) => void
  disabled?: boolean
  disabledPartIds?: string[]
  label?: string
  error?: boolean
  helperText?: string
}

function getBeyTypeColor(beyType: BeyType | null): string {
  switch (beyType) {
    case 'ATTACK':
      return '#ef4444' // red
    case 'DEFENSE':
      return '#3b82f6' // blue
    case 'STAMINA':
      return '#22c55e' // green
    case 'BALANCE':
      return '#a855f7' // purple
    default:
      return '#6b7280' // gray
  }
}

function getPartTypeLabel(type: PartType): string {
  switch (type) {
    case 'BLADE':
      return 'Blade'
    case 'RATCHET':
      return 'Ratchet'
    case 'BIT':
      return 'Bit'
    default:
      return 'Part'
  }
}

export function PartSelector({
  type,
  value,
  onChange,
  disabled = false,
  disabledPartIds = [],
  label,
  error,
  helperText,
}: PartSelectorProps) {
  const [options, setOptions] = useState<Part[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // Fetch parts on mount and when search changes
  const fetchParts = useCallback(async (search?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type })
      if (search) params.set('search', search)

      const response = await fetch(`/api/parts?${params}`)
      const result = await response.json()

      if (result.data) {
        setOptions(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch parts:', err)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchParts()
  }, [fetchParts])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue) {
        fetchParts(inputValue)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, fetchParts])

  return (
    <Autocomplete
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={options}
      loading={loading}
      disabled={disabled}
      getOptionKey={(option) => option.id}
      getOptionLabel={(option) => option.name}
      getOptionDisabled={(option) => disabledPartIds.includes(option.id)}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label ?? getPartTypeLabel(type)}
          error={error}
          helperText={helperText}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props
        return (
          <Box
            component="li"
            key={key}
            {...rest}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {option.beyType && (
              <Chip
                size="small"
                label={option.beyType.charAt(0)}
                sx={{
                  bgcolor: getBeyTypeColor(option.beyType),
                  color: 'white',
                  minWidth: 24,
                  height: 24,
                }}
              />
            )}
            <Box>
              <Typography variant="body2">{option.name}</Typography>
              {type === 'BLADE' && option.attack !== null && (
                <Typography variant="caption" color="text.secondary">
                  ATK {option.attack} | DEF {option.defense} | STA{' '}
                  {option.stamina}
                </Typography>
              )}
              {type === 'RATCHET' && option.height !== null && (
                <Typography variant="caption" color="text.secondary">
                  Height: {option.height} | Weight: {option.weight}g
                </Typography>
              )}
              {type === 'BIT' && option.gearRatio && (
                <Typography variant="caption" color="text.secondary">
                  Ratio: {option.gearRatio} | Weight: {option.weight}g
                </Typography>
              )}
            </Box>
          </Box>
        )
      }}
    />
  )
}
