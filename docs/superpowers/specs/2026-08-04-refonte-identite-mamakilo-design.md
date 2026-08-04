# Refonte de l'identité visuelle de Mamakilo

Séance du 2026-08-04, avec Yann. Cadrée via le compagnon visuel de
brainstorming (maquettes conservées, hors dépôt, dans
`.superpowers/brainstorm/` du dépôt principal).

## Contexte et objectif

Mamakilo est en production, avec de vrais utilisateurs et des données de
santé réelles. La demande initiale — « refonte complète du design » — a été
cadrée en atelier plutôt qu'exécutée directement, parce que le projet porte
des contraintes dures (palette validée en vision daltonienne, échelle
Nutri-Score officielle, 15 commits non poussés et une migration Supabase en
cours sur `main`).

**Objectif retenu** : une nouvelle identité visuelle complète (palette de
marque, typographie, signature du logo) appliquée aux 23 écrans de
l'application, plus une vidéo vitrine de 30-60 secondes pour la page
d'accueil publique — sans toucher aux couleurs de données, sans perturber le
chantier de migration en cours.

**D'où vient le nom, pour mémoire** : « Mamakilo » est le petit nom que le
fils de Yann donne à sa mère. Ce n'est pas un jeu de mots marketing — la
première passe de logos (abstraite, géométrique) a été refusée pour cette
raison précise : elle manquait de cette tendresse-là. Toute décision de ton,
de copywriting ou de personnage sur ce projet doit s'y référer.

## Identité visuelle

### Logo — inchangé, avec une signature en dessous

**La marmite (`public/icone.svg`) reste strictement telle quelle.** Yann l'a
tranché après avoir vu 24 pistes alternatives : aucune n'égalait l'original.
Conséquence directe et bienvenue : **aucune icône PWA n'est régénérée**
(192/512/180), aucun bump de cache de service worker n'est nécessaire pour
cette raison-là.

Ce qui s'ajoute est une **signature de marque** — la marmite accompagnée du
mot « mamakilo » en dessous, utilisée sur les surfaces qui présentent la
marque en entier (accueil public, écran de connexion, à-propos) plutôt que
partout où l'icône seule suffit (barre de navigation, favicon) :

- Mot « mamakilo » en encre marine (`#24303C`, la teinte déjà utilisée dans
  le tracé du visage de la marmite — aucune couleur nouvelle introduite ici).
- Un petit cœur remplace le point du « i », dessiné en trait plein (pas le
  caractère `♥` utilisé dans les maquettes de travail).
- Typographie de la signature : **Fredoka**, la même police que les titres
  (voir plus bas) — pas de troisième famille de police pour ce seul usage.

### Palette de marque — 4 rôles, clair et sombre

Remplace les jetons `--primaire`, `--accent`, `--reussite`, `--alerte`
actuels (teinte « Marmite » corail/apricot/basil/berry). **Les 8 thèmes de
couleur sélectionnables disparaissent** au profit d'un seul jeu de couleurs de
marque — voir « Simplification du système » plus bas.

Valeurs de départ, telles que validées à l'écran dans le compagnon visuel.
**Ce sont des points de départ, pas des valeurs figées** : `outils/palettes.mjs`
les revalidera au calcul de contraste sur les quatre fonds (`surface`,
`ground`, `sunken`, lavis propre) et les assombrira ou les éclaircira si
nécessaire, exactement comme il l'a fait pour la palette actuelle.

| Rôle | Clair (fond `#FFFDF7`) | Sombre (fond `#191510`) |
|---|---|---|
| **Primaire** — orange sanguine | bouton `#FF6B1A` / texte `#CC4A00` | bouton `#FF8A3D` / texte `#FF9351` |
| **Accent** — citron vert fluo | lavis `#EAF9C8` / texte `#4E7A00` | lavis `#25330C` / texte `#C6E86B` |
| **Réussite** — menthe | lavis `#D8F5EE` / texte `#00786A` | lavis `#0C3833` / texte `#5FD9C4` |
| **Alerte** — rose radis | lavis `#FCE0EA` / texte `#7A0E38` | lavis `#3D1224` / texte `#FFB8D2` |

**Ce qui ne bouge pas, sans exception** : `--assiette-legume/feculent/proteine`
(validés ΔE≥8 en vision daltonienne), `--nutri-a` à `--nutri-e` (échelle
officielle), `--bande-vert/bleu/orange`, `--macro-proteines/glucides/lipides`.
Ces jetons sont déclarés une fois dans `index.css`, hors thème, et le
resteront. Les toucher n'est pas dans le périmètre de ce chantier.

### Typographie — Fredoka + Inter

- **Fredoka** (titres, `--font-display`) : rondes, chaleureuses, poids 500 et
  700. Remplace Faustina.
- **Inter** (texte courant et chiffres, `--font-sans`) : très lisible, chiffres
  tabulaires nets — important sur une application dense en données
  nutritionnelles. Poids 400 et 700. Remplace Figtree.

Les deux sont libres (licence OFL, Google Fonts) et **seront rapatriées en
local** exactement comme Faustina/Figtree aujourd'hui : `outils/polices.mjs`
regénéré pour ces deux familles, `.woff2` et licences dans `public/polices/`,
sous-ensembles latins uniquement préchargés. Aucune requête vers
`fonts.gstatic.com` en production — c'est la même raison RGPD que la première
migration du 31/07/2026, elle ne se rouvre pas.

