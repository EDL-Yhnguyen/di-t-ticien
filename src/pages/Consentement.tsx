import { useState } from 'react'
import { AlertCircle, Check, Download, Lock, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Bouton, Carte, Feuille } from '../components/ui'
import { Lien } from '../lib/router'
import { consentementDuJour } from '../lib/rgpd'
import { modeDemo } from '../lib/supabase'

const POINTS = [
  {
    Icone: Lock,
    texte:
      'Vos mesures, votre journal et vos pesées ne servent qu’à vous afficher votre suivi. Ni publicité, ni revente, ni profilage.',
  },
  {
    Icone: Download,
    texte:
      'Vous pouvez emporter l’intégralité de vos données à tout moment, dans un fichier lisible.',
  },
  {
    Icone: Trash2,
    texte:
      'Un bouton dans votre profil efface votre compte et vos données. Immédiatement, et sans copie conservée.',
  },
]

/**
 * Écran bloquant, avant l'onboarding : la collecte de données de santé exige
 * un consentement explicite et préalable (RGPD, art. 9.2.a). Il passe donc
 * avant le premier écran qui en demande une seule.
 */
export function Consentement() {
  const { etat, modifier, supprimerCompte } = useApp()
  const [refusOuvert, setRefusOuvert] = useState(false)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!etat) return null

  // Un accord déjà donné mais à une version antérieure du texte n'est pas un
  // premier passage : le dire, sinon on a l'air de redemander sans raison.
  const renouvellement = etat.consentement !== null

  function accepter() {
    modifier((brouillon) => {
      brouillon.consentement = consentementDuJour()
    })
  }

  async function refuser() {
    setErreur(null)
    setSuppressionEnCours(true)
    try {
      await supprimerCompte()
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'La suppression a échoué.')
      setSuppressionEnCours(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-ground px-5 py-10">
      <div className="w-full max-w-md">
        <Carte className="p-6 sm:p-7">
          <h1 className="font-display text-2xl font-semibold text-ink">
            {renouvellement ? 'Notre texte a changé' : 'Avant de commencer'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {renouvellement
              ? 'La politique de confidentialité a évolué. Relisez-la et confirmez votre accord pour continuer.'
              : 'Mamakilo enregistre ce que vous mangez et ce que vous pesez. Ce sont des données de santé, et elles ne se traitent pas sans votre accord.'}
          </p>

          <ul className="mt-6 space-y-4">
            {POINTS.map(({ Icone, texte }) => (
              <li key={texte} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-corail-wash text-corail">
                  <Icone size={16} aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-ink-soft">{texte}</p>
              </li>
            ))}
          </ul>

          <p className="mt-6 rounded-tile bg-sunken px-4 py-3 text-sm text-ink-soft">
            {modeDemo
              ? 'Cette installation fonctionne en mode démo : vos données restent dans ce navigateur et ne sont envoyées nulle part.'
              : 'Vos données sont enregistrées sur votre compte, dans une base où vous seul pouvez les lire.'}{' '}
            <Lien
              vers="/confidentialite"
              className="font-semibold text-corail underline underline-offset-2"
            >
              Lire la politique complète
            </Lien>
          </p>

          {erreur && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-2xl bg-berry-wash px-4 py-3 text-sm text-berry"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              {erreur}
            </p>
          )}

          <Bouton pleineLargeur className="mt-6" onClick={accepter}>
            <Check size={17} aria-hidden="true" />
            J’accepte
          </Bouton>
          <button
            type="button"
            onClick={() => setRefusOuvert(true)}
            className="mt-3 w-full py-2 text-sm font-semibold text-ink-soft underline underline-offset-4 transition hover:text-ink"
          >
            Je refuse
          </button>
        </Carte>
      </div>

      <Feuille ouvert={refusOuvert} titre="Refuser" onFermer={() => setRefusOuvert(false)}>
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            Sans votre accord, l’application n’a pas le droit de conserver quoi que ce soit à votre
            sujet. Refuser revient donc à <strong className="text-ink">supprimer votre compte</strong>{' '}
            et tout ce qu’il contient : mesures, journal, pesées, badges. C’est définitif.
          </p>
          <p className="text-sm text-ink-soft">
            Si vous voulez garder une copie, annulez, acceptez, exportez vos données depuis votre
            profil, puis supprimez votre compte de là.
          </p>
          <Bouton
            ton="alerte"
            pleineLargeur
            disabled={suppressionEnCours}
            onClick={() => void refuser()}
          >
            <Trash2 size={17} aria-hidden="true" />
            {suppressionEnCours ? 'Suppression…' : 'Refuser et tout supprimer'}
          </Bouton>
          <Bouton ton="doux" pleineLargeur onClick={() => setRefusOuvert(false)}>
            Annuler
          </Bouton>
        </div>
      </Feuille>
    </div>
  )
}
