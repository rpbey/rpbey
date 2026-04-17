# Migration RPB → Bun-native

Dossier de travail pour la migration progressive vers les APIs Bun-native.

## Contenu

| Fichier | Description |
|---|---|
| [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) | Plan en 9 phases avec check-lists |
| [`docs/cron.md`](./docs/cron.md) | Référence Bun.cron (extrait doc officielle) |
| [`docs/web-apis.md`](./docs/web-apis.md) | Web APIs globales disponibles dans Bun |
| [`docs/nodejs-compat.md`](./docs/nodejs-compat.md) | Statut Bun ↔ Node.js par module (utilisés dans RPB) |
| [`docs/fetch.md`](./docs/fetch.md) | `fetch` Bun — extensions proxy, preconnect, Unix socket |
| [`reports/n2b-baseline.txt`](./reports/n2b-baseline.txt) | Audit texte complet (CLI output) |
| [`reports/n2b-baseline.md`](./reports/n2b-baseline.md) | Audit markdown |
| [`reports/n2b-baseline.json`](./reports/n2b-baseline.json) | Audit JSON (schéma v2) |
| [`reports/n2b-baseline.jsonl`](./reports/n2b-baseline.jsonl) | Audit JSON-lines (un finding par ligne) |
| [`reports/n2b-baseline.sarif`](./reports/n2b-baseline.sarif) | Audit SARIF (intégration IDE / GitHub Code Scanning) |
| [`reports/n2b-summary.md`](./reports/n2b-summary.md) | Statistiques agrégées (severity × règle × fichier) |
| [`reports/n2b-rules.txt`](./reports/n2b-rules.txt) | Liste des 93 règles connues par n2b |
| [`reports/n2b-llm-prompt.md`](./reports/n2b-llm-prompt.md) | Prompt LLM prêt à coller |

## Reproduire les rapports

```bash
# Baseline
n2b . --report text > bun/reports/n2b-baseline.txt
n2b . --report md   > bun/reports/n2b-baseline.md
n2b . --report json > bun/reports/n2b-baseline.json
n2b . --report jsonl > bun/reports/n2b-baseline.jsonl
n2b . --report sarif > bun/reports/n2b-baseline.sarif

# Règles + prompt
n2b rules          > bun/reports/n2b-rules.txt
n2b prompt .       > bun/reports/n2b-llm-prompt.md

# Après migration (une fois la PR mergée)
n2b . --report md  > bun/reports/n2b-after.md
```

## Stats baseline (à date)

- **Fichiers scannés** : 156
- **Findings totaux** : 489
- **Severity** : 180 info / 309 warn / 0 error
- **Top règles** :
  - `api/process-env` (173) — info/cosmétique
  - `imports/bun-native` (121) — dotenv/pg
  - `imports/node-prefix` (70) — préfixe `node:`
  - `api/fs-*` (50) — fs sync → Bun.file
  - `api/execSync` + `api/exec` (19) — shell → Bun.$

## Règles appliquées / non-appliquées

Voir la matrice dans `MIGRATION_PLAN.md` section « Matrice migrer vs garder ».
