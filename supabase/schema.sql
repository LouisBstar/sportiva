-- ============================================================
-- Sportiva — Schéma Supabase
-- Exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- Données utilisateur, objectifs et macros calculés
-- ============================================================
create table if not exists public.profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  sexe             text check (sexe in ('homme', 'femme')),
  age              int check (age > 0 and age < 120),
  poids            decimal(5, 2),  -- kg
  taille           decimal(5, 1),  -- cm
  niveau_activite  text check (niveau_activite in (
                     'sedentaire',        -- x1.2
                     'legerement_actif',  -- x1.375
                     'moderement_actif',  -- x1.55
                     'tres_actif',        -- x1.725
                     'extremement_actif'  -- x1.9
                   )),
  objectif_identitaire text,  -- ex: "Devenir quelqu'un d'endurant"
  -- Calculés via Mifflin-St Jeor
  tdee             int,           -- kcal/jour maintenance
  objectif_calorique text check (objectif_calorique in ('perte', 'maintien', 'prise')),
  calories_cible   int,           -- kcal/jour cible
  proteines_cible_g int,          -- min 1.6g/kg
  glucides_cible_g  int,
  lipides_cible_g   int,          -- min 0.8g/kg
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Mise à jour automatique de updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "profiles: lecture propriétaire"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: insertion propriétaire"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles: modification propriétaire"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles: suppression propriétaire"
  on public.profiles for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 2. BODY_COMPOSITION
-- Historique des mesures corporelles (balance connectée / manual)
-- ============================================================
create table if not exists public.body_composition (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  date              date not null default current_date,
  poids             decimal(5, 2),    -- kg
  masse_grasse_pct  decimal(4, 1),   -- %
  masse_musculaire  decimal(5, 2),   -- kg
  graisse_viscerale decimal(4, 1),   -- niveau (1-59)
  taux_hydrique     decimal(4, 1),   -- %
  masse_osseuse     decimal(4, 2),   -- kg
  created_at        timestamptz default now()
);

-- Index
create index if not exists body_composition_user_id_idx on public.body_composition(user_id);
create index if not exists body_composition_date_idx    on public.body_composition(user_id, date desc);

-- Contrainte : une seule mesure par jour par utilisateur
create unique index if not exists body_composition_user_date_uniq
  on public.body_composition(user_id, date);

-- RLS
alter table public.body_composition enable row level security;

create policy "body_composition: lecture propriétaire"
  on public.body_composition for select
  using (auth.uid() = user_id);

create policy "body_composition: insertion propriétaire"
  on public.body_composition for insert
  with check (auth.uid() = user_id);

create policy "body_composition: modification propriétaire"
  on public.body_composition for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "body_composition: suppression propriétaire"
  on public.body_composition for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 3. SPORT_EVENTS
-- Événements sportifs ponctuels (courses, compétitions…)
-- ============================================================
create table if not exists public.sport_events (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  nom_event     text not null,
  type_event    text,              -- 'course', 'triathlon', 'trail', etc.
  date          date not null,
  distance_km   decimal(7, 3),
  denivele      int,               -- mètres D+
  temps_secondes int,
  classement    text,              -- '12/450', 'finisher', etc.
  created_at    timestamptz default now()
);

-- Index
create index if not exists sport_events_user_id_idx on public.sport_events(user_id);
create index if not exists sport_events_date_idx    on public.sport_events(user_id, date desc);

-- RLS
alter table public.sport_events enable row level security;

create policy "sport_events: lecture propriétaire"
  on public.sport_events for select
  using (auth.uid() = user_id);

create policy "sport_events: insertion propriétaire"
  on public.sport_events for insert
  with check (auth.uid() = user_id);

create policy "sport_events: modification propriétaire"
  on public.sport_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sport_events: suppression propriétaire"
  on public.sport_events for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 4. PRODUCTS
