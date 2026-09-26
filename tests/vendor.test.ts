import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_VENDOR_DRAFT,
  VendorDraft,
  buildVendorFromDraft,
  computeVendorStats,
  isValidRCCM,
  normalizeCIPhone,
  slugify,
  validateVendorDraft,
  validateVendorStep
} from '../src/utils/vendor';
import { INITIAL_PRODUCTS, INITIAL_SALES_ORDERS, INITIAL_VENDORS } from '../src/data/mockData';

const validDraft: VendorDraft = {
  ...EMPTY_VENDOR_DRAFT,
  shopName: 'Boutique Akwaba',
  categories: ['Audio & Casques'],
  ownerName: 'Awa Koné',
  phone: '07 11 22 33 44',
  commune: 'Marcory',
  legalForm: 'sarl',
  rccm: 'CI-ABJ-2024-B-12345',
  payoutMethod: 'wave',
  payoutAccount: '0711223344',
  acceptTerms: true
};

test('normalizeCIPhone accepte les formats courants et rejette les numéros invalides', () => {
  assert.equal(normalizeCIPhone('0748921102'), '+225 07 48 92 11 02');
  assert.equal(normalizeCIPhone('+225 07 48 92 11 02'), '+225 07 48 92 11 02');
  assert.equal(normalizeCIPhone('00225 05 64 21 88 43'), '+225 05 64 21 88 43');
  assert.equal(normalizeCIPhone('07489211'), null); // ancien format 8 chiffres
  assert.equal(normalizeCIPhone('0948921102'), null); // préfixe inconnu
});

test('slugify retire accents et ponctuation', () => {
  assert.equal(slugify('Son d’Abidjan — Électro!'), 'son-d-abidjan-electro');
});

test('isValidRCCM', () => {
  assert.ok(isValidRCCM('CI-ABJ-2021-B-14872'));
  assert.ok(!isValidRCCM('ABJ-2021-14872'));
});

test("l'étape boutique refuse un nom déjà pris et exige une catégorie", () => {
  const errors = validateVendorStep('boutique', { ...validDraft, shopName: 'Tech Ivoire Store', categories: [] }, INITIAL_VENDORS);
  assert.ok(errors.shopName);
  assert.ok(errors.categories);
});

test('le RCCM est exigé pour une société mais pas pour un particulier', () => {
  assert.ok(validateVendorStep('legal', { ...validDraft, rccm: '' }).rccm);
  assert.equal(validateVendorStep('legal', { ...validDraft, legalForm: 'particulier', rccm: '' }).rccm, undefined);
});

test('un brouillon complet est valide', () => {
  assert.deepEqual(validateVendorDraft(validDraft, INITIAL_VENDORS), {});
});

test('buildVendorFromDraft : statut selon le mode de création', () => {
  const byAdmin = buildVendorFromDraft(validDraft, { accessCode: '123456' });
  assert.equal(byAdmin.status, 'actif');
  assert.equal(byAdmin.phone, '+225 07 11 22 33 44');
  assert.equal(byAdmin.payoutAccount, '+225 07 11 22 33 44');

  const selfSignup = buildVendorFromDraft(validDraft, { accessCode: '123456', selfSignup: true });
  assert.equal(selfSignup.status, 'en_attente');

  const individual = buildVendorFromDraft({ ...validDraft, legalForm: 'particulier' }, { accessCode: '123456' });
  assert.equal(individual.status, 'en_attente');
  assert.equal(individual.rccm, undefined);
});

test('computeVendorStats agrège CA et commission au taux du vendeur', () => {
  const tech = INITIAL_VENDORS.find((v) => v.id === 'vnd-techivoire')!;
  const stats = computeVendorStats(tech, INITIAL_PRODUCTS, INITIAL_SALES_ORDERS);
  // sale-1 : clavier 68 000 + câble 40 000, tous deux Tech Ivoire
  assert.equal(stats.revenueFCFA, 108000);
  assert.equal(stats.commissionFCFA, Math.round(108000 * 0.08));
  assert.equal(stats.productCount, 4);
});
