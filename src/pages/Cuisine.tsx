import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  Refrigerator,
  ChefHat,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { useSession } from '../context/AppContext'
import { AuJournal } from '../components/AuJournal'
import { EtiquetteBande } from '../components/nutrition'
import {
  Bouton,
  Carte,
  EtatVide,
  Etiquette,
  Feuille,
  TitreSection,
} from '../components/ui'
import {
  LIBELLE_CUISINE,
  LIBELLE_DIFFICULTE,
  LIBELLE_REGIME,
  LIBELLE_TAG,
  PLACARD,
  RAYONS,
  catalogue,
  listeDeCourses,
  recetteParId,
  type Difficulte,
  type Recette,
  type Regime,
  type Tag,
} from '../lib/recettes'
import {
  cuisinesDuCatalogue,
  difficulteDe,
  illustrationDe,
  ingredientsPour,
  macrosPortion,
  nombreDeCriteres,
  rechercher,
  regimesAAfficher,
  type Criteres,
} from '../lib/catalogue'
import {
  ajouterArticle,
  listesEnCours,
  nouvelleListe,
  propositionsDeRecettes,
  verser,
} from '../lib/courses'
import { seanceDeCuisine } from '../lib/cuisson'
import { cibleDuRepas } from '../lib/journal'
import { entreeDeLaRecette } from '../lib/journalRecette'
import { LIBELLE_BANDE, bandePour } from '../lib/nutriscore'
import type { Bande } from '../lib/nutriscore'
import { objectifCalorique } from '../lib/nutrition'
import { LIBELLE_CATEGORIE, TEINTE_MOMENT } from '../lib/plan'
import { Lien, useRoutage } from '../lib/router'
import { BandeauCuisineEnCours } from './ModeCuisine'
import { poidsLePlusRecent } from '../lib/store'
import { LIBELLE_MOMENT, MOMENTS } from '../lib/types'
import type { Moment } from '../lib/types'
import { classes, entier, jourISO } from '../lib/utils'

/**
 * Le catalogue complet, résolu une fois par module : il comprend les milliers de
 * recettes composées, dont la génération est paresseuse (voir `generateur.ts`).
 */
const CATALOGUE = catalogue()

/**
 * Combien de recettes s'affichent par moment avant de demander la suite.
 *
 * Une recherche large en rend plusieurs milliers : les poser toutes dans le DOM
 * bloquerait le fil principal pour une liste que personne ne fera défiler
 * jusqu'au bout. Vingt-quatre remplissent deux écrans de téléphone.
 */
const PAS_AFFICHAGE = 24

const BANDES: Bande[] = ['vert', 'bleu', 'orange']

/**
 * Toutes les étiquettes ne méritent pas un filtre : celles-ci répondent aux
 * questions qu'on se pose vraiment devant le frigo. Les autres restent
 * affichées sur la fiche.
 */
const TAGS_FILTRABLES: Tag[] = ['rapide', 'vegetarien', 'batch', 'nomade', 'une-casserole', 'plaisir']

const REGIMES_FILTRABLES: Regime[] = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose']

const DIFFICULTES: Difficulte[] = ['facile', 'intermediaire', 'technique']

/** Les bornes de temps qui correspondent à une vraie situation, pas une échelle. */
const TEMPS = [10, 20, 30]

/** Convives proposés à la fiche — au-delà, on cuisine en grand et on double soi-même. */
const CONVIVES = [1, 2, 4]

