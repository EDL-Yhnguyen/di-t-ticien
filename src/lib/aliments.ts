import { avecNutriScore } from './nutriscore'
import type { Aliment, FamilleAliment, ValeursPour100 } from './types'

/**
 * Base d'aliments courants, embarquée dans l'application.
 *
 * Elle existe pour deux raisons : la recherche doit répondre instantanément et
 * hors connexion, et un aliment brut — une pomme, du blanc de poulet — n'a pas
 * de code-barres à scanner. Les valeurs sont des moyennes de tables de
 * composition (Ciqual), pas des étiquettes de marque : ce sont des repères.
 *
 * Pour un produit emballé, le scan du code-barres reste la bonne porte : il
 * ramène l'étiquette réelle et le Nutri-Score officiel.
 */

interface Brut {
  id: string
  nom: string
  famille?: FamilleAliment
  /** kcal, protéines, glucides, sucres, lipides, saturés, fibres, sel. */
  v: [number, number, number, number, number, number, number, number]
  portionG?: number
  portionLibelle?: string
  partFruitsLegumes?: number
}

function valeurs(v: Brut['v']): ValeursPour100 {
  return {
    kcal: v[0],
    proteines: v[1],
    glucides: v[2],
    sucres: v[3],
    lipides: v[4],
    satures: v[5],
    fibres: v[6],
    sel: v[7],
  }
}

