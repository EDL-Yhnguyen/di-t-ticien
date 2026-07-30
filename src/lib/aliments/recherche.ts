/**
 * La recherche dans la base d'aliments embarquée.
 *
 * ## Pourquoi un module à part, et pas trois lignes d'`includes()`
 *
 * C'est ce qu'il y avait, et ça ratait le cas le plus courant qui soit : la base
 * contenait « Pommes de terre cuites », quelqu'un tapait « pomme de terre », et
 * l'application répondait qu'elle ne connaissait pas la pomme de terre. Une
 * comparaison de chaînes brutes exige que l'utilisateur devine le pluriel, la
 * qualification (« cuites ») et l'ordre des mots du rédacteur de la base. Personne
 * ne devine ça, et l'écran d'ajout est le premier geste du produit.
 *
 * La recherche travaille donc par **jetons**, avec trois règles :
 *
 * 1. **Tous les mots de la requête doivent correspondre.** Cumuler, jamais
 *    élargir : « pomme terre » ne doit pas ramener toutes les pommes.
 * 2. **Un mot correspond par préfixe**, dans les deux sens. C'est ce qui absorbe
 *    les pluriels sans table de conjugaison — « pomme » est un préfixe de
 *    « pommes », « poireau » de « poireaux », « chou » de « choux » — et c'est
 *    aussi ce qui fait répondre pendant la frappe : « courg » trouve la courgette.
 *    Une singularisation par règles butait sur « noix », qu'elle amputait en
 *    « noi ».
 * 3. **Les mots-outils ne comptent pas.** « de », « à », « au » sont dans un nom
 *    sur deux ; les exiger ferait échouer « pommes terre » et ne distingue rien.
 *
 * Les synonymes vivent avec la donnée (`syn`) et non ici : « patate » n'est pas
 * une règle de langue, c'est un fait sur un aliment précis.
 */

import type { Aliment } from '../types'

/**
 * Retire accents, ligatures et ponctuation.
 *
 * `œ` ne se décompose pas en NFD — « œuf » doit se trouver en tapant « oeuf »,
 * d'où le remplacement explicite avant la décomposition. L'apostrophe et le tiret
 * deviennent des espaces plutôt que rien : « huile d’olive » donne deux mots, et
 * « chou-fleur » se cherche aussi bien en deux mots qu'en un.
 *
 * **Les diacritiques se suppriment à part, avant la ponctuation.** `normalize('NFD')`
 * les détache en caractères autonomes ; les balayer avec le reste dans un
 * `[^a-z0-9]+ → ' '` les remplace par une espace et coupe le mot en morceaux —
 * « pâtes » devenait « p a tes ». Le défaut reste invisible tant que la requête
 * porte le même accent que le nom, puisque les deux se déforment pareil : il
 * n'apparaît que sur « pates completes » tapé sans accent, c'est-à-dire
 * exactement la requête qu'on voulait faire aboutir.
 *
 * L'intervalle est écrit en échappements `\u` et non en caractères littéraux :
 * une plage de signes combinants dans une expression régulière est invisible à la
 * relecture et se perd au premier copier-coller mal encodé.
 */
const DIACRITIQUES = /[\u0300-\u036f]/g

