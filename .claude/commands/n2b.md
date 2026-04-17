---
description: Run n2b audit and execute the Node.js → Bun-native migration plan phase-by-phase.
argument-hint: "[audit|phase N|diff|github|analyze|prompt|rules|fix|migrate] — ex: /n2b audit, /n2b 2, /n2b fix scripts/"
---

Drive the RPB Node.js → Bun-native migration via `n2b` (node2bun CLI). Follow `bun/MIGRATION_PLAN.md` and respect the "migrer vs garder" matrix.

## n2b CLI cheatsheet

```bash
# Scan modes (code analysis)
n2b .                                        # text output, default
n2b . --report md                            # markdown (for reports/)
n2b . --report json                          # structured
n2b . --report sarif                         # IDE / GitHub Code Scanning
n2b . --report jsonl                         # one finding per line
n2b . --quiet                                # suppress summary
n2b . --ignore 'src/generated/**' --ignore 'bot/src/generated/**'
n2b . --agent                                # structured stdout for LLM parsing

# Autofix modes (mutating)
n2b <path> --fix                             # safe rewrites only
n2b <path> --fix --aggressive                # include risky rewrites
n2b <path> --migrate                         # --fix --aggressive + bun install, remove pnpm-lock.yaml, migrate workspaces, add @types/bun

# Subcommands
n2b rules                                    # list all known rules
n2b rules --report md                        # formatted rules list
n2b prompt . --max-findings 50               # generate LLM prompt (warn findings)
n2b prompt . --include-info                  # also include info findings
n2b audit .                                  # GitHub issues/PRs mentioning bun/node
n2b audit . --state open --limit 30 --term bun --term node
n2b analyze .                                # scan + audit + ML crosslink (embeddings)
n2b analyze . --top-k 3 --threshold 0.35 --apply fix
```

## Modes exposés par la commande

### `audit` (default when no arg)
1. `n2b . --report text --ignore 'src/generated/**' --ignore 'bot/src/generated/**'`
2. Résume par règle et top fichiers
3. Diff vs `bun/reports/n2b-baseline.md`
4. Recommande la prochaine phase de `bun/MIGRATION_PLAN.md`

### `<N>` (phase number 1–10)
1. Read the target phase in `bun/MIGRATION_PLAN.md`
2. Delegate to the `n2b` agent (via Agent tool) with the phase number
3. Agent scopes files, applies rewrites (preferably via `n2b <scope> --fix --rule <rule-id>` when safe, otherwise manual Edit), runs validations, commits with the conventional message from the plan
4. After commit : `n2b . --report md > bun/reports/n2b-after-phase-<N>.md` and report the delta by rule

### `diff`
1. `n2b . --report md > /tmp/n2b-current.md`
2. `delta bun/reports/n2b-baseline.md /tmp/n2b-current.md`
3. Breakdown : rules fully resolved vs remaining, count delta per rule

### `fix <path>` (manual scoped autofix)
1. `n2b <path> --fix` (safe rewrites only — not `--aggressive` by default)
2. `bun run build && bun bot:build && bun run lint`
3. If green, let the user decide to commit (do NOT auto-commit — this bypasses the phased plan)

### `migrate` (full auto — use with extreme caution)
1. Warn : this runs `--fix --aggressive` + side-effects (bun install, lockfile cleanup, workspace migration)
2. Require explicit user confirmation before running
3. Target : only when all phases of the plan are already done and a final pass is wanted
4. Never run on a dirty tree

### `github`
1. `n2b audit . --state all --limit 30 --report md`
2. Report GitHub issues/PRs mentioning bun/node for this repo (useful before planning)

### `analyze`
1. `n2b analyze . --report md --ignore 'src/generated/**'`
2. Crosslinks n2b findings with GitHub issues via embeddings (ML)
3. Surface les findings "connus" de la communauté (discord.js, discordx, nextjs détectés)

### `prompt`
1. `n2b prompt . --max-findings 50 > /tmp/n2b-prompt.md`
2. Affiche le chemin ; utilisable pour un LLM externe si besoin

### `rules`
1. `n2b rules --report md`
2. Affiche les 68 règles connues, groupées par catégorie

## Hard rules (never break)

- **Matrice "garder"** : pas de rewrites sur `src/generated/**`, `bot/src/generated/**`, `prisma/schema.prisma`, `pg`/`@prisma/adapter-pg`, `reflect-metadata` du bot, `--bun` sur Next build.
- **Phase 6 skip** : `api/process-env` (173 info) ignoré — portabilité Node.
- **Bot = SWC** : pas de `Bun.$` ni de rewrites TS-direct dans `bot/src/**` (hors scripts maison).
- **1 phase = 1 commit** avec le message conventional du plan.
- **Gate** avant commit : `bun install --frozen-lockfile && bun db:generate && bun run build && bun bot:build && bun run lint` doit passer.
- **Autofix** : préférer `n2b <scope> --fix` (safe) à `--aggressive` ; ne **jamais** utiliser `--migrate` sauf demande explicite.
- Mode autonome (cf. `CLAUDE.md`) — pas de confirmation, auto-fix, auto-format, auto-commit par phase validée.
