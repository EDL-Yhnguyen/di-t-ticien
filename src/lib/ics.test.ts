import { describe, expect, it } from 'vitest'
import { icsDuPlan } from './ics'
import { RECETTES } from './recettes'
import type { JourMenu, Moment, PlanSemaine } from './types'
import { MOMENTS } from './types'

/**
 * Le fichier `.ics` part chez Google Agenda, Apple Calendrier ou Outlook, et
 * **on ne voit jamais ce qu'ils en font**. Un champ mal échappé n'y produit pas
 * une erreur : il produit un événement dont le titre s'arrête à la virgule, ou
 * un import silencieusement refusé.
 *
 * Ce module a été « inspecté ligne à ligne » une fois, à la main, au sprint C4.
 * Les propriétés que cette inspection avait vérifiées sont écrites ici, parce
 * qu'un `.ics` ne se relit pas deux fois de la même façon.
 *
 * Références : RFC 5545, § 3.1 (pliage), § 3.3.11 (échappement).
 */

/** Une semaine réelle, construite à partir de recettes du catalogue. */
function plan(repasParJour: Partial<Record<Moment, string | null>>[] = []): PlanSemaine {
  const dates = ['2026-08-03', '2026-08-04', '2026-08-05']
  const vide: Record<Moment, string | null> = {
    'petit-dejeuner': null,
    dejeuner: null,
    collation: null,
    diner: null,
  }
  const jours: JourMenu[] = dates.map((date, i) => ({
    date,
    repas: { ...vide, ...(repasParJour[i] ?? {}) },
  }))
  return { debut: '2026-08-03', jours, genereLe: '2026-08-01' }
}

/** Une recette du catalogue pour un moment donné — pas un identifiant inventé. */
function recetteDe(moment: Moment): string {
  const trouvee = RECETTES.find((r) => r.moment === moment)
  if (!trouvee) throw new Error(`aucune recette manuelle au moment ${moment}`)
  return trouvee.id
}

const MAINTENANT = new Date('2026-08-01T09:30:00.000Z')

/** Les lignes dépliées : le pliage se défait avant toute lecture de contenu. */
function lignes(ics: string): string[] {
  return ics.replace(/\r\n /g, '').split('\r\n')
}

describe('la structure du calendrier', () => {
  it('ouvre et ferme un VCALENDAR conforme', () => {
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    const l = lignes(ics)
    expect(l[0]).toBe('BEGIN:VCALENDAR')
    expect(l).toContain('VERSION:2.0')
    expect(l).toContain('CALSCALE:GREGORIAN')
    expect(l.filter((x) => x !== '')).toContain('END:VCALENDAR')
  })

  it('termine le fichier par un CRLF, comme la RFC l’exige', () => {
    // Certains importeurs rejettent un fichier terminé par un simple saut de
    // ligne, et le refus est muet.
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics).not.toMatch(/[^\r]\n/)
  })

  it('équilibre chaque VEVENT', () => {
    const ics = icsDuPlan(
      plan([
        { dejeuner: recetteDe('dejeuner'), diner: recetteDe('diner') },
        { 'petit-dejeuner': recetteDe('petit-dejeuner') },
      ]),
      MAINTENANT,
    )
    const l = lignes(ics)
    const debuts = l.filter((x) => x === 'BEGIN:VEVENT').length
    const fins = l.filter((x) => x === 'END:VEVENT').length
    expect(debuts).toBe(3)
    expect(fins).toBe(3)
  })

  it('produit un calendrier vide mais valide sur une semaine sans repas', () => {
    // Une semaine non composée s'exporte quand même : un fichier vide vaut mieux
    // qu'un bouton qui échoue sans dire pourquoi.
    const l = lignes(icsDuPlan(plan(), MAINTENANT))
    expect(l).toContain('BEGIN:VCALENDAR')
    expect(l.filter((x) => x === 'BEGIN:VEVENT')).toHaveLength(0)
  })

  it('ignore un identifiant de recette qui ne résout plus', () => {
    // Un plan enregistré peut référencer une recette retirée du catalogue :
    // l'export doit sauter l'événement, pas produire un fichier abîmé.
    const l = lignes(icsDuPlan(plan([{ dejeuner: 'c:inexistante' }]), MAINTENANT))
    expect(l.filter((x) => x === 'BEGIN:VEVENT')).toHaveLength(0)
    expect(l).toContain('END:VCALENDAR')
  })
})

