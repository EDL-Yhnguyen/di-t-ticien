import { memeProduit } from './ingredients'
import { cibleDuRepas } from './journal'
import { listeDeCourses, recetteParId, recettesDuMoment } from './recettes'
import type { Recette, Saison, Tag } from './recettes'
import { articlesUrgents, joursEntre } from './peremption'
import type { ArticleStock, JourMenu, ModeleSemaine, Moment, PlanSemaine } from './types'
import { MOMENTS } from './types'
import { identifiant, jourISO, limiter } from './utils'

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
  /**
   * Le garde-manger, s'il est connu.
   *
   * Fourni, la semaine est composée **en visant d'abord ce qui va périmer**.
   * Absent, la génération est exactement celle d'avant : ce n'est pas une
   * option qu'on active, c'est une information qu'on donne ou non.
   */
  stocks?: ArticleStock[]
  /** Le jour où l'on se trouve, pour situer les échéances. Absent = aujourd'hui. */
  aujourdhui?: string
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

/**
 * Ce que vaut, dans le barème, une recette qui sauve un produit qui périme.
 *
 * Calibré au-dessus de la pénalité hors saison (0,45) et en dessous d'un écart
 * calorique franc : sauver un yaourt doit pouvoir faire préférer une recette
 * d'une autre saison, jamais imposer un dîner à mille calories de la cible.
 * L'anti-gaspillage est une raison de choisir entre deux plats convenables, pas
 * une raison d'en servir un mauvais.
 */
const BONUS_ANTI_GASPI = 0.6

/**
 * Au-delà de deux produits sauvés, le bonus n'augmente plus.
 *
 * Sans ce plafond, une recette à quinze ingrédients écraserait toutes les
 * autres pendant toute la semaine par la seule vertu de sa longueur.
 */
const SAUVETAGES_COMPTES = 2

export function genererSemaine(options: OptionsMenu): PlanSemaine {
  return composer(options, new Map(), 0)
}

/**
 * Plusieurs semaines d'affilée, sans se répéter d'une à l'autre.
 *
 * La mémoire des recettes déjà employées est **partagée** entre les semaines :
 * générées indépendamment, quatre semaines se ressembleraient toutes, chacune
 * repartant du même catalogue avec le même barème. C'est ce partage qui fait la
 * différence entre « quatre semaines » et « la même semaine quatre fois ».
 */
export function genererSemaines(options: OptionsMenu, nombre: number): PlanSemaine[] {
  const derniereUtilisation = new Map<string, number>()
  const semaines: PlanSemaine[] = []

  for (let s = 0; s < nombre; s++) {
    semaines.push(
      composer(
        { ...options, debut: decalerJours(options.debut, s * 7) },
        derniereUtilisation,
        s * 7,
      ),
    )
  }

  return semaines
}

/**
 * Le cœur de la génération. `decalage` situe la semaine dans la série, pour que
 * la pénalité de répétition franchisse les frontières de semaine — sans lui, le
 * dimanche d'une semaine et le lundi de la suivante peuvent servir le même plat.
 */
function composer(
  options: OptionsMenu,
  derniereUtilisation: Map<string, number>,
  decalage: number,
): PlanSemaine {
  const saison = options.saison ?? saisonActuelle()
  const tags = options.tags ?? []

  const sauvetages = sauvetagesPossibles(
    options.stocks ?? [],
    options.aujourdhui ?? jourISO(),
    options.debut,
  )
  const parRecette = indexerSauvetages(sauvetages)
  /** Les articles déjà pris en charge par un repas de la semaine. */
  const pris = new Set<string>()

  const jours: JourMenu[] = []

  for (let index = decalage; index < decalage + 7; index++) {
    const date = decalerJours(options.debut, index - decalage)
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
        jourDeLaSemaine: index - decalage,
        parRecette,
        pris,
      })

      if (!choisie) continue
      repas[moment] = choisie.id
      derniereUtilisation.set(choisie.id, index)
      // Un produit ne se sauve qu'une fois. Sans cette marque, les trois repas
      // qui savent employer le yaourt qui périme seraient tous trois
      // récompensés, et la semaine tournerait autour d'un seul pot.
      for (const sauvetage of parRecette.get(choisie.id) ?? []) pris.add(sauvetage.id)
      ecartCumule += base - choisie.kcal
    }

    jours.push({ date, repas })
  }

  return { debut: options.debut, jours, genereLe: new Date().toISOString() }
}

/* ─────────────────────────── Anti-gaspillage ─────────────────────────── */

