import type { Rayon } from '../types'
import type { Cuisine, Regime } from './types'

/**
 * Les briques du catalogue composé.
 *
 * ## Pourquoi composer, et ce que ça n'est pas
 *
 * Le brief demande « plusieurs dizaines de milliers de recettes ». Trois voies
 * existaient, deux sont fermées :
 *
 * 1. **Recopier un catalogue existant** — Weight Watchers, les livres de chefs.
 *    Fermée : le texte d'une recette est une œuvre protégée, le système de points
 *    de Weight Watchers est une marque, et ce dépôt est public. Une liste
 *    d'ingrédients bruts ne s'approprie pas, mais un livre de cuisine, si.
 * 2. **Faire écrire des recettes par un modèle** — fermée aussi : le budget d'IA
 *    a été mis de côté, et une recette inventée par un modèle puis servie comme
 *    une recette maison serait exactement ce que les bouchons de `lib/ia/`
 *    refusent de faire.
 * 3. **Composer à partir de techniques** — ouverte, et c'est celle-ci. Une
 *    technique de cuisson ne s'approprie pas : saisir un filet, monter un gratin,
 *    mijoter une cocotte appartiennent à tout le monde. Un style régional non
 *    plus : « à la basquaise » ou « en persillade » sont des noms communs.
 *
 * **Ce catalogue ne prétend donc rien d'autre que ce qu'il est** : des
 * assemblages réalisables, calculés, et honnêtes sur leur origine. Aucune recette
 * n'est attribuée à un chef, et aucune ne recopie un texte existant.
 *
 * ## Ce que les briques permettent que le texte libre interdisait
 *
 * Les 53 recettes écrites à la main portent des calories saisies à la main et des
 * macros estimées par répartition type (voir `journalRecette.ts`). Ici, chaque
 * brique porte ses valeurs Ciqual pour 100 g et sa quantité par personne : les
 * calories d'une recette composée sont donc une **somme**, pas une estimation.
 *
 * Même chose pour les régimes. La règle de C3 — « aucun régime ne se déduit d'une
 * liste d'ingrédients » — visait le texte libre : « sauce soja » ne dit pas qu'il
 * y a du blé dedans. Ici la donnée est **structurée et écrite à la main brique par
 * brique** : l'intersection des régimes garantis est une déduction sûre, et c'est
 * la seule forme de déduction que ce fichier s'autorise.
 */

/** Ce qu'on fait subir à une brique. Détermine le patron d'étapes et les temps. */
export type Technique =
  | 'poele'
  | 'four'
  | 'papillote'
  | 'mijote'
  | 'vapeur'
  | 'cru'
  | 'bouilli'

export interface Brique {
  id: string
  /** Le nom tel qu'il apparaîtra dans la liste d'ingrédients. */
  nom: string
  rayon: Rayon
  /** kcal, protéines, glucides, lipides pour 100 g **prêt à manger**. */
  v: [number, number, number, number]
  /** Quantité par personne, en grammes prêts à manger. */
  g: number
  /**
   * Les cuisines avec lesquelles la brique va. Absent = passe-partout.
   *
   * C'est le garde-fou contre l'absurde : sans lui, la combinatoire produirait
   * du « porridge au thon » et le catalogue perdrait toute crédibilité.
   */
  styles?: Cuisine[]
  /** Minutes de cuisson par technique. Absent = la technique ne s'applique pas. */
  cuisson?: Partial<Record<Technique, number>>
  /** Régimes que **cette brique** garantit, écrits à la main. */
  regimes?: Regime[]
  /** Un mot pour la préparation : « émincé », « en cubes », « en rondelles ». */
  taille?: string
  /**
   * Le nom à employer dans un titre de recette, quand le nom complet ne s'y
   * prête pas. « Steak haché 5 % » donnait « Mijoté de 5 % » — le raccourcissement
   * automatique se trompe dès qu'un nom porte un pourcentage ou un qualificatif.
   */
  titreCourt?: string
  /** Quantité affichée à la place des grammes : « 2 » pour des œufs. */
  unite?: string
  /** Pour les matières grasses : utilisable à froid (salade, wrap, bowl). */
  froid?: boolean
  /**
   * Les deux formes dont les étapes ont besoin : « Chauffez **l'huile d'olive** »
   * et « arrosez **d'huile d'olive** ». Écrites à la main plutôt que déduites —
   * le genre d'un nom ne se calcule pas, et « arrosez de huile » se remarque.
   */
  defini?: string
  partitif?: string
}

/* Les régimes reviennent si souvent qu'on les abrège. */
const SGL: Regime[] = ['sans-gluten', 'sans-lactose']
const VEGAN: Regime[] = ['vegetarien', 'vegan', 'sans-lactose']
const VEGAN_SG: Regime[] = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose']
const VEGE_SG: Regime[] = ['vegetarien', 'sans-gluten']

