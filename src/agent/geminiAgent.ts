import { GoogleGenAI } from '@google/genai';
import { Product, WarehouseHub, FilterState } from '../types/inventory';
import { AgentMessage, AgentAction } from './types';
import { auditStockAlerts, ALL_HUBS } from './skills/alertSkill';
import { generateReorderPlan } from './skills/reorderSkill';
import { analyzeInterHubTransfers } from './skills/transferSkill';
import { formatFCFA } from '../utils/format';

const STORAGE_KEY = 'djassa_gemini_api_key';

export function getStoredApiKey(): string {
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage && fromStorage.trim().length > 0) {
      return fromStorage.trim();
    }
  }
  // Try process.env if injected
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return '';
}

export function saveApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

/**
 * System prompt instructing the Agent on Djassa's stock management rules
 */
const SYSTEM_INSTRUCTION = `Tu es l'Agent IA Spécialiste du Réassort et de la Gestion des Stocks pour la boutique DJASSA à Abidjan (Côte d'Ivoire).
Tes prérogatives :
1. Surveiller les 4 dépôts logistiques : Dépôt Central Treichville, Point Relais Cocody, Dépôt Yopougon, Hub Express Plateau.
2. Détecter immédiatement tout produit avec stock = 0 (Rupture) ou stock <= lowStockThreshold (Stock critique).
3. Proposer des plans de réassort chiffrés en FCFA (ex: "X unités pour Y FCFA").
4. Proposer des transferts de stock équilibrés entre dépôts si Treichville dispose d'un surplus.
5. Répondre de façon concise, professionnelle, chaleureuse et orientée action marchande (style e-commerce ivoirien / africain moderne).`;

/**
 * Autonomous Local Reasoner (Runs instantaneously even without an API key or offline)
 */
