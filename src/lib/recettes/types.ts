import type { Categorie, Moment } from '../types'

export type Rayon =
  | 'Fruits et légumes'
  | 'Boucherie, poissonnerie'
  | 'Crèmerie'
  | 'Surgelés'
  | 'Boulangerie'
  | 'Épicerie'

/** Dans l'ordre où on traverse le magasin — la liste de courses suit ce fil. */
export const RAYONS: Rayon[] = [
  'Fruits et légumes',
  'Boucherie, poissonnerie',
  'Crèmerie',
  'Surgelés',
  'Boulangerie',
  'Épicerie',
]

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
}
