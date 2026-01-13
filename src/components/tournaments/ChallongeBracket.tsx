'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

interface ChallongeBracketProps {
  challongeUrl: string;
  height?: number | string;
  title?: string;
  themeId?: string;
  svgPath?: string; // Optionnel: chemin vers un fichier SVG local stylisé
}

export function ChallongeBracket({
  challongeUrl,
  height = 600,
  title,
  themeId = '7792',
  svgPath,
}: ChallongeBracketProps) {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setLoading(true);
    setKey((prev) => prev + 1);
  };

  const isSvgMode = !!svgPath;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: isSvgMode
          ? '#1a1a1a'
          : (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.2)'
                : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isSvgMode ? 'rgba(0,0,0,0.3)' : 'transparent',
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          color={isSvgMode ? 'white' : 'inherit'}
        >
          {title || 'Arbre du Tournoi'}
        </Typography>
        <Box>
          {!isSvgMode && (
            <Tooltip title="Rafraîchir">
              <IconButton size="small" onClick={handleRefresh} sx={{ mr: 1 }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip
            title={isSvgMode ? 'Voir en plein écran' : 'Ouvrir sur Challonge'}
          >
            <IconButton
              size="small"
              component="a"
              href={isSvgMode ? svgPath : challongeUrl}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height,
          overflow: isSvgMode ? 'auto' : 'hidden',
          cursor: isSvgMode ? 'grab' : 'default',
          '&:active': { cursor: isSvgMode ? 'grabbing' : 'default' },
          display: isSvgMode ? 'flex' : 'block',
          justifyContent: 'center',
          p: isSvgMode ? 4 : 0,
        }}
      >
        {isSvgMode ? (
          <Box
            component="img"
            src={svgPath}
            alt={title || 'Tournament Bracket'}
            sx={{ maxWidth: 'none', height: 'auto' }}
            onLoad={() => setLoading(false)}
          />
        ) : (
          <>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  p: 2,
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{ borderRadius: 2, opacity: 0.5 }}
                />
              </Box>
            )}
            <iframe
              key={key}
              title={title || 'Challonge Bracket'}
              src={`${challongeUrl}/module?theme=${themeId}&multiplier=0.9&match_width_multiplier=1.2&show_final_results=1`}
              width="100%"
              height="100%"
              scrolling="auto"
              onLoad={() => setLoading(false)}
              style={{ border: 'none', display: 'block' }}
            />
          </>
        )}
      </Box>
    </Paper>
  );
}
