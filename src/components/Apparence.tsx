import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  appliquerApparence,
  enregistrerMode,
  modeEnregistre,
  surChangementSysteme,
  type ModeApparence,
} from '../lib/apparence'
import { classes } from '../lib/utils'

const MODES: { valeur: ModeApparence; libelle: string; Icone: typeof Sun }[] = [
  { valeur: 'clair', libelle: 'Clair', Icone: Sun },
  { valeur: 'sombre', libelle: 'Sombre', Icone: Moon },
  { valeur: 'systeme', libelle: 'Système', Icone: Monitor },
]

/**
 * Le réglage d'apparence : clair / sombre / système.
 *
 * Le choix s'applique au document dès le clic, avant tout enregistrement :
 * c'est un réglage dont on veut voir l'effet pour décider.
 */
export function ReglageApparence() {
  const [mode, setMode] = useState<ModeApparence>(modeEnregistre)

  useEffect(() => {
    appliquerApparence(mode)
    enregistrerMode(mode)
  }, [mode])

  // En mode « systeme », la bascule du système doit se voir sans recharger.
  useEffect(() => {
    if (mode !== 'systeme') return
    return surChangementSysteme(() => appliquerApparence('systeme'))
  }, [mode])

  return (
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
                actif ? 'plein-primaire text-white shadow-halo' : 'text-ink-soft hover:text-ink',
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
  )
}