/* ───────────────────────────── Les protéines ───────────────────────────── */

export const PROTEINES: Brique[] = [
  { id: 'poulet', nom: 'Blanc de poulet', rayon: 'Boucherie, poissonnerie', v: [121, 26, 0, 2.5], g: 130, regimes: SGL, taille: 'en aiguillettes', cuisson: { poele: 8, four: 20, papillote: 18, mijote: 25, vapeur: 15 } },
  { id: 'dinde', nom: 'Escalope de dinde', rayon: 'Boucherie, poissonnerie', v: [110, 24, 0, 1.5], g: 130, regimes: SGL, taille: 'en lanières', cuisson: { poele: 7, four: 18, papillote: 16, mijote: 22 } },
  { id: 'boeuf-hache', nom: 'Steak haché 5 %', titreCourt: 'bœuf haché', rayon: 'Boucherie, poissonnerie', v: [137, 21, 0, 5], g: 120, regimes: SGL, cuisson: { poele: 6, mijote: 25, four: 20 } },
  { id: 'bavette', nom: 'Bavette de bœuf', rayon: 'Boucherie, poissonnerie', v: [180, 26, 0, 8], g: 110, regimes: SGL, taille: 'en lanières', cuisson: { poele: 4 } },
  { id: 'porc', nom: 'Filet mignon de porc', titreCourt: 'porc', rayon: 'Boucherie, poissonnerie', v: [143, 26, 0, 4], g: 120, regimes: SGL, taille: 'en médaillons', cuisson: { poele: 8, four: 25, mijote: 30 } },
  { id: 'saumon', nom: 'Pavé de saumon', rayon: 'Boucherie, poissonnerie', v: [208, 20, 0, 13], g: 120, regimes: SGL, cuisson: { poele: 6, four: 15, papillote: 15, vapeur: 12 } },
  { id: 'cabillaud', nom: 'Dos de cabillaud', rayon: 'Boucherie, poissonnerie', v: [82, 18, 0, 0.7], g: 140, regimes: SGL, cuisson: { poele: 6, four: 14, papillote: 14, vapeur: 10 } },
  { id: 'merlan', nom: 'Filet de merlan', rayon: 'Boucherie, poissonnerie', v: [90, 18, 0, 1.5], g: 140, regimes: SGL, cuisson: { poele: 5, papillote: 12, vapeur: 10 } },
  { id: 'maquereau', nom: 'Filet de maquereau', rayon: 'Boucherie, poissonnerie', v: [205, 19, 0, 14], g: 110, regimes: SGL, cuisson: { poele: 5, four: 12, cru: 0 } },
  { id: 'sardine', nom: 'Sardines', rayon: 'Boucherie, poissonnerie', v: [208, 25, 0, 11], g: 100, regimes: SGL, cuisson: { four: 10, poele: 6, cru: 0 } },
  { id: 'thon', nom: 'Thon au naturel', rayon: 'Épicerie', v: [116, 26, 0, 1], g: 110, regimes: SGL, cuisson: { cru: 0 } },
  { id: 'crevette', nom: 'Crevettes décortiquées', titreCourt: 'crevettes', rayon: 'Boucherie, poissonnerie', v: [99, 21, 0, 1], g: 120, regimes: SGL, cuisson: { poele: 4, vapeur: 6, cru: 0 } },
  { id: 'oeuf', nom: 'Œufs', rayon: 'Crèmerie', v: [143, 13, 0.7, 10], g: 110, unite: '2', regimes: SGL, cuisson: { poele: 4, bouilli: 9, four: 12, vapeur: 6 } },
  { id: 'jambon', nom: 'Jambon blanc découenné', titreCourt: 'jambon', rayon: 'Boucherie, poissonnerie', v: [110, 20, 1, 3], g: 100, regimes: SGL, taille: 'en dés', cuisson: { cru: 0, four: 15 } },
  { id: 'tofu', nom: 'Tofu ferme', rayon: 'Épicerie', v: [145, 16, 2, 9], g: 130, regimes: VEGAN, taille: 'en cubes', cuisson: { poele: 8, four: 20, mijote: 15 } },
  { id: 'pois-chiche', nom: 'Pois chiches cuits', titreCourt: 'pois chiches', rayon: 'Épicerie', v: [164, 9, 27, 2.6], g: 150, regimes: VEGAN_SG, cuisson: { cru: 0, mijote: 15, four: 20 } },
  { id: 'lentille', nom: 'Lentilles vertes cuites', titreCourt: 'lentilles', rayon: 'Épicerie', v: [116, 9, 20, 0.4], g: 150, regimes: VEGAN_SG, cuisson: { cru: 0, mijote: 15 } },
  { id: 'haricot-rouge', nom: 'Haricots rouges cuits', titreCourt: 'haricots rouges', rayon: 'Épicerie', v: [127, 9, 22, 0.5], g: 150, regimes: VEGAN_SG, cuisson: { cru: 0, mijote: 20 } },
  { id: 'feta', nom: 'Feta', rayon: 'Crèmerie', v: [264, 14, 4, 21], g: 60, regimes: VEGE_SG, taille: 'émiettée', styles: ['mediterraneenne', 'orientale', 'italienne'], cuisson: { cru: 0, four: 12 } },
  { id: 'chevre', nom: 'Fromage de chèvre frais', titreCourt: 'chèvre frais', rayon: 'Crèmerie', v: [271, 19, 2, 21], g: 60, regimes: VEGE_SG, styles: ['francaise', 'mediterraneenne'], cuisson: { cru: 0, four: 10 } },
]

