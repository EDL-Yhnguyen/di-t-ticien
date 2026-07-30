import { cleIngredient } from '../ingredients'
import type { AgregatPrix, ArticleCourse } from '../types'

/**
 * Chiffrer une liste de courses avant de partir.
 *
 * Le principe est celui de tout le module : **ne rien inventer**. Un produit
 * jamais acheté n'a pas de prix, une quantité illisible ne se convertit pas, et
 * un paquet de 200 g ne se déduit pas d'un prix au kilo si la liste dit
 * seulement « emmental ». Chacun de ces cas laisse la ligne sans montant, avec
 * sa raison — un total annoncé à 62 € qui en fait 90 en caisse est pire
 * qu'un total annoncé « au moins 45 €, six lignes non chiffrées ».
 */

/** Pourquoi une ligne n'a pas pu être chiffrée. */
export type RaisonSansPrix =
  /** Ce produit n'a jamais été vu sur un ticket. */
  | 'inconnu'
  /** « quelques brins », « pour la semaine » : rien à multiplier. */
  | 'quantite-illisible'
  /** La liste compte en grammes, l'historique en pièces, ou l'inverse. */
  | 'unite-differente'

export interface LigneChiffree {
  article: ArticleCourse
  agregat: AgregatPrix | null
  /** Le coût estimé de la ligne. `null` quand on ne sait pas. */
  cout: number | null
  raison: RaisonSansPrix | null
  /**
   * Une enseigne où le produit a déjà été payé moins cher, et ce que ça
   * représente **pour cette ligne-là**.
   *
   * Rapporté à la quantité et non au prix unitaire : « 0,56 € de moins chez
   * Aldi » ne pèse pas la même chose selon qu'on en prend un ou six.
   */
  moinsCher: { enseigne: string; economie: number } | null
}

export interface BilanPanier {
  lignes: LigneChiffree[]
  /** La somme des lignes chiffrées. Un plancher, jamais une prévision. */
  total: number
  chiffrees: number
  nonChiffrees: number
  /** Ce que le panier coûterait au meilleur prix déjà constaté pour chaque produit. */
  economiePossible: number
}

/* ─────────────────────────── Lire une quantité ─────────────────────────── */

/** Ce qu'on sait convertir. Le reste laisse la ligne sans montant. */
const FACTEURS: Record<string, { unite: 'kg' | 'l'; vers: number }> = {
  g: { unite: 'kg', vers: 0.001 },
  kg: { unite: 'kg', vers: 1 },
  ml: { unite: 'l', vers: 0.001 },
  cl: { unite: 'l', vers: 0.01 },
  dl: { unite: 'l', vers: 0.1 },
  l: { unite: 'l', vers: 1 },
}

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }

interface Quantite {
  valeur: number
  /** L'unité écrite, en minuscules, ou `''` quand la ligne dit juste « 3 ». */
  unite: string
}

/**
 * Lit le **premier terme** d'une quantité de liste de courses.
 *
 * Les quantités cumulées de `ingredients.ts` peuvent valoir « 2 CàS + ½ », et
 * additionner des termes d'unités incomparables donnerait un nombre faux. On ne
 * chiffre donc que les quantités d'un seul terme : c'est l'écrasante majorité
 * des lignes, et les autres s'affichent sans montant plutôt qu'avec un mauvais.
 */
function lireQuantite(texte: string): Quantite | null {
  if (texte.includes(' + ')) return null

  const m = /^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔])?\s*([^\d]*)$/.exec(texte.trim())
  if (!m) return null
  const [, entier, fraction, reste] = m
  if (!entier && !fraction) return null

  const valeur =
    (entier ? Number(entier.replace(',', '.')) : 0) + (fraction ? FRACTIONS[fraction] : 0)
  return { valeur, unite: reste.trim().toLowerCase().replace(/s$/, '') }
}

