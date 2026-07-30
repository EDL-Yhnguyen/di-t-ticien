import { avecNutriScore } from '../nutriscore'
import type { Aliment, ValeursPour100 } from '../types'
import type { Brut } from './brut'
import { FECULENTS } from './donnees/feculents'
import { FRUITS } from './donnees/fruits'
import { GRAS } from './donnees/gras'
import { LAITIERS } from './donnees/laitiers'
import { LEGUMES } from './donnees/legumes'
import { POISSONS } from './donnees/poissons'
import { VIANDES } from './donnees/viandes'

/**
 * Les aliments que le coach peut proposer de lui-même.
 *
 * ## Pourquoi un module séparé de `index.ts`
 *
 * Ce n'est pas une question de goût mais de **poids sur le chemin critique**. Le
 * coach est appelé depuis l'écran d'accueil, qui n'est pas chargé à la demande :
 * tout ce qu'il importe part dans le premier téléchargement. Or `index.ts` réunit
 * les deux mille entrées de la base, cinquante-deux kilo-octets compressés, dont
 * l'écran d'accueil n'a besoin d'aucune. Les charger là revenait à faire payer la
 * recherche d'aliments à quelqu'un qui ouvre juste son journal.
 *
 * La recherche, elle, vit dans `Ajouter`, un écran chargé à la demande : la base
 * complète part avec lui, au moment où on en a besoin.
 *
 * ## Pourquoi ces sept familles et pas les autres
 *
 * Un conseil se donne sur des aliments simples. Le coach cherche de quoi combler
 * un manque de protéines ou de fibres, et la bonne réponse est un yaourt, des
 * lentilles ou une poignée d'amandes — jamais une pastilla, une sauce béarnaise
 * ou un ras el-hanout. Les plats, l'épicerie, la confiserie et les spécialités
 * restent parfaitement **trouvables** par la recherche ; ils ne sont simplement
 * jamais proposés spontanément, ce qui était déjà l'intention du champ `rare`.
 */
const CONSEILLABLES: Brut[] = [
  ...FRUITS,
  ...LEGUMES,
  ...FECULENTS,
  ...VIANDES,
  ...POISSONS,
  ...LAITIERS,
  ...GRAS,
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

/**
 * Les aliments sont reconstruits ici plutôt que filtrés depuis `BASE_ALIMENTS` :
 * importer cette dernière ramènerait dans le chunk principal exactement ce qu'on
 * cherche à en sortir.
 *
 * La duplication est sans danger — `coach.ts` compare des identifiants, jamais des
 * références d'objets — mais elle mérite d'être signalée : deux `Aliment` portant
 * `base:pomme` peuvent coexister en mémoire, et un futur `===` entre eux serait
 * faux sans prévenir.
 */
export const ALIMENTS_A_CONSEILLER: Aliment[] = CONSEILLABLES.filter((b) => !b.rare).map((b) =>
  avecNutriScore({
    id: `base:${b.id}`,
    nom: b.nom,
    famille: b.f ?? 'general',
    valeurs: valeurs(b.v),
    partFruitsLegumes: b.fl,
    portionG: b.g,
    portionLibelle: b.p,
    source: 'base',
  }),
)
