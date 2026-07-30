/**
 * Les photos des plats emblématiques, et leur attribution.
 *
 * **Fichier généré par `outils/photos.mjs` — ne pas l'éditer à la main.**
 *
 * Chaque image vient de Wikimedia Commons sous une licence libre. L'attribution
 * n'est pas une politesse : c'est la condition d'usage des licences CC BY et
 * CC BY-SA, et elle doit rester affichée sous l'image. Retirer `CreditPhoto` de
 * la fiche mettrait le projet en défaut.
 *
 * Seules les recettes écrites à la main en ont une. Les recettes composées gardent
 * leur illustration générée : aucune photo ne correspond à un assemblage, et une
 * image qui montre autre chose que ce qu'on va obtenir est un mensonge poli.
 */

export interface PhotoPlat {
  /** L'image de la fiche, environ 640 px de large. */
  fichier: string
  /**
   * La vignette de liste, environ 320 px.
   *
   * Absente, l'écran retombe sur `fichier` : c'est juste, seulement gourmand.
   * La liste affiche la photo dans un carré de 48 px, et y servir l'image de la
   * fiche téléchargeait deux cents kilo-octets par ligne.
   */
  mini?: string
  auteur: string
  licence: string
  source: string
}

export const PHOTOS: Record<string, PhotoPlat> = {
  'aligot': { fichier: '/plats/aligot.jpg', mini: '/plats/mini/aligot.jpg', auteur: 'Sebleouf', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:C%C3%B4te_de_cochon_noir_servie_avec_aligot,_salade_et_sauce_au_bleu_d%27Auvergne.jpg' },
  'aubergines-parmigiana': { fichier: '/plats/aubergines-parmigiana.jpg', mini: '/plats/mini/aubergines-parmigiana.jpg', auteur: 'Famartin', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:2025-01-25_20_16_56_%22Tour_of_Italy%22_(Lasagna_Classico,_Fettuccine_Alfredo,_and_Eggplant_Parmigiana_(substituted_for_the_usual_Chicken_Parmigiana))_at_the_Olive_Garden_along_U.S._Route_1_in_Lawrence,_New_Jersey.jpg' },
  'axoa': { fichier: '/plats/axoa.jpg', mini: '/plats/mini/axoa.jpg', auteur: 'Marianne Casamance', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Axoa_de_boeuf_et_coquillettes.JPG' },
  'baeckeoffe': { fichier: '/plats/baeckeoffe.jpg', mini: '/plats/mini/baeckeoffe.jpg', auteur: 'Jeangagnon', licence: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Baeckeoffe,_Chicoutimi.jpg' },
  'boeuf-bourguignon': { fichier: '/plats/boeuf-bourguignon.jpg', mini: '/plats/mini/boeuf-bourguignon.jpg', auteur: 'Asamboi', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Boeuf_Bourguignon_Paris_Beaubourg.jpg' },
  'boeuf-wok-legumes': { fichier: '/plats/boeuf-wok-legumes.jpg', mini: '/plats/mini/boeuf-wok-legumes.jpg', auteur: 'Judgefloro', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:1320Stir_fry_corn_beef_tenderloin_15.jpg' },
  'bouillabaisse': { fichier: '/plats/bouillabaisse.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Bouillabaisse_dieppoise_-_Le_Petit_L%C3%A9on_2026-05-08.jpg' },
  'brandade-nimes': { fichier: '/plats/brandade-nimes.jpg', mini: '/plats/mini/brandade-nimes.jpg', auteur: 'Scott Dexter from Brooklyn, US', licence: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Plate_of_rustic_brandade_(7326417970).jpg' },
  'carbonade-flamande': { fichier: '/plats/carbonade-flamande.jpg', mini: '/plats/mini/carbonade-flamande.jpg', auteur: 'Francisco Antunes', licence: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Carbonnade_flamande_%C3%A0_la_bi%C3%A8re.jpg' },
  'cari-poisson': { fichier: '/plats/cari-poisson.jpg', mini: '/plats/mini/cari-poisson.jpg', auteur: 'Benoît Prieur', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Cari_de_poisson,_Bourbon_Saveurs_974_(Belley).jpg' },
  'chakchouka': { fichier: '/plats/chakchouka.jpg', mini: '/plats/mini/chakchouka.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Smoky_Shakshouka_-_T_@_The_Dials_2024-12-17.jpg' },
  'chili-con-carne': { fichier: '/plats/chili-con-carne.jpg', mini: '/plats/mini/chili-con-carne.jpg', auteur: 'Simon Mannweiler', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Chili_con_Carne_(Uchtelfangen)_2023-12-07_(01).jpg' },
  'choucroute-garnie': { fichier: '/plats/choucroute-garnie.jpg', mini: '/plats/mini/choucroute-garnie.jpg', auteur: 'Brücke-Osteuropa', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Choucroute-garni_2.JPG' },
  'civet-sanglier': { fichier: '/plats/civet-sanglier.jpg', mini: '/plats/mini/civet-sanglier.jpg', auteur: 'Véronique PAGNIER', licence: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Civet_de_Marcassin.JPG' },
  'cotriade': { fichier: '/plats/cotriade.jpg', mini: '/plats/mini/cotriade.jpg', auteur: 'Arnaud 25', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Cotriade.jpg' },
  'couscous-royal': { fichier: '/plats/couscous-royal.jpg', mini: '/plats/mini/couscous-royal.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Tomato_%26_Couscous_Salad_-_The_Canopy_2025-08-03.jpg' },
  'curry-poulet-coco': { fichier: '/plats/curry-poulet-coco.jpg', mini: '/plats/mini/curry-poulet-coco.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Fried_chicken_and_rice_with_Korean_curry_-_Kogi_Korean_cuisine_2025-10-19.jpg' },
  'dahl-lentilles-corail': { fichier: '/plats/dahl-lentilles-corail.jpg', mini: '/plats/mini/dahl-lentilles-corail.jpg', auteur: 'pelican from Tokyo, Japan', licence: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Dal_soup_(29662999425).jpg' },
  'diots-polenta': { fichier: '/plats/diots-polenta.jpg', mini: '/plats/mini/diots-polenta.jpg', auteur: 'Tangopaso', licence: 'Public domain', source: 'https://commons.wikimedia.org/wiki/File:Diots_savoyards.jpg' },
  'far-breton-leger': { fichier: '/plats/far-breton-leger.jpg', mini: '/plats/mini/far-breton-leger.jpg', auteur: 'Manuel FLURY', licence: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Far_breton.jpg' },
  'fish-and-chips': { fichier: '/plats/fish-and-chips.jpg', auteur: 'Gvjekoslav', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Fish_and_Chips_Bath,_UK.jpg' },
  'flamiche-poireaux': { fichier: '/plats/flamiche-poireaux.jpg', mini: '/plats/mini/flamiche-poireaux.jpg', auteur: 'Claude Humbert', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:02._Flamiche_picarde_(4).jpg' },
  'fondue-savoyarde': { fichier: '/plats/fondue-savoyarde.jpg', mini: '/plats/mini/fondue-savoyarde.jpg', auteur: 'Caroline Léna Becker', licence: 'CC BY 3.0', source: 'https://commons.wikimedia.org/wiki/File:Fondue_Savoyarde.JPG' },
  'galette-complete': { fichier: '/plats/galette-complete.jpg', mini: '/plats/mini/galette-complete.jpg', auteur: 'Ji-Elle', licence: 'Public domain', source: 'https://commons.wikimedia.org/wiki/File:GaletteCidre.JPG' },
  'gougeres': { fichier: '/plats/gougeres.jpg', mini: '/plats/mini/gougeres.jpg', auteur: 'Arnold Gatilao from Oakland, CA, USA', licence: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Gougeres_(4202800536).jpg' },
  'gratin-dauphinois': { fichier: '/plats/gratin-dauphinois.jpg', mini: '/plats/mini/gratin-dauphinois.jpg', auteur: 'Ludovic Péron', licence: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Gratin_dauphinois.jpg' },
  'houmous-falafel': { fichier: '/plats/houmous-falafel.jpg', mini: '/plats/mini/houmous-falafel.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Falafel_-_Sheppy%27s_2025-07-27.jpg' },
  'kig-ha-farz': { fichier: '/plats/kig-ha-farz.jpg', mini: '/plats/mini/kig-ha-farz.jpg', auteur: 'Jean-Marc ALBERT', licence: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Kig_Ha_Farz_(Polyptyque).jpg' },
  'lasagnes-bolognaise': { fichier: '/plats/lasagnes-bolognaise.jpg', mini: '/plats/mini/lasagnes-bolognaise.jpg', auteur: 'Wheeler Cowperthwaite', licence: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Eggplant_Lasagna_(Vegitarian)_(6_of_6).jpg' },
  'moules-mariniere': { fichier: '/plats/moules-mariniere.jpg', mini: '/plats/mini/moules-mariniere.jpg', auteur: 'Ben Brown', licence: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Moules_Mariniere_outside_(15378540250).jpg' },
  'moussaka': { fichier: '/plats/moussaka.jpg', mini: '/plats/mini/moussaka.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Vegetarian_Moussaka_and_Roasted_Cauliflower_-_Foodilic_2025-10-13.jpg' },
  'nems-vietnamiens': { fichier: '/plats/nems-vietnamiens.jpg', mini: '/plats/mini/nems-vietnamiens.jpg', auteur: 'Phương Huy (thảo luận)', licence: 'Public domain', source: 'https://commons.wikimedia.org/wiki/File:Cu%E1%BB%91n_nem_r%C3%A1n_(%C4%91a_nem)_1.JPG' },
  'oeufs-meurette': { fichier: '/plats/oeufs-meurette.jpg', mini: '/plats/mini/oeufs-meurette.jpg', auteur: 'Popo le Chien', licence: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Oeufs_meurette.jpeg' },
  'osso-buco': { fichier: '/plats/osso-buco.jpg', mini: '/plats/mini/osso-buco.jpg', auteur: 'Xfigpower', licence: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Ossobuco_-_os_%C3%A0_moelle.JPG' },
  'pad-thai': { fichier: '/plats/pad-thai.jpg', mini: '/plats/mini/pad-thai.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Pad_Thai_with_Squid_-_Thai_Street_Food,_Worthing_2026-06-21.jpg' },
  'paella-valenciana': { fichier: '/plats/paella-valenciana.jpg', mini: '/plats/mini/paella-valenciana.jpg', auteur: 'Wilfredor', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Paella_de_fruit_de_mer.jpg' },
  'piperade': { fichier: '/plats/piperade.jpg', mini: '/plats/mini/piperade.jpg', auteur: 'Tangopaso', licence: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Lukinke_%26_piperade.jpg' },
  'pissaladiere': { fichier: '/plats/pissaladiere.jpg', mini: '/plats/mini/pissaladiere.jpg', auteur: 'TheCulinaryGeek', licence: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Pissaladiere_de_Poulet.jpg' },
  'potjevleesch': { fichier: '/plats/potjevleesch.jpg', mini: '/plats/mini/potjevleesch.jpg', auteur: 'Pierre André Leclercq', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Potjevleesch_in_Malo-les-Bains.jpg' },
  'poulet-basquaise': { fichier: '/plats/poulet-basquaise.jpg', mini: '/plats/mini/poulet-basquaise.jpg', auteur: 'Warren Layton', licence: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Poulet_%C3%A0_la_basquaise.jpg' },
  'quenelles-sauce-nantua': { fichier: '/plats/quenelles-sauce-nantua.jpg', mini: '/plats/mini/quenelles-sauce-nantua.jpg', auteur: 'Fryke27', licence: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Quenelle_de_brochet_sauce_Nantua.jpg' },
  'quiche-lorraine': { fichier: '/plats/quiche-lorraine.jpg', mini: '/plats/mini/quiche-lorraine.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Quiche_Lorraine_-_Julien_Plumart_2025-05-12.jpg' },
  'ramen-poulet': { fichier: '/plats/ramen-poulet.jpg', mini: '/plats/mini/ramen-poulet.jpg', auteur: 'Gannu03', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Knorr_Korean_Ramen.jpg' },
  'ratatouille': { fichier: '/plats/ratatouille.jpg', mini: '/plats/mini/ratatouille.jpg', auteur: 'Krzysztof Golik', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Vegetables_for_Ratatouille_02.jpg' },
  'risotto-milanaise': { fichier: '/plats/risotto-milanaise.jpg', mini: '/plats/mini/risotto-milanaise.jpg', auteur: 'Michele Ursino', licence: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Risotto_giallo_(6954045202).jpg' },
  'rougail-saucisse': { fichier: '/plats/rougail-saucisse.jpg', mini: '/plats/mini/rougail-saucisse.jpg', auteur: 'Benoît Prieur', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Comme_%C3%A0_la_Maison_(Villefranche-sur-Sa%C3%B4ne)_Rougail_saucisses_(f%C3%A9vrier_2024).jpg' },
  'saint-jacques-bretonne': { fichier: '/plats/saint-jacques-bretonne.jpg', mini: '/plats/mini/saint-jacques-bretonne.jpg', auteur: 'Stephane Lesbats (IFREMER, Pôle Images, Centre Bretagne - ZI de la Pointe du Diable - CS 10070 - 29280 Plouzané, France)', licence: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File:Campagne_COSB_2022_-_Tri_des_coquilles_Saint-Jacques_par_classe_d%27%C3%A2ge_(Ifremer_00791-90301_-_50997).jpg' },
  'salade-lyonnaise': { fichier: '/plats/salade-lyonnaise.jpg', mini: '/plats/mini/salade-lyonnaise.jpg', auteur: 'Romainbehar', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Lyon_4e_-_Caf%C3%A9_du_Gros_Caillou_-_Salade_lyonnaise.jpeg' },
  'spaetzle-gratines': { fichier: '/plats/spaetzle-gratines.jpg', mini: '/plats/mini/spaetzle-gratines.jpg', auteur: 'Silar', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:02021_0722_(3)_Bogr%C3%A1cs_with_Spaetzle.jpg' },
  'tajine-poulet-citron': { fichier: '/plats/tajine-poulet-citron.jpg', mini: '/plats/mini/tajine-poulet-citron.jpg', auteur: 'Benoît Prieur', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Tajine_de_poulet_au_citron_confit_(mars_2022).JPG' },
  'tarte-flambee': { fichier: '/plats/tarte-flambee.jpg', mini: '/plats/mini/tarte-flambee.jpg', auteur: 'Guilhem Vellut from Paris, France', licence: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Flammekueche,_La_Forge,_63_Boulevard_de_Vaugirard,_Paris_003.jpg' },
  'tartiflette': { fichier: '/plats/tartiflette.jpg', mini: '/plats/mini/tartiflette.jpg', auteur: 'Rémih', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Guinness_World_Record_biggest_tartiflette_Grenoble_14-10-2023_01.jpg' },
  'tortilla-patatas': { fichier: '/plats/tortilla-patatas.jpg', mini: '/plats/mini/tortilla-patatas.jpg', auteur: 'El Mono Español', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Tortilla_de_patatas_de_15_huevos.jpg' },
  'tripes-caen-allegees': { fichier: '/plats/tripes-caen-allegees.jpg', auteur: 'Chéret, Jules (1836-1932). Illustrateur', licence: 'Public domain', source: 'https://commons.wikimedia.org/wiki/File:Tripes_%C3%A0_la_mode_de_Caen._affiche,_Jules_Ch%C3%A9ret.jpg' },
  'truffade': { fichier: '/plats/truffade.jpg', mini: '/plats/mini/truffade.jpg', auteur: 'Guilhem Vellut from Paris, France', licence: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Truffade,_Cantal_15,_Montparnasse,_Paris_001.jpg' },
  'waterzooi-poulet': { fichier: '/plats/waterzooi-poulet.jpg', mini: '/plats/mini/waterzooi-poulet.jpg', auteur: 'Hendrik Conscience', licence: 'Public domain', source: 'https://commons.wikimedia.org/wiki/File:Recept_voor_Waterzooi,_asset_Q2eXpZraIcSAaRfYVSZY4eBt.tif' },
  'welsh': { fichier: '/plats/welsh.jpg', mini: '/plats/mini/welsh.jpg', auteur: 'Andy Li', licence: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Asparagus_Welsh_Rarebit_Croissant_(1)_-_Burnt,_Poyser_Street,_London_2026-06-04.jpg' },
}
