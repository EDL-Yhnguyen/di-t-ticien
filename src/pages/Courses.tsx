import { useMemo, useState } from 'react'
import {
  Barcode,
  CalendarDays,
  Check,
  ChefHat,
  CheckCheck,
  History,
  Package,
  Plus,
  ReceiptText,
  Refrigerator,
  RotateCcw,
  ShoppingBasket,
  Snowflake,
  Trash2,
} from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Scanner } from '../components/Scanner'
import { Bouton, Carte, Champ, EtatVide, Etiquette, Feuille, TitreSection } from '../components/ui'
import {
  EMPLACEMENT_PAR_RAYON,
  ajouterArticle,
  articleStockDepuis,
  articlesDuRayon,
  bilanListe,
  clore,
  copieDeListe,
  listesCloses,
  listesEnCours,
  nouvelleListe,
  planDejaVerse,
  propositionsDuPlacard,
  propositionsDuPlan,
  verser,
} from '../lib/courses'
import type { PropositionCourse } from '../lib/courses'
import { planDeLaDate } from '../lib/menu'
import { parCodeBarres } from '../lib/openfoodfacts'
import { Lien } from '../lib/router'
import type { AgregatPrix, ArticleCourse, Emplacement, ListeCourses, Rayon } from '../lib/types'
import { EMPLACEMENTS, LIBELLE_EMPLACEMENT, RAYONS } from '../lib/types'
import { chiffrerListe, enseignesInteressantes } from '../lib/prix/panier'
import { enseigneParId } from '../lib/ticket/enseignes'
import { classes, dateCourte, nombre } from '../lib/utils'

const ICONE_EMPLACEMENT = {
  frigo: Refrigerator,
  placard: Package,
  congelateur: Snowflake,
} as const

/** Ce qu'on verse, et depuis quelle source. */
type Versement = 'semaine' | 'placard'

