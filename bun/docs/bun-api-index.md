# Bun API catalog — index local

> Source : https://bun.com/reference/bun (245 entrées scrapées le 2026-04-17)
> Chaque entrée a une page dédiée : `https://bun.com/reference/bun/<NAME>`

## Globals Bun.*

### I/O & FS
`file` · `write` · `mmap` · `embeddedFiles` · `BunFile` · `FileSink` · `NetworkSink` · `ArrayBufferSink` · `Glob` · `Archive` (+ `ArchiveInput`, `ArchiveOptions`, `ArchiveCompression`, `ArchiveExtractOptions`)

### Network
`fetch` · `connect` · `listen` · `udp` · `udpSocket` · `Socket` · `SocketListener` · `SocketAddress` · `TCPSocket` · `TLSSocket` · `UnixSocketListener` · `FdSocketOptions`

### Server / HTTP
`serve` · `Server` · `Serve` · `BunRequest` · `WebView` · `HTMLBundle` · `FileSystemRouter` · `MatchedRoute` · `Cookie` · `CookieMap` · `CookieInit`

### WebSocket
`WebSocket` · `ServerWebSocket` · `WebSocketHandler` · `WebSocketOptions` · `WebSocketCompressor` · `WebSocketReadyState`

### Shell & Processes
`$` (shell) — `$.braces`, `$.cwd`, `$.env`, `$.escape`, `$.nothrow`, `$.throws`, `$.ShellError`, `$.ShellOutput`, `$.ShellPromise`
`spawn` · `spawnSync` · `Subprocess` · `SyncSubprocess` · `ReadableSubprocess` · `WritableSubprocess` · `PipedSubprocess` · `NullSubprocess` · `NullSyncSubprocess` · `which` · `WhichOptions` · `openInEditor` · `EditorOptions`

### Crypto / Hashing
`hash` · `sha` · `password` · `Password` · `Hash` · `CryptoHasher` · `CryptoHashInterface` · `SupportedCryptoAlgorithms` · `randomUUIDv5` · `randomUUIDv7`
Classes : `MD4` · `MD5` · `SHA1` · `SHA224` · `SHA256` · `SHA384` · `SHA512` · `SHA512_256`
Security : `CSRF` · `CSRFAlgorithm` · `CSRFGenerateOptions` · `CSRFVerifyOptions` · `secrets`

### Compression
`deflateSync` · `inflateSync` · `gzipSync` · `gunzipSync` · `zstdCompress` · `zstdCompressSync` · `zstdDecompress` · `zstdDecompressSync` · `ZlibCompressionOptions` · `LibdeflateCompressionOptions` · `CompressionFormat`

### Databases & storage
`sql` · `SQL` · `SavepointSQL` · `TransactionSQL` · `ReservedSQL` · `SQLArrayParameter`
`redis` · `RedisClient` · `RedisOptions`
`s3` · `S3Client` · `S3File` · `S3Options` · `S3FilePresignOptions` · `S3ListObjectsOptions` · `S3ListObjectsResponse` · `S3Stats`

### Scheduler
`cron` · `CronController` · `CronJob` · `CronWithAutocomplete`

### Build & Transpile
`build` · `Build` · `BuildConfig` · `BuildOutput` · `BuildArtifact` · `BuildMetafile` · `CompileBuildOptions` · `Target` · `Loader` · `JavaScriptLoader` · `Import` · `ImportKind`
`Transpiler` · `TranspilerOptions` · `MacroMap` · `TSConfig`
Plugins : `plugin` · `BunPlugin` · `BunRegisterPlugin` · `PluginBuilder` · `PluginConstraints` · `OnLoadArgs` · `OnLoadCallback` · `OnLoadResult` · `OnLoadResultObject` · `OnLoadResultSourceCode` · `OnResolveArgs` · `OnResolveCallback` · `OnResolveResult` · `OnStartCallback` · `OnEndCallback` · `OnBeforeParseCallback`

