import { useMemo, useRef, useState } from 'react'
import { Camera, Check, Plus, ReceiptText, RotateCcw, Store, Trash2, TriangleAlert } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, Champ, EtatVide, Etiquette, Feuille, TitreSection } from '../components/ui'
import { Lien } from '../lib/router'
import { ENSEIGNES, enseigneParId } from '../lib/ticket/enseignes'
import { preparerImage } from '../lib/ticket/image'
import { POIDS_PREMIER_USAGE, lireImage, premierUsage } from '../lib/ticket/ocr'
import { analyserTicket, controler } from '../lib/ticket/parseur'
import type { LigneTicket, TicketLu } from '../lib/ticket/types'
import { enregistrerTicket } from '../lib/prix/depot'
import { classes, dateComplete, identifiant, jourISO, nombre } from '../lib/utils'

/**
 * Photographier un ticket de caisse pour en tirer des prix.
 *
 * L'écran est bâti autour d'un aveu : **la lecture locale se trompe**. Aucun
 * modèle payant n'intervient, le moteur tourne dans le navigateur, et sur un
 * ticket froissé il manquera une ligne ou confondra un chiffre. La correction
 * n'est donc pas un rattrapage honteux qu'on cacherait au fond d'un menu, c'est
 * la moitié du geste — et l'écran est dessiné pour qu'elle prenne deux secondes.
 *
 * Le juge est le ticket lui-même : il porte son total imprimé. Tant que
 * l'addition des lignes n'y retombe pas, l'écran le dit et n'affirme rien.
 */

type Etape = 'depart' | 'lecture' | 'correction' | 'enregistre'

