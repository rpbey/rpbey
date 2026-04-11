Build and deploy the RPB dashboard and bot to production via systemd.

Steps:
1. Run `bunx tsc --noEmit` to typecheck the dashboard
2. Run `bun bot:build` to compile the bot with SWC
3. Run `bash scripts/deploy.sh` (builds Next.js, copies assets, restarts systemd services)
4. Verify with `sudo systemctl status rpb-dashboard rpb-bot` and health checks
5. Report deployment status
