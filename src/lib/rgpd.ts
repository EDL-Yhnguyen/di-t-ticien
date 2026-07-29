import { supprimerCompte as supprimerCompteAuth } from './auth'
import { VERSION_CONFIDENTIALITE } from './legal'
import { effacerDonnees, type EtatUtilisateur } from './store'
import type { Consentement } from './types'
import { jourISO } from './utils'

/**
 * Les trois droits que l'application doit rendre exerçables sans écrire à
 * personne : consentir (art. 7), emporter ses données (art. 20), les effacer
 * (art. 17). Le reste — rectification, opposition — se fait déjà dans les
 * écrans ordinaires, puisque tout y est modifiable.
 */

/**
 * Le consentement porte sur un texte daté. Quand la politique change sur le
 * fond, sa version change, et l'accord donné à l'ancienne cesse de valoir.
 */
export const VERSION_CONSENTEMENT = VERSION_CONFIDENTIALITE

export function consentementAJour(consentement: Consentement | null): boolean {
  return consentement?.version === VERSION_CONSENTEMENT
}

export function consentementDuJour(): Consentement {
  return { version: VERSION_CONSENTEMENT, accepteLe: new Date().toISOString() }
}

/* ─────────────────────────── Portabilité (art. 20) ──────────────────────── */

const LISEZ_MOI =
  'Export de vos données Mamakilo. Tout ce que l’application conserve à votre ' +
  'sujet est dans ce fichier, dans la forme exacte où elle le stocke. Il se lit ' +
  'dans n’importe quel éditeur de texte et se recharge dans n’importe quel outil ' +
  'acceptant du JSON.'

export function documentExport(etat: EtatUtilisateur) {
  return {
    _format: 'equilibre-export-v1',
    _exporteLe: new Date().toISOString(),
    _lisezMoi: LISEZ_MOI,
    ...etat,
  }
}

export function telechargerExport(etat: EtatUtilisateur): void {
  const contenu = JSON.stringify(documentExport(etat), null, 2)
  const url = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = `equilibre-${jourISO()}.json`
  lien.click()
  // Révoquer dans la foulée du clic coupe le téléchargement sur certains
  // navigateurs, qui n'ont pas encore lu le blob quand la ligne suivante passe.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/* ──────────────────────────── Effacement (art. 17) ──────────────────────── */

export interface ResultatSuppression {
  /**
   * Faux quand les données ont bien été détruites mais que l'identifiant
   * survit côté Supabase — cas où `supprimer_mon_compte` n'a pas encore été
   * créée dans le projet. À dire à l'utilisateur, pas à masquer.
   */
  compteSupprime: boolean
}

/**
 * Efface d'abord le document, ensuite le compte. Dans cet ordre : la
 * suppression du compte emporte le document par cascade, mais elle est la
 * seule des deux à pouvoir échouer pour une raison de configuration.
 */
export async function toutSupprimer(userId: string): Promise<ResultatSuppression> {
  await effacerDonnees(userId)
  return { compteSupprime: await supprimerCompteAuth(userId) }
}
