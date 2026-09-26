import React, { useCallback, useState } from 'react';
import { Lock, Phone, ShoppingBag, User, X, Eye, EyeOff } from 'lucide-react';
import { Customer, Session, Vendor } from '../types/inventory';
import {
  CustomerSignup,
  CustomerSignupErrors,
  authenticateCustomer,
  findVendorByPhone,
  buildCustomer,
  validateCustomerSignup
} from '../utils/auth';
import { ABIDJAN_COMMUNES } from '../utils/vendor';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface CustomerAuthModalProps {
  isOpen: boolean;
  /** Raison affichée en tête, ex. « pour valider votre commande ». */
  reason?: string;
  customers: Customer[];
  vendors: Vendor[];
  onClose: () => void;
  onRegister: (customer: Customer) => void;
  onAuthenticated: (session: Session, customer?: Customer) => void;
  onOpenProLogin: () => void;
}

const fieldClass = (error?: string) =>
  `w-full h-11 pl-10 pr-3 rounded-xl text-sm border transition-colors focus:outline-none focus:ring-2 ${
    error
      ? 'border-[#ba1a1a] bg-[#fff8f7] focus:ring-[#ba1a1a]/20'
      : 'border-[#e2e8f0] bg-[#f8f9ff] focus:bg-white focus:border-[#00685d] focus:ring-[#00685d]/15'
  }`;

const EMPTY_SIGNUP: CustomerSignup = { fullName: '', phone: '', commune: '', address: '', password: '' };

