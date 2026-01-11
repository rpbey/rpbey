import { History, Radio } from '@mui/icons-material';
import { Card, CardContent, Typography } from '@mui/material';

interface ViewerCountProps {
  isLive: boolean;
  viewerCount?: number;
  hasLatestVideo: boolean;
}

export default function ViewerCount({
  isLive,
  viewerCount,
  hasLatestVideo,
}: ViewerCountProps) {
  return (
    <Card
      sx={{
        borderRadius: 4,
        minHeight: { xs: 160, md: '100%' }, // Ensure mobile visibility
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'surface.low',
      }}
    >
      <CardContent sx={{ textAlign: 'center' }}>
        {isLive ? (
          <>
            <Radio
              sx={{ fontSize: { xs: 40, md: 48 }, mb: 1, color: 'error.main' }}
            />
            <Typography variant="subtitle1" fontWeight="bold">
              {viewerCount} Spectateurs
            </Typography>
          </>
        ) : (
          <>
            <History
              sx={{
                fontSize: { xs: 40, md: 48 },
                mb: 1,
                color: 'text.secondary',
              }}
            />
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.secondary"
            >
              {hasLatestVideo ? 'Rediffusion' : 'Hors ligne'}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
