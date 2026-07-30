import type { Categorie, Moment } from '../types'
import {
  AROMATES,
  BASES_MATIN,
  FECULENTS,
  FRUITS,
  GARNITURES_MATIN,
  GARNITURES_SALEES,
  GRAS,
  LEGUMES,
  PROTEINES,
  kcalDeLaBrique,
  regimesCommuns,
  vaAvec,
} from './briques'
import type { Aromate, Brique, Technique } from './briques'
import type { Cuisine, Gout, Ingredient, Recette, Region, Tag, TypePlat } from './types'

/**
 * Le catalogue composé : plusieurs milliers de recettes, assemblées à partir des
 * briques et des techniques de `briques.ts`.
 *
 * ## Ce qui est généré, et ce qui ne l'est pas
 *
 * Les 53 recettes écrites à la main restent **en tête du catalogue** et ne
 * changent pas : elles sont meilleures que ce qu'une combinatoire produit, parce
 * qu'un humain les a écrites pour elles-mêmes. Les recettes composées viennent
 * après, et leur identifiant est préfixé `c:` — jamais mélangeable avec les
 * autres.
 *
 * ## Généré à l'exécution, pas écrit dans le dépôt
 *
 * Cinq mille recettes en TypeScript pèseraient plusieurs mégaoctets à télécharger
 * pour une application qui en affiche vingt à la fois. Le générateur, lui, tient
 * en quelques kilo-octets et produit le catalogue en mémoire au premier accès.
 * C'est aussi ce qui permet de corriger une tournure ou une valeur nutritionnelle
 * dans **toutes** les recettes d'un coup, au lieu de reprendre cinq mille
 * fichiers.
 *
 * ## Déterministe, sinon les références se cassent
 *
 * Un identifiant est calculé depuis les briques qui composent la recette
 * (`c:poele:poulet:riz:courgette:mediterraneenne`), et l'ordre d'énumération est
 * fixe. La même recette a donc toujours le même identifiant, d'une session à
 * l'autre et d'un appareil à l'autre — condition pour que les favoris, les plans
 * de menus et les listes de courses qui la référencent restent valides. **Ne
 * jamais introduire de hasard ici.**
 */

/* ────────────────────────────── Les formats ────────────────────────────── */

interface Format {
  id: string
  moment: Moment
  technique: Technique
  /** La forme du plat, posée sur la recette plutôt que devinée du titre. */
  typePlat: TypePlat
  /**
   * Le plat se mange froid : il prend la tournure froide du style.
   *
   * Sans cette distinction, une salade héritait de « sauté au wok » et le
   * catalogue affichait « Salade de riz, thon et jeunes pousses sauté au wok ».
   */
  froid?: boolean
  /** Comment nommer le plat. Reçoit les noms courts des briques. */
  titre: (p: { proteine: string; feculent: string; legume: string; style: string }) => string
  /** Les étapes, écrites depuis les briques et leurs temps réels. */
  etapes: (p: Composition) => string[]
  tags: Tag[]
  /** Le format impose-t-il un mode de conservation ? */
  conservation?: string
  rechauffage?: string
  /**
   * Combien de recettes ce format produit **par style**.
   *
   * Par style et non au total : plafonner globalement remplissait tout le quota
   * avec la première cuisine énumérée, et le catalogue n'avait plus qu'un seul
   * pays.
   */
  plafond: number
  /** Restreint les féculents : une salade de polenta n'existe pas. */
  feculents?: (b: Brique) => boolean
  /** Restreint les matières grasses : une salade au beurre non plus. */
  gras?: (b: Brique) => boolean
  /** Restreint les styles, quand le format en appartient à un. */
  styles?: Cuisine[]
}

/**
 * Un style de composition : ce qui donne son caractère à un assemblage.
 *
 * Un style **n'est pas une cuisine**, et c'est ce qui a permis d'ajouter les
 * régions sans casser le catalogue existant. `cuisine` sert à filtrer les briques
 * — une brique déclare avec quelles cuisines elle va, et personne n'allait
 * réécrire cette table pour dix régions de plus — pendant que `id`, `region` et
 * les tournures portent l'identité régionale.
 *
 * **`id` entre dans l'identifiant de la recette.** Les styles historiques gardent
 * donc exactement l'identifiant de leur cuisine (`francaise`, `italienne`, …) :
 * un favori ou un plan de menus enregistré avant cette version continue de
 * résoudre. Les styles régionaux sont de nouvelles valeurs, ils ne peuvent entrer
 * en collision avec rien.
 */
interface Style {
  id: string
  cuisine: Cuisine
  region?: Region
  /** « façon bistrot », « à la provençale » — pour un plat chaud. */
  tournure: string
  /** La même chose pour un plat froid : une salade ne se « sauté au wok » pas. */
  tournureFroide: string
  /**
   * Aromates imposés. Absents, ils sont tirés d'`AROMATES` selon la cuisine.
   *
   * Les styles régionaux les portent en dur : c'est le romarin et l'ail qui font
   * la provençale, et la table d'aromates générale, indexée par cuisine, ne
   * saurait pas les distinguer de ceux d'une méditerranéenne quelconque.
   */
  aromates?: Aromate[]
  gouts?: Gout[]
  /**
   * Fraction du plafond de chaque format, pour ce style.
   *
   * Les régions valent 35 % : à plein régime, dix styles de plus doublaient le
   * catalogue composé pour un gain de variété qui, lui, ne double pas — les mêmes
   * briques y reviennent sous une tournure différente. Un tiers suffit à ce que
   * chaque région soit représentée dans un filtre sans gonfler la mémoire d'un
   * téléphone.
   */
  part?: number
}

