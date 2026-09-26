import React from 'react';
import { Product, SaleOrder, StockMovement } from '../types/inventory';
import { formatFCFA } from '../utils/format';

interface CashflowSummaryViewProps {
  products: Product[];
  orders: SaleOrder[];
  movements: StockMovement[];
  onNavigateToCatalog: () => void;
  onOpenQuickSale: () => void;
}

export const CashflowSummaryView: React.FC<CashflowSummaryViewProps> = ({
  products,
  orders,
  movements,
  onNavigateToCatalog,
  onOpenQuickSale
}) => {
  const totalStockValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
  const totalStockCost = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const potentialGrossMargin = totalStockValue - totalStockCost;
  const totalSalesRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

  const depotBreakdown = (
    ['Dépôt Central Treichville', 'Point Relais Cocody', 'Dépôt Yopougon', 'Hub Express Plateau'] as const
  ).map((name) => {
    const hubProducts = products.filter((p) => p.warehouseHub === name);
    return {
      name,
      count: hubProducts.reduce((acc, p) => acc + p.stock, 0),
      value: hubProducts.reduce((acc, p) => acc + p.price * p.stock, 0)
    };
  });

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 py-4 sm:py-6 gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline font-semibold text-xl sm:text-2xl text-[#0b1c30]">
            Caisse & Bilan d'Inventaire
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Suivi financier en direct de votre boutique Djassa en Francs CFA (FCFA)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToCatalog}
            className="h-9 px-3 bg-white text-[#0b1c30] border border-[#e2e8f0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">inventory_2</span>
            <span>Voir le catalogue</span>
          </button>
          <button
            onClick={onOpenQuickSale}
            className="h-9 px-3.5 bg-[#00685d] text-white hover:bg-[#005048] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px]">point_of_sale</span>
            <span>Nouvelle Vente</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Valeur Totale Stock */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
            Valeur Marchande en Stock
          </span>
          <div className="mt-3">
            <span className="font-headline font-bold text-2xl text-[#0b1c30] tabular-nums">
              {formatFCFA(totalStockValue)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#00685d] font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Liquidité saine</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Recettes Encaissées */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
            Recettes Encaissées
          </span>
          <div className="mt-3">
            <span className="font-headline font-bold text-2xl text-[#00685d] tabular-nums">
              {formatFCFA(totalSalesRevenue)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#64748b]">
              <span>Wave, OM, MoMo & Espèces</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Marge Potentielle */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
            Marge Brute Projetée
          </span>
          <div className="mt-3">
            <span className="font-headline font-bold text-2xl text-[#008376] tabular-nums">
              {formatFCFA(potentialGrossMargin)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#008376] font-semibold">
              <span>+{(Math.round((potentialGrossMargin / totalStockValue) * 100))}% de marge moyenne</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Stocks Faibles */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
            Seuils de Réapprovisionnement
          </span>
          <div className="mt-3">
            <span className={`font-headline font-bold text-2xl tabular-nums ${lowStockCount > 0 ? 'text-[#ba1a1a]' : 'text-[#00685d]'}`}>
              {lowStockCount} article{lowStockCount > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#64748b]">
              <span>Stock &lt; seuil minimum</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Stock par Dépôt + Journal des Flux Récents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Dépôts et valorisation (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#e2e8f0] shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#00685d]">warehouse</span>
              <h2 className="font-headline font-semibold text-base text-[#0b1c30]">
                Répartition des Stocks par Dépôt
              </h2>
            </div>
            <span className="text-xs text-[#00685d] font-semibold">Abidjan & Environs</span>
          </div>

          <div className="flex flex-col gap-3">
            {depotBreakdown.map((d) => (
              <div key={d.name} className="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-[#0b1c30]">{d.name}</h4>
                  <span className="text-[11px] text-[#64748b]">{d.count} unités en stock</span>
                </div>
                <div className="text-right">
                  <span className="font-headline font-bold text-sm text-[#00685d] block tabular-nums">
                    {formatFCFA(d.value)}
                  </span>
                  <span className="text-[10px] text-[#64748b]">Valeur marchande</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Journal des derniers flux (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#e2e8f0] shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#00685d]">sync_alt</span>
              <h2 className="font-headline font-semibold text-base text-[#0b1c30]">
                Flux & Mouvements Récents
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {movements.slice(0, 5).map((m) => (
              <div key={m.id} className="p-3 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0b1c30]">
                    <span className="capitalize">{m.type}</span>
                    <span className="text-[#64748b] font-normal">({m.date.split(' ')[1] || m.date})</span>
                  </div>
                  <span className="text-[11px] text-[#64748b] block truncate max-w-[200px]">
                    {m.productName} • {m.reason}
                  </span>
                </div>
                <span
                  className={`font-headline font-bold text-xs tabular-nums ${
                    m.quantityChange > 0 ? 'text-[#00685d]' : 'text-[#ba1a1a]'
                  }`}
                >
                  {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} u.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
