import { cibleDuRepas } from './journal'
import { listeDeCourses, recetteParId, recettesDuMoment } from './recettes'
import type { Recette, Saison, Tag } from './recettes'
import type { JourMenu, Moment, PlanSemaine } from './types'
import { MOMENTS } from './types'
import { jourISO, limiter } from './utils'

/**
 * Le planificateur de menus : composer une semaine depuis le catalogue.
 *
 * La semaine est **générée puis modifiable**, jamais imposée : chaque repas se
 * remplace, et la liste de courses suit. Un plan qu'on ne peut pas corriger est
 * abandonné au premier imprévu.
 *
 * Tout est calculé par des règles lisibles, comme `coach.ts` — aucun modèle.
 */

/* ─────────────────────────────── Saisons ─────────────────────────────── */

export function saisonActuelle(d: Date = new Date()): Saison {
  const mois = d.getMonth()
  if (mois <= 1 || mois === 11) return 'hiver'
  if (mois <= 4) return 'printemps'
  if (mois <= 7) return 'ete'
  return 'automne'
}

/* ─────────────────────────────── Génération ─────────────────────────────── */

export interface OptionsMenu {
  /** Le lundi de la semaine à composer. */
  debut: string
  objectifKcal: number
  /** Filtres cumulatifs : une recette retenue les porte tous. */
  tags?: Tag[]
  /** Absente = la saison du jour. */
  saison?: Saison
}

/**
 * Une recette hors saison n'est pas exclue mais lourdement pénalisée : à
 * trente recettes, l'exclure laisserait certains repas sans candidat, et une
 * grille trouée est pire qu'une soupe de courge en avril.
 */
const PENALITE_HORS_SAISON = 0.45

/** Reprendre la même recette deux jours de suite est ce qui lasse le plus. */
const PENALITE_RECENTE = 0.9
const PENALITE_DEJA_VUE = 0.3

/** De quoi obtenir une semaine différente à chaque « Régénérer ». */
const ALEA = 0.22

/**
 * Écart maximal reporté d'un repas sur le suivant.
 *
 * Sans borne, un déjeuner copieux ferait fondre le dîner à rien : mieux vaut
 * une journée légèrement au-dessus de l'objectif qu'un repas absurde.
 */
const REPORT_MAX = 200

export function genererSemaine(options: OptionsMenu): PlanSemaine {
  const saison = options.saison ?? saisonActuelle()
  const tags = options.tags ?? []

  /** Dernier index de jour où chaque recette a été employée. */
  const derniereUtilisation = new Map<string, number>()

  const jours: JourMenu[] = []

  for (let index = 0; index < 7; index++) {
    const date = decalerJours(options.debut, index)
    const repas: Record<Moment, string | null> = {
      'petit-dejeuner': null,
      dejeuner: null,
      collation: null,
      diner: null,
    }

    let ecartCumule = 0

    for (const moment of MOMENTS) {
      const base = cibleDuRepas(options.objectifKcal, moment)
      const cible = Math.max(100, base + limiter(ecartCumule, -REPORT_MAX, REPORT_MAX))

      const choisie = choisirRecette({
        moment,
        cible,
        saison,
        tags,
        index,
        derniereUtilisation,
      })

      if (!choisie) continue
      repas[moment] = choisie.id
      derniereUtilisation.set(choisie.id, index)
      ecartCumule += base - choisie.kcal
    }

    jours.push({ date, repas })
  }

  return { debut: options.debut, jours, genereLe: new Date().toISOString() }
}

function choisirRecette(p: {
  moment: Moment
  cible: number
  saison: Saison
  tags: Tag[]
  index: number
  derniereUtilisation: Map<string, number>
}): Recette | null {
  const candidates = recettesDuMoment(p.moment).filter((r) =>
    p.tags.every((tag) => r.tags.includes(tag)),
  )
  if (candidates.length === 0) return null

  let meilleure: Recette | null = null
  let meilleurScore = -Infinity

  for (const recette of candidates) {
    const score = noter(recette, p)
    if (score > meilleurScore) {
      meilleurScore = score
      meilleure = recette
    }
  }

  return meilleure
}

