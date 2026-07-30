import { identifiant } from '../utils'
import { reconnaitreEnseigne } from './enseignes'
import type { ControleTicket, LigneOCR, LigneTicket, TicketLu } from './types'

/**
 * Transformer des lignes d'OCR en ticket exploitable.
 *
 * Tout ce fichier obéit à une règle unique : **ne jamais combler un trou**. Un
 * prix qui ne s'est pas lu reste `null`, un libellé douteux est marqué douteux,
 * une ligne incomprise part dans `ecartees` au lieu de disparaître. La lecture
 * locale se trompe ; ce qui la rend utilisable, ce n'est pas de se tromper
 * moins, c'est que ses erreurs soient visibles.
 *
 * Le garde-fou final est le ticket lui-même : il porte son total imprimé, donc
 * sa propre somme de contrôle (voir `controler`).
 */

/** En dessous, la ligne est présentée à confirmer plutôt qu'enregistrée. */
const SEUIL_CONFIANCE = 0.7

/* ────────────────────────────── Reconnaissance ────────────────────────────── */

/**
 * Un prix en fin de ligne, éventuellement suivi du code de TVA.
 *
 * Les espaces sont tolérés autour de la virgule parce que l'OCR en fabrique :
 * un point décimal imprimé petit se lit régulièrement comme un séparateur de
 * mots, et « 1 , 29 » sans cette tolérance ne serait pas un prix.
 */
const PRIX_FIN = /(-)?\s*(\d{1,4})\s*[.,]\s*(\d{2})\s*(?:€|EUR)?\s*[A-Z]?$/

/** « 3 X 1,15 » — un lot d'articles identiques. */
const MULTIPLE = /^(\d{1,3})\s*[x*]\s*(\d{1,4})\s*[.,]\s*(\d{2})/i

/** « 0,832 kg X 1,99 €/kg » — un produit vendu au poids. */
const POIDS = /^(\d{1,3})\s*[.,]\s*(\d{1,3})\s*(kg|g|l)\s*[x*]\s*(\d{1,4})\s*[.,]\s*(\d{2})/i

const DATE = /(\d{2})\s*[/.\-]\s*(\d{2})\s*[/.\-]\s*(\d{2,4})/
const HEURE = /(\d{1,2})\s*[:h]\s*(\d{2})/i

/**
 * Ce qui n'est pas un produit.
 *
 * Toutes ces mentions sont testées **en début de ligne** : « TOTAL » écarte la
 * ligne de total, mais « EAU TOTAL 1,5L » reste un produit. L'inverse —
 * « TOTAL BLUE 500ML » — est écarté à tort, et c'est pourquoi les lignes
 * écartées restent consultables et repêchables à l'écran.
 */
const DEBUTS_DE_SERVICE = [
  'TOTAL', 'SOUS TOTAL', 'SOUSTOTAL', 'MONTANT', 'NET A PAYER', 'A PAYER', 'RESTE A PAYER',
  'ESPECES', 'CARTE', 'CB ', 'CHEQUE', 'TICKET RESTAURANT', 'RENDU', 'MONNAIE',
  'TVA', 'DONT TVA', 'TAUX', 'HT ', 'TTC', 'CODE', 'AUTORISATION', 'TRANSACTION',
  'NB ', 'NOMBRE', 'ARTICLES', 'NBRE',
  'MERCI', 'AU REVOIR', 'BIENVENUE', 'CONSERVEZ', 'ECHANGE', 'GARANTIE', 'SERVICE CLIENT',
  'CAISSE', 'VENDEUR', 'HOTESSE', 'SIRET', 'RCS', 'TEL', 'HORAIRES', 'MAGASIN',
  'FIDELITE', 'CAGNOTTE', 'AVANTAGE', 'SOLDE', 'POINTS', 'CUMUL', 'CARTE FIDELITE',
  'ECO PART', 'ECOPART', 'EMBALLAGE', 'CONTRIBUTION',
]