/* ───────────────────────────── Les féculents ───────────────────────────── */

export const FECULENTS: Brique[] = [
  { id: 'riz', nom: 'Riz basmati', rayon: 'Épicerie', v: [130, 2.7, 28, 0.3], g: 150, regimes: VEGAN_SG, cuisson: { bouilli: 12 } },
  { id: 'riz-complet', titreCourt: 'riz complet', nom: 'Riz complet', rayon: 'Épicerie', v: [123, 2.6, 26, 1], g: 150, regimes: VEGAN_SG, cuisson: { bouilli: 25 } },
  { id: 'pates', titreCourt: 'pâtes complètes', nom: 'Pâtes complètes', rayon: 'Épicerie', v: [124, 5, 25, 0.6], g: 160, regimes: VEGAN, styles: ['italienne', 'mediterraneenne', 'francaise'], cuisson: { bouilli: 9 } },
  { id: 'nouilles', nom: 'Nouilles de riz', titreCourt: 'nouilles', rayon: 'Épicerie', v: [109, 1.8, 25, 0.2], g: 160, regimes: VEGAN_SG, styles: ['asiatique'], cuisson: { bouilli: 5 } },
  { id: 'boulgour', nom: 'Boulgour', rayon: 'Épicerie', v: [83, 3, 18, 0.2], g: 160, regimes: VEGAN, styles: ['orientale', 'mediterraneenne'], cuisson: { bouilli: 12 } },
  { id: 'quinoa', nom: 'Quinoa', rayon: 'Épicerie', v: [120, 4.4, 21, 1.9], g: 150, regimes: VEGAN_SG, cuisson: { bouilli: 15 } },
  { id: 'semoule', nom: 'Semoule', rayon: 'Épicerie', v: [112, 3.8, 23, 0.2], g: 150, regimes: VEGAN, styles: ['orientale', 'mediterraneenne'], cuisson: { bouilli: 5 } },
  { id: 'pomme-terre', nom: 'Pommes de terre', rayon: 'Fruits et légumes', v: [87, 2, 20, 0.1], g: 200, regimes: VEGAN_SG, taille: 'en cubes', cuisson: { vapeur: 20, four: 30, bouilli: 20, mijote: 25 } },
  { id: 'patate-douce', nom: 'Patate douce', rayon: 'Fruits et légumes', v: [90, 1.6, 21, 0.1], g: 200, regimes: VEGAN_SG, taille: 'en cubes', cuisson: { vapeur: 18, four: 25, mijote: 20 } },
  { id: 'polenta', nom: 'Polenta', rayon: 'Épicerie', v: [85, 2, 18, 0.4], g: 180, regimes: VEGAN_SG, styles: ['italienne'], cuisson: { bouilli: 8 } },
  { id: 'pois-casse', nom: 'Pois cassés', rayon: 'Épicerie', v: [118, 8, 21, 0.4], g: 150, regimes: VEGAN_SG, styles: ['francaise'], cuisson: { bouilli: 30, mijote: 30 } },
  { id: 'haricot-blanc', nom: 'Haricots blancs cuits', titreCourt: 'haricots blancs', rayon: 'Épicerie', v: [105, 7, 17, 0.6], g: 150, regimes: VEGAN_SG, styles: ['francaise', 'mediterraneenne'], cuisson: { cru: 0, mijote: 20 } },
  { id: 'pain-complet', nom: 'Pain complet', titreCourt: 'pain', rayon: 'Boulangerie', v: [247, 9, 41, 3.5], g: 70, regimes: VEGAN, cuisson: { cru: 0 } },
  { id: 'galette-ble', nom: 'Galette de blé complet', titreCourt: 'galette de blé', rayon: 'Boulangerie', v: [297, 9, 48, 7], g: 60, regimes: VEGAN, styles: ['mexicaine', 'orientale'], cuisson: { cru: 0, poele: 2 } },
  { id: 'lentille-corail', nom: 'Lentilles corail', rayon: 'Épicerie', v: [116, 8, 20, 0.4], g: 150, regimes: VEGAN_SG, styles: ['indienne', 'orientale'], cuisson: { bouilli: 15, mijote: 18 } },
]

