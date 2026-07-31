import { describe, expect, it } from 'vitest'
import {
  depenseJournaliere,
  gainMarcheQuotidienne,
  imc,
  libelleIMC,
  metabolismeDeBase,
  objectifCalorique,
  progression,
  rythmeLent,
  trajectoire,
} from './nutrition'
import type { Profil } from './types'

/**
 * Ces chiffres sont ceux que l'application affiche comme objectif du jour, et
 * dont découlent la jauge d'énergie, les cibles de repas et la date d'arrivée
 * estimée. Une erreur ici ne se voit pas : elle produit un nombre plausible.
 *
 * L'avertissement produit s'applique et ne se retire pas — ce sont des repères
 * calculés, pas une prescription. Les tests protègent la formule retenue
 * (Mifflin-St Jeor, déficit 20 %, plancher par sexe), pas une vérité médicale.
 */

const PROFIL: Profil = {
  id: 'essai',
  prenom: 'Essai',
  age: 40,
  sexe: 'femme',
  tailleCm: 165,
  poidsDepartKg: 71,
  poidsObjectifKg: 61,
  activite: 'modere',
} as Profil

describe('metabolismeDeBase', () => {
  it('applique Mifflin-St Jeor, avec sa constante par sexe', () => {
    // 10×70 + 6.25×165 − 5×40 − 161 = 1370
    expect(metabolismeDeBase({ poidsKg: 70, tailleCm: 165, age: 40, sexe: 'femme' })).toBe(1370)
    // La même personne au masculin : +166 exactement (−161 devient +5).
    expect(metabolismeDeBase({ poidsKg: 70, tailleCm: 165, age: 40, sexe: 'homme' })).toBe(1536)
  })
})

describe('depenseJournaliere', () => {
  it('multiplie le métabolisme par le facteur d’activité', () => {
    const mesures = { poidsKg: 70, tailleCm: 165, age: 40, sexe: 'femme' } as const
    expect(depenseJournaliere({ ...mesures, activite: 'sedentaire' })).toBe(Math.round(1370 * 1.2))
    expect(depenseJournaliere({ ...mesures, activite: 'actif' })).toBe(Math.round(1370 * 1.725))
  })

  it('croît avec l’activité déclarée', () => {
    const mesures = { poidsKg: 70, tailleCm: 165, age: 40, sexe: 'femme' } as const
    const paliers = (['sedentaire', 'leger', 'modere', 'actif'] as const).map((activite) =>
      depenseJournaliere({ ...mesures, activite }),
    )
    expect(paliers).toEqual([...paliers].sort((a, b) => a - b))
  })
})

describe('objectifCalorique', () => {
  it('retranche 20 % de la dépense', () => {
    const mesures = { poidsKg: 70, tailleCm: 165, age: 40, sexe: 'femme', activite: 'modere' } as const
    expect(objectifCalorique(mesures)).toBe(Math.round(depenseJournaliere(mesures) * 0.8))
  })

  it('ne descend jamais sous le plancher nutritionnel', () => {
    // En dessous, les apports en vitamines et minéraux ne sont plus couvrables.
    // C'est la borne qui protège une personne petite et sédentaire d'un objectif
    // que l'application n'a pas le droit de proposer.
    const petiteEtSedentaire = {
      poidsKg: 45,
      tailleCm: 150,
      age: 65,
      sexe: 'femme',
      activite: 'sedentaire',
    } as const
    expect(objectifCalorique(petiteEtSedentaire)).toBe(1200)

    const hommePetitEtSedentaire = {
      poidsKg: 55,
      tailleCm: 160,
      age: 70,
      sexe: 'homme',
      activite: 'sedentaire',
    } as const
    expect(objectifCalorique(hommePetitEtSedentaire)).toBe(1500)
  })
})

