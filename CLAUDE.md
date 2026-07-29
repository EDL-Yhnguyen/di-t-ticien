# CLAUDE.md — Mémoire projet « Mamakilo »

Ce fichier est la mémoire permanente du projet. Le lire **avant** toute
modification. Le mettre à jour **après** chaque évolution importante
(section « Historique » en bas).

---

## Ce qu'est le projet

**Mamakilo** — *bien manger, vivre mieux* — application web installable (PWA)
de suivi diététique et coach nutrition. Une seule base de code : le site *est*
l'application, installable sur iPhone et Android depuis le navigateur, sans
App Store.

Le produit s'appelait **Équilibre** jusqu'au 29 juillet 2026. Le nom
`equilibre` survit dans trois endroits, et **ce n'est pas un oubli** : les clés
`localStorage` (`equilibre:theme`, `equilibre:donnees:<id>`,
`equilibre:comptes`, `equilibre:session`), le domaine des pseudos
`@equilibre.local` sous lequel les comptes existants sont enregistrés dans
Supabase, et le préfixe `equilibre-export-v1` des fichiers d'export déjà
téléchargés. Les renommer déconnecterait tout le monde. Rien de tout cela n'est
visible par l'utilisateur.

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

> **Avertissement produit, à ne jamais retirer :** Mamakilo n'est pas un
> dispositif médical. Les plans générés sont des repères calculés
> (Mifflin-St Jeor, déficit 20 %, plancher 1 200 kcal), pas une prescription.

---

## Architecture

### Stack

| Couche | Choix | Version |
|---|---|---|
| Build | Vite | ^8.1.5 |
| UI | React + React DOM | ^19.2.8 |
| Langage | TypeScript | ^5.9.3 — **ne pas repasser en 7**, voir « Vercel » |
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
    recettes/           catalogue de recettes (voir « Le catalogue de recettes »)
    legal.ts            identité de l'éditeur, hébergeurs, destinataires
    rgpd.ts             consentement, export des données, suppression du compte
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
| `/confidentialite` | `Confidentialite.tsx` | politique de confidentialité + mentions légales |
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

Trois écrans **bloquants** passent avant tout le reste dans `App()`, dans cet
ordre : `motDePasseAChanger` → `NouveauMotDePasse.tsx`, consentement absent ou
périmé → `Consentement.tsx`, puis `!onboardingFait` → `Onboarding.tsx`.

`/confidentialite` est testée **avant** ces trois gardes : c'est la page que
l'écran de consentement doit pouvoir ouvrir alors qu'il bloque tout le reste.

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
Marque({ taille? })                              // le logo, mêmes tracés que public/icone.svg
Bouton({ ton?: 'primaire'|'accent'|'doux'|'fantome'|'alerte', pleineLargeur? })
Carte(props: HTMLAttributes<HTMLDivElement>)
TitreSection({ eyebrow?, children, action? })
Etiquette({ ton?: 'corail'|'apricot'|'basil'|'berry'|'neutre' })
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

La palette est tirée du logo Mamakilo (`Modèles/logo Mamakilo.jpg`) : marmite
corail, fond crème, encre marine du lettrage, vert des feuilles. **Aucune
couleur du logo n'est reprise telle quelle** — le corail `#f67a5e` ne tient que
2,4:1 sur blanc, donc ni texte ni bouton. Il reste à l'illustration ; `--corail`
en est la version portante, assombrie jusqu'à 4,5:1 dans chacun de ses usages.
Les deux se ressemblent assez pour que la marque reste une seule couleur à
l'œil.

- Neutres : `ground`, `surface`, `sunken`, `ink`, `ink-soft`, `ink-faint`, `line`
- Teintes + lavis : `corail`/`corail-wash` (primaire), `apricot`/`apricot-wash`
  (accent, calories), `basil`/`basil-wash` (réussite), `berry`/`berry-wash` (alerte)
