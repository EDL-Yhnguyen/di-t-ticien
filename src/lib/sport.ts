import type { FamilleActivite, Intensite, SeanceSport, TypeActivite } from './types'
import { jourISO } from './utils'

/**
 * L'activité physique : catalogue, estimation de la dépense, lectures.
 *
 * Tout est calculé ici, en règles lisibles — comme `coach.ts`. Une estimation
 * qui entre dans le budget calorique de quelqu'un doit pouvoir s'expliquer.
 */

/* ─────────────────────────────── Catalogue ─────────────────────────────── */

/**
 * Valeurs MET du Compendium of Physical Activities, pour une pratique
 * d'intensité moyenne. Ce sont des moyennes de population : deux personnes du
 * même poids courant à la même allure ne dépensent pas la même chose.
 */
export const CATALOGUE_ACTIVITES: TypeActivite[] = [
  // Cardio
  { id: 'marche', libelle: 'Marche', met: 3.5, famille: 'cardio' },
  { id: 'marche-rapide', libelle: 'Marche rapide', met: 4.3, famille: 'cardio' },
  { id: 'course', libelle: 'Course à pied', met: 9.8, famille: 'cardio' },
  { id: 'velo', libelle: 'Vélo', met: 7.5, famille: 'cardio' },
  { id: 'natation', libelle: 'Natation', met: 7.0, famille: 'cardio' },
  { id: 'elliptique', libelle: 'Vélo elliptique', met: 5.0, famille: 'cardio' },
  { id: 'rameur', libelle: 'Rameur', met: 7.0, famille: 'cardio' },
  { id: 'corde', libelle: 'Corde à sauter', met: 11.0, famille: 'cardio' },
  { id: 'hiit', libelle: 'HIIT, circuit training', met: 8.0, famille: 'cardio' },
  { id: 'aquagym', libelle: 'Aquagym', met: 5.5, famille: 'cardio' },

  // Renforcement
  { id: 'musculation', libelle: 'Musculation', met: 5.0, famille: 'renforcement' },
  { id: 'poids-du-corps', libelle: 'Renfo au poids du corps', met: 4.3, famille: 'renforcement' },
  { id: 'gainage', libelle: 'Gainage, abdos', met: 3.8, famille: 'renforcement' },

  // Plein air
  { id: 'randonnee', libelle: 'Randonnée', met: 6.0, famille: 'plein-air' },
  { id: 'jardinage', libelle: 'Jardinage', met: 3.8, famille: 'plein-air' },
  { id: 'ski', libelle: 'Ski', met: 7.0, famille: 'plein-air' },
  { id: 'roller', libelle: 'Roller, trottinette', met: 7.0, famille: 'plein-air' },

  // Collectif et raquette
  { id: 'football', libelle: 'Football', met: 7.0, famille: 'collectif' },
  { id: 'basket', libelle: 'Basket', met: 6.5, famille: 'collectif' },
  { id: 'tennis', libelle: 'Tennis', met: 7.3, famille: 'collectif' },
  { id: 'badminton', libelle: 'Badminton', met: 5.5, famille: 'collectif' },
  { id: 'volley', libelle: 'Volley', met: 4.0, famille: 'collectif' },

  // En douceur
  { id: 'yoga', libelle: 'Yoga', met: 3.0, famille: 'douceur' },
  { id: 'pilates', libelle: 'Pilates', met: 3.8, famille: 'douceur' },
  { id: 'etirements', libelle: 'Étirements, mobilité', met: 2.3, famille: 'douceur' },
  { id: 'danse', libelle: 'Danse', met: 5.0, famille: 'douceur' },
]

export const FAMILLES_ACTIVITE: FamilleActivite[] = [
  'cardio',
  'renforcement',
  'plein-air',
  'collectif',
  'douceur',
]

export function activiteParId(id: string): TypeActivite | undefined {
  return CATALOGUE_ACTIVITES.find((a) => a.id === id)
}

export function activitesDeLaFamille(famille: FamilleActivite): TypeActivite[] {
  return CATALOGUE_ACTIVITES.filter((a) => a.famille === famille)
}

/* ──────────────────────────── La dépense ──────────────────────────── */

/**
 * Correction d'intensité appliquée au MET moyen du catalogue.
 *
 * Volontairement resserrée : au-delà, on donnerait à un ressenti déclaré une
 * précision qu'il n'a pas.
 */
const FACTEUR_INTENSITE: Record<Intensite, number> = {
  douce: 0.8,
  moderee: 1,
  intense: 1.25,
}

