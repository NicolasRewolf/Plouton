# Site public

Dossier technique : `site/`

## Pour qui

Les visiteurs : personnes qui cherchent un avocat, lisent un article, demandent un contact.

## Contenu (repris du site actuel + enrichi)

- Accueil
- Les expertises (3 pôles + sous-pages + hubs)
- Le cabinet / l’équipe
- Les affaires / blog (422 articles)
- Médias + hub Ressources
- Honoraires & rendez-vous
- Mentions légales / confidentialité / cookies

## Lien avec le backoffice

Ce que le cabinet édite dans `/admin` **écrit** en Supabase (`posts`, `demandes`).  
**Lecture publique** = encore **JSON git** (dual-run C4) → **C5** = le site lit la base.

## État (soir 18/07)

**Live sur Vercel** (preview protégée, noindex) — pas encore le vrai domaine.  
Socle riche : expertises, hubs, blog, formulaires, légales, admin.  
Prochaine priorité : **C5** (lecture publique Supabase + publish sans commit).  
UI canonique : `AffaireCard` + `SiteCta` ([`16-composants-ui.md`](16-composants-ui.md)).
