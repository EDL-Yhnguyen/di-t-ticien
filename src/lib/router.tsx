import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Routeur maison — une dizaine d'écrans, aucun chargement de données par route.
 * Les bibliothèques du marché apportaient ici un framework de data-loading
 * inutilisé et une file d'avis de sécurité à suivre, pour trois fonctions.
 */
interface Routage {
  chemin: string
  aller: (vers: string, options?: { remplacer?: boolean }) => void
  retour: () => void
}

const ContexteRoutage = createContext<Routage | null>(null)

export function FournisseurRoutage({ children }: { children: ReactNode }) {
  const [chemin, setChemin] = useState(() => window.location.pathname)

  useEffect(() => {
    const surRetour = () => setChemin(window.location.pathname)
    window.addEventListener('popstate', surRetour)
    return () => window.removeEventListener('popstate', surRetour)
  }, [])

  const aller = useCallback((vers: string, options?: { remplacer?: boolean }) => {
    if (vers === window.location.pathname) return
    if (options?.remplacer) window.history.replaceState(null, '', vers)
    else window.history.pushState(null, '', vers)
    setChemin(vers)
    window.scrollTo({ top: 0 })
  }, [])

  const retour = useCallback(() => window.history.back(), [])

  const valeur = useMemo(() => ({ chemin, aller, retour }), [chemin, aller, retour])

  return <ContexteRoutage.Provider value={valeur}>{children}</ContexteRoutage.Provider>
}

export function useRoutage(): Routage {
  const contexte = useContext(ContexteRoutage)
  if (!contexte) throw new Error('useRoutage doit être appelé dans un FournisseurRoutage')
  return contexte
}

export function Lien({
  vers,
  className,
  style,
  children,
  onClick,
}: {
  vers: string
  className?: string
  style?: React.CSSProperties
  children: ReactNode
  onClick?: () => void
}) {
  const { aller } = useRoutage()
  return (
    <a
      href={vers}
      className={className}
      style={style}
      onClick={(e) => {
        // Laisse passer ctrl+clic, clic milieu, etc. — ouvrir dans un onglet
        // doit continuer de fonctionner.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        onClick?.()
        aller(vers)
      }}
    >
      {children}
    </a>
  )
}
