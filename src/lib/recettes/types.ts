import type { Categorie, Moment, Rayon } from '../types'

/**
 * Le rayon vit maintenant dans `lib/types.ts`, avec le garde-manger et les
 * courses qui s'en servent autant que le catalogue. Réexporté ici pour que
 * `from '../lib/recettes'` continue de le fournir, comme partout jusqu'ici.
 */
export type { Rayon }
export { RAYONS } from '../types'

export type Saison = 'printemps' | 'ete' | 'automne' | 'hiver'

export const SAISONS: Saison[] = ['printemps', 'ete', 'automne', 'hiver']

export const LIBELLE_SAISON: Record<Saison, string> = {
  printemps: 'Printemps',
  ete: 'Été',
  automne: 'Automne',
  hiver: 'Hiver',
}

/**
 * Étiquettes de filtrage. Elles répondent aux questions qu'on se pose vraiment
 * devant le frigo : « j'ai dix minutes », « il faut que ça se transporte »,
 * « c'est mon repas plaisir de la semaine ».
 */
export type Tag =
  | 'rapide'
  | 'batch'
  | 'vegetarien'
  | 'sans-cuisson'
  | 'nomade'
  | 'une-casserole'
  | 'economique'
  | 'plaisir'

export const LIBELLE_TAG: Record<Tag, string> = {
  rapide: 'Moins de 15 min',
  batch: 'Se prépare à l’avance',
  vegetarien: 'Végétarien',
  'sans-cuisson': 'Sans cuisson',
  nomade: 'Se transporte',
  'une-casserole': 'Un seul plat',
  economique: 'Économique',
  plaisir: 'Repas plaisir',
}

/**
 * D'où vient le plat — la « cuisine du monde » du brief.
 *
 * C'est une origine culinaire, pas une nationalité : « méditerranéenne » couvre
 * ce qui se cuisine autour du bassin sans appartenir à un pays précis, et rien
 * n'oblige une recette à en porter une.
 */
export type Cuisine =
  | 'francaise'
  | 'italienne'
  | 'mediterraneenne'
  | 'orientale'
  | 'asiatique'
  | 'indienne'
  | 'mexicaine'
  | 'nordique'
  | 'britannique'
  | 'americaine'

export const LIBELLE_CUISINE: Record<Cuisine, string> = {
  francaise: 'Française',
  italienne: 'Italienne',
  mediterraneenne: 'Méditerranéenne',
  orientale: 'Orientale',
  asiatique: 'Asiatique',
  indienne: 'Indienne',
  mexicaine: 'Mexicaine',
  nordique: 'Nordique',
  britannique: 'Britannique',
  americaine: 'Américaine',
}

export type Difficulte = 'facile' | 'intermediaire' | 'technique'

export const LIBELLE_DIFFICULTE: Record<Difficulte, string> = {
  facile: 'Facile',
  intermediaire: 'Un peu de technique',
  technique: 'Pour cuisiner tranquille',
}

/**
 * Régimes qu'une recette respecte.
 *
 * **Un régime n'est jamais déduit d'une liste d'ingrédients.** « Sans gluten »
 * annoncé à tort n'est pas une imprécision, c'est un risque sanitaire pour une
 * personne cœliaque — et la sauce soja, la moutarde ou une charcuterie en
 * contiennent sans le dire dans leur nom. Seul `regimes`, renseigné à la main,
 * fait foi ; « végétarien » est la seule exception, il se lit sur le tag qui
 * existait déjà.
 */
export type Regime = 'vegetarien' | 'vegan' | 'sans-gluten' | 'sans-lactose'

export const LIBELLE_REGIME: Record<Regime, string> = {
  vegetarien: 'Végétarien',
  vegan: 'Végétalien',
  'sans-gluten': 'Sans gluten',
  'sans-lactose': 'Sans lactose',
}

/** Remplacer un ingrédient : ce qu'on met à la place, et ce que ça change. */
export interface Substitution {
  ingredient: string
  par: string
  /** Ce que le remplacement change vraiment — goût, texture, temps de cuisson. */
  effet?: string
}

/** La même recette avec l'appareil qu'on a sous la main. */
export interface VarianteAppareil {
  appareil: string
  instructions: string
}

export interface Ingredient {
  nom: string
  quantite: string
  rayon: Rayon
}

export interface Recette {
  id: string
  titre: string
  moment: Moment
  minutes: number
  kcal: number
  /** Ce que la recette couvre dans l'assiette — sert à la relier au plan. */
  couvre: Categorie[]
  ingredients: Ingredient[]
  etapes: string[]
  astuce?: string
  tags: Tag[]
  /** Renseigné pour les recettes qui se cuisinent en avance : combien de temps ça tient. */
  conservation?: string
  /** Absent = disponible toute l'année. */
  saisons?: Saison[]

  /* ── Champs du sprint C3 ── */

  /** Origine culinaire. Absente = pas de rattachement revendiqué. */
  cuisine?: Cuisine
  /**
   * Absente, elle se déduit du nombre d'étapes et du temps (`difficulteDe`).
   * À renseigner seulement quand la déduction se trompe : un plat de trois
   * étapes peut demander un tour de main.
   */
  difficulte?: Difficulte
  /**
   * Pas de champ `portions` — et c'est une décision, pas un oubli.
   *
   * `kcal` et les quantités sont écrits **pour une personne**, et tout le reste
   * du produit le lit ainsi : le planificateur vise la cible calorique d'un
   * repas, les bandes vert/bleu/orange comparent à l'objectif d'une journée, le
   * journal enregistre une portion. Déclarer qu'une recette « couvre quatre
   * personnes » sans toucher à `kcal` rendrait ces trois lectures fausses d'un
   * facteur quatre, silencieusement.
   *
   * Cuisiner pour plusieurs est donc un calcul d'affichage — `ingredientsPour()`
   * multiplie les quantités —, jamais une donnée du catalogue.
   */
  /** Régimes garantis, renseignés à la main. Voir `Regime`. */
  regimes?: Regime[]
  substitutions?: Substitution[]
  /** Comment le remettre chaud sans l'abîmer — pour ce qui se prépare à l'avance. */
  rechauffage?: string
  appareils?: VarianteAppareil[]
  /**
   * **Jamais renseigné.** Aucune banque d'images libre ne couvre ce catalogue, et
   * une photo d'emprunt mentirait sur ce qu'on va obtenir. Le champ existe pour
   * le jour où des photos seront prises ; en son absence, l'écran dégrade vers
   * une illustration générée — jamais vers un cadre vide.
   */
  photo?: string
}
