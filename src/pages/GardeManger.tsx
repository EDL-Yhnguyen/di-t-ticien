import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Barcode,
  ChefHat,
  Package,
  Plus,
  Refrigerator,
  ShoppingBasket,
  Snowflake,
  Trash2,
} from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, Champ, Etiquette, Feuille, EtatVide, TitreSection } from '../components/ui'
import { Scanner } from '../components/Scanner'
import { Lien } from '../lib/router'
import { parCodeBarres } from '../lib/openfoodfacts'
import { articlesUrgents, bilanStock, echeance, stocksDe } from '../lib/stocks'
import type { Echeance, Urgence } from '../lib/stocks'
import type { ArticleStock, Emplacement, Rayon } from '../lib/types'
import { EMPLACEMENTS, LIBELLE_EMPLACEMENT, RAYONS } from '../lib/types'
import { classes, dateCourte, jourISO } from '../lib/utils'

/** Les quatre horizons du tableau de bord, dans l'ordre où ils pressent. */
const HORIZONS: { urgence: Urgence; titre: string }[] = [
  { urgence: 'perime', titre: 'Date dépassée' },
  { urgence: 'aujourdhui', titre: "Aujourd'hui" },
  { urgence: 'demain', titre: 'Demain' },
  { urgence: 'semaine', titre: 'Cette semaine' },
]

const ICONE_EMPLACEMENT = {
  frigo: Refrigerator,
  placard: Package,
  congelateur: Snowflake,
} as const

function identifiant(): string {
  return globalThis.crypto?.randomUUID?.() ?? `s${Date.now()}${Math.round(Math.random() * 1e6)}`
}

