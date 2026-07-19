-- P1-A complet — champs auteurs brief #18 §2.2 + reviewer posts.
-- Appliquer après 0009_taxonomy.sql.
-- Orthographe : Axelle Fesneau (pas Fresneau). Simonini hors table (is_author).

alter table public.authors
  add column if not exists legal_name text,
  add column if not exists job_title text not null default 'Avocat',
  add column if not exists formation text,
  add column if not exists bar_admission text,
  add column if not exists knows_about text[] not null default '{}',
  add column if not exists is_author boolean not null default true;

comment on column public.authors.legal_name is
  'Nom affiché long Wix (ex. « Julien Plouton - Avocat à la Cour »).';
comment on column public.authors.job_title is
  'Titre JSON-LD Person.jobTitle.';
comment on column public.authors.is_author is
  'false = hors signatures blog (assistante).';

-- Remplir depuis display_name / role si vides
update public.authors
set legal_name = coalesce(nullif(legal_name, ''), display_name)
where legal_name is null or legal_name = '';

update public.authors
set job_title = coalesce(nullif(job_title, ''), nullif(role, ''), 'Avocat')
where job_title is null or job_title = '' or job_title = 'Avocat';

alter table public.posts
  add column if not exists reviewer_slug text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists content_updated_at timestamptz,
  add column if not exists word_count integer,
  add column if not exists cover_alt text;

create index if not exists posts_reviewer_slug_idx
  on public.posts (reviewer_slug)
  where reviewer_slug is not null;

comment on column public.posts.reviewer_slug is
  'E-E-A-T : auteur relecteur (authors.id).';
comment on column public.posts.content_updated_at is
  'dateModified éditorial — pas db_updated_at technique.';
comment on column public.posts.body_html is
  'CACHE DÉRIVÉ de body_doc. Ne jamais éditer à la main. Régénérable.';
