import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Droplets, Flame, ShieldHalf } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Assiette, LegendeAssiette, type PartAssiette } from '../components/Assiette'
import { Bouton, Carte, Etiquette } from '../components/ui'
import { Lien } from '../lib/router'
import { serie } from '../lib/badges'
import { objectifCalorique } from '../lib/nutrition'
import { PARTS_ASSIETTE, SATELLITES, TEINTE_MOMENT, VERRES_PAR_JOUR, planPour } from '../lib/plan'
import { eauDuJour, poidsActuel, repasDuJour } from '../lib/store'
import type { Categorie, Moment, Repas } from '../lib/types'
import { classes, dateLongue, entier, jourISO, salutation } from '../lib/utils'

function momentActuel(): Moment {
  const h = new Date().getHours()
  if (h < 11) return 'petit-dejeuner'
  if (h < 17) return 'dejeuner'
  return 'diner'
}

export function Aujourdhui() {
  const { etat, modifier } = useSession()
  const date = jourISO()
  const [ouvert, setOuvert] = useState<Moment | null>(momentActuel())

  const objectif = objectifCalorique({
    poidsKg: poidsActuel(etat),
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  })

  const plan = useMemo(
    () => planPour(etat.profil, objectif),
    [etat.profil, objectif],
  )

  const journal = repasDuJour(etat, date)
  const coches = useMemo(
    () => new Set(journal.flatMap((r) => r.composantsCoches)),
    [journal],
  )

  const parts = useMemo(() => partsAssiette(plan, coches), [plan, coches])
  const compteurs = useMemo(() => {
    const sortie: Record<string, { faits: number; total: number }> = {}
    for (const part of parts) {
      const ids = composantsDe(plan, part.categorie)
      sortie[part.categorie] = {
        faits: ids.filter((id) => coches.has(id)).length,
        total: ids.length,
      }
    }
    return sortie
  }, [parts, plan, coches])
  const accompagnements = useMemo(
    () =>
      SATELLITES.filter((c) => c !== 'boisson')
        .map((categorie) => ({
          categorie,
          ids: composantsDe(plan, categorie),
        }))
        .filter((x) => x.ids.length > 0)
        .map(({ categorie, ids }) => ({
          categorie,
          fait: ids.every((id) => coches.has(id)),
        })),
    [plan, coches],
  )

  const kcalPris = plan
    .flatMap((r) => r.composants)
    .filter((c) => coches.has(c.id))
    .reduce((s, c) => s + c.kcal, 0)

  const eau = eauDuJour(etat, date)
  const jours = serie(etat)

  function basculerComposant(moment: Moment, composantId: string) {
    modifier((brouillon) => {
      let ligne = brouillon.repas.find((r) => r.date === date && r.moment === moment)
      if (!ligne) {
        ligne = { date, moment, composantsCoches: [] }
        brouillon.repas.push(ligne)
      }
      ligne.composantsCoches = ligne.composantsCoches.includes(composantId)
        ? ligne.composantsCoches.filter((id) => id !== composantId)
        : [...ligne.composantsCoches, composantId]
    })
  }

  function reglerEau(verres: number) {
    modifier((brouillon) => {
      const ligne = brouillon.eau.find((e) => e.date === date)
      if (ligne) ligne.verres = verres
      else brouillon.eau.push({ date, verres })
    })
  }

  return (
    <div className="space-y-6">
      {/* Bandeau pleine largeur : il sort de la gouttière du gabarit pour que
          la carte de l'assiette vienne chevaucher la couleur. */}
      <div className="-mx-4 -mt-5 rounded-b-[2.5rem] bg-linear-to-b from-bandeau-haut to-bandeau-bas px-4 pt-6 pb-24 md:-mx-8 md:-mt-10 md:px-8 md:pt-10">
        <header className="animate-rise flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/70">
              {dateLongue(date).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
            <h1 className="mt-0.5 text-3xl font-semibold text-white">
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
      </div>

      <Carte className="animate-rise -mt-20 overflow-hidden" style={{ animationDelay: '60ms' }}>
        <div className="px-5 pt-6 pb-5">
          <Assiette parts={parts} className="mx-auto w-full max-w-[16.5rem]" />

          <div className="mt-4">
            <LegendeAssiette
              parts={parts}
              compteurs={compteurs}
              accompagnements={accompagnements}
            />
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <p className="text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
                Estimation du jour
              </p>
              <p className="font-display text-2xl font-semibold text-ink tnum">
                {entier(kcalPris)}
                <span className="ml-1 text-sm font-medium text-ink-soft">
                  / {entier(objectif)} kcal
                </span>
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-apricot transition-[width] duration-500"
                style={{ width: `${Math.min(100, (kcalPris / objectif) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Carte>

      <section className="animate-rise space-y-3" style={{ animationDelay: '120ms' }}>
        {plan.map((repas) => (
          <CarteRepas
            key={repas.moment}
            repas={repas}
            coches={coches}
            ouvert={ouvert === repas.moment}
            onBasculer={() => setOuvert(ouvert === repas.moment ? null : repas.moment)}
            onComposant={(id) => basculerComposant(repas.moment, id)}
          />
        ))}
      </section>

      <Carte className="animate-rise p-5" style={{ animationDelay: '180ms' }}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Droplets size={18} className="text-iris" aria-hidden="true" />
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
                  rempli
                    ? 'border-iris bg-iris'
                    : 'border-line bg-sunken hover:border-iris/40',
                )}
              />
            )
          })}
        </div>
        <p className="mt-2.5 text-sm text-ink-soft">
          Thé, tisane et café comptent — c’est la consigne de votre diététicienne.
        </p>
      </Carte>

      <Lien vers="/app/envies" className="animate-rise block" style={{ animationDelay: '240ms' }}>
        <Bouton ton="alerte" pleineLargeur className="py-4 text-base">
          <ShieldHalf size={19} aria-hidden="true" />
          J’ai une envie de grignoter
        </Bouton>
      </Lien>
    </div>
  )
}

/* ─────────────────────────────── Sous-vues ──────────────────────────────── */

function CarteRepas({
  repas,
  coches,
  ouvert,
  onBasculer,
  onComposant,
}: {
  repas: Repas
  coches: Set<string>
  ouvert: boolean
  onBasculer: () => void
  onComposant: (id: string) => void
}) {
  const faits = repas.composants.filter((c) => coches.has(c.id)).length
  const total = repas.composants.length
  const complet = faits === total
  const teinte = TEINTE_MOMENT[repas.moment]

  return (
    <Carte className="overflow-hidden">
      <button
        type="button"
        onClick={onBasculer}
        aria-expanded={ouvert}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-sunken"
      >
        <span
          className={classes(
            'grid size-9 shrink-0 place-items-center rounded-full transition',
            complet ? 'bg-basil text-white' : classes(teinte.fond, teinte.texte),
          )}
        >
          {complet ? (
            <Check size={18} strokeWidth={3} aria-hidden="true" />
          ) : (
            <span className="text-xs font-bold tnum">{faits}</span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">{repas.titre}</span>
          <span className="mt-1 flex items-center gap-2">
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-sunken">
              <span
                className={classes('block h-full rounded-full transition-[width]', complet ? 'bg-basil' : teinte.barre)}
                style={{ width: `${(faits / total) * 100}%` }}
              />
            </span>
            <span className="text-sm text-ink-soft">
              {complet ? 'Terminé' : `${faits} sur ${total}`}
            </span>
          </span>
        </span>

        <ChevronDown
          size={19}
          aria-hidden="true"
          className={classes('shrink-0 text-ink-faint transition', ouvert && 'rotate-180')}
        />
      </button>

      {ouvert && (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-line"
        >
          {repas.composants.map((composant) => {
            const fait = coches.has(composant.id)
            return (
              <li key={composant.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => onComposant(composant.id)}
                  aria-pressed={fait}
                  className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-sunken"
                >
                  <span
                    className={classes(
                      'mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition',
                      fait ? 'border-basil bg-basil text-white' : 'border-line',
                    )}
                  >
                    {fait && <Check size={14} strokeWidth={3.5} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={classes(
                        'block text-sm leading-snug',
                        fait ? 'text-ink-faint line-through' : 'text-ink',
                      )}
                    >
                      {composant.libelle}
                    </span>
                    {composant.alternatives && composant.alternatives.length > 0 && (
                      <span className="mt-1 block text-xs text-ink-soft">
                        ou {composant.alternatives.join(' · ou ')}
                      </span>
                    )}
                  </span>
                  {composant.kcal > 0 && (
                    <span className="mt-0.5 shrink-0 text-xs font-semibold text-ink-faint tnum">
                      {composant.kcal} kcal
                    </span>
                  )}
                </button>
              </li>
            )
          })}

          {repas.variantes && repas.variantes.length > 0 && (
            <li className="bg-sunken px-5 py-4">
              <Etiquette ton="neutre">À la place</Etiquette>
              <ul className="mt-2 space-y-1">
                {repas.variantes.map((variante) => (
                  <li key={variante} className="text-sm text-ink-soft">
                    {variante}
                  </li>
                ))}
              </ul>
            </li>
          )}
        </motion.ul>
      )}
    </Carte>
  )
}

/* ────────────────────────────── Calculs de vue ──────────────────────────── */

function composantsDe(plan: Repas[], categorie: Categorie): string[] {
  return plan.flatMap((r) => r.composants.filter((c) => c.categorie === categorie).map((c) => c.id))
}

/** Convertit les parts prescrites en secteurs, dans le sens des aiguilles depuis midi. */
function partsAssiette(plan: Repas[], coches: Set<string>): PartAssiette[] {
  // Protéines et féculents d'abord : les deux quarts se lisent en haut,
  // les légumes occupent toute la moitié basse.
  const ordre: Categorie[] = ['proteine', 'feculent', 'legume']
  let angle = 0

  return ordre.map((categorie) => {
    const part = PARTS_ASSIETTE.find((p) => p.categorie === categorie)?.part ?? 0
    const ids = composantsDe(plan, categorie)
    const faits = ids.filter((id) => coches.has(id)).length
    const debut = angle
    angle += part * 360

    return {
      categorie,
      debut,
      fin: angle,
      ratio: ids.length === 0 ? 0 : faits / ids.length,
    }
  })
}
