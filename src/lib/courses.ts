import { cleIngredient, cumulerQuantites, memeProduit } from './ingredients'
import { recettesDuPlan } from './menu'
import { PLACARD, recetteParId } from './recettes'
import type { Ingredient } from './recettes'
import type {
  ArticleCourse,
  ArticleStock,
  Emplacement,
  ListeCourses,
  OrigineCourse,
  PlanSemaine,
  Rayon,
} from './types'
import { RAYONS } from './types'
import { identifiant, jourISO } from './utils'

/**
 * La liste de courses, celle qu'on emporte au magasin.
 *
 * Elle diffère de la liste calculée depuis une semaine de menus (`menu.ts`) sur
 * un point qui change tout : **elle est enregistrée**. On fait ses courses en
 * plusieurs fois, souvent d'un téléphone qu'on range entre deux rayons, et une
 * case cochée perdue au rechargement fait racheter ce qui est déjà dans le
 * caddie. La liste calculée reste utile comme aperçu ; c'est celle-ci qu'on
 * coche.
 *
 * Comme partout ailleurs, tout est en règles lisibles : une quantité affichée
 * doit pouvoir s'expliquer par une addition.
 */

/* ─────────────────────────────── Fabriquer ─────────────────────────────── */

export function nouvelleListe(nom = 'Mes courses'): ListeCourses {
  return {
    id: identifiant('c'),
    nom: nom.trim() || 'Mes courses',
    creeLe: new Date().toISOString(),
    clotureeLe: null,
    articles: [],
    plansVerses: [],
  }
}

/** Les listes ouvertes, la plus récente d'abord. */
export function listesEnCours(listes: ListeCourses[]): ListeCourses[] {
  return listes.filter((l) => l.clotureeLe === null).sort((a, b) => b.creeLe.localeCompare(a.creeLe))
}

/**
 * Les listes closes, la plus récente d'abord.
 *
 * Une liste terminée part à l'historique et non à la corbeille : les courses de
 * la semaine ressemblent à celles de la précédente, et « refaire la même » est
 * le geste le plus rapide qu'on puisse offrir.
 */
export function listesCloses(listes: ListeCourses[]): ListeCourses[] {
  return listes
    .filter((l) => l.clotureeLe !== null)
    .sort((a, b) => (b.clotureeLe ?? '').localeCompare(a.clotureeLe ?? ''))
}

export function listeParId(listes: ListeCourses[], id: string | null): ListeCourses | null {
  if (id === null) return null
  return listes.find((l) => l.id === id) ?? null
}

/* ──────────────────────────────── Ajouter ──────────────────────────────── */

export interface AjoutCourse {
  nom: string
  quantite: string
  rayon: Rayon
  origine: OrigineCourse
  /** Le titre de la recette qui l'amène, pour pouvoir dire d'où sort la ligne. */
  recette?: string
}

/**
 * Ajoute un produit à la liste, ou grossit la ligne existante. **Mute la liste**
 * — s'appelle donc dans un `modifier((brouillon) => …)`, comme le reste.
 *
 * Le rapprochement se fait sur `cleIngredient`, plus strict que le
 * `memeProduit` du garde-manger : ici, fusionner deux lignes à tort fait partir
 * au magasin avec une quantité fausse, alors que le garde-manger ne risque
 * qu'une suggestion de recette à côté.
 *
 * **Une ligne déjà cochée qui grossit redevient à prendre.** Cocher veut dire
 * « j'ai pris ce qui était écrit » : si la semaine suivante en réclame deux de
 * plus, laisser la case cochée ferait passer devant le rayon sans s'arrêter.
 */
export function ajouterArticle(liste: ListeCourses, ajout: AjoutCourse): ArticleCourse {
  const nom = ajout.nom.trim()
  const quantite = ajout.quantite.trim() || '1'
  const cle = cleIngredient(nom)
  const existant = liste.articles.find((a) => cleIngredient(a.nom) === cle)

  if (existant) {
    existant.quantite = cumulerQuantites(existant.quantite, quantite)
    if (ajout.recette && !existant.recettes.includes(ajout.recette)) {
      existant.recettes.push(ajout.recette)
    }
    existant.pris = false
    return existant
  }

  const article: ArticleCourse = {
    id: identifiant('a'),
    nom,
    quantite,
    rayon: ajout.rayon,
    origine: ajout.origine,
    recettes: ajout.recette ? [ajout.recette] : [],
    pris: false,
    ajouteLe: new Date().toISOString(),
  }
  liste.articles.push(article)
  return article
}