export function Ticket() {
  const { etat } = useSession()
  const entree = useRef<HTMLInputElement>(null)

  const [etape, setEtape] = useState<Etape>('depart')
  const [progres, setProgres] = useState(0)
  const [ticket, setTicket] = useState<TicketLu | null>(null)
  const [dateTicket, setDateTicket] = useState(jourISO())
  const [erreur, setErreur] = useState<string | null>(null)
  const [bilan, setBilan] = useState<{ releves: number; ignorees: number } | null>(null)
  const [choixEnseigne, setChoixEnseigne] = useState(false)
  const [repechage, setRepechage] = useState(false)

  const controle = useMemo(() => (ticket ? controler(ticket) : null), [ticket])
  const aConfirmer = ticket?.lignes.filter((l) => l.douteuse).length ?? 0

  async function surFichier(fichier: File | undefined) {
    if (!fichier) return
    setErreur(null)
    setProgres(0)
    setEtape('lecture')

    try {
      const image = await preparerImage(fichier)
      const lignes = await lireImage(image, setProgres)
      const lu = analyserTicket(lignes)

      if (lu.lignes.length === 0) {
        setErreur(
          "Aucun produit n'a été reconnu sur cette photo. Reprenez-la à plat, bien éclairée, en cadrant le ticket entier.",
        )
        setEtape('depart')
        return
      }

      setTicket(lu)
      setDateTicket(lu.date ?? jourISO())
      setEtape('correction')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'La lecture a échoué.')
      setEtape('depart')
    } finally {
      // Sans cette remise à zéro, reprendre deux fois la même photo ne
      // déclencherait rien : la valeur du champ n'aurait pas changé.
      if (entree.current) entree.current.value = ''
    }
  }

  /** Toutes les corrections passent par ici — le ticket est remplacé, jamais muté. */
  function majLigne(id: string, correctif: Partial<LigneTicket>) {
    setTicket((actuel) =>
      actuel === null
        ? null
        : {
            ...actuel,
            lignes: actuel.lignes.map((l) => (l.id === id ? { ...l, ...correctif } : l)),
          },
    )
  }

  function supprimerLigne(id: string) {
    setTicket((actuel) =>
      actuel === null ? null : { ...actuel, lignes: actuel.lignes.filter((l) => l.id !== id) },
    )
  }

  /**
   * Récupérer une ligne écartée à tort.
   *
   * Le tri des non-produits se fait sur des mots-clés en début de ligne, et
   * « TOTAL BLUE 500ML » commence par « TOTAL ». Sans ce repêchage, ce genre de
   * produit serait perdu sans que rien ne le signale.
   */
  function repecher(texte: string) {
    setTicket((actuel) => {
      if (actuel === null) return null
      const ligne: LigneTicket = {
        id: identifiant('t'),
        libelle: texte,
        quantite: 1,
        unite: 'piece',
        prixUnitaire: null,
        prixPaye: null,
        remise: 0,
        confiance: 1,
        brut: texte,
        douteuse: true,
      }
      return {
        ...actuel,
        lignes: [...actuel.lignes, ligne],
        ecartees: actuel.ecartees.filter((e) => e !== texte),
      }
    })
    setRepechage(false)
  }

  async function enregistrer() {
    if (!ticket) return
    try {
      const resultat = await enregistrerTicket(ticket, etat.profil.id, dateTicket)
      setBilan(resultat)
      setEtape('enregistre')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'enregistrement local a échoué.")
    }
  }

  function recommencer() {
    setTicket(null)
    setBilan(null)
    setErreur(null)
    setEtape('depart')
  }

  const enseigne = ticket?.enseigne ? enseigneParId(ticket.enseigne) : null

  return (
    <div className="space-y-6 pb-4">
      <TitreSection eyebrow="Mes prix">Lire un ticket</TitreSection>

      {/* Le champ vit hors des branches : le remonter à chaque étape le
          remplacerait par un nouveau nœud, et la photo en cours serait perdue. */}
      <input
        ref={entree}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void surFichier(e.target.files?.[0])}
      />

      {erreur && (
        <Carte ton="alerte" className="flex gap-3 p-4">
          <TriangleAlert size={19} className="mt-0.5 shrink-0 text-alerte" aria-hidden="true" />
          <p className="text-sm text-ink">{erreur}</p>
        </Carte>
      )}

      {etape === 'depart' && <Depart onPhoto={() => entree.current?.click()} />}
      {etape === 'lecture' && <Lecture progres={progres} />}

      {etape === 'correction' && ticket && controle && (
        <>
          <EnTete
            nomEnseigne={enseigne?.nom ?? null}
            date={dateTicket}
            onDate={setDateTicket}
            onChangerEnseigne={() => setChoixEnseigne(true)}
          />

          <Controle
            somme={controle.somme}
            total={controle.total}
            ecart={controle.ecart}
            sansPrix={controle.sansPrix}
            coherent={controle.coherent}
          />

          <section>
            <TitreSection
              action={
                aConfirmer > 0 ? (
                  <Etiquette ton="alerte">{aConfirmer} à confirmer</Etiquette>
                ) : (
                  <Etiquette ton="reussite">Tout est net</Etiquette>
                )
              }
            >
              {ticket.lignes.length} produits
            </TitreSection>

            <Carte className="divide-y divide-line">
              {ticket.lignes.map((ligne) => (
                <Ligne
                  key={ligne.id}
                  ligne={ligne}
                  onChange={(correctif) => majLigne(ligne.id, correctif)}
                  onSupprimer={() => supprimerLigne(ligne.id)}
                />
              ))}
            </Carte>

            {ticket.ecartees.length > 0 && (
              <Bouton ton="fantome" className="mt-3" onClick={() => setRepechage(true)}>
                <Plus size={16} aria-hidden="true" />
                Il manque un produit ({ticket.ecartees.length} lignes ignorées)
              </Bouton>
            )}
          </section>

          <div className="space-y-2">
            <Bouton pleineLargeur onClick={() => void enregistrer()}>
              Enregistrer ces prix
            </Bouton>
            <Bouton ton="fantome" pleineLargeur onClick={recommencer}>
              Reprendre la photo
            </Bouton>
          </div>
        </>
      )}

      {etape === 'enregistre' && bilan && (
        <Enregistre
          releves={bilan.releves}
          ignorees={bilan.ignorees}
          enseigne={enseigne?.nom ?? null}
          date={dateTicket}
          onRecommencer={recommencer}
        />
      )}

      <Feuille
        ouvert={choixEnseigne}
        titre="Quelle enseigne ?"
        onFermer={() => setChoixEnseigne(false)}
      >
        <div className="grid grid-cols-2 gap-2">
          {ENSEIGNES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setTicket((actuel) => (actuel === null ? null : { ...actuel, enseigne: e.id }))
                setChoixEnseigne(false)
              }}
              className={classes(
                'rounded-tile border-2 px-3 py-3 text-left text-sm font-medium transition',
                ticket?.enseigne === e.id
                  ? 'lavis-primaire border-primaire text-ink'
                  : 'border-line-fort bg-surface text-ink-soft hover:bg-sunken',
              )}
            >
              {e.nom}
            </button>
          ))}
        </div>
      </Feuille>

      <Feuille
        ouvert={repechage}
        titre="Lignes ignorées"
        onFermer={() => setRepechage(false)}
      >
        <p className="mb-3 text-sm text-ink-soft">
          Ces lignes ont été prises pour des mentions de caisse. Touchez celle qui est en réalité un
          produit.
        </p>
        <div className="space-y-2">
          {ticket?.ecartees.map((texte, i) => (
            <button
              key={`${texte}-${i}`}
              type="button"
              onClick={() => repecher(texte)}
              className="w-full rounded-tile border border-line bg-surface px-4 py-3 text-left text-sm text-ink-soft transition hover:bg-sunken hover:text-ink"
            >
              {texte}
            </button>
          ))}
        </div>
      </Feuille>
    </div>
  )
}

