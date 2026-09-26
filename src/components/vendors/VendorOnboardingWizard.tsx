import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bike,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  MapPin,
  PackagePlus,
  Phone,
  Store,
  User,
  Wallet,
  Warehouse,
  X
} from 'lucide-react';
import { ProductCategory, Vendor, VendorLegalForm, PayoutMethod, WarehouseHub, DeliveryMode } from '../../types/inventory';
import {
  ABIDJAN_COMMUNES,
  ALL_CATEGORIES,
  ALL_HUBS,
  BRAND_COLORS,
  COMMUNE_TO_HUB,
  EMPTY_VENDOR_DRAFT,
  LEGAL_FORM_LABELS,
  PAYOUT_LABELS,
  VENDOR_STEPS,
  VendorDraft,
  VendorErrors,
  VendorStep,
  buildVendorFromDraft,
  defaultCommission,
  normalizeCIPhone,
  slugify,
  validateVendorStep,
  vendorInitials
} from '../../utils/vendor';
import { formatFCFA } from '../../utils/format';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { generateAccessCode } from '../../utils/auth';

interface VendorOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  existingVendors: Vendor[];
  onCreateVendor: (vendor: Vendor) => void;
  onAddFirstProduct: (vendor: Vendor) => void;
  onViewVendor: (vendor: Vendor) => void;
  /** 'admin' : création depuis le back-office. 'self' : inscription publique « Devenir vendeur ». */
  mode?: 'admin' | 'self';
  onOpenVendorSpace?: (vendor: Vendor) => void;
}

const inputClass = (hasError?: boolean) =>
  `w-full h-10 px-3 rounded-lg text-sm text-[#0b1c30] placeholder:text-[#94a3b8] border transition-colors focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-[#ba1a1a] bg-[#fff8f7] focus:ring-[#ba1a1a]/20'
      : 'border-[#e2e8f0] bg-[#f8f9ff] focus:border-[#00685d] focus:bg-white focus:ring-[#00685d]/15'
  }`;

const Field: React.FC<{
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, htmlFor, required, hint, error, children, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label htmlFor={htmlFor} className="text-xs font-semibold text-[#0b1c30]">
      {label}
      {required && <span className="text-[#ba1a1a] ml-0.5">*</span>}
    </label>
    {children}
    {error ? (
      <span role="alert" className="text-[11px] font-medium text-[#ba1a1a]">
        {error}
      </span>
    ) : hint ? (
      <span className="text-[11px] text-[#64748b]">{hint}</span>
    ) : null}
  </div>
);

const ChoiceCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}> = ({ selected, onClick, title, subtitle, icon }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`relative text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
      selected
        ? 'border-[#00685d] bg-[#eefaf6] ring-1 ring-[#00685d]'
        : 'border-[#e2e8f0] bg-white hover:border-[#94a3b8]'
    }`}
  >
    {icon && (
      <span className={`mt-0.5 ${selected ? 'text-[#00685d]' : 'text-[#64748b]'}`}>{icon}</span>
    )}
    <span className="flex flex-col min-w-0">
      <span className="text-sm font-semibold text-[#0b1c30]">{title}</span>
      {subtitle && <span className="text-[11px] text-[#64748b] leading-snug mt-0.5">{subtitle}</span>}
    </span>
    {selected && (
      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#00685d] text-white flex items-center justify-center">
        <Check size={11} strokeWidth={3} />
      </span>
    )}
  </button>
);

