import { describe, expect, it } from 'vitest'
import {
  difficulteDe,
  goutsDe,
  ingredientsPour,
  macrosPortion,
  occasionsDe,
  regimesAAfficher,
  regimesDe,
  respecte,
  typePlatDe,
} from './catalogue'
import { catalogue, RECETTES } from './recettes'
import type { Recette } from './recettes'

/**
 * Ce fichier protège une frontière, et une seule vaut qu'on insiste : **aucun
 * régime ne se déduit des ingrédients**.
 *
 * Le catalogue compte 7 608 recettes dont l'immense majorité est composée par un
 * générateur. Les axes de classement — forme du plat, profil de goût, occasion —
 * se déduisent, et c'est nécessaire : sans déduction, les filtres ne montreraient
 * que les 129 recettes écrites à la main et cacheraient l'essentiel.
 *
 * Les régimes, non. Se tromper de forme de plat propose un gratin à quelqu'un qui
 * cherchait une poêlée ; se tromper de régime envoie du gluten à une personne
 * cœliaque. Le premier est une contrariété, le second un risque sanitaire — et
 * c'est la sorte de règle qu'une refactorisation bien intentionnée défait sans
 * s'en apercevoir, en « améliorant » une déduction.
 *
 * Le premier test parcourt donc le catalogue entier, et pas un échantillon.
 */

const auHasardMaisStable = (n: number) => catalogue().filter((_, i) => i % n === 0)

describe('les régimes ne se déduisent jamais des ingrédients', () => {
  it('n’accorde « sans gluten » ou « sans lactose » qu’aux recettes qui le déclarent', () => {
    // La seule source qui fasse foi est le champ `regimes`, écrit à la main.
    // Ce contrôle passe sur les 7 608 recettes : une déduction ajoutée un jour
    // « pour rendre service » échouerait ici, en nommant la recette.
    const fautives: string[] = []
    for (const recette of catalogue()) {
      const declares = new Set(recette.regimes ?? [])
      for (const regime of regimesDe(recette)) {
        if (regime === 'vegetarien') continue // seule déduction tolérée, voir plus bas
        if (!declares.has(regime)) {
          fautives.push(`${recette.id} — « ${regime} » non déclaré`)
        }
      }
    }
    expect(fautives.slice(0, 10)).toEqual([])
  })

  it('ne déduit « végétarien » que du tag existant ou de « végétalien »', () => {
    // Cette déduction-là ne porte aucun risque : se tromper propose un plat de
    // trop, ça ne rend personne malade.
    const fautives: string[] = []
    for (const recette of catalogue()) {
      if (!regimesDe(recette).includes('vegetarien')) continue
      const legitime =
        recette.regimes?.includes('vegetarien') ||
        recette.regimes?.includes('vegan') ||
        recette.tags.includes('vegetarien')
      if (!legitime) fautives.push(recette.id)
    }
    expect(fautives.slice(0, 10)).toEqual([])
  })

  it('fait suivre « végétalien » de « végétarien » dans les filtres', () => {
    // Sans cette implication, un chili de haricots rouges disparaîtrait d'un
    // filtre végétarien.
    const vegan = { ...RECETTES[0], regimes: ['vegan'] as const, tags: [] } as unknown as Recette
    expect(regimesDe(vegan)).toContain('vegetarien')
    expect(respecte(vegan, 'vegetarien')).toBe(true)
  })

  it('n’affiche pas les deux à la fois', () => {
    // Afficher « végétalien » et « végétarien » prend une ligne pour ne rien
    // dire de plus. La déduction reste entière côté filtre.
    const vegan = { ...RECETTES[0], regimes: ['vegan'] as const, tags: [] } as unknown as Recette
    expect(regimesAAfficher(vegan)).toContain('vegan')
    expect(regimesAAfficher(vegan)).not.toContain('vegetarien')
  })

  it('traite l’absence d’information comme un refus', () => {
    // Mieux vaut cacher un plat qui aurait convenu que d'en proposer un qui ne
    // convient pas.
    const muette = { ...RECETTES[0], regimes: undefined, tags: [] } as unknown as Recette
    expect(respecte(muette, 'sans-gluten')).toBe(false)
    expect(respecte(muette, 'sans-lactose')).toBe(false)
    expect(respecte(muette, 'vegetarien')).toBe(false)
  })

  it('rend les régimes dans un ordre fixe', () => {
    // Sans ordre, l'affichage suit l'ordre de saisie et « végétarien », ajouté
    // par déduction, se retrouve en queue derrière « sans lactose ».
    const recette = {
      ...RECETTES[0],
      regimes: ['sans-lactose', 'vegan'] as const,
      tags: [],
    } as unknown as Recette
    expect(regimesDe(recette)).toEqual(['vegetarien', 'vegan', 'sans-lactose'])
  })
})

