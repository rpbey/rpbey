# node2bun report

- mode : `check`
- racine : `/home/ubuntu/rpb-dashboard`

## `next.config.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 48:9 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 62:5 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `package.json`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:1 | `pkg/redundant-dep` | dépendance 'dotenv' redondante avec Bun (voir Bun.file / Bun.env / fetch global / bun:sqlite / bun test) |  |
| 1:1 | `pkg/redundant-dep` | dépendance 'tsx' redondante avec Bun (voir Bun.file / Bun.env / fetch global / bun:sqlite / bun test) |  |

## `packages/rppb-api/package.json`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:1 | `pkg/tsup-bun-external` | script "build" utilise tsup — ajouter '--external bun' si le code fait 'await import("bun")' (sinon esbuild échoue au bundle-time) | `tsup src/index.ts --format cjs,esm --dts --external bun` |
| 1:1 | `pkg/tsup-bun-external` | script "dev" utilise tsup — ajouter '--external bun' si le code fait 'await import("bun")' (sinon esbuild échoue au bundle-time) | `tsup src/index.ts --format cjs,esm --watch --dts --external bun` |

## `prisma/create-admin.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `prisma/set-password.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `prisma/seed-products.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 8:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 9:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 31:29 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(hasbroDataPath).text()` |
| 16:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 31:18 | `api/json-parse-readFileSync` | remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json() | `await Bun.file(hasbroDataPath).json()` |
| 30:5 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(hasbroDataPath).exists()` |

## `prisma/seed-parts.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 8:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 11:23 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 90:21 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(filePath).text()` |
| 13:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 90:10 | `api/json-parse-readFileSync` | remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json() | `await Bun.file(filePath).json()` |
| 87:8 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(filePath).exists()` |

## `prisma/seed-anime.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 4:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 6:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `prisma/create-dev-admin.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `prisma/seed-beyblades.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 14:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `prisma/seed.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 121:27 | `imports/node-prefix` | préfixer 'child_process' avec 'node:' (recommandé) | `node:child_process` |
| 126:5 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |

## `bot/src/cron/tasks/SyncSatrRoles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 11:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/cron/tasks/DailyStats.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 77:23 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/cron/tasks/SyncRankingRoles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 17:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/cron/tasks/MentionsScan.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 51:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/generated/prisma/client.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 32:48 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 16:40 | `api/fileURLToPath` | Bun.fileURLToPath() est équivalent (ou utiliser import.meta.dir/path) |  |

## `bot/src/generated/prisma/internal/class.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 71:50 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 95:48 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 43:21 | `api/buffer-from-base64` | utiliser atob() / btoa() ou Uint8Array pour du Web-standard |  |

## `bot/src/events/MutedChannelSync.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/events/ready.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 19:9 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 19:56 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 22:55 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 24:49 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 37:21 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/events/AdvancedLogs.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 20:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/guards/OwnerOnly.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 9:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/guards/NotBlacklisted.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 8:3 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/tests/setup.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:21 | `imports/bun-native` | remplacer 'vitest' par bun:test — bun:test offre les mêmes fonctionnalités que vitest | `bun:test` |

## `bot/src/tests/mocks.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:21 | `imports/bun-native` | remplacer 'vitest' par bun:test — bun:test offre les mêmes fonctionnalités que vitest | `bun:test` |

## `bot/src/tests/RankingGroup.test.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:55 | `imports/bun-native` | remplacer 'vitest' par bun:test — bun:test offre les mêmes fonctionnalités que vitest | `bun:test` |

## `bot/src/lib/redis.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:3 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/lib/api-server.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 76:21 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 101:23 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 156:29 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 111:23 | `api/buffer-from-string` | remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str) | `new TextEncoder().encode(apiKey)` |
| 112:23 | `api/buffer-from-string` | remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str) | `new TextEncoder().encode(expectedKey)` |
| 161:19 | `api/buffer-from-string` | remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str) | `new TextEncoder().encode(providedKey)` |
| 162:19 | `api/buffer-from-string` | remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str) | `new TextEncoder().encode(expectedKey)` |

