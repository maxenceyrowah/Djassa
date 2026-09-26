# Directives pour les Agents IA - Projet DJASSA

Ce projet est la plateforme e-commerce et gestion de stock **DJASSA** (Côte d'Ivoire).

## Principes Directeurs
1. **Devise obligatoire** : Tous les prix, coûts et calculs de cashflow sont en **FCFA** (Francs CFA). Ne jamais utiliser d'autre devise (€, $, etc.).
2. **4 Hubs de distribution** :
   - Dépôt Central Treichville
   - Point Relais Cocody
   - Dépôt Yopougon
   - Hub Express Plateau
3. **Maintien de l'intégrité de l'inventaire** :
   - Tout ajustement de stock (réassort, vente, transfert) doit être consigné dans le journal des mouvements (`StockMovement`).
4. **Agent IA Intégré & Skills** :
   - Le système d'agent IA in-app réside dans `src/agent/`.
   - Il supporte le double mode : Google Gemini (`@google/genai` avec modèle `gemini-2.5-flash`) et Moteur Autonome Local en fallback déterministe.
   - Les compétences modulaires (`alertSkill`, `reorderSkill`, `transferSkill`) doivent rester pures et testables.
5. **Espaces & rôles** :
   - Marketplace publique (visiteurs et clients) : aucune action de gestion. Commander exige un compte client.
   - Back-office (après connexion) : admin (tout) ou vendeur (données filtrées sur son `vendorId`).
   - La logique d'auth et de validation vit dans `src/utils/auth.ts` et `src/utils/vendor.ts` (pure, couverte par `npm test`).
