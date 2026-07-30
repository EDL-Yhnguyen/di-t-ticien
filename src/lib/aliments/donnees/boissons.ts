import type { Brut } from '../brut'

/**
 * Eaux, cafés, thés, jus, sodas et boissons alcoolisées.
 *
 * Toutes portent `f: 'boisson'` — le Nutri-Score a un barème dédié, plus sévère
 * sur les sucres, parce qu'un verre se boit sans effort et ne rassasie pas. Les
 * laits et les boissons végétales sont avec les produits laitiers : c'est là
 * qu'on les cherche.
 *
 * Les alcools sont dans la base parce qu'ils comptent dans une journée — un demi
 * et un verre de vin font l'équivalent d'un dessert. Ils portent `rare` : le
 * coach ne propose pas de boire.
 */
export const BOISSONS: Brut[] = [
  /* ── Eaux ── */
  { id: 'eau', nom: 'Eau', f: 'boisson', v: [0, 0, 0, 0, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'eau-gazeuse', nom: 'Eau gazeuse', f: 'boisson', v: [0, 0, 0, 0, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'eau-aromatisee', nom: 'Eau aromatisée', f: 'boisson', v: [20, 0, 5, 5, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'eau-coco', nom: 'Eau de coco', f: 'boisson', v: [20, 0.7, 4, 4, 0.2, 0.2, 0, 0.1], g: 250, p: '1 verre', rare: true },

  /* ── Cafés et thés ── */
  { id: 'cafe', nom: 'Café noir', f: 'boisson', v: [2, 0.2, 0, 0, 0, 0, 0, 0], g: 100, p: '1 tasse', syn: ['expresso'] },
  { id: 'cafe-lait', nom: 'Café au lait', f: 'boisson', v: [40, 2, 3, 3, 1.5, 1, 0, 0.1], g: 200, p: '1 tasse' },
  { id: 'cappuccino', nom: 'Cappuccino', f: 'boisson', v: [55, 2.5, 5, 5, 2.5, 1.6, 0, 0.1], g: 200, p: '1 tasse' },
  { id: 'latte', nom: 'Café latte', f: 'boisson', v: [50, 3, 4.5, 4.5, 2, 1.3, 0, 0.1], g: 250, p: '1 tasse' },
  { id: 'cafe-sucre', nom: 'Café sucré', f: 'boisson', v: [22, 0.2, 5, 5, 0, 0, 0, 0], g: 100, p: '1 tasse' },
  { id: 'the', nom: 'Thé non sucré', f: 'boisson', v: [1, 0, 0, 0, 0, 0, 0, 0], g: 200, p: '1 tasse' },
  { id: 'the-vert', nom: 'Thé vert', f: 'boisson', v: [1, 0, 0, 0, 0, 0, 0, 0], g: 200, p: '1 tasse' },
  { id: 'the-sucre', nom: 'Thé sucré', f: 'boisson', v: [21, 0, 5, 5, 0, 0, 0, 0], g: 200, p: '1 tasse' },
  { id: 'the-glace', nom: 'Thé glacé', f: 'boisson', v: [30, 0, 7, 7, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'infusion', nom: 'Infusion', f: 'boisson', v: [1, 0, 0, 0, 0, 0, 0, 0], g: 200, p: '1 tasse', syn: ['tisane'] },
  { id: 'chocolat-chaud', nom: 'Chocolat chaud', f: 'boisson', v: [90, 3.5, 13, 12, 2.5, 1.5, 0.8, 0.2], g: 200, p: '1 tasse' },

  /* ── Jus de fruits et de légumes ── */
  { id: 'jus-orange', nom: 'Jus d’orange', f: 'boisson', v: [45, 0.7, 10, 9, 0.2, 0, 0.2, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'jus-pomme', nom: 'Jus de pomme', f: 'boisson', v: [46, 0.1, 11, 10, 0.1, 0, 0.1, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'jus-raisin', nom: 'Jus de raisin', f: 'boisson', v: [65, 0.3, 16, 15, 0.1, 0, 0.1, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'jus-ananas', nom: 'Jus d’ananas', f: 'boisson', v: [53, 0.4, 12, 11, 0.1, 0, 0.2, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'jus-pamplemousse', nom: 'Jus de pamplemousse', f: 'boisson', v: [38, 0.5, 8, 8, 0.1, 0, 0.1, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'jus-multifruits', nom: 'Jus multifruits', f: 'boisson', v: [48, 0.5, 11, 10, 0.1, 0, 0.3, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'nectar', nom: 'Nectar de fruits', f: 'boisson', v: [55, 0.3, 13, 13, 0.1, 0, 0.3, 0], g: 200, p: '1 verre', fl: 50 },
  { id: 'jus-tomate', nom: 'Jus de tomate', f: 'boisson', v: [20, 0.8, 3.5, 3, 0.1, 0, 0.5, 0.3], g: 200, p: '1 verre', fl: 100 },
  { id: 'jus-carotte', nom: 'Jus de carotte', f: 'boisson', v: [30, 0.7, 6, 5, 0.1, 0, 0.8, 0.1], g: 200, p: '1 verre', fl: 100 },
  { id: 'smoothie', nom: 'Smoothie aux fruits', f: 'boisson', v: [60, 0.8, 13, 12, 0.3, 0, 1.5, 0], g: 250, p: '1 verre', fl: 100 },
  { id: 'jus-legumes', nom: 'Jus de légumes', f: 'boisson', v: [25, 1, 4, 3, 0.2, 0, 0.9, 0.4], g: 200, p: '1 verre', fl: 100 },

  /* ── Sodas et boissons sucrées ── */
  { id: 'soda-cola', nom: 'Soda au cola', f: 'boisson', v: [42, 0, 10.6, 10.6, 0, 0, 0, 0], g: 330, p: '1 canette' },
  { id: 'soda-cola-light', nom: 'Soda au cola sans sucres', f: 'boisson', v: [0.3, 0, 0, 0, 0, 0, 0, 0], g: 330, p: '1 canette' },
  { id: 'soda-orange', nom: 'Soda à l’orange', f: 'boisson', v: [45, 0, 11, 11, 0, 0, 0, 0], g: 330, p: '1 canette' },
  { id: 'limonade', nom: 'Limonade', f: 'boisson', v: [40, 0, 10, 10, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'tonic', nom: 'Tonic', f: 'boisson', v: [35, 0, 9, 9, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'sirop-dilue', nom: 'Sirop dilué', f: 'boisson', v: [40, 0, 10, 10, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'boisson-energisante', nom: 'Boisson énergisante', f: 'boisson', v: [45, 0, 11, 11, 0, 0, 0, 0.1], g: 250, p: '1 canette' },
  { id: 'boisson-sport', nom: 'Boisson isotonique', f: 'boisson', v: [25, 0, 6, 5, 0, 0, 0, 0.1], g: 500, p: '1 bouteille' },

  /* ── Bières ── */
  { id: 'biere', nom: 'Bière blonde', f: 'boisson', v: [43, 0.5, 3.6, 0.1, 0, 0, 0, 0], g: 250, p: '1 demi', rare: true },
  { id: 'biere-blanche', nom: 'Bière blanche', f: 'boisson', v: [45, 0.4, 4, 0.5, 0, 0, 0, 0], g: 250, p: '1 demi', rare: true },
  { id: 'biere-brune', nom: 'Bière brune', f: 'boisson', v: [50, 0.6, 5, 0.5, 0, 0, 0, 0], g: 250, p: '1 demi', rare: true },
  { id: 'biere-forte', nom: 'Bière forte', f: 'boisson', v: [75, 0.6, 6, 1, 0, 0, 0, 0], g: 330, p: '1 bouteille', rare: true },
  { id: 'biere-sans-alcool', nom: 'Bière sans alcool', f: 'boisson', v: [25, 0.4, 5, 1.5, 0, 0, 0, 0], g: 250, p: '1 demi' },

  /* ── Vins et cidres ── */
  { id: 'vin-rouge', nom: 'Vin rouge', f: 'boisson', v: [85, 0.1, 2.6, 0.6, 0, 0, 0, 0], g: 125, p: '1 verre', rare: true },
  { id: 'vin-blanc', nom: 'Vin blanc', f: 'boisson', v: [82, 0.1, 2.6, 1, 0, 0, 0, 0], g: 125, p: '1 verre', rare: true },
  { id: 'vin-rose', nom: 'Vin rosé', f: 'boisson', v: [80, 0.1, 2.5, 1, 0, 0, 0, 0], g: 125, p: '1 verre', rare: true },
  { id: 'vin-moelleux', nom: 'Vin moelleux', f: 'boisson', v: [130, 0.1, 12, 12, 0, 0, 0, 0], g: 100, p: '1 verre', rare: true },
  { id: 'champagne', nom: 'Champagne', f: 'boisson', v: [80, 0.2, 1.5, 1.5, 0, 0, 0, 0], g: 100, p: '1 coupe', rare: true },
  { id: 'cidre', nom: 'Cidre', f: 'boisson', v: [45, 0, 5, 5, 0, 0, 0, 0], g: 250, p: '1 bolée', rare: true },
  { id: 'porto', nom: 'Porto', f: 'boisson', v: [150, 0.1, 12, 12, 0, 0, 0, 0], g: 70, p: '1 verre', rare: true },

  /* ── Spiritueux et apéritifs ── */
  { id: 'whisky', nom: 'Whisky', f: 'boisson', v: [250, 0, 0, 0, 0, 0, 0, 0], g: 40, p: '1 dose', rare: true },
  { id: 'vodka', nom: 'Vodka', f: 'boisson', v: [230, 0, 0, 0, 0, 0, 0, 0], g: 40, p: '1 dose', rare: true },
  { id: 'rhum', nom: 'Rhum', f: 'boisson', v: [230, 0, 0, 0, 0, 0, 0, 0], g: 40, p: '1 dose', rare: true },
  { id: 'gin', nom: 'Gin', f: 'boisson', v: [230, 0, 0, 0, 0, 0, 0, 0], g: 40, p: '1 dose', rare: true },
  { id: 'pastis', nom: 'Pastis dilué', f: 'boisson', v: [65, 0, 0.5, 0.5, 0, 0, 0, 0], g: 200, p: '1 verre', rare: true },
  { id: 'liqueur', nom: 'Liqueur', f: 'boisson', v: [300, 0, 30, 30, 0, 0, 0, 0], g: 30, p: '1 verre', rare: true },
  { id: 'cocktail', nom: 'Cocktail alcoolisé', f: 'boisson', v: [150, 0.2, 15, 14, 0.1, 0, 0.1, 0], g: 200, p: '1 verre', rare: true },
  { id: 'kir', nom: 'Kir', f: 'boisson', v: [130, 0.1, 12, 12, 0, 0, 0, 0], g: 120, p: '1 verre', rare: true },

  /* ── Compléments ── */
  { id: 'eau-petillante-citron', nom: 'Eau pétillante citronnée', f: 'boisson', v: [3, 0, 0.5, 0.5, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'eau-minerale', nom: 'Eau minérale', f: 'boisson', v: [0, 0, 0, 0, 0, 0, 0, 0], g: 500, p: '1 bouteille' },
  { id: 'cafe-glace', nom: 'Café glacé', f: 'boisson', v: [45, 1.5, 7, 7, 1.2, 0.8, 0, 0.1], g: 250, p: '1 verre' },
  { id: 'cafe-noisette', nom: 'Café noisette', f: 'boisson', v: [8, 0.4, 0.5, 0.5, 0.3, 0.2, 0, 0], g: 60, p: '1 tasse' },
  { id: 'macchiato', nom: 'Macchiato', f: 'boisson', v: [30, 1.6, 2.5, 2.5, 1.4, 0.9, 0, 0.1], g: 120, p: '1 tasse' },
  { id: 'chocolat-viennois', nom: 'Chocolat viennois', f: 'boisson', v: [140, 3.4, 15, 14, 7.5, 5, 0.8, 0.2], g: 200, p: '1 tasse' },
  { id: 'the-menthe', nom: 'Thé à la menthe', f: 'boisson', v: [35, 0, 8.5, 8.5, 0, 0, 0, 0], g: 150, p: '1 verre' },
  { id: 'the-au-lait', nom: 'Thé au lait', f: 'boisson', v: [25, 1.2, 2.5, 2.5, 1, 0.6, 0, 0.1], g: 200, p: '1 tasse' },
  { id: 'chicoree', nom: 'Chicorée', f: 'boisson', v: [5, 0.2, 1, 0.5, 0, 0, 0.3, 0], g: 200, p: '1 tasse', rare: true },
  { id: 'jus-citron-boisson', nom: 'Citronnade', f: 'boisson', v: [38, 0.2, 9, 9, 0.1, 0, 0.1, 0], g: 250, p: '1 verre' },
  { id: 'jus-pomme-trouble', nom: 'Jus de pomme trouble', f: 'boisson', v: [48, 0.2, 11, 10, 0.1, 0, 0.3, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'jus-poire', nom: 'Jus de poire', f: 'boisson', v: [50, 0.2, 12, 11, 0.1, 0, 0.2, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'jus-abricot', nom: 'Nectar d’abricot', f: 'boisson', v: [56, 0.4, 13, 13, 0.1, 0, 0.4, 0], g: 200, p: '1 verre', fl: 50 },
  { id: 'jus-mangue', nom: 'Nectar de mangue', f: 'boisson', v: [58, 0.3, 14, 13, 0.1, 0, 0.3, 0], g: 200, p: '1 verre', fl: 50 },
  { id: 'jus-cranberry', nom: 'Jus de cranberry', f: 'boisson', v: [46, 0.2, 11, 10, 0.1, 0, 0.1, 0], g: 200, p: '1 verre', fl: 50 },
  { id: 'jus-grenade', nom: 'Jus de grenade', f: 'boisson', v: [55, 0.3, 13, 12, 0.2, 0, 0.2, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'smoothie-vert', nom: 'Smoothie vert', f: 'boisson', v: [45, 1.2, 8, 6, 0.4, 0.1, 2, 0.1], g: 250, p: '1 verre', fl: 100 },
  { id: 'jus-detox', nom: 'Jus de fruits et légumes', f: 'boisson', v: [38, 0.9, 8, 6.5, 0.2, 0, 1, 0.1], g: 250, p: '1 verre', fl: 100 },
  { id: 'kombucha', nom: 'Kombucha', f: 'boisson', v: [25, 0, 6, 5, 0, 0, 0, 0], g: 250, p: '1 verre', rare: true },
  { id: 'soda-citron', nom: 'Soda au citron', f: 'boisson', v: [42, 0, 10.5, 10.5, 0, 0, 0, 0], g: 330, p: '1 canette' },
  { id: 'soda-light-fruit', nom: 'Soda aux fruits sans sucres', f: 'boisson', v: [2, 0, 0.3, 0.3, 0, 0, 0, 0], g: 330, p: '1 canette' },
  { id: 'sirop-menthe', nom: 'Sirop de menthe dilué', f: 'boisson', v: [42, 0, 10.5, 10.5, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'sirop-grenadine', nom: 'Grenadine diluée', f: 'boisson', v: [45, 0, 11, 11, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'diabolo', nom: 'Diabolo', f: 'boisson', v: [48, 0, 12, 12, 0, 0, 0, 0], g: 250, p: '1 verre' },
  { id: 'panache', nom: 'Panaché', f: 'boisson', v: [42, 0.3, 7, 4, 0, 0, 0, 0], g: 250, p: '1 demi', rare: true },
  { id: 'biere-ipa', nom: 'Bière IPA', f: 'boisson', v: [65, 0.6, 5, 0.5, 0, 0, 0, 0], g: 330, p: '1 bouteille', rare: true },
  { id: 'biere-trappiste', nom: 'Bière trappiste', f: 'boisson', v: [85, 0.7, 8, 2, 0, 0, 0, 0], g: 330, p: '1 bouteille', rare: true },
  { id: 'cremant', nom: 'Crémant', f: 'boisson', v: [80, 0.2, 2, 2, 0, 0, 0, 0], g: 100, p: '1 coupe', rare: true },
  { id: 'sangria', nom: 'Sangria', f: 'boisson', v: [110, 0.2, 12, 11, 0.1, 0, 0.1, 0], g: 200, p: '1 verre', rare: true },
  { id: 'mojito', nom: 'Mojito', f: 'boisson', v: [125, 0.1, 13, 12, 0, 0, 0.1, 0], g: 250, p: '1 verre', rare: true },
  { id: 'punch', nom: 'Punch', f: 'boisson', v: [160, 0.2, 18, 17, 0.1, 0, 0.1, 0], g: 200, p: '1 verre', rare: true },
  { id: 'digestif', nom: 'Digestif', f: 'boisson', v: [280, 0, 8, 8, 0, 0, 0, 0], g: 30, p: '1 verre', rare: true },
]
