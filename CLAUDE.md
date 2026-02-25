# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RPB (République Populaire du Beyblade) is a French Beyblade X community platform. This monorepo contains:
- **Next.js 16 Dashboard** - Web application with marketing pages, user dashboard, and admin panel
- **Discord Bot** - Sapphire Framework bot for community management and tournaments

## Commands

### Development
```bash
pnpm dev              # Start Next.js dashboard (port 3000)
pnpm bot:dev          # Start Discord bot (uses tsx)
pnpm dev:all          # Start both simultaneously
```

### Database
```bash
pnpm db:generate      # Generate Prisma client after schema changes
pnpm db:push          # Push schema changes to DB (dev)
pnpm db:migrate       # Create migration (dev)
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:seed          # Seed database with initial data
```

### Build & Lint
```bash
pnpm build            # Build Next.js for production
pnpm bot:build        # Compile bot TypeScript
pnpm lint             # Run ESLint
pnpm format           # Format with Biome
pnpm check            # Biome check + fix
```

### Scripts (run with `pnpm tsx scripts/<name>.ts`)
```bash
tsx scripts/sync-products.ts      # Sync Beyblade products from Takara
tsx scripts/sync-staff-db.ts      # Sync staff from Discord roles
tsx scripts/generate-knowledge-base.ts  # Generate AI knowledge base
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
├── commands/           # Slash commands (Sapphire Command class)
│   ├── Admin/         # Ranking, RoleReaction, teach, scrape
│   ├── Beyblade/      # profile, battle, randombey, tournament, leaderboard
│   ├── General/       # ping, ask (AI Q&A), sync, scan
│   ├── Moderation/    # ban, kick, clear, mute
│   ├── Music/         # play, skip, stop, nowplaying, volume
│   └── Voice/         # join, speak (TTS)
├── listeners/         # Discord events (ready, memberJoin, etc.)
├── interaction-handlers/  # Button/modal handlers
└── lib/               # Utilities (api-server, canvas-utils, ai, prisma)
```

### Dashboard-Bot Communication
The bot exposes an HTTP/WebSocket API on port 3001 (`bot/src/lib/api-server.ts`).
Dashboard connects via `src/lib/bot.ts` using `botClient` singleton with API key auth.

Key endpoints: `/api/status`, `/api/logs`, `/api/member`, `/api/roles`, `/api/agent/dispatch`

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

### Bot Commands Pattern
```typescript
import { Command } from '@sapphire/framework';
import { Colors, RPB } from '../../lib/constants.js';

export class MyCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, description: 'Description en français' });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('mycommand').setDescription('Description')
    );
  }

  override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Implementation
  }
}
```

### Prisma Usage
Always run `pnpm db:generate` after modifying `prisma/schema.prisma`.
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
- **Dashboard**: Docker Compose (Production)
- **Bot**: Systemd service (`rpb-bot.service`)
- Production URL: `https://rpbey.fr`
