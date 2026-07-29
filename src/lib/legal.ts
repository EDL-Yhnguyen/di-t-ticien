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
  /** Nom et prénom, ou raison sociale. Facultatif pour un éditeur non professionnel. */
  nom: string
  /** « particulier », « auto-entrepreneur », « SAS au capital de… ». */
  statut: string
  /** Adresse du siège ou du domicile. Facultative pour un éditeur non professionnel. */
  adresse: string
  /** L'adresse à laquelle on exerce ses droits. Elle doit être relevée. */
  contact: string
}

/**
 * Éditeur **non professionnel** : un particulier qui publie sans en tirer de
 * revenu. La LCEN (art. 6-III-2) l'autorise alors à ne pas rendre publics son
 * nom et son adresse, à condition de les avoir communiqués à son hébergeur,
 * qui les tient à disposition de l'autorité judiciaire.
 *
 * Ce n'est pas une dispense : le compte Vercel doit être à la véritable
 * identité. Et ça tombe **dès le premier euro encaissé** — l'abonnement Stripe
 * du sprint 8 fera basculer le site en édition professionnelle, ce qui rendra
 * `nom`, `statut` et `adresse` obligatoires et publics.
 */
export const EDITEUR_NON_PROFESSIONNEL = true

export const EDITEUR: Editeur = {
  nom: '',
  statut: 'particulier, éditeur à titre non professionnel',
  adresse: '',
  contact: 'yhnguyen.edl@gmail.com',
}

/**
 * Vrai quand l'adresse de contact est encore le repère laissé par défaut. Le
 * RGPD ne dispense personne d'un point de contact (art. 13) : celle-ci doit
 * devenir une vraie boîte, relevée, avant d'ouvrir le site à qui que ce soit.
 */
export const contactProvisoire: boolean = EDITEUR.contact.endsWith('@example.com')

/** L'identité publiable est-elle complète pour le régime déclaré ? */
export const editeurRenseigne: boolean =
  EDITEUR.contact.trim() !== '' &&
  (EDITEUR_NON_PROFESSIONNEL ||
    [EDITEUR.nom, EDITEUR.statut, EDITEUR.adresse].every((v) => v.trim() !== ''))

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
    role: 'Analyse des photos de repas et coach conversationnel',
    donnees:
      'La photo que vous envoyez, uniquement au moment où vous demandez son analyse. Pour le coach, et seulement après votre accord donné dans l’écran dédié : votre question, votre profil (âge, sexe, taille, poids, objectif) et votre journée en cours. Rien de tout cela n’est conservé par nous ni rattaché à votre compte, et le coach reste refusable sans rien perdre du reste.',
  },
  {
    nom: 'Open Food Facts',
    role: 'Recherche de produits et codes-barres',
    donnees:
      'Le terme recherché ou le code-barres scanné. Aucun identifiant de compte n’accompagne la requête.',
  },
]