- **Toute teinte modifiée se revérifie au calcul de contraste**, sur les quatre
  fonds où elle peut atterrir : `surface`, `ground`, `sunken` et son propre lavis.
  Le fond crème est moins clair que le blanc — une valeur qui passe sur `surface`
  peut échouer sur `ground`, ce qui est arrivé au premier jet.
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

## Données personnelles — ce qui est obligatoire

Un journal alimentaire et des pesées sont des **données de santé** (RGPD,
art. 9). Trois mécanismes portent la conformité ; aucun n'est décoratif.

### Le consentement précède la collecte

`EtatUtilisateur.consentement` porte une **version** — la date du texte
accepté, `VERSION_CONFIDENTIALITE` dans `legal.ts` — et un horodatage. Le RGPD
demande de pouvoir *démontrer* l'accord (art. 7.1), pas seulement de le
supposer : savoir *à quoi* la personne a dit oui fait partie de la preuve.

**Changer `VERSION_CONFIDENTIALITE` redemande son accord à tout le monde.** Ne
la toucher que si le texte change sur le fond : une donnée collectée en plus,
un destinataire en plus. Une correction de formulation ne la change pas.

Le refus n'est pas un « plus tard » : sans accord, rien ne peut être conservé,
donc refuser supprime le compte. C'est dit avant, dans la feuille de
confirmation.

### L'export et la suppression sont des fonctionnalités, pas des promesses

- **Export** (art. 15 et 20) : `telechargerExport()` sérialise le document
  entier, tel quel. Ne pas le filtrer « pour faire propre » — c'est justement
  l'intégralité qui est due.
- **Suppression** (art. 17) : `toutSupprimer()` efface le document *puis* le
  compte. Dans cet ordre, parce que la seconde étape est la seule qui puisse
  échouer pour une raison de configuration.

Retirer une ligne d'`auth.users` demande un privilège qu'un navigateur ne doit
pas avoir. D'où `supprimer_mon_compte()`, une fonction `security definer` du
`schema.sql` qui n'efface que son appelant. **Tant qu'elle n'a pas été
exécutée dans le projet Supabase, la suppression est partielle** : les données
partent, l'identifiant survit. Ce cas remonte un `avisSuppression` affiché sur
`Connexion.tsx` — l'écran d'arrivée après une suppression. Ne pas le masquer.

### `legal.ts` est à remplir, pas à deviner

**Le site est en régime « éditeur non professionnel »** (`EDITEUR_NON_
PROFESSIONNEL = true`). La LCEN (art. 6-III-2) permet à un particulier qui
publie sans en tirer de revenu de ne pas rendre publics son nom et son
adresse, à condition de les avoir communiqués à son hébergeur. **Ce n'est pas
une dispense** : le compte Vercel doit être à la véritable identité, et un
faux nom dans les mentions serait une infraction là où l'absence de nom n'en
est pas une.

**Ce régime tombe dès le premier euro encaissé.** L'abonnement Stripe du
sprint 8 fera de ce site une édition professionnelle : passer le drapeau à
`false` et remplir `nom`, `statut` et `adresse` fera alors partie du sprint,
pas d'un rattrapage après coup.

`EDITEUR.contact` reste obligatoire dans tous les cas — le RGPD ne dispense
personne d'un point de contact (art. 13). Tant qu'il pointe sur
`@example.com`, `contactProvisoire` vaut `true` et `/confidentialite` affiche
un encart d'avertissement plutôt que de laisser croire à une boîte relevée.

`REGION_BASE` doit correspondre à la région réelle du projet Supabase — c'est
elle qui dit si les données de santé sortent de l'UE.

Corollaire : **tout nouveau destinataire de données se déclare dans
`DESTINATAIRES`** au moment où on l'ajoute au code, pas après.

---

## Le catalogue de recettes

`src/lib/recettes/` — un fichier par moment de repas, réunis par `index.ts`
qui expose `RECETTES`, `PLACARD`, `recetteParId`, `recettesDuMoment` et
`listeDeCourses`. Les imports se font depuis `'../lib/recettes'`.

