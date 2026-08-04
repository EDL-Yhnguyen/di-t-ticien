import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { classes } from '../lib/utils'

/* ──────────────────────────────── Marque ────────────────────────────────── */

/**
 * La marmite du logo. Elle reprend exactement les tracés de `public/icone.svg` :
 * le sigle affiché dans l'application et l'icône installée sur l'écran d'accueil
 * doivent être la même image, sinon l'application ouverte n'a plus l'air d'être
 * celle qu'on a installée.
 *
 * Les couleurs sont écrites en dur plutôt que prises aux jetons : c'est un
 * logo, il ne change pas avec le thème.
 */
export function Marque({ taille = 36, className }: { taille?: number; className?: string }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={classes('shrink-0 rounded-xl', className)}
    >
      <rect width="512" height="512" rx="112" fill="#FDF6EE" />
      <path
        d="M186 232 C150 232 132 206 142 180 C120 168 124 140 148 134 C150 110 180 100 196 118 C216 104 240 118 238 140 C256 152 254 182 232 188 C232 218 210 232 186 232 Z"
        fill="#4C8A4C"
      />
      <circle cx="262" cy="186" r="46" fill="#E85C46" />
      <path d="M262 146 l-24 -14 l10 22 l-26 -4 l18 18 Z" fill="#4C8A4C" />
      <path d="M356 132 C376 148 380 186 366 236 L322 226 C328 176 338 144 356 132 Z" fill="#F58A32" />
      <g stroke="#4C8A4C" strokeWidth="15" fill="none" strokeLinecap="round">
        <path d="M356 132 L344 96" />
        <path d="M356 132 L378 104" />
      </g>
      <g stroke="#F67A5E" strokeWidth="26" fill="none" strokeLinecap="round">
        <path d="M126 288 C92 288 92 340 126 340" />
        <path d="M386 288 C420 288 420 340 386 340" />
      </g>
      <path
        d="M118 246 h276 v104 c0 42 -34 76 -76 76 h-124 c-42 0 -76 -34 -76 -76 Z"
        fill="#F67A5E"
      />
      <g fill="none" stroke="#24303C" strokeWidth="18" strokeLinecap="round">
        <path d="M196 306 q18 -20 36 0" />
        <path d="M212 342 q44 44 88 0" />
      </g>
      <circle cx="298" cy="310" r="13" fill="#24303C" />
    </svg>
  )
}

/**
 * Le mot « mamakilo », avec un cœur à la place du point du i — la signature
 * de marque, utilisée à côté de `Marque` sur les écrans qui présentent le nom
 * en toutes lettres (accueil, connexion, mot de passe oublié).
 *
 * Le "i" n'est pas la lettre de la police : c'est une haste dessinée à la
 * main, en unités `em`, pour ne pas dépendre de la position du point réel
 * dans Fredoka d'une taille à l'autre. `mamak` et `lo` restent du texte, pour
 * que la casse et l'espacement suivent la police environnante normalement.
 *
 * Accessible aux lecteurs d'écran via `aria-label` : le contenu visuel (SVG +
 * texte séparé) est caché par `aria-hidden="true"`, et le mot entier est
 * annoncé par l'étiquette.
 */
export function SignatureMarque({ className }: { className?: string }) {
  return (
    <span className={classes('font-display font-semibold text-ink', className)} role="img" aria-label="mamakilo">
      <span aria-hidden="true">
        mamak
        <svg
          viewBox="0 0 32 100"
          style={{ width: '0.32em', height: '1em' }}
          className="mx-[0.02em] inline-block align-baseline"
        >
          {/* La haste du i */}
          <rect x="9" y="34" width="14" height="58" rx="7" fill="currentColor" />
          {/* Le cœur, à la place du point */}
          <path
            d="M16,30 C6,22 2,15 2,9 C2,3 7,0 12,3 C14,4.5 15.3,6.5 16,9 C16.7,6.5 18,4.5 20,3 C25,0 30,3 30,9 C30,15 26,22 16,30 Z"
            fill="var(--alerte)"
          />
        </svg>
        lo
      </span>
    </span>
  )
}

/* ─────────────────────────────── Boutons ────────────────────────────────── */

type Ton = 'primaire' | 'accent' | 'doux' | 'fantome' | 'alerte'

/**
 * Les trois tons pleins portent un dégradé et un halo de leur propre couleur
 * plutôt qu'un aplat et une ombre grise : c'est ce qui fait qu'un bouton a l'air
 * d'éclairer la page. Le halo est recalculé par thème (`--shadow-halo` dans
 * index.css), il n'y a donc rien à redéfinir à la main pour chaque bouton.
 *
 * `active:scale-[0.97]` remplace le changement de luminosité : sur un dégradé,
 * un `brightness` écrase les deux extrémités et le volume disparaît au moment
 * précis où l'on appuie.
 */
