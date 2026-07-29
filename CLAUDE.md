# CLAUDE.md — Mémoire projet « Équilibre »

Ce fichier est la mémoire permanente du projet. Le lire **avant** toute
modification. Le mettre à jour **après** chaque évolution importante
(section « Historique » en bas).

---

## Ce qu'est le projet

**Équilibre** — application web installable (PWA) de suivi diététique et coach
nutrition. Une seule base de code : le site *est* l'application, installable
sur iPhone et Android depuis le navigateur, sans App Store.

Le produit tient sur un **journal alimentaire réel** : l'utilisateur note ce
qu'il mange (recherche, code-barres, photo, saisie), et tout le reste —
mosaïque, analyses, top/flop, recommandations — en découle. Le mode « plan
prescrit » d'origine (cocher les composants d'une ordonnance) subsiste en
parallèle sur `/app/plan`, pour les personnes suivies par une diététicienne.

Dépôt : `EDL-Yhnguyen/di-t-ticien` (public)
Production : https://di-t-ticien.vercel.app
Dossier local : `C:\Users\YHN\Documents\Git\diététicien`

**Cible : le grand public.** Le dossier d'Élodie (71 kg → 61 kg, ordonnance de
Julie Bertolotto) a servi de cas d'école pour construire le socle ; il reste
comme jeu de données d'exemple et comme mode « plan prescrit », mais il ne
définit pas le produit.

> **Avertissement produit, à ne jamais retirer :** Équilibre n'est pas un
> dispositif médical. Les plans générés sont des repères calculés
> (Mifflin-St Jeor, déficit 20 %, plancher 1 200 kcal), pas une prescription.

---

## Architecture

### Stack

| Couche | Choix | Version |
|---|---|---|
| Build | Vite | ^8.1.5 |
| UI | React + React DOM | ^19.2.8 |
| Langage | TypeScript | ^7.0.2 |
| Styles | Tailwind CSS (plugin Vite) | ^4.3.3 |
| Animation | framer-motion | ^12.42.2 |
| Icônes | lucide-react | ^1.27.0 |
| Backend | @supabase/supabase-js | ^2.110.9 |
| Codes-barres | zxing-wasm (repli iOS) | ^3.1.2 |
| Vision (serveur) | @anthropic-ai/sdk | ^0.115.0 |
| Hébergement | Vercel | — |

**`@anthropic-ai/sdk` ne doit jamais être importé depuis `src/`.** Il n'existe
que pour `api/analyser-assiette.ts`. Un contrôle rapide après build :
`grep -c anthropic dist/assets/index-*.js` doit renvoyer 0.

