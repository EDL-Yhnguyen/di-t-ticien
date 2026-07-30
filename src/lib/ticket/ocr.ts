import type { DemandeOCR, ReponseOCR } from './ocr.worker'
import type { LigneOCR } from './types'

/**
 * L'accès à l'OCR depuis le fil principal.
 *
 * Le moteur et le modèle sont servis depuis notre propre domaine, jamais depuis
 * un CDN — c'est la même règle que pour le décodeur de codes-barres, et pour la
 * même raison : le service worker ne met en cache que ce qui vient de chez
 * nous, et un ticket se photographie souvent dans un magasin où le réseau ne
 * passe pas.
 */

/**
 * Ce qu'il faut télécharger la première fois, en octets.
 *
 * Affiché avant de lancer la lecture. Trois mégaoctets sur un forfait mobile ne
 * se prélèvent pas en silence, et une barre de progression qui démarre sans
 * prévenir sur un réseau lent ressemble à une panne.
 */
export const POIDS_PREMIER_USAGE = 2_900_000

const BASE = import.meta.env.BASE_URL

const RESSOURCES = {
  urlWasm: `${BASE}ocr/tesseract-core.wasm`,
  urlWasmRepli: `${BASE}ocr/tesseract-core-fallback.wasm`,
  urlModele: `${BASE}tessdata/fra.traineddata`,
} as const

let worker: Worker | null = null
let enCours = false

function obtenirWorker(): Worker {
  if (worker) return worker
  // `new URL(…, import.meta.url)` est la forme que Vite reconnaît pour
  // compiler un worker : le fichier entre dans le build avec son empreinte,
  // au lieu d'être cherché à un chemin qui n'existera plus en production.
  worker = new Worker(new URL('./ocr.worker.ts', import.meta.url), { type: 'module' })
  return worker
}

/** Vrai quand le moteur n'a pas encore été téléchargé de cette session. */
export function premierUsage(): boolean {
  return worker === null
}

/**
 * Lit une image préparée et rend ses lignes, de haut en bas.
 *
 * Le tri par position verticale n'est pas redondant avec l'ordre rendu par
 * Tesseract : son analyse de mise en page regroupe volontiers la colonne des
 * libellés et celle des prix en deux blocs séparés, ce qui donnerait vingt
 * libellés puis vingt prix au lieu de vingt lignes. Sur un ticket, la ligne est
 * l'unité de sens — un prix appartient au libellé qui est à sa gauche.
 */
export function lireImage(
  image: ImageData,
  surProgres?: (valeur: number) => void,
): Promise<LigneOCR[]> {
  if (enCours) {
    return Promise.reject(new Error('Une lecture est déjà en cours.'))
  }
  enCours = true

  return new Promise<LigneOCR[]>((resoudre, rejeter) => {
    const w = obtenirWorker()

    const terminer = () => {
      w.removeEventListener('message', surMessage)
      w.removeEventListener('error', surErreur)
      enCours = false
    }

    const surMessage = (evenement: MessageEvent<ReponseOCR>) => {
      const reponse = evenement.data
      if (reponse.type === 'progres') {
        surProgres?.(reponse.valeur)
        return
      }
      terminer()
      if (reponse.type === 'erreur') rejeter(new Error(reponse.message))
      else resoudre([...reponse.lignes].sort((a, b) => a.haut - b.haut))
    }

    const surErreur = () => {
      terminer()
      // Un worker qui meurt ne se ranime pas : le suivant sera recréé.
      worker = null
      rejeter(new Error("Le lecteur de tickets n'a pas pu démarrer."))
    }

    w.addEventListener('message', surMessage)
    w.addEventListener('error', surErreur)

    const demande: DemandeOCR = { image, ...RESSOURCES }
    w.postMessage(demande)
  })
}
