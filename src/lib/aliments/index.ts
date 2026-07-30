import { avecNutriScore } from '../nutriscore'
import type { Aliment, ValeursPour100 } from '../types'
import type { Brut } from './brut'
import { BOISSONS } from './donnees/boissons'
import { COURANT } from './donnees/courant'
import { DIVERS } from './donnees/divers'
import { EPICERIE } from './donnees/epicerie'
import { FECULENTS } from './donnees/feculents'
import { FRUITS } from './donnees/fruits'
import { GRAS } from './donnees/gras'
import { LAITIERS } from './donnees/laitiers'
import { LEGUMES } from './donnees/legumes'
import { MONDE } from './donnees/monde'
import { PLATS } from './donnees/plats'
import { POISSONS } from './donnees/poissons'
import { SUCRE } from './donnees/sucre'
import { TERROIR } from './donnees/terroir'
import { VARIETES } from './donnees/varietes'
import { VIANDES } from './donnees/viandes'
import { chercherParmi, declarerSynonymes } from './recherche'

/**
 * La base d'aliments embarquée dans l'application.
 *
 * ## Pourquoi elle est dans le code et non dans une base de données
 *
 * La recherche doit répondre **instantanément et hors connexion** : c'est le
 * premier geste du produit, celui qu'on fait debout dans une cuisine ou au
 * restaurant avec deux barres de réseau. Un appel serveur y ajouterait une demi-
 * seconde dans le meilleur des cas, et un écran vide dans le pire. Un aliment
 * brut — une pomme de terre, un blanc de poulet — n'a d'ailleurs pas de
 * code-barres à scanner : personne d'autre que nous ne peut le fournir.
 *
 * ## D'où viennent les valeurs
 *
 * Ce sont des **moyennes de tables de composition**, de l'ordre de grandeur de
 * Ciqual (ANSES), et non des étiquettes de marque. Ce sont des repères : deux
 * pommes de terre n'ont pas les mêmes valeurs, et aucune table ne le prétend.
 * Pour un produit emballé, le scan du code-barres reste la bonne porte — il
 * ramène l'étiquette réelle et le Nutri-Score officiel du fabricant.
 *
 * ## Ce qui est comptable et ce qui ne l'est pas
 *
 * `BASE_ALIMENTS` sert la **recherche** : tout y est trouvable, y compris le
 * safran et la vodka. Ce que le **coach** a le droit de proposer de lui-même vit
 * dans `conseil.ts`, qui n'importe qu'une partie des familles — y laisser les
 * ingrédients et les alcools lui ferait recommander une cuillère de curcuma à
 * quelqu'un qui manque de fibres, et surtout ce module-ci est trop lourd pour le
 * chemin critique. Les raisons du découpage sont détaillées là-bas.
 *
 * **Ne pas réexporter `ALIMENTS_A_CONSEILLER` depuis ce fichier** : un import
 * depuis `lib/aliments` ramènerait la base entière dans le premier chargement, ce
 * que la séparation existe précisément pour éviter.
 */

const TOUT: Brut[] = [
  ...FRUITS,
  ...LEGUMES,
  ...FECULENTS,
  ...VIANDES,
  ...POISSONS,
  ...LAITIERS,
  ...GRAS,
  ...BOISSONS,
  ...EPICERIE,
  ...SUCRE,
  ...PLATS,
  ...TERROIR,
  ...MONDE,
  ...COURANT,
  ...VARIETES,
  ...DIVERS,
]

function valeurs(v: Brut['v']): ValeursPour100 {
  return {
    kcal: v[0],
    proteines: v[1],
    glucides: v[2],
    sucres: v[3],
    lipides: v[4],
    satures: v[5],
    fibres: v[6],
    sel: v[7],
  }
}

function enAliment(b: Brut): Aliment {
  return avecNutriScore({
    id: `base:${b.id}`,
    nom: b.nom,
    famille: b.f ?? 'general',
    valeurs: valeurs(b.v),
    partFruitsLegumes: b.fl,
    portionG: b.g,
    portionLibelle: b.p,
    source: 'base',
  })
}

/**
 * Un identifiant en double ferait deux entrées identiques dans la recherche et,
 * pire, un cache d'index qui répond pour la mauvaise. Le contrôle ne coûte rien
 * et n'existe qu'en développement — en production, la base a déjà été relue.
 */
if (import.meta.env.DEV) {
  const vus = new Set<string>()
  for (const b of TOUT) {
    if (vus.has(b.id)) console.error(`Base d’aliments : identifiant en double « ${b.id} »`)
    vus.add(b.id)
  }
}

export const BASE_ALIMENTS: Aliment[] = TOUT.map(enAliment)

for (const b of TOUT) {
  if (b.syn) declarerSynonymes(`base:${b.id}`, b.syn)
}

/** Les aliments de la base qui répondent à la requête. Voir `recherche.ts`. */
export function chercherDansLaBase(requete: string, limite = 20): Aliment[] {
  return chercherParmi(BASE_ALIMENTS, requete, limite)
}

export type { Brut }