interface Composition {
  proteine: Brique
  feculent: Brique
  legume: Brique
  gras: Brique
  aromates: Aromate[]
  style: Style
  minutes: number
}

/**
 * Le libellé court d'une brique, pour les titres.
 *
 * `titreCourt` prime toujours : le raccourcissement automatique se trompe dès
 * qu'un nom porte un pourcentage (« Steak haché 5 % » donnait « Mijoté de 5 % »)
 * ou un qualificatif inattendu. La règle générale sert les cas simples, le champ
 * explicite tranche les autres.
 */
function courtDe(brique: Brique): string {
  return brique.titreCourt ?? court(brique.nom)
}

function court(nom: string): string {
  return nom
    .replace(/^(Blanc|Filet mignon|Filet|Pavé|Dos|Escalope|Steak haché|Bavette) (de |d’)?/i, '')
    .replace(/ (cuits?|cuites?|découenné|ferme|complet|complètes?|nature|frais)$/i, '')
    .toLowerCase()
}

/** « à la méditerranéenne », « façon asiatique » — la tournure varie avec le style. */
const TOURNURE: Record<Cuisine, string> = {
  francaise: 'façon bistrot',
  italienne: 'à l’italienne',
  mediterraneenne: 'à la méditerranéenne',
  orientale: 'aux épices douces',
  asiatique: 'sauté au wok',
  indienne: 'au curry',
  mexicaine: 'épicé',
  nordique: 'à l’aneth et au citron',
  britannique: 'à l’anglaise',
  americaine: 'façon bowl',
}

/**
 * La tournure des plats froids.
 *
 * `TOURNURE` décrit une cuisson (« sauté au wok », « au four ») : appliquée à une
 * salade, elle produisait « Salade de riz, thon et jeunes pousses sauté au wok ».
 * Un plat froid a besoin de son propre vocabulaire.
 */
const TOURNURE_FROIDE: Record<Cuisine, string> = {
  francaise: 'à la moutarde',
  italienne: 'au basilic',
  mediterraneenne: 'à l’huile d’olive',
  orientale: 'à la menthe',
  asiatique: 'aux graines de sésame',
  indienne: 'aux épices douces',
  mexicaine: 'au maïs et au citron vert',
  nordique: 'à l’aneth',
  britannique: 'à l’anglaise',
  americaine: 'façon bowl',
}

