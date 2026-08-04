# Reprise — Mamakilo

Dernière séance : 2026-08-04 · dernier commit poussé : `ac2415f` *fix: aligner
les couleurs de la carte de partage sur la nouvelle identité*

## Où on en est

Deux chantiers menés dans la même séance, tous deux sur `main`, tous deux
poussés sur `origin` et déployés en production.

**La refonte de l'identité visuelle** (palette orange sanguine/citron vert/
menthe/rose radis, typographie Fredoka/Inter, signature « mamakilo » à côté de
la marmite inchangée) est fusionnée dans `main` et en ligne. Les 23 écrans ont
été balayés un par un, la worktree `refonte-design` est supprimée.

**La migration Supabase** (voir `MIGRATION-SUPABASE.md`) a exécuté les étapes
1 à 5 : schéma installé sur le projet A (`exovzmoygupllcdjbwtf`), les 7 comptes
de Mamakilo recréés ou rattachés (2 adresses existaient déjà côté Cérémonia/
GénieLab), leurs 7 documents copiés et vérifiés (tailles conformes à
l'original, y compris les deux listes de courses du plus gros compte,
corrigées après une troncature accidentelle en cours de copie), variables
Vercel et `.env.local` basculés sur le projet A, redirect URLs Auth ajoutées,
déploiement production vérifié Ready. **Yann a confirmé que les 7 comptes
migrés voient bien leurs données** après connexion — c'est la seule preuve qui
comptait. `npm run verifier`, les advisors de sécurité et la fonction
`supprimer_mon_compte()` de GénieLab (non écrasée, vérifiée par lecture directe
de sa définition) sont tous conformes à ce qu'attendait le document.

**L'étape 6, seul point de non-retour, est faite aussi** : le projet B
(`vdnfqijjmuxdrimbyyrv`) est supprimé sans sauvegarde `pg_dump` — tentée par
deux voies (connexion directe, puis pooler), les deux ont échoué (DNS, puis
mot de passe refusé) ; Yann a tranché que la migration déjà vérifiée des 7
comptes suffisait. Le projet Supabase du RH (`xvapiclrpaerjjyhakhf`,
`eu-west-3`) est créé avec le schéma de Skill Studio (12 tables) installé.
Son `.env` reste à compléter côté `EDL-Skill-Studio` (valeurs communiquées à
Yann en conversation, pas recopiées ici).

`MIGRATION-SUPABASE.md` a rempli son rôle et a été supprimé ; ce qui devait en
rester durablement est dans `CLAUDE.md`, section « Historique du projet »,
entrée du 04/08/2026.

Outillage installé cette séance sur cette machine et déjà authentifié : Vercel
CLI et Supabase CLI (`npm install -g vercel supabase`), utiles pour toute
bascule future.

## La prochaine action

Rien de bloquant côté Mamakilo. Deux choses en suspens, à reprendre quand
Yann le décide :

- Compléter le `.env` d'`EDL-Skill-Studio` avec les valeurs du projet RH pour
  pouvoir y travailler.
- La vidéo vitrine de Mamakilo (30-60 s, motion design stylisé, voix off
  française), chantier séparé jamais commencé — skill `hyperframes`.

## Décidé cette séance

- Les 8 thèmes de couleur disparaissent au profit d'un seul jeu de couleurs de
  marque ; la clé `localStorage` `equilibre:palette` des comptes existants
  devient inerte, sans être supprimée — elle ne casse rien, elle ne fait plus
  rien.
- La marmite (`public/icone.svg`, composant `Marque`) reste strictement
  inchangée — Yann l'a préférée à 24 pistes alternatives.
- La vidéo vitrine (30-60 s, motion design stylisé, voix off française)
  évoquée au cadrage est un chantier séparé, pas commencé, à traiter via le
  skill `hyperframes` le jour où il démarre.
- Deux observations relevées au balayage des 23 écrans ne sont **pas** des
  défauts de ce chantier et n'ont pas été corrigées : l'émoji 🫧 de « Le
  souffle » (`/app/jeux`) rendu en glyphe manquant (couverture de police de
  l'environnement de test, sans lien avec Fredoka/Inter), et
  `/app/mode-cuisine` vide en l'absence de séance active (routage
  préexistant, non touché par ce chantier).

## À ne pas refaire

- Ne pas figer la couleur de `SignatureMarque` en `#24303C` — illisible en
  mode sombre. Utiliser `text-ink`.
- Ne pas laisser le nom accessible de `SignatureMarque` se calculer depuis le
  texte visuel : le cœur qui remplace le point du i vit dans un SVG, et un
  SVG `aria-hidden` sans alternative fait lire « mamaklo ». La structure
  correcte porte `aria-label="mamakilo"` sur le `<span>` englobant, avec tout
  le contenu visuel (texte + SVG) dans un `<span aria-hidden="true">` interne.
- Ne pas s'étonner que `--accent` en texte (`text-accent`) ressorte olive/
  sombre plutôt que citron vif : c'est `--accent-vif` qui porte le citron
  fluo, réservé aux aplats. Contrainte de contraste physique, pas un réglage
  à corriger.
- Ne pas recopier à la main un document JSON volumineux collé dans la
  conversation sans vérifier ensuite sa taille sur `pg_column_size` : une
  copie de l'étape 4 de la migration avait silencieusement réduit deux listes
  de courses à `[]`. Toujours revérifier la taille après un `insert`/`update`
  portant des données utilisateur copiées à la main.
- Le connecteur MCP Vercel n'expose aucune action pour lire ou écrire des
  variables d'environnement, ni la liste des déploiements de façon fiable (son
  jeton a expiré en cours de séance) — passer par le CLI (`vercel env`,
  `vercel ls`, `vercel inspect`) une fois installé et lié
  (`vercel link --project mamakilo`).
- Les *Redirect URLs* d'authentification Supabase ne se règlent ni par SQL ni
  par le MCP `execute_sql`/`apply_migration` : uniquement par le tableau de
  bord (Authentication → URL Configuration), ou par l'API Management avec un
  jeton d'accès personnel. `supabase config push` existe mais pousse la
  configuration Auth *entière* du `config.toml` local — un risque réel
  d'écraser des réglages déjà en place (SMTP, site URL) pour ne changer qu'un
  seul champ. Ne pas l'utiliser pour une modification ciblée.
