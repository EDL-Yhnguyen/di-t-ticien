# Le courriel de Mamakilo

Ce qui part de Mamakilo, par quel chemin, et **qui le voit passer**.

> **Mamakilo n'a plus de projet Supabase à lui.** Depuis le 04/08/2026 il vit
> sur `exovzmoygupllcdjbwtf`, région `eu-west-3` (Paris), **partagé avec
> Cérémonia et GénieLab** — l'ancien projet `vdnfqijjmuxdrimbyyrv` (`eu-west-1`)
> a été supprimé. C'est la première chose à ne pas confondre, et elle s'est
> inversée : ce qui est réglé pour Cérémonia est désormais réglé **ici aussi**,
> parce que c'est le même réglage physique.

---

## Ce qui part, depuis le 2026-07-31

Un seul message : **le lien de réinitialisation de mot de passe**
(`demanderReinitialisation` dans `src/lib/auth.ts`). Il n'y en avait aucun
avant, et c'est précisément le problème que ce parcours corrige : l'inscription
promettait qu'une adresse servirait « à récupérer votre compte », sans que rien
ne l'implémente.

`Confirm email` est **désactivé** sur le projet, donc l'inscription elle-même
n'envoie rien.

---

## L'envoi est branché, et il ne l'est pas par Mamakilo

**Un SMTP Gmail est configuré sur le projet depuis le 2026-07-31**, posé par
Cérémonia. Mamakilo l'a hérité en rejoignant le projet le 04/08/2026 : le
réglage est au niveau du projet Supabase, pas de l'application, et il n'y a
aucune configuration d'envoi propre à Mamakilo — ni à écrire, ni à maintenir.

| | Valeur en service |
|---|---|
| Projet | `exovzmoygupllcdjbwtf` — partagé, il n'y en a plus qu'un |
| Hôte / port | `smtp.gmail.com` / `587` (STARTTLS) |
| Expéditeur | `yhnguyen.edl@gmail.com` |
| Nom d'expéditeur | **`Cérémonia`** — voir la section suivante |
| Limite d'envoi | **100 messages par heure** |

**La conséquence pratique tient en une phrase : la réinitialisation de mot de
passe délivre pour de bon.** Elle ne délivrait pas avant la migration, et pas
pour la raison qu'on croyait manquer d'ambition — le projet d'alors n'avait
aucun SMTP et retombait sur le service d'envoi intégré de Supabase, **plafonné
à 2 messages par heure**, tous usages confondus. Ce n'est pas un plafond
inconfortable, c'est un plafond sous lequel un parcours de réinitialisation ne
peut pas exister : deux personnes qui cliquent « mot de passe oublié » dans la
même heure, et la seconde n'a rien, sans message d'erreur. **Ce chiffre
appartient à l'histoire du projet, plus à son état.**

Le plafond réel est maintenant celui de Gmail — environ 500 destinataires par
jour, et la limite Supabase posée à 100 par heure reste dessous des deux
côtés. Ses autres limites (pas de SPF ni de DKIM signables sur `gmail.com`,
expéditeur non substituable) et la bascule vers un service transactionnel sont
décrites une fois pour toutes dans **`Ceremonia/docs/email.md`**, sections 3, 4
et 7. **Ne pas les recopier ici** : une copie diverge toujours, et il n'y a
qu'un réglage à changer le jour où ça bouge.

## Google est un destinataire, et il est déclaré

Faire transiter les messages par Gmail veut dire que **Google reçoit l'adresse
de courriel de toute personne à qui Mamakilo écrit**. Une adresse de courriel
est une donnée personnelle, et l'article 13 du RGPD demande de nommer ses
destinataires ; sur une application qui traite des données de santé (art. 9),
une politique de confidentialité qui tairait ce passage serait fausse.

L'entrée vit donc dans **`src/lib/legal.ts`**, avec les autres — et pas dans ce
document. C'est le même raisonnement que celui qui a fait retirer les polices
Google le 31/07/2026, appliqué à une donnée nettement plus identifiante qu'une
adresse IP. `CLAUDE.md` le pose déjà en règle : *tout nouveau destinataire de
données se déclare dans `DESTINATAIRES` au moment où on l'ajoute au code, pas
après.*

**Cette entrée se change en même temps que le SMTP du projet, jamais après** —
entre les deux, la page nomme le mauvais destinataire.

## Le message signe « Cérémonia », et c'est structurel

Le nom d'expéditeur est un réglage **du projet**, pas de l'application. Trois
applications partagent le projet, donc elles partagent l'expéditeur :
quelqu'un qui demande un nouveau mot de passe pour Mamakilo reçoit un message
signé `Cérémonia <yhnguyen.edl@gmail.com>`.

C'était l'un des rares agréments de l'ancien projet dédié — « ici, contrairement
à GénieLab, le nom d'expéditeur peut dire la vérité » — et il est tombé avec
lui. **GénieLab a tranché avant nous : on le dit à l'écran plutôt que de
renommer l'expéditeur** (`GenieLab/docs/email.md`). Renommer coûterait à
Cérémonia sa marque dans la boîte de réception de ses invités, alors que les
deux autres n'envoient qu'un message technique à quelqu'un qui vient de le
demander.

