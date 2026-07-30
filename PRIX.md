# PRIX.md — Le module « Tickets et prix »

Mémoire du module. Le lire **avant** d'y toucher. Il complète `CLAUDE.md`, qui
reste la référence du projet.

---

## D'où vient ce module

Yann a demandé une application de courses intelligente : OCR des tickets,
comparateur de prix multi-enseignes, répartition automatique du panier entre
magasins, inventaire par photo du frigo, promotions, cartes de fidélité,
gamification.

**Décision du 30/07/2026 : c'est un module de Mamakilo, pas un projet séparé.**
J'avais recommandé l'inverse ; trois contraintes posées par Yann ont renversé
l'arbitrage, et ce sont elles qui commandent toute l'architecture :

- **Tout gratuit, aucune IA payante.** L'OCR tourne dans le navigateur.
- **Usage familial d'abord.** Pas de monétisation, donc le régime « éditeur non
  professionnel » de Mamakilo tient toujours.
- **Pas de base de prix partagée.** Les tickets de la famille suffisent.

Ne pas rouvrir l'arbitrage sans qu'une de ces trois contraintes ait changé.

---

## Ce qui n'est pas faisable, et pourquoi

Quatre points du brief ne peuvent pas se faire littéralement. Ils ne sont pas
oubliés, ils sont écartés — et il faut savoir pourquoi avant de les réessayer.

### 1. Le comparateur multi-enseignes à partir de données extérieures

Aucune enseigne française n'expose ses prix par une API publique. Aspirer leurs
sites se heurte au droit *sui generis* du producteur de base de données
(art. L342-1 CPI) et à leurs conditions d'utilisation ; c'est le mur sur lequel
Prixing est mort.

**Ce qui est livré à la place** : la comparaison de vos prix à vos prix. Une
famille fréquente deux ou trois enseignes, donc l'historique répond dès le
premier mois à « où est-ce moins cher », sans aucune donnée externe. C'est aussi
ce qui règle le démarrage à froid, que le brief ne traitait pas : un comparateur
alimenté par une base vide n'affiche rien, et personne ne contribue à une base
qui n'affiche rien.

Pistes gardées si la question se rouvre : les drives affichent leurs prix
publiquement, et le projet **Open Prices** d'Open Food Facts publie des prix
contributifs sous licence ouverte — Mamakilo utilise déjà Open Food Facts pour
les codes-barres.

### 2. La reconnaissance des produits du frigo par photo

Sans modèle payant, aucune solution locale crédible. Le port existe déjà
(`lib/ia/`, bouchon en place) : il se branchera le jour où une clé d'API sera
configurée. En attendant, le garde-manger se remplit au code-barres, ce qui
couvre l'essentiel du besoin.

### 3. Les équivalences de marques

« Emmental Carrefour ≈ Président ≈ marque Lidl » demande un modèle. Remplacé par
le rapprochement de `ingredients.ts` (`cleIngredient`), qui regroupe au pluriel
près, et à terme par une table d'alias apprise à la correction.

### 4. Les promotions et les programmes de fidélité

**Se connecter au compte fidélité d'une enseigne est hors d'atteinte, et le
restera** : aucune n'expose d'API publique, et il faudrait conserver les
identifiants du client d'un tiers — une responsabilité de sécurité sans commune
mesure avec ce que l'application apporterait en échange. Ce point-là du brief ne
se fera pas.

**Mais l'essentiel de la valeur ne demande aucun compte**, et c'est le sprint P5
décrit plus bas.

Ce qui existe déjà : le parseur rattache une **remise** au produit qui la précède
et compte les remises de pied de ticket, ce qui donne le prix réellement payé —
avantage fidélité compris, puisqu'il est imprimé sur le ticket.

---

## L'architecture, et la décision qui la structure

### Les relevés ne vont pas dans le document `jsonb`

C'est **la** règle du module. Mamakilo tient dans un seul document par compte,
et `CLAUDE.md` justifie ce choix par « le volume est minuscule ». Les prix
cassent cette prémisse : quatre tickets par semaine, une vingtaine de lignes,
soit environ cinq mille relevés par an — près d'un mégaoctet.

Or `modifier()` fait un `structuredClone` du document **entier** à chaque
écriture, et `enregistrer()` le renvoie **entier** à Supabase. Un document d'un
mégaoctet, c'est une latence à chaque case cochée dans la liste de courses,
c'est-à-dire sur l'écran qu'on utilise debout dans un rayon.

D'où la séparation :

