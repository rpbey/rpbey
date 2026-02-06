import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  random,
  spring,
} from 'remotion';

const FONT_FAMILY = 'Google Sans Flex, system-ui, sans-serif';

// Liste des images triées pour l'animation
const AVATAR_IMAGES = [
  '1000062223.png', '1000062224.png', '1000062225.png', '1000062226.png',
  '1000062227.png', '1000062228.png', '1000062229.png', '1000062230.png',
  '1000062231.png', '1000062233.png', '1000062237.png', '1000062238.png',
  '1000062239.png', '1000062240.png', '1000062241.png', '1000062243.png',
  '1000062244.png', '1000062245.png', '1000062246.png', '1000062248.png',
  '1000062249.png', '1000062250.png', '1000062252.png', '1000062253.png',
  '1000062254.png'
];

const GlitchText: React.FC<{ text: string; fontSize: number; color: string; y: number }> = ({ text, fontSize, color, y }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  
  // Effet de glitch aléatoire
  const glitchOffset = random(frame) > 0.9 ? (random(frame + 1) - 0.5) * 10 : 0;
  
  return (
    <div style={{ position: 'absolute', width: '100%', top: y, textAlign: 'center', opacity }}>
      <h1
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          fontWeight: 900,
          color: color,
          textTransform: 'uppercase',
          textShadow: '0 0 10px rgba(0,0,0,0.5)',
          transform: `translateX(${glitchOffset}px)`,
          margin: 0,
        }}
      >
        {text}
      </h1>
    </div>
  );
};

export const GameMaster: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  // Animation de la séquence d'images (boucle)
  const imagesPerSecond = 12; // Vitesse de l'animation
  const imageIndex = Math.floor((frame / fps) * imagesPerSecond) % AVATAR_IMAGES.length;
  const currentImage = AVATAR_IMAGES[imageIndex];

  // Effet d'entrée (Spring)
  const scale = spring({
    frame,
    fps,
    config: { stiffness: 100, damping: 10 },
  });

  // Background animé (scanlines)
  const scanlineY = (frame * 5) % height;

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', overflow: 'hidden' }}>
      {/* Background Grid */}
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* Avatar Central */}
      <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ 
          transform: `scale(${scale})`,
          filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.4))' // Rouge RPB
        }}>
          <Img
            src={staticFile(`/yoyo-model/${currentImage}`)}
            style={{
              height: 600,
              objectFit: 'contain',
            }}
          />
        </div>
      </AbsoluteFill>

      {/* Textes */}
      <GlitchText text="Le Maître du Jeu" fontSize={80} color="#dc2626" y={150} />
      <GlitchText text="APHRODY" fontSize={40} color="#fbbf24" y={800} />

      {/* Scanline Effect */}
      <div
        style={{
          position: 'absolute',
          top: scanlineY,
          left: 0,
          width: '100%',
          height: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
        }}
      />
      
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle, transparent 60%, black 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
