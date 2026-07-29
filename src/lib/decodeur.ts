import urlWasm from 'zxing-wasm/reader/zxing_reader.wasm?url'

/**
 * Décodage de codes-barres, par deux chemins.
 *
 * 1. `BarcodeDetector`, l'API native du navigateur : rapide, gratuite, aucun
 *    téléchargement. Chrome et le navigateur Android la proposent.
 * 2. ZXing compilé en WebAssembly, en repli. **Safari ne propose pas
 *    `BarcodeDetector`** — sans ce repli, le scan ne marcherait tout
 *    simplement pas sur iPhone, c'est-à-dire sur la cible principale de cette
 *    application installée en PWA.
 *
 * Le `.wasm` est servi depuis notre propre domaine (`?url` le fait entrer dans
 * le build) et non depuis un CDN : le service worker peut ainsi le mettre en
 * cache, et le scan continue de fonctionner hors connexion.
 */

/** Les seuls formats qui nous intéressent : ceux des produits alimentaires. */
const FORMATS = ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E'] as const

interface DetecteurNatif {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>
}

interface FenetreAvecDetecteur {
  BarcodeDetector?: {
    new (options?: { formats?: string[] }): DetecteurNatif
    getSupportedFormats?: () => Promise<string[]>
  }
}

let natif: DetecteurNatif | null | undefined
let zxing: typeof import('zxing-wasm/reader') | null = null

async function detecteurNatif(): Promise<DetecteurNatif | null> {
  if (natif !== undefined) return natif

  const Constructeur = (window as unknown as FenetreAvecDetecteur).BarcodeDetector
  if (!Constructeur) {
    natif = null
    return null
  }

  try {
    // Le constructeur peut exister sans que les formats linéaires soient
    // gérés : c'est le cas de certains navigateurs de bureau.
    const supportes = (await Constructeur.getSupportedFormats?.()) ?? []
    const voulus = ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter(
      (f) => supportes.length === 0 || supportes.includes(f),
    )
    if (voulus.length === 0) {
      natif = null
      return null
    }
    natif = new Constructeur({ formats: voulus })
  } catch {
    natif = null
  }
  return natif
}

async function chargerZXing() {
  if (zxing) return zxing
  const module = await import('zxing-wasm/reader')
  module.prepareZXingModule({ overrides: { locateFile: () => urlWasm } })
  zxing = module
  return module
}

/** Vrai si la lecture passera par WebAssembly — utile pour prévenir du téléchargement. */
export async function utiliseRepli(): Promise<boolean> {
  return (await detecteurNatif()) === null
}

/**
 * Cherche un code-barres dans une image. Renvoie `null` si l'image n'en
 * contient pas — ce qui est le cas de la grande majorité des trames vidéo.
 */
export async function lireCodeBarres(source: HTMLCanvasElement): Promise<string | null> {
  const detecteur = await detecteurNatif()

  if (detecteur) {
    try {
      const trouves = await detecteur.detect(source)
      return trouves[0]?.rawValue ?? null
    } catch {
      // Une trame illisible n'est pas une panne : on laisse le repli tenter.
    }
  }

  const contexte = source.getContext('2d', { willReadFrequently: true })
  if (!contexte) return null

  const { readBarcodes } = await chargerZXing()
  const resultats = await readBarcodes(
    contexte.getImageData(0, 0, source.width, source.height),
    { formats: [...FORMATS], tryHarder: true, maxNumberOfSymbols: 1 },
  )

  const valide = resultats.find((r) => r.isValid && r.text.length >= 8)
  return valide?.text ?? null
}
