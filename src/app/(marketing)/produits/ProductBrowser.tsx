'use client';

import { Search } from '@mui/icons-material';
import {
  Box,
  Container,
  Grid,
  InputAdornment,
  Pagination,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type { Beyblade, Part, Product } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import { getPublicProducts } from '@/server/actions/products';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';

type ProductLine = 'ALL' | 'BX' | 'UX' | 'CX';
type ProductWithBeys = Product & {
  beyblades: (Beyblade & {
    blade: Part | null;
    ratchet: Part | null;
    bit: Part | null;
  })[];
};

const LINE_TABS: { label: string; value: ProductLine }[] = [
  { label: 'Tous', value: 'ALL' },
  { label: 'BX', value: 'BX' },
  { label: 'UX', value: 'UX' },
  { label: 'CX', value: 'CX' },
];

export function ProductBrowser() {
  const [products, setProducts] = useState<ProductWithBeys[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [line, setLine] = useState<ProductLine>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<ProductWithBeys | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const result = await getPublicProducts({
      search,
      productLine: line,
      page,
      pageSize: 24,
    });
    setProducts(result.products as ProductWithBeys[]);
    setTotalPages(result.totalPages);
    setTotal(result.total);
    setLoading(false);
  }, [search, line, page]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, line]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h2"
          component="h1"
          fontWeight="900"
          sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
        >
          Catalogue Produits
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {total} produits Beyblade X disponibles
        </Typography>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3,
          alignItems: { md: 'center' },
        }}
      >
        <TextField
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 300 }}
        />

        <Tabs
          value={line}
          onChange={(_, v) => setLine(v as ProductLine)}
          sx={{
            '& .MuiTab-root': {
              minWidth: 60,
              fontWeight: 700,
            },
          }}
        >
          {LINE_TABS.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>
      </Box>

      {/* Grid */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">Chargement...</Typography>
        </Box>
      ) : products.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Aucun produit trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Essayez un autre terme de recherche
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid key={product.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
              <ProductCard
                product={product}
                onClick={() => setSelected(product)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
          />
        </Box>
      )}

      <ProductDetailModal
        product={selected}
        onClose={() => setSelected(null)}
      />
    </Container>
  );
}
