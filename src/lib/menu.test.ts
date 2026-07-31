import { describe, expect, it } from 'vitest'
import {
  bilanDuPlan,
  copieDeSemaine,
  copierJour,
  decalerJours,
  decalerMois,
  deplacerRepas,
  genererSemaine,
  genererSemaines,
  lundiDeLaSemaine,
  lundisDuMois,
  modeleDepuisPlan,
  planDeLaDate,
  planDepuisModele,
  planPerime,
  poserPlan,
  recettesDuPlan,
  saisonActuelle,
  totalDuJour,
} from './menu'
import { recetteParId } from './recettes'
import type { Moment, PlanSemaine } from './types'
import { MOMENTS } from './types'

/**
 * Le planificateur tire au sort — `ALEA` vaut 0,22, pour qu'un « Régénérer »
 * donne autre chose. Ces tests ne peuvent donc pas comparer une semaine à une
 * semaine attendue, et ils ne le cherchent pas : ce qui compte n'est pas *quel*
 * plat sort, c'est que la grille soit toujours cohérente, que les dates tombent
 * juste, et que les gestes du glisser-déposer ne détruisent rien.
 *
 * L'arithmétique des dates est testée à part et sans hasard, sur les cas qui
 * cassent : le changement d'heure, le passage d'année, un mois qui ne commence
 * pas un lundi.
 */

const OPTIONS = { debut: '2026-08-03', objectifKcal: 1800, saison: 'ete' as const }

describe('lundiDeLaSemaine', () => {
  it('ramène n’importe quel jour au lundi de sa semaine', () => {
    // 2026-08-03 est un lundi ; 2026-08-09 le dimanche suivant.
    expect(lundiDeLaSemaine('2026-08-03')).toBe('2026-08-03')
    expect(lundiDeLaSemaine('2026-08-06')).toBe('2026-08-03')
    expect(lundiDeLaSemaine('2026-08-09')).toBe('2026-08-03')
    expect(lundiDeLaSemaine('2026-08-10')).toBe('2026-08-10')
  })

  it('traite le dimanche comme la fin de la semaine, pas le début', () => {
    // `getDay()` rend 0 le dimanche : sans le `(jour + 6) % 7`, un dimanche
    // renverrait le lundi *suivant* et le plan du jour serait introuvable.
    expect(lundiDeLaSemaine('2026-08-09')).toBe('2026-08-03')
  })

  it('franchit le changement d’heure sans décaler d’un jour', () => {
    // Dernier dimanche d'octobre 2026 : le 25.
    expect(lundiDeLaSemaine('2026-10-25')).toBe('2026-10-19')
    expect(lundiDeLaSemaine('2026-10-26')).toBe('2026-10-26')
    // Dernier dimanche de mars 2027 : le 28.
    expect(lundiDeLaSemaine('2027-03-28')).toBe('2027-03-22')
  })

  it('franchit le passage d’année', () => {
    expect(lundiDeLaSemaine('2027-01-01')).toBe('2026-12-28')
  })
})

