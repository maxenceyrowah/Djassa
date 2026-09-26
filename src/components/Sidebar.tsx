import React from 'react';
import { ActiveNavScreen } from '../types/inventory';
import { Plus, Bot, ShoppingBag, RotateCcw } from 'lucide-react';
import { Icon } from './Icon';

interface SidebarProps {
  activeScreen: ActiveNavScreen;
  onNavigate: (screen: ActiveNavScreen) => void;
  onOpenNewProduct: () => void;
  onOpenCart?: () => void;
  onOpenAgent?: () => void;
  onResetDemo?: () => void;
  showVendors?: boolean;
  pendingVendorsCount?: number;
  salesCount: number;
  cartCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onNavigate,
  onOpenNewProduct,
  onOpenCart,
  onOpenAgent,
  onResetDemo,
  showVendors = false,
  pendingVendorsCount = 0,
  salesCount,
  cartCount = 0,
  lowStockCount = 0
}) => {
  const navItems: { id: ActiveNavScreen; icon: string; title: string; badge?: number }[] = [
    { id: 'inventory-catalog', icon: 'inventory_2', title: 'Inventaire & Stock' },
    { id: 'sales-orders', icon: 'receipt_long', title: 'Ventes & Commandes', badge: salesCount },
    ...(showVendors
      ? [{ id: 'vendors' as ActiveNavScreen, icon: 'storefront', title: 'Vendeurs & Boutiques', badge: pendingVendorsCount }]
      : []),
    { id: 'cashflow-summary', icon: 'account_balance_wallet', title: 'Caisse & Bilan' },
  ];

  return (
    <>
      {/* Desktop Fixed Left Rail (72px) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[72px] bg-white border-r border-[#e2e8f0] shadow-xs z-50 flex-col items-center py-4 justify-between">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Djassa Brand Icon */}
          <button
            onClick={() => onNavigate('inventory-catalog')}
            className="w-10 h-10 rounded-xl bg-[#00685d] text-white flex items-center justify-center font-headline font-bold text-lg shadow-xs hover:bg-[#005048] transition-colors"
            title="DJASSA - Accueil"
          >
            DJ
          </button>

          {/* Quick Add Product button */}
          <button
            onClick={onOpenNewProduct}
            className="w-11 h-11 rounded-xl bg-[#008376] text-white flex items-center justify-center shadow-xs hover:bg-[#00685d] active:scale-95 transition-all"
            title="Ajouter un nouveau produit (+)"
          >
            <Plus size={22} />
          </button>

          {/* Agent IA Copilot in Desktop Sidebar */}
          {onOpenAgent && (
            <button
              onClick={onOpenAgent}
              className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00685d]/10 to-[#008376]/20 text-[#00685d] hover:bg-[#00685d] hover:text-white flex items-center justify-center transition-all shadow-xs"
              title="Agent IA Réassort & Stocks"
            >
              <Bot size={22} />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ba1a1a] text-white rounded-full text-[9px] font-bold flex items-center justify-center leading-none">
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Icon in Sidebar */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                cartCount > 0
                  ? 'bg-[#acedda] text-[#065043] font-bold shadow-xs hover:bg-[#92dfcc]'
                  : 'text-[#64748b] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
              title="Ouvrir le Panier et Valider la Commande"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#00685d] text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Streamlined Navigation */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            {navItems.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#acedda] text-[#065043] font-semibold shadow-xs'
                      : 'text-[#64748b] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                  }`}
                  title={item.title}
                  aria-label={item.title}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon name={item.icon} size={22} />
                  {item.badge !== undefined && item.badge > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ba1a1a] text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom indicator */}
        <div className="flex flex-col items-center gap-3">
          {onResetDemo && (
            <button
              onClick={onResetDemo}
              className="w-9 h-9 rounded-lg text-[#94a3b8] hover:text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center transition-colors"
              title="Réinitialiser les données de démonstration"
              aria-label="Réinitialiser les données de démonstration"
            >
              <RotateCcw size={17} />
            </button>
          )}
          <div className="text-[10px] font-headline font-bold text-[#64748b] tracking-wider uppercase">FCFA</div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-[#e2e8f0] z-50 flex items-center justify-around px-1 shadow-lg">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 min-w-[52px] rounded-lg text-xs font-medium transition-colors ${
                isActive ? 'text-[#00685d] font-bold' : 'text-[#64748b]'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[10px] mt-0.5">{item.title.split(' ')[0]}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-[#ba1a1a] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {onOpenCart && (
          <button
            onClick={onOpenCart}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 min-w-[52px] rounded-lg text-xs font-medium transition-colors ${
              cartCount > 0 ? 'text-[#00685d] font-bold' : 'text-[#64748b]'
            }`}
          >
            <ShoppingBag size={20} />
            <span className="text-[10px] mt-0.5">Panier</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-[#00685d] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onOpenNewProduct}
          className="w-10 h-10 -mt-4 rounded-full bg-[#00685d] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
          title="Ajouter produit"
        >
          <Plus size={20} />
        </button>
      </nav>
    </>
  );
};
