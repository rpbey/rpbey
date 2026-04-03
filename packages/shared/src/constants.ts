import type { CardElement, CardRarity } from './types';

// ─── API ─────────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://localhost:3000'
    : 'https://rpbey.fr';

declare const __DEV__: boolean | undefined;

// ─── Gacha Constants ─────────────────────────────────────────────────────────

export const SINGLE_PULL_COST = 100;
export const MULTI_PULL_COST = 450;
export const MULTI_PULL_COUNT = 5;
export const DAILY_BASE_AMOUNT = 50;
export const DAILY_STREAK_BONUS = 10;
export const DAILY_MAX_BONUS = 100;
export const PITY_THRESHOLD = 3;

// ─── Rarity Themes ───────────────────────────────────────────────────────────

export interface RarityTheme {
  borderColor: string;
  glowColor: string;
  bgGradient: [string, string, string];
  accentColor: string;
  label: string;
  stars: number;
  particleCount: number;
}

export const RARITY_THEMES: Record<CardRarity, RarityTheme> = {
  COMMON: {
    borderColor: '#6b7280',
    glowColor: 'rgba(107,114,128,0.25)',
    bgGradient: ['#1a1f2e', '#141824', '#0d1117'],
    accentColor: '#9ca3af',
    label: 'COMMUNE',
    stars: 1,
    particleCount: 0,
  },
  RARE: {
    borderColor: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.35)',
    bgGradient: ['#0c2461', '#1e3a5f', '#0a1628'],
    accentColor: '#60a5fa',
    label: 'RARE',
    stars: 2,
    particleCount: 4,
  },
  SUPER_RARE: {
    borderColor: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.4)',
    bgGradient: ['#1e0a4a', '#2e1065', '#140530'],
    accentColor: '#a78bfa',
    label: 'SUPER RARE',
    stars: 3,
    particleCount: 8,
  },
  LEGENDARY: {
    borderColor: '#f59e0b',
    glowColor: 'rgba(251,191,36,0.5)',
    bgGradient: ['#3b1a00', '#422006', '#1a0d00'],
    accentColor: '#fcd34d',
    label: 'LÉGENDAIRE',
    stars: 4,
    particleCount: 14,
  },
  SECRET: {
    borderColor: '#ef4444',
    glowColor: 'rgba(239,68,68,0.55)',
    bgGradient: ['#3b0a0a', '#450a0a', '#1f0000'],
    accentColor: '#f87171',
    label: '✦ SECRÈTE ✦',
    stars: 5,
    particleCount: 20,
  },
};

// ─── Element System ──────────────────────────────────────────────────────────

export interface ElementInfo {
  emoji: string;
  color: string;
  name: string;
}

export const ELEMENTS: Record<CardElement, ElementInfo> = {
  FEU: { emoji: '🔥', color: '#ef4444', name: 'Feu' },
  EAU: { emoji: '💧', color: '#3b82f6', name: 'Eau' },
  TERRE: { emoji: '🌍', color: '#a16207', name: 'Terre' },
  VENT: { emoji: '🌪️', color: '#22d3ee', name: 'Vent' },
  OMBRE: { emoji: '🌑', color: '#7c3aed', name: 'Ombre' },
  LUMIERE: { emoji: '✨', color: '#fbbf24', name: 'Lumière' },
  NEUTRAL: { emoji: '⚪', color: '#9ca3af', name: 'Neutre' },
};

// ─── Element Advantages ──────────────────────────────────────────────────────

export const ELEMENT_ADVANTAGE: Record<CardElement, CardElement> = {
  FEU: 'VENT',
  VENT: 'TERRE',
  TERRE: 'EAU',
  EAU: 'FEU',
  LUMIERE: 'OMBRE',
  OMBRE: 'LUMIERE',
  NEUTRAL: 'NEUTRAL',
};

// ─── RPB Branding ────────────────────────────────────────────────────────────

export const RPB_COLORS = {
  primary: '#dc2626',
  secondary: '#fbbf24',
  background: '#0d1117',
  surface: '#161b22',
  surfaceLight: '#21262d',
  border: '#30363d',
  text: '#e6edf3',
  textMuted: '#8b949e',
} as const;

// ─── Series Names ────────────────────────────────────────────────────────────

export const SERIES_NAMES: Record<string, string> = {
  BEYBLADE_X: 'Beyblade X',
  METAL_FUSION: 'Metal Fusion',
  METAL_MASTERS: 'Metal Masters',
  METAL_FURY: 'Metal Fury',
  BURST: 'Burst',
  BURST_GT: 'Burst GT',
  BURST_SPARKING: 'Burst Sparking',
  BURST_DB: 'Burst DB',
  ORIGINAL: 'Original',
};

// ─── Rarity Weights ──────────────────────────────────────────────────────────

export const RARITY_WEIGHTS: { rarity: CardRarity; weight: number }[] = [
  { rarity: 'COMMON', weight: 60 },
  { rarity: 'RARE', weight: 25 },
  { rarity: 'SUPER_RARE', weight: 10 },
  { rarity: 'LEGENDARY', weight: 4 },
  { rarity: 'SECRET', weight: 1 },
];

// ─── Fragment Colors (for pull animation) ────────────────────────────────────

export const FRAGMENT_COLORS: Record<
  CardRarity,
  {
    hues: number[];
    saturation: number;
    lightness: number;
    rainbow?: boolean;
  }
> = {
  LEGENDARY: {
    hues: [0, 30, 60, 120, 200, 280],
    saturation: 90,
    lightness: 80,
    rainbow: true,
  },
  SUPER_RARE: {
    hues: [40, 45, 50],
    saturation: 85,
    lightness: 75,
  },
  RARE: {
    hues: [270, 280, 290],
    saturation: 70,
    lightness: 70,
  },
  COMMON: {
    hues: [210, 220],
    saturation: 15,
    lightness: 90,
  },
  SECRET: {
    hues: [0, 30, 60, 120, 200, 280],
    saturation: 95,
    lightness: 85,
    rainbow: true,
  },
};