/**
 * Combien d'unités d'agrégat représente cette ligne de courses.
 *
 * Rend `null` quand la conversion n'est pas sûre — et **le cas le plus
 * fréquent est volontairement refusé** : un historique en pièces face à une
 * liste en grammes. Déduire « 200 g d'emmental » d'un prix à la pièce
 * supposerait connaître le poids du paquet acheté la dernière fois, que rien
 * n'enregistre.
 */
function convertir(quantite: Quantite, unite: AgregatPrix['unite']): number | null {
  const facteur = FACTEURS[quantite.unite]

  if (unite === 'piece') {
    // « 3 », « 3 oignons », « 2 pots » : tout ce qui n'est pas une mesure de
    // poids ou de volume compte comme des pièces.
    return facteur ? null : quantite.valeur
  }

  if (!facteur || facteur.unite !== unite) return null
  return quantite.valeur * facteur.vers
}

/* ──────────────────────────────── Chiffrer ──────────────────────────────── */

function arrondir(valeur: number): number {
  return Math.round(valeur * 100) / 100
}

export function chiffrerListe(
  articles: ArticleCourse[],
  agregats: AgregatPrix[],
): BilanPanier {
  const parCle = new Map(agregats.map((a) => [`${a.cle}|${a.unite}`, a]))
  const parNom = new Map<string, AgregatPrix>()
  for (const agregat of agregats) {
    // À nom égal, on garde l'agrégat le mieux étayé : entre un produit vu une
    // fois au poids et le même vu dix fois à la pièce, le second dit plus.
    const connu = parNom.get(agregat.cle)
    if (!connu || agregat.releves > connu.releves) parNom.set(agregat.cle, agregat)
  }

  const lignes: LigneChiffree[] = articles.map((article) => {
    const cle = cleIngredient(article.nom)
    const agregat = parCle.get(`${cle}|piece`) ?? parNom.get(cle) ?? null

    if (!agregat) {
      return { article, agregat: null, cout: null, raison: 'inconnu', moinsCher: null }
    }

    const quantite = lireQuantite(article.quantite)
    if (!quantite) {
      return { article, agregat, cout: null, raison: 'quantite-illisible', moinsCher: null }
    }

    const nombre = convertir(quantite, agregat.unite)
    if (nombre === null) {
      return { article, agregat, cout: null, raison: 'unite-differente', moinsCher: null }
    }

    const cout = arrondir(nombre * agregat.dernier)
    const ecart = agregat.dernier - agregat.meilleur

    return {
      article,
      agregat,
      cout,
      raison: null,
      // Deux relevés au minimum, comme partout ailleurs : avec un seul, le
      // dernier prix *est* le meilleur prix et l'annoncer serait creux.
      moinsCher:
        agregat.releves >= 2 && ecart > 0 && agregat.meilleureEnseigne
          ? { enseigne: agregat.meilleureEnseigne, economie: arrondir(nombre * ecart) }
          : null,
    }
  })

  const chiffrees = lignes.filter((l) => l.cout !== null)

  return {
    lignes,
    total: arrondir(chiffrees.reduce((cumul, l) => cumul + (l.cout as number), 0)),
    chiffrees: chiffrees.length,
    nonChiffrees: lignes.length - chiffrees.length,
    economiePossible: arrondir(
      lignes.reduce((cumul, l) => cumul + (l.moinsCher?.economie ?? 0), 0),
    ),
  }
}

/** Les enseignes qui reviennent le plus dans les économies possibles, en tête. */
export function enseignesInteressantes(bilan: BilanPanier): { enseigne: string; economie: number }[] {
  const cumul = new Map<string, number>()
  for (const ligne of bilan.lignes) {
    if (!ligne.moinsCher) continue
    cumul.set(
      ligne.moinsCher.enseigne,
      arrondir((cumul.get(ligne.moinsCher.enseigne) ?? 0) + ligne.moinsCher.economie),
    )
  }
  return [...cumul.entries()]
    .map(([enseigne, economie]) => ({ enseigne, economie }))
    .sort((a, b) => b.economie - a.economie)
}
