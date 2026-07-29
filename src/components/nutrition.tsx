import type { ReactNode } from 'react'
import { LIBELLE_NUTRI } from '../lib/nutriscore'
import type { Bande } from '../lib/nutriscore'
import { LIBELLE_BANDE } from '../lib/nutriscore'
import type { BilanRepas } from '../lib/journal'
import type { NutriScore } from '../lib/types'
import { LIBELLE_MOMENT } from '../lib/types'
import { classes, entier } from '../lib/utils'

/* ──────────────────────────── Pastille Nutri-Score ──────────────────────────── */

const TEINTE: Record<NutriScore, string> = {
  A: 'bg-nutri-a text-nutri-a-encre',
  B: 'bg-nutri-b text-nutri-b-encre',
  C: 'bg-nutri-c text-nutri-c-encre',
  D: 'bg-nutri-d text-nutri-d-encre',
  E: 'bg-nutri-e text-nutri-e-encre',
}

const TAILLE = {
  s: 'size-6 text-xs',
  m: 'size-8 text-base',
  l: 'size-11 text-xl',
}

/**
 * La note d'un aliment.
 *
 * La lettre seule ne dit rien à qui ne connaît pas l'échelle, et la couleur
 * seule ne dit rien à qui ne la distingue pas : l'étiquette accessible porte
 * donc toujours la phrase entière, et `estime` prévient quand la note vient de
 * notre calcul plutôt que de l'emballage.
 */
export function PastilleNutri({
  note,
  taille = 'm',
  estime,
}: {
  note: NutriScore | undefined
  taille?: keyof typeof TAILLE
  estime?: boolean
}) {
  if (!note) {
    return (
      <span
        aria-label="Nutri-Score inconnu pour cet aliment"
        className={classes(
          'grid shrink-0 place-items-center rounded-lg bg-sunken font-display font-bold text-ink-faint',
          TAILLE[taille],
        )}
      >
        <span aria-hidden="true">?</span>
      </span>
    )
  }

  return (
    <span
      aria-label={`Nutri-Score ${note} — ${LIBELLE_NUTRI[note]}${estime ? ', estimé par Mamakilo' : ''}`}
      className={classes(
        'relative grid shrink-0 place-items-center rounded-lg font-display font-bold',
        TEINTE[note],
        TAILLE[taille],
      )}
    >
      <span aria-hidden="true">{note}</span>
      {estime && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -bottom-0.5 grid size-3 place-items-center rounded-full bg-surface text-[0.5rem] font-bold text-ink-soft"
        >
          ~
        </span>
      )}
    </span>
  )
}

/* ─────────────────────────── Bande de charge ─────────────────────────── */

const TEINTE_BANDE: Record<Bande, string> = {
  vert: 'bg-bande-vert',
  bleu: 'bg-bande-bleu',
  orange: 'bg-bande-orange',
}

/** Le poids calorique d'une recette, dit en un mot et une couleur. */
export function EtiquetteBande({ bande }: { bande: Bande }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
      <span
        aria-hidden="true"
        className={classes('block size-2.5 rounded-full', TEINTE_BANDE[bande])}
      />
      {LIBELLE_BANDE[bande]}
    </span>
  )
}

/* ──────────────────────────── Jauge d'énergie ──────────────────────────── */

/**
 * Ce qui a été mangé aujourd'hui, repas par repas, rapporté à l'objectif.
 *
 * Un segment par repas plutôt qu'une barre pleine : le découpage montre d'où
 * viennent les calories, ce qu'une barre unique ne dit pas. Le dépassement
 * sort dans une teinte distincte au lieu de saturer silencieusement à 100 %,
 * parce qu'un objectif dépassé est une information, pas un échec à cacher.
 */
export function JaugeEnergie({
  bilans,
  objectifKcal,
  surBandeau,
}: {
  bilans: BilanRepas[]
  objectifKcal: number
  /** Vrai quand la jauge est posée sur le bandeau coloré, pas sur une carte. */
  surBandeau?: boolean
}) {
  const total = bilans.reduce((s, b) => s + b.apport.kcal, 0)
  const echelle = Math.max(objectifKcal, total)
  const pourcent = objectifKcal > 0 ? Math.round((total / objectifKcal) * 100) : 0
  const depassement = Math.max(0, total - objectifKcal)

  const remplis = bilans.filter((b) => b.apport.kcal > 0)

  return (
    <div>
      <div
        role="meter"
        aria-valuenow={Math.round(total)}
        aria-valuemin={0}
        aria-valuemax={objectifKcal}
        aria-label={`${entier(total)} kilocalories sur un objectif de ${entier(objectifKcal)}`}
        className={classes(
          'flex h-2.5 gap-[3px] overflow-hidden rounded-full',
          surBandeau ? 'bg-white/25' : 'bg-sunken',
        )}
      >
        {remplis.map((bilan) => {
          const part = (bilan.apport.kcal / echelle) * 100
          const enTrop = depassement > 0 && bilan === remplis.at(-1)
          return (
            <span
              key={bilan.moment}
              title={`${LIBELLE_MOMENT[bilan.moment]} — ${entier(bilan.apport.kcal)} kcal`}
              style={{ width: `${part}%` }}
              className={classes(
                'block h-full rounded-full transition-[width] duration-500',
                enTrop ? 'bg-berry' : surBandeau ? 'bg-white' : 'bg-corail',
              )}
            />
          )
        })}
      </div>

      <p
        className={classes(
          'mt-2 flex items-baseline justify-between gap-3 text-sm',
          surBandeau ? 'text-white/80' : 'text-ink-soft',
        )}
      >
        <span>
          {remplis.length === 0
            ? 'Aucun repas noté'
            : `${remplis.length} repas noté${remplis.length > 1 ? 's' : ''}`}
        </span>
        <span className={classes('font-semibold tnum', surBandeau ? 'text-white' : 'text-ink')}>
          {pourcent} %
        </span>
      </p>
    </div>
  )
}

/* ──────────────────────────── Barres de macros ──────────────────────────── */

export function BarreMacro({
  libelle,
  valeur,
  cible,
  teinte,
}: {
  libelle: string
  valeur: number
  cible: number
  teinte: string
}) {
  const part = cible > 0 ? Math.min(100, (valeur / cible) * 100) : 0
  return (
    <div>
      <p className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-ink">{libelle}</span>
        <span className="text-ink-soft tnum">
          {Math.round(valeur)} / {cible} g
        </span>
      </p>
      <div
        role="meter"
        aria-valuenow={Math.round(valeur)}
        aria-valuemin={0}
        aria-valuemax={cible}
        aria-label={`${libelle} : ${Math.round(valeur)} grammes sur ${cible}`}
        className="h-1.5 overflow-hidden rounded-full bg-sunken"
      >
        <span
          className={classes('block h-full rounded-full transition-[width] duration-500', teinte)}
          style={{ width: `${part}%` }}
        />
      </div>
    </div>
  )
}

/* ──────────────────────────── Top / flop ──────────────────────────── */

export function LigneTopFlop({
  icone,
  intitule,
  children,
}: {
  icone: ReactNode
  intitule: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sunken text-ink-soft">
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold tracking-[0.1em] text-ink-faint uppercase">
          {intitule}
        </span>
        <span className="block truncate text-sm font-semibold text-ink">{children}</span>
      </span>
    </div>
  )
}
