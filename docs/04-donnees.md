# Données

Dossier technique : `base/`

## En une phrase

C’est la **mémoire** du projet : articles, catégories, demandes de contact, éventuellement FAQ / équipe plus tard.

## Ce qu’on y range (cible)

| Contenu | Rôle |
|---------|------|
| Articles de blog | Texte, image, catégorie, date, publié ou non |
| Catégories | Les rubriques du blog |
| Demandes | Messages des formulaires + statut |
| (plus tard) FAQ, expertises, équipe | Même logique |

## Contenu lisible aussi dans `contenu/`

Pendant la migration, on peut aussi avoir des fichiers dans `contenu/` (articles, pages, médias) pour que Nicolas puisse **voir** ce qui a été importé, sans ouvrir une base opaque.

## Lien avec Cooked

Cooked a sa propre base pour **mesurer**.  
Ici, la base sert à **produire** (éditer / publier / traiter).  
Les deux peuvent se parler (ex. un formulaire envoyé = une demande ici + un signal dans Cooked), sans tout mélanger.
