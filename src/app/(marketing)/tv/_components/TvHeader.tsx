import { Avatar, Box, Typography } from '@mui/material';
import { RpbLogo } from '@/components/ui/RpbLogo';

export default function TvHeader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
        px: { xs: 1, md: 0 },
        bgcolor: 'background.default',
        borderBottom: { xs: '1px solid', md: 'none' },
        borderColor: 'divider',
        mb: { xs: 2, md: 4 },
      }}
    >
      {/* Gauche: Logo RPB TV style YouTube */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
            <RpbLogo size={32} animated />
          </Box>
          <Typography
            variant="h6"
            fontWeight="900"
            sx={{
              letterSpacing: '-0.05em',
              textTransform: 'uppercase',
              fontSize: { xs: '1.2rem', md: '1.5rem' },
            }}
          >
            Rediffusion{' '}
            <Box
              component="span"
              sx={{
                color: 'text.secondary',
                fontSize: '0.6em',
                fontWeight: 'bold',
                verticalAlign: 'top',
                ml: 0.2,
              }}
            >
              TV
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* Droite: Actions YouTube Style */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            ml: 1,
            bgcolor: 'secondary.main',
            color: 'black',
            fontSize: '0.8rem',
            fontWeight: 'bold',
          }}
        >
          R
        </Avatar>
      </Box>
    </Box>
  );
}
