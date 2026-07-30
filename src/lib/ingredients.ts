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

/* ─────────────────────────── Cumuler les quantités ─────────────────────────── */

/**
 * Cette arithmétique vivait dans `listeDeCourses`, qui était seule à en avoir
 * besoin. La liste de courses persistante y ajoute des produits saisis à la
 * main et des semaines entières versées l'une après l'autre : il fallait que
 * les deux additionnent de la même façon, sinon « 2 + 2 oignons » d'un côté et
 * « 4 oignons » de l'autre feraient deux lignes pour la même chose.
 */

const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
}

/** Unités qui ne prennent jamais de « s » : « 3 CàS », pas « 3 CàSs ». */
const UNITES_INVARIABLES = new Set(['g', 'kg', 'mg', 'ml', 'cl', 'dl', 'l', 'cc', 'cs', 'càs', 'càc'])

interface Quantite {
  valeur: number
  /** Ce qui suit le nombre : « g », « CàS », « tranches », ou rien du tout. */
  unite: string
}

/**
 * Lit « 2 tranches », « 1 ½ », « 40 g » — et rend `null` sur « quelques brins »
 * ou « pour la semaine », qui ne sont pas des nombres.
 */
function lireQuantite(texte: string): Quantite | null {
  const m = /^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔])?\s*(.*)$/.exec(texte.trim())
  if (!m) return null

  const [, entier, fraction, reste] = m
  if (!entier && !fraction) return null

  const valeur = (entier ? Number(entier.replace(',', '.')) : 0) + (fraction ? FRACTIONS[fraction] : 0)
  return { valeur, unite: reste.trim() }
}

/**
 * Deux unités se cumulent si elles désignent la même chose au singulier près.
 * « 60 g crues » et « 50 g cru » restent séparés : l'écart de forme cache ici
 * un écart d'état — cuit ou cru —, et additionner les deux mentirait.
 *
 * Le pluriel se défait en `-s` **et en `-x`** : « 1 rouleau » et « 2 rouleaux »
 * faisaient sinon deux termes juxtaposés au lieu de trois rouleaux, et on relit
 * « 1 rouleau + 2 rouleaux » au rayon en se demandant ce qu'on doit prendre.
 */
function memeUnite(a: string, b: string): boolean {
  const forme = (u: string) => u.toLowerCase().replace(/[sx]$/, '')
  return forme(a) === forme(b)
}

/** « 1 ½ pot » et non « 1 ½ pots » : en français le pluriel commence à deux. */
function accorder(unite: string, valeur: number): string {
  if (valeur < 2 || unite === '' || unite.includes(' ')) return unite
  if (UNITES_INVARIABLES.has(unite.toLowerCase()) || /[sx]$/.test(unite)) return unite
  // Rouleaux, morceaux, tuyaux : le pluriel de ces mots-là est en « x », et un
  // « 3 rouleaus » dans une liste de courses se voit tout de suite. Les mots en
  // « -eu » sont laissés de côté : leurs exceptions (pneus, bleus) sont plus
  // fréquentes que les unités qu'ils désigneraient.
  if (/(eau|au)$/.test(unite)) return `${unite}x`
  return `${unite}s`
}

function ecrireQuantite(q: Quantite): string {
  // Trois tiers font un entier, pas « 1,0 » : on recolle avant d'écrire.
  const arrondie = Math.abs(q.valeur - Math.round(q.valeur)) < 0.02 ? Math.round(q.valeur) : q.valeur
  const entier = Math.floor(arrondie)
  const reste = arrondie - entier

  let nombre = String(entier)
  const glyphe = Object.entries(FRACTIONS).find(([, v]) => Math.abs(reste - v) < 0.02)?.[0]
  if (glyphe) nombre = entier === 0 ? glyphe : `${entier} ${glyphe}`
  else if (reste > 0.02) nombre = arrondie.toFixed(1).replace('.', ',')

  return q.unite ? `${nombre} ${accorder(q.unite, arrondie)}` : nombre
}

/**
 * Additionne `ajout` dans `existante`, en juxtaposant ce qui n'est pas
 * comparable : « 1 CàS » et « ½ » n'ont pas de somme, mais sur une semaine de
 * menus la juxtaposition seule donnait « 1 + ¼ + 1 + ½ + ½ », illisible au
 * rayon.
 */
/**
 * Multiplie une quantité — « 120 g » pour deux personnes fait « 240 g ».
 *
 * Ce qui n'est pas un nombre est **rendu tel quel** : « quelques brins » pour
 * quatre reste « quelques brins », et écrire « 4 quelques brins » serait à la
 * fois faux et ridicule. Une quantité composée (« 1 CàS + ½ ») voit chacun de
 * ses termes multiplié.
 */
export function multiplierQuantite(quantite: string, facteur: number): string {
  if (facteur === 1) return quantite

  return quantite
    .split(' + ')
    .map((terme) => {
      const lu = lireQuantite(terme)
      if (!lu) return terme
      return ecrireQuantite({ valeur: lu.valeur * facteur, unite: lu.unite })
    })
    .join(' + ')
}

export function cumulerQuantites(existante: string, ajout: string): string {
  // Le terme à grossir se cherche parmi tous, pas seulement le dernier :
  // « 1 moyenne », « 3 », « 1 moyenne » doit donner « 2 moyennes + 3 » et non
  // trois termes côte à côte parce que les unités alternent.
  const termes = existante.split(' + ')
  const lu = lireQuantite(ajout)
  const place = lu
    ? termes.findIndex((terme) => {
        const t = lireQuantite(terme)
        return t !== null && memeUnite(t.unite, lu.unite)
      })
    : termes.indexOf(ajout.trim()) // « quelques brins » deux fois reste « quelques brins »

  if (place === -1) return `${existante} + ${ajout}`
  if (!lu) return existante

  const terme = lireQuantite(termes[place]) as Quantite
  const unite = terme.unite.length >= lu.unite.length ? terme.unite : lu.unite
  termes[place] = ecrireQuantite({ valeur: terme.valeur + lu.valeur, unite })
  return termes.join(' + ')
}
