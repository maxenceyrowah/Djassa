import React from 'react';
import { Product } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { Star, StarHalf, Heart, ShoppingBag, MapPin, Receipt, Calendar } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  cartQuantity?: number;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onAdjustStock: (product: Product, e: React.MouseEvent) => void;
  onQuickSell: (product: Product, e: React.MouseEvent) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartQuantity = 0,
  onToggleFavorite,
  onAddToCart,
  onAdjustStock,
  onQuickSell,
  onSelectProduct
}) => {
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock === 0;

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = rating >= i;
      const isHalf = !isFilled && rating >= i - 0.5;
      stars.push(
        isFilled ? (
          <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
        ) : isHalf ? (
          <StarHalf key={i} size={13} className="fill-amber-400 text-amber-400" />
        ) : (
          <Star key={i} size={13} className="text-amber-300" />
        )
      );
    }
    return stars;
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="bg-white rounded-xl p-3 shadow-xs border border-[#e2e8f0] flex flex-col justify-between hover:shadow-md hover:border-[#008376] transition-all cursor-pointer group relative"
    >
      {/* Media Canvas */}
      <div className="relative w-full aspect-square bg-[#eff4ff] rounded-lg flex items-center justify-center p-3 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Top Badges: Favorite & Cart Counter */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          {cartQuantity > 0 && (
            <span className="bg-[#00685d] text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 animate-in zoom-in-75">
              <ShoppingBag size={11} />
              {cartQuantity}
            </span>
          )}
          <button
            onClick={(e) => onToggleFavorite(product.id, e)}
            className={`w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs transition-colors ${
              product.isFavorite ? 'text-[#ba1a1a]' : 'text-[#64748b] hover:text-[#ba1a1a]'
            }`}
            title={product.isFavorite ? 'Retirer des favoris' : 'Mettre en favori'}
            type="button"
          >
            <Heart
              size={15}
              className={product.isFavorite ? 'fill-[#ba1a1a] text-[#ba1a1a]' : 'text-[#64748b]'}
            />
          </button>
        </div>

        {/* Stock status pill */}
        <div className="absolute bottom-2 left-2 z-10">
          {isOutOfStock ? (
            <span className="bg-[#e5eeff] text-[#0b1c30] font-semibold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]"></span>
              Rupture de stock
            </span>
          ) : isLowStock ? (
            <span className="bg-[#ffdad6] text-[#93000a] font-bold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
              {product.stock} restant (Faible)
            </span>
          ) : (
            <span className="bg-[#acedda] text-[#065043] font-bold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685d]"></span>
              {product.stock} en stock
            </span>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col mt-2.5">
        <h3 className="font-headline font-semibold text-sm text-[#0b1c30] truncate" title={product.name}>
          {product.name}
        </h3>

        {/* Ratings & reviews */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex text-amber-500">
            {renderStars(product.rating)}
          </div>
          <span className="text-[11px] text-[#64748b]">
            {product.reviewCountLabel || `${product.reviewCount} Avis`}
          </span>
        </div>

        {/* Warehouse geo tag */}
        <div className="flex items-center gap-1 text-[#64748b] text-xs mt-1">
          <MapPin size={13} />
          <span className="truncate">{product.warehouseLocation}</span>
        </div>

        {/* Price & sales in FCFA */}
        <div className="flex items-baseline justify-between mt-2 pt-1.5 border-t border-[#f1f5f9]">
          <span className="font-headline font-bold text-base text-[#00685d] tabular-nums">
            {formatFCFA(product.price)}
          </span>
          <span className="text-[11px] text-[#64748b] tabular-nums">
            {product.soldCount.toLocaleString()} vendus
          </span>
        </div>
      </div>

      {/* Action Buttons: Panier, Vente directe, Stock */}
      <div className="mt-3 flex flex-col gap-1.5">
        {/* Main Action: + Panier */}
        <button
          onClick={(e) => onAddToCart(product, e)}
          disabled={isOutOfStock}
          className={`w-full h-8.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 ${
            cartQuantity > 0
              ? 'bg-[#acedda] text-[#065043] hover:bg-[#92dfcc]'
              : 'bg-[#00685d] text-white hover:bg-[#005048]'
          } disabled:opacity-40 disabled:pointer-events-none`}
          type="button"
          title="Ajouter au panier de commande"
        >
          <ShoppingBag size={15} />
          <span>{cartQuantity > 0 ? `Ajouter encore (+1) [${cartQuantity}]` : '+ Panier'}</span>
        </button>

        {/* Secondary actions: Vendre au comptoir & Ajuster Stock */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={(e) => onQuickSell(product, e)}
            disabled={isOutOfStock}
            className="h-7.5 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00685d] rounded-lg font-medium text-[11px] flex items-center justify-center gap-1 transition-colors border border-[#dce9ff] disabled:opacity-40 disabled:pointer-events-none"
            type="button"
            title="Encaisser immédiatement un seul article"
          >
            <Receipt size={13} />
            <span>Vendre</span>
          </button>

          <button
            onClick={(e) => onAdjustStock(product, e)}
            className="h-7.5 bg-white hover:bg-[#f8f9ff] text-[#64748b] hover:text-[#0b1c30] rounded-lg font-medium text-[11px] flex items-center justify-center gap-1 transition-colors border border-[#e2e8f0]"
            type="button"
            title="Ajuster le stock"
          >
            <Calendar size={13} />
            <span>Stock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
