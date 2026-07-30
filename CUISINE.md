# Module Cuisine, Recettes & Courses — programme

Demandé par Yann le 29 juillet 2026 : faire de la partie alimentaire un
**écosystème** allant de la planification des repas à la cuisine, aux courses,
et à la gestion du frigo, des placards et du congélateur.

Le périmètre demandé représente plusieurs sprints. Ce fichier tient l'ordre
retenu, ce qui est livré, et surtout **ce qui ne peut pas se faire tel quel** —
pour ne pas redécouvrir les mêmes murs à chaque reprise.

---

## Ordre des sprints

| # | Sprint | Contenu | Sections du brief | État |
|---|---|---|---|---|
| **C1** | Garde-manger | Frigo / placards / congélateur, DLC et DDM, tableau de bord des dates, « Que puis-je cuisiner ? » | 8, 9, 10, 11, 12, 16 | **Livré** le 29/07/2026 |
| **C2** | Courses | Liste par rayon depuis le plan **et** ajouts libres, cochage persistant, plusieurs listes, historique, retour de courses → garde-manger | 6 | **Livré** le 30/07/2026 |
| **C3** | Recettes premium | Schéma étendu (cuisine du monde, difficulté, coût, portions, régimes, nutriments, substitutions, conservation, réchauffage, variantes d'appareils), fiche détaillée, recherche multicritère, favoris | 1, 2, 3, 19 | À faire |
| **C4** | Planification | Calendrier jour / semaine / mois, glisser-déposer, copier un jour ou une semaine, modèles, semaines préconstruites, génération multi-semaines, export `.ics` | 4, 5 | À faire |
| **C5** | Mode Cuisine | Plein écran, étapes une à une, minuteurs, écran maintenu allumé, batch cooking et ordre des cuissons | 17, 18 | À faire |
| **C6** | Ports d'IA et passage à l'échelle | `src/lib/ia/` : interfaces et bouchons documentés, sans aucun appel réel ; schéma Supabase du catalogue et du partage familial | 7, 13, 14, 15, 21 | À faire |

**C1 avant tout le reste** : les sections 11, 12 et 16 du brief supposent un
stock, et C2 s'y adosse aussi (ce qu'on a déjà ne se rachète pas).

---

## Ce qui ne peut pas se faire littéralement

Quatre points du brief se heurtent à une réalité du projet. Aucun n'est un
refus : chacun a une version livrable, écrite ici.

### 1. Le brief décrit du Next.js — le projet est une SPA Vite

`NEXT_PUBLIC_*`, middleware, App Router : rien de tout cela n'existe ici, et la
migration coûterait un sprint entier à fonctionnalité constante. Le socle reste
Vite + fonctions serverless `/api`. Constat déjà posé dans `AUDIT.md`.

### 2. « Plusieurs dizaines de milliers de recettes » : l'architecture, oui ; le contenu, non

L'architecture pour les tenir se construit (C3 pour le schéma, C6 pour la table
Supabase indexée en recherche plein texte, avec pagination). **Le contenu, lui,
n'existe pas** : il n'y a aucune source libre de droits de dizaines de milliers
de recettes en français, encore moins avec photos, et les générer demanderait
le budget d'IA que Yann a justement mis de côté.

Ce qui est livrable : un catalogue qui grandit à la main (53 recettes au
29/07/2026), derrière une abstraction de source qui accepte plus tard un import
en masse sans toucher aux écrans.

**Les photos** relèvent du même écart : aucune banque d'images n'est disponible.
Les champs sont prévus, et l'absence de photo doit dégrader vers une
illustration générée — jamais vers un cadre vide, et jamais vers une photo
d'emprunt.

### 3. Le partage familial et le catalogue à l'échelle demandent du SQL que Claude ne peut pas appliquer

Le connecteur Supabase est **en lecture seule** : toute migration est un
copier-coller pour Yann dans le SQL Editor. Le partage familial (section 7)
demande de nouvelles tables et de nouvelles politiques RLS, et il casse la
propriété qui protège aujourd'hui les données de santé — *une seule règle à
vérifier*, `auth.uid() = user_id`. C'est le sujet le plus délicat du programme :
il se traite seul, pas en fin de sprint.