### Parsers
`JSON5` · `JSONC` · `JSONL` · `TOML` · `YAML` · `markdown`

### ANSI / TTY
`color` · `enableANSIColors` · `stripANSI` · `sliceAnsi` · `SliceAnsiOptions` · `stringWidth` · `StringWidthOptions` · `wrapAnsi` · `WrapAnsiOptions` · `Terminal` · `TerminalOptions` · `inspect` · `BunInspectOptions`

### DNS
`dns` (namespace) · `DNSLookup`

### Workers & concurrency
`Worker` · `WorkerOptions` · `WorkerType` · `WorkerEventMap` · `AbstractWorker` · `AbstractWorkerEventMap` · `isMainThread` · `Transferable` · `StructuredSerializeOptions`

### FFI / WebAssembly
`WebAssembly` · `FFIFunctionCallable` · `allocUnsafe` · `unsafe`

### Streams helpers
`readableStreamToArray` · `readableStreamToArrayBuffer` · `readableStreamToBlob` · `readableStreamToBytes` · `readableStreamToFormData` · `readableStreamToJSON` · `readableStreamToText`

### Lockfile
`BunLockFile` · `BunLockFileBasePackageInfo` · `BunLockFilePackageInfo` · `BunLockFilePackageArray` · `BunLockFileWorkspacePackage`

### Events & listeners
`BunMessageEvent` · `EventSource` · `EventSourceEventMap` · `FetchEvent` · `HMREvent` · `HMREventNames` · `MessageListener` · `MessageEvent` · `MessageEventInit` · `MessageEventSource` · `SignalsListener` · `BeforeExitListener` · `ExitListener` · `DisconnectListener` · `WarningListener` · `UncaughtExceptionOrigin` · `RejectionHandledListener` · `MultipleResolveType`

### Util / misc
`argv` · `env` · `Env` · `main` · `version` · `version_with_sha` · `revision` · `concatArrayBuffers` · `deepEquals` · `deepMatch` · `escapeHTML` · `peek` · `indexOfLine` · `nanoseconds` · `sleep` · `sleepSync` · `fileURLToPath` · `pathToFileURL` · `resolve` · `resolveSync` · `semver` · `gc` · `shrink` · `generateHeapSnapshot` · `HeapSnapshot` · `ResourceUsage` · `ErrorLike` · `SystemError` · `PathLike` · `stdin` · `stdout` · `stderr` · `MaybePromise` · `TimerHandler` · `DOMHighResTimeStamp` · `__internal`

## APIs utilisées / à cibler côté RPB

| API Bun | Usage RPB | Référence finding n2b |
|---|---|---|
| `Bun.file(p).text()` | Seed scripts, scripts/ | `api/fs-readFileSync`, `api/fs-readFile-promise` |
| `Bun.file(p).json()` | Seed scripts parsing JSON | `api/json-parse-readFileSync` |
| `Bun.file(p).exists()` | Scripts (fichier seulement) | `api/fs-existsSync` |
| `Bun.write(p, data)` | Seed scripts, scrapers | `api/fs-writeFileSync` |
| `Bun.$` | Scripts (shell commands) | `api/execSync`, `api/exec` |
| `Bun.serve` | `bot/src/lib/api-server.ts` (déjà utilisé) | `api/http-createServer` |
| `Bun.cron` | `bot/src/cron/index.ts` (déjà utilisé) | — (règles `docs/cron.md`) |
| `Bun.sleep(ms)` | — | `api/sleep-promise` |
| `Bun.inspect` | Logs debug | `api/util-inspect` |
| `Bun.TOML.parse` | Parse `*.toml` | `api/toml-parse` |
| `Bun.semver` | Version checks | `api/semver` |
| `Bun.password.hash/verify` | Auth (si migré depuis bcrypt) | `imports/bun-native` : bcrypt |
| `Bun.randomUUIDv7` | IDs ordonnables | `api/uuid-v4` |
| `Bun.nanoseconds` | Perf profiling | `api/performance-now` |
| `fetch` (global) | Scrapers, API calls | `imports/bun-native` : node-fetch/axios/got |
| `Bun.env.HOME` | — | `api/os-homedir` (info) |
| `import.meta.dir` | Scripts ESM | `api/dirname-esm`, `api/path-join-dirname` |

