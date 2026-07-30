import { useCallback, useEffect, useRef, useState } from 'react'
import { identifiant } from './utils'

/**
 * Ce que le navigateur doit faire pendant qu'on cuisine : compter le temps, et
 * ne pas éteindre l'écran.
 *
 * Séparé de `cuisson.ts`, qui ne fait que lire le catalogue : ici tout est effet
 * de bord, et rien ne peut être calculé deux fois sans conséquence.
 */

/* ──────────────────────────── Les minuteurs ──────────────────────────── */

export interface Minuteur {
  id: string
  libelle: string
  /**
   * Horodatage de fin, en millisecondes depuis l'époque.
   *
   * **Absolu, et non un compteur décrémenté.** Un onglet passé en arrière-plan
   * voit ses `setInterval` ralentis à une fois par minute : un compte à rebours
   * décrémenté dériverait de plusieurs minutes pendant qu'on regarde autre
   * chose, ce qui est exactement le moment où l'on compte sur lui.
   */
  finLe: number
  dureeSecondes: number
  /** Passe à vrai quand le temps est écoulé, jusqu'à ce qu'on l'acquitte. */
  sonne: boolean
}

/**
 * Trois bips courts, à la fin d'un minuteur.
 *
 * Rien n'est téléchargé : un fichier son ajouterait un octet de plus à charger
 * pour deux secondes de bip, et il ne serait pas dans le cache hors ligne au
 * premier usage — précisément le cas de la cuisine sans réseau. L'oscillateur du
 * navigateur, lui, est toujours disponible.
 */
function bip(contexte: AudioContext): void {
  const debut = contexte.currentTime
  for (let i = 0; i < 3; i++) {
    const oscillateur = contexte.createOscillator()
    const gain = contexte.createGain()
    oscillateur.type = 'sine'
    oscillateur.frequency.value = 880
    // Une enveloppe, pas un créneau : un son coupé net produit un « clac »
    // désagréable et bien plus fort que le bip lui-même.
    const t = debut + i * 0.32
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.28, t + 0.02)
    gain.gain.linearRampToValueAtTime(0, t + 0.22)
    oscillateur.connect(gain).connect(contexte.destination)
    oscillateur.start(t)
    oscillateur.stop(t + 0.24)
  }
}

export function useMinuteurs() {
  const [minuteurs, setMinuteurs] = useState<Minuteur[]>([])
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const audio = useRef<AudioContext | null>(null)

  // Le battement ne tourne que s'il y a quelque chose à compter : un intervalle
  // qui tourne dans le vide réveille le processeur pour rien, et cet écran est
  // fait pour rester ouvert longtemps.
  const actifs = minuteurs.length > 0
  useEffect(() => {
    if (!actifs) return
    const jeton = window.setInterval(() => setMaintenant(Date.now()), 500)
    return () => window.clearInterval(jeton)
  }, [actifs])

  // La sonnerie part du battement et non d'un `setTimeout` par minuteur : un
  // `setTimeout` d'arrière-plan est retardé sans prévenir, alors qu'une
  // comparaison d'horodatages est juste dès que l'onglet revient au premier plan.
  useEffect(() => {
    setMinuteurs((actuels) => {
      const echus = actuels.filter((m) => !m.sonne && m.finLe <= maintenant)
      if (echus.length === 0) return actuels

      if (audio.current) bip(audio.current)
      navigator.vibrate?.([200, 100, 200])
      return actuels.map((m) => (echus.includes(m) ? { ...m, sonne: true } : m))
    })
  }, [maintenant])

  const lancer = useCallback((libelle: string, secondes: number) => {
    // Le contexte audio se crée sur ce geste : créé plus tôt, il naîtrait
    // suspendu — les navigateurs interdisent le son sans interaction — et le
    // premier minuteur sonnerait dans le vide.
    if (!audio.current) {
      const Constructeur = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Constructeur) audio.current = new Constructeur()
    }
    void audio.current?.resume()

    setMinuteurs((actuels) => [
      ...actuels,
      {
        id: identifiant('t'),
        libelle,
        finLe: Date.now() + secondes * 1000,
        dureeSecondes: secondes,
        sonne: false,
      },
    ])
  }, [])

  const arreter = useCallback((id: string) => {
    setMinuteurs((actuels) => actuels.filter((m) => m.id !== id))
  }, [])

  const restant = useCallback(
    (minuteur: Minuteur) => Math.max(0, (minuteur.finLe - maintenant) / 1000),
    [maintenant],
  )

  return { minuteurs, lancer, arreter, restant }
}

/* ─────────────────────── Garder l'écran allumé ─────────────────────── */

/**
 * Empêche la mise en veille de l'écran tant que `actif` est vrai.
 *
 * Les mains dans la farine, on ne rallume pas son téléphone toutes les trente
 * secondes. L'API `Screen Wake Lock` n'existe pas partout : son absence est
 * **silencieuse et sans conséquence** — l'écran s'éteindra comme d'habitude,
 * mais rien ne casse, et prévenir l'utilisateur d'une limite qu'il ne peut pas
 * lever ne servirait qu'à l'inquiéter.
 *
 * Le verrou se perd quand l'onglet passe en arrière-plan : le navigateur le
 * relâche de lui-même. D'où la reprise sur `visibilitychange`, sans laquelle
 * l'écran s'éteindrait au premier coup d'œil à une notification.
 */
export function useEcranAllume(actif: boolean): void {
  useEffect(() => {
    if (!actif || !('wakeLock' in navigator)) return

    let verrou: WakeLockSentinel | null = null
    let abandonne = false

    const demander = async () => {
      try {
        verrou = await navigator.wakeLock.request('screen')
      } catch {
        // Refus de l'utilisateur, batterie faible, onglet caché : rien à faire,
        // et surtout rien à afficher.
      }
    }

    const surVisibilite = () => {
      if (document.visibilityState === 'visible' && !abandonne) void demander()
    }

    void demander()
    document.addEventListener('visibilitychange', surVisibilite)

    return () => {
      abandonne = true
      document.removeEventListener('visibilitychange', surVisibilite)
      void verrou?.release()
    }
  }, [actif])
}
