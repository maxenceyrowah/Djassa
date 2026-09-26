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
  price: number; // In FCFA
  costPrice: number; // In FCFA
  stock: number;
  lowStockThreshold: number;
  warehouseLocation: string;
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
}

export type PaymentMethod = 'wave' | 'orange_money' | 'mtn_momo' | 'cash';
export type DeliveryMode = 'retrait_boutique' | 'livraison_express';

export interface SaleOrder {
  id: string;
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

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'DJ-KEY-401K',
    name: 'Keychron x401K Pro',
    category: 'Électronique & IT',
    price: 68000,
    costPrice: 42000,
    stock: 142,
    lowStockThreshold: 15,
    warehouseLocation: 'Treichville Allée A-12',
    warehouseHub: 'Dépôt Central Treichville',
    rating: 5.0,
    reviewCount: 1042,
    reviewCountLabel: '1000+ Avis',
    soldCount: 1240,
    color: 'Noir',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvi3NseTw3gFjWSFtaE6-newB97qB0YX_b7D8z5bMOkSV1D5ghraPpg3lwlYQXUj7nmbpbxeqlkmv1NZeOpG7NXRQ5SysXwvSGvZ9cgmRbkTvU1T45m4zscNekrASzYz7iIBxRdBXwusIu2neRKtviHlG1l6NyN3KP2Qey8zxk16Jd-Vi1EUS8D-E3m4lfWDnldjJFnm9PZbbLSsdGG1zOUKbQy4ICOyZNnjDLvIO1r_9nfta93ME',
    isFavorite: true,
    turnoverDays: 14.2,
    description: 'Clavier mécanique sans fil robuste pour développeurs et créatifs, châssis aluminium avec rétroéclairage RGB.',
    lastUpdated: 'Il y a 2h'
  },
  {
    id: 'prod-2',
    sku: 'DJ-MOU-900',
    name: 'Souris Gaming Ultra-Light',
    category: 'Périphériques & Gaming',
    price: 22000,
    costPrice: 12500,
    stock: 38,
    lowStockThreshold: 10,
    warehouseLocation: 'Yopougon Rayon B-04',
    warehouseHub: 'Dépôt Yopougon',
    rating: 4.5,
    reviewCount: 10,
    reviewCountLabel: '10 Avis',
    soldCount: 135,
    color: 'Noir',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGC8kkKfHzll87HPaD8nchXktrUu1C8O3K6BUO93buvwAe2MaH4kjwaf78HFkHvjnsklDJ4rBVy493xr635SvAdCF5VqXUy6YGRNqp_u7rl7cMeAInZc59fDD-xvU5dubxWmaa6OlFB6s8lBFI6yg7YHMQyqTTT8hdWo9KQZmu14UgEnFFgyTgubWYOTpjqRJwn84QhIdWCYOFLknO7HcXKC__FlTI8HOd9CDvqmSsFIhTC9ph6PI',
    isFavorite: false,
    turnoverDays: 12.0,
    description: 'Souris alvéolaire ultra-légère 58g avec capteur haute précision 26K DPI et glisse ultra-fluide.',
    lastUpdated: 'Il y a 5h'
  },
  {
    id: 'prod-3',
    sku: 'DJ-AUD-PRO',
    name: 'Casque Audio Sans-Fil Pro',
    category: 'Audio & Casques',
    price: 30000,
    costPrice: 16000,
    stock: 3,
    lowStockThreshold: 10,
    warehouseLocation: 'Treichville Allée A-02',
    warehouseHub: 'Dépôt Central Treichville',
    rating: 4.0,
    reviewCount: 3,
    reviewCountLabel: '3 Avis',
    soldCount: 5,
    color: 'Noir',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn75V025XnVqX3SjNLFE0VrmUhg50qt99-rE_zUw_P4PTXUNpiZRy2MnZIFmyPBT7j5CXED4j3tsV52hIohIKd9zSPhjyMBNjlc_ON1NWPHhPDSXCX9LpCMMy-Tvtz3EVrYSlEL31LN3xO-TIVZ11Yv-jZ1vyAMufuIVBWxQsCYWpIU2iLbgitTtbECt4RcBs0iwoaLAtn4-bRx10YyLcf0MZBBsmDHPTcNMT4jaR7yz49e1g6nBk',
    isFavorite: false,
    turnoverDays: 45.0,
    description: 'Casque circum-aural avec réduction active de bruit hybride et autonomie longue durée de 40 heures.',
    lastUpdated: 'Il y a 30m'
  },
  {
    id: 'prod-4',
    sku: 'DJ-CTL-XB',
    name: 'Manette Pro Multi-Plateforme',
    category: 'Périphériques & Gaming',
    price: 80000,
    costPrice: 48000,
    stock: 89,
    lowStockThreshold: 15,
    warehouseLocation: 'Cocody Box C-18',
    warehouseHub: 'Point Relais Cocody',
    rating: 4.8,
    reviewCount: 150,
    reviewCountLabel: '150 Avis',
    soldCount: 70,
    color: 'Noir',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_ctvhuOKKaOBRSxq7zsMuzKqOjk-UrwVJ6yqpcj3HYcTWf-h_cobDqdOGDQQijcDg2OIAVXQDhpeK9C06cuKANbpZrm-VgYLC22M8RCFFuMOvqRpILFGI5EXRljiUx6RJmBy1_vSaTRFxPtM6Uclf752eYgpiJPETwdnXPYZl3c6aDhnZaE-vIoBABRjY6-1h6XjGKPk1zb6kxcaLdBrJ4vkbmcBUrGW3rwasQs-mdZtpGNnoSc4',
    isFavorite: false,
    turnoverDays: 16.5,
    description: 'Manette sans fil ergonomique avec sticks à effet Hall anti-dérive pour console et PC.',
    lastUpdated: 'Il y a 1j'
  },
  {
    id: 'prod-5',
    sku: 'DJ-CBL-COIL',
    name: 'Câble Tressé Custom Coiled',
    category: 'Câbles & Adaptateurs',
    price: 40000,
    costPrice: 19000,
    stock: 210,
    lowStockThreshold: 20,
    warehouseLocation: 'Treichville Allée A-05',
    warehouseHub: 'Dépôt Central Treichville',
    rating: 5.0,
    reviewCount: 1,
    reviewCountLabel: '1 Avis',
    soldCount: 135,
    color: 'Noir',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_lNkkackCS6TYIi4HXmgf4hGEL3_zTrbtCpC8pDBjHybK8oN087R6VoqHhOY2UNqHx9q6DVfl_ZVsJDhmkM757QodLMdbrDure7KY-SySgdGRM5eX7-VvgTw2sPFD_AU4_TNLCcfTF5F-LlNj-IjrSY14QqUzSTFWDDwNu4rsbr4XmZzqT2MCHlEFtpRE3vOoFuwfhl8F8b0TS0ehK9KuUzRUaNumOHkonCZtujw8Efuw94iZzQQ',
    isFavorite: false,
    turnoverDays: 18.0,
    description: 'Câble spirale renforcé gainé avec connecteur métallique aviateur détachable GX16 plaqué or.',
    lastUpdated: 'Il y a 3j'
  },
  {
    id: 'prod-6',
    sku: 'DJ-MOU-VERT',
    name: 'Souris Verticale Ergonomique',
    category: 'Périphériques & Gaming',
    price: 110000,
    costPrice: 65000,
    stock: 64,
    lowStockThreshold: 12,
    warehouseLocation: 'Yopougon Rayon A-01',
    warehouseHub: 'Dépôt Yopougon',
    rating: 4.9,
    reviewCount: 9,
    reviewCountLabel: '9 Avis',
    soldCount: 180,
    color: 'Noir',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHk8UhJuF-hDXNXi98csYiMVw2AMImEfs5vDLW5hjqnwIHLNilYxP19djjSCqIbJkWmiL1htWIXjYm6-fkln6OUmwgTNrX6QIv8kSqttrR3IbHNS3wcI9b9lT_xzoIn6R7LheRYLON3KwxcPEWf1Y84I0mxlgx9QAOGiFq1TA3vlCvJb6qvJvKFD3ofmhsWFo8yteCSLSOhraBiL1-n9Yjfo2pTsZGmjnWYEUcOWYdPhiHdARsfK8',
    isFavorite: true,
    turnoverDays: 15.8,
    description: 'Angle naturel de 57° prévenant les TMS et la fatigue du poignet pour de longues heures de bureau.',
    lastUpdated: 'Il y a 4h'
  },
  {
    id: 'prod-7',
    sku: 'DJ-ADP-USB',
    name: 'Adaptateur USB Compact High-Speed',
    category: 'Câbles & Adaptateurs',
    price: 15000,
    costPrice: 6500,
    stock: 420,
    lowStockThreshold: 30,
    warehouseLocation: 'Plateau Rayon D-03',
    warehouseHub: 'Hub Express Plateau',
    rating: 4.7,
    reviewCount: 131,
    reviewCountLabel: '131 Avis',
    soldCount: 150,
    color: 'Noir',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmidbcxQcWet6LMLPLBfFXd7FCpapeNnmb8FW4LZA8QidFX7zp1pjIUuo8CvqARlE4wyLIDxQDta9lrB_V7BNwkKj13q8twtVe-jS6yA4lWPmYyRnIodMv2DJicTZ03vC220n9UpcsOmoTXU_7FjKjij3L1kgN5s52E9Fo00Kerpmv-LmupOLpCKIYHxZ3t3a_KwEru2XosTto-RTOHJhd1G4FC-_6Szx2FxLledYa50IrPPcBbbw',
    isFavorite: false,
    turnoverDays: 9.4,
    description: 'Connecteur USB 3.2 haute vitesse 10 Gbps en boîtier aluminium ultra-compact résistant.',
    lastUpdated: 'Il y a 1j'
  },
  {
    id: 'prod-8',
    sku: 'DJ-BAG-EVA',
    name: 'Étui de Transport Rigide Pro',
    category: 'Housses & Rangement',
    price: 32000,
    costPrice: 15000,
    stock: 95,
    lowStockThreshold: 15,
    warehouseLocation: 'Cocody Box B-11',
    warehouseHub: 'Point Relais Cocody',
    rating: 4.8,
    reviewCount: 134,
    reviewCountLabel: '134 Avis',
    soldCount: 200,
    color: 'Noir',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSmnJe55K9JMfibk6Yd3aJB7tWV8WKaZLsEntRrzi6B62yZemCo8dsuMWyTJPHk7R99FTgs17Z6o0vXLV0PV0gTeqgXUPC-fVxZKgkeG41UgHiANzX8JMXx74rJxaP8hhXz0auNaPIQBe6KNwTmRr9GtS-LVYLyl8M8NaNfV4V4pA6PNU8e0anXMUED-4fEZjVleIf-eO6imKJUpyaYDXQZCsrxnuFGnU2vHnXGucxd6KTm1VbCww',
    isFavorite: false,
    turnoverDays: 21.0,
    description: 'Protection étanche et anti-choc pour accessoires électroniques et claviers avec compartiments modulaires.',
    lastUpdated: 'Il y a 6h'
  }
];

