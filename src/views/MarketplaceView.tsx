import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Bike,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  ChevronDown,
  LogIn,
  MapPin,
  Search,
  ShoppingBag,
  Smartphone,
  Star,
  Store,
  Warehouse,
  X
} from 'lucide-react';
import { Product, ProductCategory, Vendor } from '../types/inventory';
import { ALL_CATEGORIES, ALL_HUBS, vendorInitials } from '../utils/vendor';
import { formatFCFA } from '../utils/format';

interface MarketplaceViewProps {
  products: Product[];
  vendors: Vendor[];
  cartQuantities: Record<string, number>;
  cartCount: number;
  cartTotal: number;
  onAddToCart: (product: Product) => void;
  onOpenCart: () => void;
  onSelectProduct: (product: Product) => void;
  onLogin: () => void;
  onBecomeVendor: () => void;
  /** Présent quand un admin ou un vendeur connecté consulte la vitrine. */
  backOffice?: { label: string; onOpen: () => void };
  onProLogin: () => void;
  /** Client connecté : remplace « Se connecter » par son menu de compte. */
  customer?: { name: string; initials: string; onOpenOrders: () => void; onLogout: () => void; ordersCount: number };
}

type PublicSort = 'popular' | 'price_asc' | 'price_desc' | 'rating';

