import { describe, expect, it } from 'vitest'
import { decisionReprise, fusionnerDocuments } from './synchro'
import { etatInitial, type EtatUtilisateur } from './store'
import type { EntreeJournal } from './types'

/**
 * Le défaut protégé ici n'est pas hypothétique : `enregistrer()` renvoie le
 * document **entier** en `upsert`, sans comparer les dates. Deux appareils, et
 * le dernier qui écrit efface ce que l'autre venait de noter — sans message,
 * sans erreur, sans trace. C'est l'inverse exact de la promesse du produit :
 * se connecter où l'on veut et retrouver sa progression.
 *
 * Aucun test de ce fichier n'appelle `charger()` ni `enregistrer()` : ces
 * fonctions écriraient dans la vraie base dès qu'un `.env` traîne sur la
 * machine. C'est la raison d'être d'un module de fusion pur.
 */

const MOI = { id: 'u1', email: 'a@b.fr', prenom: 'Test' }

function doc(): EtatUtilisateur {
  return etatInitial(MOI)
}

function entree(id: string, date: string, horodatage = `${date}T12:00:00.000Z`): EntreeJournal {
  return {
    id,
    date,
    moment: 'dejeuner',
    horodatage,
    aliment: {
      id: `al-${id}`,
      nom: 'Test',
      famille: 'general',
      valeurs: {
        kcal: 100,
        proteines: 5,
        glucides: 10,
        sucres: 2,
        lipides: 3,
        satures: 1,
        fibres: 2,
        sel: 0.5,
      },
      source: 'base',
    },
    quantiteG: 100,
  }
}

describe('fusionnerDocuments', () => {
  it('garde les deux repas quand chaque appareil a noté le sien', () => {
    const portable = doc()
    portable.journal = [entree('a', '2026-08-01')]

    const telephone = doc()
    telephone.journal = [entree('b', '2026-08-01')]

    const fusion = fusionnerDocuments(telephone, portable)

    expect(fusion.journal.map((e) => e.id).sort()).toEqual(['a', 'b'])
  })

  it('ne duplique pas une entrée que les deux appareils connaissent déjà', () => {
    const commun = entree('a', '2026-08-01')

    const recent = doc()
    recent.journal = [commun, entree('b', '2026-08-01')]
    const ancien = doc()
    ancien.journal = [commun]

    expect(fusionnerDocuments(recent, ancien).journal).toHaveLength(2)
  })

  it('range l’entrée rattrapée à sa place dans le temps, pas à la fin', () => {
    // Sans tri, le petit déjeuner récupéré de l'autre appareil s'afficherait
    // après le dîner : les écrans lisent le tableau dans l'ordre reçu.
    const recent = doc()
    recent.journal = [entree('diner', '2026-08-01', '2026-08-01T20:00:00.000Z')]
    const ancien = doc()
    ancien.journal = [entree('matin', '2026-08-01', '2026-08-01T08:00:00.000Z')]

    expect(fusionnerDocuments(recent, ancien).journal.map((e) => e.id)).toEqual([
      'matin',
      'diner',
    ])
  })

  it('réunit les pesées par date, sans en inventer une seconde le même jour', () => {
    const recent = doc()
    recent.pesees = [{ date: '2026-08-01', poidsKg: 70 }]
    const ancien = doc()
    ancien.pesees = [
      { date: '2026-08-01', poidsKg: 71 },
      { date: '2026-07-31', poidsKg: 72 },
    ]

    const fusion = fusionnerDocuments(recent, ancien)

    expect(fusion.pesees).toHaveLength(2)
    // La valeur du document récent l'emporte : c'est la dernière intention.
    expect(fusion.pesees.find((p) => p.date === '2026-08-01')?.poidsKg).toBe(70)
  })

  it('distingue deux repas cochés le même jour', () => {
    // La date seule confondrait le déjeuner et le dîner, et la case cochée sur
    // un appareil effacerait celle de l'autre.
    const recent = doc()
    recent.repas = [{ date: '2026-08-01', moment: 'dejeuner', composantsCoches: ['a'] }]
    const ancien = doc()
    ancien.repas = [{ date: '2026-08-01', moment: 'diner', composantsCoches: ['b'] }]

    expect(fusionnerDocuments(recent, ancien).repas).toHaveLength(2)
  })

  it('réunit les favoris et les badges sans doublon', () => {
    const recent = doc()
    recent.favoris = ['r1', 'r2']
    recent.badges = ['premier-jour']
    const ancien = doc()
    ancien.favoris = ['r2', 'r3']
    ancien.badges = ['premier-jour', 'semaine-complete']

    const fusion = fusionnerDocuments(recent, ancien)

    expect(fusion.favoris.sort()).toEqual(['r1', 'r2', 'r3'])
    expect(fusion.badges.sort()).toEqual(['premier-jour', 'semaine-complete'])
  })

  it('laisse le document récent trancher sur ce qui se remplace', () => {
    // Le profil, les réglages et le consentement sont des valeurs qu'on
    // remplace : deux appareils qui en changent expriment une intention, pas un
    // ajout. Les réunir n'aurait aucun sens.
    const recent = doc()
    recent.profil.prenom = 'Nouveau'
    const ancien = doc()
    ancien.profil.prenom = 'Ancien'

    expect(fusionnerDocuments(recent, ancien).profil.prenom).toBe('Nouveau')
  })

  it('ne partage aucun objet avec les documents d’origine', () => {
    // Une entrée rattrapée qui resterait partagée se ferait modifier depuis
    // l'autre document, longtemps après la fusion et sans rapport visible.
    const recent = doc()
    const ancien = doc()
    ancien.journal = [entree('a', '2026-08-01')]

    const fusion = fusionnerDocuments(recent, ancien)
    fusion.journal[0].quantiteG = 999

    expect(ancien.journal[0].quantiteG).toBe(100)
  })

  it('ne perd rien quand un appareil part d’un document vide', () => {
    const ancien = doc()
    ancien.journal = [entree('a', '2026-08-01')]
    ancien.favoris = ['r1']

    const fusion = fusionnerDocuments(doc(), ancien)

    expect(fusion.journal).toHaveLength(1)
    expect(fusion.favoris).toEqual(['r1'])
  })
})

describe('decisionReprise', () => {
  it('ne fait rien quand aucune écriture n’attend', () => {
    expect(decisionReprise(null, '2026-08-01T10:00:00Z')).toBe('aucune')
  })

  it('renvoie l’attente telle quelle quand la base n’a pas bougé', () => {
    expect(
      decisionReprise({ majLeConnu: '2026-08-01T10:00:00Z' }, '2026-08-01T10:00:00Z'),
    ).toBe('renvoyer')
  })

  it('réunit quand un autre appareil a écrit entre-temps', () => {
    expect(
      decisionReprise({ majLeConnu: '2026-08-01T10:00:00Z' }, '2026-08-01T11:00:00Z'),
    ).toBe('reunir')
  })

  it('réunit plutôt que d’écraser quand l’attente ne sait pas d’où elle part', () => {
    // Le cas d'une attente écrite avant que ce mécanisme existe : elle ne peut
    // rien affirmer sur la base, et réunir ne perd jamais rien.
    expect(decisionReprise({ majLeConnu: null }, '2026-08-01T11:00:00Z')).toBe('reunir')
  })
})
