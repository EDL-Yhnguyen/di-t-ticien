/**
 * Identité de l'éditeur et des sous-traitants.
 *
 * Ces valeurs ne peuvent pas être devinées par le code : l'identification de
 * l'éditeur est une obligation légale (LCEN, art. 6-III) et le responsable de
 * traitement doit être nommé dans la politique de confidentialité (RGPD,
 * art. 13). Tant que `EDITEUR` n'est pas rempli, les écrans concernés
 * affichent un avertissement plutôt qu'une fausse mention.
 */

/**
 * Date de la version en vigueur du texte de confidentialité. La changer
 * redemande son consentement à tout le monde — ne la toucher que si le texte
 * change sur le fond (nouvelle donnée collectée, nouveau destinataire).
 */
export const VERSION_CONFIDENTIALITE = '2026-07-29'

export interface Editeur {
  /** Nom et prénom, ou raison sociale. */
  nom: string
  /** « particulier », « auto-entrepreneur », « SAS au capital de… ». */
  statut: string
  /** Adresse du siège ou du domicile de l'éditeur. */
  adresse: string
  /** L'adresse à laquelle on exerce ses droits. Elle doit être relevée. */
  contact: string
}

export const EDITEUR: Editeur = {
  nom: '',
  statut: '',
  adresse: '',
  contact: '',
}

export const editeurRenseigne: boolean = Object.values(EDITEUR).every((v) => v.trim() !== '')

export const HEBERGEUR_SITE = {
  nom: 'Vercel Inc.',
  adresse: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
  site: 'https://vercel.com',
}

export const HEBERGEUR_BASE = {
  nom: 'Supabase Inc.',
  adresse: '970 Toa Payoh North, Singapour',
  site: 'https://supabase.com',
}

/**
 * La région du projet Supabase, choisie à sa création. Elle détermine où
 * résident physiquement les données de santé — donc si le RGPD s'applique
 * sans transfert hors UE. À corriger si le projet n'est pas à Francfort.
 */
export const REGION_BASE = 'Union européenne (Francfort)'

/** Les tiers qui reçoivent quelque chose, et ce qu'ils en reçoivent. */
export const DESTINATAIRES = [
  {
    nom: 'Vercel',
    role: 'Hébergement du site',
    donnees: 'Adresse IP et journaux techniques de connexion, comme tout site web.',
  },
  {
    nom: 'Supabase',
    role: 'Hébergement de la base',
    donnees:
      'Votre compte et l’intégralité de votre document de données, chiffré en transit. En mode démo, rien n’est envoyé.',
  },
  {
    nom: 'Anthropic',
    role: 'Analyse des photos de repas',
    donnees:
      'La photo que vous envoyez, uniquement au moment où vous demandez son analyse. Elle n’est ni conservée par nous, ni rattachée à votre compte.',
  },
  {
    nom: 'Open Food Facts',
    role: 'Recherche de produits et codes-barres',
    donnees:
      'Le terme recherché ou le code-barres scanné. Aucun identifiant de compte n’accompagne la requête.',
  },
]
