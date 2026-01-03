'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import type { ElementType } from 'react'

interface FeatureCardProps {
  icon: ElementType
  title: string
  description: string
  href: string
  color: string
  external?: boolean
}

export function FeatureCard({ icon: Icon, title, description, href, color, external }: FeatureCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: color,
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 40px ${alpha(color, 0.2)}`,
        },
      }}
    >
      <CardActionArea
        component={external ? 'a' : Link}
        href={href}
        target={external ? '_blank' : undefined}
        sx={{ height: '100%', p: 3 }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.1),
            color: color,
            mb: 2,
          }}
        >
          <Icon size={28} style={{ width: 28, height: 28 }} />
        </Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardActionArea>
    </Card>
  )
}
