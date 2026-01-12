'use client';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import useSWR from 'swr';
import type { FeedMyProduct } from '@/lib/feedmy';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function FeedMyPartnership() {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const discountCode = 'RPB10';
  const discountUrl = 'https://feedmy.fr/discount/RPB10';

  const { data: products } = useSWR<FeedMyProduct[]>(
    '/api/marketing/feedmy',
    fetcher,
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      variant="elevated"
      sx={{
        p: { xs: 3, md: 4 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: -35,
          bgcolor: '#fbbf24',
          color: '#000',
          px: 6,
          py: 0.5,
          transform: 'rotate(45deg)',
          fontWeight: 'bold',
          fontSize: '0.75rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 1,
          display: { xs: 'none', sm: 'block' }
        }}
      >
        SPONSOR
      </Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={4}
        alignItems="center"
      >
        <Box
          component="img"
          src="/partners/feedmy-announcement.png"
          alt="FeedMy x RPB Annonce"
          sx={{
            width: { xs: '100%', sm: 300, md: 250 },
            height: 'auto',
            borderRadius: 2,
            boxShadow: theme.shadows[4],
            flexShrink: 0,
            transform: { md: 'rotate(-3deg)' },
            transition: 'transform 0.3s',
            '&:hover': {
              transform: { md: 'rotate(0deg) scale(1.05)' },
            },
          }}
        />

        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="overline" color="primary" fontWeight="bold">
            Sponsor Officiel
          </Typography>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            FeedMy x RPB
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mb: 3 }}
          >
            FeedMy devient le sponsor attitré de la RPB ! Profitez de <strong>lots et concours de QUALITÉ</strong> lors de nos événements.
            <br />
            Utilisez le code <strong>{discountCode}</strong> pour <strong>-10% sur tout le site</strong> et bénéficiez de la <strong>livraison offerte dès 100€ d'achats</strong>.
          </Typography>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Box
              onClick={handleCopyCode}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 2,
                px: 2,
                py: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                  mr: 2,
                }}
              >
                {discountCode}
              </Typography>
              {copied ? (
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="success.main"
                >
                  Copié !
                </Typography>
              ) : (
                <ContentCopyIcon
                  sx={{ fontSize: 18, color: theme.palette.primary.main }}
                />
              )}
            </Box>

            <Button
              variant="contained"
              color="primary"
              endIcon={<LaunchIcon />}
              href={discountUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ py: 1.5 }}
            >
              Utiliser le code
            </Button>
          </Stack>
        </Box>
      </Stack>

      {products && products.length > 0 && (
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <LocalOfferIcon fontSize="small" />
            Derniers arrivages Beyblade
          </Typography>
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid size={{ xs: 6, md: 3 }} key={product.id}>
                <Box
                  component="a"
                  href={`https://feedmy.fr/products/${product.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '100%',
                      bgcolor: 'background.default',
                      borderRadius: 2,
                      overflow: 'hidden',
                      mb: 1,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    {product.images[0] && (
                      <Box
                        component="img"
                        src={product.images[0].src}
                        alt={product.title}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.primary"
                    fontWeight="bold"
                    display="block"
                    noWrap
                    title={product.title}
                  >
                    {product.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="primary"
                    fontWeight="bold"
                  >
                    {product.variants[0]?.price} €
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Card>
  );
}
