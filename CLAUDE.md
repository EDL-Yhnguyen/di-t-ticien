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

Dépôt : `EDL-Yhnguyen/mamakilo` (public)
Production : **https://mamakilo.vercel.app**
Dossier local : `C:\Users\YHN\Documents\Git\mamakilo`
Supabase : projet `Mamakilo`, ref `vdnfqijjmuxdrimbyyrv`, région `eu-west-1`

### Le renommage du 30 juillet 2026

Tout porte enfin le même nom : dossier local, dépôt GitHub, projet Vercel,
projet Supabase. Quatre points à connaître, parce qu'aucun ne se devine :

- **`di-t-ticien.vercel.app` reste attaché au projet, exprès.** Les deux
  adresses servent la même application. Le retirer casserait les PWA déjà
  installées, et surtout **`localStorage` est cloisonné par origine** : un
  compte en mode démo créé sur l'ancienne adresse n'existe pas sur la nouvelle.
  En production l'application est en mode synchronisé, donc les données vivent
  dans Supabase et se retrouvent après une reconnexion — mais la session, elle,
  ne suit pas. Ne pas détacher l'ancien domaine sans y avoir réfléchi.
- **Le lien Vercel ↔ GitHub a survécu au renommage du dépôt** : Vercel indexe
  sur `githubRepoId`, pas sur le nom. Aucune reconfiguration n'a été nécessaire.
- **`di-t-ticien` est maintenant libre sur GitHub.** La redirection 301 tient
  tant que personne ne réserve l'ancien nom.
- **La référence du projet Supabase est immuable** : le renommage n'a changé que
  l'étiquette du tableau de bord, `VITE_SUPABASE_URL` est inchangée.

