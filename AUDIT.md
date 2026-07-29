# Audit technique — Équilibre / di-t-ticien

> Ce document garde le nom du produit au jour de l'audit. L'application
> s'appelle **Mamakilo** depuis le 29 juillet 2026 ; réécrire un constat daté
> lui ferait dire autre chose que ce qui a été observé.

**Date :** 28 juillet 2026
**Périmètre :** `EDL-Yhnguyen/di-t-ticien`, commit `8776238`
**Méthode :** lecture du code source, du schéma SQL, de la configuration de
déploiement et de l'historique Git. Aucune supposition d'architecture.

---

## Avertissement de cadrage

Le brief de mission décrit une application Next.js avec `NEXT_PUBLIC_*`,
middleware, `npm run lint` et `npm run test`. **Aucun de ces éléments n'existe
dans ce dépôt.** Le projet est une SPA Vite. Le présent audit porte sur le code
réel ; les recommandations sont formulées pour la stack effectivement en place.

---

## 1. Architecture actuelle

### Frontend

SPA Vite 8 / React 19.2 / TypeScript 7 / Tailwind CSS 4. Cinq dépendances de
production seulement : `react`, `react-dom`, `@supabase/supabase-js`,
`framer-motion`, `lucide-react`.

Le **routeur est écrit à la main** (`src/lib/router.tsx`, ~70 lignes) :
`pushState` / `replaceState` + écoute `popstate`. L'enregistrement des routes
est un `switch` exact dans `App.tsx` → `ecranPour(chemin)`. Il n'y a **pas de
segments dynamiques** : une route `/app/recette/:id` demande de modifier cette
fonction.

Le **service worker est écrit à la main** (`public/sw.js`, ~80 lignes).

### Backend

**Il n'y en a pas.** Aucune route d'API, aucun serveur. L'application est
entièrement cliente. Supabase fournit l'authentification et la base.

C'est le point structurant pour la suite : **le coach IA et Stripe sont
impossibles en l'état**, une clé d'API ne pouvant pas vivre dans un bundle
navigateur.

### Base de données

Une seule table :

```sql
public.donnees (
  user_id uuid primary key references auth.users(id) on delete cascade,
  contenu jsonb not null default '{}'::jsonb,
  maj_le  timestamptz not null default now()
)
```

Un document JSON par compte, contenant profil, pesées, journal des repas, eau,
envies, badges et scores. Le choix est assumé et documenté : volume minuscule,
rien à agréger côté serveur, et surtout **une seule règle de sécurité à
vérifier**.

Row level security activée, quatre politiques (`select` / `insert` / `update` /
`delete`), toutes en `auth.uid() = user_id`. Un trigger `donnees_maj` tient
`maj_le` côté base.

### Authentification

`src/lib/auth.ts` expose une API unique avec deux implémentations :

- **Supabase** : `signUp`, `signInWithPassword`, `signOut`, `getUser`,
  `updateUser`.
- **Démo (navigateur)** : comptes dans `localStorage`, mot de passe dérivé en
  **PBKDF2, 150 000 itérations, SHA-256**, sel aléatoire de 16 octets via Web
  Crypto. Jamais de mot de passe en clair, même en mode démo.

Les identifiants sont des **pseudos** convertis en `pseudo@equilibre.local`.

### État applicatif

`src/context/AppContext.tsx` est le point d'écriture unique :

```ts
modifier: (recette: (brouillon: EtatUtilisateur) => void) => void
```

`structuredClone` de l'état précédent → application de la recette mutative →
évaluation des badges → `enregistrer()` avec un debounce de 400 ms, vidé sur
`pagehide`.

### Hébergement

Vercel. `vercel.json` : réécriture SPA vers `/index.html`, `sw.js` en
`max-age=0, must-revalidate`, `assets/*` en `immutable` un an. Chaque push sur
`main` redéploie.

---

## 2. Points positifs

Le socle est de bonne qualité. À conserver :

1. **Discipline de dépendances.** Cinq dépendances de production. Le routeur et
   le service worker maison évitent des centaines de dépendances transitives et
   une file d'avis de sécurité à suivre. `npm audit` à zéro était le critère de
   choix.
