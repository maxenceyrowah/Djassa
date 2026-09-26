import React, { useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Product, StockMovement } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { Boxes, X, ShoppingBag, Check, Receipt, Calendar, Warehouse, MapPin } from 'lucide-react';

interface ProductDetailDrawerProps {
  product: Product | null;
  isOpen: boolean;
  cartQuantity?: number;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onAdjustStock: (product: Product) => void;
  onQuickSell: (product: Product) => void;
  movements: StockMovement[];
  /** 'public' : fiche acheteur, sans données internes ni actions de gestion. */
  mode?: 'public' | 'backoffice';
  vendorName?: string;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  isOpen,
  cartQuantity = 0,
  onClose,
  onAddToCart,
  onAdjustStock,
  onQuickSell,
  movements,
  mode = 'backoffice',
  vendorName
}) => {
  const isPublic = mode === 'public';
  useEscapeKey(onClose, isOpen);
  const [addQty, setAddQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!isOpen || !product) return null;

  const productMovements = movements.filter((m) => m.productId === product.id);
  const marginFCFA = product.price - product.costPrice;
  const marginPercent = Math.round((marginFCFA / product.price) * 100);

  const handleAdd = () => {
    onAddToCart(product, addQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-[#e2e8f0]">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <Boxes size={20} className="text-[#00685d]" />
            <div>
              <h2 className="font-headline font-semibold text-base text-[#0b1c30]">
                {isPublic ? 'Détails du produit' : 'Fiche Article Djassa'}
              </h2>
              <p className="text-xs text-[#64748b]">
                {isPublic ? `Vendu par ${vendorName ?? 'DJASSA'}` : <span className="font-mono">{product.sku}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#64748b] hover:text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 flex flex-col gap-6 text-xs">
          {/* Main Visual & Info Header */}
          <div className="flex gap-4 items-start">
            <div className="w-28 h-28 rounded-xl bg-[#eff4ff] p-2 border border-[#e2e8f0] flex-shrink-0 flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between h-28">
              <div>
                <span className="text-[11px] font-semibold text-[#00685d] uppercase tracking-wider">
                  {product.category}
                </span>
                <h3 className="font-headline font-semibold text-base text-[#0b1c30] mt-0.5 leading-snug">
                  {product.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#eff4ff] text-[#0b1c30] font-semibold px-2 py-0.5 rounded text-[11px]">
                  Couleur : {product.color}
                </span>
                <span className="text-[#64748b] text-[11px]">
                  {product.reviewCountLabel || `${product.reviewCount} Avis`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-lg text-[#00685d] tabular-nums">
                  {formatFCFA(product.price)}
                </span>
                <span className="text-xs text-[#64748b]">
                  {product.soldCount} vendus
                </span>
              </div>
            </div>
          </div>

          {/* Cart Addition Box */}
          <div className="p-4 bg-[#eff4ff] rounded-xl border border-[#dce9ff] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#0b1c30] flex items-center gap-1.5">
                <ShoppingBag size={18} className="text-[#00685d]" />
                Ajouter au panier
              </span>
              {cartQuantity > 0 && (
                <span className="bg-[#acedda] text-[#065043] font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Déjà {cartQuantity} au panier
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-lg border border-[#e2e8f0] p-1">
                <button
                  type="button"
                  onClick={() => setAddQty(Math.max(1, addQty - 1))}
                  className="w-7 h-7 rounded flex items-center justify-center font-bold text-[#0b1c30] hover:bg-[#f1f5f9]"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  className="w-10 text-center font-bold text-xs text-[#0b1c30] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAddQty(Math.min(product.stock, addQty + 1))}
                  disabled={addQty >= product.stock}
                  className="w-7 h-7 rounded flex items-center justify-center font-bold text-[#0b1c30] hover:bg-[#f1f5f9] disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={product.stock <= 0}
                className="flex-1 h-9 bg-[#00685d] hover:bg-[#005048] disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
              >
                <Check size={16} />
                <span>
                  {justAdded
                    ? 'Ajouté au panier !'
                    : `Ajouter (${formatFCFA(product.price * addQty)})`}
                </span>
              </button>
            </div>
          </div>

          {isPublic && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold ${
                product.stock === 0
                  ? 'bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]'
                  : product.stock <= product.lowStockThreshold
                    ? 'bg-[#fff7ed] border-[#fed7aa] text-[#b45309]'
                    : 'bg-[#eefaf6] border-[#b7e4d8] text-[#00685d]'
              }`}
            >
              {product.stock === 0
                ? 'Épuisé pour le moment'
                : product.stock <= product.lowStockThreshold
                  ? `Plus que ${product.stock} en stock, commandez vite`
                  : 'En stock · expédié sous 24h'}
              <span className="block font-normal text-[#3d4946] mt-0.5">Expédié depuis le {product.warehouseHub}</span>
            </div>
          )}

          {!isPublic && (
          <>
          {/* Quick Action Bar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onQuickSell(product)}
              disabled={product.stock <= 0}
              className="py-2.5 px-3 bg-[#eff4ff] hover:bg-[#dce9ff] disabled:opacity-40 text-[#00685d] border border-[#dce9ff] rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Receipt size={16} />
              <span>Vente Comptoir Directe</span>
            </button>
            <button
              onClick={() => onAdjustStock(product)}
              className="py-2.5 px-3 bg-white hover:bg-[#f8f9ff] text-[#64748b] border border-[#e2e8f0] rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Calendar size={16} />
              <span>Ajuster Stock</span>
            </button>
          </div>

          {/* Key Metrics in FCFA */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#e2e8f0] flex flex-col">
              <span className="text-[10px] text-[#64748b] uppercase">Stock Disponible</span>
              <span className="font-headline font-bold text-base text-[#0b1c30] mt-1 tabular-nums">
                {product.stock}
              </span>
              <span className="text-[10px] text-[#64748b] mt-0.5">
                Seuil alerte : {product.lowStockThreshold}
              </span>
            </div>

            <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#e2e8f0] flex flex-col">
              <span className="text-[10px] text-[#64748b] uppercase">Marge Brute</span>
              <span className="font-headline font-bold text-base text-[#00685d] mt-1 tabular-nums">
                {formatFCFA(marginFCFA)}
              </span>
              <span className="text-[10px] text-[#00685d] font-semibold mt-0.5">
                {marginPercent}% du PV
              </span>
            </div>

            <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#e2e8f0] flex flex-col">
              <span className="text-[10px] text-[#64748b] uppercase">Rotation Estimée</span>
              <span className="font-headline font-bold text-base text-[#0b1c30] mt-1 tabular-nums">
                {product.turnoverDays} j.
              </span>
              <span className="text-[10px] text-[#64748b] mt-0.5">
                Flux rapide
              </span>
            </div>
          </div>

          {/* Logistics & Location Details */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-[#0b1c30] uppercase tracking-wider">
              Localisation & Hub de Stockage
            </span>
            <div className="flex items-center gap-2 text-xs text-[#0b1c30]">
              <Warehouse size={18} className="text-[#00685d]" />
              <span className="font-semibold">{product.warehouseHub}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <MapPin size={16} />
              <span>Emplacement allée : <strong className="text-[#0b1c30]">{product.warehouseLocation}</strong></span>
            </div>
          </div>

          </>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#0b1c30] uppercase tracking-wider">
              Description de l'article
            </span>
            <p className="text-xs text-[#64748b] leading-relaxed bg-[#f8f9ff] p-3 rounded-xl border border-[#e2e8f0]">
              {product.description || "Article certifié conforme pour le commerce et la distribution en Afrique de l'Ouest."}
            </p>
          </div>

          {/* Recent movements */}
          {!isPublic && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-[#0b1c30] uppercase tracking-wider">
              Derniers Mouvements de Stock ({productMovements.length})
            </span>
            {productMovements.length === 0 ? (
              <p className="text-xs text-[#64748b] italic">Aucun mouvement récent enregistré.</p>
            ) : (
              <div className="divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-xl overflow-hidden bg-white">
                {productMovements.slice(0, 4).map((m) => (
                  <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#0b1c30] block">{m.reason}</span>
                      <span className="text-[10px] text-[#64748b]">{m.date} • {m.operator}</span>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs ${
                        m.quantityChange > 0 ? 'text-[#00685d]' : 'text-[#ba1a1a]'
                      }`}
                    >
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