Une recette porte davantage qu'un titre et des étapes : `couvre` (des
`Categorie`, pas des libellés — l'affichage passe par `LIBELLE_CATEGORIE`),
`tags` (les questions qu'on se pose devant le frigo : rapide, batch,
végétarien, nomade…), `conservation` et `saisons`. `Cuisine.tsx` filtre sur
les bandes **et** sur les étiquettes, en cumulant les critères.

Ajouter une recette : la mettre dans le fichier de son moment, rien d'autre.
`index.ts` la récupère. L'ordre des `...` dans `RECETTES` suit la journée, ce
dont héritent les écrans qui listent sans regrouper.

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

**`schema.sql` a évolué** : il déclare aussi `supprimer_mon_compte()`. Un
projet créé avant le 29/07/2026 doit le rejouer, sinon la suppression de
compte reste partielle (voir « Données personnelles » plus haut).

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

### TypeScript reste en 5.x tant qu'il y a un dossier `/api`

Dès qu'une fonction serverless existe, Vercel charge le **TypeScript du
projet** pour la compiler, et attend l'API historique du compilateur
(`ts.sys.readFile`). TypeScript 7 est le portage natif en Go : il ne l'expose
pas. Le build Vite réussit, puis le déploiement meurt juste après sur
`Error: Cannot read properties of undefined (reading 'readFile')`.

Le piège est que la panne n'apparaît **qu'une fois `/api` peuplé** : avant
cela, TypeScript 7 passait très bien, Vercel n'ayant aucune raison de le
charger. Remonter en 7 sans supprimer `/api` casserait la production à
nouveau.

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
npm run build      # tsc -b (src) && tsc -p tsconfig.api.json (api) && vite build
```

**`npm run build` ne remplace pas un `npm ci`.** Il réutilise `node_modules`
et ne relit jamais le lockfile ; Vercel installe avec `npm ci`, qui refuse un
`package.json` et un `package-lock.json` désaccordés. Après toute
modification de dépendance, le contrôle fidèle est une copie propre :

```bash
npm ci && npm run build
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

### 29 juillet 2026 — Déblocage du déploiement Vercel

Quatre déploiements de suite en échec depuis 08:01, dont les sprints journal
alimentaire et RGPD : ils étaient commités mais **jamais arrivés en ligne**, la
production restant figée sur `a48b6c0`.

**Cause :** TypeScript 7 (portage natif Go) n'expose plus `ts.sys`, l'API que
le builder de Vercel appelle pour compiler les fonctions `/api`. Détail
expliqué dans la section « Vercel ». Le symptôme trompait : le build Vite
réussissait intégralement, l'échec tombait après.

