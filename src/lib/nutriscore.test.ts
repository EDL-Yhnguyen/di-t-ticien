import { describe, expect, it } from 'vitest'
import {
  avecNutriScore,
  bandePour,
  calculerNutriScore,
  indiceEquilibre,
  valeurNutri,
} from './nutriscore'
import type { Aliment, ValeursPour100 } from './types'

/**
 * Le Nutri-Score que nous calculons est un **repli** : la note d'Open Food Facts
 * fait foi quand elle existe. Ce barème ne sert que pour les aliments saisis et
 * les recettes, et tout ce qu'il produit s'affiche marqué « estimé ».
 *
 * Ce qui est vérifié ici, ce n'est donc pas « la note est juste » — le barème
 * 2023 est ce qu'il est — mais que le calcul reste celui qui a été écrit :
 * quatre barèmes distincts (général, boisson, matière grasse, fromage) qui se
 * ressemblent assez pour qu'une modification de l'un abîme un autre sans qu'on
 * s'en aperçoive.
 */

const RIEN: ValeursPour100 = {
  kcal: 0,
  proteines: 0,
  glucides: 0,
  sucres: 0,
  lipides: 0,
  satures: 0,
  fibres: 0,
  sel: 0,
}

const valeurs = (partiel: Partial<ValeursPour100>): ValeursPour100 => ({ ...RIEN, ...partiel })

describe('calculerNutriScore — barème général', () => {
  it('note A un légume', () => {
    const brocoli = valeurs({ kcal: 34, proteines: 2.8, glucides: 7, sucres: 1.7, fibres: 2.6, sel: 0.03 })
    expect(calculerNutriScore(brocoli, 'general', 100)).toBe('A')
  })

  it('note E une barre chocolatée', () => {
    const barre = valeurs({
      kcal: 500,
      proteines: 5,
      glucides: 60,
      sucres: 55,
      lipides: 26,
      satures: 15,
      fibres: 1,
      sel: 0.3,
    })
    expect(calculerNutriScore(barre)).toBe('E')
  })

  it('cesse de compter les protéines au-delà de 11 points négatifs', () => {
    // Sans ce plafond, une charcuterie très salée remonterait grâce à ses
    // protéines — ce qui est exactement le produit que le barème doit signaler.
    const charcuterie = valeurs({
      kcal: 330,
      proteines: 25,
      glucides: 1,
      sucres: 1,
      lipides: 26,
      satures: 10,
      sel: 4.5,
    })
    expect(calculerNutriScore(charcuterie)).toBe('E')
  })

  it('laisse les fromages échapper au plafond, comme le prévoit le barème', () => {
    const comte = valeurs({
      kcal: 410,
      proteines: 27,
      glucides: 1,
      sucres: 1,
      lipides: 33,
      satures: 21,
      sel: 1.6,
    })
    expect(calculerNutriScore(comte, 'fromage')).not.toBe(calculerNutriScore(comte, 'general'))
  })
})

describe('calculerNutriScore — les barèmes particuliers', () => {
  it('réserve le A à l’eau parmi les boissons', () => {
    expect(calculerNutriScore(RIEN, 'boisson')).toBe('A')
    const sodaLight = valeurs({ kcal: 1, sucres: 0.2 })
    expect(calculerNutriScore(sodaLight, 'boisson')).not.toBe('A')
  })

  it('note un soda sucré en bas d’échelle', () => {
    const soda = valeurs({ kcal: 42, glucides: 10.6, sucres: 10.6 })
    expect(['D', 'E']).toContain(calculerNutriScore(soda, 'boisson'))
  })

  it('distingue les matières grasses entre elles au lieu de toutes les caler au fond', () => {
    // Sur le barème général, l'huile d'olive et le beurre finissent tous deux
    // en E : l'énergie et les saturés sont ramenés à la part de lipides pour
    // que le choix entre deux gras veuille encore dire quelque chose.
    const huileOlive = valeurs({ kcal: 900, lipides: 100, satures: 14 })
    const beurre = valeurs({ kcal: 750, lipides: 83, satures: 54, sel: 0.1 })
    const noteHuile = calculerNutriScore(huileOlive, 'matiere-grasse')
    const noteBeurre = calculerNutriScore(beurre, 'matiere-grasse')
    expect(valeurNutri(noteHuile)).toBeGreaterThan(valeurNutri(noteBeurre))
  })
})

describe('avecNutriScore', () => {
  const base: Aliment = {
    id: 'essai',
    nom: 'Essai',
    famille: 'general',
    valeurs: valeurs({ kcal: 100, proteines: 5, glucides: 10, fibres: 2 }),
    source: 'manuel',
  }

  it('ne recalcule jamais par-dessus une note déclarée', () => {
    // Une note d'Open Food Facts vient du fabricant : elle fait foi, et la
    // remplacer par la nôtre lui donnerait une autorité qu'elle n'a pas.
    const declare: Aliment = { ...base, nutriScore: 'E' }
    expect(avecNutriScore(declare)).toBe(declare)
  })

  it('marque « estimé » ce qu’il calcule', () => {
    const complete = avecNutriScore(base)
    expect(complete.nutriScore).toBeDefined()
    expect(complete.nutriScoreEstime).toBe(true)
  })
})

describe('valeurNutri', () => {
  it('classe A au-dessus de E', () => {
    expect(valeurNutri('A')).toBe(4)
    expect(valeurNutri('E')).toBe(0)
  })

  it('place une note absente au milieu, sans avantager ni pénaliser', () => {
    expect(valeurNutri(undefined)).toBe(2)
  })
})

describe('indiceEquilibre', () => {
  it('monte avec les calories et descend avec les protéines', () => {
    const gateau = valeurs({ kcal: 400, sucres: 40, lipides: 20, satures: 12 })
    const blancDePoulet = valeurs({ kcal: 110, proteines: 23, lipides: 1.5 })
    expect(indiceEquilibre(gateau, 100)).toBeGreaterThan(indiceEquilibre(blancDePoulet, 100))
  })

  it('ne descend jamais sous zéro', () => {
    // Des points négatifs se retrancheraient du total de la journée : un blanc
    // d'œuf rembourserait une part de gâteau.
    const blancDoeuf = valeurs({ kcal: 48, proteines: 11, fibres: 0 })
    expect(indiceEquilibre(blancDoeuf, 100)).toBeGreaterThanOrEqual(0)
  })

  it('suit la quantité', () => {
    const pain = valeurs({ kcal: 265, proteines: 9, glucides: 49, sucres: 3, fibres: 2.7, sel: 1.2 })
    expect(indiceEquilibre(pain, 200)).toBeCloseTo(indiceEquilibre(pain, 100) * 2, 0)
  })
})

describe('bandePour', () => {
  it('situe le plat par rapport au repas visé, pas dans l’absolu', () => {
    // 500 kcal n'est pas la même chose pour deux profils : c'est pourquoi la
    // bande se calcule et n'est jamais figée dans le catalogue.
    expect(bandePour(500, 900)).toBe('vert')
    expect(bandePour(500, 500)).toBe('bleu')
    expect(bandePour(500, 300)).toBe('orange')
  })

  it('reste neutre quand la cible n’est pas connue', () => {
    expect(bandePour(500, 0)).toBe('bleu')
  })
})
