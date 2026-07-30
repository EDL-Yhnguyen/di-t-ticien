/**
 * Reconnaître l'enseigne dans l'en-tête d'un ticket.
 *
 * Sans elle, un relevé de prix ne vaut rien : « l'emmental à 2,45 € » ne
 * répond à aucune question, « l'emmental à 2,45 € chez Aldi » les ouvre toutes.
 *
 * **Les formats d'une même marque sont distingués** — Carrefour et Carrefour
 * Market n'ont ni les mêmes prix ni les mêmes promotions, et les confondre
 * ferait comparer un hypermarché à une supérette pour conclure que le premier
 * est toujours moins cher. C'est vrai, et c'est précisément ce qu'on ne veut
 * pas dire à quelqu'un qui n'a qu'une supérette en bas de chez lui.
 */

export interface Enseigne {
  /** Stable : c'est la clé sous laquelle les prix sont rangés. Ne pas renommer. */
  id: string
  nom: string
  /**
   * Ce qu'on cherche dans l'en-tête, déjà normalisé (capitales, sans accent ni
   * espace ni ponctuation). L'ordre compte : voir `ENSEIGNES`.
   */
  motifs: string[]
}

/**
 * Rangées **du plus précis au plus général**, et lues dans cet ordre.
 *
 * « CARREFOURMARKET » contient « CARREFOUR » : tester le générique d'abord
 * classerait toutes les supérettes en hypermarché, sans que rien ne le
 * signale — l'en-tête aurait bel et bien contenu le mot cherché.
 */
export const ENSEIGNES: Enseigne[] = [
  { id: 'carrefour-market', nom: 'Carrefour Market', motifs: ['CARREFOURMARKET'] },
  { id: 'carrefour-city', nom: 'Carrefour City', motifs: ['CARREFOURCITY'] },
  { id: 'carrefour-express', nom: 'Carrefour Express', motifs: ['CARREFOUREXPRESS'] },
  { id: 'carrefour-contact', nom: 'Carrefour Contact', motifs: ['CARREFOURCONTACT'] },
  { id: 'carrefour', nom: 'Carrefour', motifs: ['CARREFOUR'] },
  { id: 'intermarche', nom: 'Intermarché', motifs: ['INTERMARCHE', 'ITMLESMOUSQUETAIRES'] },
  { id: 'leclerc', nom: 'E.Leclerc', motifs: ['ELECLERC', 'LECLERC', 'SCAPARTOIS'] },
  { id: 'super-u', nom: 'Super U', motifs: ['SUPERU'] },
  { id: 'hyper-u', nom: 'Hyper U', motifs: ['HYPERU'] },
  { id: 'u-express', nom: 'U Express', motifs: ['UEXPRESS'] },
  { id: 'auchan', nom: 'Auchan', motifs: ['AUCHAN'] },
  { id: 'lidl', nom: 'Lidl', motifs: ['LIDL'] },
  { id: 'aldi', nom: 'Aldi', motifs: ['ALDI'] },
  { id: 'netto', nom: 'Netto', motifs: ['NETTO'] },
  { id: 'monoprix', nom: 'Monoprix', motifs: ['MONOPRIX', 'MONOP'] },
  { id: 'franprix', nom: 'Franprix', motifs: ['FRANPRIX'] },
  { id: 'casino', nom: 'Casino', motifs: ['CASINO', 'GEANTCASINO'] },
  { id: 'grand-frais', nom: 'Grand Frais', motifs: ['GRANDFRAIS'] },
  { id: 'picard', nom: 'Picard', motifs: ['PICARD'] },
  { id: 'biocoop', nom: 'Biocoop', motifs: ['BIOCOOP'] },
  { id: 'naturalia', nom: 'Naturalia', motifs: ['NATURALIA'] },
  { id: 'action', nom: 'Action', motifs: ['ACTION'] },
  { id: 'cora', nom: 'Cora', motifs: ['CORA'] },
  { id: 'match', nom: 'Match', motifs: ['SUPERMARCHEMATCH'] },
  { id: 'colruyt', nom: 'Colruyt', motifs: ['COLRUYT'] },
  { id: 'costco', nom: 'Costco', motifs: ['COSTCO'] },
]

export function enseigneParId(id: string): Enseigne | null {
  return ENSEIGNES.find((e) => e.id === id) ?? null
}

/** « E.Leclerc Drive » → « ELECLERCDRIVE ». */
function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/**
 * Cherche une enseigne dans les premières lignes du ticket.
 *
 * La recherche est bornée à l'en-tête : le pied de page porte souvent le nom
 * d'une autre enseigne du même groupe (« Une carte, tous les magasins
 * Intermarché ») sur un ticket qui n'est pas le sien.
 */
export function reconnaitreEnseigne(lignes: string[], profondeur = 8): Enseigne | null {
  const entete = normaliser(lignes.slice(0, profondeur).join(' '))
  return ENSEIGNES.find((enseigne) => enseigne.motifs.some((motif) => entete.includes(motif))) ?? null
}
