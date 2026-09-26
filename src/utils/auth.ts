import { Customer, Session, Vendor } from '../types/inventory';
import { normalizeCIPhone } from './vendor';

/**
 * Authentification de démonstration, entièrement côté navigateur.
 * En production, ces vérifications doivent être faites par l'API (mot de passe haché, jeton de session).
 */
export const DEMO_ADMIN = {
  name: 'Administrateur DJASSA',
  email: 'admin@djassa.ci',
  password: 'djassa2026'
};

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

export function authenticateAdmin(email: string, password: string): AuthResult {
  if (!email.trim() || !password) return { ok: false, error: 'Renseignez votre e-mail et votre mot de passe.' };
  if (email.trim().toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
    return { ok: false, error: 'E-mail ou mot de passe incorrect.' };
  }
  return { ok: true, session: { role: 'admin', name: DEMO_ADMIN.name, email: DEMO_ADMIN.email } };
}

export function authenticateVendor(vendors: Vendor[], phone: string, code: string): AuthResult {
  const normalized = normalizeCIPhone(phone);
  if (!normalized) return { ok: false, error: 'Numéro de téléphone invalide (10 chiffres).' };
  if (!/^\d{6}$/.test(code.trim())) return { ok: false, error: "Le code d'accès comporte 6 chiffres." };

  const vendor = vendors.find((v) => v.phone === normalized);
  if (!vendor || vendor.accessCode !== code.trim()) {
    return { ok: false, error: "Numéro ou code d'accès incorrect." };
  }
  if (vendor.status === 'suspendu') {
    return { ok: false, error: 'Cette boutique est suspendue. Contactez le support DJASSA.' };
  }
  // Une boutique en attente peut se connecter pour préparer son catalogue, mais ne vend pas encore.
  return { ok: true, session: { role: 'vendor', vendorId: vendor.id } };
}

/**
 * Complète les vendeurs enregistrés par une version antérieure de l'app (sans code d'accès) :
 * on reprend le code de démo si le vendeur fait partie des données initiales, sinon on en génère un.
 */
export function migrateVendors(stored: Vendor[], seed: Vendor[]): Vendor[] {
  if (!Array.isArray(stored)) return seed;
  return stored.map((v) =>
    v.accessCode && /^\d{6}$/.test(v.accessCode)
      ? v
      : { ...v, accessCode: seed.find((s) => s.id === v.id)?.accessCode ?? generateAccessCode() }
  );
}

/** Retourne la boutique associée à ce numéro, pour rediriger un vendeur qui se trompe de formulaire. */
export function findVendorByPhone(vendors: Vendor[], phone: string): Vendor | undefined {
  const normalized = normalizeCIPhone(phone);
  return normalized ? vendors.find((v) => v.phone === normalized) : undefined;
}

export function generateAccessCode(random: () => number = Math.random): string {
  return String(Math.floor(random() * 1_000_000)).padStart(6, '0');
}

/**
 * Empreinte FNV-1a salée — DÉMO UNIQUEMENT, pour ne pas stocker le mot de passe en clair dans le navigateur.
 * Ce n'est pas un hachage cryptographique : en production, utiliser bcrypt/argon2 côté serveur.
 */
export function hashPassword(password: string): string {
  let h = 0x811c9dc5;
  const input = `djassa:${password}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export interface CustomerSignup {
  fullName: string;
  phone: string;
  commune: string;
  address: string;
  password: string;
}

export type CustomerSignupErrors = Partial<Record<keyof CustomerSignup, string>>;

export function validateCustomerSignup(input: CustomerSignup, customers: Customer[]): CustomerSignupErrors {
  const errors: CustomerSignupErrors = {};
  if (input.fullName.trim().split(/\s+/).filter(Boolean).length < 2) errors.fullName = 'Indiquez votre prénom et votre nom.';
  const phone = normalizeCIPhone(input.phone);
  if (!phone) errors.phone = 'Numéro ivoirien à 10 chiffres attendu.';
  else if (customers.some((c) => c.phone === phone)) errors.phone = 'Un compte existe déjà avec ce numéro. Connectez-vous.';
  if (!input.commune) errors.commune = 'Choisissez votre commune.';
  if (input.password.length < 6) errors.password = '6 caractères minimum.';
  return errors;
}

export function buildCustomer(input: CustomerSignup, now = new Date()): Customer {
  return {
    id: `cus-${now.getTime().toString(36)}`,
    fullName: input.fullName.trim(),
    phone: normalizeCIPhone(input.phone)!,
    commune: input.commune,
    address: input.address.trim(),
    passwordHash: hashPassword(input.password),
    createdAt: now.toISOString()
  };
}

export function authenticateCustomer(customers: Customer[], phone: string, password: string): AuthResult {
  const normalized = normalizeCIPhone(phone);
  if (!normalized || !password) return { ok: false, error: 'Renseignez votre numéro et votre mot de passe.' };
  const customer = customers.find((c) => c.phone === normalized);
  if (!customer || customer.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'Numéro ou mot de passe incorrect.' };
  }
  return { ok: true, session: { role: 'customer', customerId: customer.id } };
}

/** Une session dont le compte a disparu (ou dont la boutique est suspendue) n'est plus valide. */
export function isSessionValid(session: Session | null, vendors: Vendor[], customers: Customer[] = []): session is Session {
  if (!session) return false;
  if (session.role === 'admin') return true;
  if (session.role === 'customer') return customers.some((c) => c.id === session.customerId);
  const vendor = vendors.find((v) => v.id === session.vendorId);
  return Boolean(vendor && vendor.status !== 'suspendu');
}
