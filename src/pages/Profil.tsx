import { useState } from 'react'
import {
  AlertCircle,
  Award,
  CalendarDays,
  ChevronRight,
  Download,
  Dumbbell,
  ExternalLink,
  Gamepad2,
  HeartPulse,
  MessageCircle,
  TrendingUp,
  LogOut,
  NotebookText,
  ReceiptText,
  Refrigerator,
  ShieldCheck,
  ShoppingBasket,
  ShieldHalf,
  Stethoscope,
  Tag,
  Trash2,
} from 'lucide-react'
import { useApp, useSession } from '../context/AppContext'
import { Bouton, Bascule, Carte, Champ, ChoixListe, Feuille, TitreSection } from '../components/ui'
import { ReglageApparence } from '../components/Apparence'
import { Lien } from '../lib/router'
import { LIBELLE_ACTIVITE, depenseJournaliere, objectifCalorique } from '../lib/nutrition'
import { poidsActuel, type EtatUtilisateur } from '../lib/store'
import { modeDemo } from '../lib/supabase'
import { Parrainage } from '../components/Parrainage'
import { PhotoFamille, usePhoto } from '../components/PhotoFamille'
import { telechargerExport } from '../lib/rgpd'
import type { Activite, Praticien } from '../lib/types'
import { dateComplete, entier, nombre } from '../lib/utils'

const PRATICIEN_VIDE: Praticien = { nom: '', role: '', email: '', telephone: '', suivi: '' }

