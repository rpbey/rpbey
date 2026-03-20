import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

const SCENES = [
  { file: 'intro.jpg', title: '' },
  { file: 'rankings-overview.jpg', title: 'CLASSEMENT' },
  { file: 'rankings-compare.jpg', title: 'COMPARATEUR' },
  { file: 'meta-overview.jpg', title: 'META' },
  { file: 'meta-interact.jpg', title: 'ANALYSE' },
  { file: 'meta-deep.jpg', title: 'CATÉGORIES' },
  { file: 'tournaments.jpg', title: 'TOURNOIS' },
  { file: 'database.jpg', title: 'BASE DE DONNÉES' },
];

const SCENE_DURATION = 75; // 2.5s at 30fps
const TRANSITION = 15; // 0.5s transition

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const lineWidth = interpolate(frame, [10, 50], [0, 300], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 90,
          fontWeight: 900,
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          transform: `scale(${titleScale})`,
          letterSpacing: -2,
          lineHeight: 1.1,
        }}>
          <div>RÉPUBLIQUE</div>
          <div>POPULAIRE</div>
          <div style={{ color: '#dc2626' }}>DU BEYBLADE</div>
        </div>
        <div style={{
          width: lineWidth,
          height: 3,
          backgroundColor: '#dc2626',
          margin: '30px auto',
          borderRadius: 2,
        }} />
        <div style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          opacity: subtitleOpacity,
          letterSpacing: 6,
        }}>
          rpbey.fr
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SceneSlide: React.FC<{ file: string; title: string }> = ({ file, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const enter = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
  const slideX = interpolate(enter, [0, 1], [80, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  // Subtle zoom (Ken Burns)
  const zoom = interpolate(frame, [0, SCENE_DURATION], [1, 1.06], { extrapolateRight: 'clamp' });

  // Title animation
  const titleEnter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 12, stiffness: 80 } });
  const titleY = interpolate(titleEnter, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleEnter, [0, 1], [0, 1]);

  // Title bar animation
  const barWidth = interpolate(frame, [12, 35], [0, 200], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {/* Screenshot with zoom */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity,
        transform: `translateX(${slideX}px) scale(${zoom})`,
        transformOrigin: 'center center',
      }}>
        <Img
          src={staticFile(file)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%)',
        }} />
      </div>

      {/* Title overlay */}
      {title && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}>
          <div style={{
            width: barWidth,
            height: 4,
            backgroundColor: '#dc2626',
            marginBottom: 16,
            borderRadius: 2,
          }} />
          <div style={{
            fontSize: 56,
            fontWeight: 900,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: 4,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            {title}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const ctaOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' });
  const socialOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', transform: `scale(${scale})` }}>
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: 2,
        }}>
          REJOINS-NOUS
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: '#dc2626',
          fontFamily: 'system-ui, sans-serif',
          marginTop: 16,
          opacity: ctaOpacity,
        }}>
          rpbey.fr
        </div>
        <div style={{
          fontSize: 22,
          color: 'rgba(255,255,255,0.4)',
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          marginTop: 30,
          opacity: socialOpacity,
          letterSpacing: 4,
        }}>
          DISCORD · TIKTOK · TWITCH · YOUTUBE
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RPBTrailer: React.FC = () => {
  const titleDuration = 90; // 3s
  const outroDuration = 90; // 3s

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {/* Title card */}
      <Sequence from={0} durationInFrames={titleDuration}>
        <TitleCard />
      </Sequence>

      {/* Scenes */}
      {SCENES.map((scene, i) => {
        const from = titleDuration + i * (SCENE_DURATION - TRANSITION);
        return (
          <Sequence key={scene.file} from={from} durationInFrames={SCENE_DURATION}>
            <SceneSlide file={scene.file} title={scene.title} />
          </Sequence>
        );
      })}

      {/* Outro */}
      <Sequence
        from={titleDuration + SCENES.length * (SCENE_DURATION - TRANSITION)}
        durationInFrames={outroDuration}
      >
        <OutroCard />
      </Sequence>
    </AbsoluteFill>
  );
};