2. **RLS correctement écrite.** Quatre politiques explicites plutôt qu'une
   politique `for all` fourre-tout. La fonction trigger est `security definer`
   **avec `set search_path = ''`** — c'est la protection contre le détournement
   de `search_path`, et elle est souvent oubliée.
3. **Le mode démo partage exactement le même code applicatif.** On développe et
   on teste sans réseau, sans compte, sans configuration. Rare et précieux.
4. **Hachage sérieux même en mode démo.** PBKDF2 150 k itérations là où
   beaucoup se contenteraient d'un `btoa`.
5. **`fusionner()` est une vraie migration ascendante.** Un document créé avant
   l'ajout d'un champ se complète tout seul au chargement.
6. **Badges entièrement déclaratifs.** `atteint(etat) => boolean` : ajouter un
   badge ne touche rien d'autre.
7. **Palette validée, pas choisie à l'œil.** Les trois parts de l'assiette se
   touchent, donc chaque paire doit rester distinguable en vision daltonienne.
   Le réflexe naturel vert + orange voisins tombait à ΔE 5,1 en protanopie,
   très en dessous du seuil de 8. Ce niveau de rigueur est inhabituel.
8. **Accessibilité prise au sérieux** : `aria-label` sur les boutons-icônes,
   `aria-pressed`, `role="tab"` + `aria-selected`, bloc `prefers-reduced-motion`
   qui neutralise toutes les animations.
9. **Commentaires qui expliquent le pourquoi**, jamais le quoi.
10. **Aucun secret n'a jamais été commité.** `.env` est absent de tout
    l'historique Git ; le seul fichier suivi mentionnant `service_role` est le
    README, qui dit précisément de ne pas le committer.

---

## 3. Problèmes techniques

### P0 — À traiter aujourd'hui

**3.0 · Données personnelles d'une tierce personne publiées en clair**

`src/pages/PagePlan.tsx:8-14` :

```ts
const DIETETICIENNE = {
  nom: 'Julie Bertolotto',
  role: 'Diététicienne-nutritionniste',
  email: 'julie.bjdietetique@gmail.com',
  telephone: '07 58 21 19 08',
  suivi: 'https://diet.alivio.fr/0cc63c63-86df-4f6c-946d-f0654f6a56f3',
}
```

L'URL de suivi est dupliquée dans `src/pages/Profil.tsx:22`.

Ces données sont dans un **dépôt public**, dans **l'historique Git**, et dans le
**bundle JavaScript servi à tout visiteur** de https://di-t-ticien.vercel.app.
Il s'agit de :

- l'identité complète d'une professionnelle de santé qui n'est pas
  l'utilisatrice du produit et n'a rien consenti,
- son numéro de téléphone, vraisemblablement personnel,
- une **URL de dossier de suivi avec UUID** — un lien de ce type tire toute sa
  sécurité de son caractère non devinable. Publié, il ne protège plus rien.

L'adresse postale d'Élodie avait été délibérément tenue hors du code parce que
le dépôt est public. La même précaution n'a pas été appliquée ici.

*Actions :*
1. ✅ **Fait.** Le bloc est sorti du code : les coordonnées d'un praticien sont
   désormais un champ du profil utilisateur (`profil.praticien`), saisi par
   chacun et protégé par la RLS. Vérifié absent du bundle construit.
2. ⏳ Redéployer pour purger le bundle en production.
3. ⏳ **Le lien Alivio est à considérer comme compromis** : demander sa rotation
   à la praticienne. C'est la seule mesure encore efficace.
4. ✅ **Décidé (Yann, 28/07/2026) : l'historique Git n'est pas réécrit.** Le
   dépôt reste public et le bloc reste lisible via `git log -p`. Risque assumé.
5. ⏳ Prévenir la personne concernée.

**3.0 bis · N'importe qui peut prendre le compte « Élodie »**

`src/lib/auth.ts:142-144` et `157-159` : taper `ELO` / `ELO` sur la page de
connexion **crée le compte à la volée s'il n'existe pas**, ou y entre s'il
existe. Le changement de mot de passe forcé (`App.tsx:43`) protège le premier
arrivé — pas la propriétaire légitime. Le site accepte les inscriptions
publiques et l'identifiant est documenté dans le README.

**3.0 ter · Écritures perdues en silence**

`src/context/AppContext.tsx:77` et `:91` :

```ts
void enregistrer(suivant.profil.id, suivant)
```

