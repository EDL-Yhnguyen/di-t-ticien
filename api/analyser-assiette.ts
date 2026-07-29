import Anthropic from '@anthropic-ai/sdk'

/**
 * Estimation du contenu d'une assiette à partir d'une photo.
 *
 * Cette fonction vit côté serveur pour une seule raison : la clé d'API. Elle
 * ne doit jamais entrer dans le navigateur — un fichier `VITE_*` finirait dans
 * le bundle public, et le dépôt est public.
 *
 * Ce que renvoie ce point d'entrée est une **estimation**, jamais une pesée.
 * L'écran d'appel le dit et laisse corriger chaque quantité avant l'ajout au
 * journal : c'est la règle produit, pas une précaution de façade.
 */

export const config = { runtime: 'edge' }

const MODELE = 'claude-opus-5'

/** 4 Mo est la limite d'une requête Edge ; on refuse bien avant d'y arriver. */
const TAILLE_MAX = 3_500_000

const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'] as const

const SCHEMA = {
  type: 'object',
  properties: {
    plausible: {
      type: 'boolean',
      description: "Faux si l'image ne montre pas de nourriture identifiable.",
    },
    commentaire: {
      type: 'string',
      description:
        "Une phrase en français, adressée à la personne, sur ce qui a été reconnu et sur ce dont tu n'es pas sûr.",
    },
    aliments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nom: { type: 'string', description: "Nom courant en français, au singulier." },
          quantiteG: { type: 'number', description: 'Quantité estimée en grammes.' },
          confiance: { type: 'string', enum: ['haute', 'moyenne', 'basse'] },
          valeurs: {
            type: 'object',
            properties: {
              kcal: { type: 'number' },
              proteines: { type: 'number' },
              glucides: { type: 'number' },
              sucres: { type: 'number' },
              lipides: { type: 'number' },
              satures: { type: 'number' },
              fibres: { type: 'number' },
              sel: { type: 'number' },
            },
            required: [
              'kcal',
              'proteines',
              'glucides',
              'sucres',
              'lipides',
              'satures',
              'fibres',
              'sel',
            ],
            additionalProperties: false,
          },
        },
        required: ['nom', 'quantiteG', 'confiance', 'valeurs'],
        additionalProperties: false,
      },
    },
  },
  required: ['plausible', 'commentaire', 'aliments'],
  additionalProperties: false,
} as const

const CONSIGNE = `Tu analyses la photo d'un repas pour une application française de suivi alimentaire.

Recense chaque aliment distinct que tu vois et estime sa quantité en grammes, en t'aidant des repères visibles sur la photo : diamètre d'une assiette (25 cm en général), taille des couverts, d'un verre, d'une main.

Pour chaque aliment, donne ses valeurs nutritionnelles **pour 100 g** (pas pour la portion) : kcal, protéines, glucides, sucres, lipides, acides gras saturés, fibres, sel en grammes. Appuie-toi sur les tables de composition françaises usuelles pour un aliment de ce type, préparé de la façon que suggère la photo — une pomme de terre frite et une pomme de terre vapeur n'ont pas les mêmes valeurs.

Règles :
- Sépare les composants d'un plat quand ils sont distincts à l'œil (viande, féculent, légumes, sauce). Ne sépare pas ce qui est mélangé : un gratin est un aliment, pas trois.
- Mets « basse » en confiance dès qu'un aliment est partiellement caché, que la préparation est incertaine, ou que la matière grasse ajoutée est invisible. C'est le cas le plus fréquent — n'aie pas peur de l'utiliser.
- N'invente pas ce que tu ne vois pas. Une sauce que tu devines sans la voir n'entre pas dans la liste ; mentionne-la dans le commentaire.
- Si la photo ne montre pas de nourriture identifiable, réponds plausible = false, une liste vide, et dis en une phrase ce que tu vois à la place.
- Le commentaire est adressé à la personne, en français, sans jargon et sans jugement sur ce qu'elle mange.`

function json(corps: unknown, statut: number): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export default async function handler(requete: Request): Promise<Response> {
  if (requete.method !== 'POST') {
    return json({ erreur: 'Méthode non autorisée.' }, 405)
  }

  const cle = process.env.ANTHROPIC_API_KEY
  if (!cle) {
    // Le message est lu tel quel par l'écran : il doit dire quoi faire.
    return json(
      {
        erreur:
          "Le scan par photo n'est pas encore activé sur ce déploiement. Ajoutez ANTHROPIC_API_KEY dans les variables d'environnement Vercel, puis relancez un déploiement.",
        configurable: true,
      },
      503,
    )
  }

  let corps: { image?: string; type?: string }
  try {
    corps = (await requete.json()) as typeof corps
  } catch {
    return json({ erreur: 'Requête illisible.' }, 400)
  }

  const { image, type } = corps
  if (!image || typeof image !== 'string') {
    return json({ erreur: 'Aucune image reçue.' }, 400)
  }
  if (image.length > TAILLE_MAX) {
    return json({ erreur: 'La photo est trop lourde. Reprenez-la en plus petit format.' }, 413)
  }
  const typeImage = TYPES_ACCEPTES.find((t) => t === type) ?? 'image/jpeg'

  const client = new Anthropic({ apiKey: cle })

  try {
    const reponse = await client.messages.create({
      model: MODELE,
      max_tokens: 8000,
      output_config: {
        // L'analyse d'une photo d'assiette est une tâche bornée : au-delà de
        // « medium », on paie du raisonnement sans gagner en justesse.
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: typeImage, data: image } },
            { type: 'text', text: CONSIGNE },
          ],
        },
      ],
    })

    if (reponse.stop_reason === 'refusal') {
      return json(
        { erreur: "L'analyse de cette image a été refusée. Essayez une autre photo." },
        422,
      )
    }

    const texte = reponse.content.find((bloc) => bloc.type === 'text')?.text
    if (!texte) {
      return json({ erreur: "L'analyse n'a rien renvoyé. Réessayez." }, 502)
    }

    return json(JSON.parse(texte), 200)
  } catch (erreur) {
    const statut = erreur instanceof Anthropic.APIError ? erreur.status : undefined

    if (statut === 401 || statut === 403) {
      return json({ erreur: "La clé d'API configurée est refusée par Anthropic." }, 502)
    }
    if (statut === 429) {
      return json({ erreur: 'Trop de scans à la suite. Réessayez dans une minute.' }, 429)
    }

    console.error('[analyser-assiette]', erreur)
    return json({ erreur: "L'analyse a échoué. Réessayez dans un instant." }, 502)
  }
}
