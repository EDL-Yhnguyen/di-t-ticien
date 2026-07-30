import { recetteParId } from './recettes'
import type { PlanSemaine } from './types'
import { LIBELLE_MOMENT, MOMENTS } from './types'
import type { Moment } from './types'

/**
 * Exporter une semaine de menus vers un agenda.
 *
 * **C'est la version livrable de la « synchronisation d'agendas » du brief.**
 * Google, Apple et Outlook demandent chacun une application OAuth, un secret
 * côté serveur, des jetons de rafraîchissement et un écran de révocation — donc
 * une infrastructure que ce projet n'a pas. Les trois savent en revanche
 * importer un fichier `.ics`, et un fichier ne demande aucun compte, aucune
 * autorisation, et ne transmet rien à personne : le plan reste sur l'appareil
 * jusqu'à ce que la personne le dépose elle-même où elle veut.
 *
 * Le point d'extension OAuth reste ouvert : ce module produit le contenu, il ne
 * décide pas de sa destination.
 */

/**
 * L'heure de chaque repas, en heure locale.
 *
 * Des repères, pas des prescriptions : l'agenda est là pour rappeler quoi
 * cuisiner, pas pour imposer de manger à 12 h 30 précises.
 */
const HEURES: Record<Moment, { heure: number; minute: number; duree: number }> = {
  'petit-dejeuner': { heure: 8, minute: 0, duree: 20 },
  dejeuner: { heure: 12, minute: 30, duree: 45 },
  collation: { heure: 16, minute: 30, duree: 15 },
  diner: { heure: 20, minute: 0, duree: 45 },
}

/**
 * Échappe un texte pour un champ ICS (RFC 5545, § 3.3.11).
 *
 * L'ordre compte : la barre oblique inverse d'abord, sinon on échapperait les
 * barres qu'on vient d'ajouter. Un titre de recette contient des virgules
 * (« Poulet au citron, haricots verts »), et une virgule non échappée découpe le
 * champ en deux valeurs — l'agenda affiche alors la moitié du plat.
 */
function echapper(texte: string): string {
  return texte
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Replie une ligne à 75 octets (RFC 5545, § 3.1).
 *
 * Le découpage se compte en **octets et non en caractères** : « é » en occupe
 * deux, et couper entre les deux produit un fichier qu'un agenda refuse ou
 * affiche en mojibake. Les recettes en français en sont pleines.
 */
function replier(ligne: string): string {
  const octets = new TextEncoder().encode(ligne)
  if (octets.length <= 75) return ligne

  const morceaux: string[] = []
  let debut = 0
  // 74 octets pour la première ligne, 73 pour les suivantes qui portent en plus
  // l'espace de continuation.
  let limite = 74

  while (debut < octets.length) {
    let fin = Math.min(debut + limite, octets.length)
    // Ne pas couper au milieu d'un caractère : les octets de continuation UTF-8
    // valent 10xxxxxx, on remonte jusqu'au début du caractère.
    while (fin < octets.length && (octets[fin] & 0xc0) === 0x80) fin--
    morceaux.push(new TextDecoder().decode(octets.slice(debut, fin)))
    debut = fin
    limite = 73
  }

  return morceaux.join('\r\n ')
}

/** `20260730T123000` — heure locale, sans fuseau. Voir `evenementsDuPlan`. */
function horodatageLocal(date: string, heure: number, minute: number): string {
  const jour = date.replace(/-/g, '')
  return `${jour}T${String(heure).padStart(2, '0')}${String(minute).padStart(2, '0')}00`
}

function horodatageUTC(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
}

function finDuRepas(date: string, moment: Moment): string {
  const { heure, minute, duree } = HEURES[moment]
  const d = new Date(`${date}T${String(heure).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`)
  d.setMinutes(d.getMinutes() + duree)
  return horodatageLocal(
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    d.getHours(),
    d.getMinutes(),
  )
}

/**
 * Le fichier `.ics` d'une semaine de menus.
 *
 * **Les heures sont locales et flottantes** (sans `TZID` ni `Z`) : un déjeuner
 * doit rester à midi, y compris pour quelqu'un qui change de fuseau horaire en
 * cours de semaine. Fixer le fuseau ferait apparaître le dîner à 3 h du matin
 * après un vol, ce qui n'a aucun sens pour un repas.
 *
 * **Aucune alarme n'est posée.** Vingt-huit rappels par semaine transformeraient
 * un plan de repas en harcèlement ; c'est à l'agenda, et à son propriétaire, de
 * décider s'il veut être prévenu.
 */
export function icsDuPlan(plan: PlanSemaine, maintenant = new Date()): string {
  const lignes: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mamakilo//Menus de la semaine//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${echapper(`Menus — semaine du ${jourLisible(plan.debut)}`)}`,
  ]

  for (const jour of plan.jours) {
    for (const moment of MOMENTS) {
      const id = jour.repas[moment]
      if (!id) continue
      const recette = recetteParId(id)
      if (!recette) continue

      const { heure, minute } = HEURES[moment]
      const description = [
        `${LIBELLE_MOMENT[moment]} · ${recette.kcal} kcal · ${recette.minutes} min de préparation`,
        '',
        'Ingrédients :',
        ...recette.ingredients.map((i) => `- ${i.quantite} ${i.nom}`),
        '',
        'Préparation :',
        ...recette.etapes.map((e, index) => `${index + 1}. ${e}`),
      ].join('\n')

      lignes.push(
        'BEGIN:VEVENT',
        // Stable d'un export à l'autre : réimporter la même semaine met à jour
        // l'événement existant au lieu d'en créer un doublon.
        `UID:${jour.date}-${moment}-${recette.id}@mamakilo`,
        `DTSTAMP:${horodatageUTC(maintenant)}`,
        `DTSTART:${horodatageLocal(jour.date, heure, minute)}`,
        `DTEND:${finDuRepas(jour.date, moment)}`,
        `SUMMARY:${echapper(recette.titre)}`,
        `DESCRIPTION:${echapper(description)}`,
        'CATEGORIES:Mamakilo,Repas',
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
      )
    }
  }

  lignes.push('END:VCALENDAR')

  // CRLF partout, y compris en fin de fichier : la RFC l'exige, et certains
  // importeurs rejettent un fichier terminé par un simple saut de ligne.
  return lignes.map(replier).join('\r\n') + '\r\n'
}

function jourLisible(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(
    new Date(`${date}T12:00:00`),
  )
}

/**
 * Déclenche le téléchargement du fichier.
 *
 * Le même geste que l'export RGPD : un `Blob` et un lien cliqué, sans serveur.
 * L'URL est révoquée derrière — sans ça, chaque export garderait le fichier en
 * mémoire jusqu'au rechargement de la page.
 */
export function telechargerICS(plan: PlanSemaine): void {
  const contenu = icsDuPlan(plan)
  const url = URL.createObjectURL(new Blob([contenu], { type: 'text/calendar;charset=utf-8' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = `mamakilo-menus-${plan.debut}.ics`
  lien.click()
  URL.revokeObjectURL(url)
}
