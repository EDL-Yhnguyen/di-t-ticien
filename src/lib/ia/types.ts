import type { ArticleStock, Moment } from '../types'
import type { Recette, Regime, Substitution, Tag } from '../recettes'

/**
 * Les **ports d'IA** du module Cuisine : ce que l'application saurait faire si
 * un modèle était branché, décrit comme un contrat et non comme un appel.
 *
 * Aucune implémentation réelle n'existe ici, et ce n'est pas un manque : les
 * fonctions Anthropic sont en attente d'une décision (voir `CLAUDE.md`). Ce
 * dossier existe pour que cette décision, le jour où elle tombe, ne demande pas
 * de réécrire les écrans — seulement de fournir une implémentation à la place du
 * bouchon.
 *
 * Trois règles gouvernent ce dossier, dans cet ordre :
 *
 * 1. **Un bouchon ne fabrique jamais de fausses données.** Il déclare son
 *    indisponibilité. Une recette inventée par personne, affichée comme une
 *    proposition, serait pire qu'un écran qui dit « pas encore disponible » :
 *    elle serait crue.
 * 2. **Aucun port ne reprend le travail des règles.** Le planificateur de menus,
 *    les bandes caloriques, les verdicts de repas restent dans `menu.ts`,
 *    `nutriscore.ts` et `coach.ts` : une remarque sur l'alimentation de quelqu'un
 *    doit pouvoir s'expliquer par une soustraction. C'est pourquoi il n'y a ici
 *    ni port de planification, ni port d'analyse nutritionnelle.
 * 3. **Chaque port déclare ce qu'il transmettrait.** Brancher un modèle, c'est
 *    envoyer des données à un tiers : le port porte donc la liste de ce qui
 *    partirait, pour que l'écran d'accord et `DESTINATAIRES` puissent la citer
 *    sans qu'on ait à relire le code de l'appel.
 */

/**
 * Le résultat d'un port.
 *
 * Un `Resultat` en échec n'est pas une exception : l'indisponibilité d'un modèle
 * est un état normal de cette application, pas un incident. L'écran doit pouvoir
 * l'afficher calmement, comme le font déjà le scan photo et le coach.
 */
export type Resultat<T> =
  | { ok: true; valeur: T }
  | {
      ok: false
      /**
       * `non-configure` : aucun modèle n'est branché — c'est l'état actuel.
       * `indisponible` : branché mais injoignable (réseau, quota, panne).
       * `refus` : le modèle a refusé, ou sa réponse était inexploitable.
       */
      raison: 'non-configure' | 'indisponible' | 'refus'
      /** Affichable tel quel : c'est le texte que verra la personne. */
      message: string
    }

/** Ce qu'un port dit de lui-même, y compris ce qu'il enverrait dehors. */
export interface DescriptionPort {
  id: string
  nom: string
  /** Ce que ça apporte, en une phrase compréhensible hors du code. */
  apport: string
  /**
   * Les données qui quitteraient l'appareil si ce port était branché.
   *
   * À tenir à jour comme un engagement : c'est cette liste qui alimentera l'écran
   * d'accord. Un port qui transmettrait le journal alimentaire doit le dire ici,
   * pas dans un commentaire au fond d'une fonction.
   */
  donneesTransmises: string[]
}

/* ──────────────────────── Les ports, un par capacité ──────────────────────── */

export interface ContraintesRecette {
  /** Ce qu'on a sous la main et qu'on veut employer. */
  ingredients: string[]
  moment?: Moment
  minutesMax?: number
  kcalCible?: number
  regimes?: Regime[]
  tags?: Tag[]
}

/**
 * Écrire une recette à partir de ce qu'il reste dans le frigo.
 *
 * C'est la capacité qui manque le plus à `/app/cuisiner` : aujourd'hui l'écran ne
 * peut proposer que des recettes du catalogue, donc il se tait quand la
 * combinaison d'ingrédients n'y figure pas.
 */
export interface PortRecettes {
  description: DescriptionPort
  proposer(contraintes: ContraintesRecette): Promise<Resultat<Recette[]>>
}

/**
 * Lire une photo de frigo ou de placard pour en tirer des articles.
 *
 * À distinguer du scan d'assiette existant (`api/analyser-assiette.ts`), qui
 * estime ce qui a été mangé : ici il s'agit de remplir un inventaire, et une
 * erreur ne fausse pas un journal alimentaire — elle propose un article à
 * corriger avant enregistrement.
 */
export interface PortFrigo {
  description: DescriptionPort
  /** L'image est passée en base64, comme le fait déjà `photo.ts`. */
  lire(imageBase64: string): Promise<Resultat<ArticleStock[]>>
}

/**
 * Proposer un remplacement pour un ingrédient qui manque.
 *
 * Le catalogue en porte déjà, écrites à la main (`substitutions`), mais seulement
 * pour une vingtaine de recettes et pour les cas prévus. Ce port répond à
 * l'imprévu : « je n'ai pas de crème, qu'est-ce que je mets ? ».
 */
export interface PortSubstitutions {
  description: DescriptionPort
  substituer(p: {
    ingredient: string
    recette: string
    disponibles?: string[]
  }): Promise<Resultat<Substitution[]>>
}

/** L'ensemble des ports, tel que le reste de l'application le voit. */
export interface PortsIA {
  recettes: PortRecettes
  frigo: PortFrigo
  substitutions: PortSubstitutions
}