/**
 * Ces mentions-là écartent la ligne où qu'elles se trouvent.
 *
 * Volontairement courte : un motif cherché partout se déclenche au milieu d'un
 * libellé. « N° DE » y figurait, et `comparable` en fait « N DE » — ce que
 * contient « JAMBON DE PARIS ».
 */
const PARTOUT_DE_SERVICE = ['WWW.', 'HTTP', '@', 'FACTURE']

const REMISES = ['REMISE', 'REDUCTION', 'RÉDUCTION', 'BON DE', 'AVANTAGE', 'IMMEDIATE', 'OFFERT']

/* ──────────────────────────────── Nettoyage ──────────────────────────────── */

/** Espaces multiples et bords, rien d'autre : le texte lu ne se réécrit pas. */
function nettoyer(texte: string): string {
  return texte.replace(/\s+/g, ' ').trim()
}

/**
 * Pour comparer à un mot-clé : capitales, sans accent.
 *
 * La décomposition NFD détache l'accent de sa lettre, et le filtre qui suit ne
 * garde que ce dont les mots-clés ont besoin — il emporte donc les accents sans
 * qu'aucune plage de caractères combinants ait à être écrite en clair. C'est la
 * précaution déjà prise dans `ingredients.ts` : une telle plage ne survit pas au
 * premier outil qui se trompe d'encodage, et la panne serait silencieuse.
 */
function comparable(texte: string): string {
  return texte
    .normalize('NFD')
    .toUpperCase()
    .replace(/[^A-Z0-9 @.]/g, '')
}

function estService(texte: string): boolean {
  const c = comparable(texte)
  if (PARTOUT_DE_SERVICE.some((mot) => c.includes(mot))) return true
  return DEBUTS_DE_SERVICE.some((mot) => c.startsWith(mot))
}

function estRemise(texte: string): boolean {
  const c = comparable(texte)
  return REMISES.some((mot) => c.includes(comparable(mot)))
}

/**
 * Répare les confusions de l'OCR **dans la zone numérique seulement**.
 *
 * `O` pour zéro et `I` pour un sont les deux erreurs de très loin les plus
 * fréquentes sur un ticket, et aucune des deux lettres n'a de raison d'être
 * dans un prix. Les autres confusions classiques — `S` pour 5, `B` pour 8 — ne
 * sont **pas** corrigées : ces lettres apparaissent légitimement dans les
 * libellés voisins, et une réparation fausse produirait un prix crédible mais
 * inexact, c'est-à-dire l'erreur qu'on ne rattrape jamais.
 *
 * Toute ligne réparée est marquée douteuse : la correction est un pari, et un
 * pari se montre.
 */
function reparerChiffres(texte: string): { texte: string; repare: boolean } {
  const repare = texte.replace(/[OoIl|]/g, (c) => (c === 'O' || c === 'o' ? '0' : '1'))
  return { texte: repare, repare: repare !== texte }
}

interface PrixLu {
  valeur: number
  /** Le texte sans le prix — c'est le libellé. */
  reste: string
  repare: boolean
}

/**
 * Lit le prix en fin de ligne, en tentant une réparation si le premier essai
 * échoue. L'essai sans réparation passe en premier pour ne pas marquer douteuse
 * une ligne qui se lisait parfaitement.
 */
function lirePrixFin(texte: string): PrixLu | null {
  for (const [candidat, repare] of [
    [texte, false],
    [reparerChiffres(texte).texte, true],
  ] as const) {
    const m = PRIX_FIN.exec(candidat)
    if (!m) continue
    // Le montant se recompose en centimes avant d'être ramené en euros : « 3 »
    // et « 78 » additionnés en flottants donnent 3,7800000000000002, qui
    // s'afficherait tel quel et fausserait toute somme non arrondie.
    const centimes = Number(m[2]) * 100 + Number(m[3])
    const valeur = ((m[1] === '-' ? -1 : 1) * centimes) / 100
    // La réparation remplace un caractère par un autre, donc ne déplace aucun
    // index : le libellé se découpe sur le texte d'origine.
    return { valeur, reste: nettoyer(texte.slice(0, m.index)), repare }
  }
  return null
}