describe('les déductions autorisées', () => {
  it('laisse toujours primer le champ écrit à la main', () => {
    // La règle vaut pour la difficulté, la forme, les goûts et les occasions :
    // la déduction ne sert qu'à l'absence.
    const base = RECETTES.find((r) => r.titre.length > 0) as Recette
    expect(difficulteDe({ ...base, difficulte: 'technique' })).toBe('technique')
    expect(typePlatDe({ ...base, typePlat: 'soupe' })).toBe('soupe')
    expect(goutsDe({ ...base, gouts: ['acidule'] })).toEqual(['acidule'])
  })

  it('lit la forme du plat dans le titre, jamais dans les ingrédients', () => {
    // Le titre dit ce qu'est le plat, les ingrédients ne disent que sa matière.
    // C'est la leçon des pictogrammes, où piocher dans les ingrédients avait
    // donné un poisson à un chili végétarien.
    const base = RECETTES[0]
    const gratin = {
      ...base,
      titre: 'Gratin de courgettes',
      typePlat: undefined,
      ingredients: [{ nom: 'Filet de cabillaud', quantite: '150 g', rayon: 'Épicerie' }],
    } as unknown as Recette
    expect(typePlatDe(gratin)).toBe('gratin')

    const sansForme = {
      ...base,
      titre: 'Quelque chose',
      typePlat: undefined,
      ingredients: [{ nom: 'Soupe en brique', quantite: '1', rayon: 'Épicerie' }],
    } as unknown as Recette
    expect(typePlatDe(sansForme)).toBeNull()
  })

  it('distingue « facile » de « rapide »', () => {
    // « Facile » veut dire peu de gestes, pas rapide. Un riz au lait demande
    // trente minutes et trois gestes : facile et lent.
    const base = RECETTES[0]
    const facileEtLent = {
      ...base,
      difficulte: undefined,
      etapes: ['a', 'b', 'c'],
      minutes: 15,
    } as unknown as Recette
    const technique = {
      ...base,
      difficulte: undefined,
      etapes: ['a', 'b', 'c', 'd', 'e', 'f'],
      minutes: 15,
    } as unknown as Recette
    expect(difficulteDe(facileEtLent)).toBe('facile')
    expect(difficulteDe(technique)).toBe('technique')
  })

  it('ne remplit l’occasion que depuis des étiquettes écrites à la main', () => {
    // Le dimanche, la fête et le réconfort relèvent du jugement. Les deviner
    // remplirait l'étiquette partout et la viderait de son sens.
    const base = RECETTES[0]
    const nomade = { ...base, occasions: undefined, tags: ['nomade'] } as unknown as Recette
    expect(occasionsDe(nomade)).toEqual(['pique-nique'])

    const muette = { ...base, occasions: undefined, tags: [] } as unknown as Recette
    expect(occasionsDe(muette)).toEqual([])
  })

  it('ne déduit aucun goût pour une cuisine qui n’en porte pas', () => {
    const base = RECETTES[0]
    const indienne = { ...base, gouts: undefined, cuisine: 'indienne' } as unknown as Recette
    expect(goutsDe(indienne)).toContain('epice')
  })
})

describe('ingredientsPour — un calcul d’affichage', () => {
  const recette = RECETTES.find((r) => r.ingredients.length > 1) as Recette

  it('ne touche à rien pour une personne', () => {
    expect(ingredientsPour(recette, 1)).toBe(recette.ingredients)
  })

  it('multiplie les quantités sans altérer les noms', () => {
    const pourQuatre = ingredientsPour(recette, 4)
    expect(pourQuatre).toHaveLength(recette.ingredients.length)
    expect(pourQuatre.map((i) => i.nom)).toEqual(recette.ingredients.map((i) => i.nom))
  })

  it('ne modifie jamais la recette d’origine', () => {
    // Le catalogue est mémoïsé et partagé : muter un ingrédient ici le
    // changerait pour tout le monde, définitivement, dans la même session.
    const avant = recette.ingredients.map((i) => i.quantite)
    ingredientsPour(recette, 4)
    expect(recette.ingredients.map((i) => i.quantite)).toEqual(avant)
  })

  it('laisse `kcal` inchangé — c’est ce que mange une personne', () => {
    // Multiplier les quantités est un calcul d'affichage. L'écran doit dire
    // « par personne » pour que le chiffre garde son sens.
    const kcal = recette.kcal
    ingredientsPour(recette, 4)
    expect(recette.kcal).toBe(kcal)
  })
})

describe('macrosPortion — une estimation, sur tout le catalogue', () => {
  it('ne produit jamais de valeur absurde', () => {
    // Ces chiffres s'affichent sous une fiche de recette : un NaN ou un négatif
    // y passerait pour une donnée.
    const fautives: string[] = []
    for (const recette of auHasardMaisStable(53)) {
      const macros = macrosPortion(recette)
      for (const [nom, valeur] of Object.entries(macros)) {
        if (!Number.isFinite(valeur) || valeur < 0) {
          fautives.push(`${recette.id} — ${nom} = ${valeur}`)
        }
      }
    }
    expect(fautives.slice(0, 10)).toEqual([])
  })

  it('donne un poids de portion vraisemblable', () => {
    // Écrire « 100 g » devant une assiette complète serait faux ; « 3 kg » aussi.
    for (const recette of auHasardMaisStable(53)) {
      const { poidsG } = macrosPortion(recette)
      expect(poidsG).toBeGreaterThanOrEqual(80)
      expect(poidsG).toBeLessThanOrEqual(700)
    }
  })
})
