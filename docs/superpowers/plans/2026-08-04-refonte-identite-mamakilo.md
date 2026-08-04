# Refonte de l'identité visuelle de Mamakilo — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le système de couleurs à 8 thèmes par un seul jeu de couleurs de marque (orange sanguine / citron vert / menthe / rose radis), remplacer Faustina/Figtree par Fredoka/Inter, et ajouter une signature de marque (marmite inchangée + mot « mamakilo » avec un cœur sur le i) sur les écrans qui présentent la marque en entier.

**Architecture:** L'application est entièrement pilotée par des jetons CSS (custom properties) consommés via des classes Tailwind — aucun écran ne code de couleur en dur (vérifié : zéro occurrence de couleur hexadécimale dans `src/pages`). Changer les jetons dans `outils/palettes.mjs` et `src/index.css` re-thème donc automatiquement les 23 écrans sans les toucher un par un. Le travail manuel se limite à : (1) les deux générateurs (`outils/palettes.mjs`, `outils/polices.mjs`) et les fichiers qu'ils écrivent, (2) le sélecteur de thème à retirer (`apparence.ts`, `Apparence.tsx`, `Profil.tsx`), (3) les quatre endroits qui affichent le mot « Mamakilo » en toutes lettres à côté du logo, (4) une vérification visuelle des 23 écrans pour rattraper tout ce que cette hypothèse aurait manqué.

**Tech Stack:** Vite, React 19, TypeScript 5.9, Tailwind CSS 4 (jetons via `@theme inline`), scripts Node purs (`outils/*.mjs`, aucune dépendance ajoutée).

## Global Constraints

- Code en français partout (variables, fonctions, composants) — voir `CLAUDE.md` du dépôt.
- `npm audit` doit rester à zéro vulnérabilité ; aucune dépendance n'est ajoutée par ce plan.
- Aucun jeton `assiette-*`, `nutri-*`, `bande-*`, `macro-*` n'est modifié — ils sont validés en vision daltonienne et suivent une échelle officielle, hors périmètre.
- `public/icone.svg` et le composant `Marque` (`src/components/ui.tsx`) restent strictement inchangés — Yann a explicitement rejeté toute nouvelle icône.
- `outils/palettes.mjs` et `outils/polices.mjs` génèrent `src/palettes.css` et `src/polices.css` : ces deux fichiers générés ne sont jamais édités à la main.
- Toute modification de couleur repasse par `node outils/palettes.mjs --verifie` avant commit (sort en 1 si un contraste échoue).
- `npm run verifier` (tests + contraste + typecheck + build) est la commande de référence avant toute livraison.
- Travail réalisé exclusivement dans la worktree `C:\Users\YHN\Documents\Git\.worktrees\mamakilo-refonte-design`, branche `refonte-design`. Ne pas toucher à `C:\Users\YHN\Documents\Git\mamakilo` ni à la worktree `mamakilo-synchro` (chantier de migration Supabase en cours).
- Spec de référence : `docs/superpowers/specs/2026-08-04-refonte-identite-mamakilo-design.md`.
- Règle du workspace (`C:\Users\YHN\Documents\Git\CLAUDE.md`, §2 bis) : `REPRISE.md` du dépôt doit être à jour **dans le même commit** que tout changement — d'où la Task 11.

## Hors périmètre de ce plan

**La vidéo vitrine n'a pas de tâche ici.** Le spec la décrit comme un
livrable indépendant (motion design stylisé via le skill `hyperframes`, pas
du code React/TypeScript testable comme le reste de ce plan) qui peut démarrer
dès que la Task 10, Step 4 est validée — la signature de marque et la palette
figées sur les écrans de référence suffisent, sans attendre le balayage des 23
écrans. Elle se traitera comme son propre chantier, avec son propre outillage.

---

### Task 1: Le nouveau jeu de couleurs de marque

