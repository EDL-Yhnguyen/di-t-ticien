import { useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronRight, Clock, Refrigerator, ShoppingBasket } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { EtiquetteBande } from '../components/nutrition'
import { Carte, EtatVide, Etiquette, Feuille, TitreSection } from '../components/ui'
import {
  LIBELLE_TAG,
  PLACARD,
  RAYONS,
  RECETTES,
  listeDeCourses,
  recetteParId,
  recettesDuMoment,
  type Recette,
  type Tag,
} from '../lib/recettes'
import { cibleDuRepas } from '../lib/journal'
import { LIBELLE_BANDE, bandePour } from '../lib/nutriscore'
import type { Bande } from '../lib/nutriscore'
import { objectifCalorique } from '../lib/nutrition'
import { LIBELLE_CATEGORIE, TEINTE_MOMENT } from '../lib/plan'
import { Lien } from '../lib/router'
import { poidsLePlusRecent } from '../lib/store'
import { LIBELLE_MOMENT, MOMENTS } from '../lib/types'
import { classes } from '../lib/utils'

const BANDES: Bande[] = ['vert', 'bleu', 'orange']

/**
 * Toutes les étiquettes ne méritent pas un filtre : celles-ci répondent aux
 * questions qu'on se pose vraiment devant le frigo. Les autres restent
 * affichées sur la fiche.
 */
const TAGS_FILTRABLES: Tag[] = ['rapide', 'vegetarien', 'batch', 'nomade']

export function Cuisine() {
  const { etat } = useSession()
  const [onglet, setOnglet] = useState<'recettes' | 'courses'>('recettes')
  const [ouverte, setOuverte] = useState<Recette | null>(null)
  const [panier, setPanier] = useState<string[]>([])
  const [filtre, setFiltre] = useState<Bande | null>(null)
  const [tags, setTags] = useState<Tag[]>([])

  // La bande d'une recette dépend de la personne : 500 kcal est un dîner
  // copieux pour l'une et un dîner juste pour l'autre. On la calcule donc
  // contre l'objectif du profil, jamais contre un barème figé.
  const objectif = objectifCalorique({
    poidsKg: poidsLePlusRecent(etat),
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  })

  const bandes = useMemo(() => {
    const table = new Map<string, Bande>()
    for (const recette of RECETTES) {
      table.set(recette.id, bandePour(recette.kcal, cibleDuRepas(objectif, recette.moment)))
    }
    return table
  }, [objectif])

  function basculerPanier(id: string) {
    setPanier((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  function basculerTag(tag: Tag) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]))
  }

  // Les étiquettes se cumulent : « rapide » et « végétarien » cochés ensemble
  // ne montrent que ce qui est les deux à la fois.
  function retenue(recette: Recette): boolean {
    if (filtre !== null && bandes.get(recette.id) !== filtre) return false
    return tags.every((tag) => recette.tags.includes(tag))
  }

  const aucuneRetenue = !RECETTES.some(retenue)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink">Cuisine</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Des recettes construites sur votre plan, et la liste qui va avec.
        </p>
      </header>

      {/* Choisir plat par plat est le geste de celui qui sait déjà quoi manger.
          Pour les autres, la semaine composée d'avance est la vraie réponse —
          d'où ce raccourci en tête, avant les filtres. */}
      <Lien vers="/app/menus">
        <Carte className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken">
          <CalendarDays size={20} className="shrink-0 text-corail" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Composer ma semaine</span>
            <span className="block text-sm text-ink-soft">
              Sept jours de menus et la liste de courses qui suit
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
        </Carte>
      </Lien>

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
          <fieldset>
            <legend className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
              Charge du repas
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {[null, ...BANDES].map((bande) => {
                const actif = filtre === bande
                return (
                  <button
                    key={bande ?? 'toutes'}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => setFiltre(bande)}
                    className={classes(
                      'rounded-full px-3.5 py-2 text-xs font-semibold transition',
                      actif
                        ? 'bg-corail text-white'
                        : 'bg-surface text-ink-soft hover:bg-sunken hover:text-ink',
                    )}
                  >
                    {bande ? LIBELLE_BANDE[bande] : 'Toutes'}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Calculé sur votre objectif du jour : « léger » tient largement dans le repas,
              « copieux » le dépasse.
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
              Ce qu’il vous faut
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {TAGS_FILTRABLES.map((tag) => {
                const actif = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => basculerTag(tag)}
                    className={classes(
                      'rounded-full px-3.5 py-2 text-xs font-semibold transition',
                      actif
                        ? 'bg-basil text-white'
                        : 'bg-surface text-ink-soft hover:bg-sunken hover:text-ink',
                    )}
                  >
                    {LIBELLE_TAG[tag]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {MOMENTS.map((moment) => {
            const recettes = recettesDuMoment(moment).filter(retenue)
            if (recettes.length === 0) return null
            return (
              <section key={moment}>
                <TitreSection eyebrow={`${recettes.length} recette${recettes.length > 1 ? 's' : ''}`}>
                  {LIBELLE_MOMENT[moment]}
                </TitreSection>
                <ul className="space-y-2">
                  {recettes.map((recette) => {
                    const teinte = TEINTE_MOMENT[recette.moment]
                    const bande = bandes.get(recette.id) ?? 'bleu'
                    return (
                      <li key={recette.id}>
                        <Carte className="flex items-stretch gap-3 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOuverte(recette)}
                            className="min-w-0 flex-1 py-4 pl-4 text-left"
                          >
                            <span className="block font-semibold text-ink">{recette.titre}</span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              <EtiquetteBande bande={bande} />
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
                                : 'border-line text-ink-faint hover:border-corail hover:text-corail',
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

          {aucuneRetenue && (
            <EtatVide
              emoji="🥕"
              titre="Aucune recette ne coche tout"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setFiltre(null)
                    setTags([])
                  }}
                  className="text-sm font-semibold text-corail underline underline-offset-4"
                >
                  Voir toutes les recettes
                </button>
              }
            >
              Le catalogue ne contient rien qui réponde à ces critères pour votre objectif actuel.
              Les bandes se recalculent dès que votre poids ou votre activité changent.
            </EtatVide>
          )}
        </div>
      ) : (
        <ListeCourses panier={panier} />
      )}

      <Feuille ouvert={ouverte !== null} titre={ouverte?.titre ?? ''} onFermer={() => setOuverte(null)}>
        {ouverte && (
          <DetailRecette recette={ouverte} bande={bandes.get(ouverte.id) ?? 'bleu'} />
        )}
      </Feuille>
    </div>
  )
}

function DetailRecette({ recette, bande }: { recette: Recette; bande: Bande }) {
  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 rounded-tile bg-sunken px-3 py-2.5">
        <EtiquetteBande bande={bande} />
        <span className="text-xs text-ink-soft">pour votre objectif du jour</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Etiquette ton="neutre">{recette.minutes} min</Etiquette>
        <Etiquette ton="neutre">{recette.kcal} kcal</Etiquette>
        {recette.couvre.map((c) => (
          <Etiquette key={c} ton="basil">
            {LIBELLE_CATEGORIE[c]}
          </Etiquette>
        ))}
        {recette.tags.map((t) => (
          <Etiquette key={t} ton="corail">
            {LIBELLE_TAG[t]}
          </Etiquette>
        ))}
      </div>

      {recette.conservation && (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Refrigerator size={15} className="shrink-0 text-ink-faint" aria-hidden="true" />
          Se garde {recette.conservation}.
        </p>
      )}

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
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-corail-wash text-xs font-bold text-corail tnum">
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
