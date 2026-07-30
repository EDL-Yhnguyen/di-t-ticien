import { multiplierQuantite } from './ingredients'
import { portionDeLaRecette, valeursDeLaRecette } from './journalRecette'
import { catalogue } from './recettes'
import type { Cuisine, Difficulte, Ingredient, Recette, Regime, Tag } from './recettes'
import type { Moment } from './types'

/**
 * Lire le catalogue : ce qui se déduit d'une recette, et comment on la cherche.
 *
 * Rien n'est stocké ici. Le catalogue reste une donnée écrite à la main dans
 * `lib/recettes/`, et ce module en tire ce qui peut se calculer — la difficulté,
 * les macros d'une portion, les quantités pour quatre — plutôt que de demander
 * cinquante-trois champs de plus à qui ajoute une recette.
 */

/* ─────────────────────────────── Difficulté ─────────────────────────────── */

/**
 * La difficulté, déduite du nombre d'étapes et du temps quand elle n'est pas
 * écrite.
 *
 * Ce ne sont pas les mêmes choses : « facile » veut dire *peu de gestes*, pas
 * *rapide*. Un riz au lait demande trente minutes et trois gestes — il est
 * facile et lent, et une recette qui prétendrait l'inverse ferait renoncer
 * quelqu'un qui a le temps mais pas la technique. D'où deux critères, et un
 * champ `difficulte` qui prime toujours sur eux.
 */
export function difficulteDe(recette: Recette): Difficulte {
  if (recette.difficulte) return recette.difficulte
  const gestes = recette.etapes.length
  if (gestes <= 3 && recette.minutes <= 20) return 'facile'
  if (gestes >= 6 || recette.minutes >= 40) return 'technique'
  return 'intermediaire'
}

/* ─────────────────────────────── Régimes ─────────────────────────────── */

/**
 * Les régimes d'une recette.
 *
 * « Végétarien » se lit sur le tag qui existait déjà — c'est la seule déduction
 * qu'on s'autorise, parce qu'elle ne porte aucun risque : se tromper fait
 * proposer un plat de trop, pas rendre malade. Tout le reste vient de `regimes`,
 * écrit à la main. Voir le commentaire du type `Regime`.
 *
 * « Végétalien » implique « végétarien » : ne pas le déduire ferait disparaître
 * un chili de haricots rouges d'un filtre végétarien.
 */
export function regimesDe(recette: Recette): Regime[] {
  const regimes = new Set<Regime>(recette.regimes ?? [])
  if (recette.tags.includes('vegetarien')) regimes.add('vegetarien')
  if (regimes.has('vegan')) regimes.add('vegetarien')
  // Ordre fixe : sans lui, l'affichage suit l'ordre de saisie et « végétarien »,
  // ajouté par déduction, se retrouvait en queue derrière « sans lactose ».
  return ORDRE_REGIMES.filter((r) => regimes.has(r))
}

const ORDRE_REGIMES: Regime[] = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose']

/**
 * Les régimes à **montrer** : « végétalien » sous-entend « végétarien », et
 * afficher les deux prend une ligne pour ne rien dire de plus. La déduction, elle,
 * reste entière côté filtre — un filtre végétarien doit trouver le chili.
 */
export function regimesAAfficher(recette: Recette): Regime[] {
  const regimes = regimesDe(recette)
  return regimes.includes('vegan') ? regimes.filter((r) => r !== 'vegetarien') : regimes
}

/**
 * Vrai quand le régime demandé est **garanti** par la recette.
 *
 * L'absence d'information n'est pas une réponse négative, mais elle se traite
 * comme telle dans un filtre : mieux vaut cacher un plat qui aurait convenu que
 * d'en proposer un qui ne convient pas.
 */
export function respecte(recette: Recette, regime: Regime): boolean {
  return regimesDe(recette).includes(regime)
}

/* ────────────────────────── Cuisiner pour plusieurs ────────────────────────── */

/**
 * Les ingrédients recalculés pour un nombre de convives.
 *
 * Le catalogue est écrit pour une personne — voir le commentaire de `Recette` à
 * propos de `portions`. Multiplier les quantités est donc un calcul
 * d'affichage : **`kcal` ne bouge pas**, il reste ce que mange une personne, et
 * l'écran doit dire « par personne » pour que le chiffre garde son sens.
 */
