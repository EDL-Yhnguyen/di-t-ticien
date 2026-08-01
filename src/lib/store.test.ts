import { describe, expect, it } from 'vitest'
import type { Utilisateur } from './auth'
import {
  eauDuJour,
  enviesDuJour,
  etatInitial,
  fusionner,
  meilleurScore,
  peseeDuJour,
  poidsActuel,
  poidsLePlusRecent,
  profilInitial,
  repasDuJour,
} from './store'
import type { EtatUtilisateur } from './store'
import { jourISO } from './utils'

/**
 * `fusionner` est la migration ascendante de tout le projet, et le seul endroit
 * du code où un oubli coûte des données de santé **sans rien signaler**.
 *
 * La règle est écrite depuis longtemps dans `CLAUDE.md` : ajouter un champ
 * persistant demande trois gestes — l'interface, `etatInitial`, et la ligne de
 * `fusionner`. Le troisième est celui qu'on oublie, parce que les deux premiers
 * suffisent à faire compiler *et* à faire marcher l'application pendant toute la
 * séance de travail. Le champ ne disparaît qu'au rechargement suivant.
 *
 * Le premier test de ce fichier rend cette règle **exécutable** : il parcourt
 * les clés d'`etatInitial` au lieu de les énumérer, donc un champ ajouté demain
 * y entre tout seul. C'est ce qui le distingue d'un test qu'il faudrait penser à
 * mettre à jour — et qu'on oublierait exactement comme la ligne de `fusionner`.
 *
 * ## Pourquoi rien ici n'appelle `charger()` ni `enregistrer()`
 *
 * Ces deux-là écrivent pour de bon. `supabase` n'est `null` qu'en l'absence de
 * clés, or un `.env` traîne sur toute machine de développement : un test qui les
 * appellerait écrirait dans la vraie base, sous le vrai identifiant. `fusionner`
 * est pure, et c'est tout ce dont on a besoin.
 */

const UTILISATEUR: Utilisateur = {
  id: 'u-essai',
  email: 'essai@equilibre.local',
  prenom: 'Essai',
}

/**
 * Une valeur reconnaissable, adaptée à la forme du défaut.
 *
 * On ne peut pas deviner le type d'un champ ajouté demain, mais on peut lui
 * donner une valeur du même genre que sa valeur par défaut : un tableau reçoit
 * un élément, un objet une propriété, `null` un objet, une chaîne un texte. Il
 * suffit qu'elle **diffère du défaut** pour qu'un champ perdu se voie.
 */
function valeurTemoin(defaut: unknown, cle: string): unknown {
  if (Array.isArray(defaut)) return [{ temoin: cle }]
  if (defaut === null) return { temoin: cle }
  if (typeof defaut === 'string') return `temoin-${cle}`
  if (typeof defaut === 'number') return 123.456
  if (typeof defaut === 'boolean') return !defaut
  if (typeof defaut === 'object') return { ...(defaut as object), temoin: cle }
  return `temoin-${cle}`
}

describe('fusionner — la règle des trois endroits, rendue exécutable', () => {
  it('ne perd aucun champ du document, quel qu’il soit', () => {
    // Ce test ne connaît pas la liste des champs : il la lit. Un champ ajouté à
    // `EtatUtilisateur` et à `etatInitial` mais oublié dans `fusionner` échoue
    // ici, avec son nom.
    const base = etatInitial(UTILISATEUR)
    const temoin = Object.fromEntries(
      Object.entries(base).map(([cle, defaut]) => [cle, valeurTemoin(defaut, cle)]),
    ) as unknown as Partial<EtatUtilisateur>

    const fusionne = fusionner(UTILISATEUR, temoin) as unknown as Record<string, unknown>

    const perdus: string[] = []
    for (const cle of Object.keys(base)) {
      const attendu = (temoin as Record<string, unknown>)[cle]
      if (JSON.stringify(fusionne[cle]) !== JSON.stringify(attendu)) {
        perdus.push(
          `${cle} — attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(fusionne[cle])}`,
        )
      }
    }
    expect(perdus).toEqual([])
  })

  it('rend exactement les mêmes clés qu’`etatInitial`, ni plus ni moins', () => {
    // Une clé en trop est un champ retiré de l'interface mais recopié quand
    // même ; une clé en moins est un champ perdu.
    const base = Object.keys(etatInitial(UTILISATEUR)).sort()
    const fusionne = Object.keys(fusionner(UTILISATEUR, {})).sort()
    expect(fusionne).toEqual(base)
  })
})

