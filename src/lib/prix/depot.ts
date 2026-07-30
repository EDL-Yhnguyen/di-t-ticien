import { cleIngredient } from '../ingredients'
import { identifiant } from '../utils'
import type { LigneTicket, TicketLu } from '../ticket/types'

/**
 * Où vivent les relevés de prix — et pourquoi pas dans le document de
 * l'utilisateur.
 *
 * Tout le reste de Mamakilo tient dans **un seul document `jsonb` par compte**,
 * et ce choix est justifié dans `CLAUDE.md` par une phrase : « le volume est
 * minuscule ». Les prix cassent cette prémisse. Une famille photographie
 * quatre tickets par semaine, d'une vingtaine de lignes : environ cinq mille
 * relevés par an, soit près d'un mégaoctet.
 *
 * Or `modifier()` fait un `structuredClone` du document **entier** à chaque
 * écriture, et `enregistrer()` le renvoie **entier** à Supabase. Un document
 * d'un mégaoctet, c'est une latence à chaque case cochée dans la liste de
 * courses — sur l'écran qu'on utilise debout dans un rayon, une main occupée.
 *
 * D'où cette exception, et sa forme : **le détail vit en local, seuls les
 * agrégats remonteront dans le document**. Un relevé brut n'a d'intérêt que
 * pour recalculer une moyenne ; il n'a pas besoin de suivre l'utilisateur d'un
 * appareil à l'autre. Sa disparition avec le navigateur coûte l'historique
 * fin, pas la fonctionnalité.
 */

const BASE = 'mamakilo-prix'
const VERSION = 1
const RELEVES = 'releves'
const TICKETS = 'tickets'

/** Un prix constaté, pour un produit, dans une enseigne, un jour donné. */
export interface Releve {
  id: string
  ticketId: string
  /**
   * À qui appartient ce relevé.
   *
   * En mode démo, plusieurs comptes partagent le même navigateur — donc la même
   * base IndexedDB, qui est cloisonnée par origine et non par compte. Sans ce
   * champ, les prix d'un compte apparaîtraient dans l'historique d'un autre.
   */
  utilisateur: string
  /** Le libellé imprimé sur le ticket, après correction éventuelle. */
  libelle: string
  /**
   * La forme de rapprochement du libellé, calculée par `cleIngredient` —
   * la même que celle de la liste de courses, pour que « Carottes » et
   * « Carotte » soient un seul produit ici comme là-bas.
   */
  cle: string
  /** L'identifiant d'enseigne, ou `null` si elle n'a pas été reconnue. */
  enseigne: string | null
  /** Date ISO du ticket. */
  date: string
  quantite: number
  unite: LigneTicket['unite']
  /** Le prix au kilo ou à l'unité, quand le ticket le détaillait. */
  prixUnitaire: number | null
  /** Ce qui a été payé pour la ligne, remise déduite. */
  prixPaye: number
  /**
   * Le prix ramené à l'unité de comparaison.
   *
   * C'est **le seul chiffre comparable d'un ticket à l'autre** : deux paquets
   * de riz à 2,10 € et 3,40 € ne disent rien tant qu'on ignore que l'un fait
   * 500 g et l'autre un kilo. Calculé ici plutôt qu'à la lecture pour que la
   * règle soit unique.
   */
  prixParUnite: number
}

/** L'en-tête d'un ticket enregistré, pour pouvoir remonter à sa source. */
export interface TicketEnregistre {
  id: string
  utilisateur: string
  enseigne: string | null
  date: string
  heure: string | null
  total: number | null
  nombreLignes: number
  enregistreLe: string
}

/* ─────────────────────────────── Ouverture ─────────────────────────────── */

let ouverture: Promise<IDBDatabase> | null = null