export function ingredientsPour(recette: Recette, convives: number): Ingredient[] {
  if (convives === 1) return recette.ingredients
  return recette.ingredients.map((i) => ({
    ...i,
    quantite: multiplierQuantite(i.quantite, convives),
  }))
}

/* ─────────────────────────── Nutriments d'une part ─────────────────────────── */

export interface MacrosPortion {
  proteines: number
  glucides: number
  lipides: number
  fibres: number
  /** Poids vraisemblable de la part, en grammes. */
  poidsG: number
}

/**
 * Les macros d'une portion — **une estimation, à afficher comme telle**.
 *
 * Le catalogue ne connaît que les calories : personne n'a pesé les macros de
 * ces plats. On réemploie donc la répartition type de `journalRecette.ts`, celle
 * qui sert déjà à verser une recette au journal, plutôt que d'écrire à côté un
 * second jeu de chiffres qui la contredirait. Aucun Nutri-Score n'en est tiré,
 * pour la raison déjà posée là-bas : une note de qualité assise sur des macros
 * estimées se donnerait une autorité qu'elle n'a pas.
 */
export function macrosPortion(recette: Recette): MacrosPortion {
  const poidsG = portionDeLaRecette(recette)
  const pour100 = valeursDeLaRecette(recette)
  const part = poidsG / 100

  return {
    proteines: Math.round(pour100.proteines * part),
    glucides: Math.round(pour100.glucides * part),
    lipides: Math.round(pour100.lipides * part),
    fibres: Math.round(pour100.fibres * part),
    poidsG,
  }
}

/* ─────────────────────────────── Illustration ─────────────────────────────── */

/**
 * L'image d'une recette, faute de photo.
 *
 * Il n'existe aucune banque d'images libre couvrant ce catalogue, et une photo
 * d'emprunt promettrait un plat qu'on n'obtiendra pas. Un cadre vide, lui, donne
 * l'impression d'une application inachevée. D'où une illustration **générée** :
 * un dégradé pris dans la palette et un pictogramme tiré de ce que la recette
 * couvre dans l'assiette.
 *
 * Le tirage est déterministe : la même recette a toujours la même illustration,
 * sinon la liste changerait de visage à chaque affichage et on ne
 * reconnaîtrait plus un plat déjà vu.
 */
export interface Illustration {
  emoji: string
  /** Classe du lavis de fond, prise dans la palette. */
  fond: string
}

/**
 * Le pictogramme se lit **dans le contenu du plat**, jamais tiré au sort.
 *
 * Le premier jet piochait au hasard dans la catégorie « protéine » : le chili
 * végétarien s'est affiché avec un poisson et les œufs brouillés avec un steak.
 * Une vignette fausse est pire que pas de vignette — elle décrit un plat qui
 * n'est pas celui qu'on va manger. D'où cette table, appliquée au titre puis aux
 * ingrédients, dans cet ordre : le titre dit le plat (« soupe », « gratin »),
 * les ingrédients disent la matière.
 */
