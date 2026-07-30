/**
 * Les ports d'IA du module Cuisine — sprint C6.
 *
 * Importer depuis `'../lib/ia'` et rien d'autre : les fichiers internes peuvent
 * bouger, ce point d'entrée est le contrat.
 *
 * ## Brancher un modèle, le jour où la question se reposera
 *
 * 1. Écrire la fonction serverless dans `/api` — jamais dans `src/`, qui part
 *    dans le navigateur. `api/coach.ts` sert de patron : runtime `nodejs`,
 *    `export async function POST(requete: Request)`, contexte réécrit ligne à
 *    ligne côté serveur plutôt que sérialisé tel quel.
 * 2. Écrire l'implémentation du port, qui appelle cette fonction et rend un
 *    `Resultat`. Elle remplace le bouchon dans `PORTS_IA`, et rien d'autre ne
 *    change.
 * 3. **Reprendre le consentement.** Chaque port déclare ses `donneesTransmises` :
 *    ajouter un destinataire de données de santé impose de mettre à jour
 *    `DESTINATAIRES` dans `legal.ts` et de faire bouger
 *    `VERSION_CONFIDENTIALITE`, ce qui redemande son accord à tout le monde.
 *    Ce n'est pas une formalité : c'est la condition pour que l'envoi soit licite.
 * 4. Vérifier que `@anthropic-ai/sdk` n'a pas fuité dans le paquet client :
 *    `grep -c anthropic dist/assets/index-*.js` doit renvoyer 0.
 *
 * ## Ce qui n'aura jamais de port ici
 *
 * Le planificateur de menus, les bandes caloriques, les verdicts de repas et les
 * recommandations restent des règles lisibles (`menu.ts`, `nutriscore.ts`,
 * `coach.ts`). Un chiffre affiché sur un écran de santé doit pouvoir s'expliquer
 * par une soustraction, pas par un modèle. Cette frontière est la même depuis le
 * sprint du coach conversationnel ; la déplacer demanderait de reposer la
 * question.
 */

export { PORTS_IA, bouchonFrigo, bouchonRecettes, bouchonSubstitutions, iaDisponible } from './bouchons'
export type {
  ContraintesRecette,
  DescriptionPort,
  PortFrigo,
  PortRecettes,
  PortSubstitutions,
  PortsIA,
  Resultat,
} from './types'
