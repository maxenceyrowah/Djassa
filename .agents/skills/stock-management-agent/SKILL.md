---
name: stock-management-agent
description: >-
  Use this skill when auditing inventory, diagnosing stock shortages, generating restocking
  orders in FCFA, executing inter-hub stock balancing, or updating Djassa stock models.
---

# Agent de Gestion de Stock & Réassort - Djassa

Ce skill documente les règles métier, la structure des données et les procédures opérationnelles pour la gestion du stock dans l'application **Djassa**.

## 1. Pôles Logistiques (Warehouses Hubs)
Djassa gère les stocks à travers 4 dépôts stratégiques dans la région d'Abidjan :
1. **Dépôt Central Treichville** : Entrepôt central principal à fort volume de stockage.
2. **Point Relais Cocody** : Point relais express pour la clientèle résidentielle et entreprises d'Abidjan Nord.
3. **Dépôt Yopougon** : Hub ouest à forte rotation pour les périphériques et accessoires gaming.
4. **Hub Express Plateau** : Hub d'affaires pour les livraisons rapides le jour même.

## 2. Règle de Calcul des Alertes & Ruptures
- **Rupture Totale (`out_of_stock`)** : `stock === 0`. Priorité absolue. Commande immédiate recommandée.
- **Stock Critique (`critical`)** : `stock <= lowStockThreshold`.
  - Quantité de réassort recommandée : `Math.round(lowStockThreshold * 2.5 - stock)`.
- **Stock en Alerte Préventive (`warning`)** : `stock <= lowStockThreshold * 1.3`.
- **Surstock** : `stock > lowStockThreshold * 5`. Opportunité de transfert vers un autre hub sans achat fournisseur.

## 3. Devise & Formats Financiers
- Toutes les valeurs monétaires sont en **Francs CFA (FCFA)**.
- Formater les montants avec `formatFCFA(amount)` ou séparateurs d'espaces : ex: `68 000 FCFA`.
- Marge brute unitaire : `price - costPrice`.
- Taux de marge : `((price - costPrice) / price) * 100`.

## 4. Types de Mouvements de Stock (`StockMovement`)
Tout changement de stock doit générer une entrée d'audit :
- `reception` : Arrivage fournisseur ou validation d'un bon de réassort (quantité positive).
- `vente` : Commande client ou vente directe en caisse (quantité négative).
- `ajustement` : Inventaire périodique, showroom ou correction manuelle.
- `retour` : Retour marchandise client.

## 5. Skills Automatisés Disponibles dans l'App
- **`auditStockAlerts`** : `src/agent/skills/alertSkill.ts`
- **`generateReorderPlan`** : `src/agent/skills/reorderSkill.ts`
- **`analyzeInterHubTransfers`** : `src/agent/skills/transferSkill.ts`
- **`queryStockAgent`** : `src/agent/geminiAgent.ts`