**Pas de framework serveur.** L'application est entièrement cliente ; Supabase
fournit l'authentification et la base. Tout code ayant besoin d'un secret
(clé d'API IA, Stripe) doit vivre dans une **fonction serverless Vercel**
sous `/api`, jamais dans `src/`.

### Décisions structurantes (ne pas remettre en cause sans discussion)

- **Routeur écrit à la main** (`src/lib/router.tsx`, ~70 lignes). Les
  bibliothèques du marché apportaient ici un framework de chargement de
  données inutilisé et une file d'avis de sécurité à suivre, pour trois
  fonctions. Les routes sont un `switch` exact dans `App.tsx` — **pas de
  segments dynamiques** ; une route `/app/x/:id` demande de modifier
  `ecranPour()`.
- **Service worker écrit à la main** (`public/sw.js`, ~80 lignes). Évite une
  centaine de dépendances transitives.
- **`npm audit` doit rester à zéro vulnérabilité.** C'était le critère de
  choix des dépendances.
- **Un seul document d'état par utilisateur** (voir « Supabase » ci-dessous).
- **Repli automatique en mode démo** quand les clés `.env` sont absentes :
  comptes et données restent dans le navigateur. Les deux modes partagent
  exactement le même code applicatif.

### Structure des fichiers

```
src/
  main.tsx              point d'entrée, monte <App/> dans le FournisseurRoutage
  App.tsx               garde d'accès + ecranPour(chemin) : le switch de routes
  index.css             thème Tailwind 4 : tous les jetons de couleur
  components/
    Nav.tsx             BarreOnglets (mobile), RailLateral (desktop), Cadre
    ui.tsx              vocabulaire visuel commun (voir plus bas)
    Assiette.tsx        graphique de l'assiette + légende
    CourbePoids.tsx     courbe de pesées
    Celebration.tsx     confettis de déblocage de badge
  context/
    AppContext.tsx      LE point d'accès à l'état — useApp() / useSession()
  lib/
    router.tsx          FournisseurRoutage, useRoutage, Lien
    supabase.ts         client Supabase ou null ; exporte `modeDemo`
    auth.ts             inscription / connexion / session (Supabase + démo)
    store.ts            EtatUtilisateur, charger(), enregistrer(), fusionner()
    types.ts            types métier partagés
    plan.ts             plan de référence, teintes, parts d'assiette
    nutrition.ts        Mifflin-St Jeor, dépense, objectif, trajectoire, IMC
    badges.ts           BADGES[] déclaratif + badgesADebloquer()
    recettes/           catalogue de recettes (voir « Conventions »)
    utils.ts            helpers (jourISO, classes, …)
    ── journal alimentaire ──
    journal.ts          apports, totaux, bilan par repas, top/flop, cibles
    nutriscore.ts       barème 2023, indice Équilibre, bandes vert/bleu/orange
    aliments.ts         base d'aliments courants embarquée + recherche locale
    openfoodfacts.ts    recherche et code-barres (API publique, sans clé)
    decodeur.ts         BarcodeDetector, avec repli WebAssembly pour iOS
    photo.ts            préparation de l'image + appel de /api
    coach.ts            analyses, recommandations, alternatives (règles)
    appleSante.ts       lecture par tranches de l'export.xml d'Apple Santé
  components/
    Mosaique.tsx        treemap « squarified » : aire = kcal, couleur = Nutri
    nutrition.tsx       PastilleNutri, JaugeEnergie, BarreMacro, bandes
    Scanner.tsx         caméra + boucle de décodage des codes-barres
  pages/                un fichier par écran, nommé comme la route
public/
  sw.js                 service worker (cache)
  manifest.webmanifest  manifeste PWA
  icone-*.png           icônes d'installation
supabase/
  schema.sql            à exécuter une fois dans le SQL Editor
api/
  analyser-assiette.ts  fonction Vercel Edge : photo → aliments estimés
```

### Écrans actuels

| Route | Fichier | Rôle |
|---|---|---|
| `/` | `Accueil.tsx` | page publique |
| `/connexion`, `/inscription` | `Connexion.tsx` | authentification |
| `/app` | `Aujourdhui.tsx` | mosaïque du jour, analyses, recommandation |
| `/app/ajouter` | `Ajouter.tsx` | recherche, code-barres, photo, saisie |
| `/app/sante` | `Sante.tsx` | import du fichier Apple Santé |
| `/app/poids` | `Poids.tsx` | pesées, tendance, date d'arrivée estimée |
| `/app/envies` | `Envies.tsx` | anti-grignotage, minuteur, journal |
| `/app/cuisine` | `Cuisine.tsx` | recettes + liste de courses |
| `/app/plan` | `PagePlan.tsx` | le plan alimentaire détaillé |
| `/app/badges` | `Badges.tsx` | badges débloqués |
| `/app/jeux` | `Jeux.tsx` | mémo, quiz, respiration |
| `/app/profil` | `Profil.tsx` | mesures, réglages, thème |

Deux écrans **bloquants** passent avant tout le reste dans `App()` :
`motDePasseAChanger` → `NouveauMotDePasse.tsx`, puis `!onboardingFait` →
`Onboarding.tsx`.

---

## Règles de développement

### Conventions de code

- **Tout le code est en français** : noms de variables, de fonctions, de
  composants, de types, de champs. `modifier`, `etat`, `profil`, `pesees`,
  `basculerComposant`. C'est délibéré et cohérent — s'y tenir.
- **Commentaires : le pourquoi, jamais le quoi.** Les commentaires existants
  expliquent des décisions (« on note les deux quantités plutôt que d'inventer
  une addition entre "1 CàS" et "½" »). Ne pas ajouter de commentaire qui
  paraphrase la ligne suivante.
- **Chiffres tabulaires obligatoires** : toute valeur numérique affichée porte
  la classe `.tnum`.
- **Accessibilité** : `aria-label` sur les boutons-icônes, `aria-pressed` sur
  les bascules, `role="tab"` + `aria-selected` sur les onglets.
- **Attention au `prefers-reduced-motion`** : le bloc d'`index.css:225-234`
  neutralise les animations **CSS**, pas celles de framer-motion. `useReducedMotion`
  n'est appelé que dans `Assiette.tsx` et `Celebration.tsx` ; `ui.tsx`, `Nav.tsx`,
  `Accueil.tsx`, `Onboarding.tsx` et `Envies.tsx` animent sans le respecter.
  Le correctif global est un `<MotionConfig reducedMotion="user">` dans `main.tsx`.

### Écrire dans l'état — un seul chemin

```ts
const { etat, modifier } = useSession()
modifier((brouillon) => { brouillon.profil.herbalifeActif = true })
```

`modifier` fait un `structuredClone`, applique la recette mutative, évalue les
badges, puis planifie `enregistrer()` avec un debounce de 400 ms (vidé sur
`pagehide`). **Ne jamais appeler `enregistrer()` directement depuis une page.**

### Ajouter un champ persistant — 3 endroits, sinon il est perdu

1. `interface EtatUtilisateur` dans `src/lib/store.ts`
2. `etatInitial(u)` — valeur par défaut
3. **`fusionner(u, partiel)`** — `champ: partiel.champ ?? []`. C'est la
   migration ascendante des documents créés avant l'ajout. **Oublier cette
   ligne fait perdre la donnée au rechargement.**

Aucune migration SQL n'est nécessaire : tout est dans une colonne `jsonb`.

### Ajouter un écran

1. `import { X } from './pages/X'` en tête d'`App.tsx`
2. `case '/app/x': return <X />` dans `ecranPour()`
3. Entrée dans `ONGLETS` de `Nav.tsx` si l'écran mérite un onglet, sinon un
   lien depuis « Raccourcis » dans `Profil.tsx`

### Vocabulaire visuel — `src/components/ui.tsx`

Réutiliser ces composants plutôt que de restyler du JSX brut :

```ts
Bouton({ ton?: 'primaire'|'accent'|'doux'|'fantome'|'alerte', pleineLargeur? })
Carte(props: HTMLAttributes<HTMLDivElement>)
TitreSection({ eyebrow?, children, action? })
Etiquette({ ton?: 'iris'|'apricot'|'basil'|'berry'|'neutre' })
Champ({ label, aide?, suffixe?, ...inputProps })
ChoixListe<T extends string>({ label, valeur, options, onChange })
Bascule({ label, aide?, actif, onChange })
Feuille({ ouvert, titre, onFermer, children })   // bottom-sheet, Échap + lock scroll
EtatVide({ emoji, titre, children, action? })
Chargement({ libelle? })
```

Utilitaire de classes : `classes(...)` dans `src/lib/utils.ts`.

### Jetons de couleur — `src/index.css`

Mode sombre = classe `.dark` sur `<html>`. Chaque jeton est redéfini dans
`:root`, `.dark` **et** `@theme inline` — les trois, sinon la couleur casse
dans un des deux thèmes.

- Neutres : `ground`, `surface`, `sunken`, `ink`, `ink-soft`, `ink-faint`, `line`
- Teintes + lavis : `iris`/`iris-wash` (primaire), `apricot`/`apricot-wash`
  (accent, calories), `basil`/`basil-wash` (réussite), `berry`/`berry-wash` (alerte)
- **Réservés, ne pas emprunter** : `assiette-legume`, `assiette-feculent`,
  `assiette-proteine`. Palette catégorielle validée en vision daltonienne
  (ΔE ≥ 8 en protanopie) — les trois parts se touchent, donc chaque paire doit
  rester distinguable. Le réflexe naturel vert + orange voisins tombait à
  ΔE 5,1 en protanopie. **Les modifier demande de revérifier au script.**
- Réservés au bandeau (texte blanc dessus) : `bandeau-haut`, `bandeau-bas`
- Rayons : `rounded-card` (1.5rem), `rounded-tile` (1rem)
- Polices : `--font-display` (Faustina, d'office sur h1/h2/h3), `--font-sans` (Figtree)

---

## Le journal alimentaire

### Le modèle, en trois objets

`Aliment` porte des `ValeursPour100` (kcal, protéines, glucides, sucres,
lipides, saturés, fibres, sel) — l'unité de tous les étiquetages européens et
ce que renvoie Open Food Facts. `EntreeJournal` associe un aliment, une
quantité en grammes, une date et un `Moment`. Tout le reste se dérive :
`src/lib/journal.ts` ne stocke rien, il calcule.

**`Moment` compte désormais `collation`.** Toute table `Record<Moment, …>`
doit avoir ses quatre clés, sinon le typecheck échoue — c'est voulu.

### Nutri-Score : d'où vient la note

| Source | Note | Marquage |
|---|---|---|
| Open Food Facts | déclarée par le fabricant, **fait foi** | aucune |
| Notre calcul (`nutriscore.ts`) | barème 2023, aliments saisis et recettes | `nutriScoreEstime: true` |

Une note estimée **doit** s'afficher comme telle (`<PastilleNutri estime />`).
Ne jamais recalculer par-dessus une note d'Open Food Facts.

### Deux échelles de couleur, deux questions

- **Nutri-Score A→E** (`--nutri-*`) : la *qualité* d'un aliment. C'est
  l'échelle officielle imprimée sur les emballages — ne pas la redessiner, sa
  reconnaissance immédiate est tout son intérêt. Chaque teinte a son encre
  (`--nutri-c-encre` etc.) ; emprunter celle d'une autre casse le contraste.
- **Bandes vert / bleu / orange** (`--bande-*`) : la *charge calorique* d'une
  recette, relative à l'objectif de la personne. 500 kcal n'est pas la même
  chose pour deux profils, donc la bande se calcule, elle n'est jamais figée
  dans le catalogue.

`--macro-*` a ses propres valeurs et n'emprunte pas les jetons `assiette-*`,
réservés à `PagePlan` : « légume » et « lipide » ne veulent pas dire la même
chose.

### Les limites, à ne pas maquiller dans l'interface

- **Apple Santé est un import, pas une synchronisation.** Aucune API web
  n'accède à HealthKit. `Sante.tsx` le dit explicitement ; ne pas
  réintroduire le mot « synchroniser ».
- **Le scan photo est une estimation.** L'écran laisse corriger chaque
  quantité avant l'ajout au journal. Sans `ANTHROPIC_API_KEY`, la fonction
  répond 503 avec `configurable: true` et l'onglet renvoie vers la saisie
  manuelle — l'application reste entièrement utilisable.
- **Weight Watchers est propriétaire.** L'« indice Équilibre » est notre
  formule, sur données publiques. Ne pas aspirer leur catalogue.
- **`BarcodeDetector` n'existe pas sur Safari.** D'où le repli zxing-wasm.
  Le `.wasm` est servi depuis notre domaine via `?url` (et non depuis un
  CDN) pour que le service worker le mette en cache.

---

## Supabase

### Configuration

Deux variables, lues **à la compilation** (préfixe `VITE_`) :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Absentes → `supabase === null` → `modeDemo === true` → tout passe par
`localStorage`. C'est silencieux : aucun message n'avertit l'utilisateur.

### Table unique

```sql
public.donnees (
  user_id uuid primary key references auth.users(id) on delete cascade,
  contenu jsonb not null default '{}'::jsonb,
  maj_le  timestamptz not null default now()
)
```

Un document par compte : profil, pesées, journal des repas, eau, envies,
badges, scores. Choix assumé — le volume est minuscule (quelques dizaines de
Ko après un an) et rien n'a besoin d'être agrégé côté serveur.

### RLS — obligatoire

La clé `anon` est publique par conception. Ce qui protège les données de
santé, c'est la *row level security* : quatre politiques (`select`, `insert`,
`update`, `delete`), toutes en `auth.uid() = user_id`.

**Ne jamais mettre `service_role` dans un fichier `.env` de front-end.**

Un trigger `donnees_maj` tient `maj_le` côté base (le client peut se tromper
de fuseau, pas elle).

### Confirmation e-mail — le piège

Les identifiants historiques sont des **pseudos** convertis en
`pseudo@equilibre.local`, une adresse qui ne reçoit rien. Avec *Confirm email*
activé, Supabase tente d'envoyer un lien de validation, l'envoi échoue, et
**le compte n'est pas créé**. C'est la cause n° 1 de « les utilisateurs
n'apparaissent pas dans Supabase ».

Deux issues :
- **Pseudo** → désactiver *Confirm email* dans
  Authentication → Sign In / Providers → Email.
- **E-mail réel** → laisser la confirmation active et le flux fonctionne
  normalement (avec récupération de mot de passe).

### Réinitialiser un mot de passe

Tant que les comptes sont des pseudos, il n'y a pas de récupération possible :
passer par le tableau de bord Supabase, Authentication → Users.

---

## Vercel

- Importer le dépôt GitHub ; Vercel détecte Vite tout seul.
- Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans
  Settings → Environment Variables.
- **Relancer un déploiement après avoir ajouté les variables.** Les `VITE_*`
  sont lues à la compilation, pas à l'exécution : les ajouter ne suffit pas,
  il faut recompiler pour qu'elles entrent dans le fichier livré. Sans ça le
  site reste en mode démo, silencieusement.
- `vercel.json` : réécriture SPA vers `/index.html`, `sw.js` en
  `max-age=0, must-revalidate`, `assets/*` en `immutable` un an.
- Chaque `git push` sur `main` redéploie.

---

## Git

- Branche de production : `main`. Chaque push redéploie sur Vercel.
- Conventions de message : `feat:`, `fix:`, `refactor:`, `security:`, `docs:`,
  `perf:`, `chore:`.
- **Avant chaque push**, vérifier qu'aucun fichier sensible n'est ajouté :
  `.env`, clés d'API, mots de passe, données utilisateur réelles.
  `.gitignore` couvre déjà `.env`, `.env.local`, `.env.*.local`, `dist`,
  `node_modules`, `*.tsbuildinfo`, `.vercel`.
- **Ne jamais commiter d'adresse postale, de nom de patient ou de donnée de
  santé réelle** — le dépôt est public.
- Ne pas commiter si `npm run build` échoue (c'est le seul contrôle
  automatisé : `tsc -b && vite build`).

---

## Vérifier avant de livrer

Il n'y a **ni linter ni suite de tests** dans le projet. Le seul contrôle
automatisé est le typecheck du build :

```bash
npm run build
```

Vérification manuelle attendue :
1. `npm run dev`, parcourir les écrans touchés en mode clair **et** sombre
2. Tester en largeur mobile (375 px) et desktop — la navigation change de
   forme à `md`
3. Vérifier la console navigateur : aucune erreur
4. Si Supabase est configuré, vérifier qu'une écriture arrive bien dans la
   table `donnees`

---

## Historique du projet

### 28 juillet 2026 — Socle

Construction d'Équilibre : assiette, plan, poids, envies, cuisine, jeux,
profil, badges. Authentification Supabase avec repli navigateur. Déploiement
Vercel. Palette de l'assiette validée au script de simulation daltonienne.
Police Faustina retenue pour l'affichage.

### 29 juillet 2026 — Le journal alimentaire et la mosaïque

Bascule du produit : d'une liste à cocher contre une ordonnance vers un vrai
journal alimentaire, socle du coach nutrition.

- **L'assiette centrale est remplacée par la mosaïque** (`Mosaique.tsx`) :
  un treemap où l'aire dit les calories et la couleur dit le Nutri-Score. Le
  top et le flop du jour s'y lisent sans calcul. Concept choisi par Yann parmi
  trois propositions (anneaux façon Apple Santé, ruban horaire).
- **Quatre façons d'ajouter** : recherche locale (base embarquée, hors
  connexion) et Open Food Facts, scan de code-barres, photo d'assiette,
  saisie manuelle des valeurs de l'emballage.
