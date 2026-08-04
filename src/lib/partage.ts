export type Carte = { titre: string; sousTitre: string }

const LARGEUR = 1080
const HAUTEUR = 1080

/**
 * Fabrique l'image et la propose au partage natif.
 *
 * Ne reçoit qu'un titre et un sous-titre, jamais l'état : c'est ce qui garantit
 * qu'aucun chiffre de santé ne peut entrer dans l'image. `outils/partage.mjs`
 * vérifie que ce fichier n'importe rien qui en porte, et c'est aussi ce qui
 * permet de partager sans demander un consentement nouveau — rien de sensible
 * ne sort.
 *
 * Là où le partage natif manque — la plupart des navigateurs de bureau —, on
 * télécharge l'image. Ce n'est pas une panne, donc aucun message d'erreur.
 */
export async function partagerCarte(carte: Carte): Promise<'partage' | 'telecharge'> {
  const blob = await dessiner(carte)
  const fichier = new File([blob], 'mamakilo.png', { type: 'image/png' })

  if (navigator.canShare?.({ files: [fichier] })) {
    await navigator.share({ files: [fichier], title: carte.titre })
    return 'partage'
  }

  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = 'mamakilo.png'
  lien.click()
  // Révoquer dans la foulée du clic coupe le téléchargement sur certains
  // navigateurs, qui n'ont pas encore lu le blob quand la ligne suivante passe.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return 'telecharge'
}

function dessiner(carte: Carte): Promise<Blob> {
  const toile = document.createElement('canvas')
  toile.width = LARGEUR
  toile.height = HAUTEUR
  const ctx = toile.getContext('2d')!

  // Les couleurs sont écrites en dur : c'est une image de marque, elle ne suit
  // pas le thème de celui qui la fabrique. Une carte partagée en thème Océan et
  // une autre en thème Framboise ne se ressembleraient plus.
  ctx.fillStyle = '#FDF6EE'
  ctx.fillRect(0, 0, LARGEUR, HAUTEUR)

  ctx.fillStyle = '#F67A5E'
  ctx.fillRect(0, HAUTEUR - 160, LARGEUR, 160)

  marmite(ctx, LARGEUR / 2 - 110, 150, 220)

  ctx.fillStyle = '#232D3A'
  ctx.font = '600 84px Fredoka, Georgia, serif'
  ctx.textAlign = 'center'
  const lignes = enveloppe(ctx, carte.titre, LARGEUR - 160)
  lignes.forEach((l, i) => ctx.fillText(l, LARGEUR / 2, 520 + i * 100))

  ctx.fillStyle = '#5C6F7A'
  ctx.font = '400 44px Inter, system-ui, sans-serif'
  ctx.fillText(carte.sousTitre, LARGEUR / 2, 520 + lignes.length * 100 + 60)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '600 52px Fredoka, Georgia, serif'
  ctx.fillText('Mamakilo', LARGEUR / 2, HAUTEUR - 62)

  return new Promise((resoudre, rejeter) =>
    toile.toBlob(
      (b) => (b ? resoudre(b) : rejeter(new Error('Encodage impossible.'))),
      'image/png',
    ),
  )
}

/**
 * La marmite, redessinée aux mêmes tracés que le logo.
 *
 * Recopiée plutôt qu'importée du composant : `Marque` est du JSX, et ce module
 * dessine sur un canvas hors de React. Les tracés sont ceux de `public/icone.svg`.
 */
function marmite(ctx: CanvasRenderingContext2D, x: number, y: number, cote: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(cote / 512, cote / 512)

  const trace = (d: string, remplissage: string) => {
    ctx.fillStyle = remplissage
    ctx.fill(new Path2D(d))
  }

  trace(
    'M186 232 C150 232 132 206 142 180 C120 168 124 140 148 134 C150 110 180 100 196 118 C216 104 240 118 238 140 C256 152 254 182 232 188 C232 218 210 232 186 232 Z',
    '#4C8A4C',
  )
  ctx.fillStyle = '#E85C46'
  ctx.beginPath()
  ctx.arc(262, 186, 46, 0, Math.PI * 2)
  ctx.fill()
  trace('M262 146 l-24 -14 l10 22 l-26 -4 l18 18 Z', '#4C8A4C')
  trace('M356 132 C376 148 380 186 366 236 L322 226 C328 176 338 144 356 132 Z', '#F58A32')

  ctx.strokeStyle = '#4C8A4C'
  ctx.lineWidth = 15
  ctx.lineCap = 'round'
  ctx.stroke(new Path2D('M356 132 L344 96'))
  ctx.stroke(new Path2D('M356 132 L378 104'))

  ctx.strokeStyle = '#F67A5E'
  ctx.lineWidth = 26
  ctx.stroke(new Path2D('M126 288 C92 288 92 340 126 340'))
  ctx.stroke(new Path2D('M386 288 C420 288 420 340 386 340'))

  trace('M118 246 h276 v104 c0 42 -34 76 -76 76 h-124 c-42 0 -76 -34 -76 -76 Z', '#F67A5E')

  ctx.strokeStyle = '#24303C'
  ctx.lineWidth = 18
  ctx.stroke(new Path2D('M196 306 q18 -20 36 0'))
  ctx.stroke(new Path2D('M212 342 q44 44 88 0'))
  ctx.fillStyle = '#24303C'
  ctx.beginPath()
  ctx.arc(298, 310, 13, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/** Un titre de recette dépasse souvent la largeur : il se coupe aux mots. */
function enveloppe(ctx: CanvasRenderingContext2D, texte: string, largeurMax: number): string[] {
  const lignes: string[] = []
  let ligne = ''
  for (const mot of texte.split(' ')) {
    const essai = ligne ? `${ligne} ${mot}` : mot
    if (ctx.measureText(essai).width > largeurMax && ligne) {
      lignes.push(ligne)
      ligne = mot
    } else {
      ligne = essai
    }
  }
  lignes.push(ligne)
  return lignes
}
