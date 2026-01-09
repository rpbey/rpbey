# RPB - République Populaire du Beyblade

## Project Overview
RPB is a French Beyblade X community hosted on Discord. This repository contains the **rpb-dashboard**, a web management interface.

## Tech Stack
- **Framework**: Next.js 16.1 (App Router, Turbopack)
- **Authentication**: Better Auth with Discord OAuth
- **Database**: Prisma 7.2 + PostgreSQL 17 (Postgres container: `rb-db`)
- **UI Framework**: MUI 7 (Material UI) + Emotion
- **Styling**: RPB Red (`#dc2626`) + Gold (`#fbbf24`)
- **Runtime**: Node.js 24+ with pnpm

## Project Structure
The application is divided into three main domains:
- **Marketing** (`src/app/(marketing)`): Public pages, rankings, tournament listings, and "TV" (Twitch stream).
- **Dashboard** (`src/app/dashboard`): User area for managing Beyblade Decks, Profile, and viewing personal stats.
- **Admin** (`src/app/(admin)`): Restricted area for site management, bot controls, and content management.

## Integrations
- **Discord**: OAuth login via Better Auth, plus custom Bot API interactions.
- **Challonge**: Tournament bracket management (API v2.1) synced with local DB.
- **Twitch**: Live stream status monitoring for `tv_rpb` (using `@twurple`).

## Infrastructure (Hetzner)
- **IP**: `46.224.145.55` (Ubuntu 24.04 LTS)
- **Deployment**: Coolify (http://46.224.145.55:8000)
- **Coolify CLI**: Use `coolify` for deployment and status monitoring.
  - Dashboard UUID: `l8goc4scgcgwk0ookoc0k8c0`
  - Bot UUID: `d8g4cgkocw40sgkwsscckks8`
  - Command: `coolify deploy uuid <uuid>` to trigger deployment.
  - Command: `coolify deploy list` or `coolify deploy get <deployment_uuid>` for status.
- **Domain**: `rpbey.fr` (managed via OVH)
- **Storage**: 
  - Volume (10 GB): `/mnt/rpb` (ext4)
  - S3 Bucket: `s3://rpb/` (Nuremberg, `nbg1.your-objectstorage.com`)

## Development Guidelines
- **Language**: 
  - Code/Comments: English
  - Discord Messages/UI: French
  - Technical Docs: English
- **Style**:
  - ESM, Strict TypeScript
  - Formatting: Prettier (2 spaces, no semicolons, single quotes)
- **Commits**: Conventional Commits (`type(scope): description`)
  - Scopes: `bot`, `dashboard`, `db`, `auth`, `ui`

## Reference Documentation (Context7)
Always use these Library IDs when querying for updated documentation:
- Next.js 16: `/websites/nextjs_app`
- Prisma 7: `/prisma/docs`
- Material UI 7: `/mui/material-ui`
- discord.js: `/discordjs/discord.js`
- Sapphire: `/sapphiredev/framework`

## Recent Updates (Jan 2026)
- **Infrastructure**: Optimized for Next.js 16.1 with Turbopack and Cache Components.
- **Security**: Patched ReDoS vulnerability in `@modelcontextprotocol/sdk` (v1.25.2).
- **Admin**: 
  - Created Gemini Agent admin user.
  - Added Discord Messenger tool in the admin panel to send messages via the bot.
  - Stabilized dynamic routes (Profile, OAuth) for production builds.
- **Code Quality**: Resolved all linting warnings and build errors.