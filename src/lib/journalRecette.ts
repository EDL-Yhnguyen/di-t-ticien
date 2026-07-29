import type { Recette } from './recettes'
import type { Aliment, Categorie, EntreeJournal, Moment, ValeursPour100 } from './types'

/**
 * Verser une recette au journal alimentaire.
 *
 * Le catalogue ne connaît que les calories d'une recette : personne n'a pesé
 * ses macros. Or le journal raisonne en `ValeursPour100`. Ce module comble
 * l'écart par une **répartition type**, calculée à partir de ce que la recette
 * déclare couvrir dans l'assiette.
 *
 * C'est une estimation, et elle est présentée comme telle à l'écran. Elle est
 * bien meilleure que l'alternative — enregistrer un plat à 500 kcal avec zéro
 * gramme de protéines fausserait les barres de macros et les analyses du jour,
 * silencieusement. Mieux vaut un ordre de grandeur assumé qu'un zéro faux.
 *
 * Pour la même raison, **aucun Nutri-Score n'est calculé ici** : une note de
 * qualité assise sur des macros elles-mêmes estimées donnerait à l'ensemble une
 * autorité qu'il n'a pas.
 */

/** Part des calories apportée par les protéines, les glucides et les lipides. */
interface Repartition {
  proteines: number
  glucides: number
  lipides: number
}

/**
 * Une répartition par catégorie de l'assiette. Ce sont les ordres de grandeur
 * usuels des tables de composition, pas des mesures : une viande apporte
 * l'essentiel de ses calories en protéines et en gras, un féculent en glucides.
 */
const REPARTITION: Record<Categorie, Repartition> = {
  proteine: { proteines: 0.55, glucides: 0.05, lipides: 0.4 },
  feculent: { proteines: 0.12, glucides: 0.78, lipides: 0.1 },
  legume: { proteines: 0.2, glucides: 0.6, lipides: 0.2 },
  laitier: { proteines: 0.25, glucides: 0.35, lipides: 0.4 },
  fruit: { proteines: 0.05, glucides: 0.9, lipides: 0.05 },
  'matiere-grasse': { proteines: 0, glucides: 0, lipides: 1 },
  boisson: { proteines: 0.1, glucides: 0.8, lipides: 0.1 },
}

/** Faute de catégorie déclarée, une répartition de plat composé. */
const REPARTITION_PAR_DEFAUT: Repartition = { proteines: 0.2, glucides: 0.5, lipides: 0.3 }

/** Fibres apportées par une portion, en grammes, selon ce que la recette couvre. */
const FIBRES: Partial<Record<Categorie, number>> = { legume: 3, fruit: 2, feculent: 2 }

/**
 * Densité énergétique typique d'une portion, en kcal par gramme.
 *
 * Elle ne sert qu'à donner un poids vraisemblable à la portion : le journal
 * affiche des grammes, et écrire « 100 g » devant une assiette complète serait
 * faux. Un plat avec des légumes est moins dense qu'un en-cas.
 */
const DENSITE: Record<Moment, number> = {
  'petit-dejeuner': 1.4,
  dejeuner: 1.2,
  collation: 2,
  diner: 1.2,
}

/** Poids estimé d'une portion, arrondi à la dizaine. */
export function portionDeLaRecette(recette: Recette): number {
  const brut = recette.kcal / DENSITE[recette.moment]
  return Math.min(700, Math.max(80, Math.round(brut / 10) * 10))
}

function moyenne(recette: Recette): Repartition {
  if (recette.couvre.length === 0) return REPARTITION_PAR_DEFAUT

  const somme = recette.couvre.reduce<Repartition>(
    (acc, categorie) => {
      const r = REPARTITION[categorie]
      return {
        proteines: acc.proteines + r.proteines,
        glucides: acc.glucides + r.glucides,
        lipides: acc.lipides + r.lipides,
      }
    },
    { proteines: 0, glucides: 0, lipides: 0 },
  )

  const n = recette.couvre.length
  return {
    proteines: somme.proteines / n,
    glucides: somme.glucides / n,
    lipides: somme.lipides / n,
  }
}

/** Les valeurs pour 100 g d'une recette, déduites de sa portion estimée. */
export function valeursDeLaRecette(recette: Recette): ValeursPour100 {
  const portionG = portionDeLaRecette(recette)
  const part = moyenne(recette)
  const couvre = new Set(recette.couvre)

  // Grammes dans la portion entière : 4 kcal par gramme de protéine ou de
  // glucide, 9 pour un gramme de lipide.
  const proteines = (recette.kcal * part.proteines) / 4
  const glucides = (recette.kcal * part.glucides) / 4
  const lipides = (recette.kcal * part.lipides) / 9

  const fibres = recette.couvre.reduce((s, c) => s + (FIBRES[c] ?? 0), 0)

  // Le sucre d'un dessert de fruits n'est pas celui d'un plat de légumes.
  const partSucres = couvre.has('fruit') ? 0.6 : couvre.has('laitier') ? 0.3 : 0.12
  // Un laitier tire les acides gras saturés vers le haut.
  const partSatures = couvre.has('laitier') ? 0.5 : 0.35
  // Un repas salé apporte plus de sel qu'un petit déjeuner ou une collation.
  const sel =
    recette.kcal * (recette.moment === 'dejeuner' || recette.moment === 'diner' ? 0.0025 : 0.001)

  const pour100 = (valeur: number) => Math.round(((valeur * 100) / portionG) * 10) / 10

  return {
    kcal: Math.round((recette.kcal * 100) / portionG),
    proteines: pour100(proteines),
    glucides: pour100(glucides),
    sucres: pour100(glucides * partSucres),
    lipides: pour100(lipides),
    satures: pour100(lipides * partSatures),
    fibres: pour100(fibres),
    sel: pour100(sel),
  }
}

export function alimentDeLaRecette(recette: Recette): Aliment {
  const couvre = new Set(recette.couvre)
  // La part de fruits et légumes n'entre dans aucun calcul ici — pas de
  // Nutri-Score — mais elle reste juste à renseigner si l'un arrive un jour.
  const vegetal = couvre.has('legume') || couvre.has('fruit')

  return {
    id: `recette:${recette.id}`,
    nom: recette.titre,
    famille: 'general',
    valeurs: valeursDeLaRecette(recette),
    partFruitsLegumes: vegetal ? 40 : 0,
    portionG: portionDeLaRecette(recette),
    portionLibelle: '1 portion',
    source: 'recette',
  }
}

/**
 * L'entrée à pousser dans `journal`. Le moment est celui de la recette par
 * défaut, mais rien n'empêche de manger une soupe au petit déjeuner.
 */
export function entreeDeLaRecette(
  recette: Recette,
  p: { date: string; moment?: Moment; quantiteG?: number },
): EntreeJournal {
  return {
    id: `entree:${Date.now()}:${recette.id}`,
    date: p.date,
    moment: p.moment ?? recette.moment,
    horodatage: new Date().toISOString(),
    aliment: alimentDeLaRecette(recette),
    quantiteG: p.quantiteG ?? portionDeLaRecette(recette),
  }
}
