import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, username, twoFactor } from "better-auth/plugins";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    username(),
    twoFactor({
      issuer: "RPB Dashboard",
    }),
  ],

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Social providers (Discord OAuth)
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["https://www.googleapis.com/auth/spreadsheets"],
    },
  },

  // Callbacks
  callbacks: {
    async session({ session, user }: { 
      session: { user: Record<string, unknown> }; 
      user: { role?: string } 
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
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "https://rpbey.fr",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session["user"];
