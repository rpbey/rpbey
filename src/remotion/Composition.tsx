'use client';

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const BeybladeIntro: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scale = spring({
    frame,
    fps,
    config: {
      stiffness: 100,
    },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{ opacity, transform: `scale(${scale})`, textAlign: 'center' }}
      >
        <h1
          style={{
            fontSize: 80,
            margin: 0,
            background: 'linear-gradient(45deg, #dc2626, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h1>
        <h2
          style={{
            fontSize: 40,
            color: '#fbbf24',
            marginTop: 20,
            fontWeight: 600,
          }}
        >
          {subtitle}
        </h2>
      </div>
    </AbsoluteFill>
  );
};
