import type { Brut } from '../brut'

/**
 * Huiles, beurres, margarines, oléagineux et graines.
 *
 * Les huiles et les beurres portent `f: 'matiere-grasse'` : le Nutri-Score les
 * note à part, et pour cause — une huile d'olive jugée au barème général sortirait
 * en E, ce qui n'a aucun sens comparé à une friture qu'on note pareil.
 *
 * Les oléagineux, eux, restent en famille générale : ce sont des aliments, pas
 * des ingrédients de cuisson, et ils comptent dans les fruits et légumes.
 */
export const GRAS: Brut[] = [
  /* ── Huiles ── */
  { id: 'huile-olive', nom: 'Huile d’olive', f: 'matiere-grasse', v: [899, 0, 0, 0, 99.9, 14, 0, 0], g: 10, p: '1 cuillère à soupe' },
  { id: 'huile-colza', nom: 'Huile de colza', f: 'matiere-grasse', v: [899, 0, 0, 0, 99.9, 7.4, 0, 0], g: 10, p: '1 cuillère à soupe' },
  { id: 'huile-tournesol', nom: 'Huile de tournesol', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 11, 0, 0], g: 10, p: '1 cuillère à soupe' },
  { id: 'huile-noix', nom: 'Huile de noix', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 9, 0, 0], g: 10, p: '1 cuillère à soupe' },
  { id: 'huile-sesame', nom: 'Huile de sésame', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 15, 0, 0], g: 10, p: '1 cuillère à soupe' },
  { id: 'huile-arachide', nom: 'Huile d’arachide', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 19, 0, 0], g: 10, p: '1 cuillère à soupe' },
  { id: 'huile-coco', nom: 'Huile de coco', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 87, 0, 0], g: 10, p: '1 cuillère à soupe' },
  { id: 'huile-lin', nom: 'Huile de lin', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 9, 0, 0], g: 10, p: '1 cuillère à café', rare: true },
  { id: 'huile-friture', nom: 'Huile de friture', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 12, 0, 0], g: 10, p: '1 cuillère à soupe' },

  /* ── Beurres et margarines ── */
  { id: 'beurre', nom: 'Beurre', f: 'matiere-grasse', v: [744, 0.7, 0.6, 0.6, 82, 52, 0, 0.1], g: 10, p: '1 noisette' },
  { id: 'beurre-demi-sel', nom: 'Beurre demi-sel', f: 'matiere-grasse', v: [740, 0.7, 0.6, 0.6, 81, 51, 0, 1.5], g: 10, p: '1 noisette' },
  { id: 'beurre-allege', nom: 'Beurre allégé 60 %', f: 'matiere-grasse', v: [547, 0.5, 0.5, 0.5, 60, 39, 0, 0.4], g: 10, p: '1 noisette' },
  { id: 'beurre-allege-40', nom: 'Beurre allégé 40 %', f: 'matiere-grasse', v: [370, 1, 1, 1, 40, 26, 0, 0.5], g: 10, p: '1 noisette' },
  { id: 'margarine', nom: 'Margarine', f: 'matiere-grasse', v: [720, 0.2, 0.5, 0.5, 80, 22, 0, 0.8], g: 10, p: '1 noisette' },
  { id: 'margarine-allegee', nom: 'Margarine allégée', f: 'matiere-grasse', v: [380, 0.2, 1, 1, 40, 11, 0, 0.9], g: 10, p: '1 noisette' },
  { id: 'saindoux', nom: 'Saindoux', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 40, 0, 0], g: 10, p: '1 cuillère', rare: true },
  { id: 'graisse-canard', nom: 'Graisse de canard', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 33, 0, 0], g: 10, p: '1 cuillère' },

  /* ── Avocat ── */
  { id: 'avocat', nom: 'Avocat', v: [169, 1.8, 1.8, 0.7, 16, 3.3, 5.1, 0], g: 100, p: '1/2 avocat', fl: 100 },

  /* ── Fruits à coque ── */
  { id: 'amande', nom: 'Amandes', v: [634, 21, 5.5, 4, 53, 4.2, 12, 0], g: 25, p: '1 poignée', fl: 100 },
  { id: 'noix', nom: 'Noix', v: [698, 15, 4.5, 2.6, 67, 6.3, 6.1, 0], g: 25, p: '1 poignée', fl: 100 },
  { id: 'noisette', nom: 'Noisettes', v: [660, 14, 7, 4.3, 62, 4.5, 9, 0], g: 25, p: '1 poignée', fl: 100 },
  { id: 'noix-cajou', nom: 'Noix de cajou', v: [590, 18, 26, 6, 45, 8, 3, 0], g: 25, p: '1 poignée', fl: 100 },
  { id: 'pistache', nom: 'Pistaches', v: [590, 20, 17, 7, 48, 6, 9, 0.5], g: 25, p: '1 poignée', fl: 100 },
  { id: 'cacahuete', nom: 'Cacahuètes', v: [600, 25, 8, 4, 50, 8, 8, 0.5], g: 25, p: '1 poignée', fl: 100, syn: ['arachide'] },
  { id: 'noix-pecan', nom: 'Noix de pécan', v: [700, 9, 4, 4, 72, 6, 9.6, 0], g: 25, p: '1 poignée', fl: 100, rare: true },
  { id: 'noix-bresil', nom: 'Noix du Brésil', v: [680, 14, 4, 2, 66, 15, 8, 0], g: 20, p: '1 poignée', fl: 100, rare: true },
  { id: 'noix-macadamia', nom: 'Noix de macadamia', v: [720, 8, 5, 4, 75, 12, 8, 0], g: 20, p: '1 poignée', fl: 100, rare: true },
  { id: 'pignon', nom: 'Pignons de pin', v: [670, 14, 4, 4, 68, 5, 4, 0], g: 15, p: '1 cuillère', fl: 100 },
  { id: 'melange-oleagineux', nom: 'Mélange d’oléagineux', v: [620, 18, 12, 5, 53, 7, 8, 0.2], g: 30, p: '1 poignée', fl: 100 },
  { id: 'cacahuete-grillee-salee', nom: 'Cacahuètes grillées salées', v: [615, 24, 9, 4, 51, 9, 8, 1.5], g: 30, p: '1 poignée', fl: 100 },

  /* ── Graines ── */
  { id: 'graine-courge', nom: 'Graines de courge', v: [560, 25, 10, 1.5, 45, 8, 6, 0], g: 20, p: '1 poignée', fl: 100 },
  { id: 'graine-tournesol', nom: 'Graines de tournesol', v: [580, 21, 11, 2.6, 50, 4.5, 9, 0], g: 20, p: '1 poignée', fl: 100 },
  { id: 'graine-sesame', nom: 'Graines de sésame', v: [570, 18, 10, 0.3, 50, 7, 11, 0], g: 10, p: '1 cuillère', fl: 100 },
  { id: 'graine-lin', nom: 'Graines de lin', v: [530, 18, 2, 1.5, 42, 4, 27, 0], g: 10, p: '1 cuillère', fl: 100 },
  { id: 'graine-chia', nom: 'Graines de chia', v: [490, 17, 4, 1, 31, 3.3, 34, 0], g: 15, p: '1 cuillère', fl: 100 },
  { id: 'graine-pavot', nom: 'Graines de pavot', v: [530, 18, 8, 3, 42, 4.5, 20, 0], g: 5, p: '1 cuillère', fl: 100, rare: true },

  /* ── Purées d'oléagineux ── */
  { id: 'puree-amande', nom: 'Purée d’amande', v: [620, 21, 7, 4, 56, 4.5, 10, 0], g: 15, p: '1 cuillère', fl: 100 },
  { id: 'beurre-cacahuete', nom: 'Beurre de cacahuète', v: [600, 25, 12, 6, 50, 9, 6, 0.9], g: 15, p: '1 cuillère', fl: 90 },
  { id: 'tahini', nom: 'Tahini', v: [600, 17, 10, 0.5, 54, 8, 9, 0], g: 15, p: '1 cuillère', fl: 100, syn: ['purée de sésame'] },
  { id: 'pate-noisette-cacao', nom: 'Pâte à tartiner chocolat-noisette', v: [539, 6, 57, 56, 31, 11, 3.5, 0.1], g: 20, p: '1 cuillère' },

  /* ── Compléments ── */
  { id: 'huile-pepin-raisin', nom: 'Huile de pépins de raisin', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 10, 0, 0], g: 10, p: '1 cuillère à soupe' },
  { id: 'huile-avocat', nom: 'Huile d’avocat', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 12, 0, 0], g: 10, p: '1 cuillère à soupe', rare: true },
  { id: 'huile-noisette', nom: 'Huile de noisette', f: 'matiere-grasse', v: [900, 0, 0, 0, 100, 8, 0, 0], g: 10, p: '1 cuillère à soupe', rare: true },
  { id: 'beurre-clarifie', nom: 'Beurre clarifié', f: 'matiere-grasse', v: [890, 0.2, 0, 0, 99, 62, 0, 0], g: 10, p: '1 cuillère', rare: true },
  { id: 'margarine-vegetale', nom: 'Margarine végétale', f: 'matiere-grasse', v: [700, 0.2, 0.5, 0.5, 78, 20, 0, 0.7], g: 10, p: '1 noisette' },
  { id: 'spray-cuisson', nom: 'Spray de cuisson', f: 'matiere-grasse', v: [800, 0, 0, 0, 89, 10, 0, 0], g: 1, p: '1 pression' },
  { id: 'avocat-entier', nom: 'Avocat entier', v: [169, 1.8, 1.8, 0.7, 16, 3.3, 5.1, 0], g: 200, p: '1 avocat', fl: 100 },
  { id: 'amande-effilee', nom: 'Amandes effilées', v: [625, 21, 6, 4, 52, 4.1, 11, 0], g: 15, p: '1 cuillère', fl: 100 },
  { id: 'noisette-concassee', nom: 'Noisettes concassées', v: [655, 14, 7, 4.3, 61, 4.4, 9, 0], g: 15, p: '1 cuillère', fl: 100 },
  { id: 'noix-coco-lamelle', nom: 'Copeaux de noix de coco', v: [600, 6.5, 8, 7, 61, 54, 15, 0], g: 10, p: '1 cuillère', fl: 100, rare: true },
  { id: 'graine-chanvre', nom: 'Graines de chanvre', v: [560, 32, 3, 1.5, 46, 4.6, 4, 0], g: 15, p: '1 cuillère', fl: 100, rare: true },
  { id: 'graine-germee', nom: 'Graines germées', v: [45, 4, 4, 1, 1, 0.2, 2.5, 0], g: 30, p: '1 portion', fl: 100 },
  { id: 'puree-noisette', nom: 'Purée de noisette', v: [650, 15, 7, 4, 62, 4.5, 9, 0], g: 15, p: '1 cuillère', fl: 100 },
  { id: 'puree-cacahuete', nom: 'Purée de cacahuète sans sucre', v: [590, 27, 8, 4, 49, 8.5, 8, 0.1], g: 15, p: '1 cuillère', fl: 100 },
  { id: 'noix-melange-sale', nom: 'Mélange apéritif salé', v: [590, 20, 15, 5, 48, 8, 7, 1.6], g: 30, p: '1 poignée', fl: 90 },
]
