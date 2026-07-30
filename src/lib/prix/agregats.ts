import type { AgregatPrix } from '../types'
import { tousLesReleves, type Releve } from './depot'

/**
 * Ce que les relevés disent d'un produit.
 *
 * Tout se recalcule depuis les relevés bruts, rien ne s'accumule — c'est la
 * même règle que `journal.ts` et `stats.ts`, qui ne stockent aucun total. Un
 * agrégat entretenu à l'incrément dérive à la première ligne corrigée ou
 * supprimée, et une moyenne fausse ne se voit pas : elle a l'air d'une moyenne.
 *
 * Le coût est celui d'un parcours complet à chaque ticket enregistré. Sur
 * quelques milliers de relevés c'est quelques millisecondes, et ça n'arrive
 * qu'au moment où la personne vient de valider un écran — jamais pendant une
 * saisie.
 */

/**
 * Dépouille tous les relevés d'un compte, un agrégat par produit.
 *
 * Les relevés d'unités différentes pour un même nom sont **séparés** : « jambon »
 * acheté à la barquette et « jambon » acheté au poids ne donnent pas des prix
 * comparables, et les fondre produirait une moyenne entre un prix au kilo et un
 * prix à la pièce — un nombre qui ne désigne rien.
 */
export function depouiller(releves: Releve[]): AgregatPrix[] {
  const paquets = new Map<string, Releve[]>()

  for (const releve of releves) {
    const cle = `${releve.cle}|${releve.unite}`
    const paquet = paquets.get(cle)
    if (paquet) paquet.push(releve)
    else paquets.set(cle, [releve])
  }

  const agregats: AgregatPrix[] = []

  for (const paquet of paquets.values()) {
    // Du plus récent au plus ancien : le premier donne le prix courant et le
    // libellé affiché — celui de la dernière fois qu'on l'a vu écrit.
    const tries = [...paquet].sort((a, b) => b.date.localeCompare(a.date))
    const recent = tries[0]

    const meilleur = paquet.reduce((a, b) =>
      // À prix égal, le plus récent l'emporte : annoncer « meilleur prix » avec
      // une date de l'an dernier alors qu'on l'a revu au même tarif la semaine
      // dernière fait douter d'un chiffre pourtant juste.
      b.prixParUnite < a.prixParUnite ||
      (b.prixParUnite === a.prixParUnite && b.date > a.date)
        ? b
        : a,
    )

    const somme = paquet.reduce((cumul, r) => cumul + r.prixParUnite, 0)

    agregats.push({
      cle: recent.cle,
      libelle: recent.libelle,
      unite: recent.unite,
      dernier: recent.prixParUnite,
      derniereDate: recent.date,
      derniereEnseigne: recent.enseigne,
      meilleur: meilleur.prixParUnite,
      meilleureEnseigne: meilleur.enseigne,
      meilleureDate: meilleur.date,
      moyen: Math.round((somme / paquet.length) * 100) / 100,
      releves: paquet.length,
    })
  }

  return agregats.sort((a, b) => b.derniereDate.localeCompare(a.derniereDate))
}

/** Le dépouillement complet, lu depuis le dépôt local. */
export async function recalculer(utilisateur: string): Promise<AgregatPrix[]> {
  return depouiller(await tousLesReleves(utilisateur))
}

/* ─────────────────────────── Lectures d'écran ─────────────────────────── */

export function agregatDe(agregats: AgregatPrix[], cle: string): AgregatPrix | null {
  return agregats.find((a) => a.cle === cle) ?? null
}

/**
 * De combien le dernier prix s'écarte du meilleur jamais vu, en euros.
 *
 * Rendu **seulement s'il y a assez de relevés pour que la comparaison ait un
 * sens**. Avec un seul relevé, le dernier prix *est* le meilleur prix, et
 * afficher « 0 € d'écart » donnerait à un unique passage en caisse l'autorité
 * d'un historique.
 */
export function ecartAuMeilleur(agregat: AgregatPrix): number | null {
  if (agregat.releves < 2) return null
  const ecart = Math.round((agregat.dernier - agregat.meilleur) * 100) / 100
  return ecart > 0 ? ecart : null
}

/** Les produits payés plus cher que leur meilleur prix, du pire écart au moindre. */
export function aSurveiller(agregats: AgregatPrix[]): AgregatPrix[] {
  return agregats
    .filter((a) => ecartAuMeilleur(a) !== null)
    .sort((a, b) => (ecartAuMeilleur(b) ?? 0) - (ecartAuMeilleur(a) ?? 0))
}
