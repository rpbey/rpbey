# Coolify Monorepo Deployment Guide (Next.js + Bot)

Since we have merged the Bot and Dashboard into a single repository, the deployment strategy on Coolify changes slightly. We will deploy **two separate services** from the **same repository**.

## 1. Database Service (PostgreSQL)
Ensure you have a PostgreSQL database deployed in Coolify.
*   **Internal URL**: e.g., `postgresql://user:password@rb-db:5432/rpb_dashboard`
*   **Public URL**: (Optional, for local dev access)

## 2. Dashboard Service (Next.js)
This service runs the web interface.

1.  **Create New Application** -> **Private Repository** (select `rpb-dashboard`).
2.  **Configuration**:
    *   **Build Pack**: Dockerfile
    *   **Docker Image**: `node:24-slim` (Automatic from Dockerfile)
    *   **Ports Exposes**: `3000`
    *   **Start Command**: `npm start` (Default)
3.  **Environment Variables**:
    *   `DATABASE_URL`: (Internal DB URL)
    *   `BETTER_AUTH_URL`: `https://rpbey.fr` (Production Domain)
    *   `NEXT_PUBLIC_APP_URL`: `https://rpbey.fr`
    *   `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, etc.
4.  **Health Check**:
    *   Path: `/api/health` (or `/`)

## 3. Bot Service (Worker)
This service runs the Discord bot in the background.

1.  **Create New Application** -> **Private Repository** (select `rpb-dashboard` **AGAIN**).
2.  **Configuration**:
    *   **Name**: `rpb-bot`
    *   **Build Pack**: Dockerfile (It will build the same image as dashboard)
    *   **Docker Image**: `node:24-slim`
    *   **Ports Exposes**: `3001` (Bot API)
    *   **Custom Start Command**: `npm run bot:start`  <-- **CRITICAL**
3.  **Environment Variables**:
    *   `DATABASE_URL`: (Same Internal DB URL)
    *   `DISCORD_TOKEN`: (Bot Token)
    *   `BOT_API_KEY`: (Secure Key shared with Dashboard)
    *   `GUILD_ID`: (Your Server ID)
4.  **Health Check**:
    *   Path: `/health` (Bot API Health check)
    *   Port: `3001`

## How it works
*   **Unified Build**: Coolify builds the Docker image once (or twice depending on cache). The `Dockerfile` compiles *both* the Next.js app and the Bot TypeScript code.
*   **Runtime Separation**:
    *   Service A runs `npm start` -> Starts Next.js server.
    *   Service B runs `npm run bot:start` -> Starts Bot process (`dist/bot/index.js`).
*   **Communication**: The Dashboard talks to the Bot API via the internal network (e.g., `http://rpb-bot:3001` if they are in the same network, or via Public IP if needed, but internal is better).

## Bot API Configuration
In the Dashboard service env vars:
*   `BOT_API_URL`: `http://<coolify-container-name-of-bot>:3001` (e.g., `http://rpb-bot:3001`)
*   `BOT_API_KEY`: (Must match the one in Bot service)
