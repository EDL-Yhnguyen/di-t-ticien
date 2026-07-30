import type { Brut } from '../brut'

/**
 * Sauces, condiments, sucres, farines, épices et aides culinaires.
 *
 * Beaucoup de ces entrées portent `rare` : ce sont des **ingrédients**, pas des
 * repas. Le coach n'a rien à gagner à proposer une cuillère de curcuma pour
 * combler un manque de fibres, alors qu'il faut pouvoir noter la cuillère de
 * mayonnaise qui change vraiment un déjeuner.
 *
 * Les portions sont de l'ordre du geste réel — une cuillère de sauce, une pincée
 * d'épice — parce que c'est ce qu'on ajoute, jamais cent grammes.
 */
export const EPICERIE: Brut[] = [
  /* ── Sauces froides ── */
  { id: 'mayonnaise', nom: 'Mayonnaise', v: [710, 1, 1.5, 1.5, 78, 6, 0, 1.2], g: 15, p: '1 cuillère' },
  { id: 'mayonnaise-allegee', nom: 'Mayonnaise allégée', v: [300, 1, 5, 4, 30, 2.5, 0, 1.4], g: 15, p: '1 cuillère' },
  { id: 'ketchup', nom: 'Ketchup', v: [110, 1.2, 24, 22, 0.2, 0, 1, 1.8], g: 15, p: '1 cuillère' },
  { id: 'moutarde', nom: 'Moutarde', v: [150, 7, 5, 3, 10, 0.7, 4, 5.5], g: 10, p: '1 cuillère' },
  { id: 'moutarde-ancienne', nom: 'Moutarde à l’ancienne', v: [145, 7, 4, 2, 10, 0.7, 4, 5], g: 10, p: '1 cuillère' },
  { id: 'vinaigrette', nom: 'Vinaigrette', v: [450, 0.5, 4, 3, 48, 6, 0, 1.8], g: 15, p: '1 cuillère' },
  { id: 'vinaigrette-allegee', nom: 'Vinaigrette allégée', v: [200, 0.5, 6, 5, 19, 2.5, 0, 2], g: 15, p: '1 cuillère' },
  { id: 'sauce-cesar', nom: 'Sauce césar', v: [350, 2, 5, 4, 36, 5, 0.3, 1.6], g: 20, p: '1 cuillère' },
  { id: 'sauce-blanche', nom: 'Sauce blanche', v: [320, 2, 6, 5, 32, 3, 0.3, 1.3], g: 25, p: '1 portion' },
  { id: 'sauce-samourai', nom: 'Sauce samouraï', v: [480, 1, 8, 7, 50, 4, 0.5, 1.5], g: 20, p: '1 portion' },
  { id: 'sauce-barbecue', nom: 'Sauce barbecue', v: [150, 1, 33, 30, 0.5, 0.1, 0.8, 2.2], g: 20, p: '1 cuillère' },
  { id: 'sauce-aigre-douce', nom: 'Sauce aigre-douce', v: [130, 0.5, 30, 28, 0.1, 0, 0.3, 2], g: 25, p: '1 portion' },
  { id: 'pesto', nom: 'Pesto', v: [450, 5, 5, 4, 45, 6, 2, 2.5], g: 20, p: '1 cuillère' },
  { id: 'tapenade', nom: 'Tapenade', v: [350, 2, 3, 1, 35, 5, 4, 3], g: 20, p: '1 cuillère' },
  { id: 'harissa', nom: 'Harissa', v: [200, 4, 10, 5, 15, 2, 6, 6], g: 5, p: '1 pointe' },
  { id: 'tabasco', nom: 'Tabasco', v: [12, 1, 1, 0.5, 0.5, 0, 1, 6], g: 2, p: 'quelques gouttes', rare: true },
  { id: 'raifort', nom: 'Raifort', v: [90, 2, 12, 8, 2, 0.3, 4, 2.5], g: 10, p: '1 cuillère', rare: true },

  /* ── Sauces chaudes ── */
  { id: 'sauce-tomate', nom: 'Sauce tomate cuisinée', v: [60, 1.5, 7, 5, 2.5, 0.4, 1.4, 0.8], g: 100, p: '1 portion', fl: 80 },
  { id: 'sauce-bolognaise', nom: 'Sauce bolognaise', v: [90, 5, 6, 4, 5, 1.8, 1.2, 0.9], g: 120, p: '1 portion', fl: 45 },
  { id: 'bechamel', nom: 'Sauce béchamel', v: [130, 4, 8, 3, 9, 5.5, 0.2, 0.7], g: 60, p: '1 portion' },
  { id: 'sauce-hollandaise', nom: 'Sauce hollandaise', v: [300, 2, 3, 2, 31, 18, 0, 1.2], g: 30, p: '1 portion' },
  { id: 'sauce-bearnaise', nom: 'Sauce béarnaise', v: [350, 2, 3, 2, 37, 22, 0, 1.3], g: 30, p: '1 portion' },
  { id: 'sauce-poivre', nom: 'Sauce au poivre', v: [150, 2, 6, 3, 13, 8, 0.3, 1.2], g: 40, p: '1 portion' },
  { id: 'sauce-curry', nom: 'Sauce curry', v: [120, 2, 8, 5, 9, 4, 0.8, 1.1], g: 60, p: '1 portion' },
  { id: 'sauce-soja', nom: 'Sauce soja', v: [60, 6, 5, 2, 0, 0, 0, 16], g: 10, p: '1 cuillère' },
  { id: 'nuoc-mam', nom: 'Nuoc-mâm', v: [50, 6, 4, 4, 0, 0, 0, 22], g: 10, p: '1 cuillère', rare: true },
  { id: 'sauce-huitre', nom: 'Sauce aux huîtres', v: [90, 2, 18, 12, 0, 0, 0, 9], g: 10, p: '1 cuillère', rare: true },

  /* ── Vinaigres et acides ── */
  { id: 'vinaigre', nom: 'Vinaigre', v: [20, 0, 0.5, 0.5, 0, 0, 0, 0], g: 10, p: '1 cuillère', rare: true },
  { id: 'vinaigre-balsamique', nom: 'Vinaigre balsamique', v: [90, 0.5, 17, 15, 0, 0, 0, 0.1], g: 10, p: '1 cuillère' },
  { id: 'jus-citron-condiment', nom: 'Jus de citron', v: [22, 0.4, 2, 2, 0.2, 0, 0.3, 0], g: 10, p: '1 filet', fl: 100 },
  { id: 'capre', nom: 'Câpres', v: [25, 2.4, 2, 0.4, 0.9, 0.2, 3, 6], g: 10, p: '1 cuillère', fl: 100, rare: true },

  /* ── Sucres et sirops ── */
  { id: 'sucre', nom: 'Sucre', v: [400, 0, 100, 100, 0, 0, 0, 0], g: 5, p: '1 morceau' },
  { id: 'sucre-roux', nom: 'Sucre roux', v: [395, 0, 98, 97, 0, 0, 0, 0], g: 5, p: '1 cuillère', syn: ['cassonade'] },
  { id: 'sucre-glace', nom: 'Sucre glace', v: [400, 0, 100, 100, 0, 0, 0, 0], g: 10, p: '1 cuillère', rare: true },
  { id: 'miel', nom: 'Miel', v: [320, 0.4, 80, 80, 0, 0, 0.2, 0], g: 15, p: '1 cuillère' },
  { id: 'sirop-erable', nom: 'Sirop d’érable', v: [260, 0, 67, 60, 0, 0, 0, 0], g: 15, p: '1 cuillère' },
  { id: 'sirop-agave', nom: 'Sirop d’agave', v: [310, 0, 76, 68, 0, 0, 0, 0], g: 15, p: '1 cuillère', rare: true },
  { id: 'caramel-liquide', nom: 'Caramel liquide', v: [300, 0.5, 75, 70, 0, 0, 0, 0.1], g: 15, p: '1 cuillère' },
  { id: 'edulcorant', nom: 'Édulcorant', v: [0, 0, 0, 0, 0, 0, 0, 0], g: 1, p: '1 comprimé' },

  /* ── Farines et poudres ── */
  { id: 'farine-ble', nom: 'Farine de blé', v: [350, 10, 72, 1.5, 1, 0.2, 3, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'farine-complete', nom: 'Farine complète', v: [320, 12, 62, 2, 2, 0.4, 9, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'farine-mais', nom: 'Farine de maïs', v: [350, 7, 78, 0.5, 1, 0.2, 2, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'fecule-mais', nom: 'Fécule de maïs', v: [350, 0.3, 86, 0, 0.1, 0, 0.5, 0], g: 10, p: '1 cuillère', syn: ['maïzena'], rare: true },
  { id: 'farine-riz', nom: 'Farine de riz', v: [360, 6, 80, 0.3, 1, 0.2, 1, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'farine-sarrasin', nom: 'Farine de sarrasin', v: [340, 12, 64, 1, 3, 0.6, 8, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'farine-pois-chiche', nom: 'Farine de pois chiche', v: [390, 22, 50, 5, 6, 0.7, 10, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'poudre-amande', nom: 'Poudre d’amande', v: [620, 24, 8, 4, 54, 4.5, 9, 0], g: 20, p: '2 cuillères', fl: 100 },
  { id: 'cacao-poudre', nom: 'Cacao en poudre non sucré', v: [350, 20, 12, 0.5, 22, 13, 30, 0.1], g: 10, p: '1 cuillère' },
  { id: 'chocolat-poudre', nom: 'Chocolat en poudre', v: [380, 5, 80, 75, 3, 1.8, 6, 0.2], g: 15, p: '2 cuillères' },
  { id: 'levure-chimique', nom: 'Levure chimique', v: [100, 2, 22, 0, 0, 0, 0, 12], g: 5, p: '1 sachet', rare: true },
  { id: 'levure-boulanger', nom: 'Levure de boulanger', v: [100, 16, 12, 1, 1.5, 0.2, 6, 0], g: 10, p: '1 cube', rare: true },
  { id: 'levure-maltee', nom: 'Levure maltée', v: [350, 45, 20, 3, 5, 0.8, 25, 0.2], g: 5, p: '1 cuillère', rare: true },
  { id: 'gelatine', nom: 'Gélatine', v: [340, 85, 0, 0, 0, 0, 0, 0.5], g: 2, p: '1 feuille', rare: true },
  { id: 'agar-agar', nom: 'Agar-agar', v: [26, 0.5, 1, 0, 0, 0, 6, 0.1], g: 2, p: '1 cuillère', rare: true },

  /* ── Herbes fraîches ── */
  { id: 'persil', nom: 'Persil', v: [36, 3, 4, 0.8, 0.8, 0.1, 3, 0.1], g: 5, p: '1 pincée', fl: 100 },
  { id: 'basilic', nom: 'Basilic', v: [30, 3, 2, 0.3, 0.6, 0, 3, 0], g: 5, p: 'quelques feuilles', fl: 100 },
  { id: 'coriandre', nom: 'Coriandre fraîche', v: [25, 2, 2, 0.9, 0.5, 0, 2.8, 0.1], g: 5, p: '1 pincée', fl: 100 },
  { id: 'ciboulette', nom: 'Ciboulette', v: [30, 3, 1.8, 1, 0.7, 0.1, 2.5, 0], g: 5, p: '1 pincée', fl: 100 },
  { id: 'menthe', nom: 'Menthe fraîche', v: [45, 3.7, 5, 0.5, 0.7, 0.2, 8, 0], g: 5, p: 'quelques feuilles', fl: 100 },
  { id: 'aneth', nom: 'Aneth', v: [43, 3.5, 3, 0.4, 1, 0.1, 2.1, 0.1], g: 5, p: '1 pincée', fl: 100, rare: true },
  { id: 'estragon', nom: 'Estragon', v: [50, 4, 5, 0.5, 1, 0.1, 3, 0.1], g: 3, p: '1 pincée', fl: 100, rare: true },
  { id: 'gingembre', nom: 'Gingembre frais', v: [80, 1.8, 16, 1.7, 0.8, 0.2, 2, 0], g: 10, p: '1 morceau', fl: 100 },

  /* ── Épices sèches ── */
  { id: 'sel', nom: 'Sel', v: [0, 0, 0, 0, 0, 0, 0, 100], g: 1, p: '1 pincée', rare: true },
  { id: 'poivre', nom: 'Poivre', v: [250, 10, 40, 0.5, 3, 1, 25, 0.1], g: 1, p: '1 tour de moulin', rare: true },
  { id: 'herbes-provence', nom: 'Herbes de Provence', v: [300, 10, 40, 0, 6, 1, 30, 0.2], g: 2, p: '1 pincée', rare: true },
  { id: 'thym', nom: 'Thym', v: [100, 5, 12, 0, 1.7, 0.5, 14, 0.1], g: 2, p: '1 branche', rare: true },
  { id: 'laurier', nom: 'Laurier', v: [313, 8, 48, 0, 8, 2, 26, 0.1], g: 1, p: '1 feuille', rare: true },
  { id: 'romarin', nom: 'Romarin', v: [130, 3, 20, 0, 5.9, 2.8, 14, 0.1], g: 2, p: '1 branche', rare: true },
  { id: 'paprika', nom: 'Paprika', v: [280, 14, 34, 10, 13, 2, 35, 0.1], g: 2, p: '1 cuillère', rare: true },
  { id: 'curry-poudre', nom: 'Curry en poudre', v: [325, 14, 25, 3, 14, 2, 33, 0.1], g: 3, p: '1 cuillère', rare: true },
  { id: 'cumin', nom: 'Cumin', v: [375, 18, 34, 2, 22, 1.5, 11, 0.4], g: 2, p: '1 cuillère', rare: true },
  { id: 'curcuma', nom: 'Curcuma', v: [310, 10, 44, 3, 3, 1, 21, 0.1], g: 2, p: '1 cuillère', rare: true },
  { id: 'cannelle', nom: 'Cannelle', v: [250, 4, 28, 2, 1.2, 0.3, 53, 0], g: 2, p: '1 pincée', rare: true },
  { id: 'muscade', nom: 'Noix de muscade', v: [525, 6, 28, 3, 36, 26, 21, 0.1], g: 1, p: '1 pincée', rare: true },
  { id: 'piment-poudre', nom: 'Piment en poudre', v: [280, 12, 30, 8, 14, 2.5, 28, 0.3], g: 1, p: '1 pincée', rare: true },
  { id: 'piment-frais', nom: 'Piment frais', v: [40, 2, 9, 5, 0.4, 0, 1.5, 0], g: 10, p: '1 piment', fl: 100, rare: true },
  { id: 'vanille', nom: 'Vanille', v: [290, 0.1, 13, 13, 0.1, 0, 0, 0], g: 2, p: '1 gousse', rare: true },
  { id: 'safran', nom: 'Safran', v: [310, 11, 62, 0, 6, 1.6, 4, 0.4], g: 1, p: '1 pincée', rare: true },
  { id: 'ras-el-hanout', nom: 'Ras el-hanout', v: [340, 12, 30, 4, 15, 2, 25, 0.5], g: 3, p: '1 cuillère', rare: true },
  { id: 'quatre-epices', nom: 'Quatre-épices', v: [330, 8, 40, 5, 10, 3, 25, 0.2], g: 2, p: '1 pincée', rare: true },

  /* ── Aides culinaires ── */
  { id: 'bouillon-cube', nom: 'Bouillon cube', v: [200, 12, 20, 6, 8, 4, 1, 40], g: 10, p: '1 cube', rare: true },
  { id: 'fond-veau', nom: 'Fond de veau', v: [180, 10, 22, 5, 6, 3, 1, 35], g: 10, p: '1 cuillère', rare: true },
  { id: 'crouton', nom: 'Croûtons', v: [420, 10, 60, 3, 15, 2, 4, 2], g: 20, p: '1 poignée' },
  { id: 'oignon-frit', nom: 'Oignons frits', v: [550, 6, 30, 8, 44, 4, 5, 1.5], g: 10, p: '1 cuillère' },
  { id: 'chapelure-panko', nom: 'Panko', v: [370, 12, 72, 3, 3, 0.5, 3.5, 1.2], g: 20, p: '2 cuillères', rare: true },
  { id: 'gomasio', nom: 'Gomasio', v: [520, 16, 9, 0.5, 46, 6.5, 10, 8], g: 5, p: '1 pincée', rare: true },

  /* ── Compléments ── */
  { id: 'sauce-tartare', nom: 'Sauce tartare', v: [480, 1.5, 4, 3, 50, 4.5, 0.3, 1.4], g: 20, p: '1 cuillère' },
  { id: 'sauce-cocktail', nom: 'Sauce cocktail', v: [420, 1.2, 12, 10, 40, 3.5, 0.3, 1.5], g: 20, p: '1 cuillère' },
  { id: 'sauce-yaourt', nom: 'Sauce au yaourt', v: [90, 3, 5, 4, 6, 3.5, 0.3, 0.9], g: 30, p: '1 portion' },
  { id: 'aioli', nom: 'Aïoli', v: [650, 1.5, 3, 1, 70, 6, 0.4, 1.3], g: 20, p: '1 cuillère' },
  { id: 'rouille', nom: 'Rouille', v: [600, 2, 5, 2, 63, 6, 0.8, 1.5], g: 20, p: '1 cuillère', rare: true },
  { id: 'sauce-gribiche', nom: 'Sauce gribiche', v: [520, 4, 3, 1.5, 54, 6, 0.4, 1.4], g: 25, p: '1 portion', rare: true },
  { id: 'sauce-bourguignonne', nom: 'Sauce au vin rouge', v: [110, 1.5, 5, 2, 8, 4.5, 0.3, 1.1], g: 40, p: '1 portion' },
  { id: 'sauce-forestiere', nom: 'Sauce forestière', v: [130, 2.5, 5, 2, 11, 6, 0.6, 1], g: 50, p: '1 portion' },
  { id: 'sauce-roquefort', nom: 'Sauce au roquefort', v: [190, 5, 4, 2.5, 17, 10, 0.2, 1.4], g: 40, p: '1 portion' },
  { id: 'sauce-moutarde', nom: 'Sauce à la moutarde', v: [160, 2, 5, 2.5, 14, 7, 0.5, 1.6], g: 40, p: '1 portion' },
  { id: 'sauce-tomate-basilic', nom: 'Sauce tomate au basilic', v: [58, 1.5, 7, 5, 2.3, 0.4, 1.5, 0.8], g: 100, p: '1 portion', fl: 80 },
  { id: 'sauce-arrabiata', nom: 'Sauce arrabiata', v: [65, 1.6, 7, 5, 3, 0.5, 1.6, 0.9], g: 100, p: '1 portion', fl: 75 },
  { id: 'sauce-teriyaki', nom: 'Sauce teriyaki', v: [130, 3, 28, 24, 0.1, 0, 0.2, 8], g: 15, p: '1 cuillère' },
  { id: 'sauce-sriracha', nom: 'Sriracha', v: [95, 2, 19, 15, 0.5, 0.1, 2, 6], g: 10, p: '1 cuillère' },
  { id: 'pesto-rouge', nom: 'Pesto rouge', v: [400, 4, 8, 6, 39, 5, 3, 2.4], g: 20, p: '1 cuillère' },
  { id: 'chutney', nom: 'Chutney', v: [180, 0.8, 42, 38, 0.4, 0.1, 2, 1], g: 20, p: '1 cuillère' },
  { id: 'confit-oignon', nom: 'Confit d’oignons', v: [200, 1, 45, 40, 1.5, 0.3, 2.5, 0.8], g: 20, p: '1 cuillère' },
  { id: 'pickles', nom: 'Pickles de légumes', v: [30, 0.9, 5, 4, 0.3, 0, 1.5, 1.8], g: 30, p: '1 portion', fl: 100 },
  { id: 'vinaigre-cidre', nom: 'Vinaigre de cidre', v: [22, 0, 0.9, 0.9, 0, 0, 0, 0], g: 10, p: '1 cuillère', rare: true },
  { id: 'vinaigre-xeres', nom: 'Vinaigre de xérès', v: [30, 0.2, 1.5, 1.5, 0, 0, 0, 0], g: 10, p: '1 cuillère', rare: true },
  { id: 'creme-balsamique', nom: 'Crème de balsamique', v: [230, 0.5, 55, 50, 0.1, 0, 0.2, 0.2], g: 10, p: '1 filet' },
  { id: 'melasse', nom: 'Mélasse', v: [290, 0, 75, 60, 0.1, 0, 0, 0.1], g: 15, p: '1 cuillère', rare: true },
  { id: 'sucre-vanille', nom: 'Sucre vanillé', v: [395, 0, 98, 98, 0, 0, 0, 0], g: 7, p: '1 sachet', rare: true },
  { id: 'sirop-glucose', nom: 'Sirop de glucose', v: [320, 0, 80, 40, 0, 0, 0, 0], g: 15, p: '1 cuillère', rare: true },
  { id: 'farine-epeautre', nom: 'Farine d’épeautre', v: [340, 13, 65, 2, 2.5, 0.5, 8, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'farine-seigle', nom: 'Farine de seigle', v: [330, 11, 60, 1.5, 2, 0.4, 12, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'farine-chataigne', nom: 'Farine de châtaigne', v: [370, 6, 70, 20, 4, 0.7, 9, 0], g: 30, p: '2 cuillères', rare: true },
  { id: 'psyllium', nom: 'Psyllium', v: [180, 2, 6, 0, 0.6, 0.1, 80, 0.1], g: 10, p: '1 cuillère', rare: true },
  { id: 'cacao-cru', nom: 'Éclats de cacao', v: [600, 14, 16, 1.5, 50, 30, 33, 0], g: 10, p: '1 cuillère', rare: true },
  { id: 'sel-fin', nom: 'Fleur de sel', v: [0, 0, 0, 0, 0, 0, 0, 98], g: 1, p: '1 pincée', rare: true },
  { id: 'poivre-baies', nom: 'Baies roses', v: [255, 8, 40, 1, 5, 1.5, 26, 0.1], g: 1, p: '1 pincée', rare: true },
  { id: 'anis-etoile', nom: 'Anis étoilé', v: [340, 18, 35, 0, 16, 1, 15, 0.1], g: 1, p: '1 étoile', rare: true },
  { id: 'clou-girofle', nom: 'Clous de girofle', v: [275, 6, 27, 2, 13, 4, 34, 0.7], g: 1, p: '2 clous', rare: true },
  { id: 'graine-fenouil', nom: 'Graines de fenouil', v: [345, 16, 15, 0, 15, 0.5, 40, 0.2], g: 2, p: '1 pincée', rare: true },
  { id: 'zaatar', nom: 'Zaatar', v: [330, 12, 28, 3, 16, 2.5, 26, 3], g: 3, p: '1 cuillère', rare: true },
  { id: 'garam-masala', nom: 'Garam masala', v: [350, 13, 32, 4, 15, 3, 26, 0.3], g: 3, p: '1 cuillère', rare: true },
  { id: 'cube-legume-bio', nom: 'Bouillon de légumes en cube', v: [180, 8, 22, 6, 7, 3, 1.5, 38], g: 10, p: '1 cube', rare: true },
  { id: 'levure-nutritionnelle', nom: 'Levure nutritionnelle', v: [340, 42, 22, 4, 5, 0.8, 22, 0.2], g: 5, p: '1 cuillère', rare: true },
]
