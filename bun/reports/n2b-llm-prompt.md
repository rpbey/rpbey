# Node.js → Bun migration task

You are migrating a Node.js codebase to Bun. The static analyzer `node2bun` produced the findings below. For each finding:

1. If a `Suggested replacement` is provided and it's safe in context, apply it.
2. If the suggestion requires wider refactoring (e.g. making a function `async`), do the refactor consistently across the file.
3. If the finding has no replacement, add a short comment explaining the Bun-native alternative and leave the code otherwise untouched.
4. Do not rewrite unrelated code.

Use the `docs_url` to confirm API behavior before large changes.

**Root**: `/home/ubuntu/rpb-dashboard` · **Mode**: `Check` · **Tool**: node2bun 0.2.0

---

## `package.json`:1:1

- **rule**: `pkg/redundant-dep` (advisory)
- **severity**: `Warn`
- **message**: dépendance 'dotenv' redondante avec Bun (voir Bun.file / Bun.env / fetch global / bun:sqlite / bun test)
- **docs**: https://bun.sh/docs/install/package-json

**Before**:
```ts
{   // <-- finding
  "name": "rpb-dashboard",
  "version": "1.0.0",
  "description": "Dashboard officiel de la République Populaire du Beyblade",
```

---

## `package.json`:1:1

- **rule**: `pkg/redundant-dep` (advisory)
- **severity**: `Warn`
- **message**: dépendance 'tsx' redondante avec Bun (voir Bun.file / Bun.env / fetch global / bun:sqlite / bun test)
- **docs**: https://bun.sh/docs/install/package-json

**Before**:
```ts
{   // <-- finding
  "name": "rpb-dashboard",
  "version": "1.0.0",
  "description": "Dashboard officiel de la République Populaire du Beyblade",
```

---

## `prisma/create-admin.ts`:2:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts

import 'dotenv/config'   // <-- finding
import { prisma } from '../src/lib/prisma'

async function main() {
```

**Suggested replacement**:
```ts
<auto>
```

---

## `prisma/set-password.ts`:1:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import "dotenv/config";   // <-- finding

// Wait, Better Auth manages passwords. We need to update the account table.
// However, seeding password directly into Account table requires hashing.
```

**Suggested replacement**:
```ts
<auto>
```

---

## `prisma/seed-products.ts`:6:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
 * Data source: https://beyblade.takaratomy.co.jp/beyblade-x/lineup/
 */

import 'dotenv/config'   // <-- finding
import pg from 'pg'
import fs from 'fs'
import path from 'path'
```

**Suggested replacement**:
```ts
<auto>
```

---

## `prisma/seed-products.ts`:7:17

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
 */

import 'dotenv/config'
import pg from 'pg'   // <-- finding
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@/generated/prisma/client'
```

**Suggested replacement**:
```ts
Bun.sql
```

---

## `prisma/seed-products.ts`:8:17

- **rule**: `imports/node-prefix` (autofix)
- **severity**: `Warn`
- **message**: préfixer 'fs' avec 'node:' (recommandé)
- **docs**: https://bun.sh/docs/runtime/nodejs-apis

**Before**:
```ts

import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'   // <-- finding
import path from 'path'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
```

**Suggested replacement**:
```ts
node:fs
```

---

## `prisma/seed-products.ts`:9:19

- **rule**: `imports/node-prefix` (autofix)
- **severity**: `Warn`
- **message**: préfixer 'path' avec 'node:' (recommandé)
- **docs**: https://bun.sh/docs/runtime/nodejs-apis

**Before**:
```ts
import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'   // <-- finding
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

```

**Suggested replacement**:
```ts
node:path
```

---

## `prisma/seed-products.ts`:31:29

- **rule**: `api/fs-readFileSync` (autofix)
- **severity**: `Warn`
- **message**: remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text()
- **docs**: https://bun.sh/docs/api/file-io

**Before**:
```ts
let hasbroData: { ttId: string, hasbroId: string, hasbroName: string }[] = [];

if (fs.existsSync(hasbroDataPath)) {
    hasbroData = JSON.parse(fs.readFileSync(hasbroDataPath, 'utf-8'));   // <-- finding
}

const hasbroMap = new Map(hasbroData.map(h => [h.ttId, h]));
```

**Suggested replacement**:
```ts
await Bun.file(hasbroDataPath).text()
```

---

## `prisma/seed-products.ts`:31:18

- **rule**: `api/json-parse-readFileSync` (autofix)
- **severity**: `Warn`
- **message**: remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json()
- **docs**: https://bun.sh/docs/api/file-io

**Before**:
```ts
let hasbroData: { ttId: string, hasbroId: string, hasbroName: string }[] = [];

if (fs.existsSync(hasbroDataPath)) {
    hasbroData = JSON.parse(fs.readFileSync(hasbroDataPath, 'utf-8'));   // <-- finding
}

const hasbroMap = new Map(hasbroData.map(h => [h.ttId, h]));
```

**Suggested replacement**:
```ts
await Bun.file(hasbroDataPath).json()
```

---

## `prisma/seed-products.ts`:30:5

- **rule**: `api/fs-existsSync` (autofix)
- **severity**: `Warn`
- **message**: remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false)
- **docs**: https://bun.sh/docs/api/file-io

