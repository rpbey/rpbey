'use client';

import { Box, useTheme, alpha } from '@mui/material';
import React from 'react';

interface StatRadarProps {
  stats: {
    attack: number;
    defense: number;
    stamina: number;
    dash: number;
    burst: number;
    weight: number;
  };
  size?: number;
  color?: string;
}

export function StatRadar({ stats, size = 200, color = '#dc2626' }: StatRadarProps) {
  const theme = useTheme();
  
  // Normalize stats to 0-100 scale for the chart
  // Assuming raw stats are already somewhat normalized or we cap them
  const normalize = (val: number) => Math.min(Math.max(val, 5), 100);

  const data = [
    { label: 'ATK', value: normalize(stats.attack) },
    { label: 'DEF', value: normalize(stats.defense) },
    { label: 'STA', value: normalize(stats.stamina) },
    { label: 'DSH', value: normalize(stats.dash) },
    { label: 'BST', value: normalize(stats.burst) },
    { label: 'WGT', value: normalize((stats.weight / 50) * 100) }, // Approx normalization for weight
  ];

  const numStats = data.length;
  const angleStep = (Math.PI * 2) / numStats;
  const radius = size / 2 - 20;
  const center = size / 2;

  // Generate background polygons (the grid)
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridPolygons = levels.map((level) => {
    const points = data.map((_, i) => {
      const x = center + radius * level * Math.cos(i * angleStep - Math.PI / 2);
      const y = center + radius * level * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    });
    return points.join(' ');
  });

  // Generate the data polygon
  const dataPoints = data.map((d, i) => {
    const r = (d.value / 100) * radius;
    const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
    const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Box sx={{ width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid lines */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke={alpha(theme.palette.divider, 0.1 + i * 0.05)}
            strokeWidth="1"
          />
        ))}
        
        {/* Axis lines */}
        {data.map((_, i) => {
          const x = center + radius * Math.cos(i * angleStep - Math.PI / 2);
          const y = center + radius * Math.sin(i * angleStep - Math.PI / 2);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={alpha(theme.palette.divider, 0.1)}
              strokeWidth="1"
            />
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const x = center + (radius + 12) * Math.cos(i * angleStep - Math.PI / 2);
          const y = center + (radius + 12) * Math.sin(i * angleStep - Math.PI / 2);
          return (
            <text
              key={i}
              x={x}
              y={y}
              fill={theme.palette.text.secondary}
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
              alignmentBaseline="middle"
              style={{ letterSpacing: 0.5 }}
            >
              {d.label}
            </text>
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPoints}
          fill={alpha(color, 0.3)}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ transition: 'all 0.5s ease-out' }}
        />

        {/* Data dots */}
        {data.map((d, i) => {
          const r = (d.value / 100) * radius;
          const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
          const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              style={{ transition: 'all 0.5s ease-out' }}
            />
          );
        })}
      </svg>
    </Box>
  );
}
