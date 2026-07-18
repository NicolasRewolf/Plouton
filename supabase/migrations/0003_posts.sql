-- Plouton — C4 : canal blog (écriture CMS).
-- Seed depuis contenu/articles/ (422 slugs intouchables).
-- Dual-run : le site public lit encore le JSON git ; l'admin écrit ici.
--
-- Projet : iofhcxwgqvorpmaexjwb

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  -- Clé métier : jamais renommer (SEO /post/{slug})
  slug text not null,
  title text not null,
  excerpt text not null default '',
  published_at date,
  updated_at date,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  author text not null default '',
  author_id text,
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  category_ids text[] not null default '{}',
  cover_image text,
  minutes_to_read integer,
  view_count integer not null default 0,
  url text,
  wix_id text,
  meta_title text,
  meta_description text,
  body_html text,
  -- Paragraphes texte (édition admin) — tableau JSON de strings
  body jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  db_updated_at timestamptz not null default now(),
  constraint posts_slug_unique unique (slug)
);

comment on table public.posts is
  'Articles blog (C4). Slugs = vérité SEO. Public lit encore JSON jusqu''à C5.';

create index if not exists posts_published_at_idx
  on public.posts (published_at desc nulls last);

create index if not exists posts_status_idx
  on public.posts (status);

create index if not exists posts_wix_id_idx
  on public.posts (wix_id)
  where wix_id is not null;

alter table public.posts enable row level security;

-- Aucune policy anon : lecture publique reste via JSON git (dual-run).
-- Avocats connectés : lecture + écriture (admin blog).
create policy "avocats lisent les posts"
  on public.posts for select
  to authenticated
  using (true);

create policy "avocats écrivent les posts"
  on public.posts for insert
  to authenticated
  with check (true);

create policy "avocats mettent à jour les posts"
  on public.posts for update
  to authenticated
  using (true)
  with check (true);

-- Pas de DELETE pour authenticated (éviter accidents) — service_role seulement.
revoke all on public.posts from anon;
revoke delete on public.posts from authenticated;
grant select, insert, update on public.posts to authenticated;

-- Touche db_updated_at à chaque update
create or replace function public.posts_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.db_updated_at := now();
  return new;
end;
$$;

revoke all on function public.posts_touch_updated_at() from public, anon, authenticated;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row
  execute function public.posts_touch_updated_at();
