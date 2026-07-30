import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera,
  Check,
  Loader2,
  PencilLine,
  ScanBarcode,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Scanner } from '../components/Scanner'
import { PastilleNutri } from '../components/nutrition'
import { Bouton, Carte, Champ, EtatVide, Feuille, TitreSection } from '../components/ui'
import { chercherDansLaBase } from '../lib/aliments'
import { mettreALEchelle } from '../lib/journal'
import { avecNutriScore } from '../lib/nutriscore'
import { ErreurOpenFoodFacts, chercherProduits, parCodeBarres } from '../lib/openfoodfacts'
import { ErreurScanPhoto, analyserAssiette } from '../lib/photo'
import type { AlimentDetecte, Confiance } from '../lib/photo'
import { useRoutage } from '../lib/router'
import type { Aliment, EntreeJournal, Moment, ValeursPour100 } from '../lib/types'
import { LIBELLE_MOMENT, MOMENTS } from '../lib/types'
import { classes, entier, jourISO } from '../lib/utils'

type Onglet = 'recherche' | 'scan' | 'photo' | 'manuel'

const ONGLETS: { cle: Onglet; libelle: string; Icone: typeof Search }[] = [
  { cle: 'recherche', libelle: 'Chercher', Icone: Search },
  { cle: 'scan', libelle: 'Code-barres', Icone: ScanBarcode },
  { cle: 'photo', libelle: 'Photo', Icone: Camera },
  { cle: 'manuel', libelle: 'À la main', Icone: PencilLine },
]

function momentDeLHeure(): Moment {
  const h = new Date().getHours()
  if (h < 11) return 'petit-dejeuner'
  if (h < 15) return 'dejeuner'
  if (h < 18) return 'collation'
  return 'diner'
}

function identifiant(): string {
  return globalThis.crypto?.randomUUID?.() ?? `e${Date.now()}${Math.round(Math.random() * 1e6)}`
}

