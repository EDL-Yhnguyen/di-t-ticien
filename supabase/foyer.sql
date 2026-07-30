-- Partage familial — Mamakilo, sprint C6.
--
-- À exécuter dans le SQL Editor, **après** `schema.sql`. Comme
-- `catalogue.sql`, ce fichier n'a pas pu être exécuté par l'outillage (le
-- connecteur Supabase est en lecture seule) : rien n'a été validé contre une
-- vraie base. Le relire avant de l'appliquer.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LA RÈGLE QUI NE SE NÉGOCIE PAS
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Jusqu'ici, une seule règle protégeait les données de santé de l'application :
-- `auth.uid() = user_id`. Chacun ne voit que sa ligne, la vérification tient en
-- une ligne, et c'est ce qui rend la conformité démontrable.
--
-- Le partage familial rompt cette simplicité — c'est même sa définition. D'où la
-- séparation posée ici, et à ne défaire sous aucun prétexte :
--
--   * `public.donnees` ne bouge pas et **reste strictement personnelle**. Le
--     journal alimentaire, les pesées, les mesures importées d'Apple Santé, la
--     conversation avec le coach, les envies : rien de tout cela n'entre dans un
--     foyer. Ce sont des données de santé au sens de l'article 9 du RGPD, et le
--     conjoint qui partage les courses n'a aucun droit d'accès au poids de
--     l'autre. Personne ne s'attend à ce que « partager la liste de courses »
--     signifie « montrer ce que je mange ».
--
--   * `public.foyer_donnees` porte **ce qui est commun par nature** : le
--     garde-manger, les listes de courses, les menus. Un frigo est déjà partagé
--     dans la vraie vie ; l'application ne fait que le reconnaître.
--
-- La conséquence est structurante : ces trois collections doivent **sortir** du
-- document `jsonb` personnel pour vivre dans le foyer. Tant que le front n'a pas
-- basculé, ce schéma reste inerte — installé, il ne casse rien, et rien ne le
-- lit encore. La bascule est un chantier à part, décrit dans `CUISINE.md`.

/* ─────────────────────────────── Les foyers ─────────────────────────────── */

create table if not exists public.foyers (
  id uuid primary key default gen_random_uuid(),
  nom text not null default 'Ma maison',
  cree_le timestamptz not null default now(),
  cree_par uuid not null references auth.users (id) on delete cascade
);

comment on table public.foyers is
  'Un groupe de personnes qui partagent un frigo, des courses et des menus — jamais un journal alimentaire.';

create table if not exists public.foyer_membres (
  foyer_id uuid not null references public.foyers (id) on delete cascade,
  membre uuid not null references auth.users (id) on delete cascade,
  -- Un seul privilège distinct : renommer le foyer et en retirer quelqu'un.
  -- Deux rôles suffisent ; trois demanderaient un écran d'administration que
  -- personne n'ouvrira dans une famille de quatre.
  role text not null default 'membre' check (role in ('proprietaire', 'membre')),
  ajoute_le timestamptz not null default now(),
  primary key (foyer_id, membre)
);

create index if not exists foyer_membres_membre on public.foyer_membres (membre);

create table if not exists public.foyer_donnees (
  foyer_id uuid primary key references public.foyers (id) on delete cascade,
  -- Stocks, courses et plans, dans le même format que le document personnel.
  -- Réutiliser la forme évite de réécrire la logique métier : `courses.ts` et
  -- `menu.ts` continuent de travailler sur les mêmes structures.
  contenu jsonb not null default '{}'::jsonb,
  maj_le timestamptz not null default now()
);

comment on table public.foyer_donnees is
  'Garde-manger, listes de courses et menus du foyer. Aucune donnée de santé ici.';

/* ──────────────────────── Appartenance, sans récursion ──────────────────────── */

