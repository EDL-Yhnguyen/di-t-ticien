import { describe, expect, it } from 'vitest'
import type { Utilisateur } from './auth'
import { VERSION_CONFIDENTIALITE } from './legal'
import { consentementAJour, consentementDuJour, documentExport, VERSION_CONSENTEMENT } from './rgpd'
import { etatInitial } from './store'

/**
 * Trois droits que l'application doit rendre exerçables sans écrire à personne :
 * consentir (art. 7), emporter ses données (art. 20), les effacer (art. 17).
 *
 * Ce qui se teste ici, c'est **l'intégralité de l'export** et la logique de
 * version du consentement. Le reste — `telechargerExport`, `toutSupprimer` —
 * écrit dans la base et sur l'appareil : ces fonctions ne s'appellent pas depuis
 * un test, sous peine de supprimer un vrai compte.
 *
 * Le premier test est le même mécanisme que celui de `store.test.ts` : il lit la
 * liste des champs au lieu de l'énumérer, donc un champ ajouté demain y entre
 * tout seul. C'est ce qui fait qu'il protège encore dans un an.
 */

const UTILISATEUR: Utilisateur = {
  id: 'u-essai',
  email: 'essai@equilibre.local',
  prenom: 'Essai',
}

describe('documentExport — l’intégralité est due', () => {
  it('emporte tous les champs du document, sans en filtrer un seul', () => {
    // « Ne pas le filtrer pour faire propre — c'est justement l'intégralité qui
    // est due. » Un champ retiré de l'export ampute un droit, et rien à l'écran
    // ne le dirait.
    const etat = etatInitial(UTILISATEUR)
    const exporte = documentExport(etat) as unknown as Record<string, unknown>

    const absents = Object.keys(etat).filter((cle) => !(cle in exporte))
    expect(absents).toEqual([])
  })

  it('rend les valeurs telles quelles, sans les réécrire', () => {
    // « Dans la forme exacte où elle le stocke » : un export retravaillé pour la
    // lisibilité n'est plus portable au sens de l'article 20.
    const etat = etatInitial(UTILISATEUR)
    etat.favoris = ['c:une-recette']
    etat.badges = ['premiere-pesee']
    etat.profil.prenom = 'Camille'

    const exporte = documentExport(etat)
    expect(exporte.favoris).toEqual(['c:une-recette'])
    expect(exporte.badges).toEqual(['premiere-pesee'])
    expect(exporte.profil.prenom).toBe('Camille')
  })

  it('emporte ce qui ne vit pas dans le document', () => {
    // Les relevés de prix sont en IndexedDB et les photos sur l'appareil, pour
    // ne pas alourdir le document synchronisé. L'article 20 porte sur **tout**
    // ce que l'application détient : les oublier ferait d'un choix technique une
    // amputation du droit.
    const releves = [{ produit: 'Emmental', prix: 2.45, enseigne: 'aldi' }]
    const photos = { profil: 'data:image/webp;base64,AAAA' }
    const exporte = documentExport(etatInitial(UTILISATEUR), releves, photos)

    expect(exporte.relevesPrix).toEqual(releves)
    expect(exporte.photos).toEqual(photos)
  })

  it('prévoit ces deux champs même quand il n’y a rien à y mettre', () => {
    // Un champ absent laisserait croire que l'application ne détient rien de ce
    // genre ; un tableau vide dit qu'elle n'en détient pas *pour vous*.
    const exporte = documentExport(etatInitial(UTILISATEUR))
    expect(exporte.relevesPrix).toEqual([])
    expect(exporte.photos).toEqual({})
  })

  it('garde le format `equilibre-export-v1`', () => {
    // Le préfixe `equilibre` survit exprès dans trois endroits, et celui-ci en
    // fait partie : des fichiers déjà téléchargés le portent, et le renommer
    // rendrait illisible un export que quelqu'un a conservé.
    expect(documentExport(etatInitial(UTILISATEUR))._format).toBe('equilibre-export-v1')
  })

  it('se date et s’explique', () => {
    const exporte = documentExport(etatInitial(UTILISATEUR))
    expect(exporte._exporteLe).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(exporte._lisezMoi.length).toBeGreaterThan(50)
  })

  it('produit un JSON valide et relisible', () => {
    // C'est la promesse du fichier : « il se recharge dans n'importe quel outil
    // acceptant du JSON ».
    const etat = etatInitial(UTILISATEUR)
    etat.profil.prenom = 'Élodie'
    const texte = JSON.stringify(documentExport(etat), null, 2)
    expect(() => JSON.parse(texte)).not.toThrow()
    expect(JSON.parse(texte).profil.prenom).toBe('Élodie')
  })

  it('ne place aucun champ technique en travers des données', () => {
    // Les trois champs d'en-tête portent un tiret bas : c'est ce qui les
    // distingue des données de la personne, et ce qui garantit qu'ils
    // n'écrasent jamais un champ du document.
    const etat = etatInitial(UTILISATEUR)
    const exporte = documentExport(etat) as unknown as Record<string, unknown>
    const techniques = Object.keys(exporte).filter((c) => c.startsWith('_'))
    expect(techniques.sort()).toEqual(['_exporteLe', '_format', '_lisezMoi'])
    for (const cle of techniques) {
      expect(cle in etat).toBe(false)
    }
  })
})

describe('le consentement — un accord porte sur un texte daté', () => {
  it('suit la version du texte de confidentialité', () => {
    expect(VERSION_CONSENTEMENT).toBe(VERSION_CONFIDENTIALITE)
  })

  it('reconnaît un accord donné à la version en vigueur', () => {
    expect(consentementAJour(consentementDuJour())).toBe(true)
  })

  it('périme un accord donné à une version antérieure', () => {
    // Changer la version redemande son accord à tout le monde : c'est le prix
    // d'une nouvelle donnée collectée ou d'un nouveau destinataire.
    expect(consentementAJour({ version: '2020-01-01', accepteLe: '2020-01-01T00:00:00.000Z' })).toBe(
      false,
    )
  })

  it('ne considère pas l’absence d’accord comme un accord', () => {
    // Le RGPD demande de pouvoir *démontrer* l'accord (art. 7.1), pas de le
    // supposer. Un `null` traité comme valide serait exactement la supposition.
    expect(consentementAJour(null)).toBe(false)
  })

  it('horodate l’accord au moment où il est donné', () => {
    const consentement = consentementDuJour()
    expect(consentement.accepteLe).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(Number.isNaN(Date.parse(consentement.accepteLe))).toBe(false)
  })

  it('date la version en vigueur au format ISO court', () => {
    // Elle est comparée par égalité de chaîne : un format qui dérive ferait
    // périmer tous les consentements d'un coup.
    expect(VERSION_CONSENTEMENT).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