/* ───────────────────────────── Les légumes ───────────────────────────── */

export const LEGUMES: Brique[] = [
  { id: 'courgette', nom: 'Courgettes', rayon: 'Fruits et légumes', v: [20, 1.5, 2.2, 0.3], g: 200, regimes: VEGAN_SG, taille: 'en rondelles', cuisson: { poele: 10, four: 20, papillote: 15, vapeur: 10, mijote: 15 } },
  { id: 'brocoli', nom: 'Brocolis', rayon: 'Fruits et légumes', v: [35, 3, 3, 0.4], g: 200, regimes: VEGAN_SG, taille: 'en bouquets', cuisson: { vapeur: 10, poele: 10, four: 20 } },
  { id: 'haricot-vert', nom: 'Haricots verts', rayon: 'Fruits et légumes', v: [31, 1.8, 4, 0.2], g: 200, regimes: VEGAN_SG, cuisson: { vapeur: 12, poele: 10 } },
  { id: 'epinard', nom: 'Épinards', rayon: 'Fruits et légumes', v: [23, 2.9, 1.2, 0.4], g: 200, regimes: VEGAN_SG, cuisson: { poele: 5, mijote: 8, vapeur: 5 } },
  { id: 'carotte', nom: 'Carottes', rayon: 'Fruits et légumes', v: [36, 0.8, 6.7, 0.2], g: 180, regimes: VEGAN_SG, taille: 'en rondelles', cuisson: { vapeur: 15, poele: 12, four: 25, mijote: 20, cru: 0 } },
  { id: 'poivron', nom: 'Poivrons', rayon: 'Fruits et légumes', v: [26, 1, 4.6, 0.3], g: 180, regimes: VEGAN_SG, taille: 'en lanières', styles: ['mediterraneenne', 'mexicaine', 'orientale', 'asiatique', 'italienne'], cuisson: { poele: 12, four: 25, mijote: 15 } },
  { id: 'champignon', nom: 'Champignons de Paris', titreCourt: 'champignons', rayon: 'Fruits et légumes', v: [22, 3.1, 1.4, 0.3], g: 180, regimes: VEGAN_SG, taille: 'émincés', cuisson: { poele: 8, mijote: 12, four: 18 } },
  { id: 'tomate', nom: 'Tomates', rayon: 'Fruits et légumes', v: [18, 0.9, 3.2, 0.2], g: 200, regimes: VEGAN_SG, taille: 'en quartiers', styles: ['mediterraneenne', 'italienne', 'mexicaine', 'orientale'], cuisson: { cru: 0, poele: 10, four: 20, mijote: 20 } },
  { id: 'aubergine', nom: 'Aubergine', rayon: 'Fruits et légumes', v: [25, 1, 3, 0.2], g: 200, regimes: VEGAN_SG, taille: 'en dés', styles: ['mediterraneenne', 'italienne', 'orientale'], cuisson: { poele: 15, four: 25, mijote: 20 } },
  { id: 'chou-fleur', nom: 'Chou-fleur', rayon: 'Fruits et légumes', v: [25, 2, 3, 0.3], g: 200, regimes: VEGAN_SG, taille: 'en bouquets', cuisson: { vapeur: 12, four: 25, poele: 12 } },
  { id: 'poireau', nom: 'Poireaux', rayon: 'Fruits et légumes', v: [31, 1.5, 5, 0.3], g: 200, regimes: VEGAN_SG, taille: 'émincés', styles: ['francaise', 'nordique'], cuisson: { poele: 12, mijote: 20, vapeur: 15, papillote: 18 } },
  { id: 'fenouil', nom: 'Fenouil', rayon: 'Fruits et légumes', v: [31, 1.2, 5, 0.2], g: 180, regimes: VEGAN_SG, taille: 'émincé', styles: ['mediterraneenne', 'italienne'], cuisson: { poele: 12, four: 25, cru: 0 } },
  { id: 'petit-pois', nom: 'Petits pois', rayon: 'Surgelés', v: [81, 5, 11, 0.4], g: 150, regimes: VEGAN_SG, cuisson: { bouilli: 6, poele: 8, mijote: 10 } },
  { id: 'courge', nom: 'Courge butternut', titreCourt: 'courge', rayon: 'Fruits et légumes', v: [45, 1, 10, 0.1], g: 200, regimes: VEGAN_SG, taille: 'en cubes', cuisson: { four: 25, mijote: 20, vapeur: 15 } },
  { id: 'celeri-rave', nom: 'Céleri-rave', rayon: 'Fruits et légumes', v: [42, 1.5, 9, 0.3], g: 180, regimes: VEGAN_SG, taille: 'en cubes', styles: ['francaise'], cuisson: { vapeur: 18, four: 25, mijote: 20 } },
  { id: 'chou-kale', nom: 'Chou kale', rayon: 'Fruits et légumes', v: [49, 4.3, 4, 0.9], g: 150, regimes: VEGAN_SG, cuisson: { poele: 6, vapeur: 8 } },
  { id: 'betterave', nom: 'Betterave cuite', rayon: 'Fruits et légumes', v: [43, 1.6, 8, 0.2], g: 180, regimes: VEGAN_SG, taille: 'en dés', styles: ['francaise', 'nordique'], cuisson: { cru: 0, four: 20 } },
  { id: 'asperge', nom: 'Asperges vertes', rayon: 'Fruits et légumes', v: [20, 2.2, 2, 0.2], g: 180, regimes: VEGAN_SG, styles: ['francaise', 'italienne'], cuisson: { vapeur: 10, poele: 8, four: 15 } },
  { id: 'concombre', nom: 'Concombre', rayon: 'Fruits et légumes', v: [15, 0.7, 2, 0.1], g: 180, regimes: VEGAN_SG, taille: 'en dés', cuisson: { cru: 0 } },
  { id: 'salade', titreCourt: 'jeunes pousses', nom: 'Salade verte', rayon: 'Fruits et légumes', v: [15, 1.4, 1.5, 0.2], g: 100, regimes: VEGAN_SG, cuisson: { cru: 0 } },
  { id: 'chou-bruxelles', nom: 'Choux de Bruxelles', rayon: 'Fruits et légumes', v: [43, 3.4, 5, 0.3], g: 180, regimes: VEGAN_SG, styles: ['francaise', 'nordique'], cuisson: { vapeur: 15, four: 25, poele: 12 } },
  { id: 'panais', nom: 'Panais', rayon: 'Fruits et légumes', v: [75, 1.2, 13, 0.3], g: 180, regimes: VEGAN_SG, taille: 'en cubes', styles: ['francaise', 'nordique'], cuisson: { four: 25, vapeur: 18, mijote: 20 } },
  { id: 'blette', nom: 'Blettes', rayon: 'Fruits et légumes', v: [19, 1.8, 2, 0.2], g: 200, regimes: VEGAN_SG, taille: 'émincées', styles: ['mediterraneenne', 'francaise'], cuisson: { poele: 10, mijote: 15 } },
  { id: 'mais', nom: 'Maïs doux', rayon: 'Épicerie', v: [96, 3.4, 19, 1.2], g: 120, regimes: VEGAN_SG, styles: ['mexicaine'], cuisson: { cru: 0, poele: 5 } },
]

