-- Plouton — C5 : documentation lecture publique posts (pas de policy anon).
-- La lecture publique reste côté serveur Next.js via SUPABASE_SECRET_KEY
-- (filtre status = 'published'). Dual-run : fallback JSON si row absente.
--
-- Projet : iofhcxwgqvorpmaexjwb

comment on table public.posts is
  'Articles blog. C5 : lecture publique serveur (secret key, status=published) ; RLS authenticated pour admin. Pas de policy anon V1.';
