import { useMemo, useState } from 'react'
import {
  ChevronRight,
  Droplets,
  Flame,
  Plus,
  ShieldHalf,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { useSession } from '../context/AppContext'
import { LegendeMosaique, Mosaique, couleurNutri } from '../components/Mosaique'
import {
  BarreMacro,
  JaugeEnergie,
  LigneTopFlop,
  PastilleNutri,
} from '../components/nutrition'
import { Bouton, Carte, Etiquette, Feuille, TitreSection } from '../components/ui'
import { TON_VERDICT, alternativesPour, analyserRepas, recommanderProchainRepas, resumerLaJournee } from '../lib/coach'
import type { AnalyseRepas } from '../lib/coach'
import {
  apportDe,
  bilanParRepas,
  mettreALEchelle,
  serieDeJours,
  topFlopDuJour,
} from '../lib/journal'
import type { BilanRepas } from '../lib/journal'
import { objectifCalorique } from '../lib/nutrition'
import { VERRES_PAR_JOUR } from '../lib/plan'
import { Lien } from '../lib/router'
import { eauDuJour, poidsLePlusRecent } from '../lib/store'
import type { EntreeJournal } from '../lib/types'
import { LIBELLE_MOMENT } from '../lib/types'
import { classes, dateLongue, entier, jourISO, salutation } from '../lib/utils'

export function Aujourdhui() {
  const { etat, modifier } = useSession()
  const date = jourISO()
  const [choisie, setChoisie] = useState<EntreeJournal | null>(null)

  const objectif = objectifCalorique({
    poidsKg: poidsLePlusRecent(etat),
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  })

  const bilans = useMemo(() => bilanParRepas(etat.journal, date), [etat.journal, date])
  const resume = useMemo(
    () => resumerLaJournee(etat.journal, objectif, date),
    [etat.journal, objectif, date],
  )
  const { top, flop } = useMemo(() => topFlopDuJour(etat.journal, date), [etat.journal, date])
  const conseil = useMemo(
    () => recommanderProchainRepas(etat.journal, objectif, date),
    [etat.journal, objectif, date],
  )

  const entrees = bilans.flatMap((b) => b.entrees)
  const jours = serieDeJours(etat.journal)
  const eau = eauDuJour(etat, date)
  const reste = objectif - resume.kcal

  function reglerEau(verres: number) {
    modifier((brouillon) => {
      const ligne = brouillon.eau.find((e) => e.date === date)
      if (ligne) ligne.verres = verres
      else brouillon.eau.push({ date, verres })
    })
  }

  function supprimer(id: string) {
    modifier((brouillon) => {
      brouillon.journal = brouillon.journal.filter((e) => e.id !== id)
    })
    setChoisie(null)
  }

  return (
    <div className="space-y-6">
      {/* Le bandeau porte la seule question qui compte au moment où l'on ouvre
          l'application : combien il reste. Il sort de la gouttière du gabarit
          pour que la carte de la mosaïque vienne chevaucher la couleur. */}
      <div className="-mx-4 -mt-5 rounded-b-[2.5rem] bg-linear-to-b from-bandeau-haut to-bandeau-bas px-4 pt-6 pb-24 md:-mx-8 md:-mt-10 md:px-8 md:pt-10">
        <header className="animate-rise flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/70">
              {dateLongue(date).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold text-white">
              {salutation()}
              {etat.profil.prenom && `, ${etat.profil.prenom}`}
            </h1>
          </div>
          {jours > 0 && (
            <p className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-display text-lg font-semibold text-white tnum">
              <Flame size={17} className="animate-flame text-apricot" aria-hidden="true" />
              {jours}
            </p>
          )}
        </header>

        <div className="animate-rise mt-6" style={{ animationDelay: '60ms' }}>
          <p className="flex items-baseline gap-2.5">
            <span
              className="font-display font-semibold text-white tnum"
              style={{ fontSize: 'clamp(2.75rem, 13vw, 4rem)', lineHeight: 1 }}
            >
              {entier(Math.abs(reste))}
            </span>
            <span className="text-base font-medium text-white/80">
              kcal {reste >= 0 ? 'restantes' : 'au-dessus'}
            </span>
          </p>
          <p className="mt-1.5 text-sm text-white/75">{resume.phrase}</p>

          <div className="mt-4">
            <JaugeEnergie bilans={bilans} objectifKcal={objectif} surBandeau />
          </div>
        </div>
      </div>

      {/* ── La mosaïque : le cœur de l'écran ── */}
      <Carte className="animate-rise -mt-20 overflow-hidden" style={{ animationDelay: '120ms' }}>
        <div className="px-5 pt-5 pb-5">
          <TitreSection
            eyebrow="Ce que vous avez mangé"
            action={
              <Lien
                vers="/app/ajouter"
                className="flex items-center gap-1 text-sm font-semibold text-corail"
              >
                <Plus size={16} aria-hidden="true" />
                Ajouter
              </Lien>
            }
          >
            Votre journée
          </TitreSection>

          {entrees.length === 0 ? (
            <JourneeVide />
          ) : (
            <>
              <Mosaique entrees={entrees} onChoisir={setChoisie} />
              <div className="mt-4">
                <LegendeMosaique />
              </div>
            </>
          )}
        </div>

        {(top || flop) && (
          <div className="grid gap-4 border-t border-line px-5 py-4 sm:grid-cols-2">
            {top && (
              <LigneTopFlop
                icone={<ThumbsUp size={15} className="text-basil" aria-hidden="true" />}
                intitule="Le top du jour"
              >
                {top.aliment.nom}
              </LigneTopFlop>
            )}
            {flop && (
              <LigneTopFlop
                icone={<ThumbsDown size={15} className="text-berry" aria-hidden="true" />}
                intitule="Le flop du jour"
              >
                {flop.aliment.nom}
              </LigneTopFlop>
            )}
          </div>
        )}
      </Carte>

      {/* ── Macros ── */}
      {resume.kcal > 0 && (
        <Carte className="animate-rise p-5" style={{ animationDelay: '180ms' }}>
          <TitreSection eyebrow="Répartition">Vos apports</TitreSection>
          <div className="space-y-3.5">
            <BarreMacro
              libelle="Protéines"
              valeur={resume.macros.proteines}
              cible={resume.cibles.proteines}
              teinte="bg-macro-proteines"
            />
            <BarreMacro
              libelle="Glucides"
              valeur={resume.macros.glucides}
              cible={resume.cibles.glucides}
              teinte="bg-macro-glucides"
            />
            <BarreMacro
              libelle="Lipides"
              valeur={resume.macros.lipides}
              cible={resume.cibles.lipides}
              teinte="bg-macro-lipides"
            />
          </div>
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
            Repères calculés sur votre objectif du jour, pas une prescription. Fibres :{' '}
            <strong className="font-semibold text-ink tnum">
              {Math.round(resume.macros.fibres)} g
            </strong>{' '}
            · Sel :{' '}
            <strong className="font-semibold text-ink tnum">
              {resume.macros.sel.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} g
            </strong>
          </p>
        </Carte>
      )}

      {/* ── Analyse repas par repas ── */}
      <section className="animate-rise space-y-3" style={{ animationDelay: '240ms' }}>
        <TitreSection eyebrow="Repas par repas">L’analyse du jour</TitreSection>
        {bilans.map((bilan) => (
          <CarteRepas
            key={bilan.moment}
            bilan={bilan}
            analyse={analyserRepas(bilan, objectif)}
            onChoisir={setChoisie}
          />
        ))}
      </section>

      {/* ── Recommandation ── */}
      <Carte className="animate-rise overflow-hidden" style={{ animationDelay: '300ms' }}>
        <div className="bg-corail-wash px-5 py-4">
          <p className="text-xs font-bold tracking-[0.14em] text-corail uppercase">
            Pour le {LIBELLE_MOMENT[conseil.moment].toLowerCase()}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">{conseil.titre}</h2>
          <p className="mt-1.5 text-sm text-ink-soft">{conseil.conseil}</p>
        </div>

        {conseil.suggestions.length > 0 && (
          <ul className="divide-y divide-line">
            {conseil.suggestions.map((aliment) => (
              <li key={aliment.id} className="flex items-center gap-3 px-5 py-3">
                <PastilleNutri
                  note={aliment.nutriScore}
                  taille="s"
                  estime={aliment.nutriScoreEstime}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {aliment.nom}
                  </span>
                  <span className="block text-xs text-ink-soft tnum">
                    {entier(
                      mettreALEchelle(aliment.valeurs, aliment.portionG ?? 100).kcal,
                    )}{' '}
                    kcal · {aliment.portionLibelle ?? `${aliment.portionG ?? 100} g`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="px-5 py-4">
          <Lien vers="/app/cuisine">
            <Bouton ton="doux" pleineLargeur>
              Voir des recettes qui rentrent
              <ChevronRight size={17} aria-hidden="true" />
            </Bouton>
          </Lien>
        </div>
      </Carte>

      {/* ── Hydratation ── */}
      <Carte className="animate-rise p-5" style={{ animationDelay: '360ms' }}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Droplets size={18} className="text-corail" aria-hidden="true" />
            Hydratation
          </h2>
          <span className="text-sm font-semibold text-ink-soft tnum">
            {(eau.verres * 0.25).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} / 1,50 L
          </span>
        </div>
        <div className="flex gap-2" role="group" aria-label="Verres d’eau bus aujourd’hui">
          {Array.from({ length: VERRES_PAR_JOUR }, (_, i) => {
            const rempli = i < eau.verres
            return (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1} verre${i > 0 ? 's' : ''} sur ${VERRES_PAR_JOUR}`}
                aria-pressed={rempli}
                onClick={() => reglerEau(rempli && i === eau.verres - 1 ? i : i + 1)}
                className={classes(
                  'h-11 flex-1 rounded-xl border-2 transition',
                  rempli ? 'border-corail bg-corail' : 'border-line bg-sunken hover:border-corail/40',
                )}
              />
            )
          })}
        </div>
        <p className="mt-2.5 text-sm text-ink-soft">Thé, tisane et café comptent.</p>
      </Carte>

      <Lien vers="/app/envies" className="animate-rise block" style={{ animationDelay: '420ms' }}>
        <Bouton ton="alerte" pleineLargeur className="py-4 text-base">
          <ShieldHalf size={19} aria-hidden="true" />
          J’ai une envie de grignoter
        </Bouton>
      </Lien>

      {etat.profil.planPrescrit && (
        <Lien
          vers="/app/plan"
          className="block text-center text-sm font-semibold text-ink-soft underline underline-offset-4"
        >
          Revoir le plan prescrit par ma diététicienne
        </Lien>
      )}

      <DetailEntree
        entree={choisie}
        onFermer={() => setChoisie(null)}
        onSupprimer={supprimer}
      />
    </div>
  )
}

/* ─────────────────────────────── Sous-vues ─────────────────────────────── */

function JourneeVide() {
  return (
    <div className="rounded-card border border-dashed border-line px-6 py-10 text-center">
      <p className="mb-3 text-4xl" aria-hidden="true">
        🍽
      </p>
      <h3 className="text-base font-semibold text-ink">La mosaïque est encore vide</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">
        Chaque aliment que vous notez devient une tuile : sa taille dit les calories, sa couleur dit
        le Nutri-Score. Au bout de trois ou quatre, la journée se lit d’un coup d’œil.
      </p>
      <Lien vers="/app/ajouter" className="mt-5 inline-block">
        <Bouton>
          <Plus size={17} aria-hidden="true" />
          Ajouter un aliment
        </Bouton>
      </Lien>
    </div>
  )
}

function CarteRepas({
  bilan,
  analyse,
  onChoisir,
}: {
  bilan: BilanRepas
  analyse: AnalyseRepas
  onChoisir: (e: EntreeJournal) => void
}) {
  const { libelle, ton } = TON_VERDICT[analyse.verdict]
  const vide = bilan.entrees.length === 0

  return (
    <Carte className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{LIBELLE_MOMENT[bilan.moment]}</h3>
          <p className="mt-0.5 text-sm text-ink-soft tnum">
            {vide ? `Repère : ${analyse.cibleKcal} kcal` : `${analyse.kcal} / ${analyse.cibleKcal} kcal`}
          </p>
        </div>
        <Etiquette ton={ton}>{libelle}</Etiquette>
      </div>

      {!vide && (
        <ul className="mt-3 flex flex-wrap gap-1.5 px-5">
          {bilan.entrees.map((entree) => (
            <li key={entree.id}>
              <button
                type="button"
                onClick={() => onChoisir(entree)}
                className={classes(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-110',
                  couleurNutri(entree.aliment.nutriScore),
                )}
              >
                <span className="max-w-[10rem] truncate">{entree.aliment.nom}</span>
                <span className="opacity-80 tnum">{entier(apportDe(entree).kcal)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="px-5 py-4 text-sm text-ink-soft">{analyse.message}</p>
    </Carte>
  )
}

function DetailEntree({
  entree,
  onFermer,
  onSupprimer,
}: {
  entree: EntreeJournal | null
  onFermer: () => void
  onSupprimer: (id: string) => void
}) {
  const alternatives = useMemo(() => (entree ? alternativesPour(entree) : []), [entree])
  if (!entree) return null

  const apport = apportDe(entree)

  return (
    <Feuille ouvert titre={entree.aliment.nom} onFermer={onFermer}>
      <div className="flex items-center gap-3">
        <PastilleNutri
          note={entree.aliment.nutriScore}
          taille="l"
          estime={entree.aliment.nutriScoreEstime}
        />
        <div className="min-w-0">
          <p className="text-sm text-ink-soft">
            {entree.aliment.marque ? `${entree.aliment.marque} · ` : ''}
            {entree.quantiteG} g au {LIBELLE_MOMENT[entree.moment].toLowerCase()}
          </p>
          <p className="font-display text-2xl font-semibold text-ink tnum">
            {entier(apport.kcal)} kcal
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-4 gap-2 rounded-card bg-sunken p-3 text-center">
        {[
          { terme: 'Prot.', valeur: apport.proteines },
          { terme: 'Gluc.', valeur: apport.glucides },
          { terme: 'Lip.', valeur: apport.lipides },
          { terme: 'Fibres', valeur: apport.fibres },
        ].map(({ terme, valeur }) => (
          <div key={terme}>
            <dt className="text-[0.6875rem] font-bold tracking-[0.08em] text-ink-faint uppercase">
              {terme}
            </dt>
            <dd className="mt-0.5 font-display text-lg font-semibold text-ink tnum">
              {Math.round(valeur)} g
            </dd>
          </div>
        ))}
      </dl>

      {alternatives.length > 0 && (
        <section className="mt-6">
          <TitreSection eyebrow="À la place, la prochaine fois">Des alternatives</TitreSection>
          <ul className="space-y-2">
            {alternatives.map(({ aliment, quantiteG, kcalEconomisees }) => (
              <li
                key={aliment.id}
                className="flex items-center gap-3 rounded-card border border-line px-4 py-3"
              >
                <PastilleNutri
                  note={aliment.nutriScore}
                  taille="s"
                  estime={aliment.nutriScoreEstime}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {aliment.nom}
                  </span>
                  <span className="block text-xs text-ink-soft tnum">
                    {quantiteG} g ·{' '}
                    {entier(mettreALEchelle(aliment.valeurs, quantiteG).kcal)} kcal
                  </span>
                </span>
                {kcalEconomisees > 0 && (
                  <span className="shrink-0 text-xs font-bold text-basil tnum">
                    −{entier(kcalEconomisees)} kcal
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Bouton
        ton="fantome"
        pleineLargeur
        className="mt-6 text-berry"
        onClick={() => onSupprimer(entree.id)}
      >
        <Trash2 size={17} aria-hidden="true" />
        Retirer du journal
      </Bouton>
    </Feuille>
  )
}
