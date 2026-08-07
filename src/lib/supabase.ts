import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * Le fragment d'URL est lu **avant** la création du client, et c'est
 * indispensable : `detectSessionInUrl` le consomme et le retire de la barre
 * d'adresse pendant l'initialisation du client. Après, plus rien ne dirait
 * qu'on arrive par un lien de réinitialisation — et l'écran de connexion
 * s'afficherait à la place du choix d'un nouveau mot de passe.
 *
 * L'événement `PASSWORD_RECOVERY` ne suffit pas seul : il est émis pendant
 * cette même initialisation, donc avant qu'un composant React ait pu s'y
 * abonner. Les deux signaux se complètent.
 */
const fragment = new URLSearchParams(
  typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, ''),
)

/** Vrai quand la page a été ouverte depuis le lien reçu par e-mail. */
export const arriveeParLienDeRecuperation = fragment.get('type') === 'recovery'

/**
 * Un lien périmé ou déjà utilisé revient avec une erreur dans le fragment
 * plutôt qu'avec une session. Sans ce message, la personne retombe sur
 * l'écran de connexion sans comprendre pourquoi son lien n'a rien fait.
 */
export const erreurDuLienRecu: string | null = (() => {
  const code = fragment.get('error_code')
  if (!code && !fragment.get('error')) return null
  if (code === 'otp_expired') {
    return 'Ce lien a expiré. Demandez-en un nouveau, il est valable une heure.'
  }
  return 'Ce lien n’est plus valable. Demandez-en un nouveau.'
})()

/**
 * Sans clés, l'application bascule en mode démo : les comptes et les données
 * restent dans le navigateur. Tout le reste de l'app fonctionne à l'identique,
 * ce qui permet de développer et de tester sans dépendre du réseau.
 *
 * **Une clé *présente mais malformée* ne doit pas faire mieux qu'une clé
 * absente.** `createClient` lève sur une URL invalide, et il est appelé ici au
 * niveau du module : l'exception part donc pendant le chargement du fichier,
 * **avant que React ait monté quoi que ce soit**. Ni `BarriereErreur` ni l'écran
 * de dernier recours de `main.tsx` ne peuvent l'attraper — c'est une page
 * blanche, sans message, et la seule trace est dans une console que personne
 * n'ouvre.
 *
 * Ce n'est pas théorique : une variable mal collée (BOM, espace, guillemets
 * conservés) suffit, et c'est exactement ce qui traîne dans le `.env` de la
 * machine de développement au 07/08/2026 — il y met trois suites de tests par
 * terre, `auth.ts` important ce fichier. Le même contenu déployé sur Vercel
 * rendrait l'application entièrement muette.
 *
 * Le repli est donc le mode démo, qui est déjà le comportement prévu quand la
 * configuration manque. Il est bruyant en console, parce qu'une application qui
 * bascule en démo sans le dire ferait croire à une perte de données.
 */
export const supabase: SupabaseClient | null = (() => {
  if (!url || !cle) return null
  try {
    return createClient(url, cle, { auth: { persistSession: true } })
  } catch (erreur) {
    console.error(
      '[supabase] configuration invalide, l’application démarre en mode démo :',
      erreur instanceof Error ? erreur.message : erreur,
    )
    return null
  }
})()

export const modeDemo = supabase === null
