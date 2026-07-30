import { useMemo, useState } from 'react'
import {
  BookmarkPlus,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  GripVertical,
  Move,
  RefreshCw,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, Champ, Etiquette, EtatVide, Feuille, TitreSection } from '../components/ui'
import { cibleDuRepas } from '../lib/journal'
import {
  SEMAINES_PRECONSTRUITES,
  alternativesPour,
  bilanDuPlan,
  copieDeSemaine,
  copierJour,
  coursesDuPlan,
  decalerJours,
  decalerMois,
  deplacerRepas,
  genererSemaines,
  lundiDeLaSemaine,
  lundisDuMois,
  modeleDepuisPlan,
  planDepuisModele,
  planPour,
  poserPlan,
  totalDuJour,
} from '../lib/menu'
import { telechargerICS } from '../lib/ics'
import { listesEnCours, nouvelleListe, propositionsDuPlan, verser } from '../lib/courses'
import { objectifCalorique } from '../lib/nutrition'
import { LIBELLE_TAG, RAYONS, recetteParId } from '../lib/recettes'
import type { Recette, Tag } from '../lib/recettes'
import { entreeDeLaRecette } from '../lib/journalRecette'
import { AuJournal } from '../components/AuJournal'
import { Lien } from '../lib/router'
import { poidsLePlusRecent } from '../lib/store'
import type { JourMenu, ModeleSemaine, Moment, PlanSemaine } from '../lib/types'
import { LIBELLE_MOMENT, MOMENTS } from '../lib/types'
import { classes, dateLongue, entier, jourISO, moisAnnee } from '../lib/utils'

/** Les filtres qui changent vraiment une semaine ; le catalogue en porte plus. */
const FILTRES: Tag[] = ['vegetarien', 'rapide', 'economique', 'batch']

/** Combien de semaines composer d'un coup. */
const NOMBRES = [1, 2, 4]

type Vue = 'jour' | 'semaine' | 'mois'

/** Un créneau du planning : une date et un moment de la journée. */
interface Creneau {
  date: string
  moment: Moment
}