/** Un produit du garde-manger qu'une recette de la semaine pourrait sauver. */
interface Sauvetage {
  id: string
  nom: string
  /**
   * Le dernier jour de la semaine où le produit est encore bon, en index 0 à 6.
   *
   * C'est ce qui empêche de « sauver » un yaourt de mardi en le programmant
   * dimanche. Une échéance sans horizon ne sert à rien : elle déplacerait le
   * repas sans sauver le produit.
   */
  dernierJour: number
}

function sauvetagesPossibles(
  stocks: ArticleStock[],
  aujourdhui: string,
  debut: string,
): Sauvetage[] {
  // Le lundi de la semaine composée n'est pas forcément aujourd'hui : on
  // planifie souvent la semaine suivante, et un produit encore bon aujourd'hui
  // peut être perdu avant qu'elle commence.
  const jusquAuDebut = joursEntre(aujourdhui, debut)

  return articlesUrgents(stocks, aujourdhui)
    .filter(
      (u) =>
        // Un produit déjà périmé ne se cuisine pas. Bâtir un repas autour de ce
        // qu'il faut jeter serait exactement l'inverse du but.
        u.echeance.urgence !== 'perime' && u.echeance.joursRestants !== null,
    )
    .map((u) => ({
      id: u.article.id,
      nom: u.article.nom,
      dernierJour: (u.echeance.joursRestants as number) - jusquAuDebut,
    }))
    .filter((s) => s.dernierJour >= 0)
}

/**
 * Quelles recettes emploient quels produits menacés.
 *
 * Calculé **une fois** plutôt que dans le barème : celui-ci repasse sur les
 * mêmes candidates vingt-huit fois par semaine générée, et rapprocher les noms
 * à chaque passage a déjà coûté une seconde et demie à l'écran « Que puis-je
 * cuisiner ? » (voir `ingredients.ts`).
 */
function indexerSauvetages(sauvetages: Sauvetage[]): Map<string, Sauvetage[]> {
  const index = new Map<string, Sauvetage[]>()
  if (sauvetages.length === 0) return index

  for (const moment of MOMENTS) {
    for (const recette of recettesDuMoment(moment)) {
      if (index.has(recette.id)) continue
      const couverts = sauvetages.filter((s) =>
        recette.ingredients.some((i) => memeProduit(s.nom, i.nom)),
      )
      if (couverts.length > 0) index.set(recette.id, couverts)
    }
  }

  return index
}

