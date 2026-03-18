# RPB Discord Bot - Standalone Dockerfile
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
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# ============================================
# Builder stage
# ============================================
FROM base AS builder

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

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy workspace config
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY bot/package.json ./bot/

# Install all dependencies (dev needed for build)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copy Prisma schema + config and generate client
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN pnpm run db:generate

# Copy bot source and build
COPY bot ./bot
RUN pnpm run bot:build

# Copy data files used at runtime
COPY data ./data

# Prune to production dependencies and regenerate Prisma client
RUN rm -rf node_modules && pnpm install --prod --frozen-lockfile && pnpm run db:generate

# ============================================
# Production runner
# ============================================
FROM base AS runner

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN addgroup --system --gid 1001 botuser && \
    adduser --system --uid 1001 botuser

WORKDIR /app

# Production node_modules
COPY --from=builder --chown=botuser:botuser /app/node_modules ./node_modules

# Compiled bot
COPY --from=builder --chown=botuser:botuser /app/bot/dist ./bot/dist
COPY --from=builder --chown=botuser:botuser /app/bot/package.json ./bot/package.json
COPY --from=builder --chown=botuser:botuser /app/bot/data ./bot/data

# Data directory
COPY --from=builder --chown=botuser:botuser /app/data ./data

# Prisma (for migrate deploy at startup)
COPY --from=builder --chown=botuser:botuser /app/prisma ./prisma
COPY --from=builder --chown=botuser:botuser /app/prisma.config.ts ./prisma.config.ts

# Entrypoint
COPY --chown=botuser:botuser bot/start.sh ./start.sh
RUN chmod +x ./start.sh

USER botuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.BOT_API_PORT || 3001) + '/api/status').then(r => { if (!r.ok) throw new Error() }).catch(() => process.exit(1))"

CMD ["./start.sh"]
