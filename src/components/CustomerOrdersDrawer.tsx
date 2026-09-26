import React, { useCallback } from 'react';
import { Bike, CheckCircle2, Package, Store, X } from 'lucide-react';
import { SaleOrder } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface CustomerOrdersDrawerProps {
  isOpen: boolean;
  orders: SaleOrder[];
  onClose: () => void;
  onBrowse: () => void;
}

const STEPS: { status: SaleOrder['status']; label: string }[] = [
  { status: 'paye', label: 'Confirmée' },
  { status: 'en_livraison', label: 'En route' },
  { status: 'livre', label: 'Livrée' }
];

const PAYMENT_LABELS: Record<SaleOrder['paymentMethod'], string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  cash: 'Espèces'
};

const CustomerOrdersDrawerContent: React.FC<CustomerOrdersDrawerProps> = ({ orders, onClose, onBrowse }) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  useEscapeKey(handleClose);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-xs flex justify-end animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside role="dialog" aria-modal="true" aria-label="Mes commandes" className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left">
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#e2e8f0] shrink-0">
          <div>
            <h2 className="font-headline font-bold text-base text-[#0b1c30]">Mes commandes</h2>
            <p className="text-[11px] text-[#64748b]">
              {orders.length} commande{orders.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-lg text-[#64748b] hover:bg-[#eff4ff] flex items-center justify-center">
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {orders.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center gap-3">
              <span className="w-14 h-14 rounded-2xl bg-[#eefaf6] text-[#00685d] flex items-center justify-center">
                <Package size={26} />
              </span>
              <h3 className="font-headline font-semibold text-base text-[#0b1c30]">Aucune commande pour l'instant</h3>
              <p className="text-sm text-[#64748b] max-w-xs">Vos achats apparaîtront ici avec leur suivi de livraison.</p>
              <button onClick={onBrowse} className="mt-1 h-10 px-4 rounded-xl bg-[#00685d] text-white text-sm font-semibold hover:bg-[#005048]">
                Découvrir les produits
              </button>
            </div>
          ) : (
            orders.map((o) => {
              const current = STEPS.findIndex((s) => s.status === o.status);
              return (
                <article key={o.id} className="rounded-2xl border border-[#e2e8f0] p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#0b1c30]">{o.orderNumber}</span>
                      <span className="block text-[11px] text-[#64748b]">{o.createdAt}</span>
                    </div>
                    <span className="font-headline font-bold text-sm text-[#0b1c30] tabular-nums">{formatFCFA(o.totalAmount)}</span>
                  </div>

                  {/* Suivi */}
                  <ol className="grid grid-cols-3 gap-1" aria-label="Suivi de la commande">
                    {STEPS.map((s, i) => (
                      <li key={s.status} className="flex flex-col gap-1.5">
                        <span className={`h-1.5 rounded-full ${i <= current ? 'bg-[#00685d]' : 'bg-[#e2e8f0]'}`} />
                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${i <= current ? 'text-[#00685d]' : 'text-[#94a3b8]'}`}>
                          {i === current && <CheckCircle2 size={11} />}
                          {s.label}
                        </span>
                      </li>
                    ))}
                  </ol>

                  <ul className="text-xs text-[#3d4946] flex flex-col gap-1">
                    {o.items.map((it) => (
                      <li key={it.productId} className="flex justify-between gap-2">
                        <span className="truncate">
                          {it.quantity} × {it.productName}
                        </span>
                        <span className="tabular-nums text-[#64748b]">{formatFCFA(it.price * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 text-[11px] text-[#64748b] pt-2 border-t border-[#f1f5f9]">
                    {o.deliveryMode === 'livraison_express' ? <Bike size={13} /> : <Store size={13} />}
                    <span className="truncate">
                      {o.deliveryMode === 'livraison_express' ? `Livraison · ${o.customerCity}` : `Retrait · ${o.hub}`} · {PAYMENT_LABELS[o.paymentMethod]}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};

export const CustomerOrdersDrawer: React.FC<CustomerOrdersDrawerProps> = (props) =>
  props.isOpen ? <CustomerOrdersDrawerContent {...props} /> : null;
