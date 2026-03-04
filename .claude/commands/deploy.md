Build and deploy the RPB dashboard and bot to production.

Steps:
1. Run `npx tsc --noEmit` to typecheck
2. Run `docker compose -f docker-compose.prod.yml build dashboard bot --no-cache`
3. Run `docker compose -f docker-compose.prod.yml up -d dashboard bot`
4. Verify with `docker compose -f docker-compose.prod.yml ps` and check logs
5. Report deployment status
