# @rpbey/api

Le SDK officiel pour interagir avec l'écosystème de la **République Populaire du Beyblade (RPB)**. Ce package fournit un client TypeScript robuste et typé pour le Dashboard et le Bot.

## 🚀 Installation

```bash
pnpm add @rpbey/api
```

## 🛠️ Utilisation Rapide

```typescript
import { RPBClient } from '@rpbey/api';

const api = new RPBClient('https://rpbey.fr', 'votre_cle_api');

// Récupérer le classement
const leaderboard = await api.external.getLeaderboard();
console.log(leaderboard.leaderboard[0].bladerName);
```

## 📖 API Reference

### Tournois (`api.tournaments`)
- `getAll(params?)`: Liste tous les tournois.
- `getById(id)`: Détails d'un tournoi.
- `getMatches(id)`: Liste des matchs d'un tournoi.
- `getParticipants(id)`: Liste des bladers inscrits.
- `register(id, deckId)`: Inscrire l'utilisateur actuel à un tournoi.

### Pièces & Beys (`api.parts`)
- `getAll(params?)`: Liste des pièces (Blades, Ratchets, Bits).
- `getById(id)`: Détails techniques d'une pièce.
- `getRandom()`: Récupère une pièce aléatoire (utile pour les jeux/bots).

### Bot Discord (`api.bot`)
- `getStatus()`: État interne du bot.
- `getConfig()`: Configuration (canaux, rôles).
- `sendMessage(channelId, content)`: Envoyer un message via le bot (Admin uniquement).

### Utilisateurs (`api.users`)
- `getById(id)`: Profil public d'un utilisateur.
- `getCard(id)`: Génère l'URL de la carte de blader.
- `getMatches(id)`: Historique des matchs d'un joueur.

## ⚙️ Configuration Avancée

### Intercepteurs
Vous pouvez intercepter les requêtes avant l'envoi :

```typescript
const api = new RPBClient('...', '...');
api.addInterceptor({
  onRequest: (url, options) => {
    console.log(`🚀 Requesting ${url}`);
    return options;
  }
});
```

### Gestion des Erreurs
Le client lève une `APIError` pour les réponses non-2xx.

```typescript
try {
  await api.tournaments.getById('invalid-id');
} catch (error) {
  if (error instanceof APIError) {
    console.error(`Erreur ${error.status}: ${error.statusText}`);
  }
}
```

---
Développé avec ❤️ par l'équipe RPB.
