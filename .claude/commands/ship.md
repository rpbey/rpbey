Verify, commit, and deploy the current changes.

Steps:
1. Run `npx tsc --noEmit` — fix any type errors
2. Run `pnpm check` — auto-format
3. Run `pnpm lint` — fix any lint issues
4. Stage all changes with `git add -A`
5. Create a descriptive commit following conventional commits format
6. Push to `main`
7. Build and deploy: `docker compose -f docker-compose.prod.yml build dashboard bot --no-cache && docker compose -f docker-compose.prod.yml up -d dashboard bot`
8. Verify deployment with `docker compose -f docker-compose.prod.yml ps`