const INITIAL_SALES_ORDERS: SaleOrder[] = [
  {
    id: 'sale-1',
    orderNumber: 'CMD-DJA-8419',
    customerName: 'Kouassi Jean-Marc',
    customerPhone: '+225 07 48 92 11 02',
    customerCity: 'Abidjan (Cocody Angré)',
    deliveryMode: 'livraison_express',
    items: [
      { productId: 'prod-1', productName: 'Keychron x401K Pro', quantity: 1, price: 68000 },
      { productId: 'prod-5', productName: 'Câble Tressé Custom Coiled', quantity: 1, price: 40000 }
    ],
    totalAmount: 108000,
    paymentMethod: 'wave',
    status: 'paye',
    hub: 'Point Relais Cocody',
    createdAt: 'Il y a 25 min'
  },
  {
    id: 'sale-2',
    orderNumber: 'CMD-DJA-8418',
    customerName: 'Fatou Diallo',
    customerPhone: '+225 05 64 21 88 43',
    customerCity: 'Abidjan (Marcory Zone 4)',
    deliveryMode: 'livraison_express',
    items: [
      { productId: 'prod-6', productName: 'Souris Verticale Ergonomique', quantity: 1, price: 110000 }
    ],
    totalAmount: 110000,
    paymentMethod: 'orange_money',
    status: 'en_livraison',
    hub: 'Dépôt Central Treichville',
    createdAt: 'Il y a 1h'
  },
  {
    id: 'sale-3',
    orderNumber: 'CMD-DJA-8417',
    customerName: 'Amadou Koné',
    customerPhone: '+225 01 02 44 91 30',
    customerCity: 'Abidjan (Plateau)',
    deliveryMode: 'retrait_boutique',
    items: [
      { productId: 'prod-4', productName: 'Manette Pro Multi-Plateforme', quantity: 1, price: 80000 }
    ],
    totalAmount: 80000,
    paymentMethod: 'cash',
    status: 'livre',
    hub: 'Hub Express Plateau',
    createdAt: 'Hier à 17:15'
  }
];

