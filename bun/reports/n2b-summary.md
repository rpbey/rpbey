# n2b Audit Summary

- **Tool**: node2bun v0.2.0
- **Mode**: check
- **Root**: /home/ubuntu/rpb-dashboard
- **Files scanned**: 156
- **Total findings**: 489

## By severity

| Severity | Count |
|---|---:|
| warn | 309 |
| info | 180 |

## Top rules

| Rule | Count |
|---|---:|
| `api/process-env` | 173 |
| `imports/bun-native` | 121 |
| `imports/node-prefix` | 70 |
| `api/fs-existsSync` | 25 |
| `api/fs-writeFileSync` | 16 |
| `api/exec` | 10 |
| `api/fs-readFileSync` | 9 |
| `api/execSync` | 9 |
| `api/json-parse-readFileSync` | 8 |
| `api/process-stdout-write` | 8 |
| `api/fileURLToPath` | 7 |
| `api/buffer-from-base64` | 6 |
| `api/buffer-from-string` | 6 |
| `api/performance-now` | 5 |
| `api/dirname-esm` | 5 |
| `api/path-join-dirname` | 4 |
| `pkg/redundant-dep` | 2 |
| `pkg/tsup-bun-external` | 2 |
| `api/child-process-spawn` | 1 |
| `cli/npx` | 1 |
| `api/crypto-createHash` | 1 |

## Top files

| File | Findings |
|---|---:|
| `scripts/trailer-pro.ts` | 15 |
| `scripts/link-discord-participants.ts` | 10 |
| `scripts/sync-admins.ts` | 10 |
| `scripts/sync-staff-db.ts` | 10 |
| `src/lib/challonge.ts` | 9 |
| `src/lib/auth.ts` | 9 |
| `scripts/import-bts1-local.ts` | 9 |
| `scripts/generate-bey-manifest.ts` | 9 |
| `prisma/seed-products.ts` | 8 |
| `prisma/seed-parts.ts` | 8 |
| `scripts/send-qr-dm.ts` | 8 |
| `scripts/clean-bbx-data.ts` | 8 |
| `scripts/scrape-anime.ts` | 8 |
| `scripts/fast-scrape-bey-library.ts` | 8 |
| `scripts/scrape-bey-library-full.ts` | 8 |
| `bot/src/lib/api-server.ts` | 7 |
| `scripts/link-3d-models.ts` | 7 |
| `bot/src/index.ts` | 6 |
| `scripts/sync-bey-library-complete.ts` | 6 |
| `bot/src/events/ready.ts` | 5 |
| `bot/scripts/exchange-manual.js` | 5 |
| `scripts/purge-commands.ts` | 5 |
| `scripts/screenshot-all.ts` | 5 |
| `scripts/scrape-episode-titles.ts` | 5 |
| `scripts/tour-video.ts` | 5 |
| `scripts/test-kyoya-gif.ts` | 5 |
| `scripts/scrape-episode-titles-en.ts` | 5 |
| `scripts/fetch-avatars-api.ts` | 5 |
| `scripts/scrape-bbx-weekly.ts` | 5 |
| `bot/src/lib/challonge.ts` | 4 |
