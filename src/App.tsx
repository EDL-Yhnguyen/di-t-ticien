import { useEffect } from 'react'
import { useApp } from './context/AppContext'
import { useRoutage } from './lib/router'
import { Cadre } from './components/Nav'
import { Bouton, Carte, Chargement } from './components/ui'
import { Celebration } from './components/Celebration'
import { Accueil } from './pages/Accueil'
import { Connexion } from './pages/Connexion'
import { Onboarding } from './pages/Onboarding'
import { NouveauMotDePasse } from './pages/NouveauMotDePasse'
import { Aujourdhui } from './pages/Aujourdhui'
import { Ajouter } from './pages/Ajouter'
import { Sante } from './pages/Sante'
import { PagePlan } from './pages/PagePlan'
import { Poids } from './pages/Poids'
import { Envies } from './pages/Envies'
import { Cuisine } from './pages/Cuisine'
import { Jeux } from './pages/Jeux'
import { Badges } from './pages/Badges'
import { Profil } from './pages/Profil'

export function App() {
  const { utilisateur, etat, chargement, erreurChargement, reessayerChargement } = useApp()
  const { chemin, aller } = useRoutage()

  const connecte = Boolean(utilisateur && etat)
  const publique = chemin === '/' || chemin === '/connexion' || chemin === '/inscription'

  // Redirections d'accès, une fois l'état chargé.
  useEffect(() => {
    if (chargement) return
    if (!connecte && chemin.startsWith('/app')) aller('/connexion', { remplacer: true })
    if (connecte && publique) aller('/app', { remplacer: true })
  }, [chargement, connecte, chemin, publique, aller])

  if (chargement) return <Chargement libelle="Ouverture" />

  // Sans cette porte de sortie, un échec de chargement laissait l'écran
  // d'attente affiché indéfiniment, sans aucune issue.
  if (erreurChargement) {
    return <EchecOuverture message={erreurChargement} onReessayer={reessayerChargement} />
  }

  if (!connecte || !etat) {
    if (chemin === '/connexion') return <Connexion mode="connexion" />
    if (chemin === '/inscription') return <Connexion mode="inscription" />
    return <Accueil />
  }

  // Deux passages obligés avant d'atteindre l'application.
  if (etat.profil.motDePasseAChanger) return <NouveauMotDePasse />
  if (!etat.profil.onboardingFait) return <Onboarding />

  return (
    <>
      <Cadre>{ecranPour(chemin)}</Cadre>
      <Celebration />
    </>
  )
}

function EchecOuverture({
  message,
  onReessayer,
}: {
  message: string
  onReessayer: () => void
}) {
  return (
    <div className="grid min-h-svh place-items-center bg-ground px-4">
      <Carte className="w-full max-w-sm p-6 text-center">
        <p className="text-3xl" aria-hidden="true">
          🌧
        </p>
        <h1 className="mt-3 font-display text-xl font-semibold text-ink">
          Impossible d’ouvrir votre compte
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Vos données ne sont pas perdues. Vérifiez votre connexion, puis réessayez.
        </p>
        <p className="mt-3 rounded-tile bg-sunken px-3 py-2 text-left text-xs break-words text-ink-faint">
          {message}
        </p>
        <Bouton pleineLargeur className="mt-5" onClick={onReessayer}>
          Réessayer
        </Bouton>
      </Carte>
    </div>
  )
}

function ecranPour(chemin: string) {
  switch (chemin) {
    case '/app/ajouter':
      return <Ajouter />
    case '/app/sante':
      return <Sante />
    case '/app/plan':
      return <PagePlan />
    case '/app/poids':
      return <Poids />
    case '/app/envies':
      return <Envies />
    case '/app/cuisine':
      return <Cuisine />
    case '/app/jeux':
      return <Jeux />
    case '/app/badges':
      return <Badges />
    case '/app/profil':
      return <Profil />
    default:
      return <Aujourdhui />
  }
}
