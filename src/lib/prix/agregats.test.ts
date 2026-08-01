import { describe, expect, it } from 'vitest'
import { agregatDe, aSurveiller, depouiller, ecartAuMeilleur } from './agregats'
import type { Releve } from './depot'

/**
 * « Une moyenne fausse ne se voit pas : elle a l'air d'une moyenne. »
 *
 * C'est la phrase du module, et c'est ce qui rend ce fichier nécessaire. Les
 * agrégats de prix s'affichent comme des faits — « tu l'as déjà payé 1,69 €
 * chez Aldi » — et rien à l'écran ne dirait qu'un chiffre a dérivé. Deux règles
 * les tiennent, aucune vérifiable par un typecheck :
 *
 * 1. **Tout se recalcule depuis les relevés bruts, rien ne s'accumule.** Un
 *    agrégat entretenu à l'incrément dérive à la première ligne corrigée ou
 *    supprimée.
 * 2. **Les unités ne se mélangent pas.** Une moyenne entre un prix au kilo et un
 *    prix à la pièce est un nombre qui ne désigne rien.
 *
 * `recalculer()` n'est pas testée ici : elle lit IndexedDB. `depouiller()` est
 * pure, et c'est elle qui porte tout le raisonnement.
 */

let compteur = 0
function releve(partiel: Partial<Releve> = {}): Releve {
  compteur += 1
  const prixParUnite = partiel.prixParUnite ?? 2
  return {
    id: `r${compteur}`,
    ticketId: 't1',
    utilisateur: 'u1',
    libelle: 'Emmental râpé',
    cle: 'emmental rape',
    enseigne: 'carrefour-market',
    date: '2026-07-01',
    quantite: 1,
    unite: 'kg',
    prixUnitaire: prixParUnite,
    prixPaye: prixParUnite,
    prixParUnite,
    ...partiel,
  }
}

describe('depouiller — un agrégat par produit', () => {
  it('regroupe les relevés du même produit', () => {
    const agregats = depouiller([
      releve({ prixParUnite: 2.45, date: '2026-07-01' }),
      releve({ prixParUnite: 1.89, date: '2026-07-15' }),
      releve({ prixParUnite: 2.17, date: '2026-07-20' }),
    ])
    expect(agregats).toHaveLength(1)
    expect(agregats[0].releves).toBe(3)
  })

  it('ne mélange jamais deux unités sous le même nom', () => {
    // « Jambon » à la barquette et « jambon » au poids ne donnent pas des prix
    // comparables : les fondre produirait une moyenne entre un prix au kilo et
    // un prix à la pièce, c'est-à-dire un nombre qui ne désigne rien.
    const agregats = depouiller([
      releve({ cle: 'jambon', unite: 'kg', prixParUnite: 14 }),
      releve({ cle: 'jambon', unite: 'piece', prixParUnite: 2.6 }),
    ])
    expect(agregats).toHaveLength(2)
    expect(agregats.map((a) => a.unite).sort()).toEqual(['kg', 'piece'])
    for (const agregat of agregats) {
      expect(agregat.moyen).toBe(agregat.dernier)
    }
  })

  it('rend une liste vide plutôt que rien', () => {
    expect(depouiller([])).toEqual([])
  })
})

describe('le dernier prix', () => {
  it('vient du relevé le plus récent, quel que soit l’ordre d’entrée', () => {
    // Les relevés arrivent dans l'ordre des tickets photographiés, pas dans
    // l'ordre des courses : un vieux ticket retrouvé se saisit après.
    const agregats = depouiller([
      releve({ prixParUnite: 2.45, date: '2026-07-20', enseigne: 'aldi' }),
      releve({ prixParUnite: 3.1, date: '2026-07-25', enseigne: 'lidl' }),
      releve({ prixParUnite: 1.99, date: '2026-07-05', enseigne: 'carrefour-market' }),
    ])
    expect(agregats[0].dernier).toBe(3.1)
    expect(agregats[0].derniereDate).toBe('2026-07-25')
    expect(agregats[0].derniereEnseigne).toBe('lidl')
  })

  it('affiche le libellé de la dernière fois qu’on l’a vu écrit', () => {
    // Un produit change de nom sur les tickets d'une enseigne à l'autre :
    // afficher le plus ancien ferait chercher un mot qu'on ne lit plus.
    const agregats = depouiller([
      releve({ libelle: 'EMMENTAL RAPE 250G', date: '2026-07-01' }),
      releve({ libelle: 'Emmental râpé', date: '2026-07-20' }),
    ])
    expect(agregats[0].libelle).toBe('Emmental râpé')
  })
})

