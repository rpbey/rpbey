# Plan de migration RPB → Bun-native

> Généré à partir de l'audit n2b v0.2.0 — 489 findings sur 156 fichiers.
> Voir `reports/n2b-summary.md` pour les stats détaillées.

## Contraintes à respecter

- **Bot** reste compilé par SWC (discordx + `emitDecoratorMetadata`, incompatible avec l'exécution TS directe de Bun).
- **Prisma 7** garde `@prisma/adapter-pg` + `pg` (driver adapter requis, pas de support `Bun.sql` pour l'instant). **Ne jamais appliquer** la règle `pg → Bun.sql`.
- **Build Next.js** reste sans `--bun` (cohérence Turbopack, cf. mémoire `feedback_no_bun_flag_build`).
- Runtime systemd est déjà Bun côté dashboard et bot.

## Phase 0 — Baseline & safety net

- [ ] `git checkout -b chore/bun-native` depuis `main`, un commit par phase.
- [ ] Rapport baseline déjà capturé : `bun/reports/n2b-baseline.{txt,md,json,jsonl,sarif}`.
- [ ] `.n2bignore` racine pour exclure : `prisma/schema.prisma`, `src/generated/**`, `bot/src/generated/**`, `node_modules/**`, `.next/**`, `bot/dist/**`.

## Phase 1 — Nettoyage des dépendances (risque nul)

**Findings ciblés** : `pkg/redundant-dep` (2), `imports/bun-native` (extrait : 8× `dotenv/config`)

- [ ] Retirer `dotenv` de `package.json` et `bot/package.json` si présent.
- [ ] Retirer `tsx` (Bun exécute TS nativement).
- [ ] Supprimer `import 'dotenv/config'` dans :
  - `prisma/create-admin.ts`
  - `prisma/set-password.ts`
  - `prisma/seed-products.ts`
  - `prisma/seed-parts.ts`
  - `prisma/seed-anime.ts`
  - `prisma/seed-beyblades.ts`
  - `prisma/create-dev-admin.ts`
  - `prisma/seed.ts`
- [ ] `bun install`
- [ ] Commit : `chore(bun): remove dotenv and tsx (redundant with Bun runtime)`
- **Validation** : `bun prisma/seed.ts` toujours fonctionnel ; `.env` lu via l'autoload Bun.

## Phase 2 — Préfixes `node:` (risque nul)

**Findings** : `imports/node-prefix` (70)

- [ ] Appliquer `n2b . --fix` ciblé, ou réécrire à la main : ajouter `node:` devant `fs`, `path`, `child_process`, `url`, `crypto`, `stream` dans :
  - `prisma/**`
  - `scripts/**`
  - `src/**` (hors `src/generated/**`)
  - `bot/src/**` (hors `bot/src/generated/**`)
- [ ] Commit : `refactor(bun): prefix Node builtins with node:`
- **Validation** : `next build` + `bun bot:build`.

## Phase 3 — `Bun.file` dans les scripts (risque faible)

**Findings** : `api/fs-existsSync` (25), `api/fs-readFileSync` (9), `api/fs-writeFileSync` (16), `api/json-parse-readFileSync` (8)

**Scope restreint** : `prisma/seed-*.ts`, `scripts/*.ts`.
**Ne pas toucher** : `src/app/api/**`, `bot/src/lib/api-server.ts`, `bot/src/lib/**` qui sont exécutés côté Next.js / SWC.

Rewrites :
- `fs.readFileSync(p, 'utf8')` → `await Bun.file(p).text()`
- `JSON.parse(fs.readFileSync(p, 'utf8'))` → `await Bun.file(p).json()`
- `fs.existsSync(p)` → `await Bun.file(p).exists()` (fichier uniquement — pour un dossier, toujours false)
- `fs.writeFileSync(p, data)` → `await Bun.write(p, data)`

- [ ] Commit : `refactor(bun): use Bun.file/Bun.write in seed scripts`
- **Validation** : exécuter chaque script seed et vérifier l'output DB.

## Phase 4 — Shell commands (risque moyen)

**Findings** : `api/execSync` (9), `api/exec` (10), `cli/npx` (1)

- [ ] Remplacer `execSync(cmd)` par `await Bun.$\`cmd\`` UNIQUEMENT dans :
  - `prisma/seed.ts:121` (`child_process.execSync` pour `prisma db push`)
  - `scripts/*.ts` (cas par cas)
- [ ] **Ne pas toucher** `bot/src/**` : SWC/Node-like au build, `Bun.$` pas garanti.
- [ ] Commit : `refactor(bun): replace child_process with Bun.$ in scripts`

## Phase 5 — Web APIs globales (risque nul)

**Findings** : `api/buffer-from-base64` (6), `api/performance-now` (5), `api/child-process-spawn` (1), `api/crypto-createHash` (1)

Cf. `docs/web-apis.md`. Ces APIs sont portables (Node 18+ compatible).

- [ ] `Buffer.from(x, 'base64')` → `atob(x)` quand approprié
- [ ] `performance.now()` → retirer les imports `perf_hooks`, utiliser directement le global
- [ ] `crypto.createHash` : garder `node:crypto` (plus ergonomique que SubtleCrypto pour du hashing simple)
- [ ] Commit : `refactor(bun): adopt Web-standard globals (atob/btoa/performance)`

## Phase 6 — `Bun.env` (cosmétique, SKIP par défaut)

**Findings** : `api/process-env` (173 info)

**Décision** : pas d'application. `process.env` reste portable (important si un jour on migre vers Node ou Cloudflare Workers).

## Phase 7 — `Bun.cron` corrections (non-n2b mais critique)

Cf. `docs/cron.md`. Le bot n'a pas le comportement optimal :

- [ ] Dans `bot/src/cron/index.ts`, remplacer `() => { task(); }` par `() => task()` (garantit no-overlap).
- [ ] Dans `bot/src/index.ts`, ajouter :
  ```ts
  process.on('unhandledRejection', (err) => logger.error('unhandled rejection:', err));
  process.on('uncaughtException', (err) => logger.error('uncaught exception:', err));
  ```
- [ ] Commit : `fix(bot): honor Bun.cron no-overlap contract + add unhandledRejection handler`

## Phase 8 — Packages internes

**Finding** : `pkg/tsup-bun-external` (2)

- [ ] Dans `packages/rppb-api/package.json`, ajouter `--external bun` aux scripts `build` et `dev` si un `await import('bun')` est fait dans le code.

## Phase 9 — Optimisations fetch (optionnel, cf. `docs/fetch.md`)

- [ ] **`fetch.preconnect`** au démarrage du bot (`bot/src/index.ts`) :
  ```ts
  if (typeof fetch.preconnect === 'function') {
    fetch.preconnect('https://discord.com');
    fetch.preconnect('https://api.twitch.tv');
    fetch.preconnect('https://api.challonge.com');
  }
  ```
  Guard `typeof` pour rester portable Node.
- [ ] **`AbortSignal.timeout(ms)`** dans `src/lib/tiktok.ts` en remplacement du `Promise.race` + `setTimeout` manuel. Portable Node 18+.
- [ ] **`fetch({ proxy })`** si on remplace un scraper tiers (tiktok-api-dl) par du code maison — supprime la dépendance `socks-proxy-agent`.
- [ ] Commit : `perf(bun): preconnect hot hosts and use AbortSignal.timeout`

## Phase 10 — Validation finale

- [ ] Regénérer rapport : `n2b . --report md > bun/reports/n2b-after.md`
- [ ] Diff baseline : `diff bun/reports/n2b-baseline.md bun/reports/n2b-after.md | head`
- [ ] Stack complet :
  ```bash
  bun install --frozen-lockfile
  bun db:generate
  bun run build             # next build (sans --bun)
  bun bot:build             # SWC
  bun run lint
  ```
- [ ] Smoke tests :
  ```bash
  sudo systemctl restart rpb-dashboard rpb-bot
  sudo journalctl -u rpb-dashboard -n 50 --no-pager
  sudo journalctl -u rpb-bot -n 50 --no-pager
  curl -fsS https://rpbey.fr/api/discord/stats | head
  ```
- [ ] Merger `chore/bun-native` → `main` si tout est vert.

## Matrice « migrer vs garder »

| Zone | Décision | Raison |
|---|---|---|
| `src/lib/prisma.ts`, usage `pg` | Garder | Prisma v7 impose `@prisma/adapter-pg` |
| `src/generated/**`, `bot/src/generated/**` | Ignorer | Fichiers auto-générés par `prisma generate` |
| `bot/src/lib/api-server.ts` (`Bun.serve`) | Déjà Bun-native | — |
| `bot/src/index.ts` (`import 'reflect-metadata'`) | Garder | discordx |
| `next.config.ts` `process.env.*` | Garder | Portabilité Next.js |
| `src/app/api/**` | Garder en `process.env` | Compatibilité SSR / build Next |

## Estimation

| Phase | Durée | Risque |
|---|---|---|
| 1 | 15 min | Nul |
| 2 | 30 min | Nul |
| 3 | 45 min | Faible |
| 4 | 60 min | Moyen |
| 5 | 20 min | Nul |
| 7 | 15 min | Faible |
| 8 | 10 min | Nul |
| 9 | 30 min (validation) | — |

**Total** : ~4h avec tests. Exécutable en une demi-journée.
