import { describe, expect, it } from 'vitest'
import { BASE_ALIMENTS, chercherDansLaBase } from './index'
import { jetons, normaliser } from './recherche'

/**
 * La recherche d'aliments est le premier geste du produit : quelqu'un ouvre
 * « Ajouter », tape ce qu'il a mangé, et si rien ne sort il repart. Les deux
 * défauts du 31/07/2026 — le pluriel qui faisait échouer « pomme de terre », et
 * les accents mangés par la normalisation — n'étaient visibles ni au typecheck
 * ni à l'œil : le second ne se déclenchait que sur une requête tapée *sans*
 * accent, puisqu'un nom et une requête portant le même accent se déforment
 * pareil.
 *
 * Ces cas-là sont donc écrits ici, tels qu'ils ont été rencontrés.
 */

describe('normaliser', () => {
  it('supprime les accents sans couper le mot', () => {
    // Le défaut d'origine : `[^a-z0-9]+ → ' '` appliqué après NFD balayait les
    // signes combinants comme de la ponctuation et donnait « p a tes ».
    expect(normaliser('pâtes')).toBe('pates')
    expect(normaliser('crème fraîche épaisse')).toBe('creme fraiche epaisse')
  })

  it('décompose les ligatures, qu’Unicode ne décompose pas', () => {
    expect(normaliser('œuf')).toBe('oeuf')
    expect(normaliser('Œufs')).toBe('oeufs')
    expect(normaliser('ex æquo')).toBe('ex aequo')
  })

  it('transforme apostrophes et tirets en séparateurs de mots', () => {
    expect(normaliser('huile d’olive')).toBe('huile d olive')
    expect(normaliser('chou-fleur')).toBe('chou fleur')
  })
})

describe('jetons', () => {
  it('écarte les mots-outils', () => {
    expect(jetons('pomme de terre')).toEqual(['pomme', 'terre'])
    expect(jetons('haricots à la tomate')).toEqual(['haricots', 'tomate'])
  })

  it('garde le mot-outil quand il est seul — sinon la requête n’a plus rien', () => {
    expect(jetons('les')).toEqual(['les'])
  })
})

describe('chercherDansLaBase', () => {
  /** Le nom trouvé pour une requête, en minuscules sans accent. */
  const premier = (requete: string) => normaliser(chercherDansLaBase(requete)[0]?.nom ?? '')
  const trouve = (requete: string, attendu: string) =>
    chercherDansLaBase(requete, 30).some((a) => normaliser(a.nom).includes(normaliser(attendu)))

  it('trouve un aliment écrit au pluriel dans la base à partir du singulier', () => {
    // Le signalement d'origine, mot pour mot.
    expect(trouve('pomme de terre', 'pomme')).toBe(true)
    expect(premier('pomme de terre')).toContain('pomme')
    expect(premier('pomme de terre')).toContain('terre')
  })

  it('trouve sans accent ce qui est écrit avec', () => {
    expect(trouve('pates completes', 'pates')).toBe(true)
    expect(trouve('creme fraiche', 'creme')).toBe(true)
  })

  it('répond pendant la frappe, par préfixe', () => {
    expect(trouve('courg', 'courgette')).toBe(true)
    expect(trouve('poirea', 'poireau')).toBe(true)
  })

  it('cumule les mots au lieu d’élargir', () => {
    // « pomme terre » ne doit pas ramener la compote de pommes.
    for (const aliment of chercherDansLaBase('pomme terre', 30)) {
      expect(normaliser(aliment.nom)).toContain('terre')
    }
  })

  it('fait passer le synonyme exact devant le préfixe commun', () => {
    // « chocolatine » commence par « chocolat » : sans le rang réservé aux
    // synonymes mot pour mot, huit tablettes sortaient devant le pain au
    // chocolat, seul à déclarer le synonyme.
    expect(premier('chocolatine')).toBe('pain au chocolat')
  })

  it('trouve un aliment par son synonyme, sans passer devant son homonyme', () => {
    // « patate » sort d'abord la patate douce, qui porte littéralement ce nom
    // (rang 10, le nom commence par la requête), puis les pommes de terre par
    // synonyme. C'est l'ordre juste : la base contient bien un aliment appelé
    // « patate douce », et le masquer serait le vrai défaut. Ce qui compte est
    // que le synonyme ramène la pomme de terre du tout.
    expect(trouve('patate', 'pomme de terre')).toBe(true)
  })

  it('ne répond rien sous deux caractères', () => {
    expect(chercherDansLaBase('p')).toEqual([])
    expect(chercherDansLaBase('')).toEqual([])
  })

  it('classe le nom le plus court en premier à rang égal', () => {
    // Quelqu'un qui tape « pomme » veut la pomme, pas la pomme au four.
    expect(premier('pomme')).toBe('pomme')
  })
})

describe('la base elle-même', () => {
  it('ne contient aucun identifiant en double', () => {
    // Un doublon fait gagner le dernier chargé, silencieusement : deux aliments
    // aux valeurs différentes sous la même clé, et un journal qui change de
    // calories sans que rien ne l'explique.
    const vus = new Map<string, string>()
    const doublons: string[] = []
    for (const aliment of BASE_ALIMENTS) {
      const deja = vus.get(aliment.id)
      if (deja) doublons.push(`${aliment.id} : « ${deja} » et « ${aliment.nom} »`)
      else vus.set(aliment.id, aliment.nom)
    }
    expect(doublons).toEqual([])
  })

  it('donne une note Nutri-Score à chaque aliment', () => {
    const sansNote = BASE_ALIMENTS.filter((a) => !a.nutriScore)
    expect(sansNote.map((a) => a.nom)).toEqual([])
  })

  it('reste au-dessus de deux mille entrées', () => {
    // Un garde-fou contre une suppression accidentelle d'un fichier de famille :
    // `donnees/` est découpé, et un import perdu se verrait ici avant l'écran.
    expect(BASE_ALIMENTS.length).toBeGreaterThanOrEqual(2000)
  })
})
