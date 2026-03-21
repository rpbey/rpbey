'use client';

import { Close } from '@mui/icons-material';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Beyblade, Part, Product } from '@prisma/client';
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

type ProductWithBeys = Product & {
  beyblades: (Beyblade & {
    blade: Part | null;
    ratchet: Part | null;
    bit: Part | null;
  })[];
};

export function ProductDetailModal({
  product,
  onClose,
}: {
  product: ProductWithBeys | null;
  onClose: () => void;
}) {
  if (!product) return null;
  const lineColor = LINE_COLORS[product.productLine] || '#6b7280';

  return (
    <Dialog
      open={!!product}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            {product.code}
          </Typography>
          <Chip
            label={product.productLine}
            size="small"
            sx={{
              bgcolor: alpha(lineColor, 0.15),
              color: lineColor,
              fontWeight: 700,
            }}
          />
          <Chip
            label={TYPE_LABELS[product.productType] || product.productType}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          {product.isLimited && (
            <Chip
              label="LIMITED"
              size="small"
              sx={{
                bgcolor: alpha('#fbbf24', 0.15),
                color: '#fbbf24',
                fontWeight: 700,
              }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Left: Image + Info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {product.imageUrl ? (
                <Box sx={{ position: 'relative', width: 250, height: 250 }}>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="250px"
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    width: 250,
                    height: 250,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h2" color="text.disabled">
                    {product.code}
                  </Typography>
                </Box>
              )}

              {/* Specs */}
              <Box sx={{ width: '100%' }}>
                <InfoRow label="Nom" value={product.name} />
                {product.nameEn && (
                  <InfoRow label="Nom EN" value={product.nameEn} />
                )}
                {product.nameFr && (
                  <InfoRow label="Nom FR" value={product.nameFr} />
                )}
                {product.nameHasbro && (
                  <InfoRow label="Hasbro" value={product.nameHasbro} />
                )}
                {product.price && (
                  <InfoRow
                    label="Prix"
                    value={`¥${product.price.toLocaleString('fr-FR')}`}
                  />
                )}
                {product.releaseDate && (
                  <InfoRow
                    label="Sortie"
                    value={new Date(product.releaseDate).toLocaleDateString(
                      'fr-FR',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      },
                    )}
                  />
                )}
                {product.hasbroCode && (
                  <InfoRow label="Code Hasbro" value={product.hasbroCode} />
                )}
              </Box>
            </Box>
          </Grid>

          {/* Right: Beyblades */}
          <Grid size={{ xs: 12, md: 7 }}>
            {product.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.description}
                </Typography>
              </Box>
            )}

            {product.beyblades.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Beyblades inclus ({product.beyblades.length})
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {product.beyblades.map((bey) => (
                    <Box
                      key={bey.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      {bey.blade?.imageUrl && (
                        <Box
                          sx={{
                            position: 'relative',
                            width: 60,
                            height: 60,
                            flexShrink: 0,
                          }}
                        >
                          <Image
                            src={bey.blade.imageUrl}
                            alt={bey.name}
                            fill
                            sizes="60px"
                            style={{ objectFit: 'contain' }}
                          />
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {bey.name}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap',
                            mt: 0.5,
                          }}
                        >
                          {bey.blade && (
                            <Chip
                              label={bey.blade.name}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: alpha('#dc2626', 0.1),
                                color: '#dc2626',
                              }}
                            />
                          )}
                          {bey.ratchet && (
                            <Chip
                              label={bey.ratchet.name}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: alpha('#fbbf24', 0.1),
                                color: '#fbbf24',
                              }}
                            />
                          )}
                          {bey.bit && (
                            <Chip
                              label={bey.bit.name}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: alpha('#22c55e', 0.1),
                                color: '#22c55e',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {product.includedParts.length > 0 &&
              product.beyblades.length === 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Contenu
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {product.includedParts.map((part) => (
                      <Chip
                        key={part}
                        label={part}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

            {/* Links */}
            {(product.productUrl || product.shopUrl) && (
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                {product.productUrl && (
                  <Chip
                    label="Page produit"
                    component="a"
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    color="primary"
                    size="small"
                  />
                )}
                {product.shopUrl && (
                  <Chip
                    label="Acheter"
                    component="a"
                    href={product.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    color="success"
                    size="small"
                  />
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ textAlign: 'right' }}
      >
        {value}
      </Typography>
    </Box>
  );
}