**Files:**
- Modify: `outils/palettes.mjs` (réécriture complète, ~430 lignes contre ~600 aujourd'hui)

**Interfaces:**
- Consumes: rien (script autonome)
- Produces: `src/palettes.css` avec deux blocs, `:root` (clair) et `.dark` (sombre), portant les 20 jetons de `ORDRE` (`ground`, `surface`, `sunken`, `ink`, `ink-soft`, `ink-faint`, `line`, `line-fort`, `primaire(-wash)`, `accent(-wash)`, `accent-vif(-encre)`, `reussite(-wash)`, `alerte(-wash)`, `bandeau-haut/bas`)

Le script garde intégralement les fonctions de conversion OKLCH→sRGB et de contraste WCAG (`oklchVersLinear`, `gamma`, `oklchVersRgb`, `hex`, `versRgb`, `luminance`, `contraste`, `clarteLisible`) : elles sont correctes et ne dépendent pas du nombre de thèmes. Ce qui change : `THEMES` (tableau de 8) devient `MARQUE` (un seul objet), la boucle de génération et le contrôle croisé avec `apparence.ts` (vignettes de choix, qui n'existent plus) disparaissent.

- [ ] **Step 1: Remplacer l'en-tête du fichier**

Remplacer les lignes 1-22 (commentaire d'en-tête) par :

```js
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
```

- [ ] **Step 2: Garder les fonctions OKLCH et de contraste inchangées**

Ne pas toucher aux fonctions `oklchVersLinear`, `gamma`, `oklchVersRgb`, `hex`, `versRgb`, `luminance`, `contraste`, `clarteLisible` (lignes 24-117 du fichier actuel). Changer uniquement l'import en tête, `readFileSync` n'est plus utilisé (il ne servait qu'au contrôle croisé avec `apparence.ts`, retiré) :

```js
import { writeFileSync } from 'node:fs'
```

- [ ] **Step 3: Remplacer `THEMES` par `MARQUE`**

Remplacer tout le bloc `const THEMES = [...]` (l'ancien tableau de 8 thèmes) par :

```js
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
```

Retirer aussi le bloc `MARMITE_EN_DUR` qui suivait : les valeurs de l'ancien thème étaient figées parce qu'elles reprenaient le corail exact du logo (« déjà validées »). Ce n'est plus le cas — la nouvelle palette est indépendante des couleurs de l'illustration, qui restent seulement dans `Marque` et `MarmiteExpression`. Tout se calcule désormais, y compris `ground`/`surface`/`sunken`.

- [ ] **Step 4: Garder `CIBLES` inchangé**

Le bloc `const CIBLES = { ink: 7, 'ink-soft': 4.6, 'ink-faint': 4.5, role: 4.5, 'line-fort': 3, bandeau: 6 }` ne change pas.

- [ ] **Step 5: Réécrire `variante()` sans le paramètre `theme`**

Remplacer la fonction `variante(theme, sombre)` entière par :

```js
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
  // construction (physique, pas un réglage à trouver — le même phénomène que
  // le thème « Encre » documentait déjà). Le citron fluo attendu vit dans
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
```

- [ ] **Step 6: Réécrire `verifier()` sans le paramètre `theme`**

Remplacer la fonction `verifier(theme, sombre, j)` par `verifier(sombre, j)` — identique, en remplaçant `const nom = \`${theme.id}/${sombre ? 'sombre' : 'clair'}\`` par `const nom = sombre ? 'sombre' : 'clair'`. Le reste du corps (boucle sur `ink`/`ink-soft`/`ink-faint`, boucle sur `ROLES`, `accent-vif-encre`, `line-fort`, `bandeau-haut/bas`, et le bloc `RESERVES` avec `assiette-*`/`macro-*`/`bande-*`) ne change pas — recopier tel quel depuis le fichier actuel (lignes 432-496), seule la signature et la ligne `nom` changent. `const ROLES = ['primaire', 'accent', 'reussite', 'alerte']` reste avant la fonction.

- [ ] **Step 7: Simplifier l'émission**

Garder `const ORDRE = [...]` (les 20 clés, lignes 500-521 actuelles) et `function bloc(selecteur, jetons, titre) {...}` (lignes 523-526) inchangés. Remplacer tout le bloc final (à partir de `const tousLesEchecs = []` jusqu'à la fin du fichier) par :

```js
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

console.log('\nContrastes vérifiés, clair et sombre.')
console.log(
  `Primaire : clair ${clair.primaire} (${contraste(clair.primaire, clair.sunken).toFixed(2)}:1)` +
    `   sombre ${sombre.primaire} (${contraste(sombre.primaire, sombre.sunken).toFixed(2)}:1)`,
)
console.log(`Fond (ground) : clair ${clair.ground}   sombre ${sombre.ground}`)
```

Le bloc `avertissements` (déclaré en haut du fichier, alimenté dans `verifier()` par les jetons réservés sur `sunken`) et son affichage optionnel restent — recopier tel quel depuis les lignes 430 (`const avertissements = []`) et 593-597 (le `if (avertissements.length > 0)`) du fichier actuel.

Retirer entièrement la section « Cohérence avec les vignettes de choix » (l'ancien bloc qui relisait `src/lib/apparence.ts` pour comparer les vignettes) : elle n'a plus d'objet, il n'y a plus de vignettes.

- [ ] **Step 8: Exécuter et vérifier**

Run: `node outils/palettes.mjs`

Expected: pas d'erreur, `src/palettes.css écrit.` suivi de `Contrastes vérifiés, clair et sombre.`, puis les valeurs de `Primaire` et `Fond (ground)`. Avec les teintes ci-dessus, la sortie attendue (calculée avec l'algorithme réel avant d'écrire ce plan) est :

```
Contrastes vérifiés, clair et sombre.
Primaire : clair #ca3709 (4.52:1)   sombre #fe6944 (…)
Fond (ground) : clair #fdf4ed   sombre #1c1611
```

**Noter la valeur exacte de `Fond (ground) : clair`** (`#fdf4ed` si les teintes n'ont pas changé) — elle sert à la Task 4.

- [ ] **Step 9: Commit**

```bash
git add outils/palettes.mjs src/palettes.css
git commit -m "feat: nouveau jeu de couleurs de marque (orange sanguine, citron vert, menthe, rose radis)"
```

---

### Task 2: Simplifier `src/lib/apparence.ts`

**Files:**
- Modify: `src/lib/apparence.ts` (réécriture complète)

**Interfaces:**
- Consumes: rien
- Produces: `ModeApparence`, `modeEnregistre(): ModeApparence`, `sombreVoulu(mode): boolean`, `enregistrerMode(mode): void`, `surChangementSysteme(reagir): () => void`, `appliquerApparence(mode: ModeApparence): void` — **la signature de `appliquerApparence` perd son premier paramètre `theme`**, ce que consomment Task 3 et Task 4.

- [ ] **Step 1: Réécrire le fichier**

Remplacer tout le contenu de `src/lib/apparence.ts` par :

```ts
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
    /* Navigation privée : le mode s'applique quand même, il ne survit pas. */
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
```

- [ ] **Step 2: Vérifier qu'aucun test ne référence le fichier**

Run: `Grep -r "apparence" src --include=*.test.ts` (ou `Select-String` sous PowerShell)

Expected: aucun résultat — `apparence.ts` n'a jamais eu de test (module à effets de bord sur le DOM, hors du périmètre couvert par le projet).

- [ ] **Step 3: Commit**

```bash
git add src/lib/apparence.ts
git commit -m "refactor: retirer le choix de thème de couleur, garder clair/sombre/système"
```

---

### Task 3: Simplifier le réglage d'apparence dans l'écran Profil

**Files:**
- Modify: `src/components/Apparence.tsx` (retrait du sélecteur de couleurs)
- Modify: `src/pages/Profil.tsx:434-443` (texte de la section)

**Interfaces:**
- Consumes: `appliquerApparence(mode: ModeApparence)`, `modeEnregistre()`, `enregistrerMode()`, `surChangementSysteme()` depuis `../lib/apparence` (Task 2)
- Produces: `ReglageApparence` (composant, même nom, même export, plus de sélection de couleur)

- [ ] **Step 1: Réécrire `src/components/Apparence.tsx`**

Remplacer tout le contenu par :

```tsx
import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  appliquerApparence,
  enregistrerMode,
  modeEnregistre,
  surChangementSysteme,
  type ModeApparence,
} from '../lib/apparence'
import { classes } from '../lib/utils'

const MODES: { valeur: ModeApparence; libelle: string; Icone: typeof Sun }[] = [
  { valeur: 'clair', libelle: 'Clair', Icone: Sun },
  { valeur: 'sombre', libelle: 'Sombre', Icone: Moon },
  { valeur: 'systeme', libelle: 'Système', Icone: Monitor },
]

/**
 * Le réglage d'apparence : clair / sombre / système.
 *
 * Le choix s'applique au document dès le clic, avant tout enregistrement :
 * c'est un réglage dont on veut voir l'effet pour décider.
 */
export function ReglageApparence() {
  const [mode, setMode] = useState<ModeApparence>(modeEnregistre)

  useEffect(() => {
    appliquerApparence(mode)
    enregistrerMode(mode)
  }, [mode])

  // En mode « systeme », la bascule du système doit se voir sans recharger.
  useEffect(() => {
    if (mode !== 'systeme') return
    return surChangementSysteme(() => appliquerApparence('systeme'))
  }, [mode])

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">Luminosité</legend>
      <div className="flex gap-1.5 rounded-full bg-sunken p-1.5">
        {MODES.map(({ valeur, libelle, Icone }) => {
          const actif = mode === valeur
          return (
            <label
              key={valeur}
              className={classes(
                'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full py-2.5',
                'text-sm font-semibold transition',
                actif ? 'plein-primaire text-white shadow-halo' : 'text-ink-soft hover:text-ink',
              )}
            >
              <input
                type="radio"
                name="luminosite"
                checked={actif}
                onChange={() => setMode(valeur)}
                className="sr-only"
              />
              <Icone size={16} strokeWidth={2.3} aria-hidden="true" />
              {libelle}
            </label>
          )
        })}
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        « Système » suit le réglage de votre téléphone, y compris quand il bascule le soir.
      </p>
    </fieldset>
  )
}
```

- [ ] **Step 2: Mettre à jour `src/pages/Profil.tsx:434-443`**

Remplacer :

```tsx
      <section>
        <TitreSection eyebrow="Apparence">Vos couleurs</TitreSection>
        <Carte className="p-5">
          <ReglageApparence />
          <p className="mt-5 border-t border-line pt-4 text-xs text-ink-faint">
            Le choix est mémorisé sur cet appareil, pas dans votre compte : l’écran d’un téléphone
            le soir n’appelle pas le même thème que celui d’un ordinateur en plein jour.
          </p>
        </Carte>
      </section>
```

par :

```tsx
      <section>
        <TitreSection eyebrow="Apparence">Luminosité</TitreSection>
        <Carte className="p-5">
          <ReglageApparence />
          <p className="mt-5 border-t border-line pt-4 text-xs text-ink-faint">
            Le choix est mémorisé sur cet appareil, pas dans votre compte : l’écran d’un téléphone
            le soir n’appelle pas le même réglage que celui d’un ordinateur en plein jour.
          </p>
        </Carte>
      </section>
```

- [ ] **Step 3: Vérifier le typecheck**

Run: `npx tsc -b`

Expected: aucune erreur (confirme qu'aucun autre fichier n'importe `THEMES`, `IdTheme`, `themeEnregistre` ou `enregistrerTheme` retirés à la Task 2).

- [ ] **Step 4: Commit**

```bash
git add src/components/Apparence.tsx src/pages/Profil.tsx
git commit -m "refactor: retirer le sélecteur de thème de couleur de l'écran Profil"
```

---

### Task 4: Mettre à jour le point d'entrée (`main.tsx`, `index.html`, manifeste)

**Files:**
- Modify: `src/main.tsx:8-13,29-30`
- Modify: `index.html:11-14,38-51,55-85`
- Modify: `public/manifest.webmanifest:11-12`

**Interfaces:**
- Consumes: `appliquerApparence(mode: ModeApparence)` sans paramètre `theme` (Task 2), la valeur de `Fond (ground) : clair` notée à la Task 1 Step 8.

- [ ] **Step 1: Mettre à jour `src/main.tsx`**

Remplacer les lignes 8-13 :

```ts
import {
  appliquerApparence,
  modeEnregistre,
  surChangementSysteme,
  themeEnregistre,
} from './lib/apparence'
```

par :

```ts
import { appliquerApparence, modeEnregistre, surChangementSysteme } from './lib/apparence'
```

Puis remplacer les lignes 29-30 :

```ts
appliquerApparence(themeEnregistre(), modeEnregistre())
surChangementSysteme(() => appliquerApparence(themeEnregistre(), modeEnregistre()))
```

par :

```ts
appliquerApparence(modeEnregistre())
surChangementSysteme(() => appliquerApparence(modeEnregistre()))
```

- [ ] **Step 2: Mettre à jour le script anti-flash et le `theme-color` dans `index.html`**

Remplacer le commentaire et la balise des lignes 11-14 :

```html
    <!-- Une seule balise, mise à jour par appliquerApparence() : avec huit thèmes,
         deux valeurs figées par préférence système afficheraient la barre du
         navigateur en crème pendant que l'application est en violet. -->
    <meta name="theme-color" content="#FDF6EE" />
```

par (remplacer `#fdf4ed` par la valeur exacte notée à la Task 1 Step 8 si elle diffère) :

```html
    <!-- Valeur de repli avant que appliquerApparence() ne la corrige selon le
         mode clair/sombre réel — voir le script anti-flash plus bas. -->
    <meta name="theme-color" content="#fdf4ed" />
```

Remplacer le bloc de préchargement des polices, lignes 38-51 :

```html
    <link
      rel="preload"
      href="/polices/figtree-latin.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
    <link
      rel="preload"
      href="/polices/faustina-latin.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
```

par :

```html
    <link rel="preload" href="/polices/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link
      rel="preload"
      href="/polices/fredoka-latin.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
```

(Les noms de fichiers exacts sont confirmés à la Task 6, Step 3 — `outils/polices.mjs` nomme chaque fichier `${famille.toLowerCase()}-${sousEnsemble}.woff2`.)

Remplacer le script anti-flash, lignes 55-85 :

```html
    <!-- Appliqué avant le premier rendu : sans ça, un thème sombre ou coloré
         choisi dans les réglages provoque un flash de l'autre thème au
         chargement. Ces quelques lignes sont volontairement dupliquées avec
         src/lib/apparence.ts : elles doivent tourner avant le premier octet de
         JavaScript applicatif, donc elles ne peuvent pas l'importer. Les noms des
         deux clés et la liste des thèmes sont la seule chose à garder d'accord. -->
    <script>
      ;(function () {
        try {
          var mode = localStorage.getItem('equilibre:theme')
          var sombre =
            mode === 'sombre' ||
            (mode !== 'clair' && matchMedia('(prefers-color-scheme: dark)').matches)
          if (sombre) document.documentElement.classList.add('dark')

          var theme = localStorage.getItem('equilibre:palette')
          var connus = [
            'potager',
            'agrumes',
            'myrtille',
            'ocean',
            'cacao',
            'framboise',
            'encre',
          ]
          // « marmite » est le défaut et vit dans :root, sans attribut.
          if (theme && connus.indexOf(theme) !== -1)
            document.documentElement.setAttribute('data-theme', theme)
        } catch (e) {}
      })()
    </script>
```

par :

```html
    <!-- Appliqué avant le premier rendu : sans ça, un mode sombre choisi dans
         les réglages provoque un flash du mode clair au chargement. Ces
         quelques lignes sont volontairement dupliquées avec
         src/lib/apparence.ts : elles doivent tourner avant le premier octet de
         JavaScript applicatif, donc elles ne peuvent pas l'importer. Le nom de
         la clé est la seule chose à garder d'accord. -->
    <script>
      ;(function () {
        try {
          var mode = localStorage.getItem('equilibre:theme')
          var sombre =
            mode === 'sombre' ||
            (mode !== 'clair' && matchMedia('(prefers-color-scheme: dark)').matches)
          if (sombre) document.documentElement.classList.add('dark')
        } catch (e) {}
      })()
    </script>
```

- [ ] **Step 3: Mettre à jour `public/manifest.webmanifest`**

Remplacer les lignes 11-12 :

```json
  "background_color": "#FDF6EE",
  "theme_color": "#FDF6EE",
```

par (même valeur que la Task 1 Step 8 et le Step 2 ci-dessus) :

```json
  "background_color": "#fdf4ed",
  "theme_color": "#fdf4ed",
```

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx index.html public/manifest.webmanifest
git commit -m "refactor: adapter le point d'entrée au thème de couleur unique"
```

---

### Task 5: Nouvelle typographie — régénérer `outils/polices.mjs`

**Files:**
- Modify: `outils/polices.mjs`

**Interfaces:**
- Consumes: rien (script autonome, appelle l'API Google Fonts une fois pour télécharger)
- Produces: `public/polices/fredoka-latin.woff2`, `public/polices/fredoka-latin-ext.woff2`, `public/polices/inter-latin.woff2`, `public/polices/inter-latin-ext.woff2`, `public/polices/OFL-Fredoka.txt`, `public/polices/OFL-Inter.txt`, `src/polices.css`

- [ ] **Step 1: Changer la requête et les commentaires d'en-tête**

Dans `outils/polices.mjs`, remplacer la ligne :

```js
const REQUETE = 'https://fonts.googleapis.com/css2?family=Faustina:wght@400..700&family=Figtree:wght@400..900&display=swap'
```

par :

```js
const REQUETE = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Inter:wght@100..900&display=swap'
```

Remplacer dans le commentaire d'en-tête (docstring du fichier) et dans la variable `entete` les deux occurrences de « Faustina et Figtree » / « Faustina (Omnibus-Type) et Figtree (Erik Kennedy) » par « Fredoka et Inter », et « `public/polices/OFL-Faustina.txt` et `public/polices/OFL-Figtree.txt` » par « `public/polices/OFL-Fredoka.txt` et `public/polices/OFL-Inter.txt` ». Le reste du raisonnement (RGPD, hors-ligne, licence OFL) ne change pas — recopier les phrases à l'identique en changeant seulement les noms de famille.

- [ ] **Step 2: Mettre à jour `controlerLicences()`**

Remplacer :

```js
  const attendues = ['OFL-Faustina.txt', 'OFL-Figtree.txt']
```

par :

```js
  const attendues = ['OFL-Fredoka.txt', 'OFL-Inter.txt']
```

- [ ] **Step 3: Exécuter et vérifier**

Run: `node outils/polices.mjs --refaire`

Expected: quatre lignes `↓ fredoka-latin.woff2`, `↓ fredoka-latin-ext.woff2`, `↓ inter-latin.woff2`, `↓ inter-latin-ext.woff2` (ou l'ordre inverse selon celui renvoyé par Google), puis `4 @font-face écrits dans src/polices.css`, puis `Licences OFL présentes pour les deux familles.`

**Si le script échoue avec `X blocs trouvés, 4 attendus`** : Google ne sert pas une des deux familles comme police variable sur toute la plage demandée. Retenter avec des poids discrets pour la famille en cause, par exemple `family=Fredoka:wght@500;700`, et adapter la vérification `blocs.length !== SOUS_ENSEMBLES.length * 2` en conséquence (elle passe alors à un nombre de blocs différent, à calculer : nombre de familles × nombre de poids × nombre de sous-ensembles).

**Si le script échoue avec `la licence doit accompagner les fichiers`** : la famille téléchargée n'est pas sous licence OFL — chercher une police de remplacement dans le même esprit (ronde et chaleureuse pour les titres, très lisible pour le texte courant) avant de continuer.

- [ ] **Step 4: Commit**

```bash
git add outils/polices.mjs public/polices/ src/polices.css
git commit -m "feat: remplacer Faustina/Figtree par Fredoka/Inter"
```

---

### Task 6: Jetons de police dans `src/index.css` et retrait des références aux 8 thèmes

**Files:**
- Modify: `src/index.css:9-16,184-185,218-227`

**Interfaces:**
- Consumes: `src/polices.css` généré (Task 5), `src/palettes.css` généré (Task 1)
- Produces: `--font-display`, `--font-sans` pointant vers Fredoka/Inter

- [ ] **Step 1: Mettre à jour les commentaires d'en-tête (lignes 9-16)**

Remplacer :

```css
/* Les huit thèmes, en clair et en sombre. Fichier généré : voir
   outils/palettes.mjs. Le thème « marmite » y occupe :root et .dark, donc
   l'application a ses couleurs même si aucun thème n'est choisi. */
@import './palettes.css';

/* Le thème sombre est piloté par une classe sur <html>, le thème de couleur par
   l'attribut data-theme. Les deux se combinent : huit palettes × deux modes. */
@custom-variant dark (&:where(.dark, .dark *));
```

par :

```css
/* Le jeu de couleurs de marque, en clair et en sombre. Fichier généré : voir
   outils/palettes.mjs. */
@import './palettes.css';

/* Le mode sombre est piloté par une classe sur <html>. */
@custom-variant dark (&:where(.dark, .dark *));
```

- [ ] **Step 2: Mettre à jour les jetons de police (lignes 184-185)**

Remplacer :

```css
  --font-display: 'Faustina', Georgia, 'Times New Roman', serif;
  --font-sans: 'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
```

par :

```css
  --font-display: 'Fredoka', ui-rounded, 'Segoe UI', sans-serif;
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
```

- [ ] **Step 3: Mettre à jour le commentaire au-dessus de la règle `.font-display, h1, h2, h3` (lignes 218-227)**

Remplacer :

```css
  /* Faustina : serif humaniste à forte hauteur d'x, choisie pour ses
     chiffres — un poids et un total de calories sont ce que cette
     application affiche en plus gros. Elle remplace Fraunces, trop vue
     pour porter une identité propre. */
  .font-display,
  h1,
  h2,
  h3 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
  }
```

par :

```css
  /* Fredoka : ronde et chaleureuse plutôt que géométrique — la première
     direction de logo (abstraite) avait été refusée précisément pour ce
     manque de chaleur, voir
     docs/superpowers/specs/2026-08-04-refonte-identite-mamakilo-design.md. */
  .font-display,
  h1,
  h2,
  h3 {
    font-family: var(--font-display);
    letter-spacing: -0.01em;
  }
```

(`letter-spacing` passe de `-0.02em` à `-0.01em` : Fredoka est une police ronde à espacement déjà plus resserré que Faustina, un `-0.02em` supplémentaire colle les lettres sur les titres en gros corps — à confirmer/ajuster à l'écran pendant la Task 9.)

- [ ] **Step 4: Vérifier au navigateur**

Run: `npm run dev`, ouvrir `http://localhost:5173/`

Expected: la page d'accueil affiche déjà les nouvelles couleurs (orange sanguine sur les boutons) et la nouvelle typographie (Fredoka sur « Mamakilo » et les titres, Inter sur le texte courant), sans attendre les tâches suivantes — c'est la démonstration que le système de jetons propage seul.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat: appliquer Fredoka/Inter et retirer les références aux 8 thèmes"
```

---

### Task 7: Bump du service worker

**Files:**
- Modify: `public/sw.js:14-20`

**Interfaces:**
- Consumes: rien
- Produces: purge des caches `mamakilo-v2-*` à l'activation

- [ ] **Step 1: Changer la version**

Remplacer :

```js
// Changer ce nom purge les caches précédents à l'activation : c'est ce qui
// débarrasse les installations existantes de l'ancienne icône et de l'ancienne
// coquille au moment du passage à Mamakilo.
//
// **v2 le 31/07/2026, et cette bascule-là compte plus que les autres.** Le cache
// `mamakilo-v1-polices` contient des réponses de fonts.gstatic.com, obtenues du
// temps où les polices venaient de Google. Elles ne sont plus demandées, donc
// elles ne seraient jamais remplacées : sans changement de version, chaque PWA
// déjà installée garderait indéfiniment des fichiers d'un tiers dont on vient de
// se séparer.
const VERSION = 'mamakilo-v2'
```

par :

```js
// Changer ce nom purge les caches précédents à l'activation.
//
// **v3 le 04/08/2026.** Le cache `mamakilo-v2-ressources` contient les
// `.woff2` de Faustina et Figtree, remplacées par Fredoka et Inter (voir
// outils/polices.mjs) : sans changement de version, chaque PWA déjà
// installée garderait indéfiniment les anciens fichiers de police, jamais
// redemandés donc jamais renouvelés.
const VERSION = 'mamakilo-v3'
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "chore: passer le service worker en mamakilo-v3 (polices renouvelées)"
```

---

### Task 8: Le composant `SignatureMarque`

**Files:**
- Modify: `src/components/ui.tsx` (ajout, après `Marque`, avant la section Boutons)

**Interfaces:**
- Consumes: `classes()` depuis `../lib/utils` (déjà importé dans `ui.tsx`)
- Produces: `SignatureMarque({ className? }): JSX.Element`, exporté depuis `src/components/ui.tsx`

Le mot « mamakilo » avec un cœur à la place du point du « i ». Deux choix techniques, notés pour ne pas les défaire :

- **Le texte utilise `text-ink` (le jeton de texte courant), pas une couleur figée.** La couleur `#24303C` du visage de la marmite avait été validée dans la maquette comme couleur du mot, mais l'algorithme de la Task 1 calcule `--ink` à une valeur différente selon le mode (`#44525a` en clair, `#b1c1ca` en sombre) pour garantir 7:1 de contraste. Un `#24303C` figé serait illisible en mode sombre (marine sur fond presque noir). `text-ink` reste dans le même esprit — une encre marine — tout en restant lisible dans les deux modes.
- **Le « i » n'est pas la lettre réelle de la police plus un point positionné par-dessus.** Positionner un cœur au pixel près sur le point du « i » réel dépend de métriques de police fragiles (position exacte du point, qui varie avec la taille et le rendu du navigateur). Le composant dessine plutôt sa propre haste (un trait vertical arrondi) surmontée d'un cœur, en unités `em` : ça suit la taille du texte environnant sans dépendre de la géométrie interne de Fredoka.

- [ ] **Step 1: Ajouter le composant**

Dans `src/components/ui.tsx`, juste après la fermeture de `Marque` (après la ligne `}` qui suit `</svg>`, avant le commentaire `/* ─────────────────────────────── Boutons ────────────────────────────────── */`), ajouter :

```tsx
/**
 * Le mot « mamakilo », avec un cœur à la place du point du i — la signature
 * de marque, utilisée à côté de `Marque` sur les écrans qui présentent le nom
 * en toutes lettres (accueil, connexion, mot de passe oublié).
 *
 * Le "i" n'est pas la lettre de la police : c'est une haste dessinée à la
 * main, en unités `em`, pour ne pas dépendre de la position du point réel
 * dans Fredoka d'une taille à l'autre. `mamak` et `lo` restent du texte, pour
 * que la casse et l'espacement suivent la police environnante normalement.
 */
export function SignatureMarque({ className }: { className?: string }) {
  return (
    <span className={classes('font-display font-semibold text-ink', className)}>
      mamak
      <svg
        aria-hidden="true"
        viewBox="0 0 32 100"
        style={{ width: '0.32em', height: '1em' }}
        className="mx-[0.02em] inline-block align-baseline"
      >
        {/* La haste du i */}
        <rect x="9" y="34" width="14" height="58" rx="7" fill="currentColor" />
        {/* Le cœur, à la place du point */}
        <path
          d="M16,30 C6,22 2,15 2,9 C2,3 7,0 12,3 C14,4.5 15.3,6.5 16,9 C16.7,6.5 18,4.5 20,3 C25,0 30,3 30,9 C30,15 26,22 16,30 Z"
          fill="var(--alerte)"
        />
      </svg>
      lo
    </span>
  )
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc -b`

Expected: aucune erreur.

- [ ] **Step 3: Vérifier que `Marque` n'a pas été touché**

Run: `npm run marque`

Expected: `✓ 20 tracés identiques entre Marque et l'icône installée.` (ou le nombre de tracés actuel — la commande doit réussir sans écart, confirmant que l'ajout de `SignatureMarque` n'a pas modifié `Marque`).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui.tsx
git commit -m "feat: composant SignatureMarque (mamakilo, cœur sur le i)"
```

---

### Task 9: Appliquer la signature sur les trois écrans qui affichent le mot en toutes lettres

**Files:**
- Modify: `src/pages/Accueil.tsx:6,74,90-95`
- Modify: `src/pages/Connexion.tsx:4,57`
- Modify: `src/pages/MotDePasseOublie.tsx:4,41`

**Interfaces:**
- Consumes: `SignatureMarque` depuis `../components/ui` (Task 8)

- [ ] **Step 1: `src/pages/Accueil.tsx` — en-tête**

Remplacer l'import (ligne 6) :

```tsx
import { Bouton, Marque } from '../components/ui'
```

par :

```tsx
import { Bouton, Marque, SignatureMarque } from '../components/ui'
```

Remplacer la ligne 74 :

```tsx
          <span className="font-display text-xl font-semibold text-ink">Mamakilo</span>
```

par :

```tsx
          <SignatureMarque className="text-xl" />
```

- [ ] **Step 2: `src/pages/Accueil.tsx` — titre du héros**

Remplacer les lignes 92-94 :

```tsx
              <h1 className="font-display text-[2.6rem] leading-[1.05] font-semibold text-ink sm:text-6xl">
                Mamakilo
              </h1>
```

par :

```tsx
              <h1>
                <SignatureMarque className="text-[2.6rem] leading-[1.05] sm:text-6xl" />
              </h1>
```

- [ ] **Step 3: `src/pages/Connexion.tsx`**

Remplacer l'import (ligne 4) :

```tsx
import { Bouton, Champ, Marque } from '../components/ui'
```

par :

```tsx
import { Bouton, Champ, Marque, SignatureMarque } from '../components/ui'
```

Remplacer la ligne 57 :

```tsx
          <span className="font-display text-2xl font-semibold text-ink">Mamakilo</span>
```

par :

```tsx
          <SignatureMarque className="text-2xl" />
```

- [ ] **Step 4: `src/pages/MotDePasseOublie.tsx`**

Remplacer l'import (ligne 4) :

```tsx
import { Bouton, Champ, Marque } from '../components/ui'
```

par :

```tsx
import { Bouton, Champ, Marque, SignatureMarque } from '../components/ui'
```

Remplacer la ligne 41 :

```tsx
          <span className="font-display text-2xl font-semibold text-ink">Mamakilo</span>
```

par :

```tsx
          <SignatureMarque className="text-2xl" />
```

- [ ] **Step 5: Vérifier le typecheck**

Run: `npx tsc -b`

Expected: aucune erreur.

- [ ] **Step 6: Vérifier à l'écran**

Run: `npm run dev`, ouvrir `/`, `/connexion`, `/mot-de-passe-oublie` (les trois routes, confirmées dans `src/App.tsx:154`)

Expected : le cœur remplace visuellement le point du i, lisible en 375 px et desktop, clair et sombre — ajuster `rx`/largeur de la haste dans `SignatureMarque` (Task 8) si le rendu paraît trop épais ou trop fin à côté de Fredoka.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Accueil.tsx src/pages/Connexion.tsx src/pages/MotDePasseOublie.tsx
git commit -m "feat: signature de marque sur l'accueil, la connexion et le mot de passe oublié"
```

---

### Task 10: Vérification complète — écrans de référence, puis balayage des 23 écrans

**Files:** aucune (vérification uniquement — les corrections éventuelles trouvées ici sont à documenter et reviennent aux tâches concernées, pas à cette tâche)

**Interfaces:**
- Consumes: l'ensemble des tâches 1 à 9

- [ ] **Step 1: Suite automatisée complète**

Run: `npm run verifier`

Expected: `422 tests` (ou le nombre courant) verts — aucun test de logique n'est touché par ce chantier — puis `node outils/palettes.mjs --verifie` sort en 0, puis `tsc -b && tsc -p tsconfig.api.json && vite build` réussit sans erreur.

- [ ] **Step 2: Contrôle du lockfile**

Run: `npm ci && npm run build` (sur une copie propre ou après `git stash` des changements non liés)

Expected: réussite — aucune dépendance n'a été ajoutée ou modifiée par ce chantier, donc `package-lock.json` n'a pas bougé.

- [ ] **Step 3: Écrans de référence, au pilote (`npm run dev`)**

Parcourir, en 375 px et desktop, clair et sombre, aucune erreur console :

1. `/` (Accueil) — la signature, le bandeau de couleur, les boutons, la carte « Pourquoi une assiette ».
2. `/connexion` — la signature, les champs de formulaire (`Champ`), les boutons.
3. `/app` (Aujourd'hui, après connexion en mode démo) — la mosaïque, les tuiles de statistiques (dont une en `ton="vif"` si l'écran en affiche, pour voir le citron fluo), la barre d'onglets (`Nav.tsx`).
4. `/app/profil` — le nouveau réglage « Luminosité » (Task 3), sans trace du sélecteur de couleur retiré.
5. `Onboarding.tsx` — pas une route à part : créer un compte en mode démo depuis `/inscription`, l'application l'affiche automatiquement tant que `etat.profil.onboardingFait` est faux (`src/App.tsx:173`), avant tout accès à `/app`. Un écran qui exerce `ChoixListe` et `Bascule`.

**Points d'attention spécifiques**, hérités de l'historique du projet (voir `CLAUDE.md`, section Historique) :

- Le bouton « Créer mon compte » de l'accueil ne doit pas passer sous le pli entre 390 et 640 px (régression déjà rencontrée une fois avec une police différente).
- La barre d'onglets (`BarreOnglets` dans `Nav.tsx`) ne doit perdre aucune entrée en 390 px — Fredoka est plus large que Faustina, et un sixième onglet était déjà sorti de l'écran une fois par le passé pour une autre raison.
- Le rôle `accent` en texte (`text-accent`, utilisé par `Etiquette` et `TitreSection`) ressort volontairement sombre/olive (`#7c6d01` en clair) — ce n'est pas un défaut à corriger, c'est expliqué dans le commentaire de la Task 1 Step 5. Le citron vif attendu doit apparaître sur les tuiles `ton="vif"` et le bandeau, pas sur le texte.

- [ ] **Step 4: Décision — Yann valide les écrans de référence**

Montrer les captures ou l'application en direct à Yann. S'il demande un ajustement de teinte (`MARQUE.roles` dans `outils/palettes.mjs`, Task 1) ou de police (Task 5/6), le faire à ce stade et rejouer les Steps 1 et 3 avant de continuer — c'est le point de la stratégie « écrans de référence d'abord » choisie dans le spec : corriger ici coûte trois écrans, pas vingt-trois.

- [ ] **Step 5: Balayage des 20 écrans restants**

Pour chacune des routes suivantes (voir le tableau « Écrans actuels » du `CLAUDE.md` du dépôt pour la liste à jour), ouvrir en 375 px et desktop, un passage rapide clair **ou** sombre suffit ici — le clair/sombre complet a déjà été éprouvé sur les écrans de référence :

`/app/ajouter`, `/app/sante`, `/app/poids`, `/app/envies`, `/app/cuisine`, `/app/garde-manger`, `/app/cuisiner`, `/app/courses`, `/app/ticket`, `/app/prix`, `/app/mode-cuisine`, `/app/coach`, `/app/stats`, `/app/menus`, `/app/sport`, `/app/plan`, `/app/badges`, `/app/jeux`, `/confidentialite`.

Chercher spécifiquement : un libellé qui déborde de son conteneur (Fredoka est plus large que Faustina sur les titres), une icône ou un badge qui semble décoloré (signe d'une couleur codée en dur oubliée — improbable vu le Step de la Task « Architecture », mais c'est l'endroit où le vérifier), une erreur console.

**Ne pas re-designer ces écrans** : c'est une vérification, pas un chantier de composition. Un défaut trouvé ici se corrige dans le fichier concerné, avec son propre commit — pas dans cette tâche.

- [ ] **Step 6: Commit final si des ajustements ont été faits**

Si les Steps 4 ou 5 ont produit des corrections, elles ont déjà leur propre commit (par fichier touché). Sinon, ne rien committer à cette étape — une vérification qui ne change rien ne produit pas de commit.

---

### Task 11: Documentation — `CLAUDE.md` du dépôt et `REPRISE.md`

**Files:**
- Modify: `CLAUDE.md` (racine du dépôt Mamakilo, section « Jetons de couleur », section « Les polices », section « Historique du projet »)
- Create ou Modify: `REPRISE.md` (racine du dépôt Mamakilo)

**Interfaces:** aucune — documentation seulement.

Le `CLAUDE.md` du workspace (§2 bis, `C:\Users\YHN\Documents\Git\CLAUDE.md`) est une règle dure, pas une suggestion : *« `REPRISE.md` à jour dans le même commit »* pour toute séance qui a changé quelque chose, lu avant tout code à la reprise. Le `CLAUDE.md` du dépôt décrit encore, à ce stade, huit thèmes sélectionnables et les polices Faustina/Figtree — les deux sont maintenant faux.

- [ ] **Step 1: Mettre à jour la section « Jetons de couleur — `src/index.css` et `src/palettes.css` »**

Remplacer le paragraphe qui commence par « Deux réglages indépendants qui se combinent : le **mode** (clair / sombre / système) est une classe `.dark` sur `<html>`, le **thème de couleur** est un attribut `data-theme`. Huit thèmes × deux modes. » et les paragraphes qui décrivent `outils/palettes.mjs` comme générateur de seize variantes, le thème « Marmite » par défaut et les sept autres thèmes sous `[data-theme=…]`, par une description du jeu de couleurs unique : un seul réglage (clair / sombre / système), `outils/palettes.mjs` qui génère deux variantes (`:root` et `.dark`) au lieu de seize, et les quatre rôles (`primaire` orange sanguine, `accent` citron vert, `reussite` menthe, `alerte` rose radis). Garder telles quelles les sous-sections qui ne changent pas : neutres, aplats, lavis, **les jetons de données qui ne suivent pas le thème** (`assiette-*`, `nutri-*`, `macro-*`, `bande-*`, réservés, non modifiés par ce chantier).

- [ ] **Step 2: Mettre à jour la section « Les polices — `outils/polices.mjs` et `public/polices/` »**

Remplacer les deux occurrences de « Faustina et Figtree » par « Fredoka et Inter », et la ligne `--font-display` (Faustina, d'office sur h1/h2/h3), `--font-sans` (Figtree) » par la même phrase avec Fredoka/Inter. Le raisonnement RGPD et hors-ligne ne change pas, seuls les noms de famille changent.

- [ ] **Step 3: Ajouter une entrée d'historique**

En tête de la section « Historique du projet », ajouter :

```markdown
### 4 août 2026 — Refonte de l'identité visuelle

Nouveau jeu de couleurs de marque (orange sanguine, citron vert, menthe, rose
radis), remplaçant les huit thèmes sélectionnables — un seul réglage reste :
clair / sombre / système. Typographie Fredoka (titres) et Inter (texte
courant), remplaçant Faustina/Figtree. **La marmite (`public/icone.svg`) et
le composant `Marque` restent strictement inchangés** — Yann a tranché après
avoir vu 24 pistes de logo alternatives : aucune ne valait l'original. Une
signature de marque s'ajoute à côté (le mot « mamakilo » avec un cœur sur le
i, composant `SignatureMarque`), sur l'accueil, la connexion et le mot de
passe oublié.

**D'où vient le nom, pour la première fois noté ici : c'est ainsi que le fils
de Yann appelle sa mère.** Ce n'est pas un jeu de mots marketing — la
première direction de logo (géométrique, abstraite) a été refusée pour cette
raison précise. Toute décision de ton ou de marque sur ce projet s'y réfère
désormais.

Cadrage complet dans
`docs/superpowers/specs/2026-08-04-refonte-identite-mamakilo-design.md`, plan
dans `docs/superpowers/plans/2026-08-04-refonte-identite-mamakilo.md`.

**Un défaut de contraste latent, découvert en écrivant le plan et non en
codant** : la maquette de la signature de marque prévoyait le mot en
`#24303C` fixe (la teinte du visage de la marmite) — illisible en mode
sombre, où `--ink` calculé vaut `#b1c1ca`. `SignatureMarque` utilise
`text-ink`, pas une couleur figée.
```

Adapter le contenu exact si les Steps 4 ou 5 de la Task 10 ont changé des teintes ou des détails par rapport à ce plan.

- [ ] **Step 4: Écrire `REPRISE.md`**

Si `REPRISE.md` n'existe pas encore à la racine du dépôt Mamakilo, le créer avec les quatre sections imposées par le `CLAUDE.md` du workspace (`# Reprise — Mamakilo`, `## Où on en est`, `## La prochaine action`, `## Décidé cette séance`, `## À ne pas refaire`). S'il existe déjà (probable, vu l'historique du projet), le remplacer entièrement — c'est un document volatile, pas cumulatif :

```markdown
# Reprise — Mamakilo

Dernière séance : 2026-08-04 · dernier commit : <sha du dernier commit de la Task 10 ou 11>

## Où on en est

La refonte de l'identité visuelle (palette orange sanguine/citron vert/menthe/
rose radis, typographie Fredoka/Inter, signature « mamakilo » à côté de la
marmite inchangée) est livrée sur la branche `refonte-design`, dans la
worktree `C:\Users\YHN\Documents\Git\.worktrees\mamakilo-refonte-design`.
`npm run verifier` passe. Les 23 écrans ont été balayés (Task 10).

## La prochaine action

Fusionner `refonte-design` dans `main` (ou ouvrir une pull request), puis
pousser — vérifier d'abord l'état du chantier de migration Supabase en cours
sur `synchro-fiable`, qui ne doit pas être écrasé par cette fusion.

## Décidé cette séance

- Les 8 thèmes de couleur disparaissent au profit d'un seul jeu de couleurs de
  marque ; la clé `localStorage` `equilibre:palette` des comptes existants
  devient inerte, sans être supprimée.
- La marmite (`public/icone.svg`, composant `Marque`) reste strictement
  inchangée — Yann l'a préférée à 24 pistes alternatives.
- La vidéo vitrine (30-60s, motion design stylisé, voix off française) est un
  chantier séparé, pas encore commencé, à traiter via le skill `hyperframes`.

## À ne pas refaire

- Ne pas figer la couleur de `SignatureMarque` en `#24303C` — illisible en
  mode sombre. Utiliser `text-ink`.
- Ne pas s'étonner que `--accent` en texte (`text-accent`) ressorte olive/
  sombre plutôt que citron vif : c'est `--accent-vif` qui porte le citron
  fluo, réservé aux aplats. Contrainte de contraste physique, pas un réglage
  à corriger.
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md REPRISE.md
git commit -m "docs: mettre à jour CLAUDE.md et REPRISE.md après la refonte de l'identité"
```
