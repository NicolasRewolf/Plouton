-- P1-A — Auteurs blog + FK posts.author_slug + body_doc (ProseMirror).
-- Appliquer après 0007_post_versions.sql.
-- Simonini (assistante) hors table authors.

create table if not exists public.authors (
  id text primary key,
  wix_id text,
  display_name text not null,
  short_name text not null default '',
  avatar text,
  bio text not null default '',
  role text not null default '',
  linkedin text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  db_updated_at timestamptz not null default now()
);

create index if not exists authors_wix_id_idx
  on public.authors (wix_id)
  where wix_id is not null;

comment on table public.authors is
  'Signatures blog (P1-A). Orthographe Axelle = Fesneau. Pas Simonini.';

alter table public.authors enable row level security;

drop policy if exists "avocats lisent authors" on public.authors;
create policy "avocats lisent authors"
  on public.authors for select to authenticated using (true);

drop policy if exists "avocats ecrivent authors" on public.authors;
create policy "avocats ecrivent authors"
  on public.authors for insert to authenticated with check (true);

drop policy if exists "avocats maj authors" on public.authors;
create policy "avocats maj authors"
  on public.authors for update to authenticated using (true) with check (true);

revoke all on public.authors from anon;
revoke delete on public.authors from authenticated;
grant select, insert, update on public.authors to authenticated;

-- Colonne FK logique (pas de contrainte dure : dual-run JSON)
alter table public.posts
  add column if not exists author_slug text;

create index if not exists posts_author_slug_idx
  on public.posts (author_slug)
  where author_slug is not null;

-- Source de vérité TipTap (JSON ProseMirror) — P1-D
alter table public.posts
  add column if not exists body_doc jsonb;

comment on column public.posts.body_doc is
  'Document ProseMirror TipTap (source). body_html = cache dérivé.';
comment on column public.posts.author_slug is
  'Réf. authors.id (slug auteur public /auteur/{slug}).';
