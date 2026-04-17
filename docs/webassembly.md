# WebAssembly dans Next.js 16 + SWC

> Documentation basée sur le code source de Next.js v16.1.1 (`vercel/next.js`), SWC v1.15.26 (`swc-project/swc`), MDN WebAssembly, Binaryen, wasm-pack, serde-wasm-bindgen et wasm-tools.  
> Stack RPB : Next.js `^16.1.1`, `@swc/core ^1.15.24`, Bun, Turbopack (dev) + Webpack (build).

---

## Table des matières

1. [Contexte](#1-contexte)
2. [Architecture WASM dans Next.js 16](#2-architecture-wasm-dans-nextjs-16)
3. [Configuration](#3-configuration)
4. [Méthodes d'import](#4-méthodes-dimport)
5. [Performances comparées](#5-performances-comparées)
6. [Implémentation optimale](#6-implémentation-optimale)
7. [Typing TypeScript](#7-typing-typescript)
8. [SWC et WASM](#8-swc-et-wasm)
9. [Compiler Rust → WASM (wasm-pack)](#9-compiler-rust--wasm-wasm-pack)
10. [Sérialisation Rust ↔ JS (serde-wasm-bindgen)](#10-sérialisation-rust--js-serde-wasm-bindgen)
11. [Optimisation des binaires (Binaryen / wasm-opt)](#11-optimisation-des-binaires-binaryen--wasm-opt)
12. [Component Model et WIT (wasm-tools)](#12-component-model-et-wit-wasm-tools)
13. [API JavaScript complète](#13-api-javascript-complète)
14. [Erreurs courantes](#14-erreurs-courantes)
15. [Checklist d'intégration](#15-checklist-dintégration)

---

## 1. Contexte

Next.js 16 utilise **deux bundlers** selon le contexte :

| Contexte | Bundler | Support WASM |
|---|---|---|
| `bun dev` (développement) | **Turbopack** | Natif, sans config |
| `bun run build` (production) | **Webpack 5** | Nécessite `asyncWebAssembly: true` |

Turbopack (écrit en Rust) gère le WASM nativement via `turbopack-wasm` — un crate dédié qui compile et lie les modules `.wasm` directement dans le graphe de modules. Webpack 5 nécessite l'activation manuelle de l'expérimental `asyncWebAssembly`.

---

## 2. Architecture WASM dans Next.js 16

### Turbopack (dev)

Turbopack instancie les modules WASM via streaming depuis le filesystem :

```ts
// Source : turbopack/crates/turbopack-ecmascript-runtime/js/src/shared-node/node-wasm-utils.ts
function readWebAssemblyAsResponse(path: string) {
  const stream = createReadStream(path);
  return new Response(Readable.toWeb(stream), {
    headers: { 'content-type': 'application/wasm' },
  });
}

// Compilation streamée — le module est compilé au fil du stream
async function compileWebAssemblyFromPath(path: string): Promise<WebAssembly.Module> {
  const response = readWebAssemblyAsResponse(path);
  return await WebAssembly.compileStreaming(response);
}

// Instanciation streamée avec imports
async function instantiateWebAssemblyFromPath(
  path: string,
  importsObj: WebAssembly.Imports
): Promise<WebAssembly.Exports> {
  const response = readWebAssemblyAsResponse(path);
  const { instance } = await WebAssembly.instantiateStreaming(response, importsObj);
  return instance.exports;
}
```

### Webpack (build prod)

Webpack utilise `FetchCompileAsyncWasmPlugin` pour émettre les fichiers `.wasm` dans `static/wasm/[modulehash].wasm` et les charger via `fetch()` côté client, ou via filesystem côté serveur.

### Edge Runtime / Middleware

Le middleware WASM loader (`next-middleware-wasm-loader.ts`) hash le contenu du `.wasm` (SHA-1) et l'émet dans `server/edge-chunks/wasm_<hash>.wasm` pour le runtime Edge.

---

## 3. Configuration

### `next.config.ts`

Ajouter la section `webpack` pour activer `asyncWebAssembly` en production (Webpack) :

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ...config existante...

  webpack(config, { isServer, dev }) {
    // Chemin de sortie des fichiers .wasm
    // Différent entre server (standalone) et client
    config.output.webassemblyModuleFilename =
      isServer && !dev
        ? '../static/wasm/[modulehash].wasm'
        : 'static/wasm/[modulehash].wasm';

    // Activer asyncWebAssembly (Webpack 5)
    // Turbopack n'a pas besoin de cette option
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

export default nextConfig;
```

> **Note** : Turbopack (utilisé par `bun dev`) supporte WASM nativement sans cette config. Elle est uniquement nécessaire pour `bun run build`.

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.wasm.d.ts", "types/**/*.d.ts"]
}
```

---

## 4. Méthodes d'import

### Méthode A — Import statique (Server Component, Node.js)

La plus simple. Next.js résout l'import à la compilation.

```tsx
// app/(marketing)/page.tsx — Server Component
const exports = await import('@/wasm/my-module.wasm');
const { compute } = exports;
const result = compute(42);
```

**Avantages** : Simple, type-safe avec `.wasm.d.ts`.  
**Inconvénients** : Charge tout le buffer en mémoire avant instanciation.

---

### Méthode B — `WebAssembly.instantiateStreaming` (Server Component, optimal)

C'est exactement ce que Turbopack fait en interne. Le module est compilé **au fil du stream** sans jamais charger le fichier entier en RAM.

```ts
// lib/wasm.ts
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';

export async function loadWasm<T extends WebAssembly.Exports>(
  wasmRelativePath: string,
  imports?: WebAssembly.Imports
): Promise<T> {
  const absolutePath = path.join(process.cwd(), wasmRelativePath);
  const stream = createReadStream(absolutePath);

  const response = new Response(Readable.toWeb(stream as any), {
    headers: { 'content-type': 'application/wasm' },
  });

  const { instance } = await WebAssembly.instantiateStreaming(response, imports);
  return instance.exports as T;
}
```

```tsx
import { loadWasm } from '@/lib/wasm';
import type * as MyModule from '@/wasm/my-module.wasm';

export default async function Page() {
  const exports = await loadWasm<typeof MyModule>('public/wasm/my-module.wasm');
  return <div>{exports.compute(42)}</div>;
}
```

---

### Méthode C — `?module` pré-compilé (Edge Runtime, optimal)

```ts
// app/api/compute/route.ts
import type * as MyModule from '@/wasm/my-module.wasm';
// @ts-ignore — syntaxe ?module spécifique à Next.js Edge
import myWasm from '@/wasm/my-module.wasm?module';

export const runtime = 'edge';

// Pré-compilation au démarrage du worker — UNE seule fois
const modulePromise = WebAssembly.instantiate(myWasm);

export async function GET(request: Request) {
  const instance = await modulePromise;
  const { compute } = instance.exports as typeof MyModule;
  const n = parseInt(new URL(request.url).searchParams.get('n') ?? '42');
  return Response.json({ result: compute(n) });
}
```

---

### Méthode D — Middleware (Edge, avec contraintes)

```ts
// middleware.ts
import { NextResponse } from 'next/server';
// @ts-ignore
import squareWasm from './wasm/square.wasm?module';

const wasmModule = WebAssembly.instantiate(squareWasm);

export async function middleware(request: Request) {
  const instance = await wasmModule;
  const { square } = instance.exports as { square: (n: number) => number };
  const response = NextResponse.next();
  response.headers.set('x-wasm-result', square(9).toString());
  return response;
}
```

> **Interdit dans le middleware** : `WebAssembly.compile(buffer)` et `WebAssembly.instantiate(buffer)` — utiliser `?module` exclusivement.

---

## 5. Performances comparées

| Méthode | Compile | RAM | Cold start | Requêtes suivantes | Contexte |
|---|---|---|---|---|---|
| `import('./mod.wasm')` | Build | Buffer complet | Lent | Réutilisé | Server Component |
| `instantiateStreaming` (stream fs) | Runtime | **Streamé** | **Rapide** | Réutilisable | **Server Node.js optimal** |
| `?module` pré-compilé | Build | **Minimal** | **Ultra-rapide** | **Instance réutilisée** | **Edge Runtime optimal** |
| `WebAssembly.compile(buffer)` | Runtime | Buffer complet | Très lent | — | À éviter |
| `WebAssembly.instantiate(buffer)` | Runtime | Buffer complet | Très lent | — | **Interdit** en middleware |

### Pourquoi `instantiateStreaming` est plus rapide

```
instantiate(buffer)    : [─── lecture complète ───][─── compilation ───]
instantiateStreaming   : [─── lecture ───]
                                [─── compilation en parallèle ───]
```

---

## 6. Implémentation optimale

### Structure de fichiers recommandée

```
src/
├── lib/
│   └── wasm.ts              # Utilitaire loadWasm() avec cache
├── wasm/
│   ├── my-module.wasm       # Binaire WASM
│   └── my-module.wasm.d.ts  # Déclarations TypeScript
types/
└── wasm.d.ts                # Déclarations globales ?module
public/
└── wasm/
    └── my-module.wasm       # Copie publique si nécessaire côté client
```

### Utilitaire complet avec cache

```ts
// lib/wasm.ts
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';

const cache = new Map<string, WebAssembly.Instance>();

/**
 * Charge un module WASM avec cache en mémoire.
 * Utilise WebAssembly.instantiateStreaming pour les performances maximales.
 * Compatible avec le runtime Node.js (Server Components, Route Handlers).
 * Identique à l'implémentation interne de Turbopack.
 */
export async function loadWasm<T extends WebAssembly.Exports>(
  wasmRelativePath: string,
  imports?: WebAssembly.Imports
): Promise<T> {
  if (cache.has(wasmRelativePath)) {
    return cache.get(wasmRelativePath)!.exports as T;
  }

  const absolutePath = path.join(process.cwd(), wasmRelativePath);
  const stream = createReadStream(absolutePath);

  const response = new Response(Readable.toWeb(stream as any), {
    headers: { 'content-type': 'application/wasm' },
  });

  const { instance } = await WebAssembly.instantiateStreaming(response, imports);
  cache.set(wasmRelativePath, instance);

  return instance.exports as T;
}
```

---

## 7. Typing TypeScript

### Déclaration manuelle `.wasm.d.ts`

```ts
// src/wasm/my-module.wasm.d.ts
export function compute(n: number): number;
export function add_one(n: number): number;
export const memory: WebAssembly.Memory;
```

### Déclaration globale pour `?module`

```ts
// types/wasm.d.ts
declare module '*.wasm' {
  const content: WebAssembly.Module;
  export default content;
}

declare module '*.wasm?module' {
  const content: WebAssembly.Module;
  export default content;
}
```

---

## 8. SWC et WASM

SWC (`@swc/core ^1.15.24`) est le compilateur TypeScript du projet.

### 8.1 SWC compile du code qui utilise WASM

SWC transpile le TypeScript normalement — les imports `.wasm` sont résolus par Webpack/Turbopack, pas par SWC.

### 8.2 SWC supporte des plugins écrits en WASM

```js
// next.config.ts
experimental: {
  swcPlugins: [
    ['my-swc-plugin', { ...options }],
    ['/absolute/path/to/plugin.wasm', {}],
  ],
}
```

### 8.3 `emitDecoratorMetadata` — pertinent pour le bot RPB

Le bot utilise discordx avec `emitDecoratorMetadata`. SWC le supporte via :

```json
// bot/.swcrc
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true
    },
    "transform": {
      "decoratorMetadata": true,
      "legacyDecorator": true
    },
    "target": "es2020"
  },
  "module": { "type": "es6" }
}
```

Bun ne supporte pas `emitDecoratorMetadata` en TS natif — d'où `bun bot:build` obligatoire.

---

## 9. Compiler Rust → WASM (wasm-pack)

### Installation

```bash
cargo install wasm-pack
```

### Création d'un projet

```bash
wasm-pack new my-module
cd my-module
```

### Code Rust exemple

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

// Importer depuis JavaScript
#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

// Exporter vers JavaScript
#[wasm_bindgen]
pub fn compute(n: i32) -> i32 {
    n * n
}

#[wasm_bindgen]
pub fn add_one(n: i32) -> i32 {
    n + 1
}
```

### `Cargo.toml`

```toml
[package]
name = "my-module"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
serde-wasm-bindgen = "0.6"
serde = { version = "1", features = ["derive"] }
```

### Build selon la cible

```bash
wasm-pack build --target bundler  # Next.js / Webpack — génère un package npm
wasm-pack build --target web      # ES modules directs (browser)
wasm-pack build --target nodejs   # Node.js / Bun
wasm-pack publish                 # Publier sur npm
```

### Configuration fine dans `Cargo.toml`

```toml
[package.metadata.wasm-pack.profile.dev.wasm-bindgen]
debug-js-glue = true
demangle-name-section = true
dwarf-debug-info = false

[package.metadata.wasm-pack.profile.release]
wasm-opt = false  # Désactiver si wasm-opt est appliqué manuellement après

[package.metadata.wasm-pack.profile.release.wasm-bindgen]
debug-js-glue = false
demangle-name-section = true
```

### Sortie générée dans `pkg/`

```
pkg/
├── my_module.wasm        # Binaire WASM
├── my_module.js          # Wrapper JavaScript (glue code)
├── my_module.d.ts        # Déclarations TypeScript auto-générées
└── package.json
```

---

## 10. Sérialisation Rust ↔ JS (serde-wasm-bindgen)

Plus performant que JSON pour les échanges de données complexes entre Rust et JavaScript. Génère des types JS natifs (Map, Array) au lieu de passer par une chaîne JSON.

### Rust → JavaScript

```rust
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct MyData {
    scores: Vec<f64>,
    labels: HashMap<String, i32>,
}

// Envoyer des données Rust vers JavaScript
#[wasm_bindgen]
pub fn get_data() -> Result<JsValue, JsValue> {
    let data = MyData {
        scores: vec![1.0, 2.0, 3.0],
        labels: HashMap::from([("a".to_string(), 1)]),
    };
    Ok(serde_wasm_bindgen::to_value(&data)?)
}
```

### JavaScript → Rust

```rust
// Recevoir des données JavaScript en Rust
#[wasm_bindgen]
pub fn process_data(val: JsValue) -> Result<JsValue, JsValue> {
    let data: MyData = serde_wasm_bindgen::from_value(val)?;
    // ... traitement ...
    Ok(serde_wasm_bindgen::to_value(&result)?)
}
```

### API de base

```rust
// Sérialiser Rust → JsValue
let js_value: JsValue = serde_wasm_bindgen::to_value(&rust_value)?;

// Désérialiser JsValue → Rust
let rust_value: MyType = serde_wasm_bindgen::from_value(js_value)?;
```

---

## 11. Optimisation des binaires (Binaryen / wasm-opt)

`wasm-opt` (outil CLI de Binaryen) réduit la taille et améliore les performances des `.wasm` après compilation.

### Optimisations CLI

```bash
# Optimisation standard (-O = -O2)
wasm-opt input.wasm -o output.wasm -O

# Optimisation agressive (-O3)
wasm-opt input.wasm -o output.wasm -O3

# Pattern optimal : intrinsics → lowering → re-optimisation
wasm-opt input.wasm -o output.wasm -O --intrinsic-lowering -O

# Réduire la taille au maximum (-Oz)
wasm-opt input.wasm -o output.wasm -Oz

# Voir toutes les options
wasm-opt --help
```

### Convertir WASM → JavaScript (fallback)

```bash
# Pour les navigateurs sans support WASM (très rare aujourd'hui)
bin/wasm2js input.wasm -o output.mjs
bin/wasm2js input.wasm -O -o output.mjs  # avec optimisation
```

### API JavaScript de Binaryen

```js
const Binaryen = require('binaryen');

const module = Binaryen.readBinary(fs.readFileSync('input.wasm'));
module.optimize();  // applique tous les passes d'optimisation
const optimized = module.emitBinary();
fs.writeFileSync('output.wasm', optimized);
module.dispose();
```

### Intégration dans le pipeline de build RPB

```json
// package.json
{
  "scripts": {
    "wasm:build": "wasm-pack build --target bundler",
    "wasm:opt": "wasm-opt pkg/my_module_bg.wasm -o pkg/my_module_bg.wasm -O3",
    "wasm:all": "bun wasm:build && bun wasm:opt"
  }
}
```

---

## 12. Component Model et WIT (wasm-tools)

Le **Component Model** est la prochaine évolution de WebAssembly — il permet la composition de modules WASM avec des interfaces typées cross-langage via **WIT** (WebAssembly Interface Types).

### Installation

```bash
cargo install wasm-tools
```

### Valider un module

```bash
wasm-tools validate foo.wasm
wasm-tools validate foo.wat                          # format texte
wasm-tools validate foo.wasm --features=exception-handling
wasm-tools validate foo.wasm --features=-simd        # désactiver SIMD
wasm-tools validate --features=component-model component.wasm
```

### WIT — Interface Types

```wit
// demo.wit
package my:demo;

interface host {
  hello: func();
  compute: func(n: s32) -> s32;
}

world demo {
  import host;
  export compute: func(n: s32) -> s32;
}
```

```bash
# Créer un composant depuis un fichier WIT
wasm-tools component wit demo.wit -o demo.wasm --wasm

# Extraire l'interface WIT d'un composant existant
wasm-tools component wit component.wasm

# Convertir WIT → JSON
wasm-tools component wit ./wit --json

# Créer un composant depuis un module core WASM
wasm-tools component new my-core.wasm -o my-component.wasm

# Avec adaptateur WASI
wasm-tools component new my-core.wasm -o my-component.wasm \
  --adapt wasi_snapshot_preview1.reactor.wasm
```

### Parser WIT en Rust

```rust
use wit_parser::{Resolve, UnresolvedPackage};

fn parse_wit(wit_path: &str) -> anyhow::Result<()> {
    let mut resolve = Resolve::new();
    let pkg = UnresolvedPackage::parse_file(wit_path)?;
    let pkg_id = resolve.push(pkg)?;

    let package = &resolve.packages[pkg_id];
    println!("Package: {}", package.name);

    for (_, world_id) in &package.worlds {
        let world = &resolve.worlds[*world_id];
        println!("World: {}", world.name);
        for (name, _) in &world.imports { println!("  Import: {}", name); }
        for (name, _) in &world.exports { println!("  Export: {}", name); }
    }
    Ok(())
}
```

---

## 13. API JavaScript complète

### Fonctions globales

```js
// Recommandé — compile + instancie en streaming
WebAssembly.instantiateStreaming(fetch('module.wasm'), importObject)
  .then(({ module, instance }) => {
    // module : WebAssembly.Module — réutilisable, envoyable via postMessage
    // instance : WebAssembly.Instance — stateful, exécutable
    instance.exports.myFunc();
  });

// Compiler seulement (pour créer plusieurs instances)
const module = await WebAssembly.compileStreaming(fetch('module.wasm'));
const instance1 = await WebAssembly.instantiate(module, imports1);
const instance2 = await WebAssembly.instantiate(module, imports2);

// Valider un binaire
const isValid = WebAssembly.validate(buffer); // → boolean
```

### Import object — namespace à deux niveaux

```js
const importObject = {
  my_namespace: {
    imported_func: (arg) => console.log(arg),
    log_int: (n) => console.log(n),
  },
  js: {
    global: new WebAssembly.Global({ value: 'i32', mutable: true }, 0),
  },
};
```

### Memory — mémoire linéaire

```js
// Pages de 64KB chacune
const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

// Lecture / écriture
const view = new DataView(memory.buffer);
view.setUint32(0, 42, true);    // little-endian
view.getUint32(0, true);        // → 42

// Agrandir (+64KB par page)
memory.grow(1);

// Mémoire partagée (multi-threading)
const sharedMemory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true,
});
```

### Table — références de fonctions

```js
const { tbl } = instance.exports;
tbl.get(0)();        // appeler la fonction à l'index 0
tbl.set(0, newFn);   // remplacer
tbl.grow(10);        // agrandir
console.log(tbl.length);
```

### Global — variables partagées JS ↔ WASM

```js
const global = new WebAssembly.Global({ value: 'i32', mutable: true }, 0);

// Types supportés : i32, i64, f32, f64
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('global.wasm'),
  { js: { global } }
);

global.value = 42;              // modifier depuis JS
instance.exports.incGlobal();   // modifier depuis WASM
console.log(global.value);      // lire la valeur mise à jour
```

### Features avancées

| Feature | Description | Support |
|---|---|---|
| **SIMD** | Opérations vectorielles `v128` | Tous navigateurs modernes |
| **Threads + Atomics** | Multi-threading via `SharedArrayBuffer` | Chrome, Firefox, Safari |
| **GC** | Garbage Collection intégré | Chrome 119+, Firefox 120+ |
| **Exception Handling** | `try/catch` natif WASM | Chrome, Firefox |
| **Tail Calls** | Récursion sans stack overflow | Chrome 112+ |
| **Multi-memory** | Plusieurs espaces mémoire | Chrome 109+ |
| **Reference Types** | `externref`, `funcref` | Tous navigateurs modernes |
| **Component Model** | Composition inter-modules avec WIT | En cours de standardisation |

---

## 14. Erreurs courantes

### `Error: Dynamic WASM compilation is not available in Proxies`

**Cause** : `WebAssembly.compile(buffer)` ou `WebAssembly.instantiate(buffer)` dans le middleware.

```ts
// ❌ Interdit dans middleware
const buffer = await fetch('/my.wasm').then(r => r.arrayBuffer());
const module = await WebAssembly.compile(buffer);

// ✅ Correct
// @ts-ignore
import myWasm from './my.wasm?module';
const instance = await WebAssembly.instantiate(myWasm);
```

### `Module parse failed: magic header not detected`

**Cause** : Webpack sans `asyncWebAssembly: true`.

```ts
webpack(config) {
  config.experiments = { ...config.experiments, asyncWebAssembly: true };
  return config;
}
```

### `Error occurred prerendering page "/"`

**Cause** : Chemin `webassemblyModuleFilename` incorrect en mode standalone.

```ts
config.output.webassemblyModuleFilename =
  isServer && !dev
    ? '../static/wasm/[modulehash].wasm'
    : 'static/wasm/[modulehash].wasm';
```

### `Cannot find module '*.wasm'` (TypeScript)

**Fix** : Créer `src/wasm/my-module.wasm.d.ts` avec les exports, et `types/wasm.d.ts` pour les imports `?module`.

### `RuntimeError: memory access out of bounds`

**Cause** : Accès mémoire WASM hors des limites allouées.

```js
// Vérifier la taille avant accès
const memory = instance.exports.memory;
const view = new DataView(memory.buffer);
if (offset + 4 <= memory.buffer.byteLength) {
  view.getUint32(offset, true);
}
```

---

## 15. Checklist d'intégration

- [ ] Ajouter la section `webpack` dans `next.config.ts` (`asyncWebAssembly: true` + `webassemblyModuleFilename`)
- [ ] Créer le fichier `.wasm.d.ts` correspondant au module
- [ ] Ajouter `types/wasm.d.ts` pour les imports `?module` (Edge Runtime)
- [ ] Utiliser `loadWasm()` avec cache pour les Server Components
- [ ] Utiliser `?module` + promesse module-scoped pour l'Edge Runtime
- [ ] Ne jamais utiliser `WebAssembly.compile(buffer)` dans le middleware
- [ ] Optimiser les binaires avec `wasm-opt -O3` avant déploiement
- [ ] Vérifier que le build standalone place correctement les `.wasm` dans `static/wasm/`
- [ ] Tester avec `bun dev` (Turbopack) ET `bun run build` (Webpack)
- [ ] Pour Rust : utiliser `serde-wasm-bindgen` plutôt que JSON pour les échanges de données complexes
- [ ] Pour les gros modules : valider le binaire avec `wasm-tools validate foo.wasm`

---

*Sources : [`vercel/next.js@v16.1.1`](https://github.com/vercel/next.js/tree/v16.1.1/examples/with-webassembly) · [`swc-project/swc@v1.15.26`](https://github.com/swc-project/swc) · [MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) · [`webassembly/binaryen`](https://github.com/webassembly/binaryen) · [`drager/wasm-pack`](https://github.com/drager/wasm-pack) · [`serde-wasm-bindgen`](https://docs.rs/serde-wasm-bindgen) · [`bytecodealliance/wasm-tools`](https://github.com/bytecodealliance/wasm-tools)*
