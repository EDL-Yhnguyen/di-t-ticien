import { defineConfig } from 'vitest/config'

/**
 * Configuration séparée de `vite.config.ts`, et volontairement.
 *
 * Les tests portent sur la logique pure — recherche, barèmes, arithmétique des
 * quantités, lecture d'un ticket. Aucun n'a besoin de React, de Tailwind ni du
 * DOM, et charger leurs greffons ferait payer trois secondes de compilation à
 * chaque exécution pour rien. Le jour où un composant sera testé, il faudra
 * ajouter `environment: 'jsdom'` **et** une dépendance de plus : ce sera une
 * décision, pas un effet de bord.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Le catalogue de recettes se génère à la première lecture ; deux secondes
    // suffisent largement, mais le défaut de 5 s cache une régression de
    // performance derrière une simple lenteur.
    testTimeout: 5000,
  },
})