export function GardeManger() {
  const { etat, modifier } = useSession()
  const [onglet, setOnglet] = useState<Emplacement>('frigo')
  const [saisie, setSaisie] = useState<ArticleStock | 'nouveau' | null>(null)

  const stocks = etat.stocks
  const courses = etat.courses
    .filter((l) => l.clotureeLe === null)
    .reduce((somme, l) => somme + l.articles.filter((a) => !a.pris).length, 0)
  const bilan = useMemo(() => bilanStock(stocks), [stocks])
  const urgents = useMemo(() => articlesUrgents(stocks), [stocks])
  const affiches = useMemo(() => stocksDe(stocks, onglet), [stocks, onglet])

  function enregistrer(article: ArticleStock) {
    modifier((brouillon) => {
      const index = brouillon.stocks.findIndex((a) => a.id === article.id)
      if (index === -1) brouillon.stocks.push(article)
      else brouillon.stocks[index] = article
    })
    setSaisie(null)
  }

  function supprimer(id: string) {
    modifier((brouillon) => {
      brouillon.stocks = brouillon.stocks.filter((a) => a.id !== id)
    })
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-2xl font-semibold text-ink">Garde-manger</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ce que vous avez déjà, pour cuisiner avec et ne rien jeter.
        </p>
      </header>

      {/* ── Le chiffre d'ensemble ── */}
      <Carte className="animate-rise overflow-hidden" style={{ animationDelay: '60ms' }}>
        <div className="bg-linear-to-b from-bandeau-haut to-bandeau-bas px-5 py-6">
          <p className="text-xs font-bold tracking-[0.14em] text-white/70 uppercase">
            Dans vos réserves
          </p>
          <p className="mt-1 flex items-baseline gap-2.5">
            <span className="font-display text-5xl font-semibold text-white tnum">
              {bilan.total}
            </span>
            <span className="text-base font-medium text-white/80">
              produit{bilan.total > 1 ? 's' : ''}
            </span>
          </p>
          <p className="mt-1.5 text-sm text-white/75 tnum">
            {bilan.total === 0
              ? 'Rien de noté pour l’instant.'
              : EMPLACEMENTS.filter((e) => bilan.parEmplacement[e] > 0)
                  .map((e) => `${bilan.parEmplacement[e]} au ${LIBELLE_EMPLACEMENT[e].toLowerCase()}`)
                  .join(' · ')}
          </p>
        </div>

        <div className="grid gap-2.5 px-5 py-4 sm:grid-cols-2">
          <Bouton pleineLargeur onClick={() => setSaisie('nouveau')}>
            <Plus size={18} aria-hidden="true" />
            Ajouter un produit
          </Bouton>
          <Lien vers="/app/cuisiner" className="block">
            <Bouton ton="doux" pleineLargeur>
              <ChefHat size={18} aria-hidden="true" />
              Que puis-je cuisiner ?
            </Bouton>
          </Lien>
          {/* L'aller-retour est le vrai parcours : ce qui manque part sur la
              liste, et ce qu'on rapporte revient ici. */}
          <Lien vers="/app/courses" className="block sm:col-span-2">
            <Bouton ton="fantome" pleineLargeur>
              <ShoppingBasket size={18} aria-hidden="true" />
              Ma liste de courses
              {courses > 0 && <span className="tnum">({courses})</span>}
            </Bouton>
          </Lien>
        </div>
      </Carte>

      {/* ── Ce qui presse ── */}
      {urgents.length > 0 && (
        <section className="animate-rise" style={{ animationDelay: '120ms' }}>
          {/* Le titre ne parle de péremption que si une date *sanitaire* est
              dépassée. Des lentilles dont la DDM est passée ne sont pas
              périmées, et l'annoncer ainsi ferait jeter ce que cet écran
              cherche précisément à sauver. */}
          <TitreSection eyebrow="À traiter">
            {urgents.some((u) => u.echeance.urgence === 'perime' && u.echeance.sanitaire)
              ? 'À jeter, ou presque'
              : 'À finir bientôt'}
          </TitreSection>
          {/* Groupé par horizon plutôt qu'en une seule liste : « ce soir » et
              « dans six jours » n'appellent pas la même décision, et une file
              de huit lignes plates oblige à relire chaque date pour trier. */}
          <div className="space-y-3">
            {HORIZONS.map(({ urgence, titre }) => {
              const lot = urgents.filter((u) => u.echeance.urgence === urgence)
              if (lot.length === 0) return null
              return (
                <div key={urgence}>
                  <h3 className="mb-1.5 px-1 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
                    {titre}
                  </h3>
                  <Carte className="divide-y divide-line">
                    {lot.map(({ article, echeance: e }) => (
                      <LigneUrgence key={article.id} article={article} echeance={e} />
                    ))}
                  </Carte>
                </div>
              )
            })}
          </div>
          <p className="mt-2 px-1 text-xs text-ink-soft">
            Une date dépassée sur un produit sec ou congelé n’est pas une date de sécurité : le
            goût baisse, le produit reste bon.
          </p>
        </section>
      )}

      {/* ── Les trois lieux ── */}
      <section className="animate-rise" style={{ animationDelay: '180ms' }}>
        <div role="tablist" aria-label="Lieu de rangement" className="mb-3 flex gap-2">
          {EMPLACEMENTS.map((emplacement) => {
            const actif = onglet === emplacement
            const Icone = ICONE_EMPLACEMENT[emplacement]
            return (
              <button
                key={emplacement}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => setOnglet(emplacement)}
                className={classes(
                  'flex flex-1 flex-col items-center gap-1 rounded-tile border px-2 py-3 transition',
                  actif
                    ? 'border-corail bg-corail-wash text-corail'
                    : 'border-line bg-surface text-ink-soft hover:bg-sunken',
                )}
              >
                <Icone size={20} strokeWidth={actif ? 2.4 : 1.9} aria-hidden="true" />
                <span className="text-xs font-semibold">{LIBELLE_EMPLACEMENT[emplacement]}</span>
                <span className="text-xs text-ink-faint tnum">
                  {bilan.parEmplacement[emplacement]}
                </span>
              </button>
            )
          })}
        </div>

        <Carte className="divide-y divide-line">
          {affiches.length === 0 ? (
            <EtatVide
              emoji={onglet === 'congelateur' ? '🧊' : onglet === 'placard' ? '🥫' : '🥬'}
              titre={`Rien dans ${onglet === 'placard' ? 'les placards' : onglet === 'frigo' ? 'le frigo' : 'le congélateur'}`}
              action={
                <Bouton onClick={() => setSaisie('nouveau')}>
                  <Plus size={18} aria-hidden="true" />
                  Ajouter un produit
                </Bouton>
              }
            >
              Notez ce que vous avez : les recettes qui s’en servent remonteront toutes seules.
            </EtatVide>
          ) : (
            affiches.map((article) => (
              <LigneArticle
                key={article.id}
                article={article}
                onModifier={() => setSaisie(article)}
                onSupprimer={() => supprimer(article.id)}
              />
            ))
          )}
        </Carte>
      </section>

      <Feuille
        ouvert={saisie !== null}
        titre={saisie === 'nouveau' ? 'Ajouter un produit' : 'Modifier'}
        onFermer={() => setSaisie(null)}
      >
        {saisie !== null && (
          <FormulaireArticle
            article={saisie === 'nouveau' ? null : saisie}
            emplacementParDefaut={onglet}
            onValider={enregistrer}
          />
        )}
      </Feuille>
    </div>
  )
}

