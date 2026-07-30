import type { Brut } from '../brut'

/**
 * Viandes, volailles, abats, charcuterie, œufs et substituts végétaux.
 *
 * Les viandes sont données **cuites sans matière grasse ajoutée** : c'est l'état
 * dans lequel on les mange, et la poêle se note à part. Le morceau compte autant
 * que l'animal — un rumsteck et une entrecôte, c'est le même bœuf et le simple au
 * triple de lipides.
 */
export const VIANDES: Brut[] = [
  /* ── Volaille ── */
  { id: 'poulet', nom: 'Blanc de poulet', v: [121, 26, 0, 0, 1.8, 0.5, 0, 0.2], g: 130, p: '1 filet' },
  { id: 'poulet-cuisse', nom: 'Cuisse de poulet', v: [175, 25, 0, 0, 8.5, 2.5, 0, 0.2], g: 150, p: '1 cuisse' },
  { id: 'poulet-roti', nom: 'Poulet rôti avec la peau', v: [200, 27, 0, 0, 10, 3, 0, 0.3], g: 150, p: '1 portion' },
  { id: 'poulet-aile', nom: 'Ailes de poulet', v: [220, 25, 0, 0, 13, 3.5, 0, 0.3], g: 120, p: '3 ailes' },
  { id: 'dinde', nom: 'Escalope de dinde', v: [111, 24, 0, 0, 1.3, 0.4, 0, 0.2], g: 120, p: '1 escalope' },
  { id: 'dinde-cuisse', nom: 'Cuisse de dinde', v: [160, 26, 0, 0, 6, 2, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'pintade', nom: 'Pintade', v: [150, 26, 0, 0, 5, 1.5, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'canard-magret', nom: 'Magret de canard', v: [200, 28, 0, 0, 10, 3.5, 0, 0.2], g: 150, p: '1/2 magret' },
  { id: 'canard-confit', nom: 'Confit de canard', v: [280, 25, 0, 0, 20, 7, 0, 1.2], g: 150, p: '1 cuisse' },
  { id: 'lapin', nom: 'Lapin', v: [165, 28, 0, 0, 6, 2, 0, 0.1], g: 150, p: '1 portion' },
  { id: 'nugget', nom: 'Nuggets de poulet', v: [260, 14, 17, 1, 15, 2, 1, 1.2], g: 120, p: '6 nuggets' },
  { id: 'cordon-bleu', nom: 'Cordon bleu', v: [240, 16, 14, 1.5, 13, 4, 0.8, 1.3], g: 120, p: '1 cordon bleu' },
  { id: 'poulet-pane', nom: 'Escalope panée', v: [235, 18, 15, 1, 12, 2.5, 1, 1.1], g: 130, p: '1 escalope' },

  /* ── Bœuf ── */
  { id: 'boeuf-hache-5', nom: 'Steak haché 5 %', v: [136, 21, 0, 0, 5, 2.3, 0, 0.2], g: 125, p: '1 steak' },
  { id: 'boeuf-hache-15', nom: 'Steak haché 15 %', v: [219, 19, 0, 0, 15, 6.5, 0, 0.2], g: 125, p: '1 steak' },
  { id: 'boeuf-hache-20', nom: 'Steak haché 20 %', v: [250, 18, 0, 0, 20, 8, 0, 0.2], g: 125, p: '1 steak' },
  { id: 'bavette', nom: 'Bavette de bœuf', v: [180, 26, 0, 0, 8, 3.5, 0, 0.2], g: 130, p: '1 portion' },
  { id: 'rumsteck', nom: 'Rumsteck', v: [165, 29, 0, 0, 5, 2, 0, 0.2], g: 130, p: '1 portion' },
  { id: 'faux-filet', nom: 'Faux-filet', v: [210, 27, 0, 0, 11, 5, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'entrecote', nom: 'Entrecôte', v: [250, 26, 0, 0, 16, 7, 0, 0.2], g: 180, p: '1 entrecôte' },
  { id: 'cote-boeuf', nom: 'Côte de bœuf', v: [280, 25, 0, 0, 20, 9, 0, 0.2], g: 200, p: '1 portion' },
  { id: 'filet-boeuf', nom: 'Filet de bœuf', v: [175, 28, 0, 0, 7, 3, 0, 0.2], g: 150, p: '1 tournedos' },
  { id: 'roti-boeuf', nom: 'Rôti de bœuf', v: [160, 28, 0, 0, 5, 2, 0, 0.2], g: 130, p: '2 tranches' },
  { id: 'boeuf-bourguignon-viande', nom: 'Bœuf à braiser', v: [190, 28, 0, 0, 8.5, 3.5, 0, 0.2], g: 150, p: '1 portion', syn: ['paleron', 'gîte', 'macreuse'] },
  { id: 'tartare-boeuf', nom: 'Tartare de bœuf', v: [145, 21, 1, 0.5, 6, 2.5, 0, 0.6], g: 150, p: '1 tartare' },
  { id: 'carpaccio', nom: 'Carpaccio de bœuf', v: [160, 22, 0.5, 0, 8, 3.5, 0, 0.8], g: 120, p: '1 portion' },
  { id: 'viande-hachee-cuisinee', nom: 'Viande hachée cuisinée', v: [175, 17, 4, 2, 10, 4, 0.8, 0.7], g: 150, p: '1 portion' },

  /* ── Veau ── */
  { id: 'veau-escalope', nom: 'Escalope de veau', v: [155, 28, 0, 0, 4.5, 1.5, 0, 0.2], g: 130, p: '1 escalope' },
  { id: 'veau-cote', nom: 'Côte de veau', v: [190, 26, 0, 0, 9, 3.5, 0, 0.2], g: 180, p: '1 côte' },
  { id: 'veau-blanquette', nom: 'Veau à blanquette', v: [170, 26, 0, 0, 7, 3, 0, 0.2], g: 150, p: '1 portion' },

  /* ── Porc ── */
  { id: 'porc-filet-mignon', nom: 'Filet mignon de porc', v: [143, 26, 0, 0, 4, 1.4, 0, 0.2], g: 130, p: '1 portion' },
  { id: 'porc-cote', nom: 'Côte de porc', v: [200, 26, 0, 0, 11, 4, 0, 0.2], g: 150, p: '1 côte' },
  { id: 'porc-roti', nom: 'Rôti de porc', v: [175, 28, 0, 0, 7, 2.5, 0, 0.2], g: 130, p: '2 tranches' },
  { id: 'porc-echine', nom: 'Échine de porc', v: [230, 25, 0, 0, 15, 5.5, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'porc-travers', nom: 'Travers de porc', v: [290, 22, 1, 1, 22, 8, 0, 0.8], g: 200, p: '1 portion' },
  { id: 'lardon', nom: 'Lardons', v: [280, 17, 0.5, 0.5, 23, 9, 0, 2.2], g: 50, p: '1 poignée' },
  { id: 'lardon-fume', nom: 'Lardons fumés', v: [290, 17, 0.5, 0.5, 24, 9.5, 0, 2.5], g: 50, p: '1 poignée' },
  { id: 'poitrine-fumee', nom: 'Poitrine fumée', v: [300, 16, 0.5, 0.5, 26, 10, 0, 2.6], g: 50, p: '2 tranches' },

  /* ── Agneau et gibier ── */
  { id: 'agneau-cotelette', nom: 'Côtelettes d’agneau', v: [250, 25, 0, 0, 17, 8, 0, 0.2], g: 150, p: '2 côtelettes' },
  { id: 'agneau-gigot', nom: 'Gigot d’agneau', v: [200, 28, 0, 0, 10, 4.5, 0, 0.2], g: 150, p: '1 tranche' },
  { id: 'agneau-epaule', nom: 'Épaule d’agneau', v: [240, 25, 0, 0, 16, 7, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'chevreuil', nom: 'Chevreuil', v: [130, 26, 0, 0, 3, 1.2, 0, 0.2], g: 150, p: '1 portion', rare: true },
  { id: 'sanglier', nom: 'Sanglier', v: [160, 28, 0, 0, 5, 1.8, 0, 0.2], g: 150, p: '1 portion', rare: true },

  /* ── Abats ── */
  { id: 'foie-volaille', nom: 'Foies de volaille', v: [150, 24, 1, 0, 5, 1.5, 0, 0.2], g: 100, p: '1 portion' },
  { id: 'foie-veau', nom: 'Foie de veau', v: [140, 20, 2, 0, 5, 1.7, 0, 0.2], g: 130, p: '1 tranche' },
  { id: 'rognon', nom: 'Rognons', v: [130, 22, 1, 0, 4, 1.4, 0, 0.3], g: 130, p: '1 portion', rare: true },
  { id: 'boudin-noir', nom: 'Boudin noir', v: [380, 13, 2, 1, 35, 14, 0, 1.5], g: 120, p: '1 boudin' },
  { id: 'boudin-blanc', nom: 'Boudin blanc', v: [300, 12, 6, 2, 25, 9, 0, 1.5], g: 120, p: '1 boudin' },
  { id: 'andouillette', nom: 'Andouillette', v: [250, 17, 1, 0.5, 20, 7, 0, 1.8], g: 130, p: '1 andouillette' },
  { id: 'foie-gras', nom: 'Foie gras', v: [460, 8, 4, 3, 45, 17, 0, 1.2], g: 40, p: '1 tranche' },

  /* ── Charcuterie ── */
  { id: 'jambon-blanc', nom: 'Jambon blanc', v: [113, 19, 1, 0.8, 3.5, 1.2, 0, 2.2], g: 40, p: '1 tranche' },
  { id: 'jambon-degraisse', nom: 'Jambon découenné dégraissé', v: [105, 21, 0.8, 0.5, 2, 0.7, 0, 2.1], g: 40, p: '1 tranche' },
  { id: 'jambon-cru', nom: 'Jambon cru', v: [240, 27, 0.5, 0.5, 14, 5, 0, 5], g: 30, p: '2 tranches' },
  { id: 'jambon-fume', nom: 'Jambon fumé', v: [180, 24, 1, 1, 9, 3.2, 0, 3.5], g: 40, p: '1 tranche' },
  { id: 'blanc-poulet-tranche', nom: 'Blanc de poulet en tranches', v: [105, 19, 1.5, 1, 2.5, 0.8, 0, 2], g: 40, p: '2 tranches' },
  { id: 'bacon', nom: 'Bacon', v: [220, 22, 0.5, 0.5, 14, 5, 0, 3], g: 30, p: '2 tranches' },
  { id: 'saucisson-sec', nom: 'Saucisson sec', v: [410, 25, 2, 1, 34, 13, 0, 4.8], g: 30, p: '5 rondelles' },
  { id: 'chorizo', nom: 'Chorizo', v: [450, 24, 2, 1, 38, 14, 0, 4.5], g: 30, p: '5 rondelles' },
  { id: 'mortadelle', nom: 'Mortadelle', v: [310, 13, 2, 1, 28, 10, 0, 2.3], g: 40, p: '2 tranches' },
  { id: 'pate-campagne', nom: 'Pâté de campagne', v: [330, 14, 2, 1, 29, 11, 0, 1.8], g: 40, p: '1 portion' },
  { id: 'rillettes', nom: 'Rillettes', v: [400, 15, 0.5, 0.5, 38, 15, 0, 1.7], g: 40, p: '1 portion' },
  { id: 'saucisse-toulouse', nom: 'Saucisse de Toulouse', v: [290, 17, 1, 0.5, 24, 9, 0, 1.6], g: 120, p: '1 saucisse' },
  { id: 'merguez', nom: 'Merguez', v: [300, 16, 1, 0.5, 26, 10, 0, 1.8], g: 100, p: '2 merguez' },
  { id: 'chipolata', nom: 'Chipolata', v: [290, 15, 1.5, 0.8, 25, 9.5, 0, 1.7], g: 100, p: '2 chipolatas' },
  { id: 'saucisse-strasbourg', nom: 'Saucisse de Strasbourg', v: [270, 12, 2, 1, 24, 9, 0, 2], g: 70, p: '2 saucisses', syn: ['knacki'] },
  { id: 'saucisse-fumee', nom: 'Saucisse fumée', v: [280, 15, 2, 1, 24, 9, 0, 2.2], g: 100, p: '1 saucisse' },

  /* ── Œufs ── */
  { id: 'oeuf', nom: 'Œuf', v: [143, 12.6, 0.7, 0.4, 9.5, 3.1, 0, 0.4], g: 60, p: '1 œuf' },
  { id: 'oeuf-dur', nom: 'Œuf dur', v: [145, 13, 0.7, 0.4, 10, 3.1, 0, 0.4], g: 60, p: '1 œuf' },
  { id: 'oeuf-plat', nom: 'Œuf au plat', v: [190, 13, 0.5, 0.4, 15, 4, 0, 0.5], g: 60, p: '1 œuf' },
  { id: 'oeuf-poche', nom: 'Œuf poché', v: [145, 13, 0.7, 0.4, 10, 3.1, 0, 0.4], g: 60, p: '1 œuf', syn: ['œuf mollet'] },
  { id: 'omelette', nom: 'Omelette nature', v: [175, 13, 0.6, 0.5, 13.5, 4, 0, 0.6], g: 150, p: '1 omelette' },
  { id: 'oeufs-brouilles', nom: 'Œufs brouillés', v: [165, 11, 1, 1, 13, 5, 0, 0.6], g: 150, p: '1 portion' },
  { id: 'blanc-oeuf', nom: 'Blanc d’œuf', v: [48, 11, 0.7, 0.7, 0, 0, 0, 0.4], g: 33, p: '1 blanc' },
  { id: 'jaune-oeuf', nom: 'Jaune d’œuf', v: [340, 16, 0.6, 0.6, 30, 9, 0, 0.2], g: 17, p: '1 jaune' },
  { id: 'oeuf-caille', nom: 'Œufs de caille', v: [158, 13, 0.4, 0.4, 11, 3.6, 0, 0.3], g: 30, p: '3 œufs', rare: true },

  /* ── Substituts végétaux ── */
  { id: 'tofu', nom: 'Tofu nature', v: [121, 12, 1.5, 0.6, 7, 1.1, 1.2, 0], g: 120, p: '1 portion' },
  { id: 'tofu-fume', nom: 'Tofu fumé', v: [145, 16, 2, 0.6, 8, 1.3, 1, 1], g: 120, p: '1 portion' },
  { id: 'tofu-soyeux', nom: 'Tofu soyeux', v: [55, 6, 1.5, 0.6, 3, 0.5, 0.3, 0], g: 120, p: '1 portion' },
  { id: 'tempeh', nom: 'Tempeh', v: [190, 19, 9, 1, 11, 2.2, 6, 0], g: 120, p: '1 portion', rare: true },
  { id: 'seitan', nom: 'Seitan', v: [140, 25, 6, 0.5, 2, 0.4, 1, 1], g: 120, p: '1 portion', rare: true },
  { id: 'steak-vegetal', nom: 'Steak végétal', v: [190, 17, 8, 1, 10, 1.5, 4, 1.1], g: 100, p: '1 steak' },
  { id: 'galette-vegetale', nom: 'Galette de légumes et céréales', v: [200, 6, 22, 2, 9, 1.2, 4, 0.9], g: 100, p: '1 galette' },
  { id: 'proteine-soja', nom: 'Protéines de soja texturées', v: [340, 50, 12, 6, 2, 0.4, 18, 0.1], g: 30, p: '1 portion', rare: true },

  /* ── Morceaux et préparations complémentaires ── */
  { id: 'poulet-brochette', nom: 'Brochettes de poulet', v: [150, 25, 2, 1.5, 5, 1.2, 0.3, 0.8], g: 150, p: '2 brochettes' },
  { id: 'poulet-emince', nom: 'Émincé de poulet', v: [125, 25, 0.5, 0.5, 2.5, 0.7, 0, 0.3], g: 130, p: '1 portion' },
  { id: 'poulet-marine', nom: 'Poulet mariné', v: [155, 23, 3, 2, 5.5, 1.2, 0.3, 1.1], g: 150, p: '1 portion' },
  { id: 'poulet-froid', nom: 'Blanc de poulet froid', v: [118, 26, 0, 0, 1.5, 0.4, 0, 0.3], g: 100, p: '1 portion' },
  { id: 'dinde-hachee', nom: 'Viande hachée de dinde', v: [130, 22, 0, 0, 4.5, 1.3, 0, 0.2], g: 125, p: '1 steak' },
  { id: 'canard-aiguillette', nom: 'Aiguillettes de canard', v: [155, 26, 0, 0, 5.5, 1.8, 0, 0.2], g: 130, p: '1 portion' },
  { id: 'oie', nom: 'Oie', v: [240, 25, 0, 0, 15, 5, 0, 0.2], g: 150, p: '1 portion', rare: true },
  { id: 'caille', nom: 'Caille', v: [175, 25, 0, 0, 8, 2.3, 0, 0.2], g: 130, p: '1 caille', rare: true },
  { id: 'boeuf-onglet', nom: 'Onglet de bœuf', v: [190, 27, 0, 0, 9, 3.8, 0, 0.2], g: 130, p: '1 portion' },
  { id: 'boeuf-hampe', nom: 'Hampe de bœuf', v: [195, 26, 0, 0, 10, 4, 0, 0.2], g: 130, p: '1 portion', rare: true },
  { id: 'boeuf-joue', nom: 'Joue de bœuf', v: [175, 27, 0, 0, 7.5, 3.2, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'boeuf-plat-cotes', nom: 'Plat de côtes', v: [230, 24, 0, 0, 15, 6.5, 0, 0.2], g: 180, p: '1 portion' },
  { id: 'pot-au-feu-viande', nom: 'Viande de pot-au-feu', v: [170, 27, 0, 0, 7, 3, 0, 0.3], g: 150, p: '1 portion' },
  { id: 'veau-roti', nom: 'Rôti de veau', v: [160, 29, 0, 0, 5, 1.8, 0, 0.2], g: 130, p: '2 tranches' },
  { id: 'veau-jarret', nom: 'Jarret de veau', v: [165, 28, 0, 0, 6, 2.2, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'porc-saute', nom: 'Sauté de porc', v: [180, 26, 0, 0, 8.5, 3, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'porc-jarret', nom: 'Jambonneau', v: [220, 24, 0, 0, 14, 5, 0, 1.5], g: 180, p: '1 portion' },
  { id: 'agneau-souris', nom: 'Souris d’agneau', v: [215, 27, 0, 0, 12, 5.5, 0, 0.2], g: 180, p: '1 souris' },
  { id: 'agneau-collier', nom: 'Collier d’agneau', v: [235, 24, 0, 0, 15, 7, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'tete-veau', nom: 'Tête de veau', v: [225, 18, 0, 0, 17, 7, 0, 0.5], g: 200, p: '1 portion', rare: true },
  { id: 'gesier', nom: 'Gésiers confits', v: [230, 26, 0, 0, 14, 5, 0, 1.2], g: 80, p: '1 portion', rare: true },
  { id: 'terrine-campagne', nom: 'Terrine de campagne', v: [300, 15, 2, 1, 26, 10, 0.3, 1.7], g: 40, p: '1 tranche' },
  { id: 'jambon-persille', nom: 'Jambon persillé', v: [190, 22, 1, 0.5, 11, 4, 0.2, 2.5], g: 60, p: '1 tranche', rare: true },
  { id: 'saucisse-morteau', nom: 'Saucisse de Morteau', v: [310, 17, 1, 0.5, 27, 10, 0, 2.2], g: 120, p: '1 portion' },
  { id: 'saucisse-montbeliard', nom: 'Saucisse de Montbéliard', v: [300, 17, 1, 0.5, 26, 9.5, 0, 2.1], g: 100, p: '1 saucisse' },
  { id: 'cervelas', nom: 'Cervelas', v: [280, 13, 2, 1, 25, 9.5, 0, 2.1], g: 100, p: '1 cervelas' },
  { id: 'coppa', nom: 'Coppa', v: [370, 26, 1, 1, 29, 11, 0, 4.2], g: 30, p: '4 tranches' },
  { id: 'bresaola', nom: 'Viande des Grisons', v: [175, 34, 1, 1, 4, 1.5, 0, 4.5], g: 30, p: '4 tranches' },
  { id: 'omelette-fromage', nom: 'Omelette au fromage', v: [215, 15, 1, 1, 17, 7, 0, 0.9], g: 150, p: '1 omelette' },
  { id: 'omelette-champignon', nom: 'Omelette aux champignons', v: [155, 12, 1.5, 1, 11, 3.5, 0.6, 0.7], g: 180, p: '1 omelette' },
  { id: 'oeuf-cocotte', nom: 'Œuf cocotte', v: [180, 10, 2, 1.5, 14, 7, 0, 0.6], g: 100, p: '1 ramequin' },
]
