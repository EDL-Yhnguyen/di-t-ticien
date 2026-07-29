import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Gamepad2, ShieldHalf, X } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, EtatVide, Etiquette, Feuille, TitreSection } from '../components/ui'
import { Lien } from '../lib/router'
import { enviesResistees } from '../lib/badges'
import type { EnvieEntree, IssueEnvie } from '../lib/types'
import { classes, dateCourte, jourISO } from '../lib/utils'

const DECLENCHEURS = [
  'Ennui',
  'Stress',
  'Fatigue',
  'Habitude',
  'Contrariété',
  'Devant un écran',
  'Odeur ou vue d’un aliment',
  'Vraie faim',
]

const STRATEGIES = [
  { id: 'attendre', emoji: '⏳', titre: 'Attendre 10 minutes', detail: 'La plupart des envies retombent d’elles-mêmes.' },
  { id: 'boire', emoji: '🍵', titre: 'Boire un grand verre', detail: 'Eau, thé ou tisane — sans sucre.' },
  { id: 'marcher', emoji: '🚶‍♀️', titre: 'Bouger 5 minutes', detail: 'Sortir, monter un étage, faire le tour du pâté de maisons.' },
  { id: 'dents', emoji: '🪥', titre: 'Se laver les dents', detail: 'Le goût de menthe coupe net l’envie de grignoter.' },
  { id: 'jouer', emoji: '🎮', titre: 'Jouer trois minutes', detail: 'Occuper les mains et la tête, le temps que ça passe.' },
  { id: 'collation', emoji: '🍎', titre: 'Prendre la collation prévue', detail: 'Un fruit ou un laitier du plan, ce n’est pas un écart.' },
]

const DUREE_ATTENTE = 10 * 60

type Etape = 'repos' | 'intensite' | 'declencheur' | 'strategie' | 'minuteur' | 'issue'

