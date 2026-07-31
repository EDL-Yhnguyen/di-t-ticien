#!/usr/bin/env node
/**
 * Rapatrie Faustina et Figtree depuis Google Fonts, une fois pour toutes.
 *
 * ## Pourquoi elles ne restent pas chez Google
 *
 * Le projet a déjà tranché cette question deux fois, pour d'autres fichiers.
 * Le `.wasm` de zxing est servi « depuis notre domaine (et non depuis un CDN)
 * pour que le service worker le mette en cache » ; le moteur OCR et son modèle
 * français aussi, « parce qu'un ticket se photographie dans un magasin sans
 * réseau ». Les polices étaient les dernières à faire exception, et elles y
 * ajoutaient un problème que les autres n'avaient pas.
 *
 * **Charger une police depuis `fonts.gstatic.com` transmet l'adresse IP du
 * visiteur à Google.** Une adresse IP est une donnée personnelle, Google est
 * alors un destinataire, et le RGPD demande qu'un destinataire soit déclaré
 * (art. 13). Or `DESTINATAIRES` dans `src/lib/legal.ts` n'a jamais listé Google :
 * la politique de confidentialité de l'application était donc incomplète, sur un
 * site qui traite des données de santé. Le tribunal régional de Munich l'a jugé
 * en janvier 2022 (LG München I, 3 O 17493/20) — l'intégration de Google Fonts
 * sans consentement y a été condamnée sur ce seul fondement.
 *
 * Deux façons de refermer l'écart : déclarer Google, ou cesser de l'appeler. La
 * seconde est la bonne, parce qu'elle règle en même temps deux autres choses :
 *
 * - **Le premier affichage cesse de dépendre d'un tiers.** La feuille de style
 *   de Google bloquait le rendu : résolution DNS, poignée de main TLS, puis la
 *   CSS, puis seulement les `.woff2`, sur une origine que rien n'avait
 *   préchargée. Servies depuis notre domaine, les polices arrivent sur la
 *   connexion déjà ouverte.
 * - **L'hors-ligne devient complet dès la première visite.** Le service worker
 *   gardait bien les réponses de Google en cache, mais il fallait les avoir
 *   obtenues une fois. Une PWA installée dans le métro n'avait pas ses polices.
 *
 * ## Le droit de les héberger
 *
 * Faustina (Omnibus-Type) et Figtree (Erik Kennedy) sont toutes deux sous
 * **SIL Open Font License 1.1**, qui autorise explicitement la redistribution.
 * La licence est recopiée dans `public/polices/OFL-Faustina.txt` et
 * `public/polices/OFL-Figtree.txt` — c'est la contrepartie, et elle n'est pas
 * plus négociable que l'attribution des photos de Commons. Le script refuse de
 * réussir si elles manquent ou si leur contenu ne ressemble pas à l'OFL.
 *
 * ## Ce que le script écrit
 *
 * - `public/polices/*.woff2` — les fichiers, servis depuis notre domaine.
 * - `src/polices.css` — les `@font-face`, **fichier généré, à ne pas éditer**,
 *   sur le modèle de `src/palettes.css`.
 *
 * Les `unicode-range` sont recopiées telles que Google les publie : ce sont
 * elles qui font que le navigateur ne télécharge `latin-ext` que s'il rencontre
 * un caractère qui s'y trouve. Les réécrire à la main reviendrait à parier sur
 * le contenu des fichiers.
 *
 * Le sous-ensemble vietnamien est écarté : l'application est en français, son
 * catalogue nomme des plats du monde en alphabet latin, et deux fichiers de
 * plus ne servent aucune de ses chaînes.
 *
 * Usage :
 *   node outils/polices.mjs             télécharge ce qui manque
 *   node outils/polices.mjs --refaire   retélécharge tout
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOSSIER = join(RACINE, 'public', 'polices')
const FEUILLE = join(RACINE, 'src', 'polices.css')

const REQUETE = 'https://fonts.googleapis.com/css2?family=Faustina:wght@400..700&family=Figtree:wght@400..900&display=swap'

/**
 * Google ne sert les `woff2` qu'aux navigateurs qui les acceptent : sans cet
 * en-tête il renvoie du `ttf`, quatre fois plus lourd. C'est le seul endroit du
 * projet où l'on se présente comme un navigateur, et c'est pour obtenir le bon
 * format, pas pour contourner quoi que ce soit.
 */
const NAVIGATEUR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** Les sous-ensembles qu'on garde, dans l'ordre où on veut les écrire. */
const SOUS_ENSEMBLES = ['latin', 'latin-ext']

const refaire = process.argv.includes('--refaire')

/**
 * Découpe la feuille de Google en blocs `@font-face`, avec le commentaire de
 * sous-ensemble qui les précède. C'est ce commentaire — `/* latin *\/` — qui dit
 * à quoi correspond chaque `unicode-range` ; il n'existe aucun autre marqueur.
 */
