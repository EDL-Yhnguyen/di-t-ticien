-- Catalogue de recettes à l'échelle — Mamakilo, sprint C6.
--
-- À exécuter dans le SQL Editor de votre projet Supabase, **après**
-- `schema.sql`. Ce fichier n'a pas été exécuté par l'outillage : le connecteur
-- Supabase de Claude Code est en lecture seule, donc rien ici n'a été validé
-- contre une vraie base. Le relire avant de l'appliquer.
--
-- Pourquoi une table alors que les 53 recettes vivent très bien dans
-- `src/lib/recettes/` : à cette taille, le catalogue en dur est un avantage —
-- il fonctionne hors connexion, se relit, se corrige en revue de code. Il cesse
-- de l'être vers le millier de recettes, quand le paquet JavaScript deviendrait
-- plus lourd que l'application elle-même. Cette table est le point d'arrivée
-- prévu ; `src/lib/recettes/source.ts` est la porte qui permet d'y basculer sans
-- toucher aux écrans.

-- Le texte cherchable d'une recette, en une fonction.
--
-- **Pourquoi une fonction et pas l'expression directement dans la colonne
-- générée** : une colonne `generated always as (…)` n'accepte aucune
-- sous-requête, et les ingrédients vivent dans un tableau jsonb qu'il faut
-- déplier (`jsonb_array_elements`) pour les concaténer. Postgres refuserait le
-- `create table` avec « cannot use subquery in column generation expression ».
-- Un appel de fonction, lui, est accepté à condition qu'elle soit `immutable` —
-- ce qu'elle est réellement ici : elle ne lit aucune table, seulement son
-- argument.
--
-- Le `search_path` vide impose de qualifier ce qu'on appelle : sans ça, la
-- fonction serait sensible au chemin de recherche de son appelant.
create or replace function public.recette_texte(contenu jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(contenu ->> 'titre', '') || ' ' ||
         coalesce(contenu ->> 'astuce', '') || ' ' ||
         -- Les ingrédients comptent autant que le titre : on cherche « thon »
         -- pour écouler une boîte de thon, pas parce qu'un plat s'appelle ainsi.
         coalesce(
           (
             select pg_catalog.string_agg(i ->> 'nom', ' ')
             from pg_catalog.jsonb_array_elements(contenu -> 'ingredients') as i
           ),
           ''
         );
$$;

create table if not exists public.recettes (
  -- Le même identifiant lisible que dans le catalogue en dur (« poulet-citron »),
  -- et non un uuid : c'est lui qui est déjà écrit dans les plans de menus, les
  -- favoris et les listes de courses des utilisateurs. Le changer romprait ces
  -- références.
  id text primary key,

  -- La recette entière, au format de l'interface `Recette` de TypeScript.
  --
  -- En jsonb plutôt qu'en colonnes : le schéma d'une recette a gagné six champs
  -- en un sprint (cuisine, régimes, substitutions, réchauffage, appareils), et
  -- chacun aurait demandé une migration. Ce qui doit être requêtable est extrait
  -- en colonnes générées, juste en dessous.
  contenu jsonb not null,

  -- `null` = catalogue officiel, visible de tous. Sinon, recette écrite par un
  -- utilisateur et visible de lui seul.
  auteur uuid references auth.users (id) on delete cascade,

  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),

  -- Colonnes générées : ce sur quoi on filtre, tiré du jsonb à l'écriture.
  -- Les calculer à la lecture interdirait tout index utile.
  moment text generated always as (contenu ->> 'moment') stored,
  minutes int generated always as ((contenu ->> 'minutes')::int) stored,
  kcal int generated always as ((contenu ->> 'kcal')::int) stored,
  cuisine text generated always as (contenu ->> 'cuisine') stored,

  -- Recherche plein texte **en français** : la configuration est écrite
  -- explicitement et non laissée à `default_text_search_config`. C'est ce qui
  -- rend l'expression immuable, condition d'une colonne générée — et c'est
  -- aussi ce qui fait que « poêlée » trouve « poelee », que « oignons » trouve
  -- « oignon », et que « de », « la », « avec » ne pèsent pas dans le score.
  recherche tsvector generated always as (
    to_tsvector('french', public.recette_texte(contenu))
  ) stored
);