const CustomerAuthModalContent: React.FC<CustomerAuthModalProps> = ({
  reason,
  customers,
  vendors,
  onClose,
  onRegister,
  onAuthenticated,
  onOpenProLogin
}) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  useEscapeKey(handleClose);

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signup, setSignup] = useState<CustomerSignup>(EMPTY_SIGNUP);
  const [signupErrors, setSignupErrors] = useState<CustomerSignupErrors>({});

  const updateSignup = <K extends keyof CustomerSignup>(key: K, value: CustomerSignup[K]) => {
    setSignup((prev) => ({ ...prev, [key]: value }));
    if (signupErrors[key]) setSignupErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = authenticateCustomer(customers, phone, password);
    if (!result.ok) {
      const shop = findVendorByPhone(vendors, phone);
      return setLoginError(
        shop
          ? `Ce numéro est celui de la boutique ${shop.shopName}. Les vendeurs se connectent depuis l'espace professionnel.`
          : result.error
      );
    }
    onAuthenticated(result.session);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCustomerSignup(signup, customers);
    if (Object.keys(errors).length > 0) {
      setSignupErrors(errors);
      return;
    }
    const customer = buildCustomer(signup);
    onRegister(customer);
    onAuthenticated({ role: 'customer', customerId: customer.id }, customer);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#0b1c30]/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-auth-title"
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[94vh] overflow-y-auto animate-rise"
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#eefaf6] text-[#00685d] flex items-center justify-center">
              <ShoppingBag size={19} />
            </span>
            <div>
              <h2 id="customer-auth-title" className="font-headline font-bold text-lg text-[#0b1c30]">
                {tab === 'login' ? 'Connexion' : 'Créer mon compte'}
              </h2>
              <p className="text-xs text-[#64748b]">{reason ?? 'Suivez vos commandes et commandez plus vite.'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-lg text-[#64748b] hover:text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-5">
          <div role="tablist" className="grid grid-cols-2 p-1 rounded-xl bg-[#eff4ff]">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`h-9 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? 'bg-white text-[#0b1c30] shadow-sm' : 'text-[#64748b] hover:text-[#0b1c30]'
                }`}
              >
                {t === 'login' ? "J'ai un compte" : 'Nouveau client'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} noValidate className="p-5 flex flex-col gap-3.5">
            {loginError && (
              <div role="alert" className="p-3 rounded-xl bg-[#fdecec] border border-[#fecaca] text-sm text-[#93000a]">
                {loginError}
                {findVendorByPhone(vendors, phone) && (
                  <button
                    type="button"
                    onClick={onOpenProLogin}
                    className="mt-2 block font-semibold text-[#00685d] underline"
                  >
                    Aller à l'espace vendeur
                  </button>
                )}
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#0b1c30]">Téléphone</span>
              <span className="relative">
                <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setLoginError(null);
                  }}
                  placeholder="07 48 92 11 02"
                  className={`${fieldClass(loginError ?? undefined)} font-mono`}
                />
              </span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#0b1c30]">Mot de passe</span>
              <span className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError(null);
                  }}
                  className={`${fieldClass(loginError ?? undefined)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <button type="submit" className="h-11 rounded-xl bg-[#00685d] hover:bg-[#005048] text-white text-sm font-semibold shadow-sm transition-colors">
              Se connecter
            </button>
            <div className="p-3 rounded-xl bg-[#f8f9ff] border border-dashed border-[#cbd5e1] text-xs text-[#3d4946] flex items-center justify-between gap-3">
              <span>
                Démo : <span className="font-mono">07 48 92 11 02</span> / <span className="font-mono">akwaba2026</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhone('07 48 92 11 02');
                  setPassword('akwaba2026');
                  setLoginError(null);
                }}
                className="h-8 px-3 rounded-lg bg-white border border-[#e2e8f0] font-semibold text-[#00685d] hover:bg-[#eefaf6] shrink-0"
              >
                Remplir
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} noValidate className="p-5 flex flex-col gap-3.5">
            <SignupField label="Nom complet" error={signupErrors.fullName} icon={<User size={17} />}>
              <input
                autoComplete="name"
                autoFocus
                value={signup.fullName}
                onChange={(e) => updateSignup('fullName', e.target.value)}
                placeholder="ex : Awa Koné"
                aria-invalid={Boolean(signupErrors.fullName)}
                className={fieldClass(signupErrors.fullName)}
              />
            </SignupField>
            <SignupField label="Téléphone (Wave / Orange Money / MTN)" error={signupErrors.phone} icon={<Phone size={17} />}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={signup.phone}
                onChange={(e) => updateSignup('phone', e.target.value)}
                placeholder="07 11 22 33 44"
                aria-invalid={Boolean(signupErrors.phone)}
                className={`${fieldClass(signupErrors.phone)} font-mono`}
              />
            </SignupField>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#0b1c30]">Commune</span>
                <select
                  value={signup.commune}
                  onChange={(e) => updateSignup('commune', e.target.value)}
                  aria-invalid={Boolean(signupErrors.commune)}
                  className={`${fieldClass(signupErrors.commune)} pl-3`}
                >
                  <option value="">Choisir…</option>
                  {ABIDJAN_COMMUNES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {signupErrors.commune && (
                  <span role="alert" className="text-[11px] font-medium text-[#ba1a1a]">
                    {signupErrors.commune}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#0b1c30]">Quartier / repère</span>
                <input
                  value={signup.address}
                  onChange={(e) => updateSignup('address', e.target.value)}
                  placeholder="Riviera 2"
                  autoComplete="street-address"
                  className={`${fieldClass()} pl-3`}
                />
              </label>
            </div>
            <SignupField label="Mot de passe" error={signupErrors.password} hint="6 caractères minimum" icon={<Lock size={17} />}>
              <input
                type="password"
                autoComplete="new-password"
                value={signup.password}
                onChange={(e) => updateSignup('password', e.target.value)}
                aria-invalid={Boolean(signupErrors.password)}
                className={fieldClass(signupErrors.password)}
              />
            </SignupField>
            <button type="submit" className="h-11 rounded-xl bg-[#00685d] hover:bg-[#005048] text-white text-sm font-semibold shadow-sm transition-colors">
              Créer mon compte
            </button>
          </form>
        )}

        <div className="px-5 pb-5 text-center text-xs text-[#64748b]">
          Vous êtes vendeur ou administrateur ?{' '}
          <button onClick={onOpenProLogin} className="font-semibold text-[#00685d] hover:underline">
            Espace professionnel
          </button>
        </div>
      </div>
    </div>
  );
};

const SignupField: React.FC<{ label: string; error?: string; hint?: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  label,
  error,
  hint,
  icon,
  children
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold text-[#0b1c30]">{label}</span>
    <span className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]">{icon}</span>
      {children}
    </span>
    {error ? (
      <span role="alert" className="text-[11px] font-medium text-[#ba1a1a]">
        {error}
      </span>
    ) : hint ? (
      <span className="text-[11px] text-[#64748b]">{hint}</span>
    ) : null}
  </label>
);

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = (props) =>
  props.isOpen ? <CustomerAuthModalContent {...props} /> : null;
