/**
 * Rapprocher deux noms de produits écrits par des mains différentes.
 *
 * Le catalogue dit « Filet de poulet », l'utilisateur note « poulet » en
 * rentrant des courses, l'étiquette d'Open Food Facts dit « Blanc de poulet
 * fermier ». Ces trois lignes désignent la même chose et doivent se
 * reconnaître, sinon le garde-manger ne sert à rien : il annoncerait qu'il
 * manque un ingrédient déjà dans le frigo.
 *
 * C'est un rapprochement **par les noms**, pas un inventaire vérifié. On peut
 * donc se tromper — d'où le vocabulaire prudent des écrans (« vous avez
 * peut-être »), et le fait que rien ne se déduit du stock sans que la personne
 * le confirme.
 */

/**
 * Mots qui ne distinguent pas un produit d'un autre : ils décrivent une
 * préparation, une qualité ou une origine. « Poulet fermier » et « poulet »
 * doivent se rejoindre ; « huile » et « olive » doivent rester deux mots
 * porteurs, parce que « huile d'olive » n'est pas « olives ».
 */
const MOTS_VIDES_BRUTS = [
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'au', 'aux', 'en', 'et', 'ou', 'à',
  'bio', 'frais', 'fraîche', 'fraîches', 'nature', 'spécial', 'spéciale',
  'entier', 'entière', 'demi', 'petit', 'petite', 'grand', 'grande', 'gros', 'grosse',
  'moyen', 'moyenne', 'cru', 'crue', 'cuit', 'cuite', 'surgelé', 'surgelée',
  'tranche', 'tranches', 'morceau', 'morceaux', 'sachet', 'boîte', 'pot', 'brique',
  'maison', 'fermier', 'fermière', 'allégé', 'allégée', 'sans', 'avec',
]

/** « Épinards » → « epinard ». Accents et pluriels ne doivent pas séparer. */
function normaliserMot(mot: string): string {
  // La décomposition NFD détache l'accent de sa lettre ; le filtre qui suit ne
  // garde que a-z0-9 et emporte donc les accents avec la ponctuation, sans
  // avoir à écrire une plage de signes diacritiques qu'un outil mal encodé
  // abîmerait. Les ligatures, elles, ne se décomposent pas — même en NFKD,
  // Unicode ne donne aucune équivalence à « œ » — et « œufs » deviendrait
  // « ufs » sans la première ligne. Les œufs sont dans une recette sur trois.
  return mot
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/s$/, '')
}

/**
 * Les mots vides passent par la même normalisation que les mots comparés.
 *
 * Sans ça, « frais » se normalise en « frai » et ne se retrouve plus dans une
 * liste écrite au naturel : le filtre laissait passer la moitié de ses propres
 * entrées, celles qui finissent par un « s ».
 */
const MOTS_VIDES = new Set(MOTS_VIDES_BRUTS.map(normaliserMot))

/**
 * La clé de regroupement de la liste de courses : le nom au pluriel près.
 *
 * Volontairement plus stricte que `motsPorteurs` — sur une liste de courses,
 * fusionner deux lignes à tort est pire que d'en laisser deux : on part au
 * magasin avec une quantité fausse.
 */
export function cleIngredient(nom: string): string {
  return nom
    .toLowerCase()
    .split(' ')
    .map((mot) => mot.replace(/s$/, ''))
    .join(' ')
}

/**
 * Les mots qui désignent vraiment le produit. Les mots d'un seul ou deux
 * caractères tombent avec les mots vides : « à », « d' » n'aident personne.
 */
export function motsPorteurs(nom: string): string[] {
  return nom
    .split(/[\s'’,()/-]+/)
    .map(normaliserMot)
    .filter((mot) => mot.length >= 3 && !MOTS_VIDES.has(mot))
}

/**
 * Vrai quand deux noms partagent un mot porteur.
 *
 * Le sens est asymétrique dans l'usage : on demande « est-ce que ce que j'ai
 * couvre cet ingrédient », et un stock « Poulet » couvre « Filet de poulet ».
 * L'inverse est aussi vrai ici, et c'est assumé : quelqu'un qui a noté
 * « Filet de poulet » dans son frigo a bien du poulet.
 *
 * **Un seul mot commun suffit, et ça se trompe parfois** : « Huile d'olive »
 * et « Olives noires » partagent « olive ». Exiger deux mots communs
 * supprimerait ce faux positif mais ferait perdre « Escalope de poulet »
 * contre « Filet de poulet », qui est le cas fréquent. On garde donc la règle
 * large, et **l'écran affiche toujours l'article du stock qui a produit la
 * correspondance** : une erreur visible et vérifiable d'un coup d'œil ne coûte
 * rien, une erreur silencieuse enverrait cuisiner sans huile.
 */
export function memeProduit(a: string, b: string): boolean {
  const motsA = motsPorteurs(a)
  if (motsA.length === 0) return false
  const motsB = new Set(motsPorteurs(b))
  return motsA.some((mot) => motsB.has(mot))
}
