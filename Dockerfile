# RPB Dashboard - Dockerfile for Coolify deployment
# Build: 2026-02-15-v7 - Final Clean Standalone

FROM node:24-slim AS base

# Install OpenSSL (required by Prisma)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# ============================================
# Build Base stage (with compilers)
# ============================================
FROM base AS build-base

# Install Python and Build Essentials for native modules (node-gyp)
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

# ============================================
# Builder stage
# ============================================
FROM build-base AS builder

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Copy all files
COPY . .

# Install dependencies
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm run db:generate

# Build Next.js
ENV BETTER_AUTH_SECRET="dummy_secret_for_build"
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/rpb_dashboard"
ENV PRISMA_CLIENT_ENGINE_TYPE=library
RUN pnpm run build

# Build Bot
RUN pnpm run bot:build

# Prepare standalone static files
RUN cp -r public .next/standalone/public && \
    mkdir -p .next/standalone/.next && \
    cp -r .next/static .next/standalone/.next/static

# ============================================
# Production stage
# ============================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy EVERYTHING from standalone to the root
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# This already includes server.js, node_modules (dashboard), public, and .next/static (thanks to the prepared steps in builder)

# Copy bot artifacts explicitly into its own folder
COPY --from=builder --chown=nextjs:nodejs /app/bot/dist ./bot/dist
COPY --from=builder --chown=nextjs:nodejs /app/bot/package.json ./bot/package.json
COPY --from=builder --chown=nextjs:nodejs /app/bot/data ./bot/data

# Prisma schema and config for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# We need the full node_modules for the bot because standalone only includes dashboard deps
# BUT standalone already has its own node_modules. 
# Let's merge them or just use the full one from builder if needed.
# Since we want a robust bot, let's copy the full node_modules but avoid overwriting standalone's special links
# Actually, pnpm workspace links are tricky.
# Best approach: Copy full node_modules from builder.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Re-copy prepared public/static into the root to be absolutely sure
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/.next/static ./.next/static

# Install Chromium for Puppeteer and runtime libs for canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /root/.cache

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Puppeteer config
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; const path = process.env.HEALTHCHECK_PATH || '/api/health'; fetch('http://localhost:' + port + path).then(r => {if(!r.ok) throw new Error(r.statusText)})"

COPY --chown=nextjs:nodejs scripts/start-entrypoint.sh ./start-entrypoint.sh
RUN chmod +x ./start-entrypoint.sh

CMD ["./start-entrypoint.sh"]
