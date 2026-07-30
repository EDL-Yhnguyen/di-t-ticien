# L'identité Mamakilo — design

**Date :** 30 juillet 2026
**Statut :** validé par Yann, prêt pour le plan d'implémentation

---

## Pourquoi

Le produit s'appelle Mamakilo depuis le 29/07/2026 mais n'a pas d'identité : le
logo fait 36 px dans un coin, la page d'accueil parle encore le langage de
l'ancien produit (« une diététicienne ne prescrit pas des grammes »), et rien
dans l'application n'appartient à celui qui l'utilise. C'est une landing SaaS
correcte et sans visage.

Le nom, lui, a une histoire : c'est une **taquinerie affectueuse en famille**.
Son contraire exact est le compteur de calories culpabilisant. Tout ce document
découle de là.

### La décision qui cadre tout le reste

**L'histoire du nom ne se raconte pas sur le site ; elle en donne le ton.**

Décision de Yann, 30/07/2026. La raison est simple : l'histoire met en scène une
personne réelle qui n'a rien demandé, sur un dépôt public. On garde toute la
chaleur, sans exposer personne. Aucun prénom, aucune anecdote familiale
identifiante ne doit apparaître dans l'interface ou le dépôt.

### Ce que le produit doit donner comme sensation

Entrer dans une cuisine où vit une famille. Chaleureux, un peu moqueur, jamais
donneur de leçons. C'est cohérent avec les règles déjà posées : le coach ne fait
jamais de reproche, ne conseille jamais sous 1 200 kcal, et une remarque sur
l'alimentation de quelqu'un doit toujours pouvoir s'expliquer.

**Deux directions ont été écartées.** *Le carnet* (papier, manuscrit, intime) est
joli mais froid et déjà vu cent fois. *Le club* (communauté, classements, défis
entre membres) trahit le nom : Mamakilo se moque gentiment, il ne compare pas les
gens entre eux.

---

## 1. Le petit nom

**C'est le cœur du chantier, plus que le logo.** L'origine du produit est un
surnom affectueux : on en fait une fonctionnalité plutôt qu'une anecdote.

Chaque utilisateur peut se choisir un **petit nom**, utilisé partout où
l'application s'adresse à lui — salutation de l'écran du jour, célébrations,
messages de série. « Bonsoir, Mamakilo » plutôt que « Bonsoir, Élodie ».

- Champ `profil.petitNom`, facultatif. Vide → l'application utilise `prenom`,
  comme aujourd'hui. Aucun écran ne casse si personne ne le renseigne.
- Se règle depuis le profil, et se propose une fois pendant l'onboarding, avec
  une porte de sortie évidente.
- **Un champ persistant s'ajoute à trois endroits** (règle du `CLAUDE.md`) :
  `interface Profil` dans `store.ts`, la valeur par défaut d'`etatInitial`, et
  surtout `fusionner()` — sans cette dernière ligne la donnée est perdue au
  rechargement.
- **Le contexte envoyé au coach ne change pas.** `construireContexte()` est
  construit à la main, champ par champ ; ajouter un champ, c'est ajouter une
  donnée transmise à un tiers. Le petit nom n'apporte rien au raisonnement du
  modèle, il n'y entre pas.

---

## 2. Le logo devient présent

**La marmite est déjà un personnage** — elle a des yeux et un sourire. C'est un
actif inexploité.

- **Accueil public** : logo à 96 px, à côté du nom en grand. Présence de niveau
  héros, plus une icône décorative.
- **Dans l'application** : l'en-tête garde 36 px. La marmite réapparaît aux
  moments où l'écran est vide ou joyeux — état vide, cap franchi, célébration.
- **Trois expressions, pas plus** : `neutre` (celle du logo, inchangée),
  `contente` (retour de la personne, plat cuisiné), `complice` (cap franchi,
  série). Trois suffisent à donner vie ; au-delà on entretient une bibliothèque
  de mimiques que personne ne regarde.
- Elles vivent dans un composant **distinct de `Marque`**. `Marque` ne bouge pas :
  le `CLAUDE.md` impose que le sigle affiché et l'icône installée soient
  exactement la même image, sinon l'application ouverte n'a plus l'air d'être
  celle qu'on a installée. Le composant d'expression réemploie les mêmes tracés
  et ne surcharge que la bouche et les yeux.
- Les couleurs du logo restent écrites en dur. **Le logo ne suit pas le thème**,
  c'est une marque.

### La règle qui rend le personnage supportable

**La marmite réagit à la présence, jamais à la performance.**

Elle s'illumine parce que la personne est revenue, parce qu'elle a cuisiné, parce
que ça fait trente jours. **Jamais** parce que la journée était « bonne » ou
« mauvaise », jamais en fonction d'un total calorique, d'un Nutri-Score ou d'un
poids. Sans cette règle, un visage qui réagit à ce qu'on mange devient un juge —
exactement ce que le produit refuse d'être.

