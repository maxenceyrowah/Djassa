import {
  DeliveryMode,
  PayoutMethod,
  Product,
  ProductCategory,
  SaleOrder,
  Vendor,
  VendorLegalForm,
  VendorStatus,
  WarehouseHub
} from '../types/inventory';

export const ALL_HUBS: WarehouseHub[] = [
  'Dépôt Central Treichville',
  'Point Relais Cocody',
  'Dépôt Yopougon',
  'Hub Express Plateau'
];

export const ALL_CATEGORIES: ProductCategory[] = [
  'Électronique & IT',
  'Audio & Casques',
  'Périphériques & Gaming',
  'Câbles & Adaptateurs',
  'Housses & Rangement'
];

export const ABIDJAN_COMMUNES = [
  'Abobo',
  'Adjamé',
  'Attécoubé',
  'Cocody',
  'Koumassi',
  'Marcory',
  'Plateau',
  'Port-Bouët',
  'Treichville',
  'Yopougon',
  'Bingerville',
  'Songon',
  'Anyama'
];

/** Hub le plus proche pour chaque commune, utilisé pour pré-remplir l'étape logistique. */
export const COMMUNE_TO_HUB: Record<string, WarehouseHub> = {
  Abobo: 'Point Relais Cocody',
  Adjamé: 'Hub Express Plateau',
  Attécoubé: 'Dépôt Yopougon',
  Cocody: 'Point Relais Cocody',
  Koumassi: 'Dépôt Central Treichville',
  Marcory: 'Dépôt Central Treichville',
  Plateau: 'Hub Express Plateau',
  'Port-Bouët': 'Dépôt Central Treichville',
  Treichville: 'Dépôt Central Treichville',
  Yopougon: 'Dépôt Yopougon',
  Bingerville: 'Point Relais Cocody',
  Songon: 'Dépôt Yopougon',
  Anyama: 'Point Relais Cocody'
};

export const LEGAL_FORM_LABELS: Record<VendorLegalForm, string> = {
  particulier: 'Particulier',
  entreprise_individuelle: 'Entreprise individuelle',
  sarl: 'SARL',
  sa: 'SA'
};

export const PAYOUT_LABELS: Record<PayoutMethod, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  virement: 'Virement bancaire'
};

export const STATUS_META: Record<VendorStatus, { label: string; className: string; dot: string }> = {
  actif: { label: 'Actif', className: 'bg-[#e6f6f1] text-[#00685d]', dot: 'bg-[#00a38f]' },
  en_attente: { label: 'En attente', className: 'bg-[#fff7ed] text-[#b45309]', dot: 'bg-[#f59e0b]' },
  suspendu: { label: 'Suspendu', className: 'bg-[#fdecec] text-[#ba1a1a]', dot: 'bg-[#ba1a1a]' }
};

export const BRAND_COLORS = ['#00685d', '#1d4ed8', '#b45309', '#be123c', '#7c3aed', '#0f766e', '#334155'];

