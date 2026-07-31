import { describe, expect, it } from 'vitest'
import {
  alternativesPour,
  analyserLaJournee,
  analyserRepas,
  recommanderProchainRepas,
  resumerLaJournee,
  roleDe,
} from './coach'
import { bilanParRepas, cibleDuRepas } from './journal'
import type { Aliment, EntreeJournal, Moment, NutriScore, ValeursPour100 } from './types'
import { MOMENTS } from './types'
import { jourISO } from './utils'

/**
 * Le coach à règles dit à quelqu'un ce que l'application pense de ce qu'il a
 * mangé. C'est le module où une erreur ne se voit pas comme une erreur : elle
 * sort une phrase bien formée, plausible, et fausse.
 *
 * Deux propriétés le tiennent, toutes deux écrites dans le module et aucune
 * vérifiable par un typecheck :
 *
 * - **Tout doit pouvoir s'expliquer par un calcul.** C'est la raison d'être de
 *   ce fichier face à `/api/coach` : un verdict affiché ne s'appuie jamais sur
 *   un modèle. Les seuils sont donc testés à leurs bornes.
 * - **Jamais de reproche.** « On décrit, on propose, on n'accuse pas. » Une
 *   application de suivi du poids qui glisse vers le jugement fait arrêter le
 *   suivi, ce qui est exactement le contraire du but.
 */

const OBJECTIF = 1800

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

let compteur = 0
function aliment(nom: string, valeurs: Partial<ValeursPour100>, note?: NutriScore): Aliment {
  return {
    id: `al-${nom}`,
    nom,
    famille: 'general',
    valeurs: { ...RIEN, ...valeurs },
    nutriScore: note,
    source: 'manuel',
  }
}

function entree(
  al: Aliment,
  quantiteG: number,
  moment: Moment = 'dejeuner',
  date = jourISO(),
): EntreeJournal {
  compteur += 1
  return {
    id: `e${compteur}`,
    date,
    moment,
    horodatage: `2026-08-01T${String(10 + (compteur % 10)).padStart(2, '0')}:00:00.000Z`,
    aliment: al,
    quantiteG,
  }
}

const RIZ = aliment('Riz cuit', { kcal: 130, proteines: 2.7, glucides: 28 }, 'A')
const POULET = aliment('Blanc de poulet', { kcal: 110, proteines: 23, lipides: 1.5 }, 'A')
const PIZZA = aliment('Pizza', { kcal: 270, proteines: 11, glucides: 30, lipides: 11, satures: 5, sel: 1.4 }, 'D')

/** Le bilan du moment demandé, extrait de `bilanParRepas`. */
function bilanDe(journal: EntreeJournal[], moment: Moment) {
  const bilan = bilanParRepas(journal).find((b) => b.moment === moment)
  if (!bilan) throw new Error(`moment ${moment} absent du bilan`)
  return bilan
}

describe('analyserRepas', () => {
  it('ne reproche rien quand rien n’est noté, et dit le repère', () => {
    const analyse = analyserRepas(bilanDe([], 'dejeuner'), OBJECTIF)
    expect(analyse.verdict).toBe('vide')
    expect(analyse.kcal).toBe(0)
    expect(analyse.cibleKcal).toBe(cibleDuRepas(OBJECTIF, 'dejeuner'))
    expect(analyse.message).toContain(String(analyse.cibleKcal))
  })

  it('bascule aux seuils annoncés, et pas ailleurs', () => {
    const cible = cibleDuRepas(OBJECTIF, 'dejeuner') // 630 kcal
    // Le verdict se déduit du rapport kcal/cible : < 0,7 léger, ≤ 1,15 juste,
    // au-delà copieux. Les bornes se testent des deux côtés, sinon un « < »
    // devenu « ≤ » passerait inaperçu.
    const verdictA = (kcal: number) => {
      const al = aliment('Repas', { kcal: 100 }, 'B')
      return analyserRepas(bilanDe([entree(al, kcal)], 'dejeuner'), OBJECTIF).verdict
    }
    expect(verdictA(Math.round(cible * 0.69))).toBe('leger')
    expect(verdictA(Math.round(cible * 0.75))).toBe('juste')
    expect(verdictA(Math.round(cible * 1.1))).toBe('juste')
    expect(verdictA(Math.round(cible * 1.3))).toBe('copieux')
  })

  it('chiffre l’écart plutôt que de le qualifier', () => {
    // « 240 kcal au-dessus du repère » s'explique ; « c'était beaucoup » non.
    const gros = aliment('Plat copieux', { kcal: 400, lipides: 25, satures: 10 }, 'D')
    const analyse = analyserRepas(bilanDe([entree(gros, 300)], 'dejeuner'), OBJECTIF)
    expect(analyse.verdict).toBe('copieux')
    expect(analyse.message).toMatch(/\d+ kcal au-dessus/)
  })

  it('distingue le volume de la qualité', () => {
    // Deux repas au même volume, deux messages différents : c'est tout l'intérêt
    // d'avoir deux échelles.
    const bon = analyserRepas(bilanDe([entree(POULET, 400), entree(RIZ, 100)], 'dejeuner'), OBJECTIF)
    const moins = analyserRepas(bilanDe([entree(PIZZA, 230)], 'dejeuner'), OBJECTIF)
    expect(bon.verdict).toBe(moins.verdict)
    expect(bon.message).not.toBe(moins.message)
  })

  it('rend une analyse par moment, les quatre', () => {
    const analyses = analyserLaJournee([entree(RIZ, 200, 'dejeuner')], OBJECTIF)
    expect(analyses.map((a) => a.moment)).toEqual(MOMENTS)
  })
})

