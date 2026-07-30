import type { Brut } from '../brut'

/**
 * Poissons, coquillages, crustacés et produits de la mer.
 *
 * Les conserves sont données **égouttées** — c'est ce qui arrive dans l'assiette,
 * et l'huile de la boîte fait le double des calories du thon qu'elle contient.
 * Le sel des fumaisons et des conserves est celui du produit, pas celui du
 * poisson frais : c'est souvent lui qui fait toute la différence de note.
 */
export const POISSONS: Brut[] = [
  /* ── Poissons blancs ── */
  { id: 'cabillaud', nom: 'Cabillaud', v: [82, 18, 0, 0, 0.7, 0.1, 0, 0.2], g: 130, p: '1 filet', syn: ['morue fraîche'] },
  { id: 'colin', nom: 'Colin', v: [85, 18, 0, 0, 1, 0.2, 0, 0.2], g: 130, p: '1 filet', syn: ['lieu'] },
  { id: 'merlan', nom: 'Merlan', v: [90, 18, 0, 0, 1.5, 0.3, 0, 0.2], g: 130, p: '1 filet' },
  { id: 'sole', nom: 'Sole', v: [85, 18, 0, 0, 1.2, 0.3, 0, 0.3], g: 150, p: '1 sole' },
  { id: 'limande', nom: 'Limande', v: [83, 18, 0, 0, 1, 0.2, 0, 0.3], g: 130, p: '1 filet' },
  { id: 'lotte', nom: 'Lotte', v: [85, 18, 0, 0, 1, 0.2, 0, 0.3], g: 150, p: '1 portion' },
  { id: 'raie', nom: 'Aile de raie', v: [90, 20, 0, 0, 1, 0.2, 0, 0.3], g: 150, p: '1 aile' },
  { id: 'sandre', nom: 'Sandre', v: [90, 19, 0, 0, 1, 0.2, 0, 0.1], g: 130, p: '1 filet' },
  { id: 'dorade', nom: 'Dorade', v: [110, 20, 0, 0, 3.5, 1, 0, 0.2], g: 150, p: '1 portion' },
  { id: 'bar', nom: 'Bar', v: [120, 21, 0, 0, 4, 1, 0, 0.2], g: 150, p: '1 portion', syn: ['loup de mer'] },
  { id: 'rouget', nom: 'Rouget', v: [120, 19, 0, 0, 5, 1.2, 0, 0.2], g: 130, p: '2 filets' },
  { id: 'turbot', nom: 'Turbot', v: [95, 18, 0, 0, 2.5, 0.6, 0, 0.2], g: 150, p: '1 portion', rare: true },
  { id: 'fletan', nom: 'Flétan', v: [110, 20, 0, 0, 3, 0.5, 0, 0.2], g: 150, p: '1 pavé', rare: true },
  { id: 'eglefin', nom: 'Églefin', v: [88, 20, 0, 0, 0.7, 0.1, 0, 0.3], g: 130, p: '1 filet' },
  { id: 'haddock', nom: 'Haddock fumé', v: [115, 24, 0, 0, 1, 0.2, 0, 3], g: 130, p: '1 filet' },
  { id: 'morue-dessalee', nom: 'Morue dessalée', v: [105, 23, 0, 0, 1, 0.2, 0, 1.5], g: 130, p: '1 portion' },

  /* ── Poissons gras ── */
  { id: 'saumon', nom: 'Saumon', v: [203, 20, 0, 0, 13, 3, 0, 0.1], g: 130, p: '1 pavé' },
  { id: 'saumon-fume', nom: 'Saumon fumé', v: [180, 22, 0.5, 0.5, 10, 2, 0, 3.5], g: 60, p: '2 tranches' },
  { id: 'truite', nom: 'Truite', v: [140, 20, 0, 0, 6.5, 1.5, 0, 0.1], g: 150, p: '1 truite' },
  { id: 'truite-fumee', nom: 'Truite fumée', v: [165, 22, 0.5, 0.5, 8, 1.8, 0, 2.8], g: 60, p: '2 tranches' },
  { id: 'maquereau', nom: 'Maquereau', v: [205, 19, 0, 0, 14, 3.5, 0, 0.2], g: 130, p: '1 filet' },
  { id: 'maquereau-vin-blanc', nom: 'Maquereaux au vin blanc', v: [190, 17, 2, 1, 13, 3, 0, 1.2], g: 100, p: '1 boîte' },
  { id: 'sardine', nom: 'Sardines fraîches', v: [208, 25, 0, 0, 11, 3, 0, 0.2], g: 130, p: '3 sardines' },
  { id: 'sardine-huile', nom: 'Sardines à l’huile', v: [220, 24, 0, 0, 14, 3, 0, 1.2], g: 90, p: '1 boîte' },
  { id: 'sardine-tomate', nom: 'Sardines à la tomate', v: [180, 20, 2, 1.5, 10, 2.5, 0.3, 1], g: 90, p: '1 boîte' },
  { id: 'hareng-fume', nom: 'Hareng fumé', v: [220, 20, 0, 0, 15, 3.5, 0, 2.5], g: 100, p: '1 filet' },
  { id: 'anchois', nom: 'Anchois à l’huile', v: [210, 26, 0, 0, 12, 3, 0, 8], g: 20, p: '4 filets' },
  { id: 'thon-naturel', nom: 'Thon au naturel', v: [116, 26, 0, 0, 1, 0.3, 0, 0.9], g: 100, p: '1 boîte' },
  { id: 'thon-huile', nom: 'Thon à l’huile égoutté', v: [190, 25, 0, 0, 10, 1.8, 0, 0.9], g: 100, p: '1 boîte' },
  { id: 'thon-frais', nom: 'Thon frais', v: [145, 25, 0, 0, 5, 1.3, 0, 0.1], g: 130, p: '1 pavé' },
  { id: 'espadon', nom: 'Espadon', v: [140, 22, 0, 0, 5.5, 1.5, 0, 0.2], g: 150, p: '1 pavé', rare: true },

  /* ── Crustacés ── */
  { id: 'crevette', nom: 'Crevettes', v: [99, 21, 0.2, 0, 1.4, 0.3, 0, 1.2], g: 100, p: '1 portion' },
  { id: 'gambas', nom: 'Gambas', v: [95, 20, 0, 0, 1.2, 0.3, 0, 0.9], g: 120, p: '5 gambas' },
  { id: 'langoustine', nom: 'Langoustines', v: [90, 19, 0, 0, 1, 0.2, 0, 0.9], g: 120, p: '5 langoustines' },
  { id: 'crabe', nom: 'Crabe', v: [90, 18, 0.5, 0, 1.2, 0.2, 0, 1.5], g: 100, p: '1 portion', syn: ['tourteau'] },
  { id: 'homard', nom: 'Homard', v: [95, 20, 0.5, 0, 1, 0.2, 0, 1.3], g: 150, p: '1/2 homard', rare: true },
  { id: 'ecrevisse', nom: 'Écrevisses', v: [80, 16, 0.5, 0, 1, 0.2, 0, 0.7], g: 100, p: '1 portion', rare: true },

  /* ── Coquillages et céphalopodes ── */
  { id: 'moule', nom: 'Moules cuites', v: [105, 18, 4, 0, 2.5, 0.5, 0, 0.6], g: 200, p: '1 portion' },
  { id: 'moule-mariniere', nom: 'Moules marinières', v: [90, 12, 3, 0.5, 3, 1.2, 0.2, 0.8], g: 400, p: '1 grosse portion' },
  { id: 'huitre', nom: 'Huîtres', v: [65, 9, 4, 0, 1.5, 0.4, 0, 1.5], g: 100, p: '6 huîtres' },
  { id: 'saint-jacques', nom: 'Noix de Saint-Jacques', v: [90, 17, 3, 0, 0.8, 0.2, 0, 0.6], g: 120, p: '5 noix' },
  { id: 'palourde', nom: 'Palourdes', v: [75, 13, 2.5, 0, 1, 0.2, 0, 1.2], g: 150, p: '1 portion', syn: ['coques'] },
  { id: 'bulot', nom: 'Bulots', v: [130, 25, 2, 0, 1, 0.2, 0, 1.5], g: 100, p: '1 portion', rare: true },
  { id: 'calamar', nom: 'Calamars', v: [95, 17, 2, 0, 1.5, 0.4, 0, 0.5], g: 130, p: '1 portion', syn: ['encornet', 'supions'] },
  { id: 'poulpe', nom: 'Poulpe', v: [90, 17, 2, 0, 1, 0.2, 0, 0.6], g: 130, p: '1 portion', rare: true },
  { id: 'seiche', nom: 'Seiche', v: [85, 16, 1.5, 0, 1, 0.2, 0, 0.6], g: 130, p: '1 portion', rare: true },

  /* ── Préparations ── */
  { id: 'surimi', nom: 'Surimi', v: [95, 9, 12, 4, 1.5, 0.3, 0.5, 2], g: 60, p: '4 bâtonnets' },
  { id: 'poisson-pane', nom: 'Poisson pané', v: [210, 13, 17, 1, 10, 1.2, 1, 0.8], g: 100, p: '2 filets' },
  { id: 'poisson-meuniere', nom: 'Poisson meunière', v: [190, 18, 6, 0.5, 10, 3, 0.3, 0.6], g: 150, p: '1 portion' },
  { id: 'quenelle-brochet', nom: 'Quenelle de brochet', v: [180, 8, 14, 1, 10, 3, 0.5, 1], g: 120, p: '2 quenelles' },
  { id: 'brandade', nom: 'Brandade de morue', v: [155, 11, 12, 1, 7, 2, 1, 1.1], g: 250, p: '1 portion' },
  { id: 'tarama', nom: 'Tarama', v: [480, 6, 6, 3, 48, 6, 0.5, 2], g: 30, p: '1 portion' },
  { id: 'oeuf-lump', nom: 'Œufs de lump', v: [110, 12, 3, 0, 5, 1, 0, 4], g: 20, p: '1 cuillère', rare: true },
  { id: 'rillettes-thon', nom: 'Rillettes de thon', v: [250, 14, 3, 1, 20, 4, 0.5, 1.4], g: 40, p: '1 portion' },

  /* ── Compléments ── */
  { id: 'saumon-fume-chaud', nom: 'Saumon fumé à chaud', v: [195, 24, 0.5, 0.5, 11, 2.2, 0, 2.5], g: 100, p: '1 portion' },
  { id: 'pave-saumon-four', nom: 'Saumon au four', v: [210, 22, 0.5, 0.3, 13, 2.8, 0.1, 0.5], g: 150, p: '1 pavé' },
  { id: 'saumon-vapeur', nom: 'Saumon vapeur', v: [195, 21, 0, 0, 12.5, 2.8, 0, 0.2], g: 150, p: '1 pavé' },
  { id: 'truite-saumonee', nom: 'Truite saumonée', v: [170, 21, 0, 0, 9.5, 2, 0, 0.1], g: 150, p: '1 portion' },
  { id: 'saumonette', nom: 'Saumonette', v: [105, 22, 0, 0, 2, 0.4, 0, 0.3], g: 150, p: '1 portion', rare: true },
  { id: 'julienne-poisson', nom: 'Julienne', v: [88, 19, 0, 0, 0.9, 0.2, 0, 0.3], g: 130, p: '1 filet', rare: true },
  { id: 'saint-pierre', nom: 'Saint-Pierre', v: [95, 20, 0, 0, 1.5, 0.4, 0, 0.3], g: 150, p: '1 portion', rare: true },
  { id: 'grondin', nom: 'Grondin', v: [95, 19, 0, 0, 2, 0.5, 0, 0.3], g: 150, p: '1 portion', rare: true },
  { id: 'carrelet', nom: 'Carrelet', v: [86, 18, 0, 0, 1.3, 0.3, 0, 0.3], g: 150, p: '1 poisson' },
  { id: 'perche', nom: 'Filet de perche', v: [92, 19, 0, 0, 1.5, 0.3, 0, 0.1], g: 130, p: '1 filet' },
  { id: 'brochet', nom: 'Brochet', v: [88, 19, 0, 0, 0.8, 0.2, 0, 0.1], g: 150, p: '1 portion', rare: true },
  { id: 'anguille', nom: 'Anguille', v: [235, 18, 0, 0, 18, 4, 0, 0.2], g: 120, p: '1 portion', rare: true },
  { id: 'thon-rouge', nom: 'Thon rouge', v: [155, 26, 0, 0, 5.5, 1.4, 0, 0.1], g: 130, p: '1 pavé' },
  { id: 'thon-albacore', nom: 'Thon albacore', v: [130, 25, 0, 0, 3, 0.8, 0, 0.1], g: 130, p: '1 pavé' },
  { id: 'sardine-grillee', nom: 'Sardines grillées', v: [215, 26, 0, 0, 12, 3.2, 0, 0.5], g: 130, p: '4 sardines' },
  { id: 'hareng-marine', nom: 'Hareng mariné', v: [200, 18, 3, 3, 13, 3, 0, 2.2], g: 80, p: '1 portion' },
  { id: 'maquereau-moutarde', nom: 'Maquereaux à la moutarde', v: [215, 17, 3, 2, 15, 3.4, 0.3, 1.4], g: 100, p: '1 boîte' },
  { id: 'thon-mayonnaise', nom: 'Thon mayonnaise', v: [280, 18, 2, 1, 22, 3.5, 0.2, 1.2], g: 80, p: '1 portion' },
  { id: 'crevette-grise', nom: 'Crevettes grises', v: [95, 20, 0.3, 0, 1.2, 0.3, 0, 1.6], g: 80, p: '1 portion' },
  { id: 'crevette-panee', nom: 'Crevettes panées', v: [240, 13, 22, 1.5, 11, 1.5, 1, 1.2], g: 120, p: '1 portion' },
  { id: 'moule-frite', nom: 'Moules-frites', v: [165, 10, 20, 1, 5.5, 1.2, 2, 0.9], g: 450, p: '1 assiette' },
  { id: 'plateau-fruits-mer', nom: 'Plateau de fruits de mer', v: [90, 15, 3, 0, 2, 0.5, 0, 1.4], g: 400, p: '1 plateau' },
  { id: 'coquille-saint-jacques-gratin', nom: 'Coquilles Saint-Jacques gratinées', v: [155, 12, 8, 2, 8.5, 4.5, 0.4, 0.9], g: 150, p: '2 coquilles' },
  { id: 'terrine-poisson', nom: 'Terrine de poisson', v: [175, 14, 4, 1.5, 11, 4, 0.4, 1.2], g: 60, p: '1 tranche' },
  { id: 'poisson-blanc-vapeur', nom: 'Poisson blanc vapeur', v: [88, 19, 0, 0, 1, 0.2, 0, 0.3], g: 150, p: '1 filet' },
  { id: 'colin-alaska-pane', nom: 'Colin d’Alaska pané', v: [200, 13, 16, 1, 9.5, 1.1, 1, 0.8], g: 100, p: '2 filets' },
]
