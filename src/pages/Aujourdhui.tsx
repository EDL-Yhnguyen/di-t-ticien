import { useMemo, useState } from 'react'
import {
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  MessageCircle,
  Plus,
  ShieldHalf,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { useSession } from '../context/AppContext'
import { MarmiteExpression } from '../components/MarmiteExpression'
import { usePhoto } from '../components/PhotoFamille'
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
import { nomAffiche } from '../lib/identite'
import { objectifCalorique } from '../lib/nutrition'
import { VERRES_PAR_JOUR } from '../lib/plan'
import { Lien } from '../lib/router'
import { bonusSportDuJour, seancesDuJour } from '../lib/sport'
import { eauDuJour, poidsLePlusRecent } from '../lib/store'
// Depuis `peremption` et non `stocks` : ce dernier parcourt le catalogue de
// recettes, et cet écran est chargé d'emblée. L'import fautif faisait passer le
// fichier initial de 280 à 353 Ko.
import { articlesUrgents } from '../lib/peremption'
import type { ArticleStock, EntreeJournal } from '../lib/types'
import { LIBELLE_MOMENT } from '../lib/types'
import { classes, dateLongue, entier, jourISO, salutation } from '../lib/utils'

export function Aujourdhui() {
  const { etat, modifier } = useSession()
  const date = jourISO()
  const nom = nomAffiche(etat.profil)
  const photoFamille = usePhoto(etat.profil.id, 'famille')
  const [choisie, setChoisie] = useState<EntreeJournal | null>(null)

  const objectifBase = objectifCalorique({
    poidsKg: poidsLePlusRecent(etat),
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  })

  // Le sport du jour agrandit le budget mangeable, et pas seulement l'affichage :
  // tout ce qui raisonne sur l'objectif (jauge, analyse par repas, macros,
  // recommandation) doit voir le même chiffre, sinon les conseils du jour
  // contrediraient le nombre affiché en haut de l'écran.
  const bonusSport = bonusSportDuJour(etat.seances, date)
  const objectif = objectifBase + bonusSport

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
  const seances = useMemo(() => seancesDuJour(etat.seances, date), [etat.seances, date])
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
      <div className="bandeau relative -mx-4 -mt-5 overflow-hidden rounded-b-[2.75rem] px-4 pt-6 pb-24 md:-mx-8 md:-mt-10 md:px-8 md:pt-10">
        {photoFamille && (
          <>
            <img
              src={photoFamille}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            {/* Le voile n'est pas décoratif : le bandeau porte du texte blanc et
                on ne sait pas d'avance ce que l'utilisateur choisira.

                Les opacités sont calculées sur le pire cas — une photo
                entièrement blanche. À 62 %, le noir laisse un gris à 97, soit
                6,2:1 pour du texte blanc ; à 72 %, 9,2:1. C'est le même seuil de
                6:1 que celui auquel --bandeau-haut est calculé, et il faut cette
                marge parce que les nuances de l'écran descendent jusqu'à 85 %
                d'opacité. Le voile du premier jet (45 %) ne tenait que 3,4:1 :
                sous le seuil, sur la moitié claire d'une photo ordinaire. */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/62 to-black/72"
              aria-hidden="true"
            />
          </>
        )}
        <header className="animate-rise relative flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.06em] text-white/85 uppercase">
              {dateLongue(date).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-white">
              {salutation()}
              {nom && `, ${nom}`}
            </h1>
          </div>
          {jours > 0 && (
            <p className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 font-display text-lg font-semibold text-white ring-1 ring-white/25 ring-inset tnum">
              <Flame size={17} className="animate-flame text-accent-vif" aria-hidden="true" />
              {jours}
            </p>
          )}
        </header>

        <div className="animate-rise relative mt-7" style={{ animationDelay: '60ms' }}>
          <p className="flex items-baseline gap-2.5">
            <span
              className="font-display font-semibold text-white tnum"
              style={{ fontSize: 'clamp(3.25rem, 16vw, 4.75rem)', lineHeight: 0.92 }}
            >
              {entier(Math.abs(reste))}
            </span>
            <span className="text-base font-semibold text-white/90">
              kcal {reste >= 0 ? 'restantes' : 'au-dessus'}
            </span>
          </p>
          {/* Les opacités du texte sur le bandeau ne descendent plus sous 85 % :
              en dessous, la nuance passait sous le seuil de contraste alors même
              que le bandeau, lui, le respectait. C'est pour cette marge que
              --bandeau-haut est calculé à 6:1 et non à 4,5:1. */}
          <p className="mt-2 text-[0.9375rem] text-white/90">{resume.phrase}</p>
          {bonusSport > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-white/90">
              <Dumbbell size={15} aria-hidden="true" />
              <span className="tnum">
                {entier(objectifBase)} kcal + {entier(bonusSport)} gagnées en bougeant
              </span>
            </p>
          )}

          <div className="mt-5">
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
                className="flex items-center gap-1 text-sm font-semibold text-primaire"
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
                icone={<ThumbsUp size={15} className="text-reussite" aria-hidden="true" />}
                intitule="Le top du jour"
              >
                {top.aliment.nom}
              </LigneTopFlop>
            )}
            {flop && (
              <LigneTopFlop
                icone={<ThumbsDown size={15} className="text-alerte" aria-hidden="true" />}
                intitule="Le flop du jour"
              >
                {flop.aliment.nom}
              </LigneTopFlop>
            )}
          </div>
        )}
      </Carte>

      {/* ── Ce qui va se perdre ── */}
      <AlerteGaspillage stocks={etat.stocks} />

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
        <div className="lavis-primaire border-b border-primaire/20 px-5 py-4">
          <p className="text-xs font-bold tracking-[0.14em] text-primaire uppercase">
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

      {/* ── Le coach ── */}
      <Lien vers="/app/coach" className="animate-rise block" style={{ animationDelay: '330ms' }}>
        <Carte
          ton="primaire"
          className="flex items-center gap-3 px-5 py-4 transition hover:brightness-[0.98]"
        >
          <MessageCircle size={20} className="shrink-0 text-primaire" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Demander à mon coach</span>
            <span className="block text-sm text-ink-soft">
              Il voit votre journée et répond à vos questions
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
        </Carte>
      </Lien>

      {/* ── Hydratation ── */}
      <Carte className="animate-rise p-5" style={{ animationDelay: '360ms' }}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Droplets size={18} className="text-primaire" aria-hidden="true" />
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
                  rempli ? 'border-primaire bg-primaire' : 'border-line bg-sunken hover:border-primaire/40',
                )}
              />
            )
          })}
        </div>
        <p className="mt-2.5 text-sm text-ink-soft">Thé, tisane et café comptent.</p>
      </Carte>

      {/* ── Activité ── */}
      <Carte className="animate-rise p-5" style={{ animationDelay: '420ms' }}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Dumbbell size={18} className="text-primaire" aria-hidden="true" />
            Activité
          </h2>
          {seances.length > 0 && (
            <span className="text-sm font-semibold text-reussite tnum">
              +{entier(bonusSport)} kcal
            </span>
          )}
        </div>

        {seances.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Rien de noté aujourd’hui. Une séance agrandit le budget du jour de ce qu’elle dépense.
          </p>
        ) : (
          <ul className="mb-3 space-y-1.5">
            {seances.map((seance) => (
              <li key={seance.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink">{seance.libelle}</span>
                <span className="shrink-0 text-ink-soft tnum">
                  {seance.minutes} min · {entier(seance.kcal)} kcal
                </span>
              </li>
            ))}
          </ul>
        )}

        <Lien vers="/app/sport" className="mt-3 block">
          <Bouton ton="doux" pleineLargeur>
            <Plus size={17} aria-hidden="true" />
            Enregistrer une séance
          </Bouton>
        </Lien>
      </Carte>

      <Lien vers="/app/envies" className="animate-rise block" style={{ animationDelay: '480ms' }}>
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