const FORMATS: Format[] = [
  {
    id: 'poele',
    moment: 'dejeuner',
    technique: 'poele',
    typePlat: 'poelee',
    plafond: 115,
    tags: ['une-casserole'],
    // Tournure nominale (« Poêlée de ») et non participe accordé (« poêlé ») :
    // « Crevettes décortiquées poêlé » demandait un accord que le générateur
    // n'a pas les moyens de faire juste à tous les coups.
    titre: ({ proteine, legume, feculent, style }) =>
      `Poêlée de ${proteine}, ${legume} et ${feculent} ${style}`,
    etapes: (c) => [
      `Faites cuire ${avecArticle(c.feculent)} selon les indications du paquet, ${c.feculent.cuisson?.bouilli ?? 10} minutes.`,
      `Chauffez ${c.gras.defini ?? c.gras.nom.toLowerCase()} dans une grande poêle et parfumez avec ${listeAromates(c.aromates)}.`,
      `Faites revenir ${avecArticle(c.legume)} ${c.legume.taille ?? ''}, ${c.legume.cuisson?.poele ?? 10} minutes à feu moyen.`,
      `Ajoutez ${avecArticle(c.proteine)} ${c.proteine.taille ?? ''} et poursuivez ${c.proteine.cuisson?.poele ?? 8} minutes, en remuant.`,
      `Mélangez avec ${avecArticle(c.feculent)} hors du feu, rectifiez l’assaisonnement et servez.`,
    ],
  },
  {
    id: 'four',
    moment: 'diner',
    technique: 'four',
    typePlat: 'roti',
    plafond: 105,
    tags: ['une-casserole', 'batch'],
    conservation: '2 jours au réfrigérateur',
    rechauffage: '10 min à 180 °C, à couvert pour ne pas dessécher.',
    titre: ({ proteine, legume, feculent, style }) =>
      `${majuscule(proteine)} au four, ${legume} et ${feculent} ${style}`,
    etapes: (c) => [
      'Préchauffez le four à 200 °C.',
      `Disposez ${avecArticle(c.legume)} ${c.legume.taille ?? 'en morceaux'} et ${avecArticle(c.feculent)} dans un plat, arrosez ${c.gras.partitif ?? de(c.gras.nom)}.`,
      `Parsemez de ${listeAromates(c.aromates)}, mélangez pour tout enrober.`,
      `Enfournez ${c.legume.cuisson?.four ?? 20} minutes, puis posez ${avecArticle(c.proteine)} dessus.`,
      `Remettez ${c.proteine.cuisson?.four ?? 18} minutes : la chair doit se détacher à la fourchette.`,
    ],
  },
  {
    id: 'papillote',
    moment: 'diner',
    technique: 'papillote',
    typePlat: 'papillote',
    froid: true,
    plafond: 40,
    tags: ['une-casserole'],
    titre: ({ proteine, legume, feculent, style }) =>
      `Papillote de ${proteine}, ${legume} et ${feculent} ${style}`,
    etapes: (c) => [
      'Préchauffez le four à 190 °C.',
      `Faites cuire ${avecArticle(c.feculent)} à part, ${c.feculent.cuisson?.bouilli ?? c.feculent.cuisson?.vapeur ?? 12} minutes.`,
      `Sur une feuille de papier cuisson, posez ${avecArticle(c.legume)} ${c.legume.taille ?? ''}, puis ${avecArticle(c.proteine)}.`,
      `Parsemez de ${listeAromates(c.aromates)}, ajoutez un filet ${c.gras.partitif ?? de(c.gras.nom)}, puis refermez hermétiquement.`,
      `Enfournez ${c.proteine.cuisson?.papillote ?? 15} minutes. Ouvrez la papillote à table : tout le parfum est dedans.`,
    ],
  },
  {
    id: 'mijote',
    moment: 'diner',
    technique: 'mijote',
    typePlat: 'mijote',
    plafond: 95,
    tags: ['batch', 'une-casserole', 'economique'],
    conservation: '4 jours au réfrigérateur, 3 mois au congélateur',
    rechauffage: 'À la casserole à feu doux avec deux cuillères d’eau. Meilleur le lendemain.',
    titre: ({ proteine, legume, feculent, style }) =>
      `Mijoté de ${proteine}, ${legume} et ${feculent} ${style}`,
    etapes: (c) => [
      `Chauffez ${c.gras.defini ?? c.gras.nom.toLowerCase()} dans une cocotte et faites-y colorer ${avecArticle(c.proteine)} ${c.proteine.taille ?? ''} 5 minutes.`,
      `Parfumez avec ${listeAromates(c.aromates)} et laissez le parfum monter, 1 minute.`,
      `Versez ${avecArticle(c.legume)} et ${avecArticle(c.feculent)}, couvrez d’eau à hauteur.`,
      `Laissez mijoter à couvert ${c.minutes - 10} minutes, en remuant de temps en temps.`,
      'Découvrez en fin de cuisson si la sauce est trop liquide, et goûtez avant de saler.',
    ],
  },
  {
    id: 'salade',
    moment: 'dejeuner',
    technique: 'cru',
    typePlat: 'salade',
    froid: true,
    plafond: 80,
    tags: ['sans-cuisson', 'nomade', 'batch'],
    conservation: '2 jours au réfrigérateur, sauce à part',
    rechauffage: 'Se mange froide. Sortez-la 10 minutes avant : au sortir du frigo, rien n’a de goût.',
    // Un pain ou une polenta ne se mangent pas en salade, et « faites cuire le
    // pain complet puis laissez-le refroidir » était le genre de phrase qui
    // décrédibilise tout un catalogue.
    feculents: (b) => ['riz', 'riz-complet', 'quinoa', 'boulgour', 'semoule', 'pates', 'pomme-terre', 'patate-douce', 'haricot-blanc'].includes(b.id),
    gras: (b) => b.froid === true,
    titre: ({ proteine, feculent, legume, style }) =>
      `Salade de ${feculent}, ${proteine} et ${legume} ${style}`,
    etapes: (c) => [
      `Faites cuire ${avecArticle(c.feculent)} puis laissez refroidir complètement : encore tiède, cela ramollirait le reste.`,
      `Coupez ${avecArticle(c.legume)} ${c.legume.taille ?? 'en morceaux'} et ${avecArticle(c.proteine)} ${c.proteine.taille ?? ''}.`,
      `Préparez la sauce : ${c.gras.defini ?? c.gras.nom.toLowerCase()}, ${listeAromates(c.aromates)}, sel et poivre.`,
      'Mélangez le tout au dernier moment pour que rien ne rende son eau.',
    ],
  },
  {
    id: 'bowl',
    moment: 'dejeuner',
    technique: 'vapeur',
    typePlat: 'bowl',
    froid: true,
    plafond: 75,
    tags: ['nomade', 'batch'],
    gras: (b) => b.froid === true,
    conservation: '2 jours au réfrigérateur',
    titre: ({ proteine, legume, feculent, style }) =>
      `Bowl ${proteine}, ${legume} et ${feculent} ${style}`,
    etapes: (c) => [
      `Faites cuire ${avecArticle(c.feculent)}, ${c.feculent.cuisson?.bouilli ?? 12} minutes.`,
      `Cuisez ${avecArticle(c.legume)} à la vapeur ${c.legume.cuisson?.vapeur ?? c.legume.cuisson?.poele ?? 10} minutes : la cuisson doit rester juste, sans jamais s’attendrir complètement.`,
      `Préparez ${avecArticle(c.proteine)} ${c.proteine.taille ?? ''} à la poêle dans ${c.gras.defini ?? c.gras.nom.toLowerCase()}, ${c.proteine.cuisson?.poele ?? 8} minutes.`,
      `Dressez en bol, chaque élément dans son quartier, et finissez par ${listeAromates(c.aromates)}.`,
    ],
  },
  {
    id: 'soupe',
    moment: 'diner',
    technique: 'mijote',
    typePlat: 'soupe',
    plafond: 35,
    tags: ['batch', 'une-casserole', 'economique'],
    conservation: '4 jours au réfrigérateur, 3 mois au congélateur',
    rechauffage: 'À la casserole en remuant. Au micro-ondes en une fois, le centre reste froid.',
    feculents: (b) => ['lentille-primaire', 'pois-casse', 'pomme-terre', 'patate-douce', 'riz', 'haricot-blanc'].includes(b.id),
    titre: ({ legume, feculent, proteine, style }) =>
      `Soupe de ${legume}, ${feculent} et ${proteine} ${style}`,
    etapes: (c) => [
      `Faites suer ${listeAromates(c.aromates)} dans ${c.gras.defini ?? c.gras.nom.toLowerCase()}, 3 minutes.`,
      `Ajoutez ${avecArticle(c.legume)} ${c.legume.taille ?? 'en morceaux'} et ${avecArticle(c.feculent)}.`,
      'Couvrez d’eau à hauteur, portez à ébullition puis baissez le feu.',
      `Laissez cuire ${c.minutes - 8} minutes, jusqu’à ce que tout s’écrase à la fourchette.`,
      `Mixez, ajoutez ${avecArticle(c.proteine)} pour tenir au corps, et servez bien chaud.`,
    ],
  },
  {
    id: 'gratin',
    moment: 'diner',
    technique: 'four',
    typePlat: 'gratin',
    froid: true,
    plafond: 30,
    tags: ['batch', 'plaisir'],
    conservation: '3 jours au réfrigérateur',
    rechauffage: '15 min à 180 °C, à couvert. Au micro-ondes le dessus ramollit.',
    feculents: (b) => ['pomme-terre', 'patate-douce', 'pates', 'polenta'].includes(b.id),
    gras: (b) => ['creme-legere', 'beurre'].includes(b.id),
    titre: ({ legume, proteine, feculent, style }) =>
      `Gratin de ${legume}, ${proteine} et ${feculent} ${style}`,
    etapes: (c) => [
      'Préchauffez le four à 180 °C.',
      `Faites précuire ${avecArticle(c.legume)} ${c.legume.taille ?? ''} ${c.legume.cuisson?.vapeur ?? 12} minutes à la vapeur.`,
      `Mélangez-le avec ${avecArticle(c.proteine)} ${c.proteine.taille ?? ''}, ${c.gras.defini ?? basse(c.gras.nom)} et ${listeAromates(c.aromates)}.`,
      `Versez dans un plat, ajoutez ${avecArticle(c.feculent)} par-dessus.`,
      'Enfournez 25 minutes, jusqu’à ce que le dessus soit doré.',
    ],
  },
  {
    id: 'wok',
    moment: 'dejeuner',
    technique: 'poele',
    typePlat: 'poelee',
    plafond: 40,
    tags: ['rapide', 'une-casserole'],
    styles: ['asiatique'],
    feculents: (b) => ['nouilles', 'riz'].includes(b.id),
    titre: ({ proteine, legume, feculent }) => `Wok de ${proteine}, ${legume} et ${feculent}`,
    etapes: (c) => [
      `Faites tremper ou cuire ${avecArticle(c.feculent)}, ${c.feculent.cuisson?.bouilli ?? 5} minutes, puis égouttez.`,
      `Chauffez ${c.gras.defini ?? c.gras.nom.toLowerCase()} dans un wok à feu vif — c'est le feu vif qui fait toute la différence.`,
      `Saisissez ${avecArticle(c.proteine)} ${c.proteine.taille ?? ''} sans le remuer 2 minutes, pour qu'il dore.`,
      `Ajoutez ${avecArticle(c.legume)} ${c.legume.taille ?? ''}, parfumez avec ${listeAromates(c.aromates)} et poursuivez 5 minutes.`,
      `Mélangez avec ${avecArticle(c.feculent)}, une minute de plus, et servez immédiatement.`,
    ],
  },
  {
    id: 'wrap',
    moment: 'dejeuner',
    technique: 'cru',
    typePlat: 'sandwich',
    froid: true,
    plafond: 25,
    tags: ['rapide', 'nomade', 'sans-cuisson'],
    feculents: (b) => b.id === 'galette-ble',
    gras: (b) => b.froid === true,
    titre: ({ proteine, legume, style }) => `Wrap ${proteine} et ${legume} ${style}`,
    etapes: (c) => [
      `Râpez ou émincez ${avecArticle(c.legume)} finement.`,
      `Étalez ${c.gras.defini ?? c.gras.nom.toLowerCase()} sur ${avecArticle(c.feculent)}, ajoutez ${listeAromates(c.aromates)}.`,
      `Répartissez ${avecArticle(c.proteine)} et les légumes au centre, sans surcharger.`,
      'Roulez serré en rabattant les côtés, coupez en deux en biais.',
    ],
  },
]

