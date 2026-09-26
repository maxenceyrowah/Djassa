import React, { useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Product } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { Layers, X, ArrowRight, CheckCheck } from 'lucide-react';

interface BulkAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProductIds: string[];
  onApplyBulkAdjust: (
    actionType: 'price_percent' | 'price_fixed' | 'stock_add',
    value: number,
    targetIds: string[]
  ) => void;
}

const BulkAdjustModalContent: React.FC<BulkAdjustModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProductIds,
  onApplyBulkAdjust
}) => {
  useEscapeKey(onClose);

  const [targetScope, setTargetScope] = useState<'selected' | 'all'>(selectedProductIds.length > 0 ? 'selected' : 'all');
  const [actionType, setActionType] = useState<'price_percent' | 'stock_add'>('price_percent');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(5);

  const targets = targetScope === 'selected' && selectedProductIds.length > 0
    ? products.filter((p) => selectedProductIds.includes(p.id))
    : products;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const targetIds = targets.map((p) => p.id);
    onApplyBulkAdjust(actionType, adjustmentValue, targetIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between bg-[#eff4ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#00685d] text-white flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="font-headline font-semibold text-base text-[#0b1c30]">
                Ajustement en Masse du Catalogue
              </h2>
              <p className="text-xs text-[#64748b]">
                {targets.length} article{targets.length > 1 ? 's' : ''} ciblée{targets.length > 1 ? 's' : ''}
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
        <form onSubmit={handleApply} className="p-6 flex flex-col gap-4 text-xs">
          {/* Scope selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Périmètre d'application
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetScope('selected')}
                className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                  targetScope === 'selected'
                    ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d]'
                    : 'border-[#e2e8f0] bg-white text-[#64748b]'
                }`}
              >
                <span className="font-semibold text-xs">Articles cochés</span>
                <span className="text-[11px] opacity-80">
                  {selectedProductIds.length} sélectionné{selectedProductIds.length > 1 ? 's' : ''}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                  targetScope === 'all'
                    ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d]'
                    : 'border-[#e2e8f0] bg-white text-[#64748b]'
                }`}
              >
                <span className="font-semibold text-xs">Tout le catalogue actif</span>
                <span className="text-[11px] opacity-80">{products.length} articles</span>
              </button>
            </div>
          </div>

          {/* Operation type */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Opération
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType('price_percent')}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                  actionType === 'price_percent'
                    ? 'border-[#00685d] bg-[#00685d] text-white shadow-xs'
                    : 'border-[#e2e8f0] bg-[#eff4ff] text-[#0b1c30]'
                }`}
              >
                Modifier Prix (%)
              </button>
              <button
                type="button"
                onClick={() => setActionType('stock_add')}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                  actionType === 'stock_add'
                    ? 'border-[#00685d] bg-[#00685d] text-white shadow-xs'
                    : 'border-[#e2e8f0] bg-[#eff4ff] text-[#0b1c30]'
                }`}
              >
                Incrémenter Stock (±)
              </button>
            </div>
          </div>

          {/* Value input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              {actionType === 'price_percent' ? 'Pourcentage d’évolution (ex: +5% ou -10%)' : 'Unités à ajouter ou retirer'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(Number(e.target.value) || 0)}
                className="h-10 px-3 flex-1 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg font-headline font-semibold text-sm text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
              <span className="font-headline font-semibold text-sm text-[#64748b]">
                {actionType === 'price_percent' ? '%' : 'unités'}
              </span>
            </div>
          </div>

          {/* Quick Preview Table of 3 samples */}
          <div className="border border-[#e2e8f0] rounded-xl p-3 bg-[#f8f9ff]">
            <span className="text-[11px] font-semibold text-[#64748b] block mb-2 uppercase tracking-wider">
              Simulation (Échantillon)
            </span>
            <div className="flex flex-col gap-1.5">
              {targets.slice(0, 3).map((p) => {
                const newPrice = actionType === 'price_percent'
                  ? Math.round(p.price * (1 + adjustmentValue / 100))
                  : p.price;
                const newStock = actionType === 'stock_add'
                  ? Math.max(0, p.stock + adjustmentValue)
                  : p.stock;

                return (
                  <div key={p.id} className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#0b1c30] truncate max-w-[180px]">{p.name}</span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      {actionType === 'price_percent' ? (
                        <>
                          <span className="text-[#64748b] line-through">{formatFCFA(p.price)}</span>
                          <ArrowRight size={12} className="text-[#64748b]" />
                          <span className="font-bold text-[#00685d]">{formatFCFA(newPrice)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[#64748b]">{p.stock} u.</span>
                          <ArrowRight size={12} className="text-[#64748b]" />
                          <span className="font-bold text-[#00685d]">{newStock} u.</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
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
              <CheckCheck size={16} />
              <span>Appliquer aux articles</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Le contenu n'est monté qu'à l'ouverture : les hooks restent stables et le formulaire repart de zéro.
export const BulkAdjustModal: React.FC<BulkAdjustModalProps> = (props) =>
  props.isOpen ? <BulkAdjustModalContent {...props} /> : null;
