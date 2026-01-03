export const APP_NAME = 'RPB Dashboard'
export const APP_DESCRIPTION = 'Le dashboard officiel de la République Populaire du Beyblade'

export const DISCORD_INVITE_URL = 'https://discord.gg/twdVfesrRj'

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  // Admin
  ADMIN: '/admin',
  ADMIN_DISCORD: '/admin/discord',
  ADMIN_TWITCH: '/admin/twitch',
  ADMIN_TOURNAMENTS: '/admin/tournaments',
  ADMIN_USERS: '/admin/users',
  ADMIN_STATS: '/admin/stats',
  ADMIN_SETTINGS: '/admin/settings',
  // Streaming
  TV: '/tv',
  // Public
  TOURNAMENTS: '/tournaments',
  RANKINGS: '/rankings',
  PROFILE: '/profile',
} as const

export const RPB_COLORS = {
  primary: '#dc2626', // Rouge RPB
  secondary: '#fbbf24', // Or
  background: '#121212',
  surface: '#1e1e1e',
} as const