describe('decalerJours', () => {
  it('avance et recule sans se tromper de mois', () => {
    expect(decalerJours('2026-08-03', 7)).toBe('2026-08-10')
    expect(decalerJours('2026-08-31', 1)).toBe('2026-09-01')
    expect(decalerJours('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('franchit le 29 février d’une année bissextile', () => {
    expect(decalerJours('2028-02-28', 1)).toBe('2028-02-29')
    expect(decalerJours('2028-02-28', 2)).toBe('2028-03-01')
  })

  it('franchit le changement d’heure', () => {
    // Les dates sont ancrées à midi, précisément pour ça.
    expect(decalerJours('2026-10-24', 2)).toBe('2026-10-26')
    expect(decalerJours('2027-03-27', 2)).toBe('2027-03-29')
  })
})

describe('lundisDuMois', () => {
  it('part du lundi de la semaine qui contient le 1er', () => {
    // Août 2026 commence un samedi : la grille démarre au lundi du 27 juillet,
    // parce qu'on planifie des semaines, pas des mois.
    expect(lundisDuMois('2026-08-15')[0]).toBe('2026-07-27')
  })

  it('couvre le mois entier sans le couper', () => {
    const lundis = lundisDuMois('2026-08-15')
    expect(lundis[0] <= '2026-08-01').toBe(true)
    expect(decalerJours(lundis.at(-1) ?? '', 6) >= '2026-08-31').toBe(true)
  })

  it('rend des lundis, et rien d’autre', () => {
    for (const mois of ['2026-02-10', '2026-08-15', '2027-01-20', '2028-02-05']) {
      for (const lundi of lundisDuMois(mois)) {
        expect(lundiDeLaSemaine(lundi)).toBe(lundi)
      }
    }
  })

  it('espace les lundis de sept jours exactement', () => {
    const lundis = lundisDuMois('2026-10-15') // le mois du changement d'heure
    for (let i = 1; i < lundis.length; i++) {
      expect(decalerJours(lundis[i - 1], 7)).toBe(lundis[i])
    }
  })
})

describe('decalerMois', () => {
  it('rend le premier du mois voisin', () => {
    expect(decalerMois('2026-08-15', 1)).toBe('2026-09-01')
    expect(decalerMois('2026-08-15', -1)).toBe('2026-07-01')
  })

  it('franchit l’année dans les deux sens', () => {
    expect(decalerMois('2026-12-10', 1)).toBe('2027-01-01')
    expect(decalerMois('2026-01-10', -1)).toBe('2025-12-01')
  })
})

describe('saisonActuelle', () => {
  it('range les douze mois dans quatre saisons', () => {
    const saisonDu = (mois: number) => saisonActuelle(new Date(2026, mois, 15))
    expect(saisonDu(0)).toBe('hiver')
    expect(saisonDu(3)).toBe('printemps')
    expect(saisonDu(6)).toBe('ete')
    expect(saisonDu(9)).toBe('automne')
    expect(saisonDu(11)).toBe('hiver')
  })
})

describe('genererSemaine', () => {
  it('compose sept jours consécutifs à partir du lundi demandé', () => {
    const plan = genererSemaine(OPTIONS)
    expect(plan.debut).toBe('2026-08-03')
    expect(plan.jours).toHaveLength(7)
    expect(plan.jours.map((j) => j.date)).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ])
  })

  it('ne place que des recettes qui existent', () => {
    // Un identifiant qui ne résout pas produit une case vide à l'écran et une
    // ligne manquante dans la liste de courses, sans erreur.
    const introuvables = recettesDuPlan(genererSemaine(OPTIONS)).filter((id) => !recetteParId(id))
    expect(introuvables).toEqual([])
  })

  it('ne place une recette qu’au moment auquel elle appartient', () => {
    // Une tarte au dîner passerait ; un dîner au petit-déjeuner non.
    const plan = genererSemaine(OPTIONS)
    const fautives: string[] = []
    for (const jour of plan.jours) {
      for (const moment of MOMENTS) {
        const id = jour.repas[moment]
        if (!id) continue
        const recette = recetteParId(id)
        if (recette && recette.moment !== moment) {
          fautives.push(`${recette.titre} (${recette.moment}) placée en ${moment}`)
        }
      }
    }
    expect(fautives).toEqual([])
  })

  it('remplit la grille plutôt que de la trouer', () => {
    // Une grille trouée est pire qu'une soupe de courge en avril : c'est la
    // raison pour laquelle le hors-saison est pénalisé et non exclu.
    const plan = genererSemaine(OPTIONS)
    expect(recettesDuPlan(plan)).toHaveLength(28)
  })

  it('respecte un filtre d’étiquette', () => {
    const plan = genererSemaine({ ...OPTIONS, tags: ['vegetarien'] })
    const intruses = recettesDuPlan(plan)
      .map((id) => recetteParId(id))
      .filter((r) => r && !r.tags.includes('vegetarien'))
    expect(intruses.map((r) => r?.titre)).toEqual([])
  })

  it('compose une semaine à n’importe quelle saison', () => {
    for (const saison of ['hiver', 'printemps', 'ete', 'automne'] as const) {
      expect(recettesDuPlan(genererSemaine({ ...OPTIONS, saison }))).toHaveLength(28)
    }
  })
})

