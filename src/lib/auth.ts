import { supabase } from './supabase'

export interface Utilisateur {
  id: string
  email: string
  prenom: string
}

/** Le compte pré-chargé d'Élodie. Voir `profilInitial` dans store.ts. */
export const IDENTIFIANT_ELODIE = 'ELO'
const EMAIL_ELODIE = 'elo@equilibre.local'

const CLE_COMPTES = 'equilibre:comptes'
const CLE_SESSION = 'equilibre:session'

/** Minimum imposé par Supabase, et vérifié ici pour éviter un aller-retour. */
export const MDP_MINIMUM = 6

/**
 * En mode synchronisé, l'identifiant doit être une vraie adresse : c'est elle
 * qui reçoit le lien de confirmation et celui de récupération. Les pseudos
 * étaient convertis en `pseudo@equilibre.local`, un domaine qui ne reçoit
 * rien — la confirmation n'arrivait jamais et le mot de passe était
 * irrécupérable. Ils restent acceptés en mode démo, où rien n'est envoyé.
 */
export const exigeEmailReel = supabase !== null

/** Contrôle de forme. C'est Supabase qui tranche pour de bon. */
export function estEmail(identifiant: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(identifiant.trim())
}

/** Permet de taper « ELO » plutôt qu'une adresse e-mail complète, en démo. */
export function versEmail(identifiant: string): string {
  const propre = identifiant.trim()
  if (propre.includes('@')) return propre.toLowerCase()
  return `${propre.toLowerCase()}@equilibre.local`
}

function exigerIdentifiantValide(identifiant: string): void {
  if (exigeEmailReel && !estEmail(identifiant)) {
    throw new ErreurAuth(
      'Entrez une adresse e-mail. Elle sert à confirmer votre compte et à le récupérer si vous oubliez votre mot de passe.',
    )
  }
}

/**
 * Le compte de démonstration ne s'auto-crée **qu'en mode démo**, c'est-à-dire
 * dans un navigateur, sans base partagée. En mode Supabase, taper ELO/ELO
 * revenait à ouvrir — ou à prendre — un compte réel dont l'identifiant est
 * public : le premier arrivé effectuait le changement de mot de passe imposé.
 */
export function estCompteDemo(identifiant: string): boolean {
  return supabase === null && versEmail(identifiant) === EMAIL_ELODIE
}

/** Sert à pré-remplir le profil d'exemple, indépendamment du mode. */
export function estCompteElodie(identifiant: string): boolean {
  return versEmail(identifiant) === EMAIL_ELODIE
}

/* ─────────────────────────── Mode démo (navigateur) ─────────────────────── */

interface CompteLocal {
  id: string
  email: string
  prenom: string
  sel: string
  empreinte: string
}

function lireComptes(): CompteLocal[] {
  try {
    return JSON.parse(localStorage.getItem(CLE_COMPTES) ?? '[]')
  } catch {
    return []
  }
}

function ecrireComptes(comptes: CompteLocal[]): void {
  localStorage.setItem(CLE_COMPTES, JSON.stringify(comptes))
}

function base64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

/**
 * Même en mode démo, un mot de passe n'est jamais stocké en clair. PBKDF2 via
 * l'API Web Crypto : quelques lignes, et rien à installer.
 */
async function empreinte(motDePasse: string, sel: Uint8Array): Promise<string> {
  const cle = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(motDePasse),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: sel as BufferSource, iterations: 150_000, hash: 'SHA-256' },
    cle,
    256,
  )
  return base64(bits)
}

function nouveauSel(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

function selDepuisBase64(valeur: string): Uint8Array {
  return Uint8Array.from(atob(valeur), (c) => c.charCodeAt(0))
}

/* ─────────────────────────────── API publique ───────────────────────────── */

export class ErreurAuth extends Error {}

export async function inscription(
  identifiant: string,
  motDePasse: string,
  prenom: string,
): Promise<Utilisateur> {
  exigerIdentifiantValide(identifiant)
  const email = versEmail(identifiant)

  if (motDePasse.length < MDP_MINIMUM) {
    throw new ErreurAuth(`Choisissez un mot de passe d’au moins ${MDP_MINIMUM} caractères.`)
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: { data: { prenom } },
    })
    if (error) throw new ErreurAuth(traduireErreur(error.message))
    if (!data.user) throw new ErreurAuth('Le compte n’a pas pu être créé.')

    // Quand la confirmation par e-mail est active, Supabase renvoie un
    // utilisateur factice sans identité plutôt que d'admettre que l'adresse
    // est déjà prise. Sans ce test, on annonçait « compte créé » à quelqu'un
    // qui possède déjà un compte.
    if (data.user.identities?.length === 0) {
      throw new ErreurAuth('Un compte existe déjà avec cet identifiant.')
    }

    // Toujours avec la confirmation active : le compte existe mais aucune
    // session n'est ouverte. Poursuivre menait droit à un refus de la RLS,
    // affiché sous forme de message de base de données en anglais.
    if (!data.session) {
      throw new ErreurAuth(
        'Compte créé. Ouvrez le lien de confirmation reçu par e-mail, puis connectez-vous.',
      )
    }

    return { id: data.user.id, email, prenom }
  }

  return creerCompteLocal(email, motDePasse, prenom)
}

/**
 * Création d'un compte dans le navigateur. Séparé d'`inscription` parce que le
 * compte de démonstration s'ensemence avec un mot de passe de trois lettres :
 * la longueur minimale est une contrainte de Supabase, elle n'a pas de sens
 * ici, et ce compte impose de toute façon un changement à la première connexion.
 */