export function Envies() {
  const { etat, modifier } = useSession()
  const [etape, setEtape] = useState<Etape>('repos')
  const [intensite, setIntensite] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [declencheur, setDeclencheur] = useState<string>('')
  const [strategie, setStrategie] = useState<string | null>(null)

  const resistees = enviesResistees(etat)
  const recentes = useMemo(
    () => [...etat.envies].sort((a, b) => b.horodatage.localeCompare(a.horodatage)).slice(0, 12),
    [etat.envies],
  )
  const heuresARisque = useMemo(() => analyserHeures(etat.envies), [etat.envies])

  function enregistrer(issue: IssueEnvie) {
    modifier((brouillon) => {
      brouillon.envies.push({
        id: crypto.randomUUID(),
        horodatage: new Date().toISOString(),
        intensite,
        declencheur: declencheur || 'Non précisé',
        strategie,
        issue,
      })
    })
    reinitialiser()
  }

  function reinitialiser() {
    setEtape('repos')
    setIntensite(3)
    setDeclencheur('')
    setStrategie(null)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink">Les envies</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Une envie n’est pas une faim. Elle monte, et elle redescend.
        </p>
      </header>

      <Carte className="overflow-hidden">
        <div className="bg-berry-wash px-5 py-6 text-center">
          <p className="mb-4 text-sm text-berry">
            Une envie de grignoter maintenant ?
          </p>
          <Bouton ton="alerte" pleineLargeur className="py-4 text-base" onClick={() => setEtape('intensite')}>
            <ShieldHalf size={19} aria-hidden="true" />
            Oui, aidez-moi
          </Bouton>
        </div>

        {etat.envies.length > 0 && (
          <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
            <div className="px-5 py-4 text-center">
              <p className="font-display text-2xl font-semibold text-basil tnum">{resistees}</p>
              <p className="mt-0.5 text-xs font-semibold text-ink-soft">envies laissées passer</p>
            </div>
            <div className="px-5 py-4 text-center">
              <p className="font-display text-2xl font-semibold text-ink tnum">
                {etat.envies.length}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-ink-soft">envies notées</p>
            </div>
          </div>
        )}
      </Carte>

      {heuresARisque.length > 0 && (
        <Carte className="p-5">
          <TitreSection eyebrow="Ce que dit votre journal">Vos moments à risque</TitreSection>
          <p className="mb-3 text-sm text-ink-soft">
            Vos envies reviennent surtout {formaterHeures(heuresARisque)}. Prévoir une collation
            juste avant désamorce souvent le grignotage.
          </p>
          <ul className="flex flex-wrap gap-2">
            {heuresARisque.map(({ heure, compte }) => (
              <li key={heure}>
                <Etiquette ton="apricot">
                  {heure} h — {compte} fois
                </Etiquette>
              </li>
            ))}
          </ul>
        </Carte>
      )}

      <section>
        <TitreSection eyebrow="Journal">Vos dernières envies</TitreSection>
        {recentes.length === 0 ? (
          <Carte>
            <EtatVide emoji="🌤️" titre="Rien de noté pour l’instant">
              Chaque envie enregistrée aide à repérer les moments où elles reviennent.
            </EtatVide>
          </Carte>
        ) : (
          <ul className="space-y-2">
            {recentes.map((envie) => (
              <LigneEnvie key={envie.id} envie={envie} />
            ))}
          </ul>
        )}
      </section>

      {/* ─────────────── Le parcours, en panneau glissant ─────────────── */}

      <Feuille ouvert={etape === 'intensite'} titre="C’est fort comment ?" onFermer={reinitialiser}>
        <p className="mb-5 text-sm text-ink-soft">
          Mettre un chiffre sur l’envie suffit déjà à la faire redescendre d’un cran.
        </p>
        <div className="mb-6 flex gap-2">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setIntensite(n)}
              aria-pressed={intensite === n}
              className={classes(
                'flex-1 rounded-2xl border-2 py-4 font-display text-xl font-semibold transition',
                intensite === n
                  ? 'border-berry bg-berry text-white'
                  : 'border-line bg-surface text-ink-soft hover:border-berry/40',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mb-6 flex justify-between text-xs font-semibold text-ink-faint">
          <span>Une pensée passagère</span>
          <span>Irrésistible</span>
        </p>
        <Bouton pleineLargeur onClick={() => setEtape('declencheur')}>
          Continuer
        </Bouton>
      </Feuille>

      <Feuille
        ouvert={etape === 'declencheur'}
        titre="Qu’est-ce qui l’a déclenchée ?"
        onFermer={reinitialiser}
      >
        <p className="mb-5 text-sm text-ink-soft">
          Sans jugement — c’est une information, pas une faute.
        </p>
        <ul className="mb-6 grid grid-cols-2 gap-2">
          {DECLENCHEURS.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => setDeclencheur(item)}
                aria-pressed={declencheur === item}
                className={classes(
                  'w-full rounded-2xl border px-3 py-3 text-sm font-medium transition',
                  declencheur === item
                    ? 'border-corail bg-corail-wash text-corail'
                    : 'border-line bg-surface text-ink-soft hover:bg-sunken',
                )}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
        <Bouton pleineLargeur disabled={!declencheur} onClick={() => setEtape('strategie')}>
          Continuer
        </Bouton>
      </Feuille>

      <Feuille ouvert={etape === 'strategie'} titre="Qu’est-ce qu’on essaie ?" onFermer={reinitialiser}>
        <ul className="space-y-2">
          {STRATEGIES.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setStrategie(item.id)
                  if (item.id === 'attendre') setEtape('minuteur')
                  else if (item.id === 'collation') enregistrer('collation-prevue')
                  else setEtape('issue')
                }}
                className="flex w-full items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left transition hover:bg-sunken"
              >
                <span className="text-2xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{item.titre}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{item.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Lien vers="/app/jeux" className="mt-4 block">
          <Bouton ton="doux" pleineLargeur>
            <Gamepad2 size={18} aria-hidden="true" />
            Ouvrir les jeux
          </Bouton>
        </Lien>
      </Feuille>

      <Feuille ouvert={etape === 'minuteur'} titre="Dix minutes" onFermer={reinitialiser}>
        <Minuteur onFini={() => setEtape('issue')} />
      </Feuille>

      <Feuille ouvert={etape === 'issue'} titre="Alors ?" onFermer={reinitialiser}>
        <p className="mb-5 text-sm text-ink-soft">
          Les deux réponses se notent de la même façon. Le journal sert à comprendre, pas à juger.
        </p>
        <div className="space-y-2">
          <Bouton ton="primaire" pleineLargeur onClick={() => enregistrer('resistee')}>
            <Check size={18} aria-hidden="true" />
            C’est passé
          </Bouton>
          <Bouton ton="doux" pleineLargeur onClick={() => enregistrer('cedee')}>
            <X size={18} aria-hidden="true" />
            J’ai grignoté
          </Bouton>
        </div>
      </Feuille>
    </div>
  )
}