const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: 'Keychron x401K Pro',
    sku: 'DJ-KEY-401K',
    type: 'reception',
    quantityChange: 40,
    location: 'Dépôt Central Treichville',
    date: '2026-09-26 10:15',
    operator: 'Mamadou B. (Logistique)',
    reason: 'Arrivage conteneur portuaire Abidjan'
  },
  {
    id: 'mov-2',
    productId: 'prod-1',
    productName: 'Keychron x401K Pro',
    sku: 'DJ-KEY-401K',
    type: 'vente',
    quantityChange: -1,
    location: 'Point Relais Cocody',
    date: '2026-09-26 11:20',
    operator: 'Vente Express Wave (CMD-DJA-8419)',
    reason: 'Vente client direct'
  },
  {
    id: 'mov-3',
    productId: 'prod-3',
    productName: 'Casque Audio Sans-Fil Pro',
    sku: 'DJ-AUD-PRO',
    type: 'ajustement',
    quantityChange: -2,
    location: 'Dépôt Central Treichville',
    date: '2026-09-25 15:40',
    operator: 'Inventaire périodique',
    reason: 'Prélèvement pour showroom'
  }
];

/**
 * Stateful Mock Database Class for DJASSA Backend
 */
class DjassaDatabase {
  private products: Product[] = [...INITIAL_PRODUCTS];
  private orders: SaleOrder[] = [...INITIAL_SALES_ORDERS];
  private movements: StockMovement[] = [...INITIAL_STOCK_MOVEMENTS];