C'est une règle structurante, à ne pas contourner pour rendre l'animation « plus
vivante ».

---

## 3. L'accueil réécrit

L'accueil parle encore l'ancien produit, celui du plan prescrit. Le texte passe
au ton retenu, sans raconter l'histoire :

> **Mamakilo**
> Le petit nom qu'on se donne quand on s'aime et qu'on se charrie un peu.

**L'assiette animée reste.** Elle est belle et elle explique le produit en trois
secondes ; la remplacer serait une perte sèche.

Le sous-titre actuel (« Une diététicienne ne prescrit pas des grammes… ») est
remplacé : il décrit le mode « plan prescrit », qui n'est plus le produit mais un
mode parmi d'autres.

---

## 4. La photo de famille

Photo de profil, plus une photo de famille en bandeau discret sur l'écran
d'accueil de l'application.

### Elle ne quitte pas l'appareil

**Décision structurante.** La photo est redimensionnée dans le navigateur, puis
stockée en **IndexedDB** — jamais dans le document Supabase, jamais en base64
dans l'état.

Trois raisons, dans cet ordre :

1. **Une photo de famille contient souvent un enfant.** Ne pas l'envoyer est la
   seule position tenable pour une application qui promet déjà que les données de
   santé restent à l'utilisateur. Conséquence directe et voulue : **aucun
   destinataire à ajouter dans `DESTINATAIRES`, et aucun consentement nouveau à
   demander** — rien ne part vers un tiers.

   En revanche, **la politique de confidentialité doit quand même être
   complétée** : une photo est une donnée personnelle, et la section « Ce qui est
   collecté » doit dire qu'elle existe, où elle est stockée et qu'elle ne quitte
   pas l'appareil. Ne pas confondre « aucun destinataire » avec « rien à
   déclarer ». `VERSION_CONFIDENTIALITE` n'a pas à bouger pour autant : aucune
   donnée nouvelle ne part vers un tiers, donc l'accord déjà donné couvre
   toujours ce à quoi la personne a dit oui.
2. **`modifier()` fait un `structuredClone` de tout l'état à chaque écriture.**
   Une photo en base64 dans ce document serait clonée à chaque frappe. Le
   ralentissement est garanti, et il serait difficile à diagnostiquer.
3. Le document utilisateur reste petit, ce qui était un choix assumé du projet
   (« quelques dizaines de Ko après un an »).

### Le prix, à dire à l'utilisateur

**La photo ne suit pas d'un appareil à l'autre.** L'écran de réglage le dit
explicitement, plutôt que de laisser découvrir le manque. C'est le même principe
que pour Apple Santé, dont l'écran dit « import » et jamais « synchronisation ».

### Contraintes techniques

- Redimensionnement client : 256 × 256 pour l'avatar, 1 200 px de large pour le
  bandeau. Encodage compressé.
- Stockage d'un `Blob` en IndexedDB, affiché via `URL.createObjectURL`, **révoqué
  au démontage** — sinon la mémoire fuit à chaque changement d'écran.
- Un module dédié, `src/lib/photos.ts`, qui ne connaît pas React. `src/lib/` ne
  connaît pas l'interface, comme le reste du projet.
- **Suppression du compte** : `toutSupprimer()` doit vider IndexedDB en plus du
  document. Une donnée personnelle oubliée à l'effacement est un manquement à
  l'article 17, même si elle n'est jamais partie de l'appareil.
- **Export des données** : `telechargerExport()` doit inclure les photos. Le
  droit d'accès porte sur l'intégralité (art. 15 et 20).

---

## 5. Le partage

**Pas d'icônes en pied de page vers des comptes qui n'existent pas.** Aucun
compte Facebook, X ou Instagram Mamakilo n'existe à ce jour ; poser les liens
serait fabriquer. Le jour où ces comptes existent, les adresses se posent en
trois minutes.

À la place : un bouton **« partager »** sur un plat réussi ou une série de jours,
qui fabrique une image côté navigateur (canvas) et passe par le partage natif du
téléphone.

- **L'image ne contient aucune donnée de santé** : pas de poids, pas de
  calories, pas de Nutri-Score. Le nom du plat, la marmite, une série de jours.
  C'est ce qui permet de partager sans qu'un consentement nouveau soit
  nécessaire — rien de sensible ne sort.
- `navigator.canShare({ files })` garde l'appel. Là où le partage natif manque
  (la plupart des navigateurs de bureau), **repli sur le téléchargement de
  l'image**, sans message d'erreur : ce n'est pas une panne.
- **C'est le morceau à couper en premier** si le chantier doit être raccourci.

