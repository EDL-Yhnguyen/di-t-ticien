#!/usr/bin/env node
/**
 * Récupère les photos des plats emblématiques depuis Wikimedia Commons.
 *
 * ## Pourquoi Commons et pas une banque d'images
 *
 * `CLAUDE.md` posait que `photo` ne serait jamais renseigné, pour une raison qui
 * tient toujours : le dépôt est public, et une photo d'emprunt y serait une
 * contrefaçon. Ce qui a changé, c'est la source. Commons **n'accepte que des
 * fichiers librement réutilisables** — domaine public, CC0, CC BY, CC BY-SA — donc
 * la question du droit d'usage est réglée en amont, à une condition qui n'est pas
 * négociable : **créditer l'auteur et la licence**. C'est ce que produit ce script,
 * dans `src/lib/recettes/photos.ts`, et ce que l'écran affiche sous l'image.
 *
 * ## Ce que le script ne fait pas
 *
 * Il ne cherche pas au hasard. Chaque plat porte ici une **requête écrite à la
 * main**, et le résultat est retenu seulement si le titre du fichier contient les
 * mots attendus. Une recherche libre sur « far breton » ramène des paysages de
 * Bretagne, et une vignette fausse est pire que pas de vignette — c'est la règle
 * déjà posée pour les pictogrammes d'illustration.
 *
 * Les recettes composées n'en reçoivent pas : cinq mille assemblages n'ont pas de
 * photo qui leur corresponde, et leur en coller une serait mentir sur ce qu'on va
 * obtenir. Elles gardent l'illustration générée.
 *
 * Usage :
 *   node outils/photos.mjs            télécharge ce qui manque
 *   node outils/photos.mjs --refaire   retélécharge tout
 */

import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const RACINE = path.resolve(import.meta.dirname, '..')
const DOSSIER = path.join(RACINE, 'public', 'plats')
const DOSSIER_MINI = path.join(DOSSIER, 'mini')
const SORTIE = path.join(RACINE, 'src', 'lib', 'recettes', 'photos.ts')

/**
 * Largeur demandée à Commons.
 *
 * **640 et non une valeur ronde choisie librement.** Commons ne sert que des
 * paliers de vignettes ; une largeur arbitraire est arrondie au palier supérieur
 * par l'API, et réécrire l'URL à la main pour forcer la valeur exacte fait
 * répondre 400. Demander 600 donnait donc des vignettes de 960 px — douze
 * mégaoctets pour soixante-neuf images, sans que rien ne le signale — et tenter
 * de corriger l'URL cassait tous les téléchargements. 640 est un palier réel :
 * il est servi tel quel.
 */
const LARGEUR = 640

/**
 * Largeur de la vignette de liste.
 *
 * Deux tailles et non une, parce que la liste des recettes affiche la photo dans
 * un carré de 48 px : y servir l'image de la fiche revenait à télécharger deux
 * cents kilo-octets par ligne, soit quatre mégaoctets pour un écran de vingt
 * résultats. Mesuré dans le navigateur, pas supposé — l'image faisait 960 px de
 * large pour 48 px affichés.
 *
 * 320 px et non 96 : c'est le plus petit palier confortable de Commons, et il
 * couvre les écrans à haute densité comme la vignette de 160 px que la fiche
 * pourrait vouloir demain.
 */
const LARGEUR_MINI = 320

/**
 * Pause entre deux requêtes, en millisecondes.
 *
 * Une seconde peut sembler prudent à l'excès pour quatre-vingts fichiers. Ça ne
 * l'est pas : à 300 ms, Wikimedia a répondu 429 « Too many requests » en cours de
 * route, et un script coupé au milieu laisse des images sur le disque sans leur
 * attribution — le seul défaut vraiment grave que ce script puisse produire.
 */
const PAUSE = 1000

/**
 * Les licences acceptées.
 *
 * Commons héberge aussi quelques fichiers sous licences à clauses lourdes
 * (« GFDL seule », qui impose de reproduire le texte entier de la licence).
 * On s'en tient à ce qui se crédite en une ligne sous une image.
 */
const LICENCES_OK = /^(cc0|cc[- ]by(-sa)?([- ]\d(\.\d)?)?|public domain|pd|domaine public)/i