/* ─────────────────────────────── Sous-vues ──────────────────────────────── */

function Minuteur({ onFini }: { onFini: () => void }) {
  const [restant, setRestant] = useState(DUREE_ATTENTE)

  useEffect(() => {
    if (restant <= 0) {
      onFini()
      return
    }
    const t = window.setTimeout(() => setRestant((r) => r - 1), 1000)
    return () => window.clearTimeout(t)
  }, [restant, onFini])

  const part = 1 - restant / DUREE_ATTENTE
  const minutes = Math.floor(restant / 60)
  const secondes = restant % 60

  const message =
    part < 0.3
      ? 'Respirez lentement. L’envie est à son pic, elle ne va pas y rester.'
      : part < 0.7
        ? 'Ça redescend déjà. Occupez vos mains si vous pouvez.'
        : 'Presque. Vous allez sortir de là sans avoir grignoté.'

  return (
    <div className="text-center">
      <svg viewBox="0 0 200 200" className="mx-auto w-44" role="img" aria-label={`${minutes} minutes ${secondes} secondes restantes`}>
        <circle cx="100" cy="100" r="86" fill="none" stroke="var(--line)" strokeWidth="10" />
        <motion.circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="var(--berry)"
          strokeWidth="10"
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          strokeDasharray={2 * Math.PI * 86}
          animate={{ strokeDashoffset: 2 * Math.PI * 86 * (1 - part) }}
          transition={{ duration: 1, ease: 'linear' }}
        />
        <text
          x="100"
          y="112"
          textAnchor="middle"
          className="fill-ink font-display text-[2.5rem] font-semibold tnum"
        >
          {minutes}:{String(secondes).padStart(2, '0')}
        </text>
      </svg>

      <p aria-live="polite" className="mx-auto mt-5 mb-6 max-w-xs text-sm text-ink-soft">
        {message}
      </p>

      <Bouton ton="doux" pleineLargeur onClick={onFini}>
        Passer à la suite
      </Bouton>
    </div>
  )
}

function LigneEnvie({ envie }: { envie: EnvieEntree }) {
  const etiquette = {
    resistee: { ton: 'basil' as const, texte: 'Passée' },
    cedee: { ton: 'neutre' as const, texte: 'Grignoté' },
    'collation-prevue': { ton: 'corail' as const, texte: 'Collation' },
  }[envie.issue]

  const heure = new Date(envie.horodatage).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const jour = envie.horodatage.slice(0, 10)

  return (
    <li>
      <Carte className="flex items-center gap-3 px-4 py-3">
        <span className="shrink-0 text-sm font-semibold text-ink-faint tnum">{heure}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{envie.declencheur}</span>
          <span className="block text-xs text-ink-soft">
            {jour === jourISO() ? 'Aujourd’hui' : dateCourte(jour)} · intensité {envie.intensite}/5
          </span>
        </span>
        <Etiquette ton={etiquette.ton}>{etiquette.texte}</Etiquette>
      </Carte>
    </li>
  )
}

/* ────────────────────────────── Analyse ─────────────────────────────────── */

/** Les deux tranches horaires où les envies reviennent le plus, dès 4 relevés. */
function analyserHeures(envies: EnvieEntree[]): { heure: number; compte: number }[] {
  if (envies.length < 4) return []

  const parHeure = new Map<number, number>()
  for (const envie of envies) {
    const h = new Date(envie.horodatage).getHours()
    parHeure.set(h, (parHeure.get(h) ?? 0) + 1)
  }

  return [...parHeure.entries()]
    .map(([heure, compte]) => ({ heure, compte }))
    .filter((x) => x.compte >= 2)
    .sort((a, b) => b.compte - a.compte)
    .slice(0, 2)
}

function formaterHeures(heures: { heure: number }[]): string {
  const liste = heures.map((h) => `vers ${h.heure} h`)
  return liste.length === 1 ? liste[0] : `${liste[0]} et ${liste[1]}`
}
