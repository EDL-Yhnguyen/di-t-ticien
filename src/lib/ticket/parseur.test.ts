import { describe, expect, it } from 'vitest'
import { analyserTicket, controler, lignesACorriger } from './parseur'
import type { LigneOCR } from './types'

/**
 * Le parseur de tickets est le module le plus exposé du projet : il transforme
 * une photo froissée en prix enregistrés, et une erreur y est **silencieuse**.
 * Un prix mal lu ne plante rien — il devient le « meilleur prix jamais vu » d'un
 * produit et s'affiche comme un fait pendant des mois.
 *
 * Le module tient sur une règle unique — ne jamais combler un trou — et sur un
 * garde-fou — le ticket porte sa propre somme de contrôle. Ce sont ces deux
 * propriétés que les tests protègent, plus les pièges rencontrés en écrivant
 * le module.
 *
 * Un banc d'essai existait déjà pendant le développement du 30/07/2026 ; il
 * n'avait pas été conservé dans le dépôt. C'est ce qui manquait.
 */

/** Un ticket d'OCR : du texte, une confiance haute, une géométrie plausible. */
function ocr(lignes: string[], confiance = 0.95): LigneOCR[] {
  return lignes.map((texte, i) => ({
    texte,
    confiance,
    haut: i * 20,
    gauche: 0,
    droite: 400,
  }))
}

const TICKET_SIMPLE = [
  'CARREFOUR MARKET',
  '12 RUE DE LA PAIX',
  '75002 PARIS',
  'LE 15/03/26 A 18:42',
  'EMMENTAL RAPE 2,45',
  'PAIN COMPLET 1,80',
  'TOMATES GRAPPE 3,15',
  'TOTAL 7,40',
  'CARTE BANCAIRE 7,40',
  'MERCI DE VOTRE VISITE',
]

describe('analyserTicket — l’en-tête', () => {
  it('lit la date en la ramenant au siècle en cours', () => {
    // Aucun ticket de caisse photographié ne date de 1926.
    expect(analyserTicket(ocr(TICKET_SIMPLE)).date).toBe('2026-03-15')
  })

  it('lit l’heure', () => {
    expect(analyserTicket(ocr(TICKET_SIMPLE)).heure).toBe('18:42')
  })

  it('reconnaît l’enseigne', () => {
    expect(analyserTicket(ocr(TICKET_SIMPLE)).enseigne).not.toBeNull()
  })

  it('refuse une date impossible plutôt que de l’inventer', () => {
    const ticket = analyserTicket(ocr(['LE 45/13/26', 'PAIN 1,80', 'TOTAL 1,80']))
    expect(ticket.date).toBeNull()
  })

  it('retient le dernier total, pas le premier', () => {
    // Sous-total, puis remise, puis total réellement payé : retenir le premier
    // comparerait l'addition des lignes à un montant d'avant remise.
    const ticket = analyserTicket(
      ocr(['PAIN 2,00', 'SOUS TOTAL 2,00', 'REMISE 0,50', 'TOTAL 1,50']),
    )
    expect(ticket.total).toBe(1.5)
  })
})

describe('analyserTicket — les produits', () => {
  it('sépare le libellé du prix', () => {
    const ticket = analyserTicket(ocr(TICKET_SIMPLE))
    expect(ticket.lignes.map((l) => [l.libelle, l.prixPaye])).toEqual([
      ['EMMENTAL RAPE', 2.45],
      ['PAIN COMPLET', 1.8],
      ['TOMATES GRAPPE', 3.15],
    ])
  })

  it('recompose le montant en centimes plutôt qu’en flottants', () => {
    // « 3 » et « 78 » additionnés en flottants donnent 3,7800000000000002, qui
    // s'afficherait tel quel et fausserait toute somme non arrondie.
    const ticket = analyserTicket(ocr(['CAFE 3,78', 'TOTAL 3,78']))
    expect(ticket.lignes[0].prixPaye).toBe(3.78)
  })

  it('tolère les espaces que l’OCR fabrique autour de la virgule', () => {
    // Un point décimal imprimé petit se lit régulièrement comme un séparateur
    // de mots.
    const ticket = analyserTicket(ocr(['YAOURT NATURE 1 , 29', 'TOTAL 1,29']))
    expect(ticket.lignes[0].prixPaye).toBe(1.29)
  })

  it('écarte les mentions de service sans les perdre', () => {
    const ticket = analyserTicket(ocr(TICKET_SIMPLE))
    expect(ticket.lignes.some((l) => l.libelle.includes('MERCI'))).toBe(false)
    expect(ticket.ecartees.some((e) => e.includes('MERCI'))).toBe(true)
  })

  it('ne teste les mentions de service qu’en début de ligne', () => {
    // « TOTAL » écarte la ligne de total, mais « EAU TOTAL 1,5L » est un produit.
    const ticket = analyserTicket(ocr(['EAU TOTAL 1.5L 0,89', 'TOTAL 0,89']))
    expect(ticket.lignes.map((l) => l.libelle)).toEqual(['EAU TOTAL 1.5L'])
  })

  it('ne se laisse pas piéger par un motif cherché partout', () => {
    // « N° DE » avait été mis dans les motifs cherchés partout, et `comparable`
    // en fait « N DE » — ce que contient « JAMBON DE PARIS ».
    const ticket = analyserTicket(ocr(['JAMBON DE PARIS 2,99', 'TOTAL 2,99']))
    expect(ticket.lignes.map((l) => l.libelle)).toEqual(['JAMBON DE PARIS'])
  })

  it('écarte l’adresse du magasin, hors du bloc des produits', () => {
    // Sans l'élagage, « 75002 PARIS » devient un produit dont le prix reste à
    // saisir, et le contrôle échoue sur une ligne jamais achetée.
    const ticket = analyserTicket(ocr(TICKET_SIMPLE))
    expect(ticket.lignes.some((l) => l.libelle.includes('PARIS'))).toBe(false)
  })

  it('conserve une ligne sans prix située à l’intérieur du bloc', () => {
    // Là, c'est bien un produit dont le prix a échappé à l'OCR : c'est
    // exactement ce que l'écran de correction doit montrer.
    const ticket = analyserTicket(
      ocr(['PAIN 1,80', 'FROMAGE ILLISIBLE', 'TOMATES 3,15', 'TOTAL 4,95']),
    )
    const sansPrix = ticket.lignes.filter((l) => l.prixPaye === null)
    expect(sansPrix.map((l) => l.libelle)).toEqual(['FROMAGE ILLISIBLE'])
    expect(sansPrix[0].douteuse).toBe(true)
  })
})

