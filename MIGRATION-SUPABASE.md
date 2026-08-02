# Migration de Mamakilo vers le projet Supabase unique

Décidé le 02/08/2026. Ce document est une **procédure à exécuter**, pas une
note d'intention. Il s'efface une fois la migration validée et le projet RH
créé — ce qui doit en rester durablement part dans `CLAUDE.md`.

## Ce qu'on fait, et pourquoi

Trois applications personnelles vivaient sur deux projets Supabase :

| Projet | Ref | Région | Applications |
|---|---|---|---|
| A | `exovzmoygupllcdjbwtf` | `eu-west-3` (Paris) | Cérémonia + GénieLab |
| B | `vdnfqijjmuxdrimbyyrv` | `eu-west-1` (Irlande) | Mamakilo |

Le plan gratuit plafonne l'organisation à **deux projets**, et les deux étaient
pris — c'est ce qui avait forcé GénieLab à se loger chez Cérémonia, et ce qui
empêche `EDL-Skill-Studio` d'avoir sa base. Regrouper les trois applications
personnelles sur le projet A libère la seconde place pour le RH, qui est du
travail professionnel et n'a rien à faire dans la même base que des données de
santé familiales.

**Mamakilo est la seule application qui bouge.** Déplacer Cérémonia ou GénieLab
demanderait de migrer deux schémas au lieu d'un, pour le même résultat.

## L'ordre, et le seul point de non-retour

L'étape 6 est irréversible et **ne se fait qu'après que l'étape 5 a réussi**.
Le plan gratuit oblige à supprimer B avant de créer le projet RH : c'est
précisément pour ça que la suppression vient en dernier, et pas quand
« ça a l'air de marcher ».

### 1. Installer le schéma de Mamakilo sur le projet A

Coller `supabase/schema.sql` **dans son état actuel** (fonction suffixée, voir
plus bas) dans le SQL Editor du projet A. Il crée `public.donnees`, ses quatre
politiques, `marquer_maj()` et `supprimer_mon_compte_mamakilo()`.

Aucun nom n'entre en collision avec Cérémonia ou GénieLab — vérifié table par
table et fonction par fonction. Une seule exception, traitée :

> ⚠️ **`public.supprimer_mon_compte()` existait des deux côtés.** GénieLab
> possède la sienne sur le projet A, sans paramètre, exactement comme celle de
> Mamakilo. Un `create or replace` sur ce nom-là l'aurait **écrasée sans la
> moindre erreur**, cassant la suppression de compte de GénieLab en silence.
> D'où le suffixe, comme Cérémonia l'avait fait avant nous
> (`supprimer_mon_compte_ceremonia`). Ne jamais ajouter de `drop function if
> exists public.supprimer_mon_compte()` dans ce schéma : ce serait détruire la
> fonction du voisin.

`catalogue.sql` et `foyer.sql` **ne s'appliquent pas** : ils ne l'ont jamais été
sur B et rien ne les lit. Le jour où ils le seront, leurs noms (`recettes`,
`foyers`, `est_du_foyer`…) sont libres sur le projet A — vérifié le 02/08/2026.

### 2. Relever les comptes à recréer

Dans le SQL Editor du projet **B** :

```sql
select u.id,
       u.email,
       u.created_at,
       u.last_sign_in_at,
       d.user_id is not null           as a_des_donnees,
       pg_column_size(d.contenu)       as taille_octets
from auth.users u
left join public.donnees d on d.user_id = u.id
order by u.created_at;
```

Un compte sans ligne dans `donnees` n'a jamais rien enregistré : il ne se
migre pas, il se recrée seulement s'il sert encore.

### 3. Recréer les comptes manquants sur le projet A

**Relevé du 02/08/2026 : sept comptes sur B, tous sous une adresse réelle.**
Aucun pseudo historique en `@equilibre.local` n'a survécu — la contrainte du
domaine qui ne reçoit rien ne s'applique donc à personne.