export function runAutonomousAgent(
  userQuery: string,
  products: Product[]
): { content: string; actions?: AgentAction[]; skillUsed?: string } {
  const queryLower = userQuery.toLowerCase().trim();
  const audit = auditStockAlerts(products);

  // 1. Hub specific query
  const matchedHub = ALL_HUBS.find((hub) => queryLower.includes(hub.toLowerCase()) || (hub.includes('Treichville') && queryLower.includes('treichville')) || (hub.includes('Cocody') && queryLower.includes('cocody')) || (hub.includes('Yopougon') && queryLower.includes('yopougon')) || (hub.includes('Plateau') && queryLower.includes('plateau')));

  if (matchedHub && (queryLower.includes('reassort') || queryLower.includes('réassort') || queryLower.includes('commander') || queryLower.includes('stock') || queryLower.includes('etat') || queryLower.includes('état'))) {
    const plan = generateReorderPlan(products, matchedHub);
    const hubSummary = audit.hubSummaries.find((h) => h.hub === matchedHub);

    let content = `### 🏢 Bilan & Réassort pour **${matchedHub}**\n\n`;
    content += `• **Unités en stock :** ${hubSummary?.stockUnits ?? 0} unités sur ${hubSummary?.productCount ?? 0} références.\n`;
    content += `• **Alertes critiques :** ${plan.itemsToRestock.length} article(s) nécessitant un réapprovisionnement immédiat.\n\n`;

    if (plan.itemsToRestock.length > 0) {
      content += `💰 **Budget total estimé :** \`${formatFCFA(plan.totalBudgetFCFA)}\`\n\n`;
      content += `Vous pouvez valider les réapprovisionnements recommandés ci-dessous :`;
      return {
        content,
        skillUsed: 'generateReorderPlan (Hub)',
        actions: plan.batchAction ? [plan.batchAction, ...plan.itemsToRestock] : plan.itemsToRestock,
      };
    } else {
      content += `✅ **Excellent !** Aucun article n'est actuellement sous le seuil critique pour ce hub.`;
      return {
        content,
        skillUsed: 'auditStockAlerts',
      };
    }
  }

  // 2. Alert & Rupture Scan
  if (
    queryLower.includes('alerte') ||
    queryLower.includes('rupture') ||
    queryLower.includes('critique') ||
    queryLower.includes('faible') ||
    queryLower.includes('scanner') ||
    queryLower.includes('danger')
  ) {
    if (audit.alerts.length === 0) {
      return {
        content: `🎉 **Tous vos stocks sont au vert !**\nAucun produit n'est actuellement en rupture ou sous le seuil d'alerte sur vos 4 entrepôts.`,
        skillUsed: 'auditStockAlerts',
      };
    }

    const criticalList = audit.alerts
      .map((a) => {
        const icon = a.severity === 'out_of_stock' ? '🔴' : '🟠';
        const label = a.severity === 'out_of_stock' ? '**RUPTURE**' : '**CRITIQUE**';
        return `• ${icon} ${label} **${a.product.name}** (SKU: \`${a.product.sku}\`)\n  - Stock : **${a.product.stock}** (Seuil: ${a.product.lowStockThreshold}) | Lieu: *${a.product.warehouseHub}*\n  - Recommandation: **+${a.recommendedOrderQty} unités** (\`${formatFCFA(a.reorderCostFCFA)}\`)`;
      })
      .join('\n\n');

    const content = `### 🚨 Audit des Alertes & Ruptures de Stock\n\n` +
      `J'ai analysé l'ensemble de votre catalogue (${audit.totalProducts} références) :\n` +
      `• **Ruptures totales :** ${audit.outOfStockCount}\n` +
      `• **Stocks critiques :** ${audit.criticalStockCount}\n` +
      `• **Budget réassort requis :** \`${formatFCFA(audit.totalReorderBudgetFCFA)}\`\n\n` +
      `**Détail des priorités :**\n${criticalList}\n\n` +
      `Cliquez ci-dessous pour appliquer le réassort ou filtrer votre catalogue :`;

    const plan = generateReorderPlan(products);
    const filterAction: AgentAction = {
      type: 'FILTER_CATALOG',
      label: 'Voir ces produits dans le catalogue',
      filters: { stockLevel: 'low' },
    };

    const actions: AgentAction[] = [filterAction];
    if (plan.batchAction) {
      actions.push(plan.batchAction);
    }
    actions.push(...plan.itemsToRestock);

    return {
      content,
      skillUsed: 'auditStockAlerts',
      actions,
    };
  }

  // 3. Reorder Plan
  if (
    queryLower.includes('reassort') ||
    queryLower.includes('réassort') ||
    queryLower.includes('commander') ||
    queryLower.includes('approvisionner') ||
    queryLower.includes('acheter') ||
    queryLower.includes('plan')
  ) {
    const plan = generateReorderPlan(products);

    if (plan.itemsToRestock.length === 0) {
      return {
        content: `📦 **Aucun réassort urgent n'est requis.**\nTous vos produits disposent d'un niveau de stock supérieur à leurs seuils d'alerte respectifs.`,
        skillUsed: 'generateReorderPlan',
      };
    }

    const content = `### 📦 Plan de Réassort Conseillé\n\n` +
      `Pour sécuriser les ventes sans interruption, voici le plan d'achat optimal calculé pour vos pôles logistiques :\n\n` +
      `• **Nombre d'articles à réapprovisionner :** ${plan.itemsToRestock.length}\n` +
      `• **Investissement d'achat total :** \`${formatFCFA(plan.totalBudgetFCFA)}\`\n\n` +
      `Vous pouvez valider le bon de commande global d'un seul clic ou sélectionner les articles individuellement :`;

    const actions: AgentAction[] = [];
    if (plan.batchAction) {
      actions.push(plan.batchAction);
    }
    actions.push(...plan.itemsToRestock);

    return {
      content,
      skillUsed: 'generateReorderPlan',
      actions,
    };
  }

  // 4. Inter-hub transfers
  if (
    queryLower.includes('transfert') ||
    queryLower.includes('transférer') ||
    queryLower.includes('equilibrer') ||
    queryLower.includes('équilibrer') ||
    queryLower.includes('depot') ||
    queryLower.includes('dépôt')
  ) {
    const transfers = analyzeInterHubTransfers(products);

    if (transfers.length === 0) {
      // Find Treichville surplus
      const treichvilleItems = products.filter(
        (p) => p.warehouseHub === 'Dépôt Central Treichville' && p.stock > 50
      );

      const content = `### 🔄 Équilibrage des Stocks Inter-Dépôts\n\n` +
        `Aucun déséquilibre critique automatique n'a été détecté entre vos 4 pôles.\n` +
        `Le **Dépôt Central Treichville** est votre pôle principal avec **${treichvilleItems.length} références à fort stock** prêtes à être ventilées vers Cocody, Yopougon ou Plateau sur demande.`;

      return {
        content,
        skillUsed: 'analyzeInterHubTransfers',
      };
    }

    const content = `### 🔄 Suggestions de Transfert Inter-Dépôts\n\n` +
      `J'ai repéré des opportunités de rééquilibrage sans passer par un achat fournisseur :\n\n` +
      transfers
        .map(
          (t) =>
            `• Transférer **${t.quantity}x ${t.productName}** de *${t.fromHub}* vers *${t.toHub}*`
        )
        .join('\n') +
      `\n\nValidez ces transferts pour réapprovisionner vos points relais immédiatement :`;

    return {
      content,
      skillUsed: 'analyzeInterHubTransfers',
      actions: transfers,
    };
  }

  // 5. Specific product lookup (search in products)
  const foundProduct = products.find(
    (p) =>
      queryLower.includes(p.name.toLowerCase()) ||
      queryLower.includes(p.sku.toLowerCase()) ||
      p.name.toLowerCase().split(' ').some((word) => word.length > 3 && queryLower.includes(word))
  );

  if (foundProduct) {
    const isCritical = foundProduct.stock <= foundProduct.lowStockThreshold;
    const reorderQty = Math.max(foundProduct.lowStockThreshold * 2, 20);
    const totalCost = reorderQty * foundProduct.costPrice;

    const content = `### 🔍 Fiche Stock : **${foundProduct.name}**\n\n` +
      `• **SKU :** \`${foundProduct.sku}\`\n` +
      `• **Stock actuel :** **${foundProduct.stock} unités** ${isCritical ? '⚠️ (Sous le seuil d’alerte !)' : '✅ (Normal)'}\n` +
      `• **Seuil critique défini :** ${foundProduct.lowStockThreshold} unités\n` +
      `• **Emplacement :** ${foundProduct.warehouseLocation} (*${foundProduct.warehouseHub}*)\n` +
      `• **Prix de vente :** \`${formatFCFA(foundProduct.price)}\` | Coût d'achat: \`${formatFCFA(foundProduct.costPrice)}\`\n` +
      `• **Marge unitaire :** \`${formatFCFA(foundProduct.price - foundProduct.costPrice)}\` (${Math.round(((foundProduct.price - foundProduct.costPrice) / foundProduct.price) * 100)}%)\n\n` +
      (isCritical
        ? `🚨 **Action requise :** Le stock est insuffisant pour soutenir les ventes prévisionnelles.`
        : `Le niveau de stock est suffisant.`);

    const actions: AgentAction[] = [
      {
        type: 'RESTOCK_ITEM',
        productId: foundProduct.id,
        productName: foundProduct.name,
        sku: foundProduct.sku,
        hub: foundProduct.warehouseHub,
        quantity: reorderQty,
        costPrice: foundProduct.costPrice,
        totalCostFCFA: totalCost,
        reason: 'Réassort ciblé demandé via l’Agent',
      },
    ];

    return {
      content,
      skillUsed: 'productInspection',
      actions,
    };
  }

  // 6. Default overview / General guidance
  const content = `### 🤖 Synthèse de l'Agent Réassort Djassa\n\n` +
    `Je surveille vos **${audit.totalProducts} références** réparties sur Abidjan :\n` +
    `• 📦 **Volume global :** ${audit.totalStockUnits} unités en stock\n` +
    `• 🚨 **Statut :** ${audit.criticalStockCount + audit.outOfStockCount > 0 ? `**${audit.criticalStockCount + audit.outOfStockCount} alerte(s) active(s)**` : '✅ Stock optimal'}\n` +
    `• 💰 **Valeur d'inventaire :** \`${formatFCFA(audit.totalStockValuationFCFA)}\`\n\n` +
    `**Comment puis-je vous aider ?**\n` +
    `1. *« Scanner les alertes et ruptures »*\n` +
    `2. *« Établir le plan de réassort pour Treichville »*\n` +
    `3. *« Transférer du stock vers Cocody »*\n` +
    `4. *« Consulter le stock du Casque Audio Pro »*`;

  const plan = generateReorderPlan(products);
  const actions: AgentAction[] = [];
  if (plan.batchAction) {
    actions.push(plan.batchAction);
  }

  return {
    content,
    skillUsed: 'globalOverview',
    actions,
  };
}