Le `void` jette la promesse. `store.ts:104` lève en cas d'échec (RLS, réseau,
session expirée) et **personne n'attrape** : un `unhandledrejection` en console,
rien à l'écran. Il n'existe ni état d'erreur de synchronisation, ni nouvelle
tentative, ni file d'attente hors ligne.

L'interface a déjà appliqué le changement en mémoire : l'utilisatrice voit sa
case cochée et croit ses données enregistrées. **C'est le défaut le plus grave
du code** — perte silencieuse de données de santé.

**3.0 quater · Écran de chargement infini**

`src/context/AppContext.tsx:41-49` : l'IIFE asynchrone du chargement initial
n'a aucun `catch`. Si `charger()` lève, `setChargement(false)` n'est jamais
atteint et `App.tsx:34` affiche « Ouverture » indéfiniment, sans issue ni
bouton de secours.

**3.0 quinquies · Déconnexion systématique hors ligne**

`src/lib/auth.ts:180` appelle `supabase.auth.getUser()`, qui fait un appel
réseau. Hors ligne, il échoue, renvoie `null`, et l'application affiche la page
publique alors qu'une session valide dort dans `localStorage`.
`getSession()` — lecture purement locale — est l'appel correct au démarrage.

C'est une PWA installable, vendue comme fonctionnant hors connexion. Elle
déconnecte l'utilisateur dès qu'il perd le réseau.

**3.0 sexies · Le cache du service worker n'est jamais invalidé**

`public/sw.js:10` : `VERSION = 'equilibre-v1'`, constante figée, jamais dérivée
du build. L'étape `activate` (`22-31`) ne supprime que les caches dont la clé
ne commence pas par `VERSION` — comme la version ne change jamais, **aucun
asset périmé n'est jamais purgé** et le cache accumule les bundles de tous les
déploiements successifs.

Aggravant, `sw.js:49` : `cache.put('/', copie)` écrit la réponse de *n'importe
quelle* URL de navigation sous la clé `/`, sans vérifier `reponse.ok`. Une
erreur 500 ou une page d'erreur Vercel devient la coquille hors ligne, ensuite
resservie à tous.

Enfin, `skipWaiting()` + `clients.claim()` sans que `main.tsx:21-27` n'écoute
`updatefound` ni `controllerchange` : **aucun mécanisme « nouvelle version
disponible »**. Un onglet PWA laissé ouvert ne se met jamais à jour.

---

### P0 — Bloquants (authentification)

**3.1 · La création de compte Supabase échoue — deux causes possibles**

