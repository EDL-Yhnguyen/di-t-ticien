import { describe, expect, it } from 'vitest'
import {
  activiteParId,
  bilanSemaine,
  bonusSportDuJour,
  CATALOGUE_ACTIVITES,
  joursDeLaSemaine,
  kcalSeance,
  MINUTES_OMS_SEMAINE,
  minutesDuJour,
  resumerLaSemaine,
  serieDeSeances,
} from './sport'
import type { SeanceSport } from './types'
import { ilYAJours, jourISO } from './utils'

/**
 * La dépense d'une séance entre directement dans le budget calorique du jour :
 * c'est le seul endroit de l'application où un chiffre *ajoute* de quoi manger.
 * Une erreur y est donc doublement coûteuse — elle se voit à l'écran comme une
 * permission, et elle ne se voit pas du tout comme une erreur.
 *
 * La convention à protéger tient en une ligne : **la dépense est comptée nette**,
 * MET moins un. Rester assis coûte déjà 1 MET, et cette dépense-là est déjà dans
 * l'objectif calorique. Ajouter la dépense brute la compterait deux fois — c'est
 * la même règle que `gainMarcheQuotidienne` dans `nutrition.ts`, et que l'énergie
 * active d'Apple Santé, affichée mais jamais ajoutée au budget.
 */

let compteur = 0
function seance(partiel: Partial<SeanceSport> = {}): SeanceSport {
  compteur += 1
  return {
    id: `s${compteur}`,
    date: jourISO(),
    activiteId: 'marche',
    libelle: 'Marche',
    minutes: 30,
    intensite: 'moderee',
    kcal: 100,
    ...partiel,
  }
}

describe('kcalSeance — la dépense nette', () => {
  it('retranche le métabolisme de repos', () => {
    // MET 4, poids 70, 60 min, modérée → (4 − 1) × 3,5 × 70 × 60 / 200 = 220,5
    expect(kcalSeance({ met: 4, poidsKg: 70, minutes: 60, intensite: 'moderee' })).toBe(221)
  })

  it('ne compte rien pour une activité au repos', () => {
    // Un MET de 1 est exactement la dépense de quelqu'un assis : la séance
    // n'ajoute rien au budget, et surtout pas un nombre négatif.
    expect(kcalSeance({ met: 1, poidsKg: 70, minutes: 60, intensite: 'moderee' })).toBe(0)
    expect(kcalSeance({ met: 0.5, poidsKg: 70, minutes: 60, intensite: 'douce' })).toBe(0)
  })

  it('reste toujours inférieur à la dépense brute', () => {
    // La démonstration que le repos n'est jamais compté deux fois, sur tout le
    // catalogue d'activités.
    for (const activite of CATALOGUE_ACTIVITES) {
      const net = kcalSeance({ met: activite.met, poidsKg: 70, minutes: 60, intensite: 'moderee' })
      const brut = Math.round((activite.met * 3.5 * 70 * 60) / 200)
      expect(net, activite.id).toBeLessThan(brut)
    }
  })

  it('suit le poids et la durée proportionnellement', () => {
    const base = kcalSeance({ met: 6, poidsKg: 70, minutes: 30, intensite: 'moderee' })
    expect(kcalSeance({ met: 6, poidsKg: 140, minutes: 30, intensite: 'moderee' })).toBe(base * 2)
    expect(kcalSeance({ met: 6, poidsKg: 70, minutes: 60, intensite: 'moderee' })).toBe(base * 2)
  })

  it('ordonne les trois intensités sans leur donner une précision qu’elles n’ont pas', () => {
    const pour = (intensite: 'douce' | 'moderee' | 'intense') =>
      kcalSeance({ met: 6, poidsKg: 70, minutes: 60, intensite })
    expect(pour('douce')).toBeLessThan(pour('moderee'))
    expect(pour('moderee')).toBeLessThan(pour('intense'))
    // L'écart total reste resserré : au-delà, on donnerait à un ressenti déclaré
    // une précision qu'il n'a pas.
    expect(pour('intense') / pour('douce')).toBeLessThan(2)
  })

  it('ne rend rien pour une séance de durée nulle', () => {
    expect(kcalSeance({ met: 6, poidsKg: 70, minutes: 0, intensite: 'moderee' })).toBe(0)
  })
})

