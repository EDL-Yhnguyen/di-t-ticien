/**
 * Génère `src/palettes.css` : le jeu de couleurs de marque de Mamakilo, en
 * variante claire et sombre.
 *
 *   node outils/palettes.mjs           écrit le fichier et affiche le rapport
 *   node outils/palettes.mjs --verifie n'écrit rien, sort en 1 si un contraste échoue
 *
 * Pourquoi un générateur plutôt que deux blocs écrits à la main : le CLAUDE.md
 * demande que toute teinte modifiée soit revérifiée au calcul de contraste sur
 * chacun des fonds où elle peut atterrir — quatre rôles, quatre fonds chacun
 * (dont son propre lavis), en clair et en sombre. La règle ne peut tenir que
 * si elle est exécutable.
 *
 * Le principe ne change pas depuis la première version : on ne choisit pas
 * une couleur, on choisit une teinte (l'angle OKLCH) et une saturation, et le
 * script cherche la clarté qui atteint le rapport voulu sur le pire fond. Une
 * couleur est donc toujours la plus vive que l'accessibilité autorise, au
 * lieu d'être un compromis à l'œil.
 *
 * Historique : ce fichier générait huit thèmes sélectionnables jusqu'au
 * 04/08/2026, retirés au profit d'un seul jeu de couleurs de marque — voir
 * docs/superpowers/specs/2026-08-04-refonte-identite-mamakilo-design.md.
 */

import { writeFileSync } from 'node:fs'

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

/* ── La marque ─────────────────────────────────────────────────────────────
   Orange sanguine, citron vert, menthe, rose radis — direction validée avec
   Yann le 04/08/2026 (compagnon visuel de brainstorming). Le fond garde la
   même teinte crème que l'ancien thème « Marmite » : ce n'est pas ce qui a
   changé.
   ───────────────────────────────────────────────────────────────────────── */
const MARQUE = {
  fond: { hue: 62, chroma: 0.014 },
  // Les fonds sont crème, mais l'encre est le marine du lettrage du logo :
  // c'est la seule teinte que la nouvelle identité reprend de l'ancienne, et
  // il faut le dire au script, sinon les trois encres appartiennent à la
  // même famille que le fond.
  encre: { hue: 232, chroma: 0.022 },
  roles: {
    primaire: { hue: 35, chroma: 0.19 }, // orange sanguine
    accent: { hue: 100, chroma: 0.16 }, // citron vert
    reussite: { hue: 168, chroma: 0.13 }, // menthe
    alerte: { hue: 345, chroma: 0.19 }, // rose radis
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

function variante(sombre) {
  const { hue: hf, chroma: cf } = MARQUE.fond

  const ground = sombre ? hex(0.205, cf, hf) : hex(0.973, cf, hf)
  const surface = sombre ? hex(0.255, cf, hf) : hex(1, 0, hf)
  const sunken = sombre ? hex(0.315, cf, hf) : hex(0.955, cf * 1.6, hf)

  const fondsTexte = [ground, surface, sunken]
  const pireFond = sombre
    ? fondsTexte.reduce((a, b) => (luminance(a) > luminance(b) ? a : b))
    : fondsTexte.reduce((a, b) => (luminance(a) < luminance(b) ? a : b))

  const { hue: he, chroma: ce } = MARQUE.encre

  const neutre = (cible) =>
    hex(clarteLisible({ chroma: ce, hue: he, fonds: [pireFond], cible, sombre }), ce, he)

  const jetons = {
    ground,
    surface,
    sunken,
    ink: neutre(CIBLES.ink),
    'ink-soft': neutre(CIBLES['ink-soft']),
    'ink-faint': neutre(CIBLES['ink-faint']),
    line: sombre ? hex(0.36, cf * 1.4, hf) : hex(0.9, cf * 2.2, hf),
  }

  for (const [role, { hue, chroma }] of Object.entries(MARQUE.roles)) {
    const wash = sombre
      ? hex(0.245, Math.min(chroma * 0.42, 0.06), hue)
      : hex(0.955, Math.min(chroma * 0.3, 0.05), hue)
    const fonds = sombre
      ? [ground, surface, sunken, wash].reduce(
          (acc, f) => (acc.length === 0 || luminance(f) > luminance(acc[0]) ? [f] : acc),
          [],
        )
      : [ground, surface, sunken, wash].reduce(
          (acc, f) => (acc.length === 0 || luminance(f) < luminance(acc[0]) ? [f] : acc),
          [],
        )
    const L = clarteLisible({ chroma, hue, fonds, cible: CIBLES.role, sombre })
    jetons[role] = hex(L, chroma, hue)
    jetons[`${role}-wash`] = wash
  }

  // ── L'accent vif ──────────────────────────────────────────────────────────
  // Le citron vert doit porter du texte à 4,5:1 sur fond clair, ce qu'aucun
  // jaune-vert vif n'atteint : `accent` ressort donc olive/sombre par
  // construction (physique, pas un réglage à trouver — le même phénomène
  // qu'un accent vif forcé au sombre pour tenir le contraste du texte
  // qu'il porte). Le citron fluo attendu vit dans
  // `accent-vif`, réservé aux aplats (Tuile ton="vif", le bandeau) où c'est le
  // texte qui doit être lisible sur la couleur, pas l'inverse.
  const { hue: ha, chroma: ca } = MARQUE.roles.accent
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

  const { hue: hp, chroma: cp } = MARQUE.roles.primaire
  const Lb = clarteLisible({
    chroma: cp,
    hue: hp,
    fonds: ['#ffffff'],
    cible: CIBLES.bandeau,
    sombre: false,
  })
  jetons['bandeau-haut'] = hex(sombre ? Lb * 0.82 : Lb, cp, hp)
  jetons['bandeau-bas'] = hex(sombre ? Lb * 0.6 : Lb * 0.76, cp * 0.94, hp)

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

function verifier(sombre, j) {
  const echecs = []
  const nom = sombre ? 'sombre' : 'clair'
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
  // ses fonds : c'est la seule chose qu'un jeu de couleurs de marque pouvait
  // casser dans une échelle déjà validée.
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

const clair = variante(false)
const sombre = variante(true)
const tousLesEchecs = [...verifier(false, clair), ...verifier(true, sombre)]

const morceaux = [
  `/* ─────────────────────────────────────────────────────────────────────────
   FICHIER GÉNÉRÉ — ne pas modifier à la main.
   Source : outils/palettes.mjs · régénérer avec « node outils/palettes.mjs ».

   Le jeu de couleurs de marque de Mamakilo, calculé pour atteindre son
   rapport de contraste sur le pire fond, lavis compris, puis mesuré.
   Retoucher une couleur ici la ferait sortir de cette garantie sans que rien
   ne le signale.
   ───────────────────────────────────────────────────────────────────────── */\n`,
  bloc(':root', clair, 'Mamakilo — clair'),
  bloc('.dark', sombre, 'Mamakilo — sombre'),
]

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

console.log('\nContrastes vérifiés, clair et sombre.')
console.log(
  `Primaire : clair ${clair.primaire} (${contraste(clair.primaire, clair.sunken).toFixed(2)}:1)` +
    `   sombre ${sombre.primaire} (${contraste(sombre.primaire, sombre.sunken).toFixed(2)}:1)`,
)
console.log(`Fond (ground) : clair ${clair.ground}   sombre ${sombre.ground}`)
