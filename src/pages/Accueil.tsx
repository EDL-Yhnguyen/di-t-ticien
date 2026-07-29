import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, LineChart, NotebookText, ShieldHalf } from 'lucide-react'
import { Assiette, type PartAssiette } from '../components/Assiette'
import { Bouton, Marque } from '../components/ui'
import { Lien } from '../lib/router'

/**
 * Les quatre temps d'une journée, joués en boucle : plutôt que d'expliquer ce
 * que fait l'application, la page la montre en train de fonctionner.
 */
const SEQUENCE: { legende: string; parts: [number, number, number] }[] = [
  { legende: 'Assiette vide au réveil', parts: [0, 0, 0] },
  { legende: 'Petit déjeuner renseigné', parts: [0, 0.34, 0] },
  { legende: 'Déjeuner renseigné', parts: [0.5, 0.67, 0.5] },
  { legende: 'Journée complète', parts: [1, 1, 1] },
]

const ORDRE = ['proteine', 'feculent', 'legume'] as const
const ANGLES: [number, number][] = [
  [0, 90],
  [90, 180],
  [180, 360],
]

const ATOUTS = [
  {
    Icone: NotebookText,
    titre: 'Votre plan, à cocher',
    texte:
      'Les repas tels que votre diététicienne les a écrits, avec leurs équivalences. Vous cochez, l’assiette se remplit.',
  },
  {
    Icone: LineChart,
    titre: 'Le poids sans l’angoisse',
    texte:
      'Une courbe qui montre la tendance sur des semaines, pas le chiffre du matin. Avec la date estimée d’arrivée.',
  },
  {
    Icone: ShieldHalf,
    titre: 'Les envies, désamorcées',
    texte:
      'Un bouton quand ça monte, un minuteur de dix minutes, et un journal qui repère vos heures à risque.',
  },
  {
    Icone: Gamepad2,
    titre: 'De quoi tenir la distance',
    texte:
      'Séries, badges et trois jeux courts — parce qu’un plan qu’on abandonne au bout d’un mois ne sert à rien.',
  },
]

export function Accueil() {
  const [etape, setEtape] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => setEtape((e) => (e + 1) % SEQUENCE.length), 1900)
    return () => window.clearInterval(t)
  }, [])

  const parts: PartAssiette[] = ORDRE.map((categorie, i) => ({
    categorie,
    debut: ANGLES[i][0],
    fin: ANGLES[i][1],
    ratio: SEQUENCE[etape].parts[i],
  }))

  return (
    <div className="min-h-svh bg-ground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2.5">
          <Marque taille={36} />
          <span className="font-display text-xl font-semibold text-ink">Mamakilo</span>
        </span>
        <Lien vers="/connexion" className="font-semibold text-corail">
          Se connecter
        </Lien>
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pt-8 pb-20 md:grid-cols-2 md:gap-14 md:pt-16">
          <div className="order-2 md:order-1">
            <p className="mb-4 text-sm font-bold tracking-[0.16em] text-apricot uppercase">
              Bien manger, vivre mieux
            </p>
            <h1 className="font-display text-[2.6rem] leading-[1.05] font-semibold text-ink sm:text-6xl">
              Votre assiette,
              <br />
              jour après jour.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              Une diététicienne ne prescrit pas des grammes. Elle prescrit un beau quart d’assiette
              de féculents et des légumes à volonté. Cette application parle la même langue.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Lien vers="/inscription">
                <Bouton className="px-7 py-4 text-base">Créer mon compte</Bouton>
              </Lien>
              <Lien vers="/connexion">
                <Bouton ton="doux" className="px-7 py-4 text-base">
                  J’ai déjà un compte
                </Bouton>
              </Lien>
            </div>

            <p className="mt-5 text-sm text-ink-faint">
              Gratuit. Vos données de santé restent les vôtres.
            </p>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative mx-auto max-w-sm">
              <Assiette parts={parts} className="w-full drop-shadow-xl" />
              <motion.p
                key={etape}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-center text-sm font-medium text-ink-soft"
              >
                {SEQUENCE[etape].legende}
              </motion.p>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="mb-3 font-display text-3xl font-semibold text-ink">
              Pourquoi une assiette plutôt qu’un compteur
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">
              Compter les calories transforme chaque repas en calcul, et chaque écart en dette. Une
              assiette se lit d’un coup d’œil : il manque des légumes, ou il n’en manque pas. Les
              calories sont là, en petit, à titre indicatif — jamais comme consigne.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16">
          <ul className="grid gap-8 sm:grid-cols-2">
            {ATOUTS.map(({ Icone, titre, texte }) => (
              <li key={titre}>
                <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-corail-wash text-corail">
                  <Icone size={21} aria-hidden="true" />
                </span>
                <h3 className="mb-2 text-lg font-semibold text-ink">{titre}</h3>
                <p className="leading-relaxed text-ink-soft">{texte}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-2xl px-5 py-20 text-center">
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Commencez par un repas
            </h2>
            <p className="mt-4 text-lg text-ink-soft">
              Pas par un régime. Le premier soir où l’assiette est complète, vous saurez pourquoi
              ça marche.
            </p>
            <Lien vers="/inscription" className="mt-8 inline-block">
              <Bouton className="px-8 py-4 text-base">Créer mon compte</Bouton>
            </Lien>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-center">
        <p className="text-sm text-ink-faint">
          Mamakilo n’est pas un dispositif médical et ne remplace pas une consultation. Pour un
          suivi personnalisé, consultez un diététicien-nutritionniste.
        </p>
        <Lien
          vers="/confidentialite"
          className="mt-3 inline-block text-sm font-semibold text-ink-soft underline underline-offset-4 transition hover:text-ink"
        >
          Confidentialité et mentions légales
        </Lien>
      </footer>
    </div>
  )
}
