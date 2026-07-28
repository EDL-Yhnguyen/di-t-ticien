import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as auth from '../lib/auth'
import type { Utilisateur } from '../lib/auth'
import { charger, enregistrer, type EtatUtilisateur } from '../lib/store'
import { badgesADebloquer, type Badge } from '../lib/badges'

interface Application {
  utilisateur: Utilisateur | null
  etat: EtatUtilisateur | null
  chargement: boolean
  /** Badge tout juste débloqué, à célébrer puis à refermer. */
  badgeACelebrer: Badge | null
  fermerCelebration: () => void
  modifier: (recette: (brouillon: EtatUtilisateur) => void) => void
  seConnecter: (identifiant: string, motDePasse: string) => Promise<void>
  sInscrire: (identifiant: string, motDePasse: string, prenom: string) => Promise<void>
  seDeconnecter: () => Promise<void>
}

const ContexteApp = createContext<Application | null>(null)

export function FournisseurApp({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [etat, setEtat] = useState<EtatUtilisateur | null>(null)
  const [chargement, setChargement] = useState(true)
  const [badgeACelebrer, setBadgeACelebrer] = useState<Badge | null>(null)

  const enregistrementDiffere = useRef<number | null>(null)

  useEffect(() => {
    let annule = false
    ;(async () => {
      const u = await auth.utilisateurCourant()
      if (annule) return
      if (u) {
        setUtilisateur(u)
        setEtat(await charger(u))
      }
      setChargement(false)
    })()
    return () => {
      annule = true
    }
  }, [])

  /**
   * Toute modification passe par ici : on applique la recette, on détecte les
   * badges nouvellement atteints, puis on enregistre en différé pour ne pas
   * écrire à chaque case cochée.
   */
  const modifier = useCallback(
    (recette: (brouillon: EtatUtilisateur) => void) => {
      setEtat((precedent) => {
        if (!precedent) return precedent

        const suivant: EtatUtilisateur = structuredClone(precedent)
        recette(suivant)

        const nouveaux = badgesADebloquer(suivant)
        if (nouveaux.length > 0) {
          suivant.badges = [...suivant.badges, ...nouveaux.map((b) => b.code)]
          setBadgeACelebrer(nouveaux[0])
        }

        if (enregistrementDiffere.current) window.clearTimeout(enregistrementDiffere.current)
        enregistrementDiffere.current = window.setTimeout(() => {
          enregistrementDiffere.current = null
          void enregistrer(suivant.profil.id, suivant)
        }, 400)

        return suivant
      })
    },
    [],
  )

  // Une fermeture d'onglet ne doit pas emporter les 400 dernières millisecondes.
  useEffect(() => {
    const surFermeture = () => {
      if (enregistrementDiffere.current && etat) {
        window.clearTimeout(enregistrementDiffere.current)
        void enregistrer(etat.profil.id, etat)
      }
    }
    window.addEventListener('pagehide', surFermeture)
    return () => window.removeEventListener('pagehide', surFermeture)
  }, [etat])

  const seConnecter = useCallback(async (identifiant: string, motDePasse: string) => {
    const u = await auth.connexion(identifiant, motDePasse)
    setUtilisateur(u)
    setEtat(await charger(u))
  }, [])

  const sInscrire = useCallback(
    async (identifiant: string, motDePasse: string, prenom: string) => {
      const u = await auth.inscription(identifiant, motDePasse, prenom)
      setUtilisateur(u)
      setEtat(await charger(u))
    },
    [],
  )

  const seDeconnecter = useCallback(async () => {
    await auth.deconnexion()
    setUtilisateur(null)
    setEtat(null)
  }, [])

  const valeur = useMemo(
    () => ({
      utilisateur,
      etat,
      chargement,
      badgeACelebrer,
      fermerCelebration: () => setBadgeACelebrer(null),
      modifier,
      seConnecter,
      sInscrire,
      seDeconnecter,
    }),
    [utilisateur, etat, chargement, badgeACelebrer, modifier, seConnecter, sInscrire, seDeconnecter],
  )

  return <ContexteApp.Provider value={valeur}>{children}</ContexteApp.Provider>
}

export function useApp(): Application {
  const contexte = useContext(ContexteApp)
  if (!contexte) throw new Error('useApp doit être appelé dans un FournisseurApp')
  return contexte
}

/** Raccourci pour les écrans qui ne s'affichent qu'une fois connecté. */
export function useSession() {
  const { etat, modifier } = useApp()
  if (!etat) throw new Error('useSession appelé hors session authentifiée')
  return { etat, modifier }
}
