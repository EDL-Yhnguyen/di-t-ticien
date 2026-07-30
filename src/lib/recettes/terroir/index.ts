import { PHOTOS } from '../photos'
import type { Recette } from '../types'
import { TERROIR_MONDE } from './monde'
import { TERROIR_NORD } from './nord'
import { TERROIR_SUD } from './sud'

/**
 * Les plats emblématiques, écrits à la main.
 *
 * ## Pourquoi ils existent en plus du catalogue composé
 *
 * Le générateur assemble des plats corrects à partir de techniques, et il ne
 * produira **jamais** de carbonade flamande : une carbonade n'est pas un bœuf
 * mijoté à la bière, c'est un ensemble de gestes précis — la viande séchée avant
 * d'être saisie, le pain d'épices moutardé posé en surface, le sucre qui répond à
 * l'amertume. Aucune combinatoire ne retrouve ça, et surtout personne ne cherche
 * « mijoté de bœuf, oignons et pommes de terre façon bistrot » : on cherche une
 * carbonade, par son nom.
 *
 * C'est ce que le catalogue composé ne pouvait pas donner, et la raison de ce
 * dossier.
 *
 * ## Ce qu'ils sont, et ce qu'ils ne sont pas
 *
 * **Aucun texte n'est recopié.** La règle du projet n'a pas changé : le texte
 * d'une recette est une œuvre protégée et ce dépôt est public. Ce qui ne
 * s'approprie pas, en revanche, c'est le plat lui-même — une liste d'ingrédients
 * et une suite de gestes traditionnels appartiennent à tout le monde. Ces
 * recettes sont donc **écrites ici**, dans nos mots, avec nos raisons.
 *
 * Elles viennent **avant** les composées dans le catalogue, comme les 53
 * originales : une recette pensée pour elle-même vaut mieux qu'un assemblage.
 */
/**
 * La photo est **rattachée ici**, et non recopiée dans chaque recette.
 *
 * `photos.ts` est un fichier généré : y renvoyer par l'identifiant garde une seule
 * source de vérité. Écrire `photo: '/plats/cassoulet.jpg'` à la main dans cent
 * vingt recettes aurait laissé, au premier plat dont Commons n'offre rien de
 * convaincant, un chemin vers une image absente — et un cadre cassé à l'écran.
 *
 * L'absence de photo n'est pas un manque à combler : l'écran dégrade vers
 * l'illustration générée, ce qu'il faisait déjà pour les cinq mille recettes
 * composées.
 */
export const TERROIR: Recette[] = [...TERROIR_NORD, ...TERROIR_SUD, ...TERROIR_MONDE].map(
  (recette) => {
    const photo = PHOTOS[recette.id]
    return photo ? { ...recette, photo: photo.fichier } : recette
  },
)
