import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { classes } from '../lib/utils'

/* ─────────────────────────────── Boutons ────────────────────────────────── */

type Ton = 'primaire' | 'accent' | 'doux' | 'fantome' | 'alerte'

const TON: Record<Ton, string> = {
  primaire: 'bg-iris text-white hover:brightness-110 active:brightness-95',
  accent: 'bg-apricot text-white hover:brightness-110 active:brightness-95',
  doux: 'bg-surface text-ink border border-line hover:bg-sunken',
  fantome: 'text-ink-soft hover:bg-sunken hover:text-ink',
  alerte: 'bg-berry text-white hover:brightness-110 active:brightness-95',
}

export function Bouton({
  ton = 'primaire',
  pleineLargeur,
  className,
  children,
  ...reste
}: ButtonHTMLAttributes<HTMLButtonElement> & { ton?: Ton; pleineLargeur?: boolean }) {
  return (
    <button
      className={classes(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3',
        'font-semibold transition disabled:cursor-not-allowed disabled:opacity-45',
        TON[ton],
        pleineLargeur && 'w-full',
        className,
      )}
      {...reste}
    >
      {children}
    </button>
  )
}

/* ──────────────────────────────── Surfaces ──────────────────────────────── */

export function Carte({
  className,
  children,
  ...reste
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={classes(
        'rounded-card border border-line bg-surface shadow-soft',
        className,
      )}
      {...reste}
    >
      {children}
    </div>
  )
}

export function TitreSection({
  eyebrow,
  children,
  action,
}: {
  eyebrow?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold text-ink">{children}</h2>
      </div>
      {action}
    </div>
  )
}

export function Etiquette({
  ton = 'iris',
  children,
}: {
  ton?: 'iris' | 'apricot' | 'basil' | 'berry' | 'neutre'
  children: ReactNode
}) {
  const styles = {
    iris: 'bg-iris-wash text-iris',
    apricot: 'bg-apricot-wash text-apricot',
    basil: 'bg-basil-wash text-basil',
    berry: 'bg-berry-wash text-berry',
    neutre: 'bg-sunken text-ink-soft',
  }[ton]
  return (
    <span
      className={classes(
        'inline-flex items-center rounded-full px-2.5 py-1',
        'text-[0.6875rem] font-bold tracking-[0.08em] uppercase',
        styles,
      )}
    >
      {children}
    </span>
  )
}

/* ──────────────────────────────── Formulaire ────────────────────────────── */

export function Champ({
  label,
  aide,
  suffixe,
  id,
  className,
  ...reste
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  aide?: string
  suffixe?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={classes(
            'w-full rounded-2xl border border-line bg-surface px-4 py-3',
            'text-ink placeholder:text-ink-faint',
            'focus:border-iris focus:outline-none',
            suffixe && 'pr-14',
            className,
          )}
          {...reste}
        />
        {suffixe && (
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-ink-faint">
            {suffixe}
          </span>
        )}
      </div>
      {aide && <p className="mt-1.5 text-sm text-ink-soft">{aide}</p>}
    </div>
  )
}

export function ChoixListe<T extends string>({
  label,
  valeur,
  options,
  onChange,
}: {
  label: string
  valeur: T
  options: { valeur: T; libelle: string }[]
  onChange: (v: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-ink">{label}</legend>
      <div className="space-y-2">
        {options.map((option) => {
          const actif = option.valeur === valeur
          return (
            <label
              key={option.valeur}
              className={classes(
                'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition',
                actif
                  ? 'border-iris bg-iris-wash text-ink'
                  : 'border-line bg-surface text-ink-soft hover:bg-sunken',
              )}
            >
              <input
                type="radio"
                name={label}
                checked={actif}
                onChange={() => onChange(option.valeur)}
                className="sr-only"
              />
              <span
                className={classes(
                  'grid size-5 shrink-0 place-items-center rounded-full border-2',
                  actif ? 'border-iris' : 'border-line',
                )}
              >
                {actif && <span className="size-2.5 rounded-full bg-iris" />}
              </span>
              <span className="text-sm font-medium">{option.libelle}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Bascule({
  label,
  aide,
  actif,
  onChange,
}: {
  label: string
  aide?: string
  actif: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        {aide && <span className="mt-0.5 block text-sm text-ink-soft">{aide}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={label}
        onClick={() => onChange(!actif)}
        className={classes(
          'relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition',
          actif ? 'bg-iris' : 'bg-line',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={classes(
            'absolute top-1 size-5 rounded-full bg-white shadow-sm',
            actif ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </label>
  )
}

/* ──────────────────────────── Panneau glissant ──────────────────────────── */

export function Feuille({
  ouvert,
  titre,
  onFermer,
  children,
}: {
  ouvert: boolean
  titre: string
  onFermer: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!ouvert) return
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', surEchap)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', surEchap)
      document.body.style.overflow = ''
    }
  }, [ouvert, onFermer])

  return (
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFermer}
            className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titre}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={classes(
              'relative max-h-[88svh] w-full overflow-y-auto bg-surface',
              'rounded-t-[2rem] sm:max-w-lg sm:rounded-[2rem]',
              'safe-bottom shadow-lift',
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
              <h2 className="text-lg font-semibold text-ink">{titre}</h2>
              <button
                type="button"
                onClick={onFermer}
                aria-label="Fermer"
                className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-sunken hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ─────────────────────────────── États vides ────────────────────────────── */

export function EtatVide({
  emoji,
  titre,
  children,
  action,
}: {
  emoji: string
  titre: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="mb-3 text-4xl" aria-hidden="true">
        {emoji}
      </p>
      <h3 className="mb-1.5 text-lg font-semibold text-ink">{titre}</h3>
      <p className="mx-auto max-w-xs text-sm text-ink-soft">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Chargement({ libelle = 'Chargement' }: { libelle?: string }) {
  return (
    <div className="grid min-h-svh place-items-center bg-ground">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          className="mx-auto mb-4 size-9 rounded-full border-[3px] border-line border-t-iris"
        />
        <p className="text-sm text-ink-soft">{libelle}…</p>
      </div>
    </div>
  )
}
