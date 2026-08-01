import { describe, expect, it } from 'vitest'
import {
  ajouterArticle,
  articleStockDepuis,
  articlesDuRayon,
  bilanListe,
  clore,
  copieDeListe,
  EMPLACEMENT_PAR_RAYON,
  ingredientsDeRecettes,
  listeParId,
  listesCloses,
  listesEnCours,
  nouvelleListe,
  planDejaVerse,
  propositionsDeRecettes,
  verser,
} from './courses'
import { RECETTES } from './recettes'
import type { ArticleStock, ListeCourses, PlanSemaine, Rayon } from './types'
import { RAYONS } from './types'

/**
 * Une liste de courses est le seul écran de l'application qu'on tient en
 * marchant, dans un magasin, souvent sans réseau. Deux erreurs y coûtent
 * réellement quelque chose :
 *
 * - **Fusionner deux lignes à tort** fait partir au rayon avec une quantité
 *   fausse. D'où le rapprochement sur `cleIngredient`, plus strict que le
 *   `memeProduit` du garde-manger, qui ne risque qu'une suggestion à côté.
 * - **Réordonner la liste sous les yeux** fait perdre sa place et relire tout le
 *   rayon. Les lignes cochées ne descendent donc pas.
 *
 * Et une règle qui vient du garde-manger : **le retour de courses n'invente
 * aucune date limite.**
 */

const rayon = (nom: Rayon) => nom

function stock(nom: string, r: Rayon = 'Crèmerie'): ArticleStock {
  return {
    id: `s-${nom}`,
    nom,
    quantite: '1',
    emplacement: 'frigo',
    rayon: r,
    ajouteLe: '2026-07-25',
  }
}

describe('nouvelleListe', () => {
  it('part vide, en cours, avec un nom', () => {
    const liste = nouvelleListe()
    expect(liste.articles).toEqual([])
    expect(liste.clotureeLe).toBeFalsy()
    expect(liste.nom.length).toBeGreaterThan(0)
  })

  it('donne un identifiant distinct à deux listes créées d’affilée', () => {
    // Deux listes au même identifiant, c'est `listeParId` qui rend toujours la
    // même et une liste qu'on ne peut plus ouvrir.
    const ids = Array.from({ length: 50 }, () => nouvelleListe().id)
    expect(new Set(ids).size).toBe(50)
  })
})

describe('ajouterArticle — le cumul', () => {
  it('grossit la ligne existante au lieu d’en créer une seconde', () => {
    // « 2 + 2 oignons » d'un côté et « 4 oignons » de l'autre feraient deux
    // lignes pour la même chose.
    const liste = nouvelleListe()
    ajouterArticle(liste, { nom: 'Oignon', quantite: '2', rayon: rayon('Fruits et légumes'), origine: 'manuel' })
    ajouterArticle(liste, { nom: 'Oignons', quantite: '2', rayon: rayon('Fruits et légumes'), origine: 'manuel' })
    expect(liste.articles).toHaveLength(1)
    expect(liste.articles[0].quantite).toBe('4')
  })

  it('rapproche au pluriel près, et pas au-delà', () => {
    // `cleIngredient` est volontairement plus strict que `memeProduit` : sur une
    // liste de courses, « huile d'olive » et « olives » doivent rester deux
    // lignes.
    const liste = nouvelleListe()
    ajouterArticle(liste, { nom: 'Huile d’olive', quantite: '1', rayon: rayon('Épicerie'), origine: 'manuel' })
    ajouterArticle(liste, { nom: 'Olives noires', quantite: '1', rayon: rayon('Épicerie'), origine: 'manuel' })
    expect(liste.articles).toHaveLength(2)
  })

  it('redevient à prendre quand une ligne cochée grossit', () => {
    // Cocher veut dire « j'ai pris ce qui était écrit ». Si la semaine suivante
    // en réclame deux de plus, laisser la case cochée ferait passer devant le
    // rayon sans s'arrêter.
    const liste = nouvelleListe()
    const article = ajouterArticle(liste, {
      nom: 'Lait',
      quantite: '1 L',
      rayon: rayon('Crèmerie'),
      origine: 'manuel',
    })
    article.pris = true
    ajouterArticle(liste, { nom: 'Lait', quantite: '1 L', rayon: rayon('Crèmerie'), origine: 'manuel' })
    expect(article.pris).toBe(false)
    expect(article.quantite).toBe('2 L')
  })

  it('cumule l’attribution sans la répéter', () => {
    const liste = nouvelleListe()
    ajouterArticle(liste, { nom: 'Oignon', quantite: '1', rayon: rayon('Fruits et légumes'), origine: 'recette', recette: 'Soupe' })
    ajouterArticle(liste, { nom: 'Oignon', quantite: '1', rayon: rayon('Fruits et légumes'), origine: 'recette', recette: 'Tarte' })
    ajouterArticle(liste, { nom: 'Oignon', quantite: '1', rayon: rayon('Fruits et légumes'), origine: 'recette', recette: 'Soupe' })
    expect(liste.articles[0].recettes).toEqual(['Soupe', 'Tarte'])
  })

  it('remplace une quantité vide par 1 plutôt que de laisser un blanc', () => {
    const liste = nouvelleListe()
    const article = ajouterArticle(liste, { nom: 'Pain', quantite: '  ', rayon: rayon('Boulangerie'), origine: 'manuel' })
    expect(article.quantite).toBe('1')
  })

  it('donne un identifiant distinct à chaque ligne', () => {
    const liste = nouvelleListe()
    for (let i = 0; i < 50; i++) {
      ajouterArticle(liste, { nom: `Produit ${i}`, quantite: '1', rayon: rayon('Épicerie'), origine: 'manuel' })
    }
    expect(new Set(liste.articles.map((a) => a.id)).size).toBe(50)
  })
})

