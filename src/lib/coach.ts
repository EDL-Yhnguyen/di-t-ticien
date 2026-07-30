import { ALIMENTS_A_CONSEILLER } from './aliments/conseil'
import { apportDe, bilanParRepas, cibleDuRepas, objectifsMacros, totalDuJour } from './journal'
import type { Apport, BilanRepas } from './journal'
import { valeurNutri } from './nutriscore'
import type { Aliment, EntreeJournal, Moment } from './types'
import { LIBELLE_MOMENT, MOMENTS } from './types'
import { jourISO } from './utils'

/**
 * Le coach : ce que l'application a le droit de dire sur ce qui a été mangé.
 *
 * Tout est déduit de règles lisibles, pas d'un modèle. Deux raisons : une
 * remarque sur l'alimentation de quelqu'un doit pouvoir être expliquée, et
 * l'application n'est pas un dispositif médical — elle décrit des écarts à un
 * repère calculé, elle ne diagnostique rien.
 *
 * Règle de ton : jamais de reproche. On décrit, on propose, on n'accuse pas.
 */

export type Verdict = 'leger' | 'juste' | 'copieux' | 'vide'

export const TON_VERDICT: Record<Verdict, { libelle: string; ton: 'reussite' | 'primaire' | 'accent' | 'neutre' }> = {
  leger: { libelle: 'Léger', ton: 'reussite' },
  juste: { libelle: 'Dans la cible', ton: 'primaire' },
  copieux: { libelle: 'Copieux', ton: 'accent' },
  vide: { libelle: 'Rien de noté', ton: 'neutre' },
}

export interface AnalyseRepas {
  moment: Moment
  verdict: Verdict
  cibleKcal: number
  kcal: number
  /** Une phrase, à afficher telle quelle. */
  message: string
}

export function analyserRepas(bilan: BilanRepas, objectifKcal: number): AnalyseRepas {
  const cible = cibleDuRepas(objectifKcal, bilan.moment)
  const kcal = Math.round(bilan.apport.kcal)
  const nom = LIBELLE_MOMENT[bilan.moment].toLowerCase()

  if (bilan.entrees.length === 0) {
    return {
      moment: bilan.moment,
      verdict: 'vide',
      cibleKcal: cible,
      kcal: 0,
      message: `Rien de noté au ${nom}. Comptez environ ${cible} kcal quand vous y serez.`,
    }
  }

  const ecart = kcal / Math.max(1, cible)
  const qualite = bilan.qualite

  if (ecart < 0.7) {
    const message =
      qualite >= 3
        ? `Léger et de bonne qualité. Si la faim revient avant le prochain repas, c'est le signe d'en ajouter un peu.`
        : `${cible - kcal} kcal sous le repère. Un repas léger n'est un problème que s'il déclenche un grignotage ensuite.`
    return { moment: bilan.moment, verdict: 'leger', cibleKcal: cible, kcal, message }
  }

  if (ecart <= 1.15) {
    const message =
      qualite >= 3
        ? `Bien vu : le volume est juste et la qualité nutritionnelle est bonne.`
        : `Le volume est juste. C'est la qualité qui pourrait gagner — voyez les alternatives ci-dessous.`
    return { moment: bilan.moment, verdict: 'juste', cibleKcal: cible, kcal, message }
  }

  const surplus = kcal - cible
  const message =
    qualite >= 3
      ? `${surplus} kcal au-dessus du repère, mais avec de bons apports. Un repas plus léger ensuite rééquilibre la journée.`
      : `${surplus} kcal au-dessus du repère. Regardez la plus grosse tuile du repas : c'est presque toujours elle qui explique l'écart.`
  return { moment: bilan.moment, verdict: 'copieux', cibleKcal: cible, kcal, message }
}

export function analyserLaJournee(journal: EntreeJournal[], objectifKcal: number, date = jourISO()) {
  return bilanParRepas(journal, date).map((b) => analyserRepas(b, objectifKcal))
}

/* ────────────────────── Recommandation du prochain repas ────────────────────── */

