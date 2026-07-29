import { bilanParRepas, serieDeJours, totalDuJour } from './journal'
import { imc, objectifCalorique, LIBELLE_ACTIVITE } from './nutrition'
import { bonusSportDuJour, seancesDuJour } from './sport'
import { poidsLePlusRecent, type EtatUtilisateur } from './store'
import type { MessageCoach } from './types'
import { LIBELLE_MOMENT, MOMENTS } from './types'
import { jourISO } from './utils'

/**
 * Le coach conversationnel, côté navigateur.
 *
 * Ce module prépare ce qui part vers `/api/coach` et traduit ce qui en revient.
 * Il ne contient aucune règle nutritionnelle : celles-là restent dans
 * `coach.ts`, lisibles, et c'est volontaire — voir l'en-tête de `api/coach.ts`.
 */

export class ErreurCoach extends Error {
  /** Vrai quand l'échec vient de la configuration et non de la question. */
  readonly configurable: boolean
  constructor(message: string, configurable = false) {
    super(message)
    this.configurable = configurable
  }
}

/* ─────────────────────────── Ce qui part du navigateur ─────────────────────────── */

/**
 * L'instantané envoyé avec la question.
 *
 * Il est construit ici, explicitement, plutôt que d'expédier le document
 * entier : le coach n'a besoin ni des pesées d'il y a six mois, ni des scores
 * de jeu, et rien de tout cela n'a à sortir du navigateur. Les coordonnées du
 * praticien, en particulier, n'en sortent jamais — ce sont celles d'un tiers.
 */
export interface ContexteCoach {
  prenom: string
  age: number
  sexe: string
  tailleCm: number
  poidsKg: number
  poidsObjectifKg: number
  activite: string
  imc: number
  objectifKcal: number
  bonusSportKcal: number
  date: string
  kcalMangees: number
  proteines: number
  glucides: number
  lipides: number
  fibres: number
  repas: { moment: string; kcal: number; aliments: string[] }[]
  seances: { libelle: string; minutes: number; kcal: number }[]
  serieJours: number
  suiviParUnProfessionnel: boolean
  planPrescrit: boolean
}

export function construireContexte(etat: EtatUtilisateur, date = jourISO()): ContexteCoach {
  const poidsKg = poidsLePlusRecent(etat)
  const objectifBase = objectifCalorique({
    poidsKg,
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  })
  const bonusSportKcal = bonusSportDuJour(etat.seances, date)
  const total = totalDuJour(etat.journal, date)
  const bilans = bilanParRepas(etat.journal, date)

  return {
    prenom: etat.profil.prenom,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    tailleCm: etat.profil.tailleCm,
    poidsKg,
    poidsObjectifKg: etat.profil.poidsObjectifKg,
    activite: LIBELLE_ACTIVITE[etat.profil.activite],
    imc: imc(poidsKg, etat.profil.tailleCm),
    // Le même chiffre que celui affiché sur Aujourd'hui, bonus sport compris :
    // le coach ne doit pas raisonner sur un objectif que la personne ne voit
    // nulle part.
    objectifKcal: objectifBase + bonusSportKcal,
    bonusSportKcal,
    date,
    kcalMangees: total.kcal,
    proteines: total.proteines,
    glucides: total.glucides,
    lipides: total.lipides,
    fibres: total.fibres,
    repas: MOMENTS.map((moment) => {
      const bilan = bilans.find((b) => b.moment === moment)
      return {
        moment: LIBELLE_MOMENT[moment],
        kcal: Math.round(bilan?.apport.kcal ?? 0),
        aliments: (bilan?.entrees ?? []).map((e) => e.aliment.nom),
      }
    }).filter((r) => r.aliments.length > 0),
    seances: seancesDuJour(etat.seances, date).map((s) => ({
      libelle: s.libelle,
      minutes: s.minutes,
      kcal: s.kcal,
    })),
    serieJours: serieDeJours(etat.journal),
    suiviParUnProfessionnel: etat.profil.praticien !== null,
    planPrescrit: etat.profil.planPrescrit,
  }
}

/* ─────────────────────────────── L'appel ─────────────────────────────── */

interface ReponseBrute {
  reponse?: string
  erreur?: string
  configurable?: boolean
}

export async function demanderAuCoach(
  messages: MessageCoach[],
  contexte: ContexteCoach,
  signal?: AbortSignal,
): Promise<string> {
  let reponse: Response
  try {
    reponse = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, texte: m.texte })),
        contexte,
      }),
      signal,
    })
  } catch {
    throw new ErreurCoach('Le coach n’a pas pu être joint. Vérifiez votre connexion.')
  }

  // Une réponse illisible n'est pas forcément une panne du coach : en
  // développement, `/api` n'existe pas et le serveur Vite renvoie la page
  // d'accueil. Le message doit rester vrai dans les deux cas.
  let donnees: ReponseBrute
  try {
    donnees = (await reponse.json()) as ReponseBrute
  } catch {
    throw new ErreurCoach(
      reponse.ok
        ? 'Le coach a renvoyé une réponse illisible.'
        : 'Le coach est injoignable sur ce déploiement.',
      reponse.status === 404,
    )
  }

  if (!reponse.ok || !donnees.reponse) {
    throw new ErreurCoach(
      donnees.erreur ?? 'Le coach est injoignable pour le moment. Réessayez dans un instant.',
      donnees.configurable === true,
    )
  }

  return donnees.reponse
}

/* ───────────────────────────── Amorces de conversation ───────────────────────────── */

/**
 * Les questions proposées quand la conversation est vide.
 *
 * Elles dépendent de la journée : proposer « que me conseillez-vous ce soir ? »
 * à quelqu'un qui n'a encore rien noté ne mène nulle part.
 */
export function amorces(contexte: ContexteCoach): string[] {
  const questions: string[] = []

  if (contexte.repas.length === 0) {
    questions.push('Par quoi commencer ma journée ?')
  } else {
    questions.push('Comment se passe ma journée jusqu’ici ?')
    questions.push('Que me conseillez-vous pour le prochain repas ?')
  }

  if (contexte.seances.length === 0) {
    questions.push('Quelle activité physique me conseillez-vous ?')
  }

  questions.push('Comment tenir sur la durée sans me priver ?')

  return questions.slice(0, 4)
}
