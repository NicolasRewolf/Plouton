# Données

> **Fondation 16/07** — état courant : [`14-etat.md`](14-etat.md) · stack : [`11-stack-technique.md`](11-stack-technique.md).  
> Soir 18/07 : tables `demandes` + `posts` (seed 422) · public encore dual-run JSON → **C5**.

Dossier technique : `base/` / `supabase/`

## En une phrase

C’est la **mémoire** du projet : articles, catégories, demandes de contact, éventuellement FAQ / équipe plus tard.

## Ce qu’on y range (cible)

| Contenu | Rôle | État |
|---------|------|------|
| Articles de blog | Texte, image, catégorie, date, publié ou non | ✅ table `posts` (C4) — lecture publique = C5 |
| Catégories | Les rubriques du blog | Encore surtout JSON / champs posts |
| Demandes | Messages des formulaires + statut | ✅ table `demandes` (C0–C3) |
| (plus tard) FAQ, expertises, équipe | Même logique | JSON git pour l’instant |

## Contenu lisible aussi dans `contenu/`

Pendant la migration / dual-run, les fichiers dans `contenu/` (articles, pages, médias) restent la source **lecture publique**. L’admin écrit déjà en DB.

## Lien avec Cooked

Cooked a sa propre base pour **mesurer**.  
Ici, la base sert à **produire** (éditer / publier / traiter).  
Les deux peuvent se parler (ex. un formulaire envoyé = une demande ici + un signal dans Cooked), sans tout mélanger.
