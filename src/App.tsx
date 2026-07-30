import { Suspense, lazy, useEffect } from 'react'
import { useApp } from './context/AppContext'
import { useRoutage } from './lib/router'
import { Cadre } from './components/Nav'
import { BarriereErreur } from './components/BarriereErreur'
import { Bouton, Carte, Chargement } from './components/ui'
import { Celebration } from './components/Celebration'
import { Accueil } from './pages/Accueil'
import { Confidentialite } from './pages/Confidentialite'
import { Connexion } from './pages/Connexion'
import { Consentement } from './pages/Consentement'
import { Onboarding } from './pages/Onboarding'
import { NouveauMotDePasse } from './pages/NouveauMotDePasse'
import { Aujourdhui } from './pages/Aujourdhui'
import { consentementAJour } from './lib/rgpd'

/**
 * Les écrans secondaires sont chargés à la demande.
 *
 * Tout partait auparavant dans un seul fichier de 831 Ko : le catalogue de
 * recettes, le lecteur de l'export Apple Santé, les jeux et les statistiques
 * étaient téléchargés par quelqu'un qui voulait seulement noter son petit
 * déjeuner. Sur un forfait mobile, c'est de l'attente pure.
 *
 * Restent chargés d'emblée les écrans du premier contact — accueil, connexion,
 * consentement, onboarding — et `Aujourdhui`, qui est la destination par
 * défaut : la découper ferait clignoter l'écran le plus visité de tous.
 */
const Ajouter = lazy(() => import('./pages/Ajouter').then((m) => ({ default: m.Ajouter })))
const Sante = lazy(() => import('./pages/Sante').then((m) => ({ default: m.Sante })))
const PagePlan = lazy(() => import('./pages/PagePlan').then((m) => ({ default: m.PagePlan })))
const Poids = lazy(() => import('./pages/Poids').then((m) => ({ default: m.Poids })))
const Envies = lazy(() => import('./pages/Envies').then((m) => ({ default: m.Envies })))
const Cuisine = lazy(() => import('./pages/Cuisine').then((m) => ({ default: m.Cuisine })))
const GardeManger = lazy(() =>
  import('./pages/GardeManger').then((m) => ({ default: m.GardeManger })),
)
const Cuisiner = lazy(() => import('./pages/Cuisiner').then((m) => ({ default: m.Cuisiner })))
const Courses = lazy(() => import('./pages/Courses').then((m) => ({ default: m.Courses })))
const Ticket = lazy(() => import('./pages/Ticket').then((m) => ({ default: m.Ticket })))
const Prix = lazy(() => import('./pages/Prix').then((m) => ({ default: m.Prix })))
const Cartes = lazy(() => import('./pages/Cartes').then((m) => ({ default: m.Cartes })))
const ModeCuisine = lazy(() =>
  import('./pages/ModeCuisine').then((m) => ({ default: m.ModeCuisine })),
)
const Coach = lazy(() => import('./pages/Coach').then((m) => ({ default: m.Coach })))
const Menus = lazy(() => import('./pages/Menus').then((m) => ({ default: m.Menus })))
const Stats = lazy(() => import('./pages/Stats').then((m) => ({ default: m.Stats })))
const Sport = lazy(() => import('./pages/Sport').then((m) => ({ default: m.Sport })))
const Jeux = lazy(() => import('./pages/Jeux').then((m) => ({ default: m.Jeux })))
const Badges = lazy(() => import('./pages/Badges').then((m) => ({ default: m.Badges })))
const Profil = lazy(() => import('./pages/Profil').then((m) => ({ default: m.Profil })))

/**
 * Les écrans à précharger dès que le navigateur n'a plus rien à faire.
 *
 * Découper le code a un revers : un écran jamais ouvert n'est pas dans le
 * cache du service worker, donc il devient inaccessible hors connexion. Les
 * charger pendant un temps mort rend l'application de nouveau utilisable en
 * entier hors ligne, et instantanée à la navigation — sans rien coûter au
 * premier affichage, qui est le moment où l'attente se voit.
 */