describe('fusionner — un document vide', () => {
  it('rend un état complet à partir de rien', () => {
    // Le cas du premier chargement d'un compte créé avant un champ : tout ce qui
    // manque prend sa valeur par défaut, rien n'est `undefined`.
    const etat = fusionner(UTILISATEUR, {}) as unknown as Record<string, unknown>
    for (const [cle, valeur] of Object.entries(etat)) {
      expect(valeur, `le champ ${cle} est undefined`).not.toBeUndefined()
    }
  })

  it('n’accorde aucun consentement par défaut', () => {
    // Un consentement supposé n'est pas un consentement (RGPD, art. 7.1). Les
    // deux doivent partir de `null`, et surtout pas d'un objet vide qui
    // passerait pour un accord donné.
    const etat = fusionner(UTILISATEUR, {})
    expect(etat.consentement).toBeNull()
    expect(etat.consentementCoach).toBeNull()
  })

  it('pose une première pesée au poids de départ', () => {
    // Sans elle, la courbe de poids est vide et la trajectoire n'a pas d'origine.
    const etat = fusionner(UTILISATEUR, {})
    expect(etat.pesees).toHaveLength(1)
    expect(etat.pesees[0].poidsKg).toBe(etat.profil.poidsDepartKg)
  })
})

describe('fusionner — l’identité reste celle de la session', () => {
  it('impose l’identifiant et le courriel du compte connecté', () => {
    // Un document recopié d'un compte à l'autre — un export réimporté, un
    // copier-coller de `localStorage` — ne doit pas emporter l'identité de son
    // auteur : c'est la session qui fait foi, et la RLS s'appuie dessus.
    const etat = fusionner(UTILISATEUR, {
      profil: { ...profilInitial(UTILISATEUR), id: 'quelqu-un-d-autre', email: 'autre@exemple.fr' },
    })
    expect(etat.profil.id).toBe('u-essai')
    expect(etat.profil.email).toBe('essai@equilibre.local')
  })

  it('conserve le reste du profil enregistré', () => {
    const etat = fusionner(UTILISATEUR, {
      profil: { ...profilInitial(UTILISATEUR), prenom: 'Camille', tailleCm: 172, age: 41 },
    })
    expect(etat.profil.prenom).toBe('Camille')
    expect(etat.profil.tailleCm).toBe(172)
    expect(etat.profil.age).toBe(41)
  })

  it('complète un profil ancien auquel il manque des champs', () => {
    // Un profil enregistré avant l'ajout de `praticien` ou de `petitNom` doit
    // repartir avec les défauts, pas avec des trous.
    const etat = fusionner(UTILISATEUR, {
      profil: { prenom: 'Camille' } as EtatUtilisateur['profil'],
    })
    expect(etat.profil.prenom).toBe('Camille')
    expect(etat.profil.activite).toBeDefined()
    expect(etat.profil.poidsObjectifKg).toBeDefined()
  })
})

describe('fusionner — la migration `menus` → `plans`', () => {
  const semaine = {
    debut: '2026-07-27',
    genereLe: '2026-07-26',
    jours: [
      {
        date: '2026-07-27',
        repas: { 'petit-dejeuner': 'r1', dejeuner: 'r2', collation: null, diner: 'r3' },
      },
    ],
  }

  it('reprend la semaine unique d’avant le 30/07/2026', () => {
    // La perdre effacerait un plan que quelqu'un vient peut-être de composer.
    const etat = fusionner(UTILISATEUR, { menus: semaine } as Partial<EtatUtilisateur>)
    expect(etat.plans).toHaveLength(1)
    expect(etat.plans[0].debut).toBe('2026-07-27')
  })

  it('ignore l’ancien champ dès que le nouveau existe', () => {
    // Sinon un document déjà migré verrait sa vieille semaine réapparaître à
    // chaque chargement, en doublon de celles qui l'ont remplacée.
    const etat = fusionner(UTILISATEUR, {
      menus: semaine,
      plans: [{ ...semaine, debut: '2026-08-03' }],
    } as Partial<EtatUtilisateur>)
    expect(etat.plans).toHaveLength(1)
    expect(etat.plans[0].debut).toBe('2026-08-03')
  })

  it('ne fabrique aucun plan quand l’ancien champ est nul', () => {
    const etat = fusionner(UTILISATEUR, { menus: null } as Partial<EtatUtilisateur>)
    expect(etat.plans).toEqual([])
  })
})