describe('analyserTicket — lots et produits au poids', () => {
  it('rattache un lot au produit du dessus', () => {
    const ticket = analyserTicket(ocr(['YAOURT NATURE', '3 X 1,15 3,45', 'TOTAL 3,45']))
    expect(ticket.lignes).toHaveLength(1)
    expect(ticket.lignes[0]).toMatchObject({
      libelle: 'YAOURT NATURE',
      quantite: 3,
      prixUnitaire: 1.15,
      prixPaye: 3.45,
    })
  })

  it('rattache un produit au poids et retient son unité', () => {
    const ticket = analyserTicket(ocr(['TOMATES GRAPPE', '0,832 kg X 1,99 EUR/kg 1,66', 'TOTAL 1,66']))
    expect(ticket.lignes[0]).toMatchObject({
      quantite: 0.832,
      unite: 'kg',
      prixUnitaire: 1.99,
      prixPaye: 1.66,
    })
  })

  it('lève le doute du libellé quand la ligne suivante comble son prix', () => {
    // Le défaut corrigé le 30/07 : tous les fruits et tous les lots ressortaient
    // « à confirmer », et un signal qui se déclenche partout ne distingue plus rien.
    const ticket = analyserTicket(ocr(['BANANES', '1,240 kg X 1,95 EUR/kg 2,42', 'TOTAL 2,42']))
    expect(ticket.lignes[0].douteuse).toBe(false)
  })

  it('écarte un détail de calcul orphelin plutôt que d’en faire un produit', () => {
    // Sans son libellé, « 2 X 1,15 » deviendrait un produit nommé « 2 X », qui
    // polluerait l'historique de prix sans pouvoir se rapprocher de rien.
    const ticket = analyserTicket(ocr(['2 X 1,15 2,30', 'PAIN 1,80', 'TOTAL 4,10']))
    expect(ticket.lignes.map((l) => l.libelle)).toEqual(['PAIN'])
    expect(ticket.ecartees).toContain('2 X 1,15 2,30')
  })

  it('calcule le total d’une ligne quand le ticket ne l’imprime pas', () => {
    // Une multiplication de deux facteurs lus sur le ticket est une addition,
    // pas une invention.
    const ticket = analyserTicket(ocr(['YAOURT', '4 X 0,75', 'TOTAL 3,00']))
    expect(ticket.lignes[0].prixPaye).toBe(3)
  })
})

describe('analyserTicket — les remises', () => {
  it('déduit une remise du produit qui la précède', () => {
    const ticket = analyserTicket(ocr(['LESSIVE 8,90', 'REMISE IMMEDIATE 2,00', 'TOTAL 6,90']))
    expect(ticket.lignes).toHaveLength(1)
    expect(ticket.lignes[0]).toMatchObject({ prixPaye: 6.9, remise: 2 })
  })

  it('range en remise globale ce qui ne se rattache à aucun produit', () => {
    // Certaines enseignes appliquent l'avantage fidélité en pied de ticket.
    // Sans ce champ, la somme dépasserait le total et le contrôle déclarerait
    // faux un ticket parfaitement lu.
    const ticket = analyserTicket(ocr(['BON DE REDUCTION 1,50', 'PAIN 1,80', 'TOTAL 0,30']))
    expect(ticket.remisesGlobales).toBe(1.5)
    expect(controler(ticket).coherent).toBe(true)
  })
})

