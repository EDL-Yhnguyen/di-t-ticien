import type { Moment } from '../types'
import { COLLATIONS } from './collation'
import { DEJEUNERS } from './dejeuner'
import { DINERS } from './diner'
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
  return RECETTES.find((r) => r.id === id)
}

export function recettesDuMoment(moment: Moment): Recette[] {
  return RECETTES.filter((r) => r.moment === moment)
}

/** Regroupe les ingrédients de plusieurs recettes par rayon de magasin. */
export function listeDeCourses(idsRecettes: string[]): Record<Rayon, Ingredient[]> {
  const groupes = Object.fromEntries(RAYONS.map((r) => [r, [] as Ingredient[]])) as Record<
    Rayon,
    Ingredient[]
  >

  const vus = new Map<string, Ingredient>()
  for (const id of idsRecettes) {
    for (const ingredient of recetteParId(id)?.ingredients ?? []) {
      const cle = ingredient.nom.toLowerCase()
      const existant = vus.get(cle)
      if (existant) {
        // Deux recettes qui demandent le même produit : on note les deux
        // quantités plutôt que d'inventer une addition entre « 1 CàS » et « ½ ».
        existant.quantite = `${existant.quantite} + ${ingredient.quantite}`
      } else {
        const copie = { ...ingredient }
        vus.set(cle, copie)
        groupes[ingredient.rayon].push(copie)
      }
    }
  }

  return groupes
}
