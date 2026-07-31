import { describe, expect, it } from 'vitest'
import { cleIngredient, cumulerQuantites, memeProduit, motsPorteurs, multiplierQuantite } from './ingredients'

/**
 * L'arithmétique des quantités est partagée par la liste de courses calculée et
 * la liste enregistrée : deux comportements différents feraient « 2 + 2 oignons »
 * d'un côté et « 4 oignons » de l'autre. Elle se relit mal — des expressions
 * régulières, des fractions typographiques, des pluriels en « -x » — et c'est
 * exactement le genre de code dont un test dit plus qu'une relecture.
 *
 * Les cas ci-dessous viennent tous d'un défaut réellement rencontré, sauf
 * mention contraire.
 */

describe('motsPorteurs', () => {
  it('écarte les qualificatifs qui ne distinguent pas un produit', () => {
    expect(motsPorteurs('Poulet fermier')).toEqual(['poulet'])
    expect(motsPorteurs('Tomates bio fraîches')).toEqual(['tomate'])
  })

  it('normalise les mots vides comme les mots comparés', () => {
    // Le défaut : « frais » se normalisait en « frai » côté mot comparé mais
    // restait « frais » dans la liste, donc la moitié des mots vides — ceux qui
    // finissent par « s » — ne filtrait plus rien.
    expect(motsPorteurs('Saumon frais')).toEqual(['saumon'])
    expect(motsPorteurs('Haricots surgelés')).toEqual(['haricot'])
  })

  it('rapproche les ligatures, qu’Unicode ne décompose pas', () => {
    // « œufs » devenait « ufs » sans le remplacement explicite : trop court pour
    // passer le seuil de trois lettres, donc les œufs ne se rapprochaient de
    // rien. Ils sont dans une recette sur trois.
    expect(motsPorteurs('Œufs')).toEqual(['oeuf'])
    expect(motsPorteurs('6 œufs frais')).toEqual(['oeuf'])
  })

  it('découpe sur les apostrophes et les tirets', () => {
    expect(motsPorteurs('Huile d’olive')).toEqual(['huile', 'olive'])
    expect(motsPorteurs('Chou-fleur')).toEqual(['chou', 'fleur'])
  })
})

describe('memeProduit', () => {
  it('rapproche deux écritures du même produit', () => {
    expect(memeProduit('Filet de poulet', 'poulet')).toBe(true)
    expect(memeProduit('Escalope de poulet', 'Filet de poulet')).toBe(true)
    expect(memeProduit('Blanc de poulet fermier', 'Poulet')).toBe(true)
  })

  it('ne rapproche pas deux produits distincts', () => {
    expect(memeProduit('Poulet', 'Saumon')).toBe(false)
    expect(memeProduit('Lait', 'Farine')).toBe(false)
  })

  it('reste large, et se trompe donc parfois — c’est assumé', () => {
    // Documenté dans le module : exiger deux mots communs supprimerait ce faux
    // positif mais perdrait « escalope » contre « filet », qui est le cas
    // fréquent. L'écran affiche l'article du stock qui a produit la
    // correspondance, ce qui rend l'erreur visible. Si ce test tombe un jour,
    // c'est que la règle a changé : vérifier que l'affichage suit.
    expect(memeProduit('Huile d’olive', 'Olives noires')).toBe(true)
  })

  it('ne rapproche rien à partir d’un nom sans mot porteur', () => {
    expect(memeProduit('de la', 'Poulet')).toBe(false)
  })
})

describe('cleIngredient', () => {
  it('regroupe au pluriel près, et pas au-delà', () => {
    // Plus stricte que `memeProduit` : sur une liste de courses, fusionner à
    // tort fait partir au magasin avec une quantité fausse.
    expect(cleIngredient('Oignons')).toBe(cleIngredient('oignon'))
    expect(cleIngredient('Huile d’olive')).not.toBe(cleIngredient('Olives'))
  })
})

