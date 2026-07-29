import { useState } from 'react'
import { Check, UtensilsCrossed } from 'lucide-react'
import { Bouton } from './ui'
import { portionDeLaRecette, valeursDeLaRecette } from '../lib/journalRecette'
import type { Recette } from '../lib/recettes'
import { mettreALEchelle } from '../lib/journal'
import { classes, entier } from '../lib/utils'

/** Ce qu'on mange rarement pile : une demi-portion, une, une et demie. */
const PARTS = [
  { facteur: 0.5, libelle: '½' },
  { facteur: 1, libelle: '1' },
  { facteur: 1.5, libelle: '1 ½' },
]

/**
 * Verser une recette au journal, depuis la fiche d'une recette ou depuis un
 * menu de la semaine.
 *
 * Le bloc dit ce qu'il enregistre avant de l'enregistrer, et laisse corriger la
 * portion : c'est la même règle que le scan photo, pour la même raison — ce
 * sont des estimations, et l'écran ne doit pas les faire passer pour des pesées.
 */
export function AuJournal({
  recette,
  onAjouter,
}: {
  recette: Recette
  onAjouter: (quantiteG: number) => void
}) {
  const [facteur, setFacteur] = useState(1)
  const [ajoute, setAjoute] = useState(false)

  const portion = portionDeLaRecette(recette)
  const quantiteG = Math.round(portion * facteur)
  const apport = mettreALEchelle(valeursDeLaRecette(recette), quantiteG)

  return (
    <div className="rounded-card border border-line bg-sunken p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-ink">J’en ai mangé</p>
        <p className="text-sm text-ink-soft tnum">
          {quantiteG} g · {entier(apport.kcal)} kcal
        </p>
      </div>

      <div className="flex gap-1.5" role="group" aria-label="Part mangée">
        {PARTS.map((part) => {
          const actif = part.facteur === facteur
          return (
            <button
              key={part.facteur}
              type="button"
              aria-pressed={actif}
              onClick={() => {
                setFacteur(part.facteur)
                setAjoute(false)
              }}
              className={classes(
                'flex-1 rounded-full py-2 text-sm font-semibold transition tnum',
                actif ? 'bg-corail text-white' : 'bg-surface text-ink-soft hover:text-ink',
              )}
            >
              {part.libelle} portion
            </button>
          )
        })}
      </div>

      <Bouton
        pleineLargeur
        className="mt-3"
        ton={ajoute ? 'doux' : 'primaire'}
        disabled={ajoute}
        onClick={() => {
          onAjouter(quantiteG)
          setAjoute(true)
        }}
      >
        {ajoute ? (
          <>
            <Check size={17} aria-hidden="true" />
            Ajouté au journal
          </>
        ) : (
          <>
            <UtensilsCrossed size={17} aria-hidden="true" />
            Ajouter à mon journal
          </>
        )}
      </Bouton>

      <p className="mt-2.5 text-xs text-ink-faint">
        Les protéines, glucides et lipides d’une recette sont estimés d’après ce qu’elle couvre dans
        l’assiette — pas pesés. Corrigez la quantité depuis le journal si besoin.
      </p>
    </div>
  )
}
