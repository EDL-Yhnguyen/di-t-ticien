import { additionner, apportDe, entreesDuJour, objectifsMacros, totalDuJour } from './journal'
import type { Apport } from './journal'
import { ORDRE_NUTRI } from './nutriscore'
import { bonusSportDuJour, minutesDuJour } from './sport'
import type { EtatUtilisateur } from './store'
import { objectifCalorique } from './nutrition'
import type { EntreeJournal, NutriScore, SeanceSport } from './types'
import { jourISO } from './utils'

/**
 * Les statistiques sur la durée.
 *
 * Un journal alimentaire ne sert à rien s'il ne rend rien : ce module relit ce
 * qui a été noté et en tire des tendances. Comme partout ailleurs, il ne stocke
 * rien — tout se recalcule depuis le journal, les pesées et les séances.
 *
 * **Les jours sans rien de noté ne sont pas des jours à zéro calorie.** Ne pas
 * les compter dans les moyennes est la seule lecture honnête : sinon un
 * week-end oublié ferait croire à une semaine exemplaire.
 */

export type Periode = 7 | 30 | 90

export const PERIODES: Periode[] = [7, 30, 90]

export const LIBELLE_PERIODE: Record<Periode, string> = {
  7: '7 jours',
  30: '30 jours',
  90: '3 mois',
}

/** Les `n` derniers jours, du plus ancien au plus récent, aujourd'hui compris. */
export function derniersJours(n: number, date = jourISO()): string[] {
  const fin = new Date(`${date}T12:00:00`)
  return Array.from({ length: n }, (_, i) => {
    const jour = new Date(fin)
    jour.setDate(fin.getDate() - (n - 1 - i))
    return jourISO(jour)
  })
}

/* ─────────────────────────────── Calories ─────────────────────────────── */

export interface JourStat {
  date: string
  kcal: number
  /** L'objectif du jour, bonus sport compris — celui que la personne a vu. */
  objectif: number
  /** Faux quand rien n'a été noté ce jour-là : la barre est vide, pas nulle. */
  suivi: boolean
}

export function jourParJour(etat: EtatUtilisateur, periode: Periode, date = jourISO()): JourStat[] {
  // Le poids est relu jour par jour : quelqu'un qui a perdu trois kilos sur la
  // période n'avait pas le même objectif au début qu'à la fin, et lui appliquer
  // rétroactivement son poids d'aujourd'hui fausserait la comparaison.
  const pesees = peseesTriees(etat)

  return derniersJours(periode, date).map((jour) => {
    const objectifBase = objectifCalorique({
      poidsKg: poidsConnuLe(pesees, jour, etat.profil.poidsDepartKg),
      tailleCm: etat.profil.tailleCm,
      age: etat.profil.age,
      sexe: etat.profil.sexe,
      activite: etat.profil.activite,
    })

    return {
      date: jour,
      kcal: Math.round(totalDuJour(etat.journal, jour).kcal),
      objectif: objectifBase + bonusSportDuJour(etat.seances, jour),
      suivi: entreesDuJour(etat.journal, jour).length > 0,
    }
  })
}

export interface BilanCalories {
  /** Nombre de jours où quelque chose a été noté. */
  joursSuivis: number
  /** Moyenne sur les seuls jours suivis. `0` s'il n'y en a aucun. */
  moyenneKcal: number
  moyenneObjectif: number
  /** Jours suivis terminés à moins de 10 % de l'objectif, dans un sens ou l'autre. */
  joursDansLaCible: number
  /** Écart cumulé à l'objectif sur les jours suivis, en kcal. */
  ecartCumule: number
}

export function bilanCalories(jours: JourStat[]): BilanCalories {
  const suivis = jours.filter((j) => j.suivi)
  if (suivis.length === 0) {
    return {
      joursSuivis: 0,
      moyenneKcal: 0,
      moyenneObjectif: jours.at(-1)?.objectif ?? 0,
      joursDansLaCible: 0,
      ecartCumule: 0,
    }
  }

  const totalKcal = suivis.reduce((s, j) => s + j.kcal, 0)
  const totalObjectif = suivis.reduce((s, j) => s + j.objectif, 0)

  return {
    joursSuivis: suivis.length,
    moyenneKcal: Math.round(totalKcal / suivis.length),
    moyenneObjectif: Math.round(totalObjectif / suivis.length),
    joursDansLaCible: suivis.filter((j) => Math.abs(j.kcal - j.objectif) <= j.objectif * 0.1).length,
    ecartCumule: Math.round(totalKcal - totalObjectif),
  }
}

/**
 * Une phrase sur la période. Elle décrit, elle ne félicite ni ne gronde : c'est
 * à la personne de décider ce qu'elle en fait.
 */
