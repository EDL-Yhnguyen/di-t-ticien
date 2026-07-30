import type { Brut } from '../brut'

/**
 * Fruits frais, secs, en conserve et préparations de fruits.
 *
 * Les fruits portent `fl: 100` — leur part de fruits et légumes au sens du
 * Nutri-Score. Les préparations descendent en dessous quand elles sont coupées
 * d'autre chose : un fruit au sirop, c'est du fruit et du sucre.
 */
export const FRUITS: Brut[] = [
  /* ── Fruits à pépins et à noyau ── */
  { id: 'pomme', nom: 'Pomme', v: [52, 0.3, 12, 10, 0.2, 0, 2.4, 0], g: 150, p: '1 pomme', fl: 100 },
  { id: 'pomme-cuite', nom: 'Pomme au four', v: [59, 0.3, 13, 12, 0.2, 0, 2.2, 0], g: 150, p: '1 pomme', fl: 100 },
  { id: 'poire', nom: 'Poire', v: [57, 0.4, 13, 10, 0.1, 0, 3.1, 0], g: 160, p: '1 poire', fl: 100 },
  { id: 'coing', nom: 'Coing', v: [57, 0.4, 12, 9, 0.1, 0, 1.9, 0], g: 150, p: '1 coing', fl: 100, rare: true },
  { id: 'peche', nom: 'Pêche', v: [39, 0.9, 8, 8, 0.3, 0, 1.5, 0], g: 150, p: '1 pêche', fl: 100 },
  { id: 'nectarine', nom: 'Nectarine', v: [44, 1.1, 9, 8, 0.3, 0, 1.7, 0], g: 140, p: '1 nectarine', fl: 100, syn: ['brugnon'] },
  { id: 'abricot', nom: 'Abricots', v: [48, 1.4, 9, 9, 0.4, 0, 2, 0], g: 120, p: '3 abricots', fl: 100 },
  { id: 'prune', nom: 'Prunes', v: [46, 0.7, 10, 10, 0.3, 0, 1.4, 0], g: 120, p: '3 prunes', fl: 100, syn: ['quetsche', 'mirabelle', 'reine-claude'] },
  { id: 'cerise', nom: 'Cerises', v: [63, 1, 13, 13, 0.2, 0, 2.1, 0], g: 120, p: '1 poignée', fl: 100 },
  { id: 'raisin', nom: 'Raisin', v: [69, 0.7, 16, 16, 0.2, 0.1, 0.9, 0], g: 120, p: '1 grappe', fl: 100 },
  { id: 'kaki', nom: 'Kaki', v: [70, 0.6, 16, 13, 0.2, 0, 1.6, 0], g: 150, p: '1 kaki', fl: 100, rare: true },

  /* ── Agrumes ── */
  { id: 'orange', nom: 'Orange', v: [47, 0.9, 9, 9, 0.1, 0, 2.4, 0], g: 180, p: '1 orange', fl: 100 },
  { id: 'clementine', nom: 'Clémentines', v: [47, 0.9, 10, 9, 0.2, 0, 1.7, 0], g: 120, p: '2 clémentines', fl: 100, syn: ['mandarine'] },
  { id: 'mandarine', nom: 'Mandarine', v: [53, 0.8, 12, 11, 0.3, 0, 1.8, 0], g: 90, p: '1 mandarine', fl: 100 },
  { id: 'pamplemousse', nom: 'Pamplemousse', v: [42, 0.8, 9, 7, 0.1, 0, 1.6, 0], g: 200, p: '1/2 pamplemousse', fl: 100, syn: ['pomelo'] },
  { id: 'citron', nom: 'Citron', v: [29, 1.1, 3, 2.5, 0.3, 0, 2.8, 0], g: 60, p: '1 citron', fl: 100 },
  { id: 'citron-vert', nom: 'Citron vert', v: [30, 0.7, 8, 1.7, 0.2, 0, 2.8, 0], g: 50, p: '1 citron vert', fl: 100, syn: ['lime'] },

  /* ── Fruits rouges ── */
  { id: 'fraise', nom: 'Fraises', v: [32, 0.7, 6, 5, 0.3, 0, 2, 0], g: 150, p: '1 bol', fl: 100 },
  { id: 'framboise', nom: 'Framboises', v: [52, 1.2, 5, 4.4, 0.7, 0, 6.5, 0], g: 125, p: '1 barquette', fl: 100 },
  { id: 'mure', nom: 'Mûres', v: [43, 1.4, 5, 4.9, 0.5, 0, 5.3, 0], g: 125, p: '1 barquette', fl: 100 },
  { id: 'myrtille', nom: 'Myrtilles', v: [57, 0.7, 12, 10, 0.3, 0, 2.4, 0], g: 125, p: '1 barquette', fl: 100 },
  { id: 'groseille', nom: 'Groseilles', v: [56, 1.4, 8, 7.4, 0.2, 0, 4.3, 0], g: 100, p: '1 poignée', fl: 100, rare: true },
  { id: 'cassis', nom: 'Cassis', v: [63, 1.4, 11, 11, 0.4, 0, 6.8, 0], g: 100, p: '1 poignée', fl: 100, rare: true },
  { id: 'cranberry', nom: 'Canneberges', v: [46, 0.4, 12, 4, 0.1, 0, 3.6, 0], g: 60, p: '1 poignée', fl: 100, syn: ['cranberry'], rare: true },
  { id: 'fruits-rouges-surgeles', nom: 'Fruits rouges surgelés', v: [48, 1, 8, 7, 0.4, 0, 4, 0], g: 125, p: '1 portion', fl: 100 },

  /* ── Fruits exotiques ── */
  { id: 'banane', nom: 'Banane', v: [89, 1.1, 20, 12, 0.3, 0.1, 2.6, 0], g: 120, p: '1 banane', fl: 100 },
  { id: 'banane-plantain', nom: 'Banane plantain cuite', v: [122, 1.3, 28, 15, 0.4, 0.1, 2.3, 0], g: 150, p: '1 portion', fl: 100, rare: true },
  { id: 'ananas', nom: 'Ananas', v: [50, 0.5, 12, 10, 0.1, 0, 1.4, 0], g: 150, p: '2 tranches', fl: 100 },
  { id: 'mangue', nom: 'Mangue', v: [60, 0.8, 14, 14, 0.4, 0.1, 1.6, 0], g: 150, p: '1/2 mangue', fl: 100 },
  { id: 'papaye', nom: 'Papaye', v: [43, 0.5, 11, 8, 0.3, 0, 1.7, 0], g: 150, p: '1 portion', fl: 100, rare: true },
  { id: 'goyave', nom: 'Goyave', v: [68, 2.6, 14, 9, 1, 0.3, 5.4, 0], g: 120, p: '1 goyave', fl: 100, rare: true },
  { id: 'fruit-passion', nom: 'Fruit de la passion', v: [97, 2.2, 11, 11, 0.7, 0, 10, 0], g: 60, p: '2 fruits', fl: 100, syn: ['maracudja'], rare: true },
  { id: 'litchi', nom: 'Litchis', v: [66, 0.8, 16, 15, 0.4, 0, 1.3, 0], g: 100, p: '1 poignée', fl: 100, rare: true },
  { id: 'grenade', nom: 'Grenade', v: [83, 1.7, 19, 14, 1.2, 0.1, 4, 0], g: 150, p: '1/2 grenade', fl: 100, rare: true },
  { id: 'kiwi', nom: 'Kiwi', v: [61, 1.1, 12, 9, 0.5, 0, 3, 0], g: 90, p: '1 kiwi', fl: 100 },
  { id: 'figue', nom: 'Figues fraîches', v: [74, 0.8, 16, 16, 0.3, 0.1, 2.9, 0], g: 100, p: '2 figues', fl: 100 },
  { id: 'noix-coco-fraiche', nom: 'Noix de coco fraîche', v: [354, 3.3, 6, 6, 33, 30, 9, 0], g: 30, p: '1 morceau', fl: 100, rare: true },

  /* ── Melons et rhubarbe ── */
  { id: 'melon', nom: 'Melon', v: [34, 0.8, 8, 8, 0.2, 0, 0.9, 0], g: 200, p: '1/4 de melon', fl: 100 },
  { id: 'pasteque', nom: 'Pastèque', v: [30, 0.6, 7, 6, 0.2, 0, 0.4, 0], g: 250, p: '1 tranche', fl: 100 },
  { id: 'rhubarbe', nom: 'Rhubarbe cuite', v: [31, 0.6, 4, 4, 0.2, 0, 2, 0], g: 150, p: '1 portion', fl: 100, rare: true },

  /* ── Fruits secs et séchés ── */
  { id: 'raisin-sec', nom: 'Raisins secs', v: [299, 3.1, 79, 59, 0.5, 0.1, 3.7, 0], g: 25, p: '1 poignée', fl: 100 },
  { id: 'abricot-sec', nom: 'Abricots secs', v: [241, 3.4, 53, 53, 0.5, 0, 7.3, 0], g: 30, p: '4 abricots', fl: 100 },
  { id: 'pruneau', nom: 'Pruneaux', v: [240, 2.2, 56, 38, 0.4, 0, 7, 0], g: 30, p: '4 pruneaux', fl: 100 },
  { id: 'datte', nom: 'Dattes', v: [282, 2.5, 63, 63, 0.4, 0, 8, 0], g: 30, p: '3 dattes', fl: 100 },
  { id: 'figue-seche', nom: 'Figues séchées', v: [249, 3.3, 48, 48, 0.9, 0.1, 9.8, 0], g: 30, p: '3 figues', fl: 100 },
  { id: 'banane-sechee', nom: 'Banane séchée', v: [346, 3.5, 78, 47, 1.2, 0.5, 6.5, 0], g: 25, p: '1 poignée', fl: 100, rare: true },
  { id: 'coco-rapee', nom: 'Noix de coco râpée', v: [604, 6.9, 7, 7, 62, 55, 15, 0], g: 10, p: '1 cuillère', fl: 100, rare: true },
  { id: 'melange-fruits-secs', nom: 'Mélange de fruits secs', v: [355, 6.5, 60, 50, 8, 2, 7, 0], g: 30, p: '1 poignée', fl: 100 },

  /* ── Fruits préparés ── */
  { id: 'compote', nom: 'Compote sans sucre ajouté', v: [45, 0.3, 10, 10, 0.1, 0, 1.4, 0], g: 100, p: '1 gourde', fl: 100 },
  { id: 'compote-sucree', nom: 'Compote sucrée', v: [82, 0.3, 19, 18, 0.1, 0, 1.2, 0], g: 100, p: '1 pot' , fl: 100 },
  { id: 'salade-fruits', nom: 'Salade de fruits frais', v: [56, 0.6, 12, 11, 0.2, 0, 1.8, 0], g: 150, p: '1 coupe', fl: 100 },
  { id: 'fruits-sirop', nom: 'Fruits au sirop égouttés', v: [72, 0.4, 17, 16, 0.1, 0, 1.1, 0], g: 120, p: '1 portion', fl: 80 },
  { id: 'confiture', nom: 'Confiture', v: [255, 0.4, 62, 60, 0.1, 0, 1, 0], g: 20, p: '1 cuillère', fl: 40 },
  { id: 'confiture-allegee', nom: 'Confiture allégée en sucres', v: [147, 0.4, 34, 33, 0.1, 0, 1.3, 0], g: 20, p: '1 cuillère', fl: 50 },
  { id: 'puree-fruits', nom: 'Purée de fruits à boire', v: [58, 0.4, 13, 12, 0.2, 0, 1.3, 0], g: 90, p: '1 gourde', fl: 100 },
  { id: 'pomme-chips', nom: 'Chips de pomme séchée', v: [349, 1.5, 82, 57, 1, 0.2, 9, 0], g: 20, p: '1 sachet', fl: 100, rare: true },
  { id: 'olive-verte', nom: 'Olives vertes', v: [145, 1, 1, 0.5, 15, 2, 3.3, 3.3], g: 30, p: '1 poignée', fl: 100 },
  { id: 'olive-noire', nom: 'Olives noires', v: [162, 1.2, 1, 0.5, 16, 2.3, 4.5, 3], g: 30, p: '1 poignée', fl: 100 },

  /* ── Compotes et coulis ── */
  { id: 'compote-pomme-banane', nom: 'Compote pomme-banane', v: [62, 0.4, 14, 13, 0.2, 0, 1.5, 0], g: 100, p: '1 gourde', fl: 100 },
  { id: 'compote-pomme-poire', nom: 'Compote pomme-poire', v: [50, 0.3, 11, 11, 0.1, 0, 1.6, 0], g: 100, p: '1 gourde', fl: 100 },
  { id: 'compote-pomme-fraise', nom: 'Compote pomme-fraise', v: [52, 0.3, 12, 11, 0.1, 0, 1.5, 0], g: 100, p: '1 gourde', fl: 100 },
  { id: 'compote-rhubarbe', nom: 'Compote de rhubarbe', v: [48, 0.6, 10, 10, 0.2, 0, 2, 0], g: 120, p: '1 portion', fl: 100 },
  { id: 'coulis-fruits-rouges', nom: 'Coulis de fruits rouges', v: [95, 0.6, 22, 21, 0.2, 0, 1.5, 0], g: 30, p: '2 cuillères', fl: 60 },
  { id: 'coulis-mangue', nom: 'Coulis de mangue', v: [90, 0.5, 21, 20, 0.2, 0, 1, 0], g: 30, p: '2 cuillères', fl: 60 },
  { id: 'marmelade', nom: 'Marmelade d’orange', v: [250, 0.3, 61, 59, 0.1, 0, 0.8, 0], g: 20, p: '1 cuillère', fl: 30 },
  { id: 'gelee-fruits', nom: 'Gelée de fruits', v: [260, 0.2, 64, 62, 0, 0, 0.3, 0], g: 20, p: '1 cuillère', fl: 30 },

  /* ── Fruits cuisinés ── */
  { id: 'poire-pochee', nom: 'Poire pochée', v: [85, 0.4, 20, 18, 0.1, 0, 2.8, 0], g: 150, p: '1 poire', fl: 90 },
  { id: 'ananas-roti', nom: 'Ananas rôti', v: [85, 0.5, 20, 18, 0.5, 0.2, 1.4, 0], g: 150, p: '1 portion', fl: 90 },
  { id: 'banane-flambee', nom: 'Banane flambée', v: [155, 1.1, 28, 20, 4, 2.4, 2.4, 0.1], g: 150, p: '1 banane', fl: 70 },
  { id: 'fraise-sucre', nom: 'Fraises au sucre', v: [62, 0.7, 14, 13, 0.3, 0, 1.9, 0], g: 150, p: '1 coupe', fl: 85 },
  { id: 'brochette-fruits', nom: 'Brochette de fruits', v: [55, 0.7, 12, 11, 0.2, 0, 1.6, 0], g: 150, p: '2 brochettes', fl: 100 },
  { id: 'salade-agrumes', nom: 'Salade d’agrumes', v: [48, 0.9, 10, 9, 0.2, 0, 2, 0], g: 150, p: '1 coupe', fl: 100 },
  { id: 'peche-sirop', nom: 'Pêches au sirop', v: [70, 0.5, 16, 15, 0.1, 0, 1, 0], g: 120, p: '2 oreillons', fl: 80 },
  { id: 'abricot-sirop', nom: 'Abricots au sirop', v: [72, 0.6, 17, 16, 0.1, 0, 1.2, 0], g: 120, p: '4 oreillons', fl: 80 },
  { id: 'ananas-sirop', nom: 'Ananas au sirop', v: [75, 0.4, 18, 17, 0.1, 0, 0.9, 0], g: 120, p: '2 tranches', fl: 80 },

  /* ── Fruits confits et exotiques ── */
  { id: 'fruit-confit', nom: 'Fruits confits', v: [320, 0.3, 79, 75, 0.2, 0, 1.5, 0], g: 25, p: '1 poignée', fl: 40 },
  { id: 'marron-glace', nom: 'Marrons glacés', v: [305, 1.5, 72, 60, 1, 0.2, 3, 0], g: 30, p: '1 marron' },
  { id: 'mangue-sechee', nom: 'Mangue séchée', v: [320, 2, 75, 65, 1, 0.3, 5, 0], g: 25, p: '1 poignée', fl: 100 },
  { id: 'goji', nom: 'Baies de goji', v: [340, 12, 60, 45, 1.5, 0.2, 13, 0.3], g: 20, p: '1 poignée', fl: 100, rare: true },
  { id: 'physalis', nom: 'Physalis', v: [53, 1.9, 8, 6, 0.7, 0, 3, 0], g: 60, p: '1 poignée', fl: 100, rare: true },
  { id: 'pitaya', nom: 'Fruit du dragon', v: [50, 1.1, 9, 8, 0.4, 0, 3, 0], g: 150, p: '1/2 fruit', fl: 100, rare: true },
  { id: 'carambole', nom: 'Carambole', v: [31, 1, 4, 4, 0.3, 0, 2.8, 0], g: 100, p: '1 carambole', fl: 100, rare: true },
  { id: 'kumquat', nom: 'Kumquats', v: [71, 1.9, 9, 9, 0.9, 0.1, 6.5, 0], g: 60, p: '5 kumquats', fl: 100, rare: true },
  { id: 'nefle', nom: 'Nèfles du Japon', v: [47, 0.4, 10, 9, 0.2, 0, 1.7, 0], g: 120, p: '1 portion', fl: 100, rare: true },
  { id: 'tamarin', nom: 'Tamarin', v: [239, 2.8, 57, 38, 0.6, 0.3, 5, 0], g: 20, p: '1 portion', fl: 100, rare: true },
]
