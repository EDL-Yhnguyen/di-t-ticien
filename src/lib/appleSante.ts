import type { MesureSante } from './types'

/**
 * Import du fichier d'export de l'app Santé d'Apple.
 *
 * **Une PWA ne peut pas lire HealthKit.** Aucune API web n'y donne accès, sur
 * aucun navigateur : la seule façon d'obtenir ces données sans publier une
 * application native est de laisser l'utilisateur exporter son dossier et le
 * déposer ici. Ce n'est pas une synchronisation, c'est un import qu'on
 * relance quand on veut — et l'écran doit le dire ainsi.
 *
 * Le fichier fait couramment plusieurs centaines de mégaoctets. On le lit donc
 * par tranches, sans jamais le charger entier ni le confier à un parseur XML
 * qui, lui, le chargerait.
 */

/** Assez grand pour être efficace, assez petit pour ne pas figer l'onglet. */
const TAILLE_TRANCHE = 4 * 1024 * 1024

/** Un enregistrement dépasse rarement 500 octets ; on garde large. */
const MARGE_QUEUE = 4096

const TYPES = {
  poids: 'HKQuantityTypeIdentifierBodyMass',
  pas: 'HKQuantityTypeIdentifierStepCount',
  depense: 'HKQuantityTypeIdentifierActiveEnergyBurned',
} as const

const ENREGISTREMENT = /<Record\s[^>]*?\/?>/g

function attribut(balise: string, nom: string): string | null {
  const trouve = new RegExp(`${nom}="([^"]*)"`).exec(balise)
  return trouve ? trouve[1] : null
}

/** « 2026-07-28 09:14:22 +0200 » → « 2026-07-28 ». */
function jourDe(horodatage: string | null): string | null {
  if (!horodatage) return null
  const jour = horodatage.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : null
}

export class ErreurImportSante extends Error {}

export interface ResultatImport {
  mesures: MesureSante[]
  /** Nombre d'enregistrements lus, tous types confondus. */
  lus: number
}

interface Cumul {
  poidsKg?: number
  pas: number
  depenseKcal: number
}

/**
 * Lit un `export.xml` et en tire une mesure par jour.
 *
 * Les pas et la dépense sont additionnés sur la journée — Santé les enregistre
 * par tranches de quelques minutes. Le poids, lui, est remplacé : la dernière
 * pesée du jour est la bonne, additionner n'aurait aucun sens.
 */
export async function lireExportSante(
  fichier: File,
  surProgression?: (part: number) => void,
): Promise<ResultatImport> {
  if (!/\.xml$/i.test(fichier.name)) {
    throw new ErreurImportSante(
      'Déposez le fichier export.xml. S’il est encore dans une archive zip, décompressez-la d’abord.',
    )
  }

  const parJour = new Map<string, Cumul>()
  const decodeur = new TextDecoder('utf-8')
  let reste = ''
  let lus = 0
  let vuUnRecord = false

  for (let position = 0; position < fichier.size; position += TAILLE_TRANCHE) {
    const tranche = fichier.slice(position, position + TAILLE_TRANCHE)
    const dernier = position + TAILLE_TRANCHE >= fichier.size
    const texte = decodeur.decode(await tranche.arrayBuffer(), { stream: !dernier })

    // On ne traite que ce qui est sûrement complet et on reporte la queue :
    // une tranche coupe presque toujours un enregistrement en deux.
    const bloc = reste + texte
    const limite = dernier ? bloc.length : Math.max(0, bloc.length - MARGE_QUEUE)
    const aTraiter = bloc.slice(0, limite)
    reste = bloc.slice(limite)

    ENREGISTREMENT.lastIndex = 0
    let trouve: RegExpExecArray | null
    while ((trouve = ENREGISTREMENT.exec(aTraiter)) !== null) {
      vuUnRecord = true
      lus++
      const balise = trouve[0]
      const type = attribut(balise, 'type')
      if (!type) continue

      const jour = jourDe(attribut(balise, 'startDate') ?? attribut(balise, 'creationDate'))
      if (!jour) continue

      const valeur = Number.parseFloat(attribut(balise, 'value') ?? '')
      if (!Number.isFinite(valeur)) continue

      const cumul = parJour.get(jour) ?? { pas: 0, depenseKcal: 0 }

      if (type === TYPES.poids) {
        const unite = attribut(balise, 'unit')
        // Santé exporte en kg ou en livres selon les réglages de l'appareil.
        cumul.poidsKg = unite === 'lb' ? valeur * 0.45359237 : valeur
      } else if (type === TYPES.pas) {
        cumul.pas += valeur
      } else if (type === TYPES.depense) {
        cumul.depenseKcal += valeur
      } else {
        continue
      }

      parJour.set(jour, cumul)
    }

    surProgression?.(Math.min(1, (position + TAILLE_TRANCHE) / fichier.size))
  }

  if (!vuUnRecord) {
    throw new ErreurImportSante(
      'Ce fichier ne contient aucune mesure. Vérifiez qu’il s’agit bien de export.xml et non de export_cda.xml.',
    )
  }

  const mesures: MesureSante[] = [...parJour.entries()]
    .map(([date, cumul]) => ({
      date,
      poidsKg: cumul.poidsKg !== undefined ? Math.round(cumul.poidsKg * 10) / 10 : undefined,
      pas: cumul.pas > 0 ? Math.round(cumul.pas) : undefined,
      depenseKcal: cumul.depenseKcal > 0 ? Math.round(cumul.depenseKcal) : undefined,
    }))
    .filter((m) => m.poidsKg !== undefined || m.pas !== undefined || m.depenseKcal !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))

  return { mesures, lus }
}

/**
 * Fusionne un import avec les mesures déjà connues.
 *
 * Un réimport doit être sans danger : on remplace jour par jour plutôt que
 * d'empiler, sinon relancer l'import doublerait les pas de chaque journée.
 */
export function fusionnerMesures(
  existantes: MesureSante[],
  nouvelles: MesureSante[],
): MesureSante[] {
  const table = new Map(existantes.map((m) => [m.date, m]))
  for (const mesure of nouvelles) {
    table.set(mesure.date, { ...table.get(mesure.date), ...mesure })
  }
  return [...table.values()].sort((a, b) => a.date.localeCompare(b.date))
}
