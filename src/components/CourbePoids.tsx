import { useMemo, useState } from 'react'
import type { PeseeEntree } from '../lib/types'
import { dateCourte, nombre } from '../lib/utils'

/**
 * Le viewBox colle à la taille de rendu réelle (environ 340 px de large sur
 * mobile) : dans un SVG mis à l'échelle, un texte de 11 unités deviendrait
 * illisible s'il était dessiné dans un repère de 640 de large.
 */
const L = 360
const H = 210
const MARGE = { haut: 16, droite: 12, bas: 26, gauche: 34 }

export function CourbePoids({
  pesees,
  objectifKg,
}: {
  pesees: PeseeEntree[]
  objectifKg: number
}) {
  const [survol, setSurvol] = useState<number | null>(null)

  const points = useMemo(
    () => [...pesees].sort((a, b) => a.date.localeCompare(b.date)),
    [pesees],
  )

  const vue = useMemo(() => {
    const poids = points.map((p) => p.poidsKg)
    const minData = Math.min(...poids)
    const maxData = Math.max(...poids)
    const amplitude = Math.max(1.5, maxData - minData)

    /**
     * L'échelle suit les pesées, pas l'objectif. Placer 61 kg dans le cadre
     * quand on pèse 68,7 écraserait la courbe sur un dixième de la hauteur et
     * la tendance — le seul intérêt de ce graphique — deviendrait invisible.
     * Le chemin restant est déjà donné par la barre de progression au-dessus.
     */
    const bas = minData - amplitude * 0.25
    const haut = maxData + amplitude * 0.25
    const objectifVisible = objectifKg >= bas && objectifKg <= haut

    const x = (i: number) =>
      MARGE.gauche +
      (points.length <= 1
        ? (L - MARGE.gauche - MARGE.droite) / 2
        : (i / (points.length - 1)) * (L - MARGE.gauche - MARGE.droite))
    const y = (kg: number) =>
      MARGE.haut + (1 - (kg - bas) / (haut - bas)) * (H - MARGE.haut - MARGE.bas)

    return { bas, haut, x, y, objectifVisible }
  }, [points, objectifKg])

  if (points.length === 0) return null

  const trace = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${vue.x(i)} ${vue.y(p.poidsKg)}`)
  const aire = `${trace.join(' ')} L ${vue.x(points.length - 1)} ${H - MARGE.bas} L ${vue.x(0)} ${H - MARGE.bas} Z`
  const graduations = graduationsY(vue.bas, vue.haut)
  const dernier = points.length - 1
  const actif = survol ?? dernier
  const ecart = points[dernier].poidsKg - points[0].poidsKg

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${L} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Évolution du poids sur ${points.length} pesées, de ${nombre(points[0].poidsKg)} à ${nombre(points[dernier].poidsKg)} kilos.`}
        onPointerLeave={() => setSurvol(null)}
        onPointerMove={(e) => {
          const boite = e.currentTarget.getBoundingClientRect()
          const xLocal = ((e.clientX - boite.left) / boite.width) * L
          const largeur = L - MARGE.gauche - MARGE.droite
          const ratio = (xLocal - MARGE.gauche) / largeur
          const index = Math.round(ratio * (points.length - 1))
          setSurvol(Math.max(0, Math.min(points.length - 1, index)))
        }}
      >
        <defs>
          <linearGradient id="sousCourbe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--corail)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--corail)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {graduations.map((kg) => (
          <g key={kg}>
            <line
              x1={MARGE.gauche}
              x2={L - MARGE.droite}
              y1={vue.y(kg)}
              y2={vue.y(kg)}
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text
              x={MARGE.gauche - 6}
              y={vue.y(kg) + 4}
              textAnchor="end"
              className="fill-ink-faint text-[11px] tnum"
            >
              {nombre(kg, 0)}
            </text>
          </g>
        ))}

        {vue.objectifVisible && (
          <>
            <line
              x1={MARGE.gauche}
              x2={L - MARGE.droite}
              y1={vue.y(objectifKg)}
              y2={vue.y(objectifKg)}
              stroke="var(--basil)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <text
              x={L - MARGE.droite}
              y={vue.y(objectifKg) - 6}
              textAnchor="end"
              className="fill-basil text-[11px] font-semibold"
            >
              Objectif
            </text>
          </>
        )}

        <path d={aire} fill="url(#sousCourbe)" />
        <path
          d={trace.join(' ')}
          fill="none"
          stroke="var(--corail)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={vue.x(i)}
            cy={vue.y(p.poidsKg)}
            r={i === actif ? 5.5 : 4}
            fill={i === actif ? 'var(--corail)' : 'var(--surface)'}
            stroke="var(--corail)"
            strokeWidth="2.5"
          />
        ))}

        {points.length > 1 && survol !== null && (
          <line
            x1={vue.x(actif)}
            x2={vue.x(actif)}
            y1={MARGE.haut}
            y2={H - MARGE.bas}
            stroke="var(--ink-faint)"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.7"
          />
        )}

        <text x={MARGE.gauche} y={H - 7} className="fill-ink-faint text-[11px]">
          {dateCourte(points[0].date)}
        </text>
        {points.length > 1 && (
          <text
            x={L - MARGE.droite}
            y={H - 7}
            textAnchor="end"
            className="fill-ink-faint text-[11px]"
          >
            {dateCourte(points[dernier].date)}
          </text>
        )}
      </svg>

      <figcaption className="mt-3 text-center text-sm text-ink-soft">
        {survol === null ? (
          <>
            {ecart < 0 ? '−' : '+'}
            <strong className="font-semibold text-ink tnum">
              {nombre(Math.abs(ecart))} kg
            </strong>{' '}
            depuis la première pesée
            {!vue.objectifVisible && ` · objectif ${nombre(objectifKg)} kg`}
          </>
        ) : (
          <>
            {dateCourte(points[actif].date)} —{' '}
            <strong className="font-semibold text-ink tnum">
              {nombre(points[actif].poidsKg)} kg
            </strong>
          </>
        )}
      </figcaption>
    </figure>
  )
}

/** Quatre graduations au plus : au-delà, la grille prend le pas sur la courbe. */
function graduationsY(bas: number, haut: number): number[] {
  const etendue = haut - bas
  const pas = etendue > 8 ? 4 : etendue > 4 ? 2 : 1
  const depart = Math.ceil(bas / pas) * pas
  const sortie: number[] = []
  for (let v = depart; v <= haut; v += pas) sortie.push(v)
  return sortie
}