/* ──────────────────────────────── Lignes ──────────────────────────────── */

const TON_URGENCE: Record<Urgence, 'berry' | 'apricot' | 'neutre'> = {
  perime: 'berry',
  aujourdhui: 'berry',
  demain: 'apricot',
  semaine: 'apricot',
  ok: 'neutre',
}

/**
 * Le mot employé dépend de la nature de la date, pas seulement du nombre de
 * jours : « à jeter » pour une DLC dépassée, « moins bon » pour une DDM. Les
 * confondre ferait jeter des pâtes parfaitement bonnes.
 */
function libelleEcheance(e: Echeance): string {
  if (e.joursRestants === null) return ''
  if (e.joursRestants < 0) return e.sanitaire ? 'À jeter' : 'Moins bon'
  if (e.joursRestants === 0) return "Aujourd'hui"
  if (e.joursRestants === 1) return 'Demain'
  return `${e.joursRestants} jours`
}

function LigneUrgence({ article, echeance: e }: { article: ArticleStock; echeance: Echeance }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <AlertTriangle
        size={18}
        className={classes('shrink-0', e.sanitaire ? 'text-berry' : 'text-apricot')}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{article.nom}</span>
        <span className="block text-xs text-ink-soft tnum">
          {article.quantite} · {LIBELLE_EMPLACEMENT[article.emplacement].toLowerCase()}
          {e.date && ` · ${dateCourte(e.date)}`}
        </span>
      </span>
      <Etiquette ton={TON_URGENCE[e.urgence]}>{libelleEcheance(e)}</Etiquette>
    </div>
  )
}

