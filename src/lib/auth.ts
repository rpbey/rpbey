import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, twoFactor, username } from 'better-auth/plugins';
import { prisma } from '@/lib/prisma';

const isProduction = process.env.NODE_ENV === 'production';
const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (isProduction ? 'https://rpbey.fr' : 'http://localhost:3000');

export const auth = betterAuth({
  baseURL,
  trustHost: true,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
    username(),
    twoFactor({
      issuer: 'RPB Dashboard',
    }),
  ],

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Social providers (Discord OAuth)
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      mapProfileToUser: (profile) => {
        return {
          discordId: profile.id,
          discordTag:
            profile.discriminator === '0'
              ? profile.username
              : `${profile.username}#${profile.discriminator}`,
          image: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
          globalName: profile.global_name,
        };
      },
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      scope: ['https://www.googleapis.com/auth/spreadsheets'],
    },
  },

  // Advanced configuration
  advanced: {
    useSecureCookies: true, // Force secure cookies for production behind proxy
    cookiePrefix: 'rpb-auth',
  },

  // Callbacks
  callbacks: {
    async session({
      session,
      user,
    }: {
      session: { user: Record<string, unknown> };
      user: { role?: string };
    }) {
      return {
        ...session,
        user: {
          ...session.user,
          role: user.role,
        },
      };
    },
  },

  // Trusted origins
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    'https://rpbey.fr',
    'http://localhost:8000',
    'http://46.224.145.55:3000',
    'http://46.224.145.55:8000',
    'https://46.224.145.55:3000',
    'https://46.224.145.55:8000',
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = (typeof auth.$Infer.Session)['user'];