-- Base d'aliments personnelle (Open Food Facts + saisie manuelle)
-- ============================================================
create table if not exists public.products (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  nom              text not null,
  marque           text,
  code_barres      text,
  calories_100g    decimal(7, 2),
  proteines_100g   decimal(6, 2),
  glucides_100g    decimal(6, 2),
  lipides_100g     decimal(6, 2),
  fibres_100g      decimal(6, 2),
  nutri_score      text check (nutri_score in ('A', 'B', 'C', 'D', 'E')),
  alertes          jsonb default '[]'::jsonb,
  -- ex: [{"type": "additif", "label": "E621 — Glutamate de sodium"}]
  source           text not null default 'manual'
                   check (source in ('manual', 'openfoodfacts', 'ocr')),
  created_at       timestamptz default now()
);

-- Index
create index if not exists products_user_id_idx    on public.products(user_id);
create index if not exists products_barcode_idx    on public.products(user_id, code_barres)
  where code_barres is not null;
create index if not exists products_nom_idx        on public.products using gin(to_tsvector('french', nom));

-- RLS
alter table public.products enable row level security;

create policy "products: lecture propriétaire"
  on public.products for select
  using (auth.uid() = user_id);

create policy "products: insertion propriétaire"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "products: modification propriétaire"
  on public.products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "products: suppression propriétaire"
  on public.products for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 5. MEALS
-- En-tête d'un repas (date + type)
-- ============================================================
create table if not exists public.meals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null default current_date,
  type_repas  text not null check (type_repas in (
                'petit-dejeuner', 'dejeuner', 'collation', 'diner'
              )),
  notes       text,
  created_at  timestamptz default now()
);

-- Index
create index if not exists meals_user_id_idx on public.meals(user_id);
create index if not exists meals_date_idx    on public.meals(user_id, date desc);

-- RLS
alter table public.meals enable row level security;

create policy "meals: lecture propriétaire"
  on public.meals for select
  using (auth.uid() = user_id);

create policy "meals: insertion propriétaire"
  on public.meals for insert
  with check (auth.uid() = user_id);

create policy "meals: modification propriétaire"
  on public.meals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meals: suppression propriétaire"
  on public.meals for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 6. MEAL_ITEMS
-- Lignes d'un repas (aliment + quantité + macros dénormalisés)
-- ============================================================
create table if not exists public.meal_items (
  id          uuid primary key default uuid_generate_v4(),
  meal_id     uuid not null references public.meals(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  quantite_g  decimal(7, 1) not null check (quantite_g > 0),
  -- Macros calculés au moment de la saisie (dénormalisés pour perf)
  calories    decimal(7, 1),
  proteines   decimal(6, 2),
  glucides    decimal(6, 2),
  lipides     decimal(6, 2)
);

-- Index pour jointures fréquentes
create index if not exists meal_items_meal_id_idx    on public.meal_items(meal_id);
create index if not exists meal_items_product_id_idx on public.meal_items(product_id);

-- RLS via jointure sur meals
alter table public.meal_items enable row level security;

create policy "meal_items: lecture propriétaire"
  on public.meal_items for select
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_items.meal_id
        and m.user_id = auth.uid()
    )
  );

create policy "meal_items: insertion propriétaire"
  on public.meal_items for insert
  with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_items.meal_id
        and m.user_id = auth.uid()
    )
  );

create policy "meal_items: modification propriétaire"
  on public.meal_items for update
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_items.meal_id
        and m.user_id = auth.uid()
    )
  );

create policy "meal_items: suppression propriétaire"
  on public.meal_items for delete
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_items.meal_id
        and m.user_id = auth.uid()
    )
  );