describe('ingredientsDeRecettes', () => {
  it('cumule les ingrédients communs à plusieurs recettes', () => {
    const deux = RECETTES.slice(0, 4).map((r) => r.id)
    const entrees = ingredientsDeRecettes(deux)
    expect(entrees.length).toBeGreaterThan(0)
    for (const { ingredient } of entrees) {
      expect(ingredient.nom.trim().length).toBeGreaterThan(0)
      expect(ingredient.quantite.trim().length).toBeGreaterThan(0)
    }
  })

  it('dit quelles recettes demandent chaque ingrédient', () => {
    // C'est ce qui répond à « pourquoi trois oignons ? », question qui décide de
    // garder la ligne ou de la supprimer.
    const entrees = ingredientsDeRecettes(RECETTES.slice(0, 4).map((r) => r.id))
    for (const { recettes } of entrees) {
      expect(recettes.length).toBeGreaterThan(0)
      expect(new Set(recettes).size).toBe(recettes.length)
    }
  })

  it('range dans l’ordre du magasin', () => {
    const entrees = ingredientsDeRecettes(RECETTES.slice(0, 6).map((r) => r.id))
    const rangs = entrees.map((e) => RAYONS.indexOf(e.ingredient.rayon))
    expect(rangs).toEqual([...rangs].sort((a, b) => a - b))
  })

  it('ne modifie pas les recettes du catalogue', () => {
    // Le catalogue est mémoïsé et partagé : cumuler dans l'ingrédient d'origine
    // le changerait pour toute la session.
    const recette = RECETTES[0]
    const avant = recette.ingredients.map((i) => i.quantite)
    ingredientsDeRecettes([recette.id, recette.id])
    expect(recette.ingredients.map((i) => i.quantite)).toEqual(avant)
  })

  it('ignore un identifiant inconnu sans planter', () => {
    expect(() => ingredientsDeRecettes(['c:inexistante'])).not.toThrow()
    expect(ingredientsDeRecettes(['c:inexistante'])).toEqual([])
  })
})

describe('propositionsDeRecettes — ce qu’on a ne se rachète pas', () => {
  const ids = RECETTES.slice(0, 3).map((r) => r.id)

  it('nomme toujours l’article du stock qui a produit la correspondance', () => {
    // `memeProduit` rapproche sur un seul mot porteur et se trompe parfois. Une
    // erreur visible se décoche d'un geste ; une erreur silencieuse envoie
    // cuisiner sans huile.
    const premier = ingredientsDeRecettes(ids)[0].ingredient
    const propositions = propositionsDeRecettes(ids, [stock(premier.nom)], null)
    const trouvee = propositions.find((p) => p.ingredient.nom === premier.nom)
    expect(trouvee?.enStock).not.toBeNull()
    expect(trouvee?.enStock?.nom).toBe(premier.nom)
  })

  it('n’écarte rien de lui-même — il signale, la personne décide', () => {
    // Le stock ne supprime pas la ligne : il la marque. C'est ce qui rend
    // l'erreur de rapprochement inoffensive.
    const propositions = propositionsDeRecettes(ids, [stock('Oignon')], null)
    expect(propositions.length).toBe(ingredientsDeRecettes(ids).length)
  })

  it('signale ce qui est déjà sur la liste en cours', () => {
    const premier = ingredientsDeRecettes(ids)[0].ingredient
    const liste = nouvelleListe()
    ajouterArticle(liste, {
      nom: premier.nom,
      quantite: '1',
      rayon: premier.rayon,
      origine: 'manuel',
    })
    const propositions = propositionsDeRecettes(ids, [], liste)
    expect(propositions.find((p) => p.ingredient.nom === premier.nom)?.dejaDansListe).toBe(true)
  })

  it('ne signale rien sans stock ni liste', () => {
    for (const proposition of propositionsDeRecettes(ids, [], null)) {
      expect(proposition.enStock).toBeNull()
      expect(proposition.dejaDansListe).toBe(false)
    }
  })
})

