import { useEffect, useMemo, useState } from 'react'
import { Barcode, Plus, Trash2, X } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Scanner } from '../components/Scanner'
import { Bouton, Carte, Champ, EtatVide, Feuille, TitreSection } from '../components/ui'
import {
  cartesTriees,
  formatDepuisScan,
  nouvelleCarte,
  tracerCarte,
  type CarteFidelite,
} from '../lib/fidelite'
import { ENSEIGNES, enseigneParId } from '../lib/ticket/enseignes'
import { classes, dateCourte } from '../lib/utils'

/**
 * Les cartes de fidélité : scannées une fois, relues à la caisse.
 *
 * Tout l'écran est dessiné autour d'un instant très court et très exposé — on
 * est devant quelqu'un qui attend, la file derrière. Deux conséquences qui
 * commandent le reste : atteindre sa carte doit prendre **un geste**, et
 * l'affichage doit maximiser les chances qu'une douchette lise du premier coup.
 */

export function Cartes() {
  const { etat, modifier } = useSession()
  const [ajout, setAjout] = useState(false)
  const [affichee, setAffichee] = useState<CarteFidelite | null>(null)

  const cartes = useMemo(() => cartesTriees(etat.cartes), [etat.cartes])

  function ajouter(carte: CarteFidelite) {
    modifier((brouillon) => {
      brouillon.cartes.push(carte)
    })
    setAjout(false)
  }

  function supprimer(id: string) {
    modifier((brouillon) => {
      brouillon.cartes = brouillon.cartes.filter((c) => c.id !== id)
    })
  }

  return (
    <div className="space-y-6 pb-4">
      <TitreSection eyebrow="Mes prix">Mes cartes</TitreSection>

      {cartes.length === 0 ? (
        <EtatVide
          emoji="💳"
          titre="Aucune carte enregistrée"
          action={
            <Bouton onClick={() => setAjout(true)}>
              <Barcode size={17} aria-hidden="true" />
              Scanner une carte
            </Bouton>
          }
        >
          Scannez le code-barres de vos cartes de fidélité une bonne fois. Vous les retrouverez ici
          pour les faire lire en caisse, même sans réseau.
        </EtatVide>
      ) : (
        <>
          <Carte className="divide-y divide-line">
            {cartes.map((carte) => (
              <div key={carte.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setAffichee(carte)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate font-medium text-ink">{carte.libelle}</span>
                  <span className="block text-xs text-ink-faint tnum">
                    {carte.numero} · ajoutée le {dateCourte(carte.ajouteeLe.slice(0, 10))}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => supprimer(carte.id)}
                  aria-label={`Supprimer la carte ${carte.libelle}`}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-sunken hover:text-alerte"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Carte>

          <Bouton ton="doux" pleineLargeur onClick={() => setAjout(true)}>
            <Plus size={17} aria-hidden="true" />
            Ajouter une carte
          </Bouton>
        </>
      )}

      <AjoutCarte ouvert={ajout} onFermer={() => setAjout(false)} onValider={ajouter} />
      {affichee && <EnCaisse carte={affichee} onFermer={() => setAffichee(null)} />}
    </div>
  )
}

/* ─────────────────────────── Scanner une carte ─────────────────────────── */

function AjoutCarte({
  ouvert,
  onFermer,
  onValider,
}: {
  ouvert: boolean
  onFermer: () => void
  onValider: (carte: CarteFidelite) => void
}) {
  const [numero, setNumero] = useState('')
  const [format, setFormat] = useState<CarteFidelite['format']>('Code128')
  const [enseigne, setEnseigne] = useState('')
  const [libelle, setLibelle] = useState('')

  useEffect(() => {
    if (!ouvert) {
      setNumero('')
      setEnseigne('')
      setLibelle('')
      setFormat('Code128')
    }
  }, [ouvert])

  function surScan(code: string, formatLu?: string) {
    setNumero(code)
    setFormat(formatDepuisScan(formatLu ?? '', code))
  }

  const nom = enseigne ? (enseigneParId(enseigne)?.nom ?? '') : libelle

  return (
    <Feuille ouvert={ouvert} titre="Ajouter une carte" onFermer={onFermer}>
      <div className="space-y-4">
        {numero === '' ? (
          <>
            <p className="text-sm text-ink-soft">
              Présentez le code-barres de votre carte devant l’appareil photo.
            </p>
            <Scanner onCode={surScan} />
            <Champ
              label="Ou saisissez le numéro"
              inputMode="numeric"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              aide="Il est imprimé sous les barres de votre carte."
            />
          </>
        ) : (
          <>
            <Carte ton="reussite" className="p-4">
              <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                Numéro lu
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink tnum">{numero}</p>
              <p className="mt-1 text-xs text-ink-soft">Format {format}</p>
            </Carte>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink">De quelle enseigne ?</p>
              <div className="grid grid-cols-2 gap-2">
                {ENSEIGNES.slice(0, 12).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEnseigne(e.id === enseigne ? '' : e.id)}
                    className={classes(
                      'rounded-tile border-2 px-3 py-2.5 text-left text-sm font-medium transition',
                      enseigne === e.id
                        ? 'lavis-primaire border-primaire text-ink'
                        : 'border-line-fort bg-surface text-ink-soft hover:bg-sunken',
                    )}
                  >
                    {e.nom}
                  </button>
                ))}
              </div>
            </div>

            {enseigne === '' && (
              <Champ
                label="Ou tapez le nom"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Ma boulangerie"
              />
            )}

            <Bouton
              pleineLargeur
              disabled={nom.trim() === ''}
              onClick={() =>
                onValider(
                  nouvelleCarte({ enseigne: enseigne || nom, libelle: nom, numero, format }),
                )
              }
            >
              Enregistrer cette carte
            </Bouton>
          </>
        )}
      </div>
    </Feuille>
  )
}