function majuscule(mot: string): string {
  return mot.charAt(0).toUpperCase() + mot.slice(1)
}

/**
 * Le nettoyage typographique d'une phrase produite par interpolation.
 *
 * Un champ facultatif absent (`taille`) laisse un espace double, ou un espace
 * avant le point : « et thon au naturel . ». Corriger à un seul endroit vaut
 * mieux que semer des `` dans chaque patron — c'est ce qui
 * était fait, et ça ne traitait qu'une occurrence sur deux.
 */
function phrase(texte: string): string {
  return (
    texte
      .replace(/\s+/g, ' ')
      // Seuls le point et la virgule se collent au mot qui précède. En français,
      // le deux-points, le point-virgule et les signes doubles prennent une
      // espace avant : les avoir inclus ici produisait « 18 minutes: la chair ».
      .replace(/\s+([.,])/g, '$1')
      .trim()
  )
}

/**
 * Les noms propres que `toLowerCase()` abîmait.
 *
 * « Champignons de Paris » devenait « champignons de paris », « piment
 * d'Espelette » perdait son village. Une petite table vaut mieux qu'un champ de
 * plus sur chaque brique : ces noms sont rares et connus d'avance.
 */
const NOMS_PROPRES = ['Paris', 'Bruxelles', 'Espelette', 'Provence']