describe('trajectoire', () => {
  it('déduit la perte hebdomadaire du déficit, à 7 700 kcal le kilo', () => {
    const t = trajectoire(PROFIL, 71)
    expect(t.deficitKcal).toBe(t.depenseKcal - t.objectifKcal)
    expect(t.perteHebdoKg).toBeCloseTo((t.deficitKcal * 7) / 7700, 6)
  })

  it('annonce une date d’arrivée tant qu’il reste du chemin', () => {
    const t = trajectoire(PROFIL, 71)
    expect(t.semainesRestantes).toBeGreaterThan(0)
    expect(t.dateEstimee).toBeInstanceOf(Date)
  })

  it('n’annonce plus rien une fois l’objectif atteint', () => {
    // Une date d'arrivée affichée à quelqu'un qui est arrivé est au mieux du
    // bruit, au pire un objectif de perte qui continue.
    const t = trajectoire(PROFIL, 61)
    expect(t.semainesRestantes).toBe(0)
    expect(t.dateEstimee).toBeNull()
  })

  it('ne calcule pas de retour en arrière sous l’objectif', () => {
    const t = trajectoire(PROFIL, 58)
    expect(t.dateEstimee).toBeNull()
  })
})

describe('rythmeLent', () => {
  it('ne se déclenche que chez une personne sédentaire', () => {
    // Le message dit « le levier est l'activité, pas l'assiette » : le proposer
    // à quelqu'un qui bouge déjà cinq fois par semaine serait faux et décourageant.
    const sedentaire: Profil = { ...PROFIL, activite: 'sedentaire' }
    const active: Profil = { ...PROFIL, activite: 'actif' }
    expect(rythmeLent(trajectoire(active, 71), 'actif')).toBe(false)
    // Le cas sédentaire dépend des mesures ; on vérifie seulement qu'il est
    // possible et cohérent avec la trajectoire.
    const t = trajectoire(sedentaire, 71)
    expect(rythmeLent(t, 'sedentaire')).toBe(t.perteHebdoKg > 0 && t.perteHebdoKg < 0.35)
  })
})

describe('gainMarcheQuotidienne', () => {
  it('compte la dépense nette, pas la dépense brute', () => {
    // Le métabolisme de repos est déjà dans l'objectif : l'ajouter en brut le
    // compterait deux fois. D'où le (MET − 1).
    expect(gainMarcheQuotidienne(70)).toBe(Math.round((3.3 - 1) * 70 * 0.5))
  })
})

describe('imc', () => {
  it('calcule et qualifie', () => {
    expect(imc(70, 165)).toBeCloseTo(25.71, 2)
    expect(libelleIMC(17)).toBe('Insuffisance pondérale')
    expect(libelleIMC(22)).toBe('Corpulence normale')
    expect(libelleIMC(27)).toBe('Surpoids')
    expect(libelleIMC(32)).toBe('Obésité')
  })

  it('bascule exactement aux seuils publiés', () => {
    expect(libelleIMC(18.5)).toBe('Corpulence normale')
    expect(libelleIMC(25)).toBe('Surpoids')
    expect(libelleIMC(30)).toBe('Obésité')
  })
})

describe('progression', () => {
  it('borne la part parcourue entre 0 et 1', () => {
    expect(progression(PROFIL, 71)).toBe(0)
    expect(progression(PROFIL, 66)).toBeCloseTo(0.5, 6)
    expect(progression(PROFIL, 61)).toBe(1)
    // Au-delà de l'objectif, la barre reste pleine plutôt que de déborder.
    expect(progression(PROFIL, 58)).toBe(1)
    // Une reprise de poids ne rend pas la barre négative.
    expect(progression(PROFIL, 75)).toBe(0)
  })

  it('rend une barre pleine plutôt qu’une division par zéro', () => {
    const sansPerteAFaire: Profil = { ...PROFIL, poidsDepartKg: 61, poidsObjectifKg: 61 }
    expect(progression(sansPerteAFaire, 61)).toBe(1)
  })
})
