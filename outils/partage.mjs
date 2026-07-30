/**
 * Vérifie que le module de partage ne peut pas faire fuiter une donnée de
 * santé.
 *
 * Le contrôle est textuel et volontairement grossier : il interdit au module
 * d'importer ce qui porte des chiffres de santé. Un typecheck ne dirait rien
 * d'un `import { totauxDuJour }` ajouté un jour « juste pour enrichir la
 * carte », et l'image partie sur Instagram ne se rattrape pas.
 */
import { readFileSync } from 'node:fs'

// Les commentaires sont retirés avant l'analyse : ce fichier explique
// justement qu'il ne porte ni poids ni calories, et se ferait recaler par son
// propre contrôle.
const source = readFileSync('src/lib/partage.ts', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')

const interdits = ['journal', 'nutriscore', 'nutrition', 'store', 'poids', 'kcal', 'imc']
const trouves = interdits.filter((mot) => new RegExp(`\\b${mot}`, 'i').test(source))

if (trouves.length) {
  console.error('✗ src/lib/partage.ts touche à des données de santé :', trouves.join(', '))
  console.error('  L’image partagée ne doit porter ni poids, ni calories, ni Nutri-Score.')
  process.exit(1)
}

console.log('✓ Le module de partage ne touche à aucune donnée de santé.')
