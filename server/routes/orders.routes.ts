import { Router, Request, Response } from 'express';
import { db } from '../db/mockDatabase';

const router = Router();

// GET /api/orders
router.get('/', (_req: Request, res: Response) => {
  try {
    const orders = db.getOrders();
    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/orders
router.post('/', (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, customerCity, deliveryMode, items, paymentMethod, hub } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Données de commande incomplètes (nom client et articles requis)' });
    }

    const newOrder = db.createOrder({
      customerName,
      customerPhone: customerPhone || '+225 00 00 00 00 00',
      customerCity: customerCity || 'Abidjan',
      deliveryMode: deliveryMode || 'livraison_express',
      items,
      paymentMethod: paymentMethod || 'wave',
      hub: hub || 'Point Relais Cocody',
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['paye', 'en_livraison', 'livre'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }

    const updated = db.updateOrderStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
