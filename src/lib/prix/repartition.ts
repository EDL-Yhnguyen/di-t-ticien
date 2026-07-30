import { cleIngredient } from '../ingredients'
import type { AgregatPrix, ArticleCourse } from '../types'
import type { PrixEnseigne } from './depot'
import { quantiteEnUnites } from './panier'

/**
 * Répartir un panier entre plusieurs enseignes.
 *
 * C'est la fonctionnalité qui donne son sens à tout le module — et celle où il
 * est le plus facile de mentir. Une économie annoncée doit tenir compte de ce
 * qu'on ne sait pas : un produit dont le prix n'est connu que chez un seul
 * magasin ne prouve rien, et un panier réparti sur des données trop minces
 * ferait faire trois kilomètres pour gagner quarante centimes.
 *
 * Les règles suivent donc le reste du module : **rien n'est deviné, et ce qui
 * n'est pas comparable est compté à part plutôt qu'écarté en silence.**
 */

export interface LigneRepartie {
  article: ArticleCourse
  /** L'enseigne retenue, ou `null` quand aucune des candidates ne connaît ce produit. */
  enseigne: string | null
  cout: number | null
  /** Ce que la même ligne coûterait dans l'enseigne la plus chère des candidates. */
  coutPire: number | null
}

export interface Repartition {
  /** Une liste par enseigne, dans l'ordre décroissant de leur panier. */
  paniers: { enseigne: string; lignes: LigneRepartie[]; total: number }[]
  /** Les lignes qu'aucune enseigne candidate ne sait chiffrer. */
  orphelines: LigneRepartie[]
  total: number
  /**
   * Ce que la répartition fait gagner face au **meilleur magasin unique**.
   *
   * Et non face au pire, ni face à une moyenne : la vraie alternative de
   * quelqu'un qui hésite, c'est de tout acheter au même endroit. Comparer au
   * pire magasin gonflerait le chiffre sans décrire aucun choix réel.
   */
  economie: number
  /** Le coût de tout acheter dans la meilleure enseigne unique, et laquelle. */
  meilleurMagasinUnique: { enseigne: string; total: number } | null
}

function arrondir(v: number): number {
  return Math.round(v * 100) / 100
}

/**
 * Le coût d'une ligne dans une enseigne, ou `null` si elle n'y est pas connue.
 *
 * L'unité vient de l'agrégat du produit : c'est elle qui dit si la ligne se
 * compte en pièces ou au kilo, et la conversion est celle de `panier.ts` —
 * une seule arithmétique pour les deux écrans.
 */
function coutDans(
  article: ArticleCourse,
  unite: AgregatPrix['unite'],
  prix: PrixEnseigne | undefined,
): number | null {
  if (!prix) return null
  const nombre = quantiteEnUnites(article.quantite, unite)
  return nombre === null ? null : arrondir(nombre * prix.prixParUnite)
}

/**
 * Répartit les articles entre les enseignes choisies.
 *
 * Passer **une seule** enseigne donne le mode « je ne vais que chez X » : la
 * fonction ne change pas de comportement, elle a simplement moins de candidates
 * — et les produits qu'on n'y a jamais achetés ressortent en orphelins, ce qui
 * est exactement l'information utile avant de partir.
 */
