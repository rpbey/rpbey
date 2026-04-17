# Bun Cron (référence locale)

> Source : https://bun.com/docs/api/cron

## Résumé

Bun fournit `Bun.cron` en trois formes :
- `Bun.cron.parse(expr, relativeDate?)` → `Date | null` (parse + next fire)
- `Bun.cron(schedule, handler)` → `CronJob` (in-process, UTC)
- `Bun.cron(path, schedule, title)` → `Promise<void>` (OS-level : crontab / launchd / Task Scheduler)

## Expression

Format standard 5 champs : `minute hour day-of-month month day-of-week`
Caractères : `*` `,` `-` `/`
Noms : `JAN-DEC`, `SUN-SAT`, `0`/`7` = dimanche
Nicknames : `@yearly`, `@monthly`, `@weekly`, `@daily`/`@midnight`, `@hourly`

## In-process : `Bun.cron(schedule, handler)`

```ts
const job = Bun.cron("*/5 * * * *", async () => {
  await syncToDatabase();
});
```

Points clés :
- **UTC** systématique (pas de DST)
- **No-overlap** : prochain fire calculé APRÈS settle de la Promise retournée.
  → Les handlers DOIVENT retourner la Promise : `() => task()` pas `() => { task(); }`.
- **Erreurs** : `uncaughtException` (sync) / `unhandledRejection` (async).
  Sans listener → exit code 1. Avec listener → job continue.
- **`CronJob` handle** : `stop()`, `ref()`, `unref()`, `Disposable` (`using`).
- **`bun --hot`** : stoppe + re-registre au save (pas de fuite).

## OS-level : `Bun.cron(path, schedule, title)`

```ts
await Bun.cron("./worker.ts", "30 2 * * MON", "weekly-report");
```

- Survit aux redémarrages (crontab / launchd / Task Scheduler)
- Le script cible DOIT `export default { scheduled(controller: Bun.CronController) {...} }`
- Utilise la **timezone système** (≠ in-process) → `TZ=UTC` pour aligner
- Windows : limite de 48 triggers par tâche (certaines expressions échouent)

## `Bun.cron.remove(title)`

Désenregistre un job OS-level par son title. No-op si inexistant.

## Usage RPB

Le bot Discord (`bot/src/cron/index.ts`) utilise exclusivement la forme **in-process** — bon choix pour un daemon systemd qui partage le client Discord + prisma.

**Points à corriger** :
1. Handlers doivent `return task()` pour garantir no-overlap.
2. Ajouter `process.on('unhandledRejection', logger.error)` dans `bot/src/index.ts`.
