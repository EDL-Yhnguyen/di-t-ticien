export type Sexe = 'femme' | 'homme'

export type Activite = 'sedentaire' | 'leger' | 'modere' | 'actif'

export type Moment = 'petit-dejeuner' | 'dejeuner' | 'diner'

/** Les catégories de l'assiette équilibrée telle que la prescrit la diététicienne. */
export type Categorie =
  | 'proteine'
  | 'feculent'
  | 'legume'
  | 'laitier'
  | 'fruit'
  | 'matiere-grasse'
  | 'boisson'

export interface Composant {
  id: string
  libelle: string
  categorie: Categorie
  /** Estimation, pas une pesée. Le plan raisonne en portions, pas en grammes. */
  kcal: number
  /** Équivalences proposées par la diététicienne pour le même composant. */
  alternatives?: string[]
}

export interface Repas {
  moment: Moment
  titre: string
  composants: Composant[]
  /** Formules de remplacement du repas entier, telles qu'écrites sur l'ordonnance. */
  variantes?: string[]
}

/**
 * Le professionnel qui suit l'utilisateur, s'il y en a un.
 *
 * Saisi par l'utilisateur et stocké dans son propre document : ce sont les
 * coordonnées d'un tiers, elles n'ont donc rien à faire dans le code d'une
 * application publique. Chaque champ peut rester vide.
 */
export interface Praticien {
  nom: string
  role: string
  email: string
  telephone: string
  /** Espace de suivi en ligne, si le praticien en propose un. */
  suivi: string
}

export interface Profil {
  id: string
  prenom: string
  email: string
  sexe: Sexe
  age: number
  tailleCm: number
  poidsDepartKg: number
  poidsObjectifKg: number
  activite: Activite
  herbalifeActif: boolean
  /**
   * Vrai quand le plan vient d'une vraie consultation. Dans ce cas il est
   * affiché tel quel : aucun calcul de l'application ne doit réécrire ce
   * qu'une diététicienne a prescrit.
   */
  planPrescrit: boolean
  /** Renseigné par l'utilisateur depuis son profil. `null` tant qu'il ne l'a pas fait. */
  praticien: Praticien | null
  onboardingFait: boolean
  /** Vrai tant que le mot de passe provisoire n'a pas été remplacé. */
  motDePasseAChanger: boolean
  creeLe: string
}

export interface PeseeEntree {
  date: string
  poidsKg: number
}

/** Un composant coché, pour un jour et un repas donnés. */
export interface JournalRepas {
  date: string
  moment: Moment
  composantsCoches: string[]
}

export interface JournalEau {
  date: string
  verres: number
}

export type IssueEnvie = 'resistee' | 'cedee' | 'collation-prevue'

export interface EnvieEntree {
  id: string
  horodatage: string
  intensite: 1 | 2 | 3 | 4 | 5
  declencheur: string
  strategie: string | null
  issue: IssueEnvie
}

export interface ScoreJeu {
  jeu: string
  score: number
  joueLe: string
}
