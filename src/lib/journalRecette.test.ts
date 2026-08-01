import { describe, expect, it } from 'vitest'
import {
  alimentDeLaRecette,
  entreeDeLaRecette,
  portionDeLaRecette,
  valeursDeLaRecette,
} from './journalRecette'
import { catalogue, RECETTES } from './recettes'
import { apportDe } from './journal'

/**
 * Verser une recette au journal est le geste qui relie les deux moitiés du
 * produit — le catalogue et le suivi. Il repose sur une estimation, et **c'est
 * la nature de cette estimation qu'il faut protéger**.
 *
 * Le catalogue ne connaît que les calories. Les macros sont déduites d'une
 * répartition type, à partir de ce que la recette déclare couvrir dans
 * l'assiette. C'est mieux que l'alternative — enregistrer un plat à 500 kcal
 * avec zéro gramme de protéines fausserait silencieusement les barres de macros
 * et les analyses du jour — mais ça reste une déduction.
 *
 * D'où la règle centrale, testée en premier : **aucun Nutri-Score n'est calculé
 * pour ces entrées**. Une note de qualité assise sur des macros elles-mêmes
 * estimées se donnerait une autorité qu'elle n'a pas.
 */

const echantillon = catalogue().filter((_, i) => i % 101 === 0)

describe('la règle centrale — pas de note sur une estimation', () => {
  it('ne pose jamais de Nutri-Score sur un aliment issu d’une recette', () => {
    // Une pastille sur une estimation d'estimation ferait passer un calcul pour
    // une mesure. L'écran affiche les macros en les annonçant estimées ; il
    // n'affiche pas de note.
    const fautives: string[] = []
    for (const recette of echantillon) {
      const aliment = alimentDeLaRecette(recette)
      if (aliment.nutriScore !== undefined) fautives.push(`${recette.id} → ${aliment.nutriScore}`)
    }
    expect(fautives.slice(0, 10)).toEqual([])
  })

  it('marque la provenance de l’aliment', () => {
    // `source: 'recette'` est ce qui permet à l'écran de dire d'où viennent ces
    // chiffres — et de ne pas les confondre avec une étiquette lue au scanner.
    const aliment = alimentDeLaRecette(RECETTES[0])
    expect(aliment.source).toBe('recette')
    expect(aliment.id).toBe(`recette:${RECETTES[0].id}`)
  })
})

describe('portionDeLaRecette', () => {
  it('reste dans des poids d’assiette vraisemblables', () => {
    // Écrire « 100 g » devant une assiette complète serait faux, « 2 kg » aussi.
    for (const recette of echantillon) {
      const portion = portionDeLaRecette(recette)
      expect(portion, recette.id).toBeGreaterThanOrEqual(80)
      expect(portion, recette.id).toBeLessThanOrEqual(700)
    }
  })

  it('donne une collation plus dense qu’un déjeuner à calories égales', () => {
    // Un plat avec des légumes est moins dense qu'un en-cas : à 300 kcal, la
    // collation pèse moins lourd dans l'assiette.
    const base = RECETTES[0]
    const collation = { ...base, kcal: 300, moment: 'collation' as const }
    const dejeuner = { ...base, kcal: 300, moment: 'dejeuner' as const }
    expect(portionDeLaRecette(collation)).toBeLessThan(portionDeLaRecette(dejeuner))
  })

  it('arrondit à la dizaine', () => {
    // Un poids estimé affiché à l'unité près se lirait comme une pesée.
    for (const recette of echantillon) {
      expect(portionDeLaRecette(recette) % 10).toBe(0)
    }
  })
})

