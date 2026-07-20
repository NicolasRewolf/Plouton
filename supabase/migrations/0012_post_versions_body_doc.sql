-- Archiver la SOURCE, pas seulement son cache.
--
-- `post_versions` ne gardait que `body_html`, alors que la source de vérité du
-- corps est `posts.body_doc` (ProseMirror) — `body_html` n'en est qu'un rendu.
-- Conséquence : restaurer une version remettait l'ancien HTML à côté du
-- body_doc RÉCENT, et la sauvegarde suivante régénérait le HTML depuis ce
-- body_doc resté neuf. La restauration s'annulait toute seule, sans message.
--
-- Additif : les lignes existantes gardent body_doc NULL, et la restauration
-- retombe alors sur l'ancien comportement (body_html seul) plutôt que d'échouer.

alter table public.post_versions
  add column if not exists body_doc jsonb;

comment on column public.post_versions.body_doc is
  'Source ProseMirror du corps au moment du snapshot. NULL pour les versions antérieures à la migration 0012.';