describe('controler', () => {
  it('déclare cohérent un ticket dont l’addition retombe', () => {
    const controle = controler(analyserTicket(ocr(TICKET_SIMPLE)))
    expect(controle).toMatchObject({ somme: 7.4, total: 7.4, ecart: 0, sansPrix: 0, coherent: true })
  })

  it('tolère le centime d’arrondi de TVA, et pas davantage', () => {
    expect(controler(analyserTicket(ocr(['PAIN 1,80', 'TOTAL 1,81']))).coherent).toBe(true)
    expect(controler(analyserTicket(ocr(['PAIN 1,80', 'TOTAL 1,90']))).coherent).toBe(false)
  })

  it('refuse de conclure tant qu’une ligne n’a pas de prix', () => {
    const ticket = analyserTicket(ocr(['PAIN 1,80', 'FROMAGE ILLISIBLE', 'TOMATES 3,15', 'TOTAL 4,95']))
    const controle = controler(ticket)
    expect(controle.sansPrix).toBe(1)
    // L'écart retombe pourtant à zéro : c'est précisément le cas où un contrôle
    // naïf annoncerait un ticket parfait alors qu'un produit manque.
    expect(controle.ecart).toBe(0)
    expect(controle.coherent).toBe(false)
  })

  it('n’affirme rien quand le total ne s’est pas lu', () => {
    const controle = controler(analyserTicket(ocr(['PAIN 1,80', 'FROMAGE 2,45'])))
    expect(controle.total).toBeNull()
    expect(controle.ecart).toBeNull()
    expect(controle.coherent).toBe(false)
  })

  it('signale une ligne manquée par un écart, jamais par un silence', () => {
    const ticket = analyserTicket(ocr(['PAIN 1,80', 'TOMATES 3,15', 'TOTAL 7,40']))
    expect(controler(ticket).ecart).toBe(-2.45)
    expect(controler(ticket).coherent).toBe(false)
  })
})

describe('la règle « ne jamais combler un trou »', () => {
  it('laisse un prix illisible à null, jamais à zéro', () => {
    // Zéro deviendrait aussitôt le meilleur prix jamais vu de ce produit.
    const ticket = analyserTicket(ocr(['CAFE 3,20', 'PAIN COMPLET', 'TOMATES 3,15', 'TOTAL 9,95']))
    const pain = ticket.lignes.find((l) => l.libelle === 'PAIN COMPLET')
    expect(pain?.prixPaye).toBeNull()
    expect(pain?.prixPaye).not.toBe(0)
  })

  it('élague une ligne sans prix située avant le premier prix, sans la perdre', () => {
    // Tout ce qui précède le premier prix est de l'en-tête : nom du magasin,
    // adresse, numéro de caisse. Un produit dont le prix a échappé à l'OCR **et**
    // qui se trouve en tête de ticket est donc écarté — c'est le prix à payer
    // pour ne pas transformer « 75002 PARIS » en produit. Le contrôle du total
    // le signale par un écart, et la ligne reste repêchable.
    const ticket = analyserTicket(ocr(['PAIN COMPLET', 'TOMATES 3,15', 'TOTAL 4,95']))
    expect(ticket.lignes.map((l) => l.libelle)).toEqual(['TOMATES'])
    expect(ticket.ecartees).toContain('PAIN COMPLET')
    expect(controler(ticket).coherent).toBe(false)
  })

  it('marque douteuse toute ligne dont les chiffres ont été réparés', () => {
    // `O` pour zéro est l'erreur la plus fréquente ; la corriger est un pari,
    // et un pari se montre.
    const ticket = analyserTicket(ocr(['CAFE MOULU 3,O5', 'TOTAL 3,05']))
    expect(ticket.lignes[0].prixPaye).toBe(3.05)
    expect(ticket.lignes[0].douteuse).toBe(true)
  })

  it('ne répare pas les confusions ambiguës', () => {
    // `S` pour 5 et `B` pour 8 apparaissent légitimement dans les libellés :
    // une réparation fausse produirait un prix crédible mais inexact.
    const ticket = analyserTicket(ocr(['BISCUITS 2,S0', 'TOTAL 2,50']))
    expect(ticket.lignes[0].prixPaye).toBeNull()
  })

  it('marque douteuse une ligne lue avec une confiance faible', () => {
    const ticket = analyserTicket(ocr(['PAIN COMPLET 1,80', 'TOTAL 1,80'], 0.4))
    expect(ticket.lignes[0].douteuse).toBe(true)
  })

  it('remonte à l’écran tout ce qui demande une décision, dans l’ordre du ticket', () => {
    const ticket = analyserTicket(
      ocr(['PAIN 1,80', 'FROMAGE ILLISIBLE', 'CAFE 3,O5', 'TOMATES 3,15', 'TOTAL 8,00']),
    )
    expect(lignesACorriger(ticket).map((l) => l.libelle)).toEqual(['FROMAGE ILLISIBLE', 'CAFE'])
  })

  it('ne jette rien quand la photo est illisible de bout en bout', () => {
    // Aucun prix lu : l'écran dira que la lecture a échoué plutôt que de rendre
    // un ticket vide qui ressemblerait à un ticket sans achat.
    const ticket = analyserTicket(ocr(['XXXX ZZZZ', 'QQQQ WWWW']))
    expect(ticket.lignes).toHaveLength(2)
    expect(controler(ticket).coherent).toBe(false)
  })
})
