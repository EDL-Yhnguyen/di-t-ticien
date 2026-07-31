import { describe, expect, it } from 'vitest'
import {
  bilanParRepas,
  cibleDuRepas,
  objectifsMacros,
  PART_MOMENT,
  qualiteMoyenne,
  serieDeJours,
  topFlopDuJour,
  totalDuJour,
} from './journal'
import { MOMENTS } from './types'
import type { Aliment, EntreeJournal, Moment, NutriScore, ValeursPour100 } from './types'
import { ilYAJours, jourISO } from './utils'

/**
 * Le journal ne stocke rien, il calcule : la mosaïque, les jauges, le top/flop
 * et les recommandations du coach en découlent tous. Une erreur de calcul y
 * produit un écran plausible, jamais une panne — c'est ce qui la rend difficile
 * à voir et coûteuse à laisser passer.
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

function aliment(nom: string, kcal: number, note?: NutriScore): Aliment {
  return {
    id: nom,
    nom,
    famille: 'general',
    valeurs: { ...RIEN, kcal, proteines: 5, glucides: 10 },
    nutriScore: note,
    source: 'manuel',
  }
}

let compteur = 0
function entree(
  nom: string,
  kcal: number,
  quantiteG: number,
  moment: Moment = 'dejeuner',
  date = jourISO(),
  note?: NutriScore,
): EntreeJournal {
  compteur += 1
  return {
    id: `e${compteur}`,
    date,
    moment,
    horodatage: `2026-07-31T${String(compteur).padStart(2, '0')}:00:00.000Z`,
    aliment: aliment(nom, kcal, note),
    quantiteG,
  }
}

describe('totalDuJour', () => {
  it('met les valeurs à l’échelle de la quantité', () => {
    // Les valeurs sont pour 100 g — l'unité de tous les étiquetages européens.
    const journal = [entree('Riz', 130, 200), entree('Poulet', 110, 150)]
    expect(totalDuJour(journal).kcal).toBeCloseTo(130 * 2 + 110 * 1.5, 6)
  })

  it('ne compte que le jour demandé', () => {
    const journal = [entree('Aujourd’hui', 100, 100), entree('Hier', 900, 100, 'diner', ilYAJours(1))]
    expect(totalDuJour(journal).kcal).toBeCloseTo(100, 6)
  })

  it('rend un total à zéro plutôt que rien sur une journée vide', () => {
    // L'écran doit pouvoir afficher « 0 kcal » : un `undefined` remonterait en
    // « NaN kcal » dans la jauge.
    expect(totalDuJour([]).kcal).toBe(0)
  })
})

describe('bilanParRepas', () => {
  it('rend les quatre moments, même vides', () => {
    // `Moment` compte « collation » depuis le journal alimentaire : toute table
    // `Record<Moment, …>` doit avoir ses quatre clés, et l'écran affiche les
    // repas non notés plutôt que de les faire disparaître.
    const bilan = bilanParRepas([entree('Riz', 130, 200)])
    expect(bilan.map((b) => b.moment)).toEqual(MOMENTS)
    expect(bilan).toHaveLength(4)
  })

  it('range chaque entrée sous son moment', () => {
    const journal = [
      entree('Tartine', 250, 80, 'petit-dejeuner'),
      entree('Riz', 130, 200, 'dejeuner'),
      entree('Pomme', 52, 150, 'collation'),
    ]
    const parMoment = Object.fromEntries(bilanParRepas(journal).map((b) => [b.moment, b.entrees.length]))
    expect(parMoment).toEqual({
      'petit-dejeuner': 1,
      dejeuner: 1,
      collation: 1,
      diner: 0,
    })
  })
})

describe('qualiteMoyenne', () => {
  it('pondère par les calories, pas par le nombre d’aliments', () => {
    // Sans cette pondération, une feuille de salade compenserait une part de
    // gâteau : deux aliments, moyenne au milieu.
    const journal = [
      entree('Salade', 15, 30, 'dejeuner', jourISO(), 'A'),
      entree('Gâteau', 400, 150, 'dejeuner', jourISO(), 'E'),
    ]
    // Moyenne simple : 2. Pondérée par les calories : proche de 0.
    expect(qualiteMoyenne(journal)).toBeLessThan(0.5)
  })

  it('retombe sur une moyenne simple quand rien n’apporte de calories', () => {
    const journal = [entree('Eau', 0, 250, 'dejeuner', jourISO(), 'A')]
    expect(qualiteMoyenne(journal)).toBe(4)
  })

  it('rend zéro sur un repas vide, sans diviser par zéro', () => {
    expect(qualiteMoyenne([])).toBe(0)
  })
})

describe('topFlopDuJour', () => {
  it('désigne en flop ce qui coûte cher sans rien apporter', () => {
    // Pas simplement l'aliment le plus calorique : un plat complet consistant
    // n'est pas une faute.
    const journal = [
      entree('Brocoli', 34, 200, 'dejeuner', jourISO(), 'A'),
      entree('Soda', 42, 330, 'dejeuner', jourISO(), 'E'),
    ]
    const { top, flop } = topFlopDuJour(journal)
    expect(top?.aliment.nom).toBe('Brocoli')
    expect(flop?.aliment.nom).toBe('Soda')
  })

  it('n’oppose pas un aliment à lui-même', () => {
    // Un seul aliment noté ne peut pas être à la fois le meilleur et le pire :
    // l'écran afficherait la même carte deux fois avec deux verdicts contraires.
    const { top, flop } = topFlopDuJour([entree('Riz', 130, 200)])
    expect(top?.aliment.nom).toBe('Riz')
    expect(flop).toBeNull()
  })

  it('ne désigne rien sur une journée vide', () => {
    expect(topFlopDuJour([])).toEqual({ top: null, flop: null })
  })

  it('ignore ce qui n’apporte aucune calorie', () => {
    const journal = [entree('Eau', 0, 500), entree('Riz', 130, 200)]
    expect(topFlopDuJour(journal).top?.aliment.nom).toBe('Riz')
  })
})

describe('les objectifs', () => {
  it('répartit exactement 100 % des calories entre les quatre repas', () => {
    // Une répartition qui ne fait pas 1 décale toutes les cibles de repas sans
    // qu'aucun écran ne le signale.
    const somme = MOMENTS.reduce((s, m) => s + PART_MOMENT[m], 0)
    expect(somme).toBeCloseTo(1, 10)
  })

  it('déduit la cible d’un repas de l’objectif du jour', () => {
    expect(cibleDuRepas(2000, 'dejeuner')).toBe(700)
    expect(cibleDuRepas(2000, 'collation')).toBe(200)
  })

  it('répartit les macros en 25 / 40 / 35, aux bons facteurs caloriques', () => {
    // 4 kcal par gramme de protéines et de glucides, 9 pour les lipides.
    expect(objectifsMacros(2000)).toEqual({
      proteines: Math.round((2000 * 0.25) / 4),
      glucides: Math.round((2000 * 0.4) / 4),
      lipides: Math.round((2000 * 0.35) / 9),
    })
  })
})

describe('serieDeJours', () => {
  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    const journal = [
      entree('A', 100, 100, 'dejeuner', jourISO()),
      entree('B', 100, 100, 'dejeuner', ilYAJours(1)),
      entree('C', 100, 100, 'dejeuner', ilYAJours(2)),
    ]
    expect(serieDeJours(journal)).toBe(3)
  })

  it('s’arrête au premier jour manquant', () => {
    const journal = [
      entree('A', 100, 100, 'dejeuner', jourISO()),
      entree('C', 100, 100, 'dejeuner', ilYAJours(2)),
    ]
    expect(serieDeJours(journal)).toBe(1)
  })

  it('rend zéro quand rien n’est noté aujourd’hui', () => {
    // La série ne se compte pas depuis la dernière fois, sinon un badge de
    // régularité resterait acquis après trois semaines d'absence.
    expect(serieDeJours([entree('B', 100, 100, 'dejeuner', ilYAJours(1))])).toBe(0)
    expect(serieDeJours([])).toBe(0)
  })
})