  // --- PRODUCTS ---
  public getProducts(filters?: {
    search?: string;
    category?: ProductCategory;
    hub?: WarehouseHub;
    stockLevel?: StockLevelType;
  }): Product[] {
    let list = [...this.products];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (filters?.category) {
      list = list.filter((p) => p.category === filters.category);
    }

    if (filters?.hub) {
      list = list.filter((p) => p.warehouseHub === filters.hub);
    }

    if (filters?.stockLevel && filters.stockLevel !== 'all') {
      if (filters.stockLevel === 'out_of_stock') {
        list = list.filter((p) => p.stock === 0);
      } else if (filters.stockLevel === 'low') {
        list = list.filter((p) => p.stock <= p.lowStockThreshold);
      } else if (filters.stockLevel === 'normal') {
        list = list.filter((p) => p.stock > p.lowStockThreshold);
      }
    }

    return list;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public createProduct(data: Omit<Product, 'id' | 'soldCount' | 'rating' | 'reviewCount' | 'lastUpdated'>): Product {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      soldCount: 0,
      rating: 5.0,
      reviewCount: 0,
      lastUpdated: 'À l’instant'
    };
    this.products.unshift(newProduct);

    // Record initial stock reception movement if stock > 0
    if (newProduct.stock > 0) {
      this.addMovement({
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'reception',
        quantityChange: newProduct.stock,
        location: newProduct.warehouseHub,
        operator: 'Création Fiche Produit',
        reason: 'Stock initial de mise en rayon'
      });
    }

    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    this.products[idx] = {
      ...this.products[idx],
      ...updates,
      lastUpdated: 'À l’instant'
    };
    return this.products[idx];
  }