- **Analyse repas par repas**, recommandation du repas suivant et alternatives
  — toutes en règles lisibles dans `coach.ts`, jamais par un modèle : une
  remarque sur l'alimentation de quelqu'un doit pouvoir être expliquée.
- **Onglet « Ajouter » au centre de la barre**, en relief. « Envies » sort des
  onglets et reste atteignable depuis Aujourd'hui et le profil.
- **Import Apple Santé** par le fichier d'export, lu par tranches de 4 Mo.
- **Recettes colorées** vert / bleu / orange selon leur charge pour le profil.

**Vérifié à l'écran** avant livraison : mobile 390 px et bureau 1280 px,
thèmes clair et sombre, aucune erreur console. Deux défauts corrigés à ce
moment-là — un quatrième onglet hors écran sur mobile, et des barres de macros
qui empruntaient les couleurs réservées à l'assiette.

**Reste à faire :** `ANTHROPIC_API_KEY` à ajouter dans Vercel pour activer le
scan photo ; l'éclatement de `recettes.ts` en `recettes/` est toujours en
suspens ; conformité RGPD (consentement, export, suppression) toujours ouverte.

### 28 juillet 2026 — Mémoire projet et audit

Création de ce fichier. Audit complet de l'existant.

**Constats principaux :**
- Le catalogue de recettes se limitait à 8 entrées ; aucune notion d'activité
  physique nulle part (ni type, ni écran, ni stockage).
