import { Product, WarehouseHub } from '../../types/inventory';
import { InterHubTransferAction } from '../types';

/**
 * Skill: transferInterHub
 * Generates transfer proposals to rebalance stock across Abidjan logistics hubs.
 */
export function analyzeInterHubTransfers(products: Product[]): InterHubTransferAction[] {
  const suggestions: InterHubTransferAction[] = [];

  // Group products by name or category to find cross-hub balancing opportunities
  // Or check if low-stock products can receive surplus from Central Treichville
  const centralProducts = products.filter((p) => p.warehouseHub === 'Dépôt Central Treichville');
  const regionalProducts = products.filter((p) => p.warehouseHub !== 'Dépôt Central Treichville');

  for (const regProd of regionalProducts) {
    if (regProd.stock <= regProd.lowStockThreshold) {
      // Look for candidate in Treichville with high stock
      const candidate = centralProducts.find(
        (cp) => cp.name.toLowerCase() === regProd.name.toLowerCase() || cp.category === regProd.category
      );

      if (candidate && candidate.stock > candidate.lowStockThreshold * 2) {
        const transferQty = Math.min(
          Math.floor((candidate.stock - candidate.lowStockThreshold) / 2),
          regProd.lowStockThreshold * 2 - regProd.stock
        );

        if (transferQty > 0) {
          suggestions.push({
            type: 'INTER_HUB_TRANSFER',
            productId: regProd.id,
            productName: regProd.name,
            sku: regProd.sku,
            fromHub: candidate.warehouseHub,
            toHub: regProd.warehouseHub,
            quantity: transferQty,
          });
        }
      }
    }
  }

  return suggestions;
}

/**
 * Creates an explicit transfer action requested by user prompt
 */
export function createExplicitTransferAction(
  product: Product,
  fromHub: WarehouseHub,
  toHub: WarehouseHub,
  quantity: number
): InterHubTransferAction {
  return {
    type: 'INTER_HUB_TRANSFER',
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    fromHub,
    toHub,
    quantity,
  };
}