const PICTOGRAMMES: [RegExp, string][] = [
  // Le plat, tel qu'on le nomme.
  [/chili/i, '🌶'],
  [/curry/i, '🍛'],
  [/soupe/i, '🍲'],
  [/wrap/i, '🌯'],
  [/gratin/i, '🧀'],
  [/omelette|brouill/i, '🍳'],
  [/porridge|muesli|flocon|smoothie/i, '🥣'],
  [/crêpe|galette/i, '🥞'],
  [/salade/i, '🥗'],
  [/pain perdu|tartine/i, '🍞'],
  [/riz au lait/i, '🍚'],
  // La matière, quand le titre ne suffit pas.
  [/crevette/i, '🍤'],
  [/saumon|cabillaud|merlan|maquereau|thon|poisson/i, '🐟'],
  [/poulet|dinde|volaille/i, '🍗'],
  [/bœuf|boeuf|steak|bavette/i, '🥩'],
  [/jambon|porc/i, '🍖'],
  [/œuf|oeuf/i, '🥚'],
  [/tofu/i, '🌱'],
  [/pois chiche|lentille|haricot|houmous/i, '🫘'],
  [/pâte|nouille/i, '🍝'],
  [/riz|boulgour|semoule|quinoa/i, '🍚'],
  [/pomme de terre|patate/i, '🥔'],
  [/brocoli|chou-fleur|épinard/i, '🥦'],
  [/courgette|concombre/i, '🥒'],
  [/courge|potiron/i, '🎃'],
  [/carotte|céleri/i, '🥕'],
  [/champignon/i, '🍄'],
  [/avocat/i, '🥑'],
  [/chocolat/i, '🍫'],
  [/amande|noix|cacahuète/i, '🌰'],
  [/banane/i, '🍌'],
  [/poire/i, '🍐'],
  [/fraise|fruits rouges/i, '🍓'],
  [/pomme|compote/i, '🍎'],
  [/figue/i, '🍇'],
  [/yaourt|fromage|ricotta|feta|lait/i, '🥛'],
  [/pain/i, '🍞'],
]

/** Faute de mot reconnu, ce que dit le moment de la journée. */
const EMOJI_MOMENT: Record<Moment, string> = {
  'petit-dejeuner': '🥣',
  dejeuner: '🍽',
  collation: '🍏',
  diner: '🥗',
}

/** Un lavis uni, pas un dégradé entre deux teintes : en thème sombre, mêler
 * deux lavis donnait un vert-brun boueux qui ne ressemblait à aucune couleur de
 * la palette. */
const FONDS = ['bg-corail-wash', 'bg-apricot-wash', 'bg-basil-wash', 'bg-berry-wash']

/** Somme des caractères : suffisant pour répartir, et stable d'une session à l'autre. */
function empreinte(texte: string): number {
  let somme = 0
  for (let i = 0; i < texte.length; i++) somme = (somme + texte.charCodeAt(i) * (i + 1)) % 9973
  return somme
}

const illustrationsMemoisees = new Map<string, Illustration>()

/**
 * Mémoïsée par identifiant : une liste de soixante-douze lignes recalculait
 * autant de fois les vingt-cinq expressions de `PICTOGRAMMES` contre le titre et
 * les ingrédients, à chaque rendu — y compris quand on déplie la liste.
 */
export function illustrationDe(recette: Recette): Illustration {
  const connue = illustrationsMemoisees.get(recette.id)
  if (connue) return connue
  const calculee = calculerIllustration(recette)
  illustrationsMemoisees.set(recette.id, calculee)
  return calculee
}

function calculerIllustration(recette: Recette): Illustration {
  // Le titre d'abord, les ingrédients ensuite — et non les deux d'un bloc, sinon
  // c'est l'ordre de la table qui tranche : « Papillote de dinde aux poireaux »
  // recevait un poisson, parce que « papillote » venait avant « dinde ».
  const dansLeTitre = PICTOGRAMMES.find(([motif]) => motif.test(recette.titre))
  const dansLesIngredients = PICTOGRAMMES.find(([motif]) =>
    recette.ingredients.some((i) => motif.test(i.nom)),
  )

  return {
    emoji: (dansLeTitre ?? dansLesIngredients)?.[1] ?? EMOJI_MOMENT[recette.moment],
    // Le fond, lui, peut être tiré de l'identifiant : une couleur ne prétend
    // rien sur le contenu, elle ne sert qu'à distinguer deux lignes voisines.
    fond: FONDS[empreinte(recette.id) % FONDS.length],
  }
}

/* ─────────────────────────── Recherche multicritère ─────────────────────────── */

export interface Criteres {
  /** Cherché dans le titre **et** dans les ingrédients. */
  texte?: string
  moment?: Moment | null
  cuisine?: Cuisine | null
  difficulte?: Difficulte | null
  tags?: Tag[]
  regimes?: Regime[]
  /** Borne haute du temps de préparation, en minutes. */
  minutesMax?: number | null
  /** Restreint aux identifiants donnés — sert au filtre « mes favoris ». */
  parmi?: string[] | null
}