/* ──────────────────────────────── Étapes ──────────────────────────────── */

function Depart({ onPhoto }: { onPhoto: () => void }) {
  return (
    <>
      <EtatVide
        emoji="🧾"
        titre="Photographiez votre ticket"
        action={
          <Bouton onClick={onPhoto}>
            <Camera size={17} aria-hidden="true" />
            Prendre la photo
          </Bouton>
        }
      >
        Les prix sont lus sur votre téléphone, sans qu’aucune image ne parte ailleurs. Posez le
        ticket à plat, bien éclairé, et cadrez-le en entier.
      </EtatVide>

      {premierUsage() && (
        <Carte className="p-4">
          <p className="text-sm text-ink-soft">
            La première lecture télécharge le moteur et le dictionnaire français, environ{' '}
            <span className="font-semibold text-ink tnum">
              {nombre(POIDS_PREMIER_USAGE / 1_000_000, 1)} Mo
            </span>
            . Ensuite tout fonctionne hors connexion, y compris dans un magasin sans réseau.
          </p>
        </Carte>
      )}
    </>
  )
}

/**
 * L'attente.
 *
 * La progression est celle du moteur, pas une animation décorative : une barre
 * qui avance sans rapport avec le travail réel est pire que pas de barre, elle
 * fait attendre au mauvais endroit. La préparation de l'image n'est pas
 * mesurable, elle, d'où le libellé qui change plutôt qu'un chiffre inventé.
 */
