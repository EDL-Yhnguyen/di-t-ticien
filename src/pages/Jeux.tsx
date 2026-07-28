import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Trophy } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, Etiquette, Feuille } from '../components/ui'
import { meilleurScore } from '../lib/store'
import { classes } from '../lib/utils'

/**
 * Trois occupations courtes, pensées pour le moment où l'envie monte : il faut
 * trois minutes d'attention ailleurs, pas un jeu qui retient une heure.
 */
const JEUX = [
  {
    id: 'memo',
    titre: 'Mémo du marché',
    resume: 'Retrouvez les paires. Le moins de coups possible.',
    emoji: '🃏',
    unite: 'coups',
    meilleurEstPetit: true,
  },
  {
    id: 'quiz',
    titre: 'Vrai ou faux',
    resume: 'Dix idées reçues sur l’alimentation.',
    emoji: '💡',
    unite: 'bonnes réponses',
    meilleurEstPetit: false,
  },
  {
    id: 'souffle',
    titre: 'Le souffle',
    resume: 'Une minute de respiration guidée.',
    emoji: '🫧',
    unite: 'cycles',
    meilleurEstPetit: false,
  },
] as const

export function Jeux() {
  const { etat } = useSession()
  const [ouvert, setOuvert] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink">Jeux</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Trois minutes d’attention ailleurs, et l’envie est souvent passée.
        </p>
      </header>

      <ul className="space-y-3">
        {JEUX.map((jeu) => {
          const record = meilleurScore(etat, jeu.id)
          return (
            <li key={jeu.id}>
              <Carte>
                <button
                  type="button"
                  onClick={() => setOuvert(jeu.id)}
                  className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-sunken"
                >
                  <span className="text-3xl" aria-hidden="true">
                    {jeu.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{jeu.titre}</span>
                    <span className="mt-0.5 block text-sm text-ink-soft">{jeu.resume}</span>
                  </span>
                  {record > 0 && (
                    <Etiquette ton="apricot">
                      {record} {jeu.unite}
                    </Etiquette>
                  )}
                </button>
              </Carte>
            </li>
          )
        })}
      </ul>

      <Feuille
        ouvert={ouvert !== null}
        titre={JEUX.find((j) => j.id === ouvert)?.titre ?? ''}
        onFermer={() => setOuvert(null)}
      >
        {ouvert === 'memo' && <Memo />}
        {ouvert === 'quiz' && <Quiz />}
        {ouvert === 'souffle' && <Souffle />}
      </Feuille>
    </div>
  )
}

/* ─────────────────────────────── Mémo ───────────────────────────────────── */

const SYMBOLES = ['🍅', '🥦', '🥕', '🍆', '🫑', '🍋']

interface CarteMemo {
  id: number
  symbole: string
  retournee: boolean
  trouvee: boolean
}

