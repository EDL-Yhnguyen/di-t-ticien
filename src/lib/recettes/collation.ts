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
  {
    id: 'col-yaourt-grec-noix',
    titre: 'Yaourt grec et cerneaux de noix',
    moment: 'collation',
    minutes: 1,
    kcal: 170,
    couvre: ['laitier', 'matiere-grasse'],
    tags: ['rapide', 'sans-cuisson', 'vegetarien'],
    ingredients: [
      { nom: 'Yaourt à la grecque', quantite: '1 pot', rayon: 'Crèmerie' },
      { nom: 'Cerneaux de noix', quantite: '15 g', rayon: 'Épicerie' },
    ],
    etapes: ['Concassez grossièrement les noix et mélangez-les au yaourt.'],
    astuce: 'Le yaourt grec cale plus longtemps qu’un yaourt nature, à quantité égale.',
  },
  {
    id: 'col-banane-cacahuete',
    titre: 'Banane et purée de cacahuète',
    moment: 'collation',
    minutes: 2,
    kcal: 185,
    couvre: ['fruit', 'matiere-grasse'],
    tags: ['rapide', 'sans-cuisson', 'nomade', 'vegetarien', 'plaisir'],
    ingredients: [
      { nom: 'Banane', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Purée de cacahuète', quantite: '1 CàS', rayon: 'Épicerie' },
    ],
    etapes: [
      'Coupez la banane en deux dans la longueur.',
      'Étalez la purée de cacahuète dessus.',
    ],
    astuce:
      'Prenez une purée dont la liste d’ingrédients tient en un mot : cacahuètes. Le reste est du sucre ajouté.',
  },
  {
    id: 'col-tartine-fromage-frais',
    titre: 'Tartine de fromage frais et concombre',
    moment: 'collation',
    minutes: 3,
    kcal: 140,
    couvre: ['feculent', 'laitier', 'legume'],
    tags: ['rapide', 'sans-cuisson', 'vegetarien', 'economique'],
    ingredients: [
      { nom: 'Pain complet', quantite: '1 tranche', rayon: 'Boulangerie' },
      { nom: 'Fromage frais', quantite: '30 g', rayon: 'Crèmerie' },
      { nom: 'Concombre', quantite: '½', rayon: 'Fruits et légumes' },
      { nom: 'Ciboulette', quantite: 'quelques brins', rayon: 'Fruits et légumes' },
    ],
    etapes: [
      'Tartinez le pain de fromage frais.',
      'Disposez le concombre en fines rondelles et parsemez de ciboulette.',
    ],
    astuce: 'Le concombre apporte le croquant qui manque aux collations molles.',
    saisons: ['printemps', 'ete'],
  },
  {
    id: 'col-poire-chocolat',
    titre: 'Poire et carré de chocolat noir',
    moment: 'collation',
    minutes: 1,
    kcal: 150,
    couvre: ['fruit'],
    tags: ['rapide', 'sans-cuisson', 'nomade', 'vegetarien', 'plaisir'],
    ingredients: [
      { nom: 'Poire', quantite: '1', rayon: 'Fruits et légumes' },
      { nom: 'Chocolat noir 70 %', quantite: '2 carrés', rayon: 'Épicerie' },
    ],
    etapes: [
      'Mangez le chocolat en même temps que la poire, pas avant : le fruit fait durer le plaisir.',
    ],
    astuce:
      'Deux carrés posés dans une assiette valent mieux qu’une tablette ouverte sur le canapé.',
    saisons: ['automne', 'hiver'],
  },
  {
    id: 'col-oeuf-dur-celeri',
    titre: 'Œuf dur et bâtonnets de céleri',
    moment: 'collation',
    minutes: 12,
    kcal: 120,
    couvre: ['proteine', 'legume'],
    tags: ['batch', 'nomade', 'vegetarien', 'economique'],
    ingredients: [
      { nom: 'Œuf', quantite: '1', rayon: 'Crèmerie' },
      { nom: 'Céleri branche', quantite: '2 branches', rayon: 'Fruits et légumes' },
    ],
    etapes: [
      'Cuisez l’œuf 9 minutes à l’eau bouillante.',
      'Taillez le céleri en bâtonnets.',
    ],
    astuce: 'Faites-en six d’un coup le dimanche : ils se gardent une semaine, coquille comprise.',
    conservation: '1 semaine au frais, non écalé',
  },
  {
    id: 'col-compote-amandes',
    titre: 'Compote sans sucre et amandes',
    moment: 'collation',
    minutes: 1,
    kcal: 160,
    couvre: ['fruit', 'matiere-grasse'],
    tags: ['rapide', 'sans-cuisson', 'nomade', 'vegetarien'],
    ingredients: [
      { nom: 'Compote sans sucre ajouté', quantite: '1 pot', rayon: 'Épicerie' },
      { nom: 'Amandes non salées', quantite: '15 g', rayon: 'Épicerie' },
    ],
    etapes: ['Mangez les amandes avec la compote, pas après : c’est le gras qui fait tenir.'],
    astuce: 'Seule une compote sans sucre ajouté reste sous les 100 kcal le pot.',
  },
]
