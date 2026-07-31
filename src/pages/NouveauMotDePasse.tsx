import { useState, type FormEvent } from 'react'
import { AlertCircle, KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { changerMotDePasse } from '../lib/auth'
import { useRoutage } from '../lib/router'
import { Bouton, Champ } from '../components/ui'

/**
 * Le choix d'un mot de passe, pour deux situations qui demandent le même geste.
 *
 * `provisoire` : passage obligé pour le compte pré-créé d'Élodie, livré avec le
 * mot de passe « ELO » que tout le monde peut deviner sur un site ouvert aux
 * inscriptions. On ne laisse pas des données de santé derrière ça.
 *
 * `recuperation` : arrivée par le lien reçu par e-mail. La session est ouverte
 * mais provisoire — tant que le mot de passe n'est pas remplacé, elle ne donne
 * accès à rien d'autre, et l'écran passe avant toutes les autres gardes.
 */
export function NouveauMotDePasse({
  motif = 'provisoire',
}: {
  motif?: 'provisoire' | 'recuperation'
}) {
  const { etat, modifier, finRecuperation } = useApp()
  const { aller } = useRoutage()
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const recuperation = motif === 'recuperation'

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setErreur(null)

    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }

    setEnCours(true)
    try {
      await changerMotDePasse(motDePasse)
      if (recuperation) {
        // La garde de récupération se lève seulement une fois le mot de passe
        // réellement remplacé : sinon un rechargement rouvrirait une session
        // provisoire sur l'ancien.
        finRecuperation()
        aller('/app', { remplacer: true })
        return
      }
      modifier((brouillon) => {
        brouillon.profil.motDePasseAChanger = false
      })
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'Le changement a échoué.')
      setEnCours(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-ground px-5 py-10">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 shadow-soft sm:p-7">
        <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primaire-wash text-primaire">
          <KeyRound size={22} aria-hidden="true" />
        </span>

        <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">
          {recuperation ? 'Choisissez un nouveau mot de passe' : 'Choisissez votre mot de passe'}
        </h1>
        <p className="mb-6 text-sm text-ink-soft">
          {recuperation ? (
            <>
              Votre lien est reconnu. Ce nouveau mot de passe remplacera l’ancien sur tous vos
              appareils.
            </>
          ) : (
            <>
              {etat?.profil.prenom ? `${etat.profil.prenom}, votre` : 'Votre'} compte a été créé
              avec un mot de passe provisoire. Remplacez-le maintenant : votre poids et vos repas
              ne regardent que vous.
            </>
          )}
        </p>

        <form onSubmit={envoyer} className="space-y-4">
          <Champ
            id="nouveau"
            label="Nouveau mot de passe"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
            aide="6 caractères minimum."
          />
          <Champ
            id="confirmation"
            label="Confirmez"
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="new-password"
            required
          />

          {erreur && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-2xl bg-alerte-wash px-4 py-3 text-sm text-alerte"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              {erreur}
            </p>
          )}

          <Bouton type="submit" pleineLargeur disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer et continuer'}
          </Bouton>
        </form>
      </div>
    </div>
  )
}