/** Le nom en minuscules, noms propres préservés. */
function basse(nom: string): string {
  let resultat = nom.toLowerCase()
  for (const propre of NOMS_PROPRES) {
    resultat = resultat.replace(propre.toLowerCase(), propre)
  }
  return resultat
}

/**
 * Les féminins singuliers, pour l'article défini.
 *
 * Le pluriel (« les ») et l'élision devant voyelle (« l' ») se déduisent du nom ;
 * le genre, non — aucune règle ne dit que « semoule » est féminin et « boulgour »
 * masculin. D'où cette liste, écrite à la main une fois pour toutes : sans elle,
 * les étapes disaient « Faites revenir courgettes », qui se remarque à la
 * première lecture.
 */
const FEMININS = new Set([
  'bavette de bœuf',
  'semoule',
  'polenta',
  'patate douce',
  'betterave cuite',
  'courge butternut',
  'salade verte',
  'feta',
  'ricotta',
  'compote sans sucre ajouté',
  'banane',
  'pomme',
  'poire',
  'pêche',
  'confiture allégée',
  'purée de cacahuète',
  'galette de blé complet',
  'crème légère 15 %',
  'orange',
])

/** « les courgettes », « le riz basmati », « l’aubergine », « la semoule ». */
function avecArticle(brique: Brique): string {
  const nom = basse(brique.nom)
  // Le nombre et l'élision se lisent sur le **premier mot** : « pommes de terre »
  // se termine par « terre » et recevait « le pommes de terre ».
  const premier = nom.split(' ')[0]

  if (/(s|x)$/.test(premier)) return `les ${nom}`
  // Ni « y » ni « h » n'élident : « le yaourt », « le houmous ». Les seuls noms
  // en h de ce catalogue sont pluriels (haricots) ou aspirés (houmous).
  if (/^[aeiouàâéèêëîïôöûüœ]/.test(premier)) return `l’${nom}`
  return FEMININS.has(nom) ? `la ${nom}` : `le ${nom}`
}

/** « de » devient « d’ » devant une voyelle : « arrosez d’huile d’olive ». */
function de(nom: string): string {
  const minuscule = nom.toLowerCase()
  return /^[aeiouyàâéèêëîïôöûüh]/.test(minuscule) ? `d’${minuscule}` : `de ${minuscule}`
}

function listeAromates(aromates: Aromate[]): string {
  const noms = aromates.map((a) => basse(a.nom))
  if (noms.length <= 1) return noms[0] ?? 'sel et poivre'
  return `${noms.slice(0, -1).join(', ')} et ${noms.at(-1)}`
}

/* ─────────────────────────── Le petit déjeuner ─────────────────────────── */

/**
 * Les petits déjeuners et collations suivent une combinatoire plus simple : une
 * base, un fruit, une garniture. Les enfermer dans les `FORMATS` ci-dessus
 * aurait demandé des champs « protéine » et « féculent » qui n'ont aucun sens
 * devant un bol de fromage blanc.
 */
