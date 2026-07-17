-- Plouton — schéma V1 : les demandes de contact (le chemin critique).
-- Les articles restent en fichiers git tant que l'admin n'écrit pas en prod.
--
-- À exécuter dans le SQL Editor du projet iofhcxwgqvorpmaexjwb
-- (ou via `supabase db push` quand la CLI sera liée).

create table if not exists public.demandes (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  -- Formulaire (champs Wix conservés — docs/06-ne-pas-perdre.md)
  prenom text,
  nom text,
  entreprise text,
  email text,
  telephone text,
  objet text,
  message text,
  -- Mesure
  page_source text,
  utm jsonb,
  cooked jsonb,
  -- Traitement (libellés Outlook — à finaliser avec Alexia)
  statut text not null default 'Nouveau',
  notes text,
  candidature boolean not null default false,
  -- Pièces jointes : chemins dans le bucket privé `pieces-jointes`
  fichiers text[] not null default '{}'
);

comment on table public.demandes is 'Demandes de contact du site (prospects + candidatures)';

alter table public.demandes enable row level security;

-- Aucune policy anon : seules les clés serveur (sb_secret) écrivent/lisent.
-- Les avocats passeront par l''admin (auth Supabase) — policies à ajouter
-- avec les comptes utilisateurs.

create index if not exists demandes_received_at_idx on public.demandes (received_at desc);
create index if not exists demandes_statut_idx on public.demandes (statut);
