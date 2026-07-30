import urlWasm from 'zxing-wasm/writer/zxing_writer.wasm?url'
import { identifiant } from './utils'

/**
 * Les cartes de fidélité, scannées une fois et rendues lisibles à la caisse.
 *
 * **Redessiner le code-barres n'est pas copier la carte.** Un code-barres est la
 * traduction visuelle d'un numéro ; la carte porte ce numéro, le scan le lit, et
 * la caisse relit exactement le même depuis l'écran. C'est la carte de la
 * personne, écrite proprement — pas une imitation.
 *
 * L'alternative intuitive, garder la photo de la carte, est nettement moins
 * fiable : reflets, angle, courbure du plastique, définition. Une photo de
 * code-barres passe mal sous une douchette, un tracé net passe toujours.
 *
 * Le `.wasm` est servi depuis notre domaine (`?url` le fait entrer dans le
 * build), comme celui du décodeur : le service worker peut ainsi le mettre en
 * cache, et la carte reste affichable dans un magasin sans réseau — ce qui est
 * le seul moment où elle sert.
 */

/**
 * Les formats qu'on sait tracer.
 *
 * Deux suffisent aux enseignes françaises : EAN-13 pour les cartes numériques à
 * treize chiffres, Code 128 pour tout le reste, y compris les numéros
 * alphanumériques. Le format est **celui qu'a rendu le scan**, jamais un choix :
 * réencoder un EAN-13 en Code 128 donnerait un dessin que la caisse lirait
 * autrement.
 */
export type FormatCarte = 'EAN-13' | 'Code128'

export interface CarteFidelite {
  id: string
  /** L'identifiant d'enseigne (`lib/ticket/enseignes.ts`), ou un nom libre. */
  enseigne: string
  /** Le nom affiché — celui de l'enseigne connue, ou ce que la personne a écrit. */
  libelle: string
  /** Le numéro lu sur la carte. C'est lui qui est retracé, tel quel. */
  numero: string
  format: FormatCarte
  ajouteeLe: string
}

export function nouvelleCarte(entree: {
  enseigne: string
  libelle: string
  numero: string
  format: FormatCarte
}): CarteFidelite {
  return {
    id: identifiant('f'),
    enseigne: entree.enseigne,
    libelle: entree.libelle.trim(),
    numero: entree.numero.trim(),
    format: entree.format,
    ajouteeLe: new Date().toISOString(),
  }
}

/**
 * Le format à retracer.
 *
 * **Il se déduit du numéro, pas de ce que le scanner annonce.** Le décodeur ne
 * rend pas toujours le format, et s'y fier ferait retomber toute carte sur
 * Code 128 — y compris les EAN-13, qu'un terminal de caisse attendant ce
 * symbole précis peut refuser. Le numéro, lui, ne ment pas : treize chiffres
 * dont la clé de contrôle tombe juste **sont** un EAN-13.
 *
 * Le format annoncé sert seulement à confirmer, jamais à contredire. Tout le
 * reste part en Code 128, qui encode n'importe quelle chaîne.
 */
export function formatDepuisScan(format: string, numero: string): FormatCarte {
  const normalise = format.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (normalise === 'EAN13') return 'EAN-13'
  return estEAN13(numero) ? 'EAN-13' : 'Code128'
}

/**
 * Vrai quand le numéro est un EAN-13 valide, clé de contrôle comprise.
 *
 * La clé évite de tracer en EAN-13 un numéro de treize chiffres qui n'en est
 * pas un — le tracé échouerait alors en caisse, au pire moment.
 */
export function estEAN13(numero: string): boolean {
  if (!/^\d{13}$/.test(numero)) return false
  const chiffres = [...numero].map(Number)
  // Somme pondérée 1-3-1-3… sur les douze premiers ; la clé complète à la
  // dizaine supérieure. C'est la définition GS1, pas une heuristique.
  const somme = chiffres.slice(0, 12).reduce((cumul, c, i) => cumul + c * (i % 2 === 0 ? 1 : 3), 0)
  return (10 - (somme % 10)) % 10 === chiffres[12]
}

/* ────────────────────────────── Tracer ────────────────────────────── */

let writer: typeof import('zxing-wasm/writer') | null = null

async function chargerWriter() {
  if (writer) return writer
  const module = await import('zxing-wasm/writer')
  module.prepareZXingModule({ overrides: { locateFile: () => urlWasm } })
  writer = module
  return module
}

/**
 * Trace le code-barres d'une carte, en SVG.
 *
 * Le SVG plutôt qu'une image matricielle : il reste net à n'importe quelle
 * taille d'écran, et la netteté des barres est **exactement** ce qui décide
 * qu'une douchette lise du premier coup ou pas. Une image redimensionnée par le
 * navigateur floute les transitions, qui sont l'information.
 *
 * `addHRT` imprime le numéro sous les barres, comme sur la carte d'origine :
 * quand la lecture optique échoue, la caissière saisit le numéro à la main, et
 * il faut alors qu'il soit lisible à l'écran.
 */
export async function tracerCarte(carte: CarteFidelite): Promise<string> {
  const { writeBarcode } = await chargerWriter()

  const resultat = await writeBarcode(carte.numero, {
    format: carte.format,
    // Une échelle fixe plutôt qu'ajustée à une largeur : c'est le CSS qui étire
    // le SVG à la place disponible, et lui seul connaît la taille de l'écran.
    scale: 4,
    addHRT: true,
    withQuietZones: true,
  })

  if (resultat.error || !resultat.svg) {
    throw new Error(
      resultat.error || `Le code « ${carte.numero} » n’a pas pu être tracé en ${carte.format}.`,
    )
  }

  return resultat.svg
}

/* ────────────────────────────── Lectures ────────────────────────────── */

export function cartesTriees(cartes: CarteFidelite[]): CarteFidelite[] {
  return [...cartes].sort((a, b) => a.libelle.localeCompare(b.libelle))
}

export function carteDeLEnseigne(
  cartes: CarteFidelite[],
  enseigne: string,
): CarteFidelite | null {
  return cartes.find((c) => c.enseigne === enseigne) ?? null
}
