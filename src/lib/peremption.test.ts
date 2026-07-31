import { describe, expect, it } from 'vitest'
import { articlesUrgents, bilanStock, echeance, joursEntre, stocksDe } from './peremption'
import type { ArticleStock, Emplacement, Rayon } from './types'
import { RAYONS } from './types'

/**
 * C'est la logique aux conséquences les plus lourdes du projet, et la seule dont
 * une erreur ne se répare pas à l'écran suivant : un côté fait manger un produit
 * qui ne l'est plus, l'autre fait jeter ce qu'on prétendait sauver.
 *
 * Les trois règles qui la tiennent sont écrites dans `CLAUDE.md` et ne se
 * devinent pas :
 *
 * 1. **La DLC est sanitaire, la DDM ne parle que du goût.** Les fondre ferait
 *    jeter des aliments parfaitement bons.
 * 2. **`ouvertLe` avance l'échéance** : une date imprimée ne vaut que pour un
 *    emballage fermé.
 * 3. **Une date sanitaire l'emporte toujours** sur une date de qualité.
 *
 * Toutes les dates sont figées : un test de péremption qui dépend du jour où on
 * l'exécute passerait six jours sur sept et se ferait ignorer le septième.
 */

const AUJOURDHUI = '2026-08-01'

let compteur = 0
function article(partiel: Partial<ArticleStock> & { rayon?: Rayon } = {}): ArticleStock {
  compteur += 1
  return {
    id: `a${compteur}`,
    nom: partiel.nom ?? `Article ${compteur}`,
    quantite: '1',
    emplacement: 'frigo',
    rayon: 'Crèmerie',
    ajouteLe: '2026-07-25',
    ...partiel,
  }
}

describe('joursEntre', () => {
  it('compte en jours pleins, sans se faire piéger par l’heure', () => {
    // Les dates sont ancrées à midi, précisément pour qu'un passage à l'heure
    // d'été ne fasse pas basculer un compte d'un jour.
    expect(joursEntre('2026-08-01', '2026-08-08')).toBe(7)
    expect(joursEntre('2026-08-01', '2026-08-01')).toBe(0)
    expect(joursEntre('2026-08-01', '2026-07-30')).toBe(-2)
    // Changement d'heure français : dernier dimanche d'octobre.
    expect(joursEntre('2026-10-24', '2026-10-26')).toBe(2)
    // Année bissextile.
    expect(joursEntre('2028-02-28', '2028-03-01')).toBe(2)
  })
})

describe('echeance — la DLC', () => {
  it('marque sanitaire une date limite de consommation', () => {
    const lait = article({ dlc: '2026-08-05' })
    expect(echeance(lait, AUJOURDHUI)).toMatchObject({
      date: '2026-08-05',
      urgence: 'semaine',
      joursRestants: 4,
      sanitaire: true,
      origine: 'dlc',
    })
  })

  it('range les échéances par urgence, aux bonnes bornes', () => {
    const le = (d: string) => echeance(article({ dlc: d }), AUJOURDHUI).urgence
    expect(le('2026-07-31')).toBe('perime')
    expect(le('2026-08-01')).toBe('aujourdhui')
    expect(le('2026-08-02')).toBe('demain')
    expect(le('2026-08-08')).toBe('semaine')
    // Le huitième jour n'est plus « cette semaine ».
    expect(le('2026-08-09')).toBe('ok')
  })

  it('compte les jours en négatif une fois la date passée', () => {
    expect(echeance(article({ dlc: '2026-07-29' }), AUJOURDHUI).joursRestants).toBe(-3)
  })
})

describe('echeance — la DDM', () => {
  it('ne marque pas sanitaire une date de durabilité minimale', () => {
    // Dépassée, le produit reste consommable : l'écran doit dire « moins bon »
    // et non « à jeter ».
    const riz = article({ rayon: 'Épicerie', emplacement: 'placard', ddm: '2026-07-20' })
    expect(echeance(riz, AUJOURDHUI)).toMatchObject({
      urgence: 'perime',
      sanitaire: false,
      origine: 'ddm',
    })
  })

  it('cède la place à une date sanitaire, même plus lointaine', () => {
    // C'est la règle centrale : une DDM proche ne doit pas masquer la DLC, ni
    // l'inverse. La date retenue est la sanitaire, parce qu'elle ne parle pas du
    // même risque.
    const article1 = article({ dlc: '2026-08-10', ddm: '2026-08-02' })
    expect(echeance(article1, AUJOURDHUI)).toMatchObject({
      date: '2026-08-10',
      sanitaire: true,
      origine: 'dlc',
    })
  })
})

