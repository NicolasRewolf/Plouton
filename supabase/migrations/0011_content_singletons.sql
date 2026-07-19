-- docs/17 — Singleton contact (coordonnées éditables).
-- Appliquer après 0010_authors_eeat.sql.

create table if not exists public.content_singletons (
  key text primary key,
  kind text not null default 'block',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  db_updated_at timestamptz not null default now()
);

comment on table public.content_singletons is
  'Blocs éditables transverses. V1 : clé contact (tél/email/adresse/horaires/rating).';

alter table public.content_singletons enable row level security;

drop policy if exists "avocats lisent content_singletons" on public.content_singletons;
create policy "avocats lisent content_singletons"
  on public.content_singletons for select to authenticated using (true);

drop policy if exists "avocats ecrivent content_singletons" on public.content_singletons;
create policy "avocats ecrivent content_singletons"
  on public.content_singletons for insert to authenticated with check (true);

drop policy if exists "avocats maj content_singletons" on public.content_singletons;
create policy "avocats maj content_singletons"
  on public.content_singletons for update to authenticated using (true) with check (true);

revoke all on public.content_singletons from anon;
revoke delete on public.content_singletons from authenticated;
grant select, insert, update on public.content_singletons to authenticated;
