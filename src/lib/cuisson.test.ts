import { describe, expect, it } from 'vitest'
import { chrono, dureesDeLEtape } from './cuisson'

/**
 * Les minuteurs du mode Cuisine sont **déduits du texte des étapes**, sans
 * qu'aucune annotation ait été demandée au catalogue. C'est ce qui permet à une
 * recette ajoutée demain d'avoir ses minuteurs sans rien de plus — et c'est
 * aussi la limite du procédé : ce qui se déduit d'une phrase peut se tromper.
 *
 * Sept mille recettes passent par cette fonction, dont plusieurs milliers
 * composées par le générateur : personne ne relira leurs étapes une par une.
 */

describe('dureesDeLEtape', () => {
  it('lit les minutes, les heures et les secondes', () => {
    expect(dureesDeLEtape('Faire revenir 10 minutes')).toEqual([
      { secondes: 600, libelle: '10 minutes' },
    ])
    expect(dureesDeLEtape('Laisser mijoter 1 h')[0].secondes).toBe(3600)
    expect(dureesDeLEtape('Chauffer 45 s au micro-ondes')[0].secondes).toBe(45)
  })

  it('accepte les abréviations comme les mots entiers', () => {
    for (const texte of ['Cuire 8 min', 'Cuire 8 minutes', 'Cuire 8min']) {
      expect(dureesDeLEtape(texte)[0]?.secondes).toBe(480)
    }
  })

  it('propose toutes les durées d’une étape plutôt que d’en deviner une', () => {
    // Deviner mal ferait rater une cuisson ; proposer deux boutons ne coûte
    // qu'un regard.
    const durees = dureesDeLEtape('Saisir 6 minutes par face, puis 2 minutes à couvert')
    expect(durees.map((d) => d.secondes)).toEqual([360, 120])
  })

  it('ne propose qu’un bouton pour deux fois la même durée', () => {
    expect(dureesDeLEtape('5 minutes d’un côté, 5 minutes de l’autre')).toHaveLength(1)
  })

  it('exclut les unités de conservation', () => {
    // « Se garde 3 mois au congélateur » n'est pas un temps de cuisson, et un
    // minuteur de trois mois serait absurde.
    expect(dureesDeLEtape('Se garde 3 mois au congélateur')).toEqual([])
    expect(dureesDeLEtape('Repose 2 jours au frais')).toEqual([])
    expect(dureesDeLEtape('Se conserve 1 semaine')).toEqual([])
  })

  it('ne confond pas une température ou une puissance avec une durée', () => {
    expect(dureesDeLEtape('Enfourner à 160 °C')).toEqual([])
    expect(dureesDeLEtape('Réchauffer à 700 W')).toEqual([])
  })

  it('écarte ce qui est trop court pour valoir un minuteur', () => {
    // Le temps de lancer le minuteur, la cuisson est finie.
    expect(dureesDeLEtape('Mélanger 10 s')).toEqual([])
  })

  it('écarte ce qui n’est plus une étape de recette', () => {
    // Au-delà de trois heures, c'est un repos au réfrigérateur ; un minuteur
    // qui tourne toute la nuit n'aide personne.
    expect(dureesDeLEtape('Laisser reposer 12 h au réfrigérateur')).toEqual([])
  })

  it('ne déclenche rien sur une étape sans durée', () => {
    expect(dureesDeLEtape('Saler, poivrer et servir aussitôt')).toEqual([])
  })

  it('cite le libellé tel qu’il apparaît, pour que le bouton le reprenne', () => {
    expect(dureesDeLEtape('Cuire 12 min à feu doux')[0].libelle).toBe('12 min')
  })
})

describe('chrono', () => {
  it('écrit un compte à rebours sous l’heure sans zéro inutile', () => {
    expect(chrono(725)).toBe('12:05')
    expect(chrono(65)).toBe('1:05')
    expect(chrono(9)).toBe('0:09')
  })

  it('ajoute les heures seulement quand il y en a', () => {
    expect(chrono(3870)).toBe('1:04:30')
    expect(chrono(3600)).toBe('1:00:00')
  })

  it('s’arrête à zéro plutôt que de compter à l’envers', () => {
    // Un minuteur dépassé affiche « 0:00 », pas « -0:03 ».
    expect(chrono(0)).toBe('0:00')
    expect(chrono(-5)).toBe('0:00')
  })
})
