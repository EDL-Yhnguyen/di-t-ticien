import { RECETTES, recetteParId } from './index'
import type { Recette } from './types'
import type { Criteres } from '../catalogue'
import { rechercher } from '../catalogue'

/**
 * D'où viennent les recettes.
 *
 * Aujourd'hui elles sont écrites en dur dans `src/lib/recettes/`, et à
 * cinquante-trois c'est le bon choix : le catalogue fonctionne hors connexion, se
 * relit en revue de code, et ne coûte pas une requête. Cette abstraction existe
 * pour le jour où il ne le sera plus — vers le millier de recettes, quand le
 * paquet JavaScript pèserait plus que l'application. La table et la fonction de
 * recherche correspondantes sont déjà écrites : `supabase/catalogue.sql`.
 *
 * **Ce que cette abstraction achète, et ce qu'elle n'achète pas.** Elle localise
 * la provenance : un seul module à remplacer, et la forme des pages est déjà
 * décidée (curseur, pas `offset`). Elle ne rendra pas la bascule gratuite pour
 * autant, et prétendre le contraire serait un mensonge utile à personne : les
 * écrans consomment aujourd'hui `RECETTES` de façon **synchrone**, et lire depuis
 * une base impose des états de chargement et une pagination visible. Le travail
 * restant est localisé et prévisible, pas nul.
 */

/** Une page de résultats, prête à être suivie par la suivante. */
export interface PageRecettes {
  recettes: Recette[]
  /**
   * Le curseur à passer pour la page suivante, `null` en fin de liste.
   *
   * Un curseur et non un numéro de page : `offset 20000` fait relire à Postgres
   * vingt mille lignes pour en jeter dix-neuf mille neuf cent quatre-vingts, et
   * la dernière page coûterait cent fois la première. Le format suit l'index
   * déclaré dans `catalogue.sql` : le titre, puis l'identifiant pour départager.
   */
  suivant: { titre: string; id: string } | null
}

export interface SourceRecettes {
  /**
   * Le catalogue entier, ou `null` quand il est trop gros pour tenir en mémoire.
   *
   * Cette méthode est ce qui permet à l'existant de continuer à fonctionner
   * sans changement : tant qu'elle rend un tableau, les écrans peuvent filtrer
   * eux-mêmes. Une source distante rendra `null`, et c'est ce `null` qui
   * signalera au développeur, à la compilation, tous les endroits à reprendre.
   */
  tout(): Recette[] | null
  parId(id: string): Promise<Recette | undefined>
  chercher(
    criteres: Criteres,
    p?: { taille?: number; apres?: { titre: string; id: string } | null },
  ): Promise<PageRecettes>
}

/** La taille de page par défaut : de quoi remplir deux écrans de téléphone. */
const TAILLE_PAGE = 20

/**
 * La source embarquée — celle qui sert aujourd'hui.
 *
 * La recherche réemploie `rechercher()` de `catalogue.ts` plutôt que d'écrire un
 * second filtre : deux implémentations de la même recherche divergeraient au
 * premier critère ajouté, et l'écran n'afficherait plus la même chose selon la
 * provenance.
 */
export const sourceEmbarquee: SourceRecettes = {
  tout() {
    return RECETTES
  },

  async parId(id) {
    return recetteParId(id)
  },

  async chercher(criteres, p) {
    const taille = p?.taille ?? TAILLE_PAGE
    // Trié comme le fait `catalogue.sql` : sans le même ordre, la pagination
    // sauterait ou répéterait des recettes en changeant de source.
    const trouvees = rechercher(criteres).sort(
      (a, b) => a.titre.localeCompare(b.titre, 'fr') || a.id.localeCompare(b.id),
    )

    const depart = p?.apres
      ? trouvees.findIndex(
          (r) =>
            r.titre.localeCompare(p.apres!.titre, 'fr') > 0 ||
            (r.titre === p.apres!.titre && r.id > p.apres!.id),
        )
      : 0

    if (depart === -1) return { recettes: [], suivant: null }

    const page = trouvees.slice(depart, depart + taille)
    const dernier = page.at(-1)
    const reste = depart + page.length < trouvees.length

    return {
      recettes: page,
      suivant: reste && dernier ? { titre: dernier.titre, id: dernier.id } : null,
    }
  },
}

/**
 * La source en place. Un point de bascule unique, volontairement trivial.
 *
 * L'implémentation Supabase n'est pas écrite, et ce n'est pas un oubli : le
 * catalogue distant n'a aucun contenu à servir (voir le point 2 de `CUISINE.md`),
 * et une source qui interrogerait une table vide remplacerait cinquante-trois
 * recettes par zéro. Elle s'écrira le jour où la table sera peuplée, contre la
 * fonction `chercher_recettes` déjà déclarée dans `supabase/catalogue.sql`, dont
 * les paramètres correspondent terme à terme à `Criteres` et à `PageRecettes`.
 */
export const source: SourceRecettes = sourceEmbarquee
