import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import Image from 'next/image';

const TYPE_COLORS: Record<string, string> = {
  ATTACK: '#ef4444',
  DEFENSE: '#3b82f6',
  STAMINA: '#22c55e',
  BALANCE: '#a855f7',
};

export function PartCard({ part }: { part: Part }) {
  const color = (part.beyType && TYPE_COLORS[part.beyType]) || '#6b7280';

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 10px 20px -10px ${alpha(color, 0.3)}`,
          borderColor: color,
        },
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          pt: 3,
        }}
      >
        {/* Type Badge (Top Right) */}
        {part.beyType && (
          <Chip
            label={part.beyType}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: alpha(color, 0.1),
              color: color,
              fontWeight: 'bold',
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        )}

        {/* System Badge (Top Left) */}
        {part.system && (
          <Chip
            label={part.system}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              bgcolor: '#111',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        )}

        {/* Image */}
        <Box sx={{ position: 'relative', width: 100, height: 100 }}>
          {part.imageUrl ? (
            <Image
              src={part.imageUrl}
              alt={part.name}
              fill
              sizes="100px"
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
              <Typography variant="h4" color="text.disabled">
                {part.name.charAt(0)}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="subtitle1" fontWeight="900" noWrap>
            {part.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight="bold"
          >
            {part.type} {part.weight ? `• ${part.weight}g` : ''}
          </Typography>
        </Box>

        {/* Mini Stats Grid */}
        <Box sx={{ display: 'flex', gap: 0.5, width: '100%', mt: 1 }}>
          {(['attack', 'defense', 'stamina', 'dash'] as const).map((stat) => {
            const val = part[stat as keyof Part];
            if (!val) return null;
            const numericVal =
              typeof val === 'number' ? val : parseInt(String(val));
            return (
              <Box
                key={stat}
                sx={{
                  flex: 1,
                  height: 4,
                  bgcolor: '#eee',
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
    </Card>
  );
}
