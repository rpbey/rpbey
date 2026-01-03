import React from 'react';
import { TextField, InputAdornment, TextFieldProps } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

type SearchInputProps = TextFieldProps & {
  onSearch?: (value: string) => void;
};

export const SearchInput: React.FC<SearchInputProps> = ({ onSearch, onChange, ...props }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
    if (onSearch) {
      onSearch(event.target.value);
    }
  };

  return (
    <TextField
      placeholder="Rechercher..."
      variant="outlined"
      size="small"
      onChange={handleChange}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'background.paper',
        },
        minWidth: 250,
      }}
      {...props}
    />
  );
};
