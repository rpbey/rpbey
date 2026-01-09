'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { RoleColors, type RoleType } from '@/lib/role-colors';
import { RolePaths } from '@/lib/role-paths';
import Box from '@mui/material/Box';

export interface RoleIconProps {
  /**
   * The role type ('ADMIN', 'MODO', 'RH', 'STAFF', 'DEFAULT')
   */
  role: RoleType;
  /**
   * Size in pixels
   * @default 48
   */
  size?: number;
  /**
   * Animation duration in seconds
   * @default 2
   */
  duration?: number;
  /**
   * Whether to animate on mount
   * @default true
   */
  animate?: boolean;
  /**
   * Whether to loop the animation
   * @default false
   */
  loop?: boolean;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Stroke width override
   */
  strokeWidth?: number;
}

export const RoleIcon: React.FC<RoleIconProps> = ({
  role,
  size = 48,
  duration = 2,
  animate = true,
  loop = false,
  className,
  strokeWidth = 2,
}) => {
  const config = RoleColors[role] || RoleColors.DEFAULT;
  const color = 'hex' in config ? config.hex : config.secondary;
  const paths = RolePaths[role] || RolePaths.DEFAULT;

  const pathVariants: Variants = {
    initial: { 
      pathLength: 0, 
      opacity: 0 
    },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        pathLength: { 
          duration: duration, 
          ease: "easeInOut",
          repeat: loop ? Infinity : 0,
          repeatType: "loop",
          repeatDelay: 1
        },
        opacity: { duration: 0.2 }
      }
    }
  };

  const fillVariants: Variants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        delay: duration * 0.8, // Start filling when drawing is mostly done
        duration: 0.5 
      }
    }
  };

  return (
    <Box
      className={className}
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 500 500"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
          {paths.strokePaths.map((d: string, i: number) => (
            <motion.path
              key={`stroke-${i}`}
              d={d}
              variants={pathVariants}
              initial="initial"
              animate={animate ? "animate" : "initial"}
            />
          ))}
        </g>
        <g fill={color}>
          {paths.fillPaths.map((d: string, i: number) => (
            <motion.path
              key={`fill-${i}`}
              d={d}
              variants={fillVariants}
              initial="initial"
              animate={animate ? "animate" : "initial"}
            />
          ))}
        </g>
      </svg>
    </Box>
  );
};

export default RoleIcon;
