# Identité Mamakilo — plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUISE — utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour dérouler ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** donner à Mamakilo une identité qui vient de son nom — une taquinerie affectueuse en famille — au lieu d'une landing SaaS sans visage.

**Architecture :** sept chantiers indépendants. Trois modules purs sortent dans `src/lib/` (`identite.ts`, `photos.ts`, `partage.ts`), trois composants dans `src/components/`, et deux scripts de contrôle dans `outils/`. Rien ne change dans l'état partagé sauf un champ de profil facultatif. La photo ne quitte pas l'appareil : elle vit en IndexedDB, jamais dans le document Supabase.

**Stack :** Vite 8, React 19, TypeScript 5.9, Tailwind 4, framer-motion, Supabase. Pas de dépendance nouvelle.

**Spec :** `docs/superpowers/specs/2026-07-30-identite-mamakilo-design.md` — à lire avant de commencer.

---

## Contraintes globales

Elles s'appliquent à **toutes** les tâches, sans être répétées.

- **Tout le code est en français** : variables, fonctions, composants, types, champs. `nomAffiche`, `enregistrerPhoto`, `MarmiteExpression`.
- **Les commentaires disent le pourquoi, jamais le quoi.** Ne pas paraphraser la ligne suivante.
- **`src/lib/` ne connaît pas React.** Aucun import de `react` dans un fichier de `lib/`, sauf `router.tsx` qui existe déjà.
- **Écrire dans l'état passe par `modifier()`** de `useSession()`. Ne jamais appeler `enregistrer()` depuis une page.
- **Un champ de `Profil` s'ajoute à deux endroits** : `interface Profil` dans `src/lib/types.ts` et `profilInitial()` dans `src/lib/store.ts`. `fusionner()` fait `{ ...base.profil, ...partiel.profil }` — la migration des documents anciens est donc automatique. **La règle des trois endroits du `CLAUDE.md` vaut pour les champs de premier niveau d'`EtatUtilisateur`, pas pour ceux du profil.**
- **Chiffres tabulaires** : toute valeur numérique affichée porte la classe `.tnum`.
- **Accessibilité** : `aria-label` sur les boutons-icônes, `aria-pressed` sur les bascules, un `<fieldset>` + `<legend>` pour un groupe de choix.
- **Jetons de couleur uniquement** : `primaire`, `accent`, `reussite`, `alerte`, `ink`, `ink-soft`, `ink-faint`, `ground`, `surface`, `sunken`, `line`, `line-fort`. Jamais de couleur en dur, sauf dans le logo.
- **Le logo ne suit pas le thème.** Ses couleurs restent écrites en dur.
- **`prefers-reduced-motion`** est couvert par le `<MotionConfig reducedMotion="user">` de `main.tsx`. Ne pas le contourner par une animation impérative.
- **Aucune dépendance ajoutée.** `npm audit` doit rester à zéro vulnérabilité.
- **TypeScript reste en 5.x.** Remonter en 7 casse le déploiement tant qu'il existe un dossier `/api`.

### La recette de vérification

**Ce projet n'a ni linter ni suite de tests.** Les contrôles automatisés sont le typecheck du build et les scripts d'`outils/`. La vérification à l'écran se fait au pilote Playwright, sur le **build de production en mode démo** — pas sur `vite dev`, qui ne reflète ni le découpage ni le service worker.

Recette complète, appelée **« la recette »** dans la suite :

```bash
# 1. Construire en mode démo (sans les vraies clés Supabase)
VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" npx vite build --outDir dist-demo

# 2. Servir
npx vite preview --outDir dist-demo --port 5233 --strictPort

# 3. Piloter : créer un compte (pseudo), accepter le consentement,
#    passer les 4 étapes d'onboarding, puis vérifier l'écran visé
#    en 390 px ET 1280 px, thèmes clair ET sombre.

# 4. Nettoyer — .gitignore ne couvre que dist, pas dist-demo
rm -rf dist-demo
```

**Deux pièges connus, à ne pas redécouvrir :**

- Un serveur Vite d'une session précédente peut tenir le port **et verrouiller `src/`**. Avant de conclure à un verrou Windows mystérieux : `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` puis filtrer sur le chemin du projet.
- La célébration du badge « Première assiette » pose un voile `z-[60]` plein écran qui bloque tous les clics suivants du pilote. Le test doit la fermer, sinon il échoue loin de sa cause.

**Contrôler dans le document, pas seulement à l'œil.** Une capture ne prouve pas qu'une donnée est enregistrée. Chaque tâche dit quoi lire dans `localStorage`, dans le DOM ou dans IndexedDB.

---

## Structure des fichiers

**Créés :**

| Fichier | Responsabilité |
|---|---|
| `src/lib/identite.ts` | Le nom sous lequel l'application s'adresse à quelqu'un. Pur, sans React. |
| `src/lib/photos.ts` | Redimensionnement et stockage IndexedDB des photos. Pur, sans React. |
| `src/lib/partage.ts` | Fabrication de l'image de partage et appel au partage natif. Pur, sans React. |
| `src/components/MarmiteExpression.tsx` | Les trois expressions de la marmite. |
| `src/components/PhotoFamille.tsx` | Choix, aperçu et retrait d'une photo. |
| `src/components/Parrainage.tsx` | Le lien iGraal et sa mention obligatoire. |
| `outils/marque.mjs` | Vérifie que `Marque` et `public/icone.svg` portent les mêmes tracés. |
| `outils/partage.mjs` | Vérifie qu'aucune donnée de santé n'entre dans l'image partagée. |

**Modifiés :**

