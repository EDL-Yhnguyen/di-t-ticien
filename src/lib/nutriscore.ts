import type { Aliment, FamilleAliment, NutriScore, ValeursPour100 } from './types'

/**
 * Nutri-Score — barème 2023 du Comité scientifique européen.
 *
 * Ce calcul est un **repli**. Quand un aliment vient d'un code-barres, la note
 * arrive déjà calculée par Open Food Facts d'après la déclaration du
 * fabricant : c'est celle-là qui fait foi. Le calcul ci-dessous ne sert que
 * pour les aliments saisis à la main et les recettes, et tout ce qu'il produit
 * est marqué « estimé » à l'écran — une note que nous calculons n'engage
 * personne d'autre que nous.
 */

/** Renvoie le rang d'une valeur dans une échelle de seuils croissants. */
function rang(valeur: number, seuils: number[]): number {
  for (let i = 0; i < seuils.length; i++) {
    if (valeur <= seuils[i]) return i
  }
  return seuils.length
}

const KJ_PAR_KCAL = 4.184

/* Points négatifs — barème général. */
const ENERGIE = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
const SUCRES = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51]
const SATURES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const SEL = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8, 4]

/* Points positifs — barème général. */
const FIBRES = [3, 4.1, 5.2, 6.3, 7.4]
const PROTEINES = [2.4, 4.8, 7.2, 9.6, 12, 14, 17]

/* Boissons : leurs seuils d'énergie et de sucre sont bien plus serrés. */
const ENERGIE_BOISSON = [30, 90, 150, 210, 240, 270, 300, 330, 360, 390]
const SUCRES_BOISSON = [0.5, 2, 3.5, 5, 6, 7, 8, 9, 10, 11]
const PROTEINES_BOISSON = [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3]

/* Matières grasses : le barème porte sur la part de saturés dans les lipides. */
const RATIO_SATURES = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64]
const ENERGIE_GRASSE = [120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200]

function pointsFruitsLegumes(part: number, boisson: boolean): number {
  if (boisson) return part <= 40 ? 0 : part <= 60 ? 2 : part <= 80 ? 4 : 6
  return part <= 40 ? 0 : part <= 60 ? 2 : part <= 80 ? 5 : 7
}

export function calculerNutriScore(
  valeurs: ValeursPour100,
  famille: FamilleAliment = 'general',
  partFruitsLegumes = 0,
): NutriScore {
  const boisson = famille === 'boisson'
  const grasse = famille === 'matiere-grasse'
  const kJ = valeurs.kcal * KJ_PAR_KCAL

  // Sur une matière grasse, l'énergie et les saturés sont ramenés à la part
  // de lipides : sans ça, toutes les huiles se vaudraient au fond de l'échelle.
  const pEnergie = grasse
    ? rang(kJ * (valeurs.lipides > 0 ? 100 / valeurs.lipides : 1) / 100, ENERGIE_GRASSE)
    : rang(kJ, boisson ? ENERGIE_BOISSON : ENERGIE)

  const pSucres = rang(valeurs.sucres, boisson ? SUCRES_BOISSON : SUCRES)

  const pSatures = grasse
    ? rang(valeurs.lipides > 0 ? (valeurs.satures / valeurs.lipides) * 100 : 0, RATIO_SATURES)
    : rang(valeurs.satures, SATURES)

  const pSel = rang(valeurs.sel, SEL)

  const negatifs = pEnergie + pSucres + pSatures + pSel

  const pFibres = rang(valeurs.fibres, FIBRES)
  const pProteines = rang(valeurs.proteines, boisson ? PROTEINES_BOISSON : PROTEINES)
  const pFruits = pointsFruitsLegumes(partFruitsLegumes, boisson)

  // Au-delà de 11 points négatifs, les protéines cessent de compenser — sinon
  // une charcuterie très salée remonterait grâce à sa teneur en protéines.
  // Les fromages échappent à la règle, c'est prévu par le barème.
  const proteinesComptees = negatifs >= 11 && famille !== 'fromage' ? 0 : pProteines
  const positifs = pFibres + proteinesComptees + pFruits

  const score = negatifs - positifs

  if (boisson) {
    // Seule l'eau atteint le A. Les autres boissons démarrent au B.
    if (valeurs.kcal === 0 && valeurs.sucres === 0) return 'A'
    if (score <= 2) return 'B'
    if (score <= 6) return 'C'
    if (score <= 9) return 'D'
    return 'E'
  }

  if (grasse) {
    if (score <= -6) return 'A'
    if (score <= 2) return 'B'
    if (score <= 10) return 'C'
    if (score <= 18) return 'D'
    return 'E'
  }

  if (score <= 0) return 'A'
  if (score <= 2) return 'B'
  if (score <= 10) return 'C'
  if (score <= 18) return 'D'
  return 'E'
}

