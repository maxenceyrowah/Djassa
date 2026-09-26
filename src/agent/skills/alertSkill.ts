import { Product, WarehouseHub } from '../../types/inventory';
import { StockAlertItem, StockAuditReport } from '../types';

export const ALL_HUBS: WarehouseHub[] = [
  'Dépôt Central Treichville',
  'Point Relais Cocody',
  'Dépôt Yopougon',
  'Hub Express Plateau'
];

/**
 * Skill: auditStockAlerts
 * Scans the entire inventory to identify stock ruptures, critical deficits,
 * and per-hub supply risks.
 */
export function auditStockAlerts(products: Product[]): StockAuditReport {
  const alerts: StockAlertItem[] = [];
  let outOfStockCount = 0;
  let criticalStockCount = 0;
  let optimalStockCount = 0;
  let totalStockUnits = 0;
  let totalStockValuationFCFA = 0;
  let totalReorderBudgetFCFA = 0;

  for (const product of products) {
    totalStockUnits += product.stock;
    totalStockValuationFCFA += product.stock * product.costPrice;

    if (product.stock === 0) {
      outOfStockCount++;
      const recommendedOrderQty = Math.max(product.lowStockThreshold * 2, 20);
      const reorderCost = recommendedOrderQty * product.costPrice;
      totalReorderBudgetFCFA += reorderCost;

      alerts.push({
        product,
        severity: 'out_of_stock',
        deficit: product.lowStockThreshold,
        recommendedOrderQty,
        reorderCostFCFA: reorderCost,
        daysRemaining: 0,
      });
    } else if (product.stock <= product.lowStockThreshold) {
      criticalStockCount++;
      // Target is 2.5 times threshold to ensure healthy coverage
      const targetStock = Math.max(product.lowStockThreshold * 2.5, product.lowStockThreshold + 15);
      const recommendedOrderQty = Math.round(targetStock - product.stock);
      const reorderCost = recommendedOrderQty * product.costPrice;
      totalReorderBudgetFCFA += reorderCost;

      // Turnover days estimation
      const daysRemaining = Math.max(1, Math.round((product.stock / Math.max(product.soldCount, 1)) * 30));

      alerts.push({
        product,
        severity: 'critical',
        deficit: product.lowStockThreshold - product.stock,
        recommendedOrderQty,
        reorderCostFCFA: reorderCost,
        daysRemaining,
      });
    } else if (product.stock <= product.lowStockThreshold * 1.3) {
      // Near threshold warning
      const recommendedOrderQty = Math.round(product.lowStockThreshold * 1.5);
      const reorderCost = recommendedOrderQty * product.costPrice;

      alerts.push({
        product,
        severity: 'warning',
        deficit: 0,
        recommendedOrderQty,
        reorderCostFCFA: reorderCost,
        daysRemaining: Math.round((product.stock / Math.max(product.soldCount, 1)) * 30),
      });
    } else {
      optimalStockCount++;
    }
  }

  // Sort alerts: out_of_stock first, then critical, then warning
  alerts.sort((a, b) => {
    const order = { out_of_stock: 0, critical: 1, warning: 2 };
    return order[a.severity] - order[b.severity];
  });

  // Calculate Hub metrics
  const hubSummaries = ALL_HUBS.map((hub) => {
    const hubProducts = products.filter((p) => p.warehouseHub === hub);
    const criticalHubCount = hubProducts.filter((p) => p.stock <= p.lowStockThreshold).length;
    const hubStockUnits = hubProducts.reduce((sum, p) => sum + p.stock, 0);

    return {
      hub,
      productCount: hubProducts.length,
      criticalCount: criticalHubCount,
      stockUnits: hubStockUnits,
    };
  });

  return {
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    totalProducts: products.length,
    totalStockUnits,
    outOfStockCount,
    criticalStockCount,
    optimalStockCount,
    totalStockValuationFCFA,
    totalReorderBudgetFCFA,
    hubSummaries,
    alerts,
  };
}
