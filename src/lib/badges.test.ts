import { describe, expect, it } from 'vitest'
import { BADGES, badgeParCode, badgesADebloquer, enviesResistees, joursRenseignes, kilosPerdus, serie } from './badges'
import type { Utilisateur } from './auth'
import { etatInitial } from './store'
import type { EtatUtilisateur } from './store'
import { ilYAJours, jourISO } from './utils'

/**
 * Les badges sont évalués **à chaque écriture**.
 *
 * C'est le point qui rend ce fichier nécessaire : `modifier()` appelle
 * `badgesADebloquer` après avoir appliqué la recette mutative et avant de
 * planifier l'enregistrement. Un badge dont le prédicat lève sur un document
 * incomplet ne casse donc pas l'écran des badges — il casse **toutes les
 * sauvegardes de l'application**, et l'utilisateur voit sa saisie appliquée à
 * l'écran sans qu'elle n'atteigne jamais la base.
 *
 * D'où le premier test : chaque prédicat, sur chaque état plausible, sans
 * exception.
 */

const UTILISATEUR: Utilisateur = { id: 'u-essai', email: 'essai@equilibre.local', prenom: 'Essai' }

function etat(partiel: Partial<EtatUtilisateur> = {}): EtatUtilisateur {
  return { ...etatInitial(UTILISATEUR), ...partiel }
}

/** Une journée renseignée : deux moments notés au journal. */
function journee(date: string): EtatUtilisateur['journal'] {
  return (['petit-dejeuner', 'dejeuner'] as const).map((moment, i) => ({
    id: `${date}-${moment}`,
    date,
    moment,
    horodatage: `${date}T1${i}:00:00.000Z`,
    aliment: {
      id: 'a',
      nom: 'Aliment',
      famille: 'general',
      valeurs: {
        kcal: 100,
        proteines: 5,
        glucides: 10,
        sucres: 2,
        lipides: 3,
        satures: 1,
        fibres: 2,
        sel: 0.3,
      },
      source: 'manuel',
    },
    quantiteG: 100,
  }))
}

describe('la robustesse des prédicats', () => {
  /**
   * Les documents sur lesquels un badge peut être évalué, y compris les formes
   * abîmées qu'un stockage ancien ou un export réimporté peut produire.
   */
  const etats: [string, EtatUtilisateur][] = [
    ['neuf', etatInitial(UTILISATEUR)],
    ['sans pesée', etat({ pesees: [] })],
    ['sans pesée ni mesure', etat({ pesees: [], mesuresSante: [] })],
    ['journal rempli', etat({ journal: journee(jourISO()) })],
    [
      'mesures sans poids',
      etat({ pesees: [], mesuresSante: [{ date: jourISO() }] as EtatUtilisateur['mesuresSante'] }),
    ],
    ['tout à zéro', etat({ pesees: [], journal: [], repas: [], envies: [], eau: [] })],
  ]

  it('aucun badge ne lève, sur aucun document', () => {
    // Une exception ici bloque `modifier()`, donc toute écriture : la personne
    // voit sa saisie à l'écran et ne la retrouve pas au rechargement.
    const fautifs: string[] = []
    for (const [nom, e] of etats) {
      for (const badge of BADGES) {
        try {
          badge.atteint(e)
        } catch (erreur) {
          fautifs.push(`${badge.code} sur « ${nom} » : ${(erreur as Error).message}`)
        }
      }
    }
    expect(fautifs).toEqual([])
  })

  it('aucun badge ne rend autre chose qu’un booléen', () => {
    // `badges.includes(code)` est ensuite comparé à ce résultat : un `undefined`
    // débloquerait ou non selon le sens du vent.
    const fautifs: string[] = []
    for (const [nom, e] of etats) {
      for (const badge of BADGES) {
        if (typeof badge.atteint(e) !== 'boolean') fautifs.push(`${badge.code} sur « ${nom} »`)
      }
    }
    expect(fautifs).toEqual([])
  })

  it('n’en débloque aucun sur un compte neuf', () => {
    // Fêter un badge à l'inscription viderait le geste de son sens.
    expect(badgesADebloquer(etatInitial(UTILISATEUR))).toEqual([])
  })
})

