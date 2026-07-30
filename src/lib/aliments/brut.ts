import type { FamilleAliment } from '../types'

/**
 * La forme compacte d'un aliment dans les fichiers de données.
 *
 * Les noms de champs sont courts et le tableau `v` est positionnel — ce qui est
 * un mauvais réflexe partout ailleurs, et le bon ici : la base compte plus de
 * mille entrées, et une entrée doit tenir sur **une ligne** pour qu'on puisse la
 * relire, la comparer à sa voisine et repérer une valeur aberrante d'un coup
 * d'œil. Écrite en objet nommé, chaque aliment prendrait dix lignes et la
 * relecture deviendrait impossible.
 *
 * La conversion vers `Aliment`, elle, se fait une fois dans `index.ts`, avec les
 * noms complets.
 */
export interface Brut {
  id: string
  nom: string
  /** Famille au sens du barème Nutri-Score. Absente = `general`. */
  f?: FamilleAliment
  /** kcal, protéines, glucides, sucres, lipides, saturés, fibres, sel — pour 100 g. */
  v: [number, number, number, number, number, number, number, number]
  /** Portion usuelle en grammes. */
  g?: number
  /** Comment on la nomme : « 1 pomme », « 2 tranches ». */
  p?: string
  /** Part de fruits, légumes et légumineuses en %. Entre dans le Nutri-Score. */
  fl?: number
  /**
   * Les autres noms sous lesquels on cherche cet aliment.
   *
   * À réserver aux vrais synonymes d'usage — « patate » pour la pomme de terre,
   * « clémentine » pour la mandarine — et non aux variantes orthographiques, que
   * la recherche par préfixe absorbe déjà toute seule.
   */
  syn?: string[]
  /**
   * Vrai pour ce que le coach ne doit pas proposer spontanément.
   *
   * Le coach suggère un aliment pour combler un manque : il balaie la base et
   * garde les mieux notés. Sans ce garde-fou, une base de mille entrées lui fait
   * répondre « ajoutez des algues nori » à quelqu'un qui manque de fibres — ce
   * n'est pas faux, ce n'est simplement pas un conseil qu'on suit. Le champ ne
   * retire rien de la **recherche** : l'aliment reste trouvable, il n'est
   * seulement jamais proposé de lui-même.
   */
  rare?: boolean
}
