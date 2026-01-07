'use client';

import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  actionIcon = <AddIcon />,
  children,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={2}>
          {children}
          {actionLabel && onAction && (
            <Button
              variant="contained"
              color="primary"
              startIcon={actionIcon}
              onClick={onAction}
              sx={{ fontWeight: 'bold' }}
            >
              {actionLabel}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};
