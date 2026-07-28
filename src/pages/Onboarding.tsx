import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Bouton, Carte, Champ, ChoixListe } from '../components/ui'
import { LIBELLE_ACTIVITE, objectifCalorique, trajectoire } from '../lib/nutrition'
import type { Activite, Sexe } from '../lib/types'
import { dateCourte, entier, jourISO, nombre } from '../lib/utils'

const ETAPES = ['Vous', 'Votre poids', 'Votre rythme', 'Votre plan'] as const

export function Onboarding() {
  const { etat, modifier } = useApp()
  const [etape, setEtape] = useState(0)

  const [prenom, setPrenom] = useState(etat?.profil.prenom ?? '')
  const [sexe, setSexe] = useState<Sexe>(etat?.profil.sexe ?? 'femme')
  const [age, setAge] = useState(String(etat?.profil.age ?? ''))
  const [taille, setTaille] = useState(String(etat?.profil.tailleCm ?? ''))
  const [poids, setPoids] = useState(String(etat?.profil.poidsDepartKg ?? ''))
  const [objectif, setObjectif] = useState(String(etat?.profil.poidsObjectifKg ?? ''))
  const [activite, setActivite] = useState<Activite>(etat?.profil.activite ?? 'sedentaire')

  if (!etat) return null

  const nAge = Number(age)
  const nTaille = Number(taille)
  const nPoids = Number(poids)
  const nObjectif = Number(objectif)

  const etapeValide = [
    prenom.trim().length > 0 && nAge >= 14 && nAge <= 100,
    nTaille >= 120 && nTaille <= 230 && nPoids >= 35 && nPoids <= 300,
    nObjectif >= 35 && nObjectif < nPoids,
    true,
  ][etape]

  function terminer() {
    modifier((brouillon) => {
      brouillon.profil = {
        ...brouillon.profil,
        prenom: prenom.trim(),
        sexe,
        age: nAge,
        tailleCm: nTaille,
        poidsDepartKg: nPoids,
        poidsObjectifKg: nObjectif,
        activite,
        onboardingFait: true,
      }
      // La première pesée sert de point de départ à la courbe.
      const aujourdhui = jourISO()
      const existante = brouillon.pesees.find((p) => p.date === aujourdhui)
      if (existante) existante.poidsKg = nPoids
      else brouillon.pesees.push({ date: aujourdhui, poidsKg: nPoids })
    })
  }

  return (
    <div className="min-h-svh bg-ground px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-7">
          <p className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
            Étape {etape + 1} sur {ETAPES.length} — {ETAPES[etape]}
          </p>
          <div className="flex gap-1.5" aria-hidden="true">
            {ETAPES.map((nom, i) => (
              <div key={nom} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <motion.div
                  initial={false}
                  animate={{ scaleX: i <= etape ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="h-full origin-left rounded-full bg-iris"
                />
              </div>
            ))}
          </div>
        </div>

        <Carte className="p-6">
          {etape === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">
                  Faisons connaissance
                </h1>
                <p className="text-sm text-ink-soft">
                  Ces informations servent uniquement à calculer vos besoins. Elles restent sur
                  votre compte.
                </p>
              </div>
              <Champ
                id="prenom"
                label="Votre prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                autoComplete="given-name"
              />
              <Champ
                id="age"
                label="Votre âge"
                type="number"
                inputMode="numeric"
                suffixe="ans"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <ChoixListe
                label="Vous êtes"
                valeur={sexe}
                onChange={setSexe}
                options={[
                  { valeur: 'femme', libelle: 'Une femme' },
                  { valeur: 'homme', libelle: 'Un homme' },
                ]}
              />
            </div>
          )}

          {etape === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">
                  Votre point de départ
                </h1>
                <p className="text-sm text-ink-soft">
                  Pesez-vous le matin à jeun : c’est la mesure la plus stable d’un jour à l’autre.
                </p>
              </div>
              <Champ
                id="taille"
                label="Votre taille"
                type="number"
                inputMode="numeric"
                suffixe="cm"
                value={taille}
                onChange={(e) => setTaille(e.target.value)}
              />
              <Champ
                id="poids"
                label="Votre poids aujourd’hui"
                type="number"
                inputMode="decimal"
                step="0.1"
                suffixe="kg"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
              />
            </div>
          )}

          {etape === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">
                  Où voulez-vous aller ?
                </h1>
                <p className="text-sm text-ink-soft">
                  Un objectif atteignable vaut mieux qu’un objectif spectaculaire abandonné en
                  route.
                </p>
              </div>
              <Champ
                id="objectif"
                label="Poids visé"
                type="number"
                inputMode="decimal"
                step="0.1"
                suffixe="kg"
                value={objectif}
                onChange={(e) => setObjectif(e.target.value)}
                aide={
                  nObjectif > 0 && nPoids > nObjectif
                    ? `Soit ${nombre(nPoids - nObjectif)} kg à perdre.`
                    : undefined
                }
              />
              <ChoixListe
                label="Votre activité au quotidien"
                valeur={activite}
                onChange={setActivite}
                options={(Object.keys(LIBELLE_ACTIVITE) as Activite[]).map((valeur) => ({
                  valeur,
                  libelle: LIBELLE_ACTIVITE[valeur],
                }))}
              />
            </div>
          )}

          {etape === 3 && <Recapitulatif {...{ nPoids, nObjectif, nTaille, nAge, sexe, activite }} />}

          <div className="mt-7 flex gap-3">
            {etape > 0 && (
              <Bouton ton="doux" onClick={() => setEtape(etape - 1)}>
                <ArrowLeft size={17} aria-hidden="true" />
                Retour
              </Bouton>
            )}
            <Bouton
              pleineLargeur
              disabled={!etapeValide}
              onClick={() => (etape === ETAPES.length - 1 ? terminer() : setEtape(etape + 1))}
            >
              {etape === ETAPES.length - 1 ? 'Commencer' : 'Continuer'}
              {etape < ETAPES.length - 1 && <ArrowRight size={17} aria-hidden="true" />}
            </Bouton>
          </div>
        </Carte>
      </div>
    </div>
  )
}

