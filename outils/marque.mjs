/**
 * Vérifie que le composant Marque et l'icône installée portent les mêmes
 * tracés.
 *
 * Le CLAUDE.md pose la règle depuis le rebranding, sans que rien ne
 * l'applique : une retouche du composant sans retouche de l'icône donne une
 * application ouverte qui n'a plus l'air d'être celle qu'on a installée, et
 * personne ne s'en aperçoit avant de l'installer sur un vrai téléphone.
 */
import { readFileSync } from 'node:fs'

const traces = (source) =>
  [...source.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, ' ').trim())

// Extract only the Marque function content
const uiContent = readFileSync('src/components/ui.tsx', 'utf8')
const marqueMatch = uiContent.match(/export function Marque\([^)]*\)\s*\{[\s\S]*?\n  \)[\s\S]*?\n\}/)
const marqueContent = marqueMatch ? marqueMatch[0] : ''

const composant = traces(marqueContent)
const icone = traces(readFileSync('public/icone.svg', 'utf8'))

const manquants = composant.filter((d) => !icone.includes(d))
const surnumeraires = icone.filter((d) => !composant.includes(d))

if (manquants.length || surnumeraires.length) {
  console.error('✗ Marque et public/icone.svg divergent.')
  manquants.forEach((d) => console.error(`  seulement dans le composant : ${d.slice(0, 60)}…`))
  surnumeraires.forEach((d) => console.error(`  seulement dans l’icône    : ${d.slice(0, 60)}…`))
  process.exit(1)
}

console.log(`✓ ${composant.length} tracés identiques entre Marque et l’icône installée.`)
