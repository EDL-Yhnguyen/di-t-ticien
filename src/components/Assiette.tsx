import { motion, useReducedMotion } from 'framer-motion'
import type { Categorie } from '../lib/types'
import { LIBELLE_CATEGORIE } from '../lib/plan'

/**
 * L'assiette vue de dessus.
 *
 * C'est l'écran principal parce que c'est le langage de l'ordonnance : la
 * diététicienne ne prescrit pas des grammes, elle prescrit « un beau quart
 * d'assiette ». Chaque part porte en permanence un lavis de sa couleur — la
 * place qui lui revient — et se remplit depuis le centre à mesure que les
 * composants sont cochés. La surface colorée est proportionnelle à ce qui a
 * été mangé, d'où la racine carrée appliquée à l'échelle.
 */

const CENTRE = 110
const RAYON_ASSIETTE = 104
const RAYON_MARLI = 88
const RAYON_ALIMENTS = 78

/** Écart angulaire entre deux parts, en degrés. Remplace un trait de séparation. */
const JEU = 1.6

export interface PartAssiette {
  categorie: Categorie
  /** Angle de départ, en degrés, 0 = midi. */
  debut: number
  /** Angle de fin, en degrés. */
  fin: number
  /** 0 à 1. */
  ratio: number
}

/**
 * Les trois parts se touchent : leurs couleurs forment une palette catégorielle
 * validée (voir index.css). Ne pas les remplacer par les jetons d'interface,
 * qui échouaient la séparation en vision daltonienne.
 */
const COULEUR: Partial<Record<Categorie, string>> = {
  legume: 'var(--assiette-legume)',
  feculent: 'var(--assiette-feculent)',
  proteine: 'var(--assiette-proteine)',
  laitier: 'var(--iris)',
  fruit: 'var(--berry)',
  'matiere-grasse': 'var(--apricot)',
  boisson: 'var(--basil)',
}

export const COULEUR_CATEGORIE = COULEUR

function point(angleDeg: number, rayon: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CENTRE + rayon * Math.cos(rad), CENTRE + rayon * Math.sin(rad)]
}

function secteur(debut: number, fin: number, rayon: number): string {
  const [x1, y1] = point(debut, rayon)
  const [x2, y2] = point(fin, rayon)
  const grandArc = fin - debut > 180 ? 1 : 0
  return `M ${CENTRE} ${CENTRE} L ${x1} ${y1} A ${rayon} ${rayon} 0 ${grandArc} 1 ${x2} ${y2} Z`
}

export function Assiette({ parts, className }: { parts: PartAssiette[]; className?: string }) {
  const mouvementReduit = useReducedMotion()

  const resume = parts
    .map((p) => `${LIBELLE_CATEGORIE[p.categorie]} ${Math.round(p.ratio * 100)} %`)
    .join(', ')

  return (
    <svg
      viewBox="0 0 220 220"
      className={className}
      role="img"
      aria-label={`Assiette du jour : ${resume}`}
    >
      <defs>
        <radialGradient id="creux" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="var(--sunken)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--sunken)" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* La porcelaine : bord extérieur, marli, puis le creux */}
      <circle cx={CENTRE} cy={CENTRE} r={RAYON_ASSIETTE} fill="var(--surface)" />
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={RAYON_ASSIETTE}
        fill="none"
        stroke="var(--line)"
        strokeWidth="1.5"
      />
      <circle cx={CENTRE} cy={CENTRE} r={RAYON_MARLI} fill="url(#creux)" />
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={RAYON_MARLI}
        fill="none"
        stroke="var(--line)"
        strokeWidth="1"
      />

      {parts.map((part) => {
        const debut = part.debut + JEU
        const fin = part.fin - JEU
        const chemin = secteur(debut, fin, RAYON_ALIMENTS)

        return (
          <g key={part.categorie}>
            {/* La place qui revient à cette part, qu'elle soit remplie ou non */}
            <path d={chemin} fill={COULEUR[part.categorie]} fillOpacity="0.24" />

            {/* Ce qui a été mangé */}
            <motion.g
              style={{ transformBox: 'view-box', transformOrigin: `${CENTRE}px ${CENTRE}px` }}
              initial={false}
              animate={{ scale: Math.sqrt(Math.max(0, Math.min(1, part.ratio))) }}
              transition={
                mouvementReduit
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 210, damping: 22, mass: 0.7 }
              }
            >
              <path d={chemin} fill={COULEUR[part.categorie]} fillOpacity="0.94" />
            </motion.g>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * La couleur seule ne porte jamais l'identité d'une part : cette légende donne
 * le nom et le décompte de chacune, et sert de second niveau de lecture pour
 * qui distingue mal les teintes.
 */
export function LegendeAssiette({
  parts,
  compteurs,
  accompagnements = [],
}: {
  parts: PartAssiette[]
  compteurs: Record<string, { faits: number; total: number }>
  accompagnements?: { categorie: Categorie; fait: boolean }[]
}) {
  return (
    <div className="space-y-2.5">
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {parts.map((part) => {
          const compte = compteurs[part.categorie]
          return (
            <li key={part.categorie} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: COULEUR[part.categorie] }}
              />
              <span className="text-sm text-ink-soft">
                {LIBELLE_CATEGORIE[part.categorie]}
                {compte && (
                  <span className="ml-1.5 font-semibold text-ink tnum">
                    {compte.faits}/{compte.total}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {accompagnements.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-line pt-2.5">
          {accompagnements.map(({ categorie, fait }) => (
            <li
              key={categorie}
              className={fait ? 'text-xs font-semibold text-ink' : 'text-xs text-ink-faint'}
            >
              {fait ? '✓ ' : '○ '}
              {LIBELLE_CATEGORIE[categorie]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
