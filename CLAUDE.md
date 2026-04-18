# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RPB (République Populaire du Beyblade) is a French Beyblade X community platform. This monorepo contains:
- **Next.js 16 Dashboard** - Web application with marketing pages, user dashboard, and admin panel
- **Discord Bot** - discordx bot for community management and tournaments

## Commands

### Development
```bash
bun dev              # Start Next.js dashboard (port 3000)
bun bot:dev          # Start Discord bot (Bun --watch, native TS)
bun dev:all          # Start both simultaneously
```

### Database
```bash
bun db:generate      # Generate Prisma client after schema changes
bun db:push          # Push schema changes to DB (dev)
bun db:migrate       # Create migration (dev)
bun db:studio        # Open Prisma Studio GUI
bun db:seed          # Seed database with initial data
```

### Build & Lint
```bash
bun run build        # Build Next.js for production (standalone output)
bun bot:build        # Compile bot TypeScript (SWC — required for discordx decorator metadata)
bun lint             # Run ESLint
bun format           # Format with Biome
bun check            # Biome check + fix
```

### Scripts (run with `bun scripts/<name>.ts`)
```bash
bun scripts/sync-products.ts      # Sync Beyblade products from Takara
bun scripts/sync-staff-db.ts      # Sync staff from Discord roles
bun scripts/generate-knowledge-base.ts  # Generate AI knowledge base
```

## Architecture

### Route Groups (Next.js App Router)
- `src/app/(marketing)/` - Public pages: home, rankings, tournaments, TV (Twitch), rules
- `src/app/dashboard/` - Authenticated user area: profiles, decks, leaderboard
- `src/app/(admin)/admin/` - Admin-only: bot control, rankings config, staff management
- `src/app/api/` - API routes (56 endpoints)

### Discord Bot Structure
```
bot/src/
├── commands/           # Slash commands (discordx @Discord + @Slash decorators)
│   ├── Admin/         # Ranking, RoleReaction, moderation
│   ├── Beyblade/      # profile, deck, wiki, meta, ranking, register
│   └── General/       # ping, help, sync, duel, economy, game, giveaway
├── events/            # Discord events (ready, memberJoin, logs, reminders)
├── components/        # Button/modal handlers (Battle, Role, Tournament)
├── cron/              # Scheduled tasks (Bun.cron)
└── lib/               # Utilities (api-server, canvas-utils, prisma, redis)
```

**Important:** Le bot utilise discordx avec `emitDecoratorMetadata`. Bun ne supporte pas
les metadata de decorators en TS direct → le bot **doit** être compilé par SWC
(`bun bot:build`) et exécuté depuis `bot/dist/src/index.js`.

### Dashboard-Bot Communication
Both services run natively on the host via systemd. The bot exposes an HTTP API
on `127.0.0.1:3001` via `Bun.serve()` (`bot/src/lib/api-server.ts`).
Dashboard connects via `src/lib/bot.ts` → `src/lib/bot-config.ts` using `http://127.0.0.1:3001` with API key auth.

Key endpoints: `/api/status`, `/api/logs`, `/api/commands`
Nginx proxies `/api/bot/*` → `127.0.0.1:3001` and `/socket.io/` for WebSocket.

### Database Models (Prisma)
Core entities:
- `User` / `Profile` - Users with Discord sync, blader profiles
- `Part` / `Beyblade` / `Product` - Game content (Blade/Ratchet/Bit parts)
- `Deck` / `DeckItem` - User deck collections
- `Tournament` / `TournamentParticipant` / `TournamentMatch` - Challonge integration
- `RankingSeason` / `SeasonEntry` - Competitive rankings

Enums: `BeyType` (ATTACK/DEFENSE/STAMINA/BALANCE), `PartType` (BLADE/RATCHET/BIT), `TournamentStatus`

### Key Integrations
- **Better-Auth** - Authentication with Discord/Twitch/Google OAuth (`src/lib/auth.ts`)
- **Challonge** - Tournament brackets via OAuth 2.0 API v2.1 (`src/lib/challonge.ts`)
- **Twitch/YouTube** - Stream monitoring and webhooks
- **TensorFlow.js** - Q&A model for knowledge base queries (`bot/src/lib/ai.ts`)

## Conventions

### Code Style
- **Code language**: English (variable names, comments)
- **UI/Messages**: French (user-facing text)
- TypeScript strict mode, ESM modules
- Biome for formatting, ESLint for linting

### Bot Commands Pattern (discordx)
```typescript
import { ApplicationCommandOptionType, type CommandInteraction } from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';
import { Colors, RPB } from '../../lib/constants.js';

@Discord()
@injectable()
export class MyCommand {
  @Slash({ name: 'mycommand', description: 'Description en français' })
  async run(
    @SlashOption({
      name: 'terme',
      description: 'Argument',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    term: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    // Implementation
  }
}
```

### Prisma Usage
Always run `bun db:generate` after modifying `prisma/schema.prisma`.
The dashboard uses a pooled connection via `@prisma/adapter-pg`.