**Before**:
```ts
const hasbroDataPath = path.resolve(process.cwd(), 'data/cleaned/hasbro.json');
let hasbroData: { ttId: string, hasbroId: string, hasbroName: string }[] = [];

if (fs.existsSync(hasbroDataPath)) {   // <-- finding
    hasbroData = JSON.parse(fs.readFileSync(hasbroDataPath, 'utf-8'));
}

```

**Suggested replacement**:
```ts
await Bun.file(hasbroDataPath).exists()
```

---

## `prisma/seed-parts.ts`:6:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
 * Imports cleaned Beyblade X parts from local JSON files (derived from new HTML extraction)
 */

import 'dotenv/config';   // <-- finding
import fs from 'fs';
import path from 'path';
import { PrismaClient, PartType, type BeyType } from '@/generated/prisma/client';
```

**Suggested replacement**:
```ts
<auto>
```

---

## `prisma/seed-parts.ts`:7:17

- **rule**: `imports/node-prefix` (autofix)
- **severity**: `Warn`
- **message**: préfixer 'fs' avec 'node:' (recommandé)
- **docs**: https://bun.sh/docs/runtime/nodejs-apis

**Before**:
```ts
 */

import 'dotenv/config';
import fs from 'fs';   // <-- finding
import path from 'path';
import { PrismaClient, PartType, type BeyType } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
```

**Suggested replacement**:
```ts
node:fs
```

---

## `prisma/seed-parts.ts`:8:19

- **rule**: `imports/node-prefix` (autofix)
- **severity**: `Warn`
- **message**: préfixer 'path' avec 'node:' (recommandé)
- **docs**: https://bun.sh/docs/runtime/nodejs-apis

**Before**:
```ts

import 'dotenv/config';
import fs from 'fs';
import path from 'path';   // <-- finding
import { PrismaClient, PartType, type BeyType } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
```

**Suggested replacement**:
```ts
node:path
```

---

## `prisma/seed-parts.ts`:11:23

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import path from 'path';
import { PrismaClient, PartType, type BeyType } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';   // <-- finding

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
```

**Suggested replacement**:
```ts
Bun.sql
```

---

## `prisma/seed-parts.ts`:90:21

- **rule**: `api/fs-readFileSync` (autofix)
- **severity**: `Warn`
- **message**: remplacer fs.readFileSync(path, 'utf8') par await Bun.file(path).text()
- **docs**: https://bun.sh/docs/api/file-io

**Before**:
```ts
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));   // <-- finding
}

function normalizeName(name: string): string {
```

**Suggested replacement**:
```ts
await Bun.file(filePath).text()
```

---

## `prisma/seed-parts.ts`:90:10

- **rule**: `api/json-parse-readFileSync` (autofix)
- **severity**: `Warn`
- **message**: remplacer JSON.parse(fs.readFileSync(path,'utf8')) par await Bun.file(path).json()
- **docs**: https://bun.sh/docs/api/file-io

**Before**:
```ts
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));   // <-- finding
}

function normalizeName(name: string): string {
```

**Suggested replacement**:
```ts
await Bun.file(filePath).json()
```

---

## `prisma/seed-parts.ts`:87:8

- **rule**: `api/fs-existsSync` (autofix)
- **severity**: `Warn`
- **message**: remplacer fs.existsSync(path) par await Bun.file(path).exists() (uniquement pour un fichier — pour un dossier, Bun.file().exists() retourne toujours false)
- **docs**: https://bun.sh/docs/api/file-io

