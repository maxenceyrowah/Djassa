import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, MapPin, Plus, Search, Store, Users, Wallet, Clock, Package } from 'lucide-react';
import { Product, SaleOrder, Vendor, VendorStatus } from '../types/inventory';
import { STATUS_META, computeVendorStats, vendorInitials } from '../utils/vendor';
import { formatFCFA } from '../utils/format';

interface VendorsViewProps {
  vendors: Vendor[];
  products: Product[];
  orders: SaleOrder[];
  onCreateVendor: () => void;
  onOpenVendor: (vendor: Vendor) => void;
  onViewVendorProducts: (vendor: Vendor) => void;
  onActivateVendor: (vendorId: string) => void;
}


type StatusFilter = 'all' | VendorStatus;

export const VendorsView: React.FC<VendorsViewProps> = ({
  vendors,
  products,
  orders,
  onCreateVendor,
  onOpenVendor,
  onViewVendorProducts,
  onActivateVendor
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const statsById = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeVendorStats>> = {};
    vendors.forEach((v) => (map[v.id] = computeVendorStats(v, products, orders)));
    return map;
  }, [vendors, products, orders]);

  const counts = useMemo(
    () => ({
      all: vendors.length,
      actif: vendors.filter((v) => v.status === 'actif').length,
      en_attente: vendors.filter((v) => v.status === 'en_attente').length,
      suspendu: vendors.filter((v) => v.status === 'suspendu').length
    }),
    [vendors]
  );

  const totals = useMemo(() => {
    const all = Object.values(statsById);
    return {
      revenue: all.reduce((s, x) => s + x.revenueFCFA, 0),
      commission: all.reduce((s, x) => s + x.commissionFCFA, 0)
    };
  }, [statsById]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors
      .filter((v) => statusFilter === 'all' || v.status === statusFilter)
      .filter(
        (v) =>
          !q ||
          v.shopName.toLowerCase().includes(q) ||
          v.ownerName.toLowerCase().includes(q) ||
          v.commune.toLowerCase().includes(q) ||
          v.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      )
      .sort((a, b) => {
        // Les vendeurs à valider remontent en premier : c'est l'action la plus urgente.
        if (a.status === 'en_attente' && b.status !== 'en_attente') return -1;
        if (b.status === 'en_attente' && a.status !== 'en_attente') return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [vendors, query, statusFilter]);

  const tabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'actif', label: 'Actifs' },
    { id: 'en_attente', label: 'En attente' },
    { id: 'suspendu', label: 'Suspendus' }
  ];

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 py-4 sm:py-6 gap-5">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <span>Djassa</span>
          <ChevronRight size={14} />
          <span className="font-semibold text-[#00685d]">Vendeurs & Boutiques</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 mt-1">
          <div>
            <h1 className="font-headline font-semibold text-xl sm:text-2xl text-[#0b1c30] tracking-tight">
              Vendeurs de la marketplace
            </h1>
            <p className="text-xs text-[#64748b] mt-0.5">
              Créez, validez et suivez les boutiques partenaires qui vendent via les 4 hubs DJASSA.
            </p>
          </div>
          <button
            onClick={onCreateVendor}
            className="h-10 px-4 bg-[#00685d] hover:bg-[#005048] active:scale-95 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={18} />
            Créer un vendeur
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Users size={18} />} label="Vendeurs actifs" value={String(counts.actif)} sub={`${counts.all} au total`} />
        <Kpi
          icon={<Clock size={18} />}
          label="À valider"
          value={String(counts.en_attente)}
          sub={counts.en_attente > 0 ? 'Action requise' : 'Rien en attente'}
          tone={counts.en_attente > 0 ? 'warning' : 'default'}
          onClick={counts.en_attente > 0 ? () => setStatusFilter('en_attente') : undefined}
        />
        <Kpi icon={<Store size={18} />} label="CA vendeurs" value={formatFCFA(totals.revenue)} sub="Ventes d'articles, hors livraison" />
        <Kpi icon={<Wallet size={18} />} label="Commissions DJASSA" value={formatFCFA(totals.commission)} sub="Calculées au taux de chaque vendeur" />
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-[#e2e8f0] shadow-xs">
        <div role="tablist" aria-label="Filtrer par statut" className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={statusFilter === t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                statusFilter === t.id ? 'bg-[#0b1c30] text-white' : 'text-[#3d4946] hover:bg-[#eff4ff]'
              }`}
            >
              {t.label}
              <span
                className={`px-1.5 rounded-full text-[10px] font-bold ${
                  statusFilter === t.id ? 'bg-white/20' : 'bg-[#eff4ff] text-[#64748b]'
                }`}
              >
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Boutique, responsable, commune…"
            aria-label="Rechercher un vendeur"
            className="w-full h-9 pl-9 pr-3 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#00685d] focus:bg-white"
          />
        </div>
      </div>

      {/* Liste */}
      {vendors.length === 0 ? (
        <EmptyState
          title="Aucun vendeur pour l'instant"
          text="Créez la première boutique partenaire : en 5 étapes, elle pourra référencer ses produits et vendre depuis un hub DJASSA."
          actionLabel="Créer le premier vendeur"
          onAction={onCreateVendor}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucun résultat"
          text="Aucun vendeur ne correspond à cette recherche."
          actionLabel="Effacer les filtres"
          onAction={() => {
            setQuery('');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const s = statsById[v.id];
            const status = STATUS_META[v.status];
            return (
              <article
                key={v.id}
                className="group bg-white rounded-2xl border border-[#e2e8f0] shadow-xs hover:shadow-md hover:border-[#cbd5e1] transition-all overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => onOpenVendor(v)}
                  className="text-left flex flex-col flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00685d] focus-visible:ring-inset"
                >
                  <div className="h-2" style={{ backgroundColor: v.brandColor }} />
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-xl text-white flex items-center justify-center font-headline font-bold shrink-0"
                        style={{ backgroundColor: v.brandColor }}
                      >
                        {vendorInitials(v.shopName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-headline font-bold text-[15px] text-[#0b1c30] truncate">{v.shopName}</h3>
                          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.className}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748b] truncate">{v.tagline || v.categories.join(' · ')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={12} /> {v.commune}
                      </span>
                      <span className="truncate">· {v.ownerName}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#f1f5f9]">
                      <Metric label="Produits" value={String(s.productCount)} />
                      <Metric label="CA" value={compactFCFA(s.revenueFCFA)} />
                      <Metric
                        label="Alertes"
                        value={String(s.lowStockCount)}
                        tone={s.lowStockCount > 0 ? 'danger' : 'default'}
                      />
                    </div>
                  </div>
                </button>

                <div className="px-4 pb-4 flex items-center gap-2">
                  {v.status === 'en_attente' ? (
                    <button
                      onClick={() => onActivateVendor(v.id)}
                      className="flex-1 h-9 rounded-lg bg-[#00685d] hover:bg-[#005048] text-white text-xs font-semibold transition-colors"
                    >
                      Valider la boutique
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewVendorProducts(v)}
                      disabled={s.productCount === 0}
                      className="flex-1 h-9 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00685d] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Package size={14} />
                      {s.productCount === 0 ? 'Aucun produit' : 'Voir ses produits'}
                    </button>
                  )}
                  <button
                    onClick={() => onOpenVendor(v)}
                    className="h-9 px-3 rounded-lg border border-[#e2e8f0] hover:bg-[#f8f9ff] text-xs font-semibold text-[#0b1c30] transition-colors"
                  >
                    Fiche
                  </button>
                </div>
              </article>
            );
          })}

          {/* Carte d'appel à l'action */}
          <button
            onClick={onCreateVendor}
            className="min-h-[220px] rounded-2xl border-2 border-dashed border-[#cbd5e1] hover:border-[#00685d] hover:bg-[#eefaf6] text-[#64748b] hover:text-[#00685d] flex flex-col items-center justify-center gap-2 transition-colors"
          >
            <span className="w-11 h-11 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center">
              <Plus size={20} />
            </span>
            <span className="text-sm font-semibold">Nouveau vendeur</span>
            <span className="text-[11px]">5 étapes · environ 2 minutes</span>
          </button>
        </div>
      )}
    </div>
  );
};

function compactFCFA(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000).toLocaleString('fr-FR')} k`;
  return amount.toLocaleString('fr-FR');
}

