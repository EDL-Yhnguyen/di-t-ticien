import { copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Recopie le moteur OCR de `node_modules` vers `public/ocr/`.
 *
 * Le lecteur de tickets a besoin du binaire WebAssembly de Tesseract servi
 * depuis notre propre domaine — c'est la condition pour que le service worker
 * le mette en cache, et donc pour qu'un ticket se photographie dans un magasin
 * sans réseau. Or `tesseract-wasm` n'expose que `.` dans son champ `exports` :
 * aucun import profond n'est possible, Vite ne peut pas le faire entrer dans le
 * build tout seul.
 *
 * D'où cette copie, plutôt que 3,5 Mo de binaires versionnés dans un dépôt
 * public. `package.json` la déclenche avant `dev` et avant `build`, y compris
 * sur Vercel : le fichier livré vient toujours de la version installée, et
 * mettre à jour le paquet suffit à mettre à jour ce qui est servi.
 *
 * Le modèle de langue français, lui, **est** versionné (`public/tessdata/`) :
 * il ne vient d'aucun paquet npm, et le télécharger pendant le build ferait
 * dépendre chaque déploiement de la disponibilité d'un dépôt tiers.
 */

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = join(ICI, '..')
const SOURCE = join(RACINE, 'node_modules', 'tesseract-wasm', 'dist')
const CIBLE = join(RACINE, 'public', 'ocr')

const FICHIERS = ['tesseract-core.wasm', 'tesseract-core-fallback.wasm']

await mkdir(CIBLE, { recursive: true })

for (const fichier of FICHIERS) {
  const source = join(SOURCE, fichier)
  const cible = join(CIBLE, fichier)

  // Recopier à l'identique à chaque `npm run dev` ferait perdre une seconde au
  // démarrage pour rien : on ne recopie que si la taille diffère, ce qui suffit
  // à repérer un changement de version du paquet.
  const [avant, apres] = await Promise.all([taille(source), taille(cible)])
  if (avant === null) {
    console.error(
      `outils/ocr.mjs : ${fichier} est introuvable dans node_modules. Lancer « npm ci ».`,
    )
    process.exit(1)
  }
  if (avant === apres) continue

  await copyFile(source, cible)
  console.log(`outils/ocr.mjs : ${fichier} copié (${Math.round(avant / 1024)} Ko).`)
}

async function taille(chemin) {
  try {
    return (await stat(chemin)).size
  } catch {
    return null
  }
}