describe('genererSemaines — la mémoire partagée', () => {
  it('date chaque semaine sur son propre lundi', () => {
    const semaines = genererSemaines(OPTIONS, 4)
    expect(semaines.map((s) => s.debut)).toEqual([
      '2026-08-03',
      '2026-08-10',
      '2026-08-17',
      '2026-08-24',
    ])
  })

  it('produit quatre semaines, pas la même semaine quatre fois', () => {
    // C'est l'invariant que la mémoire partagée existe pour tenir : générées
    // indépendamment, quatre semaines repartiraient du même catalogue avec le
    // même barème et se ressembleraient toutes.
    const semaines = genererSemaines(OPTIONS, 4)
    const empreintes = semaines.map((s) => recettesDuPlan(s).join('|'))
    expect(new Set(empreintes).size).toBe(4)
  })

  it('puise largement dans le catalogue plutôt que de tourner sur une poignée de plats', () => {
    // Quatre semaines font 112 repas. Sans pénalité de répétition, les mêmes
    // plats revenaient deux ou trois fois par semaine — c'est le défaut que le
    // catalogue élargi et le barème devaient corriger.
    //
    // **Mesuré le 01/08/2026 : 112 recettes distinctes sur 112 repas, sur douze
    // exécutions d'affilée.** Aucune répétition, pas une seule fois. Le seuil
    // est posé à 100 et non à 112 : `PENALITE_DEJA_VUE` est une pénalité, pas
    // une interdiction, et exiger la perfection ferait tomber ce test sur un
    // tirage malheureux plutôt que sur une régression. À 100, une pénalité
    // retirée se verrait immédiatement.
    const tous = genererSemaines(OPTIONS, 4).flatMap(recettesDuPlan)
    expect(tous).toHaveLength(112)
    expect(new Set(tous).size).toBeGreaterThanOrEqual(100)
  })

  it('garde la pénalité de répétition par-dessus la frontière de semaine', () => {
    // Sans le décalage passé à `composer`, le dimanche d'une semaine et le lundi
    // de la suivante peuvent servir le même plat — la couture ne se voit qu'en
    // regardant deux semaines à la fois.
    const semaines = genererSemaines(OPTIONS, 4)
    const coutures: string[] = []
    for (let i = 1; i < semaines.length; i++) {
      const dimanche = semaines[i - 1].jours.at(-1)
      const lundi = semaines[i].jours[0]
      for (const moment of MOMENTS) {
        if (dimanche?.repas[moment] && dimanche.repas[moment] === lundi?.repas[moment]) {
          coutures.push(`${moment} répété entre les semaines ${i} et ${i + 1}`)
        }
      }
    }
    expect(coutures).toEqual([])
  })
})

