import { Router, Request, Response } from 'express';
import { db, ProductCategory, WarehouseHub, StockLevelType } from '../db/mockDatabase';

const router = Router();

// GET /api/products
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, category, hub, stockLevel } = req.query;

    const products = db.getProducts({
      search: search ? String(search) : undefined,
      category: category ? (category as ProductCategory) : undefined,
      hub: hub ? (hub as WarehouseHub) : undefined,
      stockLevel: stockLevel ? (stockLevel as StockLevelType) : undefined,
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, sku, category, price, costPrice, stock, lowStockThreshold, warehouseLocation, warehouseHub, color, imageUrl, description, turnoverDays } = req.body;

    if (!name || !sku || !category || price === undefined || costPrice === undefined) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants (nom, sku, catégorie, prix, coût)' });
    }

    const newProduct = db.createProduct({
      name,
      sku,
      category,
      price: Number(price),
      costPrice: Number(costPrice),
      stock: Number(stock || 0),
      lowStockThreshold: Number(lowStockThreshold || 10),
      warehouseLocation: warehouseLocation || `${warehouseHub || 'Treichville'} Rayon Principal`,
      warehouseHub: warehouseHub || 'Dépôt Central Treichville',
      color: color || 'Noir',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=60',
      isFavorite: false,
      turnoverDays: Number(turnoverDays || 15),
      description: description || ''
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Produit introuvable' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/:id/adjust-stock
router.post('/:id/adjust-stock', (req: Request, res: Response) => {
  try {
    const { quantityChange, location, operator, reason } = req.body;

    if (quantityChange === undefined) {
      return res.status(400).json({ success: false, error: 'quantityChange est requis' });
    }

    const result = db.adjustStock(
      req.params.id,
      Number(quantityChange),
      location || 'Dépôt Central Treichville',
      operator || 'Opérateur Djassa',
      reason || 'Ajustement manuel'
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Produit introuvable' });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/bulk-adjust
router.post('/bulk-adjust', (req: Request, res: Response) => {
  try {
    const { updates, operator, reason } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Liste updates invalide' });
    }

    const result = db.bulkAdjust(
      updates,
      operator || 'Inventaire Rapide',
      reason || 'Ajustement en lot'
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