describe('verser', () => {
  const plan: PlanSemaine = {
    debut: '2026-08-03',
    genereLe: '2026-08-01T10:00:00.000Z',
    jours: [],
  }

  it('marque la semaine versée pour ne pas la verser deux fois sans le dire', () => {
    const liste = nouvelleListe()
    expect(planDejaVerse(liste, plan)).toBe(false)
    verser(liste, [], 'recette', plan)
    expect(planDejaVerse(liste, plan)).toBe(true)
  })

  it('ne marque pas deux fois la même semaine', () => {
    const liste = nouvelleListe()
    verser(liste, [], 'recette', plan)
    verser(liste, [], 'recette', plan)
    expect(liste.plansVerses).toEqual([plan.genereLe])
  })

  it('reporte toutes les recettes qui demandent une ligne', () => {
    // Une même ligne sert souvent trois repas, et n'en montrer qu'un rend la
    // quantité incompréhensible.
    const liste = nouvelleListe()
    verser(
      liste,
      [
        {
          ingredient: { nom: 'Oignon', quantite: '3', rayon: rayon('Fruits et légumes') },
          recettes: ['Soupe', 'Tarte', 'Gratin'],
          enStock: null,
          dejaDansListe: false,
        },
      ],
      'recette',
    )
    expect(liste.articles[0].recettes).toEqual(['Soupe', 'Tarte', 'Gratin'])
  })

  it('distingue ce qui vient d’une recette de ce qu’on a écrit', () => {
    // Une ligne qu'on ne se souvient pas d'avoir ajoutée a l'air d'une erreur et
    // se fait supprimer, alors qu'elle vient du dîner de jeudi.
    const liste = nouvelleListe()
    verser(
      liste,
      [
        {
          ingredient: { nom: 'Oignon', quantite: '3', rayon: rayon('Fruits et légumes') },
          recettes: ['Soupe'],
          enStock: null,
          dejaDansListe: false,
        },
      ],
      'recette',
    )
    expect(liste.articles[0].origine).toBe('recette')
  })
})

describe('bilanListe et articlesDuRayon', () => {
  function listeGarnie(): ListeCourses {
    const liste = nouvelleListe()
    ajouterArticle(liste, { nom: 'Lait', quantite: '1', rayon: rayon('Crèmerie'), origine: 'manuel' })
    ajouterArticle(liste, { nom: 'Pain', quantite: '1', rayon: rayon('Boulangerie'), origine: 'manuel' })
    ajouterArticle(liste, { nom: 'Riz', quantite: '1', rayon: rayon('Épicerie'), origine: 'manuel' })
    liste.articles[0].pris = true
    return liste
  }

  it('compte ce qui reste à prendre', () => {
    expect(bilanListe(listeGarnie())).toMatchObject({ total: 3, pris: 1, restants: 2 })
  })

  it('ne liste que les rayons qui portent une ligne, dans l’ordre du magasin', () => {
    const bilan = bilanListe(listeGarnie())
    expect(bilan.rayonsRemplis).not.toContain('Surgelés')
    const rangs = bilan.rayonsRemplis.map((r) => RAYONS.indexOf(r))
    expect(rangs).toEqual([...rangs].sort((a, b) => a - b))
  })

  it('rend un bilan à zéro sur une liste vide', () => {
    expect(bilanListe(nouvelleListe())).toMatchObject({ total: 0, pris: 0, restants: 0, rayonsRemplis: [] })
  })

  it('ne fait pas descendre les lignes cochées', () => {
    // On coche en marchant : une liste qui se réordonne sous les yeux fait
    // perdre sa place et relire tout le rayon.
    const liste = nouvelleListe()
    for (const nom of ['Lait', 'Beurre', 'Yaourt']) {
      ajouterArticle(liste, { nom, quantite: '1', rayon: rayon('Crèmerie'), origine: 'manuel' })
    }
    liste.articles[0].pris = true
    expect(articlesDuRayon(liste, 'Crèmerie').map((a) => a.nom)).toEqual(['Lait', 'Beurre', 'Yaourt'])
  })
})

