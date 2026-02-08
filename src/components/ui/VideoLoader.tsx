'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Box } from '@mui/material';

export function VideoLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Trigger loading state on route change
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1200); // Duration of the animation
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (loading && videoRef.current) {
      videoRef.current.playbackRate = 2.5; // Accelerated playback
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Handle autoplay block if necessary
      });
    }
  }, [loading]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
        >
          <Box
            component="video"
            ref={videoRef}
            src="/rpb.mp4"
            muted
            loop
            playsInline
            sx={{
              width: { xs: '80%', md: '40%' },
              maxWidth: '500px',
              height: 'auto',
              filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.5))',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