function LigneArticle({
  article,
  onModifier,
  onSupprimer,
}: {
  article: ArticleStock
  onModifier: () => void
  onSupprimer: () => void
}) {
  const e = echeance(article)

  return (
    <div className="flex items-center gap-2 px-5 py-3.5">
      <button
        type="button"
        onClick={onModifier}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">{article.nom}</span>
          <span className="block text-xs text-ink-soft tnum">
            {article.quantite}
            {article.ouvertLe && ' · entamé'}
            {e.date && ` · ${e.origine === 'congelation' ? 'idéalement avant' : 'jusqu’au'} ${dateCourte(e.date)}`}
          </span>
        </span>
        {e.urgence !== 'ok' && <Etiquette ton={TON_URGENCE[e.urgence]}>{libelleEcheance(e)}</Etiquette>}
      </button>
      {/* Pas de crayon : toute la ligne ouvre déjà la modification, et en
          390 px ce bouton de plus rognait le nom du produit — « Filet de
          pou… » pour un geste que le reste de la ligne rendait déjà. */}
      <button
        type="button"
        onClick={onSupprimer}
        aria-label={`Retirer ${article.nom}`}
        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-sunken hover:text-berry"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

/* ─────────────────────────────── Formulaire ─────────────────────────────── */

function FormulaireArticle({
  article,
  emplacementParDefaut,
  onValider,
}: {
  article: ArticleStock | null
  emplacementParDefaut: Emplacement
  onValider: (article: ArticleStock) => void
}) {
  const [nom, setNom] = useState(article?.nom ?? '')
  const [quantite, setQuantite] = useState(article?.quantite ?? '1')
  const [emplacement, setEmplacement] = useState<Emplacement>(
    article?.emplacement ?? emplacementParDefaut,
  )
  const [rayon, setRayon] = useState<Rayon>(article?.rayon ?? 'Fruits et légumes')
  const [dlc, setDlc] = useState(article?.dlc ?? '')
  const [ddm, setDdm] = useState(article?.ddm ?? '')
  const [congeleLe, setCongeleLe] = useState(article?.congeleLe ?? '')
  const [ouvertLe, setOuvertLe] = useState(article?.ouvertLe ?? '')
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

  function valider() {
    const propre = nom.trim()
    if (!propre) return

    onValider({
      id: article?.id ?? identifiant(),
      nom: propre,
      quantite: quantite.trim() || '1',
      emplacement,
      rayon,
      ajouteLe: article?.ajouteLe ?? jourISO(),
      // Les dates sans rapport avec le lieu retenu sont effacées plutôt que
      // conservées en sourdine : un produit sorti du congélateur ne doit pas
      // garder une date de congélation qui ressortirait au prochain calcul.
      dlc: emplacement !== 'congelateur' && dlc ? dlc : undefined,
      ddm: emplacement !== 'congelateur' && ddm ? ddm : undefined,
      congeleLe: emplacement === 'congelateur' && congeleLe ? congeleLe : undefined,
      ouvertLe: emplacement === 'frigo' && ouvertLe ? ouvertLe : undefined,
      codeBarres: article?.codeBarres,
      note: article?.note,
    })
  }

  if (scan) {
    return <Scanner onCode={surCode} onSaisieManuelle={() => setScan(false)} />
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <Champ
          id="stock-nom"
          label="Produit"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Yaourts nature, filet de poulet…"
          autoFocus
        />

        {recherche === 'echec' && (
          <p className="text-sm text-berry">
            Ce code-barres n’est pas dans Open Food Facts. Écrivez le nom à la main.
          </p>
        )}

        <Bouton ton="doux" pleineLargeur onClick={() => setScan(true)} disabled={recherche === 'encours'}>
          <Barcode size={18} aria-hidden="true" />
          {recherche === 'encours' ? 'Recherche…' : 'Scanner le code-barres'}
        </Bouton>

        <Champ
          id="stock-quantite"
          label="Quantité"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          placeholder="500 g, 2, 1 bocal…"
        />
      </div>

      <ChoixChips
        label="Où est-ce rangé ?"
        valeur={emplacement}
        options={EMPLACEMENTS.map((e) => ({ valeur: e, libelle: LIBELLE_EMPLACEMENT[e] }))}
        onChange={setEmplacement}
      />

      <ChoixChips
        label="Rayon"
        valeur={rayon}
        options={RAYONS.map((r) => ({ valeur: r, libelle: r }))}
        onChange={setRayon}
      />

      {/* Chaque lieu a la date qu'on lit vraiment sur son contenu : une DLC sur
          un produit frais, une DDM sur une conserve, la date d'entrée au
          congélateur. Les afficher toutes ferait un formulaire que personne ne
          remplit. */}
      {emplacement === 'frigo' && (
        <div className="space-y-4">
          <Champ
            id="stock-dlc"
            type="date"
            label="À consommer jusqu’au"
            aide="La date de sécurité, sur les produits frais."
            value={dlc}
            onChange={(e) => setDlc(e.target.value)}
          />
          <Champ
            id="stock-ouvert"
            type="date"
            label="Entamé le"
            aide="Une fois ouvert, un produit ne tient plus jusqu’à sa date imprimée."
            value={ouvertLe}
            onChange={(e) => setOuvertLe(e.target.value)}
          />
        </div>
      )}

      {emplacement === 'placard' && (
        <Champ
          id="stock-ddm"
          type="date"
          label="À consommer de préférence avant"
          aide="Dépassée, elle ne rend pas le produit dangereux — seulement moins bon."
          value={ddm}
          onChange={(e) => setDdm(e.target.value)}
        />
      )}

      {emplacement === 'congelateur' && (
        <Champ
          id="stock-congele"
          type="date"
          label="Congelé le"
          aide="La durée conseillée se déduit du rayon choisi."
          value={congeleLe}
          onChange={(e) => setCongeleLe(e.target.value)}
        />
      )}

      <Bouton pleineLargeur onClick={valider} disabled={nom.trim().length === 0}>
        {article ? 'Enregistrer' : 'Ajouter au garde-manger'}
      </Bouton>
    </div>
  )
}

function ChoixChips<T extends string>({
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
      <legend className="mb-2 text-sm font-semibold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const actif = option.valeur === valeur
          return (
            <button
              key={option.valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(option.valeur)}
              className={classes(
                'rounded-full border px-3.5 py-2 text-sm font-semibold transition',
                actif
                  ? 'border-corail bg-corail text-white'
                  : 'border-line bg-surface text-ink-soft hover:bg-sunken',
              )}
            >
              {option.libelle}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