function composerMatinEtCollations(): Recette[] {
  const recettes: Recette[] = []

  for (const base of BASES_MATIN) {
    for (const fruit of FRUITS) {
      for (const garniture of GARNITURES_MATIN) {
        const chaud = base.id === 'flocons' || base.id === 'riz-lait'
        const kcal = kcalDeLaBrique(base) + kcalDeLaBrique(fruit) + kcalDeLaBrique(garniture)
        const ingredients = [base, fruit, garniture].map(enIngredient)

        recettes.push({
          id: `c:matin:${base.id}:${fruit.id}:${garniture.id}`,
          titre: phrase(`${majuscule(courtDe(base))}, ${courtDe(fruit)} et ${courtDe(garniture)}`),
          moment: 'petit-dejeuner',
          minutes: chaud ? (base.id === 'riz-lait' ? 25 : 8) : 5,
          kcal,
          couvre: categoriesDe([base, fruit, garniture]),
          tags: chaud ? ['vegetarien', 'economique'] : ['rapide', 'vegetarien', 'sans-cuisson'],
          regimes: regimesCommuns([base, fruit, garniture]),
          ingredients,
          etapes: (chaud
            ? [
                `Faites chauffer ${avecArticle(base)} avec du lait ou de l’eau, ${base.id === 'riz-lait' ? 25 : 5} minutes à feu doux.`,
                `Coupez ${avecArticle(fruit)} en morceaux et ajoutez hors du feu.`,
                `Parsemez ${de(garniture.nom)} au moment de servir.`,
              ]
            : [
                `Versez ${avecArticle(base)} dans un bol.`,
                `Ajoutez ${avecArticle(fruit)} en morceaux.`,
                `Terminez par ${avecArticle(garniture)}.`,
              ]
          ).map(phrase),
        })
      }
    }
  }

  // Collations : deux briques suffisent, et au-delà ce n'est plus une collation.
  for (const base of [...FRUITS, ...BASES_MATIN.filter((b) => b.id.includes('yaourt') || b.id === 'skyr' || b.id === 'fromage-blanc')]) {
    for (const garniture of GARNITURES_MATIN) {
      const kcal = kcalDeLaBrique(base) + kcalDeLaBrique(garniture)
      // Une collation au-delà de 250 kcal n'en est plus une : elle remplace un repas.
      if (kcal < 80 || kcal > 250) continue

      recettes.push({
        id: `c:collation:${base.id}:${garniture.id}`,
        titre: `${majuscule(courtDe(base))} et ${courtDe(garniture)}`,
        moment: 'collation',
        minutes: 2,
        kcal,
        couvre: categoriesDe([base, garniture]),
        tags: ['rapide', 'sans-cuisson', 'vegetarien', 'nomade'],
        regimes: regimesCommuns([base, garniture]),
        ingredients: [base, garniture].map(enIngredient),
        etapes: [
          `Préparez ${avecArticle(base)} dans un bol ou une boîte à emporter.`,
          `Ajoutez ${avecArticle(garniture)} juste avant de manger, pour que ça reste croquant.`,
        ].map(phrase),
      })
    }
  }

  // Tartines salées : le petit déjeuner de ceux qui n'aiment pas le sucré.
  for (const garniture of GARNITURES_SALEES) {
    for (const legume of LEGUMES.filter((l) => l.cuisson?.cru === 0)) {
      const pain = BASES_MATIN.find((b) => b.id === 'pain-matin')!
      const kcal = kcalDeLaBrique(pain) + kcalDeLaBrique(garniture) + kcalDeLaBrique(legume)

      recettes.push({
        id: `c:tartine:${garniture.id}:${legume.id}`,
        titre: `Tartines ${courtDe(garniture)} et ${courtDe(legume)}`,
        moment: 'petit-dejeuner',
        minutes: 6,
        kcal,
        couvre: categoriesDe([pain, garniture, legume]),
        tags: ['rapide', 'sans-cuisson'],
        regimes: regimesCommuns([pain, garniture, legume]),
        ingredients: [pain, garniture, legume].map(enIngredient),
        etapes: [
          'Faites griller le pain : une tartine molle s’effondre sous la garniture.',
          `Étalez ${avecArticle(garniture)} en couche généreuse.`,
          `Ajoutez ${avecArticle(legume)} ${legume.taille ?? 'en fines tranches'}, salez, poivrez.`,
        ].map(phrase),
      })
    }
  }

  return recettes
}

/* ──────────────────────────── L'assemblage ──────────────────────────── */

function enIngredient(brique: Brique): Ingredient {
  return {
    nom: brique.nom,
    // Des œufs se comptent, ils ne se pèsent pas : « 110 g Œufs » est juste mais
    // ne se lit pas devant un frigo.
    quantite: brique.unite ?? `${brique.g} g`,
    rayon: brique.rayon,
  }
}

function categoriesDe(briques: Brique[]): Categorie[] {
  const categories = new Set<Categorie>()
  for (const brique of briques) {
    if (PROTEINES.includes(brique)) categories.add('proteine')
    else if (FECULENTS.includes(brique) || BASES_MATIN.includes(brique)) categories.add('feculent')
    else if (LEGUMES.includes(brique)) categories.add('legume')
    else if (FRUITS.includes(brique)) categories.add('fruit')
    else if (GRAS.includes(brique)) categories.add('matiere-grasse')
    else if (GARNITURES_MATIN.includes(brique) || GARNITURES_SALEES.includes(brique)) {
      categories.add(brique.v[1] > 8 ? 'proteine' : 'matiere-grasse')
    }
  }
  return [...categories]
}

const CUISINES_COMPOSEES: Cuisine[] = [
  'francaise',
  'mediterraneenne',
  'italienne',
  'orientale',
  'asiatique',
  'indienne',
  'mexicaine',
  'nordique',
]

/**
 * Les styles historiques, dérivés des cuisines.
 *
 * Leur `id` **est** le nom de la cuisine, à l'identique de ce qui existait avant
 * l'arrivée des styles régionaux : c'est ce qui garantit que les identifiants de
 * recettes déjà enregistrés dans un favori ou un plan de menus résolvent encore.
 */
const STYLES_CUISINE: Style[] = CUISINES_COMPOSEES.map((cuisine) => ({
  id: cuisine,
  cuisine,
  tournure: TOURNURE[cuisine],
  tournureFroide: TOURNURE_FROIDE[cuisine],
}))

/** Un aromate régional, écrit en clair — mêmes champs que ceux de `briques.ts`. */
function aromate(nom: string, quantite: string): Aromate {
  return { nom, quantite, rayon: nom === 'Ail' || nom.includes('frais') ? 'Fruits et légumes' : 'Épicerie' }
}

