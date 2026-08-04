/**
 * L'apparence de l'application : un mode clair / sombre / système.
 *
 * Le choix vit dans `localStorage` et non dans le document de l'utilisateur.
 * Trois raisons, dans cet ordre : la page d'accueil et l'écran de connexion
 * doivent être thémés avant qu'un compte existe ; l'application s'installe
 * sur plusieurs appareils, et l'écran du téléphone la nuit n'appelle pas le
 * même thème que celui du bureau ; et un réglage d'affichage n'a pas à
 * voyager dans un document qui porte des données de santé.
 *
 * Jusqu'au 04/08/2026, un second réglage indépendant choisissait parmi huit
 * thèmes de couleur — retiré au profit d'un seul jeu de couleurs de marque,
 * voir docs/superpowers/specs/2026-08-04-refonte-identite-mamakilo-design.md.
 * La clé `equilibre:palette` que les comptes existants portaient encore en
 * `localStorage` n'est plus lue : elle ne casse rien, elle ne fait plus rien.
 */

export type ModeApparence = 'clair' | 'sombre' | 'systeme'

const CLE_MODE = 'equilibre:theme'

/**
 * Le nom de la clé est celui d'avant, avec ses deux valeurs `clair` et
 * `sombre` : les comptes existants gardent leur réglage. L'absence de valeur
 * voulait déjà dire « suis le système », `systeme` ne fait que l'écrire.
 */
export function modeEnregistre(): ModeApparence {
  try {
    const v = localStorage.getItem(CLE_MODE)
    return v === 'clair' || v === 'sombre' ? v : 'systeme'
  } catch {
    return 'systeme'
  }
}

export function sombreVoulu(mode: ModeApparence): boolean {
  if (mode === 'clair') return false
  if (mode === 'sombre') return true
  return matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Applique le mode au document, et met la barre du navigateur à la couleur
 * du fond.
 */
export function appliquerApparence(mode: ModeApparence): void {
  const racine = document.documentElement
  racine.classList.toggle('dark', sombreVoulu(mode))

  const fond = getComputedStyle(racine).getPropertyValue('--ground').trim()
  if (fond) {
    let balise = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!balise) {
      balise = document.createElement('meta')
      balise.name = 'theme-color'
      document.head.appendChild(balise)
    }
    balise.content = fond
  }
}

export function enregistrerMode(mode: ModeApparence): void {
  try {
    localStorage.setItem(CLE_MODE, mode)
  } catch {
    /* Navigation privée : le modo s'applique quand même, il ne survit pas. */
  }
}

/**
 * Prévient quand le système bascule, pour que le mode « systeme » suive sans
 * recharger la page.
 */
export function surChangementSysteme(reagir: () => void): () => void {
  const requete = matchMedia('(prefers-color-scheme: dark)')
  requete.addEventListener('change', reagir)
  return () => requete.removeEventListener('change', reagir)
}