const BRUTS: Brut[] = [
  /* Fruits */
  { id: 'pomme', nom: 'Pomme', v: [52, 0.3, 12, 10, 0.2, 0, 2.4, 0], portionG: 150, portionLibelle: '1 pomme', partFruitsLegumes: 100 },
  { id: 'banane', nom: 'Banane', v: [89, 1.1, 20, 12, 0.3, 0.1, 2.6, 0], portionG: 120, portionLibelle: '1 banane', partFruitsLegumes: 100 },
  { id: 'orange', nom: 'Orange', v: [47, 0.9, 9, 9, 0.1, 0, 2.4, 0], portionG: 180, portionLibelle: '1 orange', partFruitsLegumes: 100 },
  { id: 'fraise', nom: 'Fraises', v: [32, 0.7, 6, 5, 0.3, 0, 2, 0], portionG: 150, portionLibelle: '1 bol', partFruitsLegumes: 100 },
  { id: 'raisin', nom: 'Raisin', v: [69, 0.7, 16, 16, 0.2, 0.1, 0.9, 0], portionG: 120, portionLibelle: '1 grappe', partFruitsLegumes: 100 },
  { id: 'kiwi', nom: 'Kiwi', v: [61, 1.1, 12, 9, 0.5, 0, 3, 0], portionG: 90, portionLibelle: '1 kiwi', partFruitsLegumes: 100 },
  { id: 'compote', nom: 'Compote sans sucre ajouté', v: [45, 0.3, 10, 10, 0.1, 0, 1.4, 0], portionG: 100, portionLibelle: '1 gourde', partFruitsLegumes: 100 },

  /* Légumes */
  { id: 'salade-verte', nom: 'Salade verte', v: [15, 1.4, 1.5, 0.8, 0.2, 0, 1.3, 0], portionG: 60, portionLibelle: '1 portion', partFruitsLegumes: 100 },
  { id: 'tomate', nom: 'Tomate', v: [18, 0.9, 3.2, 2.6, 0.2, 0, 1.2, 0], portionG: 120, portionLibelle: '1 tomate', partFruitsLegumes: 100 },
  { id: 'carotte', nom: 'Carotte', v: [36, 0.8, 6.7, 5, 0.2, 0, 2.8, 0.1], portionG: 100, portionLibelle: '1 carotte', partFruitsLegumes: 100 },
  { id: 'courgette', nom: 'Courgette', v: [20, 1.5, 2.2, 2, 0.3, 0.1, 1.1, 0], portionG: 150, portionLibelle: '1 portion', partFruitsLegumes: 100 },
  { id: 'brocoli', nom: 'Brocoli', v: [35, 3, 3, 1.6, 0.4, 0.1, 3.3, 0], portionG: 150, portionLibelle: '1 portion', partFruitsLegumes: 100 },
  { id: 'haricot-vert', nom: 'Haricots verts', v: [31, 1.8, 4, 1.8, 0.2, 0, 3.4, 0], portionG: 150, portionLibelle: '1 portion', partFruitsLegumes: 100 },
  { id: 'epinard', nom: 'Épinards', v: [23, 2.9, 1.2, 0.4, 0.4, 0.1, 2.2, 0.2], portionG: 150, portionLibelle: '1 portion', partFruitsLegumes: 100 },
  { id: 'poivron', nom: 'Poivron', v: [26, 1, 4.6, 3.5, 0.3, 0.1, 1.8, 0], portionG: 120, portionLibelle: '1 poivron', partFruitsLegumes: 100 },
  { id: 'champignon', nom: 'Champignons de Paris', v: [22, 3.1, 1.4, 1.2, 0.3, 0.1, 1.8, 0], portionG: 100, portionLibelle: '1 portion', partFruitsLegumes: 100 },
  { id: 'soupe-legumes', nom: 'Soupe de légumes', v: [38, 1.1, 5.6, 2.2, 1.2, 0.3, 1.5, 0.6], portionG: 250, portionLibelle: '1 bol', partFruitsLegumes: 80 },

  /* Féculents */
  { id: 'riz-cuit', nom: 'Riz blanc cuit', v: [130, 2.7, 28, 0.1, 0.3, 0.1, 0.4, 0], portionG: 150, portionLibelle: '1 portion' },
  { id: 'riz-complet-cuit', nom: 'Riz complet cuit', v: [123, 2.7, 25, 0.4, 1, 0.2, 1.6, 0], portionG: 150, portionLibelle: '1 portion' },
  { id: 'pates-cuites', nom: 'Pâtes cuites', v: [158, 5.8, 31, 0.6, 0.9, 0.2, 1.8, 0], portionG: 180, portionLibelle: '1 portion' },
  { id: 'pomme-terre', nom: 'Pommes de terre cuites', v: [87, 1.9, 20, 0.9, 0.1, 0, 1.8, 0], portionG: 200, portionLibelle: '2 pommes de terre' },
  { id: 'quinoa-cuit', nom: 'Quinoa cuit', v: [120, 4.4, 21, 0.9, 1.9, 0.2, 2.8, 0] , portionG: 150, portionLibelle: '1 portion' },
  { id: 'lentilles', nom: 'Lentilles cuites', v: [116, 9, 20, 1.8, 0.4, 0.1, 7.9, 0], portionG: 150, portionLibelle: '1 portion', partFruitsLegumes: 100 },
  { id: 'pois-chiche', nom: 'Pois chiches cuits', v: [139, 8.9, 21, 3.5, 2.6, 0.3, 7.6, 0], portionG: 150, portionLibelle: '1 portion', partFruitsLegumes: 100 },
  { id: 'pain-complet', nom: 'Pain complet', v: [247, 9.7, 41, 3.3, 3.4, 0.7, 6.5, 1.1], portionG: 50, portionLibelle: '2 tranches' },
  { id: 'pain-blanc', nom: 'Baguette', v: [274, 8.8, 55, 2.6, 1.3, 0.3, 2.7, 1.3], portionG: 50, portionLibelle: '1/5 de baguette' },
  { id: 'flocons-avoine', nom: 'Flocons d’avoine', v: [370, 13, 59, 1.1, 7, 1.3, 10, 0], portionG: 40, portionLibelle: '4 cuillères' },
  { id: 'semoule', nom: 'Semoule cuite', v: [112, 3.8, 23, 0.2, 0.2, 0, 1.4, 0], portionG: 150, portionLibelle: '1 portion' },

  /* Protéines */
  { id: 'poulet', nom: 'Blanc de poulet', v: [121, 26, 0, 0, 1.8, 0.5, 0, 0.2], portionG: 130, portionLibelle: '1 filet' },
  { id: 'dinde', nom: 'Escalope de dinde', v: [111, 24, 0, 0, 1.3, 0.4, 0, 0.2], portionG: 120, portionLibelle: '1 escalope' },
  { id: 'boeuf-hache-5', nom: 'Steak haché 5 %', v: [136, 21, 0, 0, 5, 2.3, 0, 0.2], portionG: 125, portionLibelle: '1 steak' },
  { id: 'boeuf-hache-15', nom: 'Steak haché 15 %', v: [219, 19, 0, 0, 15, 6.5, 0, 0.2], portionG: 125, portionLibelle: '1 steak' },
  { id: 'saumon', nom: 'Saumon', v: [203, 20, 0, 0, 13, 3, 0, 0.1], portionG: 130, portionLibelle: '1 pavé' },
  { id: 'cabillaud', nom: 'Cabillaud', v: [82, 18, 0, 0, 0.7, 0.1, 0, 0.2], portionG: 130, portionLibelle: '1 filet' },
  { id: 'thon-naturel', nom: 'Thon au naturel', v: [116, 26, 0, 0, 1, 0.3, 0, 0.9], portionG: 100, portionLibelle: '1 boîte' },
  { id: 'oeuf', nom: 'Œuf', v: [143, 12.6, 0.7, 0.4, 9.5, 3.1, 0, 0.4], portionG: 60, portionLibelle: '1 œuf' },
  { id: 'jambon-blanc', nom: 'Jambon blanc', v: [113, 19, 1, 0.8, 3.5, 1.2, 0, 2.2], portionG: 40, portionLibelle: '1 tranche' },
  { id: 'tofu', nom: 'Tofu nature', v: [121, 12, 1.5, 0.6, 7, 1.1, 1.2, 0], portionG: 120, portionLibelle: '1 portion' },
  { id: 'crevette', nom: 'Crevettes', v: [99, 21, 0.2, 0, 1.4, 0.3, 0, 1.2], portionG: 100, portionLibelle: '1 portion' },

  /* Produits laitiers */
  { id: 'yaourt-nature', nom: 'Yaourt nature', v: [61, 3.5, 4.7, 4.7, 3.2, 2, 0, 0.1], portionG: 125, portionLibelle: '1 pot' },
  { id: 'yaourt-0', nom: 'Yaourt nature 0 %', v: [42, 4.4, 5.9, 5.9, 0.1, 0.1, 0, 0.1], portionG: 125, portionLibelle: '1 pot' },
  { id: 'skyr', nom: 'Skyr nature', v: [63, 11, 4, 4, 0.2, 0.1, 0, 0.1], portionG: 150, portionLibelle: '1 pot' },
  { id: 'fromage-blanc', nom: 'Fromage blanc 3 %', v: [74, 7.5, 4.5, 4.5, 3, 2, 0, 0.1], portionG: 100, portionLibelle: '1 portion' },
  { id: 'lait-demi', nom: 'Lait demi-écrémé', famille: 'boisson', v: [46, 3.2, 4.8, 4.8, 1.5, 1, 0, 0.1], portionG: 200, portionLibelle: '1 verre' },
  { id: 'emmental', nom: 'Emmental', famille: 'fromage', v: [382, 28, 0.5, 0.5, 30, 19, 0, 0.6], portionG: 30, portionLibelle: '1 portion' },
  { id: 'camembert', nom: 'Camembert', famille: 'fromage', v: [299, 20, 0.5, 0.5, 24, 16, 0, 1.6], portionG: 30, portionLibelle: '1 portion' },
  { id: 'chevre', nom: 'Fromage de chèvre', famille: 'fromage', v: [271, 18, 2, 2, 21, 15, 0, 1.5], portionG: 30, portionLibelle: '1 portion' },

  /* Matières grasses */
  { id: 'huile-olive', nom: 'Huile d’olive', famille: 'matiere-grasse', v: [899, 0, 0, 0, 99.9, 14, 0, 0], portionG: 10, portionLibelle: '1 cuillère à soupe' },
  { id: 'huile-colza', nom: 'Huile de colza', famille: 'matiere-grasse', v: [899, 0, 0, 0, 99.9, 7.4, 0, 0], portionG: 10, portionLibelle: '1 cuillère à soupe' },
  { id: 'beurre', nom: 'Beurre', famille: 'matiere-grasse', v: [744, 0.7, 0.6, 0.6, 82, 52, 0, 0.1], portionG: 10, portionLibelle: '1 noisette' },
  { id: 'beurre-allege', nom: 'Beurre allégé 60 %', famille: 'matiere-grasse', v: [547, 0.5, 0.5, 0.5, 60, 39, 0, 0.4], portionG: 10, portionLibelle: '1 noisette' },
  { id: 'avocat', nom: 'Avocat', v: [169, 1.8, 1.8, 0.7, 16, 3.3, 5.1, 0], portionG: 100, portionLibelle: '1/2 avocat', partFruitsLegumes: 100 },
  { id: 'amande', nom: 'Amandes', v: [634, 21, 5.5, 4, 53, 4.2, 12, 0], portionG: 25, portionLibelle: '1 poignée', partFruitsLegumes: 100 },
  { id: 'noix', nom: 'Noix', v: [698, 15, 4.5, 2.6, 67, 6.3, 6.1, 0], portionG: 25, portionLibelle: '1 poignée', partFruitsLegumes: 100 },

  /* Boissons */
  { id: 'eau', nom: 'Eau', famille: 'boisson', v: [0, 0, 0, 0, 0, 0, 0, 0], portionG: 250, portionLibelle: '1 verre' },
  { id: 'cafe', nom: 'Café noir', famille: 'boisson', v: [2, 0.2, 0, 0, 0, 0, 0, 0], portionG: 100, portionLibelle: '1 tasse' },
  { id: 'the', nom: 'Thé non sucré', famille: 'boisson', v: [1, 0, 0, 0, 0, 0, 0, 0], portionG: 200, portionLibelle: '1 tasse' },
  { id: 'jus-orange', nom: 'Jus d’orange', famille: 'boisson', v: [45, 0.7, 10, 9, 0.2, 0, 0.2, 0], portionG: 200, portionLibelle: '1 verre', partFruitsLegumes: 100 },
  { id: 'soda-cola', nom: 'Soda au cola', famille: 'boisson', v: [42, 0, 10.6, 10.6, 0, 0, 0, 0], portionG: 330, portionLibelle: '1 canette' },
  { id: 'biere', nom: 'Bière blonde', famille: 'boisson', v: [43, 0.5, 3.6, 0.1, 0, 0, 0, 0], portionG: 250, portionLibelle: '1 demi' },
  { id: 'vin-rouge', nom: 'Vin rouge', famille: 'boisson', v: [85, 0.1, 2.6, 0.6, 0, 0, 0, 0], portionG: 125, portionLibelle: '1 verre' },

  /* Ce qu'on grignote — la catégorie qui manque le plus dans un journal */
  { id: 'chips', nom: 'Chips', v: [536, 6.6, 50, 0.6, 34, 3.1, 4.4, 1.3], portionG: 30, portionLibelle: '1 poignée' },
  { id: 'chocolat-noir', nom: 'Chocolat noir 70 %', v: [598, 7.8, 46, 24, 43, 24, 11, 0], portionG: 20, portionLibelle: '4 carrés' },
  { id: 'chocolat-lait', nom: 'Chocolat au lait', v: [535, 7.6, 59, 52, 30, 18, 3.4, 0.2], portionG: 20, portionLibelle: '4 carrés' },
  { id: 'biscuit-sec', nom: 'Biscuits secs', v: [460, 7, 72, 22, 16, 7, 2.5, 0.6], portionG: 25, portionLibelle: '3 biscuits' },
  { id: 'croissant', nom: 'Croissant', v: [406, 8.2, 42, 8, 22, 13, 2.4, 0.9], portionG: 60, portionLibelle: '1 croissant' },
  { id: 'pain-chocolat', nom: 'Pain au chocolat', v: [414, 7.5, 44, 13, 22, 13, 2.8, 0.7], portionG: 70, portionLibelle: '1 pain au chocolat' },
  { id: 'glace-vanille', nom: 'Glace à la vanille', v: [207, 3.5, 24, 22, 11, 7, 0.7, 0.1], portionG: 100, portionLibelle: '2 boules' },
  { id: 'pizza', nom: 'Pizza margherita', v: [253, 11, 30, 3.4, 9.7, 4.5, 2.1, 1.2], portionG: 200, portionLibelle: '1/2 pizza' },
  { id: 'frites', nom: 'Frites', v: [312, 3.4, 41, 0.6, 15, 2, 3.8, 0.5], portionG: 150, portionLibelle: '1 portion' },
  { id: 'burger', nom: 'Hamburger', v: [254, 12, 24, 4.5, 12, 5, 1.6, 1.1], portionG: 220, portionLibelle: '1 burger' },
  { id: 'sandwich-jambon', nom: 'Sandwich jambon beurre', v: [239, 11, 29, 2, 8.7, 4.2, 1.9, 1.4], portionG: 200, portionLibelle: '1 sandwich' },
]

