import { useEffect, useMemo, useState } from 'react'
import { ReceiptText, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Carte, Champ, EtatVide, Etiquette, Feuille, TitreSection, Tuile } from '../components/ui'
import { Lien } from '../lib/router'
import { aSurveiller, ecartAuMeilleur } from '../lib/prix/agregats'
import { relevesDuProduit, type Releve } from '../lib/prix/depot'
import { enseigneParId } from '../lib/ticket/enseignes'
import type { AgregatPrix } from '../lib/types'
import { classes, dateCourte, nombre } from '../lib/utils'

/**
 * L'historique des prix, tiré des tickets photographiés.
 *
 * Cet écran ne compare rien à un catalogue extérieur — il n'en existe aucun
 * d'accessible. Il compare **vos prix à vos prix** : ce que vous payez
 * aujourd'hui contre ce que vous avez déjà payé, et où. C'est ce qui le rend
 * utile dès le premier mois, sans dépendre d'une base collective qui n'existe
 * pas encore.
 */

const UNITE = { piece: 'l’unité', kg: 'le kilo', l: 'le litre' } as const

export function Prix() {
  const { etat } = useSession()
  const [recherche, setRecherche] = useState('')
  const [ouvert, setOuvert] = useState<AgregatPrix | null>(null)

  const surveiller = useMemo(() => aSurveiller(etat.prix).slice(0, 4), [etat.prix])

  const listes = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return etat.prix
    return etat.prix.filter((a) => a.libelle.toLowerCase().includes(terme))
  }, [etat.prix, recherche])

  const totalReleves = useMemo(
    () => etat.prix.reduce((cumul, a) => cumul + a.releves, 0),
    [etat.prix],
  )

  /**
   * Ce que coûterait de payer chaque produit au meilleur prix déjà constaté.
   *
   * Cette tuile comptait d'abord les enseignes fréquentées, et ce chiffre était
   * faux : les agrégats ne retiennent que la **dernière** enseigne de chaque
   * produit, donc deux courses de suite au même magasin faisaient tomber le
   * compte à un, quel que soit l'historique. Un nombre qu'on ne peut pas
   * calculer juste n'a pas à être affiché — et celui-ci, qui se calcule
   * exactement, est de toute façon le seul qui intéresse.
   */
  const economiePossible = useMemo(
    () =>
      Math.round(
        etat.prix.reduce((cumul, a) => cumul + (ecartAuMeilleur(a) ?? 0), 0) * 100,
      ) / 100,
    [etat.prix],
  )

  if (etat.prix.length === 0) {
    return (
      <div className="space-y-6 pb-4">
        <TitreSection eyebrow="Mes prix">Mon historique</TitreSection>
        <EtatVide
          emoji="🏷"
          titre="Aucun prix connu pour l’instant"
          action={
            <Lien
              vers="/app/ticket"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold plein-primaire text-white shadow-halo"
            >
              <ReceiptText size={17} aria-hidden="true" />
              Lire un ticket
            </Lien>
          }
        >
          Photographiez un ticket de caisse et vos prix commencent à se construire. Dès le deuxième
          passage en magasin, l’application peut vous dire si vous payez plus cher que d’habitude.
        </EtatVide>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      <TitreSection eyebrow="Mes prix">Mon historique</TitreSection>

      <div className="grid grid-cols-3 gap-2.5">
        <Tuile intitule="Produits" valeur={etat.prix.length} />
        <Tuile ton="accent" intitule="Relevés" valeur={totalReleves} />
        <Tuile
          ton="reussite"
          intitule="Écart"
          valeur={nombre(economiePossible, 2)}
          unite="€"
          detail="au meilleur prix"
        />
      </div>

      {surveiller.length > 0 && (
        <section>
          <TitreSection>Payés plus cher que d’habitude</TitreSection>
          <Carte ton="alerte" className="divide-y divide-alerte/15">
            {surveiller.map((agregat) => (
              <button
                key={`${agregat.cle}-${agregat.unite}`}
                type="button"
                onClick={() => setOuvert(agregat)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface/40"
              >
                <TrendingUp size={18} className="shrink-0 text-alerte" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{agregat.libelle}</span>
                  <span className="block text-xs text-ink-soft">
                    déjà vu à{' '}
                    <span className="font-semibold tnum">{nombre(agregat.meilleur, 2)} €</span>
                    {agregat.meilleureEnseigne &&
                      ` chez ${enseigneParId(agregat.meilleureEnseigne)?.nom ?? '?'}`}
                  </span>
                </span>
                <span className="shrink-0 font-display text-lg font-semibold text-alerte tnum">
                  +{nombre(ecartAuMeilleur(agregat) ?? 0, 2)} €
                </span>
              </button>
            ))}
          </Carte>
        </section>
      )}

      <section>
        <TitreSection>Tous mes produits</TitreSection>

        <div className="mb-3">
          <Champ
            label="Rechercher"
            type="search"
            placeholder="emmental, bananes…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>

        {listes.length === 0 ? (
          <Carte className="flex items-center gap-3 p-5 text-sm text-ink-soft">
            <Search size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
            Aucun produit ne porte ce nom dans votre historique.
          </Carte>
        ) : (
          <Carte className="divide-y divide-line">
            {listes.map((agregat) => (
              <LigneProduit
                key={`${agregat.cle}-${agregat.unite}`}
                agregat={agregat}
                onOuvrir={() => setOuvert(agregat)}
              />
            ))}
          </Carte>
        )}
      </section>

      <Feuille
        ouvert={ouvert !== null}
        titre={ouvert?.libelle ?? ''}
        onFermer={() => setOuvert(null)}
      >
        {ouvert && <Fiche agregat={ouvert} utilisateur={etat.profil.id} />}
      </Feuille>
    </div>
  )
}

function LigneProduit({
  agregat,
  onOuvrir,
}: {
  agregat: AgregatPrix
  onOuvrir: () => void
}) {
  const ecart = ecartAuMeilleur(agregat)

  return (
    <button
      type="button"
      onClick={onOuvrir}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-sunken"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{agregat.libelle}</span>
        <span className="block text-xs text-ink-soft">
          {agregat.releves > 1 ? (
            <>
              moyenne <span className="tnum">{nombre(agregat.moyen, 2)} €</span> ·{' '}
              <span className="tnum">{agregat.releves}</span> relevés
            </>
          ) : (
            // Un seul passage en caisse n'est pas un historique, et le dire
            // évite de donner à un chiffre unique l'autorité d'une moyenne.
            'vu une seule fois'
          )}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block font-display text-lg font-semibold text-ink tnum">
          {nombre(agregat.dernier, 2)} €
        </span>
        <span className="block text-[0.6875rem] text-ink-faint">{UNITE[agregat.unite]}</span>
      </span>

      {ecart !== null && <Etiquette ton="alerte">+{nombre(ecart, 2)}</Etiquette>}
    </button>
  )
}

/**
 * Le détail d'un produit : ses relevés, un par un.
 *
 * Ils sont lus à l'ouverture de la feuille et non gardés dans l'état : ils
 * vivent en IndexedDB précisément pour ne pas peser sur le document, et les
 * charger d'avance pour tous les produits annulerait ce bénéfice.
 */
function Fiche({ agregat, utilisateur }: { agregat: AgregatPrix; utilisateur: string }) {
  const [releves, setReleves] = useState<Releve[] | null>(null)

  useEffect(() => {
    let annule = false
    void relevesDuProduit(agregat.libelle, utilisateur).then((trouves) => {
      if (!annule) setReleves(trouves.filter((r) => r.unite === agregat.unite))
    })
    return () => {
      annule = true
    }
  }, [agregat.libelle, agregat.unite, utilisateur])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <Tuile intitule="Dernier" valeur={nombre(agregat.dernier, 2)} unite="€" />
        <Tuile ton="accent" intitule="Moyen" valeur={nombre(agregat.moyen, 2)} unite="€" />
        <Tuile ton="reussite" intitule="Meilleur" valeur={nombre(agregat.meilleur, 2)} unite="€" />
      </div>

      <p className="text-sm text-ink-soft">
        Prix pour {UNITE[agregat.unite]}.{' '}
        {agregat.meilleureEnseigne && agregat.releves > 1 && (
          <>
            Le meilleur prix a été relevé chez{' '}
            <strong className="font-semibold text-ink">
              {enseigneParId(agregat.meilleureEnseigne)?.nom}
            </strong>{' '}
            le {dateCourte(agregat.meilleureDate)}
          </>
        )}
      </p>

      {releves === null ? (
        <p className="text-sm text-ink-faint">Lecture de l’historique…</p>
      ) : (
        <ul className="divide-y divide-line rounded-tile border border-line">
          {releves.map((releve) => {
            const meilleur = releve.prixParUnite === agregat.meilleur
            return (
              <li key={releve.id} className="flex items-center gap-3 px-4 py-2.5">
                {meilleur && (
                  <TrendingDown size={16} className="shrink-0 text-reussite" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    {releve.enseigne ? (enseigneParId(releve.enseigne)?.nom ?? '—') : 'Enseigne inconnue'}
                  </span>
                  <span className="block text-xs text-ink-faint">{dateCourte(releve.date)}</span>
                </span>
                <span
                  className={classes(
                    'shrink-0 font-semibold tnum',
                    meilleur ? 'text-reussite' : 'text-ink',
                  )}
                >
                  {nombre(releve.prixParUnite, 2)} €
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <Lien
        vers="/app/ticket"
        className="block rounded-2xl border border-line-fort bg-surface px-4 py-3 text-center font-semibold text-ink transition hover:bg-sunken"
      >
        Ajouter un ticket
      </Lien>
    </div>
  )
}
