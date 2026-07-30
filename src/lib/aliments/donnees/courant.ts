import type { Brut } from '../brut'

/**
 * Les produits du quotidien : conserves, surgelés, plats préparés, petit déjeuner
 * et goûter.
 *
 * La famille la moins glorieuse de la base, et la plus utile. Un journal
 * alimentaire réel est fait de boîtes de thon, de soupes en brique et de plats
 * réchauffés au micro-ondes ; ne proposer que des aliments bruts revient à
 * demander à quelqu'un de décomposer sa boîte de raviolis en farine, viande et
 * tomate — ce que personne ne fait deux fois.
 *
 * Les valeurs sont celles de produits **génériques**, moyennes des marques
 * courantes. Pour un produit précis, le scan du code-barres reste plus juste : il
 * ramène l'étiquette réelle. Ces entrées servent quand le code-barres n'est pas là
 * — un plat déjà jeté, un reste, un souvenir.
 */
export const COURANT: Brut[] = [
  /* ── Conserves et bocaux ── */
  { id: 'thon-tomate', nom: 'Thon à la tomate', v: [125, 20, 4, 3, 3, 0.7, 0.5, 1], g: 100, p: '1 boîte' },
  { id: 'sardine-citron', nom: 'Sardines au citron', v: [215, 24, 1, 0.5, 13, 3, 0, 1.2], g: 90, p: '1 boîte' },
  { id: 'maquereau-tomate', nom: 'Maquereaux à la tomate', v: [195, 17, 3, 2, 13, 3, 0.3, 1.2], g: 100, p: '1 boîte' },
  { id: 'crabe-conserve', nom: 'Chair de crabe en conserve', v: [85, 17, 0.5, 0, 1, 0.2, 0, 1.4], g: 100, p: '1 boîte' },
  { id: 'moule-escabeche', nom: 'Moules à l’escabèche', v: [150, 16, 4, 1, 8, 1.4, 0.3, 1.5], g: 100, p: '1 boîte' },
  { id: 'foie-morue', nom: 'Foie de morue', v: [610, 5, 0.5, 0.5, 65, 12, 0, 0.9], g: 40, p: '1 portion', rare: true },
  { id: 'ravioli-conserve', nom: 'Raviolis en conserve', v: [95, 3.5, 13, 2, 3, 1.2, 1, 0.9], g: 400, p: '1 boîte' },
  { id: 'cassoulet-conserve', nom: 'Cassoulet en conserve', v: [140, 8, 12, 1, 6.5, 2.5, 3.5, 1], g: 400, p: '1 boîte', fl: 30 },
  { id: 'choucroute-conserve', nom: 'Choucroute garnie en conserve', v: [135, 8, 5, 1.5, 9.5, 3.6, 2, 1.2], g: 400, p: '1 boîte', fl: 30 },
  { id: 'petit-sale-conserve', nom: 'Petit salé en conserve', v: [145, 10, 11, 1, 6.5, 2.5, 3.5, 1.1], g: 400, p: '1 boîte', fl: 30 },
  { id: 'boeuf-carottes-conserve', nom: 'Bœuf carottes en conserve', v: [105, 9, 8, 3, 4, 1.6, 1.4, 0.9], g: 400, p: '1 boîte', fl: 30 },
  { id: 'lentilles-saucisses-conserve', nom: 'Lentilles saucisses en conserve', v: [125, 8, 12, 1, 5, 1.9, 3.5, 1], g: 400, p: '1 boîte', fl: 30 },
  { id: 'paella-conserve', nom: 'Paella en conserve', v: [115, 6, 16, 1.5, 3, 0.8, 0.8, 1], g: 400, p: '1 boîte' },
  { id: 'couscous-conserve', nom: 'Couscous en conserve', v: [110, 6, 15, 2, 3, 0.9, 2, 0.9], g: 400, p: '1 boîte', fl: 25 },
  { id: 'tripes-conserve', nom: 'Tripes en conserve', v: [110, 11, 4, 1.5, 5.5, 2.2, 0.4, 1], g: 400, p: '1 boîte' },
  { id: 'salade-mexicaine', nom: 'Salade mexicaine', v: [100, 4.5, 14, 3, 2, 0.4, 4, 0.6], g: 150, p: '1 portion', fl: 90 },
  { id: 'ratatouille-conserve', nom: 'Ratatouille en conserve', v: [55, 1, 4, 3.5, 3.5, 0.5, 2, 0.7], g: 250, p: '1 portion', fl: 85 },
  { id: 'salsifis-conserve', nom: 'Salsifis en conserve', v: [30, 1.2, 4, 1.5, 0.2, 0, 3, 0.5], g: 200, p: '1 portion', fl: 100 },
  { id: 'asperge-conserve', nom: 'Asperges en conserve', v: [18, 1.8, 1.2, 1, 0.2, 0, 1.8, 0.5], g: 150, p: '1 portion', fl: 100 },
  { id: 'lentille-conserve', nom: 'Lentilles en conserve', v: [95, 7, 13, 1, 0.4, 0.1, 5, 0.4], g: 200, p: '1 portion', fl: 100 },
  { id: 'pois-chiche-conserve', nom: 'Pois chiches en conserve', v: [120, 7, 15, 1, 2.5, 0.3, 6, 0.4], g: 200, p: '1 portion', fl: 100 },
  { id: 'haricot-rouge-conserve', nom: 'Haricots rouges en conserve', v: [110, 7.5, 15, 1, 0.5, 0.1, 6.5, 0.4], g: 200, p: '1 portion', fl: 100 },
  { id: 'coeur-artichaut-conserve', nom: 'Fonds d’artichaut en conserve', v: [35, 2.2, 3, 0.8, 0.3, 0, 3.5, 0.5], g: 150, p: '1 portion', fl: 100 },
  { id: 'chataigne-conserve', nom: 'Châtaignes en bocal', v: [165, 2.4, 33, 8, 2, 0.4, 5, 0.1], g: 100, p: '1 portion' },
  { id: 'compote-bocal', nom: 'Compote en bocal', v: [70, 0.3, 16, 15, 0.1, 0, 1.3, 0], g: 100, p: '1 portion', fl: 100 },

  /* ── Surgelés ── */
  { id: 'poisson-pane-surgele', nom: 'Poisson pané surgelé', v: [210, 13, 17, 1, 10, 1.2, 1, 0.8], g: 100, p: '2 filets' },
  { id: 'nugget-surgele', nom: 'Nuggets surgelés', v: [255, 14, 17, 1, 15, 2, 1, 1.2], g: 120, p: '6 nuggets' },
  { id: 'cordon-bleu-surgele', nom: 'Cordon bleu surgelé', v: [240, 16, 14, 1.5, 13, 4, 0.8, 1.3], g: 120, p: '1 pièce' },
  { id: 'steak-hache-surgele', nom: 'Steak haché surgelé', v: [215, 19, 0.5, 0.5, 15, 6.5, 0, 0.3], g: 100, p: '1 steak' },
  { id: 'pizza-surgelee', nom: 'Pizza surgelée', v: [245, 10, 30, 3, 9.5, 4.2, 2, 1.2], g: 350, p: '1 pizza' },
  { id: 'lasagne-surgelee', nom: 'Lasagnes surgelées', v: [140, 7, 14, 2.5, 6, 2.8, 1, 0.8], g: 350, p: '1 barquette' },
  { id: 'hachis-surgele', nom: 'Hachis parmentier surgelé', v: [125, 6.5, 13, 1.5, 5.5, 2.4, 1.2, 0.8], g: 350, p: '1 barquette' },
  { id: 'gratin-surgele', nom: 'Gratin de légumes surgelé', v: [95, 3.5, 8, 2.5, 5.5, 3, 1.6, 0.7], g: 300, p: '1 barquette', fl: 45 },
  { id: 'poelee-paysanne', nom: 'Poêlée paysanne surgelée', v: [85, 2.5, 11, 1.5, 3, 0.6, 2, 0.6], g: 250, p: '1 portion', fl: 70 },
  { id: 'legume-vapeur-surgele', nom: 'Légumes vapeur surgelés', v: [35, 2, 4, 2.5, 0.4, 0.1, 2.6, 0.1], g: 250, p: '1 sachet', fl: 100 },
  { id: 'epinard-branche-surgele', nom: 'Épinards en branches surgelés', v: [26, 3, 1, 0.4, 0.4, 0.1, 2.5, 0.2], g: 250, p: '1 portion', fl: 100 },
  { id: 'brocoli-surgele', nom: 'Brocolis surgelés', v: [32, 2.8, 2.6, 1.4, 0.4, 0.1, 3.2, 0], g: 200, p: '1 portion', fl: 100 },
  { id: 'ratatouille-surgelee', nom: 'Ratatouille surgelée', v: [50, 1.1, 4, 3.2, 3, 0.5, 2, 0.5], g: 250, p: '1 portion', fl: 85 },
  { id: 'frite-surgelee', nom: 'Frites surgelées', v: [150, 2.5, 24, 0.5, 4.5, 0.5, 3, 0.3], g: 150, p: '1 portion' },
  { id: 'potato-wedges', nom: 'Potatoes', v: [195, 3, 27, 1, 8, 1, 3, 0.9], g: 150, p: '1 portion' },
  { id: 'crevette-surgelee', nom: 'Crevettes surgelées', v: [90, 19, 0.3, 0, 1, 0.2, 0, 1.1], g: 120, p: '1 portion' },
  { id: 'saumon-surgele', nom: 'Pavé de saumon surgelé', v: [200, 20, 0.5, 0.3, 13, 2.8, 0, 0.2], g: 130, p: '1 pavé' },
  { id: 'glace-bac', nom: 'Crème glacée en bac', v: [210, 3.6, 25, 22, 11, 7, 0.6, 0.1], g: 100, p: '2 boules' },
  { id: 'tarte-surgelee', nom: 'Tarte surgelée', v: [250, 5, 28, 8, 13, 6, 1.5, 0.8], g: 130, p: '1 part' },
  { id: 'pain-surgele', nom: 'Pain précuit', v: [270, 9, 52, 2, 2, 0.4, 3, 1.3], g: 60, p: '1 portion' },
  { id: 'viennoiserie-surgelee', nom: 'Viennoiserie précuite', v: [400, 7, 43, 10, 22, 13, 2, 0.8], g: 60, p: '1 pièce' },

  /* ── Plats préparés frais ── */
  { id: 'salade-traiteur', nom: 'Salade traiteur', v: [175, 5, 14, 2.5, 11, 1.6, 1.4, 0.8], g: 200, p: '1 barquette' },
  { id: 'sandwich-triangle', nom: 'Sandwich triangle', v: [225, 9, 22, 2.5, 11, 3, 1.6, 1.1], g: 180, p: '1 sandwich' },
  { id: 'salade-repas', nom: 'Salade repas complète', v: [125, 8, 10, 3, 6, 1.6, 1.8, 0.8], g: 300, p: '1 barquette', fl: 40 },
  { id: 'soupe-brique', nom: 'Soupe en brique', v: [40, 1.2, 5.5, 2.5, 1.3, 0.4, 1.4, 0.6], g: 300, p: '1 bol', fl: 75 },
  { id: 'veloute-brique', nom: 'Velouté en brique', v: [52, 1.4, 6, 2.8, 2.2, 1.2, 1.4, 0.7], g: 300, p: '1 bol', fl: 65 },
  { id: 'soupe-deshydratee', nom: 'Soupe déshydratée préparée', v: [32, 0.8, 5, 1.5, 0.9, 0.3, 0.6, 0.8], g: 250, p: '1 bol' },
  { id: 'quiche-industrielle', nom: 'Quiche du commerce', v: [255, 9, 21, 2.5, 15, 7.5, 1.2, 1.1], g: 150, p: '1 part' },
  { id: 'feuillete-apero', nom: 'Feuilletés apéritifs', v: [400, 9, 30, 2, 27, 14, 1.4, 1.6], g: 60, p: '1 poignée' },
  { id: 'pizza-part', nom: 'Part de pizza', v: [255, 11, 30, 3.4, 9.8, 4.5, 2, 1.2], g: 150, p: '1 part' },
  { id: 'wrap-industriel', nom: 'Wrap du commerce', v: [215, 9, 24, 3, 9, 2.6, 2, 1.1], g: 180, p: '1 wrap' },
  { id: 'poke-industriel', nom: 'Poke bowl du commerce', v: [140, 8, 18, 3, 4, 0.8, 1.5, 0.7], g: 350, p: '1 barquette', fl: 30 },
  { id: 'sushi-industriel', nom: 'Plateau de sushis', v: [150, 6, 28, 4, 1.8, 0.4, 0.9, 0.9], g: 250, p: '1 plateau' },
  { id: 'gaspacho-brique', nom: 'Gaspacho en brique', v: [35, 0.9, 4.2, 3.8, 1.6, 0.3, 1.2, 0.6], g: 250, p: '1 verre', fl: 90 },
  { id: 'taboule-traiteur', nom: 'Taboulé traiteur', v: [150, 3.2, 22, 4, 5, 0.8, 1.8, 0.6], g: 200, p: '1 barquette', fl: 30 },
  { id: 'carotte-rapee-traiteur', nom: 'Carottes râpées traiteur', v: [95, 0.8, 6.5, 5.5, 7, 0.9, 2.6, 0.5], g: 150, p: '1 barquette', fl: 65 },
  { id: 'betterave-traiteur', nom: 'Betteraves traiteur', v: [80, 1.6, 7, 6.5, 4.5, 0.6, 2.5, 0.6], g: 150, p: '1 barquette', fl: 75 },
  { id: 'museau-vinaigrette', nom: 'Museau vinaigrette', v: [180, 14, 2, 1, 13, 4.5, 0.3, 1.5], g: 100, p: '1 portion' },
  { id: 'saucisson-cornichon', nom: 'Assiette de charcuterie', v: [330, 20, 3, 1.5, 26, 10, 0.5, 3.2], g: 100, p: '1 assiette' },
  { id: 'plateau-fromage', nom: 'Plateau de fromages', f: 'fromage', v: [345, 22, 1.5, 1, 28, 18, 0, 1.5], g: 80, p: '1 assiette' },

  /* ── Petit déjeuner ── */
  { id: 'cereale-fibre', nom: 'Céréales riches en fibres', v: [340, 12, 58, 15, 3, 0.6, 15, 0.9], g: 40, p: '1 bol' },
  { id: 'cereale-avoine-miel', nom: 'Céréales avoine et miel', v: [420, 9, 65, 20, 13, 2.5, 6, 0.3], g: 45, p: '1 bol' },
  { id: 'muesli-fruits', nom: 'Muesli aux fruits', v: [370, 9, 62, 16, 7, 1.2, 7, 0.1], g: 50, p: '1 bol', fl: 25 },
  { id: 'porridge-instantane', nom: 'Porridge instantané', v: [365, 11, 62, 12, 7, 1.3, 8, 0.4], g: 40, p: '1 sachet' },
  { id: 'pain-grille-industriel', nom: 'Pain grillé', v: [400, 11, 70, 5, 8, 1.5, 4.5, 1.8], g: 20, p: '2 tranches' },
  { id: 'tartine-chocolat', nom: 'Tartine de pâte à tartiner', v: [340, 7, 47, 25, 13, 4.5, 2.5, 0.7], g: 60, p: '2 tartines' },
  { id: 'tartine-beurre-confiture', nom: 'Tartine beurre confiture', v: [310, 6, 50, 22, 10, 6, 2, 0.9], g: 60, p: '2 tartines' },
  { id: 'bol-cereales-lait', nom: 'Bol de céréales au lait', v: [110, 4, 18, 8, 2.2, 1, 1, 0.3], g: 250, p: '1 bol' },
  { id: 'yaourt-a-boire', nom: 'Yaourt à boire', v: [72, 2.8, 12, 11, 1.4, 0.9, 0.2, 0.1], g: 200, p: '1 bouteille' },
  { id: 'smoothie-bowl', nom: 'Smoothie bowl', v: [110, 3, 18, 14, 3, 0.8, 3, 0.1], g: 300, p: '1 bol', fl: 70 },
  { id: 'pain-proteine', nom: 'Pain protéiné', v: [245, 20, 18, 2, 9, 1.5, 10, 1.1], g: 50, p: '2 tranches' },
  { id: 'oeuf-brouille-toast', nom: 'Œufs brouillés et toast', v: [200, 11, 18, 2, 9.5, 3.5, 1.2, 0.8], g: 200, p: '1 assiette' },
  { id: 'brunch-complet', nom: 'Brunch complet', v: [210, 11, 18, 4, 11, 4, 1.5, 1] , g: 400, p: '1 assiette' },

  /* ── Goûter et encas ── */
  { id: 'compote-gourde', nom: 'Compote à boire', v: [58, 0.4, 13, 12, 0.2, 0, 1.3, 0], g: 90, p: '1 gourde', fl: 100 },
  { id: 'barre-proteinee', nom: 'Barre protéinée', v: [370, 30, 32, 8, 12, 5, 6, 0.5], g: 60, p: '1 barre' },
  { id: 'barre-fruits-secs', nom: 'Barre aux fruits secs', v: [385, 6, 55, 32, 14, 3, 6, 0.2], g: 40, p: '1 barre', fl: 40 },
  { id: 'boule-energie', nom: 'Boules d’énergie', v: [420, 9, 45, 30, 22, 4, 7, 0.1], g: 40, p: '2 boules', fl: 40 },
  { id: 'galette-riz-chocolat', nom: 'Galettes de riz au chocolat', v: [450, 7, 70, 25, 16, 9, 3, 0.3], g: 25, p: '2 galettes' },
  { id: 'yaourt-gourde', nom: 'Yaourt en gourde', v: [95, 3, 15, 14, 2.5, 1.6, 0.2, 0.1], g: 85, p: '1 gourde' },
  { id: 'gouter-fourre', nom: 'Gâteau fourré individuel', v: [420, 5, 60, 30, 18, 8, 2, 0.5], g: 35, p: '1 gâteau' },
  { id: 'crepe-fourree', nom: 'Crêpe fourrée industrielle', v: [400, 6, 55, 28, 17, 8, 2, 0.5], g: 32, p: '1 crêpe' },
  { id: 'quatre-heures', nom: 'Pain au lait et carré de chocolat', v: [370, 8, 52, 18, 14, 8, 2, 0.7], g: 60, p: '1 goûter' },
  { id: 'chips-sachet-individuel', nom: 'Sachet de chips individuel', v: [536, 6.6, 50, 0.6, 34, 3.1, 4.4, 1.3], g: 30, p: '1 sachet' },
  { id: 'fruit-coupe', nom: 'Barquette de fruits coupés', v: [55, 0.7, 12, 11, 0.2, 0, 1.8, 0], g: 150, p: '1 barquette', fl: 100 },
  { id: 'batonnet-legume', nom: 'Bâtonnets de légumes', v: [25, 1, 3.5, 2.8, 0.2, 0, 1.8, 0], g: 100, p: '1 portion', fl: 100 },

  /* ── Végétal et substituts ── */
  { id: 'haché-vegetal', nom: 'Haché végétal', v: [175, 16, 6, 1, 9, 1.2, 4, 1], g: 100, p: '1 portion' },
  { id: 'nugget-vegetal', nom: 'Nuggets végétaux', v: [230, 14, 18, 1.5, 11, 1.4, 4, 1.1], g: 120, p: '6 nuggets' },
  { id: 'saucisse-vegetale', nom: 'Saucisses végétales', v: [200, 17, 7, 1, 12, 1.6, 4, 1.3], g: 100, p: '2 saucisses' },
  { id: 'boulette-vegetale', nom: 'Boulettes végétales', v: [195, 15, 10, 1.5, 10, 1.4, 5, 1.1], g: 120, p: '1 portion' },
  { id: 'burger-vegetal', nom: 'Steak de burger végétal', v: [220, 18, 8, 1, 13, 5, 4, 1.2], g: 110, p: '1 steak' },
  { id: 'emince-vegetal', nom: 'Émincé végétal', v: [165, 20, 5, 0.8, 7, 0.9, 3, 1] , g: 120, p: '1 portion' },
  { id: 'fromage-vegetal', nom: 'Alternative végétale au fromage', v: [280, 1, 22, 1, 21, 18, 1, 1.6], g: 30, p: '1 portion' },
  { id: 'creme-vegetale', nom: 'Crème végétale à cuisiner', v: [175, 1.5, 5, 2, 16, 2, 0.4, 0.2], g: 30, p: '2 cuillères' },
  { id: 'dessert-soja', nom: 'Dessert au soja', v: [95, 3.5, 14, 12, 2.4, 0.4, 0.6, 0.1], g: 100, p: '1 pot' },
  { id: 'dessert-avoine', nom: 'Dessert à l’avoine', v: [100, 1.2, 17, 12, 2.8, 0.3, 0.8, 0.1], g: 100, p: '1 pot' },
  { id: 'houmous-industriel', nom: 'Houmous du commerce', v: [265, 7, 13, 1.5, 20, 2.4, 5.5, 1.3], g: 60, p: '1 portion', fl: 55 },
  { id: 'galette-quinoa', nom: 'Galettes quinoa légumes', v: [190, 6, 20, 2.5, 9, 1.2, 4, 0.9], g: 100, p: '2 galettes', fl: 35 },
  { id: 'falafel-industriel', nom: 'Falafels du commerce', v: [275, 11, 24, 2, 15, 1.9, 6, 1.2], g: 120, p: '5 falafels', fl: 40 },

  /* ── Boulangerie et pâtisserie du commerce ── */
  { id: 'baguette-graines', nom: 'Baguette aux graines', v: [280, 10, 47, 2.5, 6, 1, 4, 1.3], g: 50, p: '1/5 de baguette' },
  { id: 'pain-brioche-tranche', nom: 'Pain brioché tranché', v: [345, 8, 52, 12, 12, 6.5, 2, 0.8], g: 40, p: '1 tranche' },
  { id: 'pain-hot-dog', nom: 'Pain à hot-dog', v: [280, 9, 48, 6, 5.5, 1.2, 2.5, 1] , g: 60, p: '1 pain' },
  { id: 'pain-suedois-sandwich', nom: 'Pain suédois à sandwich', v: [290, 9, 46, 5, 7.5, 3, 2.5, 1.1], g: 60, p: '1 pain' },
  { id: 'brioche-tressee', nom: 'Brioche tressée', v: [370, 8, 50, 12, 15, 9, 2, 0.8], g: 50, p: '1 tranche' },
  { id: 'pain-lait-industriel', nom: 'Pains au lait', v: [340, 9, 50, 12, 11, 6, 2, 0.8], g: 35, p: '1 pain au lait' },
  { id: 'muffin-chocolat', nom: 'Muffin au chocolat', v: [420, 6, 50, 30, 21, 9, 2.5, 0.6], g: 80, p: '1 muffin' },
  { id: 'donut-glace', nom: 'Donut glacé', v: [430, 6, 52, 28, 22, 10, 1.5, 0.6], g: 65, p: '1 donut' },
  { id: 'chouquette-industrielle', nom: 'Chouquettes du commerce', v: [400, 7, 45, 15, 20, 12, 1.5, 0.7], g: 40, p: '4 chouquettes' },
  { id: 'tarte-individuelle', nom: 'Tartelette individuelle', v: [290, 4, 38, 20, 13, 6.5, 1.5, 0.4], g: 90, p: '1 tartelette' },
  { id: 'entremets', nom: 'Entremets pâtissier', v: [300, 5, 33, 25, 16, 9, 1, 0.3], g: 100, p: '1 part' },
  { id: 'viennoise-chocolat', nom: 'Pain viennois aux pépites', v: [370, 8, 52, 15, 14, 7.5, 2, 0.8], g: 60, p: '1 pain' },

  /* ── Boissons du commerce ── */
  { id: 'jus-orange-frais', nom: 'Jus d’orange pressé', v: [45, 0.7, 10, 9, 0.2, 0, 0.3, 0], g: 250, p: '1 verre', fl: 100 },
  { id: 'jus-concentre', nom: 'Jus à base de concentré', v: [46, 0.4, 11, 10, 0.1, 0, 0.2, 0], g: 200, p: '1 verre', fl: 100 },
  { id: 'the-froid-peche', nom: 'Thé glacé à la pêche', v: [28, 0, 6.8, 6.8, 0, 0, 0, 0], g: 330, p: '1 canette' },
  { id: 'boisson-cafe-froid', nom: 'Café frappé du commerce', v: [65, 2.4, 10, 9.5, 1.8, 1.1, 0.2, 0.1], g: 250, p: '1 bouteille' },
  { id: 'boisson-proteinee', nom: 'Boisson protéinée', v: [65, 10, 3, 2, 1.5, 0.9, 0.3, 0.2], g: 330, p: '1 bouteille' },
  { id: 'eau-vitaminee', nom: 'Eau vitaminée', v: [18, 0, 4.5, 4.5, 0, 0, 0, 0], g: 500, p: '1 bouteille' },
  { id: 'cocktail-sans-alcool', nom: 'Cocktail sans alcool', v: [65, 0.3, 15, 14, 0.1, 0, 0.2, 0], g: 250, p: '1 verre' },
  { id: 'chocolat-chaud-instantane', nom: 'Chocolat chaud instantané', v: [80, 2.5, 13, 11, 2, 1.2, 0.7, 0.2], g: 200, p: '1 tasse' },

  /* ── Bébé et jeune enfant ── */
  { id: 'petit-pot-legumes', nom: 'Petit pot de légumes', v: [55, 1.8, 6, 2, 2.2, 0.7, 1.5, 0.1], g: 200, p: '1 pot', fl: 70, rare: true },
  { id: 'petit-pot-fruits', nom: 'Petit pot de fruits', v: [62, 0.4, 14, 13, 0.2, 0, 1.4, 0], g: 130, p: '1 pot', fl: 100, rare: true },
  { id: 'lait-croissance', nom: 'Lait de croissance', f: 'boisson', v: [65, 2, 8, 8, 2.8, 1, 0.4, 0.1], g: 250, p: '1 biberon', rare: true },
  { id: 'biscuit-bebe', nom: 'Biscuits pour bébé', v: [420, 8, 72, 20, 11, 5, 3, 0.4], g: 20, p: '2 biscuits', rare: true },

  /* ── Nutrition sportive ── */
  { id: 'whey', nom: 'Protéine en poudre', v: [380, 78, 6, 4, 5, 2.5, 1, 0.6], g: 30, p: '1 dose' },
  { id: 'gainer', nom: 'Gainer', v: [385, 22, 62, 15, 5, 2, 3, 0.5], g: 60, p: '1 dose', rare: true },
  { id: 'gel-energetique', nom: 'Gel énergétique', v: [250, 0, 62, 25, 0, 0, 0, 0.4], g: 35, p: '1 gel', rare: true },
  { id: 'barre-energetique', nom: 'Barre énergétique', v: [380, 7, 62, 28, 10, 3, 4, 0.3], g: 45, p: '1 barre' },
  { id: 'boisson-recuperation', nom: 'Boisson de récupération', v: [70, 5, 11, 8, 0.8, 0.4, 0.2, 0.3], g: 400, p: '1 shaker', rare: true },
  { id: 'creatine', nom: 'Créatine', v: [0, 0, 0, 0, 0, 0, 0, 0], g: 5, p: '1 dose', rare: true },
]
