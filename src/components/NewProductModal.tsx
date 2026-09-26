import React, { useCallback, useState } from 'react';
import { Product, ProductCategory, WarehouseHub, ProductColor, Vendor } from '../types/inventory';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (newProduct: Product) => void;
  vendors: Vendor[];
  initialVendorId?: string;
  existingSkus: string[];
  /** Vendeur connecté : le produit lui est obligatoirement rattaché. */
  lockVendor?: boolean;
}

const NewProductModalContent: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  vendors,
  initialVendorId,
  existingSkus,
  lockVendor = false
}) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  useEscapeKey(handleClose);

  const initialVendor = vendors.find((v) => v.id === initialVendorId);
  const [vendorId, setVendorId] = useState(initialVendor?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState(`DJA-${Math.floor(1000 + Math.random() * 9000)}`);
  const [category, setCategory] = useState<ProductCategory>(initialVendor?.categories[0] ?? 'Électronique & IT');
  const [price, setPrice] = useState(45000);
  const [costPrice, setCostPrice] = useState(25000);
  const [stock, setStock] = useState(25);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [warehouseHub, setWarehouseHub] = useState<WarehouseHub>(initialVendor?.hub ?? 'Dépôt Central Treichville');
  const [warehouseLocation, setWarehouseLocation] = useState('Treichville Allée B-02');
  const [color, setColor] = useState<ProductColor>('Noir');
  const [description, setDescription] = useState('');

  const presetImages = [
    { label: 'Clavier', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvi3NseTw3gFjWSFtaE6-newB97qB0YX_b7D8z5bMOkSV1D5ghraPpg3lwlYQXUj7nmbpbxeqlkmv1NZeOpG7NXRQ5SysXwvSGvZ9cgmRbkTvU1T45m4zscNekrASzYz7iIBxRdBXwusIu2neRKtviHlG1l6NyN3KP2Qey8zxk16Jd-Vi1EUS8D-E3m4lfWDnldjJFnm9PZbbLSsdGG1zOUKbQy4ICOyZNnjDLvIO1r_9nfta93ME' },
    { label: 'Souris', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGC8kkKfHzll87HPaD8nchXktrUu1C8O3K6BUO93buvwAe2MaH4kjwaf78HFkHvjnsklDJ4rBVy493xr635SvAdCF5VqXUy6YGRNqp_u7rl7cMeAInZc59fDD-xvU5dubxWmaa6OlFB6s8lBFI6yg7YHMQyqTTT8hdWo9KQZmu14UgEnFFgyTgubWYOTpjqRJwn84QhIdWCYOFLknO7HcXKC__FlTI8HOd9CDvqmSsFIhTC9ph6PI' },
    { label: 'Casque', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn75V025XnVqX3SjNLFE0VrmUhg50qt99-rE_zUw_P4PTXUNpiZRy2MnZIFmyPBT7j5CXED4j3tsV52hIohIKd9zSPhjyMBNjlc_ON1NWPHhPDSXCX9LpCMMy-Tvtz3EVrYSlEL31LN3xO-TIVZ11Yv-jZ1vyAMufuIVBWxQsCYWpIU2iLbgitTtbECt4RcBs0iwoaLAtn4-bRx10YyLcf0MZBBsmDHPTcNMT4jaR7yz49e1g6nBk' },
    { label: 'Manette', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_ctvhuOKKaOBRSxq7zsMuzKqOjk-UrwVJ6yqpcj3HYcTWf-h_cobDqdOGDQQijcDg2OIAVXQDhpeK9C06cuKANbpZrm-VgYLC22M8RCFFuMOvqRpILFGI5EXRljiUx6RJmBy1_vSaTRFxPtM6Uclf752eYgpiJPETwdnXPYZl3c6aDhnZaE-vIoBABRjY6-1h6XjGKPk1zb6kxcaLdBrJ4vkbmcBUrGW3rwasQs-mdZtpGNnoSc4' },
    { label: 'Câble', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_lNkkackCS6TYIi4HXmgf4hGEL3_zTrbtCpC8pDBjHybK8oN087R6VoqHhOY2UNqHx9q6DVfl_ZVsJDhmkM757QodLMdbrDure7KY-SySgdGRM5eX7-VvgTw2sPFD_AU4_TNLCcfTF5F-LlNj-IjrSY14QqUzSTFWDDwNu4rsbr4XmZzqT2MCHlEFtpRE3vOoFuwfhl8F8b0TS0ehK9KuUzRUaNumOHkonCZtujw8Efuw94iZzQQ' },
  ];

  const [selectedImage, setSelectedImage] = useState(presetImages[0].url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Le nom du produit est obligatoire.');
    if (existingSkus.some((s) => s.toLowerCase() === sku.trim().toLowerCase()))
      return setError(`Le SKU ${sku} existe déjà dans le catalogue.`);
    if (price <= 0) return setError('Le prix de vente doit être supérieur à 0 FCFA.');
    if (costPrice > price) return setError("Le coût d'achat dépasse le prix de vente : la marge serait négative.");

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: sku.trim(),
      name: name.trim(),
      vendorId: vendorId || undefined,
      category,
      price,
      costPrice,
      stock,
      lowStockThreshold,
      warehouseHub,
      warehouseLocation,
      color,
      rating: 5.0,
      reviewCount: 0,
      reviewCountLabel: 'Nouveau',
      soldCount: 0,
      imageUrl: selectedImage,
      isFavorite: false,
      turnoverDays: 14,
      description: description || 'Article référencé dans le stock Djassa.',
      lastUpdated: 'À l’instant'
    };

    onAddProduct(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between bg-[#eff4ff] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#00685d] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </div>
            <div>
              <h2 className="font-headline font-semibold text-base text-[#0b1c30]">
                Ajouter un Article au Djassa
              </h2>
              <p className="text-xs text-[#64748b]">
                Enregistrement dans le catalogue marchand
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#64748b] hover:text-[#0b1c30] hover:bg-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-[#fdecec] border border-[#fecaca] text-[#93000a] font-medium">
              {error}
            </div>
          )}

          {lockVendor && initialVendor && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#eefaf6] border border-[#b7e4d8] text-[#00685d] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: initialVendor.brandColor }} />
              Article publié par {initialVendor.shopName}
            </div>
          )}

          {!lockVendor && vendors.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
                Vendeur
              </label>
              <select
                value={vendorId}
                onChange={(e) => {
                  setVendorId(e.target.value);
                  const v = vendors.find((x) => x.id === e.target.value);
                  if (v) {
                    setWarehouseHub(v.hub);
                    if (!v.categories.includes(category)) setCategory(v.categories[0]);
                  }
                }}
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              >
                <option value="">DJASSA (stock propre)</option>
                {vendors
                  .filter((v) => v.status !== 'suspendu')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.shopName}
                      {v.status === 'en_attente' ? ' (en attente de validation)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
                Nom du produit *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Écouteurs Pro TWS Sans-Fil"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                autoFocus
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
                Code SKU / Réf
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  setError(null);
                }}
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg font-mono text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              >
                <option value="Électronique & IT">Électronique & IT</option>
                <option value="Audio & Casques">Audio & Casques</option>
                <option value="Périphériques & Gaming">Périphériques & Gaming</option>
                <option value="Câbles & Adaptateurs">Câbles & Adaptateurs</option>
                <option value="Housses & Rangement">Housses & Rangement</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
                Couleur
              </label>
              <div className="flex items-center gap-1.5 h-10">
                {(['Noir', 'Rouge', 'Bleu', 'Jaune'] as ProductColor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      color === c
                        ? 'border-[#00685d] bg-[#eff4ff] font-semibold text-[#00685d]'
                        : 'border-[#e2e8f0] bg-white text-[#64748b]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing in FCFA & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] text-[11px]">Prix Vente (FCFA) *</label>
              <input
                type="number"
                step="50"
                min="500"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg font-headline font-bold text-xs text-[#00685d] focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] text-[11px]">Coût Achat (FCFA)</label>
              <input
                type="number"
                step="50"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg font-headline font-semibold text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] text-[11px]">Stock Initial</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value) || 0)}
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg font-headline font-semibold text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] text-[11px]">Seuil Alerte</label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value) || 5)}
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg font-headline font-semibold text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
            </div>
          </div>

          {/* Dépôt & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
                Dépôt Source
              </label>
              <select
                value={warehouseHub}
                onChange={(e) => setWarehouseHub(e.target.value as WarehouseHub)}
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              >
                <option value="Dépôt Central Treichville">Dépôt Central Treichville</option>
                <option value="Point Relais Cocody">Point Relais Cocody</option>
                <option value="Dépôt Yopougon">Dépôt Yopougon</option>
                <option value="Hub Express Plateau">Hub Express Plateau</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
                Rayon / Emplacement
              </label>
              <input
                type="text"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                placeholder="ex: Rayon A-14"
                className="h-10 px-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Photo du produit
            </label>
            <div className="grid grid-cols-5 gap-2">
              {presetImages.map((img) => (
                <button
                  key={img.label}
                  type="button"
                  onClick={() => setSelectedImage(img.url)}
                  className={`aspect-square rounded-lg p-1 bg-[#eff4ff] border-2 transition-all flex flex-col items-center justify-center overflow-hidden ${
                    selectedImage === img.url
                      ? 'border-[#00685d] ring-2 ring-[#00685d]/30'
                      : 'border-transparent hover:border-[#cbd5e1]'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[#0b1c30] uppercase text-[11px] tracking-wider">
              Description de l'article
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Caractéristiques de l'article..."
              className="p-3 bg-[#eff4ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:border-[#00685d] focus:bg-white resize-none"
            />
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
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>Enregistrer dans le Djassa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Le contenu n'est monté qu'à l'ouverture : les hooks restent stables et le formulaire repart de zéro.
export const NewProductModal: React.FC<NewProductModalProps> = (props) =>
  props.isOpen ? <NewProductModalContent {...props} /> : null;
