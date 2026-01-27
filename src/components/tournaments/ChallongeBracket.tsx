'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useState, useRef, useEffect } from 'react';

interface ChallongeBracketProps {
  challongeUrl: string;
  height?: number | string;
  title?: string;
  themeId?: string; // 7792 is a good dark theme base
  svgPath?: string;
}

export function ChallongeBracket({
  challongeUrl,
  height = 650,
  title,
  themeId = '7792', // Default to a clean dark theme
  svgPath,
}: ChallongeBracketProps) {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0); // Force reload iframe
  const theme = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    setLoading(true);
    setKey((prev) => prev + 1);
  };

  const isSvgMode = !!svgPath;
  const isDark = theme.palette.mode === 'dark';

  // Construct optimized URL
  // theme: ID for styling (creates dark background match)
  // multiplier: Scales the bracket text/boxes
  // match_width_multiplier: Makes matches wider/narrower
  // show_final_results: Shows the winner box clearly
  const embedUrl = `${challongeUrl}/module?theme=${themeId}&multiplier=0.9&match_width_multiplier=1.1&show_final_results=1&show_standings=1`;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'rgba(255,255,255,0.1)',
        bgcolor: isDark ? 'rgba(20, 20, 20, 0.6)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        boxShadow: isDark 
            ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
            : '0 8px 32px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        '&:hover': {
            borderColor: 'primary.main',
            boxShadow: isDark 
                ? '0 12px 40px rgba(220, 38, 38, 0.15)' // Red glow on hover
                : '0 12px 40px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDark 
            ? 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.0) 100%)' 
            : 'rgba(0,0,0,0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Status Dot */}
            <Box 
                sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: loading ? 'warning.main' : 'success.main',
                    boxShadow: loading ? '0 0 8px #f59e0b' : '0 0 8px #22c55e'
                }} 
            />
            <Typography
            variant="subtitle1"
            fontWeight="700"
            sx={{ 
                letterSpacing: '0.02em',
                background: 'linear-gradient(45deg, #fff, #ccc)',
                backgroundClip: 'text',
                WebkitTextFillColor: isDark ? 'transparent' : 'inherit'
            }}
            >
            {title || 'Arbre de Tournoi'}
            </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isSvgMode && (
            <Tooltip title="Actualiser les résultats">
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main', bgcolor: 'primary.main', bgcolorOpacity: 0.1 } 
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip
            title="Ouvrir sur Challonge"
          >
            <IconButton
              size="small"
              component="a"
              href={challongeUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' } 
            }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Bracket Content */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height,
          bgcolor: isDark ? '#18181b' : '#f4f4f5', // Neutral background behind iframe
          overflow: isSvgMode ? 'auto' : 'hidden',
        }}
      >
        {isSvgMode ? (
          <Box
            component="img"
            src={svgPath}
            alt={title}
            sx={{ 
                width: '100%', 
                height: 'auto', 
                minHeight: '100%',
                objectFit: 'contain',
                p: 2 
            }}
            onLoad={() => setLoading(false)}
          />
        ) : (
          <>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                }}
              >
                <Skeleton
                  variant="rectangular"
                  width="90%"
                  height="80%"
                  sx={{ borderRadius: 3 }}
                  animation="wave"
                />
                <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
                    Chargement de l'arbre...
                </Typography>
              </Box>
            )}
            
            <iframe
              ref={iframeRef}
              key={key}
              title={title}
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="auto"
              allowTransparency={true}
              onLoad={() => setLoading(false)}
              style={{ 
                display: 'block',
                opacity: loading ? 0 : 1,
                transition: 'opacity 0.5s ease',
                filter: isDark ? 'contrast(1.1) saturate(1.1)' : 'none' // Slight pop for dark mode
              }}
            />
          </>
        )}
      </Box>
    </Paper>
  );
}