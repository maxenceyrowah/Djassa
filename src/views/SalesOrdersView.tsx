import React, { useState } from 'react';
import { SaleOrder } from '../types/inventory';
import { formatFCFA } from '../utils/format';

interface SalesOrdersViewProps {
  orders: SaleOrder[];
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenQuickSale: () => void;
  onUpdateStatus: (orderId: string, status: 'paye' | 'en_livraison' | 'livre') => void;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  orders,
  cartCount = 0,
  onOpenCart,
  onOpenQuickSale,
  onUpdateStatus
}) => {
  // On garde l'identifiant : la fiche suit les changements de statut et les nouvelles commandes.
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id ?? null);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? orders[0] ?? null;
  const [statusFilter, setStatusFilter] = useState<'all' | 'paye' | 'en_livraison' | 'livre'>('all');
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const paymentBadges: Record<string, { label: string; bg: string; text: string }> = {
    wave: { label: 'Wave', bg: 'bg-[#1da1f2]/10', text: 'text-[#1da1f2]' },
    orange_money: { label: 'Orange Money', bg: 'bg-[#ff7900]/10', text: 'text-[#ff7900]' },
    mtn_momo: { label: 'MTN MoMo', bg: 'bg-[#ffcc00]/20', text: 'text-[#997300]' },
    cash: { label: 'Espèces', bg: 'bg-[#0b1c30]/10', text: 'text-[#0b1c30]' },
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const totalSalesRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  const handleShareReceiptWhatsApp = (order: SaleOrder) => {
    const text = `*BORDEREAU DE COMMANDE DJASSA*\n\n` +
      `N° Commande : *${order.orderNumber}*\n` +
      `Date : ${order.createdAt}\n` +
      `Client : *${order.customerName}* (${order.customerPhone})\n` +
      `Destination : ${order.customerCity}\n` +
      `Règlement : ${order.paymentMethod.toUpperCase()} (${order.status === 'paye' ? 'Encaissé' : order.status})\n\n` +
      `*DÉTAILS DES ARTICLES :*\n` +
      order.items.map((it) => `• ${it.quantity}x ${it.productName} = ${formatFCFA(it.price * it.quantity)}`).join('\n') +
      `\n\n*TOTAL NET : ${formatFCFA(order.totalAmount)}*\n` +
      `Service Client Djassa - Boutique Principale`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    }

    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone.length >= 8
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 py-4 sm:py-6 gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline font-semibold text-xl sm:text-2xl text-[#0b1c30]">
            Ventes & Validation des Commandes
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Recettes cumulées : <span className="font-bold text-[#00685d]">{formatFCFA(totalSalesRevenue)}</span> • {orders.length} commandes validées
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                cartCount > 0
                  ? 'bg-[#00685d] text-white hover:bg-[#005048]'
                  : 'bg-white border border-[#e2e8f0] text-[#00685d] hover:bg-[#eff4ff]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span>{cartCount > 0 ? `Valider le Panier (${cartCount})` : 'Ouvrir le Panier'}</span>
            </button>
          )}

          <button
            onClick={onOpenQuickSale}
            className="h-9 px-3.5 bg-white border border-[#e2e8f0] text-[#0b1c30] hover:bg-[#eff4ff] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[17px]">point_of_sale</span>
            <span>Vente Directe 1-Clic</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-[#00685d] text-white shadow-2xs'
              : 'bg-white text-[#64748b] hover:bg-[#eff4ff] border border-[#e2e8f0]'
          }`}
        >
          Toutes ({orders.length})
        </button>
        <button
          onClick={() => setStatusFilter('paye')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'paye'
              ? 'bg-[#00685d] text-white shadow-2xs'
              : 'bg-white text-[#64748b] hover:bg-[#eff4ff] border border-[#e2e8f0]'
          }`}
        >
          Payées / Validées ({orders.filter((o) => o.status === 'paye').length})
        </button>
        <button
          onClick={() => setStatusFilter('en_livraison')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'en_livraison'
              ? 'bg-[#00685d] text-white shadow-2xs'
              : 'bg-white text-[#64748b] hover:bg-[#eff4ff] border border-[#e2e8f0]'
          }`}
        >
          En cours de livraison ({orders.filter((o) => o.status === 'en_livraison').length})
        </button>
        <button
          onClick={() => setStatusFilter('livre')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'livre'
              ? 'bg-[#00685d] text-white shadow-2xs'
              : 'bg-white text-[#64748b] hover:bg-[#eff4ff] border border-[#e2e8f0]'
          }`}
        >
          Livrées ({orders.filter((o) => o.status === 'livre').length})
        </button>
      </div>

      {/* Main Grid: Orders Table (8 cols) + Detail (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e2e8f0] bg-[#eff4ff] flex items-center justify-between">
            <span className="font-headline font-semibold text-xs text-[#0b1c30] uppercase tracking-wider">
              Bordereaux de Commandes ({filteredOrders.length})
            </span>
            <span className="text-xs text-[#00685d] font-semibold">Taux d'encaissement : 100%</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-[#64748b] flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-[#64748b]">receipt</span>
              <p className="text-xs">Aucune commande ne correspond à ce filtre.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff] text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    <th className="py-3 px-4">Réf Commande</th>
                    <th className="py-3 px-4">Client & Contact</th>
                    <th className="py-3 px-4">Articles</th>
                    <th className="py-3 px-4">Règlement</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredOrders.map((o) => {
                    const isSelected = selectedOrder?.id === o.id;
                    const badge = paymentBadges[o.paymentMethod] || paymentBadges.cash;
                    const totalQty = o.items.reduce((acc, it) => acc + it.quantity, 0);

                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedOrderId(o.id)}
                        className={`hover:bg-[#eff4ff]/50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#eff4ff]/80 font-medium' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#00685d]">
                          {o.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#0b1c30] block">{o.customerName}</span>
                          <span className="text-[11px] text-[#64748b]">{o.customerPhone}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#0b1c30]">
                          <span className="font-semibold">{totalQty} art.</span>
                          <span className="text-[10px] text-[#64748b] block truncate max-w-[150px]">
                            {o.items.map((it) => it.productName).join(', ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-headline font-bold text-[#00685d] tabular-nums">
                          {formatFCFA(o.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              o.status === 'paye'
                                ? 'bg-[#acedda] text-[#065043]'
                                : o.status === 'en_livraison'
                                ? 'bg-[#dce9ff] text-[#0b1c30]'
                                : 'bg-[#f1f5f9] text-[#64748b]'
                            }`}
                          >
                            {o.status === 'paye' ? 'Validé & Payé' : o.status === 'en_livraison' ? 'En livraison' : 'Livré'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Order Quick Receipt Drawer */}
        {selectedOrder ? (
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] shadow-xs p-5 flex flex-col gap-4 sticky top-20">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#00685d]">
                  {selectedOrder.orderNumber}
                </span>
                <h3 className="font-headline font-semibold text-base text-[#0b1c30]">
                  Bordereau Validé
                </h3>
              </div>
              <span className="text-xs text-[#64748b]">{selectedOrder.createdAt}</span>
            </div>

            {/* Client info */}
            <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#e2e8f0] flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Client :</span>
                <span className="font-semibold text-[#0b1c30]">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Contact :</span>
                <span className="font-mono text-[#0b1c30]">{selectedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Localité / Dépôt :</span>
                <span className="text-[#0b1c30]">{selectedOrder.customerCity} ({selectedOrder.hub})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Mode :</span>
                <span className="font-bold text-[#00685d] uppercase">
                  {selectedOrder.deliveryMode === 'livraison_express' ? 'Livraison Express' : 'Retrait Dépôt'} • {selectedOrder.paymentMethod}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                Articles commandés ({selectedOrder.items.reduce((acc, it) => acc + it.quantity, 0)})
              </span>
              <div className="divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 bg-white flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#0b1c30] block">{it.productName}</span>
                      <span className="text-[11px] text-[#64748b]">{it.quantity} × {formatFCFA(it.price)}</span>
                    </div>
                    <span className="font-headline font-bold text-xs text-[#0b1c30] tabular-nums">
                      {formatFCFA(it.quantity * it.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="p-3 bg-[#eff4ff] rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0b1c30]">Montant Total Encaissé</span>
              <span className="font-headline font-bold text-base text-[#00685d]">
                {formatFCFA(selectedOrder.totalAmount)}
              </span>
            </div>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={() => handleShareReceiptWhatsApp(selectedOrder)}
              className="w-full py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#075E54] border border-[#25D366]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
              <span>{copiedReceipt ? 'Reçu copié ! Ouverture WhatsApp...' : 'Partager le reçu au client (WhatsApp)'}</span>
            </button>

            {/* Change Status buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#f1f5f9]">
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                Mettre à jour le statut
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => onUpdateStatus(selectedOrder.id, 'paye')}
                  className={`py-1.5 rounded-lg border font-medium transition-all ${
                    selectedOrder.status === 'paye'
                      ? 'bg-[#00685d] text-white border-[#00685d] font-bold shadow-2xs'
                      : 'bg-[#eff4ff] text-[#0b1c30] border-[#e2e8f0]'
                  }`}
                >
                  Payé
                </button>
                <button
                  onClick={() => onUpdateStatus(selectedOrder.id, 'en_livraison')}
                  className={`py-1.5 rounded-lg border font-medium transition-all ${
                    selectedOrder.status === 'en_livraison'
                      ? 'bg-[#1da1f2] text-white border-[#1da1f2] font-bold shadow-2xs'
                      : 'bg-[#eff4ff] text-[#0b1c30] border-[#e2e8f0]'
                  }`}
                >
                  En livraison
                </button>
                <button
                  onClick={() => onUpdateStatus(selectedOrder.id, 'livre')}
                  className={`py-1.5 rounded-lg border font-medium transition-all ${
                    selectedOrder.status === 'livre'
                      ? 'bg-[#213145] text-white border-[#213145] font-bold shadow-2xs'
                      : 'bg-[#eff4ff] text-[#0b1c30] border-[#e2e8f0]'
                  }`}
                >
                  Livré
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