export function Courses() {
  const { etat, modifier } = useSession()
  const [choisie, setChoisie] = useState<string | null>(null)
  const [saisie, setSaisie] = useState(false)
  const [versement, setVersement] = useState<Versement | null>(null)
  const [retour, setRetour] = useState(false)
  const [historique, setHistorique] = useState(false)

  const ouvertes = useMemo(() => listesEnCours(etat.courses), [etat.courses])
  const closes = useMemo(() => listesCloses(etat.courses), [etat.courses])

  // La liste choisie à la main l'emporte, sinon la plus récente : après une
  // clôture, l'écran ne doit pas rester braqué sur une liste qui n'existe plus.
  const liste = ouvertes.find((l) => l.id === choisie) ?? ouvertes[0] ?? null
  const bilan = liste ? bilanListe(liste) : null

  /** Toutes les écritures passent par ici : la liste courante, mutée sur place. */
  function surListe(recette: (l: ListeCourses) => void) {
    if (!liste) return
    modifier((brouillon) => {
      const cible = brouillon.courses.find((l) => l.id === liste.id)
      if (cible) recette(cible)
    })
  }

  function creer(nom?: string) {
    const fraiche = nouvelleListe(nom)
    modifier((brouillon) => {
      brouillon.courses.push(fraiche)
    })
    setChoisie(fraiche.id)
    return fraiche
  }

  function basculerPris(id: string) {
    surListe((l) => {
      const article = l.articles.find((a) => a.id === id)
      if (article) article.pris = !article.pris
    })
  }

  function supprimer(id: string) {
    surListe((l) => {
      l.articles = l.articles.filter((a) => a.id !== id)
    })
  }

  /**
   * Ranger les courses cochées dans le garde-manger, puis clore la liste.
   *
   * Les deux gestes n'en font qu'un dans la vraie vie : on vide les sacs en
   * rentrant. Les séparer obligerait à revenir clore une liste dont on n'a plus
   * rien à faire, et on se retrouverait avec quatre listes ouvertes.
   */
  function rentrer(rangements: { article: ArticleCourse; emplacement: Emplacement }[]) {
    modifier((brouillon) => {
      const cible = brouillon.courses.find((l) => l.id === liste?.id)
      if (!cible) return
      for (const { article, emplacement } of rangements) {
        brouillon.stocks.push(articleStockDepuis(article, emplacement))
      }
      clore(cible)
    })
    setRetour(false)
    setChoisie(null)
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-2xl font-semibold text-ink">Mes courses</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Une liste rangée par rayon, qui se coche au magasin et se retrouve au retour.
        </p>
      </header>

      {liste === null ? (
        <Carte className="animate-rise" style={{ animationDelay: '60ms' }}>
          <EtatVide
            emoji="🧺"
            titre="Aucune liste en cours"
            action={
              <Bouton onClick={() => creer()}>
                <Plus size={17} aria-hidden="true" />
                Commencer une liste
              </Bouton>
            }
          >
            Votre semaine de menus, votre placard et vos ajouts à la main viennent s’y ranger dans
            l’ordre où l’on traverse le magasin.
          </EtatVide>
        </Carte>
      ) : (
        <>
          <EnTeteListe
            liste={liste}
            bilan={bilan!}
            onAjouter={() => setSaisie(true)}
            onVerserSemaine={() => setVersement('semaine')}
            onVerserPlacard={() => setVersement('placard')}
            onRetour={() => setRetour(true)}
          />

          {ouvertes.length > 1 && (
            <section className="animate-rise" style={{ animationDelay: '90ms' }}>
              <div
                className="flex flex-wrap gap-1.5"
                role="tablist"
                aria-label="Mes listes ouvertes"
              >
                {ouvertes.map((l) => {
                  const actif = l.id === liste.id
                  const reste = l.articles.filter((a) => !a.pris).length
                  return (
                    <button
                      key={l.id}
                      type="button"
                      role="tab"
                      aria-selected={actif}
                      onClick={() => setChoisie(l.id)}
                      className={classes(
                        'rounded-full px-3.5 py-2 text-xs font-semibold transition',
                        actif
                          ? 'bg-primaire text-white'
                          : 'bg-surface text-ink-soft hover:bg-sunken hover:text-ink',
                      )}
                    >
                      {l.nom} <span className="tnum">({reste})</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {liste.articles.length === 0 ? (
            <Carte className="animate-rise" style={{ animationDelay: '120ms' }}>
              <EtatVide
                emoji="🥕"
                titre="La liste est vide"
                action={
                  <Bouton ton="doux" onClick={() => setVersement('semaine')}>
                    <CalendarDays size={17} aria-hidden="true" />
                    Verser ma semaine
                  </Bouton>
                }
              >
                Versez les ingrédients de vos menus, les indispensables du placard, ou ajoutez un
                produit à la main.
              </EtatVide>
            </Carte>
          ) : (
            <section className="animate-rise space-y-5" style={{ animationDelay: '120ms' }}>
              <CoutEstime articles={liste.articles} agregats={etat.prix} />

              {bilan!.rayonsRemplis.map((rayon) => {
                const reste = articlesDuRayon(liste, rayon).filter((a) => !a.pris).length
                return (
                  <div key={rayon}>
                    {/* « 0 à prendre » se lit deux fois avant d'être compris ;
                      « rayon fait » se voit d'un coup d'œil en marchant. */}
                    <TitreSection eyebrow={reste === 0 ? 'Rayon fait' : `${reste} à prendre`}>
                      {rayon}
                    </TitreSection>
                    <Carte className="divide-y divide-line">
                      {articlesDuRayon(liste, rayon).map((article) => (
                        <LigneArticle
                          key={article.id}
                          article={article}
                          onBasculer={() => basculerPris(article.id)}
                          onSupprimer={() => supprimer(article.id)}
                        />
                      ))}
                    </Carte>
                  </div>
                )
              })}
            </section>
          )}
        </>
      )}

      {/* ── Les autres listes ── */}
      <section className="animate-rise" style={{ animationDelay: '180ms' }}>
        <Carte className="divide-y divide-line">
          <button
            type="button"
            onClick={() => creer(ouvertes.length > 0 ? `Liste ${ouvertes.length + 1}` : undefined)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-sunken"
          >
            <Plus size={18} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Nouvelle liste</span>
            <span className="text-xs text-ink-faint">
              {ouvertes.length === 0 ? 'aucune en cours' : `${ouvertes.length} en cours`}
            </span>
          </button>
          {closes.length > 0 && (
            <button
              type="button"
              onClick={() => setHistorique(true)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-sunken"
            >
              <History size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
              <span className="flex-1 font-medium text-ink">Mes courses passées</span>
              <span className="text-xs text-ink-faint tnum">{closes.length}</span>
            </button>
          )}
          <Lien
            vers="/app/garde-manger"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <Refrigerator size={18} className="shrink-0 text-reussite" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mon garde-manger</span>
          </Lien>
        </Carte>
        {/* On ne fait pas ses courses en une fois : le marché du samedi et le
            drive de la semaine ne se cochent pas ensemble. */}
        <p className="mt-2 px-1 text-xs text-ink-soft">
          Plusieurs listes peuvent rester ouvertes en même temps — une par magasin, par exemple.
        </p>
      </section>

      <Feuille ouvert={saisie} titre="Ajouter un produit" onFermer={() => setSaisie(false)}>
        <FormulaireAjout
          onValider={(ajout) => {
            const cible = liste ?? creer()
            modifier((brouillon) => {
              const dans = brouillon.courses.find((l) => l.id === cible.id)
              if (dans) ajouterArticle(dans, ajout)
            })
            setSaisie(false)
          }}
        />
      </Feuille>

      <Feuille
        ouvert={versement !== null}
        titre={versement === 'placard' ? 'Le placard du plan' : 'Ma semaine de menus'}
        onFermer={() => setVersement(null)}
      >
        {versement !== null && (
          <FeuilleVersement
            source={versement}
            onVerser={(retenues) => {
              const cible = liste ?? creer()
              modifier((brouillon) => {
                const dans = brouillon.courses.find((l) => l.id === cible.id)
                if (!dans) return
                verser(
                  dans,
                  retenues,
                  versement === 'placard' ? 'placard' : 'recette',
                  // La semaine en cours, celle qui contient aujourd'hui : c'est
                  // celle dont on fait les courses. Les semaines suivantes se
                  // versent depuis l'écran des menus, où on les voit.
                  versement === 'semaine' ? planDeLaDate(brouillon.plans) : undefined,
                )
              })
              setVersement(null)
            }}
          />
        )}
      </Feuille>

      <Feuille ouvert={retour} titre="Retour de courses" onFermer={() => setRetour(false)}>
        {liste && <FeuilleRetour liste={liste} onRanger={rentrer} />}
      </Feuille>

      <Feuille
        ouvert={historique}
        titre="Mes courses passées"
        onFermer={() => setHistorique(false)}
      >
        <FeuilleHistorique
          listes={closes}
          onRefaire={(source) => {
            const copie = copieDeListe(source)
            modifier((brouillon) => {
              brouillon.courses.push(copie)
            })
            setChoisie(copie.id)
            setHistorique(false)
          }}
        />
      </Feuille>
    </div>
  )
}

/* ─────────────────────────────── En-tête ─────────────────────────────── */

function EnTeteListe({
  liste,
  bilan,
  onAjouter,
  onVerserSemaine,
  onVerserPlacard,
  onRetour,
}: {
  liste: ListeCourses
  bilan: { total: number; pris: number; restants: number }
  onAjouter: () => void
  onVerserSemaine: () => void
  onVerserPlacard: () => void
  onRetour: () => void
}) {
  const part = bilan.total === 0 ? 0 : Math.round((bilan.pris / bilan.total) * 100)

  return (
    <Carte className="animate-rise overflow-hidden" style={{ animationDelay: '60ms' }}>
      <div className="bg-linear-to-b from-bandeau-haut to-bandeau-bas px-5 py-6">
        <p className="text-xs font-bold tracking-[0.14em] text-white/70 uppercase">{liste.nom}</p>
        <p className="mt-1 flex items-baseline gap-2.5">
          <span className="font-display text-5xl font-semibold text-white tnum">
            {bilan.restants}
          </span>
          <span className="text-base font-medium text-white/80">
            produit{bilan.restants > 1 ? 's' : ''} à prendre
          </span>
        </p>
        <p className="mt-1.5 text-sm text-white/75 tnum">
          {bilan.total === 0
            ? 'Rien de noté pour l’instant.'
            : `${bilan.pris} sur ${bilan.total} déjà dans le caddie`}
        </p>
        {bilan.total > 0 && (
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25"
            role="progressbar"
            aria-valuenow={part}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avancement des courses"
          >
            <div
              className="h-full rounded-full bg-white transition-[width]"
              style={{ width: `${part}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid gap-2.5 px-5 py-4 sm:grid-cols-2">
        <Bouton pleineLargeur onClick={onAjouter}>
          <Plus size={18} aria-hidden="true" />
          Ajouter un produit
        </Bouton>
        <Bouton ton="doux" pleineLargeur onClick={onVerserSemaine}>
          <CalendarDays size={18} aria-hidden="true" />
          Verser ma semaine
        </Bouton>
        <Bouton ton="doux" pleineLargeur onClick={onVerserPlacard}>
          <ChefHat size={18} aria-hidden="true" />
          Le placard
        </Bouton>
        {/* Le retour n'a de sens qu'une fois quelque chose de coché : ranger une
            liste vide dans le garde-manger n'y mettrait rien. */}
        <Bouton ton="doux" pleineLargeur onClick={onRetour} disabled={bilan.pris === 0}>
          <CheckCheck size={18} aria-hidden="true" />
          Retour de courses
        </Bouton>
      </div>
    </Carte>
  )
}

/* ──────────────────────────────── Lignes ──────────────────────────────── */

function LigneArticle({
  article,
  onBasculer,
  onSupprimer,
}: {
  article: ArticleCourse
  onBasculer: () => void
  onSupprimer: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <button
        type="button"
        onClick={onBasculer}
        aria-pressed={article.pris}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={classes(
            'grid size-6 shrink-0 place-items-center rounded-lg border-2 transition',
            article.pris ? 'border-reussite bg-reussite text-white' : 'border-line',
          )}
        >
          {article.pris && <Check size={14} strokeWidth={3.5} aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={classes(
              'block truncate font-medium',
              article.pris ? 'text-ink-faint line-through' : 'text-ink',
            )}
          >
            {article.nom}
          </span>
          {/* Dire d'où sort la ligne : « 3 oignons » qu'on ne se souvient pas
              d'avoir écrits a l'air d'une erreur et se fait supprimer, alors
              que c'est le dîner de jeudi qui les demande. */}
          {article.recettes.length > 0 && (
            <span className="block truncate text-xs text-ink-faint">
              {article.recettes.join(' · ')}
            </span>
          )}
        </span>
      </button>
      <span
        className={classes(
          'shrink-0 text-xs font-semibold tnum',
          article.pris ? 'text-ink-faint' : 'text-ink-soft',
        )}
      >
        {article.quantite}
      </span>
      <button
        type="button"
        onClick={onSupprimer}
        aria-label={`Retirer ${article.nom} de la liste`}
        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-sunken hover:text-alerte"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

/* ─────────────────────────── Ajouter à la main ─────────────────────────── */

function FormulaireAjout({
  onValider,
}: {
  onValider: (ajout: { nom: string; quantite: string; rayon: Rayon; origine: 'manuel' }) => void
}) {
  const [nom, setNom] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [rayon, setRayon] = useState<Rayon>('Fruits et légumes')
  const [scan, setScan] = useState(false)
  const [recherche, setRecherche] = useState<'idle' | 'encours' | 'echec'>('idle')

  async function surCode(code: string) {
    setScan(false)
    setRecherche('encours')
    try {
      const aliment = await parCodeBarres(code)
      if (aliment) {
        setNom([aliment.marque, aliment.nom].filter(Boolean).join(' '))
        setRecherche('idle')
      } else {
        setRecherche('echec')
      }
    } catch {
      setRecherche('echec')
    }
  }

  if (scan) return <Scanner onCode={surCode} onSaisieManuelle={() => setScan(false)} />

  return (
    <div className="space-y-5">
      <Champ
        id="course-nom"
        label="Produit"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Yaourts nature, papier cuisson…"
        autoFocus
      />

      {recherche === 'echec' && (
        <p className="text-sm text-alerte">
          Ce code-barres n’est pas dans Open Food Facts. Écrivez le nom à la main.
        </p>
      )}

      {/* Le même chemin que le garde-manger : on scanne ce qu'on a fini pour le
          remettre sur la liste, geste le plus fréquent devant le frigo. */}
      <Bouton
        ton="doux"
        pleineLargeur
        onClick={() => setScan(true)}
        disabled={recherche === 'encours'}
      >
        <Barcode size={18} aria-hidden="true" />
        {recherche === 'encours' ? 'Recherche…' : 'Scanner le code-barres'}
      </Bouton>

      <Champ
        id="course-quantite"
        label="Quantité"
        value={quantite}
        onChange={(e) => setQuantite(e.target.value)}
        placeholder="2, 500 g, 1 bocal…"
      />

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Rayon</legend>
        <div className="flex flex-wrap gap-2">
          {RAYONS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === rayon}
              onClick={() => setRayon(r)}
              className={classes(
                'rounded-full border px-3.5 py-2 text-sm font-semibold transition',
                r === rayon
                  ? 'border-primaire bg-primaire text-white'
                  : 'border-line bg-surface text-ink-soft hover:bg-sunken',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>

      <Bouton
        pleineLargeur
        disabled={nom.trim().length === 0}
        onClick={() => onValider({ nom, quantite, rayon, origine: 'manuel' })}
      >
        Ajouter à la liste
      </Bouton>
    </div>
  )
}

/* ────────────────────────────── Versement ────────────────────────────── */

function FeuilleVersement({
  source,
  onVerser,
}: {
  source: Versement
  onVerser: (retenues: PropositionCourse[]) => void
}) {
  const { etat } = useSession()
  const liste = listesEnCours(etat.courses)[0] ?? null
  const plan = planDeLaDate(etat.plans) ?? null

  const propositions = useMemo(
    () =>
      source === 'placard'
        ? propositionsDuPlacard(etat.stocks, liste)
        : plan
          ? propositionsDuPlan(plan, etat.stocks, liste)
          : [],
    [source, plan, etat.stocks, liste],
  )

  /**
   * Ce qu'on a déjà ne se rachète pas : les produits couverts par le
   * garde-manger et ceux déjà sur la liste arrivent décochés. Ils restent
   * **visibles et cochables** — le rapprochement des noms se trompe parfois, et
   * il reste aussi le cas du fond de bouteille qui ne fera pas la semaine.
   */
  const [ecartes, setEcartes] = useState<string[]>(() =>
    propositions.filter((p) => p.enStock || p.dejaDansListe).map((p) => p.ingredient.nom),
  )

  const retenues = propositions.filter((p) => !ecartes.includes(p.ingredient.nom))
  const dejaVerse =
    source === 'semaine' && plan !== null && liste !== null && planDejaVerse(liste, plan)

  if (source === 'semaine' && !plan) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-ink-soft">
          Aucune semaine de menus n’est composée pour l’instant : il n’y a donc pas d’ingrédients à
          verser.
        </p>
        <Lien vers="/app/menus" className="block">
          <Bouton pleineLargeur>
            <CalendarDays size={17} aria-hidden="true" />
            Composer ma semaine
          </Bouton>
        </Lien>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        {source === 'placard'
          ? 'Les indispensables du plan, à avoir en permanence.'
          : 'Les ingrédients des sept jours, cumulés. Décochez ce que vous avez déjà.'}
      </p>

      {dejaVerse && (
        <p className="rounded-tile bg-accent-wash px-4 py-3 text-sm text-ink">
          <strong className="font-semibold text-accent">Déjà versée — </strong>
          cette semaine a déjà été ajoutée à la liste. Verser à nouveau doublera les quantités.
        </p>
      )}

      <ul className="divide-y divide-line">
        {propositions.map((p) => {
          const retenu = !ecartes.includes(p.ingredient.nom)
          return (
            <li key={p.ingredient.nom}>
              <button
                type="button"
                aria-pressed={retenu}
                onClick={() =>
                  setEcartes((actuels) =>
                    retenu
                      ? [...actuels, p.ingredient.nom]
                      : actuels.filter((n) => n !== p.ingredient.nom),
                  )
                }
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <span
                  className={classes(
                    'grid size-6 shrink-0 place-items-center rounded-lg border-2 transition',
                    retenu ? 'border-reussite bg-reussite text-white' : 'border-line',
                  )}
                >
                  {retenu && <Check size={14} strokeWidth={3.5} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={classes(
                      'block truncate text-sm font-medium',
                      retenu ? 'text-ink' : 'text-ink-faint',
                    )}
                  >
                    {p.ingredient.nom}
                  </span>
                  {/* L'article qui a produit la correspondance est toujours
                      nommé : c'est ce qui rend une erreur de rapprochement
                      inoffensive. */}
                  {p.enStock && (
                    <span className="block truncate text-xs text-reussite">
                      déjà au {LIBELLE_EMPLACEMENT[p.enStock.emplacement].toLowerCase()} :{' '}
                      {p.enStock.nom}
                    </span>
                  )}
                  {!p.enStock && p.dejaDansListe && (
                    <span className="block text-xs text-ink-faint">déjà sur la liste</span>
                  )}
                  {!p.enStock && !p.dejaDansListe && p.recettes.length > 0 && (
                    <span className="block truncate text-xs text-ink-faint">
                      {p.recettes.join(' · ')}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs font-semibold text-ink-soft tnum">
                  {p.ingredient.quantite}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <Bouton pleineLargeur disabled={retenues.length === 0} onClick={() => onVerser(retenues)}>
        <ShoppingBasket size={17} aria-hidden="true" />
        {retenues.length === 0
          ? 'Rien à ajouter'
          : `Ajouter ${retenues.length} produit${retenues.length > 1 ? 's' : ''}`}
      </Bouton>
    </div>
  )
}

/* ───────────────────────────── Retour de courses ───────────────────────────── */

function FeuilleRetour({
  liste,
  onRanger,
}: {
  liste: ListeCourses
  onRanger: (rangements: { article: ArticleCourse; emplacement: Emplacement }[]) => void
}) {
  const pris = liste.articles.filter((a) => a.pris)

  // Le rayon donne un premier rangement, que l'on corrige ligne à ligne : les
  // pommes de terre et la salade sortent du même rayon et ne vont pas au même
  // endroit, et aucune règle ne devinera ça.
  const [lieux, setLieux] = useState<Record<string, Emplacement | 'ignorer'>>(() =>
    Object.fromEntries(pris.map((a) => [a.id, EMPLACEMENT_PAR_RAYON[a.rayon]])),
  )

  const ranges = pris.filter((a) => lieux[a.id] !== 'ignorer')

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        Ce que vous avez pris entre au garde-manger, puis la liste part à l’historique.
      </p>

      <ul className="space-y-3">
        {pris.map((article) => (
          <li key={article.id} className="rounded-tile bg-sunken px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                {article.nom}
              </span>
              <span className="shrink-0 text-xs font-semibold text-ink-soft tnum">
                {article.quantite}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EMPLACEMENTS.map((e) => {
                const Icone = ICONE_EMPLACEMENT[e]
                const actif = lieux[article.id] === e
                return (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => setLieux((l) => ({ ...l, [article.id]: e }))}
                    className={classes(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      actif
                        ? 'border-primaire bg-primaire text-white'
                        : 'border-line bg-surface text-ink-soft hover:bg-sunken',
                    )}
                  >
                    <Icone size={13} aria-hidden="true" />
                    {LIBELLE_EMPLACEMENT[e]}
                  </button>
                )
              })}
              <button
                type="button"
                aria-pressed={lieux[article.id] === 'ignorer'}
                onClick={() => setLieux((l) => ({ ...l, [article.id]: 'ignorer' }))}
                className={classes(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  lieux[article.id] === 'ignorer'
                    ? 'border-alerte bg-alerte text-white'
                    : 'border-line bg-surface text-ink-faint hover:bg-sunken',
                )}
              >
                Ne pas ranger
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Une liste de courses ne sait pas ce qui est imprimé sur l'emballage :
          inventer une DLC donnerait une fausse sécurité, alors que c'est
          précisément ce que le garde-manger cherche à éviter. */}
      <p className="rounded-tile bg-accent-wash px-4 py-3 text-sm text-ink">
        <strong className="font-semibold text-accent">Les dates restent à noter — </strong>
        les courses ne les connaissent pas. Ouvrez le garde-manger pour ajouter une date limite là
        où elle compte.
      </p>

      <Bouton
        pleineLargeur
        onClick={() =>
          onRanger(
            ranges.map((article) => ({
              article,
              emplacement: lieux[article.id] as Emplacement,
            })),
          )
        }
      >
        <CheckCheck size={17} aria-hidden="true" />
        Ranger {ranges.length} produit{ranges.length > 1 ? 's' : ''} et clore la liste
      </Bouton>
    </div>
  )
}

/* ─────────────────────────────── Historique ─────────────────────────────── */

function FeuilleHistorique({
  listes,
  onRefaire,
}: {
  listes: ListeCourses[]
  onRefaire: (liste: ListeCourses) => void
}) {
  if (listes.length === 0) {
    return <p className="text-sm text-ink-soft">Aucune liste close pour l’instant.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Les semaines se ressemblent : refaire une liste passée évite de tout ressaisir.
      </p>
      <ul className="space-y-3">
        {listes.map((liste) => (
          <li key={liste.id} className="rounded-tile bg-sunken px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{liste.nom}</span>
                <span className="block text-xs text-ink-soft tnum">
                  {liste.clotureeLe && dateCourte(liste.clotureeLe.slice(0, 10))} ·{' '}
                  {liste.articles.length} produit
                  {liste.articles.length > 1 ? 's' : ''}
                </span>
              </span>
              <Etiquette ton="neutre">Close</Etiquette>
            </div>
            <Bouton ton="doux" pleineLargeur className="mt-3" onClick={() => onRefaire(liste)}>
              <RotateCcw size={16} aria-hidden="true" />
              Refaire cette liste
            </Bouton>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Ce que la liste va coûter, d'après les tickets déjà lus.
 *
 * **C'est un plancher, pas une prévision.** Les lignes qu'on ne sait pas
 * chiffrer sont comptées et annoncées plutôt que devinées : un total à 62 €
 * qui en fait 90 en caisse fait perdre confiance dans tout le reste, là où
 * « au moins 45 €, six lignes non chiffrées » reste vrai et se complète tout
 * seul à mesure qu'on photographie des tickets.
 */
function CoutEstime({
  articles,
  agregats,
}: {
  articles: ArticleCourse[]
  agregats: AgregatPrix[]
}) {
  const bilan = useMemo(() => chiffrerListe(articles, agregats), [articles, agregats])
  const ailleurs = useMemo(() => enseignesInteressantes(bilan).slice(0, 2), [bilan])

  // Rien de connu : on ne montre pas une carte vide, on explique d'où viendrait
  // le chiffre. C'est aussi l'endroit où l'on découvre que la lecture de
  // tickets existe.
  if (bilan.chiffrees === 0) {
    return (
      <Carte className="flex items-start gap-3 p-4">
        <ReceiptText size={18} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
        <p className="text-sm text-ink-soft">
          Aucun de ces produits n’est encore dans votre historique.{' '}
          <Lien vers="/app/ticket" className="font-semibold text-primaire underline underline-offset-2">
            Photographiez un ticket
          </Lien>{' '}
          et cette liste s’affichera chiffrée.
        </p>
      </Carte>
    )
  }

  return (
    <Carte ton="accent" className="p-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-ink-soft">
          {bilan.nonChiffrees > 0 ? 'Au moins' : 'Coût estimé'}
        </span>
        <span className="font-display text-3xl font-semibold text-ink tnum">
          {nombre(bilan.total, 2)} €
        </span>
      </div>

      <p className="mt-2 text-sm text-ink-soft">
        {bilan.nonChiffrees === 0 ? (
          <>
            D’après vos derniers prix, sur <span className="tnum">{bilan.chiffrees}</span> produits.
          </>
        ) : (
          <>
            <span className="tnum">{bilan.chiffrees}</span> produit
            {bilan.chiffrees > 1 ? 's' : ''} chiffré{bilan.chiffrees > 1 ? 's' : ''} d’après vos
            derniers prix. <span className="tnum">{bilan.nonChiffrees}</span> ligne
            {bilan.nonChiffrees > 1 ? 's' : ''} sans prix connu — le total réel sera plus élevé.
          </>
        )}
      </p>

      {ailleurs.length > 0 && (
        <div className="mt-4 border-t border-accent/20 pt-3">
          <p className="text-sm text-ink-soft">
            Vous avez déjà payé certains de ces produits moins cher :
          </p>
          <ul className="mt-2 space-y-1.5">
            {ailleurs.map(({ enseigne, economie }) => (
              <li key={enseigne} className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">{enseigneParId(enseigne)?.nom ?? '—'}</span>
                <span className="font-semibold text-reussite tnum">
                  −{nombre(economie, 2)} €
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Carte>
  )
}