/* ───────────────────── Matières grasses et liants ───────────────────── */

export const GRAS: Brique[] = [
  { id: 'huile-olive', froid: true, defini: 'l’huile d’olive', partitif: 'd’huile d’olive', nom: 'Huile d’olive', rayon: 'Épicerie', v: [900, 0, 0, 100], g: 10, regimes: VEGAN_SG, styles: ['mediterraneenne', 'italienne', 'orientale', 'francaise', 'mexicaine'] },
  { id: 'huile-colza', froid: true, defini: 'l’huile de colza', partitif: 'd’huile de colza', nom: 'Huile de colza', rayon: 'Épicerie', v: [900, 0, 0, 100], g: 10, regimes: VEGAN_SG },
  { id: 'huile-sesame', froid: true, defini: 'l’huile de sésame', partitif: 'd’huile de sésame', nom: 'Huile de sésame', rayon: 'Épicerie', v: [900, 0, 0, 100], g: 8, regimes: VEGAN_SG, styles: ['asiatique'] },
  { id: 'beurre', nom: 'Beurre', defini: 'le beurre', partitif: 'de beurre', rayon: 'Crèmerie', v: [750, 0.7, 0.6, 82], g: 10, regimes: VEGE_SG, styles: ['francaise', 'nordique'] },
  { id: 'creme-legere', defini: 'la crème légère', partitif: 'de crème légère', nom: 'Crème légère 15 %', titreCourt: 'crème', rayon: 'Crèmerie', v: [160, 2.5, 4, 15], g: 40, regimes: VEGE_SG, styles: ['francaise', 'nordique'] },
  { id: 'lait-coco', defini: 'le lait de coco', partitif: 'de lait de coco', nom: 'Lait de coco léger', titreCourt: 'lait de coco', rayon: 'Épicerie', v: [73, 1, 2, 7], g: 80, regimes: VEGAN_SG, styles: ['indienne', 'asiatique'] },
  { id: 'yaourt-sauce', froid: true, defini: 'le yaourt', partitif: 'de yaourt', nom: 'Yaourt nature', rayon: 'Crèmerie', v: [58, 4, 4.5, 3], g: 60, regimes: VEGE_SG, styles: ['orientale', 'indienne', 'nordique'] },
]

