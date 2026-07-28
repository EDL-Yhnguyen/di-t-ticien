/** Date du jour au format AAAA-MM-JJ, en heure locale (pas UTC). */
export function jourISO(d: Date = new Date()): string {
  const decale = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return decale.toISOString().slice(0, 10)
}

export function ilYAJours(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return jourISO(d)
}

const FORMAT_LONG = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const FORMAT_COURT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

const FORMAT_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

export function dateLongue(iso: string | Date): string {
  return FORMAT_LONG.format(typeof iso === 'string' ? new Date(`${iso}T12:00:00`) : iso)
}

export function dateCourte(iso: string | Date): string {
  return FORMAT_COURT.format(typeof iso === 'string' ? new Date(`${iso}T12:00:00`) : iso)
}

export function moisAnnee(iso: string | Date): string {
  return FORMAT_MOIS.format(typeof iso === 'string' ? new Date(`${iso}T12:00:00`) : iso)
}

/** « 68,4 » — la virgule décimale française, sans exception. */
export function nombre(valeur: number, decimales = 1): string {
  return valeur.toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
}

export function entier(valeur: number): string {
  return Math.round(valeur).toLocaleString('fr-FR')
}

export function classes(...valeurs: (string | false | null | undefined)[]): string {
  return valeurs.filter(Boolean).join(' ')
}

export function limiter(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur))
}

/** Salutation calée sur l'heure — l'app est ouverte au petit déjeuner comme au dîner. */
export function salutation(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 18) return 'Bonjour'
  return 'Bonsoir'
}