describe('la règle de ton — jamais de reproche', () => {
  /**
   * Le vocabulaire du jugement, sur un sujet où il fait arrêter le suivi.
   *
   * La liste est courte et sans ambiguïté : ce ne sont pas des mots qu'on
   * emploierait par accident dans une phrase descriptive. « au-dessus du
   * repère » est un constat, « vous avez trop mangé » est un verdict sur la
   * personne.
   */
  const REPROCHES = [
    'trop',
    'faute',
    'mauvais',
    'raté',
    'excès',
    'coupable',
    'devriez',
    'auriez dû',
    'interdit',
    'craqué',
  ]

  /** Un large éventail de journées, des plus creuses aux plus chargées. */
  const JOURNAUX: EntreeJournal[][] = [
    [],
    [entree(RIZ, 50, 'petit-dejeuner')],
    [entree(POULET, 200, 'dejeuner'), entree(RIZ, 200, 'dejeuner')],
    [entree(PIZZA, 500, 'dejeuner')],
    [entree(PIZZA, 900, 'dejeuner'), entree(PIZZA, 400, 'diner')],
    [entree(RIZ, 30, 'collation')],
  ]

  /**
   * Les textes du module, séparés selon leur registre.
   *
   * Un `titre` est un intitulé — « Il reste 1 800 kcal » — et n'a pas à porter
   * de point final ; une `phrase` en porte un. Les confondre ferait exiger d'un
   * titre une ponctuation que la typographie française lui refuse.
   */
  function textes(): { titres: string[]; phrases: string[] } {
    const titres: string[] = []
    const phrases: string[] = []

    for (const journal of JOURNAUX) {
      for (const analyse of analyserLaJournee(journal, OBJECTIF)) phrases.push(analyse.message)
      const reco = recommanderProchainRepas(journal, OBJECTIF)
      titres.push(reco.titre)
      phrases.push(reco.conseil)
      phrases.push(resumerLaJournee(journal, OBJECTIF).phrase)
    }
    return { titres, phrases }
  }

  it('n’emploie aucun mot de jugement, dans aucune branche', () => {
    const { titres, phrases } = textes()
    const fautives: string[] = []
    for (const texte of [...titres, ...phrases]) {
      const minuscules = texte.toLowerCase()
      for (const mot of REPROCHES) {
        if (minuscules.includes(mot)) fautives.push(`« ${mot} » dans : ${texte}`)
      }
    }
    expect(fautives).toEqual([])
  })

  it('produit toujours une phrase complète, jamais un fragment', () => {
    // Une phrase vide ou tronquée s'affiche telle quelle : il n'y a aucun état
    // vide prévu pour ça.
    for (const phrase of textes().phrases) {
      expect(phrase.trim().length).toBeGreaterThan(10)
      expect(phrase.trim()).toMatch(/[.!?]$/)
    }
  })

  it('donne des titres, pas des phrases tronquées', () => {
    for (const titre of textes().titres) {
      expect(titre.trim().length).toBeGreaterThan(5)
      expect(titre.trim()).not.toMatch(/[.]$/)
    }
  })
})