const SORT_LABELS: Record<PublicSort, string> = {
  popular: 'Les plus vendus',
  rating: 'Les mieux notés',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant'
};

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  products,
  vendors,
  cartQuantities,
  cartCount,
  cartTotal,
  onAddToCart,
  onOpenCart,
  onSelectProduct,
  onLogin,
  onBecomeVendor,
  backOffice,
  onProLogin,
  customer
}) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountOpen) return;
    const close = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [accountOpen]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [shopId, setShopId] = useState<string | null>(null);
  const [sort, setSort] = useState<PublicSort>('popular');

  const activeVendors = useMemo(() => vendors.filter((v) => v.status === 'actif'), [vendors]);
  const vendorById = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v])), [vendors]);
  const shop = shopId ? vendorById[shopId] : undefined;

  // Seuls les articles DJASSA et ceux des boutiques actives sont visibles du public.
  const publicProducts = useMemo(
    () => products.filter((p) => !p.vendorId || vendorById[p.vendorId]?.status === 'actif'),
    [products, vendorById]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = publicProducts.filter((p) => {
      if (shopId && p.vendorId !== shopId) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (q) {
        const vendorName = p.vendorId ? vendorById[p.vendorId]?.shopName.toLowerCase() ?? '' : 'djassa';
        if (!p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q) && !vendorName.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...list].sort((a, b) => {
      // Les articles en rupture passent toujours en fin de liste
      if ((a.stock === 0) !== (b.stock === 0)) return a.stock === 0 ? 1 : -1;
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      return b.soldCount - a.soldCount;
    });
    return sorted;
  }, [publicProducts, shopId, category, query, sort, vendorById]);

  const categoryCounts = useMemo(() => {
    const base = shopId ? publicProducts.filter((p) => p.vendorId === shopId) : publicProducts;
    return Object.fromEntries(ALL_CATEGORIES.map((c) => [c, base.filter((p) => p.category === c).length]));
  }, [publicProducts, shopId]);

  const openShop = (id: string | null) => {
    setShopId(id);
    setCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
      {/* En-tête public */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-6">
          <button onClick={() => openShop(null)} className="flex items-center gap-2 shrink-0" aria-label="Accueil DJASSA">
            <span className="w-9 h-9 rounded-xl bg-[#00685d] text-white flex items-center justify-center font-headline font-bold">DJ</span>
            <span className="hidden sm:flex flex-col items-start leading-none">
              <span className="font-headline font-bold text-base tracking-wider text-[#0b1c30]">DJASSA</span>
              <span className="text-[10px] font-semibold text-[#00685d] mt-0.5">Marketplace Abidjan</span>
            </span>
          </button>

          <div className="flex-1 relative max-w-xl">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit, une boutique…"
              aria-label="Rechercher sur la marketplace"
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-[#eff4ff] border border-transparent text-sm focus:outline-none focus:bg-white focus:border-[#00685d]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0b1c30]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onBecomeVendor}
              className="hidden md:flex h-10 px-3 rounded-xl text-sm font-semibold text-[#00685d] hover:bg-[#eefaf6] items-center gap-1.5 transition-colors"
            >
              <Store size={17} /> Vendre sur DJASSA
            </button>
            {!backOffice && (
              <button
                onClick={onProLogin}
                className="hidden sm:flex h-10 px-3 rounded-xl text-sm font-semibold text-[#3d4946] hover:bg-[#f8f9ff] items-center gap-1.5 transition-colors"
              >
                <LayoutDashboard size={17} /> Espace vendeur
              </button>
            )}
            {backOffice ? (
              <button
                onClick={backOffice.onOpen}
                className="h-10 px-3 rounded-xl bg-[#0b1c30] text-white text-sm font-semibold hover:bg-[#1e2f45] flex items-center gap-1.5 transition-colors"
                title={`Retour à l'espace ${backOffice.label}`}
              >
                <LayoutDashboard size={17} />
                <span className="hidden sm:inline">Mon espace</span>
              </button>
            ) : customer ? (
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  className="h-10 pl-1.5 pr-2 rounded-xl border border-[#e2e8f0] hover:bg-[#f8f9ff] flex items-center gap-2 transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#0b1c30] text-white text-[11px] font-bold flex items-center justify-center">
                    {customer.initials}
                  </span>
                  <span className="hidden sm:inline text-sm font-semibold text-[#0b1c30] max-w-[8rem] truncate">
                    {customer.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="text-[#64748b]" />
                </button>
                {accountOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-[#e2e8f0] rounded-xl shadow-xl py-1.5 z-50 animate-rise">
                    <div className="px-3.5 py-2 border-b border-[#f1f5f9]">
                      <span className="block text-sm font-semibold text-[#0b1c30] truncate">{customer.name}</span>
                      <span className="block text-[11px] text-[#64748b]">Compte client</span>
                    </div>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setAccountOpen(false);
                        customer.onOpenOrders();
                      }}
                      className="w-full px-3.5 py-2 text-left text-sm text-[#0b1c30] hover:bg-[#f8f9ff] flex items-center gap-2.5"
                    >
                      <Package size={16} className="text-[#64748b]" /> Mes commandes
                      {customer.ordersCount > 0 && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 rounded-full bg-[#eff4ff] text-[#64748b]">{customer.ordersCount}</span>
                      )}
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setAccountOpen(false);
                        customer.onLogout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-sm text-[#ba1a1a] hover:bg-[#fdecec] flex items-center gap-2.5"
                    >
                      <LogOut size={16} /> Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="h-10 px-3 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] flex items-center gap-1.5 transition-colors"
              >
                <LogIn size={17} />
                <span className="hidden sm:inline">Se connecter</span>
              </button>
            )}
            <button
              onClick={onOpenCart}
              aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
              className={`relative h-10 px-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                cartCount > 0 ? 'bg-[#00685d] text-white hover:bg-[#005048]' : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
              }`}
            >
              <ShoppingBag size={18} />
              <span className="hidden lg:inline tabular-nums">{cartCount > 0 ? formatFCFA(cartTotal) : 'Panier'}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#b45309] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-7">
        {shop ? (
          /* En-tête de boutique */
          <section className="rounded-2xl overflow-hidden bg-white border border-[#e2e8f0] shadow-xs">
            <div className="h-24 sm:h-28" style={{ backgroundColor: shop.brandColor }} />
            <div className="px-5 sm:px-7 pb-5 flex flex-col sm:flex-row sm:items-end gap-4 -mt-8">
              <div
                className="w-16 h-16 rounded-2xl ring-4 ring-white text-white flex items-center justify-center font-headline font-bold text-xl shrink-0"
                style={{ backgroundColor: shop.brandColor }}
              >
                {vendorInitials(shop.shopName)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-headline font-bold text-2xl text-[#0b1c30] flex items-center gap-2">
                  {shop.shopName}
                  <BadgeCheck size={20} className="text-[#00685d]" aria-label="Boutique vérifiée" />
                </h1>
                <p className="text-sm text-[#64748b] mt-0.5">{shop.tagline}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[#64748b]">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {shop.commune}
                  </span>
                  <span className="flex items-center gap-1">
                    <Warehouse size={13} /> Expédié depuis {shop.hub}
                  </span>
                  {shop.deliveryModes.includes('livraison_express') && (
                    <span className="flex items-center gap-1 text-[#00685d] font-semibold">
                      <Bike size={13} /> Livraison 24h
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => openShop(null)}
                className="self-start sm:self-end h-9 px-3 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Toutes les boutiques
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Bannière */}
            <section className="relative overflow-hidden rounded-3xl bg-[#0b1c30] text-white px-6 sm:px-10 py-9 sm:py-12">
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-30"
                style={{ background: 'radial-gradient(circle, #00a38f 0%, transparent 70%)' }}
              />
              <div
                aria-hidden="true"
                className="absolute right-24 -bottom-24 w-72 h-72 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
              />
              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#acedda] bg-white/10 px-2.5 py-1 rounded-full">
                  <MapPin size={12} /> Livré partout à Abidjan
                </span>
                <h1 className="font-headline font-bold text-3xl sm:text-4xl leading-tight mt-4">
                  Le high-tech des boutiques d'Abidjan, livré chez vous en 24h.
                </h1>
                <p className="text-sm sm:text-base text-white/75 mt-3 leading-relaxed">
                  Claviers, audio, gaming, accessoires : achetez auprès de vendeurs vérifiés et payez avec Wave, Orange Money, MTN
                  MoMo ou en espèces.
                </p>
                <div className="flex flex-wrap gap-2 mt-6">
                  <a
                    href="#catalogue"
                    className="h-11 px-5 rounded-xl bg-white text-[#0b1c30] text-sm font-semibold flex items-center gap-2 hover:bg-[#eefaf6] transition-colors"
                  >
                    Voir les produits <ChevronRight size={16} />
                  </a>
                  <button
                    onClick={onBecomeVendor}
                    className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Store size={16} /> Ouvrir ma boutique
                  </button>
                </div>
              </div>
            </section>

            {/* Arguments */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Reassurance icon={<Smartphone size={18} />} title="Paiement mobile" text="Wave, Orange Money, MTN MoMo ou espèces" />
              <Reassurance icon={<Bike size={18} />} title="Livraison express" text="Sous 24h dans le Grand Abidjan · 2 000 FCFA" />
              <Reassurance icon={<Warehouse size={18} />} title="4 points de retrait" text="Treichville, Cocody, Yopougon, Plateau · gratuit" />
            </section>

            {/* Boutiques */}
            {activeVendors.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <h2 className="font-headline font-bold text-lg text-[#0b1c30]">Boutiques à la une</h2>
                  <button onClick={onBecomeVendor} className="text-xs font-semibold text-[#00685d] hover:underline">
                    Vous vendez ? Rejoignez-nous
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {activeVendors.map((v) => {
                    const count = publicProducts.filter((p) => p.vendorId === v.id).length;
                    return (
                      <button
                        key={v.id}
                        onClick={() => openShop(v.id)}
                        className="shrink-0 w-64 text-left bg-white rounded-2xl border border-[#e2e8f0] p-4 hover:shadow-md hover:border-[#cbd5e1] transition-all flex items-center gap-3"
                      >
                        <span
                          className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-headline font-bold shrink-0"
                          style={{ backgroundColor: v.brandColor }}
                        >
                          {vendorInitials(v.shopName)}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 font-semibold text-sm text-[#0b1c30] truncate">
                            {v.shopName} <BadgeCheck size={14} className="text-[#00685d] shrink-0" />
                          </span>
                          <span className="block text-[11px] text-[#64748b] truncate">
                            {v.commune} · {count} produit{count > 1 ? 's' : ''}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* Catalogue */}
        <section id="catalogue" className="flex flex-col gap-4 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              <CategoryChip active={category === 'all'} onClick={() => setCategory('all')} label="Tout" />
              {ALL_CATEGORIES.filter((c) => categoryCounts[c] > 0).map((c) => (
                <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)} label={c} count={categoryCounts[c]} />
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-[#64748b] shrink-0">
              Trier
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as PublicSort)}
                className="h-9 px-2.5 rounded-lg bg-white border border-[#e2e8f0] text-xs font-semibold text-[#0b1c30] focus:outline-none focus:border-[#00685d]"
              >
                {(Object.keys(SORT_LABELS) as PublicSort[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center flex flex-col items-center gap-3">
              <Search size={26} className="text-[#94a3b8]" />
              <h3 className="font-headline font-semibold text-base text-[#0b1c30]">Aucun produit trouvé</h3>
              <p className="text-sm text-[#64748b]">Essayez un autre mot-clé ou une autre catégorie.</p>
              <button
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
                className="mt-1 h-9 px-4 rounded-lg bg-[#00685d] text-white text-xs font-semibold hover:bg-[#005048]"
              >
                Voir tout le catalogue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {visible.map((p) => (
                <PublicProductCard
                  key={p.id}
                  product={p}
                  vendor={p.vendorId ? vendorById[p.vendorId] : undefined}
                  inCart={cartQuantities[p.id] ?? 0}
                  onAdd={() => onAddToCart(p)}
                  onOpen={() => onSelectProduct(p)}
                  onOpenShop={(id) => openShop(id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Pied de page */}
      <footer className="border-t border-[#e2e8f0] bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid sm:grid-cols-3 gap-6 text-xs text-[#64748b]">
          <div>
            <span className="font-headline font-bold text-sm text-[#0b1c30]">DJASSA</span>
            <p className="mt-2 leading-relaxed">La marketplace des commerçants d'Abidjan. Tous les prix sont affichés en FCFA TTC.</p>
          </div>
          <div>
            <span className="font-semibold text-[#0b1c30]">Points de retrait</span>
            <ul className="mt-2 flex flex-col gap-1">
              {ALL_HUBS.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 items-start">
            <span className="font-semibold text-[#0b1c30]">Espace professionnel</span>
            <button onClick={onBecomeVendor} className="text-[#00685d] font-semibold hover:underline">
              Devenir vendeur
            </button>
            <button onClick={onProLogin} className="text-[#00685d] font-semibold hover:underline">
              Connexion vendeur / admin
            </button>
          </div>
        </div>
      </footer>

      {/* Barre panier mobile */}
      {cartCount > 0 && (
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 animate-in slide-in-from-bottom">
          <button
            onClick={onOpenCart}
            className="w-full h-12 rounded-2xl bg-[#00685d] text-white shadow-xl flex items-center justify-between px-4 text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} /> {cartCount} article{cartCount > 1 ? 's' : ''}
            </span>
            <span className="tabular-nums">{formatFCFA(cartTotal)} · Commander</span>
          </button>
        </div>
      )}
    </div>
  );
};

const Reassurance: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex items-center gap-3">
    <span className="w-10 h-10 rounded-xl bg-[#eefaf6] text-[#00685d] flex items-center justify-center shrink-0">{icon}</span>
    <span>
      <span className="block text-sm font-semibold text-[#0b1c30]">{title}</span>
      <span className="block text-xs text-[#64748b]">{text}</span>
    </span>
  </div>
);

const CategoryChip: React.FC<{ active: boolean; onClick: () => void; label: string; count?: number }> = ({
  active,
  onClick,
  label,
  count
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors flex items-center gap-1.5 ${
      active ? 'bg-[#0b1c30] border-[#0b1c30] text-white' : 'bg-white border-[#e2e8f0] text-[#3d4946] hover:border-[#94a3b8]'
    }`}
  >
    {label}
    {count !== undefined && <span className={active ? 'text-white/60' : 'text-[#94a3b8]'}>{count}</span>}
  </button>
);

const PublicProductCard: React.FC<{
  product: Product;
  vendor?: Vendor;
  inCart: number;
  onAdd: () => void;
  onOpen: () => void;
  onOpenShop: (id: string) => void;
}> = ({ product, vendor, inCart, onAdd, onOpen, onOpenShop }) => {
  const out = product.stock === 0;
  const few = !out && product.stock <= product.lowStockThreshold;
  const maxed = inCart >= product.stock;

  return (
    <article className="group bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden flex flex-col hover:shadow-md hover:border-[#cbd5e1] transition-all">
      <button onClick={onOpen} className="relative aspect-square bg-[#eff4ff] p-4 flex items-center justify-center" aria-label={`Voir ${product.name}`}>
        <img
          src={product.imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${out ? 'opacity-40 grayscale' : ''}`}
        />
        {out && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#0b1c30] text-white text-[10px] font-bold">Épuisé</span>
        )}
        {few && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#fff7ed] text-[#b45309] text-[10px] font-bold">
            Plus que {product.stock}
          </span>
        )}
      </button>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {vendor ? (
          <button
            onClick={() => onOpenShop(vendor.id)}
            className="self-start flex items-center gap-1 text-[11px] font-semibold text-[#64748b] hover:text-[#00685d] max-w-full"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: vendor.brandColor }} />
            <span className="truncate">{vendor.shopName}</span>
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-[#00685d]">Vendu par DJASSA</span>
        )}
        <button onClick={onOpen} className="text-left">
          <h3 className="text-sm font-semibold text-[#0b1c30] leading-snug line-clamp-2">{product.name}</h3>
        </button>
        <div className="flex items-center gap-1 text-[11px] text-[#64748b]">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="font-semibold text-[#0b1c30]">{product.rating.toLocaleString('fr-FR')}</span>
          <span>({product.reviewCount})</span>
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="font-headline font-bold text-base text-[#0b1c30] tabular-nums">{formatFCFA(product.price)}</span>
        </div>
        <button
          onClick={onAdd}
          disabled={out || maxed}
          className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            inCart > 0 && !maxed
              ? 'bg-[#eefaf6] text-[#00685d] border border-[#b7e4d8] hover:bg-[#dff3ec]'
              : 'bg-[#00685d] text-white hover:bg-[#005048]'
          } disabled:bg-[#e2e8f0] disabled:text-[#94a3b8] disabled:border-transparent disabled:cursor-not-allowed`}
        >
          <ShoppingBag size={14} />
          {out ? 'Épuisé' : maxed ? 'Stock max. au panier' : inCart > 0 ? `Au panier (${inCart}) · +1` : 'Ajouter au panier'}
        </button>
      </div>
    </article>
  );
};
