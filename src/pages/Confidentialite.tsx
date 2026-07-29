import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Carte } from '../components/ui'
import { useRoutage } from '../lib/router'
import {
  DESTINATAIRES,
  EDITEUR,
  EDITEUR_NON_PROFESSIONNEL,
  HEBERGEUR_BASE,
  HEBERGEUR_SITE,
  REGION_BASE,
  VERSION_CONFIDENTIALITE,
  contactProvisoire,
  editeurRenseigne,
} from '../lib/legal'
import { modeDemo } from '../lib/supabase'
import { dateComplete } from '../lib/utils'

/**
 * Un seul écran pour la politique de confidentialité et les mentions légales.
 * Les séparer obligerait à répéter l'identité de l'éditeur, et personne ne va
 * chercher deux pages là où une suffit.
 */
export function Confidentialite() {
  const { aller, retour } = useRoutage()

  // Cette page s'atteint aussi par un lien partagé, sans rien derrière soi :
  // `history.back()` ne ferait alors rien du tout.
  const revenir = () => (window.history.length > 1 ? retour() : aller('/'))

  return (
    <div className="min-h-svh bg-ground">
      <header className="sticky top-0 z-10 border-b border-line bg-ground/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={revenir}
            aria-label="Revenir à l’écran précédent"
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-sunken hover:text-ink"
          >
            <ArrowLeft size={19} />
          </button>
          <span className="font-display text-lg font-semibold text-ink">
            Confidentialité et mentions légales
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-5 py-8">
        <p className="text-sm text-ink-faint">
          Version en vigueur du {dateComplete(VERSION_CONFIDENTIALITE)}.
        </p>

        {!editeurRenseigne && (
          <Carte className="border-berry bg-berry-wash p-4">
            <p className="text-sm text-berry">
              <strong className="font-semibold">Mentions incomplètes.</strong> L’identité de
              l’éditeur n’est pas renseignée. Elle est obligatoire avant toute mise à disposition
              du public : complétez <code className="font-mono">EDITEUR</code> dans{' '}
              <code className="font-mono">src/lib/legal.ts</code>.
            </p>
          </Carte>
        )}

        {editeurRenseigne && contactProvisoire && (
          <Carte className="border-apricot bg-apricot-wash p-4">
            <p className="text-sm text-apricot">
              <strong className="font-semibold">Adresse de contact provisoire.</strong> Personne ne
              peut exercer ses droits sur une adresse qui n’existe pas. Remplacez{' '}
              <code className="font-mono">EDITEUR.contact</code> dans{' '}
              <code className="font-mono">src/lib/legal.ts</code> par une boîte réellement relevée
              avant d’ouvrir le site à d’autres personnes.
            </p>
          </Carte>
        )}

        <Carte className="flex items-start gap-3 p-5">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-basil" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink-soft">
            Un journal alimentaire et des pesées sont des <strong>données de santé</strong>. Elles
            ne servent qu’à vous afficher votre propre suivi. Elles ne sont ni vendues, ni louées,
            ni utilisées pour de la publicité, ni analysées pour établir un profil commercial.
          </p>
        </Carte>

        <Section titre="Qui traite vos données">
          {!editeurRenseigne ? (
            <p>À compléter avant la mise en ligne publique.</p>
          ) : (
            <>
              {EDITEUR_NON_PROFESSIONNEL ? (
                <p>
                  Ce site est édité par un <strong>particulier, à titre non professionnel</strong>.
                  La loi lui permet de ne pas publier son nom et son adresse (LCEN, art. 6-III-2) :
                  il les a communiqués à son hébergeur, {HEBERGEUR_SITE.nom}, qui les tient à la
                  disposition de l’autorité judiciaire.
                </p>
              ) : (
                <p>
                  Le responsable du traitement est <strong>{EDITEUR.nom}</strong> ({EDITEUR.statut}
                  ), {EDITEUR.adresse}.
                </p>
              )}
              <p>
                Pour toute question ou pour exercer vos droits :{' '}
                <a
                  href={`mailto:${EDITEUR.contact}`}
                  className="font-semibold text-iris underline underline-offset-2"
                >
                  {EDITEUR.contact}
                </a>
                .
              </p>
            </>
          )}
        </Section>

        <Section titre="Ce qui est collecté">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Votre compte</strong> : identifiant (adresse e-mail ou pseudo) et prénom.
            </li>
            <li>
              <strong>Vos mesures</strong> : âge, sexe, taille, poids de départ, poids visé,
              niveau d’activité, et l’historique de vos pesées.
            </li>
            <li>
              <strong>Votre journal alimentaire</strong> : les aliments enregistrés, leurs
              quantités, la date et le repas concerné.
            </li>
            <li>
              <strong>Votre suivi</strong> : verres d’eau, envies notées, badges, scores des jeux,
              cases cochées du plan.
            </li>
            <li>
              <strong>Ce que vous importez</strong> : les mesures du fichier d’export d’Apple
              Santé, si vous en chargez un.
            </li>
            <li>
              <strong>Les coordonnées d’un praticien</strong>, si vous choisissez de les saisir.
              Elles restent dans votre compte et ne sont transmises à personne.
            </li>
          </ul>
          <p>
            Aucune donnée n’est collectée à votre insu : tout ce qui figure ci-dessus a été saisi
            ou importé par vous.
          </p>
        </Section>

        <Section titre="Pourquoi, et sur quelle base">
          <p>
            Ces données servent à calculer vos repères caloriques, à afficher votre journal, votre
            courbe de poids et vos analyses. Rien d’autre.
          </p>
          <p>
            La base légale est votre <strong>consentement explicite</strong> (RGPD, art. 9.2.a),
            recueilli à la première ouverture et redemandé si ce texte change sur le fond. Vous
            pouvez le retirer à tout moment en supprimant votre compte depuis votre profil.
          </p>
        </Section>

        <Section titre="Où elles sont stockées">
          {modeDemo ? (
            <p>
              Cette installation fonctionne en <strong>mode démo</strong> : vos données ne quittent
              pas ce navigateur. Elles ne sont envoyées à aucun serveur, et disparaîtraient si vous
              effaciez les données du site.
            </p>
          ) : (
            <p>
              Vos données sont enregistrées sur un serveur {HEBERGEUR_BASE.nom} situé en{' '}
              {REGION_BASE}, dans une table où chaque compte ne peut lire et écrire que sa propre
              ligne. Le site lui-même est hébergé par {HEBERGEUR_SITE.nom}.
            </p>
          )}
          <p>
            Elles sont conservées tant que votre compte existe. Leur suppression est immédiate et
            définitive dès que vous la demandez.
          </p>
        </Section>

        <Section titre="Qui d’autre en reçoit">
          <ul className="space-y-3">
            {DESTINATAIRES.map((d) => (
              <li key={d.nom}>
                <p className="font-semibold text-ink">
                  {d.nom} — <span className="font-normal text-ink-soft">{d.role}</span>
                </p>
                <p className="text-ink-soft">{d.donnees}</p>
              </li>
            ))}
          </ul>
          <p>Aucun autre tiers ne reçoit quoi que ce soit.</p>
        </Section>

        <Section titre="Vos droits">
          <p>Vous disposez des droits suivants, exerçables directement dans l’application :</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Accès et portabilité</strong> (art. 15 et 20) — le bouton « Exporter mes
              données » de votre profil télécharge l’intégralité de votre document, en JSON.
            </li>
            <li>
              <strong>Rectification</strong> (art. 16) — toutes vos données sont modifiables depuis
              les écrans où elles ont été saisies.
            </li>
            <li>
              <strong>Effacement et retrait du consentement</strong> (art. 17 et 7.3) — le bouton
              « Supprimer mon compte » détruit vos données et votre compte, sans conservation ni
              délai de rétractation.
            </li>
          </ul>
          <p>
            Si une réponse ne vous satisfait pas, vous pouvez saisir la{' '}
            <a
              href="https://www.cnil.fr/fr/plaintes"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-iris underline underline-offset-2"
            >
              CNIL
            </a>
            .
          </p>
        </Section>

        <Section titre="Cookies et traceurs">
          <p>
            Équilibre ne dépose <strong>aucun cookie publicitaire ni traceur de mesure
            d’audience</strong>. Le stockage local du navigateur sert uniquement à garder votre
            session ouverte et à retenir votre choix de thème clair ou sombre : ces usages sont
            strictement nécessaires au fonctionnement du service et ne demandent pas de bandeau de
            consentement.
          </p>
        </Section>

        <Section titre="Ce que l’application n’est pas">
          <p>
            Équilibre n’est pas un dispositif médical. Les plans qu’elle affiche sont des repères
            calculés (formule de Mifflin-St Jeor, déficit de 20 %, plancher de 1 200 kcal), pas une
            prescription. Pour un suivi personnalisé, consultez un diététicien-nutritionniste.
          </p>
        </Section>

        <Section titre="Hébergement">
          <p>
            Site : {HEBERGEUR_SITE.nom}, {HEBERGEUR_SITE.adresse} —{' '}
            <a
              href={HEBERGEUR_SITE.site}
              target="_blank"
              rel="noopener noreferrer"
              className="text-iris underline underline-offset-2"
            >
              {HEBERGEUR_SITE.site}
            </a>
          </p>
          <p>
            Base de données : {HEBERGEUR_BASE.nom}, {HEBERGEUR_BASE.adresse} —{' '}
            <a
              href={HEBERGEUR_BASE.site}
              target="_blank"
              rel="noopener noreferrer"
              className="text-iris underline underline-offset-2"
            >
              {HEBERGEUR_BASE.site}
            </a>
          </p>
        </Section>
      </main>
    </div>
  )
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-xl font-semibold text-ink">{titre}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  )
}
