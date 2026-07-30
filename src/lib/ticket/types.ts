/**
 * Ce qu'on lit sur un ticket de caisse, et ce qu'on refuse d'en déduire.
 *
 * Un ticket photographié est la seule source de prix dont l'application
 * dispose : aucune enseigne française n'expose ses prix, et rien ici n'appelle
 * de modèle payant. La lecture est donc locale, imparfaite, et **assumée comme
 * telle** — chaque type de ce fichier porte la trace de ce qui n'a pas été lu
 * plutôt que de la combler.
 */

/**
 * Une ligne telle que l'OCR la rend, avant toute interprétation.
 *
 * Déclarée ici plutôt qu'auprès du moteur : le parseur ne doit rien savoir de
 * la façon dont le texte est arrivé, et ne pas dépendre du module qui démarre
 * un worker et lit `import.meta`. C'est ce qui permet de l'éprouver seul.
 */
export interface LigneOCR {
  texte: string
  /** Entre 0 et 1. */
  confiance: number
  /** Position dans l'image, en pixels — sert à retrouver l'ordre de lecture. */
  haut: number
  gauche: number
  droite: number
}

/** Ce que la quantité compte : des unités, un poids, un volume. */
export type UniteTicket = 'piece' | 'kg' | 'l'

/**
 * Une ligne de produit.
 *
 * `prixPaye` peut valoir `null`, et c'est le point central du module : une
 * ligne dont le prix ne s'est pas lu garde son libellé et attend une saisie.
 * Y mettre `0` ferait entrer un prix faux dans l'historique, où il deviendrait
 * aussitôt le « meilleur prix jamais vu » de ce produit — une erreur silencieuse
 * qui se propage, alors qu'un trou visible se comble en deux gestes.
 */
export interface LigneTicket {
  id: string
  /** Le libellé imprimé, tel quel. Le rapprochement produit vient plus tard. */
  libelle: string
  quantite: number
  unite: UniteTicket
  /** Le prix à l'unité ou au kilo, quand le ticket le détaille. */
  prixUnitaire: number | null
  /** Ce qui est réellement payé pour la ligne, remise déduite. */
  prixPaye: number | null
  /** Les remises rattachées à cette ligne, en valeur positive. */
  remise: number
  /** La confiance de l'OCR sur la ligne, entre 0 et 1. */
  confiance: number
  /**
   * Le texte lu, jamais réécrit.
   *
   * C'est la seule preuve de ce qui était imprimé une fois la photo jetée. Un
   * libellé corrigé à la main efface l'original ; sans cette copie, on ne peut
   * plus dire si la correction était justifiée.
   */
  brut: string
  /** Vrai quand l'écran doit demander confirmation avant d'enregistrer. */
  douteuse: boolean
}

/**
 * Un ticket lu, avant toute correction humaine.
 *
 * Les champs d'en-tête sont tous facultatifs : un ticket froissé perd souvent
 * sa date ou son enseigne, et refuser le ticket entier pour ça reviendrait à
 * jeter vingt lignes de prix correctes.
 */
export interface TicketLu {
  enseigne: string | null
  /** Date ISO (`AAAA-MM-JJ`), ou `null` si elle ne s'est pas lue. */
  date: string | null
  /** `HH:MM`, ou `null`. */
  heure: string | null
  lignes: LigneTicket[]
  /** Le total imprimé sur le ticket. C'est lui qui sert de contrôle. */
  total: number | null
  /**
   * Les remises qui ne se rattachent à aucun produit, en valeur positive.
   *
   * Certaines enseignes appliquent l'avantage fidélité en pied de ticket, sur
   * l'ensemble du panier. Sans ce champ, la somme des lignes dépasserait le
   * total imprimé et le contrôle déclarerait faux un ticket parfaitement lu.
   */
  remisesGlobales: number
  /**
   * Les lignes écartées comme non-produits, dans l'ordre.
   *
   * Gardées parce que le tri se trompe : un produit dont le libellé commence
   * par « TOTAL » (« TOTAL BLUE 500ML ») serait perdu sans recours. L'écran
   * permet d'en repêcher une.
   */
  ecartees: string[]
}

/**
 * Le contrôle de cohérence du ticket.
 *
 * **Un ticket de caisse porte sa propre somme de contrôle**, et c'est ce qui
 * rend un OCR local digne de confiance sans modèle payant : si l'addition des
 * lignes lues ne retombe pas sur le total imprimé, c'est qu'une ligne manque ou
 * qu'un chiffre est faux. On ne sait pas lequel, mais on sait qu'il y en a un —
 * et le dire vaut infiniment mieux que d'enregistrer une base de prix
 * silencieusement fausse.
 */
export interface ControleTicket {
  /** La somme des lignes dont le prix a été lu. */
  somme: number
  total: number | null
  /** `somme - total`. `null` quand le total n'a pas été lu. */
  ecart: number | null
  /** Le nombre de lignes sans prix — la première explication d'un écart. */
  sansPrix: number
  /**
   * Vrai quand l'addition retombe sur le total à un centime près.
   *
   * La tolérance n'est pas du confort : les arrondis de TVA font couramment
   * varier le total d'un centime, et refuser pour ça enverrait corriger un
   * ticket parfaitement lu.
   */
  coherent: boolean
}
