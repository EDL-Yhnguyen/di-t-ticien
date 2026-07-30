import { createOCREngine, supportsFastBuild } from 'tesseract-wasm'
import type { LigneOCR } from './types'

/**
 * L'OCR tourne dans un worker, et ce n'est pas une optimisation.
 *
 * Tesseract prend plusieurs secondes sur un ticket. Sur le fil principal, ces
 * secondes-là gèlent l'écran : plus de défilement, plus de bouton « annuler »,
 * plus d'animation de progression — l'application paraît plantée au moment
 * précis où elle demande de patienter. Sur une PWA installée, sans barre
 * d'adresse pour rassurer, on la ferme.
 *
 * Le moteur reste vivant d'une lecture à l'autre : charger le modèle français
 * coûte une seconde et un mégaoctet, et un ticket se rephotographie souvent
 * deux fois de suite quand la première prise est floue.
 */

export interface DemandeOCR {
  image: ImageData
  /** Servies depuis notre domaine, donc mises en cache par le service worker. */
  urlWasm: string
  urlWasmRepli: string
  urlModele: string
}

export type ReponseOCR =
  | { type: 'progres'; valeur: number }
  | { type: 'lignes'; lignes: LigneOCR[] }
  | { type: 'erreur'; message: string }

/**
 * Le contexte d'un worker n'est pas celui d'une page, et la bibliothèque
 * standard de TypeScript ne peut pas décrire les deux dans le même programme
 * sans que `self` et `addEventListener` entrent en collision. Plutôt que de
 * découper le projet en deux compilations pour trois lignes, on décrit ici le
 * strict nécessaire.
 */
interface PortailWorker {
  postMessage(message: ReponseOCR): void
  onmessage: ((evenement: MessageEvent<DemandeOCR>) => void) | null
}

const portail = globalThis as unknown as PortailWorker

type Moteur = Awaited<ReturnType<typeof createOCREngine>>

let moteur: Moteur | null = null

async function obtenirMoteur(demande: DemandeOCR): Promise<Moteur> {
  if (moteur) return moteur

  // La compilation « rapide » exige les instructions SIMD de WebAssembly.
  // Elles sont là sur tout téléphone récent, mais pas sur Safari avant 16.4 :
  // sans ce repli, l'OCR échouerait sur des iPhone encore en service.
  const url = supportsFastBuild() ? demande.urlWasm : demande.urlWasmRepli

  const [binaire, modele] = await Promise.all([
    fetch(url).then((r) => r.arrayBuffer()),
    fetch(demande.urlModele).then((r) => r.arrayBuffer()),
  ])

  const nouveau = await createOCREngine({ wasmBinary: binaire })
  nouveau.loadModel(modele)

  // Le jeu de caractères d'un ticket de caisse est étroit, et le lui dire
  // supprime des confusions entières : sans cette liste, « 1,29 » se lit
  // régulièrement « 1,2S » ou « I,29 ». Les minuscules restent admises, les
  // libellés n'étant pas tous en capitales selon les enseignes.
  nouveau.setVariable(
    'tessedit_char_whitelist',
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÂÄÇÈÉÊËÎÏÔÖÙÛÜàâäçèéêëîïôöùûü0123456789 .,:/*%+-€x()'",
  )

  moteur = nouveau
  return nouveau
}

portail.onmessage = async (evenement) => {
  const demande = evenement.data

  try {
    const actuel = await obtenirMoteur(demande)
    actuel.loadImage(demande.image)

    const boites = actuel.getTextBoxes('line', (valeur) => {
      portail.postMessage({ type: 'progres', valeur: valeur / 100 })
    })

    portail.postMessage({
      type: 'lignes',
      lignes: boites.map((boite) => ({
        texte: boite.text,
        confiance: boite.confidence,
        haut: boite.rect.top,
        gauche: boite.rect.left,
        droite: boite.rect.right,
      })),
    })

    // L'image est relâchée mais pas le modèle : c'est elle qui pèse, et la
    // mémoire d'un module WebAssembly ne se rend jamais au système.
    actuel.clearImage()
  } catch (erreur) {
    portail.postMessage({
      type: 'erreur',
      message: erreur instanceof Error ? erreur.message : 'Lecture impossible.',
    })
  }
}