/**
 * Ce qui va se perdre si personne ne s'en occupe.
 *
 * L'alerte est ici et pas seulement dans le garde-manger : une date limite
 * n'aide que si on la voit **le jour où il faut décider**, et personne n'ouvre
 * l'écran du frigo pour vérifier ce qui périme. Sur l'écran qu'on ouvre tous les
 * jours, la question se pose d'elle-même.
 *
 * Le vocabulaire suit la distinction DLC/DDM du garde-manger : « à jeter » pour
 * ce qui est sanitaire, « à finir » pour ce qui ne perd que du goût. Les
 * confondre ferait jeter des aliments parfaitement bons, c'est-à-dire
 * l'inverse du but.
 */
function AlerteGaspillage({ stocks }: { stocks: ArticleStock[] }) {
  const urgents = useMemo(() => articlesUrgents(stocks), [stocks])
  if (urgents.length === 0) return null

  const perimes = urgents.filter((u) => u.echeance.urgence === 'perime')
  const aFinir = urgents.filter((u) => u.echeance.urgence !== 'perime')

  // Rien d'utile à proposer quand tout est déjà perdu : on le signale, mais on
  // n'envoie pas cuisiner ce qu'il faut jeter.
  const cible = aFinir.length > 0 ? '/app/cuisiner' : '/app/garde-manger'

  return (
    <Carte
      ton={perimes.length > 0 ? 'alerte' : 'accent'}
      className="animate-rise p-5"
      style={{ animationDelay: '150ms' }}
    >
      <TitreSection eyebrow="Anti-gaspillage">
        {aFinir.length > 0 ? (
          <>
            <span className="tnum">{aFinir.length}</span> produit
            {aFinir.length > 1 ? 's' : ''} à finir
          </>
        ) : (
          <>
            <span className="tnum">{perimes.length}</span> produit
            {perimes.length > 1 ? 's' : ''} à jeter
          </>
        )}
      </TitreSection>

      <ul className="space-y-2">
        {urgents.slice(0, 3).map(({ article, echeance: e }) => (
          <li key={article.id} className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate font-medium text-ink">{article.nom}</span>
            <Etiquette ton={e.urgence === 'perime' ? 'alerte' : e.sanitaire ? 'alerte' : 'accent'}>
              {e.urgence === 'perime'
                ? e.sanitaire
                  ? 'à jeter'
                  : 'moins bon'
                : e.urgence === 'aujourdhui'
                  ? 'aujourd’hui'
                  : e.urgence === 'demain'
                    ? 'demain'
                    : `${e.joursRestants} j`}
            </Etiquette>
          </li>
        ))}
      </ul>

      {urgents.length > 3 && (
        <p className="mt-2 text-sm text-ink-soft">
          et <span className="tnum">{urgents.length - 3}</span> autre
          {urgents.length - 3 > 1 ? 's' : ''}.
        </p>
      )}

      <Lien
        vers={cible}
        className="mt-4 block rounded-2xl border border-line-fort bg-surface px-4 py-3 text-center font-semibold text-ink transition hover:bg-sunken"
      >
        {aFinir.length > 0 ? 'Que puis-je cuisiner avec ?' : 'Voir mon garde-manger'}
      </Lien>
    </Carte>
  )
}

function JourneeVide() {
  return (
    <div className="rounded-card border border-dashed border-line px-6 py-10 text-center">
      {/* Humeur neutre, jamais déçue : l'écran est vide parce que la journée
          commence, pas parce que la personne a mal fait. */}
      <MarmiteExpression humeur="neutre" taille={72} className="mx-auto mb-3" />
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
                  <span className="shrink-0 text-xs font-bold text-reussite tnum">
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
        className="mt-6 text-alerte"
        onClick={() => onSupprimer(entree.id)}
      >
        <Trash2 size={17} aria-hidden="true" />
        Retirer du journal
      </Bouton>
    </Feuille>
  )
}