| Fichier | Ce qui change |
|---|---|
| `src/lib/types.ts` | `Profil.petitNom` |
| `src/lib/store.ts` | `profilInitial()` — valeur par défaut du petit nom |
| `src/lib/rgpd.ts` | `telechargerExport` devient `async`, inclut les photos ; `toutSupprimer` vide IndexedDB |
| `src/pages/Aujourdhui.tsx` | Salutation par le petit nom, bandeau photo |
| `src/pages/Profil.tsx` | Réglage du petit nom, de la photo, lien de parrainage ; deux appels à `telechargerExport` deviennent `await` |
| `src/pages/Onboarding.tsx` | Le petit nom proposé à l'étape 1 |
| `src/pages/Accueil.tsx` | Logo 96 px, texte réécrit, pied de page avec le parrainage |
| `src/pages/Confidentialite.tsx` | Déclaration de la photo dans « Ce qui est collecté » |
| `src/lib/legal.ts` | Commentaire du régime d'éditeur corrigé |
| `src/components/ui.tsx` | Rien — `Marque` ne bouge pas |
| Divers écrans | Textes des états vides |
| `package.json` | Deux scripts : `marque`, `partage` |

---

## Tâche 1 — Le petit nom

C'est le cœur du chantier : l'origine du produit devient une fonctionnalité au lieu d'une anecdote.

**Fichiers :**
- Créer : `src/lib/identite.ts`
- Modifier : `src/lib/types.ts` (interface `Profil`), `src/lib/store.ts` (`profilInitial`), `src/pages/Aujourdhui.tsx:107`, `src/pages/Profil.tsx` (section « Mes mesures », vers L295), `src/pages/Onboarding.tsx` (étape 0, vers L81)

**Interfaces :**
- Consomme : `Profil` de `src/lib/types.ts`
- Produit : `nomAffiche(profil: Pick<Profil, 'prenom' | 'petitNom'>): string` — utilisé par les tâches 2 et 4

- [ ] **Étape 1 : écrire le contrôle qui échoue**

Lancer la recette, créer un compte au prénom `Test`, aller sur `/app`, et exécuter dans la console du pilote :

```js
() => {
  const doc = Object.keys(localStorage).find(k => k.startsWith('equilibre:donnees:'))
  const etat = JSON.parse(localStorage.getItem(doc))
  return {
    champExiste: 'petitNom' in etat.profil,
    salutation: document.querySelector('h1')?.textContent,
  }
}
```

Attendu **après** implémentation : `champExiste: true` et la salutation affiche le petit nom une fois renseigné.

- [ ] **Étape 2 : lancer et constater l'échec**

Attendu maintenant : `champExiste: false`. Le champ n'existe pas.

- [ ] **Étape 3 : ajouter le champ au type**

Dans `src/lib/types.ts`, à l'intérieur de `interface Profil`, juste après `prenom` :

```ts
  /**
   * Le petit nom qu'on se donne en famille. Facultatif : vide, l'application
   * retombe sur le prénom. C'est l'origine du nom du produit devenue une
   * fonctionnalité — un surnom affectueux, pas un pseudonyme d'identification.
   */
  petitNom: string
```

- [ ] **Étape 4 : la valeur par défaut**

Dans `src/lib/store.ts`, dans `profilInitial()`, juste après la ligne `prenom: ...` :

```ts
    petitNom: '',
```

Rien à ajouter dans `fusionner()` : il fait `{ ...base.profil, ...partiel.profil }`, donc un document ancien hérite du défaut.

- [ ] **Étape 5 : le module d'identité**

Créer `src/lib/identite.ts` :

```ts
import type { Profil } from './types'

/**
 * Le nom sous lequel l'application s'adresse à quelqu'un.
 *
 * Le petit nom passe devant le prénom, et c'est tout l'intérêt : « Bonsoir,
 * Mamakilo » est une marque d'affection, « Bonsoir, Élodie » est un logiciel
 * qui a lu une fiche. Vide, on retombe sur le prénom ; vide aussi, on ne dit
 * rien plutôt que d'inventer un « cher utilisateur ».
 */
export function nomAffiche(profil: Pick<Profil, 'prenom' | 'petitNom'>): string {
  return profil.petitNom.trim() || profil.prenom.trim()
}
```

- [ ] **Étape 6 : la salutation**

Dans `src/pages/Aujourdhui.tsx`, ajouter l'import :

```ts
import { nomAffiche } from '../lib/identite'
```

Puis remplacer la ligne 107 :

```tsx
{etat.profil.prenom && `, ${etat.profil.prenom}`}
```

par :

```tsx
{nomAffiche(etat.profil) && `, ${nomAffiche(etat.profil)}`}
```

- [ ] **Étape 7 : le réglage dans le profil**

Dans `src/pages/Profil.tsx`, section « Mes mesures » (vers L295), ajouter un `Champ` :

```tsx
<Champ
  label="Votre petit nom"
  aide="Celui qu'on vous donne à la maison. L'application s'en servira pour vous parler."
  value={etat.profil.petitNom}
  onChange={(e) => modifier((b) => { b.profil.petitNom = e.target.value })}
  maxLength={24}
/>
```

- [ ] **Étape 8 : la proposition à l'onboarding**

Dans `src/pages/Onboarding.tsx`, étape 0 (`{etape === 0 && (`, vers L81), sous le champ du prénom :

```tsx
<Champ
  label="Votre petit nom (facultatif)"
  aide="Celui qu'on vous donne à la maison. Vous pourrez le changer plus tard."
  value={petitNom}
  onChange={(e) => setPetitNom(e.target.value)}
  maxLength={24}
/>
```

Déclarer l'état local à côté des autres, et le poser dans `terminer()` comme les autres champs. **Ne pas rendre l'étape bloquante** : un champ facultatif n'a pas de validation.

- [ ] **Étape 9 : ne pas toucher au contexte du coach**

