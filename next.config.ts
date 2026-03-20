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
        process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "").replace("http://", "") || "localhost:3000",
        "rpbey.fr", 
        "localhost:3000",
        "localhost:8000",
        "46.224.145.55"
      ],
    },
  },

  // Dev origins
  allowedDevOrigins: [
    process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "").replace("http://", "").split(":")[0] || "localhost",
    "rpbey.fr",
    "46.224.145.55"
  ],

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
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
      },
      {
        protocol: "https",
        hostname: "media.kitsu.app",
      },
      {
        protocol: "https",
        hostname: "static.wikia.nocookie.net",
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

};

export default nextConfig;