const VendorOnboardingWizardContent: React.FC<VendorOnboardingWizardProps> = ({
  onClose,
  existingVendors,
  onCreateVendor,
  onAddFirstProduct,
  onViewVendor,
  mode = 'admin',
  onOpenVendorSpace
}) => {
  const isSelf = mode === 'self';
  const [codeCopied, setCodeCopied] = useState(false);
  // Le brouillon est conservé si l'utilisateur ferme l'assistant par erreur.
  const [draft, setDraft] = usePersistentState<VendorDraft>('vendor-draft', EMPTY_VENDOR_DRAFT);
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [errors, setErrors] = useState<VendorErrors>({});
  const [createdVendor, setCreatedVendor] = useState<Vendor | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const step = VENDOR_STEPS[stepIndex];
  const isDirty = JSON.stringify(draft) !== JSON.stringify(EMPTY_VENDOR_DRAFT);

  const handleClose = useCallback(() => onClose(), [onClose]);
  useEscapeKey(handleClose);

  const update = <K extends keyof VendorDraft>(key: K, value: VendorDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleCategory = (cat: ProductCategory) =>
    update(
      'categories',
      draft.categories.includes(cat) ? draft.categories.filter((c) => c !== cat) : [...draft.categories, cat]
    );

  const toggleDelivery = (mode: DeliveryMode) =>
    update(
      'deliveryModes',
      draft.deliveryModes.includes(mode)
        ? draft.deliveryModes.filter((m) => m !== mode)
        : [...draft.deliveryModes, mode]
    );

  const focusFirstError = () => {
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.focus();
    });
  };

  const goTo = (index: number) => {
    setErrors({});
    setStepIndex(index);
    setMaxReached((m) => Math.max(m, index));
    formRef.current?.scrollTo({ top: 0 });
  };

  const handleNext = (e?: React.FormEvent) => {
    e?.preventDefault();
    const stepErrors = validateVendorStep(step.id, draft, existingVendors);
    if (isSelf && stepErrors.acceptTerms) stepErrors.acceptTerms = 'Vous devez accepter la charte vendeur pour continuer.';
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      focusFirstError();
      return;
    }

    if (step.id === 'recap') {
      const vendor = buildVendorFromDraft(draft, { accessCode: generateAccessCode(), selfSignup: isSelf });
      onCreateVendor(vendor);
      setCreatedVendor(vendor);
      setDraft(EMPTY_VENDOR_DRAFT);
      return;
    }

    // Pré-remplissages intelligents en passant à l'étape suivante
    if (step.id === 'contact') {
      if (!draft.payoutAccount && normalizeCIPhone(draft.phone)) {
        setDraft((prev) => ({ ...prev, payoutAccount: normalizeCIPhone(prev.phone)! }));
      }
      if (COMMUNE_TO_HUB[draft.commune]) {
        setDraft((prev) => ({ ...prev, hub: COMMUNE_TO_HUB[prev.commune] }));
      }
    }

    goTo(stepIndex + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) goTo(stepIndex - 1);
  };

  const resetAndRestart = () => {
    setDraft(EMPTY_VENDOR_DRAFT);
    setCreatedVendor(null);
    setStepIndex(0);
    setMaxReached(0);
    setErrors({});
  };

  const phonePreview = normalizeCIPhone(draft.phone);
  const slugPreview = slugify(draft.shopName) || 'ma-boutique';
  const estimatedNet = useMemo(() => {
    const sample = 100000;
    return sample - Math.round((sample * draft.commissionRate) / 100);
  }, [draft.commissionRate]);

  if (createdVendor) {
    return (
      <Overlay onClose={handleClose}>
        <div className="flex flex-col items-center text-center px-6 py-10 sm:py-14 gap-5 max-w-lg mx-auto">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl text-white flex items-center justify-center font-headline font-bold text-2xl shadow-lg animate-pop"
              style={{ backgroundColor: createdVendor.brandColor }}
            >
              {vendorInitials(createdVendor.shopName)}
            </div>
            <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#00685d] text-white flex items-center justify-center ring-4 ring-white">
              <Check size={18} strokeWidth={3} />
            </span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-2xl text-[#0b1c30]">
              {isSelf ? 'Demande envoyée !' : `${createdVendor.shopName} est créée`}
            </h2>
            <p className="text-sm text-[#64748b] mt-2 leading-relaxed">
              {isSelf ? (
                <>Votre boutique <strong className="text-[#0b1c30]">{createdVendor.shopName}</strong> sera vérifiée par l'équipe DJASSA sous 24h. En attendant, vous pouvez déjà préparer votre catalogue.</>
              ) : createdVendor.status === 'actif' ? (
                <>La boutique est <strong className="text-[#00685d]">active</strong> et peut vendre dès maintenant depuis le {createdVendor.hub}.</>
              ) : (
                <>La boutique est <strong className="text-[#b45309]">en attente de validation</strong> : vérifiez la pièce d'identité du vendeur puis activez-la depuis sa fiche.</>
              )}
            </p>
          </div>

          <div className="w-full rounded-xl border border-dashed border-[#00685d] bg-[#eefaf6] p-4 text-left">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#00685d]">
              {isSelf ? 'Vos identifiants espace vendeur' : 'Identifiants à transmettre au vendeur'}
            </span>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-sm text-[#0b1c30]">
                <div className="font-mono">{createdVendor.phone}</div>
                <div className="mt-0.5">
                  Code d'accès : <strong className="font-mono text-lg tracking-[0.2em]">{createdVendor.accessCode}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`DJASSA espace vendeur\nTéléphone : ${createdVendor.phone}\nCode : ${createdVendor.accessCode}`);
                  setCodeCopied(true);
                }}
                className="h-9 px-3 rounded-lg bg-white border border-[#b7e4d8] text-xs font-semibold text-[#00685d] hover:bg-[#f8f9ff] shrink-0"
              >
                {codeCopied ? 'Copié ✓' : 'Copier'}
              </button>
            </div>
            <p className="text-[11px] text-[#3d4946] mt-2">Conservez ce code : il sert à se connecter à l'espace vendeur.</p>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 text-left">
            <MiniStat label="Commission" value={`${createdVendor.commissionRate} %`} />
            <MiniStat label="Reversement" value={PAYOUT_LABELS[createdVendor.payoutMethod]} />
            <MiniStat label="Hub" value={createdVendor.hub.split(' ').slice(-1)[0]} />
          </div>

          {isSelf ? (
            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenVendorSpace?.(createdVendor)}
                className="w-full h-11 rounded-xl bg-[#00685d] hover:bg-[#005048] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Store size={18} />
                Accéder à mon espace vendeur
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-10 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#f8f9ff] text-sm font-semibold text-[#0b1c30] transition-colors"
              >
                Retour à la marketplace
              </button>
            </div>
          ) : (
          <div className="w-full flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => onAddFirstProduct(createdVendor)}
              className="w-full h-11 rounded-xl bg-[#00685d] hover:bg-[#005048] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <PackagePlus size={18} />
              Ajouter son premier produit
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onViewVendor(createdVendor)}
                className="h-10 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#f8f9ff] text-sm font-semibold text-[#0b1c30] transition-colors"
              >
                Voir la fiche
              </button>
              <button
                type="button"
                onClick={resetAndRestart}
                className="h-10 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#f8f9ff] text-sm font-semibold text-[#0b1c30] transition-colors"
              >
                Créer un autre
              </button>
            </div>
          </div>
          )}
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={handleClose}>
      {/* En-tête */}
      <div className="flex items-center justify-between px-5 sm:px-6 h-16 border-b border-[#e2e8f0] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#00685d] text-white flex items-center justify-center shrink-0">
            <Store size={18} />
          </div>
          <div className="min-w-0">
            <h2 id="vendor-wizard-title" className="font-headline font-bold text-base text-[#0b1c30] leading-tight">
              {isSelf ? 'Devenir vendeur sur DJASSA' : 'Créer un vendeur'}
            </h2>
            <p className="text-[11px] text-[#64748b] truncate">
              Étape {stepIndex + 1} sur {VENDOR_STEPS.length} · {step.hint}
              {isDirty && <span className="hidden sm:inline"> · Brouillon enregistré automatiquement</span>}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-9 h-9 rounded-lg text-[#64748b] hover:text-[#0b1c30] hover:bg-[#eff4ff] flex items-center justify-center transition-colors"
          aria-label="Fermer l'assistant"
        >
          <X size={20} />
        </button>
      </div>

      {/* Barre de progression mobile */}
      <div className="lg:hidden h-1 bg-[#eff4ff] shrink-0">
        <div
          className="h-full bg-[#00685d] transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / VENDOR_STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 min-h-0 grid lg:grid-cols-[220px_1fr_300px]">
        {/* Stepper desktop */}
        <nav aria-label="Étapes" className="hidden lg:flex flex-col gap-1 p-4 border-r border-[#e2e8f0] bg-[#f8f9ff]">
          {VENDOR_STEPS.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            const reachable = i <= maxReached;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!reachable}
                onClick={() => reachable && goTo(i)}
                aria-current={current ? 'step' : undefined}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                  current ? 'bg-white shadow-sm ring-1 ring-[#e2e8f0]' : reachable ? 'hover:bg-white/70' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    done
                      ? 'bg-[#00685d] text-white'
                      : current
                        ? 'bg-[#0b1c30] text-white'
                        : 'bg-white text-[#64748b] ring-1 ring-[#e2e8f0]'
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className={`text-sm font-semibold ${current ? 'text-[#0b1c30]' : 'text-[#3d4946]'}`}>{s.label}</span>
                  <span className="text-[11px] text-[#64748b] truncate">{s.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Formulaire */}
        <form
          ref={formRef}
          onSubmit={handleNext}
          noValidate
          className="overflow-y-auto px-5 sm:px-8 py-6 flex flex-col gap-5 [&>*]:shrink-0"
        >
          <div>
            <h3 className="font-headline font-bold text-xl text-[#0b1c30]">{stepTitles[step.id].title}</h3>
            <p className="text-sm text-[#64748b] mt-1">{stepTitles[step.id].subtitle}</p>
          </div>

          {step.id === 'boutique' && (
            <>
              <Field label="Nom de la boutique" htmlFor="shopName" required error={errors.shopName} hint={`Adresse publique : djassa.ci/${slugPreview}`}>
                <input
                  id="shopName"
                  autoFocus
                  value={draft.shopName}
                  onChange={(e) => update('shopName', e.target.value)}
                  aria-invalid={Boolean(errors.shopName)}
                  placeholder="ex : Tech Ivoire Store"
                  className={inputClass(Boolean(errors.shopName))}
                  maxLength={50}
                />
              </Field>

              <Field label="Accroche" htmlFor="tagline" error={errors.tagline} hint={`${draft.tagline.length}/90 · affichée sous le nom de la boutique`}>
                <input
                  id="tagline"
                  value={draft.tagline}
                  onChange={(e) => update('tagline', e.target.value)}
                  aria-invalid={Boolean(errors.tagline)}
                  placeholder="ex : Accessoires gaming livrés en 24h à Abidjan"
                  className={inputClass(Boolean(errors.tagline))}
                  maxLength={90}
                />
              </Field>

              <Field label="Catégories vendues" required error={errors.categories}>
                <div className="flex flex-wrap gap-2" aria-invalid={Boolean(errors.categories)} tabIndex={-1}>
                  {ALL_CATEGORIES.map((cat) => {
                    const active = draft.categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        aria-pressed={active}
                        className={`h-9 px-3.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-[#00685d] border-[#00685d] text-white'
                            : 'bg-white border-[#e2e8f0] text-[#3d4946] hover:border-[#94a3b8]'
                        }`}
                      >
                        {active && <Check size={13} strokeWidth={3} />}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Couleur de la marque" hint="Utilisée pour l'avatar et la bannière de la boutique">
                <div className="flex items-center gap-2">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update('brandColor', c)}
                      aria-label={`Couleur ${c}`}
                      aria-pressed={draft.brandColor === c}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        draft.brandColor === c ? 'ring-2 ring-offset-2 ring-[#0b1c30] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </Field>
            </>
          )}

          {step.id === 'contact' && (
            <>
              <Field label="Nom complet du responsable" htmlFor="ownerName" required error={errors.ownerName}>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    id="ownerName"
                    autoFocus
                    value={draft.ownerName}
                    onChange={(e) => update('ownerName', e.target.value)}
                    aria-invalid={Boolean(errors.ownerName)}
                    placeholder="ex : Aïcha Traoré"
                    autoComplete="name"
                    className={`${inputClass(Boolean(errors.ownerName))} pl-9`}
                  />
                </div>
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Téléphone"
                  htmlFor="phone"
                  required
                  error={errors.phone}
                  hint={phonePreview ? `✓ ${phonePreview}` : 'Numéro à 10 chiffres'}
                >
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      value={draft.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      aria-invalid={Boolean(errors.phone)}
                      placeholder="07 48 92 11 02"
                      autoComplete="tel"
                      className={`${inputClass(Boolean(errors.phone))} pl-9 font-mono`}
                    />
                  </div>
                </Field>
                <Field label="E-mail" htmlFor="email" error={errors.email} hint="Facultatif · pour les relevés mensuels">
                  <input
                    id="email"
                    type="email"
                    value={draft.email}
                    onChange={(e) => update('email', e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    placeholder="contact@boutique.ci"
                    autoComplete="email"
                    className={inputClass(Boolean(errors.email))}
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Commune" htmlFor="commune" required error={errors.commune}>
                  <select
                    id="commune"
                    value={draft.commune}
                    onChange={(e) => update('commune', e.target.value)}
                    aria-invalid={Boolean(errors.commune)}
                    className={inputClass(Boolean(errors.commune))}
                  >
                    <option value="">Sélectionner…</option>
                    {ABIDJAN_COMMUNES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Adresse / repère" htmlFor="address" hint="ex : Carrefour Siporex, face pharmacie">
                  <input
                    id="address"
                    value={draft.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="Quartier, rue, repère"
                    autoComplete="street-address"
                    className={inputClass()}
                  />
                </Field>
              </div>
            </>
          )}

          {step.id === 'legal' && (
            <>
              <Field label="Forme juridique" required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(LEGAL_FORM_LABELS) as VendorLegalForm[]).map((lf) => (
                    <ChoiceCard
                      key={lf}
                      selected={draft.legalForm === lf}
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, legalForm: lf, commissionRate: defaultCommission(lf) }));
                        setErrors({});
                      }}
                      title={LEGAL_FORM_LABELS[lf]}
                      subtitle={`Commission ${defaultCommission(lf)} %`}
                    />
                  ))}
                </div>
              </Field>

              {draft.legalForm === 'particulier' ? (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] text-xs leading-relaxed">
                  <Clock size={16} className="shrink-0 mt-0.5" />
                  <span>
                    {isSelf
                      ? "Votre boutique sera activée après vérification de votre pièce d'identité (CNI) par l'équipe DJASSA."
                      : 'Les vendeurs particuliers sont créés en attente de validation. Vous pourrez les activer après vérification de la CNI.'}
                  </span>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="N° RCCM" htmlFor="rccm" required error={errors.rccm} hint="Registre du Commerce, ex : CI-ABJ-2024-B-12345">
                    <input
                      id="rccm"
                      value={draft.rccm}
                      onChange={(e) => update('rccm', e.target.value.toUpperCase())}
                      aria-invalid={Boolean(errors.rccm)}
                      placeholder="CI-ABJ-2024-B-12345"
                      className={`${inputClass(Boolean(errors.rccm))} font-mono uppercase`}
                    />
                  </Field>
                  <Field label="N° Compte Contribuable (NCC)" htmlFor="ncc" hint="Facultatif">
                    <input
                      id="ncc"
                      value={draft.ncc}
                      onChange={(e) => update('ncc', e.target.value.toUpperCase())}
                      placeholder="ex : 2104587K"
                      className={`${inputClass()} font-mono uppercase`}
                    />
                  </Field>
                </div>
              )}

              <Field label="Mode de reversement des ventes" required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(PAYOUT_LABELS) as PayoutMethod[]).map((pm) => (
                    <ChoiceCard
                      key={pm}
                      selected={draft.payoutMethod === pm}
                      onClick={() => {
                        update('payoutMethod', pm);
                        setErrors((prev) => ({ ...prev, payoutAccount: undefined }));
                      }}
                      title={PAYOUT_LABELS[pm]}
                      subtitle={pm === 'virement' ? 'J+3 ouvrés' : 'Instantané'}
                    />
                  ))}
                </div>
              </Field>

              <Field
                label={draft.payoutMethod === 'virement' ? 'IBAN / RIB' : `Numéro ${PAYOUT_LABELS[draft.payoutMethod]}`}
                htmlFor="payoutAccount"
                required
                error={errors.payoutAccount}
                hint={draft.payoutMethod === 'virement' ? undefined : 'Pré-rempli avec le téléphone du responsable'}
              >
                <div className="relative">
                  <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    id="payoutAccount"
                    value={draft.payoutAccount}
                    onChange={(e) => update('payoutAccount', e.target.value)}
                    aria-invalid={Boolean(errors.payoutAccount)}
                    placeholder={draft.payoutMethod === 'virement' ? 'CI93 CI00 0000 0000 0000 0000 00' : '07 48 92 11 02'}
                    className={`${inputClass(Boolean(errors.payoutAccount))} pl-9 font-mono`}
                  />
                </div>
              </Field>

              {isSelf ? (
                <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs text-[#3d4946] leading-relaxed">
                  Commission DJASSA : <strong className="text-[#0b1c30]">{draft.commissionRate} %</strong> par vente. Sur une vente de{' '}
                  {formatFCFA(100000)}, vous recevez <strong className="text-[#00685d]">{formatFCFA(estimatedNet)}</strong>.
                </div>
              ) : (
              <Field
                label={`Commission DJASSA : ${draft.commissionRate} %`}
                htmlFor="commission"
                error={errors.commissionRate}
                hint={`Sur une vente de ${formatFCFA(100000)}, le vendeur reçoit ${formatFCFA(estimatedNet)}.`}
              >
                <input
                  id="commission"
                  type="range"
                  min={5}
                  max={25}
                  step={0.5}
                  value={draft.commissionRate}
                  onChange={(e) => update('commissionRate', Number(e.target.value))}
                  className="w-full accent-[#00685d]"
                />
              </Field>
              )}
            </>
          )}

          {step.id === 'logistique' && (
            <>
              <Field label="Hub de rattachement" required hint={draft.commune ? `Suggéré pour ${draft.commune}` : undefined}>
                <div className="grid sm:grid-cols-2 gap-2">
                  {ALL_HUBS.map((hub) => (
                    <ChoiceCard
                      key={hub}
                      selected={draft.hub === hub}
                      onClick={() => update('hub', hub as WarehouseHub)}
                      title={hub}
                      subtitle={hubDescriptions[hub]}
                      icon={<Warehouse size={16} />}
                    />
                  ))}
                </div>
              </Field>

              <Field label="Modes de remise au client" required error={errors.deliveryModes}>
                <div className="grid sm:grid-cols-2 gap-2" aria-invalid={Boolean(errors.deliveryModes)} tabIndex={-1}>
                  <ChoiceCard
                    selected={draft.deliveryModes.includes('retrait_boutique')}
                    onClick={() => toggleDelivery('retrait_boutique')}
                    title="Retrait au dépôt"
                    subtitle="Le client récupère sa commande au hub · gratuit"
                    icon={<Building2 size={16} />}
                  />
                  <ChoiceCard
                    selected={draft.deliveryModes.includes('livraison_express')}
                    onClick={() => toggleDelivery('livraison_express')}
                    title="Livraison express"
                    subtitle="Coursier DJASSA sous 24h · 2 000 FCFA"
                    icon={<Bike size={16} />}
                  />
                </div>
              </Field>
            </>
          )}

          {step.id === 'recap' && (
            <>
              <RecapSection title="Boutique" onEdit={() => goTo(0)}>
                <RecapRow label="Nom" value={draft.shopName} />
                <RecapRow label="Adresse web" value={`djassa.ci/${slugPreview}`} mono />
                <RecapRow label="Catégories" value={draft.categories.join(', ')} />
                {draft.tagline && <RecapRow label="Accroche" value={draft.tagline} />}
              </RecapSection>
              <RecapSection title="Responsable" onEdit={() => goTo(1)}>
                <RecapRow label="Nom" value={draft.ownerName} />
                <RecapRow label="Téléphone" value={phonePreview ?? draft.phone} mono />
                {draft.email && <RecapRow label="E-mail" value={draft.email} />}
                <RecapRow label="Localisation" value={[draft.commune, draft.address].filter(Boolean).join(' · ')} />
              </RecapSection>
              <RecapSection title="Légal & paiement" onEdit={() => goTo(2)}>
                <RecapRow label="Statut" value={LEGAL_FORM_LABELS[draft.legalForm]} />
                {draft.legalForm !== 'particulier' && <RecapRow label="RCCM" value={draft.rccm} mono />}
                <RecapRow label="Reversement" value={`${PAYOUT_LABELS[draft.payoutMethod]} · ${draft.payoutAccount}`} />
                <RecapRow label="Commission" value={`${draft.commissionRate} %`} />
              </RecapSection>
              <RecapSection title="Logistique" onEdit={() => goTo(3)}>
                <RecapRow label="Hub" value={draft.hub} />
                <RecapRow
                  label="Remise"
                  value={draft.deliveryModes
                    .map((m) => (m === 'retrait_boutique' ? 'Retrait au dépôt' : 'Livraison express'))
                    .join(' + ')}
                />
              </RecapSection>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  errors.acceptTerms ? 'border-[#ba1a1a] bg-[#fff8f7]' : 'border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#eff4ff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={draft.acceptTerms}
                  onChange={(e) => update('acceptTerms', e.target.checked)}
                  aria-invalid={Boolean(errors.acceptTerms)}
                  className="mt-0.5 w-4 h-4 accent-[#00685d]"
                />
                <span className="text-xs text-[#3d4946] leading-relaxed">
                  {isSelf ? "J'ai pris connaissance de la" : 'Le vendeur a pris connaissance de la'} <strong className="text-[#0b1c30]">charte vendeur DJASSA</strong> : prix
                  affichés en FCFA, stock tenu à jour dans le hub de rattachement, expédition sous 24h.
                  {errors.acceptTerms && (
                    <span role="alert" className="block mt-1 font-medium text-[#ba1a1a]">
                      {errors.acceptTerms}
                    </span>
                  )}
                </span>
              </label>
            </>
          )}

          {/* bouton caché pour que « Entrée » valide l'étape */}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>

        {/* Aperçu en direct */}
        <aside className="hidden lg:flex flex-col gap-3 p-5 border-l border-[#e2e8f0] bg-[#f8f9ff] overflow-y-auto">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Aperçu de la boutique</span>
          <VendorPreviewCard draft={draft} slug={slugPreview} phone={phonePreview} />
          <div className="flex items-start gap-2 text-[11px] text-[#64748b] leading-relaxed">
            <FileCheck2 size={14} className="shrink-0 mt-0.5" />
            <span>Cet aperçu se met à jour en temps réel. C'est ce que verront les acheteurs sur DJASSA.</span>
          </div>
        </aside>
      </div>

      {/* Pied de page */}
      <div className="shrink-0 border-t border-[#e2e8f0] px-5 sm:px-6 py-3 flex items-center justify-between gap-3 bg-white">
        <button
          type="button"
          onClick={stepIndex === 0 ? handleClose : handleBack}
          className="h-10 px-4 rounded-xl text-sm font-semibold text-[#3d4946] hover:bg-[#eff4ff] flex items-center gap-1.5 transition-colors"
        >
          {stepIndex === 0 ? (
            'Annuler'
          ) : (
            <>
              <ArrowLeft size={16} /> Retour
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => handleNext()}
          className="h-10 px-5 rounded-xl bg-[#00685d] hover:bg-[#005048] active:scale-[0.98] text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          {step.id === 'recap' ? (
            <>
              <BadgeCheck size={17} /> {isSelf ? 'Envoyer ma demande' : 'Créer le vendeur'}
            </>
          ) : (
            <>
              Continuer <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </Overlay>
  );
};