describe('le catalogue d’activités', () => {
  it('n’a aucun identifiant en double', () => {
    const ids = CATALOGUE_ACTIVITES.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('porte partout un MET plausible', () => {
    // En dessous de 1, l'activité coûterait moins que rester assis ; au-dessus
    // de 20, elle relèverait du sport de haut niveau et non du suivi ordinaire.
    for (const activite of CATALOGUE_ACTIVITES) {
      expect(activite.met, activite.id).toBeGreaterThan(1)
      expect(activite.met, activite.id).toBeLessThanOrEqual(20)
    }
  })

  it('se retrouve par identifiant', () => {
    const premiere = CATALOGUE_ACTIVITES[0]
    expect(activiteParId(premiere.id)?.libelle).toBe(premiere.libelle)
    expect(activiteParId('inexistante')).toBeUndefined()
  })
})

describe('les lectures du jour', () => {
  it('additionne les séances de la date demandée seulement', () => {
    const seances = [
      seance({ kcal: 120, minutes: 30 }),
      seance({ kcal: 80, minutes: 20 }),
      seance({ kcal: 500, minutes: 90, date: ilYAJours(1) }),
    ]
    expect(bonusSportDuJour(seances)).toBe(200)
    expect(minutesDuJour(seances)).toBe(50)
  })

  it('rend zéro plutôt que rien sur une journée sans séance', () => {
    // Ce nombre est ajouté à l'objectif calorique : un `undefined` y produirait
    // « NaN kcal » sur l'écran principal.
    expect(bonusSportDuJour([])).toBe(0)
    expect(minutesDuJour([])).toBe(0)
  })
})

describe('joursDeLaSemaine', () => {
  it('rend sept dates du lundi au dimanche', () => {
    const jours = joursDeLaSemaine('2026-08-06') // un jeudi
    expect(jours).toHaveLength(7)
    expect(jours[0]).toBe('2026-08-03')
    expect(jours[6]).toBe('2026-08-09')
  })

  it('traite le dimanche comme la fin de la semaine', () => {
    // `getDay()` rend 0 le dimanche : sans le décalage, la semaine d'un dimanche
    // commencerait le lendemain.
    expect(joursDeLaSemaine('2026-08-09')[0]).toBe('2026-08-03')
  })

  it('franchit le changement d’heure sans perdre un jour', () => {
    const jours = joursDeLaSemaine('2026-10-26')
    expect(jours).toHaveLength(7)
    expect(new Set(jours).size).toBe(7)
  })
})

describe('bilanSemaine', () => {
  it('compte les jours actifs, pas les séances', () => {
    // Deux séances le même jour font une journée active : le compte sert à
    // situer une régularité, pas un volume.
    const seances = [
      seance({ date: '2026-08-03', minutes: 30, kcal: 100 }),
      seance({ date: '2026-08-03', minutes: 20, kcal: 60 }),
      seance({ date: '2026-08-05', minutes: 40, kcal: 150 }),
    ]
    const bilan = bilanSemaine(seances, '2026-08-06')
    expect(bilan.seances).toBe(2)
    expect(bilan.minutes).toBe(90)
    expect(bilan.kcal).toBe(310)
  })

  it('situe par rapport au repère de l’OMS', () => {
    const bilan = bilanSemaine([seance({ date: '2026-08-03', minutes: 75 })], '2026-08-06')
    expect(bilan.partRecommandation).toBeCloseTo(75 / MINUTES_OMS_SEMAINE, 6)
  })

  it('dépasse 1 sans être écrêté', () => {
    // Quelqu'un qui fait le double du repère doit le voir, pas être ramené à
    // « objectif atteint » comme s'il s'était arrêté là.
    const bilan = bilanSemaine([seance({ date: '2026-08-03', minutes: 300 })], '2026-08-06')
    expect(bilan.partRecommandation).toBe(2)
  })

  it('rend une semaine vide sans diviser par zéro', () => {
    const bilan = bilanSemaine([], '2026-08-06')
    expect(bilan.jours).toHaveLength(7)
    expect(bilan.minutes).toBe(0)
    expect(bilan.partRecommandation).toBe(0)
  })

  it('ne compte pas les séances d’une autre semaine', () => {
    const bilan = bilanSemaine([seance({ date: '2026-07-27', minutes: 60 })], '2026-08-06')
    expect(bilan.minutes).toBe(0)
  })
})

describe('serieDeSeances', () => {
  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    const seances = [
      seance({ date: jourISO() }),
      seance({ date: ilYAJours(1) }),
      seance({ date: ilYAJours(2) }),
    ]
    expect(serieDeSeances(seances)).toBe(3)
  })

  it('s’arrête au premier jour sans séance', () => {
    expect(serieDeSeances([seance({ date: jourISO() }), seance({ date: ilYAJours(2) })])).toBe(1)
  })

  it('rend zéro quand rien n’est fait aujourd’hui', () => {
    expect(serieDeSeances([seance({ date: ilYAJours(1) })])).toBe(0)
    expect(serieDeSeances([])).toBe(0)
  })
})

describe('resumerLaSemaine — sans reproche', () => {
  const REPROCHES = ['trop', 'faute', 'mauvais', 'raté', 'devriez', 'insuffisant', 'paresse']

  it('n’accuse jamais, quel que soit le volume', () => {
    // Quelqu'un qui ouvre cet écran a déjà fait le plus dur.
    const volumes = [0, 20, 75, 150, 400]
    for (const minutes of volumes) {
      const bilan = bilanSemaine(
        minutes === 0 ? [] : [seance({ date: '2026-08-03', minutes })],
        '2026-08-06',
      )
      const phrase = resumerLaSemaine(bilan).toLowerCase()
      for (const mot of REPROCHES) {
        expect(phrase, `« ${mot} » dans : ${phrase}`).not.toContain(mot)
      }
    }
  })

  it('propose une porte de sortie quand rien n’a été fait', () => {
    // Un état vide qui ne dit que « aucune séance » laisse devant un mur.
    const phrase = resumerLaSemaine(bilanSemaine([], '2026-08-06'))
    expect(phrase).toContain(String(MINUTES_OMS_SEMAINE))
    expect(phrase).toMatch(/marche/i)
  })

  it('dit le repère atteint sans laisser croire qu’il faut s’arrêter', () => {
    const bilan = bilanSemaine([seance({ date: '2026-08-03', minutes: 160 })], '2026-08-06')
    expect(resumerLaSemaine(bilan)).toMatch(/bonus/i)
  })

  it('chiffre ce qu’il reste plutôt que ce qui manque', () => {
    const bilan = bilanSemaine([seance({ date: '2026-08-03', minutes: 90 })], '2026-08-06')
    expect(resumerLaSemaine(bilan)).toContain('60')
  })
})
