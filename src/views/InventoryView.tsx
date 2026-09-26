import React, { useState, useMemo, useEffect } from 'react';
import { Product, FilterState, SortOption, ViewMode, CartItem, Vendor } from '../types/inventory';
import { FilterRail } from '../components/FilterRail';
import { ProductCard } from '../components/ProductCard';
import { ProductListView } from '../components/ProductListView';
import { formatFCFA } from '../utils/format';

interface InventoryViewProps {
  products: Product[];
  filterState: FilterState;
  cartItems: CartItem[];
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onOpenAdjustModal: (product: Product) => void;
  onOpenQuickSellModal: (product: Product) => void;
  onOpenNewProductModal: () => void;
  onOpenBulkAdjustModal: (selectedIds: string[]) => void;
  vendors: Vendor[];
  onSelectProduct: (product: Product) => void;
  onNavigateToCashflow: () => void;
  onOpenCart?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  filterState,
  cartItems,
  onFilterChange,
  onResetFilters,
  onToggleFavorite,
  onAddToCart,
  onOpenAdjustModal,
  onOpenQuickSellModal,
  onOpenNewProductModal,
  onOpenBulkAdjustModal,
  onSelectProduct,
  onNavigateToCashflow,
  onOpenCart,
  vendors
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('rating_desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = 8;

  // Map of cart quantities
  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach((ci) => {
      map[ci.product.id] = ci.quantity;
    });
    return map;
  }, [cartItems]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (filterState.searchQuery.trim()) {
        const query = filterState.searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesHub = p.warehouseLocation.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesHub && !matchesCat) return false;
      }

      // Categories
      if (filterState.categories.length > 0) {
        if (!filterState.categories.includes(p.category)) return false;
      }

      // Stock Level : basé sur le seuil d'alerte propre à chaque article
      if (filterState.stockLevel === 'normal' && p.stock <= p.lowStockThreshold) return false;
      if (filterState.stockLevel === 'low' && p.stock > p.lowStockThreshold) return false;
      if (filterState.stockLevel === 'out_of_stock' && p.stock > 0) return false;

      // Vendeurs
      if (filterState.vendors.length > 0) {
        if (!p.vendorId || !filterState.vendors.includes(p.vendorId)) return false;
      }

      // Warehouses
      if (filterState.warehouses.length > 0) {
        if (!filterState.warehouses.includes(p.warehouseHub)) return false;
      }

      // Colors
      if (filterState.colors.length > 0) {
        if (!filterState.colors.includes(p.color)) return false;
      }

      // Price min / max
      if (p.price < filterState.minPrice) return false;
      if (filterState.maxPrice > 0 && p.price > filterState.maxPrice) return false;

      // Price ranges
      if (filterState.priceRanges.length > 0) {
        const matchesRange = filterState.priceRanges.some((range) => {
          if (range === '0-25000') return p.price <= 25000;
          if (range === '25000-50000') return p.price > 25000 && p.price <= 50000;
          if (range === '50000-100000') return p.price > 50000 && p.price <= 100000;
          if (range === '100000+') return p.price > 100000;
          return true;
        });
        if (!matchesRange) return false;
      }

      return true;
    });
  }, [products, filterState]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortOption === 'rating_desc') {
      return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    }
    if (sortOption === 'price_asc') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortOption === 'price_desc') {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortOption === 'stock_asc') {
      return list.sort((a, b) => a.stock - b.stock);
    }
    if (sortOption === 'stock_desc') {
      return list.sort((a, b) => b.stock - a.stock);
    }
    if (sortOption === 'sales_desc') {
      return list.sort((a, b) => b.soldCount - a.soldCount);
    }
    return list;
  }, [filteredProducts, sortOption]);

  // Revenir à la première page dès que les critères changent (sinon page vide)
  useEffect(() => {
    setCurrentPage(1);
  }, [filterState, sortOption]);

  // Ne garder sélectionnés que les articles encore visibles
  useEffect(() => {
    setSelectedProductIds((prev) => prev.filter((id) => filteredProducts.some((p) => p.id === id)));
  }, [filteredProducts]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (all: boolean) => {
    if (all) {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleRemoveCategory = (cat: string) => {
    onFilterChange({
      ...filterState,
      categories: filterState.categories.filter((c) => c !== cat)
    });
  };

  const handleRemoveStockLevel = () => {
    onFilterChange({
      ...filterState,
      stockLevel: 'all'
    });
  };

  const handleRemoveWarehouse = (w: string) => {
    onFilterChange({
      ...filterState,
      warehouses: filterState.warehouses.filter((wh) => wh !== w)
    });
  };

  const handleRemoveColor = (col: string) => {
    onFilterChange({
      ...filterState,
      colors: filterState.colors.filter((c) => c !== col)
    });
  };

  const hasActiveFilters =
    filterState.categories.length > 0 ||
    filterState.stockLevel !== 'all' ||
    filterState.warehouses.length > 0 ||
    filterState.colors.length > 0 ||
    filterState.priceRanges.length > 0 ||
    filterState.vendors.length > 0 ||
    filterState.searchQuery.trim().length > 0;

  // Indicateurs calculés sur le catalogue réel
  const { totalStockValue, avgTurnover, availability } = useMemo(() => {
    const value = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const turnover = products.length ? products.reduce((acc, p) => acc + p.turnoverDays, 0) / products.length : 0;
    const available = products.length ? (products.filter((p) => p.stock > 0).length / products.length) * 100 : 0;
    return { totalStockValue: value, avgTurnover: turnover, availability: available };
  }, [products]);

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.shopName ?? 'Vendeur';
  const activeVendor = filterState.vendors.length === 1 ? vendors.find((v) => v.id === filterState.vendors[0]) : undefined;
  const activeVendorIsEmpty = Boolean(activeVendor) && products.every((p) => p.vendorId !== activeVendor!.id);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['SKU', 'Nom', 'Categorie', 'Prix_FCFA', 'Cout_FCFA', 'Stock', 'Seuil_Alerte', 'Depot', 'Emplacement'];
    const rows = filteredProducts.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.price,
      p.costPrice,
      p.stock,
      p.lowStockThreshold,
      `"${p.warehouseHub}"`,
      `"${p.warehouseLocation}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventaire_djassa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortLabels: Record<SortOption, string> = {
    rating_desc: 'Mieux notés',
    price_asc: 'Prix : Moins cher',
    price_desc: 'Prix : Plus cher',
    stock_asc: 'Stock : Moins élevé',
    stock_desc: 'Stock : Plus élevé',
    sales_desc: 'Plus vendus'
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 py-4 sm:py-6 gap-5">
      {/* 1. Header & Title Strip with Breadcrumb */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <span>Djassa</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-[#00685d]">Inventaire & Catalogue Marchand</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="font-headline font-semibold text-xl sm:text-2xl text-[#0b1c30] tracking-tight">
              Inventaire des Produits
            </h1>
            <p className="text-xs text-[#64748b] mt-0.5">
              {activeVendor
                ? `${filteredProducts.length} article${filteredProducts.length > 1 ? 's' : ''} de la boutique ${activeVendor.shopName}`
                : `${filteredProducts.length} article${filteredProducts.length > 1 ? 's' : ''} sur ${products.length} dans le catalogue DJASSA`}
            </p>
          </div>

          {/* Action buttons: Nouvel Article, Ajustement en Masse, Exporter */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="h-9 px-3 bg-white hover:bg-[#eff4ff] border border-[#e2e8f0] text-[#0b1c30] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Exporter l'inventaire en CSV"
            >
              <span className="material-symbols-outlined text-[17px]">file_download</span>
              <span className="hidden sm:inline">Exporter CSV</span>
            </button>

            <button
              onClick={() => onOpenBulkAdjustModal(selectedProductIds)}
              className="h-9 px-3 bg-white hover:bg-[#eff4ff] border border-[#e2e8f0] text-[#00685d] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Mettre à jour les prix ou stocks par lot"
            >
              <span className="material-symbols-outlined text-[17px]">checklist</span>
              <span className="hidden md:inline">Ajustement Masse</span>
            </button>

            <button
              onClick={onOpenNewProductModal}
              className="h-9 px-3.5 bg-[#00685d] hover:bg-[#005048] active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Ajouter une nouvelle référence au catalogue"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>Nouveau Produit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Controls & Active Filter Chips Bar */}
      <div className="flex flex-col gap-3">
        {/* Active Chips Strip */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mr-1">
              Filtres actifs :
            </span>

            {filterState.categories.map((cat) => (
              <span
                key={cat}
                className="bg-[#eff4ff] text-[#0b1c30] border border-[#dce9ff] text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
              >
                <span>Catégorie: {cat}</span>
                <button
                  onClick={() => handleRemoveCategory(cat)}
                  className="hover:text-[#ba1a1a] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}

            {filterState.stockLevel !== 'all' && (
              <span className="bg-[#eff4ff] text-[#0b1c30] border border-[#dce9ff] text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span>
                  Disponibilité: {filterState.stockLevel === 'normal' ? 'Stock sain' : filterState.stockLevel === 'low' ? 'Sous le seuil' : 'Rupture'}
                </span>
                <button
                  onClick={handleRemoveStockLevel}
                  className="hover:text-[#ba1a1a] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}

            {filterState.warehouses.map((wh) => (
              <span
                key={wh}
                className="bg-[#eff4ff] text-[#0b1c30] border border-[#dce9ff] text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
              >
                <span>Dépôt: {wh}</span>
                <button
                  onClick={() => handleRemoveWarehouse(wh)}
                  className="hover:text-[#ba1a1a] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}

            {filterState.vendors.map((vid) => (
              <span
                key={vid}
                className="bg-[#eefaf6] text-[#00685d] border border-[#b7e4d8] text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">storefront</span>
                <span>{vendorName(vid)}</span>
                <button
                  onClick={() => onFilterChange({ ...filterState, vendors: filterState.vendors.filter((v) => v !== vid) })}
                  className="hover:text-[#ba1a1a] transition-colors"
                  aria-label={`Retirer le filtre ${vendorName(vid)}`}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}

            {filterState.colors.map((col) => (
              <span
                key={col}
                className="bg-[#eff4ff] text-[#0b1c30] border border-[#dce9ff] text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
              >
                <span>Couleur: {col}</span>
                <button
                  onClick={() => handleRemoveColor(col)}
                  className="hover:text-[#ba1a1a] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            ))}

            <button
              onClick={onResetFilters}
              className="text-xs text-[#00685d] font-semibold hover:underline ml-1 cursor-pointer"
            >
              Effacer tout
            </button>
          </div>
        )}

        {/* Action Bar: Mobile Filter Toggle, View Switcher (Grid/List), Sort dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-[#e2e8f0] shadow-xs">
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden h-8 px-2.5 bg-[#eff4ff] text-[#00685d] rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Filtres</span>
            </button>

            {/* View Mode Switcher: Grid vs List */}
            <div className="flex items-center bg-[#eff4ff] p-0.5 rounded-lg border border-[#e2e8f0]">
              <button
                onClick={() => setViewMode('grid')}
                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#00685d] shadow-2xs font-bold'
                    : 'text-[#64748b] hover:text-[#0b1c30]'
                }`}
                title="Affichage en Grille"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#00685d] shadow-2xs font-bold'
                    : 'text-[#64748b] hover:text-[#0b1c30]'
                }`}
                title="Affichage en Liste"
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
              </button>
            </div>

            <span className="text-xs text-[#64748b] hidden sm:inline ml-2">
              <strong className="text-[#0b1c30]">{sortedProducts.length}</strong> références trouvées
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="h-8 px-3 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-[#64748b]">sort</span>
              <span>Trier par : <strong className="text-[#00685d]">{sortLabels[sortOption]}</strong></span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95">
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortOption(key);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#eff4ff] ${
                      sortOption === key ? 'text-[#00685d] font-bold bg-[#eff4ff]/60' : 'text-[#0b1c30]'
                    }`}
                  >
                    <span>{sortLabels[key]}</span>
                    {sortOption === key && (
                      <span className="material-symbols-outlined text-[16px] text-[#00685d]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Layout: Filter Rail (Left) + Content (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Filter Rail (Exact faceted sidebar: 3 columns out of 12) */}
        <div className={`lg:col-span-3 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          <FilterRail
            filterState={filterState}
            vendors={vendors}
            products={products}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            onCloseMobile={() => setShowMobileFilters(false)}
          />
        </div>

        {/* Right Catalog Area (9 columns out of 12) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          {/* Selected Bulk Actions Toolbar if items checked */}
          {selectedProductIds.length > 0 && (
            <div className="bg-[#eff4ff] border border-[#008376] p-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
              <span className="font-semibold text-[#00685d]">
                {selectedProductIds.length} article(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenBulkAdjustModal(selectedProductIds)}
                  className="px-3 py-1 bg-[#00685d] text-white rounded-lg font-semibold hover:bg-[#005048] transition-colors"
                >
                  Modifier la sélection
                </button>
                <button
                  onClick={() => setSelectedProductIds([])}
                  className="px-2.5 py-1 text-[#64748b] hover:text-[#0b1c30]"
                >
                  Désélectionner
                </button>
              </div>
            </div>
          )}

          {/* Empty state if nothing matches filters */}
          {sortedProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#64748b]">
                <span className="material-symbols-outlined text-[24px]">search_off</span>
              </div>
              <h3 className="font-headline font-semibold text-base text-[#0b1c30]">
                {activeVendorIsEmpty ? `${activeVendor!.shopName} n'a encore aucun produit` : 'Aucun article ne correspond aux filtres'}
              </h3>
              <p className="text-xs text-[#64748b] max-w-sm">
                {activeVendorIsEmpty
                  ? 'Ajoutez son premier article pour commencer à vendre.'
                  : 'Élargissez vos critères ou réinitialisez les filtres pour revoir tout le catalogue.'}
              </p>
              {activeVendorIsEmpty && (
                <button
                  onClick={onOpenNewProductModal}
                  className="mt-2 px-4 py-2 bg-[#00685d] text-white rounded-lg text-xs font-semibold hover:bg-[#005048] transition-colors"
                >
                  Ajouter un produit pour {activeVendor!.shopName}
                </button>
              )}
              <button
                onClick={onResetFilters}
                className="mt-2 px-4 py-2 bg-[#00685d] text-white rounded-lg text-xs font-semibold hover:bg-[#005048] transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Responsive Product Grid: 4 items per row on xl, 2 on tablet, 1 on small mobile */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={cartQuantities[product.id] || 0}
                  onToggleFavorite={onToggleFavorite}
                  onAddToCart={onAddToCart}
                  onAdjustStock={(p, e) => {
                    e.stopPropagation();
                    onOpenAdjustModal(p);
                  }}
                  onQuickSell={(p, e) => {
                    e.stopPropagation();
                    onOpenQuickSellModal(p);
                  }}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          ) : (
            /* Tabular List View */
            <ProductListView
              products={paginatedProducts}
              selectedIds={selectedProductIds}
              cartQuantities={cartQuantities}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onAddToCart={onAddToCart}
              onAdjustStock={(p, e) => {
                e.stopPropagation();
                onOpenAdjustModal(p);
              }}
              onQuickSell={(p, e) => {
                e.stopPropagation();
                onOpenQuickSellModal(p);
              }}
              onSelectProduct={onSelectProduct}
            />
          )}

          {/* Quick Summary Data Strip in FCFA (Exact from screenshot) */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-4 mt-1">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#acedda] flex items-center justify-center text-[#00685d]">
                <span className="material-symbols-outlined text-[22px]">inventory</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-sm text-[#0b1c30]">
                  Valeur totale en stock : {formatFCFA(totalStockValue)}
                </span>
                <span className="text-xs text-[#64748b]">
                  Rotation moyenne : {avgTurnover.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} jours • Disponibilité : {availability.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % des références
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onOpenCart && cartItems.length > 0 && (
                <button
                  onClick={onOpenCart}
                  className="px-3.5 py-1.5 bg-[#00685d] text-white rounded-lg text-xs font-bold hover:bg-[#005048] transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                  <span>Voir le Panier ({cartItems.reduce((acc, ci) => acc + ci.quantity, 0)})</span>
                </button>
              )}
              <button
                onClick={onNavigateToCashflow}
                className="px-3.5 py-1.5 bg-[#eff4ff] text-[#00685d] border border-[#dce9ff] rounded-lg text-xs font-semibold hover:bg-[#dce9ff] transition-colors flex items-center gap-1"
              >
                <span>Bilan & Caisse</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4 px-1">
              <span className="text-xs text-[#64748b]">
                Page <strong className="text-[#0b1c30]">{currentPage}</strong> sur{' '}
                <strong className="text-[#0b1c30]">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:text-[#0b1c30] hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === page
                        ? 'bg-[#00685d] text-white shadow-2xs'
                        : 'text-[#64748b] hover:bg-white border border-[#e2e8f0]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:text-[#0b1c30] hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
