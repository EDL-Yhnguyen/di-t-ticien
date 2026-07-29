import { useMemo } from 'react'
import { apportDe } from '../lib/journal'
import { LIBELLE_NUTRI } from '../lib/nutriscore'
import type { EntreeJournal, NutriScore } from '../lib/types'
import { classes, entier } from '../lib/utils'

/**
 * La mosaïque du jour.
 *
 * Une tuile par aliment mangé : sa **surface** est ce qu'il pèse en calories,
 * sa **couleur** est son Nutri-Score. Deux variables, deux encodages, aucune
 * légende à mémoriser — et le top comme le flop de la journée se lisent sans
 * qu'on ait besoin de les calculer : la grande tuile rouge saute aux yeux.
 *
 * C'est un treemap, posé par l'algorithme « squarified » de Bruls, Huizing et
 * van Wijk : il cherche des rectangles les plus carrés possible, parce qu'une
 * tuile très allongée se compare mal à l'œil et n'accueille aucun texte.
 */

export interface Pave {
  x: number
  y: number
  l: number
  h: number
}

export function paver(valeurs: number[], largeur: number, hauteur: number): (Pave | null)[] {
  const total = valeurs.reduce((s, v) => s + Math.max(0, v), 0)
  const resultat: (Pave | null)[] = valeurs.map(() => null)
  if (total <= 0 || largeur <= 0 || hauteur <= 0) return resultat

  const aires = valeurs.map((v) => (Math.max(0, v) / total) * largeur * hauteur)
  // Les plus grandes d'abord : c'est ce qui donne à l'algorithme sa régularité.
  const ordre = valeurs
    .map((_, i) => i)
    .filter((i) => aires[i] > 0)
    .sort((a, b) => aires[b] - aires[a])

  let x = 0
  let y = 0
  let l = largeur
  let h = hauteur

  /** Le pire rapport d'aspect d'une rangée : c'est ce qu'on cherche à minimiser. */
  const pire = (rangee: number[], cote: number): number => {
    if (rangee.length === 0) return Number.POSITIVE_INFINITY
    const somme = rangee.reduce((t, i) => t + aires[i], 0)
    const max = Math.max(...rangee.map((i) => aires[i]))
    const min = Math.min(...rangee.map((i) => aires[i]))
    return Math.max((cote * cote * max) / (somme * somme), (somme * somme) / (cote * cote * min))
  }

  const poser = (rangee: number[]) => {
    const somme = rangee.reduce((t, i) => t + aires[i], 0)
    if (somme <= 0) return

    if (l >= h) {
      const largeurRangee = somme / h
      let curseur = y
      for (const i of rangee) {
        const hauteurPave = aires[i] / largeurRangee
        resultat[i] = { x, y: curseur, l: largeurRangee, h: hauteurPave }
        curseur += hauteurPave
      }
      x += largeurRangee
      l -= largeurRangee
    } else {
      const hauteurRangee = somme / l
      let curseur = x
      for (const i of rangee) {
        const largeurPave = aires[i] / hauteurRangee
        resultat[i] = { x: curseur, y, l: largeurPave, h: hauteurRangee }
        curseur += largeurPave
      }
      y += hauteurRangee
      h -= hauteurRangee
    }
  }

  let rangee: number[] = []
  let curseur = 0

  while (curseur < ordre.length) {
    const cote = Math.min(l, h)
    const candidate = [...rangee, ordre[curseur]]
    if (rangee.length === 0 || pire(candidate, cote) <= pire(rangee, cote)) {
      rangee = candidate
      curseur++
    } else {
      poser(rangee)
      rangee = []
    }
  }
  if (rangee.length > 0) poser(rangee)

  return resultat
}

/* ───────────────────────────── Rendu ───────────────────────────── */

const FOND_NUTRI: Record<NutriScore, string> = {
  A: 'bg-nutri-a text-nutri-a-encre',
  B: 'bg-nutri-b text-nutri-b-encre',
  C: 'bg-nutri-c text-nutri-c-encre',
  D: 'bg-nutri-d text-nutri-d-encre',
  E: 'bg-nutri-e text-nutri-e-encre',
}

/** Un aliment sans note connue ne prend pas de couleur de l'échelle. */
const FOND_INCONNU = 'bg-sunken text-ink-soft'

