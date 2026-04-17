# Sécurisation des fichiers `.env` — référence Bun

## Checklist

- [x] **`chmod 600`** sur tous les `.env` (fait sur ce VPS 2026-04-17)
- [x] `.env*` dans `.gitignore` (déjà présent)
- [x] **`autoloadDotenv: false`** dans `bun build --compile` — pas de secret embarqué dans le binaire
- [x] **systemd `EnvironmentFile=`** + hardening (`NoNewPrivileges`, `ProtectHome=read-only`, `PrivateTmp=true`) — déjà en place
- [ ] **`Bun.secrets`** pour le dev local (facultatif, évite le `.env` sur la machine du dev)

## Ordre de chargement Bun (`.env.*`)

```
.env                      # commit, valeurs publiques
.env.production | .development | .test
.env.local                # JAMAIS commit, secrets dev
.env.production.local     # JAMAIS commit, prod spécifique
```

Les derniers écrasent les premiers. En prod, on n'utilise **aucun fichier `.env`** et on passe tout via `EnvironmentFile=` (systemd) ou variables d'env du container.

## Désactiver l'autoload

### CLI ponctuel

```bash
bun run --no-env-file src/index.ts
```

### Global projet (`bunfig.toml`)

```toml
env = false
```

### Binaire compilé

```ts
await Bun.build({
  entrypoints: ['./src/index.ts'],
  compile: {
    autoloadDotenv: false,
    autoloadBunfig: false,
    outfile: './dist-bin/rpb-bot',
  },
});
```

→ Déjà appliqué dans `scripts/build-bin.ts`.

## Bun.secrets (keychain OS)

### Stocker un secret (une fois)

```bash
bun -e "await Bun.secrets.set({ service: 'rpb-bot', name: 'DISCORD_TOKEN', value: 'MTI...' })"
```

Stockage :

- Linux : libsecret / gnome-keyring (Secret Service API)
- macOS : Keychain
- Windows : Credential Manager

### Lire côté code

Utiliser `src/lib/secrets.ts` — priorité `process.env` puis keychain :

```ts
import { readSecret } from './lib/secrets.js';
const token = await readSecret('DISCORD_TOKEN');
```

### Supprimer

```bash
bun -e "await Bun.secrets.delete({ service: 'rpb-bot', name: 'DISCORD_TOKEN' })"
```

### Limites

- **Pas pour la prod** : headless, pas de libsecret → `Bun.secrets.get` throw. Utiliser `EnvironmentFile=` en prod, `Bun.secrets` **uniquement en dev**.
- **Pas multi-machine** : le keychain est local, non partagé.

## Systemd hardening (référence)

`/etc/systemd/system/rpb-bot.service` contient déjà :

```ini
[Service]
EnvironmentFile=/home/ubuntu/rpb-dashboard/.env   # mode 0600
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true
ReadWritePaths=/home/ubuntu/rpb-dashboard/.bun-cache /home/ubuntu/rpb-dashboard/bot/data
```

Options supplémentaires à considérer :

- `LoadCredential=token:/run/secrets/discord_token` — lecture via systemd credentials, pas d'env var
- `SystemCallFilter=@system-service` — réduit la surface syscall
- `CapabilityBoundingSet=` — aucune capa
- `DynamicUser=true` — user éphémère (incompatible avec `User=ubuntu`)

## Audit rapide

```bash
# Trouver tous les .env avec perms trop larges
fd -H -t f '^\.env(\.[^.]+)?$' /home/ubuntu -x stat -c '%a %n' {} | rg -v '^6'

# Vérifier que les secrets ne sont pas dans le binaire compilé
strings dist-bin/rpb-bot | rg -i 'discord|api_key|password' | head
```
