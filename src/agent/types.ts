import { Product, WarehouseHub, FilterState, StockMovement } from '../types/inventory';

export type AgentRole = 'user' | 'assistant' | 'system';

export type AgentActionType = 
  | 'RESTOCK_ITEM'
  | 'BATCH_RESTOCK'
  | 'INTER_HUB_TRANSFER'
  | 'FILTER_CATALOG'
  | 'NAVIGATE_SCREEN';

export interface RestockItemAction {
  type: 'RESTOCK_ITEM';
  productId: string;
  productName: string;
  sku: string;
  hub: WarehouseHub;
  quantity: number;
  costPrice: number;
  totalCostFCFA: number;
  reason?: string;
}

export interface BatchRestockAction {
  type: 'BATCH_RESTOCK';
  title: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    hub: WarehouseHub;
    quantity: number;
    costPrice: number;
    totalCostFCFA: number;
  }[];
  totalBudgetFCFA: number;
}

export interface InterHubTransferAction {
  type: 'INTER_HUB_TRANSFER';
  productId: string;
  productName: string;
  sku: string;
  fromHub: WarehouseHub;
  toHub: WarehouseHub;
  quantity: number;
}

export interface FilterCatalogAction {
  type: 'FILTER_CATALOG';
  label: string;
  filters: Partial<FilterState>;
}

export interface NavigateScreenAction {
  type: 'NAVIGATE_SCREEN';
  screen: 'inventory-catalog' | 'sales-orders' | 'cashflow-summary';
  label: string;
}

export type AgentAction = 
  | RestockItemAction 
  | BatchRestockAction 
  | InterHubTransferAction 
  | FilterCatalogAction 
  | NavigateScreenAction;

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: string;
  skillUsed?: string;
  actions?: AgentAction[];
  isExecuted?: boolean;
}

export interface StockAlertItem {
  product: Product;
  severity: 'out_of_stock' | 'critical' | 'warning';
  deficit: number;
  recommendedOrderQty: number;
  reorderCostFCFA: number;
  daysRemaining: number;
}

export interface StockAuditReport {
  timestamp: string;
  totalProducts: number;
  totalStockUnits: number;
  outOfStockCount: number;
  criticalStockCount: number;
  optimalStockCount: number;
  totalStockValuationFCFA: number;
  totalReorderBudgetFCFA: number;
  hubSummaries: {
    hub: WarehouseHub;
    productCount: number;
    criticalCount: number;
    stockUnits: number;
  }[];
  alerts: StockAlertItem[];
}
