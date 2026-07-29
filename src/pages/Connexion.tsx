import { useState, type FormEvent } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Bouton, Champ, Marque } from '../components/ui'
import { Lien } from '../lib/router'
import { modeDemo } from '../lib/supabase'

export function Connexion({ mode }: { mode: 'connexion' | 'inscription' }) {
  const { seConnecter, sInscrire, avisSuppression, fermerAvisSuppression } = useApp()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [prenom, setPrenom] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const inscription = mode === 'inscription'

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setErreur(null)
    setEnCours(true)
    try {
      if (inscription) await sInscrire(identifiant, motDePasse, prenom.trim())
      else await seConnecter(identifiant, motDePasse)
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'La connexion a échoué.')
      setEnCours(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-ground px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Une suppression de compte ramène ici : c'est le seul écran où son
            compte rendu peut encore être lu. */}
        {avisSuppression && (
          <div
            role="status"
            className="mb-6 flex items-start gap-2 rounded-2xl bg-berry-wash px-4 py-3"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-berry" aria-hidden="true" />
            <p className="flex-1 text-sm text-berry">{avisSuppression}</p>
            <button
              type="button"
              onClick={fermerAvisSuppression}
              aria-label="Masquer ce message"
              className="grid size-6 shrink-0 place-items-center rounded-full text-berry transition hover:bg-berry/15"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <Lien vers="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Marque taille={40} />
          <span className="font-display text-2xl font-semibold text-ink">Mamakilo</span>
        </Lien>

        <div className="rounded-card border border-line bg-surface p-6 shadow-soft sm:p-7">
          <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">
            {inscription ? 'Créer un compte' : 'Content de vous revoir'}
          </h1>
          <p className="mb-6 text-sm text-ink-soft">
            {inscription
              ? 'Quelques informations et votre plan est prêt.'
              : 'Reprenez là où vous en étiez.'}
          </p>

          <form onSubmit={envoyer} className="space-y-4">
            {inscription && (
              <Champ
                id="prenom"
                label="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                autoComplete="given-name"
                required
              />
            )}

            <Champ
              id="identifiant"
              label="Identifiant"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              aide={inscription ? 'Un e-mail ou un pseudo, au choix.' : undefined}
            />

            <Champ
              id="motdepasse"
              label="Mot de passe"
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete={inscription ? 'new-password' : 'current-password'}
              required
              aide={inscription ? '6 caractères minimum.' : undefined}
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
              {enCours ? 'Un instant…' : inscription ? 'Créer mon compte' : 'Se connecter'}
            </Bouton>
          </form>

          <p className="mt-5 text-center text-sm text-ink-soft">
            {inscription ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <Lien
              vers={inscription ? '/connexion' : '/inscription'}
              className="font-semibold text-corail underline underline-offset-2"
            >
              {inscription ? 'Se connecter' : 'En créer un'}
            </Lien>
          </p>
        </div>

        {modeDemo && (
          <p className="mt-5 rounded-2xl bg-apricot-wash px-4 py-3 text-center text-xs text-apricot">
            Mode démo : vos données restent dans ce navigateur. Renseignez les clés Supabase
            pour les synchroniser entre vos appareils.
          </p>
        )}

        <p className="mt-5 text-center">
          <Lien
            vers="/confidentialite"
            className="text-xs font-semibold text-ink-faint underline underline-offset-4 transition hover:text-ink-soft"
          >
            Confidentialité et mentions légales
          </Lien>
        </p>
      </div>
    </div>
  )
}