describe('poser, retrouver et copier une semaine', () => {
  const plan = (debut: string): PlanSemaine => ({
    debut,
    genereLe: '2026-08-01',
    jours: Array.from({ length: 7 }, (_, i) => ({
      date: decalerJours(debut, i),
      repas: {
        'petit-dejeuner': `pdj-${i}`,
        dejeuner: `dej-${i}`,
        collation: null,
        diner: `din-${i}`,
      } as Record<Moment, string | null>,
    })),
  })

  it('remplace la semaine du même lundi plutôt que d’en ajouter une seconde', () => {
    // Deux plans pour le même lundi seraient deux vérités, et l'écran
    // afficherait celle que le hasard de l'ordre place en premier.
    const plans = [plan('2026-08-03')]
    poserPlan(plans, { ...plan('2026-08-03'), genereLe: '2026-08-02' })
    expect(plans).toHaveLength(1)
    expect(plans[0].genereLe).toBe('2026-08-02')

    poserPlan(plans, plan('2026-08-10'))
    expect(plans).toHaveLength(2)
  })

  it('retrouve le plan qui couvre une date, par son lundi', () => {
    const plans = [plan('2026-08-03'), plan('2026-08-10')]
    expect(planDeLaDate(plans, '2026-08-06')?.debut).toBe('2026-08-03')
    expect(planDeLaDate(plans, '2026-08-09')?.debut).toBe('2026-08-03')
    expect(planDeLaDate(plans, '2026-08-10')?.debut).toBe('2026-08-10')
    expect(planDeLaDate(plans, '2026-09-01')).toBeUndefined()
  })

  it('redate une semaine copiée sans toucher à l’originale', () => {
    const source = plan('2026-08-03')
    const copie = copieDeSemaine(source, '2026-08-17')
    expect(copie.debut).toBe('2026-08-17')
    expect(copie.jours.map((j) => j.date)).toEqual(
      Array.from({ length: 7 }, (_, i) => decalerJours('2026-08-17', i)),
    )
    expect(recettesDuPlan(copie)).toEqual(recettesDuPlan(source))

    // Les repas sont recopiés, pas partagés : modifier la copie ne doit pas
    // modifier l'original.
    copie.jours[0].repas.dejeuner = 'autre'
    expect(source.jours[0].repas.dejeuner).toBe('dej-0')
  })

  it('copie un jour sans vider celui d’origine', () => {
    // « J'ai bien mangé hier, je remets la même chose » ne doit pas effacer hier.
    const p = plan('2026-08-03')
    copierJour(p, '2026-08-03', '2026-08-06')
    expect(p.jours[3].repas).toEqual(p.jours[0].repas)
    expect(p.jours[0].repas.dejeuner).toBe('dej-0')
  })

  it('ne fait rien plutôt que de planter sur une date absente', () => {
    const p = plan('2026-08-03')
    expect(() => copierJour(p, '2026-01-01', '2026-08-06')).not.toThrow()
    expect(p.jours[3].repas.dejeuner).toBe('dej-3')
  })
})

describe('deplacerRepas', () => {
  const plan = (): PlanSemaine => ({
    debut: '2026-08-03',
    genereLe: '2026-08-01',
    jours: [
      {
        date: '2026-08-03',
        repas: { 'petit-dejeuner': null, dejeuner: 'A', collation: null, diner: 'B' },
      },
      {
        date: '2026-08-04',
        repas: { 'petit-dejeuner': null, dejeuner: 'C', collation: null, diner: null },
      },
    ],
  })

  it('échange deux repas plutôt que d’en écraser un', () => {
    // Un geste de glisser-déposer qui détruit une donnée est un geste qu'on
    // n'ose plus refaire.
    const p = plan()
    deplacerRepas(p, { date: '2026-08-03', moment: 'dejeuner' }, { date: '2026-08-04', moment: 'dejeuner' })
    expect(p.jours[0].repas.dejeuner).toBe('C')
    expect(p.jours[1].repas.dejeuner).toBe('A')
  })

  it('laisse la case d’origine vide quand la cible l’était', () => {
    const p = plan()
    deplacerRepas(p, { date: '2026-08-03', moment: 'dejeuner' }, { date: '2026-08-04', moment: 'diner' })
    expect(p.jours[0].repas.dejeuner).toBeNull()
    expect(p.jours[1].repas.diner).toBe('A')
  })

  it('déplace aussi d’un moment à l’autre dans la même journée', () => {
    const p = plan()
    deplacerRepas(p, { date: '2026-08-03', moment: 'dejeuner' }, { date: '2026-08-03', moment: 'collation' })
    expect(p.jours[0].repas.dejeuner).toBeNull()
    expect(p.jours[0].repas.collation).toBe('A')
  })

  it('ne fait rien plutôt que de planter sur une date absente', () => {
    const p = plan()
    expect(() =>
      deplacerRepas(p, { date: '2030-01-01', moment: 'dejeuner' }, { date: '2026-08-04', moment: 'dejeuner' }),
    ).not.toThrow()
    expect(p.jours[1].repas.dejeuner).toBe('C')
  })
})

