Run a full build verification without deploying.

Steps:
1. Run `npx tsc --noEmit` — typecheck
2. Run `pnpm lint` — linting
3. Run `pnpm check` — Biome formatting
4. Run `NODE_OPTIONS='--max-old-space-size=8192' npx next build` — full Next.js build
5. Run `pnpm bot:build` — bot TypeScript compilation
6. Report results: what passed, what failed, and suggested fixes