Contrôle négatif, à faire avant de commiter :

```bash
grep -n "petitNom" src/lib/coachIA.ts api/coach.ts
```

Attendu : **aucun résultat**. `construireContexte()` est écrit à la main, champ par champ ; ajouter un champ, c'est ajouter une donnée transmise à un tiers, ce qui se décide et se répercute dans l'écran d'accord et dans `DESTINATAIRES`. Le petit nom n'apporte rien au raisonnement du modèle : il n'y entre pas.

- [ ] **Étape 10 : relancer le contrôle**

Rejouer l'étape 1. Attendu : `champExiste: true`. Renseigner « Mamakilo » dans le profil, **recharger la page entièrement**, et vérifier que la salutation dit « Bonsoir, Mamakilo » — le rechargement prouve que `fusionner()` fait son travail.

- [ ] **Étape 11 : le typecheck**

```bash
npm run build
```

Attendu : sortie 0.

- [ ] **Étape 12 : commit**

```bash
git add src/lib/identite.ts src/lib/types.ts src/lib/store.ts src/pages/Aujourdhui.tsx src/pages/Profil.tsx src/pages/Onboarding.tsx
git commit -m "feat: le petit nom, celui qu'on se donne à la maison"
```

---

## Tâche 2 — Le ton des textes

Indépendante, sans risque, et c'est là que se gagne l'essentiel de la chaleur perçue.

**Fichiers :**
- Modifier : `src/pages/GardeManger.tsx`, `src/pages/Courses.tsx`, `src/pages/Cuisine.tsx`, `src/pages/Aujourdhui.tsx`, et tout écran portant un `<EtatVide>`

**Interfaces :**
- Consomme : `EtatVide({ emoji, titre, children, action? })` de `src/components/ui.tsx`
- Produit : rien

- [ ] **Étape 1 : relever l'existant**

```bash
grep -rn 'titre="' src/pages src/components | grep -v Confidentialite | grep -v Consentement
```

Noter la liste. **Les écrans juridiques sont exclus** : consentement, confidentialité, mentions légales. Un texte juridique doit rester plat.

- [ ] **Étape 2 : réécrire**

Correspondances attendues :

| Avant | Après |
|---|---|
| `Votre garde-manger est vide` | `Le frigo est vide. Ça arrive.` |
| `Rien de noté pour l'instant` | `La journée commence.` |
| `La liste est vide` | `Rien à acheter pour le moment.` |
| `Votre panier est vide` | `Le panier est vide.` |
| `Aucune liste en cours` | `Pas de liste en cours.` |
| `Rien ne colle avec ces filtres` | `Rien sous la main avec ces critères.` |

**Deux garde-fous, à respecter pour tout texte ajouté :**

1. Aucune formulation ne commente ce que la personne a mangé. « Journée légère », « vous avez dépassé », « attention » : interdits.
2. Les messages d'erreur ne prennent pas le ton. Une erreur dit quoi faire.

- [ ] **Étape 3 : vérifier à l'écran**

Lancer la recette. Ouvrir `/app`, `/app/garde-manger`, `/app/courses`, `/app/cuisine` sur un compte neuf — tous les états vides sont visibles d'emblée. Contrôler en clair **et** en sombre.

- [ ] **Étape 4 : le typecheck**

```bash
npm run build
```

- [ ] **Étape 5 : commit**

```bash
git add src/pages
git commit -m "feat: le ton des états vides, chaleureux sans commenter l'assiette"
```

---

## Tâche 3 — Le logo présent et l'accueil réécrit

**Fichiers :**
- Créer : `outils/marque.mjs`
- Modifier : `src/pages/Accueil.tsx:72` et le bloc de texte L83-L94, `package.json`

**Interfaces :**
- Consomme : `Marque({ taille })` de `src/components/ui.tsx`
- Produit : script `npm run marque`

- [ ] **Étape 1 : écrire le contrôle qui échoue**

Le `CLAUDE.md` impose que `Marque` et `public/icone.svg` portent la même image, mais **rien ne le vérifie**. Créer `outils/marque.mjs` :

```js
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

const tracés = (source) =>
  [...source.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, ' ').trim())

const composant = tracés(readFileSync('src/components/ui.tsx', 'utf8'))
const icone = tracés(readFileSync('public/icone.svg', 'utf8'))

const manquants = composant.filter((d) => !icone.includes(d))
const surnuméraires = icone.filter((d) => !composant.includes(d))

if (manquants.length || surnuméraires.length) {
  console.error('✗ Marque et public/icone.svg divergent.')
  manquants.forEach((d) => console.error(`  seulement dans le composant : ${d.slice(0, 60)}…`))
  surnuméraires.forEach((d) => console.error(`  seulement dans l'icône    : ${d.slice(0, 60)}…`))
  process.exit(1)
}

console.log(`✓ ${composant.length} tracés identiques entre Marque et l'icône installée.`)
```

- [ ] **Étape 2 : brancher le script et le lancer**

Dans `package.json`, ajouter à `scripts` :

```json
"marque": "node outils/marque.mjs",
```

```bash
npm run marque
```

Si le script signale une divergence, **c'est une vraie découverte** : corriger le composant ou l'icône avant d'aller plus loin, en gardant l'icône comme référence — c'est elle qui est installée chez les gens.

- [ ] **Étape 3 : agrandir le logo sur l'accueil**

Dans `src/pages/Accueil.tsx`, l'en-tête garde son logo à 36 px. Ajouter dans la colonne de gauche du héros, **avant** l'eyebrow (avant la ligne 83) :

```tsx
<Marque taille={96} />
```

- [ ] **Étape 4 : réécrire le texte du héros**

Remplacer le bloc L83-L94 :

```tsx
<p className="mb-4 text-sm font-bold tracking-[0.16em] text-accent uppercase">
  Bien manger, vivre mieux
