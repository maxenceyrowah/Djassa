import { Router, Request, Response } from 'express';
import { db, WarehouseHub } from '../db/mockDatabase';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const ALL_HUBS: WarehouseHub[] = [
  'Dépôt Central Treichville',
  'Point Relais Cocody',
  'Dépôt Yopougon',
  'Hub Express Plateau',
];

// Helper: Real-time stock audit
function calculateAudit() {
  const products = db.getProducts();
  const alerts: any[] = [];
  let outOfStockCount = 0;
  let criticalStockCount = 0;
  let totalStockValuationFCFA = 0;
  let totalReorderBudgetFCFA = 0;

  for (const product of products) {
    totalStockValuationFCFA += product.stock * product.costPrice;

    if (product.stock === 0) {
      outOfStockCount++;
      const recommendedQty = Math.max(product.lowStockThreshold * 2, 20);
      const cost = recommendedQty * product.costPrice;
      totalReorderBudgetFCFA += cost;
      alerts.push({
        product,
        severity: 'out_of_stock',
        recommendedOrderQty: recommendedQty,
        reorderCostFCFA: cost,
      });
    } else if (product.stock <= product.lowStockThreshold) {
      criticalStockCount++;
      const targetStock = Math.max(product.lowStockThreshold * 2.5, product.lowStockThreshold + 15);
      const recommendedQty = Math.round(targetStock - product.stock);
      const cost = recommendedQty * product.costPrice;
      totalReorderBudgetFCFA += cost;
      alerts.push({
        product,
        severity: 'critical',
        recommendedOrderQty: recommendedQty,
        reorderCostFCFA: cost,
      });
    }
  }

  const hubSummaries = ALL_HUBS.map((hub) => {
    const hubProducts = products.filter((p) => p.warehouseHub === hub);
    const criticalCount = hubProducts.filter((p) => p.stock <= p.lowStockThreshold).length;
    const stockUnits = hubProducts.reduce((sum, p) => sum + p.stock, 0);

    return {
      hub,
      productCount: hubProducts.length,
      criticalCount,
      stockUnits,
    };
  });

  return {
    totalProducts: products.length,
    outOfStockCount,
    criticalStockCount,
    totalStockValuationFCFA,
    totalReorderBudgetFCFA,
    hubSummaries,
    alerts,
  };
}

// GET /api/agent/audit
router.get('/audit', (_req: Request, res: Response) => {
  try {
    const audit = calculateAudit();
    res.json({ success: true, data: audit });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/reorder-plan
router.post('/reorder-plan', (req: Request, res: Response) => {
  try {
    const { targetHub } = req.body;
    const audit = calculateAudit();
    let relevantAlerts = audit.alerts;

    if (targetHub) {
      relevantAlerts = relevantAlerts.filter((a) => a.product.warehouseHub === targetHub);
    }

    const itemsToRestock = relevantAlerts.map((alert) => ({
      productId: alert.product.id,
      productName: alert.product.name,
      sku: alert.product.sku,
      hub: alert.product.warehouseHub,
      quantity: alert.recommendedOrderQty,
      costPrice: alert.product.costPrice,
      totalCostFCFA: alert.reorderCostFCFA,
    }));

    const totalBudgetFCFA = itemsToRestock.reduce((sum, i) => sum + i.totalCostFCFA, 0);

    res.json({
      success: true,
      data: {
        targetHub,
        itemsToRestock,
        totalBudgetFCFA,
        count: itemsToRestock.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/execute-restock
router.post('/execute-restock', (req: Request, res: Response) => {
  try {
    const { productId, quantity, hub, reason } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, error: 'productId et quantity requis' });
    }

    const result = db.adjustStock(
      productId,
      Number(quantity),
      hub || 'Dépôt Central Treichville',
      'Agent Réassort IA Backend',
      reason || 'Réassort approuvé via API'
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Produit introuvable' });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/execute-batch-restock
router.post('/execute-batch-restock', (req: Request, res: Response) => {
  try {
    const { items, reason } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items requis' });
    }

    const results: any[] = [];
    for (const it of items) {
      const resAdjust = db.adjustStock(
        it.productId,
        Number(it.quantity),
        it.hub || 'Dépôt Central Treichville',
        'Agent Réassort IA (Batch Backend)',
        reason || 'Réapprovisionnement groupé validé'
      );
      if (resAdjust) results.push(resAdjust);
    }

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/execute-transfer
router.post('/execute-transfer', (req: Request, res: Response) => {
  try {
    const { productId, fromHub, toHub, quantity } = req.body;

    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produit introuvable' });
    }

    const qty = Number(quantity);
    const movOut = db.addMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'ajustement',
      quantityChange: -qty,
      location: fromHub,
      operator: 'Agent Logistique IA Backend',
      reason: `Transfert inter-dépôts vers ${toHub}`,
    });

    const movIn = db.addMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'reception',
      quantityChange: qty,
      location: toHub,
      operator: 'Agent Logistique IA Backend',
      reason: `Réception transfert de ${fromHub}`,
    });

    res.json({
      success: true,
      data: {
        product,
        movements: [movOut, movIn],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Requête vide' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const audit = calculateAudit();
    const products = db.getProducts();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const catalogContext = products.map((p) => ({
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          lowStockThreshold: p.lowStockThreshold,
          hub: p.warehouseHub,
          price: p.price,
          costPrice: p.costPrice,
        }));

        const prompt = `Contexte stock Djassa :
- Produits : ${JSON.stringify(catalogContext)}
- Alertes : ${audit.criticalStockCount + audit.outOfStockCount}
- Budget réassort : ${audit.totalReorderBudgetFCFA} FCFA

Question : "${query}"
Réponds de manière concise, précise, avec les montants en FCFA et des étapes concrètes.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: 'Tu es l’Agent IA Backend de gestion de stock DJASSA à Abidjan. Réponds en FCFA avec clarté.',
          },
        });

        return res.json({
          success: true,
          source: 'gemini-server',
          content: response.text,
          audit,
        });
      } catch (err: any) {
        console.warn('Backend Gemini API call failed, falling back:', err.message);
      }
    }

    // Deterministic fallback response
    let reply = `### 🤖 Analyse de Stock Backend Djassa\n\n`;
    reply += `• Total articles audités : **${audit.totalProducts}**\n`;
    reply += `• Alertes critiques : **${audit.criticalStockCount + audit.outOfStockCount}**\n`;
    reply += `• Budget estimé de réassort : **${audit.totalReorderBudgetFCFA.toLocaleString('fr-FR')} FCFA**\n\n`;

    if (audit.alerts.length > 0) {
      reply += `**Articles prioritaires :**\n`;
      audit.alerts.forEach((a: any) => {
        reply += `• 📦 **${a.product.name}** : stock actuel **${a.product.stock}** (seuil: ${a.product.lowStockThreshold}) à *${a.product.warehouseHub}* ➔ Commander **+${a.recommendedOrderQty} u.**\n`;
      });
    } else {
      reply += `✅ Tous les stocks sont au vert sur les 4 dépôts.`;
    }

    res.json({
      success: true,
      source: 'autonomous-server',
      content: reply,
      audit,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
