import type { Brut } from '../brut'

/**
 * Laits, yaourts, crèmes, fromages et desserts lactés.
 *
 * **Les fromages portent `f: 'fromage'` et les laits `f: 'boisson'`** : le
 * Nutri-Score ne les note pas au même barème que le reste, et se tromper de
 * famille donne un E à un comté qui mérite un D. Les boissons végétales sont ici
 * plutôt qu'avec les boissons — c'est du lait qu'on cherche quand on les cherche.
 */
export const LAITIERS: Brut[] = [
  /* ── Laits ── */
  { id: 'lait-entier', nom: 'Lait entier', f: 'boisson', v: [64, 3.2, 4.8, 4.8, 3.6, 2.3, 0, 0.1], g: 200, p: '1 verre' },
  { id: 'lait-demi', nom: 'Lait demi-écrémé', f: 'boisson', v: [46, 3.2, 4.8, 4.8, 1.5, 1, 0, 0.1], g: 200, p: '1 verre' },
  { id: 'lait-ecreme', nom: 'Lait écrémé', f: 'boisson', v: [33, 3.3, 4.8, 4.8, 0.1, 0.1, 0, 0.1], g: 200, p: '1 verre' },
  { id: 'lait-soja', nom: 'Boisson au soja', f: 'boisson', v: [40, 3.3, 1, 0.5, 1.9, 0.3, 0.5, 0.1], g: 200, p: '1 verre', syn: ['lait de soja'] },
  { id: 'lait-amande', nom: 'Boisson à l’amande', f: 'boisson', v: [22, 0.5, 2.5, 2.5, 1.1, 0.1, 0.3, 0.1], g: 200, p: '1 verre', syn: ['lait d’amande'] },
  { id: 'lait-avoine', nom: 'Boisson à l’avoine', f: 'boisson', v: [45, 0.5, 7, 4, 1.5, 0.2, 0.8, 0.1], g: 200, p: '1 verre', syn: ['lait d’avoine'] },
  { id: 'lait-riz', nom: 'Boisson au riz', f: 'boisson', v: [50, 0.1, 10, 5, 1, 0.1, 0.1, 0.1], g: 200, p: '1 verre', syn: ['lait de riz'] },
  { id: 'lait-coco', nom: 'Lait de coco', v: [190, 2, 3, 3, 19, 17, 0.5, 0], g: 100, p: '1 portion' },
  { id: 'lait-concentre-sucre', nom: 'Lait concentré sucré', v: [320, 8, 55, 55, 8, 5, 0, 0.3], g: 20, p: '1 cuillère' },
  { id: 'lait-concentre-nature', nom: 'Lait concentré non sucré', v: [135, 7, 10, 10, 7.5, 4.8, 0, 0.3], g: 30, p: '1 portion' },
  { id: 'lait-poudre', nom: 'Lait en poudre écrémé', v: [355, 35, 52, 52, 1, 0.6, 0, 1.2], g: 20, p: '2 cuillères' },

  /* ── Yaourts et fromages blancs ── */
  { id: 'yaourt-nature', nom: 'Yaourt nature', v: [61, 3.5, 4.7, 4.7, 3.2, 2, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-0', nom: 'Yaourt nature 0 %', v: [42, 4.4, 5.9, 5.9, 0.1, 0.1, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-brasse', nom: 'Yaourt brassé', v: [72, 3.4, 6, 6, 3.4, 2.2, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-fruits', nom: 'Yaourt aux fruits', v: [95, 3.5, 15, 14, 2.5, 1.6, 0.3, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-fruits-0', nom: 'Yaourt aux fruits 0 %', v: [55, 4, 9, 9, 0.1, 0.1, 0.3, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-grec', nom: 'Yaourt à la grecque', v: [115, 3.5, 4, 4, 9.5, 6, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'skyr', nom: 'Skyr nature', v: [63, 11, 4, 4, 0.2, 0.1, 0, 0.1], g: 150, p: '1 pot' },
  { id: 'skyr-fruits', nom: 'Skyr aux fruits', v: [78, 9, 10, 9, 0.2, 0.1, 0.3, 0.1], g: 150, p: '1 pot' },
  { id: 'fromage-blanc', nom: 'Fromage blanc 3 %', v: [74, 7.5, 4.5, 4.5, 3, 2, 0, 0.1], g: 100, p: '1 portion' },
  { id: 'fromage-blanc-0', nom: 'Fromage blanc 0 %', v: [47, 8, 4.5, 4.5, 0.2, 0.1, 0, 0.1], g: 100, p: '1 portion' },
  { id: 'fromage-blanc-20', nom: 'Fromage blanc 20 %', v: [105, 7, 4, 4, 6.5, 4.3, 0, 0.1], g: 100, p: '1 portion' },
  { id: 'petit-suisse', nom: 'Petits-suisses', v: [145, 9, 3, 3, 10, 6.5, 0, 0.1], g: 60, p: '2 petits-suisses' },
  { id: 'faisselle', nom: 'Faisselle', v: [75, 6.5, 3.5, 3.5, 4, 2.6, 0, 0.1], g: 100, p: '1 portion' },
  { id: 'yaourt-soja', nom: 'Yaourt au soja', v: [50, 3.5, 4, 2.5, 2.2, 0.4, 0.5, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-coco', nom: 'Yaourt au lait de coco', v: [130, 1, 6, 5, 11, 10, 0.5, 0], g: 125, p: '1 pot' },
  { id: 'kefir', nom: 'Kéfir de lait', f: 'boisson', v: [55, 3.3, 4.5, 4.5, 2.5, 1.6, 0, 0.1], g: 200, p: '1 verre', rare: true },

  /* ── Crèmes ── */
  { id: 'creme-epaisse', nom: 'Crème fraîche épaisse 30 %', v: [290, 2.3, 3, 3, 30, 20, 0, 0.1], g: 30, p: '2 cuillères' },
  { id: 'creme-legere', nom: 'Crème légère 15 %', v: [155, 2.6, 4, 4, 15, 10, 0, 0.1], g: 30, p: '2 cuillères' },
  { id: 'creme-liquide', nom: 'Crème liquide entière', v: [340, 2.2, 3, 3, 35, 23, 0, 0.1], g: 30, p: '2 cuillères' },
  { id: 'creme-soja', nom: 'Crème de soja', v: [180, 2.5, 2, 1, 18, 2, 0.3, 0.1], g: 30, p: '2 cuillères' },
  { id: 'mascarpone', nom: 'Mascarpone', v: [355, 4, 4, 4, 36, 24, 0, 0.1], g: 30, p: '1 portion' },
  { id: 'creme-chantilly', nom: 'Crème chantilly', v: [290, 2, 12, 12, 26, 17, 0, 0.1], g: 30, p: '1 portion' },

  /* ── Fromages à pâte pressée ── */
  { id: 'emmental', nom: 'Emmental', f: 'fromage', v: [382, 28, 0.5, 0.5, 30, 19, 0, 0.6], g: 30, p: '1 portion' },
  { id: 'comte', nom: 'Comté', f: 'fromage', v: [400, 27, 1, 1, 32, 20, 0, 0.7], g: 30, p: '1 portion' },
  { id: 'gruyere', nom: 'Gruyère', f: 'fromage', v: [390, 27, 0.5, 0.5, 31, 19, 0, 0.9], g: 30, p: '1 portion' },
  { id: 'beaufort', nom: 'Beaufort', f: 'fromage', v: [400, 26, 0.5, 0.5, 33, 21, 0, 0.8], g: 30, p: '1 portion' },
  { id: 'cantal', nom: 'Cantal', f: 'fromage', v: [370, 24, 1, 1, 30, 19, 0, 1.2], g: 30, p: '1 portion' },
  { id: 'tomme', nom: 'Tomme de Savoie', f: 'fromage', v: [350, 24, 0.5, 0.5, 28, 18, 0, 1.2], g: 30, p: '1 portion' },
  { id: 'raclette', nom: 'Fromage à raclette', f: 'fromage', v: [350, 22, 1, 1, 28, 18, 0, 1.6], g: 60, p: '3 tranches' },
  { id: 'morbier', nom: 'Morbier', f: 'fromage', v: [350, 22, 1, 1, 29, 19, 0, 1.4], g: 30, p: '1 portion' },
  { id: 'ossau-iraty', nom: 'Ossau-Iraty', f: 'fromage', v: [380, 25, 0.5, 0.5, 31, 20, 0, 1.5], g: 30, p: '1 portion' },
  { id: 'cheddar', nom: 'Cheddar', f: 'fromage', v: [400, 25, 0.5, 0.5, 33, 21, 0, 1.8], g: 30, p: '1 portion' },
  { id: 'gouda', nom: 'Gouda', f: 'fromage', v: [356, 25, 2, 2, 27, 17, 0, 2], g: 30, p: '1 portion' },
  { id: 'edam', nom: 'Édam', f: 'fromage', v: [300, 26, 1, 1, 22, 14, 0, 2], g: 30, p: '1 portion' },
  { id: 'mimolette', nom: 'Mimolette', f: 'fromage', v: [360, 25, 0.5, 0.5, 29, 18, 0, 1.8], g: 30, p: '1 portion' },
  { id: 'parmesan', nom: 'Parmesan', f: 'fromage', v: [400, 33, 0.5, 0.5, 29, 19, 0, 1.6], g: 15, p: '2 cuillères' },
  { id: 'pecorino', nom: 'Pecorino', f: 'fromage', v: [390, 28, 1, 1, 30, 20, 0, 3.5], g: 15, p: '2 cuillères', rare: true },
  { id: 'fromage-rape', nom: 'Fromage râpé', f: 'fromage', v: [380, 27, 1, 1, 29, 18, 0, 1.5], g: 30, p: '1 poignée' },
  { id: 'halloumi', nom: 'Halloumi', f: 'fromage', v: [320, 22, 2, 2, 25, 17, 0, 2.5], g: 60, p: '1 portion', rare: true },

  /* ── Fromages à pâte molle ── */
  { id: 'camembert', nom: 'Camembert', f: 'fromage', v: [299, 20, 0.5, 0.5, 24, 16, 0, 1.6], g: 30, p: '1 portion' },
  { id: 'brie', nom: 'Brie', f: 'fromage', v: [330, 19, 0.5, 0.5, 28, 18, 0, 1.3], g: 30, p: '1 portion', syn: ['coulommiers'] },
  { id: 'munster', nom: 'Munster', f: 'fromage', v: [330, 19, 1, 1, 28, 18, 0, 1.8], g: 30, p: '1 portion' },
  { id: 'maroilles', nom: 'Maroilles', f: 'fromage', v: [350, 21, 1, 1, 29, 19, 0, 2], g: 30, p: '1 portion' },
  { id: 'reblochon', nom: 'Reblochon', f: 'fromage', v: [330, 20, 1, 1, 28, 18, 0, 1.2], g: 30, p: '1 portion' },
  { id: 'saint-nectaire', nom: 'Saint-Nectaire', f: 'fromage', v: [340, 22, 1, 1, 28, 18, 0, 1.5], g: 30, p: '1 portion' },
  { id: 'epoisses', nom: 'Époisses', f: 'fromage', v: [330, 18, 1, 1, 28, 18, 0, 1.9], g: 30, p: '1 portion', rare: true },
  { id: 'chaource', nom: 'Chaource', f: 'fromage', v: [330, 17, 1, 1, 29, 19, 0, 1.4], g: 30, p: '1 portion', rare: true },

  /* ── Fromages bleus ── */
  { id: 'roquefort', nom: 'Roquefort', f: 'fromage', v: [370, 19, 1, 1, 32, 21, 0, 3.8], g: 30, p: '1 portion' },
  { id: 'bleu-auvergne', nom: 'Bleu d’Auvergne', f: 'fromage', v: [350, 19, 1, 1, 30, 20, 0, 3.5], g: 30, p: '1 portion' },
  { id: 'gorgonzola', nom: 'Gorgonzola', f: 'fromage', v: [340, 18, 1, 1, 30, 20, 0, 2.8], g: 30, p: '1 portion' },

  /* ── Fromages de chèvre et de brebis ── */
  { id: 'chevre', nom: 'Fromage de chèvre', f: 'fromage', v: [271, 18, 2, 2, 21, 15, 0, 1.5], g: 30, p: '1 portion' },
  { id: 'chevre-frais', nom: 'Chèvre frais', f: 'fromage', v: [190, 12, 2, 2, 15, 10, 0, 1], g: 40, p: '1 portion' },
  { id: 'buche-chevre', nom: 'Bûche de chèvre', f: 'fromage', v: [290, 18, 1, 1, 24, 17, 0, 1.4], g: 30, p: '2 rondelles' },
  { id: 'feta', nom: 'Feta', f: 'fromage', v: [264, 14, 1, 1, 21, 14, 0, 3.5], g: 30, p: '1 portion' },
  { id: 'brebis', nom: 'Fromage de brebis', f: 'fromage', v: [370, 25, 1, 1, 30, 20, 0, 1.6], g: 30, p: '1 portion' },

  /* ── Fromages frais et fondus ── */
  { id: 'mozzarella', nom: 'Mozzarella', f: 'fromage', v: [250, 18, 1, 1, 19, 12, 0, 0.6], g: 60, p: '1/2 boule' },
  { id: 'mozzarella-bufflonne', nom: 'Mozzarella di bufala', f: 'fromage', v: [280, 16, 1, 1, 24, 16, 0, 0.5], g: 60, p: '1/2 boule' },
  { id: 'burrata', nom: 'Burrata', f: 'fromage', v: [300, 13, 2, 2, 27, 18, 0, 0.6], g: 60, p: '1/2 burrata' },
  { id: 'ricotta', nom: 'Ricotta', f: 'fromage', v: [145, 7, 3, 3, 11, 7, 0, 0.2], g: 60, p: '1 portion' },
  { id: 'cottage', nom: 'Cottage cheese', f: 'fromage', v: [98, 11, 3, 3, 4.3, 2.7, 0, 0.5], g: 100, p: '1 portion' },
  { id: 'fromage-tartiner', nom: 'Fromage frais à tartiner', f: 'fromage', v: [230, 6, 3, 3, 22, 15, 0, 0.9], g: 30, p: '1 portion' },
  { id: 'fromage-ail-herbes', nom: 'Fromage ail et fines herbes', f: 'fromage', v: [400, 6, 2, 2, 40, 27, 0, 1.3], g: 30, p: '1 portion' },
  { id: 'fromage-fondu', nom: 'Fromage fondu', f: 'fromage', v: [280, 12, 6, 6, 23, 15, 0, 2.5], g: 20, p: '1 portion' },
  { id: 'fromage-allege', nom: 'Fromage allégé en matières grasses', f: 'fromage', v: [200, 30, 2, 2, 8, 5, 0, 1.4], g: 30, p: '1 portion' },

  /* ── Desserts lactés ── */
  { id: 'creme-dessert', nom: 'Crème dessert', v: [120, 3, 18, 16, 4, 2.6, 0.2, 0.2], g: 125, p: '1 pot' },
  { id: 'flan', nom: 'Flan', v: [110, 3.5, 17, 15, 3, 2, 0, 0.2], g: 125, p: '1 pot' },
  { id: 'liegeois', nom: 'Liégeois', v: [145, 3.5, 18, 16, 6.5, 4.3, 0.4, 0.2], g: 125, p: '1 pot' },
  { id: 'mousse-chocolat', nom: 'Mousse au chocolat', v: [200, 5, 23, 21, 10, 6.5, 1, 0.2], g: 100, p: '1 pot' },
  { id: 'riz-au-lait', nom: 'Riz au lait', v: [130, 3.5, 20, 13, 3.5, 2.2, 0.3, 0.1], g: 150, p: '1 pot' },
  { id: 'semoule-lait', nom: 'Semoule au lait', v: [115, 3.5, 19, 12, 2.5, 1.6, 0.2, 0.1], g: 150, p: '1 pot' },
  { id: 'creme-brulee', nom: 'Crème brûlée', v: [280, 4, 22, 21, 19, 12, 0, 0.1], g: 100, p: '1 ramequin' },
  { id: 'ile-flottante', nom: 'Île flottante', v: [130, 4, 20, 19, 3.5, 1.8, 0, 0.1], g: 120, p: '1 portion' },
  { id: 'fromage-blanc-coulis', nom: 'Fromage blanc au coulis de fruits', v: [95, 6, 12, 11, 2.5, 1.6, 0.4, 0.1], g: 150, p: '1 portion' },

  /* ── Compléments ── */
  { id: 'yaourt-vanille', nom: 'Yaourt à la vanille', v: [90, 3.5, 14, 13, 2.5, 1.6, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-nature-sucre', nom: 'Yaourt nature sucré', v: [85, 3.4, 13, 13, 2.5, 1.6, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-bulgare', nom: 'Yaourt à la bulgare', v: [80, 3.6, 4.5, 4.5, 5.5, 3.5, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-chevre', nom: 'Yaourt de chèvre', v: [70, 3.6, 4.3, 4.3, 4, 2.7, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-brebis', nom: 'Yaourt de brebis', v: [95, 4.5, 4.5, 4.5, 6.5, 4.3, 0, 0.1], g: 125, p: '1 pot' },
  { id: 'yaourt-amande', nom: 'Yaourt à l’amande', v: [70, 1.2, 6, 4, 4.5, 0.4, 0.8, 0.1], g: 125, p: '1 pot' },
  { id: 'skyr-brasse', nom: 'Skyr brassé', v: [68, 10, 5, 4.5, 0.3, 0.2, 0, 0.1], g: 150, p: '1 pot' },
  { id: 'fromage-blanc-fruits', nom: 'Fromage blanc aux fruits', v: [95, 5.5, 13, 12, 2.5, 1.6, 0.4, 0.1], g: 125, p: '1 pot' },
  { id: 'petit-suisse-fruits', nom: 'Petits-suisses aux fruits', v: [130, 7, 13, 12, 5.5, 3.6, 0.3, 0.1], g: 60, p: '2 petits-suisses' },
  { id: 'lait-ribot', nom: 'Lait ribot', f: 'boisson', v: [40, 3.4, 4.5, 4.5, 0.9, 0.6, 0, 0.1], g: 200, p: '1 verre', syn: ['babeurre'] },
  { id: 'lassi', nom: 'Lassi', f: 'boisson', v: [75, 3, 12, 11, 1.8, 1.1, 0.1, 0.1], g: 250, p: '1 verre' },
  { id: 'milkshake', nom: 'Milkshake', f: 'boisson', v: [110, 3.2, 17, 16, 3.5, 2.2, 0.2, 0.1], g: 250, p: '1 verre' },
  { id: 'lait-chocolate', nom: 'Lait chocolaté', f: 'boisson', v: [75, 3.2, 11, 10, 2, 1.3, 0.5, 0.1], g: 200, p: '1 verre' },
  { id: 'creme-fraiche-allegee', nom: 'Crème fraîche allégée 8 %', v: [95, 3, 4.5, 4.5, 8, 5.3, 0, 0.1], g: 30, p: '2 cuillères' },
  { id: 'creme-avoine', nom: 'Crème d’avoine', v: [175, 1, 8, 3, 15, 1.5, 0.5, 0.1], g: 30, p: '2 cuillères' },
  { id: 'creme-coco-cuisine', nom: 'Crème de coco', v: [200, 2, 3, 2.5, 20, 18, 0.5, 0.1], g: 30, p: '2 cuillères' },
  { id: 'saint-marcellin', nom: 'Saint-Marcellin', f: 'fromage', v: [310, 18, 1, 1, 26, 17, 0, 1.3], g: 40, p: '1 fromage' },
  { id: 'livarot', nom: 'Livarot', f: 'fromage', v: [340, 20, 1, 1, 28, 18, 0, 2], g: 30, p: '1 portion', rare: true },
  { id: 'pont-eveque', nom: 'Pont-l’Évêque', f: 'fromage', v: [335, 20, 1, 1, 28, 18, 0, 1.7], g: 30, p: '1 portion', rare: true },
  { id: 'neufchatel', nom: 'Neufchâtel', f: 'fromage', v: [330, 18, 1, 1, 28, 18, 0, 1.5], g: 30, p: '1 portion', rare: true },
  { id: 'abondance', nom: 'Abondance', f: 'fromage', v: [390, 25, 1, 1, 32, 20, 0, 1.3], g: 30, p: '1 portion', rare: true },
  { id: 'salers', nom: 'Salers', f: 'fromage', v: [375, 24, 1, 1, 31, 19, 0, 1.4], g: 30, p: '1 portion', rare: true },
  { id: 'laguiole', nom: 'Laguiole', f: 'fromage', v: [370, 24, 1, 1, 30, 19, 0, 1.4], g: 30, p: '1 portion', rare: true },
  { id: 'bleu-bresse', nom: 'Bleu de Bresse', f: 'fromage', v: [345, 17, 1, 1, 30, 20, 0, 2.2], g: 30, p: '1 portion' },
  { id: 'fourme-ambert', nom: 'Fourme d’Ambert', f: 'fromage', v: [345, 20, 1, 1, 29, 19, 0, 2.4], g: 30, p: '1 portion' },
  { id: 'triple-creme', nom: 'Fromage triple crème', f: 'fromage', v: [400, 12, 2, 2, 38, 25, 0, 1.1], g: 30, p: '1 portion' },
  { id: 'fromage-portion', nom: 'Fromage en portion', f: 'fromage', v: [300, 23, 0.5, 0.5, 23, 15, 0, 1.7], g: 20, p: '1 portion' },
  { id: 'mozzarella-rapee', nom: 'Mozzarella râpée', f: 'fromage', v: [280, 22, 2, 2, 21, 13, 0, 1.2], g: 30, p: '1 poignée' },
  { id: 'cervelle-canut', nom: 'Cervelle de canut', f: 'fromage', v: [110, 8, 3, 3, 7, 4.5, 0.2, 0.8], g: 100, p: '1 portion', rare: true },
  { id: 'panna-cotta', nom: 'Panna cotta', v: [250, 3.5, 22, 21, 17, 11, 0, 0.1], g: 110, p: '1 portion' },
  { id: 'yaourt-glace', nom: 'Yaourt glacé', v: [130, 4, 22, 20, 3, 2, 0.2, 0.1], g: 120, p: '1 portion' },
  { id: 'fromage-blanc-miel', nom: 'Fromage blanc au miel', v: [115, 6.5, 16, 15, 2.6, 1.7, 0.1, 0.1], g: 150, p: '1 portion' },
]