  public adjustStock(
    productId: string,
    quantityChange: number,
    location: string,
    operator: string,
    reason: string
  ): { product: Product; movement: StockMovement } | null {
    const product = this.getProductById(productId);
    if (!product) return null;

    const newStock = Math.max(0, product.stock + quantityChange);
    product.stock = newStock;
    product.lastUpdated = 'À l’instant';

    const movement = this.addMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: quantityChange >= 0 ? 'reception' : 'ajustement',
      quantityChange,
      location,
      operator,
      reason
    });

    return { product, movement };
  }

  public bulkAdjust(
    updates: { productId: string; targetStock: number }[],
    operator: string,
    reason: string
  ): { products: Product[]; movements: StockMovement[] } {
    const updatedProducts: Product[] = [];
    const newMovements: StockMovement[] = [];

    for (const item of updates) {
      const p = this.getProductById(item.productId);
      if (p) {
        const diff = item.targetStock - p.stock;
        p.stock = Math.max(0, item.targetStock);
        p.lastUpdated = 'À l’instant';
        updatedProducts.push(p);

        if (diff !== 0) {
          const mov = this.addMovement({
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: diff > 0 ? 'reception' : 'ajustement',
            quantityChange: diff,
            location: p.warehouseHub,
            operator,
            reason
          });
          newMovements.push(mov);
        }
      }
    }

    return { products: updatedProducts, movements: newMovements };
  }

  // --- ORDERS ---
  public getOrders(): SaleOrder[] {
    return this.orders;
  }

  public createOrder(data: {
    customerName: string;
    customerPhone: string;
    customerCity: string;
    deliveryMode?: DeliveryMode;
    items: { productId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    hub: WarehouseHub;
  }): SaleOrder {
    const detailedItems: { productId: string; productName: string; quantity: number; price: number }[] = [];
    let totalAmount = 0;

    for (const item of data.items) {
      const product = this.getProductById(item.productId);
      if (product) {
        detailedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price
        });
        totalAmount += product.price * item.quantity;

        // Decrement stock
        product.stock = Math.max(0, product.stock - item.quantity);
        product.soldCount += item.quantity;
        product.lastUpdated = 'À l’instant';

        // Add sale movement
        this.addMovement({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'vente',
          quantityChange: -item.quantity,
          location: data.hub,
          operator: `Commande ${data.customerName}`,
          reason: `Vente en ligne (${data.paymentMethod})`
        });
      }
    }

    const orderNumber = `CMD-DJA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: SaleOrder = {
      id: `sale-${Date.now()}`,
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerCity: data.customerCity,
      deliveryMode: data.deliveryMode || 'livraison_express',
      items: detailedItems,
      totalAmount,
      paymentMethod: data.paymentMethod,
      status: 'paye',
      hub: data.hub,
      createdAt: 'À l’instant'
    };

    this.orders.unshift(newOrder);
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: 'paye' | 'en_livraison' | 'livre'): SaleOrder | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = status;
    return order;
  }

  // --- MOVEMENTS ---
  public getMovements(): StockMovement[] {
    return this.movements;
  }

  public addMovement(data: Omit<StockMovement, 'id' | 'date'>): StockMovement {
    const movement: StockMovement = {
      ...data,
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    this.movements.unshift(movement);
    return movement;
  }

  // --- CASHFLOW & FINANCIAL METRICS ---
  public getCashflowMetrics() {
    const totalValuationFCFA = this.products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
    const potentialRevenueFCFA = this.products.reduce((acc, p) => acc + p.stock * p.price, 0);
    const totalPotentialProfitFCFA = potentialRevenueFCFA - totalValuationFCFA;

    const actualRevenueFCFA = this.orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const completedOrders = this.orders.length;

    // Payment distribution
    const paymentsSummary: Record<PaymentMethod, number> = {
      wave: 0,
      orange_money: 0,
      mtn_momo: 0,
      cash: 0
    };
    for (const o of this.orders) {
      paymentsSummary[o.paymentMethod] = (paymentsSummary[o.paymentMethod] || 0) + o.totalAmount;
    }

    return {
      totalValuationFCFA,
      potentialRevenueFCFA,
      totalPotentialProfitFCFA,
      actualRevenueFCFA,
      completedOrders,
      paymentsSummary,
      currency: 'FCFA'
    };
  }

  // --- REINITIALIZE ---
  public reset() {
    this.products = [...INITIAL_PRODUCTS];
    this.orders = [...INITIAL_SALES_ORDERS];
    this.movements = [...INITIAL_STOCK_MOVEMENTS];
  }
}

export const db = new DjassaDatabase();
