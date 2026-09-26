import React, { useCallback, useMemo, useState } from 'react';
import {
  Product,
  FilterState,
  ActiveNavScreen,
  StockMovement,
  SaleOrder,
  PaymentMethod,
  WarehouseHub,
  CartItem,
  DeliveryMode,
  Vendor,
  VendorStatus,
  Session,
  Customer
} from './types/inventory';
import {
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SALES_ORDERS,
  INITIAL_VENDORS,
  INITIAL_CUSTOMERS
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InventoryView } from './views/InventoryView';
import { SalesOrdersView } from './views/SalesOrdersView';
import { CashflowSummaryView } from './views/CashflowSummaryView';
import { AdjustStockModal } from './components/AdjustStockModal';
import { QuickSaleModal } from './components/QuickSaleModal';
import { NewProductModal } from './components/NewProductModal';
import { BulkAdjustModal } from './components/BulkAdjustModal';
import { ProductDetailDrawer } from './components/ProductDetailDrawer';
import { CartDrawer } from './components/CartDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { DjassaStockAgentDrawer } from './components/DjassaStockAgentDrawer';
import { formatFCFA } from './utils/format';
import { VendorsView } from './views/VendorsView';
import { VendorOnboardingWizard } from './components/vendors/VendorOnboardingWizard';
import { VendorDetailDrawer } from './components/vendors/VendorDetailDrawer';
import { usePersistentState, clearPersistentState } from './hooks/usePersistentState';
import { MarketplaceView } from './views/MarketplaceView';
import { LoginView } from './views/LoginView';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { CustomerOrdersDrawer } from './components/CustomerOrdersDrawer';
import { isSessionValid, migrateVendors } from './utils/auth';
import { vendorInitials } from './utils/vendor';

const EMPTY_FILTERS: FilterState = {
  searchQuery: '',
  categories: [],
  priceRanges: [],
  minPrice: 0,
  maxPrice: 0,
  stockLevel: 'all',
  warehouses: [],
  colors: [],
  vendors: []
};

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
const nowStamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type ToastTone = 'success' | 'warning' | 'info';

