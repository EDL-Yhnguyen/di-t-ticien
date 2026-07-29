import { avecNutriScore } from './nutriscore'
import type { Aliment, FamilleAliment, NutriScore } from './types'

/**
 * Open Food Facts — la base de produits alimentaires ouverte.
 *
 * Trois millions de produits, l'API est publique et ne demande aucune clé,
 * et surtout elle renvoie le **Nutri-Score officiel** déclaré par le
 * fabricant. C'est la même source que Yuka. Quand elle répond, sa note fait
 * foi : on ne recalcule rien par-dessus.
 *
 * La base est contributive : un produit peut manquer, ou n'avoir qu'une partie
 * de ses valeurs. Les deux cas sont normaux et doivent se dire à l'écran, pas
 * se masquer par une valeur inventée.
 */

const RACINE = 'https://world.openfoodfacts.org'

const CHAMPS = [
  'code',
  'product_name',
  'product_name_fr',
  'brands',
  'nutriments',
  'nutriscore_grade',
  'serving_quantity',
  'serving_size',
  'quantity',
  'categories_tags',
].join(',')

/** Au-delà, on rend la main : la saisie manuelle reste plus rapide qu'une attente. */
const DELAI_MS = 8000

export class ErreurOpenFoodFacts extends Error {}

interface ProduitBrut {
  code?: string
  product_name?: string
  product_name_fr?: string
  brands?: string
  nutriscore_grade?: string
  serving_quantity?: number | string
  serving_size?: string
  categories_tags?: string[]
  nutriments?: Record<string, number | string | undefined>
}

function nombreOuZero(valeur: number | string | undefined): number {
  const n = typeof valeur === 'string' ? Number.parseFloat(valeur) : valeur
  return Number.isFinite(n) ? Math.max(0, n as number) : 0
}

/**
 * Certaines fiches n'ont que l'énergie en kilojoules. La convertir vaut mieux
 * que d'afficher zéro calorie sur un produit qui en contient.
 */
function kcalDe(nutriments: Record<string, number | string | undefined>): number {
  const direct = nombreOuZero(nutriments['energy-kcal_100g'])
  if (direct > 0) return direct
  const kJ = nombreOuZero(nutriments['energy_100g'] ?? nutriments['energy-kj_100g'])
  return kJ > 0 ? Math.round(kJ / 4.184) : 0
}

function familleDe(categories: string[] = []): FamilleAliment {
  const tags = categories.join(' ')
  if (tags.includes('beverages') || tags.includes('boissons')) return 'boisson'
  if (tags.includes('cheese') || tags.includes('fromages')) return 'fromage'
  if (tags.includes('fats') || tags.includes('matieres-grasses') || tags.includes('oils')) {
    return 'matiere-grasse'
  }
  return 'general'
}

function noteDe(brut: string | undefined): NutriScore | undefined {
  const note = brut?.trim().toUpperCase()
  return note && 'ABCDE'.includes(note) && note.length === 1 ? (note as NutriScore) : undefined
}

function versAliment(produit: ProduitBrut): Aliment | null {
  const nom = (produit.product_name_fr || produit.product_name || '').trim()
  const nutriments = produit.nutriments ?? {}
  const kcal = kcalDe(nutriments)

  // Une fiche sans nom ou sans énergie n'est pas exploitable : la proposer
  // ferait entrer une ligne à zéro calorie dans le journal.
  if (!nom || kcal <= 0) return null

  const portion = nombreOuZero(produit.serving_quantity)

  const aliment: Aliment = {
    id: `off:${produit.code ?? nom}`,
    nom,
    marque: produit.brands?.split(',')[0]?.trim() || undefined,
    codeBarres: produit.code,
    famille: familleDe(produit.categories_tags),
    valeurs: {
      kcal,
      proteines: nombreOuZero(nutriments['proteins_100g']),
      glucides: nombreOuZero(nutriments['carbohydrates_100g']),
      sucres: nombreOuZero(nutriments['sugars_100g']),
      lipides: nombreOuZero(nutriments['fat_100g']),
      satures: nombreOuZero(nutriments['saturated-fat_100g']),
      fibres: nombreOuZero(nutriments['fiber_100g']),
      sel: nombreOuZero(nutriments['salt_100g']),
    },
    partFruitsLegumes: nombreOuZero(
      nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'],
    ),
    portionG: portion > 0 ? portion : undefined,
    portionLibelle: produit.serving_size?.trim() || undefined,
    nutriScore: noteDe(produit.nutriscore_grade),
    source: 'code-barres',
  }

  // Si Open Food Facts n'a pas de note, la nôtre prend le relais — étiquetée
  // comme estimée par `avecNutriScore`.
  return avecNutriScore(aliment)
}

async function recuperer(url: string, signal?: AbortSignal): Promise<unknown> {
  const abandon = new AbortController()
  const minuterie = setTimeout(() => abandon.abort(), DELAI_MS)
  signal?.addEventListener('abort', () => abandon.abort(), { once: true })

  try {
    const reponse = await fetch(url, {
      signal: abandon.signal,
      headers: { Accept: 'application/json' },
    })
    if (!reponse.ok) {
      throw new ErreurOpenFoodFacts(`Open Food Facts a répondu ${reponse.status}.`)
    }
    return await reponse.json()
  } catch (erreur) {
    if (erreur instanceof ErreurOpenFoodFacts) throw erreur
    if (abandon.signal.aborted && !signal?.aborted) {
      throw new ErreurOpenFoodFacts('La recherche a mis trop de temps. Réessayez.')
    }
    throw new ErreurOpenFoodFacts('Impossible de joindre Open Food Facts. Vérifiez votre connexion.')
  } finally {
    clearTimeout(minuterie)
  }
}

/** Cherche un produit par son code-barres. `null` si la base ne le connaît pas. */
export async function parCodeBarres(code: string, signal?: AbortSignal): Promise<Aliment | null> {
  const propre = code.replace(/\D/g, '')
  if (propre.length < 8) throw new ErreurOpenFoodFacts('Ce code-barres est incomplet.')

  const donnees = (await recuperer(
    `${RACINE}/api/v2/product/${propre}.json?fields=${CHAMPS}&lc=fr`,
    signal,
  )) as { status?: number; product?: ProduitBrut }

  if (donnees.status !== 1 || !donnees.product) return null
  return versAliment(donnees.product)
}

/** Recherche par nom. Renvoie une liste éventuellement vide, jamais `null`. */
export async function chercherProduits(
  requete: string,
  signal?: AbortSignal,
  limite = 15,
): Promise<Aliment[]> {
  const q = requete.trim()
  if (q.length < 3) return []

  const url =
    `${RACINE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=${limite}&lc=fr&fields=${CHAMPS}`

  const donnees = (await recuperer(url, signal)) as { products?: ProduitBrut[] }

  return (donnees.products ?? [])
    .map(versAliment)
    .filter((a): a is Aliment => a !== null)
    .slice(0, limite)
}
