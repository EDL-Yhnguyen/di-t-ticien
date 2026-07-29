import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Check, Info, MessageCircle, Send, ShieldCheck, Trash2 } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, TitreSection } from '../components/ui'
import {
  ErreurCoach,
  amorces,
  construireContexte,
  demanderAuCoach,
} from '../lib/coachIA'
import { Lien } from '../lib/router'
import type { MessageCoach } from '../lib/types'
import { classes, jourISO } from '../lib/utils'

export function Coach() {
  const { etat, modifier } = useSession()
  const date = jourISO()
  const [brouillon, setBrouillon] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<ErreurCoach | null>(null)
  const finDeLaListe = useRef<HTMLDivElement>(null)

  const contexte = useMemo(() => construireContexte(etat, date), [etat, date])
  const messages = etat.conversation

  // La conversation se lit du bas : c'est le dernier message qui compte.
  useEffect(() => {
    finDeLaListe.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, enCours])

  if (etat.consentementCoach === null) {
    return <Accord onAccepter={() => modifier((b) => void (b.consentementCoach = new Date().toISOString()))} />
  }

  async function envoyer(texte: string) {
    const question = texte.trim()
    if (question === '' || enCours) return

    const message: MessageCoach = {
      id: `coach:${Date.now()}`,
      role: 'utilisateur',
      texte: question,
      envoyeLe: new Date().toISOString(),
    }

    // L'historique envoyé est celui d'avant l'écriture dans l'état : `modifier`
    // est asynchrone, et relire `etat.conversation` ici renverrait la version
    // précédente, sans la question qu'on vient de poser.
    const historique = [...messages, message]
    modifier((b) => {
      b.conversation.push(message)
    })
    setBrouillon('')
    setErreur(null)
    setEnCours(true)

    try {
      const reponse = await demanderAuCoach(historique, contexte)
      modifier((b) => {
        b.conversation.push({
          id: `coach:${Date.now()}:r`,
          role: 'coach',
          texte: reponse,
          envoyeLe: new Date().toISOString(),
        })
      })
    } catch (e) {
      setErreur(
        e instanceof ErreurCoach
          ? e
          : new ErreurCoach('Le coach est injoignable pour le moment. Réessayez dans un instant.'),
      )
    } finally {
      setEnCours(false)
    }
  }

  function effacer() {
    modifier((b) => {
      b.conversation = []
    })
    setErreur(null)
  }

  return (
    <div className="space-y-5">
      <header className="animate-rise flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink">Mon coach</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Il voit votre journée du jour et vos objectifs. Posez-lui vos questions.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={effacer}
            aria-label="Effacer la conversation"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-sunken hover:text-berry"
          >
            <Trash2 size={17} />
          </button>
        )}
      </header>

      {messages.length === 0 ? (
        <Carte className="animate-rise p-5" style={{ animationDelay: '60ms' }}>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <MessageCircle size={18} className="shrink-0 text-corail" aria-hidden="true" />
            Par où commencer
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le coach connaît vos {contexte.objectifKcal} kcal du jour, ce que vous avez noté et vos
            séances. Il ne sait rien d’autre.
          </p>
          <ul className="mt-4 space-y-2">
            {amorces(contexte).map((question) => (
              <li key={question}>
                <button
                  type="button"
                  onClick={() => void envoyer(question)}
                  className="w-full rounded-card border border-line bg-surface px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-sunken"
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        </Carte>
      ) : (
        <ul className="animate-rise space-y-3" aria-live="polite">
          {messages.map((message) => (
            <li
              key={message.id}
              className={classes('flex', message.role === 'utilisateur' && 'justify-end')}
            >
              <div
                className={classes(
                  'max-w-[85%] rounded-card px-4 py-3 text-sm whitespace-pre-wrap',
                  message.role === 'utilisateur'
                    ? 'bg-corail text-white'
                    : 'border border-line bg-surface text-ink',
                )}
              >
                {message.texte}
              </div>
            </li>
          ))}
        </ul>
      )}

      {enCours && (
        <p className="flex items-center gap-2 text-sm text-ink-soft" aria-live="polite">
          <span className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 animate-pulse rounded-full bg-corail"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </span>
          Le coach réfléchit…
        </p>
      )}

      {erreur && (
        <Carte className="border-berry/40 bg-berry-wash p-4">
          <p className="flex items-start gap-2 text-sm text-ink">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-berry" aria-hidden="true" />
            <span>{erreur.message}</span>
          </p>
        </Carte>
      )}

      <div ref={finDeLaListe} />

      {/* La barre de saisie reste au-dessus de la barre d'onglets sur mobile. */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void envoyer(brouillon)
        }}
        className="sticky bottom-20 z-10 flex items-end gap-2 rounded-card border border-line bg-surface p-2 shadow-lg md:bottom-4"
      >
        <label htmlFor="question" className="sr-only">
          Votre question
        </label>
        <textarea
          id="question"
          rows={1}
          value={brouillon}
          onChange={(e) => setBrouillon(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void envoyer(brouillon)
            }
          }}
          placeholder="Votre question…"
          maxLength={2000}
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={brouillon.trim() === '' || enCours}
          aria-label="Envoyer la question"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-corail text-white transition disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>

      <Carte className="p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Info size={18} className="shrink-0 text-corail" aria-hidden="true" />
          Ce que le coach n’est pas
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Il n’est ni médecin ni diététicien, et Mamakilo n’est pas un dispositif médical. Ses
          réponses sont des repères, pas une prescription : pour une maladie, un traitement, une
          grossesse ou un enfant, parlez-en à un professionnel de santé.
        </p>
      </Carte>
    </div>
  )
}