export function resumerLaPeriode(bilan: BilanCalories, periode: Periode): string {
  if (bilan.joursSuivis === 0) {
    return `Rien de noté sur les ${periode} derniers jours. Les statistiques se remplissent d’elles-mêmes dès que vous notez un repas.`
  }
  if (bilan.joursSuivis < 3) {
    return `${bilan.joursSuivis} jour${bilan.joursSuivis > 1 ? 's' : ''} noté${
      bilan.joursSuivis > 1 ? 's' : ''
    } sur ${periode} : trop peu pour dégager une tendance, mais c’est un début.`
  }

  const ecart = bilan.moyenneKcal - bilan.moyenneObjectif
  if (Math.abs(ecart) <= bilan.moyenneObjectif * 0.05) {
    return `${bilan.moyenneKcal} kcal par jour en moyenne, pour un repère à ${bilan.moyenneObjectif} : vous êtes dessus.`
  }
  if (ecart < 0) {
    return `${bilan.moyenneKcal} kcal par jour en moyenne, soit ${Math.abs(
      ecart,
    )} de moins que votre repère.`
  }
  return `${bilan.moyenneKcal} kcal par jour en moyenne, soit ${ecart} de plus que votre repère.`
}

/* ──────────────────────────────── Macros ──────────────────────────────── */

export interface BilanMacros {
  moyenne: Apport
  cibles: ReturnType<typeof objectifsMacros>
}

export function bilanMacros(etat: EtatUtilisateur, jours: JourStat[]): BilanMacros {
  const suivis = jours.filter((j) => j.suivi)
  const totaux = suivis.map((j) => totalDuJour(etat.journal, j.date))
  const somme = additionner(totaux)
  const n = Math.max(1, suivis.length)

  return {
    moyenne: {
      kcal: somme.kcal / n,
      proteines: somme.proteines / n,
      glucides: somme.glucides / n,
      sucres: somme.sucres / n,
      lipides: somme.lipides / n,
      satures: somme.satures / n,
      fibres: somme.fibres / n,
      sel: somme.sel / n,
    },
    cibles: objectifsMacros(bilanCalories(jours).moyenneObjectif),
  }
}

/* ──────────────────────────────── Qualité ──────────────────────────────── */

/**
 * Répartition des calories mangées par note Nutri-Score.
 *
 * Pondérer par les calories et non par le nombre d'aliments évite qu'une
 * pomme compense une part de tarte — c'est la même règle que `qualiteMoyenne`.
 */
export function repartitionNutri(
  journal: EntreeJournal[],
  jours: JourStat[],
): { note: NutriScore | null; kcal: number; part: number }[] {
  const dates = new Set(jours.map((j) => j.date))
  const entrees = journal.filter((e) => dates.has(e.date))

  const parNote = new Map<NutriScore | null, number>()
  let total = 0
  for (const entree of entrees) {
    const kcal = apportDe(entree).kcal
    const note = entree.aliment.nutriScore ?? null
    parNote.set(note, (parNote.get(note) ?? 0) + kcal)
    total += kcal
  }

  const ordre: (NutriScore | null)[] = [...ORDRE_NUTRI, null]
  return ordre
    .map((note) => {
      const kcal = parNote.get(note) ?? 0
      return { note, kcal: Math.round(kcal), part: total > 0 ? kcal / total : 0 }
    })
    .filter((ligne) => ligne.kcal > 0)
}

/* ───────────────────────────────── Sport ───────────────────────────────── */

export interface BilanSport {
  minutes: number
  kcal: number
  jours: number
  /** Minutes ramenées à une semaine, pour se comparer au repère de l'OMS. */
  minutesParSemaine: number
}

export function bilanSport(seances: SeanceSport[], jours: JourStat[]): BilanSport {
  const dates = jours.map((j) => j.date)
  const minutes = dates.reduce((s, j) => s + minutesDuJour(seances, j), 0)

  return {
    minutes,
    kcal: dates.reduce((s, j) => s + bonusSportDuJour(seances, j), 0),
    jours: dates.filter((j) => minutesDuJour(seances, j) > 0).length,
    minutesParSemaine: Math.round((minutes / dates.length) * 7),
  }
}

/* ───────────────────────────────── Poids ───────────────────────────────── */

export interface BilanPoids {
  depart: number | null
  arrivee: number | null
  /** Négatif quand le poids a baissé. `null` faute de deux pesées encadrantes. */
  delta: number | null
}

/** Toutes les pesées connues, saisies ou importées, triées par date. */
function peseesTriees(etat: EtatUtilisateur): { date: string; poidsKg: number }[] {
  const importees = etat.mesuresSante
    .filter((m) => typeof m.poidsKg === 'number')
    .map((m) => ({ date: m.date, poidsKg: m.poidsKg as number }))
  return [...etat.pesees, ...importees].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * La dernière pesée connue à une date, sans regarder après elle.
 *
 * Avant la première pesée il n'y a rien à lire : on retombe sur le poids de
 * départ du profil plutôt que d'extrapoler vers l'arrière.
 */
function poidsConnuLe(
  pesees: { date: string; poidsKg: number }[],
  date: string,
  defaut: number,
): number {
  const avant = pesees.filter((p) => p.date <= date)
  return avant.at(-1)?.poidsKg ?? defaut
}

export function bilanPoids(etat: EtatUtilisateur, jours: JourStat[]): BilanPoids {
  const debut = jours[0]?.date ?? jourISO()
  const fin = jours.at(-1)?.date ?? jourISO()
  const dans = peseesTriees(etat).filter((p) => p.date >= debut && p.date <= fin)

  if (dans.length < 2) return { depart: null, arrivee: null, delta: null }

  const depart = dans[0].poidsKg
  const arrivee = dans[dans.length - 1].poidsKg
  return { depart, arrivee, delta: Math.round((arrivee - depart) * 10) / 10 }
}
