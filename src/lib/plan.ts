import type { Categorie, Moment, Profil, Repas } from './types'

/**
 * Le plan de référence, repris d'une ordonnance réelle de
 * diététicienne-nutritionniste et servant de structure à tous les autres.
 *
 * Les kcal sont des estimations de portion moyenne. Elles servent d'indicateur,
 * jamais de consigne : ce plan raisonne en parts d'assiette, pas en grammes.
 */
export const PLAN_REFERENCE: Repas[] = [
  {
    moment: 'petit-dejeuner',
    titre: 'Petit déjeuner',
    composants: [
      {
        id: 'pdj-boisson',
        libelle: '1 thé non sucré + 1 grand verre d’eau',
        categorie: 'boisson',
        kcal: 0,
      },
      {
        id: 'pdj-pain',
        libelle: '2 tranches de pain spécial de boulangerie (environ 50 g)',
        categorie: 'feculent',
        kcal: 130,
      },
      {
        id: 'pdj-beurre',
        libelle: 'Une fine couche de beurre à 60 % type Montfleuri',
        categorie: 'matiere-grasse',
        kcal: 45,
      },
      { id: 'pdj-laitier', libelle: '1 produit laitier', categorie: 'laitier', kcal: 80 },
      {
        id: 'pdj-fruit',
        libelle: '1 portion de fruit frais',
        categorie: 'fruit',
        kcal: 70,
        alternatives: ['1 compote sans sucre ajouté'],
      },
    ],
    variantes: [
      '2 tranches de pain spécial beurrées + 2 œufs (cuisson au choix)',
      '1 recette petit déjeuner Alivio',
    ],
  },
  {
    moment: 'dejeuner',
    titre: 'Déjeuner',
    composants: [
      {
        id: 'dej-proteine',
        libelle: '1 portion de viande ou de poisson',
        categorie: 'proteine',
        kcal: 180,
        alternatives: ['2 œufs'],
      },
      {
        id: 'dej-feculent',
        libelle: '7 à 8 CàS de féculents cuits — 1 beau quart d’assiette',
        categorie: 'feculent',
        kcal: 200,
        alternatives: [
          '2 pommes de terre moyennes',
          '4 tranches de pain spécial de boulangerie',
          '¼ de pâte brisée',
        ],
      },
      {
        id: 'dej-legumes',
        libelle: 'Légumes crus et/ou cuits, à volonté',
        categorie: 'legume',
        kcal: 60,
      },
      {
        id: 'dej-laitier',
        libelle: '1 produit laitier',
        categorie: 'laitier',
        kcal: 80,
        alternatives: ['1 portion de fruit frais'],
      },
      {
        id: 'dej-huile',
        libelle: '1 CàS d’huile ou équivalent',
        categorie: 'matiere-grasse',
        kcal: 90,
      },
    ],
  },
  {
    moment: 'diner',
    titre: 'Dîner',
    composants: [
      {
        id: 'din-proteine',
        libelle: '1 portion de viande ou de poisson',
        categorie: 'proteine',
        kcal: 180,
        alternatives: ['2 œufs'],
      },
      {
        id: 'din-feculent',
        libelle: '7 à 8 CàS de féculents cuits — 1 beau quart d’assiette',
        categorie: 'feculent',
        kcal: 200,
        alternatives: ['ou équivalent'],
      },
      { id: 'din-legumes', libelle: 'Légumes cuits, à volonté', categorie: 'legume', kcal: 60 },
      {
        id: 'din-laitier',
        libelle: '1 produit laitier',
        categorie: 'laitier',
        kcal: 80,
        alternatives: ['1 portion de fruit frais'],
      },
      {
        id: 'din-huile',
        libelle: '1 CàS d’huile ou équivalent',
        categorie: 'matiere-grasse',
        kcal: 90,
      },
    ],
  },
]

/** Les consignes de bas de page de l'ordonnance. */
export const CONSIGNES = [
  'Espacer les prises alimentaires de 2 h minimum',
  'Bien s’hydrater : 1,5 L par jour tout confondu (eau, thé, tisane, café…)',
  'Repas plaisir 1 fois par semaine, dans l’idéal et sans excès',
  'Limiter les produits transformés au maximum',
  'Vous pouvez ajouter du sirop sans sucre dans votre eau',
]