-- Le piège de ce schéma, et la raison d'être de cette fonction.
--
-- La politique naturelle sur `foyer_membres` serait « je vois les lignes des
-- foyers dont je suis membre », donc un `exists (select 1 from foyer_membres …)`
-- **dans une politique de `foyer_membres` elle-même** : Postgres réévalue la
-- politique en évaluant la sous-requête, et l'on obtient une récursion infinie
-- (erreur 42P17). Une fonction `security definer` casse la boucle : elle
-- s'exécute avec les droits de son propriétaire, donc sans RLS, et ne rend qu'un
-- booléen — elle ne divulgue rien de plus que la réponse à la question posée.
create or replace function public.est_du_foyer(foyer uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.foyer_membres m
    where m.foyer_id = foyer and m.membre = auth.uid()
  );
$$;

create or replace function public.est_proprietaire_du_foyer(foyer uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.foyer_membres m
    where m.foyer_id = foyer and m.membre = auth.uid() and m.role = 'proprietaire'
  );
$$;

revoke execute on function public.est_du_foyer(uuid) from public, anon;
grant execute on function public.est_du_foyer(uuid) to authenticated;
revoke execute on function public.est_proprietaire_du_foyer(uuid) from public, anon;
grant execute on function public.est_proprietaire_du_foyer(uuid) to authenticated;

/* ─────────────────────────────── Les règles ─────────────────────────────── */

alter table public.foyers enable row level security;
alter table public.foyer_membres enable row level security;
alter table public.foyer_donnees enable row level security;

drop policy if exists "voir ses foyers" on public.foyers;
create policy "voir ses foyers"
  on public.foyers for select
  using (public.est_du_foyer(id));

drop policy if exists "creer un foyer" on public.foyers;
create policy "creer un foyer"
  on public.foyers for insert
  with check (cree_par = auth.uid());

drop policy if exists "renommer son foyer" on public.foyers;
create policy "renommer son foyer"
  on public.foyers for update
  using (public.est_proprietaire_du_foyer(id))
  with check (public.est_proprietaire_du_foyer(id));

drop policy if exists "dissoudre son foyer" on public.foyers;
create policy "dissoudre son foyer"
  on public.foyers for delete
  using (public.est_proprietaire_du_foyer(id));

drop policy if exists "voir les membres" on public.foyer_membres;
create policy "voir les membres"
  on public.foyer_membres for select
  using (public.est_du_foyer(foyer_id));