function lireBlocs(css) {
  const blocs = []
  const motif = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g
  for (const m of css.matchAll(motif)) {
    const corps = m[2]
    const famille = /font-family:\s*'([^']+)'/.exec(corps)?.[1]
    const graisse = /font-weight:\s*([^;]+);/.exec(corps)?.[1].trim()
    const url = /url\((https:\/\/[^)]+\.woff2)\)/.exec(corps)?.[1]
    const plage = /unicode-range:\s*([^;]+);/.exec(corps)?.[1].trim()
    if (famille && graisse && url && plage) {
      blocs.push({ sousEnsemble: m[1], famille, graisse, url, plage })
    }
  }
  return blocs
}

async function telecharger(url, destination) {
  if (existsSync(destination) && !refaire) return false
  const reponse = await fetch(url)
  if (!reponse.ok) throw new Error(`${reponse.status} sur ${url}`)
  await writeFile(destination, Buffer.from(await reponse.arrayBuffer()))
  return true
}

async function principal() {
  await mkdir(DOSSIER, { recursive: true })

  const reponse = await fetch(REQUETE, { headers: { 'User-Agent': NAVIGATEUR } })
  if (!reponse.ok) throw new Error(`Google Fonts a répondu ${reponse.status}`)

  const blocs = lireBlocs(await reponse.text()).filter((b) =>
    SOUS_ENSEMBLES.includes(b.sousEnsemble),
  )

  if (blocs.length !== SOUS_ENSEMBLES.length * 2) {
    // Deux familles × deux sous-ensembles. Si le compte n'y est pas, Google a
    // changé le découpage de ses feuilles et la génération silencieuse
    // produirait une police manquante, visible seulement à l'écran.
    throw new Error(`${blocs.length} blocs trouvés, 4 attendus — vérifier la feuille de Google.`)
  }

  const regles = []
  for (const bloc of blocs) {
    const nom = `${bloc.famille.toLowerCase()}-${bloc.sousEnsemble}.woff2`
    const neuf = await telecharger(bloc.url, join(DOSSIER, nom))
    console.log(`${neuf ? '↓' : '·'} ${nom}`)
    regles.push(
      [
        '@font-face {',
        `  font-family: '${bloc.famille}';`,
        '  font-style: normal;',
        `  font-weight: ${bloc.graisse};`,
        // `swap` et non `optional` : le texte doit être lisible tout de suite,
        // quitte à changer de dessin une fois la police arrivée. Sur une
        // application qu'on ouvre pour noter un repas, attendre une police
        // devant un écran vide serait le pire des deux.
        '  font-display: swap;',
        `  src: url('/polices/${nom}') format('woff2');`,
        `  unicode-range: ${bloc.plage};`,
        '}',
      ].join('\n'),
    )
  }

  const entete = [
    '/*',
    ' * Fichier généré par outils/polices.mjs — ne pas éditer à la main.',
    ' *',
    ' * Faustina et Figtree, servies depuis notre domaine plutôt que depuis Google :',
    ' * une police chargée depuis fonts.gstatic.com transmet l’adresse IP du visiteur',
    ' * à un tiers que la politique de confidentialité ne déclare pas, et fait dépendre',
    ' * le premier affichage d’une origine que rien n’a préchargée.',
    ' *',
    ' * Les deux sont sous SIL Open Font License 1.1 — voir public/polices/OFL-*.txt.',
    ' */',
    '',
  ].join('\n')

  await writeFile(FEUILLE, `${entete}${regles.join('\n\n')}\n`)
  console.log(`\n${regles.length} @font-face écrits dans src/polices.css`)

  await controlerLicences()
}

/**
 * La licence doit accompagner les fichiers, et le contrôle doit être plus
 * exigeant qu'un `existsSync`.
 *
 * Le premier jet a téléchargé une page « 404: Not Found » de quatorze octets
 * depuis une URL périmée, et l'a annoncée comme « licence présente ». Un fichier
 * nommé `OFL.txt` qui ne contient pas la licence est pire que pas de fichier :
 * il fait croire que la question est réglée. On vérifie donc que le texte est de
 * la bonne taille **et** qu'il porte les mentions de l'OFL.
 */
async function controlerLicences() {
  const attendues = ['OFL-Faustina.txt', 'OFL-Figtree.txt']
  const manquantes = []

  for (const nom of attendues) {
    const chemin = join(DOSSIER, nom)
    if (!existsSync(chemin)) {
      manquantes.push(`${nom} : absent`)
      continue
    }
    const texte = await readFile(chemin, 'utf8')
    if (texte.length < 3000 || !texte.includes('SIL OPEN FONT LICENSE')) {
      manquantes.push(`${nom} : ${texte.length} octets, ne ressemble pas à l’OFL`)
    }
  }

  if (manquantes.length > 0) {
    console.error('\n⚠  La licence doit accompagner les fichiers :')
    for (const ligne of manquantes) console.error(`   ${ligne}`)
    console.error('   Source : https://github.com/google/fonts/tree/main/ofl/<famille>/OFL.txt')
    process.exit(1)
  }

  console.log('Licences OFL présentes pour les deux familles.')
}

principal().catch((erreur) => {
  console.error(erreur.message)
  process.exit(1)
})