describe('echeance — le produit entamé', () => {
  it('avance une DLC lointaine sur un produit ouvert', () => {
    // Une brique de lait ouverte le 30 avec une DLC au 20 n'est pas bonne
    // jusqu'au 20 : c'est le cas où se fier à la date imprimée rend malade.
    const lait = article({ rayon: 'Crèmerie', dlc: '2026-08-20', ouvertLe: '2026-07-30' })
    expect(echeance(lait, AUJOURDHUI)).toMatchObject({
      date: '2026-08-03', // 30/07 + 4 jours
      sanitaire: true,
      origine: 'ouverture',
    })
  })

  it('n’a jamais le droit de reculer une DLC', () => {
    // L'ouverture peut rapprocher l'échéance, jamais l'éloigner : un produit
    // dont la DLC est dépassée reste dépassé, même ouvert hier.
    const viande = article({
      rayon: 'Boucherie, poissonnerie',
      dlc: '2026-07-28',
      ouvertLe: '2026-07-31',
    })
    expect(echeance(viande, AUJOURDHUI)).toMatchObject({
      date: '2026-07-28',
      origine: 'dlc',
      urgence: 'perime',
    })
  })

  it('applique un délai plus court à la viande qu’à l’épicerie', () => {
    const ouvertLe = '2026-07-30'
    const viande = echeance(
      article({ rayon: 'Boucherie, poissonnerie', ouvertLe }),
      AUJOURDHUI,
    )
    const epicerie = echeance(article({ rayon: 'Épicerie', ouvertLe }), AUJOURDHUI)
    expect(viande.joursRestants).toBeLessThan(epicerie.joursRestants ?? 0)
  })

  it('couvre tous les rayons, sans trou qui produirait une date invalide', () => {
    // Une table `Record<Rayon, …>` incomplète donnerait `undefined` jours, donc
    // une date « Invalid Date » affichée telle quelle.
    for (const rayon of RAYONS) {
      const e = echeance(article({ rayon, ouvertLe: '2026-07-30' }), AUJOURDHUI)
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isFinite(e.joursRestants)).toBe(true)
    }
  })
})

