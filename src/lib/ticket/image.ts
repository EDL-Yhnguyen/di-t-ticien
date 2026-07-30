/**
 * Préparer la photo d'un ticket avant de la donner à l'OCR.
 *
 * C'est ici que se gagne l'essentiel de la qualité de lecture. Tesseract lit
 * très bien un texte noir sur fond blanc et très mal une photo de téléphone :
 * papier grisâtre, ombre de la main sur la moitié du ticket, reflet du plafond
 * sur l'autre. Un seuillage **global** aggrave le problème — il choisit un seuil
 * unique pour une image dont l'éclairage varie du simple au triple, et efface la
 * moitié sombre ou noie la moitié claire.
 *
 * D'où le seuillage **adaptatif** : chaque pixel est comparé à la moyenne de son
 * voisinage, pas à celle de l'image. Une ombre traversant le ticket ne change
 * alors plus rien, puisqu'elle déplace le pixel et sa moyenne locale ensemble.
 */

/**
 * La largeur visée avant lecture.
 *
 * Tesseract veut des caractères d'une vingtaine de pixels de haut. Un ticket
 * fait 8 cm de large et porte une quarantaine de caractères par ligne : à
 * 1 400 px, un caractère en fait environ 25. Au-dessus on paie du temps de
 * calcul sans rien gagner, en dessous les décimales se confondent — et sur un
 * ticket, « 2,45 » lu « 2,15 » est exactement l'erreur qu'on ne veut pas.
 */
const LARGEUR_CIBLE = 1400

/**
 * Le côté de la fenêtre de moyenne locale, en fraction de la largeur.
 *
 * Elle doit être nettement plus grande qu'un caractère, sinon l'intérieur d'un
 * trait épais devient son propre voisinage et ressort blanc — les chiffres se
 * creusent. Un vingtaine de la largeur tient plusieurs caractères.
 */
const FENETRE = 1 / 20

/**
 * De combien un pixel doit être plus sombre que son voisinage pour être encré.
 *
 * Sans cette marge, le grain du papier bascule au hasard de part et d'autre de
 * sa propre moyenne et l'image ressort poivrée — ce que l'OCR lit comme de la
 * ponctuation.
 */
const MARGE = 0.15

/**
 * Photo → image binarisée, prête pour l'OCR.
 *
 * `imageOrientation: 'from-image'` n'est pas un détail : une photo prise en
 * portrait porte son orientation dans ses métadonnées EXIF, et une image
 * décodée sans en tenir compte arrive couchée. Tesseract ne lit pas le texte
 * vertical, et l'échec serait total sans rien de visible pour l'expliquer.
 */
export async function preparerImage(source: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' })
  try {
    const echelle = LARGEUR_CIBLE / bitmap.width
    const largeur = Math.max(1, Math.round(bitmap.width * echelle))
    const hauteur = Math.max(1, Math.round(bitmap.height * echelle))

    const canevas = document.createElement('canvas')
    canevas.width = largeur
    canevas.height = hauteur
    const contexte = canevas.getContext('2d', { willReadFrequently: true })
    if (!contexte) throw new Error("Le navigateur n'a pas fourni de contexte 2D.")

    // Le lissage sert au rétrécissement comme à l'agrandissement : sans lui, une
    // photo de 4 000 px réduite perd un pixel sur trois, et une ligne fine de
    // ticket peut disparaître entièrement entre deux lignes conservées.
    contexte.imageSmoothingEnabled = true
    contexte.imageSmoothingQuality = 'high'
    contexte.drawImage(bitmap, 0, 0, largeur, hauteur)

    const image = contexte.getImageData(0, 0, largeur, hauteur)
    binariser(image)
    return image
  } finally {
    bitmap.close()
  }
}

/** Modifie `image` sur place : gris, puis seuillage adaptatif. */
function binariser(image: ImageData): void {
  const { width: largeur, height: hauteur, data } = image
  const gris = new Uint8ClampedArray(largeur * hauteur)

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Coefficients de luminance perçue (Rec. 601) : un gris obtenu par la
    // moyenne des trois canaux rendrait l'encre bleue des tickets thermiques
    // plus claire qu'elle ne paraît, et les caractères s'effaceraient.
    gris[p] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000
  }

  const integrale = imageIntegrale(gris, largeur, hauteur)
  const demiFenetre = Math.max(8, Math.round((largeur * FENETRE) / 2))

  for (let y = 0; y < hauteur; y++) {
    const haut = Math.max(0, y - demiFenetre)
    const bas = Math.min(hauteur - 1, y + demiFenetre)

    for (let x = 0; x < largeur; x++) {
      const gauche = Math.max(0, x - demiFenetre)
      const droite = Math.min(largeur - 1, x + demiFenetre)
      const compte = (bas - haut + 1) * (droite - gauche + 1)

      const somme =
        integrale[(bas + 1) * (largeur + 1) + droite + 1] -
        integrale[haut * (largeur + 1) + droite + 1] -
        integrale[(bas + 1) * (largeur + 1) + gauche] +
        integrale[haut * (largeur + 1) + gauche]

      const p = y * largeur + x
      // La comparaison reste entière — `gris * compte` contre `somme * (1 - marge)`
      // — pour éviter une division par pixel : il y en a deux millions.
      const encre = gris[p] * compte < somme * (1 - MARGE)
      const valeur = encre ? 0 : 255
      const i = p * 4
      data[i] = valeur
      data[i + 1] = valeur
      data[i + 2] = valeur
      data[i + 3] = 255
    }
  }
}

/**
 * L'image intégrale : chaque case porte la somme de tout ce qui la précède en
 * haut et à gauche.
 *
 * Elle rend la moyenne d'un rectangle indépendante de sa taille — quatre
 * lectures et trois opérations, quelle que soit la fenêtre. Sans elle, une
 * fenêtre de 70 px de côté demanderait cinq mille additions par pixel, soit dix
 * milliards pour l'image : de l'ordre de la minute, sur un téléphone, pour un
 * geste qui doit en prendre quelques secondes.
 *
 * Le tableau porte une ligne et une colonne de zéros en tête, ce qui évite un
 * test de bord dans la boucle chaude.
 */
function imageIntegrale(gris: Uint8ClampedArray, largeur: number, hauteur: number): Uint32Array {
  const pas = largeur + 1
  const integrale = new Uint32Array(pas * (hauteur + 1))

  for (let y = 0; y < hauteur; y++) {
    let cumulLigne = 0
    for (let x = 0; x < largeur; x++) {
      cumulLigne += gris[y * largeur + x]
      integrale[(y + 1) * pas + x + 1] = integrale[y * pas + x + 1] + cumulLigne
    }
  }

  return integrale
}
