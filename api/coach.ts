import Anthropic from '@anthropic-ai/sdk'

/**
 * Le coach conversationnel.
 *
 * Comme `analyser-assiette`, cette fonction vit côté serveur pour la seule
 * raison de la clé d'API. Elle reçoit la question, un instantané de la journée
 * préparé par le navigateur, et renvoie une réponse en texte.
 *
 * **Ce point d'entrée ne remplace pas `coach.ts`.** Les analyses chiffrées —
 * verdict d'un repas, recommandation du suivant, alternatives — restent des
 * règles lisibles côté client : une remarque sur l'alimentation de quelqu'un
 * doit pouvoir s'expliquer. Le modèle est là pour répondre aux questions que
 * des règles ne couvrent pas, à partir des mêmes chiffres.
 */

/** Runtime Node et export nommé, pour les raisons expliquées dans `analyser-assiette.ts`. */
export const config = { runtime: 'nodejs', maxDuration: 60 }

const MODELE = 'claude-opus-5'

/** Au-delà, ce n'est plus une conversation, c'est un historique à résumer. */
const MESSAGES_MAX = 24
const CARACTERES_MAX = 2000

/** Le plancher calorique de l'application. Le coach ne descend jamais en dessous. */
const PLANCHER_KCAL = 1200

interface MessageEntrant {
  role?: string
  texte?: string
}

interface RepasContexte {
  moment?: string
  kcal?: number
  aliments?: string[]
}

interface SeanceContexte {
  libelle?: string
  minutes?: number
  kcal?: number
}

interface Contexte {
  prenom?: string
  age?: number
  sexe?: string
  tailleCm?: number
  poidsKg?: number
  poidsObjectifKg?: number
  activite?: string
  imc?: number
  objectifKcal?: number
  bonusSportKcal?: number
  date?: string
  kcalMangees?: number
  proteines?: number
  glucides?: number
  lipides?: number
  fibres?: number
  repas?: RepasContexte[]
  seances?: SeanceContexte[]
  serieJours?: number
  suiviParUnProfessionnel?: boolean
  planPrescrit?: boolean
}

const CONSIGNE = `Tu es le coach nutrition de Mamakilo, une application française de suivi alimentaire. Tu parles à la personne qui l'utilise.

Ce que tu es :
- Un accompagnateur du quotidien : tu aides à comprendre ses chiffres, à choisir un repas, à tenir dans la durée.
- Bienveillant et concret. Jamais de morale, jamais de reproche sur ce qui a été mangé. Quelqu'un qui ouvre cette page a déjà fait le plus dur.

Ce que tu n'es pas :
- Tu n'es ni médecin ni diététicien, et Mamakilo n'est pas un dispositif médical. Tu ne poses aucun diagnostic et tu ne prescris rien.
- Dès qu'il est question de maladie, de traitement médicamenteux, de grossesse ou d'allaitement, d'un enfant, d'un trouble du comportement alimentaire, ou d'un symptôme inquiétant : dis-le simplement et renvoie vers un professionnel de santé. Tu peux continuer à parler du reste.
- Tu ne proposes jamais de descendre sous ${PLANCHER_KCAL} kcal par jour, ni de jeûner, ni de supprimer une catégorie d'aliments entière.

Comment tu réponds :
- En français, en vouvoyant.
- Court : deux à quatre phrases dans le cas général. Une liste seulement si la question appelle vraiment une énumération, et alors trois ou quatre points, pas dix.
- Tu réponds à ce qui est demandé, sans dérouler tout ce que tu sais.
- Les chiffres du contexte font foi. Tu peux les commenter et les comparer, jamais les réécrire. Si une donnée te manque, dis-le et propose de la renseigner dans l'application plutôt que d'inventer.
- Les valeurs nutritionnelles que tu cites de mémoire sont des ordres de grandeur : présente-les comme tels.
- Tu ne peux rien faire dans l'application à la place de la personne — tu ne peux ni ajouter un aliment au journal, ni modifier un objectif. Tu peux dire où le faire.`

function json(corps: unknown, statut: number): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function nombre(valeur: unknown): number | null {
  return typeof valeur === 'number' && Number.isFinite(valeur) ? Math.round(valeur) : null
}

function texteCourt(valeur: unknown, limite = 120): string | null {
  if (typeof valeur !== 'string') return null
  const propre = valeur.trim().slice(0, limite)
  return propre === '' ? null : propre
}

/**
 * Le contexte est réécrit ligne à ligne plutôt que sérialisé en JSON : le
 * modèle lit mieux une fiche que des accolades, et ce passage garantit qu'aucun
 * champ inattendu envoyé par le navigateur n'atterrit dans la consigne.
 */
