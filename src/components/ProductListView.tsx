import React from 'react';
import { Product } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { MapPin, ShoppingBag, Receipt, Calendar } from 'lucide-react';

interface ProductListViewProps {
  products: Product[];
  selectedIds: string[];
  cartQuantities?: Record<string, number>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (all: boolean) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onAdjustStock: (product: Product, e: React.MouseEvent) => void;
  onQuickSell: (product: Product, e: React.MouseEvent) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  selectedIds,
  cartQuantities = {},
  onToggleSelect,
  onSelectAll,
  onAddToCart,
  onAdjustStock,
  onQuickSell,
  onSelectProduct
}) => {
  const allSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  return (
    <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#eff4ff] text-[11px] font-semibold text-[#64748b] uppercase tracking-wider border-b border-[#e2e8f0]">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00685d] focus:ring-[#00685d] accent-[#00685d] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Article & Réf</th>
              <th className="py-3 px-4">Catégorie</th>
              <th className="py-3 px-4">Dépôt / Emplacement</th>
              <th className="py-3 px-4 text-center">Niveau de Stock</th>
              <th className="py-3 px-4 text-right">Prix Unitaire</th>
              <th className="py-3 px-4 text-right">Vendus</th>
              <th className="py-3 px-4 text-center">Actions & Panier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9] text-xs">
            {products.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              const isLow = product.stock > 0 && product.stock <= product.lowStockThreshold;
              const isOut = product.stock === 0;
              const cartQty = cartQuantities[product.id] || 0;

              return (
                <tr
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className={`hover:bg-[#f8f9ff] transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#eff4ff]/60' : ''
                  }`}
                >
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(product.id)}
                      className="w-4 h-4 rounded text-[#00685d] focus:ring-[#00685d] accent-[#00685d] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#eff4ff] p-1 flex-shrink-0 flex items-center justify-center border border-[#e2e8f0]">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[#0b1c30] truncate">{product.name}</span>
                        <span className="font-mono text-[11px] text-[#64748b]">{product.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#3d4946]">
                    <span>{product.category}</span>
                  </td>
                  <td className="py-3 px-4 text-[#64748b]">
                    <div className="flex items-center gap-1">
                      <MapPin size={13} />
                      <span>{product.warehouseLocation}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isOut ? (
                      <span className="inline-flex items-center gap-1 bg-[#e5eeff] text-[#0b1c30] px-2 py-0.5 rounded-full font-semibold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]"></span>
                        0 (Rupture)
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                        {product.stock} (Faible)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#acedda] text-[#065043] px-2 py-0.5 rounded-full font-bold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00685d]"></span>
                        {product.stock} en stock
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-headline font-bold text-[#00685d] tabular-nums">
                    {formatFCFA(product.price)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#64748b]">
                    {product.soldCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* + Panier */}
                      <button
                        onClick={(e) => onAddToCart(product, e)}
                        disabled={isOut}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-all shadow-2xs ${
                          cartQty > 0
                            ? 'bg-[#acedda] text-[#065043] hover:bg-[#92dfcc]'
                            : 'bg-[#00685d] text-white hover:bg-[#005048]'
                        } disabled:opacity-40`}
                        title="Ajouter au panier de commande"
                      >
                        <ShoppingBag size={13} />
                        <span>{cartQty > 0 ? `Panier (${cartQty})` : '+ Panier'}</span>
                      </button>

                      {/* Vendre */}
                      <button
                        onClick={(e) => onQuickSell(product, e)}
                        disabled={isOut}
                        className="px-2 py-1 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00685d] rounded-lg font-medium text-[11px] inline-flex items-center gap-1 transition-colors border border-[#dce9ff] disabled:opacity-40"
                        title="Vendre au comptoir"
                      >
                        <Receipt size={13} />
                        <span>Vendre</span>
                      </button>

                      {/* Stock */}
                      <button
                        onClick={(e) => onAdjustStock(product, e)}
                        className="px-2 py-1 bg-white hover:bg-[#f8f9ff] text-[#64748b] rounded-lg font-medium text-[11px] inline-flex items-center gap-1 transition-colors border border-[#e2e8f0]"
                        title="Ajuster le stock"
                      >
                        <Calendar size={13} />
                        <span>Stock</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
