export const Colors = {
  Primary: 0xdc2626, // RPB Red (from logo)
  Secondary: 0xfbbf24, // RPB Gold/Yellow (from logo)
  Success: 0x22c55e, // Green
  Warning: 0xf59e0b, // Orange
  Error: 0xef4444, // Red
  Info: 0x3b82f6, // Blue
  Beyblade: 0x8b5cf6, // Purple for Beyblade
  // Role Colors
  Admin: 0x27a169,
  Rh: 0x3498db,
  Modo: 0x9b59b6,
  Staff: 0x206694,
} as const;

export const Emojis = {
  Success: '✅',
  Error: '❌',
  Warning: '⚠️',
  Loading: '⏳',
  Info: 'ℹ️',
  Ping: '🏓',
  User: '👤',
  Server: '📋',
  Bot: '🤖',
  Kick: '👢',
  Ban: '🔨',
  Clear: '🧹',
  Welcome: '👋',
  // Beyblade specific
  Beyblade: '🌀',
  Tournament: '🏆',
  Battle: '⚔️',
  Win: '🥇',
  Lose: '💥',
} as const;

export const RPB = {
  Name: 'RPB Bot',
  FullName: 'République Populaire du Beyblade',
  Discord: 'https://discord.gg/twdVfesrRj',
  Color: 0xdc2626,
  GoldColor: 0xfbbf24,
  // Channel names for auto-detection
  Channels: {
    Welcome: 'bienvenue',
    Rules: 'règlement',
    Roles: 'rôles',
    Announcements: 'annonces',
    Tournaments: 'annonce-tournois',
    Social: '1333203623471087708',
    GeneralChat: 'chat-general',
    Suggestions: 'suggestions',
    Media: 'média',
  },
  // Role IDs
  Roles: {
    Admin: '1319720685714804809',
    Modo: '1331256093434712095',
    Rh: '1446871643753418793',
    Staff: '1448458421702754474',
    Partenaires: '1457835411052298411',
  },
  // Role Icons (External URLs)
  RoleIcons: {
    Admin: 'https://rpbey.fr/logo-admin.png',
    Modo: 'https://rpbey.fr/logo-modo.png',
    Rh: 'https://rpbey.fr/logo-rh.png',
    Staff: 'https://rpbey.fr/logo-staff.png',
    Default: 'https://rpbey.fr/logo.png',
  },
  // Partners
  Partners: {
    SATR: {
      Id: '1221611301332193371',
      Name: 'SATR',
      Description:
        'Un serveur partenaire dédié aux tournois et à la communauté Beyblade.',
      Invite: 'https://discord.gg/afEvCBF9XR',
    },
    WB: {
      Id: '1295379706564055155',
      Name: 'WB',
      Description: 'Un serveur partenaire pour les passionnés de Beyblade.',
      Invite: 'https://discord.gg/AcuSPdb2HQ',
    },
  },
  // Beyblade series
  Series: {
    BakutenShoot: 'Bakuten Shoot (2001-2003)',
    MetalFight: 'Metal Fight (2008-2012)',
    Burst: 'Burst (2016-2022)',
    X: 'X (2023+)',
  },
} as const;