const stepTitles: Record<VendorStep, { title: string; subtitle: string }> = {
  boutique: { title: 'Présentez la boutique', subtitle: 'Ces informations apparaissent sur la vitrine publique du vendeur.' },
  contact: { title: 'Qui gère la boutique ?', subtitle: 'Le responsable reçoit les notifications de commande par SMS et WhatsApp.' },
  legal: { title: 'Statut et reversements', subtitle: 'Les ventes sont reversées automatiquement, commission DJASSA déduite.' },
  logistique: { title: 'Logistique', subtitle: 'Le hub de rattachement stocke les articles et prépare les commandes.' },
  recap: { title: 'Tout est prêt ?', subtitle: 'Vérifiez les informations avant de publier la boutique.' }
};

const hubDescriptions: Record<WarehouseHub, string> = {
  'Dépôt Central Treichville': 'Entrepôt principal · gros volumes',
  'Point Relais Cocody': 'Abidjan Nord · résidentiel',
  'Dépôt Yopougon': 'Ouest · forte rotation',
  'Hub Express Plateau': "Quartier d'affaires · livraison jour même"
};

const Overlay: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-[60] bg-[#0b1c30]/50 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4 animate-fade-in"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-wizard-title"
      className="bg-white w-full sm:max-w-6xl h-full sm:h-[min(760px,92vh)] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-rise"
    >
      {children}
    </div>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
    <span className="block text-[10px] uppercase tracking-wider text-[#64748b] font-semibold">{label}</span>
    <span className="block text-sm font-bold text-[#0b1c30] mt-0.5 truncate">{value}</span>
  </div>
);

