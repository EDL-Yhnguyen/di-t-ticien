import { useMemo, useRef, useState } from 'react'
import { Activity, Footprints, Loader2, Scale, Upload } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, EtatVide, TitreSection } from '../components/ui'
import { ErreurImportSante, fusionnerMesures, lireExportSante } from '../lib/appleSante'
import { classes, dateCourte, entier, nombre } from '../lib/utils'

/**
 * Import des données de l'app Santé d'Apple.
 *
 * Le mot « synchronisation » n'apparaît nulle part sur cet écran, et c'est
 * délibéré : HealthKit n'est accessible à aucun navigateur, donc il n'y a rien
 * à synchroniser. Promettre le contraire dans l'interface reviendrait à
 * laisser croire que les données arriveront toutes seules.
 */

type Etat = 'repos' | 'lecture' | 'fait' | 'erreur'

export function Sante() {
  const { etat, modifier } = useSession()
  const champ = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Etat>('repos')
  const [progression, setProgression] = useState(0)
  const [message, setMessage] = useState('')

  const mesures = etat.mesuresSante
  const recentes = useMemo(() => [...mesures].reverse().slice(0, 14), [mesures])

  const cumuls = useMemo(() => {
    const avecPas = mesures.filter((m) => m.pas)
    const avecDepense = mesures.filter((m) => m.depenseKcal)
    return {
      jours: mesures.length,
      pesees: mesures.filter((m) => m.poidsKg).length,
      pasMoyens: avecPas.length
        ? Math.round(avecPas.reduce((s, m) => s + (m.pas ?? 0), 0) / avecPas.length)
        : 0,
      depenseMoyenne: avecDepense.length
        ? Math.round(avecDepense.reduce((s, m) => s + (m.depenseKcal ?? 0), 0) / avecDepense.length)
        : 0,
    }
  }, [mesures])

  async function importer(fichier: File) {
    setPhase('lecture')
    setProgression(0)
    setMessage('')
    try {
      const { mesures: nouvelles, lus } = await lireExportSante(fichier, setProgression)
      if (nouvelles.length === 0) {
        setPhase('erreur')
        setMessage(
          `${entier(lus)} enregistrements lus, mais aucun poids, pas ni dépense énergétique. Ces trois mesures sont les seules qu’Mamakilo utilise.`,
        )
        return
      }
      modifier((brouillon) => {
        brouillon.mesuresSante = fusionnerMesures(brouillon.mesuresSante, nouvelles)
      })
      setPhase('fait')
      setMessage(
        `${nouvelles.length} journée${nouvelles.length > 1 ? 's' : ''} importée${nouvelles.length > 1 ? 's' : ''} sur ${entier(lus)} enregistrements lus.`,
      )
    } catch (erreur) {
      setPhase('erreur')
      setMessage(
        erreur instanceof ErreurImportSante
          ? erreur.message
          : 'Ce fichier n’a pas pu être lu. Vérifiez qu’il s’agit bien de export.xml.',
      )
    }
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-semibold text-ink">Apple Santé</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Vos pesées, vos pas et votre dépense énergétique, importés depuis l’app Santé de votre
          iPhone.
        </p>
      </header>

      <Carte className="animate-rise border-apricot/30 bg-apricot-wash p-5">
        <h2 className="text-sm font-bold text-ink">Ce n’est pas une synchronisation</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Aucun navigateur ne peut lire l’app Santé directement — c’est une limite d’iOS, pas
          d’Mamakilo. Vous exportez vos données, vous les déposez ici, et vous recommencez quand
          vous voulez les rafraîchir. Rien ne remonte tout seul.
        </p>
      </Carte>

      <section className="animate-rise">
        <TitreSection eyebrow="Trois étapes, une fois">Récupérer votre export</TitreSection>
        <Carte className="p-5">
          <ol className="space-y-4">
            {[
              'Ouvrez l’app Santé, touchez votre photo en haut à droite, puis « Exporter toutes les données ». La préparation prend quelques minutes.',
              'Enregistrez l’archive dans Fichiers. Appuyez longuement dessus et choisissez « Décompresser » : un dossier apple_health_export apparaît.',
              'Revenez ici et choisissez le fichier export.xml qu’il contient.',
            ].map((etape, i) => (
              <li key={etape} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-corail text-xs font-bold text-white tnum">
                  {i + 1}
                </span>
                <span className="text-sm text-ink-soft">{etape}</span>
              </li>
            ))}
          </ol>

          <input
            ref={champ}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="sr-only"
            onChange={(e) => {
              const fichier = e.target.files?.[0]
              if (fichier) importer(fichier)
              e.target.value = ''
            }}
          />

          <Bouton
            pleineLargeur
            className="mt-5"
            disabled={phase === 'lecture'}
            onClick={() => champ.current?.click()}
          >
            {phase === 'lecture' ? (
              <>
                <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                Lecture… {Math.round(progression * 100)} %
              </>
            ) : (
              <>
                <Upload size={17} aria-hidden="true" />
                Choisir export.xml
              </>
            )}
          </Bouton>

          {phase === 'lecture' && (
            <div
              role="progressbar"
              aria-valuenow={Math.round(progression * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Lecture du fichier"
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken"
            >
              <span
                className="block h-full rounded-full bg-corail transition-[width]"
                style={{ width: `${progression * 100}%` }}
              />
            </div>
          )}

          {message && (
            <p
              role="status"
              aria-live="polite"
              className={classes(
                'mt-3 rounded-tile px-3.5 py-2.5 text-sm',
                phase === 'erreur' ? 'bg-berry-wash text-ink' : 'bg-basil-wash text-ink',
              )}
            >
              {message}
            </p>
          )}

          <p className="mt-3 text-xs text-ink-soft">
            Le fichier est lu sur votre appareil et n’est jamais envoyé nulle part. Seules trois
            mesures en sont extraites : poids, nombre de pas, dépense énergétique active.
          </p>
        </Carte>
      </section>

      {mesures.length === 0 ? (
        <EtatVide emoji="⌚" titre="Aucune donnée importée">
          Une fois l’import fait, vos pesées viendront compléter votre courbe de poids
          automatiquement, sans que vous ayez à les ressaisir.
        </EtatVide>
      ) : (
        <>
          <section className="animate-rise">
            <TitreSection eyebrow={`${cumuls.jours} journées`}>Ce qui est importé</TitreSection>
            <div className="grid grid-cols-3 gap-2">
              {[
                { Icone: Scale, valeur: entier(cumuls.pesees), libelle: 'pesées' },
                { Icone: Footprints, valeur: entier(cumuls.pasMoyens), libelle: 'pas / jour' },
                {
                  Icone: Activity,
                  valeur: entier(cumuls.depenseMoyenne),
                  libelle: 'kcal actives / jour',
                },
              ].map(({ Icone, valeur, libelle }) => (
                <Carte key={libelle} className="px-3 py-4 text-center">
                  <Icone size={18} className="mx-auto text-corail" aria-hidden="true" />
                  <p className="mt-2 font-display text-xl font-semibold text-ink tnum">{valeur}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{libelle}</p>
                </Carte>
              ))}
            </div>
          </section>

          <section className="animate-rise">
            <TitreSection eyebrow="Quinze derniers jours">Le détail</TitreSection>
            <Carte className="overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Poids, pas et dépense énergétique importés par journée
                </caption>
                <thead>
                  <tr className="border-b border-line text-xs text-ink-faint">
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold">
                      Jour
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                      Poids
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                      Pas
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                      Actives
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentes.map((mesure) => (
                    <tr key={mesure.date}>
                      <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink">
                        {dateCourte(mesure.date)}
                      </th>
                      <td className="px-4 py-2.5 text-right text-ink-soft tnum">
                        {mesure.poidsKg ? `${nombre(mesure.poidsKg)} kg` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink-soft tnum">
                        {mesure.pas ? entier(mesure.pas) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink-soft tnum">
                        {mesure.depenseKcal ? `${entier(mesure.depenseKcal)} kcal` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Carte>
          </section>
        </>
      )}
    </div>
  )
}
