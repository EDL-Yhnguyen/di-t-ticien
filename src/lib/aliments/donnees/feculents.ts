import type { Brut } from '../brut'

/**
 * Féculents, céréales, pains et légumineuses.
 *
 * **Les céréales et les pâtes sont données cuites**, parce que c'est ce qu'on
 * met dans l'assiette et ce qu'on sait peser. Cent grammes de pâtes crues font
 * deux cent cinquante grammes cuites : enregistrer les valeurs du cru sur une
 * portion pesée cuite triple les calories du repas. Le cru n'apparaît que là où
 * il se pèse vraiment — la farine, les flocons d'avoine.
 *
 * Les légumineuses portent `fl: 100` : le Nutri-Score les compte avec les fruits
 * et légumes.
 */
export const FECULENTS: Brut[] = [
  /* ── Pommes de terre ── */
  { id: 'pomme-terre', nom: 'Pommes de terre cuites', v: [87, 1.9, 20, 0.9, 0.1, 0, 1.8, 0], g: 200, p: '2 pommes de terre', syn: ['patate'] },
  { id: 'pomme-terre-crue', nom: 'Pomme de terre crue', v: [78, 2, 17, 0.9, 0.1, 0, 2.1, 0], g: 150, p: '1 pomme de terre', syn: ['patate'] },
  { id: 'pomme-terre-vapeur', nom: 'Pommes de terre vapeur', v: [86, 2, 19, 0.9, 0.1, 0, 2, 0], g: 200, p: '1 portion', syn: ['patate'] },
  { id: 'pomme-terre-four', nom: 'Pomme de terre au four', v: [105, 2.5, 22, 1.2, 0.2, 0, 2.4, 0], g: 200, p: '1 grosse pomme de terre', syn: ['patate'] },
  { id: 'pomme-terre-sautee', nom: 'Pommes de terre sautées', v: [175, 2.5, 25, 0.8, 7, 1, 2.2, 0.4], g: 180, p: '1 portion', syn: ['patate'] },
  { id: 'pomme-terre-rissolee', nom: 'Pommes de terre rissolées', v: [182, 2.4, 26, 0.8, 7.5, 1.1, 2.2, 0.5], g: 180, p: '1 portion' },
  { id: 'puree', nom: 'Purée de pommes de terre', v: [90, 2, 13, 1.5, 3, 1.8, 1.4, 0.4], g: 220, p: '1 portion', syn: ['patate'] },
  { id: 'puree-flocons', nom: 'Purée en flocons préparée', v: [85, 2, 13, 1.2, 2.8, 1.7, 1.3, 0.5], g: 220, p: '1 portion' },
  { id: 'gratin-dauphinois', nom: 'Gratin dauphinois', v: [145, 3, 13, 1.5, 9, 5.6, 1.2, 0.5], g: 250, p: '1 portion' },
  { id: 'frites', nom: 'Frites', v: [312, 3.4, 41, 0.6, 15, 2, 3.8, 0.5], g: 150, p: '1 portion' },
  { id: 'frites-four', nom: 'Frites au four', v: [180, 3, 29, 0.6, 5.5, 0.6, 3.2, 0.4], g: 150, p: '1 portion' },
  { id: 'pomme-noisette', nom: 'Pommes noisettes', v: [210, 2.6, 26, 0.7, 10, 1, 2.6, 0.6], g: 150, p: '1 portion' },
  { id: 'pomme-dauphine', nom: 'Pommes dauphines', v: [280, 3.5, 28, 1, 17, 2, 2, 0.8], g: 150, p: '1 portion' },
  { id: 'patate-douce', nom: 'Patate douce cuite', v: [90, 1.6, 20, 6, 0.1, 0, 2.8, 0.1], g: 200, p: '1 portion' },
  { id: 'igname', nom: 'Igname cuite', v: [114, 1.5, 26, 0.5, 0.2, 0, 3.9, 0], g: 200, p: '1 portion', rare: true },
  { id: 'manioc', nom: 'Manioc cuit', v: [130, 1, 31, 1.4, 0.3, 0.1, 1.8, 0], g: 200, p: '1 portion', rare: true },

  /* ── Riz ── */
  { id: 'riz-cuit', nom: 'Riz blanc cuit', v: [130, 2.7, 28, 0.1, 0.3, 0.1, 0.4, 0], g: 150, p: '1 portion' },
  { id: 'riz-complet-cuit', nom: 'Riz complet cuit', v: [123, 2.7, 25, 0.4, 1, 0.2, 1.6, 0], g: 150, p: '1 portion' },
  { id: 'riz-basmati', nom: 'Riz basmati cuit', v: [130, 3, 28, 0.1, 0.4, 0.1, 0.6, 0], g: 150, p: '1 portion' },
  { id: 'riz-thai', nom: 'Riz thaï cuit', v: [132, 2.8, 29, 0.1, 0.3, 0.1, 0.5, 0], g: 150, p: '1 portion' },
  { id: 'riz-sauvage', nom: 'Riz sauvage cuit', v: [101, 4, 21, 0.7, 0.3, 0, 1.8, 0], g: 150, p: '1 portion', rare: true },
  { id: 'riz-pilaf', nom: 'Riz pilaf', v: [155, 3.2, 27, 0.8, 3.5, 1.2, 0.8, 0.5], g: 200, p: '1 portion' },
  { id: 'risotto', nom: 'Risotto', v: [145, 3.5, 20, 0.8, 5, 2.5, 0.8, 0.6], g: 250, p: '1 portion' },
  { id: 'riz-cantonais', nom: 'Riz cantonais', v: [165, 5, 23, 1, 5.5, 1.2, 1, 0.8], g: 250, p: '1 portion' },

  /* ── Pâtes ── */
  { id: 'pates-cuites', nom: 'Pâtes cuites', v: [158, 5.8, 31, 0.6, 0.9, 0.2, 1.8, 0], g: 180, p: '1 portion', syn: ['spaghetti', 'penne', 'coquillettes', 'macaroni', 'fusilli'] },
  { id: 'pates-completes', nom: 'Pâtes complètes cuites', v: [133, 5.3, 25, 0.8, 1.1, 0.2, 3.9, 0], g: 180, p: '1 portion' },
  { id: 'pates-fraiches', nom: 'Pâtes fraîches cuites', v: [165, 6, 30, 1, 1.8, 0.4, 1.6, 0], g: 180, p: '1 portion', syn: ['tagliatelle', 'linguine'] },
  { id: 'ravioli-ricotta', nom: 'Raviolis ricotta épinards', v: [190, 7, 26, 1.5, 6, 2.5, 1.5, 0.8], g: 200, p: '1 portion' },
  { id: 'ravioli-viande', nom: 'Raviolis à la viande', v: [175, 7.5, 24, 2, 5, 2, 1.4, 0.9], g: 250, p: '1 boîte' },
  { id: 'gnocchi', nom: 'Gnocchis cuits', v: [140, 3.5, 28, 1, 1.5, 0.4, 1.6, 0.7], g: 200, p: '1 portion' },
  { id: 'nouille-chinoise', nom: 'Nouilles chinoises cuites', v: [138, 4.5, 26, 0.5, 1.5, 0.3, 1.2, 0.2], g: 180, p: '1 portion' },
  { id: 'nouille-riz', nom: 'Nouilles de riz cuites', v: [109, 2, 25, 0.1, 0.2, 0, 0.9, 0], g: 180, p: '1 portion' },
  { id: 'nouille-soba', nom: 'Nouilles soba cuites', v: [99, 5, 21, 0.5, 0.1, 0, 1.5, 0.1], g: 180, p: '1 portion', rare: true },
  { id: 'vermicelle', nom: 'Vermicelles cuits', v: [150, 5, 30, 0.5, 0.7, 0.2, 1.5, 0], g: 150, p: '1 portion' },

  /* ── Autres céréales ── */
  { id: 'semoule', nom: 'Semoule cuite', v: [112, 3.8, 23, 0.2, 0.2, 0, 1.4, 0], g: 150, p: '1 portion', syn: ['couscous'] },
  { id: 'semoule-complete', nom: 'Semoule complète cuite', v: [108, 4.2, 21, 0.3, 0.5, 0.1, 3.5, 0], g: 150, p: '1 portion' },
  { id: 'boulgour', nom: 'Boulgour cuit', v: [83, 3, 16, 0.1, 0.2, 0, 4.5, 0], g: 150, p: '1 portion' },
  { id: 'quinoa-cuit', nom: 'Quinoa cuit', v: [120, 4.4, 21, 0.9, 1.9, 0.2, 2.8, 0], g: 150, p: '1 portion' },
  { id: 'epeautre', nom: 'Épeautre cuit', v: [127, 5, 23, 0.5, 1, 0.2, 3.5, 0], g: 150, p: '1 portion' },
  { id: 'sarrasin', nom: 'Sarrasin cuit', v: [92, 3.4, 19, 0.6, 0.6, 0.1, 2.7, 0], g: 150, p: '1 portion' },
  { id: 'millet', nom: 'Millet cuit', v: [119, 3.5, 23, 0.1, 1, 0.2, 1.3, 0], g: 150, p: '1 portion', rare: true },
  { id: 'orge-perle', nom: 'Orge perlé cuit', v: [123, 2.3, 28, 0.3, 0.4, 0.1, 3.8, 0], g: 150, p: '1 portion', rare: true },
  { id: 'polenta', nom: 'Polenta cuite', v: [85, 2, 18, 0.2, 0.4, 0.1, 1, 0.2], g: 200, p: '1 portion' },
  { id: 'ble-precuit', nom: 'Blé précuit', v: [125, 4.5, 25, 0.4, 0.6, 0.1, 3, 0.1], g: 150, p: '1 portion' },
  { id: 'chataigne', nom: 'Châtaignes cuites', v: [170, 2.5, 34, 8, 2, 0.4, 5, 0], g: 100, p: '1 portion' },

  /* ── Pains ── */
  { id: 'pain-blanc', nom: 'Baguette', v: [274, 8.8, 55, 2.6, 1.3, 0.3, 2.7, 1.3], g: 50, p: '1/5 de baguette', syn: ['pain blanc'] },
  { id: 'pain-complet', nom: 'Pain complet', v: [247, 9.7, 41, 3.3, 3.4, 0.7, 6.5, 1.1], g: 50, p: '2 tranches' },
  { id: 'pain-campagne', nom: 'Pain de campagne', v: [262, 8.5, 51, 2, 1.2, 0.3, 3.5, 1.2], g: 50, p: '1 tranche' },
  { id: 'pain-levain', nom: 'Pain au levain', v: [255, 8.5, 49, 1.5, 1.2, 0.3, 3.2, 1.2], g: 50, p: '1 tranche' },
  { id: 'pain-seigle', nom: 'Pain de seigle', v: [240, 7, 45, 2, 1.3, 0.3, 6, 1.1], g: 50, p: '1 tranche' },
  { id: 'pain-cereales', nom: 'Pain aux céréales', v: [265, 9.5, 42, 3, 6, 1, 5.5, 1.1], g: 50, p: '1 tranche' },
  { id: 'pain-mie', nom: 'Pain de mie', v: [275, 8, 48, 4, 4, 0.9, 2.9, 1.1], g: 50, p: '2 tranches' },
  { id: 'pain-mie-complet', nom: 'Pain de mie complet', v: [250, 9, 40, 3.5, 4, 0.8, 5.5, 1], g: 50, p: '2 tranches' },
  { id: 'pain-sans-gluten', nom: 'Pain sans gluten', v: [250, 3, 45, 3, 6, 1.5, 4, 1], g: 50, p: '2 tranches' },
  { id: 'biscotte', nom: 'Biscottes', v: [400, 11, 72, 5, 6, 1, 4.5, 1.7], g: 20, p: '2 biscottes' },
  { id: 'pain-suedois', nom: 'Pain suédois', v: [380, 11, 68, 3, 6, 0.8, 6, 1.5], g: 20, p: '2 tranches' },
  { id: 'cracotte', nom: 'Tartines craquantes', v: [375, 11, 74, 3, 3, 0.5, 5, 1.4], g: 20, p: '3 tartines' },
  { id: 'pain-pita', nom: 'Pain pita', v: [275, 9, 52, 2, 1.5, 0.3, 2.5, 1.1], g: 60, p: '1 pita' },
  { id: 'pain-naan', nom: 'Naan', v: [320, 8.5, 48, 3, 10, 2.5, 2, 1.2], g: 90, p: '1 naan' },
  { id: 'tortilla-ble', nom: 'Tortilla de blé', v: [310, 8, 48, 2.5, 8, 3, 3, 1.2], g: 60, p: '1 tortilla', syn: ['wrap', 'galette de blé'] },
  { id: 'tortilla-mais', nom: 'Tortilla de maïs', v: [240, 6, 46, 1, 3, 0.5, 5, 0.5], g: 50, p: '2 tortillas' },
  { id: 'pain-burger', nom: 'Pain à burger', v: [280, 9, 47, 6, 6, 1.4, 2.5, 1], g: 60, p: '1 pain' },
  { id: 'pain-viennois', nom: 'Pain viennois', v: [320, 8, 50, 8, 9, 4, 2, 1], g: 50, p: '1 tranche' },
  { id: 'pain-epices', nom: 'Pain d’épices', v: [350, 4, 70, 40, 3, 0.6, 3, 0.7], g: 30, p: '1 tranche' },
  { id: 'chapelure', nom: 'Chapelure', v: [370, 12, 70, 3, 4, 0.8, 4, 1.5], g: 20, p: '2 cuillères' },

  /* ── Céréales du petit déjeuner ── */
  { id: 'flocons-avoine', nom: 'Flocons d’avoine', v: [370, 13, 59, 1.1, 7, 1.3, 10, 0], g: 40, p: '4 cuillères' },
  { id: 'son-avoine', nom: 'Son d’avoine', v: [355, 17, 50, 1, 7, 1.4, 15, 0], g: 20, p: '2 cuillères' },
  { id: 'son-ble', nom: 'Son de blé', v: [216, 16, 22, 1, 4, 0.7, 42, 0], g: 15, p: '2 cuillères', rare: true },
  { id: 'muesli-nature', nom: 'Muesli sans sucre ajouté', v: [380, 11, 58, 8, 9, 1.5, 8, 0.1], g: 50, p: '1 bol' },
  { id: 'muesli-croustillant', nom: 'Muesli croustillant', v: [450, 8, 62, 20, 18, 3, 7, 0.2], g: 50, p: '1 bol' },
  { id: 'granola', nom: 'Granola', v: [460, 9, 60, 18, 20, 3, 7, 0.2], g: 45, p: '1 portion' },
  { id: 'corn-flakes', nom: 'Corn flakes', v: [380, 7, 84, 8, 1, 0.2, 3, 1.1], g: 30, p: '1 bol' },
  { id: 'cereales-chocolat', nom: 'Céréales au chocolat', v: [390, 7, 78, 25, 4, 1.5, 5, 0.6], g: 30, p: '1 bol' },
  { id: 'cereales-fourrees', nom: 'Céréales fourrées', v: [440, 7, 70, 25, 14, 5, 4, 0.5], g: 30, p: '1 bol' },
  { id: 'riz-souffle', nom: 'Riz soufflé', v: [385, 6, 87, 9, 0.9, 0.2, 1.5, 1.2], g: 30, p: '1 bol' },
  { id: 'porridge', nom: 'Porridge au lait', v: [95, 4, 13, 5, 2.5, 1.2, 1.8, 0.1], g: 250, p: '1 bol' },

  /* ── Légumineuses ── */
  { id: 'lentilles', nom: 'Lentilles cuites', v: [116, 9, 20, 1.8, 0.4, 0.1, 7.9, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'lentille-corail', nom: 'Lentilles corail cuites', v: [120, 8, 20, 1, 0.5, 0.1, 5, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'pois-chiche', nom: 'Pois chiches cuits', v: [139, 8.9, 21, 3.5, 2.6, 0.3, 7.6, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'haricot-rouge', nom: 'Haricots rouges cuits', v: [127, 9, 22, 0.5, 0.5, 0.1, 7.4, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'haricot-blanc', nom: 'Haricots blancs cuits', v: [132, 9, 21, 0.5, 0.6, 0.1, 7, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'haricot-noir', nom: 'Haricots noirs cuits', v: [130, 8.9, 21, 0.5, 0.5, 0.1, 8, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'flageolet', nom: 'Flageolets', v: [118, 8, 18, 0.5, 0.5, 0.1, 6.5, 0.3], g: 150, p: '1 portion', fl: 100 },
  { id: 'pois-casse', nom: 'Pois cassés cuits', v: [118, 8, 20, 1, 0.4, 0.1, 6, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'soja-jaune', nom: 'Graines de soja cuites', v: [141, 14, 8, 2, 6, 0.9, 6, 0], g: 120, p: '1 portion', fl: 100, rare: true },
  { id: 'haricot-tomate', nom: 'Haricots blancs à la tomate', v: [90, 4.8, 13, 4, 0.5, 0.1, 4, 0.7], g: 200, p: '1 boîte', fl: 90 },
  { id: 'lentille-plat', nom: 'Lentilles cuisinées', v: [105, 6.5, 15, 1.5, 2, 0.5, 5.5, 0.6], g: 250, p: '1 portion', fl: 80 },

  /* ── Pains régionaux et spécialités ── */
  { id: 'pain-baguette-tradition', nom: 'Baguette tradition', v: [265, 9, 53, 2, 1.2, 0.3, 3.2, 1.3], g: 50, p: '1/5 de baguette' },
  { id: 'pain-boule', nom: 'Pain de campagne au levain', v: [258, 8.8, 50, 1.8, 1.2, 0.3, 4, 1.2], g: 50, p: '1 tranche' },
  { id: 'pain-noix', nom: 'Pain aux noix', v: [300, 10, 40, 3, 11, 1.5, 5, 1.1], g: 50, p: '1 tranche' },
  { id: 'pain-olive', nom: 'Pain aux olives', v: [280, 8.5, 45, 2, 7, 1.2, 3.5, 1.4], g: 50, p: '1 tranche' },
  { id: 'pain-lin-tournesol', nom: 'Pain aux graines', v: [285, 10, 40, 3, 9, 1.3, 6, 1.1], g: 50, p: '1 tranche' },
  { id: 'fougasse', nom: 'Fougasse', v: [300, 8, 44, 2, 10, 1.6, 2.5, 1.4], g: 80, p: '1 part' },
  { id: 'ciabatta', nom: 'Ciabatta', v: [270, 9, 51, 2, 3, 0.5, 2.8, 1.3], g: 60, p: '1 morceau' },
  { id: 'focaccia', nom: 'Focaccia', v: [310, 8, 45, 2, 11, 1.7, 2.5, 1.5], g: 80, p: '1 part' },
  { id: 'bagel-nature', nom: 'Bagel nature', v: [270, 10, 48, 5, 4, 1, 2.5, 1.1], g: 90, p: '1 bagel' },
  { id: 'muffin-anglais', nom: 'Muffin anglais', v: [235, 9, 44, 3, 2, 0.4, 2.5, 1.1], g: 60, p: '1 muffin' },
  { id: 'brioche-tranche', nom: 'Brioche tranchée', v: [355, 8, 52, 12, 13, 7.5, 2, 0.8], g: 40, p: '1 tranche' },
  { id: 'pain-hamburger-complet', nom: 'Pain à burger complet', v: [265, 10, 42, 5, 6, 1.3, 4.5, 1] , g: 60, p: '1 pain' },
  { id: 'galette-riz', nom: 'Galettes de riz soufflé', v: [385, 8, 81, 0.5, 3, 0.6, 2, 0.1], g: 20, p: '2 galettes' },
  { id: 'galette-sarrasin', nom: 'Galette de sarrasin', v: [155, 5, 28, 0.8, 2.5, 0.5, 2.8, 0.7], g: 100, p: '1 galette' },
  { id: 'blini', nom: 'Blinis', v: [265, 8, 42, 3, 7, 1.5, 2, 1.1], g: 40, p: '4 blinis' },
  { id: 'pain-azyme', nom: 'Pain azyme', v: [370, 11, 78, 1, 1.5, 0.3, 3, 0], g: 20, p: '2 feuilles', rare: true },

  /* ── Pâtes et céréales, autres formes ── */
  { id: 'pates-lentille-corail', nom: 'Pâtes de lentilles corail cuites', v: [140, 10, 20, 1.5, 1, 0.2, 4, 0], g: 180, p: '1 portion', fl: 100 },
  { id: 'pates-pois-chiche', nom: 'Pâtes de pois chiches cuites', v: [145, 11, 20, 2, 2, 0.3, 5, 0], g: 180, p: '1 portion', fl: 100 },
  { id: 'pates-sans-gluten', nom: 'Pâtes sans gluten cuites', v: [145, 3, 32, 0.6, 0.8, 0.2, 1.5, 0], g: 180, p: '1 portion' },
  { id: 'lasagne-plaque', nom: 'Plaques de lasagne cuites', v: [155, 5.6, 30, 0.8, 1, 0.2, 1.8, 0], g: 180, p: '1 portion' },
  { id: 'tortellini', nom: 'Tortellinis cuits', v: [180, 8, 25, 1.5, 5, 2.2, 1.4, 0.9], g: 200, p: '1 portion' },
  { id: 'couscous-complet', nom: 'Couscous complet cuit', v: [110, 4.5, 21, 0.3, 0.5, 0.1, 3.5, 0], g: 150, p: '1 portion' },
  { id: 'riz-noir', nom: 'Riz noir cuit', v: [130, 4, 26, 0.5, 1.2, 0.3, 2.5, 0], g: 150, p: '1 portion', rare: true },
  { id: 'riz-rouge', nom: 'Riz rouge cuit', v: [125, 3, 26, 0.4, 1, 0.2, 2, 0], g: 150, p: '1 portion', rare: true },
  { id: 'riz-gluant', nom: 'Riz gluant cuit', v: [140, 2.5, 31, 0.1, 0.2, 0.1, 0.3, 0], g: 150, p: '1 portion' },
  { id: 'avoine-precuite', nom: 'Flocons d’avoine cuits', v: [72, 2.6, 12, 0.3, 1.4, 0.3, 2, 0], g: 250, p: '1 bol' },
  { id: 'petit-epeautre', nom: 'Petit épeautre cuit', v: [130, 5.5, 23, 0.6, 1.2, 0.2, 3.8, 0], g: 150, p: '1 portion', rare: true },
  { id: 'freekeh', nom: 'Freekeh cuit', v: [115, 5, 21, 0.4, 0.8, 0.1, 4, 0], g: 150, p: '1 portion', rare: true },
  { id: 'tapioca', nom: 'Tapioca cuit', v: [110, 0.2, 27, 0.5, 0.1, 0, 0.5, 0], g: 150, p: '1 portion', rare: true },

  /* ── Légumineuses et préparations ── */
  { id: 'lentille-beluga', nom: 'Lentilles beluga cuites', v: [118, 9.5, 20, 1.5, 0.5, 0.1, 8, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'lentille-blonde', nom: 'Lentilles blondes cuites', v: [115, 8.8, 20, 1.7, 0.4, 0.1, 7.5, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'haricot-coco', nom: 'Cocos de Paimpol cuits', v: [125, 8.5, 20, 0.6, 0.6, 0.1, 7.2, 0], g: 150, p: '1 portion', fl: 100 },
  { id: 'haricot-azuki', nom: 'Haricots azuki cuits', v: [128, 8, 25, 0.5, 0.2, 0, 7.3, 0], g: 150, p: '1 portion', fl: 100, rare: true },
  { id: 'edamame', nom: 'Edamames', v: [125, 11, 5, 2, 5.5, 0.7, 5, 0.1], g: 100, p: '1 portion', fl: 100 },
  { id: 'chili-haricot', nom: 'Haricots rouges cuisinés', v: [110, 6.5, 15, 2.5, 2, 0.5, 6, 0.7], g: 250, p: '1 portion', fl: 80 },
  { id: 'puree-pois-casse', nom: 'Purée de pois cassés', v: [105, 6.5, 15, 1.2, 2, 0.9, 5, 0.6], g: 250, p: '1 portion', fl: 80 },
  { id: 'chataigne-puree', nom: 'Purée de châtaignes', v: [180, 2.5, 32, 10, 4, 1.8, 4.5, 0.3], g: 150, p: '1 portion' },
]
