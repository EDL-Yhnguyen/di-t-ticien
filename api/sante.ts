/**
 * Le point de santé, pour la surveillance extérieure.
 *
 * **Interroger la page d'accueil ne prouve presque rien.** Elle est servie
 * depuis le cache de Vercel : elle répondra 200 avec un entrain parfait alors
 * que la base est injoignable et que plus personne ne peut se connecter. Une
 * surveillance qui ne regarde que ça annonce « tout va bien » pendant une
 * panne totale.
 *
 * Ce que cette route vérifie, c'est la seule dépendance dont l'application ne
 * peut rien faire sans elle : Supabase. Le mode de panne visé n'est pas
 * théorique — **l'offre gratuite met un projet en veille après une période
 * sans activité**, et rien ne prévient. C'est exactement le genre de panne
 * qu'on découvre par un message de quelqu'un qui n'arrive plus à entrer.
 *
 * Le code de retour est ce que lit UptimeRobot : 200 tant que la chaîne tient,
 * 503 dès qu'un maillon lâche. Le corps JSON est pour l'humain qui vient
 * regarder après avoir reçu l'alerte.
 */

export const config = { runtime: 'nodejs' }

/** Au-delà, on considère que la base ne répond pas — l'alerte vaut mieux tard que jamais. */
const DELAI_MS = 5000

export async function GET(): Promise<Response> {
  const url = process.env.VITE_SUPABASE_URL
  const cle = process.env.VITE_SUPABASE_ANON_KEY

  // Sans clés, l'application tourne en mode démo et n'a aucune base à joindre.
  // Répondre 503 ferait sonner une alerte pour une configuration délibérée.
  if (!url || !cle) {
    return reponse(200, { etat: 'ok', base: 'non configurée (mode démo)' })
  }

  try {
    const debut = Date.now()
    const r = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: cle },
      signal: AbortSignal.timeout(DELAI_MS),
    })
    const ms = Date.now() - debut

    // On interroge `auth`, et pas la table `donnees` : la santé du service
    // d'authentification se lit sans clé de service et sans traverser la RLS,
    // donc sans qu'aucune donnée de santé n'entre dans un point de contrôle
    // que n'importe qui peut appeler.
    if (!r.ok) {
      return reponse(503, { etat: 'panne', base: `réponse ${r.status}`, ms })
    }
    return reponse(200, { etat: 'ok', base: 'joignable', ms })
  } catch (erreur) {
    const cause = erreur instanceof Error ? erreur.name : 'inconnue'
    return reponse(503, { etat: 'panne', base: `injoignable (${cause})` })
  }
}

function reponse(code: number, corps: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ...corps, verifieLe: new Date().toISOString() }), {
    status: code,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Une réponse de santé mise en cache est une réponse qui ment.
      'cache-control': 'no-store',
    },
  })
}
