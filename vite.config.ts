import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },

  /**
   * Les workers sont émis en module, et ce n'est pas un détail de style.
   *
   * Le lecteur de tickets démarre son worker en `{ type: 'module' }`, ce qu'il
   * doit faire : en développement, Vite sert un fichier TypeScript avec ses
   * imports, donc rien d'autre ne peut fonctionner. Mais le format par défaut à
   * la compilation est `iife` — le worker livré n'était alors pas un module, et
   * le navigateur refusait de le charger.
   *
   * La panne n'existait **qu'en production** : parfaite en `npm run dev`,
   * l'erreur arrivait sans message ni fichier ni ligne, comme toutes les
   * erreurs de chargement de worker. C'est le même piège que la panne de
   * déploiement du 29/07/2026 — un défaut que le développement ne peut pas
   * voir. Ne pas retirer cette ligne.
   */
  worker: { format: 'es' },
})
