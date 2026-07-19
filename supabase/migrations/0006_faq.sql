-- Plouton — FAQ unifiée (import CSV Wix + admin).
-- Lecture publique : clé secrète serveur (comme posts C5), pas de RLS anon.
--
-- Projet : iofhcxwgqvorpmaexjwb

create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  wix_id text,
  question text not null,
  answer text not null,
  -- Slug Plouton (ex. droit-penal) — une ligne par expertise si multi-labels CSV
  expertise_slug text not null,
  sous_expertise text,
  likes integer not null default 0,
  status text not null default 'published'
    check (status in ('draft', 'published')),
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.faq is
  'FAQ unifiée (Wix FAQ + Import1 + FAQDivorce). Branchée aux pages expertise via expertise_slug.';

-- Une entrée Wix peut cibler plusieurs expertises → une ligne par slug.
-- NULL wix_id autorisé plusieurs fois (créations admin manuelles).
alter table public.faq
  drop constraint if exists faq_wix_expertise_unique;
alter table public.faq
  add constraint faq_wix_expertise_unique unique (wix_id, expertise_slug);

create index if not exists faq_expertise_slug_idx
  on public.faq (expertise_slug);

create index if not exists faq_status_idx
  on public.faq (status);

create index if not exists faq_sous_expertise_idx
  on public.faq (sous_expertise)
  where sous_expertise is not null;

alter table public.faq enable row level security;

-- Avocats connectés : lecture + écriture (admin FAQ).
create policy "avocats lisent la faq"
  on public.faq for select
  to authenticated
  using (true);

create policy "avocats écrivent la faq"
  on public.faq for insert
  to authenticated
  with check (true);

create policy "avocats mettent à jour la faq"
  on public.faq for update
  to authenticated
  using (true)
  with check (true);

create policy "avocats suppriment la faq"
  on public.faq for delete
  to authenticated
  using (true);

revoke all on public.faq from anon;
grant select, insert, update, delete on public.faq to authenticated;

-- Touche updated_at à chaque update
create or replace function public.faq_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.faq_touch_updated_at() from public, anon, authenticated;

drop trigger if exists faq_touch_updated_at on public.faq;
create trigger faq_touch_updated_at
  before update on public.faq
  for each row
  execute function public.faq_touch_updated_at();
