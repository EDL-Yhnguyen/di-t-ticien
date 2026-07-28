import { Lock } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Carte, TitreSection } from '../components/ui'
import { BADGES, enviesResistees, joursRenseignes, kilosPerdus, serie } from '../lib/badges'
import { classes, nombre } from '../lib/utils'

export function Badges() {
  const { etat } = useSession()
  const obtenus = BADGES.filter((b) => etat.badges.includes(b.code))
  const restants = BADGES.filter((b) => !etat.badges.includes(b.code))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink">Vos badges</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          {obtenus.length} sur {BADGES.length} débloqués
        </p>
      </header>

      <Carte className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
        <Statistique valeur={serie(etat)} libelle="jours d’affilée" />
        <Statistique valeur={joursRenseignes(etat)} libelle="journées suivies" />
        <Statistique valeur={nombre(kilosPerdus(etat))} libelle="kg perdus" />
        <Statistique valeur={enviesResistees(etat)} libelle="envies passées" />
      </Carte>

      {obtenus.length > 0 && (
        <section>
          <TitreSection eyebrow="Obtenus">Ce que vous avez décroché</TitreSection>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {obtenus.map((badge) => (
              <li key={badge.code}>
                <Carte className="h-full p-4 text-center">
                  <p className="mb-2 text-3xl" aria-hidden="true">
                    {badge.emoji}
                  </p>
                  <p className="text-sm font-semibold text-ink">{badge.titre}</p>
                </Carte>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <TitreSection eyebrow="À venir">Ce qu’il reste à décrocher</TitreSection>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {restants.map((badge) => (
            <li key={badge.code}>
              <Carte className="h-full p-4 text-center">
                <p
                  className={classes('mb-2 grid h-9 place-items-center text-3xl opacity-25 grayscale')}
                  aria-hidden="true"
                >
                  {badge.emoji}
                </p>
                <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-faint">
                  <Lock size={12} aria-hidden="true" />
                  Verrouillé
                </p>
                <p className="mt-1 text-xs text-ink-soft">{badge.condition}</p>
              </Carte>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Statistique({ valeur, libelle }: { valeur: number | string; libelle: string }) {
  return (
    <div className="px-4 py-4 text-center">
      <p className="font-display text-2xl font-semibold text-ink tnum">{valeur}</p>
      <p className="mt-0.5 text-xs font-semibold text-ink-soft">{libelle}</p>
    </div>
  )
}
