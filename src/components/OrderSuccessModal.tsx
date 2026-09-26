import React, { useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { SaleOrder } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { CheckCircle2, Save, Smartphone, Receipt } from 'lucide-react';

interface OrderSuccessModalProps {
  order: SaleOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOrders?: () => void;
  audience?: 'customer' | 'staff';
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onViewOrders,
  audience = 'staff'
}) => {
  const isCustomer = audience === 'customer';
  useEscapeKey(onClose, isOpen);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const totalQuantity = order.items.reduce((acc, it) => acc + it.quantity, 0);

  const handleShareWhatsApp = () => {
    const text = `*REÇU DE COMMANDE DJASSA*\n\n` +
      `Référence : *${order.orderNumber}*\n` +
      `Client : *${order.customerName}* (${order.customerPhone})\n` +
      `Localité : ${order.customerCity}\n` +
      `Mode : ${order.deliveryMode === 'livraison_express' ? 'Livraison Express' : 'Retrait Dépôt'} (${order.hub})\n` +
      `Règlement : ${order.paymentMethod.toUpperCase()}\n\n` +
      `*ARTICLES :*\n` +
      order.items.map((it) => `- ${it.quantity}x ${it.productName} : ${formatFCFA(it.price * it.quantity)}`).join('\n') +
      `\n\n*TOTAL ENCAISSÉ : ${formatFCFA(order.totalAmount)}*\n` +
      `Statut : Validé & Payé\n\nMerci de votre confiance sur DJASSA !`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    const encoded = encodeURIComponent(text);
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone.length >= 8
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] w-full max-w-md overflow-hidden flex flex-col">
        {/* Banner with celebratory header */}
        <div className="bg-[#acedda] p-6 text-center flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-[#00685d] text-white flex items-center justify-center shadow-md animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="font-headline font-bold text-xl text-[#065043]">
            {isCustomer ? 'Merci pour votre commande !' : 'Commande Validée & Encaissée !'}
          </h2>
          <span className="font-mono text-xs font-bold text-[#00685d] bg-white/90 px-3 py-1 rounded-full shadow-2xs">
            Réf : {order.orderNumber}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Summary Box */}
          <div className="bg-[#f8f9ff] p-3.5 rounded-xl border border-[#e2e8f0] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748b]">Client :</span>
              <span className="font-bold text-[#0b1c30]">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748b]">Contact :</span>
              <span className="font-mono text-[#0b1c30]">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748b]">Destination / Dépôt :</span>
              <span className="text-[#0b1c30] font-medium">{order.hub}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748b]">Mode & Paiement :</span>
              <span className="font-bold text-[#00685d] uppercase">
                {order.deliveryMode === 'livraison_express' ? 'Livraison Express' : 'Retrait'} • {order.paymentMethod}
              </span>
            </div>
            <div className="pt-2 border-t border-[#e2e8f0] flex justify-between items-baseline">
              <span className="font-bold text-[#0b1c30]">Montant Total Encaissé :</span>
              <span className="font-headline font-bold text-lg text-[#00685d] tabular-nums">
                {formatFCFA(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Items brief */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
              {isCustomer
                ? `${totalQuantity} article${totalQuantity > 1 ? 's' : ''} commandé${totalQuantity > 1 ? 's' : ''} :`
                : `${totalQuantity} article${totalQuantity > 1 ? 's' : ''} décrémenté${totalQuantity > 1 ? 's' : ''} du stock Djassa :`}
            </span>
            <div className="divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-xl max-h-36 overflow-y-auto">
              {order.items.map((it, idx) => (
                <div key={idx} className="p-2.5 bg-white flex justify-between items-center text-[11px]">
                  <span className="text-[#0b1c30] font-medium truncate max-w-[240px]">
                    {it.quantity}x {it.productName}
                  </span>
                  <span className="font-mono text-[#00685d] font-bold">
                    {formatFCFA(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Automatic Inventory Sync Badge */}
          <div className="flex items-center gap-2 p-2.5 bg-[#eff4ff] rounded-xl text-[#00685d] text-[11px] font-medium">
            <Save size={18} />
            <span>
              {isCustomer
                ? order.deliveryMode === 'livraison_express'
                  ? 'Un coursier DJASSA vous appelle avant la livraison (sous 24h).'
                  : `Votre commande sera prête au ${order.hub}. Présentez la référence au retrait.`
                : 'Le stock a été décrémenté en temps réel et consigné dans le journal des ventes.'}
            </span>
          </div>

          {/* Share WhatsApp receipt */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#075E54] border border-[#25D366]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Smartphone size={17} />
            <span>{copied ? 'Reçu copié ! Envoi WhatsApp...' : isCustomer ? 'Recevoir mon reçu sur WhatsApp' : 'Envoyer le reçu au client via WhatsApp'}</span>
          </button>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1 border-t border-[#f1f5f9]">
            {onViewOrders && (
            <button
              onClick={() => {
                onClose();
                onViewOrders();
              }}
              className="w-full py-2.5 bg-[#00685d] hover:bg-[#005048] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Receipt size={17} />
              <span>{isCustomer ? 'Suivre ma commande' : 'Consulter dans Ventes & Commandes'}</span>
            </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-2 bg-white hover:bg-[#eff4ff] text-[#64748b] hover:text-[#0b1c30] border border-[#e2e8f0] font-medium rounded-xl text-xs transition-colors"
            >
              {isCustomer ? 'Continuer mes achats' : 'Continuer les ventes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
