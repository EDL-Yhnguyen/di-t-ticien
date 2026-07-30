import { cleIngredient, cumulerQuantites } from '../ingredients'
import type { Moment } from '../types'
import { COLLATIONS } from './collation'
import { DEJEUNERS } from './dejeuner'
import { DINERS } from './diner'
import { recettesComposees } from './generateur'
import { PETITS_DEJEUNERS } from './petit-dejeuner'
import { RAYONS, type Ingredient, type Rayon, type Recette } from './types'

export * from './types'

/**
 * Le catalogue, assemblé depuis un fichier par moment de repas. Un seul
 * fichier devenait impossible à relire dès la trentième recette, et les
 * conflits de fusion tombaient tous au même endroit.
 *
 * L'ordre suit celui de la journée : les écrans qui listent tout sans
 * regrouper héritent ainsi d'un ordre sensé, sans avoir à trier.
 */
export const RECETTES: Recette[] = [
  ...PETITS_DEJEUNERS,
  ...DEJEUNERS,
  ...COLLATIONS,
  ...DINERS,
]

/**
 * Le catalogue entier : les recettes écrites à la main **puis** les composées.
 *
 * Deux constantes plutôt qu'une, et l'ordre n'est pas indifférent : `RECETTES`
 * reste ce qu'un humain a écrit, et vient toujours en tête — une recette pensée
 * pour elle-même vaut mieux qu'un assemblage, même correct. `catalogue()` y
 * ajoute les milliers de recettes composées (voir `generateur.ts`).
 *
 * Une fonction et non une constante : la génération est paresseuse et mémoïsée,
 * pour qu'un écran qui n'affiche que le journal alimentaire n'en paie pas le
 * coût. Tout ce qui parcourt le catalogue passe par ici.
 */
export function catalogue(): Recette[] {
  return catalogueMemoise ??= [...RECETTES, ...recettesComposees()]
}

let catalogueMemoise: Recette[] | null = null

/**
 * L'index des identifiants, construit au premier `recetteParId`.
 *
 * Un `find` linéaire sur cinq mille recettes est imperceptible une fois, et
 * ruineux dans une boucle — or c'est exactement l'usage : `recettesDuPlan`
 * résout vingt-huit identifiants, `listeDeCourses` autant, le mode cuisine
 * plusieurs par étape.
 */
let parId: Map<string, Recette> | null = null

/** Les indispensables du plan, à avoir en permanence. */
export const PLACARD: Ingredient[] = [
  { nom: 'Pain spécial de boulangerie', quantite: 'pour la semaine', rayon: 'Boulangerie' },
  { nom: 'Beurre à 60 %', quantite: '1 plaquette', rayon: 'Crèmerie' },
  { nom: 'Yaourts nature', quantite: '8', rayon: 'Crèmerie' },
  { nom: 'Fruits frais', quantite: 'pour la semaine', rayon: 'Fruits et légumes' },
  { nom: 'Huile d’olive', quantite: '1 bouteille', rayon: 'Épicerie' },
  { nom: 'Thé ou tisane', quantite: '1 boîte', rayon: 'Épicerie' },
  { nom: 'Sirop sans sucre', quantite: '1 bouteille', rayon: 'Épicerie' },
]

export function recetteParId(id: string): Recette | undefined {
  if (parId === null) parId = new Map(catalogue().map((r) => [r.id, r]))
  return parId.get(id)
}

/**
 * Les recettes d'un moment, groupées une fois pour toutes.
 *
 * Le planificateur appelle cette fonction à chaque créneau : vingt-huit fois par
 * semaine, cent douze pour une génération de quatre semaines. Filtrer cinq mille
 * recettes autant de fois coûtait trois secondes — mesuré à l'écran, pas
 * supposé.
 */
export function recettesDuMoment(moment: Moment): Recette[] {
  if (parMoment === null) {
    parMoment = new Map()
    for (const recette of catalogue()) {
      const liste = parMoment.get(recette.moment)
      if (liste) liste.push(recette)
      else parMoment.set(recette.moment, [recette])
    }
  }
  return parMoment.get(moment) ?? []
}

let parMoment: Map<Moment, Recette[]> | null = null

/* ─────────────────────────────── Courses ─────────────────────────────── */

/**
 * Regroupe les ingrédients de plusieurs recettes par rayon de magasin.
 *
 * Les quantités comparables sont **additionnées**, les autres juxtaposées :
 * inventer une somme entre « 1 CàS » et « ½ » n'aurait pas de sens, mais sur
 * une semaine de menus la juxtaposition seule donnait « 1 + ¼ + 1 + ½ + ½ »,
 * illisible au rayon. Les noms sont rapprochés au pluriel près, pour que
 * « Carotte » et « Carottes » ne fassent pas deux lignes à cocher.
 *
 * L'arithmétique elle-même vit dans `ingredients.ts` : la liste de courses
 * persistante y verse aussi des produits saisis à la main, et deux additions
 * différentes feraient deux lignes pour la même chose.
 */
export function listeDeCourses(idsRecettes: string[]): Record<Rayon, Ingredient[]> {
  const groupes = Object.fromEntries(RAYONS.map((r) => [r, [] as Ingredient[]])) as Record<
    Rayon,
    Ingredient[]
  >

  const vus = new Map<string, Ingredient>()
  for (const id of idsRecettes) {
    for (const ingredient of recetteParId(id)?.ingredients ?? []) {
      const cle = cleIngredient(ingredient.nom)
      const existant = vus.get(cle)
      if (!existant) {
        const copie = { ...ingredient }
        vus.set(cle, copie)
        groupes[ingredient.rayon].push(copie)
        continue
      }
      existant.quantite = cumulerQuantites(existant.quantite, ingredient.quantite)
    }
  }

  return groupes
}