</p>
<h1 className="mt-5 font-display text-[2.6rem] leading-[1.05] font-semibold text-ink sm:text-6xl">
  Mamakilo
</h1>
<p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
  Le petit nom qu’on se donne quand on s’aime et qu’on se charrie un peu. Ici on
  note ce qu’on mange, on cuisine ce qu’on a, et personne ne fait la leçon à
  personne.
</p>
```

**Ne pas toucher à l'assiette animée** de la colonne de droite : elle explique le produit en trois secondes.

- [ ] **Étape 5 : vérifier à l'écran**

Lancer la recette, ouvrir `/` en 390 px et 1280 px, clair et sombre. Contrôler que le logo à 96 px ne pousse pas le bouton « Créer mon compte » sous le pli en 390 px — c'est le défaut le plus probable ici.

- [ ] **Étape 6 : le typecheck et le contrôle de marque**

```bash
npm run build && npm run marque
```

- [ ] **Étape 7 : commit**

```bash
git add outils/marque.mjs package.json src/pages/Accueil.tsx
git commit -m "feat: le logo prend sa place, et l'accueil parle enfin de Mamakilo"
```

---

## Tâche 4 — Les trois expressions de la marmite

**Fichiers :**
- Créer : `src/components/MarmiteExpression.tsx`
- Modifier : `src/pages/Aujourdhui.tsx` (état vide), `src/components/Celebration.tsx`

**Interfaces :**
- Consomme : rien des tâches précédentes
- Produit : `MarmiteExpression({ humeur, taille })` et `type Humeur = 'neutre' | 'contente' | 'complice'`

- [ ] **Étape 1 : le composant**

Créer `src/components/MarmiteExpression.tsx`. Les tracés du corps sont ceux de `Marque` ; **seuls la bouche et les yeux changent**.

```tsx
export type Humeur = 'neutre' | 'contente' | 'complice'

/**
 * La marmite, avec trois humeurs.
 *
 * Règle structurante, à ne pas contourner pour rendre l'animation « plus
 * vivante » : **elle réagit à la présence, jamais à la performance.** Elle
 * s'illumine parce que la personne est revenue, parce qu'elle a cuisiné, parce
 * que ça fait trente jours — jamais en fonction d'un total calorique, d'un
 * Nutri-Score ou d'un poids. Un visage qui commente ce qu'on mange est un juge,
 * et ce produit refuse d'en être un.
 *
 * Distinct de `Marque` à dessein : `Marque` doit rester identique à
 * public/icone.svg, que ce composant n'a pas vocation à suivre.
 */