/**
 * Plat → requête Commons, et mots qui doivent apparaître dans le nom du fichier.
 *
 * La clé est l'identifiant de la recette dans `terroir/`. Le second champ est le
 * garde-fou : sans lui, « socca » ramenait des photos de la ville de Nice.
 */
const PLATS = [
  ['carbonade-flamande', 'carbonade flamande', ['carbonade', 'carbonnade']],
  ['waterzooi-poulet', 'waterzooi', ['waterzooi']],
  ['moules-mariniere', 'moules marinieres', ['moule']],
  ['welsh', 'welsh rarebit', ['welsh']],
  ['endives-jambon-gratin', 'endives au jambon', ['endive']],
  ['flamiche-poireaux', 'flamiche poireaux', ['flamiche']],
  ['galette-complete', 'galette bretonne complete', ['galette']],
  ['saint-jacques-bretonne', 'coquilles saint jacques', ['jacques']],
  ['cotriade', 'cotriade', ['cotriade']],
  ['far-breton-leger', 'far breton pruneaux', ['far breton', 'far_breton']],
  ['poulet-vallee-auge', 'poulet vallee auge', ['auge', 'poulet']],
  ['sole-normande', 'sole normande', ['sole']],
  ['choucroute-garnie', 'choucroute garnie', ['choucroute']],
  ['baeckeoffe', 'baeckeoffe', ['baeckeoffe', 'backeoffe']],
  ['tarte-flambee', 'tarte flambee flammekueche', ['flamm', 'tarte flambee', 'tarte_flambee']],
  ['spaetzle-gratines', 'spaetzle', ['spaetzle', 'spatzle']],
  ['quiche-lorraine', 'quiche lorraine', ['quiche']],
  ['potee-lorraine', 'potee lorraine', ['potee']],
  ['sandre-beurre-blanc', 'sandre beurre blanc', ['sandre']],
  ['boeuf-bourguignon', 'boeuf bourguignon', ['bourguignon']],
  ['oeufs-meurette', 'oeufs en meurette', ['meurette']],
  ['gougeres', 'gougeres', ['gougere']],
  ['quenelles-sauce-nantua', 'quenelle nantua', ['quenelle']],
  ['salade-lyonnaise', 'salade lyonnaise', ['lyonnaise']],
  ['gratin-dauphinois', 'gratin dauphinois', ['dauphinois']],
  ['tartiflette', 'tartiflette', ['tartiflette']],
  ['fondue-savoyarde', 'fondue savoyarde', ['fondue']],
  ['diots-polenta', 'diots savoie', ['diot']],
  ['aligot', 'aligot', ['aligot']],
  ['truffade', 'truffade', ['truffade']],
  ['ratatouille', 'ratatouille', ['ratatouille']],
  ['bouillabaisse', 'bouillabaisse', ['bouillabaisse']],
  ['daube-provencale', 'daube provencale', ['daube']],
  ['pissaladiere', 'pissaladiere', ['pissaladiere']],
  ['soupe-au-pistou', 'soupe au pistou', ['pistou']],
  ['cassoulet', 'cassoulet', ['cassoulet']],
  ['confit-canard-pommes-sarladaises', 'confit de canard', ['confit']],
  ['garbure', 'garbure', ['garbure']],
  ['poulet-basquaise', 'poulet basquaise', ['basquaise']],
  ['axoa', 'axoa veau', ['axoa']],
  ['piperade', 'piperade', ['piperade']],
  ['civet-sanglier', 'civet de sanglier', ['civet']],
  ['colombo-poulet', 'colombo poulet antilles', ['colombo']],
  ['rougail-saucisse', 'rougail saucisse', ['rougail']],
  ['cari-poisson', 'cari poisson reunion', ['cari', 'carry']],
  ['brandade-nimes', 'brandade de morue', ['brandade']],
  ['chili-con-carne', 'chili con carne', ['chili']],
  ['lasagnes-bolognaise', 'lasagne al forno', ['lasagn']],
  ['risotto-milanaise', 'risotto alla milanese', ['risotto']],
  ['osso-buco', 'ossobuco', ['ossobuco', 'osso buco', 'osso_buco']],
  ['aubergines-parmigiana', 'parmigiana di melanzane', ['parmigiana']],
  ['paella-valenciana', 'paella valenciana', ['paella']],
  ['tortilla-patatas', 'tortilla de patatas', ['tortilla']],
  ['couscous-royal', 'couscous', ['couscous']],
  ['tajine-poulet-citron', 'tajine poulet citron', ['tajine', 'tagine']],
  ['chakchouka', 'shakshouka', ['shakshuka', 'shakshouka', 'chakchouka']],
  ['houmous-falafel', 'falafel hummus', ['falafel', 'hummus']],
  ['moussaka', 'moussaka', ['moussaka']],
  ['curry-poulet-coco', 'chicken curry', ['curry']],
  ['dahl-lentilles-corail', 'dal lentil curry', ['dal', 'dhal', 'daal']],
  ['pad-thai', 'pad thai', ['pad thai', 'pad_thai', 'padthai']],
  ['boeuf-wok-legumes', 'beef stir fry', ['stir fry', 'stir_fry']],
  ['ramen-poulet', 'ramen', ['ramen']],
  ['nems-vietnamiens', 'nem ran cha gio', ['nem', 'gio']],
  ['fish-and-chips', 'fish and chips', ['fish and chips', 'fish_and_chips']],
  ['shepherds-pie', 'shepherds pie', ['shepherd', 'cottage pie']],
  ['burrito-haricots', 'burrito', ['burrito']],
  ['poke-bowl-saumon', 'poke bowl salmon', ['poke']],
  ['gyoza-legumes', 'gyoza', ['gyoza', 'jiaozi']],
  ['goulash-hongrois', 'goulash', ['goulash', 'gulyas', 'gulasch']],
  ['saumon-gravlax', 'gravlax', ['gravlax', 'gravad']],
  ['potjevleesch', 'potjevleesch', ['potjevleesch', 'potjevlees']],
  ['kig-ha-farz', 'kig ha farz', ['kig']],
  ['tripes-caen-allegees', 'tripes mode de caen', ['tripe']],
  ['rillettes-tours-tartine', 'rillettes', ['rillettes']],
  ['poulet-basquaise-nord', 'fricassee poulet champignons', ['fricassee']],
]