describe('la déclaration des badges', () => {
  it('n’a aucun code en double', () => {
    // Deux badges au même code : le second ne se débloque jamais, puisque le
    // premier a déjà écrit ce code dans `etat.badges`.
    const codes = BADGES.map((b) => b.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('porte partout un titre, une condition et un emoji', () => {
    const incomplets = BADGES.filter(
      (b) => !b.titre.trim() || !b.condition.trim() || !b.emoji.trim(),
    )
    expect(incomplets.map((b) => b.code)).toEqual([])
  })

  it('écrit la condition à l’infinitif, jamais en jargon', () => {
    // C'est la règle du champ : « Renseigner ses repas 7 jours d'affilée », pas
    // « serie >= 7 ».
    for (const badge of BADGES) {
      expect(badge.condition).not.toMatch(/[<>=]|etat\.|journal\./)
      expect(badge.condition[0]).toBe(badge.condition[0].toUpperCase())
    }
  })

  it('se retrouve par son code', () => {
    expect(badgeParCode('premiere-assiette')?.titre).toBe('Première assiette')
    expect(badgeParCode('inexistant')).toBeUndefined()
  })
})

describe('serie', () => {
  it('compte les jours consécutifs renseignés', () => {
    const e = etat({ journal: [...journee(jourISO()), ...journee(ilYAJours(1)), ...journee(ilYAJours(2))] })
    expect(serie(e)).toBe(3)
  })

  it('ne paraît pas rompue avant que la journée ait commencé', () => {
    // À 8 h du matin, rien n'est encore noté : afficher « série rompue » serait
    // faux et décourageant. La série repart d'hier.
    const e = etat({ journal: [...journee(ilYAJours(1)), ...journee(ilYAJours(2))] })
    expect(serie(e)).toBe(2)
  })

  it('s’arrête au premier jour manqué', () => {
    const e = etat({ journal: [...journee(jourISO()), ...journee(ilYAJours(3))] })
    expect(serie(e)).toBe(1)
  })

  it('rend zéro sur un document vide', () => {
    expect(serie(etatInitial(UTILISATEUR))).toBe(0)
  })

  it('ne compte pas une journée à un seul repas', () => {
    // Une journée compte à partir de deux repas renseignés.
    const e = etat({ journal: journee(jourISO()).slice(0, 1) })
    expect(serie(e)).toBe(0)
  })
})

describe('kilosPerdus', () => {
  it('mesure depuis le poids de départ', () => {
    const e = etat({ pesees: [{ date: jourISO(), poidsKg: 68 }] })
    e.profil.poidsDepartKg = 71
    expect(kilosPerdus(e)).toBe(3)
  })

  it('ne rend jamais un nombre négatif', () => {
    // Une reprise de poids ne doit pas produire « −2 kg perdus », ni retirer un
    // badge déjà obtenu.
    const e = etat({ pesees: [{ date: jourISO(), poidsKg: 74 }] })
    e.profil.poidsDepartKg = 71
    expect(kilosPerdus(e)).toBe(0)
  })

  it('reste à zéro tant que rien n’est pesé', () => {
    const e = etat({ pesees: [] })
    expect(kilosPerdus(e)).toBe(0)
  })
})

describe('les compteurs annexes', () => {
  it('ne compte que les envies auxquelles on a résisté', () => {
    const e = etat({
      envies: [
        { issue: 'resistee' },
        { issue: 'cedee' },
        { issue: 'resistee' },
      ] as EtatUtilisateur['envies'],
    })
    expect(enviesResistees(e)).toBe(2)
  })

  it('compte les journées complètes, pas les entrées', () => {
    // Six entrées sur deux journées font deux journées.
    const e = etat({ journal: [...journee(jourISO()), ...journee(ilYAJours(1))] })
    expect(joursRenseignes(e)).toBe(2)
  })

  it('ignore une journée à un seul repas', () => {
    const e = etat({ journal: [...journee(jourISO()), ...journee(ilYAJours(1)).slice(0, 1)] })
    expect(joursRenseignes(e)).toBe(1)
  })
})

describe('badgesADebloquer', () => {
  it('ne propose que ce qui n’est pas déjà acquis', () => {
    // Sinon les confettis se rejoueraient à chaque écriture.
    const e = etat({ journal: journee(jourISO()) })
    const premiers = badgesADebloquer(e)
    expect(premiers.map((b) => b.code)).toContain('premiere-assiette')

    const ensuite = badgesADebloquer({ ...e, badges: premiers.map((b) => b.code) })
    expect(ensuite.map((b) => b.code)).not.toContain('premiere-assiette')
  })

  it('débloque les paliers franchis d’un coup, sans en sauter', () => {
    // Quelqu'un qui saisit trois jours d'un coup doit recevoir le palier 3, pas
    // seulement le suivant qu'il atteindra.
    const e = etat({
      journal: [...journee(jourISO()), ...journee(ilYAJours(1)), ...journee(ilYAJours(2))],
    })
    const codes = badgesADebloquer(e).map((b) => b.code)
    expect(codes).toContain('serie-3')
    expect(codes).not.toContain('serie-7')
  })
})
