# RPB Dashboard - Memory

## Project Stack
- Next.js 16 + MUI + Framer Motion + Prisma + Discord bot (Sapphire)
- Deployed on Coolify (Hetzner), bot via systemd
- DB: PostgreSQL

## Key Learnings

### Lighthouse Optimization (Feb 2026)
- Images compressed: red.jpeg (8.6MB->184KB), blue.jpeg (4.3MB->37KB), canvas.png (12MB->85KB) as WebP
- Google Sans Flex font: TTF 3.9MB -> WOFF2 1.4MB via pyftsubset (latin subset)
- Removed Google Fonts @import (render-blocking) from globals.css
- ThemeRegistry had `visibility: hidden` until mount - removed to fix FCP
- SocketProvider moved from root layout to admin layout only (was causing console errors on marketing pages)
- SmoothScroll can be imported directly in Server Components (it's 'use client' returning null)
- Cannot use `dynamic()` with `ssr: false` in Server Components
- LazyMotion + `m` instead of `motion` reduces framer-motion bundle
- GTM deferred with `strategy="lazyOnload"` via next/script

### Build Notes
- Build command: `pnpm build` (uses `--webpack` flag)
- `optimizePackageImports` for MUI and framer-motion significantly helps bundle size
- Admin layout is at `src/app/(admin)/layout.tsx` (not nested under admin/)