/** Commission DJASSA par défaut selon la forme juridique (%). */
export function defaultCommission(legalForm: VendorLegalForm): number {
  return legalForm === 'particulier' ? 12 : legalForm === 'entreprise_individuelle' ? 10 : 8;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Normalise un numéro ivoirien (10 chiffres depuis 2021) au format "+225 07 48 92 11 02".
 * Retourne null si le numéro n'est pas valide.
 */
export function normalizeCIPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00225')) digits = digits.slice(5);
  else if (digits.startsWith('225') && digits.length === 13) digits = digits.slice(3);
  if (digits.length !== 10) return null;
  if (!/^(01|05|07|21|25|27)/.test(digits)) return null;
  return '+225 ' + digits.match(/.{2}/g)!.join(' ');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** RCCM ivoirien, ex : CI-ABJ-2024-B-12345 */
export function isValidRCCM(rccm: string): boolean {
  return /^CI-[A-Z]{3}-\d{4}-[A-Z]-\d{3,6}$/i.test(rccm.trim());
}

export interface VendorDraft {
  shopName: string;
  tagline: string;
  categories: ProductCategory[];
  brandColor: string;
  ownerName: string;
  phone: string;
  email: string;
  commune: string;
  address: string;
  legalForm: VendorLegalForm;
  rccm: string;
  ncc: string;
  payoutMethod: PayoutMethod;
  payoutAccount: string;
  commissionRate: number;
  hub: WarehouseHub;
  deliveryModes: DeliveryMode[];
  acceptTerms: boolean;
}

export const EMPTY_VENDOR_DRAFT: VendorDraft = {
  shopName: '',
  tagline: '',
  categories: [],
  brandColor: BRAND_COLORS[0],
  ownerName: '',
  phone: '',
  email: '',
  commune: '',
  address: '',
  legalForm: 'entreprise_individuelle',
  rccm: '',
  ncc: '',
  payoutMethod: 'wave',
  payoutAccount: '',
  commissionRate: defaultCommission('entreprise_individuelle'),
  hub: 'Dépôt Central Treichville',
  deliveryModes: ['retrait_boutique', 'livraison_express'],
  acceptTerms: false
};

export type VendorStep = 'boutique' | 'contact' | 'legal' | 'logistique' | 'recap';

export const VENDOR_STEPS: { id: VendorStep; label: string; hint: string }[] = [
  { id: 'boutique', label: 'Boutique', hint: 'Nom, univers et identité' },
  { id: 'contact', label: 'Responsable', hint: 'Qui gère la boutique' },
  { id: 'legal', label: 'Légal & paiement', hint: 'Statut et reversements' },
  { id: 'logistique', label: 'Logistique', hint: 'Hub et livraison' },
  { id: 'recap', label: 'Validation', hint: 'Vérifier et publier' }
];

export type VendorErrors = Partial<Record<keyof VendorDraft, string>>;

/** Valide uniquement les champs de l'étape donnée. */
export function validateVendorStep(
  step: VendorStep,
  draft: VendorDraft,
  existingVendors: Pick<Vendor, 'slug'>[] = []
): VendorErrors {
  const errors: VendorErrors = {};

  if (step === 'boutique') {
    const name = draft.shopName.trim();
    if (name.length < 3) errors.shopName = 'Le nom doit contenir au moins 3 caractères.';
    else if (existingVendors.some((v) => v.slug === slugify(name)))
      errors.shopName = 'Une boutique porte déjà ce nom sur DJASSA.';
    if (draft.categories.length === 0) errors.categories = 'Choisissez au moins une catégorie.';
    if (draft.tagline.length > 90) errors.tagline = '90 caractères maximum.';
  }

  if (step === 'contact') {
    if (draft.ownerName.trim().split(/\s+/).filter(Boolean).length < 2)
      errors.ownerName = 'Indiquez le prénom et le nom.';
    if (!normalizeCIPhone(draft.phone))
      errors.phone = 'Numéro ivoirien à 10 chiffres attendu (ex : 07 48 92 11 02).';
    if (draft.email.trim() && !isValidEmail(draft.email)) errors.email = 'Adresse e-mail invalide.';
    if (!draft.commune) errors.commune = 'Sélectionnez une commune.';
  }

  if (step === 'legal') {
    if (draft.legalForm !== 'particulier') {
      if (!isValidRCCM(draft.rccm)) errors.rccm = 'Format attendu : CI-ABJ-2024-B-12345.';
    }
    if (draft.payoutMethod === 'virement') {
      if (draft.payoutAccount.replace(/\s/g, '').length < 10)
        errors.payoutAccount = 'IBAN / RIB incomplet.';
    } else if (!normalizeCIPhone(draft.payoutAccount)) {
      errors.payoutAccount = 'Numéro Mobile Money invalide.';
    }
    if (draft.commissionRate < 5 || draft.commissionRate > 25)
      errors.commissionRate = 'La commission doit être comprise entre 5 % et 25 %.';
  }

  if (step === 'logistique') {
    if (draft.deliveryModes.length === 0) errors.deliveryModes = 'Activez au moins un mode de remise.';
  }

  if (step === 'recap') {
    if (!draft.acceptTerms) errors.acceptTerms = 'Le vendeur doit accepter la charte DJASSA.';
  }

  return errors;
}

export function validateVendorDraft(
  draft: VendorDraft,
  existingVendors: Pick<Vendor, 'slug'>[] = []
): VendorErrors {
  return VENDOR_STEPS.reduce<VendorErrors>(
    (acc, s) => ({ ...acc, ...validateVendorStep(s.id, draft, existingVendors) }),
    {}
  );
}

export function buildVendorFromDraft(
  draft: VendorDraft,
  options: { now?: Date; accessCode: string; selfSignup?: boolean }
): Vendor {
  const now = options.now ?? new Date();
  const isCompany = draft.legalForm !== 'particulier';
  return {
    id: `vnd-${now.getTime()}`,
    shopName: draft.shopName.trim(),
    slug: slugify(draft.shopName),
    tagline: draft.tagline.trim(),
    categories: draft.categories,
    brandColor: draft.brandColor,
    ownerName: draft.ownerName.trim(),
    phone: normalizeCIPhone(draft.phone) ?? draft.phone.trim(),
    email: draft.email.trim(),
    commune: draft.commune,
    address: draft.address.trim(),
    legalForm: draft.legalForm,
    rccm: isCompany ? draft.rccm.trim().toUpperCase() : undefined,
    ncc: isCompany && draft.ncc.trim() ? draft.ncc.trim().toUpperCase() : undefined,
    payoutMethod: draft.payoutMethod,
    payoutAccount:
      draft.payoutMethod === 'virement'
        ? draft.payoutAccount.trim().toUpperCase()
        : normalizeCIPhone(draft.payoutAccount) ?? draft.payoutAccount.trim(),
    commissionRate: draft.commissionRate,
    hub: draft.hub,
    deliveryModes: draft.deliveryModes,
    // Créée par un admin : les sociétés immatriculées sont activées directement, les particuliers passent en revue KYC.
    // Inscription publique : toujours en attente de validation par un admin.
    status: !options.selfSignup && isCompany ? 'actif' : 'en_attente',
    createdAt: now.toISOString(),
    accessCode: options.accessCode
  };
}

export interface VendorStats {
  productCount: number;
  stockUnits: number;
  stockValueFCFA: number;
  lowStockCount: number;
  revenueFCFA: number;
  commissionFCFA: number;
  unitsSold: number;
}

/** Agrège le catalogue et les ventes d'un vendeur. Le CA est calculé par ligne d'article (hors frais de livraison). */
export function computeVendorStats(vendor: Vendor, products: Product[], orders: SaleOrder[]): VendorStats {
  const vendorProducts = products.filter((p) => p.vendorId === vendor.id);
  const productIds = new Set(vendorProducts.map((p) => p.id));

  let revenueFCFA = 0;
  let unitsSold = 0;
  for (const order of orders) {
    for (const item of order.items) {
      if (productIds.has(item.productId)) {
        revenueFCFA += item.price * item.quantity;
        unitsSold += item.quantity;
      }
    }
  }

  return {
    productCount: vendorProducts.length,
    stockUnits: vendorProducts.reduce((s, p) => s + p.stock, 0),
    stockValueFCFA: vendorProducts.reduce((s, p) => s + p.price * p.stock, 0),
    lowStockCount: vendorProducts.filter((p) => p.stock <= p.lowStockThreshold).length,
    revenueFCFA,
    commissionFCFA: Math.round((revenueFCFA * vendor.commissionRate) / 100),
    unitsSold
  };
}

export function vendorInitials(shopName: string): string {
  const words = shopName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'DJ';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
