import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, Phone, ShieldCheck, Store } from 'lucide-react';
import { Session, Vendor } from '../types/inventory';
import { DEMO_ADMIN, authenticateAdmin, authenticateVendor } from '../utils/auth';

interface LoginViewProps {
  vendors: Vendor[];
  onLogin: (session: Session) => void;
  onBack: () => void;
  onBecomeVendor: () => void;
}

type Tab = 'vendor' | 'admin';

const inputClass = (error: boolean) =>
  `w-full h-11 pl-10 pr-3 rounded-xl text-sm border transition-colors focus:outline-none focus:ring-2 ${
    error
      ? 'border-[#ba1a1a] bg-[#fff8f7] focus:ring-[#ba1a1a]/20'
      : 'border-[#e2e8f0] bg-[#f8f9ff] focus:bg-white focus:border-[#00685d] focus:ring-[#00685d]/15'
  }`;

export const LoginView: React.FC<LoginViewProps> = ({ vendors, onLogin, onBack, onBecomeVendor }) => {
  const [tab, setTab] = useState<Tab>('vendor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const demoVendor = vendors.find((v) => v.status === 'actif');

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = tab === 'admin' ? authenticateAdmin(email, password) : authenticateVendor(vendors, phone, code);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSubmitting(true);
    // petite latence pour que le retour visuel du bouton soit perceptible
    setTimeout(() => onLogin(result.session), 250);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Panneau marque */}
      <aside className="hidden lg:flex relative overflow-hidden bg-[#0b1c30] text-white p-12 flex-col justify-between">
        <div
          aria-hidden="true"
          className="absolute -left-24 -bottom-24 w-[28rem] h-[28rem] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #00a38f 0%, transparent 70%)' }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-[#00685d] flex items-center justify-center font-headline font-bold">DJ</span>
          <span className="font-headline font-bold text-lg tracking-wider">DJASSA Pro</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="font-headline font-bold text-4xl leading-tight">Gérez votre boutique, vos stocks et vos ventes au même endroit.</h1>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <Store size={18} className="text-[#acedda]" /> Catalogue et stock synchronisés sur 4 hubs
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-[#acedda]" /> Reversements Wave, Orange Money, MTN MoMo
            </li>
            <li className="flex items-center gap-3">
              <KeyRound size={18} className="text-[#acedda]" /> Agent IA de réassort intégré
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">Montants en FCFA · Abidjan, Côte d'Ivoire</p>
      </aside>

      {/* Formulaire */}
      <main className="flex flex-col px-5 sm:px-10 py-6">
        <button
          onClick={onBack}
          className="self-start h-9 px-2 -ml-2 rounded-lg text-sm font-semibold text-[#3d4946] hover:bg-[#f8f9ff] flex items-center gap-1.5"
        >
          <ArrowLeft size={16} /> Retour à la marketplace
        </button>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-sm flex flex-col gap-6">
            <div>
              <h2 className="font-headline font-bold text-2xl text-[#0b1c30]">Connexion</h2>
              <p className="text-sm text-[#64748b] mt-1">Accédez à votre espace de gestion DJASSA.</p>
            </div>

            <div role="tablist" aria-label="Type de compte" className="grid grid-cols-2 p-1 rounded-xl bg-[#eff4ff]">
              {(['vendor', 'admin'] as Tab[]).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => switchTab(t)}
                  className={`h-9 rounded-lg text-sm font-semibold transition-all ${
                    tab === t ? 'bg-white text-[#0b1c30] shadow-sm' : 'text-[#64748b] hover:text-[#0b1c30]'
                  }`}
                >
                  {t === 'vendor' ? 'Vendeur' : 'Administrateur'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {error && (
                <div role="alert" className="p-3 rounded-xl bg-[#fdecec] border border-[#fecaca] text-sm text-[#93000a]">
                  {error}
                </div>
              )}

              {tab === 'vendor' ? (
                <>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#0b1c30]">Téléphone de la boutique</span>
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
                          setError(null);
                        }}
                        placeholder="07 48 12 90 33"
                        className={`${inputClass(Boolean(error))} font-mono`}
                      />
                    </span>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#0b1c30]">Code d'accès (6 chiffres)</span>
                    <span className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="••••••"
                        className={`${inputClass(Boolean(error))} font-mono tracking-[0.4em]`}
                      />
                    </span>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#0b1c30]">E-mail</span>
                    <span className="relative">
                      <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                      <input
                        type="email"
                        autoComplete="username"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        placeholder="admin@djassa.ci"
                        className={inputClass(Boolean(error))}
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
                          setError(null);
                        }}
                        className={`${inputClass(Boolean(error))} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0b1c30]"
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-xl bg-[#00685d] hover:bg-[#005048] active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
              >
                {submitting ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            {/* Identifiants de démonstration */}
            <div className="p-3.5 rounded-xl bg-[#f8f9ff] border border-dashed border-[#cbd5e1] text-xs text-[#3d4946] flex items-start justify-between gap-3">
              <div>
                <span className="block font-semibold text-[#0b1c30]">Compte de démonstration</span>
                {tab === 'admin' ? (
                  <span className="font-mono">
                    {DEMO_ADMIN.email} / {DEMO_ADMIN.password}
                  </span>
                ) : demoVendor ? (
                  <span>
                    {demoVendor.shopName} · <span className="font-mono">{demoVendor.phone}</span> · code{' '}
                    <span className="font-mono">{demoVendor.accessCode}</span>
                  </span>
                ) : (
                  <span>Aucune boutique active.</span>
                )}
              </div>
              {(tab === 'admin' || demoVendor) && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    if (tab === 'admin') {
                      setEmail(DEMO_ADMIN.email);
                      setPassword(DEMO_ADMIN.password);
                    } else if (demoVendor) {
                      setPhone(demoVendor.phone);
                      setCode(demoVendor.accessCode);
                    }
                  }}
                  className="shrink-0 h-8 px-3 rounded-lg bg-white border border-[#e2e8f0] font-semibold text-[#00685d] hover:bg-[#eefaf6]"
                >
                  Remplir
                </button>
              )}
            </div>

            {tab === 'vendor' && (
              <p className="text-sm text-center text-[#64748b]">
                Pas encore de boutique ?{' '}
                <button onClick={onBecomeVendor} className="font-semibold text-[#00685d] hover:underline">
                  Devenir vendeur
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