export function Profil() {
  const { seDeconnecter, supprimerCompte } = useApp()
  const { etat, modifier } = useSession()
  const [mesuresOuvertes, setMesuresOuvertes] = useState(false)
  const [praticienOuvert, setPraticienOuvert] = useState(false)
  const [suppressionOuverte, setSuppressionOuverte] = useState(false)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)
  const [confirmationSaisie, setConfirmationSaisie] = useState('')

  // Le nombre qui décide d'ouvrir l'écran : ce qui reste à prendre sur les
  // listes en cours. Le total, lui, ne dit rien une fois au magasin.
  const coursesAPrendre = etat.courses
    .filter((l) => l.clotureeLe === null)
    .reduce((somme, l) => somme + l.articles.filter((a) => !a.pris).length, 0)

  const [taille, setTaille] = useState(String(etat.profil.tailleCm))
  const [age, setAge] = useState(String(etat.profil.age))
  const [objectifKg, setObjectifKg] = useState(String(etat.profil.poidsObjectifKg))
  const [activite, setActivite] = useState<Activite>(etat.profil.activite)

  const praticien = etat.profil.praticien
  const [brouillonPraticien, setBrouillonPraticien] = useState<Praticien>(
    praticien ?? PRATICIEN_VIDE,
  )

  // L'en-tête et le réglage montrent la même photo : un seul jeton les tient
  // d'accord, sans quoi changer l'avatar laisserait l'initiale en place.
  const [jetonPhotos, setJetonPhotos] = useState(0)
  const avatar = usePhoto(etat.profil.id, 'avatar', jetonPhotos)

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

  function ouvrirSuppression() {
    setConfirmationSaisie('')
    setErreurSuppression(null)
    setSuppressionOuverte(true)
  }

  async function confirmerSuppression() {
    setErreurSuppression(null)
    setSuppressionEnCours(true)
    try {
      await supprimerCompte()
    } catch (cause) {
      setErreurSuppression(cause instanceof Error ? cause.message : 'La suppression a échoué.')
      setSuppressionEnCours(false)
    }
  }

  // Repartir de l'état à chaque ouverture : les champs locaux ne se
  // resynchronisent pas tout seuls après un enregistrement.
  function ouvrirPraticien() {
    setBrouillonPraticien(praticien ?? PRATICIEN_VIDE)
    setPraticienOuvert(true)
  }

  function enregistrerPraticien() {
    const propre: Praticien = {
      nom: brouillonPraticien.nom.trim(),
      role: brouillonPraticien.role.trim(),
      email: brouillonPraticien.email.trim(),
      telephone: brouillonPraticien.telephone.trim(),
      suivi: brouillonPraticien.suivi.trim(),
    }
    // Tout vide vaut « pas de praticien » — inutile de garder une coquille.
    const vide = Object.values(propre).every((v) => v === '')
    modifier((brouillon) => {
      brouillon.profil.praticien = vide ? null : propre
    })
    setPraticienOuvert(false)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        {avatar ? (
          <img src={avatar} alt="" className="size-14 shrink-0 rounded-2xl bg-sunken object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primaire-wash font-display text-2xl font-semibold text-primaire">
            {etat.profil.prenom.slice(0, 1).toUpperCase() || '?'}
          </span>
        )}
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
        <TitreSection>Mon petit nom</TitreSection>
        <Carte className="space-y-3 p-5">
          <Champ
            id="petit-nom"
            label="Votre petit nom"
            aide="Celui qu'on vous donne à la maison. L'application s'en servira pour vous parler."
            value={etat.profil.petitNom}
            onChange={(e) =>
              modifier((brouillon) => {
                brouillon.profil.petitNom = e.target.value
              })
            }
            maxLength={24}
            placeholder={etat.profil.prenom || 'Mamakilo'}
          />
          <p className="text-sm text-ink-soft">
            {etat.profil.petitNom.trim()
              ? `L'application vous dira « Bonsoir, ${etat.profil.petitNom.trim()} ».`
              : 'Laissé vide, l’application s’en tient à votre prénom.'}
          </p>
        </Carte>
      </section>

      <section>
        <TitreSection>Mes photos</TitreSection>
        <Carte className="space-y-6 p-5">
          <PhotoFamille
            userId={etat.profil.id}
            cle="avatar"
            forme="rond"
            label="Ma photo"
            aide="Elle remplace l’initiale en haut de cet écran."
            onChange={() => setJetonPhotos((j) => j + 1)}
          />
          <div className="border-t border-line pt-6">
            <PhotoFamille
              userId={etat.profil.id}
              cle="famille"
              label="Ma photo de famille"
              aide="Elle habille le haut de l’écran du jour. Comme la précédente, elle reste sur cet appareil : elle ne part sur aucun serveur, et ne vous suivra donc pas sur un autre téléphone."
            />
          </div>
        </Carte>
      </section>

      <section>
        <TitreSection>Raccourcis</TitreSection>
        <Carte className="divide-y divide-line">
          <Lien
            vers="/app/garde-manger"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <Refrigerator size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mon garde-manger</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/courses"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <ShoppingBasket size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Ma liste de courses</span>
            {coursesAPrendre > 0 && (
              <span className="text-sm text-ink-faint tnum">{coursesAPrendre}</span>
            )}
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/prix"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <Tag size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mes prix</span>
            {etat.prix.length > 0 && (
              <span className="text-sm text-ink-faint tnum">{etat.prix.length}</span>
            )}
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/ticket"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <ReceiptText size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Lire un ticket de caisse</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/stats"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <TrendingUp size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mes statistiques</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/coach"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <MessageCircle size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mon coach</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/menus"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <CalendarDays size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mes menus de la semaine</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/sport"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <Dumbbell size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mon activité physique</span>
            {etat.seances.length > 0 && (
              <span className="text-sm text-ink-faint tnum">{etat.seances.length}</span>
            )}
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/plan"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <NotebookText size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mon plan alimentaire</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/badges"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <Award size={19} className="shrink-0 text-accent" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Mes badges</span>
            <span className="text-sm text-ink-faint tnum">{etat.badges.length}</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/sante"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <HeartPulse size={19} className="shrink-0 text-reussite" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Importer depuis Apple Santé</span>
            {etat.mesuresSante.length > 0 && (
              <span className="text-sm text-ink-faint tnum">{etat.mesuresSante.length} j</span>
            )}
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/envies"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <ShieldHalf size={19} className="shrink-0 text-alerte" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Anti-grignotage</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <Lien
            vers="/app/jeux"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <Gamepad2 size={19} className="shrink-0 text-alerte" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Les jeux</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          {praticien?.suivi && (
            <a
              href={praticien.suivi}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
            >
              <ExternalLink size={19} className="shrink-0 text-reussite" aria-hidden="true" />
              <span className="flex-1 font-medium text-ink">Mon suivi en ligne</span>
              <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
            </a>
          )}
        </Carte>
      </section>

      <section>
        <TitreSection>Un coup de pouce</TitreSection>
        <Parrainage />
      </section>

      <section>
        <TitreSection>Mon praticien</TitreSection>
        <Carte className="p-5">
          {praticien ? (
            <div className="flex items-start gap-3">
              <Stethoscope size={19} className="mt-0.5 shrink-0 text-reussite" aria-hidden="true" />
              <div className="min-w-0 space-y-0.5">
                <p className="font-semibold text-ink">{praticien.nom || 'Sans nom'}</p>
                {praticien.role && <p className="text-sm text-ink-soft">{praticien.role}</p>}
                {praticien.email && (
                  <p className="truncate text-sm text-ink-soft">{praticien.email}</p>
                )}
                {praticien.telephone && (
                  <p className="text-sm text-ink-soft tnum">{praticien.telephone}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              Si un diététicien ou un médecin vous suit, enregistrez ses coordonnées ici pour les
              retrouver depuis votre plan. Elles restent dans votre compte, visibles de vous seul.
            </p>
          )}
        </Carte>
        <Bouton ton="doux" pleineLargeur className="mt-3" onClick={ouvrirPraticien}>
          {praticien ? 'Modifier mon praticien' : 'Ajouter mon praticien'}
        </Bouton>
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
            {/* Un consentement doit se retirer aussi facilement qu'il se donne
                (RGPD, art. 7.3). Le retirer coupe l'envoi ; la conversation
                déjà tenue reste lisible tant qu'on ne l'efface pas. */}
            <Bascule
              label="Envoyer mes données au coach"
              aide="Sans cet accord, le coach ne peut pas répondre : rien ne part de votre navigateur."
              actif={etat.consentementCoach !== null}
              onChange={(v) =>
                modifier((brouillon) => {
                  brouillon.consentementCoach = v ? new Date().toISOString() : null
                })
              }
            />
          </div>
        </Carte>
      </section>

      <section>
        <TitreSection eyebrow="Apparence">Vos couleurs</TitreSection>
        <Carte className="p-5">
          <ReglageApparence />
          <p className="mt-5 border-t border-line pt-4 text-xs text-ink-faint">
            Le choix est mémorisé sur cet appareil, pas dans votre compte : l’écran d’un téléphone
            le soir n’appelle pas le même thème que celui d’un ordinateur en plein jour.
          </p>
        </Carte>
      </section>

      <section>
        <TitreSection>Vos données</TitreSection>
        <Carte className="p-5">
          <p className="text-sm text-ink-soft">
            {modeDemo
              ? 'Vos données sont enregistrées dans ce navigateur uniquement. Elles ne quittent pas cet appareil, et disparaîtraient si vous effaciez les données du site.'
              : 'Vos données sont enregistrées sur votre compte et synchronisées entre vos appareils. Vous seul y avez accès.'}
          </p>
          {etat.consentement && (
            <p className="mt-3 flex items-start gap-2 border-t border-line pt-3 text-xs text-ink-faint">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-reussite" aria-hidden="true" />
              Traitement accepté le {dateComplete(etat.consentement.accepteLe)}.
            </p>
          )}
        </Carte>

        <Carte className="mt-3 divide-y divide-line">
          <button
            type="button"
            onClick={() => telechargerExport(etat)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-sunken"
          >
            <Download size={19} className="shrink-0 text-primaire" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">Exporter mes données</span>
              <span className="block text-xs text-ink-soft">
                Tout ce que l’application conserve, dans un fichier.
              </span>
            </span>
          </button>
          <Lien
            vers="/confidentialite"
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-sunken"
          >
            <ShieldCheck size={19} className="shrink-0 text-reussite" aria-hidden="true" />
            <span className="flex-1 font-medium text-ink">Confidentialité et mentions légales</span>
            <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden="true" />
          </Lien>
          <button
            type="button"
            onClick={ouvrirSuppression}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-sunken"
          >
            <Trash2 size={19} className="shrink-0 text-alerte" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-alerte">Supprimer mon compte</span>
              <span className="block text-xs text-ink-soft">
                Efface définitivement vos données et votre compte.
              </span>
            </span>
          </button>
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

      <Feuille
        ouvert={suppressionOuverte}
        titre="Supprimer mon compte"
        onFermer={() => setSuppressionOuverte(false)}
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            Tout part : votre profil{inventaire(etat)}. Aucune copie n’est conservée et il n’y a
            pas de délai pour revenir en arrière.
          </p>
          <p className="rounded-tile bg-sunken px-4 py-3 text-sm text-ink-soft">
            Si vous voulez en garder une trace, fermez cette fenêtre et commencez par{' '}
            <button
              type="button"
              onClick={() => telechargerExport(etat)}
              className="font-semibold text-primaire underline underline-offset-2"
            >
              exporter vos données
            </button>
            .
          </p>

          <Champ
            id="confirmation-suppression"
            label="Tapez SUPPRIMER pour confirmer"
            aide="Une saisie volontaire, pour qu’un bouton rouge ne suffise pas à tout effacer."
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={confirmationSaisie}
            onChange={(e) => setConfirmationSaisie(e.target.value)}
          />

          {erreurSuppression && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-2xl bg-alerte-wash px-4 py-3 text-sm text-alerte"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              {erreurSuppression}
            </p>
          )}

          <Bouton
            ton="alerte"
            pleineLargeur
            disabled={confirmationSaisie.trim().toUpperCase() !== 'SUPPRIMER' || suppressionEnCours}
            onClick={() => void confirmerSuppression()}
          >
            <Trash2 size={17} aria-hidden="true" />
            {suppressionEnCours ? 'Suppression…' : 'Supprimer définitivement'}
          </Bouton>
        </div>
      </Feuille>

      <Feuille
        ouvert={praticienOuvert}
        titre="Mon praticien"
        onFermer={() => setPraticienOuvert(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            Ces coordonnées sont celles d’une autre personne : elles restent dans votre compte et
            ne sont jamais partagées. Laissez tout vide pour les retirer.
          </p>
          <Champ
            id="praticien-nom"
            label="Nom"
            autoComplete="off"
            value={brouillonPraticien.nom}
            onChange={(e) => setBrouillonPraticien((p) => ({ ...p, nom: e.target.value }))}
          />
          <Champ
            id="praticien-role"
            label="Spécialité"
            aide="Par exemple : diététicien-nutritionniste."
            autoComplete="off"
            value={brouillonPraticien.role}
            onChange={(e) => setBrouillonPraticien((p) => ({ ...p, role: e.target.value }))}
          />
          <Champ
            id="praticien-email"
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={brouillonPraticien.email}
            onChange={(e) => setBrouillonPraticien((p) => ({ ...p, email: e.target.value }))}
          />
          <Champ
            id="praticien-telephone"
            label="Téléphone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={brouillonPraticien.telephone}
            onChange={(e) => setBrouillonPraticien((p) => ({ ...p, telephone: e.target.value }))}
          />
          <Champ
            id="praticien-suivi"
            label="Lien de suivi en ligne"
            aide="L’adresse de votre espace patient, si votre praticien en propose un."
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://"
            value={brouillonPraticien.suivi}
            onChange={(e) => setBrouillonPraticien((p) => ({ ...p, suivi: e.target.value }))}
          />
          <Bouton pleineLargeur onClick={enregistrerPraticien}>
            Enregistrer
          </Bouton>
        </div>
      </Feuille>
    </div>
  )
}

/**
 * Ce qu'on s'apprête à détruire, chiffré. Les catégories vides sont tues :
 * annoncer « vos 0 entrée de journal » à quelqu'un qui n'en a aucune sonne
 * faux, et allonge une phrase qu'il faut lire jusqu'au bout.
 */
function inventaire(etat: EtatUtilisateur): string {
  const parts = [
    [etat.pesees.length, 'pesée', 'pesées'],
    [etat.journal.length, 'entrée de journal', 'entrées de journal'],
    [etat.envies.length, 'envie notée', 'envies notées'],
    [etat.badges.length, 'badge', 'badges'],
  ] as const

  const listees = parts
    .filter(([n]) => n > 0)
    .map(([n, singulier, pluriel]) => `${n} ${n > 1 ? pluriel : singulier}`)

  if (listees.length === 0) return ''
  if (listees.length === 1) return `, ${listees[0]}`
  return `, ${listees.slice(0, -1).join(', ')} et ${listees.at(-1)}`
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-ink-soft">{libelle}</span>
      <span className="text-sm font-semibold text-ink tnum">{valeur}</span>
    </div>
  )
}
