-- Plouton — C2 : accès avocats à la boîte Demandes (auth Supabase).
-- Comptes V1 : nicolas@rewolf.studio seul (invitations élargies après validation).
--
-- À exécuter dans le SQL Editor du projet iofhcxwgqvorpmaexjwb
-- (ou via apply_migration MCP).

-- 1) Durcissement préalable (advisor WARN) : la fonction d'auto-RLS ne doit
--    pas être exécutable par les rôles applicatifs. Inerte hors trigger, mais
--    on ferme avant d'ouvrir des policies.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 2) Demandes : lecture complète pour les avocats connectés ; écriture
--    LIMITÉE aux colonnes de traitement (statut, notes) via privilèges de
--    colonnes — RLS ne filtre pas les colonnes, les GRANTs oui.
create policy "avocats lisent les demandes"
  on public.demandes for select
  to authenticated
  using (true);

create policy "avocats traitent les demandes"
  on public.demandes for update
  to authenticated
  using (true)
  with check (true);

revoke insert, update, delete on public.demandes from authenticated;
grant select on public.demandes to authenticated;
grant update (statut, notes) on public.demandes to authenticated;

-- 3) Pièces jointes : lecture seule du bucket privé pour les avocats
--    (l'UI passe par des URLs signées côté serveur ; cette policy couvre
--    aussi l'accès authentifié direct, et rien d'autre).
create policy "avocats lisent les pieces-jointes"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'pieces-jointes');

-- Aucune policy anon, aucune écriture storage pour authenticated :
-- les uploads restent service-role uniquement (route /api/contact).