comment on table public.recettes is
  'Catalogue de recettes. auteur null = officiel et public ; sinon, privé à son auteur.';

create index if not exists recettes_recherche on public.recettes using gin (recherche);
create index if not exists recettes_moment on public.recettes (moment, kcal);
create index if not exists recettes_auteur on public.recettes (auteur);

-- Pagination : par curseur, pas par `offset`.
--
-- `offset 20000` fait relire à Postgres les vingt mille premières lignes avant
-- d'en jeter dix-neuf mille neuf cent quatre-vingts. Sur un catalogue à
-- l'échelle promise, la dernière page coûterait cent fois la première. Cet index
-- permet un `where (titre, id) > (:dernier_titre, :dernier_id) order by titre, id
-- limit 20`, dont le coût ne dépend pas de la profondeur.
create index if not exists recettes_pagination on public.recettes ((contenu ->> 'titre'), id);

alter table public.recettes enable row level security;

-- Lecture : le catalogue officiel est public par nature — il n'y a rien de
-- personnel dans une recette de poulet au citron, et le rendre lisible sans
-- session permet de l'afficher sur la page d'accueil.
drop policy if exists "lire le catalogue" on public.recettes;
create policy "lire le catalogue"
  on public.recettes for select
  using (auteur is null or auteur = auth.uid());

-- Écriture : chacun ne peut créer, modifier et supprimer que **ses** recettes.
-- Le catalogue officiel (`auteur is null`) n'est donc modifiable par personne
-- depuis l'application — l'import en masse se fait hors ligne, avec la clé
-- `service_role`, qui n'a jamais sa place dans un front-end.
drop policy if exists "ecrire ses recettes" on public.recettes;
create policy "ecrire ses recettes"
  on public.recettes for insert
  with check (auteur = auth.uid());

drop policy if exists "modifier ses recettes" on public.recettes;
create policy "modifier ses recettes"
  on public.recettes for update
  using (auteur = auth.uid())
  with check (auteur = auth.uid());

drop policy if exists "supprimer ses recettes" on public.recettes;
create policy "supprimer ses recettes"
  on public.recettes for delete
  using (auteur = auth.uid());

drop trigger if exists recettes_maj on public.recettes;
create trigger recettes_maj
  before update on public.recettes
  for each row execute function public.marquer_maj();

-- Recherche multicritère, en une fonction.
--
-- Écrite ici plutôt que composée côté client : un `websearch_to_tsquery` mal
-- échappé côté navigateur, et l'on renvoie une erreur à chaque apostrophe tapée.
-- Les critères absents sont `null` et ne filtrent rien.
create or replace function public.chercher_recettes(
  texte text default null,
  moment_voulu text default null,
  cuisine_voulue text default null,
  minutes_max int default null,
  apres_titre text default null,
  apres_id text default null,
  taille int default 20
)
returns setof public.recettes
language sql
stable
set search_path = ''
as $$
  select r.*
  from public.recettes r
  where (texte is null or r.recherche @@ websearch_to_tsquery('french', texte))
    and (moment_voulu is null or r.moment = moment_voulu)
    and (cuisine_voulue is null or r.cuisine = cuisine_voulue)
    and (minutes_max is null or r.minutes <= minutes_max)
    and (
      apres_titre is null
      or (r.contenu ->> 'titre', r.id) > (apres_titre, coalesce(apres_id, ''))
    )
  order by r.contenu ->> 'titre', r.id
  limit least(coalesce(taille, 20), 100);
$$;

-- `least(…, 100)` plus haut, et pas de `security definer` ici : la fonction
-- s'exécute avec les droits de l'appelant, donc la RLS ci-dessus s'applique
-- toujours. Une recherche ne doit pas devenir un moyen de lire les recettes
-- privées des autres.
revoke execute on function public.chercher_recettes(text, text, text, int, text, text, int) from public;
grant execute on function public.chercher_recettes(text, text, text, int, text, text, int)
  to anon, authenticated;
