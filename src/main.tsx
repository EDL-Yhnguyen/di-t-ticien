import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { FournisseurApp } from './context/AppContext'
import { FournisseurRoutage } from './lib/router'
import './index.css'

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément #root introuvable')

createRoot(racine).render(
  <StrictMode>
    <FournisseurRoutage>
      <FournisseurApp>
        <App />
      </FournisseurApp>
    </FournisseurRoutage>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Hors ligne ou navigation privée : l'application marche sans.
    })
  })
}