-- ============================================================
-- 7. ACTIVITIES
-- Activités sportives (Strava sync ou saisie manuelle)
-- ============================================================
create table if not exists public.activities (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  date                  date not null default current_date,
  source                text not null default 'manuel'
                        check (source in ('strava', 'manuel')),
  strava_id             text unique,  -- null si saisie manuelle
  type_activite         text not null, -- 'course', 'vélo', 'natation', 'musculation', etc.
  description           text,
  duree_min             int check (duree_min > 0),
  distance_km           decimal(7, 3),
  denivele              int,           -- mètres D+
  intensite             text check (intensite in ('faible', 'modérée', 'élevée', 'maximale')),
  fc_moyenne            int,           -- bpm
  fc_max                int,           -- bpm
  calories_brulees      int,
  modifie_manuellement  boolean not null default false,
  created_at            timestamptz default now()
);

-- Index
create index if not exists activities_user_id_idx on public.activities(user_id);
create index if not exists activities_date_idx    on public.activities(user_id, date desc);
create index if not exists activities_strava_idx  on public.activities(strava_id)
  where strava_id is not null;

-- RLS
alter table public.activities enable row level security;

create policy "activities: lecture propriétaire"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "activities: insertion propriétaire"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "activities: modification propriétaire"
  on public.activities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "activities: suppression propriétaire"
  on public.activities for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 8. STRAVA_TOKENS
-- Tokens OAuth Strava (1 ligne par utilisateur)
-- ============================================================
create table if not exists public.strava_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  access_token  text not null,
  refresh_token text not null,
  expires_at    bigint not null  -- timestamp Unix
);

-- RLS — strict : uniquement le service role peut écrire via les API routes
alter table public.strava_tokens enable row level security;

create policy "strava_tokens: lecture propriétaire"
  on public.strava_tokens for select
  using (auth.uid() = user_id);

create policy "strava_tokens: insertion propriétaire"
  on public.strava_tokens for insert
  with check (auth.uid() = user_id);

create policy "strava_tokens: modification propriétaire"
  on public.strava_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "strava_tokens: suppression propriétaire"
  on public.strava_tokens for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 9. WEEKLY_SCORES
-- Score antifragile hebdomadaire (calculé en tâche de fond)
-- ============================================================
create table if not exists public.weekly_scores (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  semaine_debut    date not null,   -- lundi de la semaine (ISO)
  points_obtenus   int not null default 0,
  points_possibles int not null default 0,
  score_pct        decimal(5, 2)
    generated always as (
      case when points_possibles > 0
        then round((points_obtenus::decimal / points_possibles) * 100, 2)
        else 0
      end
    ) stored,
  created_at       timestamptz default now()
);

-- Contrainte : un seul score par semaine par utilisateur
create unique index if not exists weekly_scores_user_semaine_uniq
  on public.weekly_scores(user_id, semaine_debut);

-- Index
create index if not exists weekly_scores_user_id_idx on public.weekly_scores(user_id);
create index if not exists weekly_scores_date_idx    on public.weekly_scores(user_id, semaine_debut desc);

-- RLS
alter table public.weekly_scores enable row level security;

create policy "weekly_scores: lecture propriétaire"
  on public.weekly_scores for select
  using (auth.uid() = user_id);

create policy "weekly_scores: insertion propriétaire"
  on public.weekly_scores for insert
  with check (auth.uid() = user_id);

create policy "weekly_scores: modification propriétaire"
  on public.weekly_scores for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "weekly_scores: suppression propriétaire"
  on public.weekly_scores for delete
  using (auth.uid() = user_id);


-- ============================================================
-- TRIGGER : créer un profil vide à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- VUE : bilan journalier (helper pour le dashboard)
-- ============================================================
create or replace view public.daily_nutrition as
select
  m.user_id,
  m.date,
  coalesce(sum(mi.calories),  0) as total_calories,
  coalesce(sum(mi.proteines), 0) as total_proteines,
  coalesce(sum(mi.glucides),  0) as total_glucides,
  coalesce(sum(mi.lipides),   0) as total_lipides,
  count(distinct m.id)            as nb_repas
from public.meals m
left join public.meal_items mi on mi.meal_id = m.id
group by m.user_id, m.date;

-- RLS sur la vue (via security_invoker)
alter view public.daily_nutrition set (security_invoker = true);
