import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  THEMES,
  appliquerApparence,
  enregistrerMode,
  enregistrerTheme,
  modeEnregistre,
  surChangementSysteme,
  themeEnregistre,
  type IdTheme,
  type ModeApparence,
} from '../lib/apparence'
import { classes } from '../lib/utils'

const MODES: { valeur: ModeApparence; libelle: string; Icone: typeof Sun }[] = [
  { valeur: 'clair', libelle: 'Clair', Icone: Sun },
  { valeur: 'sombre', libelle: 'Sombre', Icone: Moon },
  { valeur: 'systeme', libelle: 'Système', Icone: Monitor },
]

/**
 * Le réglage d'apparence : le mode clair / sombre / système, et le choix parmi
 * les huit thèmes de couleur.
 *
 * Le choix s'applique au document dès le clic, avant tout enregistrement : c'est
 * un réglage dont on veut voir l'effet pour décider, et une vignette ne remplace
 * pas l'écran en vrai.
 */
export function ReglageApparence() {
  const [mode, setMode] = useState<ModeApparence>(modeEnregistre)
  const [theme, setTheme] = useState<IdTheme>(themeEnregistre)

  useEffect(() => {
    appliquerApparence(theme, mode)
    enregistrerTheme(theme)
    enregistrerMode(mode)
  }, [theme, mode])

  // En mode « systeme », la bascule du système doit se voir sans recharger.
  useEffect(() => {
    if (mode !== 'systeme') return
    return surChangementSysteme(() => appliquerApparence(theme, 'systeme'))
  }, [mode, theme])

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Luminosité</legend>
        <div className="flex gap-1.5 rounded-full bg-sunken p-1.5">
          {MODES.map(({ valeur, libelle, Icone }) => {
            const actif = mode === valeur
            return (
              <label
                key={valeur}
                className={classes(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full py-2.5',
                  'text-sm font-semibold transition',
                  actif
                    ? 'plein-primaire text-white shadow-halo'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                <input
                  type="radio"
                  name="luminosite"
                  checked={actif}
                  onChange={() => setMode(valeur)}
                  className="sr-only"
                />
                <Icone size={16} strokeWidth={2.3} aria-hidden="true" />
                {libelle}
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          « Système » suit le réglage de votre téléphone, y compris quand il bascule le soir.
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Couleurs</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {THEMES.map((t) => {
            const actif = theme === t.id
            const [fond, primaire, vif] = t.apercu
            return (
              <label
                key={t.id}
                title={t.phrase}
                className={classes(
                  'relative cursor-pointer overflow-hidden rounded-tile border-2 transition',
                  actif
                    ? 'border-primaire shadow-halo'
                    : 'border-line-fort hover:border-primaire/50',
                )}
              >
                <input
                  type="radio"
                  name="theme-couleur"
                  checked={actif}
                  onChange={() => setTheme(t.id)}
                  className="sr-only"
                />

                {/* La vignette montre le thème qu'elle propose, pas celui qui est
                    appliqué : ses couleurs viennent donc de THEMES et non des
                    variables CSS courantes. */}
                <span aria-hidden="true" className="block px-3 pt-3 pb-2" style={{ background: fond }}>
                  <span
                    className="block h-6 rounded-md"
                    style={{ background: `linear-gradient(140deg, ${primaire}, ${vif})` }}
                  />
                  <span className="mt-2 flex items-center gap-1.5">
                    <span
                      className="block size-3.5 rounded-full"
                      style={{ background: primaire }}
                    />
                    <span className="block size-3.5 rounded-full" style={{ background: vif }} />
                    <span
                      className="block h-1.5 flex-1 rounded-full"
                      style={{ background: primaire, opacity: 0.28 }}
                    />
                  </span>
                </span>

                <span
                  className={classes(
                    'flex items-center justify-between gap-1 px-3 py-2 text-sm font-semibold',
                    actif ? 'bg-primaire-wash text-primaire' : 'bg-surface text-ink',
                  )}
                >
                  {t.nom}
                  {actif && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </span>
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Le Nutri-Score, les parts de l’assiette et les barres de macros gardent leurs couleurs
          dans tous les thèmes : ce sont des repères, pas de la décoration.
        </p>
      </fieldset>
    </div>
  )
}