Les clés internes gardent le préfixe `equilibre` — voir plus haut, c'est une
autre question et elle ne se rouvre pas.

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
(clé d'API IA) doit vivre dans une **fonction serverless Vercel**
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
- **Écrans chargés à la demande, puis préchargés en temps mort.** `App.tsx`
  déclare chaque écran secondaire en `lazy()` ; `Aujourdhui` et tout le premier
  contact (accueil, connexion, consentement, onboarding) restent chargés
  d'emblée. Le découpage seul rendrait un écran jamais ouvert inaccessible hors
  connexion — d'où le préchargement en `requestIdleCallback` juste après
  l'ouverture, qui restaure l'usage hors ligne complet sans peser sur le premier
  affichage. **Ajouter un écran, c'est l'ajouter aux deux endroits**, sinon il
  se charge à la demande mais jamais d'avance.
- **Une barrière d'erreur autour de l'écran affiché** (`BarriereErreur`), remontée
  à chaque changement de route, plus une seconde autour de toute la coquille
  dans `main.tsx`. Sans elles, une exception laissait une page blanche sans
  issue — indistinguable d'une panne définitive sur une PWA installée.

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
    recettes/           catalogue : 53 écrites à la main + 5 469 composées (voir « Le catalogue »)
    legal.ts            identité de l'éditeur, hébergeurs, destinataires
    rgpd.ts             consentement, export des données, suppression du compte
    utils.ts            helpers (jourISO, classes, …)
    ── journal alimentaire ──
    journal.ts          apports, totaux, bilan par repas, top/flop, cibles
    nutriscore.ts       barème 2023, indice Équilibre, bandes vert/bleu/orange
    aliments/           base de 2 041 aliments embarquée + recherche (voir « La base d'aliments »)
    openfoodfacts.ts    recherche et code-barres (API publique, sans clé)
    decodeur.ts         BarcodeDetector, avec repli WebAssembly pour iOS
    photo.ts            préparation de l'image + appel de /api
    coach.ts            analyses, recommandations, alternatives (règles)
    appleSante.ts       lecture par tranches de l'export.xml d'Apple Santé
    sport.ts            catalogue MET, dépense d'une séance, bilan de semaine
    menu.ts             génération d'une semaine de menus, liste de courses
    coachIA.ts          contexte envoyé à /api/coach et lecture de la réponse
    stats.ts            tendances sur une période : calories, macros, qualité, sport, poids
    journalRecette.ts   conversion d'une recette en entrée de journal
    stocks.ts           garde-manger : échéances, urgences, recettes réalisables
    courses.ts          listes de courses enregistrées : cumul, versement, retour au stock
    catalogue.ts        lectures du catalogue : difficulté, régimes, macros, illustration, recherche
    ics.ts              export d’une semaine de menus vers un agenda (.ics)
    cuisson.ts          durées lisibles dans une étape, ordre de démarrage d’un batch
    cuisineEnDirect.ts  minuteurs et maintien de l’écran allumé (effets navigateur)
    ia/                 ports d’IA : interfaces et bouchons, aucun appel réel
    ingredients.ts      rapprochement des noms de produits (stock ↔ recettes ↔ courses)
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
  catalogue.sql         catalogue de recettes à l’échelle (non appliqué, voir CUISINE.md)
  foyer.sql             partage familial (non appliqué, schéma inerte tant que le front ne le lit pas)
api/
  analyser-assiette.ts  fonction Vercel Node : photo → aliments estimés
  coach.ts              fonction Vercel Node : question + contexte → réponse
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
| `/app/garde-manger` | `GardeManger.tsx` | frigo, placards, congélateur, dates limites |
| `/app/cuisiner` | `Cuisiner.tsx` | ce que le stock permet de cuisiner |
| `/app/courses` | `Courses.tsx` | listes de courses, cochage enregistré, retour de courses |
| `/app/ticket` | `Ticket.tsx` | photo d'un ticket de caisse, OCR local, correction ligne à ligne |
| `/app/prix` | `Prix.tsx` | historique des prix par produit, meilleur prix et son enseigne |
| `/app/mode-cuisine` | `ModeCuisine.tsx` | **hors gabarit** : une étape à la fois, minuteurs, batch |
| `/app/coach` | `Coach.tsx` | coach conversationnel (accord préalable) |
| `/app/stats` | `Stats.tsx` | tendances sur 7 / 30 / 90 jours |
| `/app/menus` | `Menus.tsx` | planification jour / semaine / mois, modèles, export agenda |
| `/app/sport` | `Sport.tsx` | séances, dépense estimée, repère de l'OMS |
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
- **`prefers-reduced-motion` est respecté partout depuis le 29/07/2026.** Le
  bloc d'`index.css` ne neutralise que les animations **CSS** ; le
  `<MotionConfig reducedMotion="user">` de `main.tsx` couvre celles de
  framer-motion, sans avoir à y penser dans chaque composant. Ne pas le retirer,
  et ne pas contourner `MotionConfig` avec des animations impératives : ce n'est
  pas une préférence esthétique mais un réglage médical, pour les personnes
  sujettes au mal des transports ou aux migraines vestibulaires.

### Écrire dans l'état — un seul chemin

```ts
const { etat, modifier } = useSession()
modifier((brouillon) => { brouillon.profil.herbalifeActif = true })
```

`modifier` fait un `structuredClone`, applique la recette mutative, évalue les
badges, puis planifie `enregistrer()` avec un debounce de 400 ms (vidé sur
`pagehide`). **Ne jamais appeler `enregistrer()` directement depuis une page.**

### Retirer ou renommer un champ persistant — la 4e place

Un champ supprimé de `EtatUtilisateur` **existe encore dans les documents déjà
enregistrés**. Le lire pour migrer sa valeur se fait via l'interface
`ChampsHistoriques` de `store.ts`, typée explicitement plutôt qu'en `any` : ce
sont les seules lectures d'un schéma révolu, et elles doivent se voir. Exemple en
place : `menus` (une semaine) devenu `plans` (plusieurs) le 30/07/2026.

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
Carte({ ton?: 'primaire'|'accent'|'reussite'|'alerte' })
Tuile({ ton?: 'primaire'|'accent'|'reussite'|'alerte'|'vif', intitule })
TitreSection({ eyebrow?, children, action? })
Etiquette({ ton?: 'primaire'|'accent'|'reussite'|'alerte'|'neutre' })
Champ({ label, aide?, suffixe?, ...inputProps })
ChoixListe<T extends string>({ label, valeur, options, onChange })
Bascule({ label, aide?, actif, onChange })
Feuille({ ouvert, titre, onFermer, children })   // bottom-sheet, Échap + lock scroll
EtatVide({ emoji, titre, children, action? })
Chargement({ libelle? })
```

Utilitaire de classes : `classes(...)` dans `src/lib/utils.ts`.

### Jetons de couleur — `src/index.css` et `src/palettes.css`

Deux réglages indépendants qui se combinent : le **mode** (clair / sombre /
système) est une classe `.dark` sur `<html>`, le **thème de couleur** est un
attribut `data-theme`. Huit thèmes × deux modes.

**`src/palettes.css` est un fichier généré — ne jamais l'éditer à la main.**
Il sort d'`outils/palettes.mjs`, qui tient les seize variantes et vérifie leurs
contrastes :

```bash
node outils/palettes.mjs            # régénère palettes.css et affiche le rapport
node outils/palettes.mjs --verifie  # n'écrit rien, sort en 1 si un contraste échoue
```

Le générateur existe parce que la règle « toute teinte modifiée se revérifie au
calcul de contraste » représentait une relecture à un thème, et plus de six cents
paires à huit thèmes en clair et en sombre. Une règle de cette taille ne tient
que si elle est exécutable. **Le lancer avant de commiter une modification de
couleur.**

Le thème par défaut, **Marmite**, occupe `:root` et `.dark` : l'application a ses
couleurs sans qu'aucun attribut soit posé. Il est tiré du logo Mamakilo
(`Modèles/logo Mamakilo.jpg`) : marmite corail, fond crème, encre marine du
lettrage, vert des feuilles. **Aucune couleur du logo n'est reprise telle
quelle** — le corail `#f67a5e` ne tient que 2,4:1 sur blanc, donc ni texte ni
bouton. Il reste à l'illustration ; `--corail` en est la version portante,
assombrie jusqu'à 4,5:1 dans chacun de ses usages. Les deux se ressemblent assez
pour que la marque reste une seule couleur à l'œil.

Les sept autres — Potager, Agrumes, Myrtille, Océan, Cacao, Framboise, Encre —
vivent sous `[data-theme=…]`. Ajouter un thème demande de le déclarer **dans le
générateur et dans `THEMES` de `src/lib/apparence.ts`** : les trois couleurs de
la vignette de choix y sont recopiées en dur, parce qu'une vignette doit montrer
son thème pendant qu'un autre est appliqué, donc elle ne peut pas lire les
variables CSS courantes.

- Neutres : `ground`, `surface`, `sunken`, `ink`, `ink-soft`, `ink-faint`, `line`,
  `line-fort`
- **Teintes nommées par leur rôle, plus par leur couleur** : `primaire`,
  `accent` (calories), `reussite`, `alerte`, chacune avec son lavis `-wash`.
  C'est le renommage qui a rendu les huit thèmes possibles : `corail`, `apricot`,
  `basil` et `berry` décrivaient une teinte, et un jeton nommé « corail » qui
  vaut du bleu en thème Océan ment à celui qui le lit. Les anciens noms ne
  subsistent nulle part dans `src/` — ne pas les réintroduire.
- Aplats : `.plein-primaire`, `.plein-accent`, `.plein-reussite`,
  `.plein-alerte` (fond porteur + texte blanc), et `.shadow-halo`
- **Toute teinte modifiée se revérifie au calcul de contraste**, sur les quatre
  fonds où elle peut atterrir : `surface`, `ground`, `sunken` et son propre lavis.
  Le fond crème est moins clair que le blanc — une valeur qui passe sur `surface`
  peut échouer sur `ground`, ce qui est arrivé au premier jet.
- **Les jetons de données ne suivent pas le thème**, et c'est la règle centrale
  du système : `assiette-*`, `nutri-*`, `macro-*`, `bande-*` portent du sens, pas
  du goût. La part des légumes doit rester la même couleur que l'utilisateur
  choisisse « Agrumes » ou « Océan », sinon la légende apprise hier ne vaut plus
  rien aujourd'hui. Ils sont déclarés une fois dans `index.css` et validés sur
  les fonds de **tous** les thèmes.
- **Réservés, ne pas emprunter** : `assiette-legume`, `assiette-feculent`,
  `assiette-proteine`. Palette catégorielle validée en vision daltonienne
  (ΔE ≥ 8 en protanopie) — les trois parts se touchent, donc chaque paire doit
  rester distinguable. Le réflexe naturel vert + orange voisins tombait à
  ΔE 5,1 en protanopie. **Les modifier demande de revérifier au script.**
- Réservés au bandeau (texte blanc dessus) : `bandeau-haut`, `bandeau-bas`
- Rayons : `rounded-card` (1.5rem), `rounded-tile` (1rem)
- Polices : `--font-display` (Faustina, d'office sur h1/h2/h3), `--font-sans` (Figtree)

### Les polices — `outils/polices.mjs` et `public/polices/`

**Faustina et Figtree sont servies depuis notre domaine, et elles doivent le
rester.** Elles venaient de `fonts.googleapis.com` jusqu'au 31/07/2026 ; les
rapatrier a réglé trois choses d'un coup, dont une qui n'était pas négociable :

- **Google était un destinataire de données non déclaré.** Charger une police
  depuis `fonts.gstatic.com` transmet l'adresse IP du visiteur, qui est une
  donnée personnelle ; le RGPD demande de nommer ses destinataires (art. 13) et
  `DESTINATAIRES` ne listait pas Google. Sur un site qui traite des données de
  santé, la politique de confidentialité doit être vraie. Le tribunal régional de
  Munich a condamné exactement cette intégration en janvier 2022
  (LG München I, 3 O 17493/20).
- **Le premier affichage ne dépend plus d'un tiers** : la feuille de style de
  Google bloquait le rendu derrière un DNS, un TLS et deux allers-retours sur une
  origine que rien n'avait préchargée.
- **L'hors-ligne est complet dès la première visite.** Le service worker mettait
  bien les réponses de Google en cache, mais encore fallait-il les avoir obtenues.

`src/polices.css` est **généré — ne jamais l'éditer à la main** ; il sort de
`node outils/polices.mjs`, comme `src/palettes.css` sort du générateur de
palettes. Trois règles à ne pas défaire :

- **Les deux licences OFL restent dans `public/polices/`.** C'est la contrepartie
  de la redistribution, au même titre que l'attribution des photos de Commons.
  Le script échoue si elles manquent ou si leur contenu n'y ressemble pas — le
  premier jet avait téléchargé une page « 404 » de quatorze octets et l'avait
  annoncée comme licence présente.
- **Seuls les sous-ensembles latins sont préchargés.** Les `latin-ext` ne se
  téléchargent que si un caractère les appelle ; les précharger ferait payer
  34 Ko à tout le monde pour des lettres que le français n'emploie pas.
- **`/polices/` n'est pas en `immutable`** dans `vercel.json`, contrairement à
  `/assets/` : ces fichiers ne portent pas d'empreinte de build, donc un an de
  cache figé rendrait toute correction impossible sans les renommer. Trente jours,
  et le service worker fait le reste.

**La bascule du service worker à `mamakilo-v2` fait partie du changement.** Le
cache `mamakilo-v1-polices` contenait des réponses de `gstatic.com` qui n'étaient
plus demandées, donc plus jamais remplacées : sans changement de version, chaque
PWA déjà installée aurait gardé indéfiniment les fichiers du tiers dont on venait
de se séparer.

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

### La base d'aliments — `src/lib/aliments/`

**2 041 aliments depuis le 31/07/2026**, répartis par famille dans `donnees/`.
Les valeurs sont des moyennes de l'ordre de grandeur de Ciqual, pas des étiquettes
de marque : ce sont des repères, et le code-barres reste la bonne porte pour un
produit précis.

- **La recherche travaille par jetons** (`recherche.ts`), pas par `includes()`.
  C'est ce qui a corrigé le défaut d'origine : la base contenait « Pommes de terre
  cuites » et « pomme de terre » ne trouvait rien. Un mot correspond **par
  préfixe dans les deux sens**, ce qui absorbe les pluriels sans table de
  conjugaison et répond pendant la frappe.
- **Les diacritiques se suppriment avant la ponctuation.** Les balayer ensemble
  coupait « pâtes » en « p a tes » — invisible tant que la requête porte le même
  accent, fatal sur « pates completes » tapé sans accent.
- **`conseil.ts` est séparé d'`index.ts`, et ce n'est pas cosmétique.** Le coach
  est appelé depuis l'écran d'accueil, qui n'est pas chargé à la demande : tout ce
  qu'il importe part dans le premier téléchargement. La base complète y pesait
  52 Ko compressés dont l'accueil n'avait besoin d'aucun. **Ne pas réexporter
  `ALIMENTS_A_CONSEILLER` depuis `lib/aliments`** — un seul import ramènerait les
  deux mille entrées sur le chemin critique.
- **Le champ `rare` retire de la suggestion, jamais de la recherche.** Le safran,
  la vodka et la farine doivent se noter sans que le coach les propose.
- Un identifiant en double est signalé en console en développement. Les
  identifiants des 72 aliments d'origine sont **tous conservés**.

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
- **La dépense d'une séance est une estimation, jamais une mesure.** Elle part
  d'un MET moyen de population et du poids connu ; l'écran le dit. Elle est
  comptée **nette** (MET − 1), le métabolisme de repos étant déjà dans
  l'objectif calorique — l'ajouter en brut le compterait deux fois. Même raison
  pour l'énergie active importée d'Apple Santé, affichée sur `/app/sport` mais
  **jamais ajoutée au budget** : elle couvre la journée entière, séances
  comprises.
- **Weight Watchers est propriétaire.** L'« indice Équilibre » est notre
  formule, sur données publiques. Ne pas aspirer leur catalogue.
- **`BarcodeDetector` n'existe pas sur Safari.** D'où le repli zxing-wasm.
  Le `.wasm` est servi depuis notre domaine via `?url` (et non depuis un
  CDN) pour que le service worker le mette en cache.

---

## Le coach conversationnel

**Deux coachs cohabitent, et ce n'est pas un doublon.**

| | Où | Ce qu'il fait |
|---|---|---|
| Règles | `src/lib/coach.ts` | Verdict d'un repas, recommandation du suivant, alternatives. Chiffré, déterministe, explicable ligne à ligne. |
| Conversation | `api/coach.ts` + `src/lib/coachIA.ts` | Répond aux questions qu'aucune règle ne couvre, à partir des mêmes chiffres. |

**Le modèle ne reprend jamais le travail des règles.** Un verdict affiché sur
un écran doit pouvoir s'expliquer sans invoquer un modèle ; c'est la raison
d'être de `coach.ts` et elle n'a pas changé. Ne pas déplacer une analyse
chiffrée vers `/api/coach` parce que « le modèle le ferait mieux ».

**Ce qui part du navigateur est construit à la main** dans
`construireContexte()` : profil, objectif du jour (bonus sport compris, le même
chiffre que celui affiché), repas notés, séances. Pas le document entier, et
**jamais les coordonnées du praticien** — ce sont celles d'un tiers qui n'a rien
demandé. Ajouter un champ au contexte, c'est ajouter une donnée transmise à un
tiers : ça se décide, et ça se répercute dans l'écran d'accord et dans
`DESTINATAIRES`.

Côté serveur, le contexte est **réécrit ligne à ligne** plutôt que sérialisé
tel quel : un champ inattendu envoyé par un client bricolé n'atterrit pas dans
la consigne.

Réglages du modèle : `claude-opus-5`, `effort: 'low'`. La conversation n'est pas
une tâche de raisonnement profond, et la personne attend devant son écran — au-
dessus, on paie de la réflexion sans gagner en justesse. `max_tokens` couvre la
réflexion **et** la réponse : ne pas le descendre sous ~3 000.

**Sans `ANTHROPIC_API_KEY`, la fonction répond 503 avec `configurable: true`**
et l'écran affiche quoi faire, comme le scan photo. Le reste de l'application
est intact.

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

### Le coach a son propre consentement

`consentementCoach` est distinct de `consentement`, et ce n'est pas une
duplication : le premier couvre ce que l'application **conserve**, le second
couvre **l'envoi du journal du jour à un tiers** pour obtenir une réponse. Le
RGPD demande un consentement par finalité (art. 6.1.a). Concrètement :

- Tant qu'il vaut `null`, `/app/coach` n'affiche que l'écran d'accord et **rien
  ne part**. Ne pas contourner cette porte.
- Le refuser ne coûte rien d'autre : tout le reste de l'application marche.
  C'est ce qui rend le consentement libre, donc valable.
- Il se retire depuis « Réglages » du profil, aussi facilement qu'il se donne
  (art. 7.3). Le retirer referme le coach ; la conversation déjà tenue reste
  lisible tant qu'on ne l'efface pas.

**`VERSION_CONFIDENTIALITE` n'a pas été incrémentée en l'ajoutant** — le texte
a changé le même jour que sa date en vigueur, et surtout la nouvelle
transmission est gardée par son propre accord explicite. Une prochaine
extension du contexte envoyé, elle, devra la faire bouger.

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

**C'est l'état durable du site, et non une étape transitoire** (Yann,
29/07/2026) : la diffusion reste familiale, l'abonnement Stripe est abandonné,
aucune monétisation n'est prévue. Le régime ne tomberait que si l'application
devenait payante ou publicitaire — il faudrait alors passer le drapeau à
`false` et remplir `nom`, `statut` et `adresse`, qui deviendraient publics.
Ne pas réintroduire de brique de paiement sans reposer la question.

`EDITEUR.contact` reste obligatoire dans tous les cas — le RGPD ne dispense
personne d'un point de contact (art. 13). Tant qu'il pointe sur
`@example.com`, `contactProvisoire` vaut `true` et `/confidentialite` affiche
un encart d'avertissement plutôt que de laisser croire à une boîte relevée.

`REGION_BASE` doit correspondre à la région réelle du projet Supabase — c'est
elle qui dit si les données de santé sortent de l'UE.

Corollaire : **tout nouveau destinataire de données se déclare dans
`DESTINATAIRES`** au moment où on l'ajoute au code, pas après.

---

## Verser une recette au journal

`src/lib/journalRecette.ts` transforme une recette en `EntreeJournal`. Le
catalogue ne connaît que les calories : **les macros sont déduites d'une
répartition type**, à partir de ce que la recette déclare couvrir dans
l'assiette (une viande apporte protéines et gras, un féculent des glucides).

C'est une estimation, et l'écran le dit. Elle vaut mieux que l'alternative —
enregistrer un plat à 500 kcal avec zéro gramme de protéines fausserait
silencieusement les barres de macros et les analyses du jour. **Aucun
Nutri-Score n'est calculé** pour ces entrées : une note de qualité assise sur
des macros elles-mêmes estimées se donnerait une autorité qu'elle n'a pas.

Le poids de la portion vient d'une densité type par moment, uniquement pour
que le journal affiche des grammes vraisemblables — écrire « 100 g » devant une
assiette complète serait faux.

Le geste est offert à deux endroits : la fiche d'une recette dans Cuisine, et
la fiche d'un repas du planning dans Menus. Les deux passent par le composant
`AuJournal`, qui laisse corriger la part avant d'enregistrer.

## Le garde-manger

Le programme complet du module « Cuisine, Recettes & Courses » — six sprints,
et les quatre points du brief qui ne peuvent pas se faire littéralement — est
dans **`CUISINE.md`**. À lire avant d'y toucher. L'essentiel à ne pas défaire :

- **La DLC et la DDM sont deux champs distincts**, et pas par scrupule : la
  première est sanitaire, la seconde ne parle que du goût. Les fondre ferait
  jeter des aliments parfaitement bons, ce qui est l'inverse du but. Le
  vocabulaire des écrans suit : « à jeter » d'un côté, « moins bon » de l'autre.
- **`ouvertLe` avance l'échéance** : un produit entamé ne tient pas jusqu'à sa
  date imprimée, qui ne vaut que pour un emballage fermé.
- **`memeProduit()` rapproche sur un seul mot porteur** et se trompe parfois.
  C'est assumé, à une condition : **l'écran affiche toujours l'article du stock
  qui a produit la correspondance**. Ne pas retirer cet affichage pour gagner
  de la place — c'est lui qui rend l'erreur inoffensive.

## Les courses

Sprint C2, livré le 30/07/2026 ; les décisions détaillées sont dans
`CUISINE.md`. Ce qu'il faut savoir avant d'y toucher :

- **La liste de `/app/courses` est enregistrée ; celle de `menu.ts` est
  calculée.** Ce n'est pas un doublon : la seconde est un aperçu d'une semaine,
  la première est ce qu'on emporte et qu'on coche. Un cochage qui ne survit pas
  au rechargement fait racheter ce qui est déjà dans le caddie.
- **Deux arithmétiques différentes seraient une erreur** : `cumulerQuantites`
  vit dans `ingredients.ts` et sert aux deux, sinon « 2 + 2 oignons » d'un côté
  et « 4 oignons » de l'autre feraient deux lignes pour la même chose.
- **Le rapprochement des lignes se fait sur `cleIngredient`** (au pluriel près),
  pas sur `memeProduit` : sur une liste de courses, fusionner à tort fait partir
  au magasin avec une quantité fausse.
- **Le retour de courses n'invente aucune date limite.** Les articles entrent au
  garde-manger sans DLC ni DDM, et l'écran le dit.

## Les prix

Module « Tickets et prix », livré le 30/07/2026. **Le programme complet, les
quatre points du brief qui ne peuvent pas se faire, et les pièges rencontrés sont
dans `PRIX.md`.** À lire avant d'y toucher. L'essentiel à ne pas défaire :

- **Les relevés de prix ne vont pas dans le document `jsonb`.** C'est la seule
  exception à la règle du document unique, et elle est motivée : cinq mille
  relevés par an pèsent près d'un mégaoctet, or `modifier()` clone le document
  entier à chaque écriture et `enregistrer()` le renvoie entier à Supabase. Le
  détail vit en IndexedDB (`lib/prix/depot.ts`), **seuls les agrégats par
  produit** entrent dans `EtatUtilisateur.prix`. Ne pas rapatrier le détail « pour
  simplifier » : ce serait une latence sur l'écran des courses.
- **Les agrégats se recalculent, ils ne s'entretiennent pas.** Une moyenne
  corrigée à l'incrément dérive, et une moyenne fausse a l'air d'une moyenne.
- **Le ticket porte sa propre somme de contrôle.** Le total imprimé est confronté
  à l'addition des lignes ; tant que ça ne retombe pas, l'écran le dit et
  n'affirme rien. C'est ce qui rend un OCR local digne de confiance.
- **Aucun prix n'est deviné.** Une ligne illisible reste `null`, jamais `0` —
  zéro deviendrait le « meilleur prix jamais vu » du produit.
- **`worker.format: 'es'` dans `vite.config.ts` ne se retire pas.** Sans cette
  ligne, Vite émet le worker OCR en IIFE, le navigateur refuse de le charger, et
  la panne n'existe **qu'en production**, sans message d'erreur.
- **L'OCR est local et le restera tant qu'aucune IA payante n'est décidée.**
  L'image ne part nulle part et n'est pas conservée.

## Le catalogue de recettes

`src/lib/recettes/` — un fichier par moment de repas, réunis par `index.ts`
qui expose `RECETTES`, `PLACARD`, `recetteParId`, `recettesDuMoment` et
`listeDeCourses`. Les imports se font depuis `'../lib/recettes'`.

Une recette porte davantage qu'un titre et des étapes : `couvre` (des
`Categorie`, pas des libellés — l'affichage passe par `LIBELLE_CATEGORIE`),
`tags` (les questions qu'on se pose devant le frigo : rapide, batch,
végétarien, nomade…), `conservation` et `saisons`. `Cuisine.tsx` filtre sur
les bandes **et** sur les étiquettes, en cumulant les critères.

**Depuis le sprint C3 (30/07/2026)**, une recette porte aussi `cuisine`,
`regimes`, `substitutions`, `rechauffage` et `appareils` — tous facultatifs. Les
règles à ne pas contourner, détaillées dans `CUISINE.md` :

- **Aucun régime ne se déduit des ingrédients.** Un « sans gluten » faux est un
  risque sanitaire, pas une imprécision. Seul le champ `regimes` fait foi ;
  « végétarien » est la seule déduction tolérée, sur le tag existant.
- **Pas de champ `portions`** : `kcal` et les quantités sont écrits pour une
  personne, et le planificateur, les bandes et le journal le lisent ainsi.
  Cuisiner pour plusieurs est un calcul d'affichage (`ingredientsPour`).
- **Le coût n'est pas un montant** : aucune source de prix n'existe, l'étiquette
  « économique » tient ce rôle.
- **`photo` n'est renseigné que sur les plats emblématiques**, et seulement depuis
  des images **sous licence libre de Wikimedia Commons** (voir « Les photos »). Le
  reste du catalogue dégrade vers une illustration générée dont **le pictogramme
  se lit dans le contenu du plat**. Ne pas le tirer au hasard : un chili
  végétarien illustré par un poisson est faux, et une vignette fausse est pire que
  pas de vignette.

**Le catalogue compte 5 522 recettes depuis le 30/07/2026** : les 53 écrites à la
main (15 petits déjeuners, 14 déjeuners, 10 collations, 14 dîners) **puis** 5 469
composées par `recettes/generateur.ts` à partir des briques de `recettes/briques.ts`.

- **Tout ce qui parcourt le catalogue passe par `catalogue()`**, jamais par
  `RECETTES` — cette constante ne contient que les recettes manuelles. `catalogue()`
  est paresseuse et mémoïsée : l'écran du journal ne paie pas la génération.
- **Les identifiants composés (`c:...`) sont déterministes.** Favoris, plans de
  menus et listes de courses les référencent : introduire du hasard dans le
  générateur casserait les données de tout le monde.
- **Ni Weight Watchers ni les recettes de chefs** — le texte d'une recette est une
  œuvre protégée et le dépôt est public. Le générateur ne compose qu'à partir de
  techniques et de styles régionaux, qui sont des noms communs. Détail et sources
  libres examinées dans `CUISINE.md`, point 2.
- **L'affichage est plafonné** à 24 recettes par moment, avec le reste annoncé. Le déséquilibre d'origine (6 déjeuners, 5 dîners) faisait
revenir les mêmes plats deux ou trois fois dans une semaine générée — le
planificateur ne peut pas faire mieux que son catalogue, sa pénalité de
répétition ne compense pas un manque de candidats. Garder au moins une douzaine
de recettes par moment.

Ajouter une recette : la mettre dans le fichier de son moment, rien d'autre.
`index.ts` la récupère. L'ordre des `...` dans `RECETTES` suit la journée, ce
dont héritent les écrans qui listent sans regrouper.

### Le terroir et les quatre axes de classement (31/07/2026)

**Le catalogue compte 7 608 recettes** : 129 écrites à la main — dont **76 plats
emblématiques** dans `recettes/terroir/` — et le reste composé.

- **Le générateur ne produira jamais de carbonade flamande.** Une carbonade n'est
  pas un bœuf mijoté à la bière, c'est une suite de gestes précis, et personne ne
  cherche « mijoté de bœuf façon bistrot » : on cherche une carbonade, par son nom.
  D'où `terroir/`, écrit à la main. Aucun texte n'est recopié — le plat appartient
  à tout le monde, le texte d'une recette non.
- **Quatre axes s'ajoutent à `cuisine`** : `region` (le terroir sous le pays),
  `gouts`, `typePlat`, `occasions`. Les trois derniers se **déduisent** quand ils
  ne sont pas écrits (`typePlatDe`, `goutsDe`, `occasionsDe` dans `catalogue.ts`) :
  sans déduction, les filtres ne montreraient que les 129 recettes manuelles et
  cacheraient l'essentiel du catalogue. Cette déduction est légitime là où celle
  des régimes ne l'est pas — se tromper de forme de plat contrarie, se tromper de
  régime rend malade.
- **`epice` et `releve` ne sont pas la même chose** : le premier dit qu'il y a des
  épices, le second que ça pique. Un tajine aux abricots est épicé sans être relevé.
- **Le générateur connaît dix styles régionaux** (`STYLES_REGIONAUX`). Un style
  n'est pas une cuisine : `cuisine` filtre les briques — aucune n'a eu à être
  réécrite — pendant que `id`, `region` et les tournures portent l'identité.
  **Les styles historiques gardent l'identifiant de leur cuisine**, donc les
  favoris et les plans enregistrés résolvent encore ; les régionaux viennent
  **après** eux dans `STYLES`, parce que la graine des aromates avance au fil des
  styles et que les insérer avant aurait changé le contenu de recettes déjà mises
  en favori.

### Les photos — `outils/photos.mjs` et `public/plats/`

**57 photos, toutes sous licence libre de Wikimedia Commons**, récupérées par
`node outils/photos.mjs`. Ce qui a changé par rapport à la règle « jamais de
photo », c'est la source : Commons n'héberge que du réutilisable. La contrepartie
n'est pas négociable — **l'attribution doit rester affichée** (`CreditPhoto` dans
`Cuisine.tsx`). La retirer ferait passer le projet de l'usage libre à la
contrefaçon.

- **Deux tailles par plat** : 640 px pour la fiche, 320 px dans `mini/` pour la
  liste. Servir la grande dans un carré de 48 px téléchargeait 180 Ko par ligne,
  soit quatre mégaoctets pour un écran de résultats.
- **Le script écarte les titres de préparation** (« ingredients », « bereiding »).
  Sans ce filtre, la carbonade s'était vu attribuer une photo d'oignons crus et
  d'une bouteille de bière : le titre correspondait, l'image promettait un plat
  qu'on n'obtiendrait jamais.
- **Les crédits existants sont relus avant d'être réécrits.** Une exécution
  interrompue — un 429 de Wikimedia — laissait sinon des images sur le disque dont
  l'attribution venait de disparaître du code.
- **Rien n'est préchargé** : le service worker met `/plats/` en cache au fil des
  consultations. Les ajouter à l'installation ferait payer douze mégaoctets à
  quelqu'un qui n'ouvrira jamais la carbonade.

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

**Deux fichiers SQL supplémentaires depuis le 30/07/2026, ni appliqués ni
requis** : `catalogue.sql` (catalogue de recettes à l'échelle) et `foyer.sql`
(partage familial). L'application n'en dépend pas et fonctionne sans eux ; les
installer ne casse rien, mais rien ne les lit encore. Ils s'exécutent **après**
`schema.sql`, dont ils réemploient le trigger `marquer_maj()`. Leur syntaxe a été
validée par un parseur Postgres, **pas leur sémantique** — voir `CUISINE.md`,
section C6, pour ce qui reste à vérifier et pour la règle qui protège les données
de santé dans un foyer.

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

**Une commande, et c'est celle-là :**

```bash
npm run verifier   # tests, contrastes des 8 thèmes, typecheck src + api, build
```

Elle enchaîne, dans cet ordre de coût croissant :

```bash
npm test                          # vitest run — 145 tests sur la logique pure
node outils/palettes.mjs --verifie # sort en 1 si un contraste échoue
npm run build                     # tsc -b (src) && tsc -p tsconfig.api.json && vite build
```

`npm run test:suivi` laisse Vitest en veille pendant qu'on écrit.

### Ce que les tests couvrent, et pourquoi ceux-là

Il n'y a **pas de linter**, et pas de test de composant : ce serait `jsdom`, une
dépendance de plus, et des tests qui cassent au moindre changement de JSX pour
une garantie faible. Ce qui est couvert, ce sont les modules **purs** dont une
erreur produit un écran plausible plutôt qu'une panne — c'est-à-dire ceux où
chaque séance de travail a trouvé des défauts « invisibles au typecheck » :

| Fichier | Ce qui est protégé |
|---|---|
| `aliments/recherche.test.ts` | jetons, préfixes, accents, ligatures ; la base sans doublon |
| `ingredients.test.ts` | cumul des quantités, pluriels en `-x`, fractions, rapprochement des noms |
| `nutriscore.test.ts` | les quatre barèmes, le plafond des protéines, l'indice Mamakilo |
| `nutrition.test.ts` | Mifflin-St Jeor, déficit 20 %, **plancher calorique par sexe** |
| `journal.test.ts` | mise à l'échelle, qualité pondérée par les calories, série de jours |
| `cuisson.test.ts` | durées déduites du texte des étapes, bornes, compte à rebours |
| `ticket/parseur.test.ts` | lots, poids, remises, réparations, **la somme de contrôle** |
| `recettes/catalogue.test.ts` | **le déterminisme des identifiants** |

**Le test du catalogue est le plus important du lot.** Les favoris, les plans de
menus et les listes de courses ne gardent pas des recettes mais leurs
identifiants. Une graine qui bouge dans le générateur ne casse aucun typecheck,
ne lève aucune erreur, et change la recette derrière chaque identifiant déjà
enregistré. C'est la seule régression du projet qui abîmerait les données de
tout le monde en silence.

**Écrire un test, c'est écrire le cas rencontré**, pas une assertion de
couverture. Chaque test du projet cite le défaut qui l'a fait naître ; celui qui
n'en cite aucun aura toujours l'air juste, y compris le jour où il ne prouve
plus rien.

La CI (`.github/workflows/verifier.yml`) rejoue tout sur `push` et sur
*pull request*, avec deux contrôles de plus que le local : **`npm ci`** (Vercel
installe ainsi, et refuse un lockfile désaccordé — c'est le trou qui a laissé
passer la panne du 29/07/2026) et la vérification que `@anthropic-ai/sdk` n'est
pas parti dans le bundle client.

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

### 31 juillet 2026 — Les polices quittent Google

L'application appelait `fonts.googleapis.com` à chaque premier affichage. Le
service worker mettait les réponses en cache, donc l'hors-ligne tenait après une
visite, et le sujet ressemblait à une question de performance. Il n'en était pas
une.

**Une police chargée depuis `fonts.gstatic.com` transmet l'adresse IP du
visiteur à Google.** Une adresse IP est une donnée personnelle, Google devient
alors un destinataire, et `DESTINATAIRES` dans `legal.ts` ne l'a jamais listé —
sur une application qui traite des données de santé, et dont le `CLAUDE.md` pose
que « tout nouveau destinataire se déclare au moment où on l'ajoute au code, pas
après ». Le tribunal régional de Munich a condamné cette intégration en janvier
2022 (LG München I, 3 O 17493/20).

Deux issues : déclarer Google, ou cesser de l'appeler. La seconde était la bonne,
et c'est le geste que le projet avait déjà fait deux fois — le `.wasm` de zxing
et le moteur OCR sont servis depuis notre domaine, pour cette raison écrite noir
sur blanc dans ce fichier.

- **`outils/polices.mjs`** rapatrie les quatre `.woff2` (deux familles, deux
  sous-ensembles) et génère `src/polices.css`. Faustina et Figtree sont sous
  **SIL Open Font License 1.1** : les deux licences vivent dans
  `public/polices/`, et le script refuse de réussir sans elles.
- **Le service worker passe en `mamakilo-v2`** pour purger le cache de polices
  Google des installations existantes, qui n'aurait jamais été remplacé
  autrement.
- **Deux `<link rel="preload">`** pour les sous-ensembles latins, à la place des
  deux `preconnect` et de la feuille de style bloquante.

**Vérifié au pilote sur le build de production**, 390 px : `document.fonts`
donne Faustina et Figtree en `loaded`, les largeurs de texte diffèrent bien de
celles des polices de repli, et les deux `latin-ext` restent en `unloaded` —
c'est la preuve que les `unicode-range` font leur travail. Surtout,
`performance.getEntriesByType('resource')` compte **dix requêtes, zéro vers un
tiers**. Aucune erreur console.

**Un défaut corrigé en vérifiant** : le contrôle de licence du script se
contentait d'un `existsSync`, et avait donc annoncé « licence présente » sur une
page « 404: Not Found » de quatorze octets récupérée depuis une URL périmée. Un
fichier nommé `OFL.txt` qui ne contient pas la licence est pire que pas de
fichier — il fait croire que la question est réglée.

### 31 juillet 2026 — Le filet automatisé

Le projet avait 128 fichiers TypeScript, 7 608 recettes, un OCR, un moteur
nutritionnel — et **aucun test**. C'était le point P2 3.7 de l'`AUDIT.md`, ouvert
depuis le 28/07 et jamais traité pendant que le code triplait de volume. Chaque
entrée de cet historique dit pourtant la même chose : « trois défauts corrigés en
vérifiant, invisibles au typecheck ». Ces défauts-là étaient trouvés à la main,
une fois, par quelqu'un qui savait où regarder.

- **Vitest en dépendance de développement**, `npm audit` toujours à zéro. Pas de
  linter et pas de `jsdom` : le premier discuterait du style, le second ferait
  payer une dépendance pour des tests de JSX qui cassent à chaque retouche.
- **145 tests sur la logique pure**, chacun écrit à partir d'un défaut réellement
  rencontré — le tableau est dans « Vérifier avant de livrer ».
- **`npm run verifier`** aligne Mamakilo sur Cérémonia et GénieLab : une seule
  commande à retenir d'un projet à l'autre.
- **Une CI** qui rejoue tout, plus `npm ci` et le contrôle de non-fuite du SDK
  Anthropic dans le bundle.

**Deux défauts trouvés en écrivant les tests**, tous deux dans le parseur de
tickets, tous deux silencieux :

- **`JAMBON DE PARIS` était lu comme une remise.** `REMISES` contient `'BON DE'`
  pour attraper « BON DE RÉDUCTION », cherché n'importe où dans la ligne — et
  « JAM**BON DE** PARIS » le contient. Le jambon cessait d'être un produit et son
  prix était *retranché* de la ligne du dessus. C'est le piège que le module
  décrit lui-même à propos de « N° DE », sur un motif qui était resté. Les
  mentions de remise se cherchent désormais par mots entiers.
- **Sur `4 X 0,75` sans total imprimé, le prix unitaire était pris pour le prix
  payé.** Le yaourt entrait dans l'historique au quart de son prix — et devenait
  aussitôt son « meilleur prix jamais vu ». Le repli qui devait calculer
  4 × 0,75 était inatteignable : la recherche du total lisait la fin de la ligne
  entière, donc retrouvait toujours le prix unitaire. Elle ne lit plus que ce qui
  **suit** le détail de calcul.

Dans les deux cas le contrôle du total rattrapait le coup — c'est la démonstration
que cette somme de contrôle vaut ce qu'elle promet. Mais elle le rattrapait en
envoyant corriger un ticket parfaitement photographié, sur l'un des libellés les
plus courants d'un supermarché français.

**Une inexactitude légale corrigée** : `REGION_BASE` annonçait Francfort dans la
politique de confidentialité alors que le projet Supabase est en `eu-west-1`,
c'est-à-dire l'Irlande. Les deux sont dans l'Union et rien ne change sur le fond,
mais une mention légale qui nomme la mauvaise ville pour l'hébergement de données
de santé est fausse. **À reconfirmer dans le tableau de bord Supabase**
(Settings → General → Region) : aucun code ne peut la deviner, et le connecteur
MCP servait l'autre projet ce jour-là.

### 31 juillet 2026 — La base d'aliments, le terroir et les photos

Parti d'un signalement de Yann : sa femme cherchait « pomme de terre » et
l'application ne trouvait rien.

**Ce n'était pas une base vide, c'était un bug de recherche.** L'aliment existait
sous le nom « Pommes de terre cuites », et `chercherDansLaBase` comparait des
chaînes brutes : le pluriel du nom suffisait à faire échouer la requête au
singulier. Un utilisateur devait deviner le pluriel, la qualification et l'ordre
des mots du rédacteur de la base. La recherche travaille désormais par jetons,
avec correspondance par préfixe dans les deux sens.

Un second défaut du même ordre a été trouvé **en écrivant le banc d'essai**, pas
en relisant : la normalisation transformait les accents en espaces, donc « pâtes »
devenait « p a tes ». Invisible tant que la requête porte le même accent que le
nom — les deux se déforment pareil — et fatal sur « pates completes » tapé sans
accent, c'est-à-dire exactement la requête qu'on voulait faire aboutir.

- **La base passe de 72 à 2 041 aliments**, avec les plats emblématiques que Yann
  cherchait. Les 72 identifiants d'origine sont conservés.
- **`conseil.ts` sort la base du chemin critique** : le chunk principal retombe de
  141 à 107 Ko compressés. Le coach n'a jamais eu besoin que d'aliments simples.
- **Le catalogue de recettes passe à 7 608**, dont 76 plats du terroir écrits à la
  main — la carbonade flamande en tête — et dix styles régionaux dans le générateur.
- **Quatre axes de filtre** : terroir, type de plat, profil de goût, occasion.
- **57 photos sous licence libre**, en deux tailles, créditées à l'écran.

**Vérifié** en mode démo sur un compte créé pour l'occasion, 390 px, clair et
sombre : « pomme de terre », « patate », « chocolatine », « pâtes complètes » et
« carbonade » répondent dans l'application réelle ; les filtres se cumulent
(7 608 → 207 pour le Nord → 35 en mijoté → 34 en sucré-salé) ; aucune erreur
console ; `npm audit` reste à zéro.

**Trois défauts corrigés en vérifiant**, tous invisibles au typecheck : les
accents mangés par la normalisation, une vignette de 960 px servie dans un carré
de 48 px, et une photo d'ingrédients crus attribuée à la carbonade parce que son
titre contenait le bon mot.

### 30 juillet 2026 — Tickets de caisse et historique de prix

Premier module « Prix ». Yann a demandé une application de courses intelligente ;
j'avais recommandé un projet séparé, **il a tranché pour un module de Mamakilo**,
et ses trois contraintes lui donnent raison : tout gratuit, aucune IA payante,
usage familial. Décisions détaillées dans `PRIX.md`.

- **L'OCR tourne dans le navigateur** (`tesseract-wasm`, 2 paquets, `npm audit`
  toujours à 0). Aucune image ne sort de l'appareil, aucun modèle payant. Le
  moteur et le modèle français sont servis depuis notre domaine, donc mis en
  cache par le service worker : un ticket se photographie dans un magasin sans
  réseau.
- **Le seuillage est adaptatif**, par image intégrale. Un seuil global choisirait
  une valeur unique pour une photo dont l'éclairage varie du simple au triple et
  effacerait la moitié à l'ombre ; l'image intégrale ramène la moyenne locale à
  quatre lectures par pixel, là où la fenêtre naïve demanderait dix milliards
  d'additions.
- **Le ticket est son propre juge** : le total imprimé contre l'addition des
  lignes. C'est ce qui permet de se passer d'un modèle payant sans enregistrer
  une base de prix silencieusement fausse.
- **Les relevés vivent en IndexedDB**, hors du document. Voir « Les prix ».
- **`VERSION_CONFIDENTIALITE` passe au 30/07/2026** — nouvelle catégorie de
  données. L'export emporte les relevés locaux et la suppression les efface :
  sans ça, un choix de stockage amputerait un droit.

**Vérifié** au pilote sur le build de production en mode démo, 390 px, clair et
sombre : deux tickets de deux enseignes lus de bout en bout, addition retombant
au centime sur les totaux imprimés, agrégats contrôlés **dans le document**
(emmental 2,45 € chez Carrefour Market, meilleur 1,89 € chez Aldi, moyenne
2,17 €), et l'écran des prix rendu conforme. Banc d'essai du parseur : 25
contrôles. Contraste minimal mesuré en sombre : 5,24:1. Aucune erreur console.

**Quatre défauts corrigés en vérifiant**, dont deux qu'aucun typecheck ne voit :
le worker émis en IIFE (panne de production pure, sans message d'erreur), un
reste flottant sur les montants, tous les produits au poids marqués douteux à
tort, et une tuile qui comptait les enseignes sur une donnée qui ne le permettait
pas.

### 30 juillet 2026 — Huit thèmes de couleur

L'apparence devient un réglage. Deux axes indépendants — la luminosité (clair /
sombre / **système**) et la couleur (huit thèmes) — plutôt qu'un seul réglage de
seize entrées : « je veux du violet » et « je veux du sombre le soir » sont deux
questions différentes, et la seconde a déjà une réponse automatique.

- **`outils/palettes.mjs` génère `src/palettes.css`**, seize variantes, et
  vérifie tous les contrastes (`--verifie` sort en 1 à la moindre paire sous le
  seuil). Le générateur ne choisit pas des couleurs mais des teintes, puis
  descend la luminosité jusqu'à ce que le rapport passe. C'est ce qui rend
  tenable la règle « toute teinte modifiée se revérifie » à plus de six cents
  paires.
- **Les jetons sont renommés par leur rôle** : `corail`→`primaire`,
  `apricot`→`accent`, `basil`→`reussite`, `berry`→`alerte`. C'est le changement
  qui rend les thèmes possibles — un jeton nommé « corail » qui vaut du bleu en
  thème Océan ment à celui qui le lit. 40 fichiers touchés, presque tous
  mécaniquement.
- **Les couleurs de données ne suivent pas le thème.** `assiette-*`, `nutri-*`,
  `macro-*`, `bande-*` restent déclarées une fois dans `index.css`. La part des
  légumes doit rester verte en thème Agrumes comme en thème Océan : une légende
  qui change avec le goût du jour ne s'apprend pas. L'écran de réglage le dit à
  l'utilisateur plutôt que de le laisser le découvrir.
- **`appliquerApparence()` met aussi `<meta name="theme-color">` à jour.** Sans
  cette ligne, une PWA installée en thème Myrtille garde la barre crème du thème
  d'origine, et la façade se voit à la jointure.
- **Le choix vit dans `localStorage`, pas dans le document de l'utilisateur** :
  l'accueil et la connexion doivent être thémés avant qu'un compte existe, le
  téléphone du soir n'appelle pas le thème du bureau, et un réglage d'affichage
  n'a pas à voyager dans un document qui porte des données de santé. La clé
  `equilibre:theme` garde ses valeurs `clair`/`sombre` : les comptes existants
  ne perdent pas leur réglage.

**Vérifié :** `npm run build` (typecheck `src` et `api`) passe,
`node outils/palettes.mjs --verifie` sort en 0 — 8 thèmes × 2 variantes, tous les
contrastes tiennent, les 16 avertissements portent sur des fonds jamais utilisés.
`@anthropic-ai/sdk` ne fuite pas dans le bundle.

**Vérifié à l'écran** au pilote Playwright sur le build de production en mode
démo, parcours inscription → consentement → onboarding → aujourd'hui → cuisine →
profil, **aucune erreur console** :

- Les **seize combinaisons** contrôlées dans le document : `--primaire`,
  `--ground`, `--surface`, `--ink` et `--accent` diffèrent bien d'un thème à
  l'autre, et **`--assiette-legume` et `--nutri-a` sont identiques partout** —
  la règle des couleurs de données tient, mesurée et pas supposée.
- Le parcours réel d'un clic sur une vignette : `data-theme` posé,
  `equilibre:palette` enregistré, `<meta name="theme-color">` passé à la couleur
  de fond du thème choisi, et le tout retrouvé après rechargement complet.
- Rendu contrôlé en **390 px et 1280 px** — la grille des vignettes passe de 2 à
  4 colonnes — sur Marmite, Océan clair, Encre sombre, Framboise et Myrtille.
  Sur Framboise, la bande « Équilibré » reste bleue et l'icône du garde-manger
  verte au milieu d'un thème rose : c'est la démonstration à l'œil de ce que le
  contrôle des jetons dit en chiffres.
- Aucun reste des anciens noms de jetons dans `src/`. Les seules couleurs
  écrites en dur hors des vignettes sont les tracés du logo dans `Marque` —
  voulu, la marque ne change pas avec le thème.

**Un défaut corrigé en vérifiant** : `<meta name="apple-mobile-web-app-capable">`
seule déclenchait un avertissement à chaque page sur les navigateurs récents. La
balise standard `mobile-web-app-capable` a été ajoutée **à côté**, pas à la
place : l'ancienne est celle que lisent les iOS antérieurs à 16.4, et la retirer
ferait perdre le plein écran sur ces appareils sans que rien ne le signale.

### 30 juillet 2026 — Le catalogue passe à 5 522 recettes (module Cuisine, sprint C7)

Yann a demandé « au moins 5 000 recettes », en citant le batch cooking Weight
Watchers et les recettes de chefs. Le catalogue en compte désormais 5 522 — mais
**aucune ne vient de là**, et c'est un refus assumé : le texte d'une recette est
une œuvre protégée, le système de points de Weight Watchers est une marque, et ce
dépôt est public. Les sources libres examinées et écartées sont listées dans
`CUISINE.md`, point 2.

Ce qui est livré à la place compose à partir de **techniques**, qui
n'appartiennent à personne :

- **`recettes/briques.ts`** : protéines, féculents, légumes, matières grasses,
  aromates, bases du matin — avec valeurs Ciqual, quantités, temps de cuisson par
  technique, affinités de style et régimes garantis.
- **`recettes/generateur.ts`** : dix formats de plat et leurs patrons d'étapes.
  Les calories sont une **somme**, pas une saisie. Les identifiants sont
  déterministes, condition pour que les favoris et les plans y survivent.
- **Perf** : génération paresseuse, étapes calculées à la première lecture,
  affichage plafonné à 24 par moment, trois mémoïsations. Mesuré à l'écran :
  ouverture de Cuisine 501 ms, frappe 35-88 ms, génération de quatre semaines
  151 ms, et l'écran du journal reste à 209 ms — il ne paie pas le catalogue.

**Neuf défauts de langue corrigés en lisant les recettes produites** (accords,
articles, contractions, noms propres, typographie du deux-points) : la liste est
dans `CUISINE.md`. C'est la part du travail qu'aucun typecheck ne fait.

**Et un piège de banc d'essai** : mes premiers chronos englobaient mes propres
`waitForTimeout` et annonçaient 3 262 ms là où le vrai temps était 151 ms.
Mesurer, c'est attendre le résultat, pas un délai.

### 30 juillet 2026 — Ports d'IA et passage à l'échelle (module Cuisine, sprint C6)

Dernier sprint du module « Cuisine, Recettes & Courses ». **Aucun écran** : de
l'architecture, pour que trois décisions futures soient faciles à prendre plutôt
que prises à moitié aujourd'hui. Détails dans `CUISINE.md`, section C6.

- **`src/lib/ia/`** : trois ports (écrire une recette, lire une photo de frigo,
  trouver un remplacement) décrits comme des contrats, avec leurs bouchons.
  Aucun appel réel, aucune dépendance ajoutée.
- **`supabase/catalogue.sql`** et **`supabase/foyer.sql`** : le catalogue à
  l'échelle et le partage familial. **Non appliqués** — le connecteur Supabase
  est en lecture seule, c'est un copier-coller pour Yann. Seule la syntaxe est
  validée, par un parseur Postgres réel.
- **`src/lib/recettes/source.ts`** : l'abstraction de provenance du catalogue,
  avec sa pagination par curseur.

**Trois règles posées ici, à ne pas défaire :** un bouchon ne fabrique jamais de
fausses données (il déclare son indisponibilité) ; aucun port ne reprend le
travail des règles, donc il n'y a ni port de planification ni port d'analyse
nutritionnelle ; et **le partage familial ne touche pas aux données de santé** —
`public.donnees` reste strictement personnelle, le foyer ne porte que le
garde-manger, les courses et les menus.

**Un défaut corrigé avant livraison**, attrapé à la relecture : la colonne
générée de recherche plein texte contenait une sous-requête, que Postgres refuse.
Le copier-coller aurait échoué à la première instruction.

### 30 juillet 2026 — Le mode Cuisine (module Cuisine, sprint C5)

Cuisiner devient un écran à part entière. Décisions détaillées dans
`CUISINE.md`, section C5.

- **`/app/mode-cuisine`, hors du gabarit** : ni barre d'onglets ni rail. On y est
  les mains occupées, et tout ce qui n'aide pas à l'étape en cours est un élément
  à contourner du dos de la main. C'est la première route traitée avant le
  `Cadre` dans `App.tsx`, mais elle reste sous la barrière d'erreur.
- **La séance est enregistrée** (`EtatUtilisateur.cuisine`) : on retrouve la
  recette à l'étape où on l'avait laissée, et un bandeau de reprise le signale
  sur les écrans de cuisine. Une seule structure sert la recette unique et le
  batch cooking.
- **Minuteurs déduits du texte des étapes**, sans annotation ajoutée au
  catalogue, et comptés sur des horodatages absolus — un onglet en arrière-plan
  ferait dériver un compteur décrémenté de plusieurs minutes.
- **Batch cooking** : plusieurs recettes dans une séance, étapes indépendantes,
  et un ordre de démarrage. Les étapes ne sont pas entrelacées : le catalogue ne
  dit pas lesquelles demandent une présence.
- **Écran maintenu allumé** par `Screen Wake Lock`, absence silencieuse là où
  l'API manque.

**Vérifié au pilote Playwright** sur le build de production en mode démo, 390 px
et 1280 px, clair et sombre : minuteur déduit et décompte constaté, étape
retrouvée après rechargement, batch de trois recettes à étapes indépendantes.
Les parcours C2, C3 et C4 rejoués sans régression.

**Un défaut corrigé en vérifiant** : la carte du minuteur recouvrait le bouton
« Étape suivante » en 390 px.

### 30 juillet 2026 — La planification (module Cuisine, sprint C4)

Les menus passent d'une semaine unique à un vrai calendrier. Décisions
détaillées dans `CUISINE.md`, section C4.

- **`plans` remplace `menus`** : plusieurs semaines, une par lundi, `debut`
  faisant office de clé. Les documents existants sont migrés dans `fusionner`
  (interface `ChampsHistoriques`) — la semaine unique devient la première du
  tableau plutôt que d'être perdue.
- **Trois échelles** sur `/app/menus` : jour, semaine, mois. La vue mensuelle ne
  montre pas les plats — illisibles à cette échelle — mais ce qui se décide à
  cette échelle : quelles semaines sont composées, lesquelles sont vides.
- **Génération multi-semaines à mémoire partagée** : sans ce partage, quatre
  semaines générées d'affilée se ressembleraient toutes.
- **Déplacer, copier, modéliser** : glisser-déposer à la souris, déplacement au
  doigt par la fiche du repas (le `dragstart` tactile n'existe pas — les deux
  chemins sont nécessaires), copie d'une journée ou d'une semaine, modèles sans
  dates, semaines préconstruites en jeux de critères.
- **Export `.ics`** (`lib/ics.ts`) : la version livrable de la synchronisation
  d'agendas. Heures locales flottantes, `UID` stables, pliage à 75 octets,
  aucune alarme.

**Vérifié au pilote Playwright** sur le build de production en mode démo, 390 px
et 1280 px, clair et sombre : quatre semaines générées d'un coup, les trois
échelles, copies, échange de repas contrôlé **dans le document** par les deux
chemins, modèle sans dates, et le fichier `.ics` inspecté ligne à ligne. Les
parcours C2 et C3 ont été rejoués sans régression.

**Un défaut corrigé en vérifiant** : cinq boutons empilés en 390 px repoussaient
la semaine sous le pli. Et un piège de banc d'essai noté dans `CUISINE.md` : la
première vérification de l'échange de repas portait sur deux repas identiques,
donc ne prouvait rien.

### 30 juillet 2026 — Les recettes premium (module Cuisine, sprint C3)

Le catalogue cesse d'être une liste de plats pour devenir consultable. Décisions
détaillées dans `CUISINE.md`, section C3.

- **Schéma étendu** : cuisine du monde, difficulté, régimes, substitutions,
  réchauffage, variantes d'appareils. Renseigné pour les 53 recettes.
- **`lib/catalogue.ts`** : tout ce qui se déduit d'une recette plutôt que d'être
  ressaisi — difficulté (gestes *et* temps), régimes, macros d'une part
  (réemploi de `journalRecette.ts`), illustration, quantités pour plusieurs.
- **Recherche multicritère** : texte sur le titre et les ingrédients, moment,
  charge, temps, difficulté, cuisine, régime, étiquettes. Les critères se
  cumulent, et le compte de résultats s'affiche dans la feuille pour dire si le
  filtre suivant va vider l'écran.
- **Favoris** (`EtatUtilisateur.favoris`), des identifiants et non des recettes :
  le catalogue évolue, et recopier une recette figerait la version du jour.
- **Fiche détaillée** : illustration, régimes et leur mise en garde, « je cuisine
  pour » 1/2/4 personnes avec quantités recalculées, macros estimées, ingrédients
  versables dans la liste de courses, substitutions, variantes d'appareils,
  conservation et réchauffage.

**Vérifié au pilote Playwright** sur le build de production en mode démo, 390 px
et 1280 px, clair et sombre : recherche accentuée et ligaturée, filtres cumulés,
favoris contrôlés dans le document et après rechargement, passage à quatre
personnes (« 120 g » → « 480 g » sans que l'énergie par personne bouge), et
versement de la fiche vers les courses. Le parcours C2 a été rejoué en entier,
sans régression.

**Trois défauts corrigés en vérifiant** : l'illustration tirée au hasard dans la
catégorie « protéine » — le chili végétarien s'affichait avec un poisson —, un
dégradé entre deux lavis qui tournait au vert-brun en thème sombre, et une
papillote de dinde illustrée par un poisson parce que la table des pictogrammes
lisait titre et ingrédients d'un seul bloc.

### 30 juillet 2026 — Les courses (module Cuisine, sprint C2)

Deuxième sprint du module « Cuisine, Recettes & Courses ». Les décisions
structurantes sont dans `CUISINE.md`, section C2.

- **`/app/courses`** : liste rangée dans l'ordre du magasin, cochage enregistré
  dans le document, plusieurs listes en parallèle (le marché du samedi et le
  drive de la semaine ne se cochent pas ensemble), historique des listes closes
  et « refaire cette liste ».
- **Verser une semaine de menus ou le placard du plan**, en écartant d'office ce
  que le garde-manger couvre déjà — sans jamais le cacher, et en nommant
  l'article du stock qui a produit la correspondance.
- **Retour de courses** : ce qui est coché entre au garde-manger, avec un
  rangement déduit du rayon et corrigeable ligne à ligne, puis la liste part à
  l'historique. Aucune date n'est inventée.
- **Les ingrédients manquants de `/app/cuisiner` partent sur la liste** : « il
  manque un ingrédient » était un constat, c'est devenu une course à faire.
- **`listeDeCourses` du catalogue et la liste enregistrée partagent la même
  arithmétique**, remontée dans `ingredients.ts` — soixante lignes dupliquées en
  moins, et surtout un seul comportement.

**Vérifié à l'écran** au pilote Playwright sur le build de production en mode
démo, 390 px et 1280 px, clair et sombre, aucune erreur console : versement d'une
semaine de 28 repas, second versement averti, cumul et cochage contrôlés **dans
le document** et après rechargement, retour de courses, historique et copie de
liste.

**Un défaut corrigé en vérifiant** : les pluriels en « -x ». « 1 rouleau » et
« 2 rouleaux » ne se reconnaissaient pas, et la liste affichait « 1 rouleau +
2 rouleaux » au lieu de « 3 rouleaux ».

### 29 juillet 2026 — Le garde-manger (module Cuisine, sprint C1)

Premier sprint du module « Cuisine, Recettes & Courses » demandé par Yann. Le
programme des six sprints est dans `CUISINE.md`.

- **`/app/garde-manger`** : frigo, placards, congélateur. Tableau de bord des
  dates groupé par horizon — date dépassée, aujourd'hui, demain, cette semaine —
  parce que « ce soir » et « dans six jours » n'appellent pas la même décision.
  Ajout au clavier ou au code-barres, en réemployant le scanner et Open Food
  Facts déjà en place plutôt qu'un second chemin.
- **`/app/cuisiner`** : ce que le stock permet, l'anti-gaspillage en tête. Une
  recette dont il manque un ingrédient reste proposée — c'est souvent une
  course à faire, pas un abandon.
- **`ingredients.ts`** sort la normalisation des noms de `listeDeCourses`, qui
  la portait en ligne : les courses, le stock et les recettes rapprochent
  désormais les mêmes noms de la même façon.
- **`Rayon` remonte de `lib/recettes/types.ts` vers `lib/types.ts`** — c'est
  une notion de magasin, dont le garde-manger se sert autant que le catalogue.
  Réexporté à l'ancienne adresse : aucun import existant ne bouge.

Trois défauts corrigés en vérifiant, dont deux que le typecheck ne pouvait pas
voir : « œufs » ne se rapprochait de rien (la ligature `œ` n'a aucune
décomposition Unicode, même en NFKD, et devenait « uf » — trop court pour être
retenu), et la moitié des mots vides ne filtrait plus rien parce qu'ils
n'étaient pas normalisés comme les mots qu'ils devaient écarter.

### 29 juillet 2026 — Poids du chargement, robustesse, mouvement réduit

Trois faiblesses invisibles à l'usage courant, mais réelles.

- **831 Ko de JavaScript en un seul fichier.** Le catalogue de recettes, le
  lecteur de l'export Apple Santé, les jeux et les statistiques étaient
  téléchargés par quelqu'un qui voulait seulement noter son petit déjeuner.
  Les écrans secondaires passent en `lazy()` : le premier affichage tombe de
  228 à 193 Ko compressés, le reste arrive à la demande.
- **Le découpage crée une régression hors ligne** — un écran jamais ouvert n'est
  pas dans le cache du service worker. D'où le préchargement en
  `requestIdleCallback` une fois l'application ouverte : l'usage hors connexion
  redevient complet, et la navigation instantanée. Vérifié : 24 fichiers
  d'écran rapatriés sans aucune navigation.
- **Aucune barrière d'erreur.** Une exception dans un écran laissait une page
  blanche sans issue — sur une PWA installée, sans console, c'est
  indistinguable d'une panne définitive. `BarriereErreur` protège désormais
  l'écran affiché (remontée à chaque route, la navigation restant hors barrière
  pour pouvoir quitter un écran cassé) et toute la coquille dans `main.tsx`.
  Elle reconnaît le cas particulier du fichier d'écran injoignable et le dit
  autrement : ce n'est pas un bogue, c'est un manque de réseau.
- **`prefers-reduced-motion` enfin respecté** par framer-motion, via un
  `<MotionConfig reducedMotion="user">`. Le manque était documenté dans ce
  fichier depuis l'audit sans avoir jamais été corrigé.

**Vérifié au pilote Playwright sur le build de production** (et non sur le
serveur de développement, seul moyen de tester le vrai découpage) : les
quatorze écrans s'affichent sans erreur console, le préchargement rapatrie les
écrans sans navigation, un fichier d'écran coupé avant sa première ouverture
tombe sur le bon message avec la navigation toujours utilisable, et
l'application reste intacte en mouvement réduit.

**À savoir pour tester** : `npm run build` lit le `.env` du projet, donc le
build sert les vraies clés Supabase et l'inscription exige une adresse réelle.
Pour un parcours automatisé, compiler à part —
`VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" npx vite build --outDir dist-demo`
— puis `vite preview --outDir dist-demo`. Penser à supprimer `dist-demo` :
`.gitignore` ne couvre que `dist`.

### 29 juillet 2026 — Statistiques, boucle menus → journal, catalogue étoffé

Trois chantiers demandés ensemble, et l'abandon du sprint 8.

- **`/app/stats`** : tendances sur 7 / 30 / 90 jours — moyenne calorique contre
  repère, graphique jour par jour, macros moyennes, d'où viennent les calories
  par Nutri-Score, régularité sportive, tendance de poids. Tout se recalcule
  depuis le journal ; `stats.ts` ne stocke rien.
  **Les jours sans rien de noté ne sont pas des jours à zéro** et ne comptent
  pas dans les moyennes : les compter ferait passer un week-end oublié pour une
  semaine exemplaire. C'est la règle structurante de cet écran.
- **Verser une recette au journal**, depuis Cuisine et depuis un menu de la
  semaine. Voir la section dédiée pour la répartition des macros.
- **Catalogue porté à 53 recettes** — le manque de déjeuners et de dîners était
  la vraie cause de la répétition dans les semaines générées.
- **Sprint 8 (Stripe) abandonné** (Yann) : la diffusion reste familiale. Le
  régime « éditeur non professionnel » devient l'état durable du site.

**Un défaut corrigé en vérifiant à l'écran** : les barres du graphique ne se
dessinaient pas. Une hauteur en pourcentage sur un enfant dont le parent n'a pas
de hauteur explicite ne se résout pas — le cadre restait vide avec sa seule
ligne de repère. La zone du graphique porte maintenant sa hauteur, et chaque
barre l'occupe entièrement.

**Vérifié au pilote Playwright** en 390 px et 1280 px, clair et sombre, sur un
journal de vingt jours injecté dans le stockage local (deux jours volontairement
vides) : les trois périodes, le compte de jours notés, la tendance de poids, la
hauteur réelle des barres, la fiche d'un repas du planning et son versement au
journal — contrôlé côté données, pas seulement à l'écran : source `recette` et
macros non nulles.

### 29 juillet 2026 — Le coach conversationnel

Le sprint 5, dernière brique fonctionnelle du produit annoncé.

- **`/api/coach`** : fonction Node, `claude-opus-5` à effort bas, consigne qui
  borne le rôle (ni médecin ni diététicien, renvoi vers un professionnel dès
  qu'il est question de maladie, de traitement, de grossesse ou d'un enfant,
  jamais de conseil sous 1 200 kcal, jamais de reproche).
- **`/app/coach`** : conversation persistée dans le document, amorces adaptées
  à la journée, avertissement permanent sur ce que le coach n'est pas.
- **Un consentement propre au coach**, détaillé plus haut. C'est la décision
  structurante du sprint : envoyer un journal alimentaire à un tiers est une
  finalité distincte de le conserver, et elle se refuse sans rien perdre.
- **Les règles de `coach.ts` n'ont pas bougé.** Le modèle répond aux questions,
  il ne reprend pas les analyses chiffrées.

**Vérifié à l'écran** avant livraison, au pilote Playwright, en 390 px et
1280 px, thèmes clair et sombre : accord refusé puis donné, amorce, réponse
(l'API étant simulée — la fonction serverless n'existe pas sous Vite), question
tapée, erreur 503, retrait de l'accord depuis le profil qui referme bien le
coach, déclaration du coach sur `/confidentialite`. Contrôlé aussi que le
contexte envoyé porte le profil et l'objectif **sans** les coordonnées du
praticien, et que `@anthropic-ai/sdk` ne fuite pas dans le bundle.

**Reste à faire :** `ANTHROPIC_API_KEY` n'est toujours pas dans Vercel — tant
qu'elle manque, le coach et le scan photo répondent 503 et le disent.

### 29 juillet 2026 — Menus de la semaine et activité physique

Le sprint 4, et la fin du dernier trou fonctionnel du socle : l'application ne
savait rien du sport, ni type, ni écran, ni stockage.

- **`/app/sport`** : catalogue de 26 activités rangées par famille, durée,
  intensité ressentie, dépense estimée. Barres de la semaine, série de jours
  consécutifs, part du repère de l'OMS (150 min). Le détail des conventions de
  calcul est dans « Les limites, à ne pas maquiller dans l'interface ».
- **Le sport agrandit le budget du jour**, intégralement, comme le fait
  MyFitnessPal. `Aujourdhui.tsx` ajoute le bonus à l'objectif **avant** de
  calculer quoi que ce soit : la jauge, les analyses par repas et la
  recommandation doivent voir le même chiffre que celui affiché en haut, sinon
  les conseils contrediraient le nombre.
- **`/app/menus`** : sept jours composés depuis le catalogue, en visant la
  cible calorique de chaque repas, avec report borné à 200 kcal d'un repas sur
  le suivant. Hors-saison pénalisé plutôt qu'exclu — à trente recettes,
  exclure laisserait des créneaux vides, et une grille trouée est pire qu'une
  soupe de courge en avril. Chaque repas se remplace à la main ; la liste de
  courses suit.
- **La liste de courses additionne enfin.** La juxtaposition d'origine
  (« on note les deux quantités plutôt que d'inventer une addition entre
  1 CàS et ½ ») restait juste, mais sur 28 repas elle donnait
  « 1 + ¼ + 1 + ½ + ½ + ½ », illisible au rayon. `listeDeCourses` cumule
  désormais les termes d'unité comparable, où qu'ils soient dans la ligne, et
  juxtapose le reste. Les noms sont rapprochés au pluriel près, mot à mot :
  « Carotte » et « Carottes » faisaient deux lignes à cocher. Ce qui n'est pas
  comparable le reste : « 50 g cru » et « 60 g crues » ne s'additionnent pas,
  l'écart de forme cache un écart d'état.

**Les deux écrans sont hors onglets**, atteignables depuis « Raccourcis » du
profil, depuis Aujourd'hui pour le sport et depuis Cuisine pour les menus. La
barre est déjà pleine à cinq entrées ; une sixième sortait de l'écran en
390 px, défaut déjà corrigé une fois.

**Vérifié à l'écran** avant livraison, au pilote Playwright : inscription →
consentement → onboarding → séance de sport → report du bonus sur Aujourd'hui →
génération d'une semaine → remplacement d'un repas → liste de courses →
cuisine → profil, en 390 px et 1280 px, thèmes clair et sombre, aucune erreur
console. Un défaut corrigé à ce moment-là : changer de famille d'activité ne
déplaçait pas la sélection, si bien qu'aucun bouton n'apparaissait actif et que
l'activité enregistrée restait celle de la famille précédente.

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