function choisirRecette(p: {
  moment: Moment
  cible: number
  saison: Saison
  tags: Tag[]
  index: number
  derniereUtilisation: Map<string, number>
  jourDeLaSemaine: number
  parRecette: Map<string, Sauvetage[]>
  pris: Set<string>
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
    jourDeLaSemaine: number
    parRecette: Map<string, Sauvetage[]>
    pris: Set<string>
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

  // Ne comptent que les produits encore bons ce jour-là et pas déjà pris en
  // charge par un repas précédent de la semaine.
  const sauves = (p.parRecette.get(recette.id) ?? []).filter(
    (s) => !p.pris.has(s.id) && s.dernierJour >= p.jourDeLaSemaine,
  )
  score += Math.min(sauves.length, SAUVETAGES_COMPTES) * BONUS_ANTI_GASPI

  return score + Math.random() * ALEA
}

/* ─────────────────── Retrouver, poser, copier une semaine ─────────────────── */

export function planPour(plans: PlanSemaine[], debut: string): PlanSemaine | undefined {
  return plans.find((p) => p.debut === debut)
}

/** Le plan qui couvre cette date — celui de son lundi. */
export function planDeLaDate(plans: PlanSemaine[], date = jourISO()): PlanSemaine | undefined {
  return planPour(plans, lundiDeLaSemaine(date))
}

/**
 * Pose une semaine dans le tableau, **en place** : remplace celle du même lundi
 * s'il y en a une, l'ajoute sinon. À appeler dans un `modifier`.
 *
 * `debut` est la clé : deux plans pour le même lundi seraient deux vérités, et
 * l'écran afficherait celle que le hasard de l'ordre place en premier.
 */
export function poserPlan(plans: PlanSemaine[], plan: PlanSemaine): void {
  const index = plans.findIndex((p) => p.debut === plan.debut)
  if (index === -1) plans.push(plan)
  else plans[index] = plan
}

/** Une copie de la semaine, posée sur un autre lundi. */
export function copieDeSemaine(source: PlanSemaine, debutCible: string): PlanSemaine {
  return {
    debut: debutCible,
    genereLe: new Date().toISOString(),
    jours: source.jours.map((jour, index) => ({
      date: decalerJours(debutCible, index),
      repas: { ...jour.repas },
    })),
  }
}

/**
 * Recopie les repas d'un jour sur un autre, **en place**.
 *
 * Copier plutôt que déplacer : « j'ai bien mangé hier, je remets la même chose »
 * ne doit pas vider la journée d'origine. Le déplacement, lui, est le geste du
 * glisser-déposer, et c'est `deplacerRepas`.
 */
export function copierJour(plan: PlanSemaine, source: string, cible: string): void {
  const depuis = plan.jours.find((j) => j.date === source)
  const vers = plan.jours.find((j) => j.date === cible)
  if (!depuis || !vers) return
  vers.repas = { ...depuis.repas }
}

/**
 * Déplace un repas d'un créneau vers un autre, **en place**. Si la cible est
 * occupée, les deux repas s'**échangent**.
 *
 * L'échange plutôt que l'écrasement : déposer le dîner de mardi sur celui de
 * jeudi ne doit pas faire disparaître ce dernier sans le dire. Un geste de
 * glisser-déposer qui détruit une donnée est un geste qu'on n'ose plus refaire.
 */
export function deplacerRepas(
  plan: PlanSemaine,
  de: { date: string; moment: Moment },
  vers: { date: string; moment: Moment },
): void {
  const jourDe = plan.jours.find((j) => j.date === de.date)
  const jourVers = plan.jours.find((j) => j.date === vers.date)
  if (!jourDe || !jourVers) return

  const deplace = jourDe.repas[de.moment]
  jourDe.repas[de.moment] = jourVers.repas[vers.moment]
  jourVers.repas[vers.moment] = deplace
}

/* ────────────────────────────── Modèles ────────────────────────────── */

export function modeleDepuisPlan(plan: PlanSemaine, nom: string): ModeleSemaine {
  return {
    id: identifiant('m'),
    nom: nom.trim() || 'Ma semaine type',
    creeLe: new Date().toISOString(),
    jours: plan.jours.map((j) => ({ ...j.repas })),
  }
}

export function planDepuisModele(modele: ModeleSemaine, debut: string): PlanSemaine {
  return {
    debut,
    genereLe: new Date().toISOString(),
    jours: modele.jours.map((repas, index) => ({
      date: decalerJours(debut, index),
      repas: { ...repas },
    })),
  }
}

/**
 * Les semaines préconstruites du brief.
 *
 * Ce sont des **jeux de critères**, pas 28 identifiants de recettes écrits en
 * dur. Quatre semaines figées feraient 112 références à maintenir à la main, qui
 * se périmeraient au premier renommage de recette — et qui ne tiendraient aucun
 * compte de l'objectif calorique de la personne, alors que c'est précisément ce
 * que le générateur sait faire. La semaine est donc composée au moment où on la
 * choisit.
 */
export interface SemainePreconstruite {
  id: string
  nom: string
  description: string
  tags: Tag[]
}

export const SEMAINES_PRECONSTRUITES: SemainePreconstruite[] = [
  {
    id: 'equilibree',
    nom: 'Équilibrée',
    description: 'Le catalogue entier, réparti au plus près de votre objectif.',
    tags: [],
  },
  {
    id: 'vegetarienne',
    nom: 'Végétarienne',
    description: 'Sans viande ni poisson, sept jours durant.',
    tags: ['vegetarien'],
  },
  {
    id: 'express',
    nom: 'Express',
    description: 'Rien qui demande plus d’un quart d’heure.',
    tags: ['rapide'],
  },
  {
    id: 'batch',
    nom: 'Cuisine du dimanche',
    description: 'Des plats qui se préparent à l’avance et se gardent.',
    tags: ['batch'],
  },
]

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

/**
 * Les lundis d'un mois — la vue mensuelle est une pile de semaines.
 *
 * Un mois ne commence pas un lundi : la grille part donc du lundi de la semaine
 * qui contient le 1er, et s'arrête au dernier lundi utile. Les jours qui
 * débordent sur les mois voisins restent affichés — les cacher couperait une
 * semaine en deux, alors que c'est justement l'unité qu'on planifie.
 */
export function lundisDuMois(ancre: string): string[] {
  const premier = `${ancre.slice(0, 7)}-01`
  const dernierJour = new Date(
    Number(ancre.slice(0, 4)),
    Number(ancre.slice(5, 7)),
    0,
  ).getDate()
  const dernier = `${ancre.slice(0, 7)}-${String(dernierJour).padStart(2, '0')}`

  const lundis: string[] = []
  let courant = lundiDeLaSemaine(premier)
  while (courant <= lundiDeLaSemaine(dernier)) {
    lundis.push(courant)
    courant = decalerJours(courant, 7)
  }
  return lundis
}

/** Le mois voisin, en gardant le premier du mois comme ancre. */
export function decalerMois(ancre: string, n: number): string {
  const d = new Date(Number(ancre.slice(0, 4)), Number(ancre.slice(5, 7)) - 1 + n, 1)
  return jourISO(d)
}