**Before**:
```ts

function readJson<T>(filename: string): T {
  const filePath = path.join(CLEANED_DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {   // <-- finding
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
```

**Suggested replacement**:
```ts
await Bun.file(filePath).exists()
```

---

## `prisma/seed-anime.ts`:3:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';   // <-- finding
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
```

**Suggested replacement**:
```ts
<auto>
```

---

## `prisma/seed-anime.ts`:4:17

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';   // <-- finding

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
```

**Suggested replacement**:
```ts
Bun.sql
```

---

## `prisma/create-dev-admin.ts`:1:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import "dotenv/config";   // <-- finding
import { prisma } from "../src/lib/prisma";

async function main() {
```

**Suggested replacement**:
```ts
<auto>
```

---

## `prisma/seed-beyblades.ts`:6:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
 * Links official products to their component parts
 */

import 'dotenv/config'   // <-- finding
import pg from 'pg'
import { PrismaClient, type BeyType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
```

**Suggested replacement**:
```ts
<auto>
```

---

## `prisma/seed-beyblades.ts`:7:17

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
 */

import 'dotenv/config'
import pg from 'pg'   // <-- finding
import { PrismaClient, type BeyType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

```

**Suggested replacement**:
```ts
Bun.sql
```

---

## `prisma/seed.ts`:2:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import type { TournamentStatus } from "@/generated/prisma/client";
import "dotenv/config";   // <-- finding
import { prisma } from "../src/lib/prisma";

async function main() {
```

**Suggested replacement**:
```ts
<auto>
```

---

## `prisma/seed.ts`:121:27

- **rule**: `imports/node-prefix` (autofix)
- **severity**: `Warn`
- **message**: préfixer 'child_process' avec 'node:' (recommandé)
- **docs**: https://bun.sh/docs/runtime/nodejs-apis

**Before**:
```ts
}

// Helper to run other seed scripts
import { execSync } from "child_process";   // <-- finding

function runSeed(script: string) {
  console.log(`\n▶ Running ${script}...`);
```

**Suggested replacement**:
```ts
node:child_process
```

---

## `prisma/seed.ts`:126:5

- **rule**: `api/execSync` (advisory)
- **severity**: `Warn`
- **message**: utiliser le shell Bun ($`cmd`) ou Bun.spawnSync() à la place de execSync
- **docs**: https://bun.sh/docs/api/spawn

**Before**:
```ts
function runSeed(script: string) {
  console.log(`\n▶ Running ${script}...`);
  try {
    execSync(`bunx tsx prisma/${script}`, { stdio: "inherit" });   // <-- finding
  } catch (error) {
    console.error(`❌ Failed to run ${script}`);
    throw error;
```

---

## `bot/src/generated/prisma/client.ts`:16:40

- **rule**: `api/fileURLToPath` (advisory)
- **severity**: `Warn`
- **message**: Bun.fileURLToPath() est équivalent (ou utiliser import.meta.dir/path)
- **docs**: https://bun.sh/docs/api/import-meta

**Before**:
```ts
import * as process from 'node:process'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url))   // <-- finding

import * as runtime from "@prisma/client/runtime/client"
import * as $Enums from "./enums"
```

---

## `bot/src/generated/prisma/internal/class.ts`:43:21

- **rule**: `api/buffer-from-base64` (advisory)
- **severity**: `Warn`
- **message**: utiliser atob() / btoa() ou Uint8Array pour du Web-standard
- **docs**: https://bun.sh/docs/api/binary-data

**Before**:
```ts

async function decodeBase64AsWasm(wasmBase64: string): Promise<WebAssembly.Module> {
  const { Buffer } = await import('node:buffer')
  const wasmArray = Buffer.from(wasmBase64, 'base64')   // <-- finding
  return new WebAssembly.Module(wasmArray)
}

```

---

## `bot/src/tests/setup.ts`:2:21

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'vitest' par bun:test — bun:test offre les mêmes fonctionnalités que vitest
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import 'reflect-metadata';
import { vi } from 'vitest';   // <-- finding

// Mock simple components if needed
vi.mock('discord.js', async (importOriginal) => {
```

**Suggested replacement**:
```ts
bun:test
```

---

## `bot/src/tests/mocks.ts`:6:21

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'vitest' par bun:test — bun:test offre les mêmes fonctionnalités que vitest
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
  type Guild,
  type TextChannel,
} from 'discord.js';
import { vi } from 'vitest';   // <-- finding

export function createMockInteraction(options: {
  commandName: string;
```

**Suggested replacement**:
```ts
bun:test
```

---

## `bot/src/tests/RankingGroup.test.ts`:1:55

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'vitest' par bun:test — bun:test offre les mêmes fonctionnalités que vitest
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';   // <-- finding
import { RankingGroup } from '../commands/Beyblade/RankingGroup.js';
import { createMockInteraction, mockPrisma } from './mocks.js';

```

**Suggested replacement**:
```ts
bun:test
```

---

## `bot/src/lib/api-server.ts`:111:23

- **rule**: `api/buffer-from-string` (autofix)
- **severity**: `Warn`
- **message**: remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str)
- **docs**: https://bun.sh/docs/api/binary-data

**Before**:
```ts
  }

  const apiKey = req.headers.get('x-api-key') ?? '';
  const providedBuf = Buffer.from(apiKey, 'utf8');   // <-- finding
  const expectedBuf = Buffer.from(expectedKey, 'utf8');

  if (
```

**Suggested replacement**:
```ts
new TextEncoder().encode(apiKey)
```

---

## `bot/src/lib/api-server.ts`:112:23

- **rule**: `api/buffer-from-string` (autofix)
- **severity**: `Warn`
- **message**: remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str)
- **docs**: https://bun.sh/docs/api/binary-data

**Before**:
```ts

  const apiKey = req.headers.get('x-api-key') ?? '';
  const providedBuf = Buffer.from(apiKey, 'utf8');
  const expectedBuf = Buffer.from(expectedKey, 'utf8');   // <-- finding

  if (
    providedBuf.length !== expectedBuf.length ||
```

**Suggested replacement**:
```ts
new TextEncoder().encode(expectedKey)
```

---

## `bot/src/lib/api-server.ts`:161:19

- **rule**: `api/buffer-from-string` (autofix)
- **severity**: `Warn`
- **message**: remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str)
- **docs**: https://bun.sh/docs/api/binary-data

**Before**:
```ts
        if (!expectedKey) {
          return new Response('BOT_API_KEY not configured', { status: 500 });
        }
        const a = Buffer.from(providedKey, 'utf8');   // <-- finding
        const b = Buffer.from(expectedKey, 'utf8');
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response('Unauthorized', { status: 401 });
```

**Suggested replacement**:
```ts
new TextEncoder().encode(providedKey)
```

---

## `bot/src/lib/api-server.ts`:162:19

- **rule**: `api/buffer-from-string` (autofix)
- **severity**: `Warn`
- **message**: remplacer Buffer.from(str, 'utf8') par new TextEncoder().encode(str)
- **docs**: https://bun.sh/docs/api/binary-data

**Before**:
```ts
          return new Response('BOT_API_KEY not configured', { status: 500 });
        }
        const a = Buffer.from(providedKey, 'utf8');
        const b = Buffer.from(expectedKey, 'utf8');   // <-- finding
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response('Unauthorized', { status: 401 });
        }
```

**Suggested replacement**:
```ts
new TextEncoder().encode(expectedKey)
```

---

## `bot/src/lib/prisma.ts`:2:17

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'pg' par Bun.sql — Bun.sql est un client PostgreSQL natif
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';   // <-- finding
import { singleton } from 'tsyringe';
import { PrismaClient } from '../generated/prisma/client.js';

```

**Suggested replacement**:
```ts
Bun.sql
```

---

## `bot/src/lib/challonge.ts`:1:24

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'undici' par <global fetch> — fetch/WebSocket sont natifs dans Bun — undici inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { fetch } from 'undici';   // <-- finding

/**
 * Challonge API v2.1 Client
```

**Suggested replacement**:
```ts
<global fetch>
```

---

## `bot/scripts/send-social-announcement.ts`:2:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import 'dotenv/config';   // <-- finding

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
```

**Suggested replacement**:
```ts
<auto>
```

---

## `bot/scripts/test-bin.ts`:23:18

- **rule**: `api/child-process-spawn` (advisory)
- **severity**: `Warn`
- **message**: Bun.spawn offre une API plus ergonomique (streams Web, ipc, preload)
- **docs**: https://bun.sh/docs/api/spawn

**Before**:
```ts

console.log(`[test-bin] Spawning ${BIN} …`);

const proc = Bun.spawn([BIN], {   // <-- finding
  env: {
    ...process.env,
    // Dummy but well-formed values — enough for importx to run the decorator
```

---

## `bot/scripts/exchange-manual.js`:2:33

- **rule**: `imports/node-prefix` (autofix)
- **severity**: `Warn`
- **message**: préfixer 'fs' avec 'node:' (recommandé)
- **docs**: https://bun.sh/docs/runtime/nodejs-apis

**Before**:
```ts
import { exchangeCode } from '@twurple/auth';
import { promises as fs } from 'fs';   // <-- finding
import path from 'path';
import 'dotenv/config';

```

**Suggested replacement**:
```ts
node:fs
```

---

## `bot/scripts/exchange-manual.js`:3:19

- **rule**: `imports/node-prefix` (autofix)
- **severity**: `Warn`
- **message**: préfixer 'path' avec 'node:' (recommandé)
- **docs**: https://bun.sh/docs/runtime/nodejs-apis

**Before**:
```ts
import { exchangeCode } from '@twurple/auth';
import { promises as fs } from 'fs';
import path from 'path';   // <-- finding
import 'dotenv/config';

const clientId = process.env.TWITCH_CLIENT_ID;
```

**Suggested replacement**:
```ts
node:path
```

---

## `bot/scripts/exchange-manual.js`:4:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { exchangeCode } from '@twurple/auth';
import { promises as fs } from 'fs';
import path from 'path';
import 'dotenv/config';   // <-- finding

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
```

**Suggested replacement**:
```ts
<auto>
```

---

## `bot/scripts/create-missing-roles.ts`:2:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';   // <-- finding

const ROLES_TO_CREATE = ['Participant', 'Spectateur'];
const ROLES_TO_FIND = ['Reseaux', 'Events', 'Leaks-beyblade'];
```

**Suggested replacement**:
```ts
<auto>
```

---

## `bot/scripts/test-token.js`:3:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import 'dotenv/config';   // <-- finding

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
```

**Suggested replacement**:
```ts
<auto>
```

---

## `bot/scripts/fetch-message.ts`:3:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts

import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';   // <-- finding

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
```

**Suggested replacement**:
```ts
<auto>
```

---

## `bot/scripts/inspect-probot.ts`:1:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import 'dotenv/config';   // <-- finding
import { Client, GatewayIntentBits } from 'discord.js';

async function main() {
```

**Suggested replacement**:
```ts
<auto>
```

---

## `bot/scripts/get-twitch-token.js`:2:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import { exchangeCode } from '@twurple/auth';
import 'dotenv/config';   // <-- finding
import readline from 'readline';

const clientId = process.env.TWITCH_CLIENT_ID;
```

**Suggested replacement**:
```ts
<auto>
```

---

## `bot/scripts/get-twitch-token.js`:3:23

- **rule**: `imports/node-prefix` (autofix)
- **severity**: `Warn`
- **message**: préfixer 'readline' avec 'node:' (recommandé)
- **docs**: https://bun.sh/docs/runtime/nodejs-apis

**Before**:
```ts
import { exchangeCode } from '@twurple/auth';
import 'dotenv/config';
import readline from 'readline';   // <-- finding

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
```

**Suggested replacement**:
```ts
node:readline
```

---

## `bot/prisma.config.ts`:1:9

- **rule**: `imports/bun-native` (advisory)
- **severity**: `Warn`
- **message**: remplacer 'dotenv/config' par <auto> — Bun charge .env automatiquement, dotenv inutile
- **docs**: https://bun.sh/docs/runtime/modules

**Before**:
```ts
import 'dotenv/config';   // <-- finding
import { defineConfig } from 'prisma/config';

export default defineConfig({
```

**Suggested replacement**:
```ts
<auto>
```

---

## `src/app/api/auth/callback/challonge/route.ts`:21:30

- **rule**: `api/buffer-from-base64` (advisory)
- **severity**: `Warn`
- **message**: utiliser atob() / btoa() ou Uint8Array pour du Web-standard
- **docs**: https://bun.sh/docs/api/binary-data

**Before**:
```ts
  let returnTo: string;

  try {
    const state = JSON.parse(Buffer.from(stateBase64, 'base64').toString());   // <-- finding
    userId = state.userId;
    returnTo = state.returnTo || '/admin/settings';
  } catch (err) {
```

---


_... truncated, 259 findings remaining._
