import { useState, type FormEvent } from 'react'
import { AlertCircle, KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { changerMotDePasse } from '../lib/auth'
import { Bouton, Champ } from '../components/ui'

/**
 * Passage obligé pour le compte pré-créé d'Élodie : il est livré avec le mot
 * de passe « ELO », que tout le monde peut deviner sur un site ouvert aux
 * inscriptions. On ne laisse pas des données de santé derrière ça.
 */
export function NouveauMotDePasse() {
  const { etat, modifier } = useApp()
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

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
        <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-iris-wash text-iris">
          <KeyRound size={22} aria-hidden="true" />
        </span>

        <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">
          Choisissez votre mot de passe
        </h1>
        <p className="mb-6 text-sm text-ink-soft">
          {etat?.profil.prenom ? `${etat.profil.prenom}, votre` : 'Votre'} compte a été créé avec un
          mot de passe provisoire. Remplacez-le maintenant : votre poids et vos repas ne
          regardent que vous.
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
              className="flex items-start gap-2 rounded-2xl bg-berry-wash px-4 py-3 text-sm text-berry"
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