| | Où | Quoi |
|---|---|---|
| Détail | IndexedDB (`lib/prix/depot.ts`) | Chaque ligne de chaque ticket |
| Agrégats | `EtatUtilisateur.prix` | Un résumé par produit, ~18 Ko |

Un relevé brut ne sert qu'à recalculer une moyenne ; il n'a pas besoin de suivre
l'utilisateur d'un appareil à l'autre. Sa disparition avec le navigateur coûte
l'historique fin, pas la fonctionnalité.

**Les agrégats se recalculent, ils ne s'entretiennent pas**
(`lib/prix/agregats.ts`). Un agrégat corrigé à l'incrément dérive à la première
ligne modifiée, et une moyenne fausse ne se voit pas : elle a l'air d'une
moyenne.

### Les fichiers

```
src/lib/ticket/
  types.ts       LigneOCR, LigneTicket, TicketLu, ControleTicket
  image.ts       préparation de la photo : gris, seuillage adaptatif
  ocr.worker.ts  Tesseract dans un worker
  ocr.ts         l'accès depuis le fil principal
  enseignes.ts   26 enseignes et leurs motifs
  parseur.ts     lignes d'OCR → ticket, et le contrôle
src/lib/prix/
  depot.ts       IndexedDB : relevés et en-têtes de tickets
  agregats.ts    dépouillement, écart au meilleur prix
src/pages/
  Ticket.tsx     photographier, corriger, enregistrer
  Prix.tsx       l'historique, la fiche d'un produit
outils/ocr.mjs   recopie le moteur WebAssembly depuis node_modules
public/tessdata/ le modèle de langue français (versionné, lui)
```

---

## Les règles à ne pas défaire

### Le ticket porte sa propre somme de contrôle

C'est ce qui rend un OCR gratuit digne de confiance. Le total imprimé est
confronté à l'addition des lignes lues (`controler`). S'il manque quelque chose,
l'application le dit et n'affirme rien. Un ticket qui retombe juste a été lu
correctement — pas « probablement », exactement.

Tolérance d'un centime : les arrondis de TVA font couramment varier le total de
cet ordre, et refuser pour ça enverrait corriger un ticket parfaitement lu.

### Aucun trou n'est comblé

Un prix illisible reste `null`, **jamais `0`**. Zéro deviendrait aussitôt le
« meilleur prix jamais vu » du produit et se propagerait dans tout l'historique.
Un trou visible se comble en deux gestes ; une erreur silencieuse ne se rattrape
jamais.

### La correction est le produit, pas un rattrapage

La lecture locale se trompe. L'écran est dessiné pour que corriger prenne deux
secondes, et chaque ligne douteuse affiche **le texte brut lu**, qui n'est jamais
réécrit — c'est la seule preuve de ce qui était imprimé une fois la photo jetée.

### Les réparations de chiffres sont volontairement timides

`O`→`0` et `I`/`l`→`1` seulement. `S` pour 5 et `B` pour 8 ne sont **pas**
corrigés : ces lettres apparaissent légitimement dans les libellés, et une
réparation fausse produirait un prix crédible mais inexact. Toute ligne réparée
est marquée douteuse — une correction est un pari, et un pari se montre.

### Les formats d'une enseigne sont distingués

Carrefour et Carrefour Market n'ont ni les mêmes prix ni les mêmes promotions.
Les confondre ferait conclure que l'hypermarché est toujours moins cher — ce qui
est vrai, et parfaitement inutile à qui n'a qu'une supérette en bas de chez lui.
`ENSEIGNES` est rangé **du plus précis au plus général** et lu dans cet ordre.

### Les prix sont ramenés à l'unité de comparaison

Euros par kilo pour ce qui se pèse, par pièce pour le reste. **On ne déduit pas
une contenance du libellé** : « 200G », « 20CL », « 1L » s'abrègent de vingt
façons selon l'enseigne, et une seule lecture ratée donnerait un écart de prix
imaginaire que l'application présenterait comme une économie.

### Les unités différentes ne se mélangent pas

« Jambon » à la barquette et « jambon » au poids donnent deux agrégats. Les
fondre produirait une moyenne entre un prix au kilo et un prix à la pièce, c'est-
à-dire un nombre qui ne désigne rien.

### Un seul relevé n'est pas un historique

`ecartAuMeilleur` rend `null` en dessous de deux relevés, et l'écran écrit « vu
une seule fois ». Afficher « 0 € d'écart » donnerait à un unique passage en
caisse l'autorité d'une moyenne.

---

## Les pièges rencontrés

### `worker.format` doit valoir `'es'`