## `bot/src/lib/prisma.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 11:30 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 34:28 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/lib/command-generator.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 37:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/lib/singleton-guard.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 47:7 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 47:41 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/lib/twitch-bot.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 25:7 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 26:7 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/lib/bot.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 14:14 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 14:38 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/lib/challonge.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:24 | `imports/bun-native` | remplacer 'undici' par <global fetch> — fetch/WebSocket sont natifs dans Bun — undici inutile | `<global fetch>` |
| 513:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 514:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 515:20 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/lib/logger.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 16:9 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 22:9 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/src/index.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 23:25 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 77:8 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 81:25 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 118:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 122:23 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 122:47 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/scripts/build-oxc.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 15:15 | `api/performance-now` | Bun.nanoseconds() offre une horloge haute précision (retourne nanosecondes depuis démarrage) |  |
| 42:23 | `api/performance-now` | Bun.nanoseconds() offre une horloge haute précision (retourne nanosecondes depuis démarrage) |  |

## `bot/scripts/send-social-announcement.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 17:8 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 23:24 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/scripts/test-bin.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 23:18 | `api/child-process-spawn` | Bun.spawn offre une API plus ergonomique (streams Web, ipc, preload) |  |

## `bot/scripts/exchange-manual.js`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:33 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 3:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 6:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 7:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/scripts/create-missing-roles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 13:24 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 19:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/scripts/test-token.js`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 5:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 6:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/scripts/fetch-message.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 69:14 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/scripts/inspect-probot.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 5:17 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/scripts/get-twitch-token.js`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 3:23 | `imports/node-prefix` | préfixer 'readline' avec 'node:' (recommandé) | `node:readline` |
| 5:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 6:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `bot/scripts/build-bin.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 29:6 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 8:15 | `api/performance-now` | Bun.nanoseconds() offre une horloge haute précision (retourne nanosecondes depuis démarrage) |  |
| 33:23 | `api/performance-now` | Bun.nanoseconds() offre une horloge haute précision (retourne nanosecondes depuis démarrage) |  |

## `bot/prisma.config.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:10 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/(admin)/admin/tournaments/[id]/actions.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 143:7 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 144:7 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/(admin)/admin/tournaments/actions.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 22:23 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/(admin)/admin/page.tsx`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 257:35 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/(marketing)/tv/page.tsx`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 21:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/api/auth/callback/challonge/route.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 77:7 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 85:7 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 21:30 | `api/buffer-from-base64` | utiliser atob() / btoa() ou Uint8Array pour du Web-standard |  |

## `src/app/api/auth/mobile/callback/route.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 30:20 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 31:24 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/api/auth/dev-login/route.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 5:7 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/api/auth/challonge/route.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 21:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/api/auth/magic-link/route.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 51:23 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/api/external/v1/leaderboard/route.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 20:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 30:29 | `api/buffer-from-string` | remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str) | `new TextEncoder().encode(apiKey \|\| '')` |
| 31:29 | `api/buffer-from-string` | remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str) | `new TextEncoder().encode(expectedApiKey)` |

## `src/app/api/webhooks/twitch/route.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 31:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/sitemap.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 68:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/app/robots.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/generated/prisma/client.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 32:48 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 16:40 | `api/fileURLToPath` | Bun.fileURLToPath() est équivalent (ou utiliser import.meta.dir/path) |  |

## `src/generated/prisma/internal/class.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 71:50 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 95:48 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 43:21 | `api/buffer-from-base64` | utiliser atob() / btoa() ou Uint8Array pour du Web-standard |  |

## `src/proxy.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 35:16 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/lib/twitch.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 5:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 6:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 7:21 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/lib/prisma.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 7:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 25:5 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/lib/bot-config.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:10 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 9:28 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/lib/challonge.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 76:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 77:28 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 100:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 101:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 102:28 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 134:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 135:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 173:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 174:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/lib/seo-utils.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 12:17 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/lib/auth.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 6:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 8:3 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 9:3 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 49:17 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 50:21 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 65:17 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 66:21 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 69:17 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 70:21 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `src/lib/auth-client.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 15:9 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/import-wb-bladers.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/build-participant-map.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:46 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 2:26 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |

