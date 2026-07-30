import { useEffect, useState } from 'react'
import { Bouton } from './ui'
import { enregistrerPhoto, lirePhoto, supprimerPhoto, type ClePhoto } from '../lib/photos'
import { classes } from '../lib/utils'

/**
 * Lit une photo de l'appareil et en donne une URL d'objet utilisable dans un
 * `<img>`.
 *
 * L'URL est révoquée au démontage **et** à chaque changement de photo : sans ça
 * la mémoire fuit à chaque passage sur l'écran, et le symptôme n'apparaît
 * qu'après une longue session.
 *
 * `rafraichir` sert aux écrans qui affichent une photo réglée ailleurs : rien
 * ne notifie IndexedDB, donc c'est l'écran de réglage qui redemande la lecture.
 */
export function usePhoto(userId: string, cle: ClePhoto, jeton = 0): string | null {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)

  useEffect(() => {
    let vivant = true
    void lirePhoto(userId, cle)
      .then((b) => {
        if (vivant) setBlob(b)
      })
      // Une base indisponible (navigation privée, quota) ne doit pas casser
      // l'écran : on affiche simplement l'absence de photo.
      .catch(() => {})
    return () => {
      vivant = false
    }
  }, [userId, cle, jeton])

  useEffect(() => {
    if (!blob) {
      setApercu(null)
      return
    }
    const url = URL.createObjectURL(blob)
    setApercu(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  return apercu
}

/**
 * Choix, aperçu et retrait d'une photo.
 *
 * Le texte d'aide dit le prix du choix de stockage plutôt que de le laisser
 * découvrir : la photo ne suit pas d'un appareil à l'autre. C'est le même
 * principe que pour Apple Santé, dont l'écran dit « import » et jamais
 * « synchronisation ».
 */
export function PhotoFamille({
  userId,
  cle,
  label,
  aide,
  forme = 'bandeau',
  onChange,
}: {
  userId: string
  cle: ClePhoto
  label: string
  aide: string
  forme?: 'bandeau' | 'rond'
  /** Prévient l'écran qui affiche la même photo ailleurs : rien ne notifie
   *  IndexedDB, donc c'est d'ici que part le signal. */
  onChange?: () => void
}) {
  const [jeton, setJeton] = useState(0)
  const apercu = usePhoto(userId, cle, jeton)
  const [erreur, setErreur] = useState<string | null>(null)

  async function choisir(fichier: File | undefined) {
    if (!fichier) return
    setErreur(null)
    try {
      await enregistrerPhoto(userId, cle, fichier)
      setJeton((j) => j + 1)
      onChange?.()
    } catch {
      // Une erreur dit quoi faire, et ne prend pas le ton chaleureux du reste.
      setErreur('Cette image n’a pas pu être lue. Essayez une photo JPEG ou PNG.')
    }
  }

  async function retirer() {
    await supprimerPhoto(userId, cle)
    setJeton((j) => j + 1)
    onChange?.()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink">{label}</p>

      {apercu && (
        <img
          src={apercu}
          alt=""
          className={classes(
            'bg-sunken object-cover',
            forme === 'rond' ? 'size-24 rounded-full' : 'h-32 w-full rounded-tile',
          )}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-full bg-sunken px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95">
          {apercu ? 'Changer' : 'Choisir une photo'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void choisir(e.target.files?.[0])}
          />
        </label>
        {apercu && (
          <Bouton ton="fantome" onClick={() => void retirer()}>
            Retirer
          </Bouton>
        )}
      </div>

      {erreur && <p className="text-sm font-medium text-alerte">{erreur}</p>}

      <p className="text-sm text-ink-soft">{aide}</p>
    </div>
  )
}
