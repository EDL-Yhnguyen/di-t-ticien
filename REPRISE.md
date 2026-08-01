# Reprise — Mamakilo

Dernière séance : 2026-08-01 · dernier commit : *les données protégées par
construction, et `fusionner` rendue éprouvable*

> **Rien n'est poussé.** La branche est en avance de neuf commits sur
> `origin/main`, dont deux d'un autre chantier. Un push redéploie la production ;
> il attend une validation de Yann.
>
> **Un arbitrage attend aussi**, décrit dans `CLAUDE.md`, section « Ce qui attend
> un arbitrage » : `ouvertLe` déclenche une alerte *sanitaire* sur toute
> l'épicerie, donc « à jeter » sur un paquet de pâtes ouvert depuis huit jours.

## Où on en est

**Le parcours « mot de passe oublié » est écrit, buildé et commité — mais il ne
délivre encore aucun message.** Deux réglages de console manquent, tous deux
décrits dans `docs/email.md` : aucun SMTP n'est branché sur le projet
`vdnfqijjmuxdrimbyyrv` (donc 2 messages par heure, le plafond du service
intégré), et les URL de retour ne sont pas autorisées (donc le lien ramènerait
sur la Site URL sans la moindre erreur).

Le code se comporte correctement dans les deux cas : il n'invente pas de succès.
Mais tant que ces deux réglages ne sont pas faits, un utilisateur qui demande un
lien ne reçoit rien.

### Second chantier de la même journée — le filet automatisé

Mené en parallèle par une autre session, **livré et commité**. Le projet avait
128 fichiers TypeScript et aucun test ; c'était le point P2 3.7 de l'`AUDIT.md`,
ouvert depuis le 28/07.

`npm run verifier` enchaîne désormais 145 tests, le contrôle des contrastes des
huit thèmes et le build (typecheck `src` **et** `api`). Une CI
(`.github/workflows/verifier.yml`) rejoue le tout sur `push` et sur *pull
request*, avec deux contrôles de plus : `npm ci` — la commande de Vercel, la
seule qui refuse un lockfile désaccordé — et la non-fuite du SDK Anthropic dans
le bundle client. Les tests portent sur la logique pure ; le tableau de ce qu'ils
couvrent est dans `CLAUDE.md`, section « Vérifier avant de livrer ».

Les écrans livrés ce jour-là par l'autre chantier (`MotDePasseOublie.tsx`,
`NouveauMotDePasse.tsx`) **ne sont pas couverts** : rien de l'interface ne l'est,
c'est une décision et non un reste à faire.

### Troisième chantier — les polices quittent Google

Livré et commité (`b0f3694`). Faustina et Figtree sont désormais servies depuis
`public/polices/`, générées par `node outils/polices.mjs`. Ce n'était pas une
question de performance : charger une police depuis `fonts.gstatic.com`
transmettait l'adresse IP de chaque visiteur à Google, destinataire que
`DESTINATAIRES` n'a jamais listé. Le service worker passe en `mamakilo-v2` pour
purger l'ancien cache de polices Google des PWA déjà installées — sans cette
bascule, elles l'auraient gardé indéfiniment.

Vérifié au pilote sur le build de production : **dix requêtes, zéro vers un
tiers**.

### Quatrième chantier — le filet s'étend (1er août)

**250 tests.** Quatre modules de plus, choisis pour ce qu'une erreur y coûte :
`peremption.ts` (DLC contre DDM), `coach.ts` (les verdicts affichés, et la règle
de ton devenue contrainte), `menu.ts` (dates et mémoire partagée), `ics.ts` (le
fichier qui part chez Google Agenda sans qu'on voie ce qu'il devient).

**Le découpage de `@supabase/supabase-js` n'a pas été fait, et c'est délibéré** :
il demande de réécrire `supabase.ts` et `auth.ts`, que l'autre chantier venait de
toucher. Le premier affichage pèse 218 Ko compressés, dont la bibliothèque
Supabase entière alors que l'application n'en utilise que l'authentification et
un `upsert` — le realtime, le stockage et les fonctions sont du poids mort.

**Deuxième raison, plus forte que la première : ça ne se vérifie pas ici.** Le
chemin synchronisé demande un vrai projet Supabase ; en local on ne peut
éprouver que le mode démo. Toucher au câblage de l'authentification sans pouvoir
tester le chemin réel, sur une application qui porte des données de santé, n'est
pas un arbitrage à prendre seul.

### Cinquième chantier — les données protégées par construction (1er août)

**307 tests.** `fusionner` est exportée et sa perte de champ est désormais
impossible sans échec de test ; l'intégralité de l'export RGPD est fixée ; aucun
prédicat de badge ne peut lever, donc bloquer les écritures.

## La prochaine action

**Brancher le SMTP sur le projet `vdnfqijjmuxdrimbyyrv`** — `docs/email.md`,
section « Aucun SMTP n'est branché ». La procédure est celle, déjà éprouvée, des
sections 2 à 4 de `Ceremonia/docs/email.md` ; seules changent la référence du
projet et le nom d'expéditeur, qui peut ici dire la vérité.

Puis autoriser les URL de retour, **les deux domaines**, et rejouer les cinq
contrôles de la fin de `docs/email.md`.

Tant qu'on est dans ce tableau de bord, **relire Settings → General → Region**
et confirmer que le projet est bien en Irlande : `REGION_BASE` l'annonce
désormais dans `src/lib/legal.ts` après avoir annoncé Francfort à tort, et aucun
code ne peut deviner cette valeur. Le connecteur MCP servait l'autre projet
(`exovzmoygupllcdjbwtf`) ce jour-là et n'a pas pu la lire.

