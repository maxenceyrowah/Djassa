import React, { useCallback } from 'react';
import { Ban, CheckCircle2, KeyRound, Mail, MapPin, PackagePlus, Phone, Wallet, Warehouse, X, FileText, Package } from 'lucide-react';
import { Product, SaleOrder, Vendor, VendorStatus } from '../../types/inventory';
import { LEGAL_FORM_LABELS, PAYOUT_LABELS, STATUS_META, computeVendorStats, vendorInitials } from '../../utils/vendor';
import { formatFCFA } from '../../utils/format';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface VendorDetailDrawerProps {
  vendor: Vendor | null;
  products: Product[];
  orders: SaleOrder[];
  onClose: () => void;
  /** Absent quand le vendeur consulte sa propre fiche : pas de validation ni de suspension. */
  onChangeStatus?: (vendorId: string, status: VendorStatus) => void;
  onAddProduct: (vendor: Vendor) => void;
  onViewProducts: (vendor: Vendor) => void;
  onSelectProduct: (product: Product) => void;
}

const VendorDetailDrawerContent: React.FC<VendorDetailDrawerProps & { vendor: Vendor }> = ({
  vendor,
  products,
  orders,
  onClose,
  onChangeStatus,
  onAddProduct,
  onViewProducts,
  onSelectProduct
}) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  useEscapeKey(handleClose);

  const stats = computeVendorStats(vendor, products, orders);
  const vendorProducts = products.filter((p) => p.vendorId === vendor.id);
  const status = STATUS_META[vendor.status];
  const netPayout = stats.revenueFCFA - stats.commissionFCFA;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-xs flex justify-end animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Fiche vendeur ${vendor.shopName}`}
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-left"
      >
        {/* Bannière */}
        <div className="relative h-24 shrink-0" style={{ backgroundColor: vendor.brandColor }}>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
          <div
            className="absolute -bottom-7 left-5 w-14 h-14 rounded-2xl ring-4 ring-white text-white flex items-center justify-center font-headline font-bold text-lg"
            style={{ backgroundColor: vendor.brandColor }}
          >
            {vendorInitials(vendor.shopName)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-10 pb-5 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline font-bold text-xl text-[#0b1c30]">{vendor.shopName}</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.className}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="text-xs text-[#64748b] font-mono mt-0.5">djassa.ci/{vendor.slug}</p>
            {vendor.tagline && <p className="text-sm text-[#3d4946] mt-2">{vendor.tagline}</p>}
          </div>

          {vendor.status === 'en_attente' && (
            <div className="p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa] flex flex-col gap-2.5">
              <p className="text-xs text-[#9a3412] leading-relaxed">
                {onChangeStatus ? (
                  <>
                    <strong>Validation requise.</strong> Vérifiez la pièce d'identité de {vendor.ownerName} avant d'autoriser les ventes.
                  </>
                ) : (
                  <>
                    <strong>Boutique en cours de vérification.</strong> Vos produits seront visibles sur la marketplace dès la validation
                    par l'équipe DJASSA.
                  </>
                )}
              </p>
              {onChangeStatus && (
              <button
                onClick={() => onChangeStatus(vendor.id, 'actif')}
                className="self-start h-9 px-4 rounded-lg bg-[#00685d] hover:bg-[#005048] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 size={15} /> Valider et activer
              </button>
              )}
            </div>
          )}

          {/* Chiffres */}
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Chiffre d'affaires" value={formatFCFA(stats.revenueFCFA)} />
            <Stat label="Net à reverser" value={formatFCFA(netPayout)} accent />
            <Stat label="Articles vendus" value={`${stats.unitsSold} u.`} />
            <Stat label="Valeur du stock" value={formatFCFA(stats.stockValueFCFA)} />
          </div>

          {/* Coordonnées */}
          <Section title="Coordonnées">
            <InfoRow icon={<Phone size={15} />} label={vendor.ownerName} value={vendor.phone} mono />
            {vendor.email && <InfoRow icon={<Mail size={15} />} label="E-mail" value={vendor.email} />}
            <InfoRow icon={<MapPin size={15} />} label={vendor.commune} value={vendor.address || '—'} />
          </Section>

          <Section title="Légal & reversement">
            <InfoRow
              icon={<FileText size={15} />}
              label={LEGAL_FORM_LABELS[vendor.legalForm]}
              value={vendor.rccm ? `RCCM ${vendor.rccm}` : 'Sans immatriculation'}
              mono={Boolean(vendor.rccm)}
            />
            <InfoRow
              icon={<Wallet size={15} />}
              label={`${PAYOUT_LABELS[vendor.payoutMethod]} · commission ${vendor.commissionRate} %`}
              value={vendor.payoutAccount}
              mono
            />
            <InfoRow icon={<KeyRound size={15} />} label="Code d'accès espace vendeur" value={vendor.accessCode} mono />
          </Section>

          <Section title="Logistique">
            <InfoRow
              icon={<Warehouse size={15} />}
              label={vendor.hub}
              value={vendor.deliveryModes
                .map((m) => (m === 'retrait_boutique' ? 'Retrait au dépôt' : 'Livraison express'))
                .join(' + ')}
            />
          </Section>

          {/* Produits */}
          <Section
            title={`Produits (${vendorProducts.length})`}
            action={
              vendorProducts.length > 0 ? (
                <button onClick={() => onViewProducts(vendor)} className="text-xs font-semibold text-[#00685d] hover:underline">
                  Ouvrir dans le catalogue
                </button>
              ) : undefined
            }
          >
            {vendorProducts.length === 0 ? (
              <div className="p-4 text-center flex flex-col items-center gap-2">
                <Package size={22} className="text-[#94a3b8]" />
                <p className="text-xs text-[#64748b]">Aucun produit référencé pour cette boutique.</p>
              </div>
            ) : (
              vendorProducts.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#f8f9ff] text-left transition-colors"
                >
                  <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-[#eff4ff] p-0.5" referrerPolicy="no-referrer" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-[#0b1c30] truncate">{p.name}</span>
                    <span className="block text-[11px] text-[#64748b]">{formatFCFA(p.price)}</span>
                  </span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      p.stock === 0 ? 'text-[#ba1a1a]' : p.stock <= p.lowStockThreshold ? 'text-[#b45309]' : 'text-[#0b1c30]'
                    }`}
                  >
                    {p.stock} u.
                  </span>
                </button>
              ))
            )}
          </Section>
        </div>

        {/* Actions */}
        <div className="shrink-0 border-t border-[#e2e8f0] p-4 flex items-center gap-2">
          <button
            onClick={() => onAddProduct(vendor)}
            disabled={vendor.status === 'suspendu'}
            className="flex-1 h-10 rounded-xl bg-[#00685d] hover:bg-[#005048] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PackagePlus size={17} /> Ajouter un produit
          </button>
          {!onChangeStatus ? null : vendor.status === 'suspendu' ? (
            <button
              onClick={() => onChangeStatus(vendor.id, 'actif')}
              className="h-10 px-4 rounded-xl border border-[#e2e8f0] hover:bg-[#f8f9ff] text-sm font-semibold text-[#00685d] transition-colors"
            >
              Réactiver
            </button>
          ) : (
            <button
              onClick={() => onChangeStatus(vendor.id, 'suspendu')}
              className="h-10 px-4 rounded-xl border border-[#e2e8f0] hover:border-[#fecaca] hover:bg-[#fdecec] text-sm font-semibold text-[#ba1a1a] flex items-center gap-1.5 transition-colors"
            >
              <Ban size={15} /> Suspendre
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

const Section: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <section className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">{title}</h3>
      {action}
    </div>
    <div className="rounded-xl border border-[#e2e8f0] divide-y divide-[#f1f5f9] overflow-hidden">{children}</div>
  </section>
);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string; mono?: boolean }> = ({ icon, label, value, mono }) => (
  <div className="flex items-start gap-3 px-3 py-2.5">
    <span className="text-[#64748b] mt-0.5">{icon}</span>
    <div className="min-w-0">
      <span className="block text-sm font-medium text-[#0b1c30]">{label}</span>
      <span className={`block text-xs text-[#64748b] break-words ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  </div>
);

const Stat: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={`p-3 rounded-xl border ${accent ? 'bg-[#eefaf6] border-[#b7e4d8]' : 'bg-[#f8f9ff] border-[#e2e8f0]'}`}>
    <span className="block text-[10px] uppercase tracking-wider font-semibold text-[#64748b]">{label}</span>
    <span className={`block font-headline font-bold text-base tabular-nums mt-0.5 ${accent ? 'text-[#00685d]' : 'text-[#0b1c30]'}`}>
      {value}
    </span>
  </div>
);

export const VendorDetailDrawer: React.FC<VendorDetailDrawerProps> = (props) =>
  props.vendor ? <VendorDetailDrawerContent {...props} vendor={props.vendor} /> : null;
