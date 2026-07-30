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

/* ───────────────────────── Coach conversationnel ───────────────────────── */

export interface MessageCoach {
  id: string
  role: 'utilisateur' | 'coach'
  texte: string
  envoyeLe: string
}

/* ───────────────────────── Planificateur de menus ───────────────────────── */

/** Un jour de la semaine planifiée. `null` = rien de prévu à ce repas. */
export interface JourMenu {
  date: string
  repas: Record<Moment, string | null>
}

export interface PlanSemaine {
  /** Le lundi de la semaine couverte, en ISO. C'est la clé : une semaine, un plan. */
  debut: string
  jours: JourMenu[]
  genereLe: string
}

/**
 * Une semaine mise de côté pour être reposée ailleurs.
 *
 * Un modèle ne porte **pas de dates**, seulement sept jours de repas dans
 * l'ordre du lundi au dimanche : c'est ce qui lui permet de s'appliquer à
 * n'importe quelle semaine. Y garder les dates d'origine obligerait à les
 * recalculer à chaque pose, et la première erreur de décalage passerait
 * inaperçue.
 */
export interface ModeleSemaine {
  id: string
  nom: string
  creeLe: string
  jours: Record<Moment, string | null>[]
}

/* ───────────────────── Rayons, courses et garde-manger ───────────────────── */

/**
 * Le rayon d'un produit. Défini ici et non dans le catalogue de recettes : un
 * rayon est une notion de magasin, que la liste de courses et le garde-manger
 * emploient autant que les ingrédients d'une recette.
 */
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

/**
 * D'où vient une ligne de courses.
 *
 * Affichée à l'écran, parce qu'une liste construite depuis une semaine de
 * menus contient des lignes que la personne n'a pas écrites : sans dire d'où
 * elles sortent, « 3 oignons » a l'air d'une erreur et se fait supprimer.
 */
export type OrigineCourse = 'recette' | 'manuel' | 'placard'

export interface ArticleCourse {
  id: string
  nom: string
  /** Cumulée à mesure des ajouts : « 3 oignons », « 2 CàS + ½ ». */
  quantite: string
  rayon: Rayon
  origine: OrigineCourse
  /** Les recettes qui ont amené cette ligne — de quoi répondre à « pourquoi ? ». */
  recettes: string[]
  /**
   * Le cochage est dans le document, pas dans l'écran : on fait ses courses en
   * plusieurs fois, souvent d'un téléphone qu'on range entre deux rayons. Une
   * case perdue au rechargement fait racheter ce qu'on a déjà dans le caddie.
   */
  pris: boolean
  ajouteLe: string
}

/**
 * Une liste de courses.
 *
 * Il y en a plusieurs parce qu'on ne fait pas ses courses en une fois : le
 * marché du samedi et le drive de la semaine ne se cochent pas ensemble. Une
 * liste close part à l'historique plutôt qu'à la corbeille — c'est ce qui
 * permet de refaire la même la semaine suivante.
 */
export interface ListeCourses {
  id: string
  nom: string
  creeLe: string
  /** Horodatage de clôture. `null` tant que la liste est en cours. */
  clotureeLe: string | null
  articles: ArticleCourse[]
  /**
   * Les semaines de menus déjà versées, repérées par leur `genereLe`.
   *
   * Sans cette trace, verser deux fois la même semaine doublerait toutes les
   * quantités sans que rien ne le signale — et on part au magasin avec quatorze
   * œufs pour sept. L'écran s'en sert pour prévenir, pas pour interdire :
   * regénérer une semaine change son `genereLe`, donc son versement est bien un
   * nouveau versement.
   */
  plansVerses?: string[]
}

export type Emplacement = 'frigo' | 'placard' | 'congelateur'

export const EMPLACEMENTS: Emplacement[] = ['frigo', 'placard', 'congelateur']

export const LIBELLE_EMPLACEMENT: Record<Emplacement, string> = {
  frigo: 'Réfrigérateur',
  placard: 'Placards',
  congelateur: 'Congélateur',
}

/**
 * Un produit détenu, dans l'un des trois lieux de stockage.
 *
 * **La DLC et la DDM ne veulent pas dire la même chose et ne sont donc pas un
 * seul champ.** La date limite de consommation (« à consommer jusqu'au »)
 * est sanitaire : passée, le produit se jette. La date de durabilité minimale
 * (« à consommer de préférence avant ») ne parle que de qualité gustative :
 * passée, le produit se mange encore, souvent des semaines durant. Les
 * confondre ferait jeter de la nourriture parfaitement bonne — exactement
 * l'inverse de ce que cet écran cherche à faire.
 */
export interface ArticleStock {
  id: string
  nom: string
  /** Ce qu'il en reste, tel qu'on le lit sur l'emballage : « 500 g », « 2 ». */
  quantite: string
  emplacement: Emplacement
  rayon: Rayon
  ajouteLe: string
  /** Sanitaire, impérative. */
  dlc?: string
  /** Qualité seulement — dépassée, le produit reste consommable. */
  ddm?: string
  /** Pour le congélateur : la date d'entrée, d'où se déduit la durée restante. */
  congeleLe?: string
  /**
   * Date d'ouverture. Une fois entamé, un produit ne tient plus jusqu'à sa DLC
   * imprimée mais quelques jours seulement — ne pas en tenir compte donnerait
   * une fausse sécurité sur ce qui est justement le plus risqué.
   */
  ouvertLe?: string
  codeBarres?: string
  note?: string
}
