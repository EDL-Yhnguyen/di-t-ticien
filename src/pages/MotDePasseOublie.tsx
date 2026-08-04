import { useState, type FormEvent } from 'react'
import { AlertCircle, MailCheck } from 'lucide-react'
import { demanderReinitialisation } from '../lib/auth'
import { Bouton, Champ, Marque, SignatureMarque } from '../components/ui'
import { Lien } from '../lib/router'
import { erreurDuLienRecu, modeDemo } from '../lib/supabase'

/**
 * Demander le lien de réinitialisation.
 *
 * L'écran affiche **la même confirmation que l'adresse existe ou non**. Dire
 * « compte inconnu » ferait de cette page publique un moyen de vérifier qui
 * tient un journal alimentaire — une donnée de santé, qu'on ne divulgue pas
 * pour l'agrément d'un message d'erreur plus précis.
 */
export function MotDePasseOublie() {
  const [identifiant, setIdentifiant] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [envoye, setEnvoye] = useState(false)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setErreur(null)
    setEnCours(true)
    try {
      await demanderReinitialisation(identifiant)
      setEnvoye(true)
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'La demande a échoué.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-ground px-5 py-10">
      <div className="w-full max-w-sm">
        <Lien vers="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Marque taille={40} />
          <SignatureMarque className="text-2xl" />
        </Lien>

        <div className="rounded-card border border-line bg-surface p-6 shadow-soft sm:p-7">
          {envoye ? (
            <>
              <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-reussite-wash text-reussite">
                <MailCheck size={22} aria-hidden="true" />
              </span>
              <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">
                Regardez vos e-mails
              </h1>
              <p className="text-sm text-ink-soft">
                Si un compte existe pour <span className="font-semibold text-ink">{identifiant}</span>,
                un lien vient d’y être envoyé. Il est valable une heure. Pensez à regarder dans les
                indésirables.
              </p>
              <p className="mt-5 text-center text-sm">
                <Lien
                  vers="/connexion"
                  className="font-semibold text-primaire underline underline-offset-2"
                >
                  Revenir à la connexion
                </Lien>
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">
                Mot de passe oublié
              </h1>
              <p className="mb-6 text-sm text-ink-soft">
                Entrez l’adresse e-mail de votre compte : nous vous envoyons un lien pour en
                choisir un nouveau.
              </p>

              {/* Un lien périmé ramène ici. Le dire évite de croire que la
                  demande précédente n'est jamais partie. */}
              {erreurDuLienRecu && (
                <p
                  role="status"
                  className="mb-4 flex items-start gap-2 rounded-2xl bg-alerte-wash px-4 py-3 text-sm text-alerte"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {erreurDuLienRecu}
                </p>
              )}

              <form onSubmit={envoyer} className="space-y-4">
                <Champ
                  id="identifiant"
                  label="Adresse e-mail"
                  type="email"
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
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
                  {enCours ? 'Envoi…' : 'Envoyer le lien'}
                </Bouton>
              </form>

              <p className="mt-5 text-center text-sm text-ink-soft">
                <Lien
                  vers="/connexion"
                  className="font-semibold text-primaire underline underline-offset-2"
                >
                  Revenir à la connexion
                </Lien>
              </p>
            </>
          )}
        </div>

        {modeDemo && (
          <p className="mt-5 rounded-2xl bg-accent-wash px-4 py-3 text-center text-xs text-accent">
            Mode démo : aucun e-mail ne part, les comptes n’existent que dans ce navigateur.
          </p>
        )}
      </div>
    </div>
  )
}
