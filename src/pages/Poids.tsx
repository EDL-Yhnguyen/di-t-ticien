import { useState } from 'react'
import { Plus, Table2, TrendingDown } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { CourbePoids } from '../components/CourbePoids'
import { Bouton, Carte, Champ, EtatVide, Feuille, TitreSection } from '../components/ui'
import {
  gainMarcheQuotidienne,
  imc,
  libelleIMC,
  progression,
  rythmeLent,
  trajectoire,
} from '../lib/nutrition'
import { poidsActuel } from '../lib/store'
import { dateCourte, dateLongue, entier, jourISO, nombre } from '../lib/utils'

export function Poids() {
  const { etat, modifier } = useSession()
  const [saisieOuverte, setSaisieOuverte] = useState(false)
  const [tableauOuvert, setTableauOuvert] = useState(false)
  const [valeur, setValeur] = useState('')

  const actuel = poidsActuel(etat)
  const t = trajectoire(etat.profil, actuel)
  const part = progression(etat.profil, actuel)
  const perdus = etat.profil.poidsDepartKg - actuel
  const restants = Math.max(0, actuel - etat.profil.poidsObjectifKg)
  const valeurIMC = imc(actuel, etat.profil.tailleCm)

  const triees = [...etat.pesees].sort((a, b) => b.date.localeCompare(a.date))

  function enregistrerPesee() {
    const kg = Number(valeur.replace(',', '.'))
    if (!Number.isFinite(kg) || kg < 30 || kg > 320) return

    modifier((brouillon) => {
      const date = jourISO()
      const existante = brouillon.pesees.find((p) => p.date === date)
      if (existante) existante.poidsKg = kg
      else brouillon.pesees.push({ date, poidsKg: kg })
    })
    setValeur('')
    setSaisieOuverte(false)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Votre poids</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {etat.pesees.length} pesée{etat.pesees.length > 1 ? 's' : ''} enregistrée
            {etat.pesees.length > 1 ? 's' : ''}
          </p>
        </div>
        <Bouton onClick={() => setSaisieOuverte(true)}>
          <Plus size={18} aria-hidden="true" />
          Me peser
        </Bouton>
      </header>

      <Carte className="p-5">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
              Aujourd’hui
            </p>
            <p className="mt-1 font-display text-4xl font-semibold text-ink tnum">
              {nombre(actuel)}
              <span className="ml-1 text-xl font-medium text-ink-soft">kg</span>
            </p>
          </div>
          {perdus > 0.05 && (
            <p className="flex items-center gap-1.5 rounded-full bg-basil-wash px-3 py-1.5 text-sm font-semibold text-basil tnum">
              <TrendingDown size={16} aria-hidden="true" />−{nombre(perdus)} kg
            </p>
          )}
        </div>

        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-soft tnum">
          <span>{nombre(etat.profil.poidsDepartKg)} kg</span>
          <span>{Math.round(part * 100)} % du chemin</span>
          <span>{nombre(etat.profil.poidsObjectifKg)} kg</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-sunken"
          role="progressbar"
          aria-valuenow={Math.round(part * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression vers le poids visé"
        >
          <div
            className="h-full rounded-full bg-basil transition-[width] duration-700"
            style={{ width: `${Math.max(2, part * 100)}%` }}
          />
        </div>
      </Carte>

      <Carte className="p-5">
        <TitreSection
          eyebrow="Évolution"
          action={
            <button
              type="button"
              onClick={() => setTableauOuvert(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-iris"
            >
              <Table2 size={16} aria-hidden="true" />
              Tableau
            </button>
          }
        >
          Kilos au fil des jours
        </TitreSection>

        {etat.pesees.length < 2 ? (
          <EtatVide emoji="⚖️" titre="Une seule pesée pour l’instant">
            Revenez dans quelques jours : la courbe se dessine à partir de deux mesures.
          </EtatVide>
        ) : (
          <CourbePoids pesees={etat.pesees} objectifKg={etat.profil.poidsObjectifKg} />
        )}
      </Carte>

      <div className="grid grid-cols-2 gap-3">
        <Carte className="p-4">
          <p className="font-display text-2xl font-semibold text-ink tnum">{nombre(restants)}</p>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">kg avant l’objectif</p>
        </Carte>
        <Carte className="p-4">
          <p className="font-display text-2xl font-semibold text-ink tnum">
            {nombre(valeurIMC, 1)}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">IMC — {libelleIMC(valeurIMC)}</p>
        </Carte>
      </div>

      {t.dateEstimee && restants > 0 && (
        <Carte className="p-5">
          <TitreSection eyebrow="Projection">Si vous tenez ce rythme</TitreSection>
          <p className="text-sm text-ink-soft">
            À raison de {nombre(t.perteHebdoKg, 2)} kg par semaine, vous atteindriez{' '}
            <strong className="font-semibold text-ink">
              {nombre(etat.profil.poidsObjectifKg)} kg
            </strong>{' '}
            vers le{' '}
            <strong className="font-semibold text-ink">{dateLongue(t.dateEstimee)}</strong>.
          </p>
          {rythmeLent(t, etat.profil.activite) && (
            <p className="mt-4 rounded-tile bg-apricot-wash px-4 py-3.5 text-sm text-ink">
              <strong className="font-semibold text-apricot">Ce rythme est lent — </strong>
              c’est mécanique : en restant assise la journée, vous dépensez{' '}
              {entier(t.depenseKcal)} kcal, et manger encore moins passerait sous le seuil qui
              couvre vos besoins. Trente minutes de marche par jour ajouteraient environ{' '}
              {entier(gainMarcheQuotidienne(actuel))} kcal de dépense, soit près du double de
              vitesse. Le levier est là, pas dans l’assiette.
            </p>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            Le poids fluctue d’un jour à l’autre — hydratation, cycle, sel de la veille. C’est la
            tendance sur plusieurs semaines qui compte, pas la mesure de ce matin.
          </p>
        </Carte>
      )}

      <Feuille
        ouvert={saisieOuverte}
        titre="Nouvelle pesée"
        onFermer={() => setSaisieOuverte(false)}
      >
        <div className="space-y-4">
          <Champ
            id="pesee"
            label="Votre poids ce matin"
            type="number"
            inputMode="decimal"
            step="0.1"
            suffixe="kg"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            autoFocus
            aide="À jeun, après être passée aux toilettes : c’est la mesure la plus comparable."
          />
          <Bouton pleineLargeur onClick={enregistrerPesee} disabled={valeur.trim() === ''}>
            Enregistrer
          </Bouton>
        </div>
      </Feuille>

      <Feuille
        ouvert={tableauOuvert}
        titre="Toutes les pesées"
        onFermer={() => setTableauOuvert(false)}
      >
        <table className="w-full text-sm">
          <caption className="sr-only">Historique des pesées, de la plus récente à la plus ancienne</caption>
          <thead>
            <tr className="border-b border-line text-left text-ink-soft">
              <th scope="col" className="pb-2 font-semibold">
                Date
              </th>
              <th scope="col" className="pb-2 text-right font-semibold">
                Poids
              </th>
              <th scope="col" className="pb-2 text-right font-semibold">
                Écart
              </th>
            </tr>
          </thead>
          <tbody>
            {triees.map((pesee, i) => {
              const precedente = triees[i + 1]
              const ecart = precedente ? pesee.poidsKg - precedente.poidsKg : null
              return (
                <tr key={pesee.date} className="border-b border-line last:border-b-0">
                  <td className="py-2.5">{dateCourte(pesee.date)}</td>
                  <td className="py-2.5 text-right font-semibold tnum">
                    {nombre(pesee.poidsKg)} kg
                  </td>
                  <td className="py-2.5 text-right tnum">
                    {ecart === null ? (
                      <span className="text-ink-faint">—</span>
                    ) : (
                      <span className={ecart <= 0 ? 'text-basil' : 'text-ink-soft'}>
                        {ecart > 0 ? '+' : '−'}
                        {nombre(Math.abs(ecart))}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Feuille>
    </div>
  )
}