describe('le meilleur prix', () => {
  it('retient le plus bas, avec son enseigne', () => {
    // C'est le chiffre qui donne sa valeur à l'historique : « tu l'as déjà payé
    // 1,69 € chez Aldi » est actionnable, un prix moyen ne dit que le passé.
    const agregats = depouiller([
      releve({ prixParUnite: 2.45, enseigne: 'carrefour-market', date: '2026-07-01' }),
      releve({ prixParUnite: 1.69, enseigne: 'aldi', date: '2026-07-10' }),
      releve({ prixParUnite: 2.17, enseigne: 'lidl', date: '2026-07-20' }),
    ])
    expect(agregats[0].meilleur).toBe(1.69)
    expect(agregats[0].meilleureEnseigne).toBe('aldi')
    expect(agregats[0].meilleureDate).toBe('2026-07-10')
  })

  it('préfère le plus récent à prix égal', () => {
    // Annoncer « meilleur prix » avec une date de l'an dernier alors qu'on l'a
    // revu au même tarif la semaine dernière fait douter d'un chiffre pourtant
    // juste.
    const agregats = depouiller([
      releve({ prixParUnite: 1.69, enseigne: 'aldi', date: '2025-11-02' }),
      releve({ prixParUnite: 1.69, enseigne: 'lidl', date: '2026-07-20' }),
    ])
    expect(agregats[0].meilleureDate).toBe('2026-07-20')
    expect(agregats[0].meilleureEnseigne).toBe('lidl')
  })

  it('n’est jamais supérieur au dernier prix', () => {
    const agregats = depouiller([
      releve({ prixParUnite: 3.2, date: '2026-07-20' }),
      releve({ prixParUnite: 1.5, date: '2026-07-01' }),
    ])
    expect(agregats[0].meilleur).toBeLessThanOrEqual(agregats[0].dernier)
  })
})

describe('la moyenne — recalculée, jamais entretenue', () => {
  it('est la moyenne des relevés, au centime', () => {
    const agregats = depouiller([
      releve({ prixParUnite: 2.45 }),
      releve({ prixParUnite: 1.89 }),
      releve({ prixParUnite: 2.17 }),
    ])
    // (2,45 + 1,89 + 2,17) / 3 = 2,17
    expect(agregats[0].moyen).toBe(2.17)
  })

  it('ne dépend que des relevés fournis', () => {
    // C'est la propriété qui distingue un recalcul d'un cumul : retirer une
    // ligne doit produire exactement la moyenne des lignes restantes, et non la
    // précédente corrigée à l'incrément.
    const tous = [
      releve({ prixParUnite: 1 }),
      releve({ prixParUnite: 2 }),
      releve({ prixParUnite: 9 }),
    ]
    expect(depouiller(tous)[0].moyen).toBe(4)
    expect(depouiller(tous.slice(0, 2))[0].moyen).toBe(1.5)
    // Et un second dépouillement des mêmes relevés donne le même résultat :
    // rien ne s'est accumulé entre les deux appels.
    expect(depouiller(tous)[0].moyen).toBe(4)
  })

  it('ne modifie pas les relevés qu’on lui donne', () => {
    // Ils viennent d'IndexedDB et repartiront dans d'autres calculs.
    const relevés = [releve({ prixParUnite: 2 }), releve({ prixParUnite: 3 })]
    const copie = JSON.stringify(relevés)
    depouiller(relevés)
    expect(JSON.stringify(relevés)).toBe(copie)
  })

  it('arrondit au centime, la seule précision qui existe sur un ticket', () => {
    const agregats = depouiller([
      releve({ prixParUnite: 1 }),
      releve({ prixParUnite: 1 }),
      releve({ prixParUnite: 2 }),
    ])
    // 4/3 = 1,333… → 1,33 et non 1,3333333333333333
    expect(agregats[0].moyen).toBe(1.33)
  })
})

