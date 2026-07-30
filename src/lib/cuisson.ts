import { recetteParId } from './recettes'
import type { Recette } from './recettes'
import type { SeanceCuisine } from './types'

/**
 * Cuisiner en direct : les durées cachées dans le texte des étapes, et l'ordre
 * dans lequel s'attaquer à plusieurs recettes.
 *
 * Tout est déduit du catalogue tel qu'il est écrit — aucune annotation
 * supplémentaire n'a été demandée aux 53 recettes. C'est ce qui permet à une
 * recette ajoutée demain d'avoir ses minuteurs sans rien de plus, et c'est
 * aussi la limite du procédé : ce qui est déduit d'une phrase peut se tromper,
 * donc **rien ne se déclenche tout seul**. L'écran propose, la personne lance.
 */

/* ──────────────────────── Les durées d'une étape ──────────────────────── */

export interface Duree {
  /** En secondes — un « 40 s à 700 W » ne tient pas en minutes entières. */
  secondes: number
  /** Le libellé tel qu'il apparaît dans l'étape, pour que le bouton le cite. */
  libelle: string
}

/**
 * Bornes de ce qu'on accepte de proposer en minuteur.
 *
 * En dessous d'une demi-minute, le temps de lancer le minuteur la cuisson est
 * finie. Au-delà de trois heures, ce n'est plus une étape de recette mais un
 * repos au réfrigérateur, et un minuteur qui tourne toute la nuit n'aide
 * personne.
 */
const MINIMUM_SECONDES = 30
const MAXIMUM_SECONDES = 3 * 3600

/**
 * Les durées lisibles dans une étape.
 *
 * Les unités de conservation — jour, semaine, mois — sont **exclues** : « se
 * garde 3 mois au congélateur » n'est pas un temps de cuisson, et proposer un
 * minuteur de trois mois serait absurde. Les températures et les puissances
 * (« 160 °C », « 700 W ») ne sont pas des durées non plus ; la borne d'unités
 * s'en charge.
 *
 * Une étape peut en porter **plusieurs** (« 6 minutes par face », « puis
 * 2 minutes ») : on les propose toutes plutôt que de deviner laquelle compte.
 * Deviner mal ferait rater une cuisson ; proposer deux boutons ne coûte qu'un
 * regard.
 */
export function dureesDeLEtape(texte: string): Duree[] {
  const trouvees: Duree[] = []
  const motif = /(\d+)\s*(h(?:eures?)?|min(?:utes?)?|s(?:econdes?)?)(?![a-zà-ÿ])/gi

  for (const m of texte.matchAll(motif)) {
    const valeur = Number(m[1])
    const unite = m[2].toLowerCase()
    const secondes = unite.startsWith('h')
      ? valeur * 3600
      : unite.startsWith('min')
        ? valeur * 60
        : valeur

    if (secondes < MINIMUM_SECONDES || secondes > MAXIMUM_SECONDES) continue
    // Deux fois la même durée dans une phrase ne fait qu'un bouton.
    if (trouvees.some((d) => d.secondes === secondes)) continue

    trouvees.push({ secondes, libelle: m[0].trim() })
  }

  return trouvees
}

/** Mise en forme d'un compte à rebours : « 12:05 », « 1:04:30 ». */
export function chrono(secondes: number): string {
  const s = Math.max(0, Math.round(secondes))
  const heures = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const reste = s % 60

  const mm = String(minutes).padStart(heures > 0 ? 2 : 1, '0')
  return heures > 0
    ? `${heures}:${mm}:${String(reste).padStart(2, '0')}`
    : `${mm}:${String(reste).padStart(2, '0')}`
}

/* ──────────────────────────── Le batch cooking ──────────────────────────── */

export interface EtapeBatch {
  recette: Recette
  /** Index de l'étape dans sa recette, pour l'afficher « 3 sur 5 ». */
  index: number
  texte: string
  durees: Duree[]
}

export interface PlanBatch {
  /** Les recettes dans l'ordre où les commencer. */
  ordre: Recette[]
  /** Somme des temps annoncés, si on les faisait l'une après l'autre. */
  minutesBoutABout: number
  /**
   * Estimation du temps réel en menant les cuissons en parallèle : la plus
   * longue recette, plus une marge pour les autres. C'est un ordre de grandeur
   * affiché comme tel, pas une promesse.
   */
  minutesEnParallele: number
}

/**
 * Dans quel ordre attaquer plusieurs recettes.
 *
 * **Les étapes ne sont pas entrelacées automatiquement**, et c'est une décision.
 * Le catalogue ne dit pas quelles étapes sont actives (couper, remuer) et
 * lesquelles sont passives (cuire, refroidir) ; un entrelacement déduit d'une
 * phrase enverrait remuer une poêle qui n'est pas encore sur le feu. Ce qui est
 * calculable sans risque, c'est **l'ordre de démarrage** : la recette la plus
 * longue d'abord, parce que son temps de cuisson est celui qui libère du temps
 * pour les autres.
 */
export function ordonnerBatch(recettes: Recette[]): PlanBatch {
  const ordre = [...recettes].sort((a, b) => b.minutes - a.minutes)
  const minutesBoutABout = recettes.reduce((somme, r) => somme + r.minutes, 0)
  const plusLongue = ordre[0]?.minutes ?? 0
  const reste = minutesBoutABout - plusLongue

  return {
    ordre,
    minutesBoutABout,
    // La moitié du reste : on ne travaille pas pendant toute la cuisson de la
    // première, mais on n'attend pas les bras croisés non plus.
    minutesEnParallele: Math.round(plusLongue + reste / 2),
  }
}

/** Toutes les étapes d'une séance, recette par recette, prêtes à l'affichage. */
export function etapesDeLaSeance(recettesIds: string[]): EtapeBatch[] {
  return recettesIds.flatMap((id) => {
    const recette = recetteParId(id)
    if (!recette) return []
    return recette.etapes.map((texte, index) => ({
      recette,
      index,
      texte,
      durees: dureesDeLEtape(texte),
    }))
  })
}

/**
 * Une séance neuve, toutes recettes à leur première étape.
 *
 * Un seul point de fabrication pour les quatre écrans qui lancent une cuisson :
 * `etapes` doit avoir exactement la longueur de `recettes`, et un tableau
 * construit à la main au quatrième endroit finit toujours par l'oublier.
 */
export function seanceDeCuisine(recettesIds: string[]): SeanceCuisine {
  return {
    recettes: recettesIds,
    courante: 0,
    etapes: recettesIds.map(() => 0),
    demarreLe: new Date().toISOString(),
  }
}

/** Les recettes d'une séance, celles qui existent encore au catalogue. */
export function recettesDeLaSeance(recettesIds: string[]): Recette[] {
  return recettesIds.map(recetteParId).filter((r): r is Recette => r !== undefined)
}
