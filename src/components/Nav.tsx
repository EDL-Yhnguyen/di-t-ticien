import { ChefHat, LineChart, ShieldHalf, User, Utensils } from 'lucide-react'
import { motion } from 'framer-motion'
import { Lien, useRoutage } from '../lib/router'
import { classes } from '../lib/utils'

const ONGLETS = [
  { vers: '/app', libelle: 'Aujourd’hui', Icone: Utensils },
  { vers: '/app/poids', libelle: 'Poids', Icone: LineChart },
  { vers: '/app/envies', libelle: 'Envies', Icone: ShieldHalf },
  { vers: '/app/cuisine', libelle: 'Cuisine', Icone: ChefHat },
  { vers: '/app/profil', libelle: 'Profil', Icone: User },
]

function estActif(chemin: string, vers: string): boolean {
  return vers === '/app' ? chemin === '/app' : chemin.startsWith(vers)
}

/** Barre d'onglets en bas sur mobile — c'est là que le pouce arrive. */
export function BarreOnglets() {
  const { chemin } = useRoutage()

  return (
    <nav
      aria-label="Navigation principale"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {ONGLETS.map(({ vers, libelle, Icone }) => {
          const actif = estActif(chemin, vers)
          return (
            <li key={vers} className="flex-1">
              <Lien
                vers={vers}
                className={classes(
                  'relative flex flex-col items-center gap-1 px-1 pt-2.5 pb-1.5 transition',
                  actif ? 'text-iris' : 'text-ink-faint',
                )}
              >
                {actif && (
                  <motion.span
                    layoutId="onglet-actif"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-iris"
                  />
                )}
                <Icone size={21} strokeWidth={actif ? 2.4 : 1.9} aria-hidden="true" />
                <span className="text-[0.6875rem] font-semibold">{libelle}</span>
              </Lien>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Sur grand écran, une colonne latérale — pas un téléphone étiré. */
export function RailLateral() {
  const { chemin } = useRoutage()

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed top-0 left-0 z-40 hidden h-svh w-60 flex-col border-r border-line bg-surface px-4 py-7 md:flex"
    >
      <Lien vers="/app" className="mb-8 flex items-center gap-2.5 px-2">
        <span className="grid size-9 place-items-center rounded-xl bg-iris text-lg text-white">
          🍽
        </span>
        <span className="font-display text-xl font-semibold text-ink">Équilibre</span>
      </Lien>

      <ul className="space-y-1">
        {ONGLETS.map(({ vers, libelle, Icone }) => {
          const actif = estActif(chemin, vers)
          return (
            <li key={vers}>
              <Lien
                vers={vers}
                className={classes(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition',
                  actif
                    ? 'bg-iris-wash text-iris'
                    : 'text-ink-soft hover:bg-sunken hover:text-ink',
                )}
              >
                <Icone size={20} strokeWidth={actif ? 2.4 : 1.9} aria-hidden="true" />
                {libelle}
              </Lien>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Gabarit commun aux écrans connectés. */
export function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-ground">
      <RailLateral />
      <BarreOnglets />
      <main className="mx-auto max-w-lg px-4 pt-5 pb-28 md:ml-60 md:max-w-2xl md:px-8 md:pt-10 md:pb-12">
        {children}
      </main>
    </div>
  )
}