describe('ecartAuMeilleur', () => {
  const avec = (prix: number[], derniereDate = '2026-07-20') =>
    depouiller(
      prix.map((p, i) =>
        releve({
          prixParUnite: p,
          date: i === prix.length - 1 ? derniereDate : `2026-07-0${i + 1}`,
        }),
      ),
    )[0]

  it('chiffre ce qu’on a payé de trop cette fois', () => {
    expect(ecartAuMeilleur(avec([1.69, 2.45]))).toBe(0.76)
  })

  it('ne dit rien sur un seul relevé', () => {
    // Avec un seul passage en caisse, le dernier prix *est* le meilleur prix :
    // afficher « 0 € d'écart » donnerait à un unique ticket l'autorité d'un
    // historique.
    expect(ecartAuMeilleur(avec([2.45]))).toBeNull()
  })

  it('ne dit rien quand on vient de faire une bonne affaire', () => {
    // Un écart nul ou négatif n'est pas une alerte : c'est le meilleur prix.
    expect(ecartAuMeilleur(avec([2.45, 1.69]))).toBeNull()
  })

  it('ne rend jamais un nombre négatif', () => {
    for (const prix of [[3, 1], [1, 1], [1, 1, 1]]) {
      const ecart = ecartAuMeilleur(avec(prix))
      if (ecart !== null) expect(ecart).toBeGreaterThan(0)
    }
  })
})

describe('aSurveiller', () => {
  it('ne remonte que ce qu’on paie plus cher qu’ailleurs', () => {
    const agregats = depouiller([
      // Produit A : payé 2,45 alors qu'on l'a vu à 1,69.
      releve({ cle: 'a', prixParUnite: 1.69, date: '2026-07-01' }),
      releve({ cle: 'a', prixParUnite: 2.45, date: '2026-07-20' }),
      // Produit B : on vient de faire le meilleur prix.
      releve({ cle: 'b', prixParUnite: 3, date: '2026-07-01' }),
      releve({ cle: 'b', prixParUnite: 2, date: '2026-07-20' }),
      // Produit C : un seul relevé, rien à en dire.
      releve({ cle: 'c', prixParUnite: 5, date: '2026-07-20' }),
    ])
    expect(aSurveiller(agregats).map((a) => a.cle)).toEqual(['a'])
  })

  it('classe du pire écart au moindre', () => {
    const agregats = depouiller([
      releve({ cle: 'a', prixParUnite: 1, date: '2026-07-01' }),
      releve({ cle: 'a', prixParUnite: 1.5, date: '2026-07-20' }),
      releve({ cle: 'b', prixParUnite: 1, date: '2026-07-01' }),
      releve({ cle: 'b', prixParUnite: 4, date: '2026-07-20' }),
    ])
    expect(aSurveiller(agregats).map((a) => a.cle)).toEqual(['b', 'a'])
  })

  it('rend une liste vide plutôt que rien', () => {
    expect(aSurveiller([])).toEqual([])
  })
})

describe('agregatDe', () => {
  it('retrouve un produit par sa clé, et rend null sinon', () => {
    const agregats = depouiller([releve({ cle: 'emmental rape' })])
    expect(agregatDe(agregats, 'emmental rape')?.cle).toBe('emmental rape')
    expect(agregatDe(agregats, 'inconnu')).toBeNull()
  })
})

describe('le tri de sortie', () => {
  it('met les produits vus le plus récemment en tête', () => {
    const agregats = depouiller([
      releve({ cle: 'vieux', date: '2026-01-05' }),
      releve({ cle: 'recent', date: '2026-07-25' }),
      releve({ cle: 'moyen', date: '2026-04-10' }),
    ])
    expect(agregats.map((a) => a.cle)).toEqual(['recent', 'moyen', 'vieux'])
  })
})
