import type { Brut } from '../brut'

/**
 * Les plats emblématiques du terroir français, belge et d'outre-mer.
 *
 * Ce fichier existe parce qu'un journal alimentaire se remplit avec ce qu'on a
 * mangé, pas avec ce qu'on aurait dû manger. Quelqu'un qui sort d'un repas de
 * famille cherche « blanquette », pas « veau, sauce blanche, riz » : ne pas
 * trouver son plat, c'est renoncer à le noter, et une journée non notée vaut
 * moins qu'une journée approximative.
 *
 * **Les valeurs sont celles d'une portion servie**, pas d'une recette allégée.
 * Une tartiflette de restaurant n'a pas les valeurs d'une tartiflette maison au
 * reblochon allégé, et c'est la première qu'on note un dimanche soir.
 *
 * Ces entrées font double emploi avec le catalogue de recettes, et c'est assumé :
 * `lib/recettes/terroir/` répond à « qu'est-ce que je cuisine », celui-ci à
 * « qu'est-ce que j'ai mangé ».
 */
export const TERROIR: Brut[] = [
  /* ── Nord, Flandre et Belgique ── */
  { id: 'potjevleesch', nom: 'Potjevleesch', v: [175, 20, 1, 0.5, 10, 3.5, 0.2, 1.4], g: 120, p: '1 portion' },
  { id: 'welsh', nom: 'Welsh', v: [265, 15, 14, 2, 17, 10, 1, 1.5], g: 300, p: '1 portion' },
  { id: 'flamiche', nom: 'Flamiche aux poireaux', v: [230, 6, 20, 3, 13, 6.5, 2, 0.9], g: 150, p: '1 part', fl: 30 },
  { id: 'anguille-vert', nom: 'Anguilles au vert', v: [190, 18, 3, 1, 12, 3, 0.8, 0.8], g: 250, p: '1 assiette' },
  { id: 'stoemp', nom: 'Stoemp', v: [115, 3.5, 14, 2, 5, 2.8, 2.2, 0.7], g: 250, p: '1 portion', fl: 40 },
  { id: 'boulets-liegeois', nom: 'Boulets à la liégeoise', v: [200, 13, 14, 9, 10, 3.8, 0.8, 1.1], g: 300, p: '1 assiette' },
  { id: 'chicon-gratin', nom: 'Chicons au gratin', v: [110, 7, 6, 2.5, 6.5, 3.5, 1, 0.8], g: 300, p: '1 portion', fl: 40 },
  { id: 'americain-prepare', nom: 'Américain préparé', v: [230, 16, 2, 1, 18, 3.5, 0.3, 1] , g: 120, p: '1 portion' },
  { id: 'gaufre-liege', nom: 'Gaufre de Liège', v: [415, 6, 52, 22, 20, 11, 1.8, 0.6], g: 90, p: '1 gaufre' },
  { id: 'speculoos-belge', nom: 'Spéculoos', v: [470, 6, 70, 38, 19, 8, 2, 0.8], g: 25, p: '3 biscuits' },
  { id: 'tarte-maroilles', nom: 'Tarte au maroilles', v: [285, 12, 22, 3, 17, 10, 1.5, 1.4], g: 150, p: '1 part' },
  { id: 'hochepot', nom: 'Hochepot', v: [125, 11, 7, 2, 6, 2.4, 1.5, 0.8], g: 350, p: '1 assiette', fl: 30 },

  /* ── Bretagne et Normandie ── */
  { id: 'galette-sarrasin-complete', nom: 'Galette complète', v: [180, 9, 20, 1.5, 7.5, 4, 1.5, 1.1], g: 250, p: '1 galette' },
  { id: 'kig-ha-farz', nom: 'Kig ha farz', v: [155, 11, 17, 1.5, 4.5, 1.8, 2, 0.9], g: 400, p: '1 assiette' },
  { id: 'cotriade', nom: 'Cotriade', v: [105, 10, 8, 1, 3.5, 1.4, 1, 0.8], g: 400, p: '1 assiette' },
  { id: 'kouign-amann-terroir', nom: 'Kouign-amann', v: [480, 5, 50, 25, 29, 19, 1.5, 0.7], g: 90, p: '1 part' },
  { id: 'crepe-froment', nom: 'Crêpe de froment', v: [190, 6, 27, 4, 6, 3, 1, 0.4], g: 70, p: '1 crêpe' },
  { id: 'andouille-guemene', nom: 'Andouille de Guéméné', v: [245, 20, 1, 0.5, 18, 6.5, 0, 2.4], g: 60, p: '3 tranches' },
  { id: 'palourde-farcie', nom: 'Palourdes farcies', v: [175, 11, 5, 1, 12, 6, 0.5, 1.2], g: 120, p: '6 palourdes' },
  { id: 'teurgoule', nom: 'Teurgoule', v: [135, 3.5, 21, 13, 3.8, 2.4, 0.3, 0.1], g: 150, p: '1 portion' },
  { id: 'poulet-vallee-auge-plat', nom: 'Poulet vallée d’Auge', v: [155, 15, 5, 2.5, 8.5, 4, 0.6, 0.7], g: 300, p: '1 assiette' },
  { id: 'sole-normande', nom: 'Sole normande', v: [140, 16, 4, 1.5, 7, 3.5, 0.3, 0.9], g: 300, p: '1 assiette' },
  { id: 'tripes-caen', nom: 'Tripes à la mode de Caen', v: [130, 13, 3, 1.5, 7, 3, 0.5, 0.9], g: 300, p: '1 assiette' },
  { id: 'douillon', nom: 'Douillon aux pommes', v: [250, 4, 34, 16, 11, 6, 2.5, 0.4], g: 150, p: '1 douillon', fl: 35 },
  { id: 'marmite-dieppoise', nom: 'Marmite dieppoise', v: [115, 12, 4, 2, 5.5, 2.8, 0.4, 0.9], g: 350, p: '1 assiette' },

  /* ── Alsace, Lorraine, Franche-Comté ── */
  { id: 'baeckeoffe', nom: 'Baeckeoffe', v: [160, 12, 12, 1.5, 7, 2.8, 1.4, 0.8], g: 400, p: '1 assiette' },
  { id: 'flammekueche', nom: 'Flammekueche', v: [230, 10, 25, 2, 10, 5, 1.5, 1.2], g: 200, p: '1 tarte' },
  { id: 'spaetzle', nom: 'Spätzle', v: [175, 6, 28, 1.5, 4.5, 2, 1.4, 0.7], g: 200, p: '1 portion' },
  { id: 'coq-riesling', nom: 'Coq au riesling', v: [160, 16, 4, 1.5, 8.5, 3.6, 0.5, 0.8], g: 300, p: '1 assiette' },
  { id: 'kougelhopf', nom: 'Kouglof', v: [360, 8, 48, 18, 15, 8, 1.8, 0.6], g: 70, p: '1 part' },
  { id: 'bretzel-alsacien', nom: 'Bretzel alsacien', v: [340, 10, 66, 2, 4, 1, 3, 2.4], g: 80, p: '1 bretzel' },
  { id: 'quiche-lorraine-terroir', nom: 'Quiche lorraine', v: [260, 9, 20, 2, 16, 8, 1, 1.1], g: 150, p: '1 part' },
  { id: 'potee-lorraine', nom: 'Potée lorraine', v: [120, 8, 8, 1.5, 6, 2.5, 1.5, 0.9], g: 350, p: '1 assiette', fl: 35 },
  { id: 'pate-lorrain', nom: 'Pâté lorrain', v: [320, 11, 24, 2, 20, 10, 1.2, 1.3], g: 120, p: '1 part' },
  { id: 'madeleine-commercy', nom: 'Madeleines', v: [450, 6, 54, 28, 23, 6, 1.5, 0.7], g: 50, p: '2 madeleines' },
  { id: 'saucisse-morteau-plat', nom: 'Saucisse de Morteau et lentilles', v: [175, 12, 12, 1, 9, 3.4, 4, 1.1], g: 300, p: '1 assiette', fl: 30 },
  { id: 'boite-chaude', nom: 'Mont d’Or chaud', v: [320, 18, 2, 1.5, 27, 17, 0, 1.4], g: 100, p: '1 portion' },

  /* ── Bourgogne, Lyonnais ── */
  { id: 'boeuf-bourguignon-terroir', nom: 'Bœuf bourguignon', v: [130, 14, 5, 1.5, 6, 2.5, 1, 0.7], g: 300, p: '1 assiette' },
  { id: 'oeuf-meurette', nom: 'Œufs en meurette', v: [165, 9, 9, 2, 10, 3.8, 0.8, 0.9], g: 250, p: '1 portion' },
  { id: 'jambon-persille-plat', nom: 'Jambon persillé', v: [190, 22, 1, 0.5, 11, 4, 0.2, 2.5], g: 100, p: '1 portion' },
  { id: 'gougere', nom: 'Gougères', v: [390, 14, 26, 2, 25, 14, 1, 1.2], g: 50, p: '3 gougères' },
  { id: 'escargot-bourgogne', nom: 'Escargots à la bourguignonne', v: [180, 12, 2, 0.5, 14, 8, 0.3, 1], g: 100, p: '6 escargots' },
  { id: 'quenelle-nantua', nom: 'Quenelles sauce Nantua', v: [195, 9, 15, 2, 11, 5.5, 0.6, 1.1], g: 300, p: '1 portion' },
  { id: 'salade-lyonnaise-plat', nom: 'Salade lyonnaise', v: [155, 9, 8, 1.5, 10, 3, 1, 1], g: 250, p: '1 assiette', fl: 30 },
  { id: 'tablier-sapeur', nom: 'Tablier de sapeur', v: [255, 17, 14, 1, 15, 4, 0.8, 1.3], g: 200, p: '1 portion' },
  { id: 'cervelle-canut-plat', nom: 'Cervelle de canut', v: [110, 8, 3, 3, 7, 4.5, 0.2, 0.8], g: 100, p: '1 portion' },
  { id: 'saucisson-brioche', nom: 'Saucisson brioché', v: [330, 13, 26, 3, 19, 8, 1.2, 1.6], g: 120, p: '1 part' },
  { id: 'poulet-demi-deuil', nom: 'Poulet demi-deuil', v: [170, 20, 3, 1, 9, 3.5, 0.3, 0.8], g: 300, p: '1 assiette' },
  { id: 'gratin-cardon', nom: 'Gratin de cardons', v: [105, 4, 6, 2, 7, 4.2, 2.2, 0.7], g: 250, p: '1 portion', fl: 45 },

  /* ── Savoie, Auvergne, Massif central ── */
  { id: 'tartiflette-terroir', nom: 'Tartiflette', v: [175, 7, 11, 1.5, 11, 6.5, 1.2, 0.8], g: 300, p: '1 portion' },
  { id: 'croziflette-savoie', nom: 'Croziflette', v: [180, 8, 18, 1.5, 9, 5.5, 1.2, 0.9], g: 300, p: '1 portion' },
  { id: 'raclette-savoyarde', nom: 'Raclette', v: [210, 13, 9, 1, 14, 8.5, 1, 1.2], g: 350, p: '1 assiette' },
  { id: 'fondue-savoyarde-plat', nom: 'Fondue savoyarde', v: [250, 17, 4, 1, 17, 11, 0.2, 1.2], g: 250, p: '1 portion' },
  { id: 'diots-vin-blanc', nom: 'Diots au vin blanc', v: [205, 12, 6, 1.5, 15, 5.5, 0.8, 1.3], g: 250, p: '1 portion' },
  { id: 'farcon-savoyard', nom: 'Farçon savoyard', v: [165, 5, 22, 8, 6.5, 3.5, 2, 0.7], g: 250, p: '1 portion' },
  { id: 'aligot-terroir', nom: 'Aligot', v: [180, 6, 16, 1, 10, 6.5, 1.2, 0.8], g: 250, p: '1 portion' },
  { id: 'truffade-terroir', nom: 'Truffade', v: [190, 7, 17, 1, 11, 6.8, 1.3, 0.8], g: 250, p: '1 portion' },
  { id: 'pounti', nom: 'Pounti', v: [195, 10, 15, 6, 10, 4, 1.5, 0.9], g: 150, p: '1 part' },
  { id: 'chou-farci-auvergne', nom: 'Chou farci', v: [120, 7, 8, 2, 6.5, 2.5, 1.8, 0.7], g: 300, p: '1 portion', fl: 45 },
  { id: 'potee-auvergnate', nom: 'Potée auvergnate', v: [125, 9, 8, 1.5, 6.2, 2.6, 1.6, 0.9], g: 350, p: '1 assiette', fl: 35 },
  { id: 'patranque', nom: 'Patranque', v: [215, 9, 18, 1.5, 12, 7, 1, 1], g: 250, p: '1 portion' },

  /* ── Provence, Côte d'Azur, Corse ── */
  { id: 'ratatouille-terroir', nom: 'Ratatouille', v: [60, 1.2, 4, 3.5, 4, 0.6, 2, 0.5], g: 250, p: '1 portion', fl: 85 },
  { id: 'bouillabaisse-terroir', nom: 'Bouillabaisse', v: [90, 9, 5, 1.5, 3.5, 0.8, 0.8, 0.9], g: 400, p: '1 assiette' },
  { id: 'daube-provencale-terroir', nom: 'Daube provençale', v: [135, 14, 5, 2, 6.5, 2.6, 1, 0.7], g: 300, p: '1 assiette' },
  { id: 'pissaladiere-terroir', nom: 'Pissaladière', v: [230, 6, 26, 4, 11, 2, 2, 1.3], g: 150, p: '1 part' },
  { id: 'socca-nicoise', nom: 'Socca', v: [200, 8, 18, 1, 11, 1.5, 3, 0.8], g: 150, p: '1 part' },
  { id: 'pan-bagnat', nom: 'Pan-bagnat', v: [210, 9, 20, 2.5, 10, 1.8, 1.8, 1.1], g: 250, p: '1 sandwich', fl: 30 },
  { id: 'salade-nicoise-terroir', nom: 'Salade niçoise', v: [120, 8, 6, 3, 7, 1.2, 1.5, 0.8], g: 300, p: '1 assiette', fl: 55 },
  { id: 'petits-farcis', nom: 'Petits farcis niçois', v: [135, 7, 9, 3, 8, 2.6, 1.6, 0.8], g: 300, p: '1 portion', fl: 45 },
  { id: 'tapenade-terroir', nom: 'Tapenade', v: [350, 2, 3, 1, 35, 5, 4, 3], g: 30, p: '1 portion' },
  { id: 'anchoiade', nom: 'Anchoïade', v: [330, 8, 2, 1, 33, 5, 0.5, 4.5], g: 30, p: '1 portion' },
  { id: 'soupe-pistou-terroir', nom: 'Soupe au pistou', v: [80, 3.5, 9, 2, 3, 0.7, 2.5, 0.6], g: 350, p: '1 assiette', fl: 60 },
  { id: 'tian-provencal', nom: 'Tian provençal', v: [72, 1.8, 5, 4, 4.5, 0.8, 2.2, 0.5], g: 250, p: '1 portion', fl: 80 },
  { id: 'civet-sanglier-corse', nom: 'Civet de sanglier', v: [150, 16, 4, 1.5, 7.5, 2.8, 0.8, 0.8], g: 300, p: '1 assiette' },
  { id: 'figatellu', nom: 'Figatellu', v: [340, 20, 1, 0.5, 28, 11, 0, 2.6], g: 100, p: '1 saucisse' },
  { id: 'brocciu', nom: 'Brocciu', f: 'fromage', v: [175, 12, 3, 3, 12, 8, 0, 0.4], g: 60, p: '1 portion' },
  { id: 'fiadone', nom: 'Fiadone', v: [235, 9, 22, 20, 12, 7, 0.3, 0.3], g: 120, p: '1 part' },

  /* ── Sud-Ouest, Pays basque, Languedoc ── */
  { id: 'cassoulet-terroir', nom: 'Cassoulet', v: [160, 9, 13, 1, 8, 3, 3.5, 0.9], g: 350, p: '1 assiette', fl: 30 },
  { id: 'garbure-terroir', nom: 'Garbure', v: [95, 6, 8, 1.5, 4, 1.5, 2.2, 0.8], g: 350, p: '1 assiette', fl: 45 },
  { id: 'confit-sarladaises', nom: 'Confit de canard et pommes sarladaises', v: [215, 15, 14, 0.8, 12, 4, 1.5, 0.9], g: 350, p: '1 assiette' },
  { id: 'magret-grille', nom: 'Magret de canard grillé', v: [205, 27, 0.5, 0.5, 10.5, 3.6, 0, 0.5], g: 180, p: '1/2 magret' },
  { id: 'poulet-basquaise-terroir', nom: 'Poulet basquaise', v: [110, 13, 5, 3, 4, 1, 1.2, 0.6], g: 300, p: '1 assiette', fl: 35 },
  { id: 'axoa-veau', nom: 'Axoa de veau', v: [145, 15, 5, 2.5, 7, 2.5, 1.2, 0.8], g: 300, p: '1 assiette', fl: 30 },
  { id: 'piperade-terroir', nom: 'Pipérade', v: [95, 5.5, 5, 3.5, 5.5, 1.4, 1.5, 0.7], g: 300, p: '1 portion', fl: 60 },
  { id: 'ttoro', nom: 'Ttoro', v: [100, 11, 4, 1.5, 4, 0.9, 0.7, 0.9], g: 350, p: '1 assiette' },
  { id: 'gateau-basque-terroir', nom: 'Gâteau basque', v: [390, 6, 48, 24, 19, 11, 1.5, 0.4], g: 80, p: '1 part' },
  { id: 'brandade-morue', nom: 'Brandade de morue', v: [155, 11, 12, 1, 7, 2, 1, 1.1], g: 250, p: '1 portion' },
  { id: 'cargolade', nom: 'Cargolade', v: [155, 14, 2, 0.5, 10, 3, 0.3, 1.2], g: 200, p: '1 portion' },
  { id: 'aligot-saucisse-plat', nom: 'Aligot-saucisse', v: [200, 9, 15, 1.2, 12, 6.5, 1.2, 1], g: 350, p: '1 assiette' },
  { id: 'ttoro-tapas', nom: 'Assiette de charcuterie basque', v: [320, 22, 2, 1, 25, 9, 0.2, 3.8], g: 100, p: '1 assiette' },
  { id: 'croustade', nom: 'Croustade aux pommes', v: [305, 3.5, 42, 22, 14, 7, 2, 0.4], g: 100, p: '1 part', fl: 30 },

  /* ── Val de Loire, Centre, Poitou ── */
  { id: 'rillette-tours', nom: 'Rillettes de Tours', v: [400, 15, 0.5, 0.5, 38, 15, 0, 1.7], g: 40, p: '1 portion' },
  { id: 'sandre-beurre-blanc-plat', nom: 'Sandre au beurre blanc', v: [165, 15, 5, 1, 10, 5.5, 0.6, 0.8], g: 300, p: '1 assiette' },
  { id: 'tarte-tatin-terroir', nom: 'Tarte Tatin', v: [265, 3, 36, 22, 12, 7, 1.6, 0.3], g: 120, p: '1 part', fl: 35 },
  { id: 'geline-lochoise', nom: 'Volaille à la lochoise', v: [165, 19, 3, 1.5, 8.5, 3.4, 0.4, 0.8], g: 300, p: '1 assiette' },
  { id: 'farci-poitevin', nom: 'Farci poitevin', v: [145, 8, 8, 2, 9, 3, 2, 0.9], g: 200, p: '1 part', fl: 40 },
  { id: 'mojette', nom: 'Mogettes au jambon', v: [125, 9, 15, 1, 3, 1, 5.5, 0.9], g: 300, p: '1 assiette', fl: 60 },
  { id: 'chaudree', nom: 'Chaudrée', v: [95, 10, 5, 1, 3.5, 1.4, 0.7, 0.9], g: 350, p: '1 assiette' },
  { id: 'poire-tapee', nom: 'Poires tapées au vin', v: [110, 0.5, 25, 22, 0.2, 0, 3, 0], g: 150, p: '1 portion', fl: 70 },

  /* ── Antilles, Réunion, outre-mer ── */
  { id: 'colombo-poulet-terroir', nom: 'Colombo de poulet', v: [125, 12, 8, 3.5, 4.5, 1.2, 1.6, 0.7], g: 350, p: '1 assiette', fl: 35 },
  { id: 'accras-morue', nom: 'Accras de morue', v: [290, 12, 25, 1.5, 16, 2.5, 1.5, 1.4], g: 100, p: '5 accras' },
  { id: 'boudin-antillais', nom: 'Boudin antillais', v: [340, 14, 4, 1.5, 30, 12, 0.5, 1.8], g: 100, p: '1 boudin' },
  { id: 'court-bouillon-poisson', nom: 'Court-bouillon de poisson', v: [110, 13, 4, 2, 4.5, 1, 0.8, 0.9], g: 300, p: '1 assiette' },
  { id: 'rougail-saucisse-terroir', nom: 'Rougail saucisse', v: [165, 11, 6, 3.5, 11, 4, 1.2, 1.3], g: 300, p: '1 assiette', fl: 30 },
  { id: 'cari-poulet', nom: 'Cari de poulet', v: [130, 14, 5, 2.5, 6, 1.8, 1, 0.8], g: 300, p: '1 assiette' },
  { id: 'rougail-morue', nom: 'Rougail morue', v: [125, 14, 5, 3, 5.5, 1.2, 1.2, 1.6], g: 300, p: '1 assiette' },
  { id: 'samoussa-reunion', nom: 'Samoussas', v: [280, 7, 28, 2, 16, 4, 2, 1], g: 100, p: '3 samoussas' },
  { id: 'bouchon-reunion', nom: 'Bouchons réunionnais', v: [195, 11, 20, 2, 8, 2.5, 1, 1.1], g: 120, p: '5 bouchons' },
  { id: 'gratin-christophine', nom: 'Gratin de christophine', v: [105, 4, 7, 3, 6.5, 3.6, 2, 0.7], g: 250, p: '1 portion', fl: 55 },
  { id: 'blaff', nom: 'Blaff de poisson', v: [105, 15, 2, 1, 4, 0.9, 0.4, 1], g: 300, p: '1 assiette' },
  { id: 'ti-punch', nom: 'Ti-punch', f: 'boisson', v: [230, 0, 12, 12, 0, 0, 0, 0], g: 60, p: '1 verre', rare: true },

  /* ── Classiques de bistrot ── */
  { id: 'pot-au-feu-terroir', nom: 'Pot-au-feu', v: [95, 10, 6, 1.5, 3.5, 1.5, 1.2, 0.6], g: 400, p: '1 assiette', fl: 30 },
  { id: 'blanquette-terroir', nom: 'Blanquette de veau', v: [120, 11, 5, 1, 6, 2.5, 0.5, 0.6], g: 300, p: '1 assiette' },
  { id: 'coq-au-vin-terroir', nom: 'Coq au vin', v: [150, 16, 4, 1, 7.5, 2.8, 0.6, 0.7], g: 300, p: '1 assiette' },
  { id: 'navarin-terroir', nom: 'Navarin d’agneau', v: [130, 12, 6, 2, 6.5, 2.5, 1.2, 0.7], g: 300, p: '1 assiette', fl: 25 },
  { id: 'boeuf-carotte', nom: 'Bœuf carottes', v: [125, 13, 6, 3, 5.5, 2.3, 1.4, 0.7], g: 300, p: '1 assiette', fl: 30 },
  { id: 'lapin-moutarde-terroir', nom: 'Lapin à la moutarde', v: [140, 17, 3, 1.5, 6.5, 2.5, 0.4, 0.8], g: 300, p: '1 assiette' },
  { id: 'poule-au-pot-plat', nom: 'Poule au pot', v: [110, 12, 6, 1.8, 4, 1.4, 1.3, 0.6], g: 350, p: '1 assiette', fl: 30 },
  { id: 'gigot-flageolets', nom: 'Gigot d’agneau et flageolets', v: [165, 18, 9, 0.8, 6.5, 2.8, 3, 0.7], g: 300, p: '1 assiette', fl: 30 },
  { id: 'boeuf-mode-terroir', nom: 'Bœuf mode', v: [140, 14, 5, 2.5, 7, 2.8, 1.1, 0.7], g: 300, p: '1 assiette' },
  { id: 'poulet-chasseur', nom: 'Poulet chasseur', v: [140, 15, 4, 2, 7, 2.4, 0.8, 0.8], g: 300, p: '1 assiette' },
  { id: 'saute-veau-marengo', nom: 'Sauté de veau Marengo', v: [135, 15, 5, 2, 6, 2.2, 0.9, 0.8], g: 300, p: '1 assiette' },
  { id: 'langue-sauce-piquante', nom: 'Langue sauce piquante', v: [195, 15, 3, 1.5, 14, 5.5, 0.5, 1.1], g: 250, p: '1 assiette' },
  { id: 'petit-sale-lentilles-terroir', nom: 'Petit salé aux lentilles', v: [150, 11, 12, 1, 6.5, 2.5, 4, 1], g: 300, p: '1 assiette', fl: 35 },
  { id: 'saucisse-lentilles', nom: 'Saucisses lentilles', v: [175, 12, 12, 1, 9, 3.4, 4, 1.1], g: 300, p: '1 assiette', fl: 30 },
  { id: 'hachis-parmentier-terroir', nom: 'Hachis parmentier', v: [130, 7, 13, 1.5, 5.5, 2.5, 1.2, 0.7], g: 300, p: '1 portion' },
  { id: 'gratin-endives-terroir', nom: 'Gratin d’endives', v: [115, 6.5, 6, 2.5, 7, 4, 1.4, 0.8], g: 300, p: '1 portion', fl: 45 },
  { id: 'oeuf-cocotte-plat', nom: 'Œufs cocotte', v: [180, 10, 2, 1.5, 14, 7, 0, 0.6], g: 150, p: '1 ramequin' },
  { id: 'souffle-fromage-plat', nom: 'Soufflé au fromage', v: [200, 11, 10, 2, 13, 7, 0.5, 0.8], g: 200, p: '1 portion' },
  { id: 'bouchee-reine', nom: 'Bouchée à la reine', v: [200, 9, 16, 1.5, 11, 5, 0.8, 1], g: 200, p: '1 bouchée' },
  { id: 'friand-fromage', nom: 'Friand au fromage', v: [335, 11, 25, 2, 21, 11, 1.2, 1.3], g: 120, p: '1 friand' },
  { id: 'croque-monsieur-terroir', nom: 'Croque-monsieur', v: [250, 13, 20, 2, 13, 7, 1.2, 1.4], g: 180, p: '1 croque-monsieur' },
  { id: 'steak-tartare-frites', nom: 'Tartare et frites', v: [215, 14, 18, 0.6, 10, 3.2, 1.8, 0.9], g: 350, p: '1 assiette' },
  { id: 'entrecote-bearnaise', nom: 'Entrecôte béarnaise', v: [265, 22, 2, 1, 19, 8.5, 0.2, 0.8], g: 250, p: '1 assiette' },
  { id: 'onglet-echalote', nom: 'Onglet à l’échalote', v: [215, 24, 3, 1.5, 12, 4.5, 0.5, 0.8], g: 220, p: '1 assiette' },
  { id: 'sole-meuniere', nom: 'Sole meunière', v: [190, 18, 6, 0.5, 10, 3, 0.3, 0.6], g: 250, p: '1 assiette' },
  { id: 'raie-beurre-noisette', nom: 'Raie au beurre noisette', v: [185, 19, 2, 0.5, 11, 6, 0.2, 0.9], g: 250, p: '1 assiette' },
  { id: 'gratin-fruits-mer', nom: 'Gratin de fruits de mer', v: [150, 13, 7, 2, 8, 4.2, 0.4, 1.1], g: 250, p: '1 portion' },
  { id: 'saumon-oseille', nom: 'Saumon à l’oseille', v: [215, 20, 3, 1.5, 14, 5, 0.5, 0.7], g: 250, p: '1 assiette' },
  { id: 'blanquette-poisson', nom: 'Blanquette de poisson', v: [115, 13, 4, 1.5, 5, 2.4, 0.4, 0.8], g: 300, p: '1 assiette' },
  { id: 'choucroute-mer', nom: 'Choucroute de la mer', v: [110, 12, 4, 1.5, 5, 1.8, 1.8, 1.1], g: 350, p: '1 assiette', fl: 30 },
]
