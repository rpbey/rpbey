'use client';

import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Product } from '@prisma/client';
import Image from 'next/image';

const LINE_COLORS: Record<string, string> = {
  BX: '#dc2626',
  UX: '#3b82f6',
  CX: '#eab308',
};

const TYPE_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  BOOSTER: 'Booster',
  RANDOM_BOOSTER: 'Random Booster',
  SET: 'Set',
  DOUBLE_STARTER: 'Double Starter',
  TOOL: 'Outil',
  COLOR_CHOICE: 'Color Choice',
};

export function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const lineColor = LINE_COLORS[product.productLine] || '#6b7280';

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 10px 20px -10px ${alpha(lineColor, 0.3)}`,
          borderColor: lineColor,
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
          gap: 1.5,
          pt: 3,
        }}
      >
        {/* Line Badge (Top Left) */}
        <Chip
          label={product.productLine}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: alpha(lineColor, 0.15),
            color: lineColor,
            fontWeight: 'bold',
            fontSize: '0.65rem',
            height: 20,
          }}
        />

        {/* Type Badge (Top Right) */}
        <Chip
          label={TYPE_LABELS[product.productType] || product.productType}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: '#111',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '0.6rem',
            height: 20,
          }}
        />

        {/* Limited Badge */}
        {product.isLimited && (
          <Chip
            label="LIMITED"
            size="small"
            sx={{
              position: 'absolute',
              top: 34,
              right: 10,
              bgcolor: alpha('#fbbf24', 0.15),
              color: '#fbbf24',
              fontWeight: 'bold',
              fontSize: '0.55rem',
              height: 18,
            }}
          />
        )}

        {/* Image */}
        <Box sx={{ position: 'relative', width: 120, height: 120 }}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="120px"
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
                {product.code}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography
            variant="caption"
            sx={{ color: lineColor, fontWeight: 800 }}
          >
            {product.code}
          </Typography>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.3,
              minHeight: '2.6em',
            }}
          >
            {product.nameFr || product.nameEn || product.name}
          </Typography>
        </Box>

        {/* Price & Date */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            mt: 'auto',
          }}
        >
          {product.price && (
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: lineColor }}
            >
              ¥{product.price.toLocaleString('fr-FR')}
            </Typography>
          )}
          {product.releaseDate && (
            <Typography variant="caption" color="text.secondary">
              {new Date(product.releaseDate).toLocaleDateString('fr-FR', {
                month: 'short',
                year: 'numeric',
              })}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