/* ────────────────────────── L'accord, avant le premier mot ────────────────────────── */

/**
 * Le consentement général couvre ce que l'application conserve. Envoyer le
 * journal du jour à un tiers pour obtenir une réponse est une autre finalité,
 * qui se demande séparément — et qui se refuse sans perdre le reste de
 * l'application.
 */
function Accord({ onAccepter }: { onAccepter: () => void }) {
  return (
    <div className="space-y-5">
      <header className="animate-rise">
        <h1 className="font-display text-2xl font-semibold text-ink">Mon coach</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Un coach qui répond à vos questions à partir de vos chiffres du jour.
        </p>
      </header>

      <Carte className="animate-rise p-5" style={{ animationDelay: '60ms' }}>
        <TitreSection eyebrow="Avant de commencer">Ce qui sera envoyé</TitreSection>
        <ul className="space-y-2 text-sm text-ink-soft">
          <li>• Votre prénom, âge, sexe, taille, poids actuel et poids visé.</li>
          <li>• Votre objectif calorique et ce que vous avez noté aujourd’hui.</li>
          <li>• Vos séances de sport du jour.</li>
          <li>• Vos questions et les réponses du coach.</li>
        </ul>

        <p className="mt-4 text-sm text-ink-soft">
          Ces données partent chez <strong className="font-semibold text-ink">Anthropic</strong>, aux
          États-Unis, au moment où vous posez une question — et seulement à ce moment-là. Elles ne
          sont pas rattachées à votre compte chez eux. Le nom et les coordonnées de votre praticien,
          eux, ne quittent jamais votre navigateur.
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          Refuser ne vous coûte rien d’autre : tout le reste de l’application fonctionne à
          l’identique. Vous pouvez revenir sur cet accord depuis votre profil.
        </p>

        <Lien vers="/confidentialite" className="mt-3 block text-sm font-semibold text-corail">
          Lire la politique de confidentialité
        </Lien>

        <Bouton pleineLargeur className="mt-5" onClick={onAccepter}>
          <Check size={17} aria-hidden="true" />
          J’accepte, ouvrir le coach
        </Bouton>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
          <ShieldCheck size={14} aria-hidden="true" />
          Rien n’est envoyé tant que vous n’avez pas accepté.
        </p>
      </Carte>
    </div>
  )
}