/* ─────────────────────── Verser une semaine de menus ─────────────────────── */

/**
 * Un ingrédient proposé au versement, avec de quoi décider.
 *
 * Le brief tient en une phrase : *ce qu'on a déjà ne se rachète pas*. D'où
 * `enStock` — et, conformément à la règle du garde-manger, **l'article qui a
 * produit la correspondance est toujours affiché** : `memeProduit` rapproche sur
 * un seul mot porteur et se trompe parfois (« huile d'olive » contre
 * « olives »). Une erreur visible se décoche d'un geste ; une erreur silencieuse
 * envoie cuisiner sans huile.
 */
export interface PropositionCourse {
  ingredient: Ingredient
  /** Les recettes de la semaine qui le demandent. */
  recettes: string[]
  /** L'article du garde-manger qui semble déjà le couvrir, s'il y en a un. */
  enStock: ArticleStock | null
  /** Vrai quand la liste porte déjà une ligne pour ce produit. */
  dejaDansListe: boolean
}

/**
 * Les ingrédients d'une semaine, cumulés, avec les recettes qui les demandent.
 *
 * `listeDeCourses` du catalogue fait le même cumul mais perd l'attribution : on
 * refait donc l'agrégation ici pour pouvoir répondre à « pourquoi trois
 * oignons ? », question qui décide de garder la ligne ou de la supprimer.
 */
export function ingredientsDeRecettes(
  idsRecettes: string[],
): { ingredient: Ingredient; recettes: string[] }[] {
  const cumul = new Map<string, { ingredient: Ingredient; recettes: string[] }>()

  for (const id of idsRecettes) {
    const recette = recetteParId(id)
    if (!recette) continue

    for (const ingredient of recette.ingredients) {
      const cle = cleIngredient(ingredient.nom)
      const vu = cumul.get(cle)
      if (!vu) {
        cumul.set(cle, { ingredient: { ...ingredient }, recettes: [recette.titre] })
        continue
      }
      vu.ingredient.quantite = cumulerQuantites(vu.ingredient.quantite, ingredient.quantite)
      if (!vu.recettes.includes(recette.titre)) vu.recettes.push(recette.titre)
    }
  }

  return [...cumul.values()].sort(
    (a, b) => RAYONS.indexOf(a.ingredient.rayon) - RAYONS.indexOf(b.ingredient.rayon),
  )
}

/** Les mêmes, pour une semaine planifiée — doublons de repas compris. */
export function ingredientsDuPlan(plan: PlanSemaine): { ingredient: Ingredient; recettes: string[] }[] {
  return ingredientsDeRecettes(recettesDuPlan(plan))
}

/** Confronte des ingrédients au garde-manger et à la liste en cours. */
function decorer(
  entrees: { ingredient: Ingredient; recettes: string[] }[],
  stocks: ArticleStock[],
  liste: ListeCourses | null,
): PropositionCourse[] {
  return entrees.map(({ ingredient, recettes }) => ({
    ingredient,
    recettes,
    enStock: stocks.find((a) => memeProduit(a.nom, ingredient.nom)) ?? null,
    dejaDansListe:
      liste?.articles.some((a) => cleIngredient(a.nom) === cleIngredient(ingredient.nom)) ?? false,
  }))
}

export function propositionsDeRecettes(
  idsRecettes: string[],
  stocks: ArticleStock[],
  liste: ListeCourses | null,
): PropositionCourse[] {
  return decorer(ingredientsDeRecettes(idsRecettes), stocks, liste)
}

export function propositionsDuPlan(
  plan: PlanSemaine,
  stocks: ArticleStock[],
  liste: ListeCourses | null,
): PropositionCourse[] {
  return decorer(ingredientsDuPlan(plan), stocks, liste)
}

/** Les indispensables du plan, présentés comme les autres propositions. */
export function propositionsDuPlacard(
  stocks: ArticleStock[],
  liste: ListeCourses | null,
): PropositionCourse[] {
  return decorer(
    PLACARD.map((ingredient) => ({ ingredient, recettes: [] })),
    stocks,
    liste,
  )
}

/** Vrai quand cette semaine-là a déjà été versée dans cette liste. */
export function planDejaVerse(liste: ListeCourses, plan: PlanSemaine): boolean {
  return (liste.plansVerses ?? []).includes(plan.genereLe)
}

/**
 * Verse une sélection de propositions dans la liste. **Mute la liste.**
 *
 * `origine` distingue ce que la personne a écrit de ce qui vient d'une recette :
 * une ligne qu'on ne se souvient pas d'avoir ajoutée a l'air d'une erreur et se
 * fait supprimer, alors qu'elle vient du dîner de jeudi.
 */