export function MarmiteExpression({ humeur = 'neutre', taille = 96 }: { humeur?: Humeur; taille?: number }) {
  const bouche = {
    neutre: 'M212 342 q44 44 88 0',
    contente: 'M206 336 q50 58 100 0',
    complice: 'M212 344 q44 30 88 -4',
  }[humeur]

  return (
    <svg width={taille} height={taille} viewBox="0 0 512 512" aria-hidden="true" className="shrink-0 rounded-xl">
      <rect width="512" height="512" rx="112" fill="#FDF6EE" />
      <path
        d="M186 232 C150 232 132 206 142 180 C120 168 124 140 148 134 C150 110 180 100 196 118 C216 104 240 118 238 140 C256 152 254 182 232 188 C232 218 210 232 186 232 Z"
        fill="#4C8A4C"
      />
      <circle cx="262" cy="186" r="46" fill="#E85C46" />
      <path d="M356 132 C376 148 380 186 366 236 L322 226 C328 176 338 144 356 132 Z" fill="#F58A32" />
      <g stroke="#F67A5E" strokeWidth="26" fill="none" strokeLinecap="round">
        <path d="M126 288 C92 288 92 340 126 340" />
        <path d="M386 288 C420 288 420 340 386 340" />
      </g>
      <path d="M118 246 h276 v104 c0 42 -34 76 -76 76 h-124 c-42 0 -76 -34 -76 -76 Z" fill="#F67A5E" />
      <g fill="none" stroke="#24303C" strokeWidth="18" strokeLinecap="round">
        <path d={humeur === 'complice' ? 'M188 306 q20 -14 38 2' : 'M196 306 q18 -20 36 0'} />
        <path d={bouche} />
      </g>
      <circle cx="298" cy="310" r="13" fill="#24303C" />
    </svg>
  )
}
```

- [ ] **Étape 2 : la placer dans l'état vide du jour**

Dans `src/pages/Aujourdhui.tsx`, l'état vide de la mosaïque affiche aujourd'hui un emoji. Le remplacer par `<MarmiteExpression humeur="neutre" taille={72} />`.

**Motif :** l'écran est vide parce que la journée commence, pas parce que la personne a mal fait. Humeur neutre, jamais déçue.

- [ ] **Étape 3 : la placer dans la célébration**

Dans `src/components/Celebration.tsx`, à l'intérieur du bloc `{badgeACelebrer && (`, ajouter `<MarmiteExpression humeur="complice" taille={96} />` au-dessus du texte du badge.

**Motif :** un badge récompense une constance, donc une présence. C'est exactement le cas où la marmite a le droit de se réjouir.

- [ ] **Étape 4 : vérifier à l'écran**

Lancer la recette. L'état vide est visible d'emblée sur `/app`. Pour la célébration, noter un premier aliment : le badge « Première assiette » se déclenche. **Penser à fermer le voile**, sinon les clics suivants du pilote sont bloqués.

Contrôler en **mouvement réduit** : lancer le pilote avec `reducedMotion: 'reduce'` et vérifier que la célébration s'affiche sans animation, pas qu'elle disparaît.

- [ ] **Étape 5 : le typecheck**

```bash
npm run build && npm run marque
```

`npm run marque` doit **toujours passer** : le nouveau composant n'a pas modifié `Marque`.

- [ ] **Étape 6 : commit**

```bash
git add src/components/MarmiteExpression.tsx src/pages/Aujourdhui.tsx src/components/Celebration.tsx
git commit -m "feat: la marmite a trois humeurs, et ne juge jamais l'assiette"
```

---

## Tâche 5 — La photo de famille

Le morceau technique. **La photo ne quitte pas l'appareil.**

**Fichiers :**
- Créer : `src/lib/photos.ts`, `src/components/PhotoFamille.tsx`
- Modifier : `src/lib/rgpd.ts` (`telechargerExport` devient `async`, `toutSupprimer` vide IndexedDB), `src/pages/Profil.tsx` (réglage + **deux appels à `telechargerExport` aux lignes 369 et 472 deviennent `await`**), `src/pages/Aujourdhui.tsx` (bandeau), `src/pages/Confidentialite.tsx` (déclaration)

**Interfaces :**
- Consomme : `EtatUtilisateur` de `store.ts`
- Produit :
  - `enregistrerPhoto(cle: ClePhoto, fichier: File): Promise<void>`
  - `lirePhoto(cle: ClePhoto): Promise<Blob | null>`
  - `supprimerPhoto(cle: ClePhoto): Promise<void>`
  - `viderPhotos(): Promise<void>`
  - `type ClePhoto = 'avatar' | 'famille'`

- [ ] **Étape 1 : écrire le contrôle qui échoue**

Dans la console du pilote, après avoir posé une photo :

```js
async () => {
  const base = await new Promise((ok, ko) => {
    const r = indexedDB.open('mamakilo-photos', 1)
    r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error)
  })
  const lot = base.transaction('photos', 'readonly').objectStore('photos')
  const tout = await new Promise((ok) => { const r = lot.getAllKeys(); r.onsuccess = () => ok(r.result) })
  const doc = Object.keys(localStorage).find(k => k.startsWith('equilibre:donnees:'))
  return {
    clesEnBase: tout,
    tailleDuDocument: localStorage.getItem(doc).length,
  }
}
```

Attendu **après** implémentation : `clesEnBase: ['famille']` et `tailleDuDocument` **inchangée** — c'est la preuve que la photo n'est pas entrée dans l'état.

- [ ] **Étape 2 : lancer et constater l'échec**

Attendu maintenant : l'ouverture d'IndexedDB échoue, la base n'existe pas.

- [ ] **Étape 3 : le module de photos**

Créer `src/lib/photos.ts` :

```ts
/**
 * Les photos de l'utilisateur, stockées sur l'appareil et nulle part ailleurs.
 *
 * Pourquoi IndexedDB et pas le document `EtatUtilisateur`, dans cet ordre :
 *
 * 1. Une photo de famille contient souvent un enfant. Ne pas l'envoyer est la
 *    seule position tenable pour une application qui promet déjà que les
 *    données de santé restent à l'utilisateur. Conséquence voulue : aucun
 *    destinataire à déclarer, aucun consentement nouveau à demander.
 * 2. `modifier()` fait un `structuredClone` de tout l'état à chaque écriture.
 *    Une photo en base64 dans ce document serait recopiée à chaque frappe.
 * 3. Le document reste petit, ce qui était un choix assumé du projet.
 *
 * Le prix, dit à l'utilisateur dans l'écran de réglage : la photo ne suit pas
 * d'un appareil à l'autre.
 */

export type ClePhoto = 'avatar' | 'famille'

const BASE = 'mamakilo-photos'
const LOT = 'photos'

/** Côté long visé après redimensionnement, par usage. */
const TAILLES: Record<ClePhoto, number> = { avatar: 256, famille: 1200 }

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resoudre, rejeter) => {
    const requete = indexedDB.open(BASE, 1)
    requete.onupgradeneeded = () => requete.result.createObjectStore(LOT)
    requete.onsuccess = () => resoudre(requete.result)
    requete.onerror = () => rejeter(requete.error)
  })
}

