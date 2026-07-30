import type { Profil } from './types'

/**
 * Le nom sous lequel l'application s'adresse à quelqu'un.
 *
 * Le petit nom passe devant le prénom, et c'est tout l'intérêt : « Bonsoir,
 * Mamakilo » est une marque d'affection, « Bonsoir, Élodie » est un logiciel
 * qui a lu une fiche. Vide, on retombe sur le prénom ; vide aussi, on ne dit
 * rien plutôt que d'inventer un « cher utilisateur ».
 */
export function nomAffiche(profil: Pick<Profil, 'prenom' | 'petitNom'>): string {
  return profil.petitNom.trim() || profil.prenom.trim()
}