export function repartir(
  articles: ArticleCourse[],
  agregats: AgregatPrix[],
  matrice: Map<string, PrixEnseigne[]>,
  enseignes: string[],
): Repartition {
  // À nom égal, l'unité la mieux étayée gagne — même arbitrage que le chiffrage
  // de la liste, pour que les deux écrans ne comptent pas différemment.
  const retenu = new Map<string, AgregatPrix>()
  for (const agregat of agregats) {
    const connu = retenu.get(agregat.cle)
    if (!connu || agregat.releves > connu.releves) retenu.set(agregat.cle, agregat)
  }
  const uniteDe = new Map([...retenu].map(([cle, a]) => [cle, a.unite] as const))

  const parEnseigne = new Map<string, LigneRepartie[]>(enseignes.map((e) => [e, []]))
  const orphelines: LigneRepartie[] = []
  /** Ce que chaque enseigne coûterait si l'on y prenait tout ce qu'elle connaît. */
  const totalSiUnique = new Map<string, number>(enseignes.map((e) => [e, 0]))

  for (const article of articles) {
    const cle = cleIngredient(article.nom)
    const unite = uniteDe.get(cle)
    const prixDuProduit = unite ? (matrice.get(`${cle}|${unite}`) ?? []) : []

    const candidats = enseignes
      .map((enseigne) => ({
        enseigne,
        cout: coutDans(article, unite ?? 'piece', prixDuProduit.find((p) => p.enseigne === enseigne)),
      }))
      .filter((c): c is { enseigne: string; cout: number } => c.cout !== null)

    if (candidats.length === 0) {
      orphelines.push({ article, enseigne: null, cout: null, coutPire: null })
      continue
    }

    const moinsCher = candidats.reduce((a, b) => (b.cout < a.cout ? b : a))
    const plusCher = candidats.reduce((a, b) => (b.cout > a.cout ? b : a))

    parEnseigne.get(moinsCher.enseigne)?.push({
      article,
      enseigne: moinsCher.enseigne,
      cout: moinsCher.cout,
      coutPire: plusCher.cout,
    })

    for (const candidat of candidats) {
      totalSiUnique.set(candidat.enseigne, (totalSiUnique.get(candidat.enseigne) ?? 0) + candidat.cout)
    }
  }

  const paniers = [...parEnseigne]
    .map(([enseigne, lignes]) => ({
      enseigne,
      lignes,
      total: arrondir(lignes.reduce((cumul, l) => cumul + (l.cout ?? 0), 0)),
    }))
    // Une enseigne à laquelle la répartition n'attribue rien n'a pas à
    // apparaître : ce serait une liste vide à emporter.
    .filter((p) => p.lignes.length > 0)
    .sort((a, b) => b.total - a.total)

  const total = arrondir(paniers.reduce((cumul, p) => cumul + p.total, 0))

  /* Le magasin unique de référence ne se compare honnêtement que s'il connaît
     **tous** les produits que la répartition a su chiffrer. Sinon on
     comparerait un panier complet à un panier incomplet, et l'économie
     annoncée serait un artefact de ce qui manque. */
  const chiffrees = paniers.reduce((n, p) => n + p.lignes.length, 0)
  const complets = [...totalSiUnique]
    .map(([enseigne, montant]) => ({ enseigne, total: arrondir(montant) }))
    .filter(({ enseigne }) => compteConnus(articles, enseigne, matrice, uniteDe) === chiffrees)

  const meilleurMagasinUnique =
    complets.length > 0 ? complets.reduce((a, b) => (b.total < a.total ? b : a)) : null

  return {
    paniers,
    orphelines,
    total,
    economie: meilleurMagasinUnique ? arrondir(meilleurMagasinUnique.total - total) : 0,
    meilleurMagasinUnique,
  }
}

/** Combien d'articles cette enseigne sait chiffrer. */
function compteConnus(
  articles: ArticleCourse[],
  enseigne: string,
  matrice: Map<string, PrixEnseigne[]>,
  uniteDe: ReadonlyMap<string, AgregatPrix['unite']>,
): number {
  let compte = 0
  for (const article of articles) {
    const cle = cleIngredient(article.nom)
    const unite = uniteDe.get(cle)
    if (!unite) continue
    const prix = (matrice.get(`${cle}|${unite}`) ?? []).find((p) => p.enseigne === enseigne)
    if (coutDans(article, unite, prix) !== null) compte++
  }
  return compte
}

/** Les enseignes présentes dans l'historique, la mieux fournie en tête. */
export function enseignesConnues(matrice: Map<string, PrixEnseigne[]>): string[] {
  const compte = new Map<string, number>()
  for (const prix of matrice.values()) {
    for (const p of prix) compte.set(p.enseigne, (compte.get(p.enseigne) ?? 0) + 1)
  }
  return [...compte.entries()].sort((a, b) => b[1] - a[1]).map(([e]) => e)
}