⚠️ **Deux de ces adresses ont déjà un compte sur le projet A**, créé pour
Cérémonia ou GénieLab. Elles ne se recréent pas : l'insertion échouerait sur
l'unicité de l'adresse, et surtout ce serait deux comptes pour une seule
personne. Leur document Mamakilo s'attache au compte **déjà existant** sur A.
La requête de l'étape 2, croisée avec `auth.users` du projet A, dit lesquelles.

Pour les autres, deux façons de faire, et elles ne se valent pas :

- **Copier le compte tel quel** (recommandé) — lire `encrypted_password` et les
  colonnes d'identité sur B, les réécrire sur A. **Les mots de passe sont
  conservés**, personne ne voit la différence. C'est ce que fait une migration
  Supabase → Supabase, et c'est à portée dès qu'on a un accès SQL aux deux
  projets. Il faut alors copier **aussi** `auth.identities`, sans quoi GoTrue
  refuse la connexion par adresse.
- **Recréer à la main** — Authentication → Users → Add user, avec **Auto
  Confirm User**. Plus simple, mais chaque personne repart d'un mot de passe
  neuf qu'il faut lui communiquer.

`Confirm email` est déjà désactivé sur le projet A, Cérémonia en dépend.
**L'activer un jour casserait les inscriptions de l'autre application** — c'est
le seul réglage partagé qui puisse le faire.

Noter la correspondance ancien `id` → nouveau `id` : elle sert à l'étape 4. Si
les comptes sont copiés tels quels avec leur `id`, il n'y a pas de
correspondance à tenir — c'est l'autre avantage de cette voie.

> **Rien de tout ça ne se recopie dans ce fichier.** Le dépôt est public : les
> adresses et les identifiants des personnes n'y ont pas leur place, pas plus
> que le contenu des documents, qui sont des données de santé.

### 4. Copier les documents

**Le `user_id` change, et ça n'a aucune conséquence.** `fusionner()` réattribue
le document au compte qui le charge — `store.test.ts` le verrouille
explicitement : un document portant `profil.id` d'un autre compte ressort au
nom du compte courant. C'est ce qui rend cette migration triviale.

Sur **B**, pour chaque compte :

```sql
select contenu from public.donnees where user_id = '<ancien-id>';
```

Sur **A**, coller le JSON entre délimiteurs dollar — jamais entre apostrophes,
le document en contient :

```sql
insert into public.donnees (user_id, contenu)
values ('<nouveau-id>', $json$ <coller ici> $json$::jsonb)
on conflict (user_id) do update set contenu = excluded.contenu;
```

### 5. Basculer l'application, et vérifier

**Les variables d'abord, le push ensuite.** Les `VITE_*` sont lues à la
compilation : changer les variables sans redéployer ne fait rien, et pousser le
code avant les variables construirait une application qui appelle
`supprimer_mon_compte_mamakilo` sur le projet B, où elle n'existe pas.

1. Vercel → Settings → Environment Variables : `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` du projet A (les mêmes valeurs que dans le `.env`
   de GénieLab, qui vise déjà ce projet).
2. Mettre le `.env` local d'accord.
3. Pousser le commit qui porte le renommage de la RPC et `REGION_BASE`. Le
   build lit alors les nouvelles variables.
4. **Vérifier qu'un déploiement a bien été créé** — un push ne le garantit pas.

Puis, dans l'ordre :

- Se connecter avec **chaque** compte migré et vérifier que le journal, les
  pesées et les badges sont là. C'est la seule preuve qui compte.
- `npm run verifier` doit passer.
- Advisors de sécurité du projet A : zéro alerte **hors** les fonctions
  `SECURITY DEFINER` connues, qui passent de trois à quatre —
  `guest_get_questionnaire`, `guest_save_answer`,
  `supprimer_mon_compte_ceremonia`, `supprimer_mon_compte` (GénieLab), et
  maintenant `supprimer_mon_compte_mamakilo`.
- Vérifier qu'une suppression de compte GénieLab fonctionne encore : c'est la
  régression que le suffixe évite, et elle mérite d'être constatée une fois.