## APIs à NE PAS utiliser (matrice "garder")

| API | Raison |
|---|---|
| `Bun.sql` | Prisma v7 impose `@prisma/adapter-pg` |
| `Bun.$` dans `bot/src/**` | Bot compilé par SWC (discordx) |
| `Bun.redis` | Dépendance `ioredis` gardée pour compat BullMQ |

## Pointeurs

- **Index complet** : https://bun.com/reference · https://bun.com/reference/bun
- **LLM docs flat** : https://bun.com/docs/llms.txt (405 en HEAD, nécessite GET direct)
- **API par module** :
  - `bun:sqlite` — https://bun.com/reference/bun_sqlite
  - `bun:ffi` — https://bun.com/reference/bun_ffi
  - `bun:test` — https://bun.com/reference/bun_test
  - `bun:jsc` — https://bun.com/reference/bun_jsc

## APIs clés — détail

### `Bun.file` / `Bun.write` / `FileSink`
Doc : https://bun.com/docs/api/file-io · Ref : https://bun.com/reference/bun/file · https://bun.com/reference/bun/write · https://bun.com/reference/bun/FileSink

**Lecture** — `Bun.file(path | fd | URL, { type? })` retourne un `BunFile` lazy (conforme `Blob`) :
```ts
const f = Bun.file("foo.txt");
await f.text();         // string
await f.json();          // JSON parse
await f.stream();        // ReadableStream
await f.arrayBuffer();   // ArrayBuffer
await f.bytes();         // Uint8Array
await f.exists();        // Promise<boolean> — fichier uniquement (dir → false)
await f.delete();        // supprime le fichier
f.size; f.type;          // sync (MIME inferred, overridable via { type })

Bun.file(1234);                        // file descriptor
Bun.file(new URL(import.meta.url));    // fichier courant
Bun.stdin; Bun.stdout; Bun.stderr;     // BunFile globaux
```

**Écriture** — `Bun.write(dest, data): Promise<number>` (dest ∈ `string | URL | BunFile | fd`, data ∈ `string | Blob | BunFile | ArrayBuffer | TypedArray | Response`) :
```ts
await Bun.write("out.txt", "hello");
await Bun.write(Bun.file("out.txt"), Bun.file("in.txt"));   // copie
await Bun.write("index.html", await fetch("https://..."));  // stream body → disk
await Bun.write(Bun.stdout, Bun.file("in.txt"));            // cat-like
```

Chemins rapides natifs : `copy_file_range`/`sendfile`/`splice` (Linux), `clonefile`/`fcopyfile` (macOS).

**Écriture incrémentale** via `FileSink` (buffered + highWaterMark) :
```ts
const w = Bun.file("log.txt").writer({ highWaterMark: 1 << 20 });
w.write("ligne 1\n");
w.write("ligne 2\n");
w.flush();                // force le write (retourne bytes flushés)
w.end();                  // flush + close
w.unref();                // n'empêche pas l'exit du process
```

**Directories → `node:fs`** (Bun recommande explicitement) :
```ts
import { readdir, mkdir } from "node:fs/promises";
await readdir(import.meta.dir, { recursive: true });
await mkdir("path/to/dir", { recursive: true });
```

Conséquence migration : `fs.existsSync(dir)` NE peut PAS être remplacé par `Bun.file(dir).exists()` (retourne toujours false pour un dir). n2b détecte ce pattern via la heuristique `mkdirSync` dans les ~600 octets suivants.

## Guides pertinents RPB

