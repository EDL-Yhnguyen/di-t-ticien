import { ChefHat, CloudOff, LineChart, Plus, ShieldHalf, User, Utensils } from 'lucide-react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { Lien, useRoutage } from '../lib/router'
import { classes } from '../lib/utils'
import { Marque } from './ui'

/**
 * Noter un aliment est devenu le geste principal de l'application : il occupe
 * donc le centre de la barre, en relief, là où le pouce tombe naturellement.
 * « Envies » quitte les onglets — l'écran reste atteignable depuis le grand
 * bouton d'Aujourd'hui et depuis les raccourcis du profil, qui sont les deux
 * endroits où on le cherche vraiment.
 */
const ONGLETS = [
  { vers: '/app', libelle: 'Aujourd’hui', Icone: Utensils },
  { vers: '/app/poids', libelle: 'Poids', Icone: LineChart },
  { vers: '/app/ajouter', libelle: 'Ajouter', Icone: Plus, saillant: true },
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
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/85 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-end">
        {ONGLETS.map(({ vers, libelle, Icone, saillant }) => {
          const actif = estActif(chemin, vers)

          if (saillant) {
            return (
              <li key={vers} className="flex-1">
                <Lien vers={vers} className="flex flex-col items-center gap-1 px-1 pt-1 pb-1.5">
                  <span
                    className={classes(
                      'plein-primaire grid size-12 place-items-center rounded-[1.15rem] text-white',
                      'shadow-halo transition active:scale-95',
                      actif && 'ring-2 ring-primaire/35 ring-offset-2 ring-offset-surface',
                    )}
                  >
                    <Icone size={24} strokeWidth={2.6} aria-hidden="true" />
                  </span>
                  <span
                    className={classes(
                      'text-[0.6875rem] font-semibold',
                      actif ? 'text-primaire' : 'text-ink-faint',
                    )}
                  >
                    {libelle}
                  </span>
                </Lien>
              </li>
            )
          }

          return (
            <li key={vers} className="flex-1">
              <Lien
                vers={vers}
                className={classes(
                  'relative flex flex-col items-center gap-1 px-1 pt-2.5 pb-1.5 transition',
                  actif ? 'text-primaire' : 'text-ink-faint',
                )}
              >
                {/* Une pastille de couleur derrière l'onglet actif, plutôt qu'un
                    filet de deux pixels en haut de la barre : à cette taille, le
                    filet se lisait comme une bordure du conteneur et non comme
                    l'indication de l'endroit où l'on est. */}
                {actif && (
                  <motion.span
                    layoutId="onglet-actif"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="lavis-primaire absolute inset-x-2 inset-y-1 rounded-2xl ring-1 ring-primaire/20 ring-inset"
                  />
                )}
                <Icone
                  size={21}
                  strokeWidth={actif ? 2.5 : 1.9}
                  aria-hidden="true"
                  className="relative"
                />
                <span className="relative text-[0.6875rem] font-semibold">{libelle}</span>
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
        <Marque taille={36} />
        <span className="font-display text-xl font-semibold text-ink">Mamakilo</span>
      </Lien>

      <ul className="space-y-1">
        {/* Le rail a la place d'afficher Envies, que la barre mobile n'a pas. */}
        {[...ONGLETS, { vers: '/app/envies', libelle: 'Envies', Icone: ShieldHalf }].map(
          ({ vers, libelle, Icone }) => {
            const actif = estActif(chemin, vers)
            const ajout = vers === '/app/ajouter'
            return (
              <li key={vers}>
                <Lien
                  vers={vers}
                  className={classes(
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition',
                    ajout
                      ? 'plein-primaire text-white shadow-halo hover:brightness-105'
                      : actif
                        ? 'lavis-primaire text-primaire ring-1 ring-primaire/20 ring-inset'
                        : 'text-ink-soft hover:bg-sunken hover:text-ink',
                  )}
                >
                  <Icone size={20} strokeWidth={actif || ajout ? 2.4 : 1.9} aria-hidden="true" />
                  {libelle}
                </Lien>
              </li>
            )
          },
        )}
      </ul>
    </nav>
  )
}

/**
 * Signale une sauvegarde qui n'est pas passée. Sans ça, l'écran affichait la
 * saisie comme prise en compte alors qu'elle n'avait jamais quitté l'appareil.
 */
function BandeauEnregistrement() {
  const { erreurEnregistrement, reessayerEnregistrement } = useApp()
  if (!erreurEnregistrement) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-alerte/30 bg-alerte-wash px-4 py-2.5 md:px-8"
    >
      <CloudOff size={17} className="shrink-0 text-alerte" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm text-ink">
        <span className="font-semibold">Modifications non enregistrées.</span>{' '}
        <span className="text-ink-soft">Elles restent sur cet appareil pour l’instant.</span>
      </p>
      <button
        type="button"
        onClick={reessayerEnregistrement}
        className="shrink-0 rounded-full bg-alerte px-3.5 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Réessayer
      </button>
    </div>
  )
}

/** Gabarit commun aux écrans connectés. */
export function Cadre({ children }: { children: React.ReactNode }) {
  return (
    // Le décalage porte sur l'enveloppe et non sur <main> : la colonne se
    // centre ainsi dans l'espace restant à droite du rail, au lieu d'y être
    // collée sur les écrans larges.
    <div className="min-h-svh bg-ground md:pl-60">
      <RailLateral />
      <BarreOnglets />
      <BandeauEnregistrement />
      <main className="mx-auto max-w-lg px-4 pt-5 pb-28 md:max-w-2xl md:px-8 md:pt-10 md:pb-12">
        {children}
      </main>
    </div>
  )
}
