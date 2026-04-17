import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Output standalone for systemd deployment
  output: "standalone",

  // Trace dynamic requires that static analysis misses (tiktok-api-dl loads signature.js/webmssdk.js at runtime)
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/@tobyg74/tiktok-api-dl/helper/**",
    ],
  },

  // Disable Node.js compression — Nginx handles gzip
  compress: false,

  // Cache Components (Next.js 16+)
  cacheComponents: false, // Disabled due to instability with external scraping

  // External packages for server — packages listed in Next.js' built-in
  // server-external-packages.jsonc (puppeteer, prisma, pg, jsdom, sharp, canvas, etc.)
  // are auto-externalized and don't need to be repeated here.
  serverExternalPackages: [
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "crawlee",
    "turndown",
    "@napi-rs/canvas",
    "@tobyg74/tiktok-api-dl",
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
        "localhost:3001",
        "localhost:8000",
        "127.0.0.1:3000",
        "127.0.0.1:3001",
        "51.77.147.152",
      ],
    },
  },

  // Dev origins
  allowedDevOrigins: [
    process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "").replace("http://", "").split(":")[0] || "localhost",
    "rpbey.fr",
    "127.0.0.1",
    "51.77.147.152",
  ],

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
      {
        protocol: "https",
        hostname: "beyblade.takaratomy.co.jp",
      },
      {
        protocol: "https",
        hostname: "user-assets.challonge.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "beybladeplanner.com",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
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
          {
            key: "X-Accel-Buffering",
            value: "no",
          },
        ],
      },
    ];
  },

};

export default nextConfig;
