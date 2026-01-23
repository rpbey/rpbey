# RPB Dashboard - Dockerfile for Coolify deployment
# This Dockerfile bypasses Nixpacks to avoid ESM/CJS issues with Prisma 7
# Build: 2026-01-07-v3

FROM node:24-slim AS base

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy package files first (for better layer caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY bot/package.json ./bot/

# ============================================
# Build Base stage (with compilers)
# ============================================
FROM base AS build-base

# Install Python and Build Essentials for native modules (node-gyp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# Dependencies stage
# ============================================
FROM build-base AS deps

# Install dependencies
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# ============================================
# Production Dependencies stage
# ============================================
FROM build-base AS prod-deps

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY bot/package.json ./bot/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --prod --frozen-lockfile

# ============================================
# Builder stage
# ============================================
FROM build-base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client using the CLI directly
# This avoids the @prisma/dev ESM issue by using node with ESM flag
RUN node --experimental-require-module ./node_modules/prisma/build/index.js generate

# Build Bot
RUN pnpm run bot:build

# Build Next.js
# Mount the .next/cache directory to speed up subsequent builds
RUN --mount=type=cache,target=/app/.next/cache pnpm run build

# ============================================
# Production stage
# ============================================
FROM base AS runner

ENV NODE_ENV=production
# Disable Next.js telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy production dependencies (needed for full Next.js support)
# OPTIMIZATION: In standalone mode, node_modules are already included in .next/standalone
# We comment this out to reduce image size and avoid conflicts.
# COPY --from=prod-deps /app/node_modules ./node_modules

# Copy Bot built files
COPY --from=builder --chown=nextjs:nodejs /app/bot/dist ./bot/dist

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install Chromium for Puppeteer
# Clean up apt cache to reduce image size
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Puppeteer config
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Health check to allow Coolify/Docker to detect unhealthy containers
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.RUN_BOT ? (process.env.BOT_API_PORT || 3001) : (process.env.PORT || 3000); const path = process.env.HEALTHCHECK_PATH || '/api/health'; fetch('http://localhost:' + port + path).then(r => {if(!r.ok) throw new Error(r.statusText)})"

# Use start script to handle conditional startup
COPY --chown=nextjs:nodejs scripts/start-entrypoint.sh ./start-entrypoint.sh
RUN chmod +x ./start-entrypoint.sh

CMD ["./start-entrypoint.sh"]