/* ────────────────────────── L'affichage en caisse ────────────────────────── */

/**
 * Le code-barres plein écran, prêt à être scanné.
 *
 * **Hors du gabarit et en plein écran**, comme le mode cuisine : c'est le seul
 * écran de l'application destiné à être vu par quelqu'un d'autre, et tout ce qui
 * n'est pas le code lui vole de la place.
 *
 * **La luminosité monte au maximum.** Une douchette à capteur d'image lit un
 * écran par son contraste : à 30 % de luminosité, elle échoue souvent, et on se
 * retrouve à répéter le geste devant la file. Le navigateur ne permet pas de
 * régler la luminosité — mais un fond blanc pur plein écran s'en approche
 * beaucoup, et c'est la seule prise que le web nous laisse.
 *
 * **Le noir sur blanc n'est jamais thématisé.** C'est le seul écran où le mode
 * sombre serait un défaut : un code-barres inversé n'est pas lu.
 */
function EnCaisse({ carte, onFermer }: { carte: CarteFidelite; onFermer: () => void }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let annule = false
    tracerCarte(carte).then(
      (trace) => !annule && setSvg(trace),
      (cause: unknown) =>
        !annule && setErreur(cause instanceof Error ? cause.message : 'Tracé impossible.'),
    )
    return () => {
      annule = true
    }
  }, [carte])

  // L'écran ne doit pas s'éteindre pendant qu'on attend son tour. L'API manque
  // sur certains navigateurs : son absence est silencieuse, l'affichage reste
  // utilisable, il faudra seulement toucher l'écran.
  useEffect(() => {
    let verrou: { release: () => Promise<void> } | null = null
    const api = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    void api?.request('screen').then((v) => (verrou = v)).catch(() => {})
    return () => {
      void verrou?.release().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-lg font-semibold text-neutral-900">{carte.libelle}</span>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="grid size-10 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        {erreur ? (
          <p className="max-w-xs text-center text-sm text-neutral-600">
            {erreur} Le numéro reste lisible : <strong className="tnum">{carte.numero}</strong>
          </p>
        ) : svg === null ? (
          <p className="text-sm text-neutral-400">Tracé du code…</p>
        ) : (
          <div
            className="w-full max-w-md [&>svg]:h-auto [&>svg]:w-full"
            // Le SVG vient de notre propre bibliothèque de tracé, à partir d'un
            // numéro que la personne a scanné elle-même : aucune chaîne d'origine
            // extérieure n'entre ici.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>

      <p className="px-6 pb-8 text-center text-xs text-neutral-500">
        Montez la luminosité si la caisse ne lit pas. Certaines douchettes anciennes ne lisent que
        le plastique — gardez votre carte sur vous.
      </p>
    </div>
  )
}
