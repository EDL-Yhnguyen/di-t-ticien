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
import { toutSupprimer, type ResultatSuppression } from '../lib/rgpd'

interface Application {
  utilisateur: Utilisateur | null
  etat: EtatUtilisateur | null
  chargement: boolean
  /** Renseigné quand l'ouverture de session a échoué : évite l'écran d'attente sans fin. */
  erreurChargement: string | null
  reessayerChargement: () => void
  /**
   * Renseigné quand la dernière sauvegarde a échoué. L'état modifié est
   * conservé en mémoire et sera réécrit par `reessayerEnregistrement`.
   */
  erreurEnregistrement: string | null
  reessayerEnregistrement: () => void
  /** Badge tout juste débloqué, à célébrer puis à refermer. */
  badgeACelebrer: Badge | null
  fermerCelebration: () => void
  modifier: (recette: (brouillon: EtatUtilisateur) => void) => void
  seConnecter: (identifiant: string, motDePasse: string) => Promise<void>
  sInscrire: (identifiant: string, motDePasse: string, prenom: string) => Promise<void>
  seDeconnecter: () => Promise<void>
  /** Efface les données puis le compte, et referme la session. Sans retour possible. */
  supprimerCompte: () => Promise<ResultatSuppression>
  /**
   * Message à montrer après une suppression partielle. L'écran qui l'a
   * déclenchée disparaît avec la session : il ne peut pas le porter lui-même.
   */
  avisSuppression: string | null
  fermerAvisSuppression: () => void
}

const ContexteApp = createContext<Application | null>(null)

function message(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : String(erreur)
}

export function FournisseurApp({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [etat, setEtat] = useState<EtatUtilisateur | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState<string | null>(null)
  const [erreurEnregistrement, setErreurEnregistrement] = useState<string | null>(null)
  const [badgeACelebrer, setBadgeACelebrer] = useState<Badge | null>(null)
  const [avisSuppression, setAvisSuppression] = useState<string | null>(null)
  const [tentative, setTentative] = useState(0)

  const enregistrementDiffere = useRef<number | null>(null)
  /** Dernier état dont l'écriture n'a pas encore abouti. */
  const enAttente = useRef<EtatUtilisateur | null>(null)

  /**
   * Le seul endroit qui écrit. Un échec ne doit jamais être silencieux : on
   * garde l'état en attente et on remonte l'erreur à l'écran, sinon
   * l'utilisateur voit sa saisie prise en compte alors qu'elle est perdue.
   */
  const ecrire = useCallback(async (cible: EtatUtilisateur) => {
    enAttente.current = cible
    try {
      await enregistrer(cible.profil.id, cible)
      // Une écriture plus récente a pu passer devant : ne pas l'effacer.
      if (enAttente.current === cible) enAttente.current = null
      setErreurEnregistrement(null)
    } catch (erreur) {
      setErreurEnregistrement(message(erreur))
    }
  }, [])

  const ouvrirSession = useCallback(async () => {
    setChargement(true)
    setErreurChargement(null)
    try {
      const u = await auth.utilisateurCourant()
      if (u) {
        setUtilisateur(u)
        setEtat(await charger(u))
      }
    } catch (erreur) {
      // Sans ce filet, `setChargement(false)` n'était jamais atteint et
      // l'écran « Ouverture » restait affiché indéfiniment.
      setErreurChargement(message(erreur))
      setUtilisateur(null)
      setEtat(null)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    let annule = false
    void (async () => {
      await ouvrirSession()
      if (annule) return
    })()
    return () => {
      annule = true
    }
  }, [ouvrirSession, tentative])

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

        // Replanifier est idempotent : en mode strict React rejoue cet
        // updater, le clearTimeout annule simplement la planification jumelle.
        if (enregistrementDiffere.current) window.clearTimeout(enregistrementDiffere.current)
        enregistrementDiffere.current = window.setTimeout(() => {
          enregistrementDiffere.current = null
          void ecrire(suivant)
        }, 400)

        return suivant
      })
    },
    [ecrire],
  )

  const reessayerEnregistrement = useCallback(() => {
    const cible = enAttente.current ?? etat
    if (cible) void ecrire(cible)
  }, [ecrire, etat])

  const reessayerChargement = useCallback(() => setTentative((n) => n + 1), [])

  // Une fermeture d'onglet ne doit pas emporter les 400 dernières millisecondes.
  useEffect(() => {
    const surFermeture = () => {
      if (enregistrementDiffere.current && etat) {
        window.clearTimeout(enregistrementDiffere.current)
        enregistrementDiffere.current = null
        void ecrire(etat)
      }
    }
    window.addEventListener('pagehide', surFermeture)
    return () => window.removeEventListener('pagehide', surFermeture)
  }, [etat, ecrire])

  const seConnecter = useCallback(async (identifiant: string, motDePasse: string) => {
    const u = await auth.connexion(identifiant, motDePasse)
    setUtilisateur(u)
    setEtat(await charger(u))
    setErreurChargement(null)
  }, [])

  const sInscrire = useCallback(
    async (identifiant: string, motDePasse: string, prenom: string) => {
      const u = await auth.inscription(identifiant, motDePasse, prenom)
      setUtilisateur(u)
      setEtat(await charger(u))
      setErreurChargement(null)
    },
    [],
  )

  const seDeconnecter = useCallback(async () => {
    // Ne pas laisser une écriture différée partir après la déconnexion.
    if (enregistrementDiffere.current) {
      window.clearTimeout(enregistrementDiffere.current)
      enregistrementDiffere.current = null
    }
    enAttente.current = null
    await auth.deconnexion()
    setUtilisateur(null)
    setEtat(null)
    setErreurEnregistrement(null)
  }, [])

  const supprimerCompte = useCallback(async (): Promise<ResultatSuppression> => {
    if (!utilisateur) throw new Error('Aucune session active.')
    // Une écriture différée qui partirait après l'effacement recréerait la
    // ligne que l'on vient de détruire.
    if (enregistrementDiffere.current) {
      window.clearTimeout(enregistrementDiffere.current)
      enregistrementDiffere.current = null
    }
    enAttente.current = null

    const resultat = await toutSupprimer(utilisateur.id)
    setAvisSuppression(
      resultat.compteSupprime
        ? null
        : 'Vos données ont bien été effacées, mais votre identifiant de connexion existe encore. ' +
            'La fonction « supprimer_mon_compte » n’a pas été créée dans le projet Supabase : ' +
            'relancez le contenu de supabase/schema.sql.',
    )
    setUtilisateur(null)
    setEtat(null)
    setErreurEnregistrement(null)
    return resultat
  }, [utilisateur])

  const valeur = useMemo(
    () => ({
      utilisateur,
      etat,
      chargement,
      erreurChargement,
      reessayerChargement,
      erreurEnregistrement,
      reessayerEnregistrement,
      badgeACelebrer,
      fermerCelebration: () => setBadgeACelebrer(null),
      modifier,
      seConnecter,
      sInscrire,
      seDeconnecter,
      supprimerCompte,
      avisSuppression,
      fermerAvisSuppression: () => setAvisSuppression(null),
    }),
    [
      utilisateur,
      etat,
      chargement,
      erreurChargement,
      reessayerChargement,
      erreurEnregistrement,
      reessayerEnregistrement,
      badgeACelebrer,
      modifier,
      seConnecter,
      sInscrire,
      seDeconnecter,
      supprimerCompte,
      avisSuppression,
    ],
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
