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
COPY package.json pnpm-lock.yaml ./

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Builder stage
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client using the CLI directly
# This avoids the @prisma/dev ESM issue by using node with ESM flag
RUN node --experimental-require-module ./node_modules/prisma/build/index.js generate

# Build Next.js
RUN pnpm run build

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

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
