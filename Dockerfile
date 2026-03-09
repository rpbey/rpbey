# RPB Dashboard & Bot - Dockerfile for Production
# Build: 2026-02-16 - Fixed Bot Dependencies

FROM node:24-slim AS base

# Install OpenSSL (required by Prisma) and runtime libs for canvas/puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    chromium \
    fonts-liberation \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# ============================================
# Builder stage
# ============================================
FROM base AS builder

# Install build essentials for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Copy configs
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY bot/package.json ./bot/
# COPY packages/rppb-api/package.json ./packages/rppb-api/ # Add if exists

# Install ALL dependencies (including dev)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma Client
RUN pnpm run db:generate

# Build Next.js
ENV BETTER_AUTH_SECRET="dummy_secret_for_build"
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/rpb_dashboard"
ENV PRISMA_CLIENT_ENGINE_TYPE=library
RUN pnpm run build

# Build Bot
RUN pnpm run bot:build

# Prepare a clean production node_modules
# We do this in the builder because we have the build tools for native modules
RUN rm -rf node_modules && pnpm install --prod --frozen-lockfile

# ============================================
# Production runner stage
# ============================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy production dependencies
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy Next.js standalone build
# Standalone includes its own node_modules but we might need the root ones for the bot
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Bot artifacts
COPY --from=builder --chown=nextjs:nodejs /app/bot/dist ./bot/dist
COPY --from=builder --chown=nextjs:nodejs /app/bot/package.json ./bot/package.json
COPY --from=builder --chown=nextjs:nodejs /app/bot/data ./bot/data

# Copy Data directory (for champions, profiles, etc)
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Copy Prisma for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Scripts
COPY --chown=nextjs:nodejs scripts/start-entrypoint.sh ./start-entrypoint.sh
RUN chmod +x ./start-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; const path = process.env.HEALTHCHECK_PATH || '/api/health'; fetch('http://localhost:' + port + path).then(r => {if(!r.ok) throw new Error(r.statusText)})"

CMD ["./start-entrypoint.sh"]
