import { useEffect } from 'react'
import { useApp } from './context/AppContext'
import { useRoutage } from './lib/router'
import { Cadre } from './components/Nav'
import { Chargement } from './components/ui'
import { Celebration } from './components/Celebration'
import { Accueil } from './pages/Accueil'
import { Connexion } from './pages/Connexion'
import { Onboarding } from './pages/Onboarding'
import { NouveauMotDePasse } from './pages/NouveauMotDePasse'
import { Aujourdhui } from './pages/Aujourdhui'
import { PagePlan } from './pages/PagePlan'
import { Poids } from './pages/Poids'
import { Envies } from './pages/Envies'
import { Cuisine } from './pages/Cuisine'
import { Jeux } from './pages/Jeux'
import { Badges } from './pages/Badges'
import { Profil } from './pages/Profil'

export function App() {
  const { utilisateur, etat, chargement } = useApp()
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

function ecranPour(chemin: string) {
  switch (chemin) {
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