Tout le reste tient dans le document `jsonb` existant, donc sans migration.

### 4. La synchronisation des agendas n'est pas une case à cocher

Google, Apple et Outlook demandent chacun une application OAuth, des jetons de
rafraîchissement, un secret côté serveur et un écran de révocation. La version
livrable en C4 est l'**export `.ics`**, que les trois savent importer, plus le
point d'extension pour l'OAuth. Les rappels, eux, supposent une infrastructure
de notifications *push* que le projet n'a pas (c'est le trou connu du sprint 7
d'origine).

---

## C1 — Le garde-manger (livré le 29/07/2026)

### Ce qui est en place

- `ArticleStock` dans `lib/types.ts`, rangé dans `EtatUtilisateur.stocks`.
- `lib/stocks.ts` : échéances, urgences, bilan, recettes réalisables.
- `lib/ingredients.ts` : rapprochement des noms de produits.
- `/app/garde-manger` : trois lieux, tableau de bord des dates, ajout au
  clavier ou au code-barres (Open Food Facts, déjà en place).
- `/app/cuisiner` : ce que le stock permet, l'anti-gaspillage en tête.

### Les décisions à ne pas défaire

**La DLC et la DDM sont deux champs distincts.** « À consommer jusqu'au » est
sanitaire ; « à consommer de préférence avant » ne parle que de goût. Les
fondre en une seule date ferait jeter des lentilles parfaitement bonnes — soit
l'inverse exact de ce que le module cherche à faire. Le vocabulaire des écrans
en découle : « à jeter » d'un côté, « moins bon » de l'autre.

**Un produit entamé ne tient plus jusqu'à sa date imprimée.** `ouvertLe` avance
l'échéance de quelques jours selon le rayon. Sans ça, l'application donnerait
une fausse sécurité précisément là où le risque est réel.

**Le rapprochement des noms se fait sur un seul mot porteur commun**, et ça se
trompe parfois : « Huile d'olive » et « Olives noires » partagent « olive ».
Exiger deux mots communs supprimerait ce faux positif mais perdrait « Escalope
de poulet » contre « Filet de poulet », qui est le cas fréquent. D'où la règle
large **et** l'affichage systématique de l'article rapproché : une erreur
visible se corrige d'un coup d'œil, une erreur silencieuse envoie cuisiner sans
huile.

**Les sections de `/app/cuisiner` sont plafonnées à six**, et le nombre écarté
est annoncé. Une tomate entre dans quinze recettes : sans plafond, l'écran qui
doit dire « fais celle-ci ce soir » redevient le catalogue.

### Vérifié à l'écran avant livraison

Au pilote Playwright, sur le build de production en mode démo, en 390 px et
1280 px, thèmes clair et sombre, aucune erreur console : onze articles couvrant
tous les états d'échéance, les trois onglets, l'ajout d'un produit contrôlé
**dans le document** et pas seulement à l'écran, les filtres, et le dépliage
d'une proposition.

Deux défauts corrigés à ce moment-là : le nom du produit tronqué en 390 px
(« Filet de pou… ») à cause d'un bouton crayon redondant avec la ligne
entière, et une liste d'urgences en bloc là où le brief demande un tableau de
bord distinguant aujourd'hui, demain et la semaine.

---

## C2 — Les courses (livré le 30/07/2026)

### Ce qui est en place

- `ArticleCourse` et `ListeCourses` dans `lib/types.ts`, rangés dans
  `EtatUtilisateur.courses` — listes en cours et closes dans le même tableau,
  `clotureeLe` les distingue.
- `lib/courses.ts` : fabrique, ajout avec cumul, versement d'une semaine ou du
  placard, bilan, clôture, copie, passage au garde-manger.
- `/app/courses` : liste par rayon, cochage enregistré, ajout au clavier ou au
  code-barres, plusieurs listes en parallèle, historique et « refaire cette
  liste », retour de courses.
- Quatre portes d'entrée : le panier de `Cuisine`, la feuille de courses de
  `Menus`, les ingrédients manquants de `Cuisiner`, et les raccourcis du profil
  et du garde-manger.

### Les décisions à ne pas défaire