describe('cumulerQuantites', () => {
  it('additionne deux quantités de même unité', () => {
    expect(cumulerQuantites('40 g', '60 g')).toBe('100 g')
    expect(cumulerQuantites('2 CàS', '1 CàS')).toBe('3 CàS')
  })

  it('reconnaît les pluriels en « -x »', () => {
    // Le défaut du sprint C2 : « 1 rouleau » et « 2 rouleaux » ne se
    // reconnaissaient pas, et la liste affichait « 1 rouleau + 2 rouleaux » —
    // qu'on relit au rayon en se demandant ce qu'on doit prendre.
    expect(cumulerQuantites('1 rouleau', '2 rouleaux')).toBe('3 rouleaux')
  })

  it('accorde le pluriel à partir de deux, et en « -x » quand il le faut', () => {
    expect(cumulerQuantites('1 pot', '1 pot')).toBe('2 pots')
    expect(cumulerQuantites('1 rouleau', '1 rouleau')).toBe('2 rouleaux')
    // Les unités de mesure sont invariables : « 3 g », jamais « 3 gs ».
    expect(cumulerQuantites('1 g', '2 g')).toBe('3 g')
  })

  it('additionne les fractions typographiques et recolle l’entier', () => {
    expect(cumulerQuantites('½', '½')).toBe('1')
    expect(cumulerQuantites('1 ½', '½')).toBe('2')
    expect(cumulerQuantites('⅓', '⅓')).toBe('⅔')
  })

  it('juxtapose ce qui n’a pas de somme', () => {
    // « 1 CàS » et « ½ » ne s'additionnent pas : ce ne sont pas les mêmes
    // choses. On les met côte à côte plutôt que d'inventer un total.
    expect(cumulerQuantites('1 CàS', '½')).toBe('1 CàS + ½')
  })

  it('grossit le bon terme, même quand les unités alternent', () => {
    // « 1 moyenne », « 3 », « 1 moyenne » doit donner « 2 moyennes + 3 » : le
    // terme à grossir se cherche parmi tous, pas seulement le dernier.
    const apresDeux = cumulerQuantites('1 moyenne', '3')
    expect(apresDeux).toBe('1 moyenne + 3')
    expect(cumulerQuantites(apresDeux, '1 moyenne')).toBe('2 moyennes + 3')
  })

  it('ne répète pas une quantité qui n’est pas un nombre', () => {
    expect(cumulerQuantites('quelques brins', 'quelques brins')).toBe('quelques brins')
  })

  it('ne fond pas une quantité nue dans une quantité qui porte une unité', () => {
    // « 1 » tout court et « 2 tranches » ne désignent pas forcément la même
    // chose : on juxtapose plutôt que d'affirmer trois tranches.
    expect(cumulerQuantites('1', '2 tranches')).toBe('1 + 2 tranches')
  })

  it('garde la forme la plus explicite quand les deux unités concordent', () => {
    expect(cumulerQuantites('2 tranches', '1 tranche')).toBe('3 tranches')
  })
})

describe('multiplierQuantite', () => {
  it('cuisine pour plusieurs sans toucher aux unités', () => {
    expect(multiplierQuantite('120 g', 4)).toBe('480 g')
    expect(multiplierQuantite('1 CàS', 2)).toBe('2 CàS')
  })

  it('rend tel quel ce qui n’est pas un nombre', () => {
    // « 4 quelques brins » serait à la fois faux et ridicule.
    expect(multiplierQuantite('quelques brins', 4)).toBe('quelques brins')
    expect(multiplierQuantite('à volonté', 2)).toBe('à volonté')
  })

  it('multiplie chaque terme d’une quantité composée', () => {
    expect(multiplierQuantite('1 CàS + ½', 2)).toBe('2 CàS + 1')
  })

  it('ne touche à rien pour une personne', () => {
    expect(multiplierQuantite('1 ½ pot', 1)).toBe('1 ½ pot')
  })
})