export function Menus() {
  const { etat, modifier } = useSession()
  const aujourdhui = jourISO()

  const [vue, setVue] = useState<Vue>('semaine')
  /** La date de référence de l'affichage — jamais forcément aujourd'hui. */
  const [ancre, setAncre] = useState(aujourdhui)

  const [reglages, setReglages] = useState(false)
  const [courses, setCourses] = useState(false)
  const [copie, setCopie] = useState(false)
  const [modeles, setModeles] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [ouvert, setOuvert] = useState<Creneau | null>(null)
  const [aRemplacer, setARemplacer] = useState<Creneau | null>(null)
  const [aDeplacer, setADeplacer] = useState<Creneau | null>(null)

  const objectif = objectifCalorique({
    poidsKg: poidsLePlusRecent(etat),
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  })

  const debut = lundiDeLaSemaine(ancre)
  const plan = planPour(etat.plans, debut) ?? null

  /** Écrit dans la semaine affichée, en la créant vide si elle n'existe pas. */
  function surLeplan(recette: (p: PlanSemaine) => void) {
    modifier((brouillon) => {
      const cible = brouillon.plans.find((p) => p.debut === debut)
      if (cible) recette(cible)
    })
  }

  function generer(filtres: Tag[], nombre: number) {
    const semaines = genererSemaines(
      { debut, objectifKcal: objectif, tags: filtres },
      nombre,
    )
    modifier((brouillon) => {
      for (const semaine of semaines) poserPlan(brouillon.plans, semaine)
    })
    setReglages(false)
  }

  function remplacer(creneau: Creneau, recetteId: string) {
    surLeplan((p) => {
      const jour = p.jours.find((j) => j.date === creneau.date)
      if (jour) jour.repas[creneau.moment] = recetteId
    })
    setARemplacer(null)
  }

  /**
   * Un menu planifié n'est qu'une intention : c'est ce geste qui le fait entrer
   * dans le suivi réel. Il est daté du jour et non de la case du planning —
   * quelqu'un qui décale son dîner de la veille le note quand il le mange.
   */
  function auJournal(recette: Recette, quantiteG: number, moment: Moment) {
    modifier((brouillon) => {
      brouillon.journal.push(entreeDeLaRecette(recette, { date: aujourdhui, moment, quantiteG }))
    })
  }

  function deplacer(de: Creneau, vers: Creneau) {
    surLeplan((p) => deplacerRepas(p, de, vers))
    setADeplacer(null)
    setOuvert(null)
  }

  const titre =
    vue === 'mois'
      ? moisAnnee(ancre).replace(/^\w/, (c) => c.toUpperCase())
      : vue === 'jour'
        ? dateLongue(ancre).replace(/^\w/, (c) => c.toUpperCase())
        : `Semaine du ${dateLongue(debut).replace(/^\w+\s/, '')}`

  function naviguer(sens: -1 | 1) {
    if (vue === 'mois') setAncre(decalerMois(ancre, sens))
    else setAncre(decalerJours(ancre, sens * (vue === 'jour' ? 1 : 7)))
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-2xl font-semibold text-ink">Mes menus</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Composez une semaine ou un mois, déplacez ce qui ne tombe pas au bon jour, emportez la
          liste.
        </p>
      </header>

      {/* ── Vue et navigation ── */}
      <div className="animate-rise space-y-3" style={{ animationDelay: '60ms' }}>
        <div className="flex gap-1 rounded-full bg-sunken p-1" role="tablist" aria-label="Échelle d’affichage">
          {(['jour', 'semaine', 'mois'] as Vue[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={vue === v}
              onClick={() => setVue(v)}
              className={classes(
                'flex-1 rounded-full py-2 text-sm font-semibold capitalize transition',
                vue === v ? 'bg-surface text-ink shadow-soft' : 'text-ink-soft',
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => naviguer(-1)}
            aria-label={vue === 'mois' ? 'Mois précédent' : vue === 'jour' ? 'Jour précédent' : 'Semaine précédente'}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:bg-sunken"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="min-w-0 flex-1 text-center text-sm font-semibold text-ink">{titre}</p>
          <button
            type="button"
            onClick={() => naviguer(1)}
            aria-label={vue === 'mois' ? 'Mois suivant' : vue === 'jour' ? 'Jour suivant' : 'Semaine suivante'}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:bg-sunken"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {ancre !== aujourdhui && (
          <button
            type="button"
            onClick={() => setAncre(aujourdhui)}
            className="w-full text-sm font-semibold text-corail underline underline-offset-4"
          >
            Revenir à aujourd’hui
          </button>
        )}
      </div>

      {/* ── Le contenu, selon la vue ── */}
      {vue === 'mois' ? (
        <VueMois
          ancre={ancre}
          plans={etat.plans}
          objectif={objectif}
          aujourdhui={aujourdhui}
          onSemaine={(lundi) => {
            setAncre(lundi)
            setVue('semaine')
          }}
        />
      ) : plan === null ? (
        <Carte className="animate-rise" style={{ animationDelay: '120ms' }}>
          <EtatVide
            emoji="🗓"
            titre="Rien de prévu cette semaine"
            action={
              <Bouton onClick={() => setReglages(true)}>
                <Sparkles size={17} aria-hidden="true" />
                Composer
              </Bouton>
            }
          >
            L’application répartit les recettes du catalogue en visant vos{' '}
            <strong className="font-semibold text-ink tnum">{entier(objectif)} kcal</strong> par
            jour. Vous pouvez aussi reposer une semaine déjà faite.
          </EtatVide>
          <div className="px-5 pb-5">
            <Bouton ton="doux" pleineLargeur onClick={() => setModeles(true)}>
              <CalendarRange size={17} aria-hidden="true" />
              Partir d’un modèle
            </Bouton>
          </div>
        </Carte>
      ) : (
        <>
          <ResumeSemaine
            plan={plan}
            objectif={objectif}
            onRegenerer={() => setReglages(true)}
            onCourses={() => setCourses(true)}
            onCopier={() => setCopie(true)}
            onModeles={() => setModeles(true)}
            onExporter={() => telechargerICS(plan)}
          />

          {vue === 'jour' ? (
            <VueJour
              jour={plan.jours.find((j) => j.date === ancre)}
              objectif={objectif}
              onOuvrir={(moment) => setOuvert({ date: ancre, moment })}
              onCopierVers={(cible) => {
                surLeplan((p) => copierJour(p, ancre, cible))
              }}
              debut={debut}
            />
          ) : (
            <section className="animate-rise space-y-3" style={{ animationDelay: '120ms' }}>
              {plan.jours.map((jour) => (
                <CarteJour
                  key={jour.date}
                  jour={jour}
                  objectif={objectif}
                  aujourdhui={jour.date === aujourdhui}
                  onOuvrir={(moment) => setOuvert({ date: jour.date, moment })}
                  onDeposer={deplacer}
                  onJour={() => {
                    setAncre(jour.date)
                    setVue('jour')
                  }}
                />
              ))}
            </section>
          )}
        </>
      )}

      {/* ── Feuilles ── */}
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
        onGenerer={(nombre) => generer(tags, nombre)}
      />

      {plan && <FeuilleCourses ouvert={courses} plan={plan} onFermer={() => setCourses(false)} />}

      {plan && (
        <FeuilleCopie
          ouvert={copie}
          debut={debut}
          plans={etat.plans}
          onFermer={() => setCopie(false)}
          onCopier={(cible) => {
            modifier((brouillon) => {
              const source = brouillon.plans.find((p) => p.debut === debut)
              if (source) poserPlan(brouillon.plans, copieDeSemaine(source, cible))
            })
            setCopie(false)
            setAncre(cible)
          }}
        />
      )}

      <FeuilleModeles
        ouvert={modeles}
        modeles={etat.modeles}
        planCourant={plan}
        onFermer={() => setModeles(false)}
        onEnregistrer={(nom) => {
          modifier((brouillon) => {
            const source = brouillon.plans.find((p) => p.debut === debut)
            if (source) brouillon.modeles.push(modeleDepuisPlan(source, nom))
          })
        }}
        onAppliquer={(modele) => {
          modifier((brouillon) => {
            poserPlan(brouillon.plans, planDepuisModele(modele, debut))
          })
          setModeles(false)
        }}
        onSupprimer={(id) => {
          modifier((brouillon) => {
            brouillon.modeles = brouillon.modeles.filter((m) => m.id !== id)
          })
        }}
        onPreconstruite={(preconstruite) => {
          generer(preconstruite.tags, 1)
          setModeles(false)
        }}
      />

      {ouvert && (
        <FeuilleRepas
          cible={ouvert}
          recetteId={
            planPour(etat.plans, lundiDeLaSemaine(ouvert.date))?.jours.find(
              (j) => j.date === ouvert.date,
            )?.repas[ouvert.moment] ?? null
          }
          onFermer={() => setOuvert(null)}
          onAuJournal={(recette, quantiteG) => auJournal(recette, quantiteG, ouvert.moment)}
          onChanger={() => {
            setARemplacer(ouvert)
            setOuvert(null)
          }}
          onDeplacer={() => {
            setADeplacer(ouvert)
            setOuvert(null)
          }}
        />
      )}

      {aRemplacer && (
        <FeuilleRemplacement
          cible={aRemplacer}
          actuelId={
            plan?.jours.find((j) => j.date === aRemplacer.date)?.repas[aRemplacer.moment] ?? null
          }
          objectif={objectif}
          onFermer={() => setARemplacer(null)}
          onChoisir={(id) => remplacer(aRemplacer, id)}
        />
      )}

      {aDeplacer && plan && (
        <FeuilleDeplacement
          source={aDeplacer}
          plan={plan}
          onFermer={() => setADeplacer(null)}
          onChoisir={(cible) => deplacer(aDeplacer, cible)}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────── Sous-vues ─────────────────────────────── */

function ResumeSemaine({
  plan,
  objectif,
  onRegenerer,
  onCourses,
  onCopier,
  onModeles,
  onExporter,
}: {
  plan: PlanSemaine
  objectif: number
  onRegenerer: () => void
  onCourses: () => void
  onCopier: () => void
  onModeles: () => void
  onExporter: () => void
}) {
  const bilan = useMemo(() => bilanDuPlan(plan), [plan])

  return (
    <Carte className="animate-rise overflow-hidden" style={{ animationDelay: '90ms' }}>
      <div className="bg-corail-wash px-5 py-4">
        <p className="text-xs font-bold tracking-[0.14em] text-corail uppercase">
          {bilan.joursRemplis} jour{bilan.joursRemplis > 1 ? 's' : ''} composé
          {bilan.joursRemplis > 1 ? 's' : ''}
        </p>
        <p className="mt-1 font-display text-xl font-semibold text-ink tnum">
          {entier(bilan.kcalMoyenne)} kcal par jour en moyenne
        </p>
        <p className="mt-1.5 text-sm text-ink-soft tnum">
          {bilan.repasPrevus} repas prévus · {Math.round(bilan.minutesTotales / 60)} h de cuisine ·
          objectif {entier(objectif)} kcal
        </p>
      </div>

      {/* Deux gestes fréquents en pleine largeur, trois occasionnels en dessous :
          les cinq à la file repoussaient la semaine — le contenu de l'écran —
          sous le pli en 390 px. */}
      <div className="grid grid-cols-2 gap-2.5 px-5 pt-4">
        <Bouton ton="doux" onClick={onRegenerer}>
          <RefreshCw size={17} aria-hidden="true" />
          Régénérer
        </Bouton>
        <Bouton onClick={onCourses}>
          <ShoppingBasket size={17} aria-hidden="true" />
          Ma liste
        </Bouton>
      </div>

      <div className="flex gap-2 px-5 pt-2.5 pb-4">
        <Bouton ton="fantome" className="flex-1 px-2 text-xs" onClick={onCopier}>
          <Copy size={15} aria-hidden="true" />
          Copier
        </Bouton>
        <Bouton ton="fantome" className="flex-1 px-2 text-xs" onClick={onModeles}>
          <CalendarRange size={15} aria-hidden="true" />
          Modèles
        </Bouton>
        {/* La « synchronisation d'agenda » livrable : un fichier que Google,
            Apple et Outlook savent tous importer, sans compte ni autorisation.
            Le libellé court garde son sens grâce à l'`aria-label` complet. */}
        <Bouton
          ton="fantome"
          className="flex-1 px-2 text-xs"
          aria-label="Envoyer vers mon agenda, au format .ics"
          onClick={onExporter}
        >
          <Download size={15} aria-hidden="true" />
          Agenda
        </Bouton>
      </div>
    </Carte>
  )
}

/**
 * La vue mensuelle : une pile de semaines.
 *
 * Elle ne montre pas les plats — à cette échelle ils seraient illisibles — mais
 * ce qui se décide à cette échelle : quelles semaines sont composées, et
 * lesquelles sont encore vides.
 */
function VueMois({
  ancre,
  plans,
  objectif,
  aujourdhui,
  onSemaine,
}: {
  ancre: string
  plans: PlanSemaine[]
  objectif: number
  aujourdhui: string
  onSemaine: (lundi: string) => void
}) {
  const lundis = useMemo(() => lundisDuMois(ancre), [ancre])

  return (
    <section className="animate-rise space-y-3" style={{ animationDelay: '120ms' }}>
      {lundis.map((lundi) => {
        const plan = planPour(plans, lundi)
        const bilan = plan ? bilanDuPlan(plan) : null
        const contientAujourdhui = plan?.jours.some((j) => j.date === aujourdhui) ?? false

        return (
          <button
            key={lundi}
            type="button"
            onClick={() => onSemaine(lundi)}
            className={classes(
              'w-full rounded-card border bg-surface px-4 py-3.5 text-left shadow-soft transition hover:bg-sunken',
              contientAujourdhui ? 'border-corail' : 'border-line',
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-ink">
                Semaine du {dateLongue(lundi).replace(/^\w+\s/, '')}
                {contientAujourdhui && (
                  <span className="ml-2 text-xs font-semibold text-corail">en cours</span>
                )}
              </span>
              {bilan ? (
                <span className="shrink-0 text-xs font-semibold text-ink-soft tnum">
                  {entier(bilan.kcalMoyenne)} kcal / j
                </span>
              ) : (
                <span className="shrink-0 text-xs text-ink-faint">à composer</span>
              )}
            </div>

            {/* Sept pastilles, une par jour : la forme de la semaine se lit d'un
                coup d'œil sans avoir à ouvrir quoi que ce soit. */}
            <div className="mt-2.5 flex gap-1.5">
              {Array.from({ length: 7 }, (_, index) => {
                const date = decalerJours(lundi, index)
                const jour = plan?.jours.find((j) => j.date === date)
                const total = jour ? totalDuJour(jour) : 0
                const complet = jour ? MOMENTS.every((m) => jour.repas[m] !== null) : false
                return (
                  <span
                    key={date}
                    aria-hidden="true"
                    className={classes(
                      'h-6 flex-1 rounded-md',
                      total === 0
                        ? 'bg-sunken'
                        : complet
                          ? 'bg-basil'
                          : 'bg-apricot',
                    )}
                  />
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-ink-faint tnum">
              {bilan
                ? `${bilan.repasPrevus} repas prévus · objectif ${entier(objectif)} kcal`
                : 'Aucun repas prévu'}
            </p>
          </button>
        )
      })}
    </section>
  )
}

/** La vue d'un seul jour : les quatre repas, en grand, et de quoi les recopier. */
function VueJour({
  jour,
  objectif,
  debut,
  onOuvrir,
  onCopierVers,
}: {
  jour: JourMenu | undefined
  objectif: number
  debut: string
  onOuvrir: (moment: Moment) => void
  onCopierVers: (cible: string) => void
}) {
  const [copieOuverte, setCopieOuverte] = useState(false)

  if (!jour) {
    return (
      <Carte className="animate-rise" style={{ animationDelay: '120ms' }}>
        <EtatVide emoji="📅" titre="Ce jour n’est pas dans la semaine affichée">
          Revenez à la vue semaine pour composer cette période.
        </EtatVide>
      </Carte>
    )
  }

  const total = totalDuJour(jour)

  return (
    <section className="animate-rise space-y-3" style={{ animationDelay: '120ms' }}>
      <Carte className="px-5 py-4">
        <p className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xl font-semibold text-ink tnum">
            {entier(total)} kcal
          </span>
          <span className="text-sm text-ink-soft tnum">objectif {entier(objectif)} kcal</span>
        </p>
      </Carte>

      <ul className="space-y-2">
        {MOMENTS.map((moment) => {
          const recette = jour.repas[moment] ? recetteParId(jour.repas[moment] as string) : undefined
          const cible = cibleDuRepas(objectif, moment)
          return (
            <li key={moment}>
              <Carte>
                <button
                  type="button"
                  onClick={() => onOuvrir(moment)}
                  className="w-full px-5 py-4 text-left transition hover:bg-sunken"
                >
                  <span className="block text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
                    {LIBELLE_MOMENT[moment]} · repère {cible} kcal
                  </span>
                  {recette ? (
                    <>
                      <span className="mt-1 block font-semibold text-ink">{recette.titre}</span>
                      <span className="mt-0.5 block text-sm text-ink-soft tnum">
                        {recette.kcal} kcal · {recette.minutes} min
                      </span>
                    </>
                  ) : (
                    <span className="mt-1 block text-sm text-ink-faint">Rien de prévu</span>
                  )}
                </button>
              </Carte>
            </li>
          )
        })}
      </ul>

      <Bouton ton="doux" pleineLargeur onClick={() => setCopieOuverte(true)}>
        <Copy size={16} aria-hidden="true" />
        Recopier cette journée
      </Bouton>

      <Feuille
        ouvert={copieOuverte}
        titre="Recopier cette journée"
        onFermer={() => setCopieOuverte(false)}
      >
        <p className="text-sm text-ink-soft">
          La journée d’origine ne change pas : on recopie, on ne déplace pas.
        </p>
        <ul className="mt-4 space-y-2">
          {Array.from({ length: 7 }, (_, index) => decalerJours(debut, index))
            .filter((date) => date !== jour.date)
            .map((date) => (
              <li key={date}>
                <button
                  type="button"
                  onClick={() => {
                    onCopierVers(date)
                    setCopieOuverte(false)
                  }}
                  className="w-full rounded-card border border-line bg-surface px-4 py-3 text-left text-sm font-semibold text-ink transition hover:bg-sunken"
                >
                  {dateLongue(date).replace(/^\w/, (c) => c.toUpperCase())}
                </button>
              </li>
            ))}
        </ul>
      </Feuille>
    </section>
  )
}

function CarteJour({
  jour,
  objectif,
  aujourdhui,
  onOuvrir,
  onDeposer,
  onJour,
}: {
  jour: JourMenu
  objectif: number
  aujourdhui: boolean
  onOuvrir: (moment: Moment) => void
  onDeposer: (de: Creneau, vers: Creneau) => void
  onJour: () => void
}) {
  const [survole, setSurvole] = useState<Moment | null>(null)
  const total = totalDuJour(jour)
  const ecart = total - objectif

  return (
    <Carte className={classes('overflow-hidden', aujourdhui && 'border-corail')}>
      <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-2">
        <button type="button" onClick={onJour} className="min-w-0 text-left">
          <h2 className="font-semibold text-ink">
            {dateLongue(jour.date).replace(/^\w/, (c) => c.toUpperCase())}
            {aujourdhui && <span className="ml-2 text-sm font-semibold text-corail">Aujourd’hui</span>}
          </h2>
        </button>
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
            <li
              key={moment}
              // Le glisser-déposer de HTML n'a pas d'équivalent tactile : il n'y
              // a pas de « dragstart » au doigt. Il reste donc un confort de
              // souris, et le même déplacement s'obtient partout par la fiche du
              // repas (« Déplacer ce repas »). Ne pas retirer ce second chemin.
              draggable={recette !== undefined}
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'application/mamakilo-repas',
                  JSON.stringify({ date: jour.date, moment }),
                )
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes('application/mamakilo-repas')) return
                e.preventDefault()
                setSurvole(moment)
              }}
              onDragLeave={() => setSurvole(null)}
              onDrop={(e) => {
                e.preventDefault()
                setSurvole(null)
                const brut = e.dataTransfer.getData('application/mamakilo-repas')
                if (!brut) return
                const de = JSON.parse(brut) as Creneau
                if (de.date === jour.date && de.moment === moment) return
                onDeposer(de, { date: jour.date, moment })
              }}
              className={classes('transition', survole === moment && 'bg-corail-wash')}
            >
              <button
                type="button"
                onClick={() => onOuvrir(moment)}
                aria-label={`Ouvrir le ${LIBELLE_MOMENT[moment].toLowerCase()} du ${dateLongue(jour.date)}`}
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
                {recette && (
                  <GripVertical
                    size={15}
                    className="hidden shrink-0 text-ink-faint md:block"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </Carte>
  )
}

/**
 * La fiche d'un repas du planning : ce qui est prévu, et les trois choses qu'on
 * veut en faire — le manger pour de vrai, le changer, ou le déplacer.
 */
function FeuilleRepas({
  cible,
  recetteId,
  onFermer,
  onAuJournal,
  onChanger,
  onDeplacer,
}: {
  cible: Creneau
  recetteId: string | null
  onFermer: () => void
  onAuJournal: (recette: Recette, quantiteG: number) => void
  onChanger: () => void
  onDeplacer: () => void
}) {
  const recette = recetteId ? recetteParId(recetteId) : undefined

  return (
    <Feuille
      ouvert
      titre={`${LIBELLE_MOMENT[cible.moment]} du ${dateLongue(cible.date).replace(/^\w+\s/, '')}`}
      onFermer={onFermer}
    >
      {recette ? (
        <div className="space-y-5">
          <div>
            <p className="font-display text-lg font-semibold text-ink">{recette.titre}</p>
            <p className="mt-1 text-sm text-ink-soft tnum">
              {recette.kcal} kcal · {recette.minutes} min
            </p>
          </div>

          <AuJournal recette={recette} onAjouter={(q) => onAuJournal(recette, q)} />

          <div className="space-y-2.5">
            <Bouton ton="doux" pleineLargeur onClick={onChanger}>
              <RefreshCw size={17} aria-hidden="true" />
              Changer ce repas
            </Bouton>
            {/* Le pendant tactile du glisser-déposer : sur un téléphone, c'est le
                seul chemin possible. */}
            <Bouton ton="fantome" pleineLargeur onClick={onDeplacer}>
              <Move size={17} aria-hidden="true" />
              Déplacer ce repas
            </Bouton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">Rien n’est prévu pour ce repas.</p>
          <Bouton pleineLargeur onClick={onChanger}>
            <Sparkles size={17} aria-hidden="true" />
            Choisir un repas
          </Bouton>
        </div>
      )}
    </Feuille>
  )
}

/** Où déplacer un repas — l'équivalent au doigt du glisser-déposer. */
function FeuilleDeplacement({
  source,
  plan,
  onFermer,
  onChoisir,
}: {
  source: Creneau
  plan: PlanSemaine
  onFermer: () => void
  onChoisir: (cible: Creneau) => void
}) {
  return (
    <Feuille ouvert titre="Déplacer ce repas" onFermer={onFermer}>
      <p className="text-sm text-ink-soft">
        Si le créneau choisi est déjà occupé, les deux repas s’échangent — rien ne disparaît.
      </p>

      <div className="mt-4 space-y-4">
        {plan.jours.map((jour) => (
          <section key={jour.date}>
            <h3 className="mb-1.5 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
              {dateLongue(jour.date).replace(/^\w/, (c) => c.toUpperCase())}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {MOMENTS.map((moment) => {
                const memeCreneau = jour.date === source.date && moment === source.moment
                const occupe = jour.repas[moment] !== null
                return (
                  <button
                    key={moment}
                    type="button"
                    disabled={memeCreneau}
                    onClick={() => onChoisir({ date: jour.date, moment })}
                    className={classes(
                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      memeCreneau
                        ? 'border-line bg-sunken text-ink-faint'
                        : occupe
                          ? 'border-apricot bg-apricot-wash text-ink hover:brightness-95'
                          : 'border-line bg-surface text-ink-soft hover:bg-sunken',
                    )}
                  >
                    {LIBELLE_MOMENT[moment]}
                    {memeCreneau && ' (ici)'}
                    {!memeCreneau && occupe && ' ⇄'}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </Feuille>
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
  onGenerer: (nombre: number) => void
}) {
  const [nombre, setNombre] = useState(1)

  return (
    <Feuille ouvert={ouvert} titre="Composer" onFermer={onFermer}>
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

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-ink">Combien de semaines ?</legend>
        <div className="flex gap-1.5">
          {NOMBRES.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={nombre === n}
              onClick={() => setNombre(n)}
              className={classes(
                'flex-1 rounded-full border py-2 text-sm font-semibold transition',
                nombre === n
                  ? 'border-corail bg-corail text-white'
                  : 'border-line bg-surface text-ink-soft hover:bg-sunken',
              )}
            >
              {n} semaine{n > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        {/* La mémoire des recettes est partagée entre les semaines générées
            ensemble : c'est ce qui les rend différentes les unes des autres. */}
        <p className="mt-2 text-xs text-ink-soft">
          Plusieurs semaines d’un coup se composent sans se répéter entre elles. Elles partent de
          la semaine affichée.
        </p>
      </fieldset>

      {existe && (
        <p className="mt-4 rounded-tile bg-sunken px-3.5 py-3 text-sm text-ink-soft">
          Régénérer remplace les semaines concernées, y compris les repas changés à la main.
        </p>
      )}

      <Bouton pleineLargeur className="mt-5" onClick={() => onGenerer(nombre)}>
        <Sparkles size={17} aria-hidden="true" />
        {existe ? 'Régénérer' : 'Composer'}
      </Bouton>
    </Feuille>
  )
}

/** Recopier la semaine affichée sur une autre — les semaines se ressemblent. */
function FeuilleCopie({
  ouvert,
  debut,
  plans,
  onFermer,
  onCopier,
}: {
  ouvert: boolean
  debut: string
  plans: PlanSemaine[]
  onFermer: () => void
  onCopier: (cible: string) => void
}) {
  const cibles = Array.from({ length: 4 }, (_, index) => decalerJours(debut, (index + 1) * 7))

  return (
    <Feuille ouvert={ouvert} titre="Copier la semaine" onFermer={onFermer}>
      <p className="text-sm text-ink-soft">
        La semaine affichée est recopiée telle quelle, repas par repas. Vous pourrez ensuite en
        changer ce que vous voulez.
      </p>
      <ul className="mt-4 space-y-2">
        {cibles.map((cible) => {
          const occupee = planPour(plans, cible) !== undefined
          return (
            <li key={cible}>
              <button
                type="button"
                onClick={() => onCopier(cible)}
                className="flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left transition hover:bg-sunken"
              >
                <CalendarDays size={17} className="shrink-0 text-corail" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-sm font-semibold text-ink">
                  Semaine du {dateLongue(cible).replace(/^\w+\s/, '')}
                </span>
                {/* Prévenir avant d'écraser : une semaine déjà composée qu'on
                    recouvre sans le savoir, c'est du travail perdu. */}
                {occupee && <Etiquette ton="apricot">déjà composée</Etiquette>}
              </button>
            </li>
          )
        })}
      </ul>
    </Feuille>
  )
}

function FeuilleModeles({
  ouvert,
  modeles,
  planCourant,
  onFermer,
  onEnregistrer,
  onAppliquer,
  onSupprimer,
  onPreconstruite,
}: {
  ouvert: boolean
  modeles: ModeleSemaine[]
  planCourant: PlanSemaine | null
  onFermer: () => void
  onEnregistrer: (nom: string) => void
  onAppliquer: (modele: ModeleSemaine) => void
  onSupprimer: (id: string) => void
  onPreconstruite: (p: (typeof SEMAINES_PRECONSTRUITES)[number]) => void
}) {
  const [nom, setNom] = useState('')
  const [enregistre, setEnregistre] = useState(false)

  return (
    <Feuille ouvert={ouvert} titre="Modèles de semaine" onFermer={onFermer}>
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
            Semaines prêtes à poser
          </h3>
          {/* Des jeux de critères et non des semaines figées : voir
              SEMAINES_PRECONSTRUITES dans menu.ts. */}
          <ul className="space-y-2">
            {SEMAINES_PRECONSTRUITES.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPreconstruite(p)}
                  className="w-full rounded-card border border-line bg-surface px-4 py-3 text-left transition hover:bg-sunken"
                >
                  <span className="block text-sm font-semibold text-ink">{p.nom}</span>
                  <span className="block text-xs text-ink-soft">{p.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {modeles.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
              Mes modèles
            </h3>
            <ul className="space-y-2">
              {modeles.map((modele) => (
                <li key={modele.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAppliquer(modele)}
                    className="min-w-0 flex-1 rounded-card border border-line bg-surface px-4 py-3 text-left transition hover:bg-sunken"
                  >
                    <span className="block truncate text-sm font-semibold text-ink">
                      {modele.nom}
                    </span>
                    <span className="block text-xs text-ink-soft tnum">
                      {modele.jours.reduce(
                        (somme, j) => somme + MOMENTS.filter((m) => j[m] !== null).length,
                        0,
                      )}{' '}
                      repas
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSupprimer(modele.id)}
                    aria-label={`Supprimer le modèle ${modele.nom}`}
                    className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-ink-faint transition hover:bg-sunken hover:text-berry"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {planCourant && (
          <section>
            <h3 className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
              Garder la semaine affichée
            </h3>
            <div className="space-y-3">
              <Champ
                id="modele-nom"
                label="Nom du modèle"
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value)
                  setEnregistre(false)
                }}
                placeholder="Ma semaine type"
              />
              <Bouton
                ton="doux"
                pleineLargeur
                disabled={enregistre}
                onClick={() => {
                  onEnregistrer(nom)
                  setEnregistre(true)
                  setNom('')
                }}
              >
                <BookmarkPlus size={16} aria-hidden="true" />
                {enregistre ? 'Modèle enregistré' : 'Enregistrer comme modèle'}
              </Bouton>
            </div>
          </section>
        )}
      </div>
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
  cible: Creneau
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
  const { etat, modifier } = useSession()
  const groupes = useMemo(() => coursesDuPlan(plan), [plan])
  const rayonsRemplis = RAYONS.filter((rayon) => groupes[rayon].length > 0)
  const [verse, setVerse] = useState(0)

  /**
   * Cette feuille est un aperçu : rien n'y est cochable, parce que la liste
   * qu'on emporte est enregistrée et vit sur `/app/courses`. Le versement écarte
   * d'emblée ce que le garde-manger couvre déjà — on ne rachète pas ce qu'on a.
   */
  function verserDansMaListe() {
    const propositions = propositionsDuPlan(plan, etat.stocks, listesEnCours(etat.courses)[0] ?? null)
    const retenues = propositions.filter((p) => !p.enStock && !p.dejaDansListe)
    const ouverte = listesEnCours(etat.courses)[0] ?? null
    const cible = ouverte ?? nouvelleListe()

    modifier((brouillon) => {
      if (!ouverte) brouillon.courses.push(cible)
      const dans = brouillon.courses.find((l) => l.id === cible.id)
      if (dans) verser(dans, retenues, 'recette', plan)
    })
    setVerse(retenues.length)
  }

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

          <div className="space-y-3">
            <Bouton pleineLargeur onClick={verserDansMaListe}>
              <ShoppingBasket size={17} aria-hidden="true" />
              Verser dans ma liste de courses
            </Bouton>
            {verse > 0 && (
              <p className="text-sm text-basil" role="status">
                {verse} produit{verse > 1 ? 's' : ''} ajouté{verse > 1 ? 's' : ''}. Ce que votre
                garde-manger couvre déjà a été laissé de côté.
              </p>
            )}
            <Lien vers="/app/courses" className="block">
              <Bouton ton="fantome" pleineLargeur>
                Ouvrir ma liste de courses
              </Bouton>
            </Lien>
          </div>

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
