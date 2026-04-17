# Bun ↔ Node.js Compatibility (référence locale)

> Source : https://bun.com/docs/runtime/nodejs-apis — basé sur Node.js v23

## Modules `node:*` utilisés dans RPB

Scan `rg "from 'node:[^']+'" -o | sort -u` (après Phase 2 du plan) :

| Module | Statut Bun | Impact RPB |
|---|---|---|
| `node:fs` | 🟢 Full (92% tests passent) | OK — remplacé par `Bun.file` dans les seeds (Phase 3) |
| `node:path` | 🟢 Full (100% tests) | OK |
| `node:url` | 🟢 Full | OK |
| `node:crypto` | 🟡 Manque `secureHeapUsed`, `setEngine`, `setFips` | OK — pas utilisé |
| `node:net` | 🟢 Full | OK (utilisé par pg) |
| `node:stream` | 🟢 Full | OK (utilisé par pg, pino) |
| `node:buffer` | 🟢 Full | OK |
| `node:events` | 🟢 Full (100% tests) | OK (discord.js, Prisma) |
| `node:child_process` | 🟡 Manque `proc.gid/uid`, IPC sockets | OK — `execSync` fonctionne pour prisma/seed.ts |
| `node:http` | 🟢 Full (body client buffered) | OK |
| `node:zlib` | 🟢 Full (98% tests) | OK |
| `node:readline` | 🟢 Full | OK |
| `node:perf_hooks` | 🟡 Tests Node ne passent pas | **Préférer `performance` global** |
| `node:module` | 🟡 `module.register` non implémenté | OK — pas utilisé |
| `node:tls` | 🟡 Manque `tls.createSecurePair` | OK |
| `node:worker_threads` | 🟡 Manque `stdin/stdout/stderr` options | OK — pas utilisé |

## Modules 🔴 NON implémentés (à éviter)

- `node:repl`
- `node:sqlite` — pas de souci, on utilise PostgreSQL
- `node:trace_events`
- `node:test` — utiliser `bun:test` à la place

## Globals utiles pour la migration

Tout ce qui est 🟢 dans Bun = 🟢 dans Node 18+ → **rewrites portables** :

- `atob`, `btoa`
- `Buffer` (mais `atob` préférable pour base64 → string)
- `fetch`, `Response`, `Request`, `Headers`
- `FormData`
- `URL`, `URLSearchParams`
- `AbortController`, `AbortSignal`
- `CompressionStream`, `DecompressionStream`
- `crypto` (WebCrypto), `SubtleCrypto`
- `performance`
- `structuredClone`
- `queueMicrotask`, `setImmediate`, `setTimeout`
- `TextEncoder`, `TextDecoder`
- `WebAssembly`
- `ReadableStream`, `WritableStream`, `TransformStream`
- `__dirname`, `__filename` (oui, même en ESM dans Bun)
- `require()` (avec `.main`, `.cache`, `.resolve`)

## Conséquence : `__dirname` en ESM

Le client Prisma généré (`src/generated/prisma/client.ts:16`) fait :
```ts
globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url))
```

Sous Bun, `__dirname` et `__filename` sont déjà globaux même en ESM → cette ligne est redondante quand on tourne avec Bun. Mais comme c'est du code généré par Prisma (sous `runtime = "bun"`), le laisser en place (ne rien modifier dans `src/generated/**`).

## `process.*` — caveats

- `process.loadEnvFile` : **pas implémenté** → utiliser l'autoload `.env` automatique de Bun
- `process.getBuiltinModule` : pas implémenté
- `process.title` : no-op sur macOS/Linux (cosmétique)
- `process.binding` : partiel (certains packages anciens)

Pour 99% du code RPB : `process.env`, `process.exit`, `process.cwd` fonctionnent normalement.

## Implications pour le plan de migration

1. **Phase 2 (node: prefixes)** : 100% safe, tous les modules sont 🟢 ou 🟡 avec les parties qu'on utilise.
2. **Phase 3 (Bun.file)** : sûr, `node:fs` reste 🟢 même après migration partielle.
3. **Phase 4 (Bun.$)** : `node:child_process.execSync` est 🟡 mais fonctionnel pour nos usages.
4. **Phase 5 (Web APIs)** : portable Node 18+, validé.
5. **Pas de rewrites `Buffer.from(x, 'base64')` → `atob(x)` obligatoires** — `Buffer` est 🟢 full, rewrite uniquement si on veut du Web-standard.
