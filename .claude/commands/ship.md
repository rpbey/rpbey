Verify, commit, and deploy the current changes.

Steps:
1. Run `bunx tsc --noEmit` — fix any type errors
2. Run `bun check` — auto-format
3. Run `bun lint` — fix any lint issues
4. Stage all changes with `git add -A`
5. Create a descriptive commit following conventional commits format
6. Push to `main`
7. Run `bash scripts/deploy.sh` to build and deploy via systemd
8. Verify with `sudo systemctl status rpb-dashboard rpb-bot`
