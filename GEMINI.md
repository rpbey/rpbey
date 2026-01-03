# RPB - République Populaire du Beyblade

## Project Overview
RPB is a French Beyblade X community hosted on Discord. This repository contains the **rpb-dashboard**, a web management interface.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Authentication**: Better Auth with Discord OAuth
- **Database**: Prisma 7 + PostgreSQL 17 (Postgres container: `rb-db`)
- **UI Framework**: MUI 7 + Tailwind CSS
- **Styling**: RPB Red (`#dc2626`) + Gold (`#fbbf24`)
- **Runtime**: Node.js 24+ with pnpm

## Infrastructure (Hetzner)
- **IP**: `46.224.145.55` (Ubuntu 24.04 LTS)
- **Deployment**: Coolify (http://46.224.145.55:8000)
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