const API = 'https://commons.wikimedia.org/w/api.php'
const ENTETES = {
  // Wikimedia exige un User-Agent identifiant l'outil et un contact ; les
  // requêtes anonymes sont refusées ou fortement limitées.
  'User-Agent': 'Mamakilo/1.0 (https://mamakilo.vercel.app; application de suivi diététique)',
}

async function json(url) {
  const reponse = await fetch(url, { headers: ENTETES })
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
  return reponse.json()
}

function texteDe(champ) {
  if (!champ?.value) return ''
  // Les métadonnées de Commons sont du HTML : on en retire les balises plutôt
  // que de les laisser filer jusque dans l'interface.
  return String(champ.value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Les crédits déjà écrits, relus avant d'écraser le fichier.
 *
 * Sans cette relecture, une exécution partielle — une coupure réseau, un 429 de
 * Wikimedia — laissait sur le disque des images dont l'attribution venait de
 * disparaître du code. Une photo sous CC BY sans son auteur n'est plus une photo
 * libre, c'est une contrefaçon : la fusion n'est pas un confort, c'est ce qui rend
 * le script sûr à relancer.
 */
async function creditsExistants() {
  if (!existsSync(SORTIE)) return new Map()
  const texte = await readFile(SORTIE, 'utf8')
  const entrees = new Map()
  const motif =
    /'([^']+)':\s*\{\s*fichier:\s*'([^']*)',\s*(?:mini:\s*'([^']*)',\s*)?auteur:\s*'((?:[^'\\]|\\.)*)',\s*licence:\s*'((?:[^'\\]|\\.)*)',\s*source:\s*'((?:[^'\\]|\\.)*)'\s*\}/g
  for (const trouve of texte.matchAll(motif)) {
    const [, id, fichier, mini, auteur, licence, source] = trouve
    const desechappe = (s) => s.replace(/\\'/g, "'").replace(/\\\\/g, '\\')
    entrees.set(id, {
      id,
      fichier,
      mini: mini || undefined,
      auteur: desechappe(auteur),
      licence: desechappe(licence),
      page: desechappe(source),
    })
  }
  return entrees
}

/**
 * Les titres qui décrivent autre chose que le plat fini.
 *
 * Écrit après avoir regardé le résultat : la carbonade avait hérité de
 * « Ingredients carbonade.png », une photo d'oignons crus et d'une bouteille de
 * bière. Le titre contenait bien « carbonade », le filtre était donc satisfait, et
 * l'écran promettait un plat qu'on n'obtiendrait jamais — exactement le défaut que
 * la règle « une vignette fausse est pire que pas de vignette » vise.
 *
 * `bereiding` et `tijdens` sont là parce que Commons est largement néerlandophone
 * sur les plats belges : « pendant la préparation ».
 */
const TITRES_A_ECARTER =
  /ingredient|ingr[ée]dient|bereiding|tijdens|pr[ée]paration|preparing|raw |crue?\b|recipe|recette|etape|[ée]tape|step \d|montage|cuisson|cooking|package|packaging|logo|menu |carte |restaurant |enseigne/i

/**
 * Cherche la meilleure image d'un plat.
 *
 * « La meilleure » et non « la première » : l'API classe par pertinence textuelle,
 * ce qui met en tête le fichier dont le nom colle le mieux — pas celui qui montre
 * le plat. On parcourt donc tous les candidats recevables et on garde le plus
 * grand, la définition étant le seul indice de qualité dont on dispose sans
 * regarder l'image.
 */
async function trouver(requete, attendus) {
  const url =
    `${API}?action=query&format=json&origin=*&generator=search` +
    `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${requete}`)}` +
    `&gsrnamespace=6&gsrlimit=25&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=${LARGEUR}`

  const donnees = await json(url)
  const pages = Object.values(donnees?.query?.pages ?? {})
  const recevables = []

  for (const page of pages) {
    const titre = String(page.title ?? '').toLowerCase().replace(/_/g, ' ')
    if (!attendus.some((mot) => titre.includes(mot.toLowerCase()))) continue
    if (TITRES_A_ECARTER.test(titre)) continue

    const info = page.imageinfo?.[0]
    if (!info?.thumburl) continue
    // Sous 800 px, c'est presque toujours une vieille image, un schéma ou une
    // capture — et la vignette de fiche en fait déjà 640.
    if ((info.width ?? 0) < 800) continue

    const meta = info.extmetadata ?? {}
    const licence = texteDe(meta.LicenseShortName)
    if (!LICENCES_OK.test(licence)) continue

    recevables.push({
      largeur: info.width,
      url: info.thumburl,
      licence,
      auteur: texteDe(meta.Artist) || 'Auteur non précisé',
      page: info.descriptionurl,
      fichier: page.title,
    })
  }

  if (recevables.length === 0) return null
  recevables.sort((a, b) => b.largeur - a.largeur)
  return recevables[0]
}

/**
 * L'URL d'une autre taille pour un fichier déjà choisi.
 *
 * Un second appel à l'API plutôt qu'une réécriture de l'URL : Commons ne sert que
 * ses paliers, et forcer une largeur dans le chemin répond 400 (essayé, et tous
 * les téléchargements avaient échoué d'un coup). L'API, elle, sait quel palier
 * existe.
 */
async function autreTaille(titreFichier, largeur) {
  const url =
    `${API}?action=query&format=json&titles=${encodeURIComponent(titreFichier)}` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=${largeur}`
  const donnees = await json(url)
  const page = Object.values(donnees?.query?.pages ?? {})[0]
  return page?.imageinfo?.[0]?.thumburl ?? null
}

async function telecharger(url, destination) {
  const reponse = await fetch(url, { headers: ENTETES })
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
  await writeFile(destination, Buffer.from(await reponse.arrayBuffer()))
}

function echapper(texte) {
  return texte.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function principal() {
  const refaire = process.argv.includes('--refaire')
  await mkdir(DOSSIER, { recursive: true })
  await mkdir(DOSSIER_MINI, { recursive: true })

  const credits = await creditsExistants()
  let recuperees = 0
  let ignorees = 0

  for (const [id, requete, attendus] of PLATS) {
    const fichier = path.join(DOSSIER, `${id}.jpg`)

    // Une image présente **et** créditée n'a rien à refaire. Présente sans crédit,
    // en revanche, elle repasse : c'est le trou qu'une exécution interrompue laisse.
    if (!refaire && existsSync(fichier) && credits.has(id)) {
      console.log(`· ${id} — déjà là`)
      continue
    }

    try {
      const trouve = await trouver(requete, attendus)
      if (!trouve) {
        console.log(`✗ ${id} — rien de convaincant, on garde l’illustration générée`)
        ignorees++
        continue
      }
      await telecharger(trouve.url, fichier)

      // La vignette de liste. Son absence n'est pas bloquante : l'écran retombe
      // sur la grande image, moins efficace mais juste.
      let mini
      try {
        const urlMini = await autreTaille(trouve.fichier, LARGEUR_MINI)
        if (urlMini) {
          await telecharger(urlMini, path.join(DOSSIER_MINI, `${id}.jpg`))
          mini = `/plats/mini/${id}.jpg`
        }
      } catch {
        console.log(`  (pas de vignette pour ${id}, la grande image servira)`)
      }

      credits.set(id, { id, fichier: `/plats/${id}.jpg`, mini, ...trouve })
      recuperees++
      console.log(`✓ ${id} — ${trouve.licence} — ${trouve.auteur.slice(0, 40)}`)
    } catch (erreur) {
      console.log(`✗ ${id} — ${erreur.message}`)
      ignorees++
    }

    await new Promise((r) => setTimeout(r, PAUSE))
  }

  // Un crédit sans image sur le disque ne sert à rien, et une image sans crédit ne
  // doit pas être publiée : on n'écrit que l'intersection, et on signale l'écart.
  const presents = new Set(
    (await readdir(DOSSIER)).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, '')),
  )
  const orphelines = [...presents].filter((id) => !credits.has(id))
  if (orphelines.length > 0) {
    console.log(
      `\n⚠ ${orphelines.length} image(s) sans attribution, donc non publiées : ${orphelines.join(', ')}`,
    )
    console.log('  Relancez le script pour les recréditer, ou supprimez-les de public/plats/.')
  }

  const lignes = [...credits.values()]
    .filter((c) => presents.has(c.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (c) =>
        `  '${c.id}': { fichier: '/plats/${c.id}.jpg', ${c.mini ? `mini: '${c.mini}', ` : ''}auteur: '${echapper(c.auteur)}', licence: '${echapper(c.licence)}', source: '${echapper(c.page)}' },`,
    )

  const entete = `/**
 * Les photos des plats emblématiques, et leur attribution.
 *
 * **Fichier généré par \`outils/photos.mjs\` — ne pas l'éditer à la main.**
 *
 * Chaque image vient de Wikimedia Commons sous une licence libre. L'attribution
 * n'est pas une politesse : c'est la condition d'usage des licences CC BY et
 * CC BY-SA, et elle doit rester affichée sous l'image. Retirer \`CreditPhoto\` de
 * la fiche mettrait le projet en défaut.
 *
 * Seules les recettes écrites à la main en ont une. Les recettes composées gardent
 * leur illustration générée : aucune photo ne correspond à un assemblage, et une
 * image qui montre autre chose que ce qu'on va obtenir est un mensonge poli.
 */

export interface PhotoPlat {
  /** L'image de la fiche, environ 640 px de large. */
  fichier: string
  /**
   * La vignette de liste, environ 320 px.
   *
   * Absente, l'écran retombe sur \`fichier\` : c'est juste, seulement gourmand.
   * La liste affiche la photo dans un carré de 48 px, et y servir l'image de la
   * fiche téléchargeait deux cents kilo-octets par ligne.
   */
  mini?: string
  auteur: string
  licence: string
  source: string
}

export const PHOTOS: Record<string, PhotoPlat> = {
`

  await writeFile(SORTIE, `${entete}${lignes.join('\n')}\n}\n`, 'utf8')

  console.log(`\n${recuperees} photo(s) récupérée(s), ${ignorees} sans résultat.`)
  console.log(`Crédits écrits dans ${path.relative(RACINE, SORTIE)}`)
}

principal().catch((erreur) => {
  console.error(erreur)
  process.exit(1)
})
