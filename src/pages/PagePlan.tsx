import { ExternalLink, Info } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Carte, Etiquette, TitreSection } from '../components/ui'
import { CONSIGNES, OPTIONS_HERBALIFE, planPour } from '../lib/plan'
import { objectifCalorique } from '../lib/nutrition'
import { poidsActuel } from '../lib/store'

export function PagePlan() {
  const { etat } = useSession()
  const praticien = etat.profil.praticien

  const objectif = objectifCalorique({
    poidsKg: poidsActuel(etat),
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  })
  const plan = planPour(etat.profil, objectif)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink">Votre plan</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          {etat.profil.planPrescrit
            ? 'Établi en consultation. Reproduit ici mot pour mot.'
            : 'Construit à partir de votre profil, sur la structure d’un plan équilibré.'}
        </p>
      </header>

      {praticien && (
        <Carte className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{praticien.nom}</p>
              {praticien.role && <p className="text-sm text-ink-soft">{praticien.role}</p>}
            </div>
            {etat.profil.planPrescrit && <Etiquette ton="corail">Prescrit</Etiquette>}
          </div>

          {(praticien.email || praticien.telephone) && (
            <div className="mt-4 space-y-1.5 text-sm">
              {praticien.email && (
                <p>
                  <a
                    href={`mailto:${praticien.email}`}
                    className="text-corail underline underline-offset-2"
                  >
                    {praticien.email}
                  </a>
                </p>
              )}
              {praticien.telephone && (
                <p>
                  <a
                    href={`tel:${praticien.telephone.replace(/\s/g, '')}`}
                    className="text-corail underline underline-offset-2"
                  >
                    {praticien.telephone}
                  </a>
                </p>
              )}
            </div>
          )}

          {praticien.suivi && (
            <a
              href={praticien.suivi}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-full border border-line px-5 py-3 font-semibold text-ink transition hover:bg-sunken"
            >
              Ouvrir mon suivi en ligne
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
        </Carte>
      )}

      {plan.map((repas) => (
        <section key={repas.moment}>
          <TitreSection
            eyebrow={`${repas.composants.reduce((s, c) => s + c.kcal, 0)} kcal estimées`}
          >
            {repas.titre}
          </TitreSection>
          <Carte className="divide-y divide-line">
            {repas.composants.map((composant) => (
              <div key={composant.id} className="px-5 py-3.5">
                <p className="text-sm text-ink">{composant.libelle}</p>
                {composant.alternatives && composant.alternatives.length > 0 && (
                  <p className="mt-1 text-xs text-ink-soft">
                    ou {composant.alternatives.join(' · ou ')}
                  </p>
                )}
              </div>
            ))}
            {repas.variantes && repas.variantes.length > 0 && (
              <div className="bg-sunken px-5 py-4">
                <Etiquette ton="neutre">Formules de remplacement</Etiquette>
                <ul className="mt-2 space-y-1">
                  {repas.variantes.map((v) => (
                    <li key={v} className="text-sm text-ink-soft">
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Carte>
        </section>
      ))}

      {etat.profil.herbalifeActif && (
        <section>
          <TitreSection eyebrow="Option activée">Substituts Herbalife</TitreSection>
          <Carte className="divide-y divide-line">
            {OPTIONS_HERBALIFE.map((option) => (
              <div key={option.id} className="flex justify-between gap-4 px-5 py-3.5">
                <p className="text-sm text-ink">{option.libelle}</p>
                <p className="shrink-0 text-sm font-semibold text-ink-soft tnum">
                  {option.kcal} kcal
                </p>
              </div>
            ))}
          </Carte>
          <p className="mt-2 px-1 text-xs text-ink-faint">
            Ces substituts remplacent un petit déjeuner ou une collation. Ils ne figurent pas sur
            l’ordonnance : parlez-en à votre diététicienne avant de les intégrer durablement.
          </p>
        </section>
      )}

      <section>
        <TitreSection eyebrow="Les consignes">À garder en tête</TitreSection>
        <Carte className="divide-y divide-line">
          {CONSIGNES.map((consigne) => (
            <p key={consigne} className="flex items-start gap-3 px-5 py-3.5 text-sm text-ink">
              <Info size={16} className="mt-0.5 shrink-0 text-corail" aria-hidden="true" />
              {consigne}
            </p>
          ))}
        </Carte>
      </section>

      {!etat.profil.planPrescrit && (
        <p className="px-1 text-xs text-ink-faint">
          Ce plan est une base équilibrée calculée sur vos mesures. Il ne remplace pas une
          consultation : un diététicien-nutritionniste tiendra compte de votre santé, de vos goûts
          et de votre quotidien.
        </p>
      )}
    </div>
  )
}