function noter(
  recette: Recette,
  p: {
    cible: number
    saison: Saison
    index: number
    derniereUtilisation: Map<string, number>
  },
): number {
  // L'écart calorique, ramené à une échelle où 1 = un repas deux fois trop gros.
  const ecart = Math.abs(recette.kcal - p.cible) / Math.max(120, p.cible)
  let score = -ecart

  if (recette.saisons && !recette.saisons.includes(p.saison)) {
    score -= PENALITE_HORS_SAISON
  }

  const vue = p.derniereUtilisation.get(recette.id)
  if (vue !== undefined) {
    score -= p.index - vue <= 2 ? PENALITE_RECENTE : PENALITE_DEJA_VUE
  }

  return score + Math.random() * ALEA
}

/* ──────────────────────────── Remplacer un repas ──────────────────────────── */

/**
 * Les autres recettes possibles pour un créneau, les plus proches de la cible
 * en tête. Sert la feuille de remplacement : on propose d'abord ce qui tient
 * dans la journée, sans masquer le reste.
 */
export function alternativesPour(moment: Moment, cible: number, exclureId?: string): Recette[] {
  return recettesDuMoment(moment)
    .filter((r) => r.id !== exclureId)
    .sort((a, b) => Math.abs(a.kcal - cible) - Math.abs(b.kcal - cible))
}

/* ─────────────────────────────── Lectures ─────────────────────────────── */

export function totalDuJour(jour: JourMenu): number {
  return MOMENTS.reduce((somme, moment) => {
    const id = jour.repas[moment]
    return somme + (id ? (recetteParId(id)?.kcal ?? 0) : 0)
  }, 0)
}

export function jourDuPlan(plan: PlanSemaine, date: string): JourMenu | undefined {
  return plan.jours.find((j) => j.date === date)
}

/** Tous les identifiants de recette du plan, doublons compris. */
export function recettesDuPlan(plan: PlanSemaine): string[] {
  return plan.jours.flatMap((jour) =>
    MOMENTS.map((moment) => jour.repas[moment]).filter((id): id is string => id !== null),
  )
}

export function coursesDuPlan(plan: PlanSemaine) {
  return listeDeCourses(recettesDuPlan(plan))
}

export interface BilanPlan {
  joursRemplis: number
  repasPrevus: number
  kcalMoyenne: number
  minutesTotales: number
}

export function bilanDuPlan(plan: PlanSemaine): BilanPlan {
  const remplis = plan.jours.filter((j) => totalDuJour(j) > 0)
  const ids = recettesDuPlan(plan)

  return {
    joursRemplis: remplis.length,
    repasPrevus: ids.length,
    kcalMoyenne:
      remplis.length > 0
        ? Math.round(remplis.reduce((s, j) => s + totalDuJour(j), 0) / remplis.length)
        : 0,
    minutesTotales: ids.reduce((s, id) => s + (recetteParId(id)?.minutes ?? 0), 0),
  }
}

/* ──────────────────────────────── Dates ──────────────────────────────── */

/** Le lundi de la semaine contenant `date`. */
export function lundiDeLaSemaine(date = jourISO()): string {
  const reference = new Date(`${date}T12:00:00`)
  const decalage = (reference.getDay() + 6) % 7
  reference.setDate(reference.getDate() - decalage)
  return jourISO(reference)
}

export function decalerJours(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + n)
  return jourISO(d)
}

/** Vrai quand le plan ne couvre plus la semaine en cours. */
export function planPerime(plan: PlanSemaine | null, date = jourISO()): boolean {
  return plan === null || plan.debut !== lundiDeLaSemaine(date)
}