-- Personne ne s'ajoute à un foyer par un `insert` : on y entre par un code
-- d'invitation, via `rejoindre_foyer()`. Sans cette restriction, connaître
-- l'identifiant d'un foyer suffirait à s'y inviter — et les identifiants
-- circulent (journaux, capture d'écran, historique de navigation).
drop policy if exists "ajouter un membre" on public.foyer_membres;
create policy "ajouter un membre"
  on public.foyer_membres for insert
  with check (public.est_proprietaire_du_foyer(foyer_id));

-- Quitter un foyer est un droit ; en exclure quelqu'un est un privilège.
drop policy if exists "partir ou exclure" on public.foyer_membres;
create policy "partir ou exclure"
  on public.foyer_membres for delete
  using (membre = auth.uid() or public.est_proprietaire_du_foyer(foyer_id));

drop policy if exists "lire les donnees du foyer" on public.foyer_donnees;
create policy "lire les donnees du foyer"
  on public.foyer_donnees for select
  using (public.est_du_foyer(foyer_id));

-- Tous les membres écrivent : une liste de courses que seul le propriétaire
-- pourrait cocher ne servirait à rien.
drop policy if exists "creer les donnees du foyer" on public.foyer_donnees;
create policy "creer les donnees du foyer"
  on public.foyer_donnees for insert
  with check (public.est_du_foyer(foyer_id));

drop policy if exists "modifier les donnees du foyer" on public.foyer_donnees;
create policy "modifier les donnees du foyer"
  on public.foyer_donnees for update
  using (public.est_du_foyer(foyer_id))
  with check (public.est_du_foyer(foyer_id));

drop trigger if exists foyer_donnees_maj on public.foyer_donnees;
create trigger foyer_donnees_maj
  before update on public.foyer_donnees
  for each row execute function public.marquer_maj();

/* ──────────────────────────── Les invitations ──────────────────────────── */

-- Rejoindre par un code court et périssable, jamais par l'adresse e-mail d'un
-- proche : chercher quelqu'un par son adresse supposerait de pouvoir interroger
-- `auth.users`, c'est-à-dire de transformer l'application en annuaire.
create table if not exists public.foyer_invitations (
  code text primary key,
  foyer_id uuid not null references public.foyers (id) on delete cascade,
  cree_par uuid not null references auth.users (id) on delete cascade,
  cree_le timestamptz not null default now(),
  -- Une invitation qui ne périme pas est une porte laissée ouverte : le code
  -- circule par message et y reste des années.
  expire_le timestamptz not null default now() + interval '7 days'
);

alter table public.foyer_invitations enable row level security;

drop policy if exists "gerer ses invitations" on public.foyer_invitations;
create policy "gerer ses invitations"
  on public.foyer_invitations for all
  using (public.est_du_foyer(foyer_id))
  with check (public.est_du_foyer(foyer_id));

-- Le code est généré **par la base** et non par le navigateur : un code tiré
-- côté client dépend de la qualité de son générateur, et rien n'empêcherait un
-- client bricolé de choisir un code court ou déjà connu. Huit caractères
-- hexadécimaux valent quatre milliards de possibilités pour une porte ouverte
-- sept jours — assez pour ce que ça garde, et assez court pour être dicté au
-- téléphone.
create or replace function public.creer_invitation(foyer uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  nouveau text;
begin
  if not public.est_du_foyer(foyer) then
    raise exception 'Vous n’êtes pas membre de ce foyer.';
  end if;

  nouveau := upper(substr(md5(gen_random_uuid()::text), 1, 8));

  insert into public.foyer_invitations (code, foyer_id, cree_par)
  values (nouveau, foyer, auth.uid());

  return nouveau;
end;
$$;

revoke execute on function public.creer_invitation(uuid) from public, anon;
grant execute on function public.creer_invitation(uuid) to authenticated;

-- L'entrée dans un foyer passe par ici, et par nulle part ailleurs.
--
-- `security definer` parce que la personne qui rejoint n'a, par définition,
-- aucun droit sur le foyer avant d'y entrer : elle ne peut donc ni lire
-- l'invitation ni écrire dans `foyer_membres` sous la RLS ci-dessus. La fonction
-- ne rend que l'identifiant du foyer rejoint — un code faux ou périmé lève une
-- exception au lieu de dire lequel des deux, pour ne pas transformer l'appel en
-- oracle à codes valides.
create or replace function public.rejoindre_foyer(code_invitation text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cible uuid;
begin
  if auth.uid() is null then
    raise exception 'Aucune session active.';
  end if;

  select foyer_id into cible
  from public.foyer_invitations
  where code = code_invitation and expire_le > now();

  if cible is null then
    raise exception 'Cette invitation n’est plus valable.';
  end if;

  insert into public.foyer_membres (foyer_id, membre, role)
  values (cible, auth.uid(), 'membre')
  on conflict (foyer_id, membre) do nothing;

  return cible;
end;
$$;

revoke execute on function public.rejoindre_foyer(text) from public, anon;
grant execute on function public.rejoindre_foyer(text) to authenticated;

-- Créer un foyer et s'y déclarer propriétaire, en une transaction.
--
-- En deux appels depuis le client, une coupure réseau entre les deux laisserait
-- un foyer sans aucun membre : plus personne ne pourrait le voir ni le
-- supprimer, puisque toutes les règles passent par l'appartenance.
create or replace function public.creer_foyer(nom_foyer text default 'Ma maison')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nouveau uuid;
begin
  if auth.uid() is null then
    raise exception 'Aucune session active.';
  end if;

  insert into public.foyers (nom, cree_par)
  values (coalesce(nullif(trim(nom_foyer), ''), 'Ma maison'), auth.uid())
  returning id into nouveau;

  insert into public.foyer_membres (foyer_id, membre, role)
  values (nouveau, auth.uid(), 'proprietaire');

  insert into public.foyer_donnees (foyer_id) values (nouveau);

  return nouveau;
end;
$$;

revoke execute on function public.creer_foyer(text) from public, anon;
grant execute on function public.creer_foyer(text) to authenticated;
