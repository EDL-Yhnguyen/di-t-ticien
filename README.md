# Mamakilo

> *Bien manger, vivre mieux.*

Site web et application mobile de suivi diététique. Une seule base de code : le
site **est** l'application — installable sur iPhone et Android depuis le
navigateur, sans passer par l'App Store.

L'application s'est d'abord appelée **Équilibre**. Le nom a changé le
29 juillet 2026 ; les clés de stockage du navigateur et le domaine des pseudos
(`@equilibre.local`) portent encore l'ancien, volontairement — les renommer
déconnecterait les comptes existants.

L'écran principal est une assiette, pas un compteur de calories. C'est le langage
de l'ordonnance dont part le projet : une diététicienne ne prescrit pas des
grammes, elle prescrit « un beau quart d'assiette de féculents » et des
« légumes à volonté ». Les calories sont affichées en secondaire, à titre
indicatif.

## Démarrer

```bash
npm install
```

```bash
npm run dev
```

L'application tourne alors sur http://localhost:5173 **sans aucune
configuration** : les comptes et les données restent dans le navigateur. C'est
le mode démo, suffisant pour développer et essayer.

## Le compte d'Élodie

Identifiant `ELO`, mot de passe `ELO`. Le compte est créé automatiquement à la
première connexion, avec son plan et ses mesures déjà renseignés (71 kg,
objectif 61 kg, profil sédentaire).

L'application impose ensuite le choix d'un vrai mot de passe. C'est
volontaire : le site accepte les inscriptions publiques, et `ELO` se devine en
une seconde. Ses pesées et son journal alimentaire sont des données de santé.

## Passer en mode synchronisé

Le mode démo ne synchronise rien entre appareils. Pour qu'Élodie retrouve ses
données sur son téléphone **et** sur l'ordinateur :

1. Créez un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Ouvrez le **SQL Editor** et exécutez le contenu de
   [`supabase/schema.sql`](supabase/schema.sql).
3. **Désactivez la confirmation par e-mail** — voir l'encadré ci-dessous, sans
   ça aucune connexion ne fonctionnera.
4. Dans **Settings → API Keys**, copiez l'URL du projet et la clé `anon public`.
5. Copiez `.env.example` en `.env` et collez-y les deux valeurs.
6. Relancez `npm run dev`.

L'application détecte les clés au démarrage et bascule seule. Aucune autre
modification n'est nécessaire — les deux modes partagent le même code.

> **La confirmation par e-mail doit être désactivée.**
> Dans **Authentication → Sign In / Providers → Email**, décochez
> _Confirm email_.
>
> Supabase l'active par défaut : à l'inscription, il envoie un lien de
> validation et refuse la connexion tant qu'il n'est pas cliqué. Or les
> identifiants d'ici sont des pseudos, pas des adresses — `ELO` devient
> `elo@equilibre.local`, une adresse qui ne reçoit rien. Le lien n'arriverait
> jamais et le compte resterait bloqué.
>
> C'est un choix assumé : cette application n'envoie aucun e-mail, donc elle ne
> propose pas non plus de récupération de mot de passe. Un mot de passe oublié
> se réinitialise depuis le tableau de bord Supabase, dans
> **Authentication → Users**.

> La clé `anon` est faite pour être publique. Ce qui protège les données, c'est
> la _row level security_ activée par le script SQL : chaque compte ne peut lire
> et écrire que sa propre ligne. Ne mettez jamais la clé `service_role` dans un
> fichier `.env` de front-end.

## Mettre en ligne

Sur [vercel.com](https://vercel.com), importez le dépôt GitHub. Vercel détecte
Vite tout seul. Ajoutez les deux variables `VITE_SUPABASE_URL` et
`VITE_SUPABASE_ANON_KEY` dans **Settings → Environment Variables**, puis
redéployez.

> Les variables `VITE_*` sont lues à la compilation, pas à l'exécution : les
> ajouter ne suffit pas, il faut **relancer un déploiement** pour qu'elles
> entrent dans le fichier livré. Sans ça le site reste en mode démo.

Chaque `git push` redéploie ensuite automatiquement.

### Installer l'application sur un téléphone

Ouvrir le site dans le navigateur, puis :

- **iPhone** — bouton Partager, puis « Sur l'écran d'accueil ».
- **Android** — menu ⋮, puis « Installer l'application ».

Une icône apparaît sur l'écran d'accueil et l'application s'ouvre en plein
écran, sans barre d'adresse. Elle fonctionne hors connexion.

## Ce que contient l'application

| Écran       | Ce qu'on y fait                                                                  |
| ----------- | -------------------------------------------------------------------------------- |
| Aujourd'hui | Cocher les composants de chaque repas, remplir l'assiette, suivre l'hydratation   |
| Poids       | Enregistrer une pesée, lire la tendance, voir la date d'arrivée estimée           |
| Envies      | Bouton d'urgence anti-grignotage, minuteur de 10 min, journal des déclencheurs    |
| Cuisine     | Recettes calées sur le plan, liste de courses générée par rayon                   |
| Jeux        | Mémo, quiz nutrition, respiration guidée — trois minutes de diversion             |
| Profil      | Mesures, thème, option Herbalife, lien vers le suivi Alivio                       |

## Notes techniques

- **Vite + React + TypeScript + Tailwind v4.** Pas de framework serveur :
  l'application est entièrement cliente, Supabase fournit l'authentification et
  la base.
- **Le routeur est écrit à la main** (`src/lib/router.tsx`, 70 lignes). Les
  bibliothèques du marché apportaient ici un framework de chargement de données
  inutilisé et une file d'avis de sécurité à suivre, pour trois fonctions.
- **Le service worker aussi** (`public/sw.js`). Cela évite une centaine de
  dépendances transitives pour une mise en cache qui tient en 80 lignes.
- **`npm audit` doit rester à zéro vulnérabilité.** C'était le critère de choix
  des dépendances.
- **La palette vient du logo, mais aucune de ses couleurs n'est reprise telle
  quelle.** Le corail de la marmite (`#f67a5e`) ne tient que 2,4:1 sur blanc : il
  reste réservé à l'illustration, et `--corail` en est la version portante,
  assombrie jusqu'à 4,5:1 dans tous ses usages réels. Les 23 paires de jetons ont
  été vérifiées au calcul avant d'être retenues.
- **Les couleurs de l'assiette sont validées, pas choisies à l'œil.** Les trois
  parts se touchent, donc chaque paire doit rester distinguable en vision
  daltonienne. Le réflexe naturel — vert et orange voisins — tombait à ΔE 5,1 en
  protanopie, très en dessous du seuil de 8. Les valeurs retenues sont
  documentées dans `src/index.css` ; les modifier demande de revérifier.

## Avertissement

Mamakilo n'est pas un dispositif médical. Les plans générés pour les nouveaux
comptes sont des repères calculés (Mifflin-St Jeor, déficit de 20 %, plancher à
1 200 kcal), pas une prescription. Le plan d'Élodie, lui, est reproduit tel quel
depuis l'ordonnance de sa diététicienne et n'est jamais recalculé par
l'application.
