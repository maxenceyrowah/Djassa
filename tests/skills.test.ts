import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditStockAlerts } from '../src/agent/skills/alertSkill';
import { generateReorderPlan } from '../src/agent/skills/reorderSkill';
import { INITIAL_PRODUCTS } from '../src/data/mockData';

test('auditStockAlerts détecte le casque sous le seuil', () => {
  const audit = auditStockAlerts(INITIAL_PRODUCTS);
  const headset = audit.alerts.find((a) => a.product.id === 'prod-3');
  assert.equal(headset?.severity, 'critical');
  assert.equal(audit.hubSummaries.length, 4);
});

test('une rupture passe en tête des alertes', () => {
  const products = INITIAL_PRODUCTS.map((p) => (p.id === 'prod-2' ? { ...p, stock: 0 } : p));
  const audit = auditStockAlerts(products);
  assert.equal(audit.alerts[0].severity, 'out_of_stock');
  assert.equal(audit.outOfStockCount, 1);
});

test('generateReorderPlan chiffre le budget en FCFA au coût d’achat', () => {
  const plan = generateReorderPlan(INITIAL_PRODUCTS);
  const total = plan.itemsToRestock.reduce((s, i) => s + i.quantity * i.costPrice, 0);
  assert.equal(plan.totalBudgetFCFA, total);
  assert.ok(plan.batchAction);
});