export function Ajouter() {
  const { modifier } = useSession()
  const { aller } = useRoutage()
  const [onglet, setOnglet] = useState<Onglet>('recherche')
  const [moment, setMoment] = useState<Moment>(momentDeLHeure)
  const [aDoser, setADoser] = useState<Aliment | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const enregistrer = useCallback(
    (entrees: { aliment: Aliment; quantiteG: number }[]) => {
      if (entrees.length === 0) return
      const date = jourISO()
      const horodatage = new Date().toISOString()

      modifier((brouillon) => {
        for (const { aliment, quantiteG } of entrees) {
          const entree: EntreeJournal = {
            id: identifiant(),
            date,
            moment,
            horodatage,
            aliment,
            quantiteG,
          }
          brouillon.journal.push(entree)
          // Un aliment saisi ou photographié n'existe nulle part ailleurs :
          // sans ça, il faudrait le ressaisir entièrement au repas suivant.
          if (
            (aliment.source === 'manuel' || aliment.source === 'photo') &&
            !brouillon.alimentsPerso.some((a) => a.nom === aliment.nom)
          ) {
            brouillon.alimentsPerso.push(aliment)
          }
        }
      })

      const total = entrees.reduce(
        (s, e) => s + mettreALEchelle(e.aliment.valeurs, e.quantiteG).kcal,
        0,
      )
      setConfirmation(
        entrees.length === 1
          ? `${entrees[0].aliment.nom} ajouté — ${entier(total)} kcal`
          : `${entrees.length} aliments ajoutés — ${entier(total)} kcal`,
      )
    },
    [modifier, moment],
  )

  // Le message de confirmation s'efface seul : il informe, il ne bloque pas.
  useEffect(() => {
    if (!confirmation) return
    const t = setTimeout(() => setConfirmation(null), 4000)
    return () => clearTimeout(t)
  }, [confirmation])

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-semibold text-ink">Ajouter</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ce que vous notez alimente la mosaïque, les analyses et les conseils du jour.
        </p>
      </header>

      <ChoixMoment valeur={moment} onChange={setMoment} />

      {/* Une grille et non une bande défilante : à 390 px, un quatrième onglet
          hors écran serait invisible, et la saisie manuelle est justement le
          recours quand les trois autres échouent. */}
      <nav aria-label="Façon d’ajouter un aliment">
        <ul className="grid grid-cols-4 gap-1.5" role="tablist">
          {ONGLETS.map(({ cle, libelle, Icone }) => {
            const actif = onglet === cle
            return (
              <li key={cle}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={actif}
                  onClick={() => setOnglet(cle)}
                  className={classes(
                    'flex w-full flex-col items-center gap-1.5 rounded-tile px-1 py-3 text-xs font-semibold transition',
                    actif
                      ? 'bg-primaire text-white'
                      : 'bg-surface text-ink-soft hover:bg-sunken hover:text-ink',
                  )}
                >
                  <Icone size={19} aria-hidden="true" />
                  {libelle}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {confirmation && (
        <p
          role="status"
          aria-live="polite"
          className="animate-rise flex items-center gap-2.5 rounded-card bg-reussite-wash px-4 py-3 text-sm font-semibold text-reussite"
        >
          <Check size={17} strokeWidth={3} aria-hidden="true" />
          {confirmation}
          <button
            type="button"
            onClick={() => aller('/app')}
            className="ml-auto shrink-0 underline underline-offset-2"
          >
            Voir la journée
          </button>
        </p>
      )}

      {onglet === 'recherche' && <OngletRecherche onChoisir={setADoser} />}
      {onglet === 'scan' && (
        <OngletScan onChoisir={setADoser} onSaisieManuelle={() => setOnglet('manuel')} />
      )}
      {onglet === 'photo' && <OngletPhoto onValider={enregistrer} />}
      {onglet === 'manuel' && <OngletManuel onCreer={setADoser} />}

      <FeuilleDosage
        aliment={aDoser}
        moment={moment}
        onFermer={() => setADoser(null)}
        onValider={(aliment, quantiteG) => {
          enregistrer([{ aliment, quantiteG }])
          setADoser(null)
        }}
      />
    </div>
  )
}

/* ─────────────────────────── Choix du moment ─────────────────────────── */

function ChoixMoment({ valeur, onChange }: { valeur: Moment; onChange: (m: Moment) => void }) {
  return (
    <fieldset className="animate-rise">
      <legend className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
        Repas
      </legend>
      <div className="grid grid-cols-4 gap-1.5">
        {MOMENTS.map((moment) => {
          const actif = moment === valeur
          return (
            <label
              key={moment}
              className={classes(
                'cursor-pointer rounded-tile border px-2 py-2.5 text-center text-xs font-semibold transition',
                actif
                  ? 'border-primaire bg-primaire-wash text-primaire'
                  : 'border-line bg-surface text-ink-soft hover:bg-sunken',
              )}
            >
              <input
                type="radio"
                name="moment"
                className="sr-only"
                checked={actif}
                onChange={() => onChange(moment)}
              />
              {LIBELLE_MOMENT[moment]}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/* ───────────────────────────── Recherche ───────────────────────────── */

function OngletRecherche({ onChoisir }: { onChoisir: (a: Aliment) => void }) {
  const { etat } = useSession()
  const [requete, setRequete] = useState('')
  const [distants, setDistants] = useState<Aliment[]>([])
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const locaux = useMemo(() => {
    const q = requete.trim()
    if (q.length < 2) return []
    const perso = etat.alimentsPerso.filter((a) =>
      a.nom.toLowerCase().includes(q.toLowerCase()),
    )
    return [...perso, ...chercherDansLaBase(q)]
  }, [requete, etat.alimentsPerso])

  // Open Food Facts n'est interrogé qu'après une pause de frappe : une requête
  // par caractère saturerait un service public et gaspillerait le forfait.
  useEffect(() => {
    const q = requete.trim()
    if (q.length < 3) {
      setDistants([])
      setErreur(null)
      return
    }
    const abandon = new AbortController()
    const minuterie = setTimeout(async () => {
      setEnCours(true)
      setErreur(null)
      try {
        setDistants(await chercherProduits(q, abandon.signal))
      } catch (e) {
        if (!abandon.signal.aborted) {
          setErreur(e instanceof ErreurOpenFoodFacts ? e.message : 'La recherche a échoué.')
        }
      } finally {
        if (!abandon.signal.aborted) setEnCours(false)
      }
    }, 450)

    return () => {
      abandon.abort()
      clearTimeout(minuterie)
    }
  }, [requete])

  return (
    <div className="space-y-5">
      <Champ
        id="recherche-aliment"
        label="Nom de l’aliment"
        type="search"
        autoComplete="off"
        placeholder="poulet, yaourt, pain complet…"
        value={requete}
        onChange={(e) => setRequete(e.target.value)}
      />

      {requete.trim().length < 2 && (
        <EtatVide emoji="🔎" titre="Cherchez un aliment">
          Les aliments courants sont dans l’application et répondent hors connexion. Pour un
          produit de marque, le scan du code-barres est plus fiable.
        </EtatVide>
      )}

      {locaux.length > 0 && (
        <section>
          <TitreSection eyebrow="Aliments courants">Dans l’application</TitreSection>
          <ListeAliments aliments={locaux} onChoisir={onChoisir} />
        </section>
      )}

      {requete.trim().length >= 3 && (
        <section>
          <TitreSection
            eyebrow="Open Food Facts"
            action={
              enCours ? (
                <Loader2 size={17} className="animate-spin text-ink-faint" aria-label="Recherche" />
              ) : undefined
            }
          >
            Produits de marque
          </TitreSection>

          {erreur ? (
            <p className="rounded-card bg-alerte-wash px-4 py-3 text-sm text-ink">{erreur}</p>
          ) : distants.length > 0 ? (
            <ListeAliments aliments={distants} onChoisir={onChoisir} />
          ) : (
            !enCours && (
              <p className="text-sm text-ink-soft">
                Aucun produit trouvé sous ce nom. Le scan du code-barres retrouve les produits que
                la recherche par nom rate.
              </p>
            )
          )}
        </section>
      )}
    </div>
  )
}

function ListeAliments({
  aliments,
  onChoisir,
}: {
  aliments: Aliment[]
  onChoisir: (a: Aliment) => void
}) {
  return (
    <ul className="space-y-2">
      {aliments.map((aliment) => {
        const portion = aliment.portionG ?? 100
        return (
          <li key={aliment.id}>
            <button
              type="button"
              onClick={() => onChoisir(aliment)}
              className="flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left transition hover:bg-sunken"
            >
              <PastilleNutri
                note={aliment.nutriScore}
                taille="s"
                estime={aliment.nutriScoreEstime}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {aliment.nom}
                </span>
                <span className="block truncate text-xs text-ink-soft">
                  {aliment.marque ? `${aliment.marque} · ` : ''}
                  {entier((aliment.valeurs.kcal * portion) / 100)} kcal pour{' '}
                  {aliment.portionLibelle ?? `${portion} g`}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* ─────────────────────────────── Scan ─────────────────────────────── */

function OngletScan({
  onChoisir,
  onSaisieManuelle,
}: {
  onChoisir: (a: Aliment) => void
  onSaisieManuelle: () => void
}) {
  const [etat, setEtat] = useState<'scan' | 'recherche' | 'introuvable' | 'erreur'>('scan')
  const [message, setMessage] = useState('')
  const [dernierCode, setDernierCode] = useState('')

  const traiter = useCallback(
    async (code: string) => {
      setDernierCode(code)
      setEtat('recherche')
      try {
        const aliment = await parCodeBarres(code)
        if (aliment) {
          onChoisir(aliment)
          setEtat('scan')
        } else {
          setEtat('introuvable')
        }
      } catch (e) {
        setMessage(e instanceof ErreurOpenFoodFacts ? e.message : 'La recherche a échoué.')
        setEtat('erreur')
      }
    },
    [onChoisir],
  )

  if (etat === 'recherche') {
    return (
      <Carte className="grid place-items-center px-5 py-14 text-center">
        <Loader2 size={26} className="animate-spin text-primaire" aria-hidden="true" />
        <p className="mt-4 text-sm text-ink-soft" role="status">
          Recherche du produit {dernierCode}…
        </p>
      </Carte>
    )
  }

  if (etat === 'introuvable' || etat === 'erreur') {
    return (
      <Carte className="px-5 py-8 text-center">
        <p className="text-3xl" aria-hidden="true">
          {etat === 'introuvable' ? '🫥' : '🌧'}
        </p>
        <h3 className="mt-3 text-base font-semibold text-ink">
          {etat === 'introuvable' ? 'Ce produit n’est pas dans la base' : 'La recherche a échoué'}
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">
          {etat === 'introuvable'
            ? `Open Food Facts est contributive : le code ${dernierCode} n’y figure pas encore. Saisissez les valeurs de l’étiquette, elles seront gardées pour la prochaine fois.`
            : message}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Bouton ton="doux" onClick={() => setEtat('scan')}>
            Scanner à nouveau
          </Bouton>
          <Bouton onClick={onSaisieManuelle}>Saisir les valeurs</Bouton>
        </div>
      </Carte>
    )
  }

  return <Scanner onCode={traiter} onSaisieManuelle={onSaisieManuelle} />
}

/* ─────────────────────────────── Photo ─────────────────────────────── */

const TON_CONFIANCE: Record<Confiance, string> = {
  haute: 'text-reussite',
  moyenne: 'text-ink-soft',
  basse: 'text-accent',
}

const MOT_CONFIANCE: Record<Confiance, string> = {
  haute: 'estimation fiable',
  moyenne: 'estimation moyenne',
  basse: 'estimation incertaine',
}

function OngletPhoto({
  onValider,
}: {
  onValider: (entrees: { aliment: Aliment; quantiteG: number }[]) => void
}) {
  const champ = useRef<HTMLInputElement>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<{ message: string; configurable: boolean } | null>(null)
  const [commentaire, setCommentaire] = useState('')
  const [detectes, setDetectes] = useState<AlimentDetecte[] | null>(null)

  async function traiter(fichier: File) {
    setEnCours(true)
    setErreur(null)
    setDetectes(null)
    try {
      const resultat = await analyserAssiette(fichier)
      setCommentaire(resultat.commentaire)
      setDetectes(resultat.detectes)
      if (!resultat.plausible || resultat.detectes.length === 0) {
        setErreur({
          message:
            resultat.commentaire ||
            'Aucun aliment reconnu sur cette photo. Reprenez-la de plus près, bien éclairée.',
          configurable: false,
        })
      }
    } catch (e) {
      setErreur({
        message: e instanceof ErreurScanPhoto ? e.message : 'L’analyse a échoué.',
        configurable: e instanceof ErreurScanPhoto && e.configurable,
      })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={champ}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const fichier = e.target.files?.[0]
          if (fichier) traiter(fichier)
          e.target.value = ''
        }}
      />

      <Carte className="px-5 py-8 text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primaire-wash text-primaire">
          <Sparkles size={22} aria-hidden="true" />
        </span>
        <h3 className="text-base font-semibold text-ink">Photographiez votre assiette</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          Cadrez l’assiette entière, de dessus, avec les couverts visibles : ils servent d’échelle.
          Ce qui revient est une <strong className="font-semibold text-ink">estimation</strong> —
          vous corrigez chaque quantité avant de l’ajouter.
        </p>
        <Bouton className="mt-5" disabled={enCours} onClick={() => champ.current?.click()}>
          {enCours ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              Analyse en cours…
            </>
          ) : (
            <>
              <Camera size={17} aria-hidden="true" />
              Prendre une photo
            </>
          )}
        </Bouton>
      </Carte>

      {erreur && (
        <Carte className="border-alerte/30 bg-alerte-wash px-4 py-3.5">
          <p className="text-sm text-ink">{erreur.message}</p>
          {erreur.configurable && (
            <p className="mt-2 text-xs text-ink-soft">
              En attendant, le scan de code-barres et la saisie manuelle fonctionnent normalement.
            </p>
          )}
        </Carte>
      )}

      {detectes && detectes.length > 0 && (
        <Carte className="overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <TitreSection eyebrow={`${detectes.length} aliment${detectes.length > 1 ? 's' : ''} reconnu${detectes.length > 1 ? 's' : ''}`}>
              Vérifiez avant d’ajouter
            </TitreSection>
            {commentaire && <p className="text-sm text-ink-soft">{commentaire}</p>}
          </div>

          <ul>
            {detectes.map((detecte, index) => (
              <li key={detecte.aliment.id} className="border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <PastilleNutri note={detecte.aliment.nutriScore} taille="s" estime />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {detecte.aliment.nom}
                    </p>
                    <p className={classes('text-xs', TON_CONFIANCE[detecte.confiance])}>
                      {MOT_CONFIANCE[detecte.confiance]} ·{' '}
                      {entier(
                        mettreALEchelle(detecte.aliment.valeurs, detecte.quantiteG).kcal,
                      )}{' '}
                      kcal
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-1.5">
                    <span className="sr-only">Quantité de {detecte.aliment.nom} en grammes</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={5}
                      value={detecte.quantiteG}
                      onChange={(e) => {
                        const q = Math.max(0, Number(e.target.value) || 0)
                        setDetectes(
                          (liste) =>
                            liste?.map((d, i) => (i === index ? { ...d, quantiteG: q } : d)) ??
                            null,
                        )
                      }}
                      className="w-20 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-right text-sm text-ink tnum focus:border-primaire focus:outline-none"
                    />
                    <span className="text-sm text-ink-soft">g</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`Retirer ${detecte.aliment.nom} de la liste`}
                    onClick={() =>
                      setDetectes((liste) => liste?.filter((_, i) => i !== index) ?? null)
                    }
                    className="shrink-0 rounded-full p-1.5 text-ink-faint transition hover:bg-sunken hover:text-alerte"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="px-5 py-4">
            <Bouton
              pleineLargeur
              onClick={() => {
                onValider(
                  detectes
                    .filter((d) => d.quantiteG > 0)
                    .map((d) => ({ aliment: d.aliment, quantiteG: d.quantiteG })),
                )
                setDetectes(null)
                setCommentaire('')
              }}
            >
              Ajouter au journal
            </Bouton>
          </div>
        </Carte>
      )}
    </div>
  )
}

/* ────────────────────────── Saisie à la main ────────────────────────── */

const CHAMPS_VALEURS: { cle: keyof ValeursPour100; label: string; suffixe: string }[] = [
  { cle: 'kcal', label: 'Énergie', suffixe: 'kcal' },
  { cle: 'proteines', label: 'Protéines', suffixe: 'g' },
  { cle: 'glucides', label: 'Glucides', suffixe: 'g' },
  { cle: 'sucres', label: 'dont sucres', suffixe: 'g' },
  { cle: 'lipides', label: 'Lipides', suffixe: 'g' },
  { cle: 'satures', label: 'dont saturés', suffixe: 'g' },
  { cle: 'fibres', label: 'Fibres', suffixe: 'g' },
  { cle: 'sel', label: 'Sel', suffixe: 'g' },
]

const VALEURS_VIDES: ValeursPour100 = {
  kcal: 0,
  proteines: 0,
  glucides: 0,
  sucres: 0,
  lipides: 0,
  satures: 0,
  fibres: 0,
  sel: 0,
}

function OngletManuel({ onCreer }: { onCreer: (a: Aliment) => void }) {
  const [nom, setNom] = useState('')
  const [valeurs, setValeurs] = useState<ValeursPour100>(VALEURS_VIDES)

  const pret = nom.trim().length >= 2 && valeurs.kcal > 0

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!pret) return
        onCreer(
          avecNutriScore({
            id: `perso:${identifiant()}`,
            nom: nom.trim(),
            famille: 'general',
            valeurs,
            portionG: 100,
            source: 'manuel',
          }),
        )
        setNom('')
        setValeurs(VALEURS_VIDES)
      }}
    >
      <Champ
        id="nom-aliment"
        label="Nom de l’aliment"
        placeholder="Gratin de courgettes de mamie"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
      />

      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-ink">Valeurs pour 100 g</legend>
        <p className="mb-3 text-sm text-ink-soft">
          Recopiez le tableau de l’emballage. La colonne « pour 100 g » est celle qui nous
          intéresse, pas la colonne « par portion ».
        </p>
        <div className="grid grid-cols-2 gap-3">
          {CHAMPS_VALEURS.map(({ cle, label, suffixe }) => (
            <Champ
              key={cle}
              id={`valeur-${cle}`}
              label={label}
              suffixe={suffixe}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={valeurs[cle] === 0 ? '' : valeurs[cle]}
              placeholder="0"
              onChange={(e) =>
                setValeurs((v) => ({ ...v, [cle]: Math.max(0, Number(e.target.value) || 0) }))
              }
            />
          ))}
        </div>
      </fieldset>

      <p className="text-xs text-ink-soft">
        Le Nutri-Score sera calculé par Mamakilo à partir de ces valeurs, et signalé comme estimé —
        il ne vient pas du fabricant.
      </p>

      <Bouton type="submit" pleineLargeur disabled={!pret}>
        Continuer
      </Bouton>
    </form>
  )
}

/* ─────────────────────── Choix de la quantité ─────────────────────── */

function FeuilleDosage({
  aliment,
  moment,
  onFermer,
  onValider,
}: {
  aliment: Aliment | null
  moment: Moment
  onFermer: () => void
  onValider: (aliment: Aliment, quantiteG: number) => void
}) {
  const [quantite, setQuantite] = useState(100)

  useEffect(() => {
    if (aliment) setQuantite(aliment.portionG ?? 100)
  }, [aliment])

  if (!aliment) return null

  const apport = mettreALEchelle(aliment.valeurs, quantite)
  const raccourcis = [
    ...(aliment.portionG
      ? [{ libelle: aliment.portionLibelle ?? 'Une portion', grammes: aliment.portionG }]
      : []),
    { libelle: '50 g', grammes: 50 },
    { libelle: '100 g', grammes: 100 },
    { libelle: '150 g', grammes: 150 },
    { libelle: '200 g', grammes: 200 },
  ]

  return (
    <Feuille ouvert titre="Quelle quantité ?" onFermer={onFermer}>
      <div className="flex items-center gap-3">
        <PastilleNutri
          note={aliment.nutriScore}
          taille="l"
          estime={aliment.nutriScoreEstime}
        />
        <div className="min-w-0">
          <p className="font-semibold text-ink">{aliment.nom}</p>
          <p className="text-sm text-ink-soft">
            {aliment.marque ? `${aliment.marque} · ` : ''}
            {entier(aliment.valeurs.kcal)} kcal pour 100 g
          </p>
        </div>
      </div>

      {aliment.nutriScoreEstime && (
        <p className="mt-3 rounded-tile bg-sunken px-3 py-2 text-xs text-ink-soft">
          Nutri-Score estimé par Mamakilo d’après les valeurs nutritionnelles. Le fabricant n’a
          pas déclaré de note officielle pour ce produit.
        </p>
      )}

      <div className="mt-5">
        <Champ
          id="quantite"
          label="Quantité"
          suffixe="g"
          type="number"
          inputMode="numeric"
          min={0}
          step={5}
          value={quantite}
          onChange={(e) => setQuantite(Math.max(0, Number(e.target.value) || 0))}
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {raccourcis.map(({ libelle, grammes }) => (
            <button
              key={libelle}
              type="button"
              onClick={() => setQuantite(grammes)}
              className={classes(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                quantite === grammes
                  ? 'bg-primaire text-white'
                  : 'bg-sunken text-ink-soft hover:text-ink',
              )}
            >
              {libelle}
            </button>
          ))}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-4 gap-2 rounded-card bg-sunken p-3 text-center">
        {[
          { terme: 'kcal', valeur: entier(apport.kcal) },
          { terme: 'Prot.', valeur: `${Math.round(apport.proteines)} g` },
          { terme: 'Gluc.', valeur: `${Math.round(apport.glucides)} g` },
          { terme: 'Lip.', valeur: `${Math.round(apport.lipides)} g` },
        ].map(({ terme, valeur }) => (
          <div key={terme}>
            <dt className="text-[0.6875rem] font-bold tracking-[0.08em] text-ink-faint uppercase">
              {terme}
            </dt>
            <dd className="mt-0.5 font-display text-lg font-semibold text-ink tnum">{valeur}</dd>
          </div>
        ))}
      </dl>

      <Bouton
        pleineLargeur
        className="mt-5"
        disabled={quantite <= 0}
        onClick={() => onValider(aliment, quantite)}
      >
        Ajouter au {LIBELLE_MOMENT[moment].toLowerCase()}
      </Bouton>
    </Feuille>
  )
}
