# RPB Dashboard - Dockerfile for Production (Optimized)

# ============================================
# Base stage — shared runtime dependencies
# ============================================
FROM node:24-slim AS base

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
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# ============================================
# Dependencies stage — install all deps (cached layer)
# ============================================
FROM base AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy only package manifests first (maximizes layer cache)
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY bot/package.json ./bot/

# Install all dependencies (dev + prod) with pnpm store cache
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Builder stage — build the app
# ============================================
FROM deps AS builder

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy source code (deps already installed)
COPY . .

# Generate Prisma Client
RUN pnpm run db:generate

# Build Next.js
ENV BETTER_AUTH_SECRET="dummy_secret_for_build"
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/rpb_dashboard"
ENV PRISMA_CLIENT_ENGINE_TYPE=library
RUN pnpm run build

# ============================================
# Prod-deps stage — production dependencies only
# ============================================
FROM deps AS prod-deps

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    rm -rf node_modules && pnpm install --prod --frozen-lockfile

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

# Copy production dependencies from dedicated stage
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy Next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

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