export default function App() {
  // Navigation du back-office
  const [activeScreen, setActiveScreen] = usePersistentState<ActiveNavScreen>('screen', 'inventory-catalog');

  // Core Data (persistées dans le navigateur)
  const [products, setProducts] = usePersistentState<Product[]>('products', INITIAL_PRODUCTS);
  const [movements, setMovements] = usePersistentState<StockMovement[]>('movements', INITIAL_STOCK_MOVEMENTS);
  const [salesOrders, setSalesOrders] = usePersistentState<SaleOrder[]>('orders', INITIAL_SALES_ORDERS);
  const [vendors, setVendors] = usePersistentState<Vendor[]>('vendors', INITIAL_VENDORS, (stored) =>
    migrateVendors(stored, INITIAL_VENDORS)
  );

  // Session : null = visiteur de la marketplace publique
  const [session, setSession] = usePersistentState<Session | null>('session', null);
  const [publicScreen, setPublicScreen] = useState<'marketplace' | 'login'>('marketplace');
  const [viewingMarketplace, setViewingMarketplace] = useState(false);
  const [customers, setCustomers] = usePersistentState<Customer[]>('customers', INITIAL_CUSTOMERS);
  const [customerAuthOpen, setCustomerAuthOpen] = useState(false);
  const [checkoutAfterAuth, setCheckoutAfterAuth] = useState(false);
  const [customerOrdersOpen, setCustomerOrdersOpen] = useState(false);

  // Vendeurs
  const [vendorWizardOpen, setVendorWizardOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [newProductVendorId, setNewProductVendorId] = useState<string | undefined>(undefined);
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId) ?? null;

  // Cart & Order Validation State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);
  const [validatedOrder, setValidatedOrder] = useState<SaleOrder | null>(null);

  // Notification Toast state
  const [toast, setToast] = useState<{ id: number; message: string; tone: ToastTone } | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now();
    setToast({ id, message, tone });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), 3500);
  }, []);

  const [filterState, setFilterState] = useState<FilterState>(EMPTY_FILTERS);

  // Modals & Drawers
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [quickSaleProduct, setQuickSaleProduct] = useState<Product | null>(null);
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);
  // On mémorise l'identifiant : la fiche reflète toujours le stock à jour.
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const selectedProductDetail = products.find((p) => p.id === selectedProductId) ?? null;
  const setSelectedProductDetail = (p: Product | null) => setSelectedProductId(p?.id ?? null);
  const [bulkTargetIds, setBulkTargetIds] = useState<string[]>([]);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [bulkAdjustModalOpen, setBulkAdjustModalOpen] = useState(false);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);

  // Cart Total computations
  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalAmount = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  // Add product to cart handler
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast(`${product.name} est en rupture de stock.`, 'warning');
      return;
    }
    const inCart = cartItems.find((ci) => ci.product.id === product.id)?.quantity ?? 0;
    if (inCart >= product.stock) {
      showToast(`Stock maximum atteint pour ${product.name} (${product.stock} u.).`, 'warning');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const targetQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: targetQty } : item
        );
      } else {
        const initialQty = Math.min(product.stock, Math.max(1, quantity));
        return [...prev, { product, quantity: initialQty }];
      }
    });

    showToast(`${product.name} ajouté au panier`);
  };

  // Update cart item quantity
  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const targetProduct = products.find((p) => p.id === productId);
    const maxStock = targetProduct?.stock ?? 999;
    const finalQty = Math.min(maxStock, newQty);

    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: finalQty } : item
      )
    );
  };

  // Remove item from cart
  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Validate Order from Cart (Checkout Flow)
  const handleValidateOrder = (orderData: {
    customerName: string;
    customerPhone: string;
    customerCity: string;
    paymentMethod: PaymentMethod;
    deliveryMode: DeliveryMode;
    hub: WarehouseHub;
    deliveryFee: number;
  }) => {
    if (cartItems.length === 0) return;

    // 1. Prepare items array
    const orderItems = cartItems.map((ci) => ({
      productId: ci.product.id,
      productName: ci.product.name,
      quantity: ci.quantity,
      price: ci.product.price
    }));

    const totalArticlesPrice = cartItems.reduce(
      (acc, ci) => acc + ci.product.price * ci.quantity,
      0
    );
    const finalTotal = totalArticlesPrice + orderData.deliveryFee;

    // 2. Decrement product stock in real time
    setProducts((prev) =>
      prev.map((p) => {
        const itemSold = cartItems.find((ci) => ci.product.id === p.id);
        if (itemSold) {
          const updatedStock = Math.max(0, p.stock - itemSold.quantity);
          return {
            ...p,
            stock: updatedStock,
            soldCount: p.soldCount + itemSold.quantity,
            lastUpdated: 'À l’instant'
          };
        }
        return p;
      })
    );

    // 3. Create Sale Order
    const newOrder: SaleOrder = {
      id: `sale-${Date.now()}`,
      customerId: currentCustomer?.id,
      orderNumber: `CMD-DJA-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerCity: orderData.customerCity,
      deliveryMode: orderData.deliveryMode,
      items: orderItems,
      totalAmount: finalTotal,
      paymentMethod: orderData.paymentMethod,
      status: 'paye',
      hub: orderData.hub,
      createdAt: 'À l’instant'
    };

    setSalesOrders((prev) => [newOrder, ...prev]);

    // 4. Log stock movements for each item
    const saleMovements: StockMovement[] = cartItems.map((ci) => ({
        id: uid('mov'),
        productId: ci.product.id,
        productName: ci.product.name,
        sku: ci.product.sku,
        type: 'vente',
        quantityChange: -ci.quantity,
        location: orderData.hub,
        date: nowStamp(),
        operator: `Validation Commande (${newOrder.orderNumber})`,
        reason: `Vente Panier ${orderData.customerName} [${orderData.paymentMethod.toUpperCase()}]`
      }));
    setMovements((prev) => [...saleMovements, ...prev]);

    // 5. Clear cart and open success modal
    setCartItems([]);
    setCartDrawerOpen(false);
    setValidatedOrder(newOrder);
    setOrderSuccessModalOpen(true);
  };

  // Stock Adjustment Handler
  const handleSaveStockAdjustment = (
    productId: string,
    newStock: number,
    reason: string,
    location: string
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const diff = newStock - targetProduct.stock;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              stock: newStock,
              warehouseLocation: location,
              lastUpdated: 'À l’instant'
            }
          : p
      )
    );

    const newMovement: StockMovement = {
      id: uid('mov'),
      productId: targetProduct.id,
      productName: targetProduct.name,
      sku: targetProduct.sku,
      type: 'ajustement',
      quantityChange: diff,
      location,
      date: nowStamp(),
      operator: 'Inventaire Manuel Djassa',
      reason
    };
    setMovements((prev) => [newMovement, ...prev]);
    showToast(`Stock de ${targetProduct.name} ajusté à ${newStock} u.`);
  };

  // Agent IA: Restock single item
  const handleAgentRestock = (
    productId: string,
    quantity: number,
    hub: WarehouseHub,
    reason = 'Réassort validé via Agent IA'
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const newStock = targetProduct.stock + quantity;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              stock: newStock,
              warehouseHub: hub,
              lastUpdated: 'À l’instant'
            }
          : p
      )
    );

    const newMovement: StockMovement = {
      id: uid('mov'),
      productId: targetProduct.id,
      productName: targetProduct.name,
      sku: targetProduct.sku,
      type: 'reception',
      quantityChange: quantity,
      location: hub,
      date: nowStamp(),
      operator: 'Agent Réassort IA',
      reason
    };
    setMovements((prev) => [newMovement, ...prev]);
    showToast(`✓ Réassort de +${quantity} u. appliqué sur ${targetProduct.name} !`);
  };

  // Agent IA: Batch Restock multiple items
  const handleAgentBatchRestock = (
    items: { productId: string; quantity: number; hub: WarehouseHub }[]
  ) => {
    const now = nowStamp();
    const newMovements: StockMovement[] = [];

    setProducts((prev) =>
      prev.map((p) => {
        const matching = items.find((item) => item.productId === p.id);
        if (matching) {
          const updatedStock = p.stock + matching.quantity;
          newMovements.push({
            id: uid('mov'),
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: 'reception',
            quantityChange: matching.quantity,
            location: matching.hub,
            date: now,
            operator: 'Agent Réassort IA (Bon Global)',
            reason: 'Réapprovisionnement préventif multi-références'
          });
          return {
            ...p,
            stock: updatedStock,
            warehouseHub: matching.hub,
            lastUpdated: 'À l’instant'
          };
        }
        return p;
      })
    );

    if (newMovements.length > 0) {
      setMovements((prev) => [...newMovements, ...prev]);
      showToast(`🚀 Bon de réassort global exécuté : ${items.length} références réapprovisionnées !`);
    }
  };

  // Agent IA: Inter-Hub Transfer
  const handleAgentTransfer = (
    productId: string,
    fromHub: WarehouseHub,
    toHub: WarehouseHub,
    quantity: number
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const now = nowStamp();
    const movOut: StockMovement = {
      id: uid('mov'),
      productId: targetProduct.id,
      productName: targetProduct.name,
      sku: targetProduct.sku,
      type: 'ajustement',
      quantityChange: -quantity,
      location: fromHub,
      date: now,
      operator: 'Agent Logistique IA',
      reason: `Transfert inter-dépôts vers ${toHub}`
    };
    const movIn: StockMovement = {
      id: uid('mov'),
      productId: targetProduct.id,
      productName: targetProduct.name,
      sku: targetProduct.sku,
      type: 'reception',
      quantityChange: quantity,
      location: toHub,
      date: now,
      operator: 'Agent Logistique IA',
      reason: `Réception transfert en provenance de ${fromHub}`
    };

    setMovements((prev) => [movIn, movOut, ...prev]);
    showToast(`✓ Transfert de ${quantity}x ${targetProduct.name} de ${fromHub} vers ${toHub} validé !`);
  };

  // Complete a Direct Sale (1-click quick sale modal)
  const handleCompleteSale = (
    items: { productId: string; productName: string; quantity: number; price: number }[],
    customerName: string,
    customerPhone: string,
    customerCity: string,
    paymentMethod: PaymentMethod,
    hub: WarehouseHub
  ) => {
    const totalAmount = items.reduce((acc, it) => acc + it.price * it.quantity, 0);

    // 1. Decrement products stock
    setProducts((prev) =>
      prev.map((p) => {
        const soldItem = items.find((it) => it.productId === p.id);
        if (soldItem) {
          const updatedStock = Math.max(0, p.stock - soldItem.quantity);
          return {
            ...p,
            stock: updatedStock,
            soldCount: p.soldCount + soldItem.quantity,
            lastUpdated: 'À l’instant'
          };
        }
        return p;
      })
    );

    // 2. Add Sale Order
    const newOrder: SaleOrder = {
      id: `sale-${Date.now()}`,
      orderNumber: `CMD-DJA-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      customerPhone,
      customerCity,
      deliveryMode: 'retrait_boutique',
      items,
      totalAmount,
      paymentMethod,
      status: 'paye',
      hub,
      createdAt: 'À l’instant'
    };
    setSalesOrders((prev) => [newOrder, ...prev]);

    // 3. Log Stock Movement for each item sold
    const saleMovements: StockMovement[] = items.map((it) => {
      const targetProd = products.find((p) => p.id === it.productId);
      return {
        id: uid('mov'),
        productId: it.productId,
        productName: it.productName,
        sku: targetProd?.sku || 'SKU',
        type: 'vente',
        quantityChange: -it.quantity,
        location: hub,
        date: nowStamp(),
        operator: `Vente ${paymentMethod.toUpperCase()} (${newOrder.orderNumber})`,
        reason: `Achat comptoir ${customerName}`
      };
    });
    setMovements((prev) => [...saleMovements, ...prev]);

    setValidatedOrder(newOrder);
    setOrderSuccessModalOpen(true);
  };

  // Add Product Handler
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    if (newProduct.stock > 0) {
      const vendor = vendors.find((v) => v.id === newProduct.vendorId);
      setMovements((prev) => [
        {
          id: uid('mov'),
          productId: newProduct.id,
          productName: newProduct.name,
          sku: newProduct.sku,
          type: 'reception',
          quantityChange: newProduct.stock,
          location: newProduct.warehouseHub,
          date: nowStamp(),
          operator: vendor ? `Vendeur ${vendor.shopName}` : 'Référencement catalogue',
          reason: 'Stock initial à la création de la fiche produit'
        },
        ...prev
      ]);
    }
    showToast(`${newProduct.name} ajouté au catalogue`);
  };

  // Vendeurs
  const handleCreateVendor = (vendor: Vendor) => {
    setVendors((prev) => [vendor, ...prev]);
    showToast(
      vendor.status === 'actif'
        ? `Boutique ${vendor.shopName} créée et active`
        : `Boutique ${vendor.shopName} créée, en attente de validation`,
      vendor.status === 'actif' ? 'success' : 'info'
    );
  };

  const handleChangeVendorStatus = (vendorId: string, status: VendorStatus) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, status } : v)));
    if (vendor) {
      const label = status === 'actif' ? 'activée' : status === 'suspendu' ? 'suspendue' : 'mise en attente';
      showToast(`Boutique ${vendor.shopName} ${label}`, status === 'suspendu' ? 'warning' : 'success');
    }
  };

  const openNewProduct = (vendorId?: string) => {
    setNewProductVendorId(vendorId);
    setNewProductModalOpen(true);
  };

  const viewVendorProducts = (vendor: Vendor) => {
    setSelectedVendorId(null);
    setFilterState({ ...EMPTY_FILTERS, vendors: [vendor.id] });
    setActiveScreen('inventory-catalog');
  };

  const handleResetDemo = () => {
    if (!window.confirm('Réinitialiser les données de démonstration ? Les ventes, vendeurs et ajustements saisis seront effacés.')) return;
    clearPersistentState();
    setProducts(INITIAL_PRODUCTS);
    setMovements(INITIAL_STOCK_MOVEMENTS);
    setSalesOrders(INITIAL_SALES_ORDERS);
    setVendors(INITIAL_VENDORS);
    setCartItems([]);
    setFilterState(EMPTY_FILTERS);
    setActiveScreen('inventory-catalog');
    showToast('Données de démonstration restaurées', 'info');
  };

  // Bulk Adjust Handler : chaque variation de stock est consignée dans le journal
  const handleBulkAdjust = (
    actionType: 'price_percent' | 'price_fixed' | 'stock_add',
    value: number,
    targetIds: string[]
  ) => {
    const targets = products.filter((p) => targetIds.includes(p.id));

    if (actionType === 'stock_add') {
      const now = nowStamp();
      const logs: StockMovement[] = targets
        .map((p) => ({ p, change: Math.max(0, p.stock + value) - p.stock }))
        .filter(({ change }) => change !== 0)
        .map(({ p, change }) => ({
          id: uid('mov'),
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          type: 'ajustement' as const,
          quantityChange: change,
          location: p.warehouseHub,
          date: now,
          operator: 'Ajustement en masse',
          reason: `Correction groupée de ${value > 0 ? '+' : ''}${value} u.`
        }));
      setMovements((prev) => [...logs, ...prev]);
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (!targetIds.includes(p.id)) return p;
        if (actionType === 'price_percent') {
          // arrondi aux 50 FCFA les plus proches : pas de prix du type 71 403 FCFA
          return { ...p, price: Math.max(500, Math.round((p.price * (1 + value / 100)) / 50) * 50), lastUpdated: 'À l’instant' };
        }
        if (actionType === 'stock_add') {
          return { ...p, stock: Math.max(0, p.stock + value), lastUpdated: 'À l’instant' };
        }
        return p;
      })
    );
    showToast(`Ajustement appliqué à ${targets.length} article(s)`);
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  // Update sale status
  const handleUpdateSaleStatus = (orderId: string, status: 'paye' | 'en_livraison' | 'livre') => {
    setSalesOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    showToast(`Statut de la commande mis à jour`);
  };

  // --- Session & périmètre des données ---------------------------------------------------------
  const sessionIsValid = isSessionValid(session, vendors, customers);
  const currentVendor = session?.role === 'vendor' ? vendors.find((v) => v.id === session.vendorId) : undefined;
  const currentCustomer = sessionIsValid && session.role === 'customer' ? customers.find((c) => c.id === session.customerId) : undefined;
  const isAdmin = sessionIsValid && session.role === 'admin';
  // Un vendeur n'a pas accès à l'écran Vendeurs (ex. écran mémorisé d'une session admin précédente)
  const screen: ActiveNavScreen = activeScreen === 'vendors' && !isAdmin ? 'inventory-catalog' : activeScreen;

  // Un vendeur ne voit que ses articles, les lignes de commande qui les concernent et leurs mouvements.
  const scopedProducts = useMemo(
    () => (currentVendor ? products.filter((p) => p.vendorId === currentVendor.id) : products),
    [products, currentVendor]
  );
  const scopedOrders = useMemo(() => {
    if (!currentVendor) return salesOrders;
    const ids = new Set(scopedProducts.map((p) => p.id));
    return salesOrders
      .map((o) => {
        const items = o.items.filter((it) => ids.has(it.productId));
        return { ...o, items, totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0) };
      })
      .filter((o) => o.items.length > 0);
  }, [salesOrders, scopedProducts, currentVendor]);
  const scopedMovements = useMemo(() => {
    if (!currentVendor) return movements;
    const ids = new Set(scopedProducts.map((p) => p.id));
    return movements.filter((m) => ids.has(m.productId));
  }, [movements, scopedProducts, currentVendor]);

  const lowStockCount = scopedProducts.filter((p) => p.stock <= p.lowStockThreshold).length;
  const cartQuantities = useMemo(
    () => Object.fromEntries(cartItems.map((ci) => [ci.product.id, ci.quantity])),
    [cartItems]
  );
  const vendorNameOf = (p: Product | null) => (p?.vendorId ? vendors.find((v) => v.id === p.vendorId)?.shopName : undefined);

  const handleLogin = (next: Session, knownCustomer?: Customer) => {
    setSession(next);
    setViewingMarketplace(false);
    setPublicScreen('marketplace');
    if (next.role === 'customer') {
      const c = knownCustomer ?? customers.find((x) => x.id === next.customerId);
      showToast(`Bienvenue, ${c?.fullName.split(' ')[0] ?? ''}`);
      return;
    }
    setFilterState(EMPTY_FILTERS);
    setActiveScreen('inventory-catalog');
    const name = next.role === 'admin' ? next.name : vendors.find((v) => v.id === next.vendorId)?.shopName;
    showToast(`Bienvenue, ${name}`);
  };

  const handleLogout = () => {
    setSession(null);
    setViewingMarketplace(false);
    setPublicScreen('marketplace');
    setCustomerOrdersOpen(false);
    setSelectedVendorId(null);
    setSelectedProductDetail(null);
    showToast('Vous êtes déconnecté', 'info');
  };

  const openQuickSale = () => {
    setQuickSaleProduct(null);
    setQuickSaleModalOpen(true);
  };

  // Éléments partagés entre marketplace et back-office
  const toastNode = (
    <div aria-live="polite" className="fixed top-[4.75rem] left-1/2 -translate-x-1/2 z-[70] pointer-events-none w-max max-w-[calc(100vw-2rem)]">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#0b1c30] text-white text-xs pl-3 pr-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 max-w-sm animate-rise"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              toast.tone === 'warning' ? 'text-[#fbbf24]' : toast.tone === 'info' ? 'text-[#93c5fd]' : 'text-[#acedda]'
            }`}
          >
            {toast.tone === 'warning' ? 'warning' : toast.tone === 'info' ? 'info' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );

  // Les clients restent sur la marketplace ; seuls admin et vendeurs accèdent au back-office.
  const showPublic = !sessionIsValid || session.role === 'customer' || viewingMarketplace;

  const cartDrawerNode = (
    <CartDrawer
      isOpen={cartDrawerOpen}
      onClose={() => setCartDrawerOpen(false)}
      cartItems={cartItems}
      onUpdateQuantity={handleUpdateCartQuantity}
      onRemoveItem={handleRemoveFromCart}
      onClearCart={handleClearCart}
      onValidateOrder={handleValidateOrder}
      {...(showPublic
        ? {
            customer: currentCustomer
              ? { name: currentCustomer.fullName, phone: currentCustomer.phone, city: `Abidjan (${currentCustomer.commune})` }
              : undefined,
            onRequireAuth: currentCustomer
              ? undefined
              : () => {
                  setCartDrawerOpen(false);
                  setCheckoutAfterAuth(true);
                  setCustomerAuthOpen(true);
                }
          }
        : {})}
    />
  );

  // --- Espace public : marketplace + connexion ---------------------------------------------------
  if (showPublic) {
    return (
      <>
        {publicScreen === 'login' ? (
          <LoginView
            vendors={vendors}
            onLogin={handleLogin}
            onBack={() => setPublicScreen('marketplace')}
            onBecomeVendor={() => setVendorWizardOpen(true)}
          />
        ) : (
          <MarketplaceView
            products={products}
            vendors={vendors}
            cartQuantities={cartQuantities}
            cartCount={cartTotalCount}
            cartTotal={cartTotalAmount}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onOpenCart={() => setCartDrawerOpen(true)}
            onSelectProduct={setSelectedProductDetail}
            onLogin={() => {
              setCheckoutAfterAuth(false);
              setCustomerAuthOpen(true);
            }}
            onProLogin={() => setPublicScreen('login')}
            customer={
              currentCustomer
                ? {
                    name: currentCustomer.fullName,
                    initials: currentCustomer.fullName
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase(),
                    ordersCount: salesOrders.filter((o) => o.customerId === currentCustomer.id).length,
                    onOpenOrders: () => setCustomerOrdersOpen(true),
                    onLogout: handleLogout
                  }
                : undefined
            }
            backOffice={
              sessionIsValid && session.role !== 'customer'
                ? { label: currentVendor ? currentVendor.shopName : 'Administration', onOpen: () => setViewingMarketplace(false) }
                : undefined
            }
            onBecomeVendor={() => setVendorWizardOpen(true)}
          />
        )}

        {toastNode}
        {cartDrawerNode}

        <CustomerAuthModal
          isOpen={customerAuthOpen}
          reason={checkoutAfterAuth ? 'Connectez-vous pour valider votre commande.' : undefined}
          customers={customers}
          vendors={vendors}
          onClose={() => {
            setCustomerAuthOpen(false);
            setCheckoutAfterAuth(false);
          }}
          onRegister={(c) => setCustomers((prev) => [...prev, c])}
          onAuthenticated={(next, created) => {
            setCustomerAuthOpen(false);
            handleLogin(next, created);
            if (checkoutAfterAuth) {
              setCheckoutAfterAuth(false);
              setCartDrawerOpen(true);
            }
          }}
          onOpenProLogin={() => {
            setCustomerAuthOpen(false);
            setPublicScreen('login');
          }}
        />

        <CustomerOrdersDrawer
          isOpen={customerOrdersOpen && Boolean(currentCustomer)}
          orders={currentCustomer ? salesOrders.filter((o) => o.customerId === currentCustomer.id) : []}
          onClose={() => setCustomerOrdersOpen(false)}
          onBrowse={() => setCustomerOrdersOpen(false)}
        />

        <OrderSuccessModal
          order={validatedOrder}
          isOpen={orderSuccessModalOpen}
          onClose={() => setOrderSuccessModalOpen(false)}
          audience="customer"
          onViewOrders={
            currentCustomer
              ? () => {
                  setOrderSuccessModalOpen(false);
                  setCustomerOrdersOpen(true);
                }
              : undefined
          }
        />

        <ProductDetailDrawer
          key={selectedProductId ?? 'none'}
          mode="public"
          vendorName={vendorNameOf(selectedProductDetail)}
          product={selectedProductDetail}
          isOpen={Boolean(selectedProductDetail)}
          cartQuantity={selectedProductDetail ? cartQuantities[selectedProductDetail.id] ?? 0 : 0}
          onClose={() => setSelectedProductDetail(null)}
          onAddToCart={(p, q) => handleAddToCart(p, q)}
          onAdjustStock={() => undefined}
          onQuickSell={() => undefined}
          movements={[]}
        />

        <VendorOnboardingWizard
          mode="self"
          isOpen={vendorWizardOpen}
          onClose={() => setVendorWizardOpen(false)}
          existingVendors={vendors}
          onCreateVendor={(v) => {
            setVendors((prev) => [v, ...prev]);
          }}
          onAddFirstProduct={() => undefined}
          onViewVendor={() => undefined}
          onOpenVendorSpace={(v) => {
            setVendorWizardOpen(false);
            handleLogin({ role: 'vendor', vendorId: v.id });
          }}
        />
      </>
    );
  }

  // --- Back-office connecté (admin ou vendeur) ---------------------------------------------------
  const user = currentVendor
    ? {
        name: currentVendor.ownerName,
        roleLabel: `Vendeur · ${currentVendor.shopName}`,
        initials: vendorInitials(currentVendor.shopName),
        color: currentVendor.brandColor
      }
    : { name: session.role === 'admin' ? session.name : '', roleLabel: 'Administrateur plateforme', initials: 'AD', color: '#0b1c30' };

  const showCartBar = cartItems.length > 0 && screen === 'inventory-catalog';

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex">
      {/* 72px Fixed Navigation Sidebar on desktop, bottom bar on mobile */}
      <Sidebar
        activeScreen={screen}
        onNavigate={setActiveScreen}
        onOpenNewProduct={() => openNewProduct(currentVendor?.id)}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenAgent={() => setAgentDrawerOpen(true)}
        onResetDemo={isAdmin ? handleResetDemo : undefined}
        showVendors={isAdmin}
        pendingVendorsCount={vendors.filter((v) => v.status === 'en_attente').length}
        salesCount={scopedOrders.filter((o) => o.status !== 'livre').length}
        cartCount={cartTotalCount}
        lowStockCount={lowStockCount}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[72px]">
        <Header
          searchQuery={filterState.searchQuery}
          onSearchChange={(q) => {
            setFilterState((prev) => ({ ...prev, searchQuery: q }));
            if (q && screen !== 'inventory-catalog') setActiveScreen('inventory-catalog');
          }}
          lowStockCount={lowStockCount}
          cartTotalCount={cartTotalCount}
          cartTotalAmount={cartTotalAmount}
          onOpenCart={() => setCartDrawerOpen(true)}
          onOpenQuickSale={openQuickSale}
          onOpenLowStock={() => {
            setActiveScreen('inventory-catalog');
            setFilterState({ ...EMPTY_FILTERS, stockLevel: 'low' });
          }}
          onOpenAgent={() => setAgentDrawerOpen(true)}
          storeLabel={currentVendor ? currentVendor.shopName : 'Administration'}
          user={user}
          onLogout={handleLogout}
          onViewMarketplace={() => setViewingMarketplace(true)}
          onOpenMyShop={currentVendor ? () => setSelectedVendorId(currentVendor.id) : undefined}
        />

        <main className="relative pt-16 w-full min-h-[calc(100vh-64px)] pb-24 lg:pb-12">
          {currentVendor?.status === 'en_attente' && (
            <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-xs text-[#9a3412] flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Boutique en cours de vérification.</strong> Préparez votre catalogue : vos produits seront visibles sur la
                marketplace dès la validation par DJASSA.
              </span>
              <button
                onClick={() => openNewProduct(currentVendor.id)}
                className="h-8 px-3 rounded-lg bg-white border border-[#fed7aa] font-semibold hover:bg-[#fffbf5]"
              >
                Ajouter un produit
              </button>
            </div>
          )}

          {screen === 'inventory-catalog' && (
            <InventoryView
              products={scopedProducts}
              filterState={filterState}
              cartItems={cartItems}
              onFilterChange={setFilterState}
              vendors={isAdmin ? vendors : []}
              onResetFilters={() => setFilterState(EMPTY_FILTERS)}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onOpenAdjustModal={setAdjustingProduct}
              onOpenQuickSellModal={(p) => {
                setQuickSaleProduct(p);
                setQuickSaleModalOpen(true);
              }}
              onOpenNewProductModal={() =>
                openNewProduct(currentVendor?.id ?? (filterState.vendors.length === 1 ? filterState.vendors[0] : undefined))
              }
              onOpenBulkAdjustModal={(ids) => {
                setBulkTargetIds(ids);
                setBulkAdjustModalOpen(true);
              }}
              onSelectProduct={setSelectedProductDetail}
              onNavigateToCashflow={() => setActiveScreen('cashflow-summary')}
              onOpenCart={() => setCartDrawerOpen(true)}
            />
          )}

          {screen === 'sales-orders' && (
            <SalesOrdersView
              orders={scopedOrders}
              cartCount={cartTotalCount}
              onOpenCart={() => setCartDrawerOpen(true)}
              onOpenQuickSale={openQuickSale}
              onUpdateStatus={handleUpdateSaleStatus}
            />
          )}

          {screen === 'vendors' && isAdmin && (
            <VendorsView
              vendors={vendors}
              products={products}
              orders={salesOrders}
              onCreateVendor={() => setVendorWizardOpen(true)}
              onOpenVendor={(v) => setSelectedVendorId(v.id)}
              onViewVendorProducts={viewVendorProducts}
              onActivateVendor={(id) => handleChangeVendorStatus(id, 'actif')}
            />
          )}

          {screen === 'cashflow-summary' && (
            <CashflowSummaryView
              products={scopedProducts}
              orders={scopedOrders}
              movements={scopedMovements}
              onNavigateToCatalog={() => setActiveScreen('inventory-catalog')}
              onOpenQuickSale={openQuickSale}
            />
          )}
        </main>
      </div>

      {/* Barre panier flottante */}
      {showCartBar && (
        <aside
          aria-label="Récapitulatif du panier actif"
          className="fixed bottom-16 lg:bottom-5 left-4 right-4 lg:left-auto lg:right-6 lg:w-[26rem] z-40 bg-[#00685d] text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-3 border border-[#008376] animate-in slide-in-from-bottom"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-xs sm:text-sm">
                Panier : {cartTotalCount} article{cartTotalCount > 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-[#acedda] font-mono font-bold">{formatFCFA(cartTotalAmount)}</span>
            </div>
          </div>
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="px-4 py-2 bg-white text-[#00685d] hover:bg-[#eff4ff] active:scale-95 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <span>Valider la commande</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </aside>
      )}

      {toastNode}
      {cartDrawerNode}

      <OrderSuccessModal
        order={validatedOrder}
        isOpen={orderSuccessModalOpen}
        onClose={() => setOrderSuccessModalOpen(false)}
        onViewOrders={() => {
          setActiveScreen('sales-orders');
          setOrderSuccessModalOpen(false);
        }}
      />

      <AdjustStockModal
        product={adjustingProduct}
        isOpen={Boolean(adjustingProduct)}
        onClose={() => setAdjustingProduct(null)}
        onSave={handleSaveStockAdjustment}
      />

      <QuickSaleModal
        isOpen={quickSaleModalOpen}
        onClose={() => {
          setQuickSaleModalOpen(false);
          setQuickSaleProduct(null);
        }}
        products={scopedProducts}
        preselectedProduct={quickSaleProduct}
        onCompleteSale={handleCompleteSale}
      />

      <NewProductModal
        isOpen={newProductModalOpen}
        onClose={() => setNewProductModalOpen(false)}
        onAddProduct={handleAddProduct}
        vendors={currentVendor ? [currentVendor] : vendors}
        initialVendorId={currentVendor?.id ?? newProductVendorId}
        lockVendor={Boolean(currentVendor)}
        existingSkus={products.map((p) => p.sku)}
      />

      {isAdmin && (
        <VendorOnboardingWizard
          isOpen={vendorWizardOpen}
          onClose={() => setVendorWizardOpen(false)}
          existingVendors={vendors}
          onCreateVendor={handleCreateVendor}
          onAddFirstProduct={(v) => {
            setVendorWizardOpen(false);
            openNewProduct(v.id);
          }}
          onViewVendor={(v) => {
            setVendorWizardOpen(false);
            setActiveScreen('vendors');
            setSelectedVendorId(v.id);
          }}
        />
      )}

      <VendorDetailDrawer
        vendor={selectedVendor}
        products={products}
        orders={salesOrders}
        onClose={() => setSelectedVendorId(null)}
        onChangeStatus={isAdmin ? handleChangeVendorStatus : undefined}
        onAddProduct={(v) => {
          setSelectedVendorId(null);
          openNewProduct(v.id);
        }}
        onViewProducts={viewVendorProducts}
        onSelectProduct={(p) => {
          setSelectedVendorId(null);
          setSelectedProductDetail(p);
        }}
      />

      <BulkAdjustModal
        isOpen={bulkAdjustModalOpen}
        onClose={() => setBulkAdjustModalOpen(false)}
        products={scopedProducts}
        selectedProductIds={bulkTargetIds}
        onApplyBulkAdjust={handleBulkAdjust}
      />

      <ProductDetailDrawer
        key={selectedProductId ?? 'none'}
        product={selectedProductDetail}
        isOpen={Boolean(selectedProductDetail)}
        vendorName={vendorNameOf(selectedProductDetail)}
        cartQuantity={selectedProductDetail ? cartQuantities[selectedProductDetail.id] ?? 0 : 0}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={(p, q) => handleAddToCart(p, q)}
        onAdjustStock={(p) => {
          setSelectedProductDetail(null);
          setAdjustingProduct(p);
        }}
        onQuickSell={(p) => {
          setSelectedProductDetail(null);
          setQuickSaleProduct(p);
          setQuickSaleModalOpen(true);
        }}
        movements={scopedMovements}
      />

      {/* Bouton flottant Agent IA : remonte au-dessus de la barre panier quand elle est affichée */}
      <button
        onClick={() => setAgentDrawerOpen(true)}
        className={`fixed right-4 lg:right-6 z-40 h-12 px-3.5 sm:px-4 bg-gradient-to-r from-[#00685d] to-[#008376] hover:from-[#005048] hover:to-[#00685d] text-white rounded-2xl shadow-xl flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 border border-white/20 cursor-pointer ${
          showCartBar ? 'bottom-36 lg:bottom-28' : 'bottom-20 lg:bottom-6'
        }`}
        title="Ouvrir l'Agent IA Réassort & Alertes de Stock"
      >
        <div className="relative flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">smart_toy</span>
          {lowStockCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ba1a1a] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
              {lowStockCount}
            </span>
          )}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="font-headline font-bold text-xs leading-none">Agent IA Stock</span>
          <span className="text-[10px] text-[#acedda] font-medium leading-tight mt-0.5">
            {lowStockCount > 0 ? `${lowStockCount} alerte(s)` : 'Surveillance 4 Hubs'}
          </span>
        </div>
      </button>

      <DjassaStockAgentDrawer
        key={currentVendor?.id ?? 'admin'}
        isOpen={agentDrawerOpen}
        onClose={() => setAgentDrawerOpen(false)}
        products={scopedProducts}
        onExecuteRestock={handleAgentRestock}
        onExecuteBatchRestock={handleAgentBatchRestock}
        onExecuteTransfer={handleAgentTransfer}
        onApplyFilter={(patch) => {
          setFilterState({ ...EMPTY_FILTERS, ...patch });
          setActiveScreen('inventory-catalog');
        }}
        onNavigate={setActiveScreen}
      />
    </div>
  );
}