describe('echeance — le congélateur', () => {
  it('parle de goût et non de sécurité', () => {
    // Un aliment congelé reste sain bien au-delà : ce qui se dégrade, c'est la
    // texture. Annoncer « périmé » ferait jeter ce qu'on prétend sauver.
    const steak = article({
      rayon: 'Boucherie, poissonnerie',
      emplacement: 'congelateur',
      congeleLe: '2025-12-01',
    })
    expect(echeance(steak, AUJOURDHUI)).toMatchObject({
      sanitaire: false,
      origine: 'congelation',
    })
  })

  it('accorde douze mois aux légumes et six à la viande', () => {
    const congeleLe = '2026-06-01'
    const legumes = echeance(
      article({ rayon: 'Fruits et légumes', emplacement: 'congelateur', congeleLe }),
      AUJOURDHUI,
    )
    const viande = echeance(
      article({ rayon: 'Boucherie, poissonnerie', emplacement: 'congelateur', congeleLe }),
      AUJOURDHUI,
    )
    expect(legumes.date).toBe('2027-06-01')
    expect(viande.date).toBe('2026-12-01')
  })

  it('couvre tous les rayons au congélateur aussi', () => {
    for (const rayon of RAYONS) {
      const e = echeance(
        article({ rayon, emplacement: 'congelateur', congeleLe: '2026-06-01' }),
        AUJOURDHUI,
      )
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('echeance — sans aucune date', () => {
  it('n’invente rien et n’alerte pas', () => {
    // Le retour de courses n'invente aucune date limite : les articles entrent
    // au garde-manger sans DLC ni DDM, et l'écran le dit.
    expect(echeance(article(), AUJOURDHUI)).toEqual({
      date: null,
      urgence: 'ok',
      joursRestants: null,
      sanitaire: false,
      origine: null,
    })
  })
})

describe('articlesUrgents', () => {
  it('remonte le plus pressant en premier et écarte ce qui ne presse pas', () => {
    const stocks = [
      article({ nom: 'Yaourt', dlc: '2026-08-06' }),
      article({ nom: 'Poulet', dlc: '2026-07-30' }),
      article({ nom: 'Conserve', rayon: 'Épicerie', dlc: '2027-01-01' }),
      article({ nom: 'Fromage', dlc: '2026-08-01' }),
    ]
    expect(articlesUrgents(stocks, AUJOURDHUI).map((u) => u.article.nom)).toEqual([
      'Poulet',
      'Fromage',
      'Yaourt',
    ])
  })

  it('ne remonte pas un article sans date', () => {
    expect(articlesUrgents([article()], AUJOURDHUI)).toEqual([])
  })
})

describe('stocksDe', () => {
  it('ne rend que l’emplacement demandé', () => {
    const stocks: ArticleStock[] = [
      article({ nom: 'Lait', emplacement: 'frigo' }),
      article({ nom: 'Riz', emplacement: 'placard', rayon: 'Épicerie' }),
      article({ nom: 'Petits pois', emplacement: 'congelateur', rayon: 'Surgelés' }),
    ]
    for (const [emplacement, attendu] of [
      ['frigo', ['Lait']],
      ['placard', ['Riz']],
      ['congelateur', ['Petits pois']],
    ] as [Emplacement, string[]][]) {
      expect(stocksDe(stocks, emplacement).map((a) => a.nom)).toEqual(attendu)
    }
  })

  it('range les articles sans date après ceux qui en ont une', () => {
    // Un article sans date n'est pas urgent : le faire remonter en tête, comme
    // le ferait un zéro, noierait les vraies échéances.
    const stocks = [
      article({ nom: 'Sans date' }),
      article({ nom: 'Périmé', dlc: '2026-07-25' }),
      article({ nom: 'Bientôt', dlc: '2026-08-03' }),
    ]
    expect(stocksDe(stocks, 'frigo').map((a) => a.nom)).toEqual(['Périmé', 'Bientôt', 'Sans date'])
  })
})

describe('bilanStock', () => {
  it('sépare ce qui est à finir de ce qui est déjà dépassé', () => {
    const stocks = [
      article({ nom: 'Périmé', dlc: '2026-07-25' }),
      article({ nom: 'À finir', dlc: '2026-08-02' }),
      article({ nom: 'Tranquille', dlc: '2026-12-01' }),
      article({ nom: 'Placard', emplacement: 'placard', rayon: 'Épicerie' }),
      article({ nom: 'Congelé', emplacement: 'congelateur', rayon: 'Surgelés' }),
    ]
    expect(bilanStock(stocks, AUJOURDHUI)).toEqual({
      total: 5,
      parEmplacement: { frigo: 3, placard: 1, congelateur: 1 },
      aFinir: 1,
      perimes: 1,
    })
  })

  it('rend un bilan à zéro sur un garde-manger vide', () => {
    expect(bilanStock([], AUJOURDHUI)).toEqual({
      total: 0,
      parEmplacement: { frigo: 0, placard: 0, congelateur: 0 },
      aFinir: 0,
      perimes: 0,
    })
  })
})

describe('le cas qui mérite une décision de Yann', () => {
  it('traite comme sanitaire l’ouverture d’un produit d’épicerie', () => {
    // **Ce test fixe le comportement actuel, il ne le valide pas.**
    //
    // `ouvertLe` produit toujours une échéance `sanitaire: true`, quel que soit
    // le rayon. Sur une brique de lait, c'est exactement la règle qui protège.
    // Sur un pot de moutarde ou un paquet de pâtes — rayon Épicerie, 7 jours —
    // l'écran annonce « à jeter » sur un produit qui se garde des mois.
    //
    // Le module met lui-même en garde contre cet effet : « sinon on fait jeter
    // ce qu'on prétend sauver ». Et une alerte sanitaire qui se déclenche sur
    // des pâtes apprend à ignorer les alertes sanitaires, ce qui coûte le jour
    // où c'est du poulet.
    //
    // La correction demanderait de décider quels rayons sont sanitaires à
    // l'ouverture (crèmerie, boucherie, surgelés décongelés, fruits et légumes
    // coupés) et lesquels ne le sont que pour le goût. C'est un arbitrage de
    // sécurité alimentaire : il se tranche avec Yann, pas dans un test.
    const moutarde = article({
      nom: 'Moutarde',
      rayon: 'Épicerie',
      emplacement: 'placard',
      ddm: '2027-06-01',
      ouvertLe: '2026-07-20',
    })
    const e = echeance(moutarde, AUJOURDHUI)
    expect(e.origine).toBe('ouverture')
    expect(e.sanitaire).toBe(true)
    expect(e.urgence).toBe('perime')
  })
})
