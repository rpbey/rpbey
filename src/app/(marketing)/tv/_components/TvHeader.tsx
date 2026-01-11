import { LiveTv } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

export default function TvHeader() {
  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LiveTv color="primary" sx={{ fontSize: { xs: 32, sm: 40 } }} />
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
        >
          RPB TV
        </Typography>
      </Box>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ display: { xs: 'none', sm: 'block' } }}
      >
        Le direct de la communauté sur Twitch
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        Le direct de la communauté sur Twitch
      </Typography>
    </Box>
  );
}