const RecapSection: React.FC<{ title: string; onEdit: () => void; children: React.ReactNode }> = ({ title, onEdit, children }) => (
  <section className="rounded-xl border border-[#e2e8f0] overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8f9ff] border-b border-[#e2e8f0]">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#3d4946]">{title}</h4>
      <button type="button" onClick={onEdit} className="text-xs font-semibold text-[#00685d] hover:underline">
        Modifier
      </button>
    </div>
    <dl className="divide-y divide-[#f1f5f9]">{children}</dl>
  </section>
);

const RecapRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 px-4 py-2 text-sm">
    <dt className="text-[#64748b] shrink-0">{label}</dt>
    <dd className={`text-right text-[#0b1c30] font-medium break-words min-w-0 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</dd>
  </div>
);

const VendorPreviewCard: React.FC<{ draft: VendorDraft; slug: string; phone: string | null }> = ({ draft, slug, phone }) => (
  <div className="rounded-2xl bg-white border border-[#e2e8f0] shadow-sm overflow-hidden">
    <div className="h-16 relative" style={{ backgroundColor: draft.brandColor }}>
      <div
        className="absolute -bottom-6 left-4 w-12 h-12 rounded-xl ring-4 ring-white text-white flex items-center justify-center font-headline font-bold"
        style={{ backgroundColor: draft.brandColor }}
      >
        {vendorInitials(draft.shopName || 'Ma Boutique')}
      </div>
    </div>
    <div className="pt-8 px-4 pb-4 flex flex-col gap-2">
      <div>
        <h4 className="font-headline font-bold text-base text-[#0b1c30] leading-tight break-words">
          {draft.shopName || 'Nom de la boutique'}
        </h4>
        <span className="text-[11px] text-[#64748b] font-mono">djassa.ci/{slug}</span>
      </div>
      <p className="text-xs text-[#3d4946] leading-relaxed min-h-[2rem]">
        {draft.tagline || <span className="text-[#94a3b8]">Votre accroche apparaîtra ici.</span>}
      </p>
      {draft.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {draft.categories.map((c) => (
            <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#3d4946]">
              {c}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1 pt-2 mt-1 border-t border-[#f1f5f9] text-[11px] text-[#64748b]">
        {draft.commune && (
          <span className="flex items-center gap-1.5">
            <MapPin size={12} /> {draft.commune}, Abidjan
          </span>
        )}
        {phone && (
          <span className="flex items-center gap-1.5 font-mono">
            <Phone size={12} /> {phone}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Warehouse size={12} /> {draft.hub}
        </span>
        {draft.deliveryModes.includes('livraison_express') && (
          <span className="flex items-center gap-1.5 text-[#00685d] font-semibold">
            <CheckCircle2 size={12} /> Livraison express 24h
          </span>
        )}
      </div>
    </div>
  </div>
);

export const VendorOnboardingWizard: React.FC<VendorOnboardingWizardProps> = (props) =>
  props.isOpen ? <VendorOnboardingWizardContent {...props} /> : null;
