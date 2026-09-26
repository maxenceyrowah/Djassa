import { Router, Request, Response } from 'express';
import { db } from '../db/mockDatabase';

const router = Router();

// GET /api/movements
router.get('/', (req: Request, res: Response) => {
  try {
    let list = db.getMovements();
    const { type, productId } = req.query;

    if (type) {
      list = list.filter((m) => m.type === type);
    }
    if (productId) {
      list = list.filter((m) => m.productId === productId);
    }

    res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/movements
router.post('/', (req: Request, res: Response) => {
  try {
    const { productId, productName, sku, type, quantityChange, location, operator, reason } = req.body;

    if (!productId || !type || quantityChange === undefined) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants' });
    }

    const movement = db.addMovement({
      productId,
      productName: productName || 'Produit',
      sku: sku || 'SKU',
      type,
      quantityChange: Number(quantityChange),
      location: location || 'Dépôt Central Treichville',
      operator: operator || 'Opérateur',
      reason: reason || 'Mouvement consigné manuellement',
    });

    res.status(201).json({ success: true, data: movement });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
