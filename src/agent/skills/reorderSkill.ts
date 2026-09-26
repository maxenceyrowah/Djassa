import { Product, WarehouseHub } from '../../types/inventory';
import { auditStockAlerts } from './alertSkill';
import { BatchRestockAction, RestockItemAction } from '../types';

/**
 * Skill: generateReorderPlan
 * Generates an optimal restocking purchase plan for depleted items,
 * optionally filtered by a specific warehouse hub.
 */
export function generateReorderPlan(
  products: Product[],
  targetHub?: WarehouseHub
): {
  targetHub?: WarehouseHub;
  itemsToRestock: RestockItemAction[];
  batchAction: BatchRestockAction | null;
  totalBudgetFCFA: number;
} {
  const audit = auditStockAlerts(products);
  let relevantAlerts = audit.alerts.filter((a) => a.severity !== 'warning');

  if (targetHub) {
    relevantAlerts = relevantAlerts.filter((a) => a.product.warehouseHub === targetHub);
  }

  const itemsToRestock: RestockItemAction[] = relevantAlerts.map((alert) => {
    const p = alert.product;
    const qty = alert.recommendedOrderQty;
    const cost = qty * p.costPrice;

    return {
      type: 'RESTOCK_ITEM',
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      hub: p.warehouseHub,
      quantity: qty,
      costPrice: p.costPrice,
      totalCostFCFA: cost,
      reason: `Réassort préventif conseillé : stock actuel (${p.stock}) sous le seuil critique (${p.lowStockThreshold})`,
    };
  });

  const totalBudgetFCFA = itemsToRestock.reduce((sum, item) => sum + item.totalCostFCFA, 0);

  const batchAction: BatchRestockAction | null = itemsToRestock.length > 0
    ? {
        type: 'BATCH_RESTOCK',
        title: targetHub
          ? `Réassort global - ${targetHub}`
          : 'Réassort global multi-pôles (Tous Dépôts)',
        items: itemsToRestock.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          hub: item.hub,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalCostFCFA: item.totalCostFCFA,
        })),
        totalBudgetFCFA,
      }
    : null;

  return {
    targetHub,
    itemsToRestock,
    batchAction,
    totalBudgetFCFA,
  };
}