describe('clore, copier, retrouver', () => {
  it('sépare les listes en cours des listes closes', () => {
    const enCours = nouvelleListe('En cours')
    const close = nouvelleListe('Close')
    clore(close)
    const listes = [enCours, close]
    expect(listesEnCours(listes).map((l) => l.nom)).toEqual(['En cours'])
    expect(listesCloses(listes).map((l) => l.nom)).toEqual(['Close'])
  })

  it('retrouve une liste par identifiant, et rend null sinon', () => {
    const liste = nouvelleListe()
    expect(listeParId([liste], liste.id)?.id).toBe(liste.id)
    expect(listeParId([liste], 'inconnu')).toBeNull()
    expect(listeParId([liste], null)).toBeNull()
  })

  it('recopie une liste tout décoché, avec des identifiants neufs', () => {
    const source = nouvelleListe('Semaine')
    ajouterArticle(source, { nom: 'Lait', quantite: '1', rayon: rayon('Crèmerie'), origine: 'manuel' })
    source.articles[0].pris = true

    const copie = copieDeListe(source)
    expect(copie.articles[0].pris).toBe(false)
    expect(copie.articles[0].id).not.toBe(source.articles[0].id)
    expect(copie.id).not.toBe(source.id)
    // L'originale ne bouge pas.
    expect(source.articles[0].pris).toBe(true)
  })

  it('ne reprend pas les semaines versées dans la copie', () => {
    // La copie doit pouvoir recevoir la semaine en cours.
    const source = nouvelleListe()
    verser(source, [], 'recette', { debut: '2026-08-03', genereLe: 'x', jours: [] })
    expect(copieDeListe(source).plansVerses ?? []).toEqual([])
  })
})

describe('articleStockDepuis — le retour de courses', () => {
  it('n’invente aucune date limite', () => {
    // Une liste de courses ne sait pas ce qui est imprimé sur l'emballage, et
    // poser une DLC au hasard donnerait une fausse sécurité là où le risque est
    // réel — l'inverse exact de ce que le garde-manger cherche à faire.
    const liste = nouvelleListe()
    const article = ajouterArticle(liste, {
      nom: 'Yaourt',
      quantite: '4',
      rayon: rayon('Crèmerie'),
      origine: 'manuel',
    })
    const range = articleStockDepuis(article, 'frigo', '2026-08-01')
    expect(range.dlc).toBeUndefined()
    expect(range.ddm).toBeUndefined()
    expect(range.congeleLe).toBeUndefined()
    expect(range.ouvertLe).toBeUndefined()
  })

  it('reporte le nom, la quantité et le rayon tels quels', () => {
    const liste = nouvelleListe()
    const article = ajouterArticle(liste, {
      nom: 'Yaourt nature',
      quantite: '4',
      rayon: rayon('Crèmerie'),
      origine: 'manuel',
    })
    expect(articleStockDepuis(article, 'frigo', '2026-08-01')).toMatchObject({
      nom: 'Yaourt nature',
      quantite: '4',
      rayon: 'Crèmerie',
      emplacement: 'frigo',
      ajouteLe: '2026-08-01',
    })
  })

  it('propose un emplacement pour chaque rayon, sans trou', () => {
    // Une table incomplète donnerait `undefined` en emplacement, et l'article
    // n'apparaîtrait dans aucun des trois écrans du garde-manger.
    for (const r of RAYONS) {
      expect(['frigo', 'placard', 'congelateur']).toContain(EMPLACEMENT_PAR_RAYON[r])
    }
  })

  it('donne un identifiant distinct à chaque rangement', () => {
    const liste = nouvelleListe()
    const article = ajouterArticle(liste, { nom: 'Lait', quantite: '1', rayon: rayon('Crèmerie'), origine: 'manuel' })
    const ids = Array.from({ length: 50 }, () => articleStockDepuis(article, 'frigo').id)
    expect(new Set(ids).size).toBe(50)
  })
})