describe('recommanderProchainRepas', () => {
  it('raisonne sur ce qui reste, quitte à être négatif', () => {
    // « Il vous reste 620 kcal » est actionnable ; « vous avez dépassé » ne
    // l'est pas. Le reste peut donc passer sous zéro sans être écrêté.
    const gros = [entree(PIZZA, 900, 'dejeuner'), entree(PIZZA, 400, 'diner')]
    expect(recommanderProchainRepas(gros, OBJECTIF).resteKcal).toBeLessThan(0)
  })

  it('nomme les manques plutôt que les excès', () => {
    // Une journée de riz seul : peu de protéines, peu de fibres.
    const reco = recommanderProchainRepas([entree(RIZ, 400, 'dejeuner')], OBJECTIF)
    expect(reco.manques).toContain('protéines')
    expect(reco.manques).toContain('fibres')
  })

  it('ne signale pas un manque là où il n’y en a pas', () => {
    const proteine = aliment('Lentilles', { kcal: 116, proteines: 9, glucides: 20, fibres: 8 }, 'A')
    const reco = recommanderProchainRepas([entree(proteine, 900, 'dejeuner')], OBJECTIF)
    expect(reco.manques).not.toContain('protéines')
    expect(reco.manques).not.toContain('fibres')
  })

  it('ne propose jamais une boisson comme repas', () => {
    const reco = recommanderProchainRepas([entree(RIZ, 200)], OBJECTIF)
    for (const suggestion of reco.suggestions) {
      expect(suggestion.famille).not.toBe('boisson')
    }
  })

  it('propose des aliments simples, jamais un ingrédient ni un alcool', () => {
    // Le coach cherche de quoi combler un manque : la bonne réponse est un
    // yaourt ou des lentilles, jamais du safran ni de la vodka. Ceux-là restent
    // trouvables par la recherche — ils ne sont simplement jamais proposés.
    const reco = recommanderProchainRepas([entree(RIZ, 200)], OBJECTIF)
    const noms = reco.suggestions.map((a) => a.nom.toLowerCase()).join(' | ')
    for (const interdit of ['safran', 'vodka', 'farine', 'ras el', 'levure']) {
      expect(noms).not.toContain(interdit)
    }
  })

  it('choisit un moment qui n’est pas déjà noté', () => {
    // L'heure réelle décide du moment attendu ; ce qui se vérifie sans dépendre
    // de l'horloge, c'est qu'on ne propose pas un repas déjà saisi.
    const journal = MOMENTS.filter((m) => m !== 'diner').map((m) => entree(RIZ, 100, m))
    expect(recommanderProchainRepas(journal, OBJECTIF).moment).toBe('diner')
  })
})

describe('roleDe', () => {
  it('classe un aliment par la répartition de ses calories', () => {
    expect(roleDe(POULET)).toBe('proteine')
    expect(roleDe(RIZ)).toBe('feculent')
    expect(roleDe(aliment('Huile', { kcal: 900, lipides: 100 }))).toBe('gras')
    expect(roleDe(aliment('Concombre', { kcal: 15, glucides: 3 }))).toBe('leger')
    expect(roleDe({ ...aliment('Eau', {}), famille: 'boisson' })).toBe('boisson')
  })

  it('ne divise jamais par zéro sur un aliment sans calories', () => {
    expect(() => roleDe(aliment('Néant', {}))).not.toThrow()
  })
})

describe('alternativesPour', () => {
  it('garde le rôle : pas une pomme à la place d’un steak', () => {
    const steak = aliment('Steak haché 15%', { kcal: 220, proteines: 20, lipides: 15, satures: 7 }, 'C')
    for (const alternative of alternativesPour(entree(steak, 150))) {
      expect(roleDe(alternative.aliment)).toBe('proteine')
    }
  })

  it('compare à quantité égale', () => {
    // Une alternative qui économise 200 kcal en divisant la portion par trois
    // ne rend service à personne.
    const steak = aliment('Steak haché 15%', { kcal: 220, proteines: 20, lipides: 15, satures: 7 }, 'C')
    for (const alternative of alternativesPour(entree(steak, 150))) {
      expect(alternative.quantiteG).toBe(150)
    }
  })

  it('ne se propose pas lui-même', () => {
    const steak = aliment('Steak haché 15%', { kcal: 220, proteines: 20, lipides: 15, satures: 7 }, 'C')
    const ids = alternativesPour(entree(steak, 150)).map((a) => a.aliment.id)
    expect(ids).not.toContain(steak.id)
  })

  it('ne propose rien pour un aliment déjà léger', () => {
    // Chercher mieux qu'un concombre est un conseil qui ne sert à rien.
    expect(alternativesPour(entree(aliment('Concombre', { kcal: 15 }, 'A'), 100))).toEqual([])
  })

  it('rend au plus la limite demandée', () => {
    const steak = aliment('Steak haché 15%', { kcal: 220, proteines: 20, lipides: 15, satures: 7 }, 'C')
    expect(alternativesPour(entree(steak, 150), 2).length).toBeLessThanOrEqual(2)
  })
})

describe('resumerLaJournee', () => {
  it('situe la journée sans jamais qualifier la personne', () => {
    const phraseDe = (kcal: number) =>
      resumerLaJournee([entree(aliment('Repas', { kcal: 100 }), kcal)], OBJECTIF).phrase

    expect(resumerLaJournee([], OBJECTIF).phrase).toMatch(/rien de noté/i)
    expect(phraseDe(500)).toMatch(/marge/i)
    expect(phraseDe(1400)).toMatch(/rythme/i)
    expect(phraseDe(1800)).toMatch(/cible/i)
    expect(phraseDe(2400)).toMatch(/\d+ kcal au-dessus/)
  })

  it('marque le dépassement au-delà de l’objectif, pas avant', () => {
    const a = resumerLaJournee([entree(aliment('R', { kcal: 100 }), 1800)], OBJECTIF)
    const b = resumerLaJournee([entree(aliment('R', { kcal: 100 }), 1900)], OBJECTIF)
    expect(a.depasse).toBe(false)
    expect(b.depasse).toBe(true)
  })

  it('ne divise pas par zéro sans objectif', () => {
    const resume = resumerLaJournee([entree(RIZ, 200)], 0)
    expect(Number.isFinite(resume.part)).toBe(true)
  })
})