function decrireContexte(c: Contexte): string {
  const lignes: string[] = []
  const ajouter = (libelle: string, valeur: string | number | null) => {
    if (valeur !== null && valeur !== '') lignes.push(`- ${libelle} : ${valeur}`)
  }

  ajouter('Prénom', texteCourt(c.prenom, 40))
  ajouter('Âge', nombre(c.age))
  ajouter('Sexe', c.sexe === 'homme' ? 'homme' : c.sexe === 'femme' ? 'femme' : null)
  ajouter('Taille (cm)', nombre(c.tailleCm))
  ajouter('Poids actuel (kg)', nombre(c.poidsKg))
  ajouter('Poids visé (kg)', nombre(c.poidsObjectifKg))
  ajouter('IMC', nombre(c.imc))
  ajouter('Activité au quotidien', texteCourt(c.activite, 60))
  ajouter('Date du jour', texteCourt(c.date, 10))
  ajouter('Objectif calorique du jour (kcal)', nombre(c.objectifKcal))

  const bonus = nombre(c.bonusSportKcal)
  if (bonus !== null && bonus > 0) {
    ajouter('Dont gagné en bougeant aujourd’hui (kcal)', bonus)
  }

  ajouter('Mangé aujourd’hui (kcal)', nombre(c.kcalMangees))
  ajouter('Protéines (g)', nombre(c.proteines))
  ajouter('Glucides (g)', nombre(c.glucides))
  ajouter('Lipides (g)', nombre(c.lipides))
  ajouter('Fibres (g)', nombre(c.fibres))
  ajouter('Jours de suivi d’affilée', nombre(c.serieJours))

  const repas = (c.repas ?? []).slice(0, 8)
  if (repas.length > 0) {
    lignes.push('- Repas notés aujourd’hui :')
    for (const r of repas) {
      const moment = texteCourt(r.moment, 40) ?? 'Repas'
      const kcal = nombre(r.kcal)
      const aliments = (r.aliments ?? [])
        .slice(0, 12)
        .map((a) => texteCourt(a, 60))
        .filter((a): a is string => a !== null)
      lignes.push(
        `    · ${moment}${kcal !== null ? ` (${kcal} kcal)` : ''}${
          aliments.length > 0 ? ` : ${aliments.join(', ')}` : ''
        }`,
      )
    }
  } else {
    lignes.push('- Aucun repas noté aujourd’hui pour l’instant.')
  }

  const seances = (c.seances ?? []).slice(0, 6)
  if (seances.length > 0) {
    lignes.push('- Séances de sport aujourd’hui :')
    for (const s of seances) {
      const libelle = texteCourt(s.libelle, 60) ?? 'Séance'
      const minutes = nombre(s.minutes)
      const kcal = nombre(s.kcal)
      lignes.push(
        `    · ${libelle}${minutes !== null ? ` — ${minutes} min` : ''}${
          kcal !== null ? `, environ ${kcal} kcal` : ''
        }`,
      )
    }
  }

  if (c.suiviParUnProfessionnel === true) {
    // Le nom et les coordonnées du praticien ne sortent jamais du navigateur :
    // ce sont les données d'un tiers, qui n'a rien demandé.
    lignes.push(
      '- Cette personne est suivie par un professionnel de santé. Renvoyez-y quand la question relève de lui.',
    )
  }
  if (c.planPrescrit === true) {
    lignes.push(
      '- Elle suit un plan alimentaire prescrit. Ne le contredisez pas : expliquez-le, ou renvoyez vers celui qui l’a écrit.',
    )
  }

  return lignes.join('\n')
}

export async function POST(requete: Request): Promise<Response> {
  const cle = process.env.ANTHROPIC_API_KEY
  if (!cle) {
    return json(
      {
        erreur:
          "Le coach n'est pas encore activé sur ce déploiement. Ajoutez ANTHROPIC_API_KEY dans les variables d'environnement Vercel, puis relancez un déploiement.",
        configurable: true,
      },
      503,
    )
  }

  let corps: { messages?: MessageEntrant[]; contexte?: Contexte }
  try {
    corps = (await requete.json()) as typeof corps
  } catch {
    return json({ erreur: 'Requête illisible.' }, 400)
  }

  const entrants = Array.isArray(corps.messages) ? corps.messages.slice(-MESSAGES_MAX) : []
  const messages = entrants
    .map((m) => ({
      role: m.role === 'coach' ? ('assistant' as const) : ('user' as const),
      content: typeof m.texte === 'string' ? m.texte.trim().slice(0, CARACTERES_MAX) : '',
    }))
    .filter((m) => m.content !== '')

  // L'API refuse un historique qui ne commence pas par l'utilisateur ou qui
  // finit sur l'assistant ; le navigateur ne peut pas produire ce cas, mais il
  // n'est pas la seule chose qui puisse appeler cette adresse.
  while (messages.length > 0 && messages[0].role === 'assistant') messages.shift()
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return json({ erreur: 'Aucune question reçue.' }, 400)
  }

  const client = new Anthropic({ apiKey: cle })

  try {
    const reponse = await client.messages.create({
      model: MODELE,
      // Assez pour une réponse courte et le raisonnement qui la précède ; le
      // modèle réfléchit par défaut et cette limite couvre les deux.
      max_tokens: 4000,
      // Une conversation de coaching n'est pas une tâche de raisonnement
      // profond : au-delà, on paie de la réflexion sans gagner en justesse, et
      // la personne attend devant son écran.
      output_config: { effort: 'low' },
      system: `${CONSIGNE}\n\nCe que vous savez de la personne aujourd’hui :\n${decrireContexte(
        corps.contexte ?? {},
      )}`,
      messages,
    })

    if (reponse.stop_reason === 'refusal') {
      return json(
        { erreur: 'Le coach préfère ne pas répondre à cette question. Reformulez-la autrement.' },
        422,
      )
    }

    const texte = reponse.content
      .filter((bloc) => bloc.type === 'text')
      .map((bloc) => bloc.text)
      .join('')
      .trim()

    if (!texte) {
      return json({ erreur: "Le coach n'a rien répondu. Réessayez." }, 502)
    }

    return json({ reponse: texte }, 200)
  } catch (erreur) {
    const statut = erreur instanceof Anthropic.APIError ? erreur.status : undefined

    if (statut === 401 || statut === 403) {
      return json({ erreur: "La clé d'API configurée est refusée par Anthropic." }, 502)
    }
    if (statut === 429) {
      return json({ erreur: 'Trop de questions à la suite. Réessayez dans une minute.' }, 429)
    }

    console.error('[coach]', erreur)
    return json({ erreur: 'Le coach est injoignable pour le moment. Réessayez dans un instant.' }, 502)
  }
}
