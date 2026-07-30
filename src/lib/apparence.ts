/**
 * L'apparence de l'application : huit thèmes de couleur, et un mode clair /
 * sombre / système qui se combine à chacun.
 *
 * Deux réglages séparés et non un seul de seize entrées : « je veux du violet »
 * et « je veux du sombre le soir » sont deux questions différentes, et la seconde
 * a une réponse automatique — le réglage du système.
 *
 * Le choix vit dans `localStorage` et non dans le document de l'utilisateur.
 * Trois raisons, dans cet ordre : la page d'accueil et l'écran de connexion
 * doivent être thémés avant qu'un compte existe ; l'application s'installe sur
 * plusieurs appareils, et l'écran du téléphone la nuit n'appelle pas le même
 * thème que celui du bureau ; et un réglage d'affichage n'a pas à voyager dans un
 * document qui porte des données de santé.
 */

export type IdTheme =
  | 'marmite'
  | 'potager'
  | 'agrumes'
  | 'myrtille'
  | 'ocean'
  | 'cacao'
  | 'framboise'
  | 'encre'

export type ModeApparence = 'clair' | 'sombre' | 'systeme'

export type Theme = {
  id: IdTheme
  nom: string
  phrase: string
  /**
   * Les trois couleurs de la vignette de choix, dans l'ordre fond / primaire /
   * accent. Elles sont écrites ici en dur, et c'est voulu : la vignette d'un
   * thème doit montrer ce thème pendant qu'un autre est appliqué, donc elle ne
   * peut pas lire les variables CSS courantes.
   *
   * Elles sont recopiées de `src/palettes.css`, qui est généré par
   * `outils/palettes.mjs`. Changer une palette demande de repasser ici.
   */
  apercu: [string, string, string]
}

export const THEMES: Theme[] = [
  {
    id: 'marmite',
    nom: 'Marmite',
    phrase: 'Le corail du logo, sur crème.',
    apercu: ['#fdf6ee', '#c33f22', '#feba7e'],
  },
  {
    id: 'potager',
    nom: 'Potager',
    phrase: 'Vert feuille et jeunes pousses.',
    apercu: ['#f1f9ef', '#0f7e41', '#d7d206'],
  },
  {
    id: 'agrumes',
    nom: 'Agrumes',
    phrase: 'Orange sanguine et citron.',
    apercu: ['#fef5e4', '#b35008', '#ffbd4b'],
  },
  {
    id: 'myrtille',
    nom: 'Myrtille',
    phrase: 'Violet profond et fruits noirs.',
    apercu: ['#f7f4fe', '#8650cf', '#ffa7f7'],
  },
  {
    id: 'ocean',
    nom: 'Océan',
    phrase: 'Bleu marine et eau claire.',
    apercu: ['#edf8ff', '#0171bd', '#13e3fe'],
  },
  {
    id: 'cacao',
    nom: 'Cacao',
    phrase: 'Chocolat, caramel et noisette.',
    apercu: ['#fff4ec', '#ae522c', '#feb5ad'],
  },
  {
    id: 'framboise',
    nom: 'Framboise',
    phrase: 'Rose vif et fruits rouges.',
    apercu: ['#fff2f7', '#c43274', '#fdb6ac'],
  },
  {
    id: 'encre',
    nom: 'Encre',
    phrase: 'Presque noir et blanc, un accent citron.',
    apercu: ['#fcfdff', '#304255', '#ecc916'],
  },
]

/** Le thème par défaut vit dans `:root` : aucun attribut à poser pour l'obtenir. */
export const THEME_PAR_DEFAUT: IdTheme = 'marmite'

const CLE_MODE = 'equilibre:theme'
const CLE_THEME = 'equilibre:palette'

const EST_UN_THEME = new Set<string>(THEMES.map((t) => t.id))

/**
 * La clé du mode est celle d'avant, avec ses deux valeurs `clair` et `sombre` :
 * les comptes existants gardent leur réglage. L'absence de valeur voulait déjà
 * dire « suis le système », `systeme` ne fait que l'écrire.
 */
export function modeEnregistre(): ModeApparence {
  try {
    const v = localStorage.getItem(CLE_MODE)
    return v === 'clair' || v === 'sombre' ? v : 'systeme'
  } catch {
    return 'systeme'
  }
}

export function themeEnregistre(): IdTheme {
  try {
    const v = localStorage.getItem(CLE_THEME)
    return v && EST_UN_THEME.has(v) ? (v as IdTheme) : THEME_PAR_DEFAUT
  } catch {
    return THEME_PAR_DEFAUT
  }
}

export function sombreVoulu(mode: ModeApparence): boolean {
  if (mode === 'clair') return false
  if (mode === 'sombre') return true
  return matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Applique le mode et le thème au document, et met la barre du navigateur à la
 * couleur du fond. Sans cette dernière ligne, une application installée en thème
 * Myrtille garde la barre crème du thème d'origine, et la façade se voit à la
 * jointure.
 */
export function appliquerApparence(theme: IdTheme, mode: ModeApparence): void {
  const racine = document.documentElement
  racine.classList.toggle('dark', sombreVoulu(mode))
  if (theme === THEME_PAR_DEFAUT) racine.removeAttribute('data-theme')
  else racine.setAttribute('data-theme', theme)

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

export function enregistrerTheme(theme: IdTheme): void {
  try {
    localStorage.setItem(CLE_THEME, theme)
  } catch {
    /* Navigation privée : le thème s'applique quand même, il ne survit pas. */
  }
}

export function enregistrerMode(mode: ModeApparence): void {
  try {
    localStorage.setItem(CLE_MODE, mode)
  } catch {
    /* idem */
  }
}

/**
 * Prévient quand le système bascule, pour que le mode « systeme » suive sans
 * recharger la page. Rendue ici plutôt que dans un composant : c'est la même
 * préférence que celle lue au démarrage, et deux endroits pour une même règle
 * finissent par diverger.
 */
export function surChangementSysteme(reagir: () => void): () => void {
  const requete = matchMedia('(prefers-color-scheme: dark)')
  requete.addEventListener('change', reagir)
  return () => requete.removeEventListener('change', reagir)
}