describe('les modèles — sans dates, par construction', () => {
  const source: PlanSemaine = {
    debut: '2026-08-03',
    genereLe: '2026-08-01',
    jours: Array.from({ length: 7 }, (_, i) => ({
      date: decalerJours('2026-08-03', i),
      repas: {
        'petit-dejeuner': `pdj-${i}`,
        dejeuner: `dej-${i}`,
        collation: null,
        diner: null,
      } as Record<Moment, string | null>,
    })),
  }

  it('ne garde aucune date dans le modèle', () => {
    // Y garder les dates d'origine obligerait à les recalculer à chaque pose, et
    // la première erreur de décalage passerait inaperçue.
    const modele = modeleDepuisPlan(source, 'Ma semaine type')
    expect(JSON.stringify(modele)).not.toContain('2026-08')
    expect(modele.jours).toHaveLength(7)
  })

  it('se pose sur n’importe quel lundi, dans le bon ordre', () => {
    const modele = modeleDepuisPlan(source, 'Ma semaine type')
    const pose = planDepuisModele(modele, '2026-11-02')
    expect(pose.debut).toBe('2026-11-02')
    expect(pose.jours.map((j) => j.date)).toEqual(
      Array.from({ length: 7 }, (_, i) => decalerJours('2026-11-02', i)),
    )
    expect(recettesDuPlan(pose)).toEqual(recettesDuPlan(source))
  })

  it('se pose deux fois sans que les deux poses se partagent leurs repas', () => {
    const modele = modeleDepuisPlan(source, 'Ma semaine type')
    const a = planDepuisModele(modele, '2026-11-02')
    const b = planDepuisModele(modele, '2026-11-09')
    a.jours[0].repas.dejeuner = 'modifié'
    expect(b.jours[0].repas.dejeuner).toBe('dej-0')
  })

  it('donne un nom au modèle même quand on n’en saisit aucun', () => {
    expect(modeleDepuisPlan(source, '   ').nom).toBe('Ma semaine type')
  })
})

describe('planPerime', () => {
  it('considère périmé un plan qui ne couvre plus la semaine en cours', () => {
    const plan: PlanSemaine = { debut: '2026-08-03', genereLe: '2026-08-01', jours: [] }
    expect(planPerime(plan, '2026-08-06')).toBe(false)
    expect(planPerime(plan, '2026-08-10')).toBe(true)
    expect(planPerime(null, '2026-08-06')).toBe(true)
  })
})

describe('bilanDuPlan', () => {
  it('ne compte que les journées réellement composées', () => {
    const plan = genererSemaine(OPTIONS)
    const bilan = bilanDuPlan(plan)
    expect(bilan.joursRemplis).toBe(7)
    expect(bilan.repasPrevus).toBe(28)
    expect(bilan.kcalMoyenne).toBeGreaterThan(0)
    expect(bilan.minutesTotales).toBeGreaterThan(0)
  })

  it('rend un bilan à zéro sur une semaine vide, sans diviser par zéro', () => {
    const vide: PlanSemaine = {
      debut: '2026-08-03',
      genereLe: '2026-08-01',
      jours: Array.from({ length: 7 }, (_, i) => ({
        date: decalerJours('2026-08-03', i),
        repas: {
          'petit-dejeuner': null,
          dejeuner: null,
          collation: null,
          diner: null,
        } as Record<Moment, string | null>,
      })),
    }
    expect(bilanDuPlan(vide)).toEqual({
      joursRemplis: 0,
      repasPrevus: 0,
      kcalMoyenne: 0,
      minutesTotales: 0,
    })
  })

  it('ignore un identifiant qui ne résout plus, sans fausser le total', () => {
    const plan: PlanSemaine = {
      debut: '2026-08-03',
      genereLe: '2026-08-01',
      jours: [
        {
          date: '2026-08-03',
          repas: {
            'petit-dejeuner': 'c:inexistante',
            dejeuner: null,
            collation: null,
            diner: null,
          },
        },
      ],
    }
    expect(totalDuJour(plan.jours[0])).toBe(0)
    expect(bilanDuPlan(plan).minutesTotales).toBe(0)
  })
})