### `HTMLRewriter` — parsing HTML natif
Remplace `cheerio` / `jsdom` / `parse5` dans les scrapers (challonge-scraper, scrape-anime, etc.).
Guide : https://bun.com/docs/guides/html-rewriter/extract-links · Doc : `/runtime/html-rewriter`

```ts
const links = new Set<string>();
const rewriter = new HTMLRewriter().on("a[href]", {
  element(el) {
    const href = el.getAttribute("href");
    if (href) links.add(new URL(href, url).href);
  },
});
await rewriter.transform(await fetch(url)).blob();
```

Accepte `Response | Blob | string` en entrée. CSS selectors supportés (`.class`, `#id`, `[attr]`, etc.).

### Import HTML/texte via import attributes
Remplace `fs.readFileSync('./template.html', 'utf8')` dans les seeds / generators.
Guide : https://bun.com/docs/guides/runtime/import-html

```ts
import html from "./file.html" with { type: "text" };
// HMR auto en --watch / --hot
```

Non couvert par une règle n2b `api/*` existante — à appliquer manuellement si on détecte un pattern `readFileSync('.html')`.

### `Bun.sql` / `Bun.SQL` — **NON applicable RPB**
Doc : https://bun.com/docs/api/sql · Ref : https://bun.com/reference/bun/sql · https://bun.com/reference/bun/SQL

API unifiée PostgreSQL / MySQL / SQLite avec tagged templates, connection pooling, transactions, prepared statements. Auto-detect l'adapter via URL (`postgres://`, `mysql://`, `sqlite://`, `:memory:`).

⚠️ **Interdit côté RPB** : Prisma v7 impose `@prisma/adapter-pg` + `pg`. La règle `imports/bun-native` n2b qui propose `pg` → `Bun.sql` **ne doit jamais être appliquée** sur ce projet (déjà dans la matrice "garder").

À noter si Prisma gagne un jour un adapter Bun.sql :
- Flag CLI `bun --sql-preconnect index.js` — préconnecte PostgreSQL au startup (cf. `fetch.preconnect` dans `docs/fetch.md`)
- Env vars auto-détectées : `DATABASE_URL`, `POSTGRES_URL`, `PGURL`, `TLS_DATABASE_URL`, `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`
- `BigInt` support via `new SQL({ bigint: true })` (sinon nombres > 2^53 retournés en string)
- Pool config : `max`, `idleTimeout`, `maxLifetime`, `connectionTimeout`
- Errors typés : `SQL.PostgresError`, `SQL.SQLiteError`, `SQL.SQLError`

**Tant qu'on utilise Prisma** : aucune action. Pas de `import { sql } from 'bun'` dans le code. L'utiliser même en one-off masquerait un problème d'architecture.

### `Bun.Cookie` / `Bun.CookieMap` — cookies natifs
Dans `Bun.serve()`, `req.cookies` est un `CookieMap` (Map-like, iterable). Lecture + mutation appliquée automatiquement aux `Set-Cookie` de la réponse. Applicable à `bot/src/lib/api-server.ts` si on ajoute de l'auth cookie-based (dashboard → bot).

```ts
Bun.serve({
  routes: {
    "/": req => {
      const session = req.cookies.get("session");      // string | null
      if (req.cookies.has("theme")) { /* ... */ }
      req.cookies.set("visited", "true");              // auto dans response
      req.cookies.delete({ name: "old", path: "/admin" });
      return new Response("ok");
    },
  },
});

// Hors Bun.serve : CookieMap stand-alone
import { CookieMap } from "bun";
const cookies = new CookieMap(req.headers.cookie || "");
res.writeHead(200, { "Set-Cookie": cookies.toSetCookieHeaders() });
```

Types : `Cookie`, `CookieMap`, `CookieInit`, `CookieSameSite`, `CookieStoreGetOptions`, `CookieStoreDeleteOptions` (déjà listés dans §Server/HTTP).
Statiques : `Bun.Cookie.parse(str)`, `Bun.Cookie.from(name, value, opts)`. Defaults : `{ path: "/", sameSite: "lax" }`.