/** Complète un aliment dont la note manque, en marquant qu'elle est estimée. */
export function avecNutriScore(aliment: Aliment): Aliment {
  if (aliment.nutriScore) return aliment
  return {
    ...aliment,
    nutriScore: calculerNutriScore(aliment.valeurs, aliment.famille, aliment.partFruitsLegumes),
    nutriScoreEstime: true,
  }
}

/* ───────────────────────── Lecture à l'écran ───────────────────────── */

export const ORDRE_NUTRI: NutriScore[] = ['A', 'B', 'C', 'D', 'E']

export const LIBELLE_NUTRI: Record<NutriScore, string> = {
  A: 'Très bonne qualité nutritionnelle',
  B: 'Bonne qualité nutritionnelle',
  C: 'Qualité nutritionnelle moyenne',
  D: 'Qualité nutritionnelle médiocre',
  E: 'Faible qualité nutritionnelle',
}

/** Rang numérique, pour comparer et classer. A vaut 4, E vaut 0. */
export function valeurNutri(note: NutriScore | undefined): number {
  return note ? 4 - ORDRE_NUTRI.indexOf(note) : 2
}

/**
 * Indice Équilibre — notre équivalent des points d'un programme minceur.
 *
 * Weight Watchers ne publie ni ses recettes ni sa formule, et les deux sont
 * protégées. Celle-ci est la nôtre : elle pénalise l'énergie, les sucres et
 * les graisses saturées, et crédite les protéines et les fibres — les mêmes
 * leviers, sur des données publiques. Un point vaut environ 35 kcal d'un
 * aliment sans intérêt nutritionnel.
 */
export function indiceEquilibre(valeurs: ValeursPour100, quantiteG: number): number {
  const f = quantiteG / 100
  const points =
    (valeurs.kcal * f) / 35 +
    (valeurs.sucres * f) / 9 +
    (valeurs.satures * f) / 4 -
    (valeurs.proteines * f) / 11 -
    (valeurs.fibres * f) / 6
  return Math.max(0, Math.round(points * 10) / 10)
}

export type Bande = 'vert' | 'bleu' | 'orange'

export const LIBELLE_BANDE: Record<Bande, string> = {
  vert: 'Léger',
  bleu: 'Équilibré',
  orange: 'Copieux',
}

/**
 * Range un plat dans une bande selon ce qu'il pèse par rapport au repas visé.
 *
 * La bande dit la charge calorique, la pastille Nutri-Score dit la qualité :
 * deux signaux, deux questions différentes. Une salade de graines est verte au
 * Nutri-Score et orange en bande — les deux sont vrais et utiles.
 */
export function bandePour(kcalPortion: number, kcalRepasCible: number): Bande {
  if (kcalRepasCible <= 0) return 'bleu'
  const part = kcalPortion / kcalRepasCible
  if (part <= 0.75) return 'vert'
  if (part <= 1.1) return 'bleu'
  return 'orange'
}