export function couleurNutri(note: NutriScore | undefined): string {
  return note ? FOND_NUTRI[note] : FOND_INCONNU
}

export function Mosaique({
  entrees,
  onChoisir,
  className,
}: {
  entrees: EntreeJournal[]
  onChoisir?: (entree: EntreeJournal) => void
  className?: string
}) {
  const tuiles = useMemo(() => {
    const avecKcal = entrees
      .map((entree) => ({ entree, kcal: apportDe(entree).kcal }))
      .filter((t) => t.kcal > 0)
    const paves = paver(
      avecKcal.map((t) => t.kcal),
      100,
      100,
    )
    return avecKcal
      .map((t, i) => ({ ...t, pave: paves[i] }))
      .filter((t): t is { entree: EntreeJournal; kcal: number; pave: Pave } => t.pave !== null)
  }, [entrees])

  if (tuiles.length === 0) return null

  return (
    <div
      className={classes('relative w-full', className)}
      style={{ aspectRatio: '4 / 3' }}
      role="list"
      aria-label="Les aliments de la journée, du plus au moins calorique"
    >
      {tuiles.map(({ entree, kcal, pave }, rang) => {
        const note = entree.aliment.nutriScore
        // Trois paliers, parce qu'un nom tronqué est pire qu'un nom absent :
        // la tuile large porte tout, la moyenne garde ses calories — la seule
        // donnée encore lisible sur deux lignes — et la petite se réduit à sa
        // lettre. Dans tous les cas le nom reste dans l'étiquette accessible
        // et dans l'infobulle.
        const large = pave.l >= 22 && pave.h >= 17
        const moyenne = !large && pave.l >= 11 && pave.h >= 13

        const description = [
          entree.aliment.nom,
          `${entier(kcal)} kilocalories`,
          note ? `Nutri-Score ${note}, ${LIBELLE_NUTRI[note].toLowerCase()}` : 'Nutri-Score inconnu',
        ].join(', ')

        const apparence = classes(
          'animate-poser flex size-full flex-col justify-between overflow-hidden rounded-tile p-2 text-left',
          couleurNutri(note),
        )
        const delai = { animationDelay: `${Math.min(rang, 12) * 45}ms` }

        const contenu = (
          <>
            {large && (
              <span className="line-clamp-2 text-[0.8125rem] leading-tight font-semibold">
                {entree.aliment.nom}
              </span>
            )}
            <span
              className={classes(
                'flex gap-1',
                large
                  ? 'items-baseline justify-between'
                  : 'size-full flex-col items-center justify-center',
              )}
            >
              <span
                aria-hidden="true"
                className={classes('font-display font-bold', large ? 'text-lg' : 'text-base')}
              >
                {note ?? '?'}
              </span>
              {(large || moyenne) && (
                <span
                  className={classes(
                    'font-semibold opacity-90 tnum',
                    large ? 'text-xs' : 'text-[0.625rem] leading-none',
                  )}
                >
                  {entier(kcal)}
                  {large && ' kcal'}
                </span>
              )}
            </span>
          </>
        )

        return (
          <div
            key={entree.id}
            role="listitem"
            className="absolute p-[2px]"
            style={{
              left: `${pave.x}%`,
              top: `${pave.y}%`,
              width: `${pave.l}%`,
              height: `${pave.h}%`,
            }}
          >
            {onChoisir ? (
              <button
                type="button"
                onClick={() => onChoisir(entree)}
                aria-label={`${description}. Ouvrir le détail.`}
                className={classes(
                  apparence,
                  'cursor-pointer transition-[filter,transform] duration-200',
                  'hover:brightness-110 active:scale-[0.97]',
                )}
                style={delai}
              >
                {contenu}
              </button>
            ) : (
              <div aria-label={description} className={apparence} style={delai}>
                {contenu}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** La clé de lecture. Sans elle, la mosaïque n'est qu'un joli motif. */
export function LegendeMosaique() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="block size-3 rounded-[3px] border border-line bg-ink-faint/40"
        />
        surface = calories
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="flex gap-px">
          {(['A', 'B', 'C', 'D', 'E'] as NutriScore[]).map((note) => (
            <span key={note} className={classes('block size-3', FOND_NUTRI[note])} />
          ))}
        </span>
        couleur = Nutri-Score
      </span>
    </div>
  )
}