async function creerCompteLocal(
  email: string,
  motDePasse: string,
  prenom: string,
): Promise<Utilisateur> {
  const comptes = lireComptes()
  if (comptes.some((c) => c.email === email)) {
    throw new ErreurAuth('Un compte existe déjà avec cet identifiant.')
  }
  const sel = nouveauSel()
  const compte: CompteLocal = {
    id: crypto.randomUUID(),
    email,
    prenom,
    sel: base64(sel.buffer as ArrayBuffer),
    empreinte: await empreinte(motDePasse, sel),
  }
  ecrireComptes([...comptes, compte])
  localStorage.setItem(CLE_SESSION, compte.id)
  return { id: compte.id, email, prenom }
}

export async function connexion(identifiant: string, motDePasse: string): Promise<Utilisateur> {
  const email = versEmail(identifiant)

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    })
    if (error) {
      throw new ErreurAuth(traduireErreur(error.message))
    }
    return {
      id: data.user.id,
      email,
      prenom: (data.user.user_metadata?.prenom as string) ?? '',
    }
  }

  const comptes = lireComptes()
  const compte = comptes.find((c) => c.email === email)
  if (!compte) {
    // Ensemencement du compte d'exemple, en mode démo uniquement.
    if (estCompteDemo(email) && motDePasse === IDENTIFIANT_ELODIE) {
      return creerCompteLocal(email, motDePasse, 'Élodie')
    }
    throw new ErreurAuth('Identifiant ou mot de passe incorrect.')
  }
  const essai = await empreinte(motDePasse, selDepuisBase64(compte.sel))
  if (essai !== compte.empreinte) {
    throw new ErreurAuth('Identifiant ou mot de passe incorrect.')
  }
  localStorage.setItem(CLE_SESSION, compte.id)
  return { id: compte.id, email: compte.email, prenom: compte.prenom }
}

export async function deconnexion(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut()
    return
  }
  localStorage.removeItem(CLE_SESSION)
}

export async function utilisateurCourant(): Promise<Utilisateur | null> {
  if (supabase) {
    // `getSession` lit le jeton déjà stocké sur l'appareil, sans appel réseau.
    // `getUser` interrogeait le serveur : hors connexion il échouait et
    // déconnectait quelqu'un dont la session était pourtant valide — inacceptable
    // pour une application installable censée fonctionner hors ligne.
    const { data } = await supabase.auth.getSession()
    const compte = data.session?.user
    if (!compte?.email) return null
    return {
      id: compte.id,
      email: compte.email,
      prenom: (compte.user_metadata?.prenom as string) ?? '',
    }
  }

  const id = localStorage.getItem(CLE_SESSION)
  if (!id) return null
  const compte = lireComptes().find((c) => c.id === id)
  return compte ? { id: compte.id, email: compte.email, prenom: compte.prenom } : null
}

export async function changerMotDePasse(nouveau: string): Promise<void> {
  if (nouveau.length < MDP_MINIMUM) {
    throw new ErreurAuth(`Choisissez un mot de passe d’au moins ${MDP_MINIMUM} caractères.`)
  }

  if (supabase) {
    const { error } = await supabase.auth.updateUser({ password: nouveau })
    if (error) throw new ErreurAuth(traduireErreur(error.message))
    return
  }

  const id = localStorage.getItem(CLE_SESSION)
  if (!id) throw new ErreurAuth('Aucune session active.')
  const comptes = lireComptes()
  const index = comptes.findIndex((c) => c.id === id)
  if (index === -1) throw new ErreurAuth('Compte introuvable.')
  const sel = nouveauSel()
  comptes[index] = {
    ...comptes[index],
    sel: base64(sel.buffer as ArrayBuffer),
    empreinte: await empreinte(nouveau, sel),
  }
  ecrireComptes(comptes)
}

/**
 * Les messages de Supabase et de PostgREST sont en anglais et parlent de
 * politiques RLS et de contraintes SQL. Ils ne sont jamais montrés tels quels :
 * on traduit ce qu'on reconnaît, et on retombe sur une phrase neutre pour le
 * reste. Le message d'origine part en console pour le diagnostic.
 */
function traduireErreur(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('invalid login')) return 'Identifiant ou mot de passe incorrect.'
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cet identifiant.'
  }
  if (m.includes('password should be') || m.includes('password is too short')) {
    return `Choisissez un mot de passe d’au moins ${MDP_MINIMUM} caractères.`
  }
  if (m.includes('email not confirmed')) {
    return 'Ce compte attend encore la confirmation envoyée par e-mail.'
  }
  if (m.includes('email rate limit') || m.includes('over_email_send_rate_limit')) {
    return 'Trop de tentatives d’envoi d’e-mail. Réessayez dans quelques minutes.'
  }
  if (m.includes('error sending confirmation') || m.includes('error sending')) {
    return 'L’e-mail de confirmation n’a pas pu être envoyé. Vérifiez l’adresse saisie.'
  }
  if (m.includes('invalid email') || m.includes('email address') || m.includes('is invalid')) {
    return 'Cet identifiant n’est pas accepté.'
  }
  if (m.includes('failed to fetch') || m.includes('networkerror')) {
    return 'Connexion au serveur impossible. Vérifiez votre réseau.'
  }

  console.error('[auth] message non traduit :', message)
  return 'Quelque chose s’est mal passé. Réessayez dans un instant.'
}
