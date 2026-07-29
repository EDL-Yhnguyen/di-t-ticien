export type Sexe = 'femme' | 'homme'

export type Activite = 'sedentaire' | 'leger' | 'modere' | 'actif'

export type Moment = 'petit-dejeuner' | 'dejeuner' | 'collation' | 'diner'

/** Dans l'ordre où ils arrivent dans la journée — sert partout où l'on trie. */
export const MOMENTS: Moment[] = ['petit-dejeuner', 'dejeuner', 'collation', 'diner']

export const LIBELLE_MOMENT: Record<Moment, string> = {
  'petit-dejeuner': 'Petit déjeuner',
  dejeuner: 'Déjeuner',
  collation: 'Collation',
  diner: 'Dîner',
}

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

/* ───────────────────────── Journal alimentaire ───────────────────────── */

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E'

/**
 * Valeurs nutritionnelles pour 100 g — ou 100 ml pour un liquide.
 *
 * C'est l'unité de référence de tous les étiquetages européens : la garder
 * comme pivot évite de reconvertir à chaque lecture, et c'est exactement ce
 * que renvoie Open Food Facts.
 */
export interface ValeursPour100 {
  kcal: number
  proteines: number
  glucides: number
  sucres: number
  lipides: number
  satures: number
  fibres: number
  /** En grammes de sel, pas de sodium — c'est la mention de l'étiquette. */
  sel: number
}

export type SourceAliment = 'base' | 'code-barres' | 'photo' | 'manuel' | 'recette'

/**
 * Une catégorie d'aliment, au sens du barème Nutri-Score : les boissons et les
 * matières grasses ne sont pas notées avec le même barème que le reste.
 */
export type FamilleAliment = 'general' | 'boisson' | 'matiere-grasse' | 'fromage'

export interface Aliment {
  id: string
  nom: string
  marque?: string
  codeBarres?: string
  famille: FamilleAliment
  valeurs: ValeursPour100
  /** Part de fruits, légumes et légumineuses, en %. Entre dans le Nutri-Score. */
  partFruitsLegumes?: number
  /** Portion usuelle proposée à la saisie. */
  portionG?: number
  portionLibelle?: string
  nutriScore?: NutriScore
  /**
   * Vrai quand la note vient de notre calcul et non de l'étiquette officielle.
   * L'écran doit le dire : un score estimé n'engage pas le fabricant.
   */
  nutriScoreEstime?: boolean
  source: SourceAliment
}

/** Un aliment réellement mangé, à une date et un moment donnés. */
export interface EntreeJournal {
  id: string
  date: string
  moment: Moment
  horodatage: string
  aliment: Aliment
  quantiteG: number
}

/**
 * Une mesure importée de l'app Santé d'Apple.
 *
 * Les PWA n'ont aucun accès à HealthKit : ces valeurs arrivent par l'import
 * du fichier d'export, jamais par une synchronisation.
 */
export interface MesureSante {
  date: string
  pas?: number
  depenseKcal?: number
  poidsKg?: number
}
