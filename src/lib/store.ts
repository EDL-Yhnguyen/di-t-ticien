import type { Utilisateur } from './auth'
import { estCompteElodie } from './auth'
import { supabase } from './supabase'
import { jourISO } from './utils'
import type {
  Aliment,
  ArticleStock,
  Consentement,
  EntreeJournal,
  EnvieEntree,
  JournalEau,
  JournalRepas,
  MesureSante,
  MessageCoach,
  PeseeEntree,
  PlanSemaine,
  Profil,
  ScoreJeu,
  SeanceSport,
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
  /** `null` tant que le traitement des données de santé n'a pas été accepté. */
  consentement: Consentement | null
  pesees: PeseeEntree[]
  /** Cases cochées du plan prescrit — l'ancien mode, conservé tel quel. */
  repas: JournalRepas[]
  /** Ce qui a réellement été mangé, avec ses valeurs nutritionnelles. */
  journal: EntreeJournal[]
  /** Aliments créés à la main par l'utilisateur, proposés à la recherche. */
  alimentsPerso: Aliment[]
  /** Mesures importées depuis l'app Santé d'Apple. */
  mesuresSante: MesureSante[]
  /** Séances de sport saisies à la main. */
  seances: SeanceSport[]
  /** La semaine de menus en cours. `null` tant qu'aucune n'a été générée. */
  menus: PlanSemaine | null
  /** Le contenu du frigo, des placards et du congélateur. */
  stocks: ArticleStock[]
  /** La conversation avec le coach, conservée d'une session à l'autre. */
  conversation: MessageCoach[]
  /**
   * Date ISO de l'accord donné au coach, `null` tant qu'il n'a pas été donné.
   *
   * Le consentement général couvre ce que l'application conserve ; celui-ci
   * couvre autre chose — envoyer le journal du jour à un tiers pour obtenir une
   * réponse. Le RGPD demande un consentement par finalité (art. 6.1.a), et
   * c'est aussi la seule façon honnête de poser la question : tant qu'il est
   * `null`, rien ne part.
   */
  consentementCoach: string | null
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
    // Les coordonnées d'un praticien appartiennent à l'utilisateur, pas au code.
    praticien: null,
    onboardingFait: false,
    motDePasseAChanger: elodie,
    creeLe: new Date().toISOString(),
  }
}

export function etatInitial(u: Utilisateur): EtatUtilisateur {
  const profil = profilInitial(u)
  return {
    profil,
    consentement: null,
    pesees: [{ date: jourISO(), poidsKg: profil.poidsDepartKg }],
    repas: [],
    journal: [],
    alimentsPerso: [],
    mesuresSante: [],
    seances: [],
    menus: null,
    stocks: [],
    conversation: [],
    consentementCoach: null,
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

    if (error) {
      console.error('[store] lecture :', error)
      throw new Error('Vos données n’ont pas pu être lues. Vérifiez votre connexion.')
    }
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
    if (error) {
      console.error('[store] enregistrement :', error)
      throw new Error('Vos données n’ont pas pu être enregistrées.')
    }
    return
  }
  localStorage.setItem(CLE_LOCALE(userId), JSON.stringify(etat))
}

/**
 * Efface le document de l'utilisateur — le droit à l'effacement (art. 17).
 *
 * Séparé de la suppression du compte : la RLS autorise déjà chacun à détruire
 * sa propre ligne, alors que retirer le compte lui-même demande un privilège
 * qu'un navigateur n'a pas. Les deux sont enchaînés par `rgpd.ts`.
 */
export async function effacerDonnees(userId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('donnees').delete().eq('user_id', userId)
    if (error) {
      console.error('[store] effacement :', error)
      throw new Error('Vos données n’ont pas pu être supprimées. Réessayez dans un instant.')
    }
    return
  }
  localStorage.removeItem(CLE_LOCALE(userId))
}

/** Complète un document ancien avec les champs ajoutés depuis sa création. */
function fusionner(u: Utilisateur, partiel: Partial<EtatUtilisateur>): EtatUtilisateur {
  const base = etatInitial(u)
  return {
    profil: { ...base.profil, ...partiel.profil, id: u.id, email: u.email },
    consentement: partiel.consentement ?? null,
    pesees: partiel.pesees ?? base.pesees,
    repas: partiel.repas ?? [],
    journal: partiel.journal ?? [],
    alimentsPerso: partiel.alimentsPerso ?? [],
    mesuresSante: partiel.mesuresSante ?? [],
    seances: partiel.seances ?? [],
    menus: partiel.menus ?? null,
    stocks: partiel.stocks ?? [],
    conversation: partiel.conversation ?? [],
    consentementCoach: partiel.consentementCoach ?? null,
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

/**
 * Le poids le plus récent, en préférant une mesure importée d'Apple Santé
 * quand elle est plus fraîche que la dernière pesée saisie à la main.
 */
export function poidsLePlusRecent(etat: EtatUtilisateur): number {
  const importees = etat.mesuresSante
    .filter((m) => typeof m.poidsKg === 'number')
    .map((m) => ({ date: m.date, poidsKg: m.poidsKg as number }))
  const toutes = [...etat.pesees, ...importees].sort((a, b) => a.date.localeCompare(b.date))
  return toutes.at(-1)?.poidsKg ?? etat.profil.poidsDepartKg
}

export type {
  Aliment,
  ArticleStock,
  Consentement,
  EntreeJournal,
  EnvieEntree,
  JournalEau,
  JournalRepas,
  MesureSante,
  MessageCoach,
  PeseeEntree,
  PlanSemaine,
  Profil,
  ScoreJeu,
  SeanceSport,
}
