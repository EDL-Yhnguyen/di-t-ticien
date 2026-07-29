import type { EtatUtilisateur } from './store'
import { poidsLePlusRecent } from './store'
import { VERRES_PAR_JOUR } from './plan'
import { jourISO } from './utils'

export interface Badge {
  code: string
  titre: string
  /** Ce qu'il faut faire pour l'obtenir — écrit à l'infinitif, jamais en jargon. */
  condition: string
  emoji: string
  atteint: (etat: EtatUtilisateur) => boolean
}

/**
 * Une journée compte dès que deux repas ont été renseignés.
 *
 * Les deux façons de renseigner comptent : noter ce qu'on a mangé dans le
 * journal, ou cocher les composants du plan prescrit. Ne reconnaître que l'une
 * des deux romprait la série de quelqu'un qui change de méthode en cours de
 * route — c'est-à-dire de tous ceux qui viennent de l'ancienne version.
 */
export function journeeRenseignee(etat: EtatUtilisateur, date: string): boolean {
  const coches = etat.repas.filter((r) => r.date === date && r.composantsCoches.length > 0)
  const notes = new Set(etat.journal.filter((e) => e.date === date).map((e) => e.moment))
  return coches.length + notes.size >= 2
}

/**
 * Nombre de jours consécutifs renseignés, en s'arrêtant à hier si aujourd'hui
 * ne l'est pas encore : la série ne doit pas paraître rompue à 8 h du matin.
 */
export function serie(etat: EtatUtilisateur): number {
  const curseur = new Date()
  if (!journeeRenseignee(etat, jourISO(curseur))) {
    curseur.setDate(curseur.getDate() - 1)
  }
  let total = 0
  while (journeeRenseignee(etat, jourISO(curseur))) {
    total += 1
    curseur.setDate(curseur.getDate() - 1)
  }
  return total
}

export function joursRenseignes(etat: EtatUtilisateur): number {
  const jours = new Set([
    ...etat.repas.filter((r) => r.composantsCoches.length > 0).map((r) => r.date),
    ...etat.journal.map((e) => e.date),
  ])
  return [...jours].filter((d) => journeeRenseignee(etat, d)).length
}

export function enviesResistees(etat: EtatUtilisateur): number {
  return etat.envies.filter((e) => e.issue === 'resistee').length
}

export function kilosPerdus(etat: EtatUtilisateur): number {
  return Math.max(0, etat.profil.poidsDepartKg - poidsLePlusRecent(etat))
}

function joursHydratationAtteinte(etat: EtatUtilisateur): number {
  return etat.eau.filter((e) => e.verres >= VERRES_PAR_JOUR).length
}

const palierSerie = (jours: number, titre: string, emoji: string): Badge => ({
  code: `serie-${jours}`,
  titre,
  condition: `Renseigner ses repas ${jours} jours d’affilée`,
  emoji,
  atteint: (etat) => serie(etat) >= jours,
})

const palierPoids = (kg: number, titre: string, emoji: string): Badge => ({
  code: `poids-${kg}`,
  titre,
  condition: `Perdre ${kg} kg depuis le départ`,
  emoji,
  atteint: (etat) => kilosPerdus(etat) >= kg,
})

export const BADGES: Badge[] = [
  {
    code: 'premiere-assiette',
    titre: 'Première assiette',
    condition: 'Renseigner un premier repas',
    emoji: '🍽️',
    atteint: (etat) =>
      etat.journal.length > 0 || etat.repas.some((r) => r.composantsCoches.length > 0),
  },
  palierSerie(3, 'Trois jours tenus', '🌱'),
  palierSerie(7, 'Une semaine pleine', '🌿'),
  palierSerie(14, 'Quinze jours', '🌳'),
  palierSerie(30, 'Un mois entier', '🏔️'),
  palierSerie(60, 'Deux mois', '👑'),
  palierPoids(1, 'Le premier kilo', '🎈'),
  palierPoids(2, 'Deux kilos', '🪶'),
  palierPoids(3, 'Trois kilos', '🎏'),
  palierPoids(5, 'La moitié du chemin', '⛵'),
  palierPoids(7, 'Sept kilos', '🚀'),
  {
    code: 'objectif',
    titre: 'Objectif atteint',
    condition: 'Atteindre le poids visé',
    emoji: '🏆',
    atteint: (etat) => poidsLePlusRecent(etat) <= etat.profil.poidsObjectifKg,
  },
  {
    code: 'envie-1',
    titre: 'Première envie domptée',
    condition: 'Laisser passer une envie de grignoter',
    emoji: '🛡️',
    atteint: (etat) => enviesResistees(etat) >= 1,
  },
  {
    code: 'envie-10',
    titre: 'Dix fois plus forte',
    condition: 'Laisser passer 10 envies',
    emoji: '⚔️',
    atteint: (etat) => enviesResistees(etat) >= 10,
  },
  {
    code: 'envie-25',
    titre: 'Le grignotage attendra',
    condition: 'Laisser passer 25 envies',
    emoji: '🗿',
    atteint: (etat) => enviesResistees(etat) >= 25,
  },
  {
    code: 'eau-7',
    titre: 'Bien hydratée',
    condition: 'Atteindre 1,5 L sur 7 journées',
    emoji: '💧',
    atteint: (etat) => joursHydratationAtteinte(etat) >= 7,
  },
  {
    code: 'assiettes-30',
    titre: 'Trente assiettes',
    condition: 'Renseigner 30 journées complètes',
    emoji: '📖',
    atteint: (etat) => joursRenseignes(etat) >= 30,
  },
]

/** Badges nouvellement remplis mais pas encore enregistrés : ceux à célébrer. */
export function badgesADebloquer(etat: EtatUtilisateur): Badge[] {
  return BADGES.filter((b) => !etat.badges.includes(b.code) && b.atteint(etat))
}

export function badgeParCode(code: string): Badge | undefined {
  return BADGES.find((b) => b.code === code)
}
