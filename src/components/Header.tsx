import React, { useRef, useEffect, useState } from 'react';
import { formatFCFA } from '../utils/format';
import { Search, X, ShoppingBag, Receipt, AlertTriangle, Bot, LogOut, Globe, ChevronDown, Store } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  lowStockCount: number;
  cartTotalCount: number;
  cartTotalAmount: number;
  onOpenCart: () => void;
  onOpenQuickSale: () => void;
  onOpenLowStock: () => void;
  onOpenAgent?: () => void;
  storeLabel: string;
  user: { name: string; roleLabel: string; initials: string; color: string };
  onLogout: () => void;
  onViewMarketplace: () => void;
  onOpenMyShop?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  lowStockCount,
  cartTotalCount,
  cartTotalAmount,
  onOpenCart,
  onOpenQuickSale,
  onOpenLowStock,
  onOpenAgent,
  storeLabel,
  user,
  onLogout,
  onViewMarketplace,
  onOpenMyShop
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);

  // Keyboard shortcut ⌘+F / Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 lg:left-[72px] right-0 h-16 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] shadow-xs z-40 flex items-center justify-between px-3 sm:px-6">
      {/* Brand & Store identifier (Single Store: DJASSA Boutique Principale) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#00685d] text-white flex items-center justify-center font-headline font-bold text-base shadow-xs tracking-tight">
          DJ
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="font-headline font-bold text-sm sm:text-base tracking-wider text-[#0b1c30] leading-none">
            DJASSA
          </span>
          <span className="text-[10px] text-[#00685d] font-semibold tracking-wide max-w-[9rem] truncate">
            {storeLabel}
          </span>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="flex-1 min-w-0 max-w-sm sm:max-w-md mx-2 sm:mx-6">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3 text-[#64748b]" />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 sm:h-10 pl-9 pr-8 sm:pr-14 bg-[#eff4ff] text-xs text-[#0b1c30] placeholder:text-[#64748b] rounded-lg border border-transparent focus:border-[#00685d] focus:bg-white focus:outline-none transition-all"
            placeholder="Rechercher produit, SKU, référence..."
            type="text"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[#64748b] hover:text-[#0b1c30]"
            >
              <X size={14} />
            </button>
          ) : (
            <span className="absolute right-2.5 sm:right-3 text-[10px] font-semibold text-[#64748b] bg-[#dce9ff] px-1.5 py-0.5 rounded hidden sm:inline-block">
              ⌘ + F
            </span>
          )}
        </div>
      </div>

      {/* Right side: Cart with badge, Quick Sale Action & Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Panier (Cart) Button with dynamic article counter */}
        <button
          onClick={onOpenCart}
          className={`relative h-9 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
            cartTotalCount > 0
              ? 'bg-[#00685d] text-white hover:bg-[#005048]'
              : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
          }`}
          title="Consulter le panier et valider la commande"
        >
          <ShoppingBag size={18} />
          <span className="hidden md:inline">Panier</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold leading-tight ${
              cartTotalCount > 0 ? 'bg-white text-[#00685d]' : 'bg-[#dce9ff] text-[#0b1c30]'
            }`}
          >
            {cartTotalCount}
          </span>
          {cartTotalCount > 0 && (
            <span className="hidden xl:inline text-[11px] font-medium opacity-90 border-l border-white/30 pl-1.5">
              {formatFCFA(cartTotalAmount)}
            </span>
          )}
        </button>

        {/* Quick sale button */}
        <button
          onClick={onOpenQuickSale}
          className="h-9 px-2.5 sm:px-3 bg-white hover:bg-[#eff4ff] border border-[#e2e8f0] text-[#00685d] rounded-lg text-xs font-semibold hidden sm:flex items-center gap-1 transition-all"
          title="Encaisser un article unique"
        >
          <Receipt size={17} />
          <span className="hidden sm:inline">Vente Directe</span>
        </button>

        {/* Low Stock Warning pill if any */}
        {lowStockCount > 0 && (
          <button
            onClick={onOpenLowStock}
            className="h-9 px-2 sm:px-2.5 bg-[#ffdad6] hover:bg-[#ffcdc7] text-[#93000a] rounded-lg text-xs font-semibold hidden sm:flex items-center gap-1 transition-colors"
            title={`${lowStockCount} article(s) en stock critique`}
          >
            <AlertTriangle size={16} />
            <span className="font-mono text-[11px]">{lowStockCount}</span>
          </button>
        )}

        {/* Agent IA Copilot Button */}
        {onOpenAgent && (
          <button
            onClick={onOpenAgent}
            className="relative h-9 px-2.5 sm:px-3 bg-gradient-to-r from-[#00685d] to-[#008376] hover:from-[#005048] hover:to-[#00685d] text-white rounded-lg text-xs font-bold hidden md:flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            title="Ouvrir l'Agent IA de Réassort & Stocks"
          >
            <Bot size={18} />
            <span className="hidden md:inline">Agent IA</span>
            {lowStockCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#f87171] animate-ping" />
            )}
          </button>
        )}

        {/* Menu utilisateur */}
        <div ref={menuRef} className="relative pl-1.5 border-l border-[#e2e8f0]">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1.5 h-9 pl-1 pr-1.5 rounded-lg hover:bg-[#eff4ff] transition-colors"
          >
            <span
              className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: user.color }}
            >
              {user.initials}
            </span>
            <ChevronDown size={14} className="text-[#64748b] hidden sm:block" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-60 bg-white border border-[#e2e8f0] rounded-xl shadow-xl py-1.5 z-50 animate-rise">
              <div className="px-3.5 py-2 border-b border-[#f1f5f9]">
                <span className="block text-sm font-semibold text-[#0b1c30] truncate">{user.name}</span>
                <span className="block text-[11px] text-[#64748b]">{user.roleLabel}</span>
              </div>
              {onOpenMyShop && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenMyShop();
                  }}
                  className="w-full px-3.5 py-2 text-left text-sm text-[#0b1c30] hover:bg-[#f8f9ff] flex items-center gap-2.5"
                >
                  <Store size={16} className="text-[#64748b]" /> Ma boutique
                </button>
              )}
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onViewMarketplace();
                }}
                className="w-full px-3.5 py-2 text-left text-sm text-[#0b1c30] hover:bg-[#f8f9ff] flex items-center gap-2.5"
              >
                <Globe size={16} className="text-[#64748b]" /> Voir la marketplace
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-3.5 py-2 text-left text-sm text-[#ba1a1a] hover:bg-[#fdecec] flex items-center gap-2.5"
              >
                <LogOut size={16} /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
