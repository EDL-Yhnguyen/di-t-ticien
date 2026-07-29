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

/**
 * La trace du consentement au traitement des données de santé.
 *
 * Le RGPD demande de pouvoir *démontrer* le consentement (art. 7.1) : il ne
 * suffit pas de savoir qu'il a été donné, il faut savoir quand et à quel
 * texte. D'où la version, qui est la date de la politique acceptée.
 */
export interface Consentement {
  version: string
  accepteLe: string
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

/* ───────────────────────── Activité physique ───────────────────────── */

export type FamilleActivite = 'cardio' | 'renforcement' | 'plein-air' | 'collectif' | 'douceur'

export const LIBELLE_FAMILLE_ACTIVITE: Record<FamilleActivite, string> = {
  cardio: 'Cardio',
  renforcement: 'Renforcement',
  'plein-air': 'Plein air',
  collectif: 'Sports collectifs et raquette',
  douceur: 'En douceur',
}

/**
 * Une activité du catalogue et son coût en MET.
 *
 * Le MET (*metabolic equivalent of task*) est le rapport entre la dépense de
 * l'activité et la dépense au repos. Les valeurs viennent du Compendium of
 * Physical Activities, la référence publique du domaine — ce sont des moyennes
 * de population, pas une mesure de la personne.
 */
export interface TypeActivite {
  id: string
  libelle: string
  met: number
  famille: FamilleActivite
}

/**
 * L'intensité ressentie, faute de cardiofréquencemètre.
 *
 * C'est la seule correction que l'utilisateur peut apporter à la moyenne du
 * catalogue : « j'ai couru en trottinant » et « j'ai fini à bout de souffle »
 * ne coûtent pas la même chose pour une même durée.
 */
export type Intensite = 'douce' | 'moderee' | 'intense'

export const INTENSITES: Intensite[] = ['douce', 'moderee', 'intense']

export const LIBELLE_INTENSITE: Record<Intensite, string> = {
  douce: 'Tranquille — je pouvais tenir une conversation',
  moderee: 'Modérée — un peu essoufflé·e',
  intense: 'Intense — difficile de parler',
}

export interface SeanceSport {
  id: string
  date: string
  activiteId: string
  /**
   * Le libellé est recopié à l'enregistrement plutôt que relu dans le
   * catalogue : une séance déjà notée ne doit pas changer de nom si le
   * catalogue évolue.
   */
  libelle: string
  minutes: number
  intensite: Intensite
  /**
   * Estimation figée à la saisie. Elle dépend du poids du jour, qui bougera :
   * la recalculer plus tard réécrirait l'histoire.
   */
  kcal: number
}

/* ───────────────────────── Planificateur de menus ───────────────────────── */

/** Un jour de la semaine planifiée. `null` = rien de prévu à ce repas. */
export interface JourMenu {
  date: string
  repas: Record<Moment, string | null>
}

export interface PlanSemaine {
  /** Le lundi de la semaine couverte, en ISO. */
  debut: string
  jours: JourMenu[]
  genereLe: string
}
