# Bun Web APIs (référence locale)

> Source : https://bun.com/docs/runtime/web-apis

Bun privilégie les Web-standard APIs sur les APIs spécifiques au runtime. Liste des APIs globales disponibles sans import.

| Catégorie | APIs |
|---|---|
| HTTP | `fetch`, `Response`, `Request`, `Headers`, `AbortController`, `AbortSignal` |
| URLs | `URL`, `URLSearchParams` |
| Workers | `Worker`, `MessagePort`, `MessageChannel`, `BroadcastChannel`, `structuredClone` |
| Streams | `ReadableStream`, `WritableStream`, `TransformStream`, `ByteLengthQueuingStrategy`, `CountQueuingStrategy` |
| Blob | `Blob` |
| WebSockets | `WebSocket` |
| Encoding | `atob`, `btoa`, `TextEncoder`, `TextDecoder` |
| JSON | `JSON` |
| Timers | `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` |
| Crypto | `crypto`, `SubtleCrypto`, `CryptoKey` |
| Debug | `console`, `performance` |
| Microtasks | `queueMicrotask` |
| Errors | `reportError` |
| CLI | `alert`, `confirm`, `prompt` |
| Realms | `ShadowRealm` |
| Events | `EventTarget`, `Event`, `ErrorEvent`, `CloseEvent`, `MessageEvent` |

## Implications pour la migration RPB

| Finding n2b | Remplacement Web-standard | Action |
|---|---|---|
| `api/buffer-from-base64` (6) | `atob()` / `btoa()` | Rewrite direct |
| `api/performance-now` (5) | `performance.now()` | Retirer import `perf_hooks` |
| `api/crypto-createHash` (1) | `crypto.subtle.digest()` ou garder `node:crypto` | Au choix |

**Imports redondants à scanner** :
- `node-fetch` → `fetch` global
- `form-data` → `FormData` global
- `ws` (côté client) → `WebSocket` global (garder côté serveur pour le server `WebSocketServer`)

Ces APIs étant aussi disponibles en Node 18+, les rewrites sont portables (n'enferment pas le code dans Bun).