- `.env.example` a été supprimé par le commit `8776238` alors que le README
  demande toujours de le copier — vraisemblablement un `mv` au lieu d'un `cp`.
  Restauré.
- Aucun secret n'a jamais été commité (`.env` absent de tout l'historique).
- Le mode démo est signalé à la connexion et dans le profil, mais pas sur les
  écrans de saisie quotidienne — angle mort à combler.
- Manquent pour la conformité RGPD : consentement, export des données,
  suppression du compte, mentions légales.

**Décision (Yann, 28/07/2026) : l'historique Git n'est pas réécrit.** Le bloc
`DIETETICIENNE` reste donc consultable via `git log -p` sur un dépôt public.
Le code et le bundle en production sont propres, mais **le lien de suivi Alivio
doit être considéré comme définitivement compromis** — sa rotation auprès de la
praticienne est la seule mesure qui reste efficace. Ne pas réintroduire de
coordonnées de tiers dans le code : elles vivent désormais dans
`profil.praticien`, côté utilisateur.

**En cours :** éclatement du catalogue de recettes en `src/lib/recettes/`
(types, un fichier par moment de repas, `index.ts` réexportant `RECETTES`,
`PLACARD`, `listeDeCourses`). Les imports `from '../lib/recettes'` continuent
de fonctionner via `index.ts`.
