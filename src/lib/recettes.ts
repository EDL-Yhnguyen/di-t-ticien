import type { Moment } from './types'

export interface Ingredient {
  nom: string
  quantite: string
  rayon: Rayon
}

export type Rayon = 'Fruits et légumes' | 'Boucherie, poissonnerie' | 'Crèmerie' | 'Épicerie'

export interface Recette {
  id: string
  titre: string
  moment: Moment
  minutes: number
  kcal: number
  /** Ce que la recette couvre dans l'assiette — sert à la relier au plan. */
  couvre: string[]
  ingredients: Ingredient[]
  etapes: string[]
  astuce?: string
}

/**
 * Des recettes calées sur la structure du plan : une protéine, un quart
 * d'assiette de féculents, des légumes à volonté, une cuillère d'huile.
 * Quantités pour une personne.
 */
export const RECETTES: Recette[] = [
  {
    id: 'cabillaud-papillote',
    titre: 'Cabillaud en papillote, riz et courgettes',
    moment: 'diner',
    minutes: 30,
    kcal: 430,
    couvre: ['Protéines', 'Féculents', 'Légumes', 'Matière grasse'],
    ingredients: [
      { nom: 'Dos de cabillaud', quantite: '130 g', rayon: 'Boucherie, poissonnerie' },
      { nom: 'Riz basmati', quantite: '50 g cru', rayon: 'Épicerie' },
      { nom: 'Courgette', quantite: '1 moyenne', rayon: 'Fruits et légumes' },
      { nom: 'Citron', quantite: '½', rayon: 'Fruits et légumes' },
      { nom: 'Huile d’olive', quantite: '1 CàS', rayon: 'Épicerie' },
      { nom: 'Thym', quantite: '1 branche', rayon: 'Fruits et légumes' },
    ],
    etapes: [
      'Préchauffez le four à 200 °C.',
      'Coupez la courgette en rondelles fines et déposez-les sur une feuille de papier cuisson.',
      'Posez le cabillaud dessus, arrosez d’huile, ajoutez le citron en rondelles et le thym.',
      'Fermez la papillote hermétiquement et enfournez 18 minutes.',
      'Faites cuire le riz pendant ce temps.',
    ],
    astuce: 'La papillote se prépare le matin et attend au frais toute la journée.',
  },
  {
    id: 'poulet-citron',
    titre: 'Poulet au citron, haricots verts et pommes de terre',
    moment: 'dejeuner',
    minutes: 35,
    kcal: 470,
    couvre: ['Protéines', 'Féculents', 'Légumes', 'Matière grasse'],
    ingredients: [
      { nom: 'Filet de poulet', quantite: '120 g', rayon: 'Boucherie, poissonnerie' },
      { nom: 'Pommes de terre', quantite: '2 moyennes', rayon: 'Fruits et légumes' },
      { nom: 'Haricots verts', quantite: '200 g', rayon: 'Fruits et légumes' },
      { nom: 'Citron', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Huile d’olive', quantite: '1 CàS', rayon: 'Épicerie' },
      { nom: 'Ail', quantite: '1 gousse', rayon: 'Fruits et légumes' },
    ],
    etapes: [
      'Faites cuire les pommes de terre et les haricots verts à la vapeur, 20 minutes.',
      'Saisissez le poulet à la poêle avec l’ail écrasé, 6 minutes par face.',
      'Déglacez avec le jus de citron hors du feu.',
      'Servez le tout arrosé du jus de cuisson.',
    ],
  },
  {
    id: 'omelette-champignons',
    titre: 'Omelette aux champignons et salade',
    moment: 'diner',
    minutes: 15,
    kcal: 390,
    couvre: ['Protéines', 'Légumes', 'Matière grasse'],
    ingredients: [
      { nom: 'Œufs', quantite: '2', rayon: 'Crèmerie' },
      { nom: 'Champignons de Paris', quantite: '150 g', rayon: 'Fruits et légumes' },
      { nom: 'Salade verte', quantite: '1 poignée', rayon: 'Fruits et légumes' },
      { nom: 'Pain spécial', quantite: '2 tranches', rayon: 'Épicerie' },
      { nom: 'Huile d’olive', quantite: '1 CàS', rayon: 'Épicerie' },
      { nom: 'Persil', quantite: 'quelques brins', rayon: 'Fruits et légumes' },
    ],
    etapes: [
      'Faites revenir les champignons émincés à sec jusqu’à évaporation de leur eau.',
      'Battez les œufs, salez, poivrez, versez sur les champignons.',
      'Laissez prendre à feu doux 4 minutes, pliez en deux.',
      'Servez avec la salade assaisonnée à l’huile d’olive et le pain.',
    ],
    astuce: 'Cuire les champignons à sec avant d’huiler évite qu’ils boivent toute la matière grasse.',
  },
  {
    id: 'boeuf-poivrons',
    titre: 'Bœuf sauté aux poivrons et boulgour',
    moment: 'dejeuner',
    minutes: 25,
    kcal: 490,
    couvre: ['Protéines', 'Féculents', 'Légumes', 'Matière grasse'],
    ingredients: [
      { nom: 'Bavette de bœuf', quantite: '110 g', rayon: 'Boucherie, poissonnerie' },
      { nom: 'Boulgour', quantite: '50 g cru', rayon: 'Épicerie' },
      { nom: 'Poivrons', quantite: '2', rayon: 'Fruits et légumes' },
      { nom: 'Oignon', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Huile d’olive', quantite: '1 CàS', rayon: 'Épicerie' },
    ],
    etapes: [
      'Faites gonfler le boulgour dans deux fois son volume d’eau bouillante, 12 minutes.',
      'Émincez poivrons et oignon, faites-les revenir 10 minutes à feu vif.',
      'Ajoutez le bœuf coupé en lanières, 3 minutes suffisent.',
      'Mélangez au boulgour et servez.',
    ],
  },
  {
    id: 'saumon-brocolis',
    titre: 'Saumon vapeur, écrasé de pommes de terre et brocolis',
    moment: 'diner',
    minutes: 30,
    kcal: 510,
    couvre: ['Protéines', 'Féculents', 'Légumes', 'Matière grasse'],
    ingredients: [
      { nom: 'Pavé de saumon', quantite: '110 g', rayon: 'Boucherie, poissonnerie' },
      { nom: 'Pommes de terre', quantite: '2 moyennes', rayon: 'Fruits et légumes' },
      { nom: 'Brocolis', quantite: '200 g', rayon: 'Fruits et légumes' },
      { nom: 'Huile d’olive', quantite: '1 CàS', rayon: 'Épicerie' },
      { nom: 'Citron', quantite: '½', rayon: 'Fruits et légumes' },
    ],
    etapes: [
      'Cuisez pommes de terre et brocolis à la vapeur, 20 minutes.',
      'Ajoutez le saumon dans le panier vapeur les 10 dernières minutes.',
      'Écrasez les pommes de terre à la fourchette avec l’huile d’olive.',
      'Servez avec un filet de citron.',
    ],
  },
  {
    id: 'dinde-ratatouille',
    titre: 'Escalope de dinde, ratatouille et semoule',
    moment: 'dejeuner',
    minutes: 40,
    kcal: 460,
    couvre: ['Protéines', 'Féculents', 'Légumes', 'Matière grasse'],
    ingredients: [
      { nom: 'Escalope de dinde', quantite: '120 g', rayon: 'Boucherie, poissonnerie' },
      { nom: 'Semoule', quantite: '50 g crue', rayon: 'Épicerie' },
      { nom: 'Aubergine', quantite: '1 petite', rayon: 'Fruits et légumes' },
      { nom: 'Courgette', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Tomates', quantite: '2', rayon: 'Fruits et légumes' },
      { nom: 'Huile d’olive', quantite: '1 CàS', rayon: 'Épicerie' },
    ],
    etapes: [
      'Coupez les légumes en dés et faites-les mijoter 30 minutes à couvert.',
      'Poêlez l’escalope 5 minutes par face.',
      'Versez l’eau bouillante sur la semoule, couvrez 5 minutes, égrainez.',
      'Servez la ratatouille sur la semoule, l’escalope à côté.',
    ],
    astuce: 'La ratatouille se fait en grande quantité et se garde 4 jours au frais.',
  },
  {
    id: 'lentilles-oeufs',
    titre: 'Lentilles, œufs durs et carottes râpées',
    moment: 'dejeuner',
    minutes: 25,
    kcal: 440,
    couvre: ['Protéines', 'Féculents', 'Légumes', 'Matière grasse'],
    ingredients: [
      { nom: 'Œufs', quantite: '2', rayon: 'Crèmerie' },
      { nom: 'Lentilles vertes', quantite: '60 g crues', rayon: 'Épicerie' },
      { nom: 'Carottes', quantite: '2', rayon: 'Fruits et légumes' },
      { nom: 'Échalote', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Huile de colza', quantite: '1 CàS', rayon: 'Épicerie' },
      { nom: 'Moutarde', quantite: '1 cc', rayon: 'Épicerie' },
    ],
    etapes: [
      'Cuisez les lentilles 20 minutes dans l’eau non salée.',
      'Faites durcir les œufs 9 minutes.',
      'Râpez les carottes, assaisonnez avec l’huile et la moutarde.',
      'Servez les lentilles tièdes avec l’échalote émincée et les œufs coupés en deux.',
    ],
  },
  {
    id: 'pdj-porridge',
    titre: 'Porridge aux flocons et fruits frais',
    moment: 'petit-dejeuner',
    minutes: 10,
    kcal: 330,
    couvre: ['Féculents', 'Produit laitier', 'Fruit'],
    ingredients: [
      { nom: 'Flocons d’avoine', quantite: '40 g', rayon: 'Épicerie' },
      { nom: 'Lait demi-écrémé', quantite: '200 ml', rayon: 'Crèmerie' },
      { nom: 'Fruit de saison', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Cannelle', quantite: '1 pincée', rayon: 'Épicerie' },
    ],
    etapes: [
      'Faites chauffer le lait avec les flocons, 5 minutes à feu doux en remuant.',
      'Versez dans un bol, ajoutez le fruit coupé et la cannelle.',
    ],
    astuce: 'La cannelle sucre sans sucre — elle suffit à se passer de miel.',
  },
]

export const RAYONS: Rayon[] = [
  'Fruits et légumes',
  'Boucherie, poissonnerie',
  'Crèmerie',
  'Épicerie',
]

/** Les indispensables du plan, à avoir en permanence. */
export const PLACARD: Ingredient[] = [
  { nom: 'Pain spécial de boulangerie', quantite: 'pour la semaine', rayon: 'Épicerie' },
  { nom: 'Beurre à 60 %', quantite: '1 plaquette', rayon: 'Crèmerie' },
  { nom: 'Yaourts nature', quantite: '8', rayon: 'Crèmerie' },
  { nom: 'Fruits frais', quantite: 'pour la semaine', rayon: 'Fruits et légumes' },
  { nom: 'Huile d’olive', quantite: '1 bouteille', rayon: 'Épicerie' },
  { nom: 'Thé ou tisane', quantite: '1 boîte', rayon: 'Épicerie' },
  { nom: 'Sirop sans sucre', quantite: '1 bouteille', rayon: 'Épicerie' },
]

export function recetteParId(id: string): Recette | undefined {
  return RECETTES.find((r) => r.id === id)
}

/** Regroupe les ingrédients de plusieurs recettes par rayon de magasin. */
export function listeDeCourses(idsRecettes: string[]): Record<Rayon, Ingredient[]> {
  const groupes = Object.fromEntries(RAYONS.map((r) => [r, [] as Ingredient[]])) as Record<
    Rayon,
    Ingredient[]
  >

  const vus = new Map<string, Ingredient>()
  for (const id of idsRecettes) {
    for (const ingredient of recetteParId(id)?.ingredients ?? []) {
      const cle = ingredient.nom.toLowerCase()
      const existant = vus.get(cle)
      if (existant) {
        // Deux recettes qui demandent le même produit : on note les deux
        // quantités plutôt que d'inventer une addition entre « 1 CàS » et « ½ ».
        existant.quantite = `${existant.quantite} + ${ingredient.quantite}`
      } else {
        const copie = { ...ingredient }
        vus.set(cle, copie)
        groupes[ingredient.rayon].push(copie)
      }
    }
  }

  return groupes
}