### Environment Variables
Required:
- `DATABASE_URL` - PostgreSQL connection string
- `DISCORD_TOKEN` - Bot token
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` - OAuth
- `GUILD_ID` - Target Discord server
- `BOT_API_KEY` - Dashboard-to-bot auth
- `CHALLONGE_CLIENT_ID` / `CHALLONGE_CLIENT_SECRET` - Tournament integration

## Data Files
- `data/knowledge_base.txt` - AI training data for Q&A
- `data/master-parts.json` - Complete parts database
- `data/fandom_products.json` - Product catalog
- `bot/data/knowledge_base.txt` - Bot's local knowledge copy

## Deployment

Both dashboard and bot run natively via **systemd + Bun** (no Docker).
Only the database runs in Docker (`docker-compose.db.yml`).

- Production URL: `https://rpbey.fr`
- Hosted on Hetzner dedicated server
- Nginx reverse proxy → `127.0.0.1:3000` (dashboard) + `127.0.0.1:3001` (bot)
- Nginx config: `/etc/nginx/conf.d/rpbey.conf`

### Systemd Services
| Service | Unit | ExecStart | Port |
|---------|------|-----------|------|
| Dashboard | `rpb-dashboard.service` | `bun .next/standalone/server.js` | 3000 |
| Bot | `rpb-bot.service` | `bun bot/dist/src/index.js` | 3001 |

### Deploy Commands
```bash
# Full deploy (dashboard + bot) — build, copy assets, restart systemd
bash scripts/deploy.sh

# Dashboard only
bun run build && sudo systemctl restart rpb-dashboard

# Bot only (recompile SWC + restart)
bun bot:build && sudo systemctl restart rpb-bot

# Logs
journalctl -u rpb-dashboard -f
journalctl -u rpb-bot -f

# Database (Docker)
docker compose -f docker-compose.db.yml up -d
```

## Autonomous Mode Instructions

Claude Code operates in FULL AUTONOMOUS mode on this project. Follow these rules:

### Decision Making
- **DO NOT ask for confirmation** before editing files, running builds, or making git commits
- **DO NOT ask which approach to use** — pick the best one based on existing patterns
- **Auto-fix lint/type errors** after any code change — run `bun run build` to verify (jamais `tsc`, refusé sur ce projet)
- **Auto-format** with `bun check` after edits
- **Auto-commit** when a task is fully complete and builds pass
- **Run `bun db:generate`** automatically after any Prisma schema change

### Workflow
1. Read relevant files first to understand context
2. Make changes
3. Verify with build/typecheck
4. Fix any errors
5. Format code
6. Commit with descriptive message if task is complete

### Code Patterns to Follow
- Use `prisma` client from `src/lib/prisma.ts` (dashboard) or `bot/src/lib/prisma.ts` (bot)
- Server Actions go in `src/server/actions/`
- API routes follow REST conventions in `src/app/api/`
- Tailwind CSS for styling, no CSS modules
- French for all user-facing text, English for code
- Always use `import type` for type-only imports
- Prefer `const` over `let`, arrow functions for callbacks
- Use Zod for validation at API boundaries

### Build Constraints (erreurs déjà vues, à éviter)
- **Prisma dans Client Components** : importer depuis `@/generated/prisma/browser` — JAMAIS `@/generated/prisma/client`. `client.ts` importe `node:module`, Turbopack crash avec *"chunking context does not support external modules"*.
- **Types partagés client/serveur** : extraire dans `src/lib/*-types.ts` (ex : `discord-types.ts`, `stats-types.ts`, `tiktok-types.ts`) sans aucun import Prisma serveur ni `node:*`.
- **Pas de binaire `next` global** : `which next` doit pointer nulle part ou vers `./node_modules/.bin/next`. Si `/usr/local/bin/next` existe (CLI Rust neval), `bun run build` échoue silencieusement → le supprimer.
- **MUI v7** : props typographie via `sx={{ fontWeight, fontSize }}`, overrides via `slotProps.<slot>` (`slotProps.paper`, `slotProps.primary`). Plus de `PaperProps` ni `primaryTypographyProps`.
- **`@discordx/pagination` v4** : pas d'`PaginationType` enum (Button est le défaut).
- **Bot en TS direct** : impossible — decorators discordx requièrent SWC (`bun bot:build`).

### Git Conventions
- Commit format: `type(scope): description` (e.g., `feat(rankings): add season filter`)
- Types: feat, fix, refactor, chore, docs, style, perf, test
- Branch from `main`, push directly to `main` for small changes
- Co-author line: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

## Plugins

### web3d-agent (global — `~/.claude/custom-plugins/web3d-agent`)
Plugin dédié au développement 3D natif web et WebAssembly pour RPB. Construit depuis `docs/3d-graphics.md` et `docs/webassembly.md`.

**Agents spécialisés** :
- `web3d-coder` — Implémentation R3F, Drei, Three.js WebGPU, Rapier WASM, migration MeshViewer/BattleArena
- `wasm-builder` — Pipeline Rust→WASM (wasm-pack), configuration Next.js WASM, déclarations TypeScript, wasm-opt
- `vfx-shader` — Shaders TSL/WGSL, post-processing (Bloom/Glitch), particules Sparkles/Trail, GSAP timelines

**Skill** :
- `/web3d:code [task]` — Implémente ou migre du code 3D/WASM (R3F, Rapier, VFX, shaders)

**Stack couverte** :
- `three ^0.182.0` (WebGPU natif via `three/webgpu` + TSL)
- `@react-three/fiber` + `@react-three/drei`
- `@dimforge/rapier2d-compat` (physique Beyblade)
- `@react-three/postprocessing` + `postprocessing`
- `gsap` (animations 3D séquencées)
- Rust + `wasm-pack` + `wasm-bindgen` + `serde-wasm-bindgen`
- Next.js 16 WASM (Turbopack dev / Webpack build)
