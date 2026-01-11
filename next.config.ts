import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Output standalone for Docker deployment
  output: "standalone",

  // Cache Components (Next.js 16+)
  cacheComponents: false,

  // External packages for server (Puppeteer/Crawlee)
  serverExternalPackages: ["puppeteer", "crawlee", "turndown", "@napi-rs/canvas"],

  // Experimental features
  experimental: {
    // Enable PPR for faster page loads
    // ppr: true,
    serverActions: {
      allowedOrigins: ["46.224.145.55:3000", "rpbey.fr", "localhost:3000"],
    },
  },

  // Dev origins
  allowedDevOrigins: ["46.224.145.55", "rpbey.fr"],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