/**
 * Les styles régionaux français.
 *
 * Ils portent `cuisine: 'francaise'` — c'est cette valeur qui filtre les briques,
 * et aucune brique n'a eu besoin d'être réécrite — mais leur propre `region`,
 * leurs aromates et leurs tournures. Un « poulet à la provençale » et un « poulet
 * façon bistrot » partent des mêmes ingrédients et n'ont ni le même parfum ni le
 * même nom, ce qui est exactement ce qu'on voulait offrir au filtre par terroir.
 *
 * Ce ne sont **pas** des plats nommés : la basquaise composée ici n'est pas la
 * recette du poulet basquaise, qui est écrite à la main dans `terroir/sud.ts`.
 * Une combinatoire donne des variations correctes, jamais un plat emblématique.
 */
const STYLES_REGIONAUX: Style[] = [
  {
    id: 'provencale',
    cuisine: 'francaise',
    region: 'provence',
    tournure: 'à la provençale',
    tournureFroide: 'à l’huile d’olive et au basilic',
    gouts: ['herbace'],
    part: 0.35,
    aromates: [aromate('Ail', '2 gousses'), aromate('Thym', '1 branche'), aromate('Herbes de Provence', '1 CàC')],
  },
  {
    id: 'basquaise',
    cuisine: 'francaise',
    region: 'pays-basque',
    tournure: 'à la basquaise',
    tournureFroide: 'au piment d’Espelette',
    gouts: ['epice'],
    part: 0.35,
    aromates: [aromate('Piment d’Espelette', '1 pincée'), aromate('Ail', '1 gousse'), aromate('Paprika', '1 CàC')],
  },
  {
    id: 'normande',
    cuisine: 'francaise',
    region: 'normandie',
    tournure: 'à la normande',
    tournureFroide: 'à la crème et aux pommes',
    gouts: ['doux', 'acidule'],
    part: 0.35,
    aromates: [aromate('Cidre brut', '5 cl'), aromate('Estragon', 'quelques feuilles')],
  },
  {
    id: 'savoyarde',
    cuisine: 'francaise',
    region: 'savoie',
    tournure: 'à la savoyarde',
    tournureFroide: 'aux noix et au comté',
    gouts: ['doux'],
    part: 0.35,
    aromates: [aromate('Ail', '1 gousse'), aromate('Noix de muscade', '1 pincée')],
  },
  {
    id: 'flamande',
    cuisine: 'francaise',
    region: 'nord',
    tournure: 'à la flamande',
    tournureFroide: 'à la moutarde et aux cornichons',
    gouts: ['sucre-sale'],
    part: 0.35,
    aromates: [aromate('Moutarde', '1 CàS'), aromate('Laurier', '1 feuille'), aromate('Cassonade', '1 CàC')],
  },
  {
    id: 'lyonnaise',
    cuisine: 'francaise',
    region: 'lyonnais',
    tournure: 'à la lyonnaise',
    tournureFroide: 'à l’échalote et au vinaigre',
    gouts: ['acidule'],
    part: 0.35,
    aromates: [aromate('Échalotes', '2'), aromate('Persil', 'quelques brins')],
  },
  {
    id: 'alsacienne',
    cuisine: 'francaise',
    region: 'alsace',
    tournure: 'à l’alsacienne',
    tournureFroide: 'au cumin et à la crème',
    gouts: ['fume'],
    part: 0.35,
    aromates: [aromate('Cumin', '1 CàC'), aromate('Baies de genièvre', '4'), aromate('Laurier', '1 feuille')],
  },
  {
    id: 'bretonne',
    cuisine: 'francaise',
    region: 'bretagne',
    tournure: 'à la bretonne',
    tournureFroide: 'au beurre demi-sel',
    gouts: ['doux'],
    part: 0.35,
    aromates: [aromate('Ciboulette', 'quelques brins'), aromate('Échalotes', '2')],
  },
  {
    id: 'perigourdine',
    cuisine: 'francaise',
    region: 'sud-ouest',
    tournure: 'à la périgourdine',
    tournureFroide: 'aux noix et au persil',
    gouts: ['doux'],
    part: 0.35,
    aromates: [aromate('Ail', '2 gousses'), aromate('Persil', '1 petit bouquet')],
  },
  {
    id: 'auvergnate',
    cuisine: 'francaise',
    region: 'auvergne',
    tournure: 'à l’auvergnate',
    tournureFroide: 'au bleu et aux noix',
    gouts: ['doux'],
    part: 0.35,
    aromates: [aromate('Thym', '1 branche'), aromate('Ail', '1 gousse')],
  },
]

/**
 * L'ordre n'est pas indifférent : les styles régionaux viennent **après** les
 * historiques. La graine de sélection des aromates avance au fil des styles, et
 * les insérer avant aurait décalé les aromates de tout le catalogue existant —
 * les identifiants seraient restés valides, mais le contenu des recettes déjà
 * mises en favori aurait changé sous les yeux de leur propriétaire.
 */
const STYLES: Style[] = [...STYLES_CUISINE, ...STYLES_REGIONAUX]

/** Les aromates d'un style, plafonnés : au-delà de trois, c'est un placard. */
function aromatesDe(style: Style, graine: number): Aromate[] {
  if (style.aromates) return style.aromates

  const candidats = AROMATES.filter((a) => a.styles?.includes(style.cuisine))
  const communs = AROMATES.filter((a) => a.styles === undefined)
  const choisis: Aromate[] = []

  // Sélection déterministe : on avance d'un pas dépendant de la graine, sans
  // jamais tirer au hasard — un identifiant stable en dépend.
  for (let i = 0; i < Math.min(2, candidats.length); i++) {
    choisis.push(candidats[(graine + i * 3) % candidats.length])
  }
  choisis.push(communs[graine % communs.length])

  return [...new Map(choisis.map((a) => [a.nom, a])).values()]
}