Ce compromis tombe le jour où l'un des trois produits a son propre domaine et
son propre service d'envoi.

## Les URL de retour

`Authentication → URL Configuration`, sur le projet partagé. Sans elles le
message part, mais son lien ramène sur la Site URL : Supabase **n'émet aucune
erreur** quand la correspondance échoue, il remplace silencieusement le
`redirectTo`. La panne se lit comme « le lien ne marche pas ».

Ce que la liste doit couvrir pour Mamakilo — **basculée le 04/08/2026 avec les
variables Vercel**, à revérifier après toute modification faite pour une des
deux autres applications :

```
https://mamakilo.vercel.app/**
https://di-t-ticien.vercel.app/**
http://localhost:5173/**
```

**Les deux domaines, et ce n'est pas de la prudence excessive.**
`di-t-ticien.vercel.app` sert toujours la même application, exprès
(`CLAUDE.md`, « Le renommage du 30 juillet »). `demanderReinitialisation` lit
`window.location.origin` plutôt qu'un domaine figé, justement pour que le lien
revienne là d'où part la demande : quelqu'un dont la PWA est installée depuis
l'ancienne adresse doit pouvoir récupérer son compte.

Des motifs `/**`, pas les URL exactes — la règle et sa justification sont à la
section 4 bis de `Ceremonia/docs/email.md`.

**La Site URL n'a pas à changer**, et elle ne peut pas nous désigner : trois
applications sur un projet ne peuvent pas avoir trois Site URL. Elle ne sert
que de repli ; ce sont les *Redirect URLs* qui autorisent.

---

## Les comptes que ce parcours ne peut pas sauver

Les identifiants historiques sont des pseudos, enregistrés sous
`pseudo@equilibre.local` — un domaine qui ne reçoit rien. **Aucun e-mail ne
leur parviendra jamais**, quel que soit le SMTP branché, et ce n'est pas
réparable depuis l'application.

L'écran le dit plutôt que de faire attendre un message qui n'arrivera pas. Le
seul recours pour ces comptes reste le tableau de bord Supabase,
`Authentication → Users`.

C'est aussi la raison pour laquelle `exigeEmailReel` refuse un pseudo à
l'inscription en mode synchronisé : le stock de comptes irrécupérables ne
grossit plus.

---

## Le jour où `Confirm email` s'active

**Le code est déjà prêt.** `inscription()` traite les deux cas que la
confirmation fait apparaître, chacun avec son message : `identities.length === 0`
(l'adresse est déjà prise, Supabase renvoyant un utilisateur factice plutôt que
de l'admettre) et `!data.session` (le compte existe, aucune session n'est
ouverte). L'activer est donc un **réglage**, pas un chantier.

Ce qu'elle apporterait : aujourd'hui n'importe qui peut créer un compte avec
l'adresse d'un autre, et une faute de frappe à l'inscription lie un journal
alimentaire — donnée de santé, RGPD art. 9 — à une adresse que la personne ne
possède pas, donc à un compte qu'elle ne pourra jamais récupérer.

Ce qu'elle coûterait : une étape de plus avant le premier écran, sur un produit
dont l'inscription est aujourd'hui immédiate.

**L'obstacle n'est plus l'envoi, c'est le réglage lui-même — et il ne nous
appartient pas.** `Confirm email` vaut pour les trois applications du projet ;
l'activer pour Mamakilo l'activerait pour Cérémonia, dont `signUpAction`
redirige sans condition vers le tableau de bord et renverrait alors sur
`/login`, ce qui a tout l'air d'une panne (`Ceremonia/docs/email.md`,
section 5). **C'est donc une décision à trois, pas un interrupteur.**

Reste le piège propre à Mamakilo, qui ne dépend d'aucun SMTP : avec la
confirmation active, un compte créé en pseudo `@equilibre.local` déclenche un
envoi qui échoue, et **le compte n'est pas créé du tout**. C'est la cause n° 1
de « les utilisateurs n'apparaissent pas dans Supabase », déjà documentée dans
`CLAUDE.md`. `exigeEmailReel` la referme côté inscription, mais elle reste vraie
de tout script qui créerait un compte autrement.

---

## Vérifier que ça délivre

1. Depuis la production, pas depuis une préversion Vercel — leur domaine
   éphémère n'est pas dans la liste autorisée, et ne doit pas y être : un motif
   assez large pour les couvrir remettrait des jetons de réinitialisation à
   tout projet Vercel portant un nom voisin.
2. « Mot de passe oublié » → l'écran doit annoncer l'envoi **quelle que soit**
   l'adresse saisie. Une adresse inconnue qui répondrait autre chose ferait de
   cette page un moyen de savoir qui tient un journal alimentaire.
3. Le message arrive — signé `Cérémonia`, ce n'est pas un défaut —, son lien
   ouvre `/nouveau-mot-de-passe` **sur le domaine d'où part la demande**, et
   l'écran de choix s'affiche — pas l'accueil.
4. Le nouveau mot de passe ouvre la session sur un autre appareil.
5. Rouvrir le même lien une seconde fois : il doit annoncer un lien périmé, pas
   une page blanche.
</content>
