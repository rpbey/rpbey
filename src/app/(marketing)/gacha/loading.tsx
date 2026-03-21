import { Box, Skeleton } from '@mui/material';

export default function GachaLoading() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', p: { xs: 2, md: 4 } }}>
      {/* Hero skeleton */}
      <Skeleton
        variant="rectangular"
        sx={{
          width: '100%',
          height: { xs: 300, md: 450 },
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.05)',
          mb: 4,
        }}
      />

      {/* Stats row skeleton */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            sx={{
              flex: '1 1 200px',
              height: 100,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.05)',
            }}
          />
        ))}
      </Box>

      {/* Cards grid skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 2,
        }}
      >
        {[...Array(12)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            sx={{
              aspectRatio: '2/3',
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.05)',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
