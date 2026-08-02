-- Schéma d'Mamakilo.
--
-- À exécuter une fois, dans le SQL Editor de votre projet Supabase.
--
-- Tout l'état d'un utilisateur tient dans une ligne : le volume est minuscule
-- et rien ici n'est agrégé côté serveur. En échange, la sécurité se résume à
-- une règle simple à vérifier — chacun ne voit que sa propre ligne.

create table if not exists public.donnees (
  user_id uuid primary key references auth.users (id) on delete cascade,
  contenu jsonb not null default '{}'::jsonb,
  maj_le timestamptz not null default now()
);

comment on table public.donnees is
  'Profil, pesées, journal des repas, envies, badges et scores — un document par compte.';

-- Sans RLS, la clé anonyme exposée dans le navigateur donnerait accès à toutes
-- les lignes de la table. Ce sont des données de santé : elle est obligatoire.
alter table public.donnees enable row level security;

drop policy if exists "lire ses donnees" on public.donnees;
create policy "lire ses donnees"
  on public.donnees for select
  using (auth.uid() = user_id);

drop policy if exists "creer ses donnees" on public.donnees;
create policy "creer ses donnees"
  on public.donnees for insert
  with check (auth.uid() = user_id);

drop policy if exists "modifier ses donnees" on public.donnees;
create policy "modifier ses donnees"
  on public.donnees for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "supprimer ses donnees" on public.donnees;
create policy "supprimer ses donnees"
  on public.donnees for delete
  using (auth.uid() = user_id);

-- Horodatage tenu par la base : le client peut se tromper de fuseau, pas elle.
create or replace function public.marquer_maj()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.maj_le = now();
  return new;
end;
$$;

-- Postgres accorde l'exécution à `public` sur toute fonction nouvellement
-- créée. Une fonction trigger n'a rien à faire dans l'API : PostgREST l'expose
-- en `/rest/v1/rpc/marquer_maj`, où l'appel échoue certes, mais l'advisor
-- sécurité la signale à juste titre. On rend la surface exposée conforme à
-- l'intention.
revoke execute on function public.marquer_maj() from public, anon, authenticated;

drop trigger if exists donnees_maj on public.donnees;
create trigger donnees_maj
  before update on public.donnees
  for each row execute function public.marquer_maj();

-- Droit à l'effacement (RGPD, art. 17).
--
-- Supprimer une ligne de `auth.users` demande un privilège qu'un navigateur ne
-- doit pas avoir : la clé `service_role` n'a rien à faire dans un front-end.
-- Cette fonction fait l'inverse — elle s'exécute avec les droits de son
-- propriétaire, mais n'efface que l'appelant, et personne d'autre. La ligne de
-- `public.donnees` part avec, par la cascade déclarée plus haut.
--
-- ⚠️ **Le suffixe `_mamakilo` doit rester, et rien ne doit toucher au nom
-- court.** Le projet Supabase est partagé avec GénieLab et Cérémonia depuis la
-- migration du 02/08/2026. GénieLab y possède déjà
-- `public.supprimer_mon_compte()`, sans paramètre comme celle-ci : un
-- `create or replace` sur ce nom-là écraserait la sienne **sans la moindre
-- erreur**, et casserait la suppression de compte de l'autre application. Ne
-- jamais ajouter de `drop function if exists public.supprimer_mon_compte()`
-- ici « pour faire propre » — ce serait détruire la fonction du voisin.
-- Cérémonia a résolu le même problème de la même façon
-- (`supprimer_mon_compte_ceremonia`).
--
-- Corollaire de `auth.users` partagé : effacer le compte l'efface **pour les
-- trois applications**. C'est le comportement voulu — un compte est une
-- personne, pas un abonnement à une application — mais l'écran qui appelle
-- ceci ne doit pas promettre l'inverse.
create or replace function public.supprimer_mon_compte_mamakilo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Aucune session active.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Contrairement à `marquer_maj`, celle-ci doit bien être appelable depuis
-- l'application — mais seulement par quelqu'un de connecté.
revoke execute on function public.supprimer_mon_compte_mamakilo() from public, anon;
grant execute on function public.supprimer_mon_compte_mamakilo() to authenticated;
