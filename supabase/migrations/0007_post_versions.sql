-- P0-F — Instantanés avant sauvegarde admin (filet anti-destruction).
-- Appliquer après 0006_faq.sql.

create table if not exists public.post_versions (
  id bigserial primary key,
  post_slug text not null,
  body_html text,
  body jsonb,
  title text,
  categories text[],
  meta_title text,
  meta_description text,
  author_email text,
  created_at timestamptz not null default now()
);

create index if not exists post_versions_slug_created_idx
  on public.post_versions (post_slug, created_at desc);

comment on table public.post_versions is
  'Snapshots admin avant chaque PUT — restauration possible. P0-F blog #18.';