export function normaliser(texte: string): string {
  return texte
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(DIACRITIQUES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Les mots qui ne portent pas de sens dans un nom d'aliment.
 *
 * Volontairement court : il ne contient que des articles et des prépositions.
 * Y mettre « cuit » ou « nature » serait tentant — ce sont les qualificatifs qui
 * font échouer les requêtes — mais ils distinguent parfois deux entrées (« Pois
 * chiches cuits » et « Pois chiches secs » n'ont pas les mêmes calories), et un
 * mot retiré ne peut plus départager.
 */
const MOTS_OUTILS = new Set(['de', 'du', 'des', 'd', 'le', 'la', 'les', 'l', 'a', 'au', 'aux', 'en', 'et', 'sans', 'the'])

/** Les mots porteurs d'un texte. « le » reste si c'est le seul mot tapé. */
export function jetons(texte: string): string[] {
  const mots = normaliser(texte).split(' ').filter(Boolean)
  const porteurs = mots.filter((m) => !MOTS_OUTILS.has(m))
  return porteurs.length > 0 ? porteurs : mots
}

/**
 * Un mot de la requête reconnaît un mot du nom.
 *
 * Le préfixe joue dans les deux sens, mais pas aux mêmes conditions. Dans le sens
 * « la requête est plus courte » (`courg` → `courgette`), c'est la frappe en cours
 * et tout est permis. Dans l'autre (`pommes` → `pomme`), c'est un pluriel ou une
 * variante, et on exige trois lettres au mot reconnu : sans ce seuil, « oeufs »
 * reconnaissait « oe » et n'importe quel nom contenant deux lettres reconnaissait
 * tout.
 */
function reconnait(requete: string, mot: string): boolean {
  if (mot.startsWith(requete)) return true
  return mot.length >= 3 && requete.startsWith(mot)
}

/**
 * Le texte indexé d'un aliment, calculé une seule fois.
 *
 * Sans ce cache, chaque caractère tapé normalisait les 1 200 noms de la base.
 * Une `Map` par identifiant plutôt qu'un champ sur l'aliment : un `Aliment` est
 * recopié dans chaque entrée du journal, et un index de recherche n'a rien à
 * faire dans un document enregistré.
 */
interface Index {
  /** Le nom entier, normalisé — sert à repérer la correspondance exacte. */
  nom: string
  mots: string[]
  /** Les mots des synonymes, à plat. */
  synonymes: string[]
}

const index = new Map<string, Index>()

/** Les synonymes déclarés par la donnée, posés ici par `index.ts` au chargement. */
const synonymesDe = new Map<string, string[]>()

export function declarerSynonymes(id: string, mots: string[]): void {
  synonymesDe.set(id, mots)
}

function indexer(aliment: Aliment): Index {
  const connu = index.get(aliment.id)
  if (connu) return connu

  const calcule: Index = {
    nom: normaliser(aliment.nom),
    mots: jetons(aliment.nom),
    synonymes: (synonymesDe.get(aliment.id) ?? []).flatMap((s) => jetons(s)),
  }
  index.set(aliment.id, calcule)
  return calcule
}

/**
 * Le rang d'un résultat — plus petit, plus haut dans la liste.
 *
 * `null` veut dire « ne correspond pas ». Les rangs sont espacés pour laisser de
 * la place à une nuance sans renuméroter tout le barème.
 */
function rangDe(requete: string, mots: string[], entree: Index): number | null {
  if (entree.nom === requete) return 0
  if (entree.nom.startsWith(requete)) return 10

  // Le synonyme **mot pour mot** passe avant le nom reconnu par préfixe, et c'est
  // ce qui rend les synonymes utiles. « chocolatine » commence par « chocolat »,
  // donc le préfixe inverse le fait reconnaître par « Chocolat blanc », « Chocolat
  // chaud » et six autres tablettes ; le pain au chocolat, seul à le déclarer en
  // toutes lettres, sortait derrière eux et hors des premiers résultats. Un nom
  // exact vaut mieux qu'un début de mot commun.
  if (entree.synonymes.length > 0 && mots.every((m) => entree.synonymes.includes(m))) return 15

  const tousDansLeNom = mots.every((m) => entree.mots.some((mot) => reconnait(m, mot)))
  if (tousDansLeNom) {
    // Reconnu dès le premier mot du nom : « pomme de terre » doit passer devant
    // « purée de pommes de terre », qui parle d'abord d'autre chose.
    return entree.mots.length > 0 && reconnait(mots[0], entree.mots[0]) ? 20 : 30
  }

  // Les synonymes en préfixe en dernier recours : ils servent à retrouver un
  // aliment sous son autre nom, pas à en inventer un.
  const cherchables = [...entree.mots, ...entree.synonymes]
  if (mots.every((m) => cherchables.some((mot) => reconnait(m, mot)))) return 40

  return null
}

/**
 * Les aliments de la base qui répondent à la requête.
 *
 * À rang égal, le nom le plus court gagne : quelqu'un qui tape « pomme » veut la
 * pomme, pas la « Pomme au four à la cannelle ». C'est le tri qui remplace, sans
 * champ supplémentaire, une notion de popularité qu'on n'a pas les moyens de
 * mesurer.
 */
export function chercherParmi(base: Aliment[], requete: string, limite = 20): Aliment[] {
  const q = normaliser(requete)
  if (q.length < 2) return []
  const mots = jetons(requete)
  if (mots.length === 0) return []

  const trouves: { aliment: Aliment; rang: number }[] = []
  for (const aliment of base) {
    const rang = rangDe(q, mots, indexer(aliment))
    if (rang !== null) trouves.push({ aliment, rang })
  }

  return trouves
    .sort(
      (a, b) =>
        a.rang - b.rang ||
        a.aliment.nom.length - b.aliment.nom.length ||
        a.aliment.nom.localeCompare(b.aliment.nom, 'fr'),
    )
    .slice(0, limite)
    .map((x) => x.aliment)
}
