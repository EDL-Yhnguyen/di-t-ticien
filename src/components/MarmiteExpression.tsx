import { classes } from '../lib/utils'

export type Humeur = 'neutre' | 'contente' | 'complice'

/**
 * La marmite, avec trois humeurs.
 *
 * Règle structurante, à ne pas contourner pour rendre l'animation « plus
 * vivante » : **elle réagit à la présence, jamais à la performance.** Elle
 * s'illumine parce que la personne est revenue, parce qu'elle a cuisiné, parce
 * que ça fait trente jours — jamais en fonction d'un total calorique, d'un
 * Nutri-Score ou d'un poids. Un visage qui commente ce qu'on mange est un juge,
 * et ce produit refuse d'en être un.
 *
 * Distinct de `Marque` à dessein : `Marque` doit rester identique à
 * `public/icone.svg`, que ce composant n'a pas vocation à suivre. Le corps et
 * les légumes sont les mêmes tracés — seuls l'œil et la bouche changent.
 */
export function MarmiteExpression({
  humeur = 'neutre',
  taille = 96,
  className,
}: {
  humeur?: Humeur
  taille?: number
  className?: string
}) {
  const bouche = {
    neutre: 'M212 342 q44 44 88 0',
    contente: 'M206 336 q50 58 100 0',
    complice: 'M212 344 q44 30 88 -4',
  }[humeur]

  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={classes('shrink-0 rounded-xl', className)}
    >
      <rect width="512" height="512" rx="112" fill="#FDF6EE" />
      <path
        d="M186 232 C150 232 132 206 142 180 C120 168 124 140 148 134 C150 110 180 100 196 118 C216 104 240 118 238 140 C256 152 254 182 232 188 C232 218 210 232 186 232 Z"
        fill="#4C8A4C"
      />
      <circle cx="262" cy="186" r="46" fill="#E85C46" />
      <path d="M262 146 l-24 -14 l10 22 l-26 -4 l18 18 Z" fill="#4C8A4C" />
      <path d="M356 132 C376 148 380 186 366 236 L322 226 C328 176 338 144 356 132 Z" fill="#F58A32" />
      <g stroke="#4C8A4C" strokeWidth="15" fill="none" strokeLinecap="round">
        <path d="M356 132 L344 96" />
        <path d="M356 132 L378 104" />
      </g>
      <g stroke="#F67A5E" strokeWidth="26" fill="none" strokeLinecap="round">
        <path d="M126 288 C92 288 92 340 126 340" />
        <path d="M386 288 C420 288 420 340 386 340" />
      </g>
      <path
        d="M118 246 h276 v104 c0 42 -34 76 -76 76 h-124 c-42 0 -76 -34 -76 -76 Z"
        fill="#F67A5E"
      />
      <g fill="none" stroke="#24303C" strokeWidth="18" strokeLinecap="round">
        <path d={humeur === 'complice' ? 'M188 306 q20 -14 38 2' : 'M196 306 q18 -20 36 0'} />
        <path d={bouche} />
      </g>
      <circle cx="298" cy="310" r="13" fill="#24303C" />
    </svg>
  )
}
