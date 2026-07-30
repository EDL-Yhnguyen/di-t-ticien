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
| **C3** | Recettes premium | Schéma étendu (cuisine du monde, difficulté, coût, portions, régimes, nutriments, substitutions, conservation, réchauffage, variantes d'appareils), fiche détaillée, recherche multicritère, favoris | 1, 2, 3, 19 | **Livré** le 30/07/2026 |
| **C4** | Planification | Calendrier jour / semaine / mois, glisser-déposer, copier un jour ou une semaine, modèles, semaines préconstruites, génération multi-semaines, export `.ics` | 4, 5 | **Livré** le 30/07/2026 |
| **C5** | Mode Cuisine | Plein écran, étapes une à une, minuteurs, écran maintenu allumé, batch cooking et ordre des cuissons | 17, 18 | **Livré** le 30/07/2026 |
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

---

## C3 — Les recettes premium (livré le 30/07/2026)

### Ce qui est en place

- Schéma étendu dans `lib/recettes/types.ts` : `cuisine`, `difficulte`,
  `regimes`, `substitutions`, `rechauffage`, `appareils`, `photo`. Tous
  facultatifs, tous renseignés à la main pour les 53 recettes en ce qui concerne
  la cuisine et les régimes.
- `lib/catalogue.ts` : ce qui se **déduit** d'une recette — difficulté, régimes,
  macros d'une part, illustration, quantités pour plusieurs — et la recherche
  multicritère. Rien n'y est stocké.
- `/app/cuisine` refondu : recherche texte (titre **et** ingrédients), feuille
  « Affiner » (moment, charge, temps, difficulté, cuisine du monde, régime,
  étiquettes), favoris, et une fiche détaillée.
- `EtatUtilisateur.favoris` : des identifiants, pas des recettes.

### Les décisions à ne pas défaire

**Aucun régime ne se déduit d'une liste d'ingrédients.** « Sans gluten » annoncé
à tort n'est pas une imprécision, c'est un risque sanitaire pour une personne
cœliaque — et la sauce soja, la moutarde ou une charcuterie en contiennent sans
le dire dans leur nom. Seul le champ `regimes`, écrit à la main, fait foi ; la
seule déduction tolérée est « végétarien », lu sur le tag qui existait déjà,
parce que s'y tromper ne fait que proposer un plat de trop. La fiche ajoute une
mise en garde sur les produits transformés : la recette ne parle que de ses
ingrédients, pas du contenu du bocal acheté.

**Le filtre régime cache ce qu'il ne peut pas garantir.** L'absence
d'information n'est pas une réponse négative, mais elle se traite comme telle :
mieux vaut cacher un plat qui aurait convenu que d'en proposer un qui ne
convient pas.

**Il n'y a pas de champ `portions`, et c'est délibéré.** `kcal` et les quantités
sont écrits pour une personne, et tout le produit le lit ainsi : le
planificateur vise la cible d'un repas, les bandes comparent à l'objectif d'une
journée, le journal enregistre une portion. Déclarer qu'une recette « couvre
quatre personnes » sans toucher à `kcal` rendrait ces trois lectures fausses
d'un facteur quatre, silencieusement. Cuisiner pour plusieurs est donc un calcul
d'affichage (`ingredientsPour`), et l'écran dit « par personne » pour que le
chiffre garde son sens.

**La difficulté se déduit du nombre de gestes *et* du temps**, pas du temps
seul : « facile » veut dire peu de gestes, pas rapide. Un riz au lait est facile
et lent — d'où l'override `difficulte` sur cette recette-là.

**Le coût n'est pas un montant.** Aucune source de prix n'existe dans le projet,
et afficher « 2,40 € la portion » serait une invention. Le budget passe par
l'étiquette « économique » qui existait déjà, affichée « Petit budget ».

**Les nutriments d'une part réemploient la répartition de `journalRecette.ts`.**
Écrire un second jeu de chiffres à côté aurait produit deux estimations
contradictoires pour le même plat. Aucun Nutri-Score n'en est tiré, pour la
raison déjà posée là-bas.

**L'illustration se lit dans le contenu du plat, jamais tirée au sort.** Le
premier jet piochait au hasard dans la catégorie « protéine » : le chili
végétarien s'est affiché avec un poisson, les œufs brouillés avec un steak. Une
vignette fausse est pire que pas de vignette. Le pictogramme vient donc du titre
puis des ingrédients, dans cet ordre ; seule la couleur de fond est tirée de
l'identifiant, parce qu'une couleur ne prétend rien.

### Vérifié à l'écran avant livraison

Au pilote Playwright, sur le build de production en mode démo, 390 px et
1280 px, clair et sombre, aucune erreur console : recherche « oeuf » (11
recettes, la ligature passe) et « poêlée » (1, l'accent aussi), filtres cumulés
(sans gluten 26 → + végétalien 6 → sans gluten + indienne 1), favoris contrôlés
**dans le document** et après rechargement, fiche complète (cuisine, régime,
substitution, variante d'appareil, macros et leur mention d'estimation),
passage à quatre personnes (« 120 g » → « 480 g » pendant que l'énergie reste
« 470 kcal par personne »), et versement des ingrédients de la fiche dans la
liste de courses aux quantités affichées. Le parcours C2 a été rejoué en entier
pour vérifier l'absence de régression.

**Trois défauts corrigés à ce moment-là**, dont deux invisibles au typecheck :
l'illustration tirée au hasard (ci-dessus), le dégradé entre deux lavis qui
donnait un vert-brun boueux en thème sombre — remplacé par un lavis uni —, et un
« Papillote de dinde aux poireaux » illustré par un poisson parce que la table
des pictogrammes cherchait dans le titre et les ingrédients d'un seul bloc.

---

## C4 — La planification (livré le 30/07/2026)

### Ce qui est en place

- `EtatUtilisateur.plans` : **plusieurs semaines**, une par lundi (`debut` fait
  office de clé). Remplace le champ `menus` qui n'en tenait qu'une ; la migration
  est dans `fusionner`, via l'interface `ChampsHistoriques`.
- `EtatUtilisateur.modeles` : semaines mises de côté, **sans dates**.
- `lib/menu.ts` : génération multi-semaines à mémoire partagée, `poserPlan`,
  `copieDeSemaine`, `copierJour`, `deplacerRepas`, modèles, semaines
  préconstruites, `lundisDuMois`.
- `lib/ics.ts` : export `.ics` d'une semaine.
- `/app/menus` refondu : trois échelles (jour, semaine, mois), navigation avant
  et arrière, glisser-déposer à la souris, déplacement au doigt, copie de
  journée et de semaine, modèles, export agenda.

### Les décisions à ne pas défaire

**La mémoire des recettes est partagée entre les semaines générées ensemble.**
Générées indépendamment, quatre semaines se ressembleraient toutes — chacune
repartant du même catalogue avec le même barème. Vérifié à l'écran : 1 à 3 repas
identiques au même créneau entre deux semaines consécutives, sur 28.

**`debut` est la clé d'un plan.** Deux plans pour le même lundi seraient deux
vérités, et l'écran afficherait celui que le hasard de l'ordre place en premier.
D'où `poserPlan`, qui remplace au lieu d'empiler.

**Un modèle ne porte pas de dates**, seulement sept jours de repas dans l'ordre :
c'est ce qui lui permet de se poser sur n'importe quelle semaine. Vérifié dans le
document.

**Les semaines préconstruites sont des jeux de critères, pas des semaines
figées.** Quatre semaines écrites en dur feraient 112 références de recettes à
maintenir à la main, périmées au premier renommage — et qui ignoreraient
l'objectif calorique de la personne, alors que c'est justement ce que le
générateur sait faire.

**Déplacer un repas sur un créneau occupé les échange.** Un glisser-déposer qui
détruit une donnée est un geste qu'on n'ose plus refaire.

**Le glisser-déposer HTML n'a pas d'équivalent tactile** — il n'existe pas de
`dragstart` au doigt. C'est donc un confort de souris, et le même déplacement
s'obtient partout par la fiche du repas (« Déplacer ce repas »). **Ne pas retirer
ce second chemin** en croyant à un doublon : sur un téléphone, c'est le seul.

**Copier une journée ne la vide pas.** « J'ai bien mangé hier, je remets la même
chose » est une copie ; le déplacement, c'est l'autre geste.

**L'export `.ics` est la version livrable de la section 5 du brief** (voir plus
haut le point 4 des impossibles). Détails qui comptent :

- **Heures locales flottantes**, sans `TZID` ni `Z` : un déjeuner doit rester à
  midi, y compris pour quelqu'un qui change de fuseau en cours de semaine.
- **Aucune alarme** : vingt-huit rappels par semaine transformeraient un plan de
  repas en harcèlement. C'est à l'agenda d'en décider.
- **`UID` stable** par date, moment et recette : réimporter la même semaine met à
  jour les événements au lieu de créer des doublons.
- Pliage des lignes à 75 **octets** et non caractères, et échappement des
  virgules : « Poulet au citron, haricots verts » non échappé découpe le champ en
  deux et l'agenda n'affiche que la moitié du plat.

### Vérifié à l'écran avant livraison

Au pilote Playwright, sur le build de production en mode démo, 390 px et
1280 px, clair et sombre, aucune erreur console : génération de quatre semaines
d'un coup (bons lundis, semaines différentes entre elles), les trois échelles,
navigation d'un mois à l'autre, copie de journée et de semaine avec
avertissement « déjà composée », déplacement au doigt **et** glisser-déposer à la
souris (échange contrôlé dans le document sur deux repas distincts), modèle
enregistré sans dates, semaine préconstruite végétarienne, et le fichier `.ics`
inspecté ligne à ligne : 28 `VEVENT`, CRLF partout, aucune ligne au-delà de
75 octets, `DTSTART` flottant, virgules échappées, pas de `VALARM`. Les parcours
C2 et C3 ont été rejoués en entier.

**Un défaut corrigé à ce moment-là** : cinq boutons d'action empilés en 390 px
repoussaient la semaine — le contenu de l'écran — sous le pli. Deux gestes
fréquents restent en pleine largeur, les trois autres passent en une ligne
compacte.

**Piège du banc d'essai** : un test peut passer sans rien prouver. La première
vérification de l'échange portait sur deux dîners identiques (le mardi venait
d'être recopié depuis le lundi) : l'assertion était vraie quoi qu'il arrive.

---

## C5 — Le mode Cuisine (livré le 30/07/2026)

### Ce qui est en place

- `EtatUtilisateur.cuisine` : la séance en cours (`SeanceCuisine`), **une seule
  structure pour une recette et pour le batch cooking**.
- `lib/cuisson.ts` (pur) : durées lisibles dans le texte d'une étape, chrono,
  ordre de démarrage d'une séance à plusieurs recettes.
- `lib/cuisineEnDirect.ts` (effets navigateur) : minuteurs et maintien de
  l'écran allumé.
- `/app/mode-cuisine`, **hors du gabarit** : une étape à la fois en grand,
  minuteurs, ingrédients à portée, onglets entre recettes, ordre de démarrage.
- Quatre portes d'entrée : la fiche d'une recette, le panier (batch), une
  proposition de `/app/cuisiner`, un repas du planning. Plus un bandeau de
  reprise sur les deux écrans de cuisine.

### Les décisions à ne pas défaire

**La séance est enregistrée, pas gardée dans l'écran.** On cuisine en posant son
téléphone, on répond au téléphone, l'onglet se ferme. Retrouver la recette **à
l'étape où on l'avait laissée** est la moitié de l'intérêt du mode cuisine.
Vérifié : après rechargement, l'écran affiche « Étape 3 sur 4 ».

**Les minuteurs comptent sur des horodatages absolus, pas sur un compteur
décrémenté.** Un onglet en arrière-plan voit ses `setInterval` ralentis à une
fois par minute : un compte à rebours décrémenté dériverait de plusieurs minutes
pendant qu'on regarde ailleurs — précisément le moment où l'on compte sur lui.
Même raison pour la sonnerie, déclenchée par comparaison d'horodatages et non
par un `setTimeout`.

**Les durées sont déduites du texte des étapes**, sans annotation ajoutée aux 53
recettes : une recette écrite demain aura ses minuteurs sans rien de plus. Les
bornes (30 s à 3 h) écartent les faux positifs, et les unités de conservation
— jour, semaine, mois — sont exclues : « se garde 3 mois au congélateur » n'est
pas un temps de cuisson. Contrôlé sur tout le catalogue : 59 étapes sur 170
portent une durée, aucun faux positif sur les grammes, les degrés ou les watts.

**Une étape porte parfois plusieurs durées** (« 6 minutes par face », « puis
2 minutes ») : on les propose toutes plutôt que de deviner laquelle compte.
Deviner mal ferait rater une cuisson ; deux boutons ne coûtent qu'un regard.

**Rien ne se déclenche tout seul.** Ce qui est déduit d'une phrase peut se
tromper : l'écran propose le minuteur, la personne le lance.

**Les étapes ne sont pas entrelacées entre recettes**, et c'est une décision. Le
catalogue ne dit pas quelles étapes sont actives (couper, remuer) et lesquelles
sont passives (cuire, refroidir) ; un entrelacement déduit d'une phrase
enverrait remuer une poêle qui n'est pas encore sur le feu. Ce qui est calculable
sans risque, c'est **l'ordre de démarrage** : la plus longue d'abord, parce que sa
cuisson libère du temps pour les autres. Chaque recette garde son étape courante,
et on passe de l'une à l'autre par les onglets.

**L'absence de `Screen Wake Lock` est silencieuse.** Là où l'API n'existe pas,
l'écran s'éteindra comme d'habitude : prévenir d'une limite que l'utilisateur ne
peut pas lever ne servirait qu'à l'inquiéter. Le verrou est réacquis sur
`visibilitychange`, sans quoi l'écran s'éteindrait au premier coup d'œil à une
notification.

**Le bip est synthétisé, pas téléchargé** : un fichier son ne serait pas dans le
cache hors ligne au premier usage — exactement le cas de la cuisine sans réseau.

### Vérifié à l'écran avant livraison

Au pilote Playwright, sur le build de production en mode démo, 390 px et
1280 px, clair et sombre, aucune erreur console : lancement depuis une fiche,
absence du gabarit sur `/app/mode-cuisine`, minuteur déduit du texte (« 20
minutes ») et décompte réel constaté, étape enregistrée puis retrouvée après
rechargement, bandeau de reprise, fin de séance qui remet l'état à `null`, batch
de trois recettes avec onglets et **étapes indépendantes** (une recette à
l'étape 2 pendant qu'une autre est à l'étape 1), et l'ordre de démarrage. Les
parcours C2, C3 et C4 ont été rejoués en entier.

**Un défaut corrigé à ce moment-là** : la carte du minuteur, en `sticky` séparé,
recouvrait le bouton « Étape suivante » en 390 px. Les minuteurs vivent
désormais dans la barre du bas.

**Piège du banc d'essai** : injecter des données dans le `localStorage` d'une
page ouverte ne sert à rien — `AppContext` vide son debounce sur `pagehide` et
l'état en mémoire réécrase l'injection au rechargement. Il faut relire le
stockage **après** un délai supérieur à 400 ms, puis réinjecter dans un
contexte neuf via `addInitScript`. Et laisser passer l'animation d'entrée
(500 ms) avant toute capture, sinon la moitié de l'écran est transparente.