const ECRANS_A_PRECHARGER = [
  () => import('./pages/Ajouter'),
  () => import('./pages/Cuisine'),
  () => import('./pages/GardeManger'),
  () => import('./pages/Cuisiner'),
  () => import('./pages/Courses'),
  () => import('./pages/Ticket'),
  () => import('./pages/Prix'),
  // Préchargée comme les autres, mais elle en a plus besoin que la plupart :
  // c'est en magasin qu'on l'ouvre, et le réseau y est souvent absent.
  () => import('./pages/Cartes'),
  () => import('./pages/ModeCuisine'),
  () => import('./pages/Profil'),
  () => import('./pages/Menus'),
  () => import('./pages/Stats'),
  () => import('./pages/Poids'),
  () => import('./pages/Sport'),
  () => import('./pages/Envies'),
  () => import('./pages/Coach'),
  () => import('./pages/Jeux'),
  () => import('./pages/Badges'),
  () => import('./pages/PagePlan'),
  () => import('./pages/Sante'),
]

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

  // Le préchargement attend que l'application soit ouverte et utilisable :
  // rien ne doit disputer la bande passante au premier écran.
  useEffect(() => {
    if (!connecte) return
    let annule = false

    const precharger = () => {
      if (annule) return
      for (const ecran of ECRANS_A_PRECHARGER) void ecran().catch(() => {})
    }

    // Safari n'a `requestIdleCallback` que depuis peu : un délai fait l'affaire
    // là où il manque, l'idée étant seulement de ne pas gêner l'ouverture.
    const inactif = typeof window.requestIdleCallback === 'function'
    const jeton = inactif
      ? window.requestIdleCallback(precharger, { timeout: 5000 })
      : window.setTimeout(precharger, 2500)

    return () => {
      annule = true
      if (inactif) window.cancelIdleCallback(jeton)
      else window.clearTimeout(jeton)
    }
  }, [connecte])

  if (chargement) return <Chargement libelle="Ouverture" />

  // Sans cette porte de sortie, un échec de chargement laissait l'écran
  // d'attente affiché indéfiniment, sans aucune issue.
  if (erreurChargement) {
    return <EchecOuverture message={erreurChargement} onReessayer={reessayerChargement} />
  }

  // Avant toute garde : c'est la page qu'on doit pouvoir lire depuis l'écran
  // de consentement, qui bloque justement tout le reste.
  if (chemin === '/confidentialite') return <Confidentialite />

  if (!connecte || !etat) {
    if (chemin === '/connexion') return <Connexion mode="connexion" />
    if (chemin === '/inscription') return <Connexion mode="inscription" />
    return <Accueil />
  }

  // Trois passages obligés avant d'atteindre l'application. Le consentement
  // précède l'onboarding : c'est ce dernier qui demande les premières données
  // de santé, il ne peut pas s'ouvrir sans accord préalable.
  if (etat.profil.motDePasseAChanger) return <NouveauMotDePasse />
  if (!consentementAJour(etat.consentement)) return <Consentement />
  if (!etat.profil.onboardingFait) return <Onboarding />

  // Le mode cuisine s'affiche **hors du gabarit** : ni barre d'onglets, ni rail.
  // On y est les mains occupées, et tout ce qui n'aide pas à l'étape en cours
  // est un élément à contourner du dos de la main. Il reste sous la barrière
  // d'erreur — une exception y laisserait sinon un écran noir sans issue.
  if (chemin === '/app/mode-cuisine') {
    return (
      <>
        <BarriereErreur>
          <Suspense fallback={<AttenteEcran />}>
            <ModeCuisine />
          </Suspense>
        </BarriereErreur>
        <Celebration />
      </>
    )
  }

  return (
    <>
      <Cadre>
        {/* La barrière est remontée à chaque changement de route : sans cette
            clé, un écran cassé le resterait même après avoir navigué ailleurs
            et être revenu. La navigation, elle, est hors barrière — c'est ce
            qui permet de quitter un écran en panne. */}
        <BarriereErreur key={chemin}>
          <Suspense fallback={<AttenteEcran />}>{ecranPour(chemin)}</Suspense>
        </BarriereErreur>
      </Cadre>
      <Celebration />
    </>
  )
}

/**
 * L'attente d'un écran chargé à la demande.
 *
 * Volontairement discrète et sans texte : sur une connexion correcte elle dure
 * quelques dizaines de millisecondes, et annoncer « chargement » pour ça
 * donnerait l'impression d'une application plus lente qu'elle ne l'est.
 */
function AttenteEcran() {
  return (
    <div className="grid min-h-[50svh] place-items-center" role="status" aria-label="Chargement de l’écran">
      <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-primaire" />
    </div>
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
    case '/app/garde-manger':
      return <GardeManger />
    case '/app/cuisiner':
      return <Cuisiner />
    case '/app/courses':
      return <Courses />
    case '/app/ticket':
      return <Ticket />
    case '/app/prix':
      return <Prix />
    case '/app/cartes':
      return <Cartes />
    case '/app/coach':
      return <Coach />
    case '/app/stats':
      return <Stats />
    case '/app/menus':
      return <Menus />
    case '/app/sport':
      return <Sport />
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
