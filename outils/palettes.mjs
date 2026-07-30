/**
 * Génère `src/palettes.css` : les huit thèmes de l'application, chacun en
 * variante claire et sombre.
 *
 *   node outils/palettes.mjs           écrit le fichier et affiche le rapport
 *   node outils/palettes.mjs --verifie n'écrit rien, sort en 1 si un contraste échoue
 *
 * Pourquoi un générateur plutôt que seize blocs écrits à la main : le CLAUDE.md
 * demande que toute teinte modifiée soit revérifiée au calcul de contraste sur
 * chacun des fonds où elle peut atterrir. À un thème c'était une relecture ; à
 * huit, en clair et en sombre, c'est plus de six cents paires. La règle ne peut
 * tenir que si elle est exécutable.
 *
 * Le principe : on ne choisit pas une couleur, on choisit une teinte (l'angle
 * OKLCH) et une saturation, et le script cherche la clarté qui atteint le
 * rapport voulu sur le pire fond du thème. Une couleur est donc toujours la plus
 * vive que l'accessibilité autorise, au lieu d'être un compromis à l'œil.
 *
 * Le thème « marmite » est l'exception : ses valeurs sont écrites en dur parce
 * que ce sont celles du logo, déjà validées. Le script les mesure sans les
 * recalculer.
 */

import { readFileSync, writeFileSync } from 'node:fs'

/* ── OKLCH → sRGB (Björn Ottosson) ────────────────────────────────────────── */

