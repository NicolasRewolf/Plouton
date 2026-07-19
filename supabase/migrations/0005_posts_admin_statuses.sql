-- Lot 5 admin : soft-delete (archived) + planification (scheduled).
-- Bucket `medias` déjà créé (public) — pas de DDL storage ici.
-- Projet : iofhcxwgqvorpmaexjwb

alter table public.posts drop constraint if exists posts_status_check;

alter table public.posts
  add constraint posts_status_check
  check (status = any (array['draft'::text, 'published'::text, 'archived'::text, 'scheduled'::text]));

comment on column public.posts.status is
  'draft | published | archived (soft-delete) | scheduled (visible si published_at <= today)';