*Cause A, la plus probable.* Les identifiants deviennent
`pseudo@equilibre.local`, un domaine non routable. Si *Confirm email* est actif
(c'est le **défaut** Supabase), l'inscription déclenche l'envoi d'un lien de
validation. L'envoi échoue, Supabase renvoie une erreur, et **aucune ligne
n'est créée dans `auth.users`**. Symptôme exact : « les utilisateurs ne se
créent pas malgré la présence des clés ».

*Cause B.* Variables ajoutées sur Vercel **sans redéploiement**. Les `VITE_*`
sont lues à la compilation : les ajouter ne suffit pas. Le site reste en mode
démo et écrit dans `localStorage` — donc Supabase reste vide, sans erreur.

**3.2 · Le mode démo est signalé, mais pas là où on le remarque**

`modeDemo` est bien consommé : `Connexion.tsx:112` l'affiche au moment de se
connecter, et `Profil.tsx:174` explique clairement dans « Vos données » que
tout reste sur l'appareil. C'est mieux que la plupart des projets — le point
initial de cet audit était erroné et est corrigé ici.

L'angle mort restant est le **suivi quotidien** : `Aujourdhui.tsx` et
`Poids.tsx`, où l'utilisateur saisit ses données jour après jour, ne rappellent
rien. Quelqu'un qui a vu le message une fois à l'inscription pèse ensuite trois
mois de données dans le `localStorage` d'un seul navigateur sans y repenser.

Correctif proportionné : un bandeau discret et permanent en mode démo sur les
écrans de saisie, pas un simple message d'accueil.

**3.3 · `signUp` peut réussir sans ouvrir de session**

`auth.ts:104-111` : avec *Confirm email* actif, `signUp` renvoie un `data.user`
mais `data.session` est `null`. Le code retourne un `Utilisateur` valide, donc
l'application considère l'utilisateur connecté — mais il n'y a pas de JWT. La
RLS refuse alors le premier `upsert` sur `donnees`, et l'erreur remonte en
« Enregistrement impossible ». Le compte existe, l'application est inutilisable.

**3.4 · Rallonge de mot de passe en dur dans un dépôt public**

`auth.ts:22` : `const RALLONGE = '·équilibre·'`. Tout mot de passe de moins de
6 caractères est complété avec cette constante pour satisfaire Supabase.
`ELO` devient donc `ELO·équilibre·`, dans un dépôt public. Le README l'assume
et impose un changement de mot de passe à la première connexion — acceptable
pour un compte de démonstration, **à supprimer pour un produit destiné au
marché**.

**3.5 · Aucune récupération de mot de passe**

Aucun flux de réinitialisation. Un mot de passe oublié se règle aujourd'hui
depuis le tableau de bord Supabase, à la main. Rédhibitoire en grand public.

### P1 — Conformité (données de santé)

**3.6 · RGPD : le compte n'est pas gouvernable**

Un journal alimentaire et des pesées sont des **données de santé** (art. 9
RGPD) : leur traitement exige un **consentement explicite**. Manquent
aujourd'hui :

- consentement au premier lancement,
- politique de confidentialité et mentions légales,
- **export des données** (art. 20, portabilité),
- **suppression du compte** (art. 17, effacement).

La suppression est techniquement triviale — `on delete cascade` est déjà en
place sur `donnees.user_id`. Il manque le bouton et l'appel.

### P2 — Dette technique

**3.7 · Aucun filet automatisé.** Ni linter, ni test, ni CI. Le seul contrôle
est `tsc -b && vite build`. Toute régression fonctionnelle passe.

**3.8 · Régression sur `.env.example`.** Le commit `8776238` l'a supprimé alors
que le README demande toujours de le copier — vraisemblablement un `mv` au lieu
d'un `cp` lors de la création du `.env` local. *(Corrigé pendant cet audit.)*

**3.9 · Pas de découpage du bundle.** Mesuré au build du 28/07/2026 :

```
dist/assets/index-*.css    35,58 kB │ gzip:   7,34 kB
dist/assets/index-*.js    638,53 kB │ gzip: 186,76 kB
```

Un seul fichier JavaScript, chargé intégralement à la première visite — y
compris des écrans lourds et rarement ouverts (`Jeux.tsx`, `Envies.tsx`) et
`framer-motion`. Sur un téléphone en 4G moyenne, c'est environ une seconde de
téléchargement avant le premier rendu, pour du code majoritairement inutilisé.

Le découpage par route est immédiat une fois `ecranPour()` converti en
`React.lazy` + `<Suspense>`, et se combine bien avec l'ajout des futurs écrans
(sport, coach, scanner) qui alourdiraient sinon le même fichier.

**3.10 · Le routeur ne gère pas les segments dynamiques.** Le `switch` compare
des chemins exacts. Toute page de détail (`/app/recette/:id`,
`/app/seance/:id`) demande de faire évoluer `ecranPour()`.

### P3 — Produit

- Catalogue limité à **8 recettes**.
- **Aucune notion d'activité physique** : ni type, ni écran, ni stockage.
- **Aucun suivi de macronutriments.** Seulement des kcal estimées par portion ;
  ni protéines, ni glucides, ni lipides.
- Aucune base alimentaire, aucune recherche d'aliment, aucun scanner.
- Aucun assistant conversationnel.
- Aucune notification.
- L'assiette au centre de l'écran principal est un parti pris fort issu de
  l'ordonnance d'origine ; il ne convient pas à une cible grand public
  multi-objectifs (perte de poids, prise de muscle, maintien).

---

## 4. Fonctionnalités manquantes

| Module visé | État actuel | Écart |
|---|---|---|
| 1 · Profil intelligent | Prénom, âge, taille, poids, sexe, activité | Photo, objectif typé, habitudes, préférences, allergies, régime, macros calculées |
| 2 · Dashboard | Écran « Aujourd'hui » centré sur l'assiette | Jauges macros, conseil IA du jour, refonte visuelle |
| 3 · Suivi des repas | Cases à cocher sur des composants du plan | Aliments réels, recherche, base alimentaire, favoris, macros par repas |
| 4 · Scanner | — | Architecture photo + code-barres, alternatives produit |
| 5 · Recettes IA | 8 recettes statiques | Catalogue fourni, photos, macros, générateur par calories restantes |
| 6 · Coach IA | — | **Nécessite un backend** — impossible en l'état |
| 7 · Sport | — | Tout est à créer |
| 8 · Statistiques | Courbe de poids | Régularité, moyennes caloriques, atteinte d'objectifs |
| 9 · Notifications | — | Push PWA + permissions |
| 10 · Design premium | Base soignée et cohérente | Refonte du dashboard, jauges, graphiques, plus de couleur |

---

## 5. Architecture cible recommandée

### Rester sur Vite, ajouter `/api`

Migrer vers Next.js coûterait un sprint entier à fonctionnalité constante
(routeur, layout, rendu) pour un gain nul sur ce produit : l'application est
100 % cliente et installable. **Vercel exécute des fonctions serverless depuis
un dossier `/api` à la racine, y compris sur un projet Vite.** C'est tout ce
qui manque.

```
/api
  coach.ts        POST — conversation IA en streaming (clé serveur)
  scanner.ts      POST — analyse photo / code-barres
  stripe/
    checkout.ts   POST — création de session de paiement
    webhook.ts    POST — réception des événements Stripe
```

La clé d'API reste dans les variables d'environnement Vercel **sans préfixe
`VITE_`** — elle n'entre donc jamais dans le bundle.

### Modèle de données : hybride, pas 11 tables

Le document `jsonb` actuel est le bon outil pour l'état applicatif chaud (un
seul lecteur, un seul écrivain, jamais agrégé). Le casser en onze tables
relationnelles ajouterait onze politiques RLS à maintenir pour zéro bénéfice.