export function Cuisine() {
  const { etat, modifier } = useSession()
  const { aller } = useRoutage()
  const [onglet, setOnglet] = useState<'recettes' | 'courses'>('recettes')
  const [ouverte, setOuverte] = useState<Recette | null>(null)
  const [panier, setPanier] = useState<string[]>([])
  const [affiner, setAffiner] = useState(false)

  const [texte, setTexte] = useState('')
  const [bande, setBande] = useState<Bande | null>(null)
  const [criteres, setCriteres] = useState<Criteres>({})
  const [favorisSeuls, setFavorisSeuls] = useState(false)
  /**
   * Combien de recettes sont dépliées, par moment.
   *
   * Remis à zéro dès qu'un critère change : garder « 120 affichées » après une
   * nouvelle recherche ferait rendre cent vingt lignes d'un coup, et l'écran
   * semblerait bloqué au moment précis où l'on vient de taper.
   */
  const [limites, setLimites] = useState<Partial<Record<Moment, number>>>({})

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
    for (const recette of CATALOGUE) {
      table.set(recette.id, bandePour(recette.kcal, cibleDuRepas(objectif, recette.moment)))
    }
    return table
  }, [objectif])

  const favoris = etat.favoris

  // La bande reste à part des `Criteres` : elle ne se calcule pas depuis la
  // recette seule mais contre l'objectif de la personne, que `catalogue.ts`
  // ignore volontairement — il ne connaît que le catalogue.
  const resultats = useMemo(() => {
    const parCriteres = rechercher(
      { ...criteres, texte, parmi: favorisSeuls ? favoris : null },
      CATALOGUE,
    )
    return bande === null ? parCriteres : parCriteres.filter((r) => bandes.get(r.id) === bande)
  }, [criteres, texte, favorisSeuls, favoris, bande, bandes])

  const actifs = nombreDeCriteres(criteres) + (bande ? 1 : 0)

  function basculerPanier(id: string) {
    setPanier((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  function basculerFavori(id: string) {
    modifier((brouillon) => {
      brouillon.favoris = brouillon.favoris.includes(id)
        ? brouillon.favoris.filter((x) => x !== id)
        : [...brouillon.favoris, id]
    })
  }

  /** Ouvre le mode cuisine sur une ou plusieurs recettes. */
  function enCuisine(ids: string[]) {
    modifier((brouillon) => {
      brouillon.cuisine = seanceDeCuisine(ids)
    })
    aller('/app/mode-cuisine')
  }

  function toutEffacer() {
    setCriteres({})
    setBande(null)
    setTexte('')
    setFavorisSeuls(false)
    setLimites({})
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink">Cuisine</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          {CATALOGUE.length} recettes, cherchables par ce que vous avez, par le temps que vous avez,
          ou par envie.
        </p>
      </header>

      <BandeauCuisineEnCours />

      {/* Choisir plat par plat est le geste de celui qui sait déjà quoi manger.
          Pour les autres, la semaine composée d'avance est la vraie réponse —
          d'où ce raccourci en tête, avant les filtres. */}
      <Lien vers="/app/menus">
        <Carte className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken">
          <CalendarDays size={20} className="shrink-0 text-primaire" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Composer ma semaine</span>
            <span className="block text-sm text-ink-soft">
              Sept jours de menus et la liste de courses qui suit
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
        </Carte>
      </Lien>

      {/* L'autre porte d'entrée : partir de ce qu'on a déjà plutôt que du plat
          qu'on voudrait. C'est la question du soir de semaine devant le frigo. */}
      <Lien vers="/app/cuisiner">
        <Carte className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken">
          <Refrigerator size={20} className="shrink-0 text-reussite" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Cuisiner ce que j’ai</span>
            <span className="block text-sm text-ink-soft">
              Les recettes possibles avec votre garde-manger
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
        </Carte>
      </Lien>

      <div className="flex gap-1 rounded-full bg-sunken p-1" role="tablist">
        {(
          [
            { cle: 'recettes' as const, libelle: 'Recettes' },
            { cle: 'courses' as const, libelle: `Panier${panier.length ? ` (${panier.length})` : ''}` },
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
        <div className="space-y-5">
          {/* ── Chercher ── */}
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <input
                type="search"
                value={texte}
                onChange={(e) => {
                  setTexte(e.target.value)
                  setLimites({})
                }}
                placeholder="Un plat, ou un ingrédient à écouler…"
                aria-label="Chercher une recette"
                className="w-full rounded-2xl border border-line bg-surface py-3 pr-4 pl-11 text-ink placeholder:text-ink-faint focus:border-primaire focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <Bouton
                ton={actifs > 0 ? 'accent' : 'doux'}
                className="flex-1"
                onClick={() => setAffiner(true)}
              >
                <SlidersHorizontal size={17} aria-hidden="true" />
                Affiner
                {actifs > 0 && <span className="tnum">({actifs})</span>}
              </Bouton>
              {/* Les favoris sont un filtre comme un autre, mais on y revient
                  assez souvent pour qu'il mérite d'être à portée de pouce. */}
              <Bouton
                ton={favorisSeuls ? 'primaire' : 'doux'}
                aria-pressed={favorisSeuls}
                onClick={() => {
                  setFavorisSeuls((v) => !v)
                  setLimites({})
                }}
                disabled={favoris.length === 0 && !favorisSeuls}
              >
                <Heart
                  size={17}
                  strokeWidth={2.4}
                  fill={favorisSeuls ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                <span className="tnum">{favoris.length}</span>
              </Bouton>
            </div>

            {(actifs > 0 || texte || favorisSeuls) && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-ink-soft tnum" role="status">
                  {resultats.length} recette{resultats.length > 1 ? 's' : ''}
                </p>
                <button
                  type="button"
                  onClick={toutEffacer}
                  className="text-sm font-semibold text-primaire underline underline-offset-4"
                >
                  Tout effacer
                </button>
              </div>
            )}
          </div>

          {/* ── Résultats, groupés par moment de la journée ── */}
          {MOMENTS.map((moment) => {
            const recettes = resultats.filter((r) => r.moment === moment)
            if (recettes.length === 0) return null
            const limite = limites[moment] ?? PAS_AFFICHAGE
            const affichees = recettes.slice(0, limite)
            return (
              <section key={moment}>
                <TitreSection eyebrow={`${recettes.length} recette${recettes.length > 1 ? 's' : ''}`}>
                  {LIBELLE_MOMENT[moment]}
                </TitreSection>
                <ul className="space-y-2">
                  {affichees.map((recette) => (
                    <li key={recette.id}>
                      <LigneRecette
                        recette={recette}
                        bande={bandes.get(recette.id) ?? 'bleu'}
                        favori={favoris.includes(recette.id)}
                        dansLePanier={panier.includes(recette.id)}
                        onOuvrir={() => setOuverte(recette)}
                        onFavori={() => basculerFavori(recette.id)}
                        onPanier={() => basculerPanier(recette.id)}
                      />
                    </li>
                  ))}
                </ul>

                {/* Le nombre restant est annoncé plutôt que tu : une liste qui
                    s'arrête sans le dire laisse croire qu'on a tout vu. */}
                {recettes.length > limite && (
                  <button
                    type="button"
                    onClick={() =>
                      setLimites((actuelles) => ({
                        ...actuelles,
                        [moment]: limite + PAS_AFFICHAGE,
                      }))
                    }
                    className="mt-2 w-full rounded-card border border-line bg-surface py-2.5 text-sm font-semibold text-primaire transition hover:bg-sunken"
                  >
                    Voir {Math.min(PAS_AFFICHAGE, recettes.length - limite)} recettes de plus
                    <span className="text-ink-faint tnum"> ({recettes.length - limite} restantes)</span>
                  </button>
                )}
              </section>
            )
          })}

          {resultats.length === 0 && (
            <EtatVide
              emoji={favorisSeuls ? '💛' : '🥕'}
              titre={favorisSeuls ? 'Aucun favori ne coche tout' : 'Aucune recette ne coche tout'}
              action={
                <Bouton ton="doux" onClick={toutEffacer}>
                  Voir toutes les recettes
                </Bouton>
              }
            >
              {favorisSeuls
                ? 'Vos recettes mises de côté ne répondent pas à ces critères.'
                : 'Le catalogue ne contient rien qui réponde à ces critères pour votre objectif actuel. Les bandes se recalculent dès que votre poids ou votre activité changent.'}
            </EtatVide>
          )}
        </div>
      ) : (
        <ApercuCourses panier={panier} onCuisiner={() => enCuisine(panier)} />
      )}

      {/* ── Affiner ── */}
      <Feuille ouvert={affiner} titre="Affiner la recherche" onFermer={() => setAffiner(false)}>
        <FeuilleAffiner
          criteres={criteres}
          bande={bande}
          onCriteres={(c) => {
            setCriteres(c)
            setLimites({})
          }}
          onBande={(b) => {
            setBande(b)
            setLimites({})
          }}
          onEffacer={toutEffacer}
          resultats={resultats.length}
        />
      </Feuille>

      {/* ── La fiche ── */}
      <Feuille ouvert={ouverte !== null} titre={ouverte?.titre ?? ''} onFermer={() => setOuverte(null)}>
        {ouverte && (
          <FicheRecette
            recette={ouverte}
            onCuisiner={() => enCuisine([ouverte.id])}
            bande={bandes.get(ouverte.id) ?? 'bleu'}
            favori={favoris.includes(ouverte.id)}
            onFavori={() => basculerFavori(ouverte.id)}
            onAuJournal={(quantiteG) => {
              modifier((brouillon) => {
                brouillon.journal.push(entreeDeLaRecette(ouverte, { date: jourISO(), quantiteG }))
              })
            }}
          />
        )}
      </Feuille>
    </div>
  )
}

/* ──────────────────────────── Une ligne de liste ──────────────────────────── */

function LigneRecette({
  recette,
  bande,
  favori,
  dansLePanier,
  onOuvrir,
  onFavori,
  onPanier,
}: {
  recette: Recette
  bande: Bande
  favori: boolean
  dansLePanier: boolean
  onOuvrir: () => void
  onFavori: () => void
  onPanier: () => void
}) {
  const teinte = TEINTE_MOMENT[recette.moment]

  return (
    <Carte className="flex items-stretch gap-3 overflow-hidden">
      <button type="button" onClick={onOuvrir} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 text-left">
        <Vignette recette={recette} taille="petite" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">{recette.titre}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
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
            <span className="text-xs font-semibold text-ink-soft tnum">{recette.kcal} kcal</span>
            {recette.cuisine && (
              <span className="text-xs text-ink-faint">{LIBELLE_CUISINE[recette.cuisine]}</span>
            )}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 flex-col justify-center gap-1.5 py-3 pr-3">
        <button
          type="button"
          onClick={onFavori}
          aria-pressed={favori}
          aria-label={favori ? `Retirer ${recette.titre} des favoris` : `Mettre ${recette.titre} en favori`}
          className={classes(
            'grid size-9 place-items-center rounded-full border transition',
            favori
              ? 'border-alerte bg-alerte-wash text-alerte'
              : 'border-line text-ink-faint hover:border-alerte hover:text-alerte',
          )}
        >
          <Heart size={16} strokeWidth={2.4} fill={favori ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onPanier}
          aria-pressed={dansLePanier}
          aria-label={
            dansLePanier
              ? `Retirer ${recette.titre} du panier`
              : `Ajouter ${recette.titre} au panier de courses`
          }
          className={classes(
            'grid size-9 place-items-center rounded-full border transition',
            dansLePanier
              ? 'border-reussite bg-reussite text-white'
              : 'border-line text-ink-faint hover:border-primaire hover:text-primaire',
          )}
        >
          {dansLePanier ? (
            <Check size={16} strokeWidth={3} aria-hidden="true" />
          ) : (
            <ShoppingBasket size={15} aria-hidden="true" />
          )}
        </button>
      </div>
    </Carte>
  )
}

/**
 * L'image d'une recette.
 *
 * Aucune photo n'existe — voir `photo?` dans le type `Recette` — et une photo
 * d'emprunt promettrait un plat qu'on n'obtiendra pas. L'illustration générée
 * donne une vignette reconnaissable, stable d'un affichage à l'autre, sans rien
 * prétendre.
 */
function Vignette({ recette, taille }: { recette: Recette; taille: 'petite' | 'grande' }) {
  const { emoji, fond } = illustrationDe(recette)
  return (
    <span
      aria-hidden="true"
      className={classes(
        'grid shrink-0 place-items-center rounded-tile',
        fond,
        taille === 'petite' ? 'size-12 text-xl' : 'h-24 w-full text-5xl',
      )}
    >
      {emoji}
    </span>
  )
}

/* ────────────────────────────── Affiner ────────────────────────────── */

function FeuilleAffiner({
  criteres,
  bande,
  onCriteres,
  onBande,
  onEffacer,
  resultats,
}: {
  criteres: Criteres
  bande: Bande | null
  onCriteres: (c: Criteres) => void
  onBande: (b: Bande | null) => void
  onEffacer: () => void
  resultats: number
}) {
  const cuisines = useMemo(() => cuisinesDuCatalogue(), [])

  function basculerListe<T>(liste: T[] | undefined, valeur: T): T[] | undefined {
    const actuels = liste ?? []
    const suivants = actuels.includes(valeur)
      ? actuels.filter((v) => v !== valeur)
      : [...actuels, valeur]
    return suivants.length > 0 ? suivants : undefined
  }

  return (
    <div className="space-y-6">
      {/* Le compte est en tête : c'est lui qui dit si le filtre suivant va vider
          l'écran, et il évite de refermer la feuille pour aller voir. */}
      <p className="text-sm text-ink-soft tnum" role="status">
        {resultats} recette{resultats > 1 ? 's' : ''} pour ces critères.
      </p>

      <GroupeFiltre legende="Moment du repas">
        {MOMENTS.map((moment) => (
          <Puce
            key={moment}
            actif={criteres.moment === moment}
            onClick={() =>
              onCriteres({ ...criteres, moment: criteres.moment === moment ? null : moment })
            }
          >
            {LIBELLE_MOMENT[moment]}
          </Puce>
        ))}
      </GroupeFiltre>

      <GroupeFiltre
        legende="Charge du repas"
        aide="Calculé sur votre objectif du jour : « léger » tient largement dans le repas, « copieux » le dépasse."
      >
        {BANDES.map((b) => (
          <Puce key={b} actif={bande === b} onClick={() => onBande(bande === b ? null : b)}>
            {LIBELLE_BANDE[b]}
          </Puce>
        ))}
      </GroupeFiltre>

      <GroupeFiltre legende="Temps disponible">
        {TEMPS.map((minutes) => (
          <Puce
            key={minutes}
            actif={criteres.minutesMax === minutes}
            onClick={() =>
              onCriteres({
                ...criteres,
                minutesMax: criteres.minutesMax === minutes ? null : minutes,
              })
            }
          >
            {minutes} min ou moins
          </Puce>
        ))}
      </GroupeFiltre>

      <GroupeFiltre
        legende="Difficulté"
        aide="Déduite du nombre de gestes et du temps : « facile » veut dire peu de gestes, pas forcément rapide."
      >
        {DIFFICULTES.map((d) => (
          <Puce
            key={d}
            actif={criteres.difficulte === d}
            onClick={() =>
              onCriteres({ ...criteres, difficulte: criteres.difficulte === d ? null : d })
            }
          >
            {LIBELLE_DIFFICULTE[d]}
          </Puce>
        ))}
      </GroupeFiltre>

      <GroupeFiltre legende="Cuisine du monde">
        {cuisines.map((c) => (
          <Puce
            key={c}
            actif={criteres.cuisine === c}
            onClick={() => onCriteres({ ...criteres, cuisine: criteres.cuisine === c ? null : c })}
          >
            {LIBELLE_CUISINE[c]}
          </Puce>
        ))}
      </GroupeFiltre>

      <GroupeFiltre
        legende="Régime"
        aide="Seules les recettes explicitement vérifiées apparaissent : rien n’est déduit d’une liste d’ingrédients."
      >
        {REGIMES_FILTRABLES.map((r) => (
          <Puce
            key={r}
            actif={criteres.regimes?.includes(r) ?? false}
            onClick={() => onCriteres({ ...criteres, regimes: basculerListe(criteres.regimes, r) })}
          >
            {LIBELLE_REGIME[r]}
          </Puce>
        ))}
      </GroupeFiltre>

      <GroupeFiltre legende="Ce qu’il vous faut">
        {TAGS_FILTRABLES.map((tag) => (
          <Puce
            key={tag}
            actif={criteres.tags?.includes(tag) ?? false}
            onClick={() => onCriteres({ ...criteres, tags: basculerListe(criteres.tags, tag) })}
          >
            {LIBELLE_TAG[tag]}
          </Puce>
        ))}
      </GroupeFiltre>

      <Bouton ton="fantome" pleineLargeur onClick={onEffacer}>
        <X size={16} aria-hidden="true" />
        Tout effacer
      </Bouton>
    </div>
  )
}

function GroupeFiltre({
  legende,
  aide,
  children,
}: {
  legende: string
  aide?: string
  children: React.ReactNode
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
        {legende}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
      {aide && <p className="mt-2 text-xs text-ink-soft">{aide}</p>}
    </fieldset>
  )
}

function Puce({
  actif,
  onClick,
  children,
}: {
  actif: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={classes(
        'rounded-full border px-3.5 py-2 text-xs font-semibold transition',
        actif
          ? 'border-primaire bg-primaire text-white'
          : 'border-line bg-surface text-ink-soft hover:bg-sunken hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

/* ────────────────────────────── La fiche ────────────────────────────── */

function FicheRecette({
  recette,
  bande,
  favori,
  onFavori,
  onAuJournal,
  onCuisiner,
}: {
  recette: Recette
  bande: Bande
  favori: boolean
  onFavori: () => void
  onAuJournal: (quantiteG: number) => void
  onCuisiner: () => void
}) {
  const { etat, modifier } = useSession()
  const [convives, setConvives] = useState(1)
  const [ajoutes, setAjoutes] = useState(false)

  const ingredients = ingredientsPour(recette, convives)
  const macros = macrosPortion(recette)
  const regimes = regimesAAfficher(recette)
  const difficulte = difficulteDe(recette)

  /** Les ingrédients de la fiche, aux quantités affichées, versés sur la liste. */
  function auxCourses() {
    const ouverte = listesEnCours(etat.courses)[0] ?? null
    const cible = ouverte ?? nouvelleListe()

    modifier((brouillon) => {
      if (!ouverte) brouillon.courses.push(cible)
      const dans = brouillon.courses.find((l) => l.id === cible.id)
      if (!dans) return
      for (const ingredient of ingredients) {
        ajouterArticle(dans, {
          nom: ingredient.nom,
          quantite: ingredient.quantite,
          rayon: ingredient.rayon,
          origine: 'recette',
          recette: recette.titre,
        })
      }
    })
    setAjoutes(true)
  }

  return (
    <div className="space-y-6">
      <Vignette recette={recette} taille="grande" />

      {/* Le premier geste de la fiche : cuisiner. Il vient avant les chiffres —
          on ouvre une recette pour la faire, pas pour l'étudier. */}
      <Bouton pleineLargeur onClick={onCuisiner}>
        <ChefHat size={18} aria-hidden="true" />
        Cuisiner maintenant
      </Bouton>

      <div className="flex flex-wrap items-center gap-2">
        <EtiquetteBande bande={bande} />
        <Etiquette ton="neutre">{recette.minutes} min</Etiquette>
        <Etiquette ton="neutre">{LIBELLE_DIFFICULTE[difficulte]}</Etiquette>
        {recette.cuisine && <Etiquette ton="accent">{LIBELLE_CUISINE[recette.cuisine]}</Etiquette>}
        {recette.tags.includes('economique') && <Etiquette ton="reussite">Petit budget</Etiquette>}
        <button
          type="button"
          onClick={onFavori}
          aria-pressed={favori}
          className={classes(
            'ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            favori ? 'border-alerte bg-alerte-wash text-alerte' : 'border-line text-ink-soft hover:bg-sunken',
          )}
        >
          <Heart size={14} strokeWidth={2.4} fill={favori ? 'currentColor' : 'none'} aria-hidden="true" />
          {favori ? 'En favori' : 'Mettre de côté'}
        </button>
      </div>

      {regimes.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-2">
            {regimes.map((r) => (
              <Etiquette key={r} ton="reussite">
                {LIBELLE_REGIME[r]}
              </Etiquette>
            ))}
          </div>
          {/* Un « sans gluten » pris pour une garantie de fabricant, c'est un
              risque réel pour une personne cœliaque : la recette ne parle que de
              ses ingrédients, pas de ce qu'il y a dans le bocal acheté. */}
          {(regimes.includes('sans-gluten') || regimes.includes('sans-lactose')) && (
            <p className="mt-2 text-xs text-ink-soft">
              Vérifié sur les ingrédients de la recette. Les produits transformés (moutarde,
              bouillon, charcuterie, chocolat) demandent tout de même un coup d’œil à l’étiquette.
            </p>
          )}
        </div>
      )}

      {/* ── Pour combien de personnes ── */}
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
          <Users size={14} aria-hidden="true" />
          Je cuisine pour
        </h3>
        <div className="flex gap-1.5">
          {CONVIVES.map((n) => (
            <Puce key={n} actif={convives === n} onClick={() => setConvives(n)}>
              {n} personne{n > 1 ? 's' : ''}
            </Puce>
          ))}
        </div>
        {/* Le chiffre calorique ne bouge pas quand on cuisine pour quatre : c'est
            ce que mange une personne. Le dire évite de croire à un plat à
            1 880 kcal. */}
        <p className="mt-2 text-sm text-ink-soft tnum">
          {entier(recette.kcal)} kcal par personne, environ {macros.poidsG} g dans l’assiette.
        </p>
      </section>

      {/* ── Nutriments d'une part ── */}
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
          <Flame size={14} aria-hidden="true" />
          Une part apporte
        </h3>
        <ul className="grid grid-cols-4 gap-2">
          {[
            { libelle: 'Protéines', valeur: macros.proteines },
            { libelle: 'Glucides', valeur: macros.glucides },
            { libelle: 'Lipides', valeur: macros.lipides },
            { libelle: 'Fibres', valeur: macros.fibres },
          ].map((macro) => (
            <li key={macro.libelle} className="rounded-tile bg-sunken px-2 py-2.5 text-center">
              <span className="block font-display text-lg font-semibold text-ink tnum">
                {macro.valeur} g
              </span>
              <span className="block text-[0.6875rem] text-ink-soft">{macro.libelle}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-soft">
          Estimation : le catalogue ne connaît que les calories, les macros sont déduites de ce que
          le plat couvre dans l’assiette. Aucun Nutri-Score n’en est tiré.
        </p>
      </section>

      <AuJournal recette={recette} onAjouter={onAuJournal} />

      {/* ── Ingrédients ── */}
      <section>
        <h3 className="mb-2 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
          Ingrédients {convives > 1 && <span className="text-ink-soft">pour {convives}</span>}
        </h3>
        <ul className="divide-y divide-line">
          {ingredients.map((i) => (
            <li key={i.nom} className="flex justify-between gap-4 py-2.5 text-sm">
              <span className="text-ink">{i.nom}</span>
              <span className="shrink-0 font-semibold text-ink-soft tnum">{i.quantite}</span>
            </li>
          ))}
        </ul>
        <Bouton ton="doux" pleineLargeur className="mt-3" onClick={auxCourses} disabled={ajoutes}>
          <ShoppingBasket size={16} aria-hidden="true" />
          {ajoutes ? 'Ajouté à ma liste de courses' : 'Ajouter à ma liste de courses'}
        </Bouton>
      </section>

      {/* ── Préparation ── */}
      <section>
        <h3 className="mb-2 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
          Préparation
        </h3>
        <ol className="space-y-3">
          {recette.etapes.map((etape, i) => (
            <li key={etape} className="flex gap-3 text-sm text-ink">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primaire-wash text-xs font-bold text-primaire tnum">
                {i + 1}
              </span>
              <span className="pt-0.5">{etape}</span>
            </li>
          ))}
        </ol>
        {convives > 1 && (
          <p className="mt-2 text-xs text-ink-soft">
            Les temps de cuisson ne se multiplient pas : comptez seulement quelques minutes de plus
            si la poêle est chargée.
          </p>
        )}
      </section>

      {recette.substitutions && recette.substitutions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
            Si vous n’avez pas tout
          </h3>
          <ul className="space-y-2">
            {recette.substitutions.map((s) => (
              <li key={s.ingredient} className="rounded-tile bg-sunken px-3.5 py-3 text-sm">
                <span className="font-semibold text-ink">{s.ingredient}</span>
                <span className="text-ink-soft"> → {s.par}</span>
                {s.effet && <span className="mt-0.5 block text-xs text-ink-faint">{s.effet}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recette.appareils && recette.appareils.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
            Avec l’appareil que vous avez
          </h3>
          <ul className="space-y-2">
            {recette.appareils.map((a) => (
              <li key={a.appareil} className="rounded-tile bg-sunken px-3.5 py-3 text-sm">
                <span className="block font-semibold text-ink">{a.appareil}</span>
                <span className="text-ink-soft">{a.instructions}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(recette.conservation || recette.rechauffage) && (
        <section>
          <h3 className="mb-2 text-sm font-bold tracking-[0.12em] text-ink-faint uppercase">
            Se garde et se réchauffe
          </h3>
          {recette.conservation && (
            <p className="flex items-start gap-2 text-sm text-ink">
              <Refrigerator size={15} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
              Se garde {recette.conservation}.
            </p>
          )}
          {recette.rechauffage && (
            <p className="mt-1.5 flex items-start gap-2 text-sm text-ink-soft">
              <Flame size={15} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
              {recette.rechauffage}
            </p>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {recette.couvre.map((c) => (
          <Etiquette key={c} ton="reussite">
            {LIBELLE_CATEGORIE[c]}
          </Etiquette>
        ))}
        {recette.tags.map((t) => (
          <Etiquette key={t} ton="primaire">
            {LIBELLE_TAG[t]}
          </Etiquette>
        ))}
      </div>

      {recette.astuce && (
        <p className="rounded-tile bg-accent-wash px-4 py-3.5 text-sm text-ink">
          <strong className="font-semibold text-accent">Le truc en plus — </strong>
          {recette.astuce}
        </p>
      )}
    </div>
  )
}

/* ────────────────────────── Le panier de recettes ────────────────────────── */

/**
 * L'aperçu du panier de recettes — un brouillon, pas la liste qu'on emporte.
 *
 * Le cochage ici est volontairement local : c'est `/app/courses` qui tient la
 * liste enregistrée, et deux cochages persistés pour la même chose se
 * contrediraient. D'où le bouton de versement, qui fait passer ce brouillon
 * dans la vraie liste.
 */
function ApercuCourses({
  panier,
  onCuisiner,
}: {
  panier: string[]
  onCuisiner: () => void
}) {
  const { etat, modifier } = useSession()
  const [pris, setPris] = useState<string[]>([])
  const [verse, setVerse] = useState(0)
  const groupes = listeDeCourses(panier)

  function basculer(nom: string) {
    setPris((p) => (p.includes(nom) ? p.filter((x) => x !== nom) : [...p, nom]))
  }

  function verserDansMaListe() {
    const propositions = propositionsDeRecettes(panier, etat.stocks, null)
    const ouverte = listesEnCours(etat.courses)[0] ?? null
    const cible = ouverte ?? nouvelleListe()

    modifier((brouillon) => {
      if (!ouverte) brouillon.courses.push(cible)
      const dans = brouillon.courses.find((l) => l.id === cible.id)
      if (dans) verser(dans, propositions, 'recette')
    })
    setVerse(propositions.length)
  }

  return (
    <div className="space-y-6">
      {panier.length === 0 ? (
        <Carte>
          <EtatVide
            emoji="🧺"
            titre="Votre panier est vide"
            action={
              <Lien vers="/app/courses">
                <Bouton ton="doux">
                  <ShoppingBasket size={16} aria-hidden="true" />
                  Ouvrir ma liste de courses
                </Bouton>
              </Lien>
            }
          >
            Cochez le panier d’une recette : ses ingrédients viendront se ranger ici par rayon, prêts
            à verser dans votre liste.
          </EtatVide>
        </Carte>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            {panier.length} recette{panier.length > 1 ? 's' : ''} —{' '}
            {panier.map((id) => recetteParId(id)?.titre).filter(Boolean).join(', ')}
          </p>

          <Carte className="space-y-3 px-5 py-4">
            {/* Le panier sert à grouper des recettes : c'est exactement ce qu'est
                une séance de batch cooking. Les cuisiner ensemble se propose donc
                ici, à côté du versement en courses. */}
            <Bouton ton="accent" pleineLargeur onClick={onCuisiner}>
              <ChefHat size={17} aria-hidden="true" />
              Cuisiner {panier.length > 1 ? `ces ${panier.length} recettes` : 'cette recette'}
            </Bouton>
            <Bouton pleineLargeur onClick={verserDansMaListe}>
              <ShoppingBasket size={17} aria-hidden="true" />
              Verser dans ma liste de courses
            </Bouton>
            {verse > 0 && (
              <p className="text-sm text-reussite" role="status">
                {verse} produit{verse > 1 ? 's' : ''} ajouté{verse > 1 ? 's' : ''} — les quantités
                déjà présentes ont été cumulées.
              </p>
            )}
            <Lien vers="/app/courses" className="block">
              <Bouton ton="fantome" pleineLargeur>
                Ouvrir ma liste
                <ChevronRight size={16} aria-hidden="true" />
              </Bouton>
            </Lien>
          </Carte>

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
          coche ? 'border-reussite bg-reussite text-white' : 'border-line',
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