**Le cochage est dans le document, pas dans l'écran.** C'est toute la
différence avec la liste calculée de `menu.ts`, qui reste comme aperçu : on fait
ses courses en plusieurs fois, d'un téléphone qu'on range entre deux rayons, et
une case perdue au rechargement fait racheter ce qui est déjà dans le caddie.

**Une ligne déjà cochée qui grossit redevient à prendre.** Cocher veut dire
« j'ai pris ce qui était écrit » : si la semaine suivante réclame deux oignons de
plus, laisser la case cochée ferait passer devant le rayon sans s'arrêter.

**Les lignes cochées ne descendent pas en bas de la liste.** On coche en
marchant ; une liste qui se réordonne sous les yeux fait perdre sa place et
relire tout le rayon. Le barré suffit.

**Ce qu'on a déjà ne se rachète pas** : le versement d'une semaine confronte
chaque ingrédient au garde-manger et arrive décoché sur ce qui est couvert —
mais la ligne reste visible et cochable, avec **le nom de l'article du stock qui
a produit la correspondance**. `memeProduit` rapproche sur un seul mot porteur et
se trompe parfois ; c'est cet affichage qui rend l'erreur inoffensive (même
règle qu'en C1).

**Le rapprochement des lignes de courses se fait sur `cleIngredient`**, plus
strict que le `memeProduit` du garde-manger : fusionner deux lignes à tort fait
partir au magasin avec une quantité fausse, alors qu'un faux rapprochement de
stock ne coûte qu'une suggestion de recette à côté.

**`plansVerses` retient les semaines déjà versées.** Verser deux fois la même
doublerait toutes les quantités sans que rien ne le signale. L'écran prévient, il
n'interdit pas : regénérer une semaine change son `genereLe`, donc c'est bien un
nouveau versement.

**Le retour de courses n'invente aucune date.** Les articles entrent au
garde-manger sans DLC ni DDM, et l'écran dit qu'il reste à les noter : une date
posée au hasard donnerait une fausse sécurité, exactement ce que C1 cherche à
éviter. Le rangement proposé vient du rayon et se corrige ligne à ligne — les
pommes de terre et la salade sortent du même rayon et ne vont pas au même
endroit. Un produit rapporté qui existe déjà au garde-manger fait **une seconde
ligne** plutôt qu'un cumul : deux achats ont deux dates, et les fondre en
perdrait une.

**Ranger et clore sont un seul geste**, parce qu'on vide les sacs en rentrant.
Les séparer laisserait derrière soi des listes ouvertes dont on n'a plus rien à
faire.

### Vérifié à l'écran avant livraison

Au pilote Playwright, sur le build de production en mode démo, en 390 px et
1280 px, thèmes clair et sombre, aucune erreur console : versement d'une semaine
de 28 repas (81 lignes cumulées, dont 2 écartées d'office parce qu'au frigo),
second versement averti, ajout manuel, cumul contrôlé **dans le document**,
cochage vérifié après rechargement, retour de courses (garde-manger passé de 2 à
4 articles, tous sans date, liste close), historique et « refaire cette liste »
(articles repris, tout décoché, `plansVerses` vidé), et les manquants de
`/app/cuisiner` versés sur la liste.

**Un défaut corrigé à ce moment-là**, que le typecheck ne pouvait pas voir : le
pluriel en « -x ». « 1 rouleau » et « 2 rouleaux » ne se reconnaissaient pas —
`memeUnite` ne défaisait que le « -s » — et donnaient « 1 rouleau + 2 rouleaux »
au rayon au lieu de « 3 rouleaux ». `accorder` avait le défaut symétrique et
aurait écrit « 3 rouleaus ».

**Piège du banc d'essai** : injecter des données dans le `localStorage` d'une
page ouverte ne sert à rien — `AppContext` vide son debounce sur `pagehide` et
l'état en mémoire réécrase l'injection au rechargement. Il faut relire le
stockage **après** un délai supérieur à 400 ms, puis réinjecter dans un
contexte neuf via `addInitScript`. Et laisser passer l'animation d'entrée
(500 ms) avant toute capture, sinon la moitié de l'écran est transparente.