Vite émet les workers en **IIFE** par défaut. Le lecteur démarre le sien en
`{ type: 'module' }`, ce qu'il doit faire — en développement, Vite sert un
fichier TypeScript avec ses imports. Le worker livré n'était donc pas un module
et le navigateur refusait de le charger.

**La panne n'existait qu'en production**, avec une erreur sans message, sans
fichier et sans ligne — comme toutes les erreurs de chargement de worker. Même
famille que la panne de déploiement du 29/07/2026 : un défaut que
`npm run dev` ne peut structurellement pas voir.

### `tesseract-wasm` n'expose ni ses types ni son `.wasm`

Son champ `exports` ne déclare que `.`, sans condition `types`. D'où deux
contournements : `paths` dans `tsconfig.json` pour atteindre les déclarations
qu'il livre pourtant, et `outils/ocr.mjs` pour recopier le binaire, faute de
pouvoir l'importer.

Le binaire est **régénéré** avant chaque `dev` et chaque `build`, Vercel compris,
plutôt que versionné : 3,5 Mo figés dans l'historique d'un dépôt public pour un
fichier qui se recopie. Le modèle de langue, lui, est versionné — il ne vient
d'aucun paquet npm, et le télécharger pendant le build ferait dépendre chaque
déploiement d'un dépôt tiers.

### Deux défauts que le typecheck ne pouvait pas voir

- `3 + 78/100` donnait `3.7800000000000002` sur la ligne. Le total s'en sortait
  parce qu'il est arrondi. Les montants se recomposent maintenant en centimes.
- Les produits au poids et les lots ressortaient **tous** « douteux » : leur prix
  arrive de la ligne de détail suivante, correctement, mais le drapeau posé faute
  de prix n'était jamais levé. Sur un vrai ticket, tous les fruits et tous les
  lots auraient été signalés — et un signal qui se déclenche partout ne distingue
  plus rien. D'où `poserPrix`, qui recalcule le doute.

### Une tuile qui ne pouvait pas être juste

L'écran des prix comptait les enseignes fréquentées à partir de la **dernière**
enseigne de chaque produit : deux courses de suite au même magasin faisaient
tomber le compte à un. Un nombre qu'on ne peut pas calculer juste n'a pas à être
affiché ; remplacé par l'écart total au meilleur prix, qui se calcule exactement
et qui est de toute façon le seul chiffre qui intéresse.

---

## Conformité

`VERSION_CONFIDENTIALITE` est passée au **2026-07-30**, ce qui redemande son
accord à tout le monde. C'était dû : une nouvelle catégorie de données est
collectée.

Trois points sont portés par le code et pas seulement par le texte :

- **L'image du ticket ne part nulle part et n'est pas conservée.** Elle est lue
  sur l'appareil, puis relâchée.
- **L'export (art. 20) contient les relevés locaux.** Ils ne sont pas dans
  `EtatUtilisateur`, et les oublier ferait d'un choix technique une amputation du
  droit : l'article porte sur tout ce que l'application détient, pas sur ce qui se
  trouve dans un stockage plutôt qu'un autre.
- **La suppression (art. 17) vide aussi IndexedDB.** Sans ça, « supprimer mes
  données » serait faux sans que rien ne le dise.

Aucun destinataire n'est ajouté : l'OCR est local, et les agrégats voyagent dans
le document déjà couvert par la mention Supabase.

---

## Chiffrer et répartir (P3 et P4)

### Le total est un plancher, annoncé comme tel

`lib/prix/panier.ts` chiffre chaque ligne au dernier prix connu. Ce qu'il ne sait
pas faire, il le compte à part : produit jamais vu, quantité illisible
(« quelques brins »), ou unité incompatible. L'écran écrit alors « au moins
45 €, six lignes non chiffrées » plutôt qu'un total rond.

Ce n'est pas de la prudence décorative : un total à 62 € qui en fait 90 en caisse
fait perdre confiance dans **tout** le module, y compris dans les chiffres justes.
Un plancher reste vrai, et se resserre tout seul à mesure qu'on lit des tickets.

**On ne déduit jamais un poids d'un libellé.** « 200 g d'emmental » face à un
historique à la pièce supposerait connaître le poids du paquet acheté la dernière
fois, que rien n'enregistre.

**Une seule arithmétique pour les deux écrans** : `quantiteEnUnites` est exportée
de `panier.ts` et réemployée par la répartition. Deux conversions différentes
donneraient deux totaux différents sur deux écrans — c'est la règle déjà posée
pour `cumulerQuantites` dans `ingredients.ts`.

### La répartition se compare au meilleur magasin unique

`lib/prix/repartition.ts` envoie chaque ligne au moins cher parmi les enseignes
cochées. Trois décisions portent l'honnêteté du chiffre annoncé :