---

## 6. Le coin « entre nous » et le lien iGraal

Une page atteignable une fois connecté, jamais depuis l'accueil public.

Elle porte le lien de parrainage iGraal fourni par Yann, **signalé comme lien de
parrainage** — la transparence sur un lien rémunéré n'est pas optionnelle.

```
https://fr.igraal.com/parrainage?parrain=AG_55df2aa7a0e1b&utm_medium=raf&utm_source=refer_friend
```

Le lien s'ouvre dans un nouvel onglet, avec `rel="noopener noreferrer"`.

### Pourquoi il n'est pas sur la page publique

Le site tient sur le régime **« éditeur non professionnel »**
(`EDITEUR_NON_PROFESSIONNEL = true` dans `legal.ts`), qui permet à Yann de ne
publier ni son nom ni son adresse. Le commentaire du fichier écrit la condition :
le drapeau tomberait « si l'application devenait payante ou publicitaire ». Un
lien de parrainage rémunéré, sur la page publique, entre dans cette définition —
et **nom, statut et adresse deviendraient obligatoires** dans les mentions
légales.

En revanche il ne casse **pas** la promesse de l'écran de consentement : celle-ci
porte sur les données de santé (« ni publicité, ni revente, ni profilage ») et un
lien statique ne les touche pas. La distinction compte, et elle doit rester
claire dans le code comme dans les textes.

Si Yann veut un jour ce lien en public, c'est un basculement de régime à faire
sciemment, pas un effet de bord.

---

## 7. Le ton des textes

Une passe sur les états vides, les célébrations et les messages de série. Le ton
actuel est juste mais neutre ; c'est là que se gagne l'essentiel de la chaleur
perçue, pour un coût presque nul.

| Aujourd'hui | Demain |
|---|---|
| Votre garde-manger est vide | Le frigo est vide. Ça arrive. |
| Rien de noté pour l'instant | La journée commence. |
| La liste est vide | Rien à acheter pour le moment. |
| Rien ne colle avec ces filtres | Rien sous la main avec ces critères. |

**Deux garde-fous.** Le ton ne s'applique **pas** aux écrans de consentement, de
confidentialité, de mentions légales ni aux messages d'erreur : un texte
juridique doit être plat, et une erreur doit dire quoi faire. Et aucune
formulation ne commente ce que la personne a mangé.

---

## Ce qui est explicitement hors périmètre

- Communauté, fil d'actualité, profils publics, classements entre utilisateurs.
- Comptes sociaux Mamakilo (n'existent pas).
- Photos de plats de l'utilisateur remplaçant les illustrations du catalogue —
  bonne idée, chantier distinct.
- Toute modification des clés internes `equilibre:*` : les renommer
  déconnecterait les comptes existants.
- Tout envoi de photo vers un serveur.

---

## Vérification

Le projet n'a ni linter ni suite de tests ; les contrôles sont le typecheck et la
vérification à l'écran.

- `npm run build` — typecheck `src` **et** `api`, puis build.
- `node outils/palettes.mjs --verifie` si une teinte bouge. Sort en 1 sous le
  seuil de contraste.
- **À l'écran, au pilote Playwright**, sur le build de production en mode démo :
  390 px et 1 280 px, thèmes clair et sombre, aucune erreur console.
- Points à contrôler dans le document, pas seulement à l'œil : le petit nom
  survit au rechargement (donc `fusionner()` est bien renseigné), la photo
  survit au rechargement et **disparaît à la suppression du compte**, l'export
  la contient, et l'image partagée ne porte aucun chiffre de santé.
- **`prefers-reduced-motion`** : les expressions de la marmite passent par
  framer-motion, donc par le `MotionConfig reducedMotion="user"` de `main.tsx`.
  À vérifier, pas à supposer — c'est un réglage médical.
- Contraste du texte sur la photo de famille : une photo claire sous un texte
  clair est illisible. Un voile est nécessaire, quelle que soit la photo.

---

## Périmètre

Sept chantiers, tous petits sauf la photo. Ils sont **indépendants les uns des
autres** et l'ordre ci-dessous va du plus de sens pour le moins de code vers le
plus technique. Si le plan d'implémentation s'avère trop long, la coupure
naturelle se fait après le point 4 : les points 1 à 4 forment une identité
complète et livrable, les points 5 à 7 sont des ajouts.

## Ordre proposé

1. Le petit nom — le plus de sens pour le moins de code.
2. Le ton des textes — indépendant, sans risque.
3. Le logo présent et l'accueil réécrit.
4. Les expressions de la marmite, avec leur règle.
5. La photo de famille — le morceau technique.
6. Le coin « entre nous » et iGraal.
7. Le partage — à couper en premier si besoin.
