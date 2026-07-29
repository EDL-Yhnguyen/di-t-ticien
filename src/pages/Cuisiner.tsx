import { useMemo, useState } from 'react'
import { Check, ChefHat, Clock, Leaf, ShoppingBasket } from 'lucide-react'
import { useSession } from '../context/AppContext'
import { Bouton, Carte, Etiquette, EtatVide, TitreSection } from '../components/ui'
import { Lien } from '../lib/router'
import { recettesRealisables } from '../lib/stocks'
import type { RecetteRealisable } from '../lib/stocks'
import type { Moment } from '../lib/types'
import { LIBELLE_MOMENT, MOMENTS } from '../lib/types'
import { classes, entier } from '../lib/utils'

/**
 * Au-delà, une section cesse d'être une proposition pour redevenir une liste.
 * Six tient dans un écran de téléphone sans faire défiler indéfiniment.
 */
const MAX_PAR_SECTION = 6

/** Les paliers de temps qu'on se donne vraiment : « j'ai dix minutes », « une heure ». */
const TEMPS = [
  { valeur: undefined, libelle: 'Peu importe' },
  { valeur: 15, libelle: '15 min' },
  { valeur: 30, libelle: '30 min' },
  { valeur: 60, libelle: '1 h' },
] as const

export function Cuisiner() {
  const { etat } = useSession()
  const [moment, setMoment] = useState<Moment | undefined>(undefined)
  const [minutesMax, setMinutesMax] = useState<number | undefined>(undefined)

  const propositions = useMemo(
    () => recettesRealisables(etat.stocks, { moment, minutesMax }),
    [etat.stocks, moment, minutesMax],
  )

  const sauvetages = propositions.filter((p) => p.sauve.length > 0)
  const completes = propositions.filter((p) => p.sauve.length === 0 && p.manquants.length === 0)
  const presque = propositions.filter((p) => p.sauve.length === 0 && p.manquants.length > 0)

  if (etat.stocks.length === 0) {
    return (
      <div className="space-y-6">
        <EnTete />
        <Carte>
          <EtatVide
            emoji="🧺"
            titre="Votre garde-manger est vide"
            action={
              <Lien vers="/app/garde-manger" className="inline-block">
                <Bouton>Remplir mon garde-manger</Bouton>
              </Lien>
            }
          >
            Notez ce que vous avez dans le frigo, les placards et le congélateur : les recettes
            possibles apparaîtront ici.
          </EtatVide>
        </Carte>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <EnTete />

      {/* ── Filtres ── */}
      <section className="animate-rise space-y-3" style={{ animationDelay: '60ms' }}>
        <Filtres
          label="Pour quel repas ?"
          options={[
            { valeur: undefined, libelle: 'Tous' },
            ...MOMENTS.map((m) => ({ valeur: m as Moment | undefined, libelle: LIBELLE_MOMENT[m] })),
          ]}
          valeur={moment}
          onChange={setMoment}
        />
        <Filtres
          label="J’ai combien de temps ?"
          options={TEMPS.map((t) => ({ valeur: t.valeur as number | undefined, libelle: t.libelle }))}
          valeur={minutesMax}
          onChange={setMinutesMax}
        />
      </section>

      {propositions.length === 0 && (
        <Carte>
          <EtatVide emoji="🤷" titre="Rien ne colle avec ces filtres">
            Élargissez le temps disponible, ou ajoutez ce qui vous reste dans le garde-manger.
          </EtatVide>
        </Carte>
      )}

      {sauvetages.length > 0 && (
        <section className="animate-rise" style={{ animationDelay: '120ms' }}>
          <TitreSection eyebrow="Anti-gaspillage">Ça sauve ce qui va périmer</TitreSection>
          {/* Une tomate entre dans quinze recettes : sans plafond, la section
              qui doit dire « fais celle-ci ce soir » redevient le catalogue.
              Le nombre écarté est annoncé plutôt que tu. */}
          <div className="space-y-3">
            {sauvetages.slice(0, MAX_PAR_SECTION).map((p) => (
              <CarteRecette key={p.recette.id} proposition={p} />
            ))}
          </div>
          {sauvetages.length > MAX_PAR_SECTION && (
            <p className="mt-2 px-1 text-xs text-ink-soft tnum">
              {sauvetages.length} recettes emploient ce qui presse — voici les{' '}
              {MAX_PAR_SECTION} pour lesquelles il vous manque le moins.
            </p>
          )}
        </section>
      )}

      {completes.length > 0 && (
        <section className="animate-rise" style={{ animationDelay: '180ms' }}>
          <TitreSection eyebrow="Sans rien acheter">Vous avez tout ce qu’il faut</TitreSection>
          <div className="space-y-3">
            {completes.slice(0, MAX_PAR_SECTION).map((p) => (
              <CarteRecette key={p.recette.id} proposition={p} />
            ))}
          </div>
        </section>
      )}

      {presque.length > 0 && (
        <section className="animate-rise" style={{ animationDelay: '240ms' }}>
          <TitreSection eyebrow="À un ou deux ingrédients près">Presque possible</TitreSection>
          <div className="space-y-3">
            {presque.slice(0, MAX_PAR_SECTION).map((p) => (
              <CarteRecette key={p.recette.id} proposition={p} />
            ))}
          </div>
          {presque.length > MAX_PAR_SECTION && (
            <p className="mt-2 px-1 text-xs text-ink-soft tnum">
              {presque.length - MAX_PAR_SECTION} autres recettes demandent un peu plus de courses.
            </p>
          )}
        </section>
      )}

      <p className="px-1 pb-2 text-xs text-ink-soft">
        Les correspondances se font sur les noms des produits, pas sur un inventaire pesé. Chaque
        ingrédient indique ce qui, chez vous, lui a été rapproché — vérifiez d’un coup d’œil.
      </p>
    </div>
  )
}

function EnTete() {
  return (
    <header className="animate-rise">
      <h1 className="font-display text-2xl font-semibold text-ink">Que puis-je cuisiner ?</h1>
      <p className="mt-1 text-sm text-ink-soft">
        À partir de ce que vous avez déjà, en commençant par ce qui ne doit pas être perdu.
      </p>
    </header>
  )
}

function Filtres<T>({
  label,
  options,
  valeur,
  onChange,
}: {
  label: string
  options: { valeur: T; libelle: string }[]
  valeur: T
  onChange: (v: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const actif = option.valeur === valeur
          return (
            <button
              key={String(option.libelle)}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(option.valeur)}
              className={classes(
                'rounded-full border px-3.5 py-2 text-sm font-semibold transition',
                actif
                  ? 'border-corail bg-corail text-white'
                  : 'border-line bg-surface text-ink-soft hover:bg-sunken',
              )}
            >
              {option.libelle}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function CarteRecette({ proposition }: { proposition: RecetteRealisable }) {
  const { recette, couverts, manquants, part, sauve } = proposition
  const [deplie, setDeplie] = useState(false)

  return (
    <Carte className="overflow-hidden">
      <button
        type="button"
        onClick={() => setDeplie((v) => !v)}
        aria-expanded={deplie}
        className="w-full px-5 py-4 text-left transition hover:bg-sunken"
      >
        <div className="flex items-start gap-3">
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-semibold text-ink">
              {recette.titre}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft tnum">
              <span className="inline-flex items-center gap-1">
                <Clock size={13} aria-hidden="true" />
                {recette.minutes} min
              </span>
              <span>{entier(recette.kcal)} kcal</span>
              <span>{LIBELLE_MOMENT[recette.moment]}</span>
            </span>
          </span>
          <span className="shrink-0 text-right">
            {/* Le vert de réussite est réservé à ce qui l'est : afficher 25 %
                dans la même couleur que 100 % laisserait croire qu'on peut
                se mettre aux fourneaux. */}
            <span
              className={classes(
                'font-display text-xl font-semibold tnum',
                part >= 0.99 ? 'text-basil' : part >= 0.6 ? 'text-apricot' : 'text-ink-soft',
              )}
            >
              {Math.round(part * 100)} %
            </span>
            <span className="block text-[0.6875rem] text-ink-faint">des ingrédients</span>
          </span>
        </div>

        {sauve.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-2">
            <Etiquette ton="basil">
              <Leaf size={12} className="mr-1" aria-hidden="true" />
              Sauve {sauve.map((a) => a.nom).join(', ')}
            </Etiquette>
          </p>
        )}
      </button>

      {deplie && (
        <div className="border-t border-line px-5 py-4">
          <h3 className="mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
            Vous avez
          </h3>
          <ul className="space-y-1.5">
            {couverts.map(({ ingredient, article }) => (
              <li key={ingredient.nom} className="flex items-start gap-2 text-sm">
                <Check size={15} className="mt-0.5 shrink-0 text-basil" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-ink">
                  {ingredient.quantite} {ingredient.nom}
                  {/* Le rapprochement est affiché, jamais supposé : c'est ce
                      qui rend une erreur de nom visible avant la casserole. */}
                  {article && article.nom.toLowerCase() !== ingredient.nom.toLowerCase() && (
                    <span className="text-ink-faint"> — chez vous : {article.nom}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {manquants.length > 0 && (
            <>
              <h3 className="mt-4 mb-2 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
                Il vous manque
              </h3>
              <ul className="space-y-1.5">
                {manquants.map((ingredient) => (
                  <li key={ingredient.nom} className="flex items-start gap-2 text-sm">
                    <ShoppingBasket
                      size={15}
                      className="mt-0.5 shrink-0 text-apricot"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 text-ink-soft">
                      {ingredient.quantite} {ingredient.nom}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* La recette est déroulée ici plutôt que derrière un lien : le
              routeur n'a pas de segment dynamique, donc « ouvrir la recette »
              ne saurait ouvrir que la page Cuisine entière, à charge pour la
              personne de retrouver le plat qu'elle venait de choisir. */}
          <h3 className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-ink-faint uppercase">
            <ChefHat size={13} aria-hidden="true" />
            La recette
          </h3>
          <ol className="space-y-2">
            {recette.etapes.map((etape, index) => (
              <li key={etape} className="flex gap-2.5 text-sm text-ink">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-corail-wash text-[0.6875rem] font-bold text-corail tnum">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">{etape}</span>
              </li>
            ))}
          </ol>

          {recette.astuce && (
            <p className="mt-3 rounded-tile bg-sunken px-3.5 py-2.5 text-sm text-ink-soft">
              <span className="font-semibold text-ink">Astuce.</span> {recette.astuce}
            </p>
          )}
        </div>
      )}
    </Carte>
  )
}
