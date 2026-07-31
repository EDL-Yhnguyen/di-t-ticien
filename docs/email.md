# Le courriel de Mamakilo

Ce qui part de Mamakilo, par quel chemin, et **ce qui doit être réglé avant que
le parcours « mot de passe oublié » fonctionne pour de bon**.

> **Mamakilo a son propre projet Supabase**, `vdnfqijjmuxdrimbyyrv`, région
> `eu-west-1`. Il ne partage rien avec celui de Cérémonia et de GénieLab :
> aucun réglage fait là-bas ne vaut ici. C'est la première chose à ne pas
> confondre.

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

## ⚠️ Les deux réglages sans lesquels rien n'arrive

Le code est en place et se comporte correctement dans les deux cas ; ce qui
suit relève de la console Supabase, pas du dépôt.

### 1 · Aucun SMTP n'est branché

Le projet utilise donc le **service d'envoi intégré de Supabase, plafonné à
2 messages par heure**, tous usages confondus. Ce n'est pas un plafond
inconfortable : c'est un plafond sous lequel un parcours de réinitialisation ne
peut pas exister. Deux personnes qui cliquent « mot de passe oublié » dans la
même heure, et la seconde n'a rien, sans message d'erreur.

La valeur est connue : `Ceremonia/docs/email.md`, section 4, l'avait mesurée
avant sa propre bascule.

**La procédure est écrite et éprouvée** — mot de passe d'application Google,
réglage SMTP, relèvement de la limite : sections 2, 3 et 4 de
`Ceremonia/docs/email.md`, faites le 2026-07-31. Elle se rejoue à l'identique
ici, avec deux valeurs différentes :

| Champ | Valeur pour Mamakilo |
|---|---|
| Projet | `vdnfqijjmuxdrimbyyrv` — **pas** `exovzmoygupllcdjbwtf` |
| Sender name | `Mamakilo` |
| Sender email | `yhnguyen.edl@gmail.com` — à l'identique, Google réécrit tout autre expéditeur |
| Host / Port | `smtp.gmail.com` / `587` (en **chaîne** par l'API : `"587"`) |
| Username | `yhnguyen.edl@gmail.com` |
| Password | un mot de passe d'application dédié, nommé `Supabase Mamakilo` |

**Un mot de passe d'application distinct de celui de Cérémonia**, malgré la
même boîte : révoquer l'un ne doit pas couper l'autre.

Ici, contrairement à GénieLab, **le nom d'expéditeur peut dire la vérité** —
le projet n'est partagé avec personne.

### 2 · Les URL de retour ne sont pas autorisées

`Authentication → URL Configuration`. Sans ça le message part, mais son lien
ramène sur la Site URL : Supabase **n'émet aucune erreur** quand la
correspondance échoue, il remplace silencieusement le `redirectTo`.

| Champ | Valeur |
|---|---|
| Site URL | `https://mamakilo.vercel.app` |
| Redirect URLs | `https://mamakilo.vercel.app/**`, `https://di-t-ticien.vercel.app/**`, `http://localhost:5173/**` |

**Les deux domaines, et ce n'est pas de la prudence excessive.**
`di-t-ticien.vercel.app` sert toujours la même application, exprès
(`CLAUDE.md`, « Le renommage du 30 juillet »). `demanderReinitialisation` lit
`window.location.origin` plutôt qu'un domaine figé, justement pour que le lien
revienne là d'où part la demande : quelqu'un dont la PWA est installée depuis
l'ancienne adresse doit pouvoir récupérer son compte.

Des motifs `/**`, pas les URL exactes.

---

## Les comptes que ce parcours ne peut pas sauver

Les identifiants historiques sont des pseudos, enregistrés sous
`pseudo@equilibre.local` — un domaine qui ne reçoit rien. **Aucun e-mail ne
leur parviendra jamais**, et ce n'est pas réparable depuis l'application.

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

**À faire après le SMTP, jamais avant** : sans lui, la confirmation bute sur
les 2 messages par heure et l'inscription échoue en silence — c'est la cause
n° 1 de « les utilisateurs n'apparaissent pas dans Supabase », déjà documentée
dans `CLAUDE.md`.

---

## Vérifier que ça délivre

1. Depuis la production, pas depuis une préversion Vercel — leur domaine
   éphémère n'est pas dans la liste autorisée, et ne doit pas y être : un motif
   assez large pour les couvrir remettrait des jetons de réinitialisation à
   tout projet Vercel portant un nom voisin.
2. « Mot de passe oublié » → l'écran doit annoncer l'envoi **quelle que soit**
   l'adresse saisie. Une adresse inconnue qui répondrait autre chose ferait de
   cette page un moyen de savoir qui tient un journal alimentaire.
3. Le message arrive, son lien ouvre `/nouveau-mot-de-passe` **sur le domaine
   d'où part la demande**, et l'écran de choix s'affiche — pas l'accueil.
4. Le nouveau mot de passe ouvre la session sur un autre appareil.
5. Rouvrir le même lien une seconde fois : il doit annoncer un lien périmé, pas
   une page blanche.
