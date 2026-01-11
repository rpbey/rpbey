import { Box } from '@mui/material';

interface TwitchPlayerProps {
  channelName: string;
  isLive: boolean;
  videoId?: string | null;
  domain?: string;
}

export default function TwitchPlayer({
  channelName,
  isLive,
  videoId,
  domain = 'rpbey.fr',
}: TwitchPlayerProps) {
  const playerBaseUrl = 'https://player.twitch.tv/';
  const parentParam = `&parent=${domain}&parent=localhost`;

  let playerSrc = `${playerBaseUrl}?channel=${channelName}${parentParam}`;

  if (!isLive && videoId) {
    playerSrc = `${playerBaseUrl}?video=${videoId}${parentParam}`;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        bgcolor: 'black',
        borderRadius: 4,
        overflow: 'hidden',
        mb: 4,
        boxShadow: 10,
      }}
    >
      <iframe
        src={playerSrc}
        title="Twitch Player"
        height="100%"
        width="100%"
        allowFullScreen
        style={{ border: 'none' }}
      />
    </Box>
  );
}
