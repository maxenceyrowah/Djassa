import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_ADMIN, authenticateAdmin, authenticateVendor, generateAccessCode, isSessionValid } from '../src/utils/auth';
import { INITIAL_VENDORS } from '../src/data/mockData';

test('connexion admin', () => {
  assert.equal(authenticateAdmin(DEMO_ADMIN.email, DEMO_ADMIN.password).ok, true);
  assert.equal(authenticateAdmin(DEMO_ADMIN.email.toUpperCase(), DEMO_ADMIN.password).ok, true);
  assert.equal(authenticateAdmin(DEMO_ADMIN.email, 'mauvais').ok, false);
});

test('connexion vendeur par téléphone + code, quel que soit le format du numéro', () => {
  const res = authenticateVendor(INITIAL_VENDORS, '0748129033', '482913');
  assert.ok(res.ok && res.session.role === 'vendor' && res.session.vendorId === 'vnd-techivoire');
  assert.equal(authenticateVendor(INITIAL_VENDORS, '0748129033', '000000').ok, false);
});

test('un vendeur suspendu ne peut pas se connecter et sa session est invalidée', () => {
  const vendors = INITIAL_VENDORS.map((v) => (v.id === 'vnd-techivoire' ? { ...v, status: 'suspendu' as const } : v));
  assert.equal(authenticateVendor(vendors, '0748129033', '482913').ok, false);
  assert.equal(isSessionValid({ role: 'vendor', vendorId: 'vnd-techivoire' }, vendors), false);
  assert.equal(isSessionValid({ role: 'vendor', vendorId: 'vnd-techivoire' }, INITIAL_VENDORS), true);
});

test('generateAccessCode renvoie toujours 6 chiffres', () => {
  assert.equal(generateAccessCode(() => 0), '000000');
  assert.equal(generateAccessCode(() => 0.999999), '999999');
});

import { authenticateCustomer, buildCustomer, findVendorByPhone, migrateVendors, validateCustomerSignup } from '../src/utils/auth';
import { INITIAL_CUSTOMERS } from '../src/data/mockData';

test('inscription client : validation et doublon de numéro', () => {
  const empty = validateCustomerSignup({ fullName: '', phone: '', commune: '', address: '', password: '' }, INITIAL_CUSTOMERS);
  assert.deepEqual(Object.keys(empty).sort(), ['commune', 'fullName', 'password', 'phone']);
  const dup = validateCustomerSignup(
    { fullName: 'Jean Test', phone: '0748921102', commune: 'Cocody', address: '', password: 'secret1' },
    INITIAL_CUSTOMERS
  );
  assert.ok(dup.phone?.includes('existe déjà'));
});

test('un client inscrit peut se connecter, le mot de passe n’est pas stocké en clair', () => {
  const c = buildCustomer({ fullName: 'Mariam Bamba', phone: '05 55 12 34 56', commune: 'Yopougon', address: '', password: 'secret1' });
  assert.notEqual(c.passwordHash, 'secret1');
  assert.ok(authenticateCustomer([c], '0555123456', 'secret1').ok);
  assert.equal(authenticateCustomer([c], '0555123456', 'autre').ok, false);
  assert.ok(authenticateCustomer(INITIAL_CUSTOMERS, '07 48 92 11 02', 'akwaba2026').ok);
});

test('migrateVendors restaure les codes d’accès manquants (données d’une ancienne version)', () => {
  const legacy = INITIAL_VENDORS.map(({ accessCode, ...rest }) => rest) as unknown as typeof INITIAL_VENDORS;
  const migrated = migrateVendors(legacy, INITIAL_VENDORS);
  assert.equal(migrated[0].accessCode, INITIAL_VENDORS[0].accessCode);
  const unknown = migrateVendors([{ ...legacy[0], id: 'vnd-x' }], INITIAL_VENDORS);
  assert.match(unknown[0].accessCode, /^\d{6}$/);
});

test('findVendorByPhone reconnaît un numéro de boutique quel que soit le format', () => {
  assert.equal(findVendorByPhone(INITIAL_VENDORS, '0748129033')?.id, 'vnd-techivoire');
  assert.equal(findVendorByPhone(INITIAL_VENDORS, '0700000000'), undefined);
});
