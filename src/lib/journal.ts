import { indiceEquilibre, valeurNutri } from './nutriscore'
import type { EntreeJournal, Moment, ValeursPour100 } from './types'
import { MOMENTS } from './types'
import { jourISO } from './utils'

/** Tout ce qu'une entrée apporte réellement, une fois la quantité appliquée. */
export interface Apport {
  kcal: number
  proteines: number
  glucides: number
  sucres: number
  lipides: number
  satures: number
  fibres: number
  sel: number
}

const VIDE: Apport = {
  kcal: 0,
  proteines: 0,
  glucides: 0,
  sucres: 0,
  lipides: 0,
  satures: 0,
  fibres: 0,
  sel: 0,
}

export function apportDe(entree: EntreeJournal): Apport {
  return mettreALEchelle(entree.aliment.valeurs, entree.quantiteG)
}

export function mettreALEchelle(valeurs: ValeursPour100, quantiteG: number): Apport {
  const f = quantiteG / 100
  return {
    kcal: valeurs.kcal * f,
    proteines: valeurs.proteines * f,
    glucides: valeurs.glucides * f,
    sucres: valeurs.sucres * f,
    lipides: valeurs.lipides * f,
    satures: valeurs.satures * f,
    fibres: valeurs.fibres * f,
    sel: valeurs.sel * f,
  }
}

export function additionner(apports: Apport[]): Apport {
  return apports.reduce(
    (t, a) => ({
      kcal: t.kcal + a.kcal,
      proteines: t.proteines + a.proteines,
      glucides: t.glucides + a.glucides,
      sucres: t.sucres + a.sucres,
      lipides: t.lipides + a.lipides,
      satures: t.satures + a.satures,
      fibres: t.fibres + a.fibres,
      sel: t.sel + a.sel,
    }),
    { ...VIDE },
  )
}

/* ─────────────────────────── Lectures du jour ─────────────────────────── */

export function entreesDuJour(journal: EntreeJournal[], date = jourISO()): EntreeJournal[] {
  return journal
    .filter((e) => e.date === date)
    .sort((a, b) => a.horodatage.localeCompare(b.horodatage))
}

export function totalDuJour(journal: EntreeJournal[], date = jourISO()): Apport {
  return additionner(entreesDuJour(journal, date).map(apportDe))
}

export interface BilanRepas {
  moment: Moment
  entrees: EntreeJournal[]
  apport: Apport
  /** Moyenne des Nutri-Scores du repas, pondérée par les calories. 0 à 4. */
  qualite: number
}

export function bilanParRepas(journal: EntreeJournal[], date = jourISO()): BilanRepas[] {
  const dujour = entreesDuJour(journal, date)
  return MOMENTS.map((moment) => {
    const entrees = dujour.filter((e) => e.moment === moment)
    const apports = entrees.map(apportDe)
    return {
      moment,
      entrees,
      apport: additionner(apports),
      qualite: qualiteMoyenne(entrees),
    }
  })
}

/**
 * Note moyenne d'un ensemble d'entrées, pondérée par les calories.
 *
 * Pondérer par les calories et non par le nombre d'aliments évite qu'une
 * feuille de salade compense une part de gâteau.
 */
export function qualiteMoyenne(entrees: EntreeJournal[]): number {
  const total = entrees.reduce((s, e) => s + apportDe(e).kcal, 0)
  if (total <= 0) return entrees.length > 0 ? moyenneSimple(entrees) : 0
  const somme = entrees.reduce(
    (s, e) => s + valeurNutri(e.aliment.nutriScore) * apportDe(e).kcal,
    0,
  )
  return somme / total
}

function moyenneSimple(entrees: EntreeJournal[]): number {
  return entrees.reduce((s, e) => s + valeurNutri(e.aliment.nutriScore), 0) / entrees.length
}

/* ──────────────────────────── Top et flop ──────────────────────────── */

export interface TopFlop {
  top: EntreeJournal | null
  flop: EntreeJournal | null
}

/**
 * Le meilleur et le moins bon de la journée.
 *
 * Le flop n'est pas simplement l'aliment le plus calorique : un plat complet
 * consistant n'est pas une faute. On classe sur le poids calorique *croisé*
 * avec la qualité nutritionnelle, pour que le flop désigne ce qui coûte cher
 * sans rien apporter.
 */
export function topFlopDuJour(journal: EntreeJournal[], date = jourISO()): TopFlop {
  const entrees = entreesDuJour(journal, date).filter((e) => apportDe(e).kcal > 0)
  if (entrees.length === 0) return { top: null, flop: null }

  const kcalMax = Math.max(...entrees.map((e) => apportDe(e).kcal))

  const note = (e: EntreeJournal) => {
    const part = apportDe(e).kcal / kcalMax
    // 0 (mauvais) à 4 (excellent), ramené sur 1, moins le poids calorique.
    return valeurNutri(e.aliment.nutriScore) / 4 - part * 0.6
  }

  const triees = [...entrees].sort((a, b) => note(b) - note(a))
  return {
    top: triees[0] ?? null,
    flop: triees.length > 1 ? (triees.at(-1) ?? null) : null,
  }
}

/* ──────────────────────────── Objectifs ──────────────────────────── */

/**
 * Répartition indicative des calories entre les repas.
 *
 * Sert à situer un repas, pas à le prescrire : c'est la répartition qu'on
 * observe le plus souvent, pas une règle nutritionnelle.
 */
export const PART_MOMENT: Record<Moment, number> = {
  'petit-dejeuner': 0.25,
  dejeuner: 0.35,
  collation: 0.1,
  diner: 0.3,
}

export function cibleDuRepas(objectifKcal: number, moment: Moment): number {
  return Math.round(objectifKcal * PART_MOMENT[moment])
}

/**
 * Objectifs de macronutriments, en grammes.
 *
 * Répartition 25 / 40 / 35 : assez de protéines pour préserver le muscle
 * pendant une perte de poids, le reste partagé entre glucides et lipides.
 */
export function objectifsMacros(objectifKcal: number) {
  return {
    proteines: Math.round((objectifKcal * 0.25) / 4),
    glucides: Math.round((objectifKcal * 0.4) / 4),
    lipides: Math.round((objectifKcal * 0.35) / 9),
  }
}

/** Points de l'indice maison consommés dans la journée. */
export function indiceDuJour(journal: EntreeJournal[], date = jourISO()): number {
  return entreesDuJour(journal, date).reduce(
    (s, e) => s + indiceEquilibre(e.aliment.valeurs, e.quantiteG),
    0,
  )
}

/** Nombre de jours consécutifs, jusqu'à aujourd'hui, où au moins un repas est noté. */
export function serieDeJours(journal: EntreeJournal[]): number {
  const jours = new Set(journal.map((e) => e.date))
  let n = 0
  const curseur = new Date()
  while (jours.has(jourISO(curseur))) {
    n++
    curseur.setDate(curseur.getDate() - 1)
  }
  return n
}
