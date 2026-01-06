import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Output standalone for Docker deployment
  output: "standalone",
  
  // Cache Components (Next.js 16+)
  cacheComponents: true,

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
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
