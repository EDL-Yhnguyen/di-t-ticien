/**
 * Les photos de l'utilisateur, stockées sur l'appareil et nulle part ailleurs.
 *
 * Pourquoi IndexedDB et pas le document `EtatUtilisateur`, dans cet ordre :
 *
 * 1. Une photo de famille contient souvent un enfant. Ne pas l'envoyer est la
 *    seule position tenable pour une application qui promet déjà que les
 *    données de santé restent à l'utilisateur. Conséquence voulue : aucun
 *    destinataire à déclarer, aucun consentement nouveau à demander.
 * 2. `modifier()` fait un `structuredClone` de tout l'état à chaque écriture.
 *    Une photo en base64 dans ce document serait recopiée à chaque frappe.
 * 3. Le document reste petit, ce qui était un choix assumé du projet.
 *
 * Le prix, dit à l'utilisateur dans l'écran de réglage : la photo ne suit pas
 * d'un appareil à l'autre.
 */

export type ClePhoto = 'avatar' | 'famille'

/** Les deux clés, en un seul endroit : l'export et l'effacement les parcourent. */
export const CLES_PHOTOS: ClePhoto[] = ['avatar', 'famille']

const BASE = 'mamakilo-photos'
const LOT = 'photos'

/**
 * La clé porte l'identifiant du compte, comme `equilibre:donnees:<id>` et comme
 * les relevés de prix. Le mode démo garde plusieurs comptes dans le même
 * navigateur : une clé nue afficherait la photo de famille d'un compte à
 * l'ouverture d'un autre, sur un appareil partagé.
 */
function cleDe(userId: string, cle: ClePhoto): string {
  return `${userId}:${cle}`
}

/** Côté long visé après redimensionnement, par usage. */
const TAILLES: Record<ClePhoto, number> = { avatar: 256, famille: 1200 }

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resoudre, rejeter) => {
    const requete = indexedDB.open(BASE, 1)
    requete.onupgradeneeded = () => requete.result.createObjectStore(LOT)
    requete.onsuccess = () => resoudre(requete.result)
    requete.onerror = () => rejeter(requete.error)
  })
}

function transaction<T>(
  mode: IDBTransactionMode,
  action: (lot: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return ouvrir().then(
    (base) =>
      new Promise<T>((resoudre, rejeter) => {
        const requete = action(base.transaction(LOT, mode).objectStore(LOT))
        requete.onsuccess = () => resoudre(requete.result)
        requete.onerror = () => rejeter(requete.error)
      }),
  )
}

/**
 * Redimensionne avant de stocker. Une photo de téléphone fait plusieurs
 * mégaoctets ; la garder entière remplirait le quota du navigateur pour un
 * bandeau de 1 200 px de large.
 */
async function redimensionner(fichier: File, coteLong: number): Promise<Blob> {
  const image = await createImageBitmap(fichier)
  const facteur = Math.min(1, coteLong / Math.max(image.width, image.height))
  const largeur = Math.round(image.width * facteur)
  const hauteur = Math.round(image.height * facteur)

  const toile = document.createElement('canvas')
  toile.width = largeur
  toile.height = hauteur
  toile.getContext('2d')!.drawImage(image, 0, 0, largeur, hauteur)
  image.close()

  return new Promise((resoudre, rejeter) =>
    toile.toBlob(
      (blob) =>
        blob ? resoudre(blob) : rejeter(new Error('Le navigateur n’a pas pu encoder l’image.')),
      'image/jpeg',
      0.82,
    ),
  )
}

export async function enregistrerPhoto(
  userId: string,
  cle: ClePhoto,
  fichier: File,
): Promise<void> {
  const reduite = await redimensionner(fichier, TAILLES[cle])
  await transaction('readwrite', (lot) => lot.put(reduite, cleDe(userId, cle)))
}

export async function lirePhoto(userId: string, cle: ClePhoto): Promise<Blob | null> {
  const trouve = await transaction<Blob | undefined>('readonly', (lot) =>
    lot.get(cleDe(userId, cle)),
  )
  return trouve ?? null
}

export async function supprimerPhoto(userId: string, cle: ClePhoto): Promise<void> {
  await transaction('readwrite', (lot) => lot.delete(cleDe(userId, cle)))
}

/**
 * Appelé à la suppression du compte. Une donnée oubliée à l'effacement est un
 * manquement à l'article 17, même si elle n'est jamais partie de l'appareil.
 *
 * N'efface que les photos du compte visé : un autre compte du même navigateur
 * n'a pas à perdre les siennes.
 */
export async function viderPhotos(userId: string): Promise<void> {
  await Promise.all(CLES_PHOTOS.map((cle) => supprimerPhoto(userId, cle)))
}
