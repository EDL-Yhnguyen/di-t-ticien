import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  ListOrdered,
  Timer,
  X,
} from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, Etiquette, Feuille } from '../components/ui'
import {
  chrono,
  dureesDeLEtape,
  ordonnerBatch,
  recettesDeLaSeance,
} from '../lib/cuisson'
import { useEcranAllume, useMinuteurs } from '../lib/cuisineEnDirect'
import type { Minuteur } from '../lib/cuisineEnDirect'
import { ingredientsPour } from '../lib/catalogue'
import { useRoutage } from '../lib/router'
import { classes } from '../lib/utils'

/**
 * Le mode Cuisine : une étape à la fois, en grand, l'écran qui reste allumé.
 *
 * Cet écran s'affiche **hors du gabarit habituel** (voir `App.tsx`) : ni barre
 * d'onglets, ni rail. On y est pour cuisiner, les mains occupées, et chaque
 * élément qui n'aide pas à l'étape en cours est un élément à contourner du dos
 * de la main.
 */
export function ModeCuisine() {
  const { etat, modifier } = useSession()
  const { aller } = useRoutage()
  const { minuteurs, lancer, arreter, restant } = useMinuteurs()
  const [ingredientsOuverts, setIngredientsOuverts] = useState(false)
  const [planOuvert, setPlanOuvert] = useState(false)

  const seance = etat.cuisine
  const recettes = useMemo(() => recettesDeLaSeance(seance?.recettes ?? []), [seance?.recettes])

  // L'écran reste allumé tant qu'une séance est ouverte, pas une seconde de plus.
  useEcranAllume(seance !== null)

  // Une séance dont les recettes ont disparu du catalogue n'a plus rien à
  // afficher : on la referme plutôt que de montrer un écran vide.
  useEffect(() => {
    if (seance !== null && recettes.length === 0) {
      modifier((brouillon) => {
        brouillon.cuisine = null
      })
      aller('/app/cuisine', { remplacer: true })
    }
  }, [seance, recettes.length, modifier, aller])

  if (!seance || recettes.length === 0) return null

  const index = Math.min(seance.courante, recettes.length - 1)
  const recette = recettes[index]
  const etape = Math.min(seance.etapes[index] ?? 0, recette.etapes.length - 1)
  const texte = recette.etapes[etape]
  const durees = dureesDeLEtape(texte)
  const derniere = etape === recette.etapes.length - 1

  function allerAEtape(suivante: number) {
    modifier((brouillon) => {
      if (!brouillon.cuisine) return
      brouillon.cuisine.etapes[index] = Math.max(
        0,
        Math.min(suivante, recette.etapes.length - 1),
      )
    })
  }

  function changerDeRecette(nouvel: number) {
    modifier((brouillon) => {
      if (brouillon.cuisine) brouillon.cuisine.courante = nouvel
    })
  }

  function terminer() {
    modifier((brouillon) => {
      brouillon.cuisine = null
    })
    aller('/app/cuisine')
  }

  return (
    <div className="flex min-h-svh flex-col bg-ground">
      {/* ── Barre du haut : quitter, et où l'on en est ── */}
      <header className="safe-top sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={terminer}
            aria-label="Quitter le mode cuisine"
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-sunken"
          >
            <X size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{recette.titre}</p>
            <p className="text-xs text-ink-soft tnum">
              Étape {etape + 1} sur {recette.etapes.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIngredientsOuverts(true)}
            className="shrink-0 rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink-soft transition hover:bg-sunken"
          >
            Ingrédients
          </button>
        </div>

        {/* La progression de l'étape en cours, en une ligne : sur un plan de
            travail, on veut savoir s'il reste un geste ou six. */}
        <div className="flex gap-1 px-4 pb-2.5">
          {recette.etapes.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={classes(
                'h-1 flex-1 rounded-full transition',
                i < etape ? 'bg-reussite' : i === etape ? 'bg-primaire' : 'bg-line',
              )}
            />
          ))}
        </div>
      </header>

      {/* ── Le batch cooking : passer d'une recette à l'autre ── */}
      {recettes.length > 1 && (
        <div className="mx-auto w-full max-w-2xl px-4 pt-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Recettes de la séance">
            {recettes.map((r, i) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => changerDeRecette(i)}
                className={classes(
                  'shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition',
                  i === index ? 'bg-primaire text-white' : 'bg-surface text-ink-soft hover:bg-sunken',
                )}
              >
                {r.titre.length > 22 ? `${r.titre.slice(0, 21)}…` : r.titre}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPlanOuvert(true)}
              className="shrink-0 rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink-soft transition hover:bg-sunken"
            >
              <ListOrdered size={13} className="mr-1 inline" aria-hidden="true" />
              Ordre
            </button>
          </div>
        </div>
      )}

      {/* ── L'étape, en grand ── */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8">
        <p className="mb-4 font-display text-6xl font-semibold text-primaire tnum">{etape + 1}</p>
        {/* Une taille qui se lit à cinquante centimètres, debout, sans lunettes
            de lecture : c'est la distance réelle entre un plan de travail et un
            téléphone posé contre le mur. */}
        <p className="font-display text-2xl leading-snug text-ink sm:text-3xl">{texte}</p>

        {durees.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {durees.map((duree) => (
              <Bouton
                key={duree.secondes}
                ton="accent"
                onClick={() => lancer(`${recette.titre} — ${duree.libelle}`, duree.secondes)}
              >
                <Timer size={17} aria-hidden="true" />
                Minuteur {duree.libelle}
              </Bouton>
            ))}
          </div>
        )}

        {recette.astuce && derniere && (
          <p className="mt-6 rounded-tile bg-accent-wash px-4 py-3.5 text-sm text-ink">
            <strong className="font-semibold text-accent">Le truc en plus — </strong>
            {recette.astuce}
          </p>
        )}
      </main>

      {/* ── Avancer, et les minuteurs qui tournent ── */}
      <footer className="safe-bottom sticky bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur">
        {/* Les minuteurs vivent **dans** la barre du bas et non au-dessus d'elle :
            en `sticky` séparé, la carte recouvrait le bouton « Étape suivante » en
            390 px. Ici ils restent visibles en permanence sans rien masquer. */}
        {minuteurs.length > 0 && (
          <section aria-label="Minuteurs" className="mx-auto w-full max-w-2xl px-4 pt-3">
            <ul className="space-y-2">
              {minuteurs.map((minuteur) => (
                <li key={minuteur.id}>
                  <LigneMinuteur
                    minuteur={minuteur}
                    secondes={restant(minuteur)}
                    onArreter={() => arreter(minuteur.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => allerAEtape(etape - 1)}
            disabled={etape === 0}
            aria-label="Étape précédente"
            className="grid size-12 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition hover:bg-sunken disabled:opacity-40"
          >
            <ChevronLeft size={22} />
          </button>

          {derniere ? (
            <Bouton pleineLargeur onClick={terminer}>
              <Check size={18} aria-hidden="true" />
              C’est prêt
            </Bouton>
          ) : (
            <Bouton pleineLargeur onClick={() => allerAEtape(etape + 1)}>
              Étape suivante
              <ChevronRight size={18} aria-hidden="true" />
            </Bouton>
          )}
        </div>
      </footer>

      <Feuille
        ouvert={ingredientsOuverts}
        titre="Ingrédients"
        onFermer={() => setIngredientsOuverts(false)}
      >
        <ul className="divide-y divide-line">
          {ingredientsPour(recette, 1).map((i) => (
            <li key={i.nom} className="flex justify-between gap-4 py-2.5 text-sm">
              <span className="text-ink">{i.nom}</span>
              <span className="shrink-0 font-semibold text-ink-soft tnum">{i.quantite}</span>
            </li>
          ))}
        </ul>
        {recette.conservation && (
          <p className="mt-4 text-sm text-ink-soft">Se garde {recette.conservation}.</p>
        )}
      </Feuille>

      {recettes.length > 1 && (
        <Feuille ouvert={planOuvert} titre="Dans quel ordre" onFermer={() => setPlanOuvert(false)}>
          <PlanDeBataille recettes={recettes} />
        </Feuille>
      )}
    </div>
  )
}

function LigneMinuteur({
  minuteur,
  secondes,
  onArreter,
}: {
  minuteur: Minuteur
  secondes: number
  onArreter: () => void
}) {
  const part = Math.max(0, Math.min(1, secondes / minuteur.dureeSecondes))

  return (
    <Carte
      className={classes(
        'overflow-hidden',
        // Un minuteur échu doit se voir depuis l'autre bout de la cuisine :
        // le son peut être coupé, et les mains mouillées n'acquittent pas vite.
        minuteur.sonne && 'border-alerte bg-alerte-wash',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {minuteur.sonne ? (
          <Flame size={20} className="shrink-0 animate-pulse text-alerte" aria-hidden="true" />
        ) : (
          <Timer size={20} className="shrink-0 text-primaire" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1">
          <span
            className={classes(
              'block font-display text-2xl font-semibold tnum',
              minuteur.sonne ? 'text-alerte' : 'text-ink',
            )}
            role={minuteur.sonne ? 'status' : undefined}
          >
            {minuteur.sonne ? 'C’est l’heure' : chrono(secondes)}
          </span>
          <span className="block truncate text-xs text-ink-soft">{minuteur.libelle}</span>
        </span>
        <button
          type="button"
          onClick={onArreter}
          className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink-soft transition hover:bg-sunken"
        >
          {minuteur.sonne ? 'D’accord' : 'Arrêter'}
        </button>
      </div>
      {!minuteur.sonne && (
        <div className="h-1 bg-sunken">
          <div className="h-full bg-primaire transition-[width]" style={{ width: `${part * 100}%` }} />
        </div>
      )}
    </Carte>
  )
}

/**
 * L'ordre de démarrage d'une séance à plusieurs recettes.
 *
 * On n'entrelace pas les étapes — voir `ordonnerBatch` : le catalogue ne dit pas
 * lesquelles sont actives et lesquelles sont de l'attente. Ce qui est dit ici est
 * vrai et suffisant : commencez par la plus longue, sa cuisson vous laisse le
 * temps des autres.
 */
function PlanDeBataille({ recettes }: { recettes: ReturnType<typeof recettesDeLaSeance> }) {
  const plan = useMemo(() => ordonnerBatch(recettes), [recettes])

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft tnum">
        Bout à bout : {plan.minutesBoutABout} min. En menant les cuissons en parallèle, comptez
        plutôt {plan.minutesEnParallele} min — un ordre de grandeur, pas une promesse.
      </p>

      <ol className="space-y-2">
        {plan.ordre.map((recette, rang) => (
          <li key={recette.id} className="flex items-start gap-3 rounded-tile bg-sunken px-3.5 py-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primaire text-xs font-bold text-white tnum">
              {rang + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">{recette.titre}</span>
              <span className="block text-xs text-ink-soft tnum">
                {recette.minutes} min
                {rang === 0 && plan.ordre.length > 1 && ' · lancez celle-ci d’abord'}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className="text-xs text-ink-soft">
        Les étapes ne sont pas mélangées entre les recettes : le catalogue ne dit pas lesquelles
        demandent votre présence. Passez d’une recette à l’autre avec les onglets du haut.
      </p>
    </div>
  )
}

/**
 * Le bandeau de reprise, affiché sur les écrans de cuisine quand une séance est
 * restée ouverte. Sans lui, une séance interrompue serait invisible et l'écran
 * garderait une étape en mémoire que personne ne retrouverait.
 */
export function BandeauCuisineEnCours() {
  const { etat, modifier } = useSession()
  const { aller } = useRoutage()
  const seance = etat.cuisine
  const recettes = useMemo(() => recettesDeLaSeance(seance?.recettes ?? []), [seance?.recettes])

  if (!seance || recettes.length === 0) return null

  const courante = recettes[Math.min(seance.courante, recettes.length - 1)]

  return (
    <Carte className="flex items-center gap-3 border-primaire px-4 py-3">
      <Flame size={18} className="shrink-0 text-primaire" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold tracking-[0.14em] text-primaire uppercase">
          En cuisine
        </span>
        <span className="block truncate text-sm font-semibold text-ink">{courante.titre}</span>
      </span>
      <Etiquette ton="neutre">
        étape {(seance.etapes[seance.courante] ?? 0) + 1}
      </Etiquette>
      <button
        type="button"
        onClick={() => aller('/app/mode-cuisine')}
        className="shrink-0 rounded-full bg-primaire px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110"
      >
        Reprendre
      </button>
      <button
        type="button"
        onClick={() =>
          modifier((brouillon) => {
            brouillon.cuisine = null
          })
        }
        aria-label="Abandonner la séance de cuisine"
        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-sunken"
      >
        <X size={15} />
      </button>
    </Carte>
  )
}
