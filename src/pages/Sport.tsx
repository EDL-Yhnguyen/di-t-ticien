import { useMemo, useState } from 'react'
import { Activity, Dumbbell, Info, Plus, Trash2 } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, Etiquette, Feuille, TitreSection } from '../components/ui'
import {
  CATALOGUE_ACTIVITES,
  FAMILLES_ACTIVITE,
  MINUTES_OMS_SEMAINE,
  activiteParId,
  activitesDeLaFamille,
  bilanSemaine,
  bonusSportDuJour,
  kcalSeance,
  resumerLaSemaine,
  seancesDuJour,
  serieDeSeances,
} from '../lib/sport'
import { poidsLePlusRecent } from '../lib/store'
import type { FamilleActivite, Intensite, SeanceSport } from '../lib/types'
import { INTENSITES, LIBELLE_FAMILLE_ACTIVITE, LIBELLE_INTENSITE } from '../lib/types'
import { classes, dateCourte, entier, jourISO } from '../lib/utils'

const JOURS_COURTS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function Sport() {
  const { etat, modifier } = useSession()
  const date = jourISO()
  const [saisie, setSaisie] = useState(false)

  const poidsKg = poidsLePlusRecent(etat)
  const duJour = useMemo(() => seancesDuJour(etat.seances, date), [etat.seances, date])
  const bonus = bonusSportDuJour(etat.seances, date)
  const semaine = useMemo(() => bilanSemaine(etat.seances, date), [etat.seances, date])
  const serie = serieDeSeances(etat.seances)

  // L'énergie active importée d'Apple Santé couvre déjà la journée entière,
  // séances comprises : l'ajouter au budget par-dessus les séances saisies
  // compterait deux fois la même dépense. On l'affiche sans la compter.
  const importee = etat.mesuresSante.find((m) => m.date === date && m.depenseKcal)

  function ajouter(seance: SeanceSport) {
    modifier((brouillon) => {
      brouillon.seances.push(seance)
    })
    setSaisie(false)
  }

  function supprimer(id: string) {
    modifier((brouillon) => {
      brouillon.seances = brouillon.seances.filter((s) => s.id !== id)
    })
  }

  const maxMinutes = Math.max(60, ...semaine.jours.map((j) => j.minutes))

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-2xl font-semibold text-ink">Activité</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ce que vous dépensez en bougeant s’ajoute à votre budget du jour.
        </p>
      </header>

      {/* ── Le chiffre du jour ── */}
      <Carte className="animate-rise overflow-hidden" style={{ animationDelay: '60ms' }}>
        <div className="bg-linear-to-b from-bandeau-haut to-bandeau-bas px-5 py-6">
          <p className="text-xs font-bold tracking-[0.14em] text-white/70 uppercase">
            Dépensé aujourd’hui
          </p>
          <p className="mt-1 flex items-baseline gap-2.5">
            <span className="font-display text-5xl font-semibold text-white tnum">
              {entier(bonus)}
            </span>
            <span className="text-base font-medium text-white/80">kcal</span>
          </p>
          <p className="mt-1.5 text-sm text-white/75">
            {duJour.length === 0
              ? 'Aucune séance notée pour l’instant.'
              : `${duJour.length} séance${duJour.length > 1 ? 's' : ''} · ${entier(
                  duJour.reduce((s, x) => s + x.minutes, 0),
                )} minutes`}
          </p>
        </div>

        <div className="px-5 py-4">
          <Bouton pleineLargeur onClick={() => setSaisie(true)}>
            <Plus size={18} aria-hidden="true" />
            Enregistrer une séance
          </Bouton>
        </div>
      </Carte>

      {/* ── Les séances du jour ── */}
      {duJour.length > 0 && (
        <section className="animate-rise" style={{ animationDelay: '120ms' }}>
          <TitreSection eyebrow="Aujourd’hui">Vos séances</TitreSection>
          <Carte className="divide-y divide-line">
            {duJour.map((seance) => (
              <div key={seance.id} className="flex items-center gap-3 px-5 py-3.5">
                <Dumbbell size={18} className="shrink-0 text-corail" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{seance.libelle}</span>
                  <span className="block text-xs text-ink-soft tnum">
                    {seance.minutes} min · {LIBELLE_INTENSITE[seance.intensite].split(' —')[0]}
                  </span>
                </span>
                <span className="shrink-0 font-display text-lg font-semibold text-basil tnum">
                  {entier(seance.kcal)}
                </span>
                <button
                  type="button"
                  onClick={() => supprimer(seance.id)}
                  aria-label={`Retirer ${seance.libelle}`}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-sunken hover:text-berry"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Carte>
        </section>
      )}

      {/* ── La semaine ── */}
      <Carte className="animate-rise p-5" style={{ animationDelay: '180ms' }}>
        <TitreSection
          eyebrow="Cette semaine"
          action={
            serie > 1 ? <Etiquette ton="apricot">{serie} jours d’affilée</Etiquette> : undefined
          }
        >
          Votre régularité
        </TitreSection>

        <div className="flex items-end gap-2" role="img" aria-label={resumerLaSemaine(semaine)}>
          {semaine.jours.map((jour, index) => {
            const hauteur = jour.minutes > 0 ? Math.max(8, (jour.minutes / maxMinutes) * 100) : 3
            const aujourdhui = jour.date === date
            return (
              <div key={jour.date} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[0.6875rem] font-semibold text-ink-faint tnum">
                  {jour.minutes > 0 ? jour.minutes : ''}
                </span>
                <div className="flex h-24 w-full items-end">
                  <div
                    className={classes(
                      'w-full rounded-t-lg transition-all',
                      jour.minutes > 0 ? 'bg-corail' : 'bg-line',
                    )}
                    style={{ height: `${hauteur}%` }}
                  />
                </div>
                <span
                  className={classes(
                    'text-xs font-semibold',
                    aujourdhui ? 'text-corail' : 'text-ink-faint',
                  )}
                >
                  {JOURS_COURTS[index]}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-ink">Repère de l’OMS</span>
            <span className="text-sm text-ink-soft tnum">
              {semaine.minutes} / {MINUTES_OMS_SEMAINE} min
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-basil transition-all"
              style={{ width: `${Math.min(100, semaine.partRecommandation * 100)}%` }}
            />
          </div>
          <p className="mt-2.5 text-sm text-ink-soft">{resumerLaSemaine(semaine)}</p>
        </div>
      </Carte>

      {/* ── Ce que vaut l'estimation ── */}
      <Carte className="animate-rise p-5" style={{ animationDelay: '240ms' }}>
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Info size={18} className="shrink-0 text-corail" aria-hidden="true" />
          Ces calories sont estimées
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Le calcul part de votre poids, de la durée et d’un coût moyen par activité (les MET du
          Compendium of Physical Activities). C’est une moyenne de population : votre dépense réelle
          peut s’en écarter d’un bon tiers, dans un sens comme dans l’autre. La dépense au repos en
          est retirée — elle est déjà comptée dans votre objectif.
        </p>
        {importee && (
          <p className="mt-3 rounded-tile bg-sunken px-3.5 py-3 text-sm text-ink-soft">
            Apple Santé a importé{' '}
            <strong className="font-semibold text-ink tnum">
              {entier(importee.depenseKcal ?? 0)} kcal
            </strong>{' '}
            d’énergie active pour aujourd’hui. Elle n’est pas ajoutée à votre budget : elle couvre
            déjà la journée entière, séances comprises, et compterait deux fois la même dépense.
          </p>
        )}
      </Carte>

      <FeuilleSaisie
        ouvert={saisie}
        poidsKg={poidsKg}
        date={date}
        onFermer={() => setSaisie(false)}
        onValider={ajouter}
      />
    </div>
  )
}

/* ──────────────────────────── Saisie d'une séance ──────────────────────────── */

function FeuilleSaisie({
  ouvert,
  poidsKg,
  date,
  onFermer,
  onValider,
}: {
  ouvert: boolean
  poidsKg: number
  date: string
  onFermer: () => void
  onValider: (seance: SeanceSport) => void
}) {
  const [famille, setFamille] = useState<FamilleActivite>('cardio')
  const [activiteId, setActiviteId] = useState<string>(CATALOGUE_ACTIVITES[0].id)
  const [minutes, setMinutes] = useState(30)
  const [intensite, setIntensite] = useState<Intensite>('moderee')

  const activite = activiteParId(activiteId)
  const kcal = activite ? kcalSeance({ met: activite.met, poidsKg, minutes, intensite }) : 0

  // Changer de famille déplace la sélection sur sa première activité : sinon
  // l'activité retenue reste celle d'une famille qu'on ne voit plus, aucun
  // bouton n'apparaît actif, et c'est pourtant elle qui serait enregistrée.
  function changerFamille(f: FamilleActivite) {
    setFamille(f)
    const premieres = activitesDeLaFamille(f)
    if (premieres.length > 0 && !premieres.some((a) => a.id === activiteId)) {
      setActiviteId(premieres[0].id)
    }
  }

  function valider() {
    if (!activite || minutes <= 0) return
    onValider({
      id: `seance:${Date.now()}`,
      date,
      activiteId: activite.id,
      libelle: activite.libelle,
      minutes,
      intensite,
      kcal,
    })
  }

  return (
    <Feuille ouvert={ouvert} titre="Enregistrer une séance" onFermer={onFermer}>
      <div className="space-y-5">
        {/* Familles */}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Type d’activité</p>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
            {FAMILLES_ACTIVITE.map((f) => {
              const actif = f === famille
              return (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={actif}
                  onClick={() => changerFamille(f)}
                  className={classes(
                    'shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition',
                    actif
                      ? 'bg-corail text-white'
                      : 'bg-sunken text-ink-soft hover:text-ink',
                  )}
                >
                  {LIBELLE_FAMILLE_ACTIVITE[f]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Activités de la famille */}
        <ul className="flex flex-wrap gap-2">
          {activitesDeLaFamille(famille).map((a) => {
            const actif = a.id === activiteId
            return (
              <li key={a.id}>
                <button
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setActiviteId(a.id)}
                  className={classes(
                    'rounded-full border px-3.5 py-2 text-sm font-medium transition',
                    actif
                      ? 'border-corail bg-corail-wash text-ink'
                      : 'border-line bg-surface text-ink-soft hover:bg-sunken',
                  )}
                >
                  {a.libelle}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Durée */}
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <label htmlFor="duree" className="text-sm font-semibold text-ink">
              Durée
            </label>
            <span className="font-display text-lg font-semibold text-ink tnum">{minutes} min</span>
          </div>
          <input
            id="duree"
            type="range"
            min={5}
            max={180}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full accent-corail"
          />
          <div className="mt-2 flex gap-1.5">
            {[15, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={minutes === m}
                onClick={() => setMinutes(m)}
                className={classes(
                  'flex-1 rounded-full py-1.5 text-xs font-semibold transition tnum',
                  minutes === m ? 'bg-corail text-white' : 'bg-sunken text-ink-soft hover:text-ink',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Intensité */}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Intensité</p>
          <div className="space-y-2">
            {INTENSITES.map((i) => {
              const actif = i === intensite
              return (
                <label
                  key={i}
                  className={classes(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition',
                    actif
                      ? 'border-corail bg-corail-wash text-ink'
                      : 'border-line bg-surface text-ink-soft hover:bg-sunken',
                  )}
                >
                  <input
                    type="radio"
                    name="intensite"
                    checked={actif}
                    onChange={() => setIntensite(i)}
                    className="sr-only"
                  />
                  <span
                    className={classes(
                      'grid size-5 shrink-0 place-items-center rounded-full border-2',
                      actif ? 'border-corail' : 'border-line',
                    )}
                  >
                    {actif && <span className="size-2.5 rounded-full bg-corail" />}
                  </span>
                  <span className="text-sm font-medium">{LIBELLE_INTENSITE[i]}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Estimation */}
        <div className="rounded-card bg-sunken px-4 py-3.5 text-center">
          <p className="text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
            Estimation
          </p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink tnum">
            ≈ {entier(kcal)} kcal
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Ajoutées à votre budget du {dateCourte(date)}
          </p>
        </div>

        <Bouton pleineLargeur onClick={valider} disabled={!activite || minutes <= 0}>
          <Activity size={18} aria-hidden="true" />
          Enregistrer
        </Bouton>
      </div>
    </Feuille>
  )
}
