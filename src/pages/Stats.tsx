import { useMemo, useState } from 'react'
import { ChevronRight, Dumbbell, Flame, Scale, Sparkles, TrendingUp } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { BarreMacro, PastilleNutri } from '../components/nutrition'
import { Carte, EtatVide, TitreSection } from '../components/ui'
import { MINUTES_OMS_SEMAINE } from '../lib/sport'
import {
  LIBELLE_PERIODE,
  PERIODES,
  bilanCalories,
  bilanMacros,
  bilanPoids,
  bilanSport,
  jourParJour,
  repartitionNutri,
  resumerLaPeriode,
  type Periode,
} from '../lib/stats'
import { Lien } from '../lib/router'
import { classes, dateCourte, entier, jourISO, nombre } from '../lib/utils'

export function Stats() {
  const { etat } = useSession()
  const date = jourISO()
  const [periode, setPeriode] = useState<Periode>(7)

  const jours = useMemo(() => jourParJour(etat, periode, date), [etat, periode, date])
  const calories = useMemo(() => bilanCalories(jours), [jours])
  const macros = useMemo(() => bilanMacros(etat, jours), [etat, jours])
  const nutri = useMemo(() => repartitionNutri(etat.journal, jours), [etat.journal, jours])
  const sport = useMemo(() => bilanSport(etat.seances, jours), [etat.seances, jours])
  const poids = useMemo(() => bilanPoids(etat, jours), [etat, jours])

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-2xl font-semibold text-ink">Mes statistiques</h1>
        <p className="mt-1 text-sm text-ink-soft">Ce que votre journal dit sur la durée.</p>
      </header>

      <div className="flex gap-1 rounded-full bg-sunken p-1" role="tablist">
        {PERIODES.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={p === periode}
            onClick={() => setPeriode(p)}
            className={classes(
              'flex-1 rounded-full py-2 text-sm font-semibold transition',
              p === periode ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
            )}
          >
            {LIBELLE_PERIODE[p]}
          </button>
        ))}
      </div>

      {calories.joursSuivis === 0 ? (
        <Carte className="animate-rise">
          <EtatVide
            emoji="📈"
            titre="Rien à mesurer pour l’instant"
            action={
              <Lien vers="/app/ajouter">
                <span className="text-sm font-semibold text-corail">Noter un repas</span>
              </Lien>
            }
          >
            Les statistiques se construisent toutes seules à partir de ce que vous notez. Deux ou
            trois jours suffisent à voir une tendance apparaître.
          </EtatVide>
        </Carte>
      ) : (
        <>
          {/* ── Le chiffre de la période ── */}
          <Carte className="animate-rise overflow-hidden" style={{ animationDelay: '60ms' }}>
            <div className="bg-linear-to-b from-bandeau-haut to-bandeau-bas px-5 py-6">
              <p className="text-xs font-bold tracking-[0.14em] text-white/70 uppercase">
                Moyenne par jour
              </p>
              <p className="mt-1 flex items-baseline gap-2.5">
                <span className="font-display text-5xl font-semibold text-white tnum">
                  {entier(calories.moyenneKcal)}
                </span>
                <span className="text-base font-medium text-white/80">kcal</span>
              </p>
              <p className="mt-1.5 text-sm text-white/75">{resumerLaPeriode(calories, periode)}</p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-line">
              <Chiffre valeur={`${calories.joursSuivis}`} libelle={`jour${calories.joursSuivis > 1 ? 's' : ''} noté${calories.joursSuivis > 1 ? 's' : ''}`} />
              <Chiffre valeur={`${calories.joursDansLaCible}`} libelle="dans la cible" />
              <Chiffre
                valeur={`${calories.ecartCumule > 0 ? '+' : ''}${entier(calories.ecartCumule)}`}
                libelle="kcal cumulées"
              />
            </div>
          </Carte>

          {/* ── Jour par jour ── */}
          <Carte className="animate-rise p-5" style={{ animationDelay: '120ms' }}>
            <TitreSection eyebrow="Jour par jour">Vos calories</TitreSection>
            <Barres jours={jours} />
            <p className="mt-3 text-sm text-ink-soft">
              La ligne marque votre repère du jour. Les jours sans barre sont ceux où rien n’a été
              noté — ils ne comptent pas dans les moyennes.
            </p>
          </Carte>

          {/* ── Macros ── */}
          <Carte className="animate-rise p-5" style={{ animationDelay: '180ms' }}>
            <TitreSection eyebrow="En moyenne">Vos macros</TitreSection>
            <div className="space-y-3.5">
              <BarreMacro
                libelle="Protéines"
                valeur={macros.moyenne.proteines}
                cible={macros.cibles.proteines}
                teinte="bg-macro-proteines"
              />
              <BarreMacro
                libelle="Glucides"
                valeur={macros.moyenne.glucides}
                cible={macros.cibles.glucides}
                teinte="bg-macro-glucides"
              />
              <BarreMacro
                libelle="Lipides"
                valeur={macros.moyenne.lipides}
                cible={macros.cibles.lipides}
                teinte="bg-macro-lipides"
              />
            </div>
            <p className="mt-4 border-t border-line pt-3 text-sm text-ink-soft tnum">
              Fibres : {nombre(macros.moyenne.fibres, 0)} g par jour · Sel :{' '}
              {nombre(macros.moyenne.sel, 1)} g
            </p>
          </Carte>

          {/* ── Qualité ── */}
          {nutri.length > 0 && (
            <Carte className="animate-rise p-5" style={{ animationDelay: '240ms' }}>
              <TitreSection eyebrow="Qualité">D’où viennent vos calories</TitreSection>
              <ul className="space-y-2.5">
                {nutri.map((ligne) => (
                  <li key={ligne.note ?? 'sans'} className="flex items-center gap-3">
                    {ligne.note ? (
                      <PastilleNutri note={ligne.note} taille="s" />
                    ) : (
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sunken text-xs font-bold text-ink-faint">
                        ?
                      </span>
                    )}
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                      <span
                        className="block h-full rounded-full bg-corail"
                        style={{ width: `${Math.round(ligne.part * 100)}%` }}
                      />
                    </span>
                    <span className="w-12 shrink-0 text-right text-sm text-ink-soft tnum">
                      {Math.round(ligne.part * 100)} %
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 text-sm text-ink-soft">
                Réparti selon les calories, pas selon le nombre d’aliments : une pomme ne compense
                pas une part de tarte. Le « ? » regroupe ce qui n’a pas de Nutri-Score.
              </p>
            </Carte>
          )}

          {/* ── Sport ── */}
          <Carte className="animate-rise p-5" style={{ animationDelay: '300ms' }}>
            <TitreSection
              eyebrow="Activité"
              action={
                <Lien vers="/app/sport" className="text-sm font-semibold text-corail">
                  Détail
                </Lien>
              }
            >
              Votre régularité
            </TitreSection>
            {sport.minutes === 0 ? (
              <p className="text-sm text-ink-soft">
                Aucune séance sur la période. L’OMS conseille {MINUTES_OMS_SEMAINE} minutes par
                semaine.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Bloc icone={<Dumbbell size={16} />} valeur={`${sport.jours}`} libelle="jours actifs" />
                  <Bloc
                    icone={<TrendingUp size={16} />}
                    valeur={`${sport.minutesParSemaine}`}
                    libelle="min / semaine"
                  />
                  <Bloc icone={<Flame size={16} />} valeur={entier(sport.kcal)} libelle="kcal gagnées" />
                </div>
                <p className="mt-3.5 text-sm text-ink-soft">
                  {sport.minutesParSemaine >= MINUTES_OMS_SEMAINE
                    ? `Le repère de l’OMS (${MINUTES_OMS_SEMAINE} min par semaine) est tenu sur la période.`
                    : `Il manque ${MINUTES_OMS_SEMAINE - sport.minutesParSemaine} minutes par semaine pour atteindre le repère de l’OMS.`}
                </p>
              </>
            )}
          </Carte>

          {/* ── Poids ── */}
          <Lien vers="/app/poids" className="animate-rise block" style={{ animationDelay: '360ms' }}>
            <Carte className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken">
              <Scale size={20} className="shrink-0 text-corail" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">Votre poids</span>
                <span className="block text-sm text-ink-soft tnum">
                  {poids.delta === null
                    ? 'Deux pesées sur la période suffisent à voir la tendance'
                    : `${poids.delta > 0 ? '+' : ''}${nombre(poids.delta, 1)} kg depuis ${nombre(
                        poids.depart ?? 0,
                        1,
                      )} kg`}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
            </Carte>
          </Lien>

          <p className="flex items-start gap-2 px-1 text-xs text-ink-faint">
            <Sparkles size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Une moyenne n’est pas un verdict : elle dépend de ce qui a été noté, et une journée
            oubliée ne veut pas dire une journée à zéro.
          </p>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────── Sous-vues ─────────────────────────────── */

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div className="px-3 py-3.5 text-center">
      <p className="font-display text-xl font-semibold text-ink tnum">{valeur}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{libelle}</p>
    </div>
  )
}

function Bloc({
  icone,
  valeur,
  libelle,
}: {
  icone: React.ReactNode
  valeur: string
  libelle: string
}) {
  return (
    <div className="rounded-tile bg-sunken px-3 py-3 text-center">
      <span className="mx-auto mb-1 grid size-7 place-items-center text-corail" aria-hidden="true">
        {icone}
      </span>
      <p className="font-display text-lg font-semibold text-ink tnum">{valeur}</p>
      <p className="text-xs text-ink-soft">{libelle}</p>
    </div>
  )
}

/**
 * Les barres du jour par jour.
 *
 * L'échelle monte au plus haut des deux — la plus grosse journée ou l'objectif
 * — pour que la ligne de repère reste toujours visible dans le cadre.
 */
function Barres({ jours }: { jours: { date: string; kcal: number; objectif: number; suivi: boolean }[] }) {
  const plafond = Math.max(...jours.map((j) => Math.max(j.kcal, j.objectif)), 1)
  const objectifMoyen = jours.reduce((s, j) => s + j.objectif, 0) / jours.length
  const dense = jours.length > 14

  return (
    <div>
      {/* La zone du graphique est isolée : c'est elle qui donne sa hauteur de
          référence aux barres, et qui borne la ligne de repère. */}
      <div className="relative h-40">
        <div
          className="absolute right-0 left-0 z-10 border-t border-dashed border-ink-faint/60"
          style={{ bottom: `${Math.min(100, (objectifMoyen / plafond) * 100)}%` }}
          aria-hidden="true"
        />
        <ul className={classes('flex h-full items-end', dense ? 'gap-px' : 'gap-1.5')}>
          {jours.map((jour) => {
            const hauteur = jour.suivi ? Math.max(3, (jour.kcal / plafond) * 100) : 0
            const dansLaCible = Math.abs(jour.kcal - jour.objectif) <= jour.objectif * 0.1
            return (
              <li
                key={jour.date}
                className="flex h-full flex-1 items-end"
                title={
                  jour.suivi
                    ? `${dateCourte(jour.date)} : ${entier(jour.kcal)} kcal`
                    : `${dateCourte(jour.date)} : rien de noté`
                }
              >
                <span
                  className={classes(
                    'block w-full rounded-t transition-all',
                    jour.suivi ? (dansLaCible ? 'bg-basil' : 'bg-corail') : 'bg-line',
                  )}
                  style={jour.suivi ? { height: `${hauteur}%` } : { height: '2px' }}
                />
              </li>
            )
          })}
        </ul>
      </div>
      {!dense && (
        <ul className="mt-1.5 flex gap-1.5" aria-hidden="true">
          {jours.map((jour) => (
            <li key={jour.date} className="flex-1 text-center text-[0.625rem] text-ink-faint">
              {dateCourte(jour.date).split(' ')[0]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
