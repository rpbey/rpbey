'use client';

import { alpha, Box } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

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

interface YoyoAvatarProps {
  size?: number;
}

export function YoyoAvatar({ size = 400 }: YoyoAvatarProps) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animation de la séquence
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % AVATAR_IMAGES.length);
    }, 80); // ~12 fps pour matcher le feeling VTuber
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        width: size,
        height: size,
        cursor: 'pointer',
        zIndex: 1,
      }}
    >
      <motion.div
        animate={{
          y: isHovered ? -10 : [0, -15, 0],
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{
          y: isHovered
            ? { duration: 0.2 }
            : { repeat: Infinity, duration: 3, ease: 'easeInOut' },
          scale: { duration: 0.3 },
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          filter: `drop-shadow(0 0 30px ${alpha('#dc2626', 0.3)})`,
        }}
      >
        <Image
          src={`/yoyo-model/${AVATAR_IMAGES[index]}`}
          alt="Yoyo - Game Master"
          fill
          priority
          style={{ objectFit: 'contain' }}
          unoptimized // On veut garder la réactivité du changement d'image
        />
      </motion.div>

      {/* Decorative Aura */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
              zIndex: -1,
            }}
          />
        )}
      </AnimatePresence>
    </Box>
  );
}
