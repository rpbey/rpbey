# Bun fetch (référence locale)

> Source : https://bun.com/docs/api/fetch

Bun implémente `fetch` WHATWG + extensions serveur. Les features Bun-spécifiques ci-dessous sont **non-portables Node** — les marquer avec un commentaire si on les adopte.

## Features utiles pour RPB

### 1. `proxy` natif (remplace `socks-proxy-agent`)

```ts
await fetch("http://example.com", {
  proxy: "http://proxy.com",
});

// Avec headers custom vers le proxy
await fetch("http://example.com", {
  proxy: {
    url: "http://proxy.com",
    headers: { "Proxy-Authorization": "Bearer my-token" },
  },
});
```

**Impact RPB** : `@tobyg74/tiktok-api-dl` tire `socks-proxy-agent` (erreurs Turbopack au build passées). Si on gère nos propres appels TikTok/scraping, on peut bypass `socks-proxy-agent` via `fetch({ proxy })`.

### 2. `fetch.preconnect` pour les hôtes connus

Warm-up DNS + TCP + TLS avant le premier appel :

```ts
import { fetch } from 'bun';
fetch.preconnect('https://discord.com');
fetch.preconnect('https://api.challonge.com');
fetch.preconnect('https://api.twitch.tv');
```

**Impact RPB** : à appeler au démarrage du bot et du dashboard pour les hôtes chauds (Discord, Challonge, Twitch, YouTube). Gain typique : 50-200ms sur le premier appel.

Version CLI :
```bash
bun --fetch-preconnect https://discord.com --fetch-preconnect https://api.challonge.com server.js
```

### 3. `dns.prefetch`

```ts
import { dns } from 'bun';
dns.prefetch('cdn.discordapp.com');
```

Pareil mais juste pour le DNS (quand on ne sait pas encore le protocole).

### 4. `AbortSignal.timeout`

```ts
await fetch(url, { signal: AbortSignal.timeout(5000) });
```

**Impact RPB** : remplacer `Promise.race` avec `setTimeout` utilisé dans `src/lib/tiktok.ts`. Plus concis, et fonctionne aussi en Node 18+ (portable).

### 5. Streaming body (download)

```ts
const res = await fetch(url);
for await (const chunk of res.body) { /* ... */ }
```

**Impact RPB** : utile pour les gros downloads (canvas, PDF).

### 6. Unix domain sockets

```ts
await fetch('http://localhost/api', {
  unix: '/var/run/bot.sock',
});
```

Non utilisé actuellement (bot exposé TCP sur 3001), mais option si on passe en UDS pour l'auth bot ↔ dashboard.

### 7. `verbose: true` / `"curl"`

```ts
await fetch(url, { verbose: true });         // headers only
await fetch(url, { verbose: "curl" });       // curl-equivalent command
```

**Impact RPB** : utile en debug pour les scrapers TikTok / Challonge qui échouent sporadiquement.

### 8. `decompress`

Défaut `true` — gère `gzip`, `deflate`, `brotli`, **`zstd`**. Node natif ne gère pas zstd avant v23.8+ et pas dans le global fetch.

### 9. `keepalive: false`

Opt-out du pool de connexions pour une requête. Utile si un serveur distant limite le nombre de requêtes persistantes par IP.

## Config env déjà utilisée

- `BUN_CONFIG_MAX_HTTP_REQUESTS=256` est déjà dans `rpb-dashboard.service` (valeur par défaut Bun). Pas à changer.

## Features à NE PAS adopter (non portable Node)

- `tls.key/cert/ca/rejectUnauthorized` dans fetch — utiliser plutôt une instance `https.Agent` dans Node.
- `s3://` URLs — dépendance Bun S3 SDK, on utilise déjà un autre provider.
- `file://` via fetch — préférer `Bun.file()` (même API unifiée).
- `blob:` URLs — pas pertinent côté serveur.

## Proposition d'intégration

**Dans `bot/src/index.ts`** (après `setupCronJobs()`) :

```ts
if (typeof fetch.preconnect === 'function') {
  fetch.preconnect('https://discord.com');
  fetch.preconnect('https://api.twitch.tv');
  fetch.preconnect('https://api.challonge.com');
}
```

Le `typeof` guard permet de garder le code portable Node (où `fetch.preconnect` n'existe pas).

**Ajouter au plan de migration** :
- Phase 10 (optionnel) — `fetch.preconnect` au démarrage bot/dashboard.
- Phase 11 (optionnel) — remplacer `socks-proxy-agent` par `fetch({ proxy })` dans les scrapers maison (pas dans `@tobyg74/tiktok-api-dl` qui est externe).
