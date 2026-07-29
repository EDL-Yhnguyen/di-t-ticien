import type { Recette } from './types'

/**
 * L'ordonnance ne prescrit pas d'encas — mais la page Envies en propose un
 * quand la faim est réelle plutôt que nerveuse, et il vaut mieux qu'il soit
 * choisi à l'avance. D'où des collations courtes, sous les 200 kcal, où la
 * protéine ou la fibre tient jusqu'au repas suivant.
 */
export const COLLATIONS: Recette[] = [
  {
    id: 'col-fromage-blanc-fruits',
    titre: 'Fromage blanc et fruits rouges',
    moment: 'collation',
    minutes: 2,
    kcal: 120,
    couvre: ['laitier', 'fruit'],
    tags: ['rapide', 'sans-cuisson', 'vegetarien'],
    ingredients: [
      { nom: 'Fromage blanc 3 %', quantite: '150 g', rayon: 'Crèmerie' },
      { nom: 'Fruits rouges', quantite: '80 g', rayon: 'Surgelés' },
    ],
    etapes: [
      'Sortez les fruits rouges 10 minutes avant : ils rendent leur jus en décongelant.',
      'Mélangez-les au fromage blanc.',
    ],
    astuce: 'Les fruits rouges surgelés coûtent trois fois moins cher que les frais, hors saison.',
  },
  {
    id: 'col-pomme-amandes',
    titre: 'Pomme et poignée d’amandes',
    moment: 'collation',
    minutes: 1,
    kcal: 175,
    couvre: ['fruit', 'matiere-grasse'],
    tags: ['rapide', 'sans-cuisson', 'nomade', 'vegetarien'],
    ingredients: [
      { nom: 'Pomme', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Amandes non salées', quantite: '15 g (une douzaine)', rayon: 'Épicerie' },
    ],
    etapes: [
      'Coupez la pomme en quartiers — elle se mange plus lentement qu’entière.',
      'Comptez les amandes avant de commencer, plutôt que de piocher dans le paquet.',
    ],
    astuce: 'La combinaison fibre + gras est ce qui tient le mieux entre deux repas.',
  },
  {
    id: 'col-tartine-houmous',
    titre: 'Tartine de houmous et bâtonnets de carotte',
    moment: 'collation',
    minutes: 5,
    kcal: 190,
    couvre: ['feculent', 'legume', 'proteine'],
    tags: ['rapide', 'sans-cuisson', 'vegetarien', 'economique'],
    ingredients: [
      { nom: 'Pain complet', quantite: '1 tranche', rayon: 'Boulangerie' },
      { nom: 'Houmous', quantite: '2 CàS', rayon: 'Crèmerie' },
      { nom: 'Carotte', quantite: '1', rayon: 'Fruits et légumes' },
    ],
    etapes: [
      'Étalez le houmous sur la tranche de pain.',
      'Taillez la carotte en bâtonnets et servez-les à côté, pour le croquant.',
    ],
  },
  {
    id: 'col-yaourt-cannelle',
    titre: 'Yaourt nature, cannelle et une poire',
    moment: 'collation',
    minutes: 2,
    kcal: 145,
    couvre: ['laitier', 'fruit'],
    tags: ['rapide', 'sans-cuisson', 'vegetarien', 'economique'],
    ingredients: [
      { nom: 'Yaourt nature', quantite: '1', rayon: 'Crèmerie' },
      { nom: 'Poire', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Cannelle', quantite: '1 pincée', rayon: 'Épicerie' },
    ],
    etapes: [
      'Coupez la poire en dés dans le yaourt.',
      'Saupoudrez de cannelle et laissez reposer deux minutes.',
    ],
    astuce: 'La cannelle donne une impression de sucre sans en apporter.',
    saisons: ['automne', 'hiver'],
  },
]