/** Objectif d'hydratation converti en verres de 25 cl. */
export const VERRES_PAR_JOUR = 6

/** Substituts activables dans les réglages, proposés en remplacement du petit déjeuner. */
export const OPTIONS_HERBALIFE: { id: string; libelle: string; kcal: number }[] = [
  { id: 'hbl-f1-lait', libelle: 'Formula 1 préparé avec 250 ml de lait demi-écrémé', kcal: 220 },
  { id: 'hbl-f1-vegetal', libelle: 'Formula 1 préparé avec 250 ml de boisson végétale', kcal: 160 },
  { id: 'hbl-barre', libelle: 'Barre repas Formula 1', kcal: 250 },
]

/**
 * Chaque repas porte l'un des quatre rôles de couleur, dans l'ordre de la
 * journée. Ce sont des rôles et non des teintes nommées : la couleur exacte
 * dépend du thème choisi, seule leur distinction est garantie.
 */
export const TEINTE_MOMENT: Record<Moment, { fond: string; texte: string; barre: string }> = {
  'petit-dejeuner': { fond: 'bg-accent-wash', texte: 'text-accent', barre: 'bg-accent' },
  dejeuner: { fond: 'bg-reussite-wash', texte: 'text-reussite', barre: 'bg-reussite' },
  collation: { fond: 'bg-alerte-wash', texte: 'text-alerte', barre: 'bg-alerte' },
  diner: { fond: 'bg-primaire-wash', texte: 'text-primaire', barre: 'bg-primaire' },
}

export const LIBELLE_CATEGORIE: Record<Categorie, string> = {
  proteine: 'Protéines',
  feculent: 'Féculents',
  legume: 'Légumes',
  laitier: 'Produit laitier',
  fruit: 'Fruit',
  'matiere-grasse': 'Matière grasse',
  boisson: 'Boisson',
}

/**
 * Répartition de l'assiette équilibrée : moitié légumes, un quart féculents,
 * un quart protéines. C'est la formulation « 1 beau quart d'assiette » de
 * l'ordonnance, transposée telle quelle à l'écran.
 */
export const PARTS_ASSIETTE: { categorie: Categorie; part: number }[] = [
  { categorie: 'legume', part: 0.5 },
  { categorie: 'feculent', part: 0.25 },
  { categorie: 'proteine', part: 0.25 },
]

/** Les catégories qui gravitent autour de l'assiette plutôt que dedans. */
export const SATELLITES: Categorie[] = ['laitier', 'fruit', 'matiere-grasse', 'boisson']

export function repasDuMoment(moment: Moment, plan: Repas[] = PLAN_REFERENCE): Repas {
  const repas = plan.find((r) => r.moment === moment)
  if (!repas) throw new Error(`Repas introuvable pour le moment « ${moment} »`)
  return repas
}

export function kcalTotalPlan(plan: Repas[] = PLAN_REFERENCE): number {
  return plan.reduce(
    (total, repas) => total + repas.composants.reduce((s, c) => s + c.kcal, 0),
    0,
  )
}

/**
 * Adapte le plan de référence à un autre besoin calorique.
 *
 * Seuls les féculents bougent : ce sont eux que l'on module en pratique. Les
 * protéines restent constantes (besoin lié au poids, pas à l'objectif), les
 * légumes restent à volonté. Le plan reste indicatif — il ne remplace pas une
 * consultation.
 */
export function planPour(profil: Profil, objectifKcal: number): Repas[] {
  return profil.planPrescrit ? PLAN_REFERENCE : planAdapte(objectifKcal)
}

export function planAdapte(objectifKcal: number): Repas[] {
  const reference = kcalTotalPlan()
  const ratio = objectifKcal / reference
  const cuilleres = Math.max(4, Math.min(12, Math.round(7.5 * ratio)))

  return PLAN_REFERENCE.map((repas) => ({
    ...repas,
    composants: repas.composants.map((c) => {
      if (c.categorie !== 'feculent' || repas.moment === 'petit-dejeuner') return c
      return {
        ...c,
        libelle: `${cuilleres} CàS de féculents cuits — ${cuilleres >= 7 ? 'un beau quart' : 'un petit quart'} d’assiette`,
        kcal: Math.round((c.kcal / 7.5) * cuilleres),
      }
    }),
  }))
}
