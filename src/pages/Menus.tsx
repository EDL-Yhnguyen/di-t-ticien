import { useMemo, useState } from 'react'
import { CalendarDays, Check, RefreshCw, ShoppingBasket, Sparkles } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, Etiquette, EtatVide, Feuille, TitreSection } from '../components/ui'
import { cibleDuRepas } from '../lib/journal'
import {
  alternativesPour,
  bilanDuPlan,
  coursesDuPlan,
  genererSemaine,
  lundiDeLaSemaine,
  planPerime,
  totalDuJour,
} from '../lib/menu'
import { objectifCalorique } from '../lib/nutrition'
import { LIBELLE_TAG, RAYONS, recetteParId } from '../lib/recettes'
import type { Tag } from '../lib/recettes'
import { Lien } from '../lib/router'
import { poidsLePlusRecent } from '../lib/store'
import type { Moment, PlanSemaine } from '../lib/types'
import { LIBELLE_MOMENT, MOMENTS } from '../lib/types'
import { classes, dateLongue, entier, jourISO } from '../lib/utils'

/** Les filtres qui changent vraiment une semaine ; le catalogue en porte plus. */
const FILTRES: Tag[] = ['vegetarien', 'rapide', 'economique', 'batch']

export function Menus() {
  const { etat, modifier } = useSession()
  const date = jourISO()
  const [reglages, setReglages] = useState(false)
  const [courses, setCourses] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [aRemplacer, setARemplacer] = useState<{ date: string; moment: Moment } | null>(null)

  const objectif = objectifCalorique({
    poidsKg: poidsLePlusRecent(etat),
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  })

  const plan = etat.menus
  const perime = planPerime(plan, date)

  function generer(filtres: Tag[]) {
    const nouveau = genererSemaine({
      debut: lundiDeLaSemaine(date),
      objectifKcal: objectif,
      tags: filtres,
    })
    modifier((brouillon) => {
      brouillon.menus = nouveau
    })
    setReglages(false)
  }

  function remplacer(jour: string, moment: Moment, recetteId: string) {
    modifier((brouillon) => {
      const cible = brouillon.menus?.jours.find((j) => j.date === jour)
      if (cible) cible.repas[moment] = recetteId
    })
    setARemplacer(null)
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-2xl font-semibold text-ink">Mes menus</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Une semaine composée depuis vos recettes, ajustée à votre objectif. Tout se remplace.
        </p>
      </header>

      {!plan ? (
        <Carte className="animate-rise" style={{ animationDelay: '60ms' }}>
          <EtatVide
            emoji="🗓"
            titre="Aucune semaine planifiée"
            action={
              <Bouton onClick={() => setReglages(true)}>
                <Sparkles size={17} aria-hidden="true" />
                Composer ma semaine
              </Bouton>
            }
          >
            L’application répartit les recettes du catalogue sur sept jours en visant vos{' '}
            <strong className="font-semibold text-ink tnum">{entier(objectif)} kcal</strong> par
            jour, sans répéter deux fois le même plat coup sur coup.
          </EtatVide>
        </Carte>
      ) : (
        <>
          <ResumeSemaine
            plan={plan}
            objectif={objectif}
            perime={perime}
            onRegenerer={() => setReglages(true)}
            onCourses={() => setCourses(true)}
          />

          <section className="animate-rise space-y-3" style={{ animationDelay: '120ms' }}>
            {plan.jours.map((jour) => (
              <CarteJour
                key={jour.date}
                jour={jour}
                objectif={objectif}
                aujourdhui={jour.date === date}
                onRemplacer={(moment) => setARemplacer({ date: jour.date, moment })}
              />
            ))}
          </section>
        </>
      )}

      <FeuilleReglages
        ouvert={reglages}
        tags={tags}
        existe={plan !== null}
        onBasculer={(tag) =>
          setTags((actuels) =>
            actuels.includes(tag) ? actuels.filter((t) => t !== tag) : [...actuels, tag],
          )
        }
        onFermer={() => setReglages(false)}
        onGenerer={() => generer(tags)}
      />

      {plan && (
        <FeuilleCourses ouvert={courses} plan={plan} onFermer={() => setCourses(false)} />
      )}

      {aRemplacer && (
        <FeuilleRemplacement
          cible={aRemplacer}
          actuelId={
            plan?.jours.find((j) => j.date === aRemplacer.date)?.repas[aRemplacer.moment] ?? null
          }
          objectif={objectif}
          onFermer={() => setARemplacer(null)}
          onChoisir={(id) => remplacer(aRemplacer.date, aRemplacer.moment, id)}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────── Sous-vues ─────────────────────────────── */

function ResumeSemaine({
  plan,
  objectif,
  perime,
  onRegenerer,
  onCourses,
}: {
  plan: PlanSemaine
  objectif: number
  perime: boolean
  onRegenerer: () => void
  onCourses: () => void
}) {
  const bilan = useMemo(() => bilanDuPlan(plan), [plan])

  return (
    <Carte className="animate-rise overflow-hidden" style={{ animationDelay: '60ms' }}>
      <div className="bg-corail-wash px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.14em] text-corail uppercase">
              Semaine du {dateLongue(plan.debut).replace(/^\w+\s/, '')}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-ink tnum">
              {entier(bilan.kcalMoyenne)} kcal par jour en moyenne
            </p>
          </div>
          {perime && <Etiquette ton="berry">Semaine passée</Etiquette>}
        </div>
        <p className="mt-1.5 text-sm text-ink-soft tnum">
          {bilan.repasPrevus} repas prévus · {Math.round(bilan.minutesTotales / 60)} h de cuisine ·
          objectif {entier(objectif)} kcal
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        <Bouton ton="doux" onClick={onRegenerer}>
          <RefreshCw size={17} aria-hidden="true" />
          Régénérer
        </Bouton>
        <Bouton onClick={onCourses}>
          <ShoppingBasket size={17} aria-hidden="true" />
          Ma liste
        </Bouton>
      </div>
    </Carte>
  )
}

function CarteJour({
  jour,
  objectif,
  aujourdhui,
  onRemplacer,
}: {
  jour: { date: string; repas: Record<Moment, string | null> }
  objectif: number
  aujourdhui: boolean
  onRemplacer: (moment: Moment) => void
}) {
  const total = totalDuJour(jour)
  const ecart = total - objectif

  return (
    <Carte className={classes('overflow-hidden', aujourdhui && 'border-corail')}>
      <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-2">
        <h2 className="font-semibold text-ink">
          {dateLongue(jour.date).replace(/^\w/, (c) => c.toUpperCase())}
          {aujourdhui && <span className="ml-2 text-sm font-semibold text-corail">Aujourd’hui</span>}
        </h2>
        <span
          className={classes(
            'shrink-0 text-sm font-semibold tnum',
            Math.abs(ecart) <= 150 ? 'text-basil' : 'text-ink-soft',
          )}
        >
          {entier(total)} kcal
        </span>
      </div>

      <ul className="divide-y divide-line">
        {MOMENTS.map((moment) => {
          const recette = jour.repas[moment] ? recetteParId(jour.repas[moment] as string) : undefined
          return (
            <li key={moment}>
              <button
                type="button"
                onClick={() => onRemplacer(moment)}
                aria-label={`Changer le ${LIBELLE_MOMENT[moment].toLowerCase()} du ${dateLongue(jour.date)}`}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-sunken"
              >
                <span className="w-24 shrink-0 text-xs font-bold tracking-[0.08em] text-ink-faint uppercase">
                  {LIBELLE_MOMENT[moment]}
                </span>
                <span className="min-w-0 flex-1">
                  {recette ? (
                    <>
                      <span className="block truncate text-sm font-semibold text-ink">
                        {recette.titre}
                      </span>
                      <span className="block text-xs text-ink-soft tnum">
                        {recette.kcal} kcal · {recette.minutes} min
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-ink-faint">Rien de prévu</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Carte>
  )
}

function FeuilleReglages({
  ouvert,
  tags,
  existe,
  onBasculer,
  onFermer,
  onGenerer,
}: {
  ouvert: boolean
  tags: Tag[]
  existe: boolean
  onBasculer: (tag: Tag) => void
  onFermer: () => void
  onGenerer: () => void
}) {
  return (
    <Feuille ouvert={ouvert} titre="Composer la semaine" onFermer={onFermer}>
      <p className="text-sm text-ink-soft">
        Sans filtre, la semaine pioche dans tout le catalogue. Un filtre restreint les recettes
        retenues à celles qui le portent — cumulez-les avec parcimonie, sous peine de revoir les
        mêmes plats.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {FILTRES.map((tag) => {
          const actif = tags.includes(tag)
          return (
            <li key={tag}>
              <button
                type="button"
                aria-pressed={actif}
                onClick={() => onBasculer(tag)}
                className={classes(
                  'flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition',
                  actif
                    ? 'border-corail bg-corail-wash text-ink'
                    : 'border-line bg-surface text-ink-soft hover:bg-sunken',
                )}
              >
                {actif && <Check size={14} aria-hidden="true" />}
                {LIBELLE_TAG[tag]}
              </button>
            </li>
          )
        })}
      </ul>

      {existe && (
        <p className="mt-4 rounded-tile bg-sunken px-3.5 py-3 text-sm text-ink-soft">
          Régénérer remplace la semaine affichée, y compris les repas que vous avez changés à la
          main.
        </p>
      )}

      <Bouton pleineLargeur className="mt-5" onClick={onGenerer}>
        <Sparkles size={17} aria-hidden="true" />
        {existe ? 'Régénérer la semaine' : 'Composer ma semaine'}
      </Bouton>
    </Feuille>
  )
}

function FeuilleRemplacement({
  cible,
  actuelId,
  objectif,
  onFermer,
  onChoisir,
}: {
  cible: { date: string; moment: Moment }
  actuelId: string | null
  objectif: number
  onFermer: () => void
  onChoisir: (id: string) => void
}) {
  const cibleKcal = cibleDuRepas(objectif, cible.moment)
  const options = useMemo(
    () => alternativesPour(cible.moment, cibleKcal),
    [cible.moment, cibleKcal],
  )

  return (
    <Feuille
      ouvert
      titre={`${LIBELLE_MOMENT[cible.moment]} du ${dateLongue(cible.date).replace(/^\w+\s/, '')}`}
      onFermer={onFermer}
    >
      <p className="text-sm text-ink-soft tnum">
        Repère pour ce repas : {cibleKcal} kcal. Les plus proches sont en tête.
      </p>

      <ul className="mt-4 space-y-2">
        {options.map((recette) => {
          const actuel = recette.id === actuelId
          return (
            <li key={recette.id}>
              <button
                type="button"
                onClick={() => onChoisir(recette.id)}
                className={classes(
                  'flex w-full items-center gap-3 rounded-card border px-4 py-3 text-left transition',
                  actuel
                    ? 'border-corail bg-corail-wash'
                    : 'border-line bg-surface hover:bg-sunken',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {recette.titre}
                  </span>
                  <span className="block text-xs text-ink-soft tnum">
                    {recette.kcal} kcal · {recette.minutes} min
                  </span>
                </span>
                {actuel && <Check size={17} className="shrink-0 text-corail" aria-hidden="true" />}
              </button>
            </li>
          )
        })}
      </ul>
    </Feuille>
  )
}

function FeuilleCourses({
  ouvert,
  plan,
  onFermer,
}: {
  ouvert: boolean
  plan: PlanSemaine
  onFermer: () => void
}) {
  const groupes = useMemo(() => coursesDuPlan(plan), [plan])
  const rayonsRemplis = RAYONS.filter((rayon) => groupes[rayon].length > 0)

  return (
    <Feuille ouvert={ouvert} titre="Liste de courses" onFermer={onFermer}>
      {rayonsRemplis.length === 0 ? (
        <p className="text-sm text-ink-soft">Aucun ingrédient : la semaine est encore vide.</p>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-ink-soft">
            Les ingrédients des {plan.jours.length} jours, regroupés dans l’ordre où l’on traverse
            le magasin.
          </p>
          {rayonsRemplis.map((rayon) => (
            <section key={rayon}>
              <TitreSection>{rayon}</TitreSection>
              <ul className="space-y-1.5">
                {groupes[rayon].map((ingredient) => (
                  <li
                    key={ingredient.nom}
                    className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5 text-sm"
                  >
                    <span className="text-ink">{ingredient.nom}</span>
                    <span className="shrink-0 text-ink-soft">{ingredient.quantite}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Lien vers="/app/cuisine" className="mt-6 block">
        <Bouton ton="doux" pleineLargeur>
          <CalendarDays size={17} aria-hidden="true" />
          Revoir les recettes
        </Bouton>
      </Lien>
    </Feuille>
  )
}