/**
 * Dépense **nette** d'une séance, en kcal.
 *
 * Nette, c'est-à-dire moins le métabolisme de repos de la même durée : rester
 * assis coûte déjà 1 MET, et cette dépense-là est comptée dans l'objectif
 * calorique. Ajouter la dépense brute la compterait deux fois. C'est la même
 * convention que `gainMarcheQuotidienne` dans `nutrition.ts`.
 *
 * La formule usuelle donne les kcal par minute : MET × 3,5 × poids / 200.
 */
export function kcalSeance(p: {
  met: number
  poidsKg: number
  minutes: number
  intensite: Intensite
}): number {
  const met = p.met * FACTEUR_INTENSITE[p.intensite]
  const netto = Math.max(0, met - 1)
  return Math.round((netto * 3.5 * p.poidsKg * p.minutes) / 200)
}

/* ─────────────────────────────── Lectures ─────────────────────────────── */

export function seancesDuJour(seances: SeanceSport[], date = jourISO()): SeanceSport[] {
  return seances.filter((s) => s.date === date)
}

/**
 * Ce que le sport du jour ajoute au budget calorique.
 *
 * Choix produit assumé (Yann, 29/07/2026) : les calories dépensées sont
 * rendues intégralement, comme le fait MyFitnessPal. L'écran doit dire que
 * c'est une estimation — c'est ce qui permet de ne pas la prendre pour une
 * mesure.
 */
export function bonusSportDuJour(seances: SeanceSport[], date = jourISO()): number {
  return seancesDuJour(seances, date).reduce((somme, s) => somme + s.kcal, 0)
}

export function minutesDuJour(seances: SeanceSport[], date = jourISO()): number {
  return seancesDuJour(seances, date).reduce((somme, s) => somme + s.minutes, 0)
}

/** Les sept dates, du lundi au dimanche, de la semaine contenant `date`. */
export function joursDeLaSemaine(date = jourISO()): string[] {
  const reference = new Date(`${date}T12:00:00`)
  // getDay() met dimanche à 0 ; on veut des semaines qui commencent le lundi.
  const decalage = (reference.getDay() + 6) % 7
  const lundi = new Date(reference)
  lundi.setDate(lundi.getDate() - decalage)

  return Array.from({ length: 7 }, (_, i) => {
    const jour = new Date(lundi)
    jour.setDate(lundi.getDate() + i)
    return jourISO(jour)
  })
}

export interface BilanSemaineSport {
  jours: { date: string; minutes: number; kcal: number }[]
  minutes: number
  kcal: number
  seances: number
  /** Part de la recommandation de l'OMS couverte, de 0 à 1 et au-delà. */
  partRecommandation: number
}

/**
 * L'OMS recommande 150 minutes d'activité modérée par semaine pour un adulte.
 * C'est le seul repère public et chiffré du domaine : il vaut mieux que le
 * total brut, qui ne dit rien tout seul.
 */
export const MINUTES_OMS_SEMAINE = 150

export function bilanSemaine(seances: SeanceSport[], date = jourISO()): BilanSemaineSport {
  const jours = joursDeLaSemaine(date).map((jour) => ({
    date: jour,
    minutes: minutesDuJour(seances, jour),
    kcal: bonusSportDuJour(seances, jour),
  }))

  const minutes = jours.reduce((s, j) => s + j.minutes, 0)

  return {
    jours,
    minutes,
    kcal: jours.reduce((s, j) => s + j.kcal, 0),
    seances: jours.reduce((s, j) => s + (j.minutes > 0 ? 1 : 0), 0),
    partRecommandation: minutes / MINUTES_OMS_SEMAINE,
  }
}

/** Nombre de jours consécutifs, jusqu'à aujourd'hui, avec au moins une séance. */
export function serieDeSeances(seances: SeanceSport[]): number {
  const jours = new Set(seances.map((s) => s.date))
  let n = 0
  const curseur = new Date()
  while (jours.has(jourISO(curseur))) {
    n++
    curseur.setDate(curseur.getDate() - 1)
  }
  return n
}

/**
 * Une phrase sur la semaine écoulée.
 *
 * Elle situe par rapport au repère de l'OMS sans jamais reprocher : quelqu'un
 * qui ouvre cet écran a déjà fait le plus dur.
 */
export function resumerLaSemaine(bilan: BilanSemaineSport): string {
  if (bilan.minutes === 0) {
    return `Aucune séance cette semaine. L’OMS conseille ${MINUTES_OMS_SEMAINE} minutes d’activité modérée par semaine — trois marches rapides y suffisent.`
  }
  if (bilan.partRecommandation >= 1) {
    return `${bilan.minutes} minutes cette semaine : le repère de l’OMS est atteint. Le reste est du bonus.`
  }
  const reste = MINUTES_OMS_SEMAINE - bilan.minutes
  return `${bilan.minutes} minutes cette semaine. Il en reste ${reste} pour atteindre le repère de l’OMS.`
}