describe('valeursDeLaRecette', () => {
  it('ne produit jamais de valeur absurde, sur tout l’échantillon', () => {
    const fautives: string[] = []
    for (const recette of echantillon) {
      for (const [nom, valeur] of Object.entries(valeursDeLaRecette(recette))) {
        if (!Number.isFinite(valeur) || valeur < 0) fautives.push(`${recette.id} — ${nom}=${valeur}`)
      }
    }
    expect(fautives.slice(0, 10)).toEqual([])
  })

  it('fait retomber les macros sur les calories annoncées', () => {
    // 4 kcal par gramme de protéine et de glucide, 9 par gramme de lipide.
    // Si la somme s'écartait franchement de `kcal`, les barres de macros
    // raconteraient autre chose que la jauge d'énergie, sur le même écran.
    const ecarts: string[] = []
    for (const recette of echantillon) {
      const v = valeursDeLaRecette(recette)
      const reconstitue = v.proteines * 4 + v.glucides * 4 + v.lipides * 9
      const ecart = Math.abs(reconstitue - v.kcal) / Math.max(1, v.kcal)
      if (ecart > 0.12) {
        ecarts.push(`${recette.id} — ${Math.round(ecart * 100)} % d’écart`)
      }
    }
    expect(ecarts.slice(0, 10)).toEqual([])
  })

  it('ne déclare jamais plus de sucres que de glucides', () => {
    // Les sucres sont une part des glucides : l'inverse est arithmétiquement
    // impossible et ferait un Nutri-Score faux là où il est calculé.
    for (const recette of echantillon) {
      const v = valeursDeLaRecette(recette)
      expect(v.sucres, recette.id).toBeLessThanOrEqual(v.glucides + 0.1)
    }
  })

  it('ne déclare jamais plus de saturés que de lipides', () => {
    for (const recette of echantillon) {
      const v = valeursDeLaRecette(recette)
      expect(v.satures, recette.id).toBeLessThanOrEqual(v.lipides + 0.1)
    }
  })

  it('donne plus de sucres à un dessert de fruits qu’à un plat de légumes', () => {
    const base = RECETTES[0]
    const fruits = { ...base, couvre: ['fruit' as const] }
    const legumes = { ...base, couvre: ['legume' as const] }
    expect(valeursDeLaRecette(fruits).sucres).toBeGreaterThan(valeursDeLaRecette(legumes).sucres)
  })

  it('sale davantage un repas salé qu’un petit déjeuner', () => {
    const base = RECETTES[0]
    const diner = { ...base, moment: 'diner' as const }
    const matin = { ...base, moment: 'petit-dejeuner' as const }
    expect(valeursDeLaRecette(diner).sel).toBeGreaterThan(valeursDeLaRecette(matin).sel)
  })

  it('tient debout même pour une recette qui ne couvre rien', () => {
    const orpheline = { ...RECETTES[0], couvre: [] }
    const v = valeursDeLaRecette(orpheline)
    expect(Number.isFinite(v.proteines)).toBe(true)
    expect(v.proteines).toBeGreaterThan(0)
  })
})

describe('entreeDeLaRecette', () => {
  const recette = RECETTES[0]

  it('retrouve les calories de la recette une fois versée au journal', () => {
    // C'est la seule chose qui compte vraiment pour l'utilisateur : le plat
    // annoncé à 420 kcal doit peser 420 kcal dans sa journée.
    //
    // La tolérance est relative et non absolue : `valeursDeLaRecette` arrondit
    // les calories à l'entier **pour 100 g**, et la portion à la dizaine de
    // grammes. Sur une assiette de 200 g, ce double arrondi vaut jusqu'à deux
    // kilocalories, ce qui n'intéresse personne. Ce qu'il faut attraper, c'est
    // une confusion d'unité — une portion comptée par erreur pour 100 g, ou un
    // facteur deux — et 1 % la laisse voir sans broncher sur une décimale.
    const entree = entreeDeLaRecette(recette, { date: '2026-08-01' })
    const ecart = Math.abs(apportDe(entree).kcal - recette.kcal) / recette.kcal
    expect(ecart).toBeLessThan(0.01)
  })

  it('retrouve les calories de chaque recette de l’échantillon', () => {
    const derives: string[] = []
    for (const r of echantillon) {
      const kcal = apportDe(entreeDeLaRecette(r, { date: '2026-08-01' })).kcal
      const ecart = Math.abs(kcal - r.kcal) / r.kcal
      if (ecart > 0.01) derives.push(`${r.id} — ${r.kcal} kcal devenus ${Math.round(kcal)}`)
    }
    expect(derives.slice(0, 10)).toEqual([])
  })

  it('prend le moment de la recette par défaut, sans l’imposer', () => {
    // Rien n'empêche de manger une soupe au petit déjeuner.
    expect(entreeDeLaRecette(recette, { date: '2026-08-01' }).moment).toBe(recette.moment)
    expect(
      entreeDeLaRecette(recette, { date: '2026-08-01', moment: 'collation' }).moment,
    ).toBe('collation')
  })

  it('laisse corriger la part avant d’enregistrer', () => {
    // La fiche propose la portion estimée ; l'écran permet de la reprendre.
    const demie = entreeDeLaRecette(recette, {
      date: '2026-08-01',
      quantiteG: portionDeLaRecette(recette) / 2,
    })
    const ecart = Math.abs(apportDe(demie).kcal - recette.kcal / 2) / (recette.kcal / 2)
    expect(ecart).toBeLessThan(0.01)
  })

  it('horodate et date correctement', () => {
    const entree = entreeDeLaRecette(recette, { date: '2026-08-01' })
    expect(entree.date).toBe('2026-08-01')
    expect(entree.horodatage).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('donne un identifiant distinct à deux versements de la même recette', () => {
    // Deux parts du même plat dans la journée sont deux entrées : un identifiant
    // partagé en fait disparaître une à la première suppression, et fait doublon
    // de clé de rendu entre-temps.
    //
    // L'identifiant était `entree:${Date.now()}:${recette.id}`, et l'horloge a
    // une résolution d'une milliseconde : un double-appui sur le bouton suffisait
    // à produire deux entrées indiscernables. Cent appels d'affilée le
    // reproduisent à coup sûr.
    const ids = Array.from(
      { length: 100 },
      () => entreeDeLaRecette(recette, { date: '2026-08-01' }).id,
    )
    expect(new Set(ids).size).toBe(100)
  })
})
