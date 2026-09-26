export type ProductCategory = 
  | 'Électronique & IT' 
  | 'Audio & Casques' 
  | 'Périphériques & Gaming' 
  | 'Câbles & Adaptateurs' 
  | 'Housses & Rangement';

export type StockLevelType = 'all' | 'normal' | 'low' | 'out_of_stock';

export type WarehouseHub = 
  | 'Dépôt Central Treichville' 
  | 'Point Relais Cocody' 
  | 'Dépôt Yopougon' 
  | 'Hub Express Plateau';

export type ProductColor = 'Rouge' | 'Bleu' | 'Jaune' | 'Noir';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number; // In FCFA, e.g. 68 000 FCFA
  costPrice: number; // In FCFA, e.g. 42 000 FCFA
  stock: number;
  lowStockThreshold: number;
  warehouseLocation: string; // e.g. Treichville Hangar A-12
  warehouseHub: WarehouseHub;
  rating: number;
  reviewCount: number;
  reviewCountLabel?: string;
  soldCount: number;
  color: ProductColor;
  imageUrl: string;
  isFavorite: boolean;
  turnoverDays: number;
  description: string;
  lastUpdated: string;
  vendorId?: string;
}

export interface FilterState {
  searchQuery: string;
  categories: ProductCategory[];
  priceRanges: string[]; // e.g. ['0-30000', '30000-50000', '50000-100000', '100000+']
  minPrice: number;
  maxPrice: number;
  stockLevel: StockLevelType;
  warehouses: WarehouseHub[];
  colors: ProductColor[];
  vendors: string[];
}

export type SortOption = 
  | 'rating_desc'
  | 'price_asc'
  | 'price_desc'
  | 'stock_asc'
  | 'stock_desc'
  | 'sales_desc';

export type ViewMode = 'grid' | 'list';

export type ActiveNavScreen = 
  | 'inventory-catalog'
  | 'sales-orders'
  | 'cashflow-summary'
  | 'vendors';

export type PaymentMethod = 'wave' | 'orange_money' | 'mtn_momo' | 'cash';

export type DeliveryMode = 'retrait_boutique' | 'livraison_express';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleOrder {
  id: string;
  customerId?: string; // compte client ayant passé la commande sur la marketplace
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  deliveryMode?: DeliveryMode;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number; // in FCFA
  }[];
  totalAmount: number; // in FCFA
  paymentMethod: PaymentMethod;
  status: 'paye' | 'en_livraison' | 'livre';
  hub: WarehouseHub;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'vente' | 'reception' | 'ajustement' | 'retour';
  quantityChange: number;
  location?: string;
  date: string;
  operator: string;
  reason: string;
}

export type VendorStatus = 'actif' | 'en_attente' | 'suspendu';

export type VendorLegalForm =
  | 'particulier'
  | 'entreprise_individuelle'
  | 'sarl'
  | 'sa';

export type PayoutMethod = 'wave' | 'orange_money' | 'mtn_momo' | 'virement';

export interface Vendor {
  id: string;
  shopName: string;
  slug: string;
  tagline: string;
  categories: ProductCategory[];
  brandColor: string;
  ownerName: string;
  phone: string;
  email: string;
  commune: string;
  address: string;
  legalForm: VendorLegalForm;
  rccm?: string;
  ncc?: string;
  payoutMethod: PayoutMethod;
  payoutAccount: string;
  commissionRate: number; // % prélevé par DJASSA sur chaque vente
  hub: WarehouseHub;
  deliveryModes: DeliveryMode[];
  status: VendorStatus;
  createdAt: string; // ISO
  accessCode: string; // code à 6 chiffres pour se connecter à l'espace vendeur
}

export type Session =
  | { role: 'admin'; name: string; email: string }
  | { role: 'vendor'; vendorId: string }
  | { role: 'customer'; customerId: string };

export interface Customer {
  id: string;
  fullName: string;
  phone: string; // format normalisé +225 XX XX XX XX XX, sert d'identifiant
  commune: string;
  address: string;
  /** Démo uniquement : empreinte locale du mot de passe. En production, hachage côté serveur (bcrypt/argon2). */
  passwordHash: string;
  createdAt: string;
}