function Recapitulatif({
  nPoids,
  nObjectif,
  nTaille,
  nAge,
  sexe,
  activite,
}: {
  nPoids: number
  nObjectif: number
  nTaille: number
  nAge: number
  sexe: Sexe
  activite: Activite
}) {
  const mesures = { poidsKg: nPoids, tailleCm: nTaille, age: nAge, sexe, activite }
  const cible = objectifCalorique(mesures)
  const t = trajectoire(
    {
      id: '',
      prenom: '',
      email: '',
      sexe,
      age: nAge,
      tailleCm: nTaille,
      poidsDepartKg: nPoids,
      poidsObjectifKg: nObjectif,
      activite,
      herbalifeActif: false,
      planPrescrit: false,
      praticien: null,
      onboardingFait: true,
      motDePasseAChanger: false,
      creeLe: '',
    },
    nPoids,
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="mb-1.5 font-display text-2xl font-semibold text-ink">Voici votre plan</h1>
        <p className="text-sm text-ink-soft">
          Un déficit de 20 %, le rythme que les diététiciens recommandent pour ne pas reprendre
          derrière.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-tile bg-iris-wash p-4">
          <p className="font-display text-2xl font-semibold text-iris tnum">{entier(cible)}</p>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">kcal par jour</p>
        </div>
        <div className="rounded-tile bg-basil-wash p-4">
          <p className="font-display text-2xl font-semibold text-basil tnum">
            −{nombre(t.perteHebdoKg, 2)}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">kg par semaine</p>
        </div>
      </div>

      {t.dateEstimee && (
        <p className="rounded-tile bg-sunken px-4 py-3.5 text-sm text-ink-soft">
          En tenant ce rythme, vous atteindriez{' '}
          <strong className="font-semibold text-ink">{nombre(nObjectif)} kg</strong> vers le{' '}
          <strong className="font-semibold text-ink">{dateCourte(t.dateEstimee)}</strong>. Une
          estimation, pas une promesse : le corps avance rarement en ligne droite.
        </p>
      )}

      <p className="text-xs text-ink-faint">
        Ces repères ne remplacent pas une consultation. Pour un suivi personnalisé, parlez-en à un
        diététicien-nutritionniste.
      </p>
    </div>
  )
}