**Garder `donnees`** pour : profil, pesées, journal, eau, envies, badges,
scores, menus, activités.

**Ajouter des tables uniquement là où le relationnel apporte quelque chose :**

| Table | Pourquoi elle doit être relationnelle |
|---|---|
| `aliments` | Base alimentaire partagée, en lecture par tous, indexée pour la recherche plein texte. N'appartient à aucun utilisateur. |
| `conversations_ia` | Historique de conversation : croissance non bornée, à paginer et à purger indépendamment de l'état. |
| `abonnements` | Écrit par le **webhook Stripe** avec la clé `service_role`, lu par l'utilisateur. Séparation de responsabilité obligatoire — un utilisateur ne doit jamais pouvoir écrire son propre niveau d'abonnement. |
| `consentements` | Traçabilité RGPD : horodatage, version du texte accepté. Doit être immuable. |

C'est le minimum qui justifie une table. Tout le reste reste dans le document.

---

## 6. Roadmap recommandée

| Sprint | Contenu | Sort du blocage |
|---|---|---|
| **1** | Mémoire projet, audit, correction Supabase, RGPD minimal (export + suppression + consentement), CI GitHub Actions | Comptes fonctionnels, conformité de base |
| **2** | Profil enrichi (objectifs, habitudes, préférences, allergies) + calcul des macros + refonte du dashboard | L'assiette cesse d'être l'unique grille de lecture |
| **3** | Suivi des repas réels : base alimentaire, recherche, favoris, macros par repas | Le produit devient un vrai tracker |
| **4** | Catalogue de recettes fourni + planificateur de menus + module sport | Le contenu qui manque aujourd'hui |
| **5** | `/api/coach` — assistant conversationnel en streaming, avec profil et historique en contexte | Premier module nécessitant le backend |
| **6** | Scanner photo et code-barres | |
| **7** | Statistiques, notifications, finitions design | |
| ~~**8**~~ | ~~Stripe, niveaux FREE / PREMIUM / COACH, limitations~~ | **Abandonné** (Yann, 29/07/2026) |

**Le sprint 8 est abandonné.** L'application reste en diffusion familiale et
aucune monétisation n'est prévue. C'est ce qui rend durable le régime
« éditeur non professionnel » des mentions légales — voir `CLAUDE.md`.

**Ordre imposé par les dépendances :** le sprint 1 débloque tout le reste
(sans comptes fiables, rien n'est testable en conditions réelles). Le sprint 5
ne peut pas précéder la mise en place de `/api`.