export const BASE_ALIMENTS: Aliment[] = BRUTS.map((b) =>
  avecNutriScore({
    id: `base:${b.id}`,
    nom: b.nom,
    famille: b.famille ?? 'general',
    valeurs: valeurs(b.v),
    partFruitsLegumes: b.partFruitsLegumes,
    portionG: b.portionG,
    portionLibelle: b.portionLibelle,
    source: 'base',
  }),
)

/**
 * Retire accents et casse : « pâtes » doit sortir sur « pates ».
 *
 * Les diacritiques que `normalize('NFD')` détache occupent le bloc Unicode
 * U+0300–U+036F. On les filtre par code plutôt que par intervalle littéral :
 * un intervalle de caractères combinants dans une expression régulière est
 * invisible à la relecture et se perd au premier copier-coller.
 */
const DIACRITIQUE_MIN = 0x0300
const DIACRITIQUE_MAX = 0x036f

function normaliser(texte: string): string {
  let sortie = ''
  for (const caractere of texte.normalize('NFD')) {
    const code = caractere.codePointAt(0) ?? 0
    if (code >= DIACRITIQUE_MIN && code <= DIACRITIQUE_MAX) continue
    sortie += caractere === '’' || caractere === "'" ? ' ' : caractere.toLowerCase()
  }
  return sortie
}

export function chercherDansLaBase(requete: string, limite = 12): Aliment[] {
  const q = normaliser(requete.trim())
  if (q.length < 2) return []

  return BASE_ALIMENTS.map((aliment) => {
    const nom = normaliser(aliment.nom)
    if (nom.startsWith(q)) return { aliment, rang: 0 }
    if (nom.includes(q)) return { aliment, rang: 1 }
    return null
  })
    .filter((x): x is { aliment: Aliment; rang: number } => x !== null)
    .sort((a, b) => a.rang - b.rang || a.aliment.nom.localeCompare(b.aliment.nom))
    .slice(0, limite)
    .map((x) => x.aliment)
}