**Deux fausses pistes écartées en chemin**, notées pour ne pas y revenir : le
cache de build empoisonné (un redeploy sans cache échoue à l'identique) et un
`package-lock.json` généré sous Windows sans les binaires Linux (les bindings
`@rolldown/*`, `lightningcss-*` et `@tailwindcss/oxide-*` y sont tous).

**Correctifs :** TypeScript en 5.9.3, `@types/node` ajouté pour le `process.env`
de la fonction Edge, et surtout `tsconfig.api.json` — `tsc -b` ne couvrait que
`src/`, donc `/api` n'était typechecké nulle part avant Vercel. C'est ce trou
qui a rendu la panne invisible en local ; le `build` le referme.

### 29 juillet 2026 — Équilibre devient Mamakilo

Changement de nom décidé par Yann, à partir d'un logo qu'il avait fait faire :
une marmite souriante d'où dépassent des légumes, sur fond crème, baseline
« bien manger, vivre mieux ».

- **Nom** partout où il est visible : titre, manifeste PWA, en-têtes, textes
  d'interface, mentions légales, README, `package.json`. Les clés internes ne
  bougent pas — voir « Ce qu'est le projet ».
- **Marque** : `Marque` dans `ui.tsx` reprend exactement les tracés de
  `public/icone.svg`, et remplace l'emoji 🍽 qui servait de sigle sur les trois
  en-têtes. Le sigle affiché et l'icône installée doivent être la même image.
- **Icônes** régénérées (192, 512, 180) au Chromium sans tête, à fond perdu :
  iOS et Android appliquent leur propre masque, des coins déjà arrondis y
  feraient un liseré.
- **`VERSION` du service worker** passée à `mamakilo-v1`. C'est ce qui purge
  l'ancienne coquille et l'ancienne icône chez les installations existantes —
  sans ça le rebranding ne serait pas visible sur un téléphone déjà équipé.
- **Palette** basculée du violet/lilas au corail/crème/marine du logo.
  `--iris` renommé `--corail` dans les 85 lignes qui l'utilisaient : garder le
  nom d'une fleur violette pour une couleur corail aurait menti au lecteur
  suivant. `apricot`, `basil` et `berry` gardent leur nom, qui décrit toujours
  leur teinte.

**Non touché, délibérément :** les jetons `--assiette-*`, `--macro-*`,
`--nutri-*` et `--bande-*`. Ce sont des couleurs de données, dont la contrainte
est la séparation entre voisines ou la reconnaissance d'une échelle officielle,
pas l'accord avec une marque. Le quart violet de l'assiette sur la page
d'accueil détonne un peu depuis le changement — c'est le prix de la validation
daltonienne, et le regagner demanderait de repasser au script.

**Vérifié à l'écran** avant livraison, au pilote Playwright : parcours
inscription → consentement → onboarding → aujourd'hui → ajouter → cuisine →
poids → profil → confidentialité, en 390 px et 1280 px, thèmes clair et sombre,
aucune erreur console. 23 paires de contraste vérifiées au calcul, toutes au-
dessus du seuil ; quatre valeurs ont dû être assombries après un premier jet
qui échouait sur le fond crème.

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

### 29 juillet 2026 — Conformité RGPD et catalogue de recettes

Le reliquat du sprint 1, qui bloquait toute mise à disposition du public.

- **Consentement explicite** avant l'onboarding, versionné sur la date du
  texte. Refuser supprime le compte — c'est la seule issue honnête.
- **Export des données** en un fichier JSON complet, depuis le profil.
- **Suppression du compte**, avec saisie de confirmation. Côté base, une
  fonction `security definer` évite d'avoir à exposer `service_role`.
- **`/confidentialite`** : politique et mentions légales en un seul écran,
  atteignable connecté ou non, y compris depuis l'écran de consentement.
  Régime « éditeur non professionnel » retenu (Yann, 29/07/2026) : diffusion
  d'abord restreinte à des proches, pas de société. Aucun nom n'est publié —
  la loi le permet, un faux nom ne l'aurait pas permis.
- **Fin de l'éclatement des recettes.** `recettes.ts` était toujours le
  module chargé ; `recettes/` existait à côté sans jamais être importé (la
  résolution Node prend le fichier avant le dossier), donc quinze petits
  déjeuners écrits au nouveau schéma dormaient en code mort. Les huit
  anciennes recettes ont été migrées, déjeuners, dîners et collations
  complétés — 30 recettes, avec étiquettes filtrables et conservation.

**Vérifié à l'écran** avant livraison, au pilote Playwright : parcours complet
inscription → consentement → onboarding → cuisine → profil → suppression, en
390 px et 1280 px, thèmes clair et sombre, aucune erreur console. Export et
suppression contrôlés de bout en bout (fichier produit, compte et document
retirés, reconnexion refusée). Un défaut corrigé à ce moment-là : l'avis de
suppression partielle était placé sur l'accueil alors que le parcours atterrit
sur `/connexion`.

**Reste à faire :** `supprimer_mon_compte()` **n'existe pas encore dans la
base** — vérifié le 29/07/2026, seule `marquer_maj` est déclarée. Tant qu'elle
manque, « supprimer mon compte » efface les données mais laisse l'identifiant,
et l'application le dit. Le connecteur Supabase est en lecture seule : c'est
un copier-coller à faire dans le SQL Editor. Restent aussi `REGION_BASE` à
confirmer dans `legal.ts`, et `ANTHROPIC_API_KEY` à ajouter dans Vercel pour
activer le scan photo.

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
