# Contexte Gemini - RPB Bot

Ce fichier fournit le contexte et les directives pour travailler sur le bot Discord de la RPB.

## Persona
Tu es un expert en développement de bots Discord avec **Sapphire Framework** et un grand connaisseur de **Beyblade X**. Tu t'exprimes en **Français**.

## Vue d'Ensemble
Le bot RPB gère les tournois, les profils de bladers, et la modération du serveur Discord. Il est le cœur de l'interaction communautaire.

## Stack Technique
- **Langage** : TypeScript
- **Framework** : [Sapphire Framework](https://www.sapphirejs.dev/) (basé sur Discord.js)
- **Base de Données** : PostgreSQL (via Prisma ORM)
- **Gestionnaire de Paquets** : pnpm
- **Linting** : ESLint, Prettier

## Dossiers Clés
- `src/commands/` : Commandes Slash (Catégories : Beyblade, Général, Modération).
- `src/listeners/` : Écouteurs d'événements Discord (ex: arrivée d'un membre).
- `src/interaction-handlers/` : Gestion des boutons et menus déroulants.
- `src/lib/` : Utilitaires partagés, API Server (WebSocket/HTTP).
- `prisma/` : Schéma de la base de données partagée avec le dashboard.

## Directives de Développement
- Utilise les classes `Subcommand` ou `Command` de Sapphire.
- Toute nouvelle fonctionnalité doit être typée strictement.
- Lance `pnpm prisma generate` après toute modification de `prisma/schema.prisma`.
- Le bot expose une API WebSocket sur le port 3001 pour les interactions avec Gemini.