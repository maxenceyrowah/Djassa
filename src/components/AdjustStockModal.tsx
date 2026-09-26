import React, { useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Product } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { Calendar, X, Check } from 'lucide-react';

interface AdjustStockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, newStock: number, reason: string, location: string) => void;
}

const AdjustStockModalContent: React.FC<Omit<AdjustStockModalProps, 'product'> & { product: Product }> = ({
  product,
  isOpen,
  onClose,
  onSave
}) => {
  useEscapeKey(onClose);

  const [quantity, setQuantity] = useState(product.stock);
  const [reason, setReason] = useState('Inventaire physique périodique');
  const [location, setLocation] = useState(product.warehouseLocation);

  const reasons = [
    'Inventaire physique périodique',
    'Arrivage nouveau colis / fournisseur',
    'Correction de comptage en boutique',
    'Casse / Produit détérioré',
    'Retour client conforme',
    'Prélèvement pour test / vitrine'
  ];

  const diff = quantity - product.stock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(product.id, Math.max(0, quantity), reason, location);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between bg-[#eff4ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#00685d] text-white flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="font-headline font-semibold text-base text-[#0b1c30]">
                Ajustement Manuel de Stock
              </h2>
              <p className="text-xs text-[#64748b]">
                {product.name} • <span className="font-bold text-[#00685d]">{formatFCFA(product.price)}</span>
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {/* Stock comparison badge */}
          <div className="flex items-center justify-between bg-[#f8f9ff] p-3 rounded-xl border border-[#e2e8f0]">
            <div>
              <span className="text-[#64748b] block text-[11px]">Stock Actuel</span>
              <span className="font-headline font-semibold text-lg text-[#0b1c30] tabular-nums">
                {product.stock} unités
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#64748b] block text-[11px]">Variation</span>
              <span
                className={`font-headline font-semibold text-base tabular-nums ${
                  diff > 0 ? 'text-[#00685d]' : diff < 0 ? 'text-[#ba1a1a]' : 'text-[#64748b]'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff} unités
              </span>
            </div>
          </div>

          {/* Stepper controls */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Quantité Réelle Comptée
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(0, q - 10))}
                className="h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#eff4ff] font-semibold text-[#0b1c30] transition-colors"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                className="h-10 w-10 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#eff4ff] font-semibold text-[#0b1c30] transition-colors flex items-center justify-center"
              >
                -1
              </button>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 h-10 px-3 text-center font-headline font-semibold text-lg text-[#0b1c30] bg-[#eff4ff] border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-10 w-10 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#eff4ff] font-semibold text-[#0b1c30] transition-colors flex items-center justify-center"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 10)}
                className="h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#eff4ff] font-semibold text-[#0b1c30] transition-colors"
              >
                +10
              </button>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Motif de l'ajustement
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Location within warehouse */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Emplacement / Rayon
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f1f5f9] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:text-[#0b1c30] hover:bg-[#eff4ff] font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#00685d] hover:bg-[#005048] text-white font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check size={16} />
              <span>Enregistrer le stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Le contenu n'est monté qu'à l'ouverture : les hooks restent stables et le formulaire repart de zéro.
export const AdjustStockModal: React.FC<AdjustStockModalProps> = (props) =>
  props.isOpen && props.product ? <AdjustStockModalContent {...props} product={props.product!} /> : null;
