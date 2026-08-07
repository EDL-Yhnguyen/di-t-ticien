/**
 * Le suivi des erreurs de production.
 *
 * Jusqu'ici, une exception en production n'était vue par personne : la
 * `BarriereErreur` affichait un écran de secours et écrivait dans une console
 * que personne n'ouvre. Sur une PWA installée, un défaut pouvait durer des
 * semaines sans que rien ne le signale.
 *
 * **Sentry est un destinataire de données, et le module est écrit pour que ça
 * reste vrai le moins possible.** Trois décisions en découlent, et aucune n'est
 * un réglage de confort — voir `DESTINATAIRES` dans `legal.ts`, qui ne déclare
 * Sentry que lorsqu'il est réellement branché.
 */

/**
 * Sans DSN, rien n'est chargé et rien ne part.
 *
 * C'est ce qui rend la politique de confidentialité vraie dans les deux cas :
 * en développement, en mode démo, et sur toute copie du dépôt, Sentry n'est pas
 * un destinataire parce qu'il ne reçoit rien. La variable est lue à la
 * compilation (préfixe `VITE_`), donc l'absence de DSN élimine le code mort au
 * build plutôt que de le laisser dormir dans le fichier livré.
 */
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

/** Ce que la politique de confidentialité doit déclarer. Voir `legal.ts`. */
export const surveillanceActive = Boolean(DSN)

let demarre = false

/**
 * Les catégories de fil d'Ariane que Sentry pose d'office et qu'on retire.
 *
 * **C'est la décision la plus importante du fichier.** Par défaut, Sentry
 * enregistre le texte de chaque élément cliqué, chaque appel réseau et chaque
 * `console.log` des quelques minutes précédant l'erreur, puis les joint au
 * rapport. Sur Mamakilo, ça veut dire : le nom des aliments notés, les poids
 * pesés, les URL Supabase qui portent l'identifiant du compte. Autrement dit
 * des **données de santé** (RGPD, art. 9), transmises à l'occasion d'un bogue,
 * sans que personne l'ait demandé ni consenti pour cette finalité.
 *
 * Une trace d'appel et un message d'erreur suffisent à corriger un défaut. Le
 * reste est du contexte confortable payé en données personnelles.
 *
 * `BrowserSession` part pour une autre raison : il compte les sessions saines
 * pour calculer un taux de plantage. C'est de la mesure d'audience, pas du
 * diagnostic, et ça n'a pas sa place ici.
 */
const INTEGRATIONS_RETIREES = ['Breadcrumbs', 'HttpContext', 'BrowserSession']

/**
 * Charge et démarre Sentry — après le premier affichage, jamais avant.
 *
 * Le module pèse une trentaine de kilo-octets compressés. Le faire entrer dans
 * le fichier principal ferait payer à chaque ouverture de l'application un
 * code qui ne sert qu'au moment où quelque chose casse. L'import dynamique en
 * fait un fichier à part, que le navigateur va chercher une fois l'écran
 * affiché.
 */
export async function demarrerSurveillance(): Promise<void> {
  if (!DSN || demarre) return
  demarre = true

  const Sentry = await import('@sentry/react')

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.PROD ? 'production' : 'developpement',

    // Aucune mesure de performance : elle échantillonne des parcours entiers,
    // donc des URL et des durées d'écran, pour une question qu'on ne se pose
    // pas. Et surtout aucun `replayIntegration` — il filme l'écran.
    tracesSampleRate: 0,

    // `sendDefaultPii` est déjà faux par défaut ; l'écrire évite qu'une mise à
    // jour du SDK change la valeur sans qu'on s'en aperçoive.
    sendDefaultPii: false,

    integrations: (parDefaut) =>
      parDefaut.filter((integration) => !INTEGRATIONS_RETIREES.includes(integration.name)),

    /**
     * La dernière barrière, posée après tout le reste.
     *
     * Les intégrations retirées plus haut couvrent ce qu'on connaît ; celle-ci
     * couvre ce qu'une version future du SDK ajouterait d'office. Un champ
     * qu'on n'a pas prévu vaut mieux supprimé que transmis.
     */
    beforeSend(evenement) {
      delete evenement.user
      delete evenement.request
      evenement.breadcrumbs = undefined
      return evenement
    },
  })
}

/**
 * Signale une erreur déjà rattrapée par une barrière.
 *
 * Sans cet appel, une exception d'écran ne remonte pas : la barrière l'attrape,
 * donc elle n'atteint jamais le gestionnaire global de Sentry. C'est exactement
 * la classe de défauts qu'on veut voir — ceux qui cassent un écran sans casser
 * l'application, et dont personne ne se plaint parce qu'un écran de secours
 * s'affiche.
 *
 * Ne rien faire quand la surveillance est éteinte est volontaire : l'appelant
 * n'a pas à savoir si un DSN est configuré.
 */
export function signalerErreur(erreur: unknown, ou?: string): void {
  if (!DSN) return
  void import('@sentry/react').then((Sentry) => {
    Sentry.captureException(erreur, ou ? { tags: { ou } } : undefined)
  })
}
