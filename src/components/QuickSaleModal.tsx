import React, { useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Product, PaymentMethod, WarehouseHub } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { Receipt, X } from 'lucide-react';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  preselectedProduct?: Product | null;
  onCompleteSale: (
    items: { productId: string; productName: string; quantity: number; price: number }[],
    customerName: string,
    customerPhone: string,
    customerCity: string,
    paymentMethod: PaymentMethod,
    hub: WarehouseHub
  ) => void;
}

const QuickSaleModalContent: React.FC<QuickSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  preselectedProduct,
  onCompleteSale
}) => {
  useEscapeKey(onClose);

  const availableProducts = products.filter((p) => p.stock > 0);
  const initialProduct = preselectedProduct && preselectedProduct.stock > 0
    ? preselectedProduct
    : availableProducts[0] || products[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(initialProduct.id);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('Client Marché');
  const [customerPhone, setCustomerPhone] = useState('+225 ');
  const [customerCity, setCustomerCity] = useState('Abidjan (Cocody)');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');
  const [hub, setHub] = useState<WarehouseHub>(initialProduct.warehouseHub);

  const currentProduct = products.find((p) => p.id === selectedProductId) || initialProduct;
  const maxStock = currentProduct ? currentProduct.stock : 1;
  const totalAmount = currentProduct ? currentProduct.price * quantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || quantity <= 0) return;

    onCompleteSale(
      [
        {
          productId: currentProduct.id,
          productName: currentProduct.name,
          quantity,
          price: currentProduct.price
        }
      ],
      customerName.trim() || 'Client Comptoir',
      customerPhone.trim() || 'Non renseigné',
      customerCity.trim() || 'Abidjan',
      paymentMethod,
      hub
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between bg-[#eff4ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#00685d] text-white flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="font-headline font-semibold text-base text-[#0b1c30]">
                Nouvelle Vente Express Djassa
              </h2>
              <p className="text-xs text-[#64748b]">
                Déduction automatique du stock & encaissement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#64748b] hover:text-[#0b1c30] hover:bg-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {/* Product selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Article vendu
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setQuantity(1);
              }}
              className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} — {formatFCFA(p.price)} ({p.stock > 0 ? `${p.stock} en stock` : 'Rupture'})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between bg-[#f8f9ff] p-3 rounded-xl border border-[#e2e8f0]">
            <div>
              <span className="font-semibold text-[#0b1c30] block">Quantité vendue</span>
              <span className="text-[11px] text-[#64748b]">
                Stock dispo : <strong className="text-[#00685d]">{maxStock} unités</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-[#e2e8f0] font-bold text-sm text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={maxStock}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(maxStock, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-12 h-8 text-center font-bold text-sm bg-white border border-[#e2e8f0] rounded-lg text-[#0b1c30]"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                className="w-8 h-8 rounded-lg bg-white border border-[#e2e8f0] font-bold text-sm text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Payment Method Selector (African Mobile Money standard) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Moyen de Règlement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('wave')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'wave'
                    ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                    : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                }`}
              >
                <span className="font-bold text-xs text-[#1da1f2]">Wave</span>
                <span className="text-[10px] text-[#64748b]">0% frais</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('orange_money')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'orange_money'
                    ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                    : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                }`}
              >
                <span className="font-bold text-xs text-[#ff7900]">Orange M.</span>
                <span className="text-[10px] text-[#64748b]">Mobile Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mtn_momo')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'mtn_momo'
                    ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                    : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                }`}
              >
                <span className="font-bold text-xs text-[#ffcc00] text-stroke">MTN MoMo</span>
                <span className="text-[10px] text-[#64748b]">Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                    : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                }`}
              >
                <span className="font-bold text-xs text-[#0b1c30]">Espèces</span>
                <span className="text-[10px] text-[#64748b]">Comptoir / COD</span>
              </button>
            </div>
          </div>

          {/* Customer info (Optional but useful for receipt) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#64748b]">Nom Client</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 px-2.5 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#64748b]">Téléphone Mobile</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-9 px-2.5 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Total Bar */}
          <div className="p-3.5 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#64748b] block">Total à encaisser</span>
              <span className="font-headline font-bold text-xl text-[#00685d] tabular-nums">
                {formatFCFA(totalAmount)}
              </span>
            </div>
            <span className="px-2.5 py-1 bg-[#acedda] text-[#065043] rounded-lg font-bold text-[11px]">
              Enregistrement direct
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:text-[#0b1c30] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00685d] hover:bg-[#005048] text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 text-xs"
            >
              <Receipt size={17} />
              <span>Valider la Vente ({formatFCFA(totalAmount)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Le contenu n'est monté qu'à l'ouverture : les hooks restent stables et le formulaire repart de zéro.
export const QuickSaleModal: React.FC<QuickSaleModalProps> = (props) =>
  props.isOpen ? <QuickSaleModalContent {...props} /> : null;
