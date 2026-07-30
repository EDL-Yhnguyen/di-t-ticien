import { supprimerCompte as supprimerCompteAuth } from './auth'
import { VERSION_CONFIDENTIALITE } from './legal'
import { CLES_PHOTOS, lirePhoto, viderPhotos } from './photos'
import { toutEffacer as toutEffacerPrix, tousLesReleves } from './prix/depot'
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

/**
 * Le document exporté.
 *
 * `relevesPrix` n'est pas dans `etat` et doit pourtant y figurer : les relevés
 * de tickets vivent en IndexedDB pour ne pas alourdir le document synchronisé
 * (voir `lib/prix/depot.ts`), mais ce sont des données personnelles conservées
 * par l'application. L'article 20 porte sur **tout** ce qu'elle détient, pas sur
 * ce qui se trouve dans un stockage plutôt qu'un autre. Les oublier ferait d'un
 * choix technique une amputation du droit.
 */
export function documentExport(
  etat: EtatUtilisateur,
  relevesPrix: unknown[] = [],
  photos: Record<string, string> = {},
) {
  return {
    _format: 'equilibre-export-v1',
    _exporteLe: new Date().toISOString(),
    _lisezMoi: LISEZ_MOI,
    ...etat,
    relevesPrix,
    photos,
  }
}

/**
 * Les photos vivent hors du document, sur l'appareil (voir `lib/photos.ts`).
 * Même raison que pour les relevés de prix : le droit d'accès porte sur tout ce
 * que l'application détient, pas sur ce qui a atterri dans un stockage plutôt
 * qu'un autre. Elles sortent en data-URL, seule forme lisible dans du JSON.
 */
async function photosExportables(userId: string): Promise<Record<string, string>> {
  const sortie: Record<string, string> = {}
  for (const cle of CLES_PHOTOS) {
    const blob = await lirePhoto(userId, cle).catch(() => null)
    if (!blob) continue
    sortie[cle] = await new Promise<string>((resoudre) => {
      const lecteur = new FileReader()
      lecteur.onload = () => resoudre(String(lecteur.result))
      lecteur.readAsDataURL(blob)
    })
  }
  return sortie
}

export async function telechargerExport(etat: EtatUtilisateur): Promise<void> {
  // Un dépôt local indisponible (navigation privée, quota) ne doit pas empêcher
  // l'export du reste : un export partiel annoncé vaut mieux qu'un droit qui
  // échoue en silence.
  const releves = await tousLesReleves(etat.profil.id).catch(() => [])
  const photos = await photosExportables(etat.profil.id)
  const contenu = JSON.stringify(documentExport(etat, releves, photos), null, 2)
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
  // Les relevés de prix ne sont pas dans le document : sans cette ligne, ils
  // survivraient à la suppression du compte dans le navigateur, et « supprimer
  // mes données » serait faux sans que rien ne le dise. Une base locale
  // absente n'est pas un échec de suppression — il n'y avait rien à effacer.
  await toutEffacerPrix(userId).catch(() => {})
  // Même raison pour les photos : elles ne sont jamais parties de l'appareil,
  // ce qui ne dispense pas de les effacer (art. 17).
  await viderPhotos(userId).catch(() => {})
  return { compteSupprime: await supprimerCompteAuth(userId) }
}
