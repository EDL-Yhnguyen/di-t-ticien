# Reprise — Mamakilo

Dernière séance : 2026-08-04 · dernier commit : `fdf19d3` *fix: donner un nom
accessible correct à SignatureMarque (le cœur cachait le i)*

## Où on en est

La refonte de l'identité visuelle (palette orange sanguine/citron vert/menthe/
rose radis, typographie Fredoka/Inter, signature « mamakilo » à côté de la
marmite inchangée) est livrée sur la branche `refonte-design`, dans la
worktree `C:\Users\YHN\Documents\Git\.worktrees\mamakilo-refonte-design`.
`npm run verifier` passe (422/422 tests, 0 échec de contraste), `npm ci && npm
run build` sur une copie propre ne signale aucune dérive de lockfile. Les 23
écrans de l'application ont été balayés un par un : aucune erreur console,
aucune régression visuelle imputable à ce chantier.

**Rien n'est fusionné dans `main` ni poussé sur `origin`.** Tout le travail
reste sur `refonte-design`, dans cette worktree.

## La prochaine action

Fusionner `refonte-design` dans `main` (ou ouvrir une pull request), puis
pousser — vérifier d'abord l'état du chantier de migration Supabase qui a pu
avancer sur `main` pendant ce temps (voir `MIGRATION-SUPABASE.md` côté dépôt
principal), pour ne pas écraser un travail en cours dans un autre chantier.

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