function composerPlats(): Recette[] {
  const recettes: Recette[] = []

  for (const format of FORMATS) {
    let graine = 0

    // Un format restreint à des cuisines (le wok est asiatique) ne prend que les
    // styles qui en relèvent : un « wok à la normande » n'existe pas.
    const stylesDuFormat = format.styles
      ? STYLES.filter((s) => format.styles?.includes(s.cuisine))
      : STYLES

    for (const style of stylesDuFormat) {
      // Le plafond se remet à zéro à chaque style : global, il remplissait tout
      // le quota avec la première cuisine énumérée et le catalogue n'avait plus
      // qu'un seul pays.
      let produites = 0
      const plafond = Math.round(format.plafond * (style.part ?? 1))

      const proteines = PROTEINES.filter(
        (p) => vaAvec(p, style.cuisine) && p.cuisson?.[format.technique] !== undefined,
      )
      const feculents = FECULENTS.filter(
        (f) => vaAvec(f, style.cuisine) && (format.feculents?.(f) ?? true),
      )
      const legumes = LEGUMES.filter(
        (l) => vaAvec(l, style.cuisine) && l.cuisson?.[format.technique] !== undefined,
      )
      const gras = GRAS.filter((g) => vaAvec(g, style.cuisine) && (format.gras?.(g) ?? true))
      if (gras.length === 0 || feculents.length === 0) continue

      for (const proteine of proteines) {
        for (const feculent of feculents) {
          for (const legume of legumes) {
            if (produites >= plafond) break
            graine++

            const matiere = gras[graine % gras.length]
            const aromates = aromatesDe(style, graine)
            const minutes = dureeDuPlat(format, proteine, feculent, legume)

            const briques = [proteine, feculent, legume, matiere]
            const kcal = briques.reduce((somme, b) => somme + kcalDeLaBrique(b), 0)

            // Un plat hors de toute cible calorique raisonnable n'intéresse
            // personne : ni le planificateur, ni la personne qui le lira.
            if (kcal < 300 || kcal > 800) continue

            const noms = {
              proteine: courtDe(proteine),
              feculent: courtDe(feculent),
              legume: courtDe(legume),
              style: format.froid ? style.tournureFroide : style.tournure,
            }

            const composition: Composition = {
              proteine,
              feculent,
              legume,
              gras: matiere,
              aromates,
              style,
              minutes,
            }

            // Les étapes sont calculées à la **première lecture** et non à la
            // génération : construire cinq phrases pour 5 500 recettes coûtait
            // l'essentiel du temps de démarrage, alors qu'un écran de liste
            // n'affiche que des titres. Le résultat est mémoïsé — le mode cuisine
            // relit `etapes` à chaque étape franchie.
            let etapesCalculees: string[] | null = null

            recettes.push({
              id: `c:${format.id}:${proteine.id}:${feculent.id}:${legume.id}:${style.id}`,
              titre: format.titre(noms),
              moment: format.moment,
              minutes,
              kcal,
              couvre: categoriesDe(briques),
              tags: tagsDuPlat(format, minutes),
              cuisine: style.cuisine,
              region: style.region,
              gouts: style.gouts,
              typePlat: format.typePlat,
              regimes: regimesCommuns([...briques, ...aromates]),
              ingredients: [
                ...briques.map(enIngredient),
                ...aromates.map((a) => ({ nom: a.nom, quantite: a.quantite, rayon: a.rayon })),
              ],
              get etapes() {
                return (etapesCalculees ??= format.etapes(composition).map(phrase))
              },
              conservation: format.conservation,
              rechauffage: format.rechauffage,
            })
            produites++
          }
        }
      }
    }
  }

  return recettes
}

/** Le temps du plat : la cuisson la plus longue commande, les autres s'y glissent. */
function dureeDuPlat(format: Format, ...briques: Brique[]): number {
  const temps = briques.map((b) => b.cuisson?.[format.technique] ?? b.cuisson?.bouilli ?? 10)
  const plusLongue = Math.max(...temps)
  // Dix minutes de préparation en plus : éplucher et couper prend du temps, et
  // annoncer la seule cuisson ferait rater tous les dîners de semaine.
  return plusLongue + 10
}

function tagsDuPlat(format: Format, minutes: number): Tag[] {
  const tags = new Set<Tag>(format.tags)
  if (minutes <= 15) tags.add('rapide')
  return [...tags]
}

/* ────────────────────────── L'accès au catalogue ────────────────────────── */

let cache: Recette[] | null = null

/**
 * Le catalogue composé, calculé une fois puis gardé.
 *
 * Paresseux à dessein : un écran qui n'affiche que le journal alimentaire n'a
 * aucune raison de payer la génération. Le premier accès la déclenche, les
 * suivants lisent le cache.
 */
export function recettesComposees(): Recette[] {
  if (cache === null) cache = [...composerPlats(), ...composerMatinEtCollations()]
  return cache
}

/** Vrai pour les recettes issues du générateur — l'écran peut le dire. */
export function estComposee(id: string): boolean {
  return id.startsWith('c:')
}