describe('les heures — locales et flottantes', () => {
  it('n’écrit ni TZID ni Z sur les heures de repas', () => {
    // Un déjeuner doit rester à midi, y compris après un vol. Fixer le fuseau
    // ferait apparaître le dîner à 3 h du matin.
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    const debut = lignes(ics).find((x) => x.startsWith('DTSTART'))
    const fin = lignes(ics).find((x) => x.startsWith('DTEND'))
    expect(debut).toBe('DTSTART:20260803T123000')
    expect(fin).toBe('DTEND:20260803T131500')
    expect(debut).not.toContain('TZID')
    expect(debut).not.toMatch(/Z$/)
  })

  it('horodate le fichier en UTC, lui', () => {
    // `DTSTAMP` est la date de production du fichier, pas un repas : elle est
    // absolue et doit porter le Z.
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    expect(lignes(ics).find((x) => x.startsWith('DTSTAMP'))).toBe('DTSTAMP:20260801T093000Z')
  })

  it('place chaque moment à son heure et lui donne une durée', () => {
    const attendu: Record<Moment, [string, string]> = {
      'petit-dejeuner': ['20260803T080000', '20260803T082000'],
      dejeuner: ['20260803T123000', '20260803T131500'],
      collation: ['20260803T163000', '20260803T164500'],
      diner: ['20260803T200000', '20260803T204500'],
    }
    for (const moment of MOMENTS) {
      const ics = icsDuPlan(plan([{ [moment]: recetteDe(moment) }]), MAINTENANT)
      const l = lignes(ics)
      expect(l).toContain(`DTSTART:${attendu[moment][0]}`)
      expect(l).toContain(`DTEND:${attendu[moment][1]}`)
    }
  })
})

describe('les UID — stables d’un export à l’autre', () => {
  it('produit le même fichier deux fois de suite', () => {
    // Réimporter la même semaine doit mettre à jour les événements, pas créer
    // vingt-huit doublons.
    const p = plan([{ dejeuner: recetteDe('dejeuner'), diner: recetteDe('diner') }])
    expect(icsDuPlan(p, MAINTENANT)).toBe(icsDuPlan(p, MAINTENANT))
  })

  it('donne un UID distinct à chaque repas', () => {
    const ics = icsDuPlan(
      plan([
        { dejeuner: recetteDe('dejeuner'), diner: recetteDe('diner') },
        { dejeuner: recetteDe('dejeuner') },
      ]),
      MAINTENANT,
    )
    const uids = lignes(ics).filter((x) => x.startsWith('UID:'))
    expect(uids).toHaveLength(3)
    expect(new Set(uids).size).toBe(3)
  })

  it('lie l’UID à la date et au moment, pas au rang dans la liste', () => {
    // Un UID assis sur un index changerait au premier repas déplacé, et
    // l'agenda accumulerait les orphelins.
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    const uid = lignes(ics).find((x) => x.startsWith('UID:'))
    expect(uid).toContain('2026-08-03')
    expect(uid).toContain('dejeuner')
    expect(uid).toMatch(/@mamakilo$/)
  })
})

