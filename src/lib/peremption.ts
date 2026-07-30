import type { ArticleStock, Emplacement, Rayon } from './types'
import { jourISO } from './utils'

/**
 * Les dates limites : ce qui va se perdre, et quand.
 *
 * Séparé de `stocks.ts` pour une raison mesurée, pas par goût du découpage.
 * `stocks.ts` parcourt le catalogue de recettes pour dire ce qu'on peut
 * cuisiner ; l'écran « Aujourd'hui », lui, n'a besoin que des échéances — et il
 * est chargé d'emblée. En important `stocks.ts`, il faisait entrer les 5 522
 * recettes dans le fichier initial : 280 Ko devenus 353 Ko, soit très
 * exactement la régression que le découpage du 29/07/2026 avait corrigée.
 *
 * Tout est calculé par des règles lisibles, comme `coach.ts` et `menu.ts` —
 * aucun modèle. Une alerte « ce yaourt est périmé » doit pouvoir s'expliquer
 * par une date et une soustraction.
 */

/* ────────────────────────────── Durées types ────────────────────────────── */

/**
 * Combien de temps un produit se garde au congélateur, par rayon, en mois.
 *
 * Ce sont les repères publics de la DGCCRF et de l'ANSES, arrondis vers le bas.
 * Un aliment congelé reste **sain** bien au-delà : ce qui se dégrade, c'est le
 * goût et la texture. L'écran doit donc dire « à consommer idéalement avant »,
 * jamais « périmé » — sinon on fait jeter ce qu'on prétend sauver.
 */
const MOIS_AU_CONGELATEUR: Record<Rayon, number> = {
  'Boucherie, poissonnerie': 6,
  'Fruits et légumes': 12,
  Crèmerie: 3,
  Surgelés: 12,
  Boulangerie: 3,
  Épicerie: 6,
}

/**
 * Combien de jours un produit entamé tient au frais, par rayon.
 *
 * Une DLC imprimée ne vaut que pour un emballage fermé. Une brique de lait
 * ouverte le 1er avec une DLC au 20 n'est pas bonne jusqu'au 20 : c'est
 * précisément le cas où se fier à la date imprimée rend malade.
 */
const JOURS_APRES_OUVERTURE: Record<Rayon, number> = {
  'Boucherie, poissonnerie': 2,
  'Fruits et légumes': 4,
  Crèmerie: 4,
  Surgelés: 2,
  Boulangerie: 3,
  Épicerie: 7,
}

/* ─────────────────────────────── Péremption ─────────────────────────────── */

export type Urgence = 'perime' | 'aujourdhui' | 'demain' | 'semaine' | 'ok'

/** Du plus pressant au moins pressant — sert partout où l'on trie. */
export const URGENCES: Urgence[] = ['perime', 'aujourdhui', 'demain', 'semaine', 'ok']

export interface Echeance {
  /** La date effective à retenir, toutes règles appliquées. `null` = aucune. */
  date: string | null
  urgence: Urgence
  /** Négatif quand la date est passée. `null` quand il n'y a pas de date. */
  joursRestants: number | null
  /**
   * Vrai quand l'échéance est sanitaire (DLC, produit entamé) et non
   * gustative (DDM, congélation). C'est ce qui décide du mot employé à
   * l'écran : « à jeter » ou « à finir ».
   */
  sanitaire: boolean
  /** D'où vient la date retenue, pour pouvoir l'expliquer à l'écran. */
  origine: 'dlc' | 'ouverture' | 'ddm' | 'congelation' | null
}

function ajouterJours(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + n)
  return jourISO(d)
}