- **La matrice produit × magasin se lit dans les relevés**, pas dans les agrégats
  — ceux-ci ne retiennent que la dernière et la meilleure enseigne. Pour chaque
  couple on garde **le relevé le plus récent et non le plus bas** : répartir sur
  une promotion vue il y a huit mois enverrait dans un magasin où l'écart n'existe
  plus.
- **L'économie se compare au meilleur magasin unique**, jamais au pire ni à une
  moyenne. La vraie alternative de quelqu'un qui hésite, c'est de tout acheter au
  même endroit ; comparer au pire gonflerait le chiffre sans décrire aucun choix
  réel.
- **Elle n'est annoncée que si ce magasin connaît tous les produits chiffrés.**
  Sinon on comparerait un panier complet à un panier incomplet, et l'économie
  serait un artefact de ce qui manque. L'écran le dit plutôt que d'afficher un
  nombre.

**Le mode « je ne vais que chez X » n'a pas de code séparé** : c'est la même
fonction avec une seule enseigne candidate. Les produits qu'on n'y a jamais
achetés ressortent en orphelins — exactement l'information utile avant de partir.

Les listes produites sont **indépendantes**, une par enseigne : on ne fait pas
ses courses dans deux magasins en même temps, et une liste unique à filtrer
obligerait à retrouver le bon filtre à chaque rayon.

---

## P5 — Les cartes de fidélité, sans compte enseigne

Demandé par Yann le 30/07/2026, cadré et non commencé. Trois briques, par ordre
de valeur, **toutes locales et sans API**.

### 1. Porter ses cartes (le gros de la valeur)

L'oubli de la carte coûte l'avantage entier. Or une carte de fidélité n'est
qu'un code-barres : le scanner une fois avec le lecteur **déjà en place**
(`components/Scanner.tsx`, qui sert au garde-manger), le ranger par enseigne, et
le réafficher en grand à la caisse.

Deux points à ne pas rater : l'écran doit **monter la luminosité au maximum** le
temps de l'affichage — une douchette lit mal un écran sombre, et c'est le seul
moment où l'app doit être vue de quelqu'un d'autre — et il doit fonctionner
**hors connexion**, puisqu'on est en caisse. Les formats sont EAN-13 ou Code 128 selon les enseignes.

**Rien de nouveau à installer** — vérifié le 30/07/2026 : `zxing-wasm`, déjà
présent pour le scan, publie aussi `zxing-wasm/writer` avec son propre
`zxing_writer.wasm`. Le même motif que `lib/decodeur.ts` s'applique : importer le
binaire en `?url` pour qu'il entre dans le build et que le service worker le
mette en cache, condition d'un affichage en caisse sans réseau. `npm audit`
reste donc à zéro, critère de choix des dépendances du projet.

Le numéro de carte est une donnée personnelle rattachée à une enseigne : il reste
dans le document de l'utilisateur, il entre dans l'export et dans la suppression,
et il se déclare dans la politique de confidentialité — donc
`VERSION_CONFIDENTIALITE` bouge.

### 2. Suivre la cagnotte

Les tickets impriment le solde (« cagnotte : 12,40 € », « vos avantages »). Le
parseur les écarte aujourd'hui comme lignes de service. Les lire donne un solde
par enseigne, daté, sans rien demander à personne — et un solde oublié est de
l'argent perdu.

**À ne pas confondre avec une remise** : une cagnotte créditée n'a pas baissé le
prix payé ce jour-là. La compter dans le total du ticket casserait la somme de
contrôle, qui est le garde-fou de tout le module.

### 3. Le prix réel, avantage déduit

Une fois la cagnotte suivie, la répartition entre enseignes peut tenir compte de
ce qu'on y a déjà accumulé. **À manier avec prudence** : une cagnotte n'est pas
de l'argent tant qu'elle n'est pas dépensée, et l'afficher comme une économie
acquise donnerait un chiffre flatteur et faux. Elle se montre à côté du total,
jamais dedans.

---

## Ce qui reste

- **P3 et P4 n'ont pas été vérifiés au pilote**, seulement au typecheck et au
  build. P1 et P2 l'ont été.
- **La table d'alias apprise** : rapprocher `EMMENT.CARR 250G` d'« emmental » se
  fait aujourd'hui au pluriel près seulement.
- **La quantité n'est pas corrigeable** dans l'écran de correction, seulement le
  libellé et le prix.
- **Le repêchage d'une ligne écartée** ne recalcule pas sa position dans le
  ticket : elle arrive en fin de liste.
