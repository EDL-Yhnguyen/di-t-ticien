import { useEffect, useRef, useState } from 'react'
import { Camera, Keyboard } from 'lucide-react'
import { lireCodeBarres, utiliseRepli } from '../lib/decodeur'
import { Bouton, Champ } from './ui'

type Etat = 'ouverture' | 'actif' | 'refuse' | 'indisponible' | 'nonSecurise' | 'panne'

/** Quatre lectures par seconde : au-delà on chauffe le téléphone pour rien. */
const PERIODE_MS = 250

/** Résolution d'analyse. Un code-barres se lit très bien à cette taille. */
const LARGEUR_ANALYSE = 640

export function Scanner({
  onCode,
  onSaisieManuelle,
}: {
  onCode: (code: string) => void
  onSaisieManuelle?: () => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [etat, setEtat] = useState<Etat>('ouverture')
  const [repli, setRepli] = useState(false)
  const [codeManuel, setCodeManuel] = useState('')
  const [manuelOuvert, setManuelOuvert] = useState(false)

  // Le code trouvé ne doit remonter qu'une fois : la boucle d'analyse tourne
  // encore quelques trames après la détection, le temps que React démonte.
  const dejaTrouve = useRef(false)

  useEffect(() => {
    let flux: MediaStream | null = null
    let minuterie: number | undefined
    let annule = false

    async function demarrer() {
      if (!window.isSecureContext) {
        setEtat('nonSecurise')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setEtat('indisponible')
        return
      }

      utiliseRepli().then((r) => {
        if (!annule) setRepli(r)
      })

      try {
        flux = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        })
      } catch (erreur) {
        if (annule) return
        const nom = erreur instanceof DOMException ? erreur.name : ''
        setEtat(nom === 'NotAllowedError' || nom === 'SecurityError' ? 'refuse' : 'indisponible')
        return
      }

      if (annule) {
        flux.getTracks().forEach((p) => p.stop())
        return
      }

      const lecteur = video.current
      if (!lecteur) return
      lecteur.srcObject = flux
      // iOS refuse la lecture automatique sans ces deux attributs, posés ici
      // parce que React ne rend pas `playsinline` de façon fiable.
      lecteur.setAttribute('playsinline', 'true')
      lecteur.muted = true
      await lecteur.play().catch(() => undefined)
      if (annule) return
      setEtat('actif')

      const analyser = async () => {
        if (annule || dejaTrouve.current) return
        const source = video.current
        const cible = canvas.current
        if (source && cible && source.videoWidth > 0) {
          const echelle = LARGEUR_ANALYSE / source.videoWidth
          cible.width = LARGEUR_ANALYSE
          cible.height = Math.round(source.videoHeight * echelle)
          const contexte = cible.getContext('2d', { willReadFrequently: true })
          if (contexte) {
            contexte.drawImage(source, 0, 0, cible.width, cible.height)
            try {
              const code = await lireCodeBarres(cible)
              if (code && !annule && !dejaTrouve.current) {
                dejaTrouve.current = true
                if ('vibrate' in navigator) navigator.vibrate?.(40)
                onCode(code)
                return
              }
            } catch {
              // Le décodeur peut échouer sur une trame floue. On réessaie.
            }
          }
        }
        if (!annule && !dejaTrouve.current) {
          minuterie = window.setTimeout(analyser, PERIODE_MS)
        }
      }

      minuterie = window.setTimeout(analyser, PERIODE_MS)
    }

    demarrer().catch(() => {
      if (!annule) setEtat('panne')
    })

    return () => {
      annule = true
      if (minuterie) clearTimeout(minuterie)
      flux?.getTracks().forEach((piste) => piste.stop())
    }
  }, [onCode])

  if (etat !== 'actif' && etat !== 'ouverture') {
    return <Empechement etat={etat} onSaisieManuelle={onSaisieManuelle} />
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-card bg-ink">
        <video
          ref={video}
          playsInline
          muted
          aria-label="Vue de l’appareil photo"
          className="block aspect-[4/3] w-full object-cover"
        />
        <canvas ref={canvas} className="hidden" />

        {/* Le cadre dit où viser. Un code-barres se lit mieux en travers. */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-24 w-4/5 rounded-xl border-2 border-white/90 shadow-[0_0_0_100vmax_rgb(0_0_0/0.45)]" />
        </div>

        <p
          role="status"
          aria-live="polite"
          className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-4 pt-8 pb-3 text-center text-sm font-medium text-white"
        >
          {etat === 'ouverture'
            ? 'Ouverture de l’appareil photo…'
            : 'Cadrez le code-barres du produit'}
        </p>
      </div>

      {repli && (
        <p className="mt-3 text-xs text-ink-soft">
          Votre navigateur n’a pas de lecteur intégré : Équilibre en charge un au premier scan
          (environ 500 Ko), puis le garde hors connexion.
        </p>
      )}

      {!manuelOuvert ? (
        <Bouton
          ton="fantome"
          pleineLargeur
          className="mt-3"
          onClick={() => setManuelOuvert(true)}
        >
          <Keyboard size={17} aria-hidden="true" />
          Saisir le code à la main
        </Bouton>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const propre = codeManuel.replace(/\D/g, '')
            if (propre.length >= 8) onCode(propre)
          }}
        >
          <Champ
            id="code-manuel"
            label="Code-barres"
            inputMode="numeric"
            autoComplete="off"
            placeholder="3017620422003"
            aide="Les 8 à 13 chiffres sous les barres."
            value={codeManuel}
            onChange={(e) => setCodeManuel(e.target.value)}
          />
          <Bouton
            type="submit"
            pleineLargeur
            disabled={codeManuel.replace(/\D/g, '').length < 8}
          >
            Chercher ce produit
          </Bouton>
        </form>
      )}
    </div>
  )
}

/** Ce qu'on affiche quand la caméra ne peut pas s'ouvrir. */
function Empechement({
  etat,
  onSaisieManuelle,
}: {
  etat: Exclude<Etat, 'actif' | 'ouverture'>
  onSaisieManuelle?: () => void
}) {
  const textes: Record<typeof etat, { titre: string; explication: string }> = {
    refuse: {
      titre: 'L’accès à l’appareil photo est refusé',
      explication:
        'Autorisez la caméra pour ce site dans les réglages de votre navigateur, puis rouvrez le scanner. En attendant, la saisie du code fonctionne aussi bien.',
    },
    indisponible: {
      titre: 'Aucun appareil photo disponible',
      explication:
        'Cet appareil n’expose pas de caméra utilisable. Saisissez le code-barres à la main : le produit sera retrouvé de la même façon.',
    },
    nonSecurise: {
      titre: 'Le scan demande une connexion sécurisée',
      explication:
        'Les navigateurs n’ouvrent la caméra que sur une adresse en https. Sur di-t-ticien.vercel.app le scan fonctionne ; en local, passez par la saisie manuelle.',
    },
    panne: {
      titre: 'Le scanner n’a pas démarré',
      explication:
        'Quelque chose a interrompu l’ouverture de la caméra. Réessayez, ou saisissez le code-barres à la main.',
    },
  }

  const { titre, explication } = textes[etat]

  return (
    <div className="rounded-card border border-line bg-sunken px-5 py-8 text-center">
      <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-surface text-ink-soft">
        <Camera size={20} aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-ink">{titre}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">{explication}</p>
      {onSaisieManuelle && (
        <Bouton ton="doux" className="mt-5" onClick={onSaisieManuelle}>
          Saisir les valeurs à la main
        </Bouton>
      )}
    </div>
  )
}