/* ─────────────────────────── Les assaisonnements ─────────────────────────── */

/**
 * Ce qui donne le caractère du plat. Quantités négligeables : leur apport
 * nutritionnel n'est pas compté, seul l'affichage en tient compte.
 */
export interface Aromate {
  nom: string
  rayon: Rayon
  quantite: string
  styles?: Cuisine[]
  regimes?: Regime[]
}

export const AROMATES: Aromate[] = [
  { nom: 'Ail', rayon: 'Fruits et légumes', quantite: '2 gousses', regimes: VEGAN_SG },
  { nom: 'Oignon', rayon: 'Fruits et légumes', quantite: '1', regimes: VEGAN_SG },
  { nom: 'Échalote', rayon: 'Fruits et légumes', quantite: '1', regimes: VEGAN_SG, styles: ['francaise'] },
  { nom: 'Citron', rayon: 'Fruits et légumes', quantite: '1', regimes: VEGAN_SG },
  { nom: 'Persil', rayon: 'Fruits et légumes', quantite: 'quelques brins', regimes: VEGAN_SG, styles: ['francaise', 'mediterraneenne', 'orientale'] },
  { nom: 'Basilic frais', rayon: 'Fruits et légumes', quantite: 'quelques feuilles', regimes: VEGAN_SG, styles: ['italienne', 'mediterraneenne'] },
  { nom: 'Coriandre', rayon: 'Fruits et légumes', quantite: 'quelques brins', regimes: VEGAN_SG, styles: ['asiatique', 'indienne', 'mexicaine', 'orientale'] },
  { nom: 'Menthe fraîche', rayon: 'Fruits et légumes', quantite: 'quelques feuilles', regimes: VEGAN_SG, styles: ['orientale', 'mediterraneenne'] },
  { nom: 'Thym', rayon: 'Épicerie', quantite: '1 branche', regimes: VEGAN_SG, styles: ['francaise', 'mediterraneenne'] },
  { nom: 'Romarin', rayon: 'Épicerie', quantite: '1 branche', regimes: VEGAN_SG, styles: ['italienne', 'mediterraneenne'] },
  { nom: 'Cumin', rayon: 'Épicerie', quantite: '1 CàC', regimes: VEGAN_SG, styles: ['orientale', 'indienne', 'mexicaine'] },
  { nom: 'Curry en poudre', rayon: 'Épicerie', quantite: '1 CàC', regimes: VEGAN_SG, styles: ['indienne'] },
  { nom: 'Curcuma', rayon: 'Épicerie', quantite: '1 CàC', regimes: VEGAN_SG, styles: ['indienne', 'orientale'] },
  { nom: 'Paprika fumé', rayon: 'Épicerie', quantite: '1 CàC', regimes: VEGAN_SG, styles: ['mexicaine', 'mediterraneenne'] },
  { nom: 'Gingembre frais', rayon: 'Fruits et légumes', quantite: '1 morceau', regimes: VEGAN_SG, styles: ['asiatique', 'indienne'] },
  { nom: 'Sauce soja', rayon: 'Épicerie', quantite: '2 CàS', regimes: ['vegetarien', 'vegan', 'sans-lactose'], styles: ['asiatique'] },
  { nom: 'Graines de sésame', rayon: 'Épicerie', quantite: '1 CàS', regimes: VEGAN_SG, styles: ['asiatique'] },
  { nom: 'Moutarde', rayon: 'Épicerie', quantite: '1 CàC', regimes: VEGAN_SG, styles: ['francaise', 'nordique'] },
  { nom: 'Vinaigre balsamique', rayon: 'Épicerie', quantite: '1 CàS', regimes: VEGAN_SG, styles: ['italienne', 'mediterraneenne'] },
  { nom: 'Olives noires', rayon: 'Épicerie', quantite: '1 poignée', regimes: VEGAN_SG, styles: ['mediterraneenne', 'italienne'] },
  { nom: 'Câpres', rayon: 'Épicerie', quantite: '1 CàS', regimes: VEGAN_SG, styles: ['mediterraneenne', 'italienne'] },
  { nom: 'Piment d’Espelette', rayon: 'Épicerie', quantite: '1 pincée', regimes: VEGAN_SG, styles: ['francaise'] },
  { nom: 'Ras-el-hanout', rayon: 'Épicerie', quantite: '1 CàC', regimes: VEGAN_SG, styles: ['orientale'] },
  { nom: 'Herbes de Provence', rayon: 'Épicerie', quantite: '1 CàC', regimes: VEGAN_SG, styles: ['mediterraneenne', 'francaise'] },
  { nom: 'Aneth', rayon: 'Fruits et légumes', quantite: 'quelques brins', regimes: VEGAN_SG, styles: ['nordique'] },
  { nom: 'Muscade', rayon: 'Épicerie', quantite: '1 pincée', regimes: VEGAN_SG, styles: ['francaise'] },
  { nom: 'Parmesan', rayon: 'Crèmerie', quantite: '20 g', regimes: VEGE_SG, styles: ['italienne'] },
  { nom: 'Laurier', rayon: 'Épicerie', quantite: '1 feuille', regimes: VEGAN_SG, styles: ['francaise', 'mediterraneenne'] },
]

