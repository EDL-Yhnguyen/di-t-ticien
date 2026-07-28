import type { Utilisateur } from './auth'
import { estCompteElodie } from './auth'
import { supabase } from './supabase'
import { jourISO } from './utils'
import type {
  EnvieEntree,
  JournalEau,
  JournalRepas,
  PeseeEntree,
  Profil,
  ScoreJeu,
} from './types'

/**
 * Tout l'état d'un utilisateur tient dans un seul document.
 *
 * C'est un choix assumé : le volume est minuscule (quelques dizaines de Ko
 * après un an) et rien ici n'a besoin d'être agrégé côté serveur. En échange,
 * le mode démo et le mode Supabase partagent exactement le même code, et la
 * base se résume à une table et une politique d'accès.
 */
export interface EtatUtilisateur {
  profil: Profil
  pesees: PeseeEntree[]
  repas: JournalRepas[]
  eau: JournalEau[]
  envies: EnvieEntree[]
  scores: ScoreJeu[]
  badges: string[]
}

const CLE_LOCALE = (id: string) => `equilibre:donnees:${id}`

export function profilInitial(u: Utilisateur): Profil {
  const elodie = estCompteElodie(u.email)

  return {
    id: u.id,
    prenom: u.prenom || (elodie ? 'Élodie' : ''),
    email: u.email,
    sexe: 'femme',
    // Taille et âge sont les deux seules inconnues du dossier d'Élodie :
    // l'onboarding ne lui demande que ça, le reste est déjà rempli.
    age: 35,
    tailleCm: 165,
    poidsDepartKg: elodie ? 71 : 70,
    poidsObjectifKg: elodie ? 61 : 65,
    activite: 'sedentaire',
    herbalifeActif: false,
    planPrescrit: elodie,
    onboardingFait: false,
    motDePasseAChanger: elodie,
    creeLe: new Date().toISOString(),
  }
}

export function etatInitial(u: Utilisateur): EtatUtilisateur {
  const profil = profilInitial(u)
  return {
    profil,
    pesees: [{ date: jourISO(), poidsKg: profil.poidsDepartKg }],
    repas: [],
    eau: [],
    envies: [],
    scores: [],
    badges: [],
  }
}

export async function charger(u: Utilisateur): Promise<EtatUtilisateur> {
  if (supabase) {
    const { data, error } = await supabase
      .from('donnees')
      .select('contenu')
      .eq('user_id', u.id)
      .maybeSingle()

    if (error) throw new Error(`Lecture impossible : ${error.message}`)
    if (data?.contenu) return fusionner(u, data.contenu as Partial<EtatUtilisateur>)

    const frais = etatInitial(u)
    await enregistrer(u.id, frais)
    return frais
  }

  const brut = localStorage.getItem(CLE_LOCALE(u.id))
  if (!brut) {
    const frais = etatInitial(u)
    await enregistrer(u.id, frais)
    return frais
  }
  try {
    return fusionner(u, JSON.parse(brut))
  } catch {
    return etatInitial(u)
  }
}

export async function enregistrer(userId: string, etat: EtatUtilisateur): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('donnees')
      .upsert({ user_id: userId, contenu: etat, maj_le: new Date().toISOString() })
    if (error) throw new Error(`Enregistrement impossible : ${error.message}`)
    return
  }
  localStorage.setItem(CLE_LOCALE(userId), JSON.stringify(etat))
}

/** Complète un document ancien avec les champs ajoutés depuis sa création. */
function fusionner(u: Utilisateur, partiel: Partial<EtatUtilisateur>): EtatUtilisateur {
  const base = etatInitial(u)
  return {
    profil: { ...base.profil, ...partiel.profil, id: u.id, email: u.email },
    pesees: partiel.pesees ?? base.pesees,
    repas: partiel.repas ?? [],
    eau: partiel.eau ?? [],
    envies: partiel.envies ?? [],
    scores: partiel.scores ?? [],
    badges: partiel.badges ?? [],
  }
}

/* ───────────────────────── Lectures dérivées ───────────────────────── */

export function poidsActuel(etat: EtatUtilisateur): number {
  const triees = [...etat.pesees].sort((a, b) => a.date.localeCompare(b.date))
  return triees.at(-1)?.poidsKg ?? etat.profil.poidsDepartKg
}

export function peseeDuJour(etat: EtatUtilisateur, date = jourISO()): PeseeEntree | undefined {
  return etat.pesees.find((p) => p.date === date)
}

export function repasDuJour(etat: EtatUtilisateur, date = jourISO()): JournalRepas[] {
  return etat.repas.filter((r) => r.date === date)
}

export function eauDuJour(etat: EtatUtilisateur, date = jourISO()): JournalEau {
  return etat.eau.find((e) => e.date === date) ?? { date, verres: 0 }
}

export function enviesDuJour(etat: EtatUtilisateur, date = jourISO()): EnvieEntree[] {
  return etat.envies.filter((e) => e.horodatage.slice(0, 10) === date)
}

export function meilleurScore(etat: EtatUtilisateur, jeu: string): number {
  return etat.scores.filter((s) => s.jeu === jeu).reduce((max, s) => Math.max(max, s.score), 0)
}

export type { EnvieEntree, JournalEau, JournalRepas, PeseeEntree, Profil, ScoreJeu }
