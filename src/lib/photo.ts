import { avecNutriScore } from './nutriscore'
import type { Aliment, ValeursPour100 } from './types'

/**
 * Scan d'une assiette par photo.
 *
 * L'analyse elle-même vit dans `/api/analyser-assiette` : elle a besoin d'une
 * clé d'API, qui n'a rien à faire dans un navigateur. Ce module ne fait que
 * préparer l'image et traduire la réponse en aliments.
 */

/** Au-delà, on n'analyse pas mieux, on transfère juste plus longtemps. */
const COTE_MAX = 1152
const QUALITE = 0.82

export class ErreurScanPhoto extends Error {
  /** Vrai quand l'échec vient de la configuration et non de la photo. */
  readonly configurable: boolean
  constructor(message: string, configurable = false) {
    super(message)
    this.configurable = configurable
  }
}

/**
 * Réduit et recompresse une photo avant l'envoi.
 *
 * Une photo d'iPhone pèse 3 à 5 Mo : l'envoyer telle quelle ferait attendre
 * l'utilisateur sur son forfait mobile sans rien apporter à l'analyse.
 */
export async function preparerImage(fichier: File): Promise<{ base64: string; type: string }> {
  const image = await chargerImage(fichier)
  const echelle = Math.min(1, COTE_MAX / Math.max(image.width, image.height))
  const largeur = Math.round(image.width * echelle)
  const hauteur = Math.round(image.height * echelle)

  const toile = document.createElement('canvas')
  toile.width = largeur
  toile.height = hauteur
  const contexte = toile.getContext('2d')
  if (!contexte) throw new ErreurScanPhoto('Cette photo n’a pas pu être préparée.')
  contexte.drawImage(image, 0, 0, largeur, hauteur)

  const donnees = toile.toDataURL('image/jpeg', QUALITE)
  const base64 = donnees.slice(donnees.indexOf(',') + 1)
  if (!base64) throw new ErreurScanPhoto('Cette photo n’a pas pu être préparée.')

  return { base64, type: 'image/jpeg' }
}

function chargerImage(fichier: File): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const url = URL.createObjectURL(fichier)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resoudre(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      rejeter(new ErreurScanPhoto('Ce fichier n’est pas une image lisible.'))
    }
    image.src = url
  })
}

/* ─────────────────────────── Appel de l'analyse ─────────────────────────── */

export type Confiance = 'haute' | 'moyenne' | 'basse'

export interface AlimentDetecte {
  aliment: Aliment
  quantiteG: number
  confiance: Confiance
}

export interface ResultatScan {
  plausible: boolean
  commentaire: string
  detectes: AlimentDetecte[]
}

interface ReponseBrute {
  plausible?: boolean
  commentaire?: string
  aliments?: {
    nom?: string
    quantiteG?: number
    confiance?: Confiance
    valeurs?: Partial<ValeursPour100>
  }[]
  erreur?: string
  configurable?: boolean
}

function positif(valeur: unknown): number {
  return typeof valeur === 'number' && Number.isFinite(valeur) ? Math.max(0, valeur) : 0
}

export async function analyserAssiette(fichier: File, signal?: AbortSignal): Promise<ResultatScan> {
  const { base64, type } = await preparerImage(fichier)

  let reponse: Response
  try {
    reponse = await fetch('/api/analyser-assiette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: base64, type }),
      signal,
    })
  } catch {
    throw new ErreurScanPhoto('L’analyse n’a pas pu être jointe. Vérifiez votre connexion.')
  }

  let donnees: ReponseBrute
  try {
    donnees = (await reponse.json()) as ReponseBrute
  } catch {
    throw new ErreurScanPhoto('L’analyse a renvoyé une réponse illisible.')
  }

  if (!reponse.ok) {
    throw new ErreurScanPhoto(
      donnees.erreur ?? 'L’analyse a échoué. Réessayez dans un instant.',
      donnees.configurable === true,
    )
  }

  const detectes: AlimentDetecte[] = (donnees.aliments ?? [])
    .filter((brut) => brut.nom && positif(brut.quantiteG) > 0)
    .map((brut, index) => {
      const v = brut.valeurs ?? {}
      const valeurs: ValeursPour100 = {
        kcal: positif(v.kcal),
        proteines: positif(v.proteines),
        glucides: positif(v.glucides),
        sucres: positif(v.sucres),
        lipides: positif(v.lipides),
        satures: positif(v.satures),
        fibres: positif(v.fibres),
        sel: positif(v.sel),
      }
      const aliment = avecNutriScore({
        id: `photo:${Date.now()}:${index}`,
        nom: (brut.nom as string).trim(),
        famille: 'general',
        valeurs,
        source: 'photo',
      })
      return {
        aliment,
        quantiteG: Math.round(positif(brut.quantiteG)),
        confiance: brut.confiance ?? 'basse',
      }
    })
    .filter((d) => d.aliment.valeurs.kcal > 0)

  return {
    plausible: donnees.plausible !== false,
    commentaire: donnees.commentaire?.trim() ?? '',
    detectes,
  }
}
