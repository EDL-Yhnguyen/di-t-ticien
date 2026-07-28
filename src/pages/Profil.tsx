import { useEffect, useState } from 'react'
import { Award, ChevronRight, ExternalLink, LogOut, Moon, NotebookText, Sun } from 'lucide-react'
import { useApp, useSession } from '../context/AppContext'
import { Bouton, Bascule, Carte, Champ, ChoixListe, Feuille, TitreSection } from '../components/ui'
import { Lien } from '../lib/router'
import { LIBELLE_ACTIVITE, depenseJournaliere, objectifCalorique } from '../lib/nutrition'
import { poidsActuel } from '../lib/store'
import { modeDemo } from '../lib/supabase'
import type { Activite } from '../lib/types'
import { entier, nombre } from '../lib/utils'

const CLE_THEME = 'equilibre:theme'
const LIEN_ALIVIO = 'https://diet.alivio.fr/0cc63c63-86df-4f6c-946d-f0654f6a56f3'

export function Profil() {
  const { seDeconnecter } = useApp()
  const { etat, modifier } = useSession()
  const [mesuresOuvertes, setMesuresOuvertes] = useState(false)
  const [sombre, setSombre] = useState(() => document.documentElement.classList.contains('dark'))

  const [taille, setTaille] = useState(String(etat.profil.tailleCm))
  const [age, setAge] = useState(String(etat.profil.age))
  const [objectifKg, setObjectifKg] = useState(String(etat.profil.poidsObjectifKg))
  const [activite, setActivite] = useState<Activite>(etat.profil.activite)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', sombre)
    localStorage.setItem(CLE_THEME, sombre ? 'sombre' : 'clair')
  }, [sombre])

  const mesures = {
    poidsKg: poidsActuel(etat),
    tailleCm: etat.profil.tailleCm,
    age: etat.profil.age,
    sexe: etat.profil.sexe,
    activite: etat.profil.activite,
  }

  function enregistrerMesures() {
    modifier((brouillon) => {
      brouillon.profil.tailleCm = Number(taille)
      brouillon.profil.age = Number(age)
      brouillon.profil.poidsObjectifKg = Number(objectifKg.replace(',', '.'))
      brouillon.profil.activite = activite
    })
    setMesuresOuvertes(false)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-iris-wash font-display text-2xl font-semibold text-iris">
          {etat.profil.prenom.slice(0, 1).toUpperCase() || '?'}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink">
            {etat.profil.prenom || 'Votre profil'}
          </h1>
          <p className="truncate text-sm text-ink-soft">{etat.profil.email}</p>
        </div>
      </header>

      <Carte className="grid grid-cols-2 divide-x divide-line">
        <div className="px-4 py-4 text-center">
          <p className="font-display text-2xl font-semibold text-ink tnum">
            {entier(objectifCalorique(mesures))}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">kcal visées par jour</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="font-display text-2xl font-semibold text-ink tnum">
            {entier(depenseJournaliere(mesures))}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">kcal dépensées par jour</p>
        </div>
      </Carte>

      <section>
        <TitreSection>Raccourcis</TitreSection>
        <Carte className="divide-y divide-line">
          <Lien
            vers="/app/plan"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <NotebookText size={19} className="shrink-0 text-iris" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mon plan alimentaire</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/badges"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <Award size={19} className="shrink-0 text-apricot" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mes badges</span>
            <span className="text-sm text-ink-faint tnum">{etat.badges.length}</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <a
            href={LIEN_ALIVIO}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <ExternalLink size={19} className="shrink-0 text-basil" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mon suivi chez la diététicienne</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </a>
        </Carte>
      </section>

      <section>
        <TitreSection>Mes mesures</TitreSection>
        <Carte className="divide-y divide-line">
          <Ligne libelle="Taille" valeur={`${etat.profil.tailleCm} cm`} />
          <Ligne libelle="Âge" valeur={`${etat.profil.age} ans`} />
          <Ligne libelle="Poids de départ" valeur={`${nombre(etat.profil.poidsDepartKg)} kg`} />
          <Ligne libelle="Poids visé" valeur={`${nombre(etat.profil.poidsObjectifKg)} kg`} />
          <Ligne libelle="Activité" valeur={LIBELLE_ACTIVITE[etat.profil.activite].split(' —')[0]} />
        </Carte>
        <Bouton ton="doux" pleineLargeur className="mt-3" onClick={() => setMesuresOuvertes(true)}>
          Modifier mes mesures
        </Bouton>
      </section>

      <section>
        <TitreSection>Réglages</TitreSection>
        <Carte className="space-y-5 p-5">
          <Bascule
            label="Substituts Herbalife"
            aide="Ajoute les Formula 1 comme alternative au petit déjeuner et aux collations."
            actif={etat.profil.herbalifeActif}
            onChange={(v) =>
              modifier((brouillon) => {
                brouillon.profil.herbalifeActif = v
              })
            }
          />
          <div className="border-t border-line pt-5">
            <Bascule
              label={sombre ? 'Thème sombre' : 'Thème clair'}
              aide="Suit votre système par défaut."
              actif={sombre}
              onChange={setSombre}
            />
            <p className="mt-2 flex items-center gap-2 text-xs text-ink-faint">
              {sombre ? <Moon size={13} aria-hidden="true" /> : <Sun size={13} aria-hidden="true" />}
              Le choix est mémorisé sur cet appareil.
            </p>
          </div>
        </Carte>
      </section>

      <section>
        <TitreSection>Vos données</TitreSection>
        <Carte className="p-5">
          <p className="text-sm text-ink-soft">
            {modeDemo
              ? 'Vos données sont enregistrées dans ce navigateur uniquement. Elles ne quittent pas cet appareil, et disparaîtraient si vous effaciez les données du site.'
              : 'Vos données sont enregistrées sur votre compte et synchronisées entre vos appareils. Vous seule y avez accès.'}
          </p>
        </Carte>
      </section>

      <Bouton ton="doux" pleineLargeur onClick={() => void seDeconnecter()}>
        <LogOut size={17} aria-hidden="true" />
        Se déconnecter
      </Bouton>

      <Feuille
        ouvert={mesuresOuvertes}
        titre="Mes mesures"
        onFermer={() => setMesuresOuvertes(false)}
      >
        <div className="space-y-4">
          <Champ
            id="taille"
            label="Taille"
            type="number"
            inputMode="numeric"
            suffixe="cm"
            value={taille}
            onChange={(e) => setTaille(e.target.value)}
          />
          <Champ
            id="age"
            label="Âge"
            type="number"
            inputMode="numeric"
            suffixe="ans"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <Champ
            id="objectif"
            label="Poids visé"
            type="number"
            inputMode="decimal"
            step="0.1"
            suffixe="kg"
            value={objectifKg}
            onChange={(e) => setObjectifKg(e.target.value)}
          />
          <ChoixListe
            label="Activité au quotidien"
            valeur={activite}
            onChange={setActivite}
            options={(Object.keys(LIBELLE_ACTIVITE) as Activite[]).map((valeur) => ({
              valeur,
              libelle: LIBELLE_ACTIVITE[valeur],
            }))}
          />
          <Bouton pleineLargeur onClick={enregistrerMesures}>
            Enregistrer
          </Bouton>
        </div>
      </Feuille>
    </div>
  )
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-ink-soft">{libelle}</span>
      <span className="text-sm font-semibold text-ink tnum">{valeur}</span>
    </div>
  )
}
