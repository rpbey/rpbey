# RPB Bot - Optimized Multi-stage Dockerfile
FROM node:24-slim AS base

# Install system dependencies
# - OpenSSL: Required for Prisma
# - Puppeteer/Chromium deps: Required for headless browser (screenshots, scraping)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

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
# Copy public assets for canvas/fonts
COPY public ./public
# Copy generated Prisma client from builder's node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose API port
EXPOSE 3001

# Run the compiled code
CMD ["node", "dist/index.js"]