function ouvrir(): Promise<IDBDatabase> {
  if (ouverture) return ouverture

  ouverture = new Promise((resoudre, rejeter) => {
    const demande = indexedDB.open(BASE, VERSION)

    demande.onupgradeneeded = () => {
      const base = demande.result

      if (!base.objectStoreNames.contains(RELEVES)) {
        const magasin = base.createObjectStore(RELEVES, { keyPath: 'id' })
        // Les trois questions posées à cet historique : « ce produit, chez qui
        // et à quel prix », « qu'ai-je acheté chez eux », « qu'ai-je payé ce
        // jour-là ». Sans index, chacune parcourrait tous les relevés.
        magasin.createIndex('cle', 'cle')
        magasin.createIndex('enseigne', 'enseigne')
        magasin.createIndex('ticketId', 'ticketId')
      }

      if (!base.objectStoreNames.contains(TICKETS)) {
        base.createObjectStore(TICKETS, { keyPath: 'id' })
      }
    }

    demande.onsuccess = () => resoudre(demande.result)
    demande.onerror = () => rejeter(demande.error ?? new Error('IndexedDB indisponible.'))
    // Navigation privée sur certains navigateurs : la demande reste bloquée
    // sans jamais échouer. Sans ce garde-fou, l'écran attendrait indéfiniment.
    demande.onblocked = () => rejeter(new Error('La base locale est bloquée par un autre onglet.'))
  })

  // Une ouverture ratée ne doit pas se mettre en cache : la cause est souvent
  // passagère (un autre onglet en cours de migration), et rejouer doit pouvoir
  // réussir.
  ouverture.catch(() => {
    ouverture = null
  })

  return ouverture
}

function transaction<T>(
  magasins: string[],
  mode: IDBTransactionMode,
  travail: (t: IDBTransaction) => T,
): Promise<T> {
  return ouvrir().then(
    (base) =>
      new Promise<T>((resoudre, rejeter) => {
        const t = base.transaction(magasins, mode)
        const resultat = travail(t)
        t.oncomplete = () => resoudre(resultat)
        t.onerror = () => rejeter(t.error ?? new Error("L'écriture locale a échoué."))
        t.onabort = () => rejeter(t.error ?? new Error("L'écriture locale a été annulée."))
      }),
  )
}

/**
 * Une lecture, résolue sur la requête elle-même et non sur la transaction.
 *
 * Faire l'inverse rendrait une promesse enveloppée dans une promesse : la
 * transaction se termine bien après la requête, mais elle ne rend que ce que
 * son travail a retourné. Le code marchait — `await` déplie — et se relisait
 * mal, ce qui est le pire des deux mondes pour une couche de stockage.
 */
function lire<T>(
  magasin: string,
  cibler: (m: IDBObjectStore) => IDBRequest<T[]>,
): Promise<T[]> {
  return ouvrir().then(
    (base) =>
      new Promise<T[]>((resoudre, rejeter) => {
        const demande = cibler(base.transaction([magasin], 'readonly').objectStore(magasin))
        demande.onsuccess = () => resoudre(demande.result)
        demande.onerror = () => rejeter(demande.error ?? new Error('Lecture locale impossible.'))
      }),
  )
}

/* ──────────────────────────────── Écriture ──────────────────────────────── */

/**
 * Ramène un prix à son unité de comparaison.
 *
 * Un produit vendu au poids donne directement un prix au kilo. Un produit
 * vendu à la pièce donne un prix à la pièce — et **on ne cherche pas à en
 * déduire un prix au kilo** en lisant « 200G » dans le libellé : la
 * contenance imprimée sur un ticket est abrégée de vingt façons selon
 * l'enseigne, et une seule lecture ratée sur « 1L » contre « 1KG » donnerait un
 * écart de prix imaginaire que l'application présenterait comme une économie.
 */
function ramenerALUnite(ligne: LigneTicket, prixPaye: number): number {
  if (ligne.unite !== 'piece' && ligne.quantite > 0) {
    return Math.round((prixPaye / ligne.quantite) * 100) / 100
  }
  const parPiece = ligne.quantite > 0 ? prixPaye / ligne.quantite : prixPaye
  return Math.round(parPiece * 100) / 100
}

