# Coolify Monorepo Deployment Guide (Dashboard Only)

This guide covers the deployment of the RPB Dashboard on Coolify. The Bot is managed natively on the host server.

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

## 3. Bot Service (Native Ubuntu)
The Bot is **NOT** deployed via Coolify. It runs natively on the Ubuntu server using PM2 or systemd.

*   **Location**: `/root/rpb-dashboard/bot` (or similar on host)
*   **Management**: Managed manually or via system scripts.
*   **Connection**: It connects to the same PostgreSQL database (ensure firewall allows connection if not local).
*   **Communication**: The Dashboard communicates with the Bot via the `BOT_API_URL`.

## How it works
*   **Dashboard**: Deployed via Coolify (Docker container).
*   **Bot**: Runs as a native Node.js process on the host server.
*   **Communication**: The Dashboard talks to the Bot API via its local address (e.g., `http://172.17.0.1:3001` or Host IP).

## Bot API Configuration
In the Dashboard service env vars:
*   `BOT_API_URL`: `http://<HOST_IP>:3001` (Replace with actual IP/Hostname of the bot)
*   `BOT_API_KEY`: (Secure Key shared with Dashboard)
