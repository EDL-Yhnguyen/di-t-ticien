import { useState } from 'react'
import { Check, Clock, ShoppingBasket } from 'lucide-react'
import { Carte, EtatVide, Etiquette, Feuille, TitreSection } from '../components/ui'
import {
  PLACARD,
  RAYONS,
  RECETTES,
  listeDeCourses,
  recetteParId,
  type Recette,
} from '../lib/recettes'
import { TEINTE_MOMENT } from '../lib/plan'
import { classes } from '../lib/utils'

const MOMENTS = [
  { cle: 'petit-dejeuner', libelle: 'Petit déjeuner' },
  { cle: 'dejeuner', libelle: 'Déjeuner' },
  { cle: 'diner', libelle: 'Dîner' },
] as const

export function Cuisine() {
  const [onglet, setOnglet] = useState<'recettes' | 'courses'>('recettes')
  const [ouverte, setOuverte] = useState<Recette | null>(null)
  const [panier, setPanier] = useState<string[]>([])

  function basculerPanier(id: string) {
    setPanier((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink">Cuisine</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Des recettes construites sur votre plan, et la liste qui va avec.
        </p>
      </header>

      <div className="flex gap-1 rounded-full bg-sunken p-1" role="tablist">
        {(
          [
            { cle: 'recettes' as const, libelle: 'Recettes' },
            { cle: 'courses' as const, libelle: `Courses${panier.length ? ` (${panier.length})` : ''}` },
          ]
        ).map((item) => (
          <button
            key={item.cle}
            type="button"
            role="tab"
            aria-selected={onglet === item.cle}
            onClick={() => setOnglet(item.cle)}
            className={classes(
              'flex-1 rounded-full py-2.5 text-sm font-semibold transition',
              onglet === item.cle ? 'bg-surface text-ink shadow-soft' : 'text-ink-soft',
            )}
          >
            {item.libelle}
          </button>
        ))}
      </div>

      {onglet === 'recettes' ? (
        <div className="space-y-6">
          {MOMENTS.map(({ cle, libelle }) => {
            const recettes = RECETTES.filter((r) => r.moment === cle)
            if (recettes.length === 0) return null
            return (
              <section key={cle}>
                <TitreSection eyebrow={`${recettes.length} recette${recettes.length > 1 ? 's' : ''}`}>
                  {libelle}
                </TitreSection>
                <ul className="space-y-2">
                  {recettes.map((recette) => {
                    const teinte = TEINTE_MOMENT[recette.moment]
                    return (
                      <li key={recette.id}>
                        <Carte className="flex items-stretch gap-3 overflow-hidden">
                          <span
                            aria-hidden="true"
                            className={classes('w-1.5 shrink-0', teinte.barre)}
                          />
                          <button
                            type="button"
                            onClick={() => setOuverte(recette)}
                            className="min-w-0 flex-1 py-4 text-left"
                          >
                            <span className="block font-semibold text-ink">{recette.titre}</span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span
                                className={classes(
                                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                                  teinte.fond,
                                  teinte.texte,
                                )}
                              >
                                <Clock size={12} aria-hidden="true" />
                                {recette.minutes} min
                              </span>
                              <span className="text-xs font-semibold text-ink-soft tnum">
                                {recette.kcal} kcal
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => basculerPanier(recette.id)}
                            aria-pressed={panier.includes(recette.id)}
                            aria-label={
                              panier.includes(recette.id)
                                ? `Retirer ${recette.titre} de la liste de courses`
                                : `Ajouter ${recette.titre} à la liste de courses`
                            }
                            className={classes(
                              'my-4 mr-4 grid size-10 shrink-0 place-items-center rounded-full border-2 transition',
                              panier.includes(recette.id)
                                ? 'border-basil bg-basil text-white'
                                : 'border-line text-ink-faint hover:border-iris hover:text-iris',
                            )}
                          >
                            {panier.includes(recette.id) ? (
                              <Check size={18} strokeWidth={3} aria-hidden="true" />
                            ) : (
                              <ShoppingBasket size={17} aria-hidden="true" />
                            )}
                          </button>
                        </Carte>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      ) : (
        <ListeCourses panier={panier} />
      )}

      <Feuille ouvert={ouverte !== null} titre={ouverte?.titre ?? ''} onFermer={() => setOuverte(null)}>
        {ouverte && <DetailRecette recette={ouverte} />}
      </Feuille>
    </div>
  )
}

function DetailRecette({ recette }: { recette: Recette }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Etiquette ton="neutre">{recette.minutes} min</Etiquette>
        <Etiquette ton="neutre">{recette.kcal} kcal</Etiquette>
        {recette.couvre.map((c) => (
          <Etiquette key={c} ton="basil">
            {c}
          </Etiquette>
        ))}
      </div>

      <section>
        <h3 className="mb-2 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
          Ingrédients
        </h3>
        <ul className="divide-y divide-line">
          {recette.ingredients.map((i) => (
            <li key={i.nom} className="flex justify-between gap-4 py-2.5 text-sm">
              <span className="text-ink">{i.nom}</span>
              <span className="shrink-0 font-semibold text-ink-soft">{i.quantite}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
          Préparation
        </h3>
        <ol className="space-y-3">
          {recette.etapes.map((etape, i) => (
            <li key={etape} className="flex gap-3 text-sm text-ink">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-iris-wash text-xs font-bold text-iris tnum">
                {i + 1}
              </span>
              <span className="pt-0.5">{etape}</span>
            </li>
          ))}
        </ol>
      </section>

      {recette.astuce && (
        <p className="rounded-tile bg-apricot-wash px-4 py-3.5 text-sm text-ink">
          <strong className="font-semibold text-apricot">Le truc en plus — </strong>
          {recette.astuce}
        </p>
      )}
    </div>
  )
}

function ListeCourses({ panier }: { panier: string[] }) {
  const [pris, setPris] = useState<string[]>([])
  const groupes = listeDeCourses(panier)

  function basculer(nom: string) {
    setPris((p) => (p.includes(nom) ? p.filter((x) => x !== nom) : [...p, nom]))
  }

  return (
    <div className="space-y-6">
      {panier.length === 0 ? (
        <Carte>
          <EtatVide emoji="🧺" titre="Votre liste est vide">
            Ajoutez des recettes depuis l’onglet Recettes : leurs ingrédients viendront se ranger
            ici par rayon.
          </EtatVide>
        </Carte>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            {panier.length} recette{panier.length > 1 ? 's' : ''} —{' '}
            {panier.map((id) => recetteParId(id)?.titre).filter(Boolean).join(', ')}
          </p>

          {RAYONS.map((rayon) => {
            const items = groupes[rayon]
            if (items.length === 0) return null
            return (
              <section key={rayon}>
                <TitreSection>{rayon}</TitreSection>
                <Carte className="divide-y divide-line">
                  {items.map((item) => (
                    <LigneCourse
                      key={item.nom}
                      nom={item.nom}
                      quantite={item.quantite}
                      coche={pris.includes(item.nom)}
                      onBasculer={() => basculer(item.nom)}
                    />
                  ))}
                </Carte>
              </section>
            )
          })}
        </>
      )}

      <section>
        <TitreSection eyebrow="À avoir toujours">Le placard du plan</TitreSection>
        <Carte className="divide-y divide-line">
          {PLACARD.map((item) => (
            <LigneCourse
              key={item.nom}
              nom={item.nom}
              quantite={item.quantite}
              coche={pris.includes(item.nom)}
              onBasculer={() => basculer(item.nom)}
            />
          ))}
        </Carte>
      </section>
    </div>
  )
}

function LigneCourse({
  nom,
  quantite,
  coche,
  onBasculer,
}: {
  nom: string
  quantite: string
  coche: boolean
  onBasculer: () => void
}) {
  return (
    <button
      type="button"
      onClick={onBasculer}
      aria-pressed={coche}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-sunken"
    >
      <span
        className={classes(
          'grid size-6 shrink-0 place-items-center rounded-lg border-2 transition',
          coche ? 'border-basil bg-basil text-white' : 'border-line',
        )}
      >
        {coche && <Check size={14} strokeWidth={3.5} aria-hidden="true" />}
      </span>
      <span
        className={classes(
          'min-w-0 flex-1 text-sm',
          coche ? 'text-ink-faint line-through' : 'text-ink',
        )}
      >
        {nom}
      </span>
      <span className="shrink-0 text-xs font-semibold text-ink-faint">{quantite}</span>
    </button>
  )
}