function Lecture({ progres }: { progres: number }) {
  const pourcent = Math.round(progres * 100)
  return (
    <Carte className="p-6 text-center">
      <ReceiptText size={28} className="mx-auto animate-pulse text-primaire" aria-hidden="true" />
      <p className="mt-3 font-display text-lg font-semibold text-ink">
        {pourcent === 0 ? 'Préparation de l’image' : 'Lecture du ticket'}
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={pourcent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lecture du ticket"
      >
        <div
          className="h-full rounded-full plein-primaire transition-[width] duration-300"
          style={{ width: `${Math.max(4, pourcent)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-ink-faint tnum">{pourcent} %</p>
    </Carte>
  )
}

function EnTete({
  nomEnseigne,
  date,
  onDate,
  onChangerEnseigne,
}: {
  nomEnseigne: string | null
  date: string
  onDate: (v: string) => void
  onChangerEnseigne: () => void
}) {
  return (
    <Carte className="space-y-4 p-5">
      <button
        type="button"
        onClick={onChangerEnseigne}
        className="flex w-full items-center gap-3 rounded-tile border border-line px-4 py-3 text-left transition hover:bg-sunken"
      >
        <Store size={19} className="shrink-0 text-primaire" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Enseigne
          </span>
          <span className={classes('font-medium', nomEnseigne ? 'text-ink' : 'text-alerte')}>
            {nomEnseigne ?? 'à préciser'}
          </span>
        </span>
      </button>

      <Champ
        label="Date des courses"
        type="date"
        value={date}
        onChange={(e) => onDate(e.target.value)}
        aide={
          // Sans enseigne ni date, un prix ne répond à aucune question : il ne
          // peut ni se comparer, ni se situer dans le temps.
          `Retenue : ${dateComplete(date)}`
        }
      />
    </Carte>
  )
}

/** Le panneau de contrôle : l'addition des lignes face au total imprimé. */
function Controle({
  somme,
  total,
  ecart,
  sansPrix,
  coherent,
}: {
  somme: number
  total: number | null
  ecart: number | null
  sansPrix: number
  coherent: boolean
}) {
  const ton = coherent ? 'reussite' : total === null ? undefined : 'alerte'

  return (
    <Carte ton={ton} className="p-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-ink-soft">Total des lignes lues</span>
        <span className="font-display text-2xl font-semibold text-ink tnum">
          {nombre(somme, 2)} €
        </span>
      </div>

      {total !== null && (
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium text-ink-soft">Total imprimé sur le ticket</span>
          <span className="font-semibold text-ink tnum">{nombre(total, 2)} €</span>
        </div>
      )}

      <p className="mt-4 border-t border-line pt-3 text-sm text-ink-soft">
        {coherent ? (
          <>
            <Check size={15} className="mr-1 inline text-reussite" aria-hidden="true" />
            L’addition retombe sur le total du ticket : la lecture est juste.
          </>
        ) : total === null ? (
          <>
            Le total imprimé n’a pas été lu, donc rien ne permet de vérifier l’addition. Contrôlez
            les lignes avant d’enregistrer.
          </>
        ) : sansPrix > 0 ? (
          <>
            <strong className="font-semibold text-ink">
              {sansPrix} produit{sansPrix > 1 ? 's' : ''} sans prix
            </strong>{' '}
            — complétez-{sansPrix > 1 ? 'les' : 'le'} ci-dessous, ou supprimez la ligne si elle
            n’existe pas.
          </>
        ) : (
          <>
            Il manque{' '}
            <strong className="font-semibold text-ink tnum">
              {nombre(Math.abs(ecart ?? 0), 2)} €
            </strong>{' '}
            {(ecart ?? 0) < 0 ? 'par rapport au' : 'de trop face au'} total imprimé : un produit
            manque ou un chiffre a été mal lu.
          </>
        )}
      </p>
    </Carte>
  )
}

/* ───────────────────────────── Une ligne ───────────────────────────── */

function Ligne({
  ligne,
  onChange,
  onSupprimer,
}: {
  ligne: LigneTicket
  onChange: (correctif: Partial<LigneTicket>) => void
  onSupprimer: () => void
}) {
  const detail =
    ligne.unite === 'piece'
      ? ligne.quantite > 1
        ? `${ligne.quantite} × ${ligne.prixUnitaire !== null ? `${nombre(ligne.prixUnitaire, 2)} €` : '?'}`
        : null
      : `${nombre(ligne.quantite, 3)} ${ligne.unite}${
          ligne.prixUnitaire !== null ? ` × ${nombre(ligne.prixUnitaire, 2)} €/${ligne.unite}` : ''
        }`

  return (
    <div className={classes('px-4 py-3', ligne.douteuse && 'lavis-alerte')}>
      <div className="flex items-center gap-2">
        <input
          value={ligne.libelle}
          onChange={(e) => onChange({ libelle: e.target.value })}
          aria-label="Nom du produit"
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 font-medium text-ink focus:bg-surface focus:outline-none"
        />

        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={ligne.prixPaye ?? ''}
          placeholder="—"
          onChange={(e) =>
            onChange({
              // Un champ vidé rend la ligne sans prix plutôt que gratuite : zéro
              // deviendrait aussitôt le meilleur prix jamais vu du produit.
              prixPaye: e.target.value === '' ? null : Number(e.target.value),
              douteuse: false,
            })
          }
          aria-label={`Prix payé pour ${ligne.libelle}`}
          className="w-24 shrink-0 rounded-lg bg-transparent px-1 py-1 text-right font-semibold text-ink tnum focus:bg-surface focus:outline-none"
        />
        <span className="shrink-0 text-sm text-ink-faint">€</span>

        {ligne.douteuse ? (
          <button
            type="button"
            onClick={() => onChange({ douteuse: false })}
            aria-label={`Confirmer ${ligne.libelle}`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-reussite transition hover:bg-surface"
          >
            <Check size={17} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSupprimer}
            aria-label={`Supprimer ${ligne.libelle}`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-surface hover:text-alerte"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {(detail || ligne.remise > 0 || ligne.douteuse) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-1 text-xs text-ink-soft">
          {detail && <span className="tnum">{detail}</span>}
          {ligne.remise > 0 && (
            <span className="text-reussite tnum">remise −{nombre(ligne.remise, 2)} €</span>
          )}
          {ligne.douteuse && (
            <span className="text-alerte">
              {ligne.prixPaye === null ? 'prix non lu' : 'lecture incertaine'} — lu «&nbsp;
              {ligne.brut}&nbsp;»
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────── Confirmation ────────────────────────────── */

function Enregistre({
  releves,
  ignorees,
  enseigne,
  date,
  onRecommencer,
}: {
  releves: number
  ignorees: number
  enseigne: string | null
  date: string
  onRecommencer: () => void
}) {
  return (
    <>
      <Carte ton="reussite" className="p-6 text-center">
        <Check size={28} className="mx-auto text-reussite" aria-hidden="true" />
        <p className="mt-3 font-display text-xl font-semibold text-ink">
          <span className="tnum">{releves}</span> prix enregistrés
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {enseigne ?? 'Enseigne non précisée'} — {dateComplete(date)}
        </p>
        {ignorees > 0 && (
          <p className="mt-3 text-sm text-ink-soft">
            <span className="tnum">{ignorees}</span> ligne{ignorees > 1 ? 's' : ''} sans prix{' '}
            {ignorees > 1 ? 'ont' : 'a'} été laissée{ignorees > 1 ? 's' : ''} de côté.
          </p>
        )}
      </Carte>

      <div className="space-y-2">
        <Bouton pleineLargeur onClick={onRecommencer}>
          <RotateCcw size={17} aria-hidden="true" />
          Lire un autre ticket
        </Bouton>
        <Lien
          vers="/app/courses"
          className="block rounded-2xl border border-line-fort bg-surface px-4 py-3 text-center font-semibold text-ink transition hover:bg-sunken"
        >
          Revenir à mes courses
        </Lien>
      </div>
    </>
  )
}
