import { cleIngredient } from '../ingredients'
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

/* ─────────────────────────── Cumuler les quantités ─────────────────────────── */

const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
}

/** Unités qui ne prennent jamais de « s » : « 3 CàS », pas « 3 CàSs ». */
const UNITES_INVARIABLES = new Set(['g', 'kg', 'mg', 'ml', 'cl', 'dl', 'l', 'cc', 'cs', 'càs', 'càc'])

interface Quantite {
  valeur: number
  /** Ce qui suit le nombre : « g », « CàS », « tranches », ou rien du tout. */
  unite: string
}

/**
 * Lit « 2 tranches », « 1 ½ », « 40 g » — et rend `null` sur « quelques brins »
 * ou « pour la semaine », qui ne sont pas des nombres.
 */
function lireQuantite(texte: string): Quantite | null {
  const m = /^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔])?\s*(.*)$/.exec(texte.trim())
  if (!m) return null

  const [, entier, fraction, reste] = m
  if (!entier && !fraction) return null

  const valeur = (entier ? Number(entier.replace(',', '.')) : 0) + (fraction ? FRACTIONS[fraction] : 0)
  return { valeur, unite: reste.trim() }
}

/**
 * Deux unités se cumulent si elles désignent la même chose au singulier près.
 * « 60 g crues » et « 50 g cru » restent séparés : l'écart de forme cache ici
 * un écart d'état — cuit ou cru —, et additionner les deux mentirait.
 */
function memeUnite(a: string, b: string): boolean {
  const forme = (u: string) => u.toLowerCase().replace(/s$/, '')
  return forme(a) === forme(b)
}

/** « 1 ½ pot » et non « 1 ½ pots » : en français le pluriel commence à deux. */
function accorder(unite: string, valeur: number): string {
  if (valeur < 2 || unite === '' || unite.includes(' ')) return unite
  if (UNITES_INVARIABLES.has(unite.toLowerCase()) || /[sx]$/.test(unite)) return unite
  return `${unite}s`
}

function ecrireQuantite(q: Quantite): string {
  // Trois tiers font un entier, pas « 1,0 » : on recolle avant d'écrire.
  const arrondie = Math.abs(q.valeur - Math.round(q.valeur)) < 0.02 ? Math.round(q.valeur) : q.valeur
  const entier = Math.floor(arrondie)
  const reste = arrondie - entier

  let nombre = String(entier)
  const glyphe = Object.entries(FRACTIONS).find(([, v]) => Math.abs(reste - v) < 0.02)?.[0]
  if (glyphe) nombre = entier === 0 ? glyphe : `${entier} ${glyphe}`
  else if (reste > 0.02) nombre = arrondie.toFixed(1).replace('.', ',')

  return q.unite ? `${nombre} ${accorder(q.unite, arrondie)}` : nombre
}

/**
 * Regroupe les ingrédients de plusieurs recettes par rayon de magasin.
 *
 * Les quantités comparables sont **additionnées**, les autres juxtaposées :
 * inventer une somme entre « 1 CàS » et « ½ » n'aurait pas de sens, mais sur
 * une semaine de menus la juxtaposition seule donnait « 1 + ¼ + 1 + ½ + ½ »,
 * illisible au rayon. Les noms sont rapprochés au pluriel près, pour que
 * « Carotte » et « Carottes » ne fassent pas deux lignes à cocher.
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

      // Le terme à grossir se cherche parmi tous, pas seulement le dernier :
      // « 1 moyenne », « 3 », « 1 moyenne » doit donner « 2 moyennes + 3 » et
      // non trois termes côte à côte parce que les unités alternent.
      const termes = existant.quantite.split(' + ')
      const ajout = lireQuantite(ingredient.quantite)
      const place = ajout
        ? termes.findIndex((terme) => {
            const lu = lireQuantite(terme)
            return lu !== null && memeUnite(lu.unite, ajout.unite)
          })
        : termes.indexOf(ingredient.quantite) // « quelques brins » deux fois reste « quelques brins »

      if (place === -1) {
        existant.quantite = `${existant.quantite} + ${ingredient.quantite}`
      } else if (ajout) {
        const lu = lireQuantite(termes[place]) as Quantite
        const unite = lu.unite.length >= ajout.unite.length ? lu.unite : ajout.unite
        termes[place] = ecrireQuantite({ valeur: lu.valeur + ajout.valeur, unite })
        existant.quantite = termes.join(' + ')
      }
    }
  }

  return groupes
}
