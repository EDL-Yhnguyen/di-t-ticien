import { memeProduit } from './ingredients'
import { articlesUrgents } from './peremption'
import { catalogue } from './recettes'
import type { Ingredient, Recette } from './recettes'
import type { ArticleStock, Moment } from './types'
import { jourISO } from './utils'

/**
 * Le garde-manger : ce que le stock permet de cuisiner.
 *
 * **Les échéances ne sont plus ici** : elles vivent dans `peremption.ts`, qui
 * ne dépend d'aucune recette. Ce module-ci parcourt le catalogue, donc l'importer
 * fait entrer 5 522 recettes dans le fichier appelant — ce qui est le bon prix
 * pour l'écran « Que puis-je cuisiner ? » et une régression pour l'écran
 * d'accueil. Les deux se distinguent maintenant à l'import.
 *
 * Tout est calculé par des règles lisibles, comme `coach.ts` et `menu.ts` —
 * aucun modèle.
 */

// Réexportés pour que les écrans du garde-manger, qui ont besoin des deux
// moitiés, n'aient pas à connaître ce découpage.
export * from './peremption'


/* ──────────────────────── Ce qu'on peut en cuisiner ──────────────────────── */

export interface IngredientCouvert {
  ingredient: Ingredient
  /** L'article du stock qui a produit la correspondance. Toujours affiché. */
  article: ArticleStock | null
}

export interface RecetteRealisable {
  recette: Recette
  couverts: IngredientCouvert[]
  manquants: Ingredient[]
  /** Entre 0 et 1 — la part des ingrédients déjà détenus. */
  part: number
  /** Les articles urgents que cette recette permettrait d'employer. */
  sauve: ArticleStock[]
}

/**
 * Ce que le stock permet de cuisiner, du plus complet au moins complet.
 *
 * Une recette dont il manque un ingrédient reste proposée : c'est souvent une
 * course à faire, pas un abandon. Ce qui se hiérarchise, c'est ce qui sauve un
 * produit qui va périmer — le gaspillage est le vrai sujet de cet écran.
 */
export function recettesRealisables(
  stocks: ArticleStock[],
  options: { moment?: Moment; minutesMax?: number; aujourdhui?: string } = {},
): RecetteRealisable[] {
  const aujourdhui = options.aujourdhui ?? jourISO()
  const urgents = new Set(
    articlesUrgents(stocks, aujourdhui)
      .filter((u) => u.echeance.urgence !== 'perime')
      .map((u) => u.article.id),
  )

  const candidates = catalogue().filter(
    (r) =>
      (options.moment === undefined || r.moment === options.moment) &&
      (options.minutesMax === undefined || r.minutes <= options.minutesMax),
  )

  return candidates
    .map((recette) => {
      const couverts: IngredientCouvert[] = []
      const manquants: Ingredient[] = []
      const sauve: ArticleStock[] = []

      for (const ingredient of recette.ingredients) {
        const article = stocks.find((a) => memeProduit(a.nom, ingredient.nom)) ?? null
        if (article) {
          couverts.push({ ingredient, article })
          if (urgents.has(article.id) && !sauve.includes(article)) sauve.push(article)
        } else {
          manquants.push(ingredient)
        }
      }

      const total = recette.ingredients.length
      return {
        recette,
        couverts,
        manquants,
        part: total === 0 ? 0 : couverts.length / total,
        sauve,
      }
    })
    .filter((r) => r.couverts.length > 0)
    .sort((a, b) => b.sauve.length - a.sauve.length || b.part - a.part)
}

/** Vrai quand l'article couvre au moins un ingrédient d'une recette du catalogue. */
export function articleCuisinable(article: ArticleStock): boolean {
  return catalogue().some((r) => r.ingredients.some((i) => memeProduit(article.nom, i.nom)))
}