/* ─────────────────────────────── En-tête ─────────────────────────────── */

function lireDate(lignes: string[]): string | null {
  for (const ligne of lignes) {
    const m = DATE.exec(ligne)
    if (!m) continue
    const jour = Number(m[1])
    const mois = Number(m[2])
    const anBrut = Number(m[3])
    if (jour < 1 || jour > 31 || mois < 1 || mois > 12) continue
    // Un ticket sur deux écrit l'année sur deux chiffres. « 26 » est 2026 et
    // non 1926 : aucun ticket de caisse photographié ne date du siècle dernier.
    const an = anBrut < 100 ? 2000 + anBrut : anBrut
    return `${an}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
  }
  return null
}

function lireHeure(lignes: string[]): string | null {
  for (const ligne of lignes) {
    const m = HEURE.exec(ligne)
    if (!m) continue
    const heures = Number(m[1])
    const minutes = Number(m[2])
    if (heures > 23 || minutes > 59) continue
    return `${String(heures).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  return null
}

/**
 * Le total imprimé.
 *
 * On retient **la dernière** mention plutôt que la première : les tickets qui
 * portent un sous-total, puis une remise, puis le total réellement payé les
 * écrivent dans cet ordre, et retenir la première comparerait l'addition des
 * lignes à un montant d'avant remise.
 */
function lireTotal(lignes: string[]): number | null {
  let retenu: number | null = null

  for (const ligne of lignes) {
    const c = comparable(ligne)
    const estTotal =
      (c.startsWith('TOTAL') && !c.startsWith('TOTAL TVA')) ||
      c.startsWith('NET A PAYER') ||
      c.startsWith('A PAYER') ||
      c.startsWith('MONTANT DU')
    if (!estTotal || c.startsWith('SOUS')) continue

    const prix = lirePrixFin(ligne)
    if (prix && prix.valeur > 0) retenu = prix.valeur
  }

  return retenu
}

/* ──────────────────────────────── Analyse ──────────────────────────────── */

/**
 * Pose le prix d'une ligne et **recalcule** son doute.
 *
 * Le recalcul est le point important. Un produit vendu au poids ou en lot
 * s'imprime sur deux lignes : le libellé seul, puis le détail de calcul qui
 * porte le prix. Le libellé est donc marqué douteux au moment où il est lu — il
 * n'a pas de prix — et rien ne levait ce doute quand la ligne suivante le
 * comblait. Sur un ticket ordinaire, tous les fruits et tous les lots
 * ressortaient à confirmer, et un signal qui se déclenche partout ne distingue
 * plus rien.
 */
function poserPrix(ligne: LigneTicket, valeur: number, repare: boolean): void {
  ligne.prixPaye = valeur
  ligne.douteuse = repare || ligne.confiance < SEUIL_CONFIANCE
}

function nouvelleLigne(libelle: string, brut: string, confiance: number): LigneTicket {
  return {
    id: identifiant('t'),
    libelle,
    quantite: 1,
    unite: 'piece',
    prixUnitaire: null,
    prixPaye: null,
    remise: 0,
    confiance,
    brut,
    douteuse: confiance < SEUIL_CONFIANCE,
  }
}

/**
 * Lignes d'OCR → ticket.
 *
 * Les lignes de quantité (« 3 X 1,15 ») et de remise ne créent pas d'entrée :
 * elles complètent la précédente. C'est la structure réelle des tickets
 * français, où le libellé et son détail de calcul sont deux lignes imprimées
 * pour un seul produit acheté.
 */
export function analyserTicket(lignesOCR: LigneOCR[]): TicketLu {
  const textes = lignesOCR.map((l) => nettoyer(l.texte)).filter((t) => t.length > 0)

  const lignes: LigneTicket[] = []
  const ecartees: string[] = []
  let remisesGlobales = 0

  const derniere = (): LigneTicket | null => lignes[lignes.length - 1] ?? null

  for (const brute of lignesOCR) {
    const texte = nettoyer(brute.texte)
    if (!texte) continue

    const precedente = derniere()

    /* Une remise complète le produit qui la précède. Le prix affiché sur la
       ligne produit est celui d'avant remise : c'est le total du ticket qui
       tient compte de l'avantage, donc le prix réellement payé aussi. */
    if (estRemise(texte)) {
      const prix = lirePrixFin(texte)
      const montant = prix ? Math.abs(prix.valeur) : 0
      if (montant === 0) {
        ecartees.push(texte)
      } else if (precedente && precedente.prixPaye !== null) {
        precedente.remise += montant
        precedente.prixPaye = arrondir(precedente.prixPaye - montant)
      } else {
        remisesGlobales = arrondir(remisesGlobales + montant)
      }
      continue
    }

    /* Un détail de calcul complète le produit du dessus. Orphelin — première
       ligne lisible du ticket, produit au-dessus perdu par l'OCR — il est
       écarté plutôt que promu : sans son libellé, « 2 X 1,15 » deviendrait un
       produit nommé « 2 X », qui polluerait l'historique de prix sans jamais
       pouvoir se rapprocher de quoi que ce soit. */
    const poids = POIDS.exec(texte)
    if (poids) {
      if (!precedente) {
        ecartees.push(texte)
        continue
      }
      precedente.quantite = Number(`${poids[1]}.${poids[2]}`)
      precedente.unite = poids[3].toLowerCase() === 'l' ? 'l' : 'kg'
      precedente.prixUnitaire = Number(`${poids[4]}.${poids[5]}`)
      appliquerTotalLigne(precedente, texte)
      continue
    }

    const multiple = MULTIPLE.exec(texte)
    if (multiple) {
      if (!precedente) {
        ecartees.push(texte)
        continue
      }
      precedente.quantite = Number(multiple[1])
      precedente.prixUnitaire = Number(`${multiple[2]}.${multiple[3]}`)
      appliquerTotalLigne(precedente, texte)
      continue
    }

    if (estService(texte)) {
      ecartees.push(texte)
      continue
    }

    const prix = lirePrixFin(texte)
    const libelle = prix ? prix.reste : texte

    /* Une ligne sans libellé porte un prix seul : c'est la colonne de droite
       que l'analyse de mise en page a détachée de la colonne des libellés.
       Elle appartient au produit juste au-dessus, s'il attend encore un prix. */
    if (libelle.length < 2) {
      if (prix && precedente && precedente.prixPaye === null) {
        poserPrix(precedente, prix.valeur, prix.repare)
      } else {
        ecartees.push(texte)
      }
      continue
    }

    const ligne = nouvelleLigne(libelle, texte, brute.confiance)
    if (prix) {
      poserPrix(ligne, prix.valeur, prix.repare)
    } else {
      // Un produit sans prix n'est pas enregistrable : c'est exactement ce que
      // l'écran de correction doit mettre en avant.
      ligne.douteuse = true
    }
    lignes.push(ligne)
  }

  return {
    enseigne: reconnaitreEnseigne(textes)?.id ?? null,
    date: lireDate(textes),
    heure: lireHeure(textes),
    lignes: elaguerHorsBloc(lignes, ecartees),
    total: lireTotal(textes),
    remisesGlobales,
    ecartees,
  }
}

/**
 * Écarte les lignes sans prix situées **hors du bloc des produits**.
 *
 * L'adresse du magasin, le numéro de caisse et la formule de politesse ne
 * portent pas de prix et ne ressemblent à aucun mot-clé de service : sans cette
 * passe, « 75011 PARIS » devient un produit dont le prix reste à saisir, et le
 * contrôle du ticket échoue sur une ligne qui n'a jamais été achetée.
 *
 * Le bloc est délimité par le premier et le dernier prix lus. Une ligne sans
 * prix **à l'intérieur** est conservée telle quelle : là, c'est bien un produit
 * dont le prix a échappé à l'OCR, et c'est exactement ce que l'écran de
 * correction doit montrer.
 *
 * Les lignes retirées rejoignent les écartées, donc restent repêchables — mais
 * en fin de liste, l'ordre du ticket n'y étant pas reconstitué.
 */
function elaguerHorsBloc(lignes: LigneTicket[], ecartees: string[]): LigneTicket[] {
  const premier = lignes.findIndex((l) => l.prixPaye !== null)
  // Aucun prix lu du tout : la photo est probablement illisible. On ne jette
  // rien, l'écran dira que la lecture a échoué.
  if (premier === -1) return lignes

  let dernier = premier
  for (let i = lignes.length - 1; i > premier; i--) {
    if (lignes[i].prixPaye !== null) {
      dernier = i
      break
    }
  }

  return lignes.filter((ligne, i) => {
    if (ligne.prixPaye !== null || (i > premier && i < dernier)) return true
    ecartees.push(ligne.brut)
    return false
  })
}

/**
 * Pose le prix de la ligne à partir de son détail de calcul.
 *
 * Le total imprimé en bout de ligne fait foi quand il existe. Sinon, le produit
 * de la quantité par le prix unitaire est **une addition, pas une invention** —
 * les deux facteurs viennent du ticket, et la règle du projet est qu'une valeur
 * affichée doit pouvoir s'expliquer par un calcul lisible.
 */
function appliquerTotalLigne(ligne: LigneTicket, texte: string): void {
  const prix = lirePrixFin(texte)
  if (prix && prix.valeur > 0) {
    poserPrix(ligne, prix.valeur, prix.repare)
    return
  }
  if (ligne.prixUnitaire !== null) {
    poserPrix(ligne, arrondir(ligne.quantite * ligne.prixUnitaire), false)
  }
}

/** Les centimes sont la seule précision qui existe sur un ticket. */
function arrondir(valeur: number): number {
  return Math.round(valeur * 100) / 100
}

/* ──────────────────────────────── Contrôle ──────────────────────────────── */

/**
 * Confronte l'addition des lignes au total imprimé.
 *
 * C'est le seul contrôle disponible sans reprendre la photo, et il suffit :
 * une ligne oubliée, un chiffre mal lu ou une réparation malheureuse déplacent
 * la somme, donc se voient. Un ticket qui retombe juste a été lu correctement —
 * pas « probablement », exactement.
 */
export function controler(ticket: TicketLu): ControleTicket {
  const somme = arrondir(
    ticket.lignes.reduce((cumul, ligne) => cumul + (ligne.prixPaye ?? 0), 0) -
      ticket.remisesGlobales,
  )
  const sansPrix = ticket.lignes.filter((l) => l.prixPaye === null).length
  const ecart = ticket.total === null ? null : arrondir(somme - ticket.total)

  return {
    somme,
    total: ticket.total,
    ecart,
    sansPrix,
    // Un centime de tolérance : les arrondis de TVA font couramment varier le
    // total imprimé de cet ordre, et refuser pour ça enverrait corriger un
    // ticket parfaitement lu.
    coherent: ecart !== null && Math.abs(ecart) <= 0.01 && sansPrix === 0,
  }
}

/** Les lignes qui demandent une décision, dans l'ordre du ticket. */
export function lignesACorriger(ticket: TicketLu): LigneTicket[] {
  return ticket.lignes.filter((l) => l.douteuse || l.prixPaye === null)
}
