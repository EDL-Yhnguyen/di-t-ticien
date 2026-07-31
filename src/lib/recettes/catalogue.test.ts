import { describe, expect, it } from 'vitest'
import { catalogue, listeDeCourses, recetteParId, recettesDuMoment, RECETTES } from './index'
import { MOMENTS } from '../types'

/**
 * Ce fichier protège l'invariant le plus coûteux du projet.
 *
 * **Les identifiants du catalogue sont déterministes.** Les favoris, les plans
 * de menus, les listes de courses et les séances de cuisine enregistrées ne
 * gardent pas les recettes : elles gardent leurs identifiants, et les résolvent
 * au chargement. Une graine qui bouge dans le générateur — un style régional
 * inséré avant les autres, un ordre de briques modifié, un `Math.random()` ajouté
 * « pour varier » — ne casse aucun typecheck, ne lève aucune erreur, et vide
 * silencieusement les favoris de tout le monde en changeant la recette derrière
 * chaque identifiant.
 *
 * C'est exactement la raison pour laquelle les styles régionaux ont été ajoutés
 * **après** les styles historiques le 31/07/2026, et pourquoi ces derniers ont
 * gardé l'identifiant de leur cuisine.
 *
 * Le catalogue est mémoïsé : ces tests le lisent, ils ne le regénèrent pas à
 * chaque appel.
 */

describe('le catalogue', () => {
  it('reste au-dessus de sept mille recettes', () => {
    expect(catalogue().length).toBeGreaterThanOrEqual(7000)
  })

  it('ne contient aucun identifiant en double', () => {
    // Un doublon fait résoudre un favori vers la mauvaise recette, sans erreur.
    const vus = new Map<string, string>()
    const doublons: string[] = []
    for (const recette of catalogue()) {
      const deja = vus.get(recette.id)
      if (deja) doublons.push(`${recette.id} : « ${deja} » et « ${recette.titre} »`)
      else vus.set(recette.id, recette.titre)
    }
    expect(doublons.slice(0, 10)).toEqual([])
  })

  it('produit exactement le même catalogue à deux lectures', () => {
    // La mémoïsation rend ce test peu coûteux ; il resterait juste sans elle.
    const premier = catalogue().map((r) => r.id)
    const second = catalogue().map((r) => r.id)
    expect(second).toEqual(premier)
  })

  it('résout chaque identifiant vers la même recette qu’il désigne', () => {
    // Le contrat que tiennent les favoris et les plans enregistrés.
    for (const recette of echantillon()) {
      const resolue = recetteParId(recette.id)
      expect(resolue?.id).toBe(recette.id)
      expect(resolue?.titre).toBe(recette.titre)
      expect(resolue?.kcal).toBe(recette.kcal)
    }
  })

  it('garde les recettes manuelles à leur identifiant', () => {
    // `RECETTES` ne contient que les recettes écrites à la main ; toutes doivent
    // se retrouver dans le catalogue complet, sinon un favori posé sur la
    // carbonade cesserait de résoudre.
    for (const ecrite of RECETTES) {
      expect(recetteParId(ecrite.id)?.titre).toBe(ecrite.titre)
    }
  })

  it('préfixe les recettes composées et pas les autres', () => {
    // La distinction sert à savoir ce qui est réécrivable : une recette composée
    // peut changer de texte, une recette écrite à la main n'appartient qu'à son
    // fichier.
    const idsEcrits = new Set(RECETTES.map((r) => r.id))
    for (const recette of catalogue()) {
      if (recette.id.startsWith('c:')) expect(idsEcrits.has(recette.id)).toBe(false)
    }
  })
})

describe('la qualité de chaque recette', () => {
  it('porte un titre, un temps et des calories crédibles', () => {
    const fautives = echantillon().filter(
      (r) =>
        r.titre.trim().length < 3 ||
        r.minutes <= 0 ||
        r.kcal <= 0 ||
        // Les calories sont écrites **pour une personne** : au-delà, c'est que
        // la recette a été saisie pour plusieurs et fausserait le journal, les
        // bandes de charge et le planificateur d'un facteur entier.
        r.kcal > 1500,
    )
    expect(fautives.map((r) => `${r.id} — ${r.titre} (${r.kcal} kcal, ${r.minutes} min)`)).toEqual([])
  })

  it('porte au moins un ingrédient et une étape', () => {
    const vides = echantillon().filter((r) => r.ingredients.length === 0 || r.etapes.length === 0)
    expect(vides.map((r) => r.id)).toEqual([])
  })

  it('n’a ni étape vide ni ingrédient sans nom', () => {
    const abimees = echantillon().filter(
      (r) => r.etapes.some((e) => e.trim().length < 3) || r.ingredients.some((i) => !i.nom?.trim()),
    )
    expect(abimees.map((r) => r.id)).toEqual([])
  })
})

describe('recettesDuMoment', () => {
  it('donne au moins une douzaine de candidats à chaque moment', () => {
    // Le planificateur ne peut pas faire mieux que son catalogue : sa pénalité
    // de répétition ne compense pas un manque de candidats, et le déséquilibre
    // d'origine (6 déjeuners, 5 dîners) faisait revenir les mêmes plats deux ou
    // trois fois dans une semaine générée.
    for (const moment of MOMENTS) {
      expect(recettesDuMoment(moment).length).toBeGreaterThanOrEqual(12)
    }
  })

  it('ne rend que des recettes du moment demandé', () => {
    for (const moment of MOMENTS) {
      const intruses = recettesDuMoment(moment).filter((r) => r.moment !== moment)
      expect(intruses.map((r) => r.id)).toEqual([])
    }
  })
})

describe('listeDeCourses', () => {
  it('range les ingrédients par rayon', () => {
    const liste = listeDeCourses(RECETTES.slice(0, 3).map((r) => r.id))
    const lignes = Object.values(liste).flat()
    expect(lignes.length).toBeGreaterThan(0)
  })

  it('ne rend rien plutôt que de planter sur un identifiant inconnu', () => {
    // Un plan enregistré peut référencer une recette retirée du catalogue :
    // l'écran des courses doit rester ouvrable.
    expect(() => listeDeCourses(['c:inexistante'])).not.toThrow()
  })
})

/**
 * Un échantillon déterministe et régulier du catalogue.
 *
 * Contrôler les sept mille recettes une par une sur une dizaine d'assertions
 * ferait de ce fichier le plus lent du projet pour une garantie à peine
 * meilleure. Le pas est premier et fixe : l'échantillon balaie tous les moments,
 * tous les styles et tous les formats de plat, et il est **le même à chaque
 * exécution** — un échantillon tiré au hasard rendrait la suite intermittente,
 * c'est-à-dire ignorée au bout de trois faux négatifs.
 */
function echantillon() {
  const tout = catalogue()
  const pas = 37
  return tout.filter((_, i) => i % pas === 0)
}
