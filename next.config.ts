import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Output standalone for Docker deployment
  output: "standalone",

  // Cache Components (Next.js 16+)
  cacheComponents: false, // Disabled due to instability with external scraping

  // External packages for server (Puppeteer/Crawlee)
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "crawlee",
    "turndown",
    "@napi-rs/canvas",
    "@tobyg74/tiktok-api-dl"
  ],

  // Experimental features
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/x-charts",
      "@mui/x-data-grid",
      "@mui/x-date-pickers",
      "@mui/x-tree-view",
      "framer-motion",
    ],
    serverActions: {
      allowedOrigins: [
        "46.224.145.55:3000", 
        "46.224.145.55:8000",
        "rpbey.fr", 
        "localhost:3000",
        "localhost:8000"
      ],
    },
  },

  // Dev origins
  allowedDevOrigins: ["46.224.145.55", "rpbey.fr"],

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
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
      {
        protocol: "https",
        hostname: "static-cdn.jtvnw.net",
      },
      {
        protocol: "https",
        hostname: "*.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/bot/socket/:path*",
        destination: "http://46.224.145.55:3001/socket.io/:path*",
      },
    ];
  },
};

export default nextConfig;
