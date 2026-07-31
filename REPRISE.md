# Reprise — Mamakilo

Dernière séance : 2026-07-31 · dernier commit : `83e495f` *retrouver son compte
quand le mot de passe est oublié*

## Où on en est

**Le parcours « mot de passe oublié » est écrit, buildé et commité — mais il ne
délivre encore aucun message.** Deux réglages de console manquent, tous deux
décrits dans `docs/email.md` : aucun SMTP n'est branché sur le projet
`vdnfqijjmuxdrimbyyrv` (donc 2 messages par heure, le plafond du service
intégré), et les URL de retour ne sont pas autorisées (donc le lien ramènerait
sur la Site URL sans la moindre erreur).

Le code se comporte correctement dans les deux cas : il n'invente pas de succès.
Mais tant que ces deux réglages ne sont pas faits, un utilisateur qui demande un
lien ne reçoit rien.

**Un autre chantier est en cours dans ce dépôt, non commité** — une suite de
tests Vitest, qui n'est pas de mon fait et à laquelle je n'ai pas touché :
`vitest.config.ts`, `src/lib/aliments/recherche.test.ts`,
`src/lib/ingredients.test.ts`, `src/lib/nutriscore.test.ts`, plus les
modifications de `package.json` et `package-lock.json`. Ne pas le commiter à sa
place, ne pas le ranger.

## La prochaine action

**Brancher le SMTP sur le projet `vdnfqijjmuxdrimbyyrv`** — `docs/email.md`,
section « Aucun SMTP n'est branché ». La procédure est celle, déjà éprouvée, des
sections 2 à 4 de `Ceremonia/docs/email.md` ; seules changent la référence du
projet et le nom d'expéditeur, qui peut ici dire la vérité.

Puis autoriser les URL de retour, **les deux domaines**, et rejouer les cinq
contrôles de la fin de `docs/email.md`.

## Décidé cette séance

- **La récupération passe par une session provisoire**, dont la garde s'exécute
  avant le consentement et l'onboarding : un lien reçu par e-mail ne prouve que
  l'accès à une boîte aux lettres, pas le droit d'ouvrir l'application.
- **Le fragment d'URL se lit dans `supabase.ts`, avant la création du client.**
  `detectSessionInUrl` le consomme pendant l'initialisation, et l'événement
  `PASSWORD_RECOVERY` est émis avant qu'un composant React ait pu s'y abonner :
  les deux signaux se complètent, aucun ne suffit seul.
- **L'écran répond la même phrase que l'adresse existe ou non.** Un « compte
  inconnu » ferait de cette page publique un moyen de savoir qui tient un
  journal alimentaire.
- **Les comptes en `@equilibre.local` sont déclarés irrécupérables**, à l'écran
  et dans `docs/email.md`, plutôt que de faire attendre un message qui
  n'arrivera jamais.
- **Le champ d'identifiant cesse de promettre un pseudo en mode synchronisé** —
  il y était refusé à l'envoi, après saisie.

## À ne pas refaire

- **Ne pas s'appuyer sur le seul événement `PASSWORD_RECOVERY`** : il est émis
  trop tôt pour un abonnement posé dans un `useEffect`.
- **Ne pas lire `window.location.hash` depuis un composant** : le client
  Supabase l'a déjà effacé au premier rendu.
- **Ne pas figer le domaine dans `redirectTo`.** L'application répond sur
  `mamakilo.vercel.app` **et** `di-t-ticien.vercel.app` ; le lien doit revenir
  là d'où part la demande, sinon une PWA installée depuis l'ancienne adresse
  perd sa session en cours de route.
