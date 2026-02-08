import type React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Sequence d'images
const AVATAR_IMAGES = [
  '1000062223.png',
  '1000062224.png',
  '1000062225.png',
  '1000062226.png',
  '1000062227.png',
  '1000062228.png',
  '1000062229.png',
  '1000062230.png',
  '1000062231.png',
  '1000062233.png',
  '1000062237.png',
  '1000062238.png',
  '1000062239.png',
  '1000062240.png',
  '1000062241.png',
  '1000062243.png',
  '1000062244.png',
  '1000062245.png',
  '1000062246.png',
  '1000062248.png',
  '1000062249.png',
  '1000062250.png',
  '1000062252.png',
  '1000062253.png',
  '1000062254.png',
];

export const AphrodyGif: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation à 12 FPS pour le style "anime"
  const imagesPerSecond = 12;
  const imageIndex =
    Math.floor((frame / fps) * imagesPerSecond) % AVATAR_IMAGES.length;
  const currentImage = AVATAR_IMAGES[imageIndex];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#ff00ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Img
        src={staticFile(`/yoyo-model/${currentImage}`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </AbsoluteFill>
  );
};
