import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Bouton, Carte } from './ui'
import { signalerErreur } from '../lib/surveillance'

/**
 * Le filet de sécurité de l'application.
 *
 * Sans lui, une exception dans n'importe quel écran démonte tout l'arbre React
 * et laisse une page blanche : pas de message, pas de bouton, rien à faire
 * d'autre que fermer l'application. Sur une PWA installée, sans console
 * ouverte, c'est indistinguable d'une panne définitive.
 *
 * Ce que la barrière protège, ce sont les **données** : elles sont déjà
 * enregistrées, et rien ici n'y touche. C'est le premier message que doit lire
 * quelqu'un dont l'écran vient de casser.
 */
interface Props {
  children: ReactNode
  /** Ce qui s'affiche à la place. Absent = l'écran de secours par défaut. */
  secours?: (reessayer: () => void) => ReactNode
}

interface State {
  erreur: Error | null
}

export class BarriereErreur extends Component<Props, State> {
  state: State = { erreur: null }

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur }
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    console.error('[écran en erreur]', erreur, infos.componentStack)
    // La télémétrie est branchée depuis le 07/08/2026, et la mise en garde qui
    // était ici tenait : une trace d'erreur peut contenir des données de santé.
    // C'est `lib/surveillance.ts` qui la fait tenir — il retire les fils
    // d'Ariane, où le nom des aliments notés se serait retrouvé. Sentry est
    // déclaré dans DESTINATAIRES, et seulement quand un DSN est configuré.
    signalerErreur(erreur, 'ecran')
  }

  reessayer = () => this.setState({ erreur: null })

  render() {
    const { erreur } = this.state
    if (!erreur) return this.props.children
    if (this.props.secours) return this.props.secours(this.reessayer)

    // Les écrans sont chargés à la demande : quand la connexion tombe avant
    // qu'un écran ait été ouvert une première fois, son fichier n'est ni en
    // cache ni téléchargeable. Ce n'est pas un bogue, et le dire évite
    // d'inquiéter pour rien.
    const reseau = /dynamically imported module|Importing a module script failed|Load failed/i.test(
      erreur.message,
    )

    return (
      <div className="grid min-h-[60svh] place-items-center px-1">
        <Carte className="w-full max-w-sm p-6 text-center">
          <p className="text-3xl" aria-hidden="true">
            {reseau ? '📡' : '🧩'}
          </p>
          <h1 className="mt-3 font-display text-xl font-semibold text-ink">
            {reseau ? 'Cet écran n’a pas pu être téléchargé' : 'Cet écran n’a pas pu s’afficher'}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {reseau
              ? 'Il n’avait pas encore été ouvert sur cet appareil, et la connexion manque pour aller le chercher. Les écrans déjà visités restent disponibles hors ligne.'
              : 'Vos données sont intactes : elles sont enregistrées, et rien de ce qui vient de se passer ne les a touchées. Les autres écrans restent accessibles.'}
          </p>
          <Bouton pleineLargeur className="mt-5" onClick={this.reessayer}>
            <RotateCcw size={17} aria-hidden="true" />
            Réessayer
          </Bouton>
          {!reseau && (
            <p className="mt-3 rounded-tile bg-sunken px-3 py-2 text-left text-xs break-words text-ink-faint">
              {erreur.message}
            </p>
          )}
        </Carte>
      </div>
    )
  }
}