export interface Recommandation {
  moment: Moment
  /** Ce qu'il reste dans la journée, éventuellement négatif. */
  resteKcal: number
  titre: string
  conseil: string
  /** Ce qui manque le plus dans la journée, à privilégier. */
  manques: string[]
  suggestions: Aliment[]
}

function prochainMoment(date: string, journal: EntreeJournal[]): Moment {
  const remplis = new Set(
    journal.filter((e) => e.date === date).map((e) => e.moment),
  )
  const heure = new Date().getHours()
  const attendu: Moment =
    heure < 11 ? 'petit-dejeuner' : heure < 15 ? 'dejeuner' : heure < 18 ? 'collation' : 'diner'

  if (!remplis.has(attendu)) return attendu
  return MOMENTS.find((m) => !remplis.has(m)) ?? 'diner'
}

/**
 * Ce qu'il serait utile de manger ensuite, d'après ce qui a déjà été mangé.
 *
 * On raisonne sur ce qui *manque* plutôt que sur ce qui a été consommé en
 * trop : dire « il vous reste 620 kcal et pas assez de fibres » est actionnable,
 * dire « vous avez trop mangé » ne l'est pas.
 */
export function recommanderProchainRepas(
  journal: EntreeJournal[],
  objectifKcal: number,
  date = jourISO(),
): Recommandation {
  const total = totalDuJour(journal, date)
  const moment = prochainMoment(date, journal)
  const reste = Math.round(objectifKcal - total.kcal)
  const cibles = objectifsMacros(objectifKcal)

  const manques: string[] = []
  if (total.proteines < cibles.proteines * 0.6) manques.push('protéines')
  if (total.fibres < 18) manques.push('fibres')
  if (total.kcal > 0 && total.satures > 16) manques.push('moins de graisses saturées')
  if (total.sel > 5) manques.push('moins de sel')

  const nom = LIBELLE_MOMENT[moment].toLowerCase()
  let titre: string
  let conseil: string

  if (reste < 0) {
    titre = `Le repère du jour est atteint`
    conseil = `Vous êtes ${Math.abs(reste)} kcal au-dessus. Ce n'est pas grave sur une journée : un ${nom} léger et riche en légumes referme la journée sans frustration.`
  } else if (reste < 250) {
    titre = `Il reste ${reste} kcal`
    conseil = `De quoi faire un ${nom} léger. Visez du volume plutôt que de la densité : légumes, soupe, un laitage nature.`
  } else {
    titre = `Il reste ${reste} kcal`
    conseil = manques.length
      ? `Assez pour un vrai ${nom}. La journée manque surtout de ${listeFrancaise(manques)}.`
      : `Assez pour un vrai ${nom}. La journée est bien répartie jusqu'ici — continuez sur cette lancée.`
  }

  return {
    moment,
    resteKcal: reste,
    titre,
    conseil,
    manques,
    suggestions: suggestionsPour(reste, manques, moment),
  }
}

function listeFrancaise(elements: string[]): string {
  if (elements.length <= 1) return elements[0] ?? ''
  return `${elements.slice(0, -1).join(', ')} et ${elements.at(-1)}`
}

/** Aliments de la base qui rentrent dans ce qu'il reste et comblent les manques. */
function suggestionsPour(resteKcal: number, manques: string[], moment: Moment): Aliment[] {
  const budgetRepas = Math.max(120, resteKcal * (moment === 'collation' ? 0.4 : 0.8))
  const veutProteines = manques.includes('protéines')
  const veutFibres = manques.includes('fibres')

  // `ALIMENTS_A_CONSEILLER` et non toute la base : le coach propose de lui-même,
  // et la base contient désormais des ingrédients (épices, farines) et des
  // alcools qu'on doit pouvoir noter sans qu'ils soient jamais recommandés.
  return ALIMENTS_A_CONSEILLER.filter((a) => a.famille !== 'boisson')
    .map((aliment) => {
      const portion = aliment.portionG ?? 100
      const kcal = (aliment.valeurs.kcal * portion) / 100
      if (kcal > budgetRepas || kcal < 20) return null

      let note = valeurNutri(aliment.nutriScore)
      if (veutProteines) note += aliment.valeurs.proteines / 6
      if (veutFibres) note += aliment.valeurs.fibres / 3
      return { aliment, note }
    })
    .filter((x): x is { aliment: Aliment; note: number } => x !== null)
    .sort((a, b) => b.note - a.note)
    .slice(0, 4)
    .map((x) => x.aliment)
}