### 6. Point de non-retour — supprimer B, créer le projet RH

**Seulement une fois l'étape 5 entièrement validée.**

1. Sauvegarder B : Settings → Database → Backups, ou un `pg_dump` complet. Une
   fois le projet supprimé, plus rien n'est récupérable.
2. Supprimer le projet B.
3. Créer le projet RH — région `eu-west-3` (Paris), cohérente avec le reste.
4. Y installer `EDL-Skill-Studio/supabase/schema.sql` et renseigner son `.env`.

Le projet RH ne porte **que** la base de Skill Studio. C'est la raison d'être de
toute l'opération : les données professionnelles et les données de santé
familiales n'ont pas à partager un `auth.users`.

## Le courriel — un chantier réglé, un compromis créé

**`REPRISE.md` demandait de brancher un SMTP sur le projet B. Cette action
devient caduque : le projet A en a déjà un**, posé le 31/07/2026 pour Cérémonia
— SMTP Gmail sur `yhnguyen.edl@gmail.com`, plafond à 100 messages par heure. La
migration règle donc d'un coup le « mot de passe oublié » de Mamakilo, qui était
écrit et buildé mais ne délivrait rien.

Trois conséquences, parce que **ces réglages appartiennent au projet, pas à
l'application** :

- **L'expéditeur affiché sera « Cérémonia »** sur un message de
  réinitialisation Mamakilo. Les gabarits sont uniques par projet : on ne peut
  pas en avoir un par application. Choisir un nom d'expéditeur neutre est
  possible, mais c'est alors Cérémonia qui perd le sien — arbitrage à prendre,
  pas un réglage à deviner.
- **Il faut ajouter les URL de retour de Mamakilo** aux *Redirect URLs* du
  projet A : `mamakilo.vercel.app` **et** `di-t-ticien.vercel.app`, en motifs
  `/**` comme ceux de Cérémonia. Sans elles, le lien reçu ramène sur la Site URL
  sans la moindre erreur — c'est exactement la panne muette déjà rencontrée.
- **Le plafond de 100 messages par heure devient commun aux trois
  applications.** Sans conséquence à l'échelle d'un usage familial, mais c'est
  désormais une ressource partagée.

Les comptes en `@equilibre.local` restent irrécupérables : le domaine ne reçoit
rien, et changer de projet n'y change rien.

## Ce qui ne se migre pas, et ce qui change pour les gens

- **Les relevés de prix (IndexedDB) et les réglages (`localStorage`) restent
  dans le navigateur.** L'origine ne change pas — `mamakilo.vercel.app` et
  `di-t-ticien.vercel.app` continuent de servir la même application — donc ils
  sont préservés sans rien faire.
- **Toutes les sessions sont invalidées** : un jeton signé par le projet B ne
  vaut rien sur le projet A. Chacun se reconnecte une fois, avec son nouveau
  mot de passe.
- **Les comptes créés en mode démo n'existent nulle part** et ne se migrent pas.

## Les effets de bord de la cohabitation

Ils existaient déjà entre Cérémonia et GénieLab ; Mamakilo les rejoint.

- **`auth.users` est commun.** Une même adresse donne un seul compte pour les
  trois applications. Le cloisonnement des données ne repose pas sur la
  séparation des projets mais sur la RLS, filtrée par `user_id` partout.
- **Supprimer son compte l'efface pour les trois applications.** C'est le
  comportement voulu — un compte est une personne — mais aucun écran ne doit
  promettre l'inverse.
- **Le trigger `on_auth_user_created` de Cérémonia s'exécute à chaque
  inscription**, y compris celles de Mamakilo : il crée un profil, une
  organisation et un membership Cérémonia. Sans conséquence fonctionnelle
  (Mamakilo ne lit jamais ces tables, la RLS cloisonne), mais ça laisse des
  organisations vides dans Cérémonia. Ne pas « corriger » ce trigger sans
  mesurer l'effet sur Cérémonia, dont toute inscription en dépend.
