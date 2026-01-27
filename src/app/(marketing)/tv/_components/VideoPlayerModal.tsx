'use client';

import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { VideoInfo } from '@/lib/twitch';

interface VideoPlayerModalProps {
  open: boolean;
  video: VideoInfo | null;
  type: 'twitch' | 'youtube' | null;
  onClose: () => void;
  domain: string;
}

export function VideoPlayerModal({
  open,
  video,
  type,
  onClose,
  domain,
}: VideoPlayerModalProps) {
  if (!video || !type) return null;

  let embedUrl = '';
  if (type === 'youtube') {
    embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`;
  } else if (type === 'twitch') {
    // Check if it's a clip or a video
    // Twitch clips IDs are strings (slugs), video IDs are numbers usually but stored as strings.
    // Clips URL usually contains "clip" or we can rely on the passed 'type'.
    // Assuming 'twitch' here means Clips for now as per user request, but could be VOD.
    // However, the Twitch API returns different objects.
    // Let's assume Clips for now if the URL contains 'clip' or based on context.
    // Actually, `getRPBClips` returns clips.

    // Construct embed for Clip
    embedUrl = `https://clips.twitch.tv/embed?clip=${video.id}&parent=${domain}&autoplay=true`;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'black',
          backgroundImage: 'none',
          overflow: 'hidden',
          borderRadius: 2,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography
          variant="h6"
          noWrap
          sx={{ color: 'white', flexGrow: 1, mr: 2 }}
        >
          {video.title}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 0, aspectRatio: '16/9', bgcolor: 'black' }}>
        <iframe
          src={embedUrl}
          title={video.title}
          width="100%"
          height="100%"
          allowFullScreen
          style={{ border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </DialogContent>
    </Dialog>
  );
}