## Décidé cette séance

- **La récupération passe par une session provisoire**, dont la garde s'exécute
  avant le consentement et l'onboarding : un lien reçu par e-mail ne prouve que
  l'accès à une boîte aux lettres, pas le droit d'ouvrir l'application.
- **Le fragment d'URL se lit dans `supabase.ts`, avant la création du client.**
  `detectSessionInUrl` le consomme pendant l'initialisation, et l'événement
  `PASSWORD_RECOVERY` est émis avant qu'un composant React ait pu s'y abonner :
  les deux signaux se complètent, aucun ne suffit seul.
- **L'écran répond la même phrase que l'adresse existe ou non.** Un « compte
  inconnu » ferait de cette page publique un moyen de savoir qui tient un
  journal alimentaire.
- **Les comptes en `@equilibre.local` sont déclarés irrécupérables**, à l'écran
  et dans `docs/email.md`, plutôt que de faire attendre un message qui
  n'arrivera jamais.
- **Le champ d'identifiant cesse de promettre un pseudo en mode synchronisé** —
  il y était refusé à l'envoi, après saisie.

*Chantier du filet automatisé :*

- **Vitest, et rien d'autre.** Pas de linter — il discuterait du style dans un
  projet dont les conventions sont déjà écrites. Pas de `jsdom` ni de test de
  composant : une dépendance de plus pour des tests qui cassent à chaque retouche
  de JSX. `npm audit` reste à zéro.
- **On couvre les modules purs, pas l'interface** : ceux dont une erreur produit
  un écran plausible plutôt qu'une panne, donc ceux que personne ne voit passer.
- **Le test de déterminisme du catalogue est le plus important du lot.** Favoris,
  plans et listes de courses ne gardent que des identifiants ; une graine qui
  bouge dans le générateur viderait les données de tout le monde sans lever
  d'erreur.
- **`JAMBON DE PARIS` était lu comme une remise** — `'BON DE'` cherché en
  sous-chaîne. Les mentions de remise se cherchent maintenant par mots entiers.
- **Sur `4 X 0,75` sans total imprimé, le prix unitaire était enregistré comme
  prix payé** — le produit entrait dans l'historique au quart de son prix. La
  recherche du total ne lit plus que ce qui suit le détail de calcul.

## À ne pas refaire

- **Ne pas s'appuyer sur le seul événement `PASSWORD_RECOVERY`** : il est émis
  trop tôt pour un abonnement posé dans un `useEffect`.
- **Ne pas lire `window.location.hash` depuis un composant** : le client
  Supabase l'a déjà effacé au premier rendu.
- **Ne pas figer le domaine dans `redirectTo`.** L'application répond sur
  `mamakilo.vercel.app` **et** `di-t-ticien.vercel.app` ; le lien doit revenir
  là d'où part la demande, sinon une PWA installée depuis l'ancienne adresse
  perd sa session en cours de route.

*Chantier du filet automatisé :*

- **Ne pas écrire de test « de couverture ».** Trois des premières assertions
  écrites décrivaient ce que je supposais du code, pas ce qu'il fait : la
  recherche classe « Patate douce » avant « Pomme de terre » (c'est juste — c'est
  littéralement un aliment de ce nom), `cumulerQuantites` refuse de fondre « 1 »
  dans « 2 tranches » (juste aussi), et le parseur élague une ligne sans prix
  placée avant le premier prix (c'est l'en-tête du ticket). Un test qui contredit
  le code n'apprend rien tant qu'on n'est pas allé voir lequel des deux a tort.
- **Ne pas mesurer sans avoir lu `git status` d'abord.** Deux chantiers ont
  tourné dans ce répertoire le même jour, sans worktree ; toute mesure prise sans
  vérifier que l'arbre ne porte que ses propres fichiers est fausse. C'est la
  règle du `CLAUDE.md` du workspace, § 40, et elle s'est appliquée deux fois.
- **Ne pas poser un seuil de test à l'estime.** « Plus de 60 recettes distinctes
  sur 112 repas » avait l'air prudent ; la mesure donne 112 sur 112. Le seuil
  aurait laissé passer une régression divisant la diversité par deux. Mesurer
  d'abord, écrire le seuil ensuite, et noter la mesure à côté.
- **Ne pas toucher `supabase.ts` ni `auth.ts` tant que le chantier email tourne**,
  ni tant qu'on ne peut pas éprouver le chemin synchronisé.
- **Ne pas écrire un test qui contient une date en dur du mois courant.** Un test
  du planificateur interdisait « 2026-08 » dans le JSON d'un modèle pour prouver
  qu'il ne porte pas de dates ; `creeLe` en est une, et il est tombé au passage
  du 31 juillet au 1er août. Viser l'invariant, jamais la sous-chaîne.
- **Ne pas conclure sur `npm test` seul.** Vitest exécute, il ne type-vérifie
  pas : un objet de test au mauvais nom de champ passe les tests et tombe au
  `tsc -b`. C'est arrivé le même jour.
- **Ne jamais appeler `charger()`, `enregistrer()` ou `toutSupprimer()` depuis un
  test.** Un `.env` traîne sur la machine, donc `supabase` n'est pas `null` : ces
  fonctions écriraient dans la vraie base, sous le vrai identifiant.
