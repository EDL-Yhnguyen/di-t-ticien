const LIEN =
  'https://fr.igraal.com/parrainage?parrain=AG_55df2aa7a0e1b&utm_medium=raf&utm_source=refer_friend'

/**
 * Le lien de parrainage iGraal.
 *
 * La mention n'est pas décorative : une communication commerciale doit pouvoir
 * être reconnue comme telle au moment où on la voit, pas dans une page de
 * conditions que personne n'ouvre. Elle est donc au-dessus du lien, et non
 * en dessous — on ne clique pas avant d'avoir lu.
 *
 * **Le lien est le même pour tout le monde.** Il n'est jamais personnalisé
 * selon le profil ni le journal alimentaire : ce serait du ciblage publicitaire
 * sur données de santé, et la promesse de l'écran de consentement — « ni
 * publicité, ni revente, ni profilage » — tomberait pour de bon. Rien de
 * l'utilisateur ne part vers iGraal : c'est une adresse statique.
 */
export function Parrainage() {
  return (
    <aside className="rounded-card border border-line bg-sunken p-4">
      <p className="text-sm font-semibold text-ink">
        <span className="text-accent">Lien de parrainage</span> — iGraal
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Si vous vous inscrivez par ce lien, l’éditeur du site reçoit une contrepartie. Ça ne change
        rien pour vous, et aucune de vos données ne part là-bas.
      </p>
      <a
        href={LIEN}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block font-semibold text-primaire underline underline-offset-4"
      >
        Découvrir iGraal
      </a>
    </aside>
  )
}
