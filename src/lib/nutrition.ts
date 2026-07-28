import type { Activite, Profil, Sexe } from './types'

const FACTEUR_ACTIVITE: Record<Activite, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
}

export const LIBELLE_ACTIVITE: Record<Activite, string> = {
  sedentaire: 'Sédentaire — travail assis, peu de marche',
  leger: 'Peu actif — un peu de marche, 1 à 2 séances par semaine',
  modere: 'Actif — 3 à 5 séances par semaine',
  actif: 'Très actif — sport quotidien ou métier physique',
}

/** Un déficit plus agressif se paie en fringales. 20 % tient sur la durée. */
const DEFICIT = 0.2

/** En dessous, les apports en vitamines et minéraux ne sont plus couvrables. */
const PLANCHER_KCAL: Record<Sexe, number> = { femme: 1200, homme: 1500 }

/** Un kilo de masse grasse ≈ 7 700 kcal. */
const KCAL_PAR_KG = 7700

/** Mifflin-St Jeor — l'équation retenue aujourd'hui par les diététiciens. */
export function metabolismeDeBase(p: {
  poidsKg: number
  tailleCm: number
  age: number
  sexe: Sexe
}): number {
  const base = 10 * p.poidsKg + 6.25 * p.tailleCm - 5 * p.age
  return Math.round(p.sexe === 'femme' ? base - 161 : base + 5)
}

export function depenseJournaliere(p: {
  poidsKg: number
  tailleCm: number
  age: number
  sexe: Sexe
  activite: Activite
}): number {
  return Math.round(metabolismeDeBase(p) * FACTEUR_ACTIVITE[p.activite])
}

export function objectifCalorique(p: {
  poidsKg: number
  tailleCm: number
  age: number
  sexe: Sexe
  activite: Activite
}): number {
  const depense = depenseJournaliere(p)
  return Math.max(PLANCHER_KCAL[p.sexe], Math.round(depense * (1 - DEFICIT)))
}

export interface Trajectoire {
  depenseKcal: number
  objectifKcal: number
  deficitKcal: number
  perteHebdoKg: number
  semainesRestantes: number
  dateEstimee: Date | null
}

export function trajectoire(profil: Profil, poidsActuelKg: number): Trajectoire {
  const mesures = {
    poidsKg: poidsActuelKg,
    tailleCm: profil.tailleCm,
    age: profil.age,
    sexe: profil.sexe,
    activite: profil.activite,
  }
  const depenseKcal = depenseJournaliere(mesures)
  const objectifKcal = objectifCalorique(mesures)
  const deficitKcal = depenseKcal - objectifKcal
  const perteHebdoKg = (deficitKcal * 7) / KCAL_PAR_KG

  const resteKg = Math.max(0, poidsActuelKg - profil.poidsObjectifKg)
  const semainesRestantes = perteHebdoKg > 0 ? Math.ceil(resteKg / perteHebdoKg) : 0

  let dateEstimee: Date | null = null
  if (resteKg > 0 && semainesRestantes > 0) {
    dateEstimee = new Date()
    dateEstimee.setDate(dateEstimee.getDate() + semainesRestantes * 7)
  }

  return {
    depenseKcal,
    objectifKcal,
    deficitKcal,
    perteHebdoKg,
    semainesRestantes,
    dateEstimee,
  }
}

/**
 * En dessous de ce rythme, la perte devient difficile à distinguer des
 * variations normales d'un jour à l'autre, et le moral suit rarement.
 */
const RYTHME_LENT_KG_SEMAINE = 0.35

/**
 * Chez une personne sédentaire, la dépense est basse : un déficit de 20 % ne
 * dégage que peu de calories, et descendre plus bas passerait sous le plancher
 * nutritionnel. Le seul levier honnête est alors l'activité, pas l'assiette —
 * autant le dire plutôt que de laisser espérer un rythme qui ne viendra pas.
 */
export function rythmeLent(t: Trajectoire, activite: Activite): boolean {
  return t.perteHebdoKg > 0 && t.perteHebdoKg < RYTHME_LENT_KG_SEMAINE && activite === 'sedentaire'
}

/** Ce que 30 minutes de marche quotidienne ajouteraient à la dépense. */
export function gainMarcheQuotidienne(poidsKg: number): number {
  // ~3,3 MET pour une marche soutenue, 0,5 h, moins le métabolisme de repos.
  return Math.round((3.3 - 1) * poidsKg * 0.5)
}

export function imc(poidsKg: number, tailleCm: number): number {
  const m = tailleCm / 100
  return poidsKg / (m * m)
}

export function libelleIMC(valeur: number): string {
  if (valeur < 18.5) return 'Insuffisance pondérale'
  if (valeur < 25) return 'Corpulence normale'
  if (valeur < 30) return 'Surpoids'
  return 'Obésité'
}

/** Part du chemin parcourue entre le poids de départ et l'objectif. */
export function progression(profil: Profil, poidsActuelKg: number): number {
  const total = profil.poidsDepartKg - profil.poidsObjectifKg
  if (total <= 0) return 1
  const fait = profil.poidsDepartKg - poidsActuelKg
  return Math.min(1, Math.max(0, fait / total))
}
