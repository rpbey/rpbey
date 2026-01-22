'use client';

import { Box, Container, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface TournamentVideoProps {
  videoId: string;
  title?: string;
  subtitle?: string;
}

export function TournamentVideo({
  videoId,
  title = 'REVIVEZ L’EXPÉRIENCE',
  subtitle = 'Les meilleurs moments du dernier tournoi en vidéo.',
}: TournamentVideoProps) {
  return (
    <Box sx={{ py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          sx={{ mb: 6, textAlign: 'center' }}
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            sx={{ mb: 2, letterSpacing: '-0.02em' }}
          >
            {title}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            {subtitle}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          sx={{
            width: '100%',
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'black',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
            position: 'relative',
            pt: '56.25%', // 16:9 Aspect Ratio
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
            title="Tournament Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </Paper>
      </Container>
    </Box>
  );
}
