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

/**
 * « ELO » fait 3 caractères, Supabase en exige 6 au minimum. On complète donc
 * en interne les mots de passe trop courts avec une constante fixe. Cela ne
 * rend pas « ELO » plus difficile à deviner — c'est précisément pour ça que
 * le changement de mot de passe est imposé à la première connexion.
 */
const RALLONGE = '·équilibre·'
function motDePasseEtendu(mdp: string): string {
  return mdp.length >= 6 ? mdp : mdp + RALLONGE
}

/** Permet de taper « ELO » plutôt qu'une adresse e-mail complète. */
export function versEmail(identifiant: string): string {
  const propre = identifiant.trim()
  if (propre.includes('@')) return propre.toLowerCase()
  return `${propre.toLowerCase()}@equilibre.local`
}

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
  const email = versEmail(identifiant)

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: motDePasseEtendu(motDePasse),
      options: { data: { prenom } },
    })
    if (error) throw new ErreurAuth(traduireErreur(error.message))
    if (!data.user) throw new ErreurAuth('Le compte n’a pas pu être créé.')
    return { id: data.user.id, email, prenom }
  }

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
      password: motDePasseEtendu(motDePasse),
    })
    if (error) {
      // Première connexion d'Élodie : le compte n'existe pas encore côté
      // Supabase, on le crée à la volée avec ses identifiants convenus.
      if (estCompteElodie(email) && motDePasse === 'ELO') {
        return inscription(identifiant, motDePasse, 'Élodie')
      }
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
    if (estCompteElodie(email) && motDePasse === 'ELO') {
      return inscription(identifiant, motDePasse, 'Élodie')
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
    const { data } = await supabase.auth.getUser()
    if (!data.user?.email) return null
    return {
      id: data.user.id,
      email: data.user.email,
      prenom: (data.user.user_metadata?.prenom as string) ?? '',
    }
  }

  const id = localStorage.getItem(CLE_SESSION)
  if (!id) return null
  const compte = lireComptes().find((c) => c.id === id)
  return compte ? { id: compte.id, email: compte.email, prenom: compte.prenom } : null
}

export async function changerMotDePasse(nouveau: string): Promise<void> {
  if (nouveau.length < 6) {
    throw new ErreurAuth('Choisissez un mot de passe d’au moins 6 caractères.')
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

function traduireErreur(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Identifiant ou mot de passe incorrect.'
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cet identifiant.'
  }
  if (m.includes('password should be')) {
    return 'Choisissez un mot de passe d’au moins 6 caractères.'
  }
  if (m.includes('email')) return 'Cet identifiant n’est pas accepté.'
  return message
}
