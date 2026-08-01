import type { EtatUtilisateur } from './store'

/**
 * Réunir deux versions d'un même document.
 *
 * Le document est écrit en entier à chaque enregistrement : celui qui écrit en
 * dernier écrase l'autre. Tant qu'une personne n'avait qu'un appareil, ça ne se
 * voyait pas. Dès qu'elle en a deux — et c'est le but affiché du produit, se
 * connecter où l'on veut et retrouver sa progression — le téléphone qui
 * enregistre après le portable **efface le repas noté sur le portable**, sans
 * message et sans trace.
 *
 * Ce module est volontairement **pur** : il ne lit ni le réseau, ni le stockage,
 * ni l'horloge. C'est ce qui permet de l'éprouver sans jamais appeler
 * `charger()` ni `enregistrer()`, qui écriraient dans la vraie base dès qu'un
 * `.env` traîne (règle du `CLAUDE.md`, « Vérifier avant de livrer »).
 */

/**
 * Les collections qu'on sait réunir, et ce qui identifie une entrée.
 *
 * Elles ont un point commun qui rend la réunion sûre : **on y ajoute, on n'y
 * réécrit pas**. Un repas noté hier ne change plus ; deux appareils produisent
 * donc des entrées différentes, jamais deux versions de la même. Réunir revient
 * alors à ne rien perdre, ce qui est exactement le comportement attendu.
 *
 * Ce qui n'est pas dans cette table suit le document le plus récent. C'est le
 * choix conservateur : le profil, les réglages ou le consentement sont des
 * valeurs qu'on **remplace**, et deux appareils qui en changent expriment une
 * intention, pas un ajout. Prendre la dernière est la seule lecture honnête.
 *
 * **Élargir cette table est sans danger tant que la collection est en ajout
 * seul.** L'y mettre alors qu'on y modifie des entrées ferait réapparaître ce
 * qu'un appareil venait de corriger.
 */
const REUNIES: ReadonlyArray<{
  champ: keyof EtatUtilisateur
  cle: (entree: Record<string, unknown>) => string
}> = [
  { champ: 'journal', cle: (e) => `${e.id}` },
  { champ: 'seances', cle: (e) => `${e.id}` },
  { champ: 'envies', cle: (e) => `${e.id}` },
  { champ: 'pesees', cle: (e) => `${e.date}` },
  { champ: 'eau', cle: (e) => `${e.date}` },
  { champ: 'mesuresSante', cle: (e) => `${e.date}` },
  // Une case cochée du plan prescrit s'identifie par le jour **et** le repas :
  // la date seule confondrait le déjeuner et le dîner du même jour.
  { champ: 'repas', cle: (e) => `${e.date}|${e.moment}` },
]

/** Les collections de simples chaînes, réunies par valeur. */
const ENSEMBLES: ReadonlyArray<keyof EtatUtilisateur> = ['favoris', 'badges']

function estTableau(valeur: unknown): valeur is Record<string, unknown>[] {
  return Array.isArray(valeur)
}

/**
 * Trie par date **quand toutes les entrées en portent une**.
 *
 * Sans ça, une entrée rattrapée d'un autre appareil se poserait en fin de
 * tableau, donc en bas d'une liste que l'écran affiche dans l'ordre reçu : le
 * petit déjeuner d'hier apparaîtrait après le dîner d'aujourd'hui.
 *
 * Le tri de JavaScript est stable depuis ES2019 : deux entrées de même date
 * gardent leur ordre relatif, et la réunion ne remue donc pas ce qui existait.
 */
function trierSiDate(entrees: Record<string, unknown>[]): Record<string, unknown>[] {
  const champ = entrees.every((e) => typeof e.horodatage === 'string')
    ? 'horodatage'
    : entrees.every((e) => typeof e.date === 'string')
      ? 'date'
      : null

  if (!champ) return entrees
  return [...entrees].sort((a, b) => String(a[champ]).localeCompare(String(b[champ])))
}

/**
 * Réunit deux documents, `recent` faisant foi pour tout ce qui se remplace.
 *
 * `recent` est celui dont on sait qu'il porte les dernières intentions —
 * en pratique, celui de l'appareil qui est en train d'écrire. `ancien` est la
 * version trouvée en base, écrite entre-temps par un autre appareil.
 */
export function fusionnerDocuments(
  recent: EtatUtilisateur,
  ancien: EtatUtilisateur,
): EtatUtilisateur {
  const fusion: EtatUtilisateur = structuredClone(recent)

  for (const { champ, cle } of REUNIES) {
    const aRecent = recent[champ]
    const aAncien = ancien[champ]
    if (!estTableau(aRecent) || !estTableau(aAncien)) continue

    const connues = new Set(aRecent.map(cle))
    const manquantes = aAncien.filter((entree) => !connues.has(cle(entree)))
    if (manquantes.length === 0) continue

    // `structuredClone` a déjà détaché les entrées de `recent` ; celles qui
    // viennent d'`ancien` doivent l'être aussi, sinon la fusion partagerait des
    // objets avec un document que l'appelant peut encore modifier.
    const reunies = trierSiDate([...aRecent, ...structuredClone(manquantes)])
    Object.assign(fusion, { [champ]: reunies })
  }

  for (const champ of ENSEMBLES) {
    const aRecent = recent[champ]
    const aAncien = ancien[champ]
    if (!Array.isArray(aRecent) || !Array.isArray(aAncien)) continue

    const reunies = [...new Set([...(aRecent as string[]), ...(aAncien as string[])])]
    Object.assign(fusion, { [champ]: reunies })
  }

  return fusion
}

/**
 * Ce qu'il faut faire d'une écriture en attente au moment de rouvrir l'appli.
 *
 * L'écriture en attente est celle qui n'a pas abouti — hors connexion, ou
 * onglet fermé avant la fin. Elle est conservée sur l'appareil ; reste à savoir
 * si on peut la renvoyer telle quelle.
 *
 * - `aucune` : rien en attente, le document de la base fait foi.
 * - `renvoyer` : la base n'a pas bougé depuis, l'attente est simplement plus
 *   récente. On la renvoie telle quelle.
 * - `reunir` : la base a bougé entre-temps — un autre appareil a écrit. Il faut
 *   réunir les deux avant de renvoyer, sinon l'un des deux disparaît.
 */
export type DecisionReprise = 'aucune' | 'renvoyer' | 'reunir'

export function decisionReprise(
  enAttente: { majLeConnu: string | null } | null,
  majLeDistant: string | null,
): DecisionReprise {
  if (!enAttente) return 'aucune'
  // Une attente née d'un document qu'on n'avait pas encore daté ne peut rien
  // affirmer sur la base : on réunit, qui ne perd jamais rien.
  if (enAttente.majLeConnu === null) return 'reunir'
  return enAttente.majLeConnu === majLeDistant ? 'renvoyer' : 'reunir'
}