const Kpi: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: 'default' | 'warning';
  onClick?: () => void;
}> = ({ icon, label, value, sub, tone = 'default', onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-white p-4 rounded-xl border shadow-xs flex flex-col gap-2 ${
        tone === 'warning' ? 'border-[#fed7aa]' : 'border-[#e2e8f0]'
      } ${onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</span>
        <span className={tone === 'warning' ? 'text-[#b45309]' : 'text-[#00685d]'}>{icon}</span>
      </div>
      <span className="font-headline font-bold text-lg sm:text-xl text-[#0b1c30] tabular-nums truncate">{value}</span>
      <span className={`text-[11px] ${tone === 'warning' ? 'text-[#b45309] font-semibold' : 'text-[#64748b]'}`}>{sub}</span>
    </Tag>
  );
};

const Metric: React.FC<{ label: string; value: string; tone?: 'default' | 'danger' }> = ({ label, value, tone = 'default' }) => (
  <div className="flex flex-col">
    <span className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-semibold">{label}</span>
    <span className={`text-sm font-bold tabular-nums flex items-center gap-1 ${tone === 'danger' ? 'text-[#ba1a1a]' : 'text-[#0b1c30]'}`}>
      {tone === 'danger' && <AlertTriangle size={12} />}
      {value}
    </span>
  </div>
);

const EmptyState: React.FC<{ title: string; text: string; actionLabel: string; onAction: () => void }> = ({
  title,
  text,
  actionLabel,
  onAction
}) => (
  <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 sm:p-14 flex flex-col items-center text-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-[#eefaf6] text-[#00685d] flex items-center justify-center">
      <Store size={26} />
    </div>
    <h3 className="font-headline font-semibold text-lg text-[#0b1c30]">{title}</h3>
    <p className="text-sm text-[#64748b] max-w-md">{text}</p>
    <button
      onClick={onAction}
      className="mt-2 h-10 px-4 bg-[#00685d] hover:bg-[#005048] text-white rounded-xl text-sm font-semibold transition-colors"
    >
      {actionLabel}
    </button>
  </div>
);
