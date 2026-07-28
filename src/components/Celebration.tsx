import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { Bouton } from './ui'

const COULEURS = ['var(--iris)', 'var(--apricot)', 'var(--basil)', 'var(--berry)']

/** Trajectoires figées à la définition : un tirage aléatoire par rendu ferait sauter les confettis. */
const CONFETTIS = Array.from({ length: 26 }, (_, i) => ({
  couleur: COULEURS[i % COULEURS.length],
  x: (i % 13) * 8 - 48,
  rotation: (i * 47) % 360,
  delai: (i % 7) * 0.04,
  duree: 1.3 + ((i * 13) % 9) / 10,
}))

export function Celebration() {
  const { badgeACelebrer, fermerCelebration } = useApp()
  const mouvementReduit = useReducedMotion()

  return (
    <AnimatePresence>
      {badgeACelebrer && (
        <div className="fixed inset-0 z-[60] grid place-items-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fermerCelebration}
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
          />

          {!mouvementReduit && (
            <div className="pointer-events-none absolute inset-x-0 top-[38%] flex justify-center">
              {CONFETTIS.map((c, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                  animate={{ opacity: 0, y: 220, x: c.x * 3, rotate: c.rotation }}
                  transition={{ duration: c.duree, delay: c.delai, ease: 'easeOut' }}
                  style={{ background: c.couleur }}
                  className="absolute size-2 rounded-[2px]"
                />
              ))}
            </div>
          )}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Badge débloqué : ${badgeACelebrer.titre}`}
            initial={{ scale: 0.85, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="relative w-full max-w-sm rounded-card border border-line bg-surface p-7 text-center shadow-lift"
          >
            <motion.p
              initial={{ scale: 0.4, rotate: -18 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
              className="mb-4 text-6xl"
              aria-hidden="true"
            >
              {badgeACelebrer.emoji}
            </motion.p>
            <p className="mb-1.5 text-xs font-bold tracking-[0.16em] text-apricot uppercase">
              Badge débloqué
            </p>
            <h2 className="mb-2 font-display text-2xl font-semibold text-ink">
              {badgeACelebrer.titre}
            </h2>
            <p className="mb-6 text-sm text-ink-soft">{badgeACelebrer.condition}</p>
            <Bouton pleineLargeur onClick={fermerCelebration}>
              Continuer
            </Bouton>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
