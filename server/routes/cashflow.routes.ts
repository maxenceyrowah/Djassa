import { Router, Request, Response } from 'express';
import { db } from '../db/mockDatabase';

const router = Router();

// GET /api/cashflow
router.get('/', (_req: Request, res: Response) => {
  try {
    const metrics = db.getCashflowMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
