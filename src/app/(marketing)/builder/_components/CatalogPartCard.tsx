'use client';

import { Box, Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import Image from 'next/image';

const TYPE_COLORS: Record<string, string> = {
  ATTACK: '#ef4444',
  DEFENSE: '#3b82f6',
  STAMINA: '#22c55e',
  BALANCE: '#a855f7',
};

interface CatalogPartCardProps {
  part: Part;
  isUsed: boolean;
  onClick: () => void;
}

export function CatalogPartCard({ part, isUsed, onClick }: CatalogPartCardProps) {
  const color = (part.beyType && TYPE_COLORS[part.beyType]) || '#6b7280';

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        transition: 'all 0.2s',
        opacity: isUsed ? 0.4 : 1,
        pointerEvents: isUsed ? 'none' : 'auto',
        '&:hover': {
          transform: isUsed ? 'none' : 'translateY(-2px)',
          boxShadow: isUsed ? 'none' : `0 8px 16px -8px ${alpha(color, 0.3)}`,
          borderColor: color,
        },
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardActionArea onClick={onClick} disabled={isUsed} sx={{ height: '100%' }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            '&:last-child': { pb: 1.5 },
          }}
        >
          {part.beyType && (
            <Chip
              label={part.beyType.slice(0, 3)}
              size="small"
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: alpha(color, 0.15),
                color: color,
                fontWeight: 'bold',
                fontSize: '0.6rem',
                height: 18,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}

          {isUsed && (
            <Chip
              label="Utilisé"
              size="small"
              sx={{
                position: 'absolute',
                top: 6,
                left: 6,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '0.6rem',
                height: 18,
                zIndex: 2,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}

          <Box sx={{ position: 'relative', width: 80, height: 80 }}>
            {part.imageUrl ? (
              <Image
                src={part.imageUrl}
                alt={part.name}
                fill
                sizes="80px"
                style={{ objectFit: 'contain' }}
                loading="lazy"
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h5" color="text.disabled">
                  {part.name.charAt(0)}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="caption" fontWeight="900" noWrap sx={{ display: 'block', lineHeight: 1.3 }}>
              {part.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.6rem">
              {part.weight ? `${part.weight}g` : part.type}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
            {(['attack', 'defense', 'stamina', 'dash'] as const).map((stat) => {
              const val = part[stat as keyof Part];
              if (!val) return null;
              const numericVal = typeof val === 'number' ? val : parseInt(String(val), 10);
              return (
                <Box
                  key={stat}
                  sx={{
                    flex: 1,
                    height: 3,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.min(numericVal, 100)}%`,
                      height: '100%',
                      bgcolor: color,
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
