import React, { useState } from 'react';
import { FilterState, ProductCategory, WarehouseHub, ProductColor, Product, Vendor } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterRailProps {
  filterState: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  onCloseMobile?: () => void;
  vendors: Vendor[];
  products: Product[];
}

export const FilterRail: React.FC<FilterRailProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  onCloseMobile,
  vendors,
  products
}) => {
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    stock: true,
    warehouse: true,
    vendors: true,
    colors: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryToggle = (category: ProductCategory) => {
    const exists = filterState.categories.includes(category);
    const updated = exists
      ? filterState.categories.filter((c) => c !== category)
      : [...filterState.categories, category];
    onFilterChange({ ...filterState, categories: updated });
  };

  const handlePriceRangeToggle = (range: string) => {
    const exists = filterState.priceRanges.includes(range);
    const updated = exists
      ? filterState.priceRanges.filter((r) => r !== range)
      : [...filterState.priceRanges, range];
    onFilterChange({ ...filterState, priceRanges: updated });
  };

  const handleWarehouseToggle = (hub: WarehouseHub) => {
    const exists = filterState.warehouses.includes(hub);
    const updated = exists
      ? filterState.warehouses.filter((h) => h !== hub)
      : [...filterState.warehouses, hub];
    onFilterChange({ ...filterState, warehouses: updated });
  };

  const handleColorToggle = (color: ProductColor) => {
    const exists = filterState.colors.includes(color);
    const updated = exists
      ? filterState.colors.filter((c) => c !== color)
      : [...filterState.colors, color];
    onFilterChange({ ...filterState, colors: updated });
  };

  const categoryCounts: { name: ProductCategory; count: string }[] = (
    ['Électronique & IT', 'Audio & Casques', 'Périphériques & Gaming', 'Câbles & Adaptateurs', 'Housses & Rangement'] as ProductCategory[]
  ).map((name) => ({ name, count: String(products.filter((p) => p.category === name).length) }));

  const handleVendorToggle = (vendorId: string) => {
    const exists = filterState.vendors.includes(vendorId);
    onFilterChange({
      ...filterState,
      vendors: exists ? filterState.vendors.filter((v) => v !== vendorId) : [...filterState.vendors, vendorId]
    });
  };

  return (
    <aside className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#f1f5f9]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-[#0b1c30]" />
          <h2 className="font-headline font-semibold text-base text-[#0b1c30]">Filtres</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetFilters}
            className="text-xs text-[#00685d] hover:text-[#005048] underline font-semibold transition-colors"
            type="button"
          >
            Effacer tout
          </button>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-7 h-7 rounded-lg text-[#64748b] hover:text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center transition-colors"
              title="Fermer les filtres"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Active chips list */}
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {filterState.categories.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 bg-[#eff4ff] border border-[#dce9ff] px-2 py-1 rounded text-xs font-medium text-[#0b1c30]"
          >
            <span>Catégorie: {cat}</span>
            <button
              onClick={() => onFilterChange({ ...filterState, categories: filterState.categories.filter((c) => c !== cat) })}
              className="hover:text-[#ba1a1a] text-[#64748b] transition-colors"
            >
              <X size={13} />
            </button>
          </span>
        ))}

        {filterState.stockLevel !== 'all' && (
          <span className="inline-flex items-center gap-1 bg-[#eff4ff] border border-[#dce9ff] px-2 py-1 rounded text-xs font-medium text-[#0b1c30]">
            <span>
              Stock: {filterState.stockLevel === 'normal' ? 'Sain' : filterState.stockLevel === 'low' ? 'Sous le seuil' : 'Rupture'}
            </span>
            <button
              onClick={() => onFilterChange({ ...filterState, stockLevel: 'all' })}
              className="hover:text-[#ba1a1a] text-[#64748b] transition-colors"
            >
              <X size={13} />
            </button>
          </span>
        )}

        {filterState.colors.map((color) => (
          <span
            key={color}
            className="inline-flex items-center gap-1 bg-[#eff4ff] border border-[#dce9ff] px-2 py-1 rounded text-xs font-medium text-[#0b1c30]"
          >
            <span>Couleur: {color}</span>
            <button
              onClick={() => onFilterChange({ ...filterState, colors: filterState.colors.filter((c) => c !== color) })}
              className="hover:text-[#ba1a1a] text-[#64748b] transition-colors"
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>

      {/* Accordion 1: Catégorie */}
      <div className="border-t border-[#f1f5f9] pt-3">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between text-left text-[#0b1c30] py-1 font-semibold text-xs uppercase tracking-wider"
        >
          <span>Catégorie</span>
          {openSections.category ? <ChevronUp size={18} className="text-[#64748b]" /> : <ChevronDown size={18} className="text-[#64748b]" />}
        </button>

        {openSections.category && (
          <div className="flex flex-col gap-2 mt-2 pl-0.5">
            {categoryCounts.map((cat) => {
              const isChecked = filterState.categories.includes(cat.name);
              return (
                <label
                  key={cat.name}
                  className="flex items-center gap-2.5 cursor-pointer text-xs text-[#3d4946] hover:text-[#0b1c30] select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCategoryToggle(cat.name)}
                    className="w-4 h-4 rounded text-[#00685d] focus:ring-[#00685d] accent-[#00685d] cursor-pointer"
                  />
                  <span className={isChecked ? 'font-semibold text-[#0b1c30]' : ''}>{cat.name}</span>
                  <span className="ml-auto text-[11px] font-mono tabular-nums text-[#64748b]">{cat.count}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion 2: Prix unitaire en FCFA */}
      <div className="border-t border-[#f1f5f9] pt-3">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-left text-[#0b1c30] py-1 font-semibold text-xs uppercase tracking-wider"
        >
          <span>Prix unitaire (FCFA)</span>
          {openSections.price ? <ChevronUp size={18} className="text-[#64748b]" /> : <ChevronDown size={18} className="text-[#64748b]" />}
        </button>

        {openSections.price && (
          <div className="flex flex-col gap-2 mt-2">
            {[
              { label: '0 – 25 000 FCFA', value: '0-25000' },
              { label: '25 000 – 50 000 FCFA', value: '25000-50000' },
              { label: '50 000 – 100 000 FCFA', value: '50000-100000' },
              { label: 'Plus de 100 000 FCFA', value: '100000+' },
            ].map((p) => {
              const isChecked = filterState.priceRanges.includes(p.value);
              return (
                <label
                  key={p.value}
                  className="flex items-center gap-2.5 cursor-pointer text-xs text-[#3d4946] hover:text-[#0b1c30] select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handlePriceRangeToggle(p.value)}
                    className="w-4 h-4 rounded text-[#00685d] focus:ring-[#00685d] accent-[#00685d] cursor-pointer"
                  />
                  <span className={isChecked ? 'font-semibold text-[#0b1c30]' : ''}>{p.label}</span>
                </label>
              );
            })}

            {/* Min / Max inputs in FCFA */}
            <div className="flex items-center gap-2 mt-2 pt-1">
              <div className="flex-1 bg-[#eff4ff] px-2 py-1.5 rounded-lg flex flex-col border border-transparent focus-within:border-[#00685d]">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Min</span>
                <input
                  type="number"
                  step="5000"
                  value={filterState.minPrice}
                  onChange={(e) => onFilterChange({ ...filterState, minPrice: Number(e.target.value) || 0 })}
                  className="bg-transparent text-xs font-semibold text-[#0b1c30] focus:outline-none w-full"
                />
              </div>
              <span className="text-[#94a3b8] font-semibold">–</span>
              <div className="flex-1 bg-[#eff4ff] px-2 py-1.5 rounded-lg flex flex-col border border-transparent focus-within:border-[#00685d]">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Max</span>
                <input
                  type="number"
                  step="5000"
                  value={filterState.maxPrice}
                  onChange={(e) => onFilterChange({ ...filterState, maxPrice: Number(e.target.value) || 200000 })}
                  className="bg-transparent text-xs font-semibold text-[#0b1c30] focus:outline-none w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 3: Niveau de Stock */}
      <div className="border-t border-[#f1f5f9] pt-3">
        <button
          onClick={() => toggleSection('stock')}
          className="w-full flex items-center justify-between text-left text-[#0b1c30] py-1 font-semibold text-xs uppercase tracking-wider"
        >
          <span>Niveau de Stock</span>
          {openSections.stock ? <ChevronUp size={18} className="text-[#64748b]" /> : <ChevronDown size={18} className="text-[#64748b]" />}
        </button>

        {openSections.stock && (
          <div className="flex flex-col gap-2 mt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#0b1c30] select-none">
              <input
                type="radio"
                name="stock_level"
                checked={filterState.stockLevel === 'all'}
                onChange={() => onFilterChange({ ...filterState, stockLevel: 'all' })}
                className="w-4 h-4 accent-[#00685d] cursor-pointer"
              />
              <span>Tous les stocks</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#3d4946] hover:text-[#0b1c30] select-none">
              <input
                type="radio"
                name="stock_level"
                checked={filterState.stockLevel === 'normal'}
                onChange={() => onFilterChange({ ...filterState, stockLevel: 'normal' })}
                className="w-4 h-4 accent-[#00685d] cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#008376]"></span> Stock sain
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#3d4946] hover:text-[#0b1c30] select-none">
              <input
                type="radio"
                name="stock_level"
                checked={filterState.stockLevel === 'low'}
                onChange={() => onFilterChange({ ...filterState, stockLevel: 'low' })}
                className="w-4 h-4 accent-[#00685d] cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span> Sous le seuil d'alerte
              </span>
              <span className="ml-auto bg-[#ffdad6] text-[#93000a] text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
                {products.filter((p) => p.stock <= p.lowStockThreshold).length}
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#3d4946] hover:text-[#0b1c30] select-none">
              <input
                type="radio"
                name="stock_level"
                checked={filterState.stockLevel === 'out_of_stock'}
                onChange={() => onFilterChange({ ...filterState, stockLevel: 'out_of_stock' })}
                className="w-4 h-4 accent-[#00685d] cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#64748b]"></span> Rupture
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Accordion 4: Dépôt & Magasin Source */}
      <div className="border-t border-[#f1f5f9] pt-3">
        <button
          onClick={() => toggleSection('warehouse')}
          className="w-full flex items-center justify-between text-left text-[#0b1c30] py-1 font-semibold text-xs uppercase tracking-wider"
        >
          <span>Dépôt Source</span>
          {openSections.warehouse ? <ChevronUp size={18} className="text-[#64748b]" /> : <ChevronDown size={18} className="text-[#64748b]" />}
        </button>

        {openSections.warehouse && (
          <div className="flex flex-col gap-2 mt-2">
            {[
              'Dépôt Central Treichville',
              'Point Relais Cocody',
              'Dépôt Yopougon',
              'Hub Express Plateau',
            ].map((hub) => {
              const isChecked = filterState.warehouses.includes(hub as WarehouseHub);
              return (
                <label
                  key={hub}
                  className="flex items-center gap-2.5 cursor-pointer text-xs text-[#3d4946] hover:text-[#0b1c30] select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleWarehouseToggle(hub as WarehouseHub)}
                    className="w-4 h-4 rounded text-[#00685d] focus:ring-[#00685d] accent-[#00685d] cursor-pointer"
                  />
                  <span className={isChecked ? 'font-semibold text-[#0b1c30]' : ''}>{hub}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion : Vendeurs */}
      {vendors.length > 0 && (
        <div className="border-t border-[#f1f5f9] pt-3">
          <button
            onClick={() => toggleSection('vendors')}
            className="w-full flex items-center justify-between text-left text-[#0b1c30] py-1 font-semibold text-xs uppercase tracking-wider"
          >
            <span>Vendeur</span>
            {openSections.vendors ? <ChevronUp size={18} className="text-[#64748b]" /> : <ChevronDown size={18} className="text-[#64748b]" />}
          </button>
          {openSections.vendors && (
            <div className="flex flex-col gap-2 mt-2">
              {vendors.map((v) => {
                const isChecked = filterState.vendors.includes(v.id);
                const count = products.filter((p) => p.vendorId === v.id).length;
                return (
                  <label key={v.id} className="flex items-center gap-2.5 cursor-pointer text-xs text-[#3d4946] hover:text-[#0b1c30] select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleVendorToggle(v.id)}
                      className="w-4 h-4 rounded accent-[#00685d] cursor-pointer"
                    />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.brandColor }} />
                    <span className={`flex-1 truncate ${isChecked ? 'font-semibold text-[#0b1c30]' : ''}`}>{v.shopName}</span>
                    <span className="text-[11px] text-[#94a3b8] tabular-nums">{count}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Accordion 5: Variantes Couleur */}
      <div className="border-t border-[#f1f5f9] pt-3">
        <div className="flex items-center justify-between text-[#0b1c30] py-1">
          <span className="font-semibold text-xs uppercase tracking-wider">Variantes Couleur</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <button
            onClick={() => handleColorToggle('Rouge')}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              filterState.colors.includes('Rouge')
                ? 'bg-[#ba1a1a] text-white font-semibold'
                : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Rouge
          </button>
          <button
            onClick={() => handleColorToggle('Bleu')}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              filterState.colors.includes('Bleu')
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Bleu
          </button>
          <button
            onClick={() => handleColorToggle('Jaune')}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              filterState.colors.includes('Jaune')
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Jaune
          </button>
          <button
            onClick={() => handleColorToggle('Noir')}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              filterState.colors.includes('Noir')
                ? 'bg-[#213145] text-white font-semibold'
                : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#0b1c30]"></span> Noir
          </button>
        </div>
      </div>
    </aside>
  );
};