function transaction<T>(mode: IDBTransactionMode, action: (lot: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return ouvrir().then(
    (base) =>
      new Promise<T>((resoudre, rejeter) => {
        const requete = action(base.transaction(LOT, mode).objectStore(LOT))
        requete.onsuccess = () => resoudre(requete.result)
        requete.onerror = () => rejeter(requete.error)
      }),
  )
}

/**
 * Redimensionne avant de stocker. Une photo de téléphone fait plusieurs
 * mégaoctets ; la garder entière remplirait le quota du navigateur pour un
 * bandeau de 1 200 px de large.
 */
async function redimensionner(fichier: File, coteLong: number): Promise<Blob> {
  const image = await createImageBitmap(fichier)
  const facteur = Math.min(1, coteLong / Math.max(image.width, image.height))
  const largeur = Math.round(image.width * facteur)
  const hauteur = Math.round(image.height * facteur)

  const toile = document.createElement('canvas')
  toile.width = largeur
  toile.height = hauteur
  toile.getContext('2d')!.drawImage(image, 0, 0, largeur, hauteur)
  image.close()

  return new Promise((resoudre, rejeter) =>
    toile.toBlob(
      (blob) => (blob ? resoudre(blob) : rejeter(new Error('Le navigateur n’a pas pu encoder l’image.'))),
      'image/jpeg',
      0.82,
    ),
  )
}

export async function enregistrerPhoto(cle: ClePhoto, fichier: File): Promise<void> {
  const reduite = await redimensionner(fichier, TAILLES[cle])
  await transaction('readwrite', (lot) => lot.put(reduite, cle))
}

export async function lirePhoto(cle: ClePhoto): Promise<Blob | null> {
  const trouve = await transaction<Blob | undefined>('readonly', (lot) => lot.get(cle))
  return trouve ?? null
}

export async function supprimerPhoto(cle: ClePhoto): Promise<void> {
  await transaction('readwrite', (lot) => lot.delete(cle))
}

/** Appelé à la suppression du compte. Une donnée oubliée à l'effacement est un
 *  manquement à l'article 17, même si elle n'est jamais partie de l'appareil. */
export async function viderPhotos(): Promise<void> {
  await transaction('readwrite', (lot) => lot.clear())
}
```

- [ ] **Étape 4 : le composant de réglage**

Créer `src/components/PhotoFamille.tsx` :

```tsx
import { useEffect, useState } from 'react'
import { Bouton } from './ui'
import { enregistrerPhoto, lirePhoto, supprimerPhoto, type ClePhoto } from '../lib/photos'

/**
 * Choix, aperçu et retrait d'une photo.
 *
 * L'URL d'objet est révoquée au démontage ET à chaque changement de photo :
 * sans ça la mémoire fuit à chaque passage sur l'écran, et le symptôme
 * n'apparaît qu'après une longue session.
 */
export function PhotoFamille({ cle, label }: { cle: ClePhoto; label: string }) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)

  useEffect(() => {
    void lirePhoto(cle).then(setBlob)
  }, [cle])

  useEffect(() => {
    if (!blob) {
      setApercu(null)
      return
    }
    const url = URL.createObjectURL(blob)
    setApercu(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  async function choisir(fichier: File | undefined) {
    if (!fichier) return
    await enregistrerPhoto(cle, fichier)
    setBlob(await lirePhoto(cle))
  }

  async function retirer() {
    await supprimerPhoto(cle)
    setBlob(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink">{label}</p>

      {apercu && (
        <img src={apercu} alt="" className="h-32 w-full rounded-tile object-cover" />
      )}

      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-full bg-sunken px-4 py-2 text-sm font-semibold text-ink">
          {apercu ? 'Changer' : 'Choisir une photo'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void choisir(e.target.files?.[0])}
          />
        </label>
        {apercu && (
          <Bouton ton="fantome" onClick={() => void retirer()}>
            Retirer
          </Bouton>
        )}
      </div>

      <p className="text-sm text-ink-soft">
        Cette photo reste sur cet appareil. Elle ne part sur aucun serveur — et elle ne vous
        suivra donc pas sur votre téléphone.
      </p>
    </div>
  )
}
```

Le poser dans `src/pages/Profil.tsx`, section « Réglages » (vers L309), avec `cle="famille"`.

- [ ] **Étape 5 : le bandeau sur l'écran du jour**

Dans `src/pages/Aujourdhui.tsx`, afficher la photo `famille` en fond du bandeau haut, **sous un voile** :

```tsx
<div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/65" aria-hidden="true" />
```

**Motif :** le bandeau porte du texte blanc. Une photo claire dessous le rend illisible, et on ne sait pas d'avance ce que l'utilisateur choisira. Le voile n'est pas décoratif, il garantit le contraste quelle que soit l'image.

- [ ] **Étape 6 : l'export doit inclure les photos**

Le droit d'accès porte sur l'intégralité (art. 15 et 20) : une photo absente de l'export est une donnée retenue.

Dans `src/lib/rgpd.ts`, ajouter l'import et une conversion, puis rendre la fonction asynchrone :

```ts
import { lirePhoto, type ClePhoto } from './photos'

/** Les photos vivent hors du document : l'export doit aller les chercher. */
async function photosExportables(): Promise<Record<string, string>> {
  const sortie: Record<string, string> = {}
  for (const cle of ['avatar', 'famille'] as ClePhoto[]) {
    const blob = await lirePhoto(cle)
    if (!blob) continue
    sortie[cle] = await new Promise<string>((resoudre) => {
      const lecteur = new FileReader()
      lecteur.onload = () => resoudre(String(lecteur.result))
      lecteur.readAsDataURL(blob)
    })
  }
  return sortie
}

export async function telechargerExport(etat: EtatUtilisateur): Promise<void> {
  const contenu = { ...documentExport(etat), photos: await photosExportables() }
  // …le reste du corps existant, en sérialisant `contenu` au lieu de documentExport(etat)
}
```

**Mettre à jour les deux appelants** dans `src/pages/Profil.tsx`, lignes 369 et 472 :

```tsx
onClick={() => void telechargerExport(etat)}
```

`void` et non `await` : le gestionnaire de clic n'a pas besoin d'attendre, et le rendre `async` sans traiter le rejet cacherait une erreur.

- [ ] **Étape 7 : la suppression doit vider IndexedDB**

Dans `src/lib/rgpd.ts`, `toutSupprimer` appelle `viderPhotos()` **avant** de supprimer le compte — la suppression du compte est la seule étape qui puisse échouer pour une raison de configuration, donc elle reste en dernier.

- [ ] **Étape 8 : déclarer la photo dans la politique**

Dans `src/pages/Confidentialite.tsx`, section « Ce qui est collecté », ajouter une ligne : une photo facultative, stockée **sur l'appareil uniquement**, jamais transmise, effacée avec le compte.

**Ne pas incrémenter `VERSION_CONFIDENTIALITE`** : aucune donnée nouvelle ne part vers un tiers, donc l'accord déjà donné couvre toujours ce à quoi la personne a dit oui. Redemander son consentement à tout le monde pour une donnée qui ne sort pas serait du bruit.

- [ ] **Étape 9 : relancer le contrôle**

Rejouer l'étape 1. Attendu : `clesEnBase: ['famille']`, `tailleDuDocument` inchangée.

Puis vérifier les deux droits, **dans le document et pas à l'œil** :
- L'export téléchargé contient la photo.
- Après suppression du compte, `clesEnBase` est vide.

- [ ] **Étape 10 : le typecheck**

```bash
npm run build
```

- [ ] **Étape 11 : commit**

```bash
git add src/lib/photos.ts src/components/PhotoFamille.tsx src/lib/rgpd.ts src/pages/Profil.tsx src/pages/Aujourdhui.tsx src/pages/Confidentialite.tsx
git commit -m "feat: la photo de famille, qui ne quitte pas l'appareil"
```

---

## Tâche 6 — Le lien iGraal

**Fichiers :**
- Créer : `src/components/Parrainage.tsx`
- Modifier : `src/lib/legal.ts` (commentaire du régime), `src/pages/Accueil.tsx` (pied de page), `src/pages/Profil.tsx` (section « Raccourcis », vers L150)

**Interfaces :**
- Produit : `<Parrainage />`

- [ ] **Étape 1 : le composant**

Créer `src/components/Parrainage.tsx` :

```tsx
const LIEN =
  'https://fr.igraal.com/parrainage?parrain=AG_55df2aa7a0e1b&utm_medium=raf&utm_source=refer_friend'

/**
 * Le lien de parrainage iGraal.
 *
 * La mention n'est pas décorative : une communication commerciale doit pouvoir
 * être reconnue comme telle au moment où on la voit, pas dans une page de
 * conditions que personne n'ouvre.
 *
 * **Le lien est le même pour tout le monde.** Il n'est jamais personnalisé
 * selon le profil ni le journal alimentaire : ce serait du ciblage publicitaire
 * sur données de santé, et la promesse de l'écran de consentement — « ni
 * publicité, ni revente, ni profilage » — tomberait pour de bon.
 */
export function Parrainage() {
  return (
    <aside className="rounded-card border border-line bg-sunken p-4">
      <p className="text-sm font-semibold text-ink">
        <span className="text-accent">Lien de parrainage</span> — iGraal
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Si vous vous inscrivez par ce lien, l’éditeur du site reçoit une contrepartie. Ça ne change
        rien pour vous.
      </p>
      <a
        href={LIEN}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block font-semibold text-primaire underline underline-offset-4"
      >
        Découvrir iGraal
      </a>
    </aside>
  )
}
```

- [ ] **Étape 2 : le poser à deux endroits**

Pied de l'accueil dans `src/pages/Accueil.tsx`, et section « Raccourcis » de `src/pages/Profil.tsx` (vers L150).

- [ ] **Étape 3 : corriger le commentaire de `legal.ts`**

Le commentaire actuel affirme que le drapeau tomberait « si l'application devenait payante ou publicitaire ». Le site porte désormais un lien rémunéré : **ce commentaire décrit une règle que le site ne suit plus.** Un commentaire qui ment est pire que pas de commentaire, et celui-là garde une décision juridique.

Le remplacer par :

```ts
/**
 * Le site reste en régime « éditeur non professionnel » (LCEN art. 6-III-2),
 * qui dispense de publier nom et adresse. Le critère est l'exercice d'une
 * **activité professionnelle** ; un lien de parrainage isolé et signalé comme
 * tel n'en constitue pas une.
 *
 * Le drapeau tomberait si Mamakilo devenait payant, portait de la publicité
 * vendue à des tiers, ou si les revenus d'affiliation devenaient réguliers et
 * recherchés pour eux-mêmes. Il faudrait alors passer à `false` et remplir
 * `nom`, `statut` et `adresse`, qui deviendraient publics.
 */
```

`EDITEUR_NON_PROFESSIONNEL` **reste à `true`**.

- [ ] **Étape 4 : vérifier à l'écran**

Lancer la recette. Contrôler que la mention « Lien de parrainage » est visible **sans défilement supplémentaire** par rapport au lien lui-même, en 390 px. Une mention qu'il faut aller chercher ne remplit pas son office.

- [ ] **Étape 5 : le typecheck**

```bash
npm run build
```

- [ ] **Étape 6 : commit**

```bash
git add src/components/Parrainage.tsx src/lib/legal.ts src/pages/Accueil.tsx src/pages/Profil.tsx
git commit -m "feat: le lien de parrainage iGraal, signalé comme tel"
```

---

## Tâche 7 — Le partage

**À couper en premier** si le chantier doit être raccourci.

**Fichiers :**
- Créer : `src/lib/partage.ts`, `outils/partage.mjs`
- Modifier : `src/pages/Cuisine.tsx` (fiche d'une recette), `package.json`

**Interfaces :**
- Produit : `partagerCarte(carte: Carte): Promise<'partage' | 'telecharge'>` avec `type Carte = { titre: string; sousTitre: string }`

- [ ] **Étape 1 : écrire le contrôle qui échoue**

L'invariant qui compte : **aucune donnée de santé dans l'image partagée.** Créer `outils/partage.mjs` :

```js
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
```

Ajouter à `package.json` : `"partage": "node outils/partage.mjs",`

- [ ] **Étape 2 : lancer et constater l'échec**

```bash
npm run partage
```

Attendu : échec, le fichier `src/lib/partage.ts` n'existe pas.

- [ ] **Étape 3 : le module de partage**

Créer `src/lib/partage.ts`. Il dessine une carte sur un `canvas` — titre, sous-titre, fond aux couleurs de la marque — et appelle le partage natif.

```ts
export type Carte = { titre: string; sousTitre: string }

/**
 * Fabrique l'image et la propose au partage natif.
 *
 * Ne reçoit qu'un titre et un sous-titre, jamais l'état : c'est ce qui garantit
 * qu'aucun chiffre de santé ne peut entrer dans l'image. `outils/partage.mjs`
 * vérifie que ce fichier n'importe rien qui en porte.
 *
 * Là où le partage natif manque — la plupart des navigateurs de bureau —, on
 * télécharge l'image. Ce n'est pas une panne, donc aucun message d'erreur.
 */
export async function partagerCarte(carte: Carte): Promise<'partage' | 'telecharge'> {
  const blob = await dessiner(carte)
  const fichier = new File([blob], 'mamakilo.png', { type: 'image/png' })

  if (navigator.canShare?.({ files: [fichier] })) {
    await navigator.share({ files: [fichier], title: carte.titre })
    return 'partage'
  }

  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = 'mamakilo.png'
  lien.click()
  URL.revokeObjectURL(url)
  return 'telecharge'
}
```

`dessiner()` reste dans le même fichier, privé :

```ts
const LARGEUR = 1080
const HAUTEUR = 1080

function dessiner(carte: Carte): Promise<Blob> {
  const toile = document.createElement('canvas')
  toile.width = LARGEUR
  toile.height = HAUTEUR
  const ctx = toile.getContext('2d')!

  // Les couleurs sont écrites en dur : c'est une image de marque, elle ne suit
  // pas le thème de celui qui la fabrique. Une carte partagée en thème Océan et
  // une autre en thème Framboise ne se ressembleraient plus.
  ctx.fillStyle = '#FDF6EE'
  ctx.fillRect(0, 0, LARGEUR, HAUTEUR)

  ctx.fillStyle = '#F67A5E'
  ctx.fillRect(0, HAUTEUR - 160, LARGEUR, 160)

  ctx.fillStyle = '#232D3A'
  ctx.font = '600 84px Faustina, Georgia, serif'
  ctx.textAlign = 'center'
  enveloppe(ctx, carte.titre, LARGEUR / 2, 460, LARGEUR - 160, 100)

  ctx.fillStyle = '#5C6F7A'
  ctx.font = '400 44px Figtree, system-ui, sans-serif'
  ctx.fillText(carte.sousTitre, LARGEUR / 2, 620)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '600 52px Faustina, Georgia, serif'
  ctx.fillText('Mamakilo', LARGEUR / 2, HAUTEUR - 62)

  return new Promise((resoudre, rejeter) =>
    toile.toBlob((b) => (b ? resoudre(b) : rejeter(new Error('Encodage impossible.'))), 'image/png'),
  )
}

/** Un titre de recette dépasse souvent la largeur : il se coupe aux mots. */
function enveloppe(
  ctx: CanvasRenderingContext2D,
  texte: string,
  x: number,
  y: number,
  largeurMax: number,
  interligne: number,
): void {
  const lignes: string[] = []
  let ligne = ''
  for (const mot of texte.split(' ')) {
    const essai = ligne ? `${ligne} ${mot}` : mot
    if (ctx.measureText(essai).width > largeurMax && ligne) {
      lignes.push(ligne)
      ligne = mot
    } else {
      ligne = essai
    }
  }
  lignes.push(ligne)
  lignes.forEach((l, i) => ctx.fillText(l, x, y + i * interligne))
}
```

**Les polices peuvent ne pas être chargées** au moment du dessin ; les replis (`Georgia`, `system-ui`) sont là pour ça, et l'image reste correcte.

- [ ] **Étape 4 : le bouton sur la fiche d'une recette**

Dans `src/pages/Cuisine.tsx`, fiche détaillée, un bouton « Partager » qui appelle :

```ts
partagerCarte({ titre: recette.titre, sousTitre: 'Cuisiné avec Mamakilo' })
```

**Ne jamais passer les calories ni la bande de charge.**

- [ ] **Étape 5 : relancer le contrôle**

```bash
npm run partage
```

Attendu : succès.

- [ ] **Étape 6 : vérifier à l'écran**

Lancer la recette. Sur le bureau, `navigator.canShare` avec fichiers est absent : le repli doit **télécharger sans afficher d'erreur**. Ouvrir l'image téléchargée et vérifier de l'œil qu'elle ne porte aucun chiffre.

- [ ] **Étape 7 : le typecheck et tous les contrôles**

```bash
npm run build && npm run marque && npm run partage
```

- [ ] **Étape 8 : commit**

```bash
git add src/lib/partage.ts outils/partage.mjs package.json src/pages/Cuisine.tsx
git commit -m "feat: partager un plat, sans jamais partager un chiffre de santé"
```

---

## Finition

- [ ] **Ajouter un script `verifier`**

Le projet n'en a pas, contrairement à Cérémonia et GénieLab. Dans `package.json` :

```json
"verifier": "npm run marque && npm run partage && npm run build",
```

- [ ] **Mettre à jour le `CLAUDE.md` du dépôt**

Le fichier impose de le tenir à jour après chaque évolution importante. Ajouter une entrée d'historique au 30/07/2026 et documenter, dans les sections existantes : le champ `petitNom`, le module `photos.ts` et sa règle « la photo ne quitte pas l'appareil », la règle « la marmite réagit à la présence, jamais à la performance », les deux nouveaux scripts d'`outils/`, et le fait que `telechargerExport` est désormais asynchrone.

- [ ] **Vérification finale complète**

Lancer la recette une dernière fois et parcourir : accueil → inscription → consentement → onboarding avec petit nom → aujourd'hui → photo posée → cuisine → partage → profil → export → suppression. En 390 px **et** 1280 px, clair **et** sombre, **aucune erreur console**.

- [ ] **Supprimer `dist-demo`**

`.gitignore` ne couvre que `dist`.

- [ ] **Commit et push**

Vérifier que le déploiement Vercel a bien été créé — un push ne garantit pas un déploiement.