/**
 * Main query processor: Uses Gemini if API key is present,
 * or effortlessly falls back to the high-performance Autonomous Agent.
 */
export async function queryStockAgent(
  userQuery: string,
  products: Product[],
  onChunk?: (text: string) => void
): Promise<{ content: string; actions?: AgentAction[]; skillUsed?: string }> {
  const apiKey = getStoredApiKey();

  // If no Gemini key is set, use the built-in autonomous engine
  if (!apiKey) {
    // Simulate brief thinking delay for realistic feeling
    await new Promise((r) => setTimeout(r, 300));
    return runAutonomousAgent(userQuery, products);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build context summary for Gemini
    const audit = auditStockAlerts(products);
    const catalogContext = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      hub: p.warehouseHub,
      price: p.price,
      costPrice: p.costPrice,
    }));

    const prompt = `Voici l'état actuel de l'inventaire DJASSA :
- Total références : ${audit.totalProducts}
- Unités en stock : ${audit.totalStockUnits}
- Alertes ruptures/critiques : ${audit.criticalStockCount + audit.outOfStockCount}
- Produits : ${JSON.stringify(catalogContext)}

Question du gérant de stock :
"${userQuery}"

Fournis une réponse claire, formatée en Markdown, avec des puces et des montants en FCFA. Termine avec une recommandation concrète.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text || '';

    // Also determine if any executable actions match this query
    const autoResult = runAutonomousAgent(userQuery, products);

    return {
      content: text,
      actions: autoResult.actions,
      skillUsed: 'Gemini 2.5 Flash + Skills Djassa',
    };
  } catch (error) {
    console.warn('Gemini API call failed, falling back to Autonomous Agent engine:', error);
    // Graceful fallback to built-in autonomous engine
    const fallback = runAutonomousAgent(userQuery, products);
    fallback.content = `> [!NOTE]\n> *Mode local actif (clé API non valide ou réseau indisponible)*\n\n` + fallback.content;
    return fallback;
  }
}