export function verser(
  liste: ListeCourses,
  propositions: PropositionCourse[],
  origine: OrigineCourse,
  plan?: PlanSemaine,
): void {
  for (const { ingredient, recettes } of propositions) {
    ajouterArticle(liste, {
      nom: ingredient.nom,
      quantite: ingredient.quantite,
      rayon: ingredient.rayon,
      origine,
      recette: recettes[0],
    })
    // Les recettes suivantes complètent l'attribution de la ligne : une même
    // ligne sert souvent trois repas, et n'en montrer qu'un rend la quantité
    // incompréhensible.
    const article = liste.articles.find((a) => cleIngredient(a.nom) === cleIngredient(ingredient.nom))
    if (article) {
      for (const titre of recettes.slice(1)) {
        if (!article.recettes.includes(titre)) article.recettes.push(titre)
      }
    }
  }

  if (plan) {
    const verses = liste.plansVerses ?? []
    if (!verses.includes(plan.genereLe)) liste.plansVerses = [...verses, plan.genereLe]
  }
}

/* ─────────────────────────────── Lectures ─────────────────────────────── */

export interface BilanListe {
  total: number
  pris: number
  restants: number
  /** Les rayons dans l'ordre du magasin, ceux qui portent au moins une ligne. */
  rayonsRemplis: Rayon[]
}

export function bilanListe(liste: ListeCourses): BilanListe {
  const pris = liste.articles.filter((a) => a.pris).length
  return {
    total: liste.articles.length,
    pris,
    restants: liste.articles.length - pris,
    rayonsRemplis: RAYONS.filter((rayon) => liste.articles.some((a) => a.rayon === rayon)),
  }
}

/**
 * Les lignes d'un rayon, dans l'ordre où elles ont été ajoutées.
 *
 * Les lignes cochées **ne descendent pas en bas de la liste** : on coche en
 * marchant, et une liste qui se réordonne sous les yeux fait perdre sa place et
 * relire tout le rayon. Le barré suffit à les distinguer.
 */
export function articlesDuRayon(liste: ListeCourses, rayon: Rayon): ArticleCourse[] {
  return liste.articles.filter((a) => a.rayon === rayon)
}

/* ────────────────────── Clore, refaire, rentrer chez soi ────────────────────── */

export function clore(liste: ListeCourses): void {
  liste.clotureeLe = new Date().toISOString()
}

/**
 * Une nouvelle liste reprenant les produits d'une ancienne, tout décoché.
 *
 * Les semaines se ressemblent : c'est le raccourci qui rend l'historique utile
 * plutôt que décoratif. Les versements de plans ne sont **pas** repris — la
 * copie doit pouvoir recevoir la semaine en cours.
 */
export function copieDeListe(liste: ListeCourses, nom?: string): ListeCourses {
  return {
    ...nouvelleListe(nom ?? liste.nom),
    articles: liste.articles.map((a) => ({
      ...a,
      id: identifiant('a'),
      pris: false,
      ajouteLe: new Date().toISOString(),
    })),
  }
}

/**
 * Où ranger un produit en rentrant, d'après son rayon.
 *
 * Ce n'est qu'un point de départ, corrigeable ligne à ligne à l'écran : les
 * pommes de terre d'un même rayon vont au placard et la salade au frigo, et
 * aucune règle tirée du rayon ne devinera ça.
 */
export const EMPLACEMENT_PAR_RAYON: Record<Rayon, Emplacement> = {
  'Fruits et légumes': 'frigo',
  'Boucherie, poissonnerie': 'frigo',
  Crèmerie: 'frigo',
  Surgelés: 'congelateur',
  Boulangerie: 'placard',
  Épicerie: 'placard',
}

/**
 * Transforme une ligne de courses en article de garde-manger.
 *
 * **Aucune date n'est inventée.** Une liste de courses ne sait pas ce qui est
 * imprimé sur l'emballage, et poser une DLC au hasard donnerait une fausse
 * sécurité là où le risque est réel — c'est exactement ce que le garde-manger
 * cherche à éviter. Les dates s'ajoutent ensuite, produit par produit, et
 * l'écran le dit.
 */
export function articleStockDepuis(
  article: ArticleCourse,
  emplacement: Emplacement,
  aujourdhui = jourISO(),
): ArticleStock {
  return {
    id: identifiant('s'),
    nom: article.nom,
    quantite: article.quantite,
    emplacement,
    rayon: article.rayon,
    ajouteLe: aujourdhui,
  }
}