/* ──────────────────── Le petit déjeuner et les collations ──────────────────── */

export const BASES_MATIN: Brique[] = [
  { id: 'flocons', nom: 'Flocons d’avoine', rayon: 'Épicerie', v: [370, 13, 60, 7], g: 50, regimes: VEGAN },
  { id: 'muesli', nom: 'Muesli sans sucre ajouté', titreCourt: 'muesli', rayon: 'Épicerie', v: [380, 11, 62, 8], g: 45, regimes: VEGAN },
  { id: 'pain-matin', nom: 'Pain complet', titreCourt: 'pain', rayon: 'Boulangerie', v: [247, 9, 41, 3.5], g: 70, regimes: VEGAN },
  { id: 'fromage-blanc', nom: 'Fromage blanc 3 %', titreCourt: 'fromage blanc', rayon: 'Crèmerie', v: [72, 8, 4, 3], g: 200, regimes: VEGE_SG },
  { id: 'skyr', nom: 'Skyr nature', rayon: 'Crèmerie', v: [63, 11, 4, 0.2], g: 200, regimes: VEGE_SG },
  { id: 'yaourt-grec', nom: 'Yaourt à la grecque', titreCourt: 'yaourt grec', rayon: 'Crèmerie', v: [115, 4, 5, 9], g: 180, regimes: VEGE_SG },
  { id: 'yaourt-matin', nom: 'Yaourt nature', rayon: 'Crèmerie', v: [58, 4, 4.5, 3], g: 180, regimes: VEGE_SG },
  { id: 'riz-lait', nom: 'Riz rond', titreCourt: 'riz au lait', rayon: 'Épicerie', v: [130, 2.7, 28, 0.3], g: 140, regimes: VEGAN_SG },
]

export const FRUITS: Brique[] = [
  { id: 'pomme', nom: 'Pomme', rayon: 'Fruits et légumes', v: [52, 0.3, 12, 0.2], g: 150, regimes: VEGAN_SG },
  { id: 'banane', nom: 'Banane', rayon: 'Fruits et légumes', v: [89, 1.1, 20, 0.3], g: 120, regimes: VEGAN_SG },
  { id: 'poire', nom: 'Poire', rayon: 'Fruits et légumes', v: [57, 0.4, 12, 0.1], g: 160, regimes: VEGAN_SG },
  { id: 'fraise', nom: 'Fraises', rayon: 'Fruits et légumes', v: [32, 0.7, 6, 0.3], g: 150, regimes: VEGAN_SG },
  { id: 'fruits-rouges', nom: 'Fruits rouges', rayon: 'Surgelés', v: [45, 1, 8, 0.4], g: 130, regimes: VEGAN_SG },
  { id: 'kiwi', nom: 'Kiwi', rayon: 'Fruits et légumes', v: [61, 1.1, 12, 0.5], g: 90, regimes: VEGAN_SG },
  { id: 'orange', nom: 'Orange', rayon: 'Fruits et légumes', v: [47, 0.9, 9, 0.1], g: 180, regimes: VEGAN_SG },
  { id: 'abricot', nom: 'Abricots', rayon: 'Fruits et légumes', v: [48, 1.4, 9, 0.4], g: 150, regimes: VEGAN_SG },
  { id: 'peche', nom: 'Pêche', rayon: 'Fruits et légumes', v: [39, 0.9, 8, 0.3], g: 150, regimes: VEGAN_SG },
  { id: 'compote-fruit', nom: 'Compote sans sucre ajouté', titreCourt: 'compote', rayon: 'Épicerie', v: [45, 0.3, 10, 0.1], g: 100, regimes: VEGAN_SG },
]

