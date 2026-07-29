import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import { App } from './App'
import { BarriereErreur } from './components/BarriereErreur'
import { FournisseurApp } from './context/AppContext'
import { FournisseurRoutage } from './lib/router'
import './index.css'

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément #root introuvable')

createRoot(racine).render(
  <StrictMode>
    {/*
      Le bloc `prefers-reduced-motion` d'index.css ne neutralise que les
      animations CSS ; framer-motion continuait d'animer par-dessus, y compris
      chez quelqu'un qui a demandé à son système d'arrêter le mouvement — ce
      n'est pas un réglage esthétique, c'est un réglage médical pour les
      personnes sujettes au mal des transports ou aux migraines vestibulaires.
      `reducedMotion="user"` fait suivre la préférence à toutes les animations
      framer-motion d'un coup, sans avoir à passer dans chaque composant.
    */}
    <MotionConfig reducedMotion="user">
      <BarriereErreur secours={(reessayer) => <EchecTotal onReessayer={reessayer} />}>
        <FournisseurRoutage>
          <FournisseurApp>
            <App />
          </FournisseurApp>
        </FournisseurRoutage>
      </BarriereErreur>
    </MotionConfig>
  </StrictMode>,
)

/**
 * Le dernier recours : la coquille elle-même a cassé, pas seulement un écran.
 *
 * Ici, réessayer le même rendu a peu de chances d'aboutir — on propose donc
 * aussi de recharger. Toujours sans toucher aux données.
 */
function EchecTotal({ onReessayer }: { onReessayer: () => void }) {
  return (
    <div className="grid min-h-svh place-items-center bg-ground px-4 text-center">
      <div className="max-w-sm">
        <p className="text-3xl" aria-hidden="true">
          🌧
        </p>
        <h1 className="mt-3 font-display text-xl font-semibold text-ink">
          Mamakilo n’a pas pu s’ouvrir
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Vos données sont enregistrées et intactes. Rechargez la page : c’est presque toujours ce
          qui suffit.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-corail px-5 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Recharger
          </button>
          <button
            type="button"
            onClick={onReessayer}
            className="rounded-full px-5 py-3 font-semibold text-ink-soft transition hover:text-ink"
          >
            Réessayer sans recharger
          </button>
        </div>
      </div>
    </div>
  )
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Hors ligne ou navigation privée : l'application marche sans.
    })
  })
}