const TON: Record<Ton, string> = {
  primaire: 'plein-primaire text-white shadow-halo hover:brightness-105 active:scale-[0.97]',
  accent: 'plein-accent text-white shadow-halo hover:brightness-105 active:scale-[0.97]',
  doux: 'bg-surface text-ink border border-line-fort shadow-soft hover:bg-sunken active:scale-[0.98]',
  fantome: 'text-ink-soft hover:bg-sunken hover:text-ink',
  alerte: 'plein-alerte text-white shadow-halo hover:brightness-105 active:scale-[0.97]',
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
        'font-semibold transition duration-150 disabled:cursor-not-allowed',
        'disabled:opacity-45 disabled:shadow-none',
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

type TonSurface = 'primaire' | 'accent' | 'reussite' | 'alerte'

/**
 * Le lavis d'une carte teintée est un dégradé qui s'éclaircit vers la surface :
 * une carte lavée uniformément paraît plate, celle qui s'éclaircit vers le bas
 * paraît éclairée. Le liséré prend la couleur du rôle à faible opacité, sinon la
 * carte teintée n'a plus de bord du tout sur un fond de même famille.
 */
const LAVIS: Record<TonSurface, string> = {
  primaire: 'lavis-primaire border-primaire/25',
  accent: 'lavis-accent border-accent/25',
  reussite: 'lavis-reussite border-reussite/25',
  alerte: 'lavis-alerte border-alerte/25',
}

export function Carte({
  ton,
  className,
  children,
  ...reste
}: React.HTMLAttributes<HTMLDivElement> & { ton?: TonSurface }) {
  return (
    <div
      className={classes(
        'rounded-card border shadow-soft',
        ton ? LAVIS[ton] : 'border-line bg-surface',
        className,
      )}
      {...reste}
    >
      {children}
    </div>
  )
}

/**
 * Un aplat saturé qui porte un chiffre, pour les grilles de statistiques. Il
 * existe parce qu'une carte blanche avec un chiffre coloré se lit comme une
 * ligne de tableau ; le même chiffre en blanc sur la couleur se lit comme une
 * réponse. `--accent-vif` est le seul aplat qui demande une encre sombre : c'est
 * le jeton pensé pour ça, jaune ou cyan y compris.
 */
export function Tuile({
  ton = 'primaire',
  intitule,
  valeur,
  unite,
  detail,
  className,
}: {
  ton?: TonSurface | 'vif'
  intitule: string
  valeur: ReactNode
  unite?: string
  detail?: string
  className?: string
}) {
  const fond =
    ton === 'vif'
      ? 'bg-accent-vif text-accent-vif-encre'
      : `${
          { primaire: 'plein-primaire', accent: 'plein-accent', reussite: 'plein-reussite', alerte: 'plein-alerte' }[
            ton
          ]
        } text-white`

  return (
    <div className={classes('rounded-tile px-4 py-3.5 shadow-soft', fond, className)}>
      <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase opacity-85">
        {intitule}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-2xl font-semibold tnum">{valeur}</span>
        {unite && <span className="text-sm font-medium opacity-85">{unite}</span>}
      </p>
      {detail && <p className="mt-0.5 text-xs opacity-85">{detail}</p>}
    </div>
  )
}

/**
 * Le surtitre porte un trait de couleur plutôt que d'être un simple gris : c'est
 * lui qui rattache une section au thème, et sans lui les titres d'un écran
 * n'avaient aucune couleur du tout.
 */
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
    <div className="mb-3.5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primaire uppercase">
            <span className="h-3 w-1 shrink-0 rounded-full bg-primaire" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-[1.375rem] font-semibold text-ink">{children}</h2>
      </div>
      {action}
    </div>
  )
}

export function Etiquette({
  ton = 'primaire',
  children,
}: {
  ton?: TonSurface | 'neutre'
  children: ReactNode
}) {
  const styles = {
    primaire: 'bg-primaire-wash text-primaire ring-primaire/20',
    accent: 'bg-accent-wash text-accent ring-accent/20',
    reussite: 'bg-reussite-wash text-reussite ring-reussite/20',
    alerte: 'bg-alerte-wash text-alerte ring-alerte/20',
    neutre: 'bg-sunken text-ink-soft ring-line',
  }[ton]
  return (
    <span
      className={classes(
        'inline-flex items-center rounded-full px-2.5 py-1 ring-1 ring-inset',
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
            // `line-fort` et non `line` : le bord d'un champ de saisie est un
            // élément d'interface, que la règle 1.4.11 tient à 3:1. Le trait
            // discret des séparations ne tenait que 1,3:1 — un champ dont on ne
            // voit pas le contour.
            'w-full rounded-2xl border-2 border-line-fort bg-surface px-4 py-3',
            'text-ink transition placeholder:text-ink-faint',
            'focus:border-primaire focus:outline-none',
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
                'flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition',
                actif
                  ? 'lavis-primaire border-primaire text-ink shadow-soft'
                  : 'border-line-fort bg-surface text-ink-soft hover:bg-sunken',
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
                  actif ? 'border-primaire' : 'border-line-fort',
                )}
              >
                {actif && <span className="size-2.5 rounded-full bg-primaire" />}
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
          // Éteinte, la bascule est un contrôle : son fond doit se distinguer de
          // la surface à 3:1, ce que le trait des séparations ne fait pas.
          actif ? 'plein-primaire shadow-halo' : 'bg-line-fort',
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
      <p
        className="lavis-primaire mx-auto mb-4 grid size-16 place-items-center rounded-full text-3xl ring-1 ring-primaire/20 ring-inset"
        aria-hidden="true"
      >
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
          className="mx-auto mb-4 size-9 rounded-full border-[3px] border-line border-t-primaire"
        />
        <p className="text-sm text-ink-soft">{libelle}…</p>
      </div>
    </div>
  )
}