function oklchVersLinear(L, C, H) {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const gamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

/**
 * Ramène une couleur dans le gamut sRGB en réduisant sa saturation, jamais sa
 * clarté : la clarté est ce qui porte le contraste, et l'abaisser pour sauver
 * une saturation ferait échouer le rapport qu'on vient de calculer.
 */
function oklchVersRgb(L, C, H) {
  let chroma = C
  for (let i = 0; i < 60; i++) {
    const lin = oklchVersLinear(L, chroma, H)
    if (lin.every((v) => v >= -0.0002 && v <= 1.0002)) break
    chroma *= 0.96
  }
  const lin = oklchVersLinear(L, chroma, H)
  return lin.map((v) => Math.min(1, Math.max(0, gamma(v))))
}

const hex = (L, C, H) =>
  '#' +
  oklchVersRgb(L, C, H)
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')

/* ── Contraste WCAG ───────────────────────────────────────────────────────── */

function versRgb(couleur) {
  const n = couleur.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
}

function luminance(couleur) {
  const [r, v, b] = versRgb(couleur).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * v + 0.0722 * b
}

function contraste(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Cherche la clarté qui atteint le rapport visé sur le pire des fonds. En
 * thème clair on descend depuis le plus vif ; en thème sombre on remonte.
 * Bissection plutôt que pas fixe : le rapport n'est pas linéaire en L.
 */
function clarteLisible({ chroma, hue, fonds, cible, sombre }) {
  let bas = sombre ? 0.5 : 0.2
  let haut = sombre ? 0.95 : 0.62
  const mesure = (L) => Math.min(...fonds.map((f) => contraste(hex(L, chroma, hue), f)))

  for (let i = 0; i < 40; i++) {
    const milieu = (bas + haut) / 2
    // En sombre, monter en clarté augmente le contraste ; en clair, le baisser.
    if (mesure(milieu) >= cible) {
      if (sombre) haut = milieu
      else bas = milieu
    } else if (sombre) bas = milieu
    else haut = milieu
  }
  const L = sombre ? haut : bas
  return mesure(L) >= cible ? L : sombre ? 0.95 : 0.2
}

/* ── Les huit thèmes ──────────────────────────────────────────────────────── */

/**
 * `fond` est la teinte des neutres : un crème, un vert d'eau, un gris bleuté.
 * `roles` sont les quatre couleurs porteuses. Le chroma demandé est un plafond :
 * le gamut et le contraste peuvent le rogner.
 */
const THEMES = [
  {
    id: 'marmite',
    nom: 'Marmite',
    phrase: 'Le corail du logo, sur crème.',
    fond: { hue: 62, chroma: 0.014 },
    // Les fonds sont crème, mais l'encre est le marine du lettrage : c'est la
    // seule palette où les deux ne partagent pas leur teinte, et il faut le dire
    // au script, sinon les trois encres appartiennent à trois familles.
    encre: { hue: 232, chroma: 0.022 },
    roles: {
      primaire: { hue: 30, chroma: 0.17 },
      accent: { hue: 62, chroma: 0.14 },
      reussite: { hue: 145, chroma: 0.13 },
      alerte: { hue: 8, chroma: 0.19 },
    },
  },
  {
    id: 'potager',
    nom: 'Potager',
    phrase: 'Vert feuille et jeunes pousses.',
    fond: { hue: 140, chroma: 0.016 },
    roles: {
      primaire: { hue: 152, chroma: 0.15 },
      accent: { hue: 108, chroma: 0.16 },
      reussite: { hue: 168, chroma: 0.13 },
      alerte: { hue: 22, chroma: 0.19 },
    },
  },
  {
    id: 'agrumes',
    nom: 'Agrumes',
    phrase: 'Orange sanguine et citron.',
    fond: { hue: 82, chroma: 0.024 },
    roles: {
      primaire: { hue: 48, chroma: 0.18 },
      accent: { hue: 78, chroma: 0.16 },
      reussite: { hue: 150, chroma: 0.13 },
      alerte: { hue: 12, chroma: 0.19 },
    },
  },
  {
    id: 'myrtille',
    nom: 'Myrtille',
    phrase: 'Violet profond et fruits noirs.',
    fond: { hue: 300, chroma: 0.014 },
    roles: {
      primaire: { hue: 300, chroma: 0.19 },
      accent: { hue: 330, chroma: 0.19 },
      reussite: { hue: 160, chroma: 0.13 },
      alerte: { hue: 20, chroma: 0.19 },
    },
  },
  {
    id: 'ocean',
    nom: 'Océan',
    phrase: 'Bleu marine et eau claire.',
    fond: { hue: 235, chroma: 0.016 },
    roles: {
      primaire: { hue: 248, chroma: 0.17 },
      accent: { hue: 210, chroma: 0.15 },
      reussite: { hue: 168, chroma: 0.13 },
      alerte: { hue: 12, chroma: 0.19 },
    },
  },
  {
    id: 'cacao',
    nom: 'Cacao',
    phrase: 'Chocolat, caramel et noisette.',
    fond: { hue: 58, chroma: 0.02 },
    roles: {
      primaire: { hue: 42, chroma: 0.13 },
      accent: { hue: 26, chroma: 0.16 },
      reussite: { hue: 138, chroma: 0.12 },
      alerte: { hue: 4, chroma: 0.19 },
    },
  },
  {
    id: 'framboise',
    nom: 'Framboise',
    phrase: 'Rose vif et fruits rouges.',
    fond: { hue: 352, chroma: 0.016 },
    roles: {
      primaire: { hue: 358, chroma: 0.19 },
      accent: { hue: 28, chroma: 0.17 },
      reussite: { hue: 158, chroma: 0.13 },
      alerte: { hue: 336, chroma: 0.19 },
    },
  },
  {
    id: 'encre',
    nom: 'Encre',
    phrase: 'Presque noir et blanc, un accent citron.',
    fond: { hue: 250, chroma: 0.006 },
    // Le primaire est ici une encre : très peu saturé, très contrasté. C'est le
    // thème de ceux qui veulent du calme — l'accent citron l'empêche d'être
    // triste.
    roles: {
      primaire: { hue: 250, chroma: 0.04 },
      accent: { hue: 96, chroma: 0.17 },
      reussite: { hue: 152, chroma: 0.13 },
      alerte: { hue: 18, chroma: 0.19 },
    },
    // Le primaire visé à 9:1 et non 4,5 : à la cible commune, le script rendait
    // le gris le plus vif que le seuil autorise, soit un bleu-gris moyen. Un
    // thème qui s'appelle « Encre » demande le contraire — la couleur la plus
    // profonde, pas la plus claire des acceptables.
    cibles: { primaire: 9 },
    extremes: true,
  },
]

/** Le thème de marque garde les valeurs relevées sur le logo, déjà validées. */
const MARMITE_EN_DUR = {
  clair: {
    ground: '#fdf6ee',
    surface: '#ffffff',
    sunken: '#f8f0e6',
    ink: '#232d3a',
    'ink-soft': '#5b6675',
    line: '#e8dccd',
    primaire: '#c33f22',
    'primaire-wash': '#fff1ec',
    accent: '#a85908',
    'accent-wash': '#fdefe3',
    reussite: '#3e7a3f',
    'reussite-wash': '#eaf6e6',
    alerte: '#bd2b62',
    'alerte-wash': '#fde3ec',
    'bandeau-haut': '#c33f22',
    'bandeau-bas': '#a33018',
  },
  sombre: {
    ground: '#171d26',
    surface: '#1f2733',
    sunken: '#28323f',
    ink: '#f2f0ec',
    'ink-soft': '#b3bcc7',
    line: '#33404f',
    primaire: '#ff8f74',
    'primaire-wash': '#3a2019',
    accent: '#f5a03f',
    'accent-wash': '#3d2a13',
    reussite: '#6fc46f',
    'reussite-wash': '#1b2f1c',
    alerte: '#f57fa8',
    'alerte-wash': '#3b1725',
    'bandeau-haut': '#8f3a22',
    'bandeau-bas': '#5e2312',
  },
}

/* ── Fabrication d'une variante ───────────────────────────────────────────── */

/**
 * Les cibles. `ink` visait 7:1 (AAA) dans le thème d'origine et on le garde ;
 * `ink-faint` monte à 4,5:1 alors qu'il tenait 4,0:1 avant — il porte les
 * libellés des onglets, du texte de 11 px que rien ne dispense du seuil.
 *
 * `bandeau-haut` visait 4,5:1 sur blanc. Le bandeau affiche du texte à 75 %
 * d'opacité, qui tombait donc sous le seuil ; viser 6:1 laisse la marge pour ces
 * niveaux-là plutôt que d'interdire la nuance.
 */
const CIBLES = {
  ink: 7,
  'ink-soft': 4.6,
  'ink-faint': 4.5,
  role: 4.5,
  'line-fort': 3,
  bandeau: 6,
}

function variante(theme, sombre) {
  const { hue: hf, chroma: cf } = theme.fond
  const extremes = theme.extremes === true // « Encre » pousse ses fonds plus loin que les autres

  const ground = sombre
    ? hex(extremes ? 0.155 : 0.205, cf, hf)
    : hex(extremes ? 0.995 : 0.973, cf * (extremes ? 0.3 : 1), hf)
  const surface = sombre ? hex(extremes ? 0.215 : 0.255, cf, hf) : hex(1, 0, hf)
  const sunken = sombre ? hex(extremes ? 0.28 : 0.315, cf, hf) : hex(0.955, cf * 1.6, hf)

  const fondsTexte = [ground, surface, sunken]
  const pireFond = sombre
    ? fondsTexte.reduce((a, b) => (luminance(a) > luminance(b) ? a : b))
    : fondsTexte.reduce((a, b) => (luminance(a) < luminance(b) ? a : b))

  // L'encre suit la teinte du fond, sauf quand le thème en désigne une autre.
  const he = theme.encre?.hue ?? hf
  const ce = theme.encre?.chroma ?? cf * 1.8

  const neutre = (cible) =>
    hex(
      clarteLisible({
        chroma: ce,
        hue: he,
        fonds: [pireFond],
        cible: Math.min(cible * (extremes ? 1.12 : 1), 12),
        sombre,
      }),
      ce,
      he,
    )

  const jetons = {
    ground,
    surface,
    sunken,
    ink: neutre(CIBLES.ink),
    'ink-soft': neutre(CIBLES['ink-soft']),
    'ink-faint': neutre(CIBLES['ink-faint']),
    // Deux traits, deux usages : `line` sépare (aucun seuil, il doit rester
    // discret), `line-fort` dessine le bord des champs et des bascules, où la
    // règle 1.4.11 demande 3:1. Les confondre obligeait à choisir entre un
    // quadrillage lourd et des champs invisibles.
    line: sombre ? hex(0.36, cf * 1.4, hf) : hex(0.9, cf * 2.2, hf),
  }

  // Les lavis : le fond des étiquettes et des cartes teintées. Ils entrent dans
  // la liste des fonds sur lesquels la teinte doit rester lisible — c'est le
  // piège noté dans le CLAUDE.md, une valeur qui passe sur `surface` peut
  // échouer sur son propre lavis.
  for (const [role, { hue, chroma }] of Object.entries(theme.roles)) {
    const wash = sombre ? hex(0.245, Math.min(chroma * 0.42, 0.06), hue) : hex(0.955, Math.min(chroma * 0.3, 0.05), hue)
    const fonds = sombre
      ? [ground, surface, sunken, wash].reduce(
          (acc, f) => (acc.length === 0 || luminance(f) > luminance(acc[0]) ? [f] : acc),
          [],
        )
      : [ground, surface, sunken, wash].reduce(
          (acc, f) => (acc.length === 0 || luminance(f) < luminance(acc[0]) ? [f] : acc),
          [],
        )
    const L = clarteLisible({
      chroma,
      hue,
      fonds,
      cible: theme.cibles?.[role] ?? CIBLES.role,
      sombre,
    })
    jetons[role] = hex(L, chroma, hue)
    jetons[`${role}-wash`] = wash
  }

  // ── L'accent vif ──────────────────────────────────────────────────────────
  // Un accent qui doit porter du texte à 4,5:1 sur fond clair est forcément
  // sombre : le citron du thème « Encre » sortait en or terne, et l'abricot de
  // la marque en brun. Aucun jaune vif n'atteint 4,5:1 sur blanc, c'est
  // physique, pas un réglage à trouver.
  //
  // D'où un second jeton, réservé aux aplats — fond de tuile, halo du bandeau,
  // liséré — avec l'encre sombre qui tient dessus. La contrainte de contraste
  // n'est pas levée, elle est déplacée : ce n'est plus la couleur qui doit être
  // lisible sur le fond, c'est le texte qui doit être lisible sur elle.
  const { hue: ha, chroma: ca } = theme.roles.accent
  jetons['accent-vif'] = hex(sombre ? 0.78 : 0.84, ca * 1.5, ha)
  jetons['accent-vif-encre'] = hex(
    clarteLisible({
      chroma: 0.05,
      hue: ha,
      fonds: [jetons['accent-vif']],
      cible: CIBLES.role,
      sombre: false,
    }),
    0.05,
    ha,
  )

  // Le bandeau porte toujours du texte blanc : il reste sombre dans les deux
  // thèmes, contrairement au primaire qui s'éclaircit en mode sombre.
  const { hue: hp, chroma: cp } = theme.roles.primaire
  const Lb = clarteLisible({
    chroma: cp,
    hue: hp,
    fonds: ['#ffffff'],
    cible: CIBLES.bandeau,
    sombre: false,
  })
  jetons['bandeau-haut'] = hex(sombre ? Lb * 0.82 : Lb, cp, hp)
  jetons['bandeau-bas'] = hex(sombre ? Lb * 0.6 : Lb * 0.76, cp * 0.94, hp)

  if (theme.id === 'marmite') Object.assign(jetons, MARMITE_EN_DUR[sombre ? 'sombre' : 'clair'])

  // Calculé en dernier, et contre la surface définitive : « marmite » remplace
  // la sienne par la valeur du logo, et un trait mesuré avant la substitution
  // manquait le seuil de 0,15 sans que rien ne le dise.
  jetons['line-fort'] = hex(
    clarteLisible({
      chroma: cf * 2,
      hue: hf,
      fonds: [jetons.surface],
      cible: CIBLES['line-fort'],
      sombre,
    }),
    cf * 2,
    hf,
  )

  return jetons
}

/* ── Vérification ─────────────────────────────────────────────────────────── */

const ROLES = ['primaire', 'accent', 'reussite', 'alerte']
const avertissements = []

function verifier(theme, sombre, j) {
  const echecs = []
  const nom = `${theme.id}/${sombre ? 'sombre' : 'clair'}`
  const fonds = { ground: j.ground, surface: j.surface, sunken: j.sunken }

  for (const encre of ['ink', 'ink-soft', 'ink-faint']) {
    for (const [nf, f] of Object.entries(fonds)) {
      const r = contraste(j[encre], f)
      const cible = encre === 'ink' ? CIBLES.ink : CIBLES[encre]
      if (r < cible - 0.05) echecs.push(`${nom} ${encre} sur ${nf} : ${r.toFixed(2)} < ${cible}`)
    }
  }

  for (const role of ROLES) {
    for (const [nf, f] of Object.entries({ ...fonds, wash: j[`${role}-wash`] })) {
      const r = contraste(j[role], f)
      if (r < CIBLES.role - 0.05) echecs.push(`${nom} ${role} sur ${nf} : ${r.toFixed(2)} < 4.5`)
    }
  }

  const ra = contraste(j['accent-vif-encre'], j['accent-vif'])
  if (ra < CIBLES.role - 0.05)
    echecs.push(`${nom} accent-vif-encre sur accent-vif : ${ra.toFixed(2)} < 4.5`)

  const rl = contraste(j['line-fort'], j.surface)
  if (rl < CIBLES['line-fort'] - 0.05)
    echecs.push(`${nom} line-fort sur surface : ${rl.toFixed(2)} < 3`)

  for (const b of ['bandeau-haut', 'bandeau-bas']) {
    const r = contraste(j[b], '#ffffff')
    if (r < 4.5) echecs.push(`${nom} ${b} sous du blanc : ${r.toFixed(2)} < 4.5`)
  }

  // Les jetons réservés ne changent pas avec le thème, mais ils atterrissent sur
  // ses fonds : c'est la seule chose que l'ajout de huit palettes pouvait casser
  // dans une échelle déjà validée.
  //
  // Ils se mesurent sur `surface` et `ground`, les fonds où un graphique est
  // réellement posé, et non sur `sunken`. Deux d'entre eux — le féculent de
  // l'assiette et la bande orange — tiennent 2,9:1 sur un creux, thème d'origine
  // compris : ils n'y apparaissent pas, et les retoucher demanderait de rejouer
  // la validation en vision daltonienne d'une échelle catégorielle pour gagner
  // 0,1 sur un fond inutilisé. L'avertissement reste affiché plutôt que masqué.
  const RESERVES = {
    'assiette-legume': [sombre ? '#22a97f' : '#1a6e3e'],
    'assiette-feculent': [sombre ? '#c28520' : '#c97b14'],
    'assiette-proteine': [sombre ? '#9d72e4' : '#6535bf'],
    'macro-proteines': [sombre ? '#a482ea' : '#6535bf'],
    'macro-glucides': [sombre ? '#d99a3a' : '#b06a10'],
    'macro-lipides': [sombre ? '#58a8d8' : '#1f74a8'],
    'bande-vert': [sombre ? '#35b06a' : '#1f8a4d'],
    'bande-bleu': [sombre ? '#5b93ef' : '#2563c9'],
    'bande-orange': [sombre ? '#f0972f' : '#d9700f'],
  }
  for (const [nomJeton, [valeur]] of Object.entries(RESERVES)) {
    for (const [nf, f] of Object.entries(fonds)) {
      const r = contraste(valeur, f)
      if (r >= 3) continue
      if (nf === 'sunken') avertissements.push(`${nom} ${nomJeton} (réservé) sur sunken : ${r.toFixed(2)}`)
      else echecs.push(`${nom} ${nomJeton} (réservé) sur ${nf} : ${r.toFixed(2)} < 3`)
    }
  }

  return echecs
}

/* ── Émission ─────────────────────────────────────────────────────────────── */

const ORDRE = [
  'ground',
  'surface',
  'sunken',
  'ink',
  'ink-soft',
  'ink-faint',
  'line',
  'line-fort',
  'primaire',
  'primaire-wash',
  'accent',
  'accent-wash',
  'accent-vif',
  'accent-vif-encre',
  'reussite',
  'reussite-wash',
  'alerte',
  'alerte-wash',
  'bandeau-haut',
  'bandeau-bas',
]

function bloc(selecteur, jetons, titre) {
  const lignes = ORDRE.map((c) => `  --${c}: ${jetons[c]};`)
  return `/* ${titre} */\n${selecteur} {\n${lignes.join('\n')}\n}\n`
}

const tousLesEchecs = []
const morceaux = [
  `/* ─────────────────────────────────────────────────────────────────────────
   FICHIER GÉNÉRÉ — ne pas modifier à la main.
   Source : outils/palettes.mjs · régénérer avec « node outils/palettes.mjs ».

   Huit thèmes, chacun en variante claire et sombre. Chaque valeur a été
   calculée pour atteindre son rapport de contraste sur le pire fond du thème,
   lavis compris, puis mesurée. Retoucher une couleur ici la ferait sortir de
   cette garantie sans que rien ne le signale.

   Le thème « marmite » est le défaut : il vit dans :root, sans attribut, pour
   qu'un premier chargement n'attende pas le JavaScript.
   ───────────────────────────────────────────────────────────────────────── */\n`,
]

for (const theme of THEMES) {
  const clair = variante(theme, false)
  const sombre = variante(theme, true)
  tousLesEchecs.push(...verifier(theme, false, clair), ...verifier(theme, true, sombre))

  const selClair = theme.id === 'marmite' ? ':root' : `[data-theme='${theme.id}']`
  const selSombre = theme.id === 'marmite' ? '.dark' : `[data-theme='${theme.id}'].dark`
  morceaux.push(bloc(selClair, clair, `${theme.nom} — clair. ${theme.phrase}`))
  morceaux.push(bloc(selSombre, sombre, `${theme.nom} — sombre`))
}

/* ── Cohérence avec les vignettes de choix ────────────────────────────────────
   `src/lib/apparence.ts` recopie trois couleurs par thème : la vignette d'un
   thème doit le montrer pendant qu'un autre est appliqué, donc elle ne peut pas
   lire les variables CSS courantes. Cette recopie est le genre de duplication qui
   dérive en silence — un thème retouché ici et une vignette qui montre l'ancienne
   couleur. Le script la vérifie donc, et dit quoi écrire.                       */

const apparence = readFileSync(new URL('../src/lib/apparence.ts', import.meta.url), 'utf8')
for (const theme of THEMES) {
  const clair = variante(theme, false)
  const attendu = [clair.ground, clair.primaire, clair['accent-vif']]
  const bloc = apparence.match(new RegExp(`id: '${theme.id}'[\\s\\S]{0,320}?apercu: \\[([^\\]]+)\\]`))
  if (!bloc) {
    tousLesEchecs.push(`apparence.ts : aucune vignette pour « ${theme.id} »`)
    continue
  }
  const trouve = bloc[1].match(/#[0-9a-f]{6}/g) ?? []
  if (trouve.join() !== attendu.join()) {
    tousLesEchecs.push(
      `apparence.ts : vignette de « ${theme.id} » à corriger — ` +
        `attendu ${attendu.map((c) => `'${c}'`).join(', ')}, trouvé ${trouve.map((c) => `'${c}'`).join(', ')}`,
    )
  }
}

const verifieSeulement = process.argv.includes('--verifie')

if (tousLesEchecs.length > 0) {
  console.error(`\n${tousLesEchecs.length} contraste(s) hors seuil :`)
  for (const e of tousLesEchecs) console.error('  ✗ ' + e)
  process.exit(1)
}

if (!verifieSeulement) {
  writeFileSync(new URL('../src/palettes.css', import.meta.url), morceaux.join('\n'), 'utf8')
  console.log('src/palettes.css écrit.')
}

if (avertissements.length > 0) {
  const uniques = [...new Set(avertissements.map((a) => a.replace(/^\S+ /, '')))]
  console.log(`\n${avertissements.length} avertissement(s), sur des fonds non utilisés :`)
  for (const a of uniques) console.log('  ~ ' + a)
}

console.log(`\n${THEMES.length} thèmes × 2 variantes : tous les contrastes tiennent.`)
console.log('Aperçu des primaires :')
for (const theme of THEMES) {
  const c = variante(theme, false)
  const s = variante(theme, true)
  console.log(
    `  ${theme.nom.padEnd(10)} clair ${c.primaire} (${contraste(c.primaire, c.sunken).toFixed(2)}:1)` +
      `   sombre ${s.primaire} (${contraste(s.primaire, s.sunken).toFixed(2)}:1)`,
  )
}