describe('l’échappement — RFC 5545 § 3.3.11', () => {
  it('échappe virgules et points-virgules dans tous les champs de texte', () => {
    // Une virgule non échappée découpe le champ en deux valeurs : l'agenda
    // affiche alors la moitié du plat.
    const ics = icsDuPlan(
      plan([{ dejeuner: recetteDe('dejeuner'), diner: recetteDe('diner') }]),
      MAINTENANT,
    )
    for (const ligne of lignes(ics)) {
      if (!/^(SUMMARY|DESCRIPTION|X-WR-CALNAME):/.test(ligne)) continue
      const valeur = ligne.slice(ligne.indexOf(':') + 1)
      // Toute virgule et tout point-virgule doivent être précédés d'une barre
      // oblique inverse. On retire d'abord les paires échappées.
      const sansEchappes = valeur.replace(/\\[\\;,n]/g, '')
      expect(sansEchappes).not.toMatch(/[;,]/)
    }
  })

  it('ne laisse aucun saut de ligne brut dans la description', () => {
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    const description = lignes(ics).find((x) => x.startsWith('DESCRIPTION:'))
    expect(description).toBeDefined()
    expect(description).toContain('\\n')
    expect(description).not.toMatch(/[\n\r]/)
  })

  it('emporte les ingrédients et les étapes dans la description', () => {
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    const description = lignes(ics).find((x) => x.startsWith('DESCRIPTION:')) ?? ''
    expect(description).toContain('Ingrédients')
    expect(description).toContain('Préparation')
    expect(description).toMatch(/kcal/)
  })
})

describe('le pliage — RFC 5545 § 3.1', () => {
  it('ne laisse aucune ligne au-dessus de 75 octets', () => {
    const ics = icsDuPlan(
      plan([
        { dejeuner: recetteDe('dejeuner'), diner: recetteDe('diner') },
        { 'petit-dejeuner': recetteDe('petit-dejeuner'), collation: recetteDe('collation') },
      ]),
      MAINTENANT,
    )
    const trop = ics
      .split('\r\n')
      .filter((ligne) => new TextEncoder().encode(ligne).length > 75)
    expect(trop).toEqual([])
  })

  it('replie avec une espace de continuation, et rien d’autre', () => {
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    // Toute ligne de continuation commence par une espace : c'est le seul
    // marqueur qui existe, et un agenda qui ne le trouve pas lit une propriété
    // inconnue.
    const brutes = ics.split('\r\n').slice(1)
    for (const ligne of brutes) {
      if (ligne === '') continue
      expect(ligne.startsWith(' ') || /^[A-Z-]+[:;]/.test(ligne)).toBe(true)
    }
  })

  it('ne coupe jamais un caractère accentué en deux', () => {
    // « é » occupe deux octets ; couper entre les deux produit un fichier qu'un
    // agenda refuse ou affiche en mojibake, et les recettes françaises en sont
    // pleines. Le contrôle : le texte déplié doit se relire à l'identique.
    const ics = icsDuPlan(
      plan([{ dejeuner: recetteDe('dejeuner'), diner: recetteDe('diner') }]),
      MAINTENANT,
    )
    expect(ics).not.toContain('�')
    const description = lignes(ics).find((x) => x.startsWith('DESCRIPTION:')) ?? ''
    expect(description).not.toContain('�')
  })
})

describe('ce que le fichier ne fait pas', () => {
  it('ne pose aucune alarme', () => {
    // Vingt-huit rappels par semaine transformeraient un plan de repas en
    // harcèlement. C'est à l'agenda, et à son propriétaire, de décider.
    const ics = icsDuPlan(
      plan([{ dejeuner: recetteDe('dejeuner'), diner: recetteDe('diner') }]),
      MAINTENANT,
    )
    expect(ics).not.toContain('VALARM')
    expect(ics).not.toContain('TRIGGER')
  })

  it('n’occupe pas le créneau dans l’agenda', () => {
    // `TRANSP:TRANSPARENT` : un déjeuner planifié ne doit pas faire apparaître
    // quelqu'un comme occupé pour ses collègues.
    const ics = icsDuPlan(plan([{ dejeuner: recetteDe('dejeuner') }]), MAINTENANT)
    expect(lignes(ics)).toContain('TRANSP:TRANSPARENT')
  })
})
