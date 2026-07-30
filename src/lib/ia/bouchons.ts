import type {
  ContraintesRecette,
  PortFrigo,
  PortRecettes,
  PortSubstitutions,
  PortsIA,
  Resultat,
} from './types'

/**
 * Les bouchons : ce que répondent les ports tant qu'aucun modèle n'est branché.
 *
 * **Ils ne renvoient jamais de données inventées.** Un bouchon qui rendrait deux
 * recettes plausibles ferait passer un test, tromperait la revue, et finirait par
 * proposer à quelqu'un un plat que personne n'a écrit. Ils rendent donc un échec
 * explicite, avec un message affichable — la même convention que le scan photo et
 * le coach, qui répondent 503 avec `configurable: true`.
 *
 * Conséquence pratique : un écran qui consomme un port doit gérer l'échec **dès
 * son premier jour**, pas « plus tard quand ce sera branché ». C'est voulu. Un
 * chemin d'erreur écrit après coup est un chemin d'erreur jamais essayé.
 */

/** Le message est au singulier de l'action, pour se lire dans un écran. */
function nonConfigure<T>(action: string): Resultat<T> {
  return {
    ok: false,
    raison: 'non-configure',
    message: `${action} demande un modèle d’IA, qui n’est pas activé sur cette installation.`,
  }
}

export const bouchonRecettes: PortRecettes = {
  description: {
    id: 'recettes',
    nom: 'Écrire une recette',
    apport: 'Compose une recette à partir de ce qu’il reste, quand le catalogue ne propose rien.',
    donneesTransmises: [
      'les ingrédients que vous choisissez d’envoyer',
      'vos contraintes de repas (moment, temps disponible, régime)',
      'votre repère calorique pour ce repas',
    ],
  },
  // Le paramètre est nommé et non ignoré : la signature du bouchon documente ce
  // que l'implémentation réelle recevra.
  async proposer(_contraintes: ContraintesRecette) {
    return nonConfigure('Écrire une recette')
  },
}

export const bouchonFrigo: PortFrigo = {
  description: {
    id: 'frigo',
    nom: 'Lire une photo de frigo',
    apport: 'Remplit le garde-manger depuis une photo, au lieu de tout saisir au clavier.',
    donneesTransmises: ['la photo que vous prenez'],
  },
  async lire(_imageBase64: string) {
    return nonConfigure('Lire une photo de frigo')
  },
}

export const bouchonSubstitutions: PortSubstitutions = {
  description: {
    id: 'substitutions',
    nom: 'Trouver un remplacement',
    apport: 'Propose par quoi remplacer un ingrédient manquant, hors des cas déjà écrits.',
    donneesTransmises: [
      'le nom de la recette en cours',
      'l’ingrédient manquant',
      'les produits que vous acceptez de citer',
    ],
  },
  async substituer(_p) {
    return nonConfigure('Trouver un remplacement')
  },
}

/**
 * L'unique point d'accès aux ports.
 *
 * Une constante et non une fabrique : il n'y a rien à configurer côté client, et
 * le jour où une implémentation réelle arrive, elle se substitue **ici**, à un
 * seul endroit. Les écrans, eux, importent `PORTS_IA` et ne savent pas ce qu'il
 * y a derrière — c'est tout l'objet de ce dossier.
 *
 * Une implémentation réelle ne devra jamais vivre dans `src/` : tout ce qui
 * demande une clé passe par une fonction serverless de `/api`, comme
 * `analyser-assiette.ts` et `coach.ts`. Le port appellerait donc `/api/…`, et
 * `@anthropic-ai/sdk` resterait hors du paquet envoyé au navigateur.
 */
export const PORTS_IA: PortsIA = {
  recettes: bouchonRecettes,
  frigo: bouchonFrigo,
  substitutions: bouchonSubstitutions,
}

/** Vrai si au moins un port sait faire quelque chose — faux aujourd'hui. */
export function iaDisponible(): boolean {
  return false
}
