import React, { useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { CartItem, PaymentMethod, DeliveryMode, WarehouseHub } from '../types/inventory';
import { formatFCFA } from '../utils/format';
import { ShoppingBag, X, PackageX, Trash2, Store, Bike, BadgeCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onValidateOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerCity: string;
    paymentMethod: PaymentMethod;
    deliveryMode: DeliveryMode;
    hub: WarehouseHub;
    deliveryFee: number;
  }) => void;
  /** Coordonnées du client connecté, pour pré-remplir le formulaire. */
  customer?: { name: string; phone: string; city: string };
  /** Défini quand une connexion est requise avant de commander (visiteur sans compte). */
  onRequireAuth?: () => void;
}

const CartDrawerContent: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onValidateOrder,
  customer,
  onRequireAuth
}) => {
  useEscapeKey(onClose);

  const [customerName, setCustomerName] = useState(customer?.name ?? '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone ?? '+225 ');
  const [customerCity, setCustomerCity] = useState(customer?.city ?? 'Abidjan (Cocody)');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('retrait_boutique');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');
  const [hub, setHub] = useState<WarehouseHub>('Dépôt Central Treichville');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = deliveryMode === 'livraison_express' ? 2000 : 0;
  const grandTotal = subtotal + deliveryFee;
  const totalArticles = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (onRequireAuth) return onRequireAuth();

    setIsSubmitting(true);
    setTimeout(() => {
      onValidateOrder({
        customerName: customerName.trim() || 'Client Djassa',
        customerPhone: customerPhone.trim() || '+225 00 00 00 00',
        customerCity: customerCity.trim() || 'Abidjan',
        paymentMethod,
        deliveryMode,
        hub,
        deliveryFee
      });
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 border-l border-[#e2e8f0]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#acedda] text-[#065043] flex items-center justify-center font-bold">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="font-headline font-bold text-base text-[#0b1c30]">
                Panier & Validation Commande
              </h2>
              <p className="text-xs text-[#64748b]">
                {totalArticles} article{totalArticles > 1 ? 's' : ''} dans le panier
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-[11px] text-[#ba1a1a] hover:underline font-medium px-2 py-1"
                title="Vider tout le panier"
              >
                Vider
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-[#64748b] hover:text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5 text-xs">
          {cartItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#64748b]">
                <PackageX size={32} />
              </div>
              <h3 className="font-headline font-semibold text-base text-[#0b1c30]">
                Votre panier est vide
              </h3>
              <p className="text-xs text-[#64748b] max-w-xs">
                Sélectionnez des articles dans le catalogue Djassa et cliquez sur "+ Panier" pour préparer une commande.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-[#00685d] text-white rounded-lg text-xs font-semibold hover:bg-[#005048] transition-colors"
              >
                Parcourir les articles
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Articles Sélectionnés ({cartItems.length})
                </span>
                <div className="divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-xl overflow-hidden bg-white shadow-2xs">
                  {cartItems.map((item) => {
                    const itemTotal = item.product.price * item.quantity;
                    return (
                      <div key={item.product.id} className="p-3 flex items-center gap-3 hover:bg-[#f8f9ff] transition-colors">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-12 h-12 object-contain bg-[#eff4ff] p-1 rounded-lg border border-[#e2e8f0] flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-[#0b1c30] truncate">
                            {item.product.name}
                          </h4>
                          <span className="text-[11px] text-[#00685d] font-bold">
                            {formatFCFA(item.product.price)}
                          </span>
                          <span className="text-[10px] text-[#64748b] block">
                            Stock dispo : {item.product.stock} u.
                          </span>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 bg-[#eff4ff] p-0.5 rounded-lg border border-[#dce9ff]">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-[#0b1c30] hover:bg-white font-bold transition-colors"
                            title="Diminuer"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold text-xs text-[#0b1c30]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-6 h-6 rounded flex items-center justify-center text-[#0b1c30] hover:bg-white font-bold transition-colors disabled:opacity-30"
                            title="Augmenter"
                          >
                            +
                          </button>
                        </div>

                        {/* Item Total & Delete */}
                        <div className="text-right flex flex-col items-end">
                          <span className="font-headline font-bold text-xs text-[#0b1c30] tabular-nums">
                            {formatFCFA(itemTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-[#64748b] hover:text-[#ba1a1a] transition-colors mt-1"
                            title="Supprimer l'article"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {onRequireAuth && (
                <div className="p-4 rounded-xl bg-[#eefaf6] border border-[#b7e4d8] flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#0b1c30]">Encore une étape avant de commander</span>
                  <span className="text-xs text-[#3d4946] leading-relaxed">
                    Connectez-vous ou créez votre compte client en 30 secondes : vous pourrez suivre votre livraison et retrouver vos reçus.
                    Votre panier est conservé.
                  </span>
                </div>
              )}

              {/* Validation Form */}
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className={`flex flex-col gap-4 ${onRequireAuth ? 'hidden' : ''}`}>
                {/* Mode de réception / livraison */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-[#0b1c30] uppercase tracking-wider">
                    Mode de Réception
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMode('retrait_boutique')}
                      className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                        deliveryMode === 'retrait_boutique'
                          ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                          : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Store size={16} />
                        <span className="font-semibold text-xs">Retrait Dépôt</span>
                      </div>
                      <span className="text-[10px] text-[#00685d] font-semibold mt-1">Gratuit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMode('livraison_express')}
                      className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                        deliveryMode === 'livraison_express'
                          ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                          : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Bike size={16} />
                        <span className="font-semibold text-xs">Livraison Express</span>
                      </div>
                      <span className="text-[10px] text-[#64748b] font-medium mt-1">+2 000 FCFA</span>
                    </button>
                  </div>
                </div>

                {/* Dépôt Source si Retrait */}
                {deliveryMode === 'retrait_boutique' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-[#0b1c30]">
                      Dépôt de retrait
                    </label>
                    <select
                      value={hub}
                      onChange={(e) => setHub(e.target.value as WarehouseHub)}
                      className="h-9 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d]"
                    >
                      <option value="Dépôt Central Treichville">Dépôt Central Treichville</option>
                      <option value="Point Relais Cocody">Point Relais Cocody</option>
                      <option value="Dépôt Yopougon">Dépôt Yopougon</option>
                      <option value="Hub Express Plateau">Hub Express Plateau</option>
                    </select>
                  </div>
                )}

                {/* Client Details */}
                <div className="flex flex-col gap-2 bg-[#f8f9ff] p-3.5 rounded-xl border border-[#e2e8f0]">
                  <span className="text-[11px] font-semibold text-[#0b1c30] uppercase tracking-wider">
                    Informations Acheteur
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-[#64748b]">Nom complet du client</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Yao Koffi"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-8 px-2.5 bg-white border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-[#64748b]">Numéro Mobile (Wave / OM)</label>
                      <input
                        type="text"
                        required
                        placeholder="+225 07..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="h-8 px-2.5 bg-white border border-[#e2e8f0] rounded-lg text-xs font-mono text-[#0b1c30] focus:outline-none focus:border-[#00685d]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-[10px] text-[#64748b]">Commune / Quartier de destination</label>
                    <input
                      type="text"
                      placeholder="ex: Abidjan Cocody Riviera 2"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="h-8 px-2.5 bg-white border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d]"
                    />
                  </div>
                </div>

                {/* Moyen de Paiement */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-[#0b1c30] uppercase tracking-wider">
                    Mode de Règlement
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wave')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        paymentMethod === 'wave'
                          ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                          : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#1da1f2]">Wave</span>
                      <span className="text-[9px] text-[#64748b]">0% frais</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('orange_money')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        paymentMethod === 'orange_money'
                          ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                          : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#ff7900]">Orange M.</span>
                      <span className="text-[9px] text-[#64748b]">MoMo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mtn_momo')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        paymentMethod === 'mtn_momo'
                          ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                          : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#e6b800]">MTN</span>
                      <span className="text-[9px] text-[#64748b]">MoMo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-[#00685d] bg-[#eff4ff] text-[#00685d] font-bold shadow-xs'
                          : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#0b1c30]">Espèces</span>
                      <span className="text-[9px] text-[#64748b]">À livraison</span>
                    </button>
                  </div>
                </div>

                {/* Recapitulatif Total */}
                <div className="bg-[#f8f9ff] p-3.5 rounded-xl border border-[#e2e8f0] flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-[#64748b]">
                    <span>Sous-total articles ({totalArticles}) :</span>
                    <span className="font-semibold text-[#0b1c30]">{formatFCFA(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748b]">
                    <span>Frais de réception / livraison :</span>
                    <span className="font-semibold text-[#0b1c30]">
                      {deliveryFee > 0 ? formatFCFA(deliveryFee) : 'Gratuit'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#e2e8f0] flex justify-between items-baseline">
                    <span className="font-bold text-sm text-[#0b1c30]">Total à régler :</span>
                    <span className="font-headline font-bold text-xl text-[#00685d] tabular-nums">
                      {formatFCFA(grandTotal)}
                    </span>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer Checkout Action */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-white border-t border-[#e2e8f0] flex items-center gap-3">
            <div className="flex-1">
              <span className="text-[10px] text-[#64748b] block">Total TTC à encaisser</span>
              <span className="font-headline font-bold text-base text-[#00685d] tabular-nums">
                {formatFCFA(grandTotal)}
              </span>
            </div>
            <button
              type={onRequireAuth ? 'button' : 'submit'}
              form={onRequireAuth ? undefined : 'checkout-form'}
              onClick={onRequireAuth}
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#00685d] hover:bg-[#005048] active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs disabled:opacity-50"
            >
              <BadgeCheck size={18} />
              <span>{onRequireAuth ? 'Se connecter pour commander' : isSubmitting ? 'Validation...' : 'Valider la commande'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Le contenu n'est monté qu'à l'ouverture : les hooks restent stables et le formulaire repart de zéro.
export const CartDrawer: React.FC<CartDrawerProps> = (props) =>
  props.isOpen ? <CartDrawerContent {...props} /> : null;
