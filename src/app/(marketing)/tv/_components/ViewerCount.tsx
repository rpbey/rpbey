import { History, PeopleAlt } from '@mui/icons-material';
import { Box, Card, CardContent, Typography } from '@mui/material';

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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        minHeight: { xs: 80, md: '100%' },
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: isLive ? 'rgba(255,0,0,0.1)' : 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLive ? (
              <PeopleAlt sx={{ color: '#ff0000' }} />
            ) : (
              <History sx={{ color: 'text.secondary' }} />
            )}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1 }}>
              {isLive ? viewerCount : hasLatestVideo ? 'Rediffusion' : 'Off'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
              sx={{ textTransform: 'uppercase' }}
            >
              {isLive ? 'Spectateurs' : 'Statut'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
