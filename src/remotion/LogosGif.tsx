import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  interpolate,
} from 'remotion';

export const LogosGif: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logos = [
    '/logo.png',
    '/logo-admin.png',
    '/logo-modo.png',
    '/logo-rh.png',
    '/logo-staff.png',
  ];

  const durationPerLogo = fps; // 1 second each
  const logoIndex = Math.floor(frame / durationPerLogo) % logos.length;
  const currentLogo = logos[logoIndex];

  // Optional: subtle fade transition
  const logoFrame = frame % durationPerLogo;
  const opacity = interpolate(
    logoFrame,
    [0, 5, durationPerLogo - 5, durationPerLogo],
    [0, 1, 1, 0],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={staticFile(currentLogo || '/logo.png')}
        style={{
          height: '80%',
          width: 'auto',
          objectFit: 'contain',
          opacity,
        }}
        alt="RPB Logo"
      />
    </AbsoluteFill>
  );
};