describe('les lectures dérivées', () => {
  const etat = (partiel: Partial<EtatUtilisateur>) => fusionner(UTILISATEUR, partiel)

  it('prend la pesée la plus récente, quel que soit l’ordre du tableau', () => {
    // Rien ne garantit que les pesées soient triées dans le document : elles
    // sont ajoutées au fil de la saisie, et une correction rétroactive les
    // désordonne.
    const e = etat({
      pesees: [
        { date: '2026-07-20', poidsKg: 71 },
        { date: '2026-08-01', poidsKg: 68 },
        { date: '2026-07-25', poidsKg: 70 },
      ],
    })
    expect(poidsActuel(e)).toBe(68)
  })

  it('retombe sur le poids de départ quand rien n’est pesé', () => {
    const e = etat({ pesees: [] })
    expect(poidsActuel(e)).toBe(e.profil.poidsDepartKg)
  })

  it('préfère une mesure importée plus fraîche qu’une pesée saisie', () => {
    const e = etat({
      pesees: [{ date: '2026-07-20', poidsKg: 71 }],
      mesuresSante: [{ date: '2026-08-01', poidsKg: 69 }] as EtatUtilisateur['mesuresSante'],
    })
    expect(poidsLePlusRecent(e)).toBe(69)
    // Mais `poidsActuel` ne regarde que les pesées saisies : les deux lectures
    // répondent à deux questions différentes.
    expect(poidsActuel(e)).toBe(71)
  })

  it('ignore une mesure importée qui ne porte pas de poids', () => {
    // L'export d'Apple Santé contient aussi des pas et de l'énergie active : une
    // ligne sans poids ne doit pas devenir un poids de zéro.
    const e = etat({
      pesees: [{ date: '2026-07-20', poidsKg: 71 }],
      mesuresSante: [{ date: '2026-08-01' }] as EtatUtilisateur['mesuresSante'],
    })
    expect(poidsLePlusRecent(e)).toBe(71)
  })

  it('rend un verre d’eau à zéro plutôt que rien', () => {
    // L'écran additionne cette valeur : un `undefined` y deviendrait « NaN verre ».
    const e = etat({ eau: [] })
    expect(eauDuJour(e, '2026-08-01')).toEqual({ date: '2026-08-01', verres: 0 })
  })

  it('retrouve la pesée et les repas du jour demandé', () => {
    const e = etat({
      pesees: [{ date: '2026-08-01', poidsKg: 68 }],
      repas: [
        { date: '2026-08-01', moment: 'dejeuner', composantsCoches: ['a'] },
        { date: '2026-07-31', moment: 'diner', composantsCoches: ['b'] },
      ],
    })
    expect(peseeDuJour(e, '2026-08-01')?.poidsKg).toBe(68)
    expect(peseeDuJour(e, '2026-07-30')).toBeUndefined()
    expect(repasDuJour(e, '2026-08-01')).toHaveLength(1)
  })

  it('range les envies par la date de leur horodatage', () => {
    const e = etat({
      envies: [
        { horodatage: '2026-08-01T15:00:00.000Z' },
        { horodatage: '2026-07-31T22:00:00.000Z' },
      ] as EtatUtilisateur['envies'],
    })
    expect(enviesDuJour(e, '2026-08-01')).toHaveLength(1)
  })

  it('rend le meilleur score d’un jeu, et zéro pour un jeu jamais joué', () => {
    const e = etat({
      scores: [
        { jeu: 'memo', score: 12 },
        { jeu: 'memo', score: 30 },
        { jeu: 'quiz', score: 8 },
      ] as EtatUtilisateur['scores'],
    })
    expect(meilleurScore(e, 'memo')).toBe(30)
    expect(meilleurScore(e, 'respiration')).toBe(0)
  })
})

describe('etatInitial', () => {
  it('part sur un document vide, sans rien inventer', () => {
    const etat = etatInitial(UTILISATEUR)
    expect(etat.journal).toEqual([])
    expect(etat.badges).toEqual([])
    expect(etat.favoris).toEqual([])
    expect(etat.consentement).toBeNull()
    expect(etat.profil.onboardingFait).toBe(false)
  })

  it('ne conserve aucune coordonnée de praticien dans le code', () => {
    // Les coordonnées d'un tiers qui n'a rien consenti sont sorties du dépôt le
    // 28/07/2026 : elles appartiennent au profil de l'utilisateur, saisies par
    // lui et protégées par la RLS.
    expect(etatInitial(UTILISATEUR).profil.praticien).toBeNull()
    expect(JSON.stringify(etatInitial(UTILISATEUR))).not.toMatch(/bertolotto|alivio|07 58/i)
  })

  it('date la création du profil', () => {
    expect(etatInitial(UTILISATEUR).profil.creeLe).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('pose la pesée du jour à la bonne date', () => {
    expect(etatInitial(UTILISATEUR).pesees[0].date).toBe(jourISO())
  })
})