/* ─────────────────────────────── Alternatives ─────────────────────────────── */

type Role = 'proteine' | 'feculent' | 'gras' | 'leger' | 'boisson'

/**
 * Le rôle d'un aliment dans l'assiette, déduit de la répartition de ses
 * calories. Sert uniquement à ne pas proposer une pomme en remplacement d'un
 * steak : une alternative doit tenir le même rôle dans le repas.
 */
export function roleDe(aliment: Aliment): Role {
  if (aliment.famille === 'boisson') return 'boisson'
  const { kcal, proteines, glucides, lipides } = aliment.valeurs
  if (kcal < 70) return 'leger'
  const partProteines = (proteines * 4) / Math.max(1, kcal)
  const partGlucides = (glucides * 4) / Math.max(1, kcal)
  const partLipides = (lipides * 9) / Math.max(1, kcal)
  if (partProteines >= 0.3) return 'proteine'
  if (partLipides >= 0.55) return 'gras'
  if (partGlucides >= 0.45) return 'feculent'
  return 'gras'
}

export interface Alternative {
  aliment: Aliment
  quantiteG: number
  kcalEconomisees: number
}

/**
 * Des remplacements plausibles pour une entrée du journal.
 *
 * On garde le rôle et on cherche mieux noté **à quantité comparable** : une
 * alternative qui économise 200 kcal en divisant la portion par trois ne rend
 * service à personne.
 */
export function alternativesPour(entree: EntreeJournal, limite = 3): Alternative[] {
  const role = roleDe(entree.aliment)
  if (role === 'leger') return []

  const apport = apportDe(entree)
  const noteActuelle = valeurNutri(entree.aliment.nutriScore)

  return ALIMENTS_A_CONSEILLER.filter(
    (a) => a.id !== entree.aliment.id && roleDe(a) === role,
  )
    .map((aliment) => {
      const quantiteG = Math.round(entree.quantiteG)
      const kcal = (aliment.valeurs.kcal * quantiteG) / 100
      const gain = apport.kcal - kcal
      const note = valeurNutri(aliment.nutriScore)

      // Il faut soit une meilleure note, soit une économie réelle. Un
      // remplacement équivalent sur les deux plans n'est pas un conseil.
      if (note <= noteActuelle && gain < 40) return null

      return { aliment, quantiteG, kcalEconomisees: Math.round(gain), note }
    })
    .filter((x): x is Alternative & { note: number } => x !== null)
    .sort((a, b) => b.note - a.note || b.kcalEconomisees - a.kcalEconomisees)
    .slice(0, limite)
    .map(({ aliment, quantiteG, kcalEconomisees }) => ({ aliment, quantiteG, kcalEconomisees }))
}

/* ───────────────────────────── Résumé du jour ───────────────────────────── */

export interface ResumeJour {
  kcal: number
  objectifKcal: number
  part: number
  depasse: boolean
  macros: Apport
  cibles: ReturnType<typeof objectifsMacros>
  phrase: string
}

export function resumerLaJournee(
  journal: EntreeJournal[],
  objectifKcal: number,
  date = jourISO(),
): ResumeJour {
  const macros = totalDuJour(journal, date)
  const kcal = Math.round(macros.kcal)
  const part = objectifKcal > 0 ? kcal / objectifKcal : 0
  const cibles = objectifsMacros(objectifKcal)

  let phrase: string
  if (kcal === 0) phrase = 'Rien de noté aujourd’hui. Ajoutez ce que vous venez de manger.'
  else if (part < 0.5) phrase = 'Journée bien entamée, la marge est encore large.'
  else if (part < 0.9) phrase = 'Vous êtes dans le rythme de votre objectif.'
  else if (part <= 1.05) phrase = 'Objectif du jour atteint, pile dans la cible.'
  else phrase = `Vous êtes ${kcal - objectifKcal} kcal au-dessus du repère du jour.`

  return { kcal, objectifKcal, part, depasse: part > 1, macros, cibles, phrase }
}
