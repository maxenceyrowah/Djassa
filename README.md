# DJASSA · Marketplace & gestion de stock (Abidjan)

Marketplace grand public et back-office de gestion de stock multi-vendeurs, en **FCFA**, sur 4 hubs :
Dépôt Central Treichville, Point Relais Cocody, Dépôt Yopougon, Hub Express Plateau.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests unitaires (node:test + tsx)
npm run lint     # vérification TypeScript
npm run build
```

Optionnel : `GEMINI_API_KEY` dans `.env.local` pour l'agent IA (sinon moteur local déterministe).

## Espaces et rôles

| Rôle | Accès | Ce qu'il peut faire |
|---|---|---|
| Visiteur | Marketplace | Parcourir, rechercher, voir les boutiques, remplir un panier |
| Client | Marketplace + « Mon compte » | Tout ce que fait un visiteur, plus **commander** (compte obligatoire) et suivre ses commandes |
| Vendeur | Back-office limité à sa boutique | Ses produits, stock, ventes, caisse, agent IA sur son catalogue |
| Admin | Back-office complet | Tout, plus créer / valider / suspendre des vendeurs |

Les boutons de gestion (ajout de produit, ajustement de stock, vente comptoir, création de vendeur…)
n'existent que dans le back-office, visible uniquement après connexion vendeur ou admin.

### Comptes de démonstration

| Rôle | Identifiant | Secret |
|---|---|---|
| Admin | `admin@djassa.ci` | `djassa2026` |
| Vendeur (Tech Ivoire Store) | `07 48 12 90 33` | code `482913` |
| Vendeur (GameZone Yop) | `05 64 77 21 09` | code `715302` |
| Client | `07 48 92 11 02` | `akwaba2026` |

Les formulaires de connexion proposent un bouton « Remplir » avec ces identifiants.

## Parcours principaux

- **Achat** : panier → « Se connecter pour commander » → connexion ou création de compte → panier rouvert et pré-rempli → confirmation + reçu WhatsApp → « Mes commandes ».
- **Devenir vendeur** (public) : assistant en 5 étapes → boutique **en attente** → code d'accès affiché → accès direct à l'espace vendeur pour préparer le catalogue. Les produits deviennent visibles sur la marketplace après validation par un admin.
- **Créer un vendeur** (admin) : même assistant ; une société immatriculée (RCCM) est active immédiatement, un particulier reste en attente de vérification de la CNI.

## Données

Tout est simulé côté navigateur et persisté dans `localStorage` (préfixe `djassa:v2:`).
Le bouton ↺ de la barre latérale admin restaure les données de démonstration.

> ⚠️ L'authentification est une **démo côté client** : les mots de passe sont stockés sous forme
> d'empreinte non cryptographique et aucune vérification n'est faite par un serveur. Avant une mise en
> production, déplacer l'auth vers l'API (`server/`) avec hachage bcrypt/argon2 et sessions signées.

## Structure

```
src/
  views/        MarketplaceView, LoginView, InventoryView, SalesOrdersView, VendorsView, CashflowSummaryView
  components/   modales et tiroirs (panier, produit, auth client, assistant vendeur…)
  utils/        vendor.ts (validation, stats), auth.ts (sessions, comptes) — logique pure et testée
  agent/        agent IA : Gemini + moteur autonome, skills alert / reorder / transfer
  hooks/        usePersistentState, useEscapeKey
tests/          tests unitaires de la logique métier
server/         API Express mock (non utilisée par le front pour l'instant)
```