function Memo() {
  const { etat, modifier } = useSession()
  const [cartes, setCartes] = useState<CarteMemo[]>(() => distribuer())
  const [selection, setSelection] = useState<number[]>([])
  const [coups, setCoups] = useState(0)
  const [fini, setFini] = useState(false)

  const record = meilleurScore(etat, 'memo')

  useEffect(() => {
    if (selection.length !== 2) return

    const [a, b] = selection
    const paire = cartes[a].symbole === cartes[b].symbole
    const delai = window.setTimeout(() => {
      setCartes((precedent) =>
        precedent.map((carte, i) =>
          i === a || i === b
            ? { ...carte, retournee: paire, trouvee: paire }
            : carte,
        ),
      )
      setSelection([])
    }, paire ? 320 : 750)

    return () => window.clearTimeout(delai)
  }, [selection, cartes])

  useEffect(() => {
    if (fini || cartes.some((c) => !c.trouvee)) return
    setFini(true)
    modifier((brouillon) => {
      brouillon.scores.push({ jeu: 'memo', score: coups, joueLe: new Date().toISOString() })
    })
  }, [cartes, coups, fini, modifier])

  function retourner(index: number) {
    if (selection.length === 2 || cartes[index].retournee) return

    // Le compte se fait ici et non dans l'updater de setSelection : React
    // rejoue les updaters en mode strict, ce qui comptait chaque paire deux fois.
    const suivant = [...selection, index]
    setCartes((p) => p.map((c, i) => (i === index ? { ...c, retournee: true } : c)))
    setSelection(suivant)
    if (suivant.length === 2) setCoups((c) => c + 1)
  }

  function rejouer() {
    setCartes(distribuer())
    setSelection([])
    setCoups(0)
    setFini(false)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          Coups : <strong className="font-semibold text-ink tnum">{coups}</strong>
        </p>
        {record > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-ink-soft">
            <Trophy size={15} className="text-apricot" aria-hidden="true" />
            Record : <strong className="font-semibold text-ink tnum">{record}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {cartes.map((carte, i) => (
          <button
            key={carte.id}
            type="button"
            onClick={() => retourner(i)}
            disabled={carte.retournee}
            aria-label={carte.retournee ? carte.symbole : `Carte ${i + 1}, face cachée`}
            className={classes(
              'grid aspect-square place-items-center rounded-2xl text-3xl transition',
              carte.trouvee
                ? 'bg-basil-wash'
                : carte.retournee
                  ? 'bg-iris-wash'
                  : 'bg-sunken hover:bg-line',
            )}
          >
            <motion.span
              initial={false}
              animate={{ scale: carte.retournee ? 1 : 0, opacity: carte.retournee ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              aria-hidden="true"
            >
              {carte.symbole}
            </motion.span>
          </button>
        ))}
      </div>

      {fini && (
        <div className="mt-5 rounded-tile bg-basil-wash px-4 py-4 text-center">
          <p className="font-semibold text-basil">
            Terminé en {coups} coups
            {record > 0 && coups < record && ' — nouveau record !'}
          </p>
        </div>
      )}

      <Bouton ton="doux" pleineLargeur className="mt-4" onClick={rejouer}>
        <RotateCcw size={17} aria-hidden="true" />
        Nouvelle partie
      </Bouton>
    </div>
  )
}

function distribuer(): CarteMemo[] {
  const paquet = [...SYMBOLES, ...SYMBOLES].map((symbole, id) => ({
    id,
    symbole,
    retournee: false,
    trouvee: false,
  }))
  for (let i = paquet.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[paquet[i], paquet[j]] = [paquet[j], paquet[i]]
  }
  return paquet
}

/* ─────────────────────────────── Quiz ───────────────────────────────────── */

const QUESTIONS = [
  {
    enonce: 'Sauter le petit déjeuner fait maigrir plus vite.',
    reponse: false,
    explication:
      'Le plus souvent, l’appétit se reporte sur la journée et le grignotage augmente en fin d’après-midi.',
  },
  {
    enonce: 'Les légumes peuvent être mangés à volonté.',
    reponse: true,
    explication: 'C’est écrit noir sur blanc dans votre plan : crus ou cuits, à volonté.',
  },
  {
    enonce: 'Il faut supprimer les féculents pour perdre du poids.',
    reponse: false,
    explication:
      'Votre plan en prévoit à chaque repas — un beau quart d’assiette. Les supprimer provoque surtout des fringales.',
  },
  {
    enonce: 'Le thé et le café comptent dans les 1,5 L de boisson quotidiens.',
    reponse: true,
    explication: 'Tout confondu, précise l’ordonnance : eau, thé, tisane, café.',
  },
  {
    enonce: 'Un aliment « allégé » fait forcément maigrir.',
    reponse: false,
    explication:
      'Allégé en gras veut souvent dire enrichi en sucre, et les portions consommées augmentent.',
  },
  {
    enonce: 'Une envie de grignoter dure rarement plus de vingt minutes.',
    reponse: true,
    explication: 'Elle monte, plafonne, puis redescend. D’où le minuteur de dix minutes.',
  },
  {
    enonce: 'Se peser tous les jours donne une image fiable de la progression.',
    reponse: false,
    explication:
      'Le poids varie de 1 à 2 kg selon l’hydratation et le sel. C’est la tendance sur trois semaines qui compte.',
  },
  {
    enonce: 'Manger lentement aide à moins manger.',
    reponse: true,
    explication: 'Le signal de satiété met environ vingt minutes à parvenir au cerveau.',
  },
  {
    enonce: 'Un repas plaisir par semaine ruine les efforts.',
    reponse: false,
    explication: 'Votre plan le prévoit explicitement — une fois par semaine, sans excès.',
  },
  {
    enonce: 'Boire un grand verre d’eau peut faire passer une fausse faim.',
    reponse: true,
    explication: 'La soif est régulièrement confondue avec la faim, surtout en fin d’après-midi.',
  },
]

function Quiz() {
  const { etat, modifier } = useSession()
  const questions = useMemo(() => [...QUESTIONS].sort(() => Math.random() - 0.5), [])
  const [index, setIndex] = useState(0)
  const [reponse, setReponse] = useState<boolean | null>(null)
  const [bonnes, setBonnes] = useState(0)
  const [fini, setFini] = useState(false)

  const record = meilleurScore(etat, 'quiz')
  const question = questions[index]

  function repondre(valeur: boolean) {
    if (reponse !== null) return
    setReponse(valeur)
    if (valeur === question.reponse) setBonnes((b) => b + 1)
  }

  function suivante() {
    if (index === questions.length - 1) {
      setFini(true)
      modifier((brouillon) => {
        brouillon.scores.push({ jeu: 'quiz', score: bonnes, joueLe: new Date().toISOString() })
      })
      return
    }
    setIndex((i) => i + 1)
    setReponse(null)
  }

  if (fini) {
    return (
      <div className="text-center">
        <p className="mb-2 text-5xl" aria-hidden="true">
          {bonnes >= 8 ? '🎉' : bonnes >= 5 ? '👏' : '📚'}
        </p>
        <p className="font-display text-3xl font-semibold text-ink tnum">
          {bonnes} / {questions.length}
        </p>
        <p className="mt-2 mb-6 text-sm text-ink-soft">
          {record > 0 && bonnes > record
            ? 'Nouveau record.'
            : bonnes >= 8
              ? 'Vous connaissez votre sujet.'
              : 'Chaque partie en apprend un peu plus.'}
        </p>
        <Bouton
          pleineLargeur
          onClick={() => {
            setIndex(0)
            setReponse(null)
            setBonnes(0)
            setFini(false)
          }}
        >
          Rejouer
        </Bouton>
      </div>
    )
  }

  const correcte = reponse === question.reponse

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm text-ink-soft">
        <span className="tnum">
          Question {index + 1} / {questions.length}
        </span>
        <span className="tnum">{bonnes} bonnes</span>
      </div>

      <p className="mb-6 font-display text-xl leading-snug font-semibold text-ink">
        {question.enonce}
      </p>

      <div className="mb-4 flex gap-3">
        {[true, false].map((valeur) => (
          <button
            key={String(valeur)}
            type="button"
            onClick={() => repondre(valeur)}
            disabled={reponse !== null}
            className={classes(
              'flex-1 rounded-2xl border-2 py-4 font-semibold transition',
              reponse === null
                ? 'border-line bg-surface text-ink hover:border-iris'
                : valeur === question.reponse
                  ? 'border-basil bg-basil-wash text-basil'
                  : reponse === valeur
                    ? 'border-berry bg-berry-wash text-berry'
                    : 'border-line bg-surface text-ink-faint',
            )}
          >
            {valeur ? 'Vrai' : 'Faux'}
          </button>
        ))}
      </div>

      {reponse !== null && (
        <>
          <p
            className={classes(
              'mb-4 rounded-tile px-4 py-3.5 text-sm',
              correcte ? 'bg-basil-wash text-ink' : 'bg-apricot-wash text-ink',
            )}
          >
            <strong className="font-semibold">{correcte ? 'Exact. ' : 'Pas tout à fait. '}</strong>
            {question.explication}
          </p>
          <Bouton pleineLargeur onClick={suivante}>
            {index === questions.length - 1 ? 'Voir le résultat' : 'Question suivante'}
          </Bouton>
        </>
      )}
    </div>
  )
}

/* ────────────────────────────── Le souffle ──────────────────────────────── */

const PHASES = [
  { nom: 'Inspirez', duree: 4, echelle: 1 },
  { nom: 'Retenez', duree: 7, echelle: 1 },
  { nom: 'Soufflez', duree: 8, echelle: 0.55 },
] as const

function Souffle() {
  const { modifier } = useSession()
  const [enCours, setEnCours] = useState(false)
  const [phase, setPhase] = useState(0)
  const [cycles, setCycles] = useState(0)

  useEffect(() => {
    if (!enCours) return
    const delai = window.setTimeout(() => {
      const suivante = (phase + 1) % PHASES.length
      setPhase(suivante)
      if (suivante === 0) setCycles((c) => c + 1)
    }, PHASES[phase].duree * 1000)
    return () => window.clearTimeout(delai)
  }, [enCours, phase])

  function terminer() {
    setEnCours(false)
    if (cycles > 0) {
      modifier((brouillon) => {
        brouillon.scores.push({ jeu: 'souffle', score: cycles, joueLe: new Date().toISOString() })
      })
    }
  }

  return (
    <div className="text-center">
      <div className="relative mx-auto grid h-56 w-56 place-items-center">
        <motion.div
          animate={{ scale: enCours ? PHASES[phase].echelle : 0.8 }}
          transition={{ duration: enCours ? PHASES[phase].duree : 0.6, ease: 'easeInOut' }}
          className="absolute size-52 rounded-full bg-iris-wash"
        />
        <div className="relative">
          <p className="font-display text-2xl font-semibold text-ink">
            {enCours ? PHASES[phase].nom : 'Prête ?'}
          </p>
          {enCours && (
            <p className="mt-1 text-sm text-ink-soft tnum">{PHASES[phase].duree} secondes</p>
          )}
        </div>
      </div>

      <p aria-live="polite" className="mt-4 mb-6 text-sm text-ink-soft">
        {enCours
          ? `${cycles} cycle${cycles > 1 ? 's' : ''} — quatre suffisent à faire redescendre la tension.`
          : 'Quatre temps d’inspiration, sept de pause, huit d’expiration.'}
      </p>

      {enCours ? (
        <Bouton ton="doux" pleineLargeur onClick={terminer}>
          Arrêter
        </Bouton>
      ) : (
        <Bouton
          pleineLargeur
          onClick={() => {
            setPhase(0)
            setCycles(0)
            setEnCours(true)
          }}
        >
          Commencer
        </Bouton>
      )}
    </div>
  )
}
