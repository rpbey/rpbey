# RPB Bot - Optimized Multi-stage Dockerfile
FROM node:24-slim AS base

# Install system dependencies (OpenSSL for Prisma, etc.)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# ============================================
# Builder stage
# ============================================
FROM base AS builder

COPY package.json ./
# If pnpm-lock.yaml doesn't exist, we'll let it generate one
COPY pnpm-lock.yaml* ./

RUN pnpm install

COPY . .

# Generate Prisma Client
RUN pnpm exec prisma generate

# Build TypeScript to JS
RUN pnpm run build

# ============================================
# Production stage
# ============================================
FROM base AS runner

ENV NODE_ENV=production
WORKDIR /app

# Copy package.json for runtime
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --prod

# Copy built files
COPY --from=builder /app/dist ./dist
# Copy generated Prisma client from builder's node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose API port
EXPOSE 3001

# Run the compiled code
CMD ["node", "dist/index.js"]