Le remplacement de police change les fichiers servis : **le service worker
doit changer de version** (`mamakilo-v2` → `mamakilo-v3`) pour purger
l'ancien cache de polices chez les PWA déjà installées, comme lors du premier
rapatriement.

## Simplification du système de thème

Les 8 thèmes sélectionnables (Marmite, Potager, Agrumes, Myrtille, Océan,
Cacao, Framboise, Encre) laissent place à **un seul jeu de couleurs de
marque**. Clair / sombre / système restent — ce sont deux réglages
indépendants dans le système actuel, et seul celui de la couleur disparaît.

Conséquences concrètes :

- Le sélecteur de thème de couleur quitte l'écran Profil.
- `outils/palettes.mjs` se simplifie : il ne génère plus seize variantes mais
  deux (clair/sombre), et vérifie toujours leurs contrastes. Son rôle ne
  change pas, son ampleur oui.
- `src/lib/apparence.ts` perd la liste `THEMES` et la logique de sélection
  associée ; `appliquerApparence()` garde la bascule clair/sombre/système et
  la mise à jour de `<meta name="theme-color">`.
- **La clé `localStorage` `equilibre:palette`** des comptes existants (valeurs
  historiques comme `potager`, `ocean`, etc.) devient inerte : elle n'est plus
  lue, mais **elle n'est pas effacée** — ni suppression active, ni migration
  nécessaire, elle ne fait simplement plus rien. C'est cohérent avec le
  principe déjà en place de ne pas synthétiser de suppression de donnée non
  demandée.

## Portée et exécution

**Les 23 écrans sont repris dans ce chantier** (décision explicite de Yann,
plutôt qu'un sous-ensemble). L'exécution suit deux temps pour limiter le
risque d'une direction à corriger sur 23 fichiers plutôt que sur 3 :

1. **Écrans de référence** — `Accueil.tsx` (page publique), `Onboarding.tsx`
   (ou `Consentement.tsx`, à confirmer au moment de l'implémentation),
   `Aujourdhui.tsx` (l'écran principal une fois connecté). Le nouveau système
   de jetons (`index.css`), les composants `ui.tsx` et la signature de marque
   sont construits et validés avec Yann sur ces trois écrans avant d'aller
   plus loin.
2. **Propagation mécanique** aux 20 écrans restants, en réutilisant le
   vocabulaire visuel (`Bouton`, `Carte`, `Tuile`, `Etiquette`, etc.) une fois
   son nouveau style arrêté — pas de nouvelle décision de design par écran,
   seulement de l'application cohérente.

**Isolation** : le chantier vit dans la worktree
`C:\Users\YHN\Documents\Git\.worktrees\mamakilo-refonte-design`, branche
`refonte-design` (déjà créée). Le chantier de migration Supabase en cours,
dans la worktree `mamakilo-synchro` (branche `synchro-fiable`), n'est ni lu ni
modifié.

**Dépendances** : le projet interdit par défaut d'introduire des bibliothèques
de composants (voir `CLAUDE.md`, `npm audit` à zéro comme critère). Yann a
autorisé une exception ciblée : une bibliothèque légère peut être ajoutée en
cours de chantier si elle apporte une vraie valeur, à condition de rester
gratuite et de ne faire remonter aucune vulnérabilité. Pas d'ajout par
défaut — seulement si un besoin précis apparaît pendant l'implémentation.

## Vidéo vitrine

- **Durée** : 30 à 60 secondes.
- **Traitement** : reconstitution stylisée en motion design — pas des
  captures d'écran littérales de l'application. Conséquence utile : elle peut
  se préparer **en parallèle** du reste du chantier, sans attendre que les 23
  écrans soient livrés.
- **Narration** : voix off en français.
- **Outillage** : skill `hyperframes` (composition HTML/CSS/GSAP, rendu
  local, gratuit) — palette, typographie et signature de marque de ce
  document servent de base visuelle.
- **Diffusion** : intégrée à la page d'accueil publique (`Accueil.tsx`),
  usage vitrine (page d'accueil / réseaux), pas un tutoriel pas-à-pas.

## Vérification

- `npm run verifier` reste la commande de référence : tests (inchangés, aucun
  fichier de logique métier n'est touché par ce chantier), contraste des
  couleurs (désormais 4 rôles × 2 modes au lieu de 4×8), typecheck, build.
- `node outils/palettes.mjs --verifie` doit sortir en 0 avant tout commit
  touchant `index.css` ou le générateur.
- Vérification manuelle par écran livré : mode clair et sombre, 375 px et
  desktop, aucune erreur console — reprise du protocole habituel du projet.
- Aucune table Supabase, aucun champ persistant, aucune fonction serverless
  n'est concernée : c'est un chantier visuel, pas fonctionnel.

## Risques et arbitrages restants

- **Les valeurs hexadécimales de la palette sont indicatives** ; leur passage
  au script de contraste peut les faire bouger légèrement. Si un ajustement
  change sensiblement la perception d'une teinte (ex. l'orange doit
  s'assombrir beaucoup pour tenir sur `ground`), le revalider à l'écran avec
  Yann plutôt que de livrer silencieusement une teinte différente de celle
  approuvée.
- **Le choix de l'écran « Onboarding » vs « Consentement » comme deuxième
  écran de référence** est à trancher au moment de l'implémentation, selon
  lequel est le plus représentatif du nouveau vocabulaire de composants
  (formulaires, choix à puces).
- **La vidéo vitrine dépend de la signature de marque et de la palette**,
  mais pas des 23 écrans finis — elle peut donc démarrer dès les écrans de
  référence validés, sans attendre la fin de la propagation.
