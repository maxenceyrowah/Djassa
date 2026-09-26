import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import productsRouter from './routes/products.routes';
import ordersRouter from './routes/orders.routes';
import movementsRouter from './routes/movements.routes';
import cashflowRouter from './routes/cashflow.routes';
import agentRouter from './routes/agent.routes';
import { db } from './db/mockDatabase';

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Universal CORS Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const time = new Date().toLocaleTimeString('fr-FR');
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/cashflow', cashflowRouter);
app.use('/api/agent', agentRouter);

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'DJASSA Inventory API',
    version: '1.0.0',
    currency: 'FCFA',
    hubs: [
      'Dépôt Central Treichville',
      'Point Relais Cocody',
      'Dépôt Yopougon',
      'Hub Express Plateau',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Reset database to initial mock state
app.post('/api/reset', (_req: Request, res: Response) => {
  db.reset();
  res.json({ success: true, message: 'Base de données réinitialisée aux données mock initiales.' });
});

// 404 Handler for API
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `Route API introuvable : ${req.method} ${req.originalUrl}` });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 DJASSA Backend API démarré avec succès !`);
  console.log(`📍 Port : http://localhost:${PORT}`);
  console.log(`📦 Santé API : http://localhost:${PORT}/api/health`);
  console.log(`🤖 Endpoints Agent IA : http://localhost:${PORT}/api/agent/audit`);
  console.log(`=================================================`);
});

export default app;
