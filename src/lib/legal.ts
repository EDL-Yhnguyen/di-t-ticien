/**
 * Identité de l'éditeur et des sous-traitants.
 *
 * Ces valeurs ne peuvent pas être devinées par le code : l'identification de
 * l'éditeur est une obligation légale (LCEN, art. 6-III) et le responsable de
 * traitement doit être nommé dans la politique de confidentialité (RGPD,
 * art. 13). Tant que `EDITEUR` n'est pas rempli, les écrans concernés
 * affichent un avertissement plutôt qu'une fausse mention.
 */

import { surveillanceActive } from './surveillance'

/**
 * Date de la version en vigueur du texte de confidentialité. La changer
 * redemande son consentement à tout le monde — ne la toucher que si le texte
 * change sur le fond (nouvelle donnée collectée, nouveau destinataire).
 *
 * **Elle passe au 07/08/2026, et ce n'est pas Sentry qui la fait bouger.**
 * C'est **Google**, ajouté aux destinataires : il achemine les courriels de
 * réinitialisation depuis que Mamakilo a rejoint le projet Supabase partagé le
 * 04/08/2026, sans avoir jamais été déclaré. Le traitement ne change donc pas,
 * c'est l'information qui devient exacte — et un consentement doit être éclairé
 * pour valoir, a fortiori sur des données de santé.
 *
 * **La date est inconditionnelle, contrairement à ce qui avait été écrit
 * d'abord.** Sentry, lui, n'est déclaré que s'il est branché — mais Google
 * l'est toujours, donc conditionner la version à `surveillanceActive` ferait
 * dépendre une re-sollicitation méritée d'un réglage sans rapport. Tout le
 * monde est donc resollicité au prochain déploiement ; et si la surveillance
 * est activée ensuite, personne ne l'est deux fois, la date étant déjà celle du
 * jour.
 */
export const VERSION_CONFIDENTIALITE = '2026-08-07'

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
 * identité.
 *
 * **C'est l'état durable du site** (décidé le 29/07/2026) : la diffusion reste
 * familiale et aucun abonnement n'est prévu.
 *
 * Le site porte depuis le 30/07/2026 un **lien de parrainage iGraal**, et le
 * régime ne change pas pour autant : le critère de la LCEN est l'exercice d'une
 * **activité professionnelle**, qu'un lien isolé, signalé comme tel et
 * rapportant du cashback occasionnel ne constitue pas.
 *
 * Le drapeau tomberait si Mamakilo devenait payant, portait de la publicité
 * vendue à des tiers, ou si les revenus d'affiliation devenaient réguliers et
 * recherchés pour eux-mêmes. Il faudrait alors passer
 * `EDITEUR_NON_PROFESSIONNEL` à `false` et remplir `nom`, `statut` et
 * `adresse`, qui deviendraient publics.
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
 * résident physiquement les données de santé — donc si le RGPD s'applique sans
 * transfert hors UE.
 *
 * Depuis la migration du 02/08/2026, la base est le projet
 * `exovzmoygupllcdjbwtf`, en **`eu-west-3`** — *West EU (Paris)*. Elle était
 * auparavant sur `vdnfqijjmuxdrimbyyrv`, en `eu-west-1` (Irlande) ; les deux
 * sont dans l'Union, donc rien de ce que dit la politique de confidentialité
 * sur le fond ne change. Mais une mention légale qui nomme le mauvais pays
 * pour des données de santé est fausse, et c'est le genre d'inexactitude qu'on
 * ne peut corriger qu'avant qu'elle serve d'argument. Le fichier avait déjà
 * annoncé Francfort à tort, qui est `eu-central-1`.
 *
 * **Cette ligne se change en même temps que `VITE_SUPABASE_URL`, jamais
 * après** : entre les deux, la politique affichée ment sur le pays
 * d'hébergement. Elle se relit dans le tableau de bord Supabase
 * (Settings → General → Region), seule source qui fasse foi — aucun code ne
 * peut la deviner.
 */
export const REGION_BASE = 'Union européenne (France)'

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
  /**
   * **Il manquait, et la migration du 04/08/2026 l'a rendu vrai sans que
   * personne le remarque.** Mamakilo a rejoint ce jour-là le projet Supabase de
   * Cérémonia, où un SMTP Gmail est branché depuis le 31/07/2026. Le réglage
   * vit dans la console, hors dépôt : rien dans le code ne le rappelait, et la
   * liste des destinataires est restée celle d'avant la migration.
   *
   * C'est le même raisonnement que celui qui a fait chasser Google Fonts le
   * 31/07/2026 — « transmettre l'adresse IP d'un visiteur à un tiers en fait un
   * destinataire » —, appliqué à une donnée bien plus identifiante qu'une
   * adresse IP, et sur une application qui traite des données de santé.
   *
   * ⚠️ **Le réglage est partagé avec Cérémonia et GénieLab.** En changer ici
   * change leur acheminement aussi.
   */
  {
    nom: 'Google (Gmail)',
    role: 'Acheminement du courriel de réinitialisation du mot de passe',
    donnees:
      'Votre adresse de courriel, au moment précis où vous demandez un nouveau mot de passe, et le texte du message — qui ne contient qu’un lien. Rien de votre journal, de vos pesées ni de votre profil ne l’accompagne. Les comptes créés sous un pseudo n’ont pas d’adresse : rien ne part pour eux, et ils ne peuvent pas non plus être récupérés ainsi.',
  },
  ...(surveillanceActive
    ? [
        {
          nom: 'Sentry',
          role: 'Signalement des pannes de l’application',
          donnees:
            'Uniquement lorsqu’un écran cesse de fonctionner : le message d’erreur technique, l’endroit du code où il s’est produit, et votre navigateur. Ni votre compte, ni ce que vous avez noté, ni ce que vous veniez de faire — le fil des actions précédentes, que ce service enregistre d’ordinaire, est explicitement désactivé parce qu’il contiendrait le nom de vos aliments et vos pesées.',
        },
      ]
    : []),
]
