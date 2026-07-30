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

/**
 * La région d'origine d'un plat — le terroir, sous le pays.
 *
 * `Cuisine` répond à « de quel pays » et `Region` à « d'où exactement ». Les deux
 * cohabitent parce qu'elles ne servent pas la même recherche : « je veux manger
 * italien » et « je veux la carbonade de ma belle-mère » ne se cherchent pas au
 * même endroit. Une carbonade est `cuisine: 'francaise'` **et** `region: 'nord'`
 * — le plat est flamand des deux côtés de la frontière, et la trancher n'aurait
 * fait plaisir à personne.
 *
 * Les noms sont **culinaires et non administratifs** : « Nord » plutôt que
 * « Hauts-de-France », « Lyonnais » plutôt que « Auvergne-Rhône-Alpes ». Un
 * découpage régional a changé trois fois en trente ans ; la cuisine, non, et
 * c'est elle qu'on cherche.
 */
export type Region =
  | 'nord'
  | 'belgique'
  | 'bretagne'
  | 'normandie'
  | 'alsace'
  | 'lorraine'
  | 'bourgogne'
  | 'lyonnais'
  | 'savoie'
  | 'auvergne'
  | 'provence'
  | 'sud-ouest'
  | 'pays-basque'
  | 'languedoc'
  | 'corse'
  | 'val-de-loire'
  | 'antilles'
  | 'reunion'

export const LIBELLE_REGION: Record<Region, string> = {
  nord: 'Nord et Flandre',
  belgique: 'Belgique',
  bretagne: 'Bretagne',
  normandie: 'Normandie',
  alsace: 'Alsace',
  lorraine: 'Lorraine',
  bourgogne: 'Bourgogne',
  lyonnais: 'Lyonnais',
  savoie: 'Savoie',
  auvergne: 'Auvergne',
  provence: 'Provence',
  'sud-ouest': 'Sud-Ouest',
  'pays-basque': 'Pays basque',
  languedoc: 'Languedoc',
  corse: 'Corse',
  'val-de-loire': 'Val de Loire',
  antilles: 'Antilles',
  reunion: 'La Réunion',
}

/**
 * Le profil de goût dominant.
 *
 * C'est la question qu'on se pose vraiment devant une carte — « j'ai envie de
 * quelque chose de relevé ce soir » — et à laquelle ni le pays ni les ingrédients
 * ne répondent : un tajine et un curry sont deux cuisines et le même sucré-salé.
 *
 * **`epice` et `releve` ne sont pas la même chose**, et les confondre trompe :
 * `epice` dit qu'il y a des épices (cumin, cannelle, ras el-hanout), `releve` dit
 * que ça pique. Un tajine aux abricots est épicé sans être relevé, et quelqu'un
 * qui fuit le piment doit pouvoir le commander sans crainte.
 *
 * Plusieurs goûts par recette : un plat sucré-salé peut être épicé aussi.
 */
export type Gout = 'sucre-sale' | 'epice' | 'releve' | 'doux' | 'acidule' | 'fume' | 'herbace'

export const LIBELLE_GOUT: Record<Gout, string> = {
  'sucre-sale': 'Sucré-salé',
  epice: 'Épicé',
  releve: 'Relevé, ça pique',
  doux: 'Doux',
  acidule: 'Acidulé',
  fume: 'Fumé',
  herbace: 'Herbes fraîches',
}

/**
 * La forme du plat — ce qu'on voit en le posant sur la table.
 *
 * Sert autant à chercher (« un gratin, ce soir ») qu'à varier une semaine de
 * menus : trois mijotés d'affilée, ce n'est pas la même monotonie que trois plats
 * du même pays, et le planificateur ne pouvait pas le voir.
 */
export type TypePlat =
  | 'mijote'
  | 'roti'
  | 'gratin'
  | 'soupe'
  | 'salade'
  | 'tarte'
  | 'grillade'
  | 'poelee'
  | 'papillote'
  | 'bowl'
  | 'farci'
  | 'sandwich'

export const LIBELLE_TYPE_PLAT: Record<TypePlat, string> = {
  mijote: 'Mijoté',
  roti: 'Rôti au four',
  gratin: 'Gratin',
  soupe: 'Soupe',
  salade: 'Salade',
  tarte: 'Tarte et quiche',
  grillade: 'Grillade',
  poelee: 'Poêlée',
  papillote: 'Papillote',
  bowl: 'Bowl',
  farci: 'Farci',
  sandwich: 'Sandwich et wrap',
}

/**
 * Quand on sert ce plat.
 *
 * L'axe le plus subjectif des quatre, et le plus utile : c'est celui qui répond à
 * « on reçoit samedi » ou « il fait froid et j'ai besoin de réconfort », deux
 * demandes qu'aucun filtre nutritionnel ne couvre. Il est facultatif et le reste :
 * la plupart des plats ne sont d'aucune occasion particulière, et prétendre le
 * contraire viderait l'étiquette de son sens.
 */
export type Occasion = 'semaine' | 'dimanche' | 'reconfort' | 'reception' | 'pique-nique' | 'fete'

export const LIBELLE_OCCASION: Record<Occasion, string> = {
  semaine: 'Repas de semaine',
  dimanche: 'Repas du dimanche',
  reconfort: 'Réconfortant',
  reception: 'Quand on reçoit',
  'pique-nique': 'Pique-nique',
  fete: 'Jour de fête',
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

  /* ── Axes de classement ajoutés le 30/07/2026 ── */

  /**
   * Le terroir, sous le pays. Absent = le plat n'en revendique aucun, ce qui est
   * le cas de tout le catalogue composé sauf ses styles régionaux.
   */
  region?: Region
  /**
   * Profils de goût dominants. Absents, `goutsDe()` les déduit du style et des
   * ingrédients — une déduction sans risque, contrairement à celle des régimes :
   * se tromper propose un plat de trop, ça ne rend personne malade.
   */
  gouts?: Gout[]
  /** Forme du plat. Absente, `typePlatDe()` la lit dans le titre et les étapes. */
  typePlat?: TypePlat
  /** Occasions où on le sert. Facultatif, et le reste — voir `Occasion`. */
  occasions?: Occasion[]
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
