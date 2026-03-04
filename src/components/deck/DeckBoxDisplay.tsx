'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import type { Deck } from './DeckCard';

interface DeckBoxDisplayProps {
  deck: Deck;
}

export function DeckBoxDisplay({ deck }: DeckBoxDisplayProps) {
  // We extract the three beys from the deck, sorted by position
  const sortedBeys = deck?.beys ? [...deck.beys].sort((a, b) => a.position - b.position) : [];

  // Approximate relative coordinates for the 3 holes in the deckbox.png image
  // The image shows an open box with 3 slots aligned horizontally at the bottom half
  const positions = [
    { left: '21%', top: '65%', width: '22%' },  // Left slot
    { left: '50%', top: '65%', width: '22%' },  // Center slot
    { left: '79%', top: '65%', width: '22%' },  // Right slot
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mb: 4 }}>
      <Typography variant="h6" fontWeight="900" sx={{ mb: 2, textAlign: 'center' }}>
        Equipement Actif : {deck.name}
      </Typography>
      
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1.6', borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        {/* Background Deckbox Image */}
        <Image
          src="/deckbox.png"
          alt="Deckbox"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />

        {/* Overlay Beys */}
        {sortedBeys.map((bey, index) => {
          if (!bey.blade?.imageUrl) return null;
          const pos = positions[index];
          if (!pos) return null;

          return (
            <Box
              key={bey.id}
              sx={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                width: pos.width,
                aspectRatio: '1',
                transform: 'translate(-50%, -50%)',
                // Perspective transforms to match the 3D angle of the box
                perspective: '500px',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transform: 'rotateX(45deg) scaleY(0.85)', // Tilt it to match the camera angle looking into the box
                  filter: 'drop-shadow(0 15px 10px rgba(0,0,0,0.8))',
                  '&:hover': {
                    transform: 'rotateX(0deg) scaleY(1) scale(1.2) translateY(-20px)',
                    zIndex: 10,
                    transition: 'transform 0.3s ease-out'
                  },
                  transition: 'transform 0.3s ease-out'
                }}
              >
                <Image
                  src={bey.blade.imageUrl}
                  alt={bey.blade.name}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