## `scripts/sync-youtube-beytube.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 7:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 8:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 10:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 15:16 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/purge-commands.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 5:17 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 6:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 6:43 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 10:38 | `api/buffer-from-base64` | utiliser atob() / btoa() ou Uint8Array pour du Web-standard |  |

## `scripts/schedule-thread.sh`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 12:1 | `cli/npx` | npx → bunx | `bunx ` |

## `scripts/delete-fake-tournaments.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/seed-quadstrike-and-titles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 8:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 9:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 11:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/import-bts3.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 17:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(LOCK_FILE, process.pid.toString()` |
| 14:7 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(LOCK_FILE).exists()` |
| 160:9 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(LOCK_FILE).exists()` |

## `scripts/import-challonge-generic.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/sync-wb-ranking.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 6:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 8:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/check-point-roles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/send-qr-dm.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 4:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 6:24 | `imports/bun-native` | remplacer 'ws' par WebSocket — WebSocket client/serveur est natif dans Bun | `WebSocket` |
| 147:34 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(envPath).text()` |
| 98:13 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(qrPath, qrBuffer)` |
| 153:17 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(envPath, updated)` |
| 48:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 82:25 | `api/crypto-createHash` | Bun.hash / Bun.CryptoHasher est plus rapide (voir runtime/hashing) |  |
| 40:5 | `api/buffer-from-base64` | utiliser atob() / btoa() ou Uint8Array pour du Web-standard |  |

## `scripts/sync-bts2.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 17:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(LOCK_FILE, process.pid.toString()` |
| 14:7 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(LOCK_FILE).exists()` |
| 120:9 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(LOCK_FILE).exists()` |

## `scripts/update-card-stats.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 10:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 11:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 13:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/debug-blade.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 4:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |

## `scripts/rescrape-bts2.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 5:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/seed-card-stats.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 8:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 9:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 11:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/clean-bbx-data.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 2:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 30:30 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(inputFile).text()` |
| 112:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(path.join(outputDir, 'blades.json')` |
| 113:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(path.join(outputDir, 'ratchets.json')` |
| 114:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(path.join(outputDir, 'bits.json')` |
| 30:19 | `api/json-parse-readFileSync` | remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json() | `await Bun.file(inputFile).json()` |
| 25:8 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(inputFile).exists()` |

## `scripts/subscribe-youtube.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:24 | `imports/bun-native` | remplacer 'undici' par <global fetch> — fetch/WebSocket sont natifs dans Bun — undici inutile | `<global fetch>` |

## `scripts/trailer-pro.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 3:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 4:27 | `imports/node-prefix` | préfixer 'child_process' avec 'node:' (recommandé) | `node:child_process` |
| 373:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(concatFile, parts.map((p)` |
| 275:7 | `api/fs-existsSync` | fs.existsSync(path) suivi d'un fs.mkdirSync(path) — chemin probablement un dossier, Bun.file().exists() inadapté (utiliser fs.mkdirSync(path, { recursive: true })) |  |
| 316:10 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(input).exists()` |
| 369:9 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(titled).exists()` |
| 384:22 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(LOGO_PATH).exists()` |
| 332:5 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |
| 343:3 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |
| 357:3 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |
| 377:3 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |
| 393:3 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |
| 400:19 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |
| 30:25 | `api/performance-now` | Bun.nanoseconds() offre une horloge haute précision (retourne nanosecondes depuis démarrage) |  |

## `scripts/explore-planner.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 4:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |

## `scripts/auto-link-users.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/cleanup-task.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/get-lotte-followers.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 28:36 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 29:29 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/screenshot-all.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 3:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 4:27 | `imports/node-prefix` | préfixer 'child_process' avec 'node:' (recommandé) | `node:child_process` |
| 28:7 | `api/fs-existsSync` | fs.existsSync(path) suivi d'un fs.mkdirSync(path) — chemin probablement un dossier, Bun.file().exists() inadapté (utiliser fs.mkdirSync(path, { recursive: true })) |  |
| 108:3 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |

## `scripts/link-discord-participants.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 3:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 4:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 68:32 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(mappingPath).text()` |
| 204:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(uncertainPath, JSON.stringify(uncertainMatches, null, 2)` |
| 38:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 39:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 40:20 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 68:21 | `api/json-parse-readFileSync` | remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json() | `await Bun.file(mappingPath).json()` |
| 67:7 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(mappingPath).exists()` |

## `scripts/analyze-ranking.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/import-satr-bladers.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 8:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/fetch-wb-history.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 10:17 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/deep-scrape.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:46 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 4:26 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |

## `scripts/seed-drop1.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 12:26 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 18:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |
| 19:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 22:21 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/extract_extra.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 3:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 51:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(path.join(OUTPUT_DIR, 'images.json')` |
| 85:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(path.join(OUTPUT_DIR, 'hasbro.json')` |

## `scripts/sync-weights.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 8:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 9:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 35:48 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/update-anime-metadata.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 8:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 9:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 11:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/import-bts1-local.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 3:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 5:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 50:33 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(detailsPath).text()` |
| 51:35 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(standingsPath).text()` |
| 50:22 | `api/json-parse-readFileSync` | remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json() | `await Bun.file(detailsPath).json()` |
| 51:24 | `api/json-parse-readFileSync` | remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json() | `await Bun.file(standingsPath).json()` |
| 45:8 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(detailsPath).exists()` |
| 45:39 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(standingsPath).exists()` |

## `scripts/draft-thread.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 34:36 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 35:29 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/cleanup-duplicate-parts.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/fix-episode-titles-bakuten.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 7:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 8:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 10:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/scrape-bts1.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/scrape-episode-titles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 12:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 13:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 15:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 107:33 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |
| 112:28 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |

## `scripts/fetch-challonge-avatars.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/link-product-parts.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:26 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 46:13 | `api/process-stdout-write` | Bun.stdout.write() est l'équivalent natif Bun de process.stdout.write |  |

## `scripts/fix-gacha-duplicates.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 10:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 11:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 14:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/tour-video.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 3:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 4:27 | `imports/node-prefix` | préfixer 'child_process' avec 'node:' (recommandé) | `node:child_process` |
| 274:7 | `api/fs-existsSync` | fs.existsSync(path) suivi d'un fs.mkdirSync(path) — chemin probablement un dossier, Bun.file().exists() inadapté (utiliser fs.mkdirSync(path, { recursive: true })) |  |
| 265:3 | `api/execSync` | utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync |  |

## `scripts/screenshot.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 3:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 23:8 | `api/fs-existsSync` | fs.existsSync(path) suivi d'un fs.mkdirSync(path) — chemin probablement un dossier, Bun.file().exists() inadapté (utiliser fs.mkdirSync(path, { recursive: true })) |  |

## `scripts/check-users.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/restore-from-backup.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 21:29 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(backupPath).text()` |
| 21:18 | `api/json-parse-readFileSync` | remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json() | `await Bun.file(backupPath).json()` |
| 17:10 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(backupPath).exists()` |

## `scripts/update-anime-images-hd.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 7:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 8:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 10:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/import-satr-sheet.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 9:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 11:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/test-kyoya-card.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 8:26 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 13:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |
| 14:24 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 271:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/scrape-anime.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 12:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 13:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 15:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 130:35 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |
| 138:33 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |
| 147:35 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |
| 192:39 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |
| 437:13 | `api/process-stdout-write` | Bun.stdout.write() est l'équivalent natif Bun de process.stdout.write |  |

## `scripts/sync-admins.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 5:23 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 6:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 8:32 | `imports/node-prefix` | préfixer 'url' avec 'node:' (recommandé) | `node:url` |
| 14:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 24:8 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 34:24 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 11:1 | `api/dirname-esm` | dans un ESM Bun, utiliser directement import.meta.dir (ou import.meta.dirname) | `const __dirname = import.meta.dir` |
| 11:32 | `api/fileURLToPath` | Bun.fileURLToPath() est équivalent (ou utiliser import.meta.dir/path) |  |
| 12:23 | `api/path-join-dirname` | dans un ESM Bun, path.join(import.meta.dir, ...) évite __dirname |  |

## `scripts/generate-role-pngs.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 2:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 13:10 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(filePath).exists()` |

## `scripts/fix-episode-titles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 10:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 11:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 13:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/scrape-wbo-meta.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 20:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 31:1 | `api/dirname-esm` | dans un ESM Bun, utiliser directement import.meta.dir (ou import.meta.dirname) | `const __dirname = import.meta.dir` |
| 31:27 | `api/fileURLToPath` | Bun.fileURLToPath() est équivalent (ou utiliser import.meta.dir/path) |  |

## `scripts/fast-scrape-bey-library.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:22 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 2:24 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 3:27 | `imports/node-prefix` | préfixer 'stream' avec 'node:' (recommandé) | `node:stream` |
| 4:27 | `imports/node-prefix` | préfixer 'stream/promises' avec 'node:' (recommandé) | `node:stream/promises` |
| 163:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(jsonPath, JSON.stringify(allParts, null, 2)` |
| 13:6 | `api/fs-existsSync` | fs.existsSync(path) suivi d'un fs.mkdirSync(path) — chemin probablement un dossier, Bun.file().exists() inadapté (utiliser fs.mkdirSync(path, { recursive: true })) |  |
| 33:7 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(filePath).exists()` |
| 153:13 | `api/process-stdout-write` | Bun.stdout.write() est l'équivalent natif Bun de process.stdout.write |  |

## `scripts/sync-staff-db.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 5:23 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 6:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 8:32 | `imports/node-prefix` | préfixer 'url' avec 'node:' (recommandé) | `node:url` |
| 14:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 37:8 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 47:24 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 11:1 | `api/dirname-esm` | dans un ESM Bun, utiliser directement import.meta.dir (ou import.meta.dirname) | `const __dirname = import.meta.dir` |
| 11:32 | `api/fileURLToPath` | Bun.fileURLToPath() est équivalent (ou utiliser import.meta.dir/path) |  |
| 12:23 | `api/path-join-dirname` | dans un ESM Bun, path.join(import.meta.dir, ...) évite __dirname |  |

## `scripts/scrape-bey-library-full.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 7:22 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 8:24 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 9:27 | `imports/node-prefix` | préfixer 'stream' avec 'node:' (recommandé) | `node:stream` |
| 10:27 | `imports/node-prefix` | préfixer 'stream/promises' avec 'node:' (recommandé) | `node:stream/promises` |
| 298:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(jsonPath, JSON.stringify(allParts, null, 2)` |
| 314:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(indexPath, JSON.stringify(index, null, 2)` |
| 87:7 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(filePath).exists()` |
| 285:11 | `api/process-stdout-write` | Bun.stdout.write() est l'équivalent natif Bun de process.stdout.write |  |

## `scripts/explore-communities.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |

## `scripts/list-roles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/get-user-details.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 26:36 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 27:29 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/generate-bey-manifest.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 2:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 3:32 | `imports/node-prefix` | préfixer 'url' avec 'node:' (recommandé) | `node:url` |
| 79:1 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(OUTPUT_FILE, JSON.stringify(manifest, null, 2)` |
| 5:1 | `api/dirname-esm` | dans un ESM Bun, utiliser directement import.meta.dir (ou import.meta.dirname) | `const __dirname = import.meta.dir` |
| 5:32 | `api/fileURLToPath` | Bun.fileURLToPath() est équivalent (ou utiliser import.meta.dir/path) |  |
| 59:6 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(DATA_DIR).exists()` |
| 6:18 | `api/path-join-dirname` | dans un ESM Bun, path.join(import.meta.dir, ...) évite __dirname |  |
| 7:21 | `api/path-join-dirname` | dans un ESM Bun, path.join(import.meta.dir, ...) évite __dirname |  |

## `scripts/fetch-google-sheet.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 10:21 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/analyze-seasons.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/sync-bey-library-complete.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:26 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 6:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |
| 7:24 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 8:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 11:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 342:7 | `api/process-stdout-write` | Bun.stdout.write() est l'équivalent natif Bun de process.stdout.write |  |

## `scripts/generate-knowledge-base.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |

## `scripts/sync-weights-cleaned.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 8:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 9:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 61:48 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/search-bird.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 31:36 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 32:29 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/link-3d-models.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 2:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 3:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 24:44 | `api/fs-readFileSync` | remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text() | `await Bun.file(MANIFEST_PATH).text()` |
| 124:3 | `api/fs-writeFileSync` | remplacer fs.writeFileSync(path, data) par await Bun.write(path, data) | `await Bun.write(OUTPUT_PATH, JSON.stringify(mapping, null, 2)` |
| 24:33 | `api/json-parse-readFileSync` | remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json() | `await Bun.file(MANIFEST_PATH).json()` |
| 19:8 | `api/fs-existsSync` | remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false) | `await Bun.file(MANIFEST_PATH).exists()` |

## `scripts/send-validation.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 43:24 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/test-kyoya-gif.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 5:26 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 10:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |
| 11:24 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 417:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 389:5 | `api/process-stdout-write` | Bun.stdout.write() est l'équivalent natif Bun de process.stdout.write |  |

## `scripts/update-mudae-panel.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 5:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 61:14 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/check-40k-role.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/massive-discord-sync.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 8:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/cleanup-commands.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 7:9 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 13:17 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 14:19 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 26:14 | `api/buffer-from-base64` | utiliser atob() / btoa() ou Uint8Array pour du Web-standard |  |

## `scripts/scrape-episode-titles-en.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 10:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 11:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 13:46 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 60:33 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |
| 65:19 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |

## `scripts/subscribe-twitch-local.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 4:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 5:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 6:23 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/fetch-avatars-api.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:20 | `imports/bun-native` | remplacer 'axios' par <global fetch> — fetch est global dans Bun — pas besoin d'axios | `<global fetch>` |
| 2:21 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 3:46 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 4:26 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 9:20 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/export-data.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:17 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |
| 4:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |

## `scripts/check-character-roles.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:17 | `imports/bun-native` | remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif | `Bun.sql` |
| 4:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:26 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/subscribe-twitch.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 4:18 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 5:22 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 6:23 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |

## `scripts/merge-data.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |

## `scripts/sync-bey-library.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:26 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 5:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |
| 6:24 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 118:9 | `api/process-stdout-write` | Bun.stdout.write() est l'équivalent natif Bun de process.stdout.write |  |

## `scripts/scrape-bbx-weekly.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 1:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 7:1 | `api/dirname-esm` | dans un ESM Bun, utiliser directement import.meta.dir (ou import.meta.dirname) | `const __dirname = import.meta.dir` |
| 7:27 | `api/fileURLToPath` | Bun.fileURLToPath() est équivalent (ou utiliser import.meta.dir/path) |  |
| 74:33 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |
| 208:27 | `api/exec` | utiliser le shell Bun ($`cmd`) ou Bun.spawn() à la place de exec |  |

## `scripts/screenshot-discord.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:19 | `imports/node-prefix` | préfixer 'path' avec 'node:' (recommandé) | `node:path` |
| 3:17 | `imports/node-prefix` | préfixer 'fs' avec 'node:' (recommandé) | `node:fs` |
| 7:23 | `api/process-env` | Bun.env est un alias plus court de process.env (préférence stylistique) |  |
| 16:8 | `api/fs-existsSync` | fs.existsSync(path) suivi d'un fs.mkdirSync(path) — chemin probablement un dossier, Bun.file().exists() inadapté (utiliser fs.mkdirSync(path, { recursive: true })) |  |

## `scripts/sync-products.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 2:26 | `imports/bun-native` | remplacer 'dotenv' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |
| 6:22 | `imports/node-prefix` | préfixer 'fs/promises' avec 'node:' (recommandé) | `node:fs/promises` |
| 73:9 | `api/process-stdout-write` | Bun.stdout.write() est l'équivalent natif Bun de process.stdout.write |  |

## `prisma.config.ts`

| ligne | règle | message | remplacement |
| --- | --- | --- | --- |
| 3:9 | `imports/bun-native` | remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile | `<auto>` |