function ajouterMois(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00`)
  d.setMonth(d.getMonth() + n)
  return jourISO(d)
}

export function joursEntre(depuis: string, jusqua: string): number {
  const a = new Date(`${depuis}T12:00:00`).getTime()
  const b = new Date(`${jusqua}T12:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/**
 * L'échéance réelle d'un article, une fois toutes les règles appliquées.
 *
 * L'ordre compte : une date sanitaire l'emporte toujours sur une date de
 * qualité, et l'ouverture peut avancer une DLC mais jamais la reculer.
 */
export function echeance(article: ArticleStock, aujourdhui = jourISO()): Echeance {
  const candidates: { date: string; sanitaire: boolean; origine: Echeance['origine'] }[] = []

  if (article.dlc) candidates.push({ date: article.dlc, sanitaire: true, origine: 'dlc' })

  if (article.ouvertLe) {
    candidates.push({
      date: ajouterJours(article.ouvertLe, JOURS_APRES_OUVERTURE[article.rayon]),
      sanitaire: true,
      origine: 'ouverture',
    })
  }

  // Une DDM ne se retient que faute de date sanitaire : elle ne parle pas du
  // même risque, et la mélanger aux autres ferait alerter pour du goût.
  if (candidates.length === 0) {
    if (article.ddm) candidates.push({ date: article.ddm, sanitaire: false, origine: 'ddm' })
    if (article.congeleLe) {
      candidates.push({
        date: ajouterMois(article.congeleLe, MOIS_AU_CONGELATEUR[article.rayon]),
        sanitaire: false,
        origine: 'congelation',
      })
    }
  }

  if (candidates.length === 0) {
    return { date: null, urgence: 'ok', joursRestants: null, sanitaire: false, origine: null }
  }

  const retenue = candidates.reduce((a, b) => (a.date <= b.date ? a : b))
  const joursRestants = joursEntre(aujourdhui, retenue.date)

  return {
    date: retenue.date,
    urgence: niveau(joursRestants),
    joursRestants,
    sanitaire: retenue.sanitaire,
    origine: retenue.origine,
  }
}

function niveau(joursRestants: number): Urgence {
  if (joursRestants < 0) return 'perime'
  if (joursRestants === 0) return 'aujourdhui'
  if (joursRestants === 1) return 'demain'
  if (joursRestants <= 7) return 'semaine'
  return 'ok'
}

/** Les articles qui demandent une décision, du plus pressant au moins pressant. */
export function articlesUrgents(
  stocks: ArticleStock[],
  aujourdhui = jourISO(),
): { article: ArticleStock; echeance: Echeance }[] {
  return stocks
    .map((article) => ({ article, echeance: echeance(article, aujourdhui) }))
    .filter((x) => x.echeance.urgence !== 'ok')
    .sort((a, b) => (a.echeance.joursRestants ?? 0) - (b.echeance.joursRestants ?? 0))
}

export function stocksDe(stocks: ArticleStock[], emplacement: Emplacement): ArticleStock[] {
  return stocks
    .filter((a) => a.emplacement === emplacement)
    .sort((a, b) => {
      const ea = echeance(a).joursRestants
      const eb = echeance(b).joursRestants
      // Sans date, un article n'est pas urgent : il passe après ceux qui en ont
      // une, au lieu de remonter en tête comme le ferait un zéro.
      if (ea === null && eb === null) return a.nom.localeCompare(b.nom)
      if (ea === null) return 1
      if (eb === null) return -1
      return ea - eb
    })
}

export interface BilanStock {
  total: number
  parEmplacement: Record<Emplacement, number>
  aFinir: number
  perimes: number
}

export function bilanStock(stocks: ArticleStock[], aujourdhui = jourISO()): BilanStock {
  const urgents = articlesUrgents(stocks, aujourdhui)
  return {
    total: stocks.length,
    parEmplacement: {
      frigo: stocks.filter((a) => a.emplacement === 'frigo').length,
      placard: stocks.filter((a) => a.emplacement === 'placard').length,
      congelateur: stocks.filter((a) => a.emplacement === 'congelateur').length,
    },
    aFinir: urgents.filter((u) => u.echeance.urgence !== 'perime').length,
    perimes: urgents.filter((u) => u.echeance.urgence === 'perime').length,
  }
}