/**
 * Normalisation de la recherche texte : sans accents ni casse.
 *
 * Personne ne tape « poêlée » avec son accent circonflexe dans un champ de
 * recherche, et exiger l'accent ferait répondre « aucun résultat » à quelqu'un
 * qui regarde le plat à l'écran.
 */
function sansAccent(texte: string): string {
  // Même méthode que `ingredients.ts` : la décomposition NFD détache l'accent de
  // sa lettre, et le filtre qui ne garde que a-z0-9 et l'espace l'emporte avec
  // la ponctuation — sans avoir à écrire une plage de signes diacritiques qu'un
  // outil mal encodé abîmerait. La ligature « œ » ne se décompose pas, d'où la
  // première ligne : « œuf » se cherche en tapant « oeuf ».
  return texte
    .replace(/œ/gi, 'oe')
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
}

/**
 * Le texte cherchable d'une recette, calculé une fois par recette.
 *
 * Sans ce cache, chaque frappe normalisait le titre et les sept ingrédients de
 * cinq mille recettes — quarante mille passages de regex par caractère tapé.
 * Mesuré à une trentaine de millisecondes sur une machine de bureau, donc trois
 * à cinq fois plus sur un téléphone : la frappe commençait à traîner.
 *
 * Une `Map` par identifiant plutôt qu'un champ sur la recette : le catalogue
 * composé est régénérable, et on ne veut pas que le cache survive à sa recette.
 */
const cherchable = new Map<string, string>()

function texteCherchable(recette: Recette): string {
  let texte = cherchable.get(recette.id)
  if (texte === undefined) {
    texte = sansAccent(`${recette.titre} ${recette.ingredients.map((i) => i.nom).join(' ')}`)
    cherchable.set(recette.id, texte)
  }
  return texte
}

/**
 * Les critères se **cumulent** : cocher « rapide » et « sans gluten » ne montre
 * que ce qui est les deux à la fois. C'est la règle déjà en place pour les
 * étiquettes, étendue au reste — un filtre qui élargit au fur et à mesure qu'on
 * précise sa demande serait incompréhensible.
 *
 * L'ordre des tests n'est pas indifférent : les comparaisons d'égalité passent
 * avant la recherche texte, la plus coûteuse, pour qu'elle ne s'exécute que sur
 * ce qui a survécu au reste.
 */
export function rechercher(criteres: Criteres, recettes: Recette[] = catalogue()): Recette[] {
  const texte = criteres.texte ? sansAccent(criteres.texte.trim()) : ''

  return recettes.filter((recette) => {
    if (criteres.parmi && !criteres.parmi.includes(recette.id)) return false
    if (criteres.moment && recette.moment !== criteres.moment) return false
    if (criteres.cuisine && recette.cuisine !== criteres.cuisine) return false
    if (criteres.difficulte && difficulteDe(recette) !== criteres.difficulte) return false
    if (criteres.minutesMax && recette.minutes > criteres.minutesMax) return false
    if (criteres.tags?.some((tag) => !recette.tags.includes(tag))) return false
    if (criteres.regimes?.some((regime) => !respecte(recette, regime))) return false

    if (texte && !texteCherchable(recette).includes(texte)) return false

    return true
  })
}

/** Combien de critères sont actifs — de quoi annoncer « 3 filtres » sur le bouton. */
export function nombreDeCriteres(criteres: Criteres): number {
  return (
    (criteres.texte?.trim() ? 1 : 0) +
    (criteres.moment ? 1 : 0) +
    (criteres.cuisine ? 1 : 0) +
    (criteres.difficulte ? 1 : 0) +
    (criteres.minutesMax ? 1 : 0) +
    (criteres.parmi ? 1 : 0) +
    (criteres.tags?.length ?? 0) +
    (criteres.regimes?.length ?? 0)
  )
}

/** Les cuisines réellement représentées dans le catalogue, dans l'ordre du nom. */
export function cuisinesDuCatalogue(recettes: Recette[] = catalogue()): Cuisine[] {
  const vues = new Set<Cuisine>()
  for (const r of recettes) if (r.cuisine) vues.add(r.cuisine)
  return [...vues]
}