/**
 * Enregistre un ticket corrigé et ses relevés.
 *
 * Les lignes sans prix sont **écartées silencieusement** : elles n'ont pas de
 * valeur à enregistrer, et l'écran de correction les a déjà présentées une par
 * une. Le compte rendu dit combien de relevés sont réellement entrés, pour que
 * l'écart avec le nombre de lignes se voie.
 */
export async function enregistrerTicket(
  ticket: TicketLu,
  utilisateur: string,
  date: string,
): Promise<{ ticketId: string; releves: number; ignorees: number }> {
  const ticketId = identifiant('tk')
  const retenues = ticket.lignes.filter((l) => l.prixPaye !== null && l.libelle.trim().length > 0)

  const releves: Releve[] = retenues.map((ligne) => {
    const prixPaye = ligne.prixPaye as number
    return {
      id: identifiant('r'),
      ticketId,
      utilisateur,
      libelle: ligne.libelle.trim(),
      cle: cleIngredient(ligne.libelle.trim()),
      enseigne: ticket.enseigne,
      date,
      quantite: ligne.quantite,
      unite: ligne.unite,
      prixUnitaire: ligne.prixUnitaire,
      prixPaye,
      prixParUnite: ramenerALUnite(ligne, prixPaye),
    }
  })

  const entete: TicketEnregistre = {
    id: ticketId,
    utilisateur,
    enseigne: ticket.enseigne,
    date,
    heure: ticket.heure,
    total: ticket.total,
    nombreLignes: releves.length,
    enregistreLe: new Date().toISOString(),
  }

  await transaction([RELEVES, TICKETS], 'readwrite', (t) => {
    // Une seule transaction pour l'en-tête et ses lignes : un ticket
    // à moitié enregistré donnerait des relevés orphelins, impossibles à
    // rattacher à une enseigne ou à supprimer ensemble.
    t.objectStore(TICKETS).put(entete)
    const magasin = t.objectStore(RELEVES)
    for (const releve of releves) magasin.put(releve)
  })

  return { ticketId, releves: releves.length, ignorees: ticket.lignes.length - releves.length }
}

/* ──────────────────────────────── Lecture ──────────────────────────────── */

/** Tous les relevés d'un produit, du plus récent au plus ancien. */
export async function relevesDuProduit(libelle: string, utilisateur: string): Promise<Releve[]> {
  const cle = cleIngredient(libelle.trim())
  const trouves = await lire<Releve>(RELEVES, (m) => m.index('cle').getAll(cle))

  return trouves
    .filter((r) => r.utilisateur === utilisateur)
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Les tickets enregistrés, du plus récent au plus ancien. */
export async function tickets(utilisateur: string): Promise<TicketEnregistre[]> {
  const tous = await lire<TicketEnregistre>(TICKETS, (m) => m.getAll())

  return tous
    .filter((t) => t.utilisateur === utilisateur)
    .sort((a, b) => b.enregistreLe.localeCompare(a.enregistreLe))
}

/**
 * Efface tout ce qui appartient à un compte.
 *
 * Le RGPD s'applique ici comme au document : « supprimer mon compte » doit
 * emporter les relevés locaux, sinon la suppression serait partielle sans que
 * rien ne le dise. Appelé par `rgpd.ts`.
 */
export async function toutEffacer(utilisateur: string): Promise<void> {
  const [releves, entetes] = await Promise.all([
    lire<Releve>(RELEVES, (m) => m.getAll()),
    lire<TicketEnregistre>(TICKETS, (m) => m.getAll()),
  ])

  const aEffacer = releves.filter((r) => r.utilisateur === utilisateur).map((r) => r.id)
  const entetesAEffacer = entetes.filter((t) => t.utilisateur === utilisateur).map((t) => t.id)

  await transaction([RELEVES, TICKETS], 'readwrite', (t) => {
    const magasinReleves = t.objectStore(RELEVES)
    for (const id of aEffacer) magasinReleves.delete(id)
    const magasinTickets = t.objectStore(TICKETS)
    for (const id of entetesAEffacer) magasinTickets.delete(id)
  })
}