export const GARNITURES_MATIN: Brique[] = [
  { id: 'amande', nom: 'Amandes', rayon: 'Épicerie', v: [634, 21, 7, 54], g: 20, regimes: VEGAN_SG },
  { id: 'noix', nom: 'Cerneaux de noix', rayon: 'Épicerie', v: [698, 15, 5, 68], g: 20, regimes: VEGAN_SG },
  { id: 'graines-courge', nom: 'Graines de courge', rayon: 'Épicerie', v: [559, 30, 11, 49], g: 15, regimes: VEGAN_SG },
  { id: 'purée-cacahuete', nom: 'Purée de cacahuète', rayon: 'Épicerie', v: [600, 25, 12, 50], g: 15, regimes: VEGAN_SG },
  { id: 'miel', nom: 'Miel', rayon: 'Épicerie', v: [320, 0.4, 80, 0], g: 10, regimes: VEGE_SG },
  { id: 'cannelle', nom: 'Cannelle', rayon: 'Épicerie', v: [0, 0, 0, 0], g: 1, regimes: VEGAN_SG },
  { id: 'chocolat-noir', nom: 'Chocolat noir 70 %', titreCourt: 'chocolat noir', rayon: 'Épicerie', v: [598, 8, 33, 43], g: 15, regimes: VEGE_SG },
  { id: 'beurre-matin', nom: 'Beurre à 60 %', titreCourt: 'beurre', rayon: 'Crèmerie', v: [535, 0.5, 1, 60], g: 10, regimes: VEGE_SG },
  { id: 'confiture', nom: 'Confiture allégée', titreCourt: 'confiture', rayon: 'Épicerie', v: [160, 0.4, 38, 0], g: 15, regimes: VEGAN_SG },
  { id: 'graines-chia', nom: 'Graines de chia', rayon: 'Épicerie', v: [486, 17, 8, 31], g: 12, regimes: VEGAN_SG },
]

/** Les garnitures salées d'une tartine ou d'une collation. */
export const GARNITURES_SALEES: Brique[] = [
  { id: 'avocat', nom: 'Avocat', rayon: 'Fruits et légumes', v: [160, 2, 2, 15], g: 80, regimes: VEGAN_SG },
  { id: 'houmous', nom: 'Houmous', rayon: 'Crèmerie', v: [230, 7, 14, 17], g: 60, regimes: VEGAN, styles: ['orientale'] },
  { id: 'fromage-frais', nom: 'Fromage frais', rayon: 'Crèmerie', v: [150, 8, 3, 12], g: 60, regimes: VEGE_SG },
  { id: 'ricotta', nom: 'Ricotta', rayon: 'Crèmerie', v: [146, 11, 3, 10], g: 60, regimes: VEGE_SG, styles: ['italienne'] },
  { id: 'saumon-fume', nom: 'Saumon fumé', rayon: 'Boucherie, poissonnerie', v: [180, 22, 0, 10], g: 60, regimes: SGL, styles: ['nordique'] },
  { id: 'jambon-tartine', nom: 'Jambon blanc', rayon: 'Boucherie, poissonnerie', v: [110, 20, 1, 3], g: 60, regimes: SGL },
  { id: 'oeuf-tartine', nom: 'Œuf', rayon: 'Crèmerie', v: [143, 13, 0.7, 10], g: 60, unite: '1', regimes: SGL },
  { id: 'sardine-tartine', nom: 'Sardines à l’huile', titreCourt: 'sardines', rayon: 'Épicerie', v: [220, 24, 0, 13], g: 50, regimes: SGL, styles: ['mediterraneenne'] },
]

/**
 * Toutes les briques, pour les recherches par identifiant.
 *
 * Utile au moment de relier une recette composée à son origine : un écran qui
 * voudrait expliquer d'où vient un chiffre peut retrouver la brique.
 */
export const TOUTES_BRIQUES: Brique[] = [
  ...PROTEINES,
  ...FECULENTS,
  ...LEGUMES,
  ...GRAS,
  ...BASES_MATIN,
  ...FRUITS,
  ...GARNITURES_MATIN,
  ...GARNITURES_SALEES,
]

/** Les calories d'une brique pour la quantité prévue, arrondies. */
export function kcalDeLaBrique(brique: Brique): number {
  return Math.round((brique.v[0] * brique.g) / 100)
}

/**
 * Vrai quand la brique va avec ce style.
 *
 * Une brique sans `styles` passe partout : c'est le cas du riz, de la carotte, du
 * poulet. Ne lister les styles que là où l'inverse serait faux évite d'avoir à
 * réviser vingt tableaux à chaque cuisine ajoutée.
 */
export function vaAvec(brique: Brique | Aromate, style: Cuisine): boolean {
  return brique.styles === undefined || brique.styles.includes(style)
}

/** L'intersection des régimes garantis — voir l'en-tête de ce fichier. */
export function regimesCommuns(elements: { regimes?: Regime[] }[]): Regime[] {
  const tous: Regime[] = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose']
  return tous.filter((regime) => elements.every((e) => e.regimes?.includes(regime)))
}
