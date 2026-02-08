import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
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
        src={staticFile(currentLogo || '/logo.png')}
        style={{
          height: '80%',
          width: 'auto',
          objectFit: 'contain',
        }}
      />
    </AbsoluteFill>
  );
};
