# Migration blog — sans casse

Objectif : **les 422 articles** arrivent sur le nouveau site **avec les mêmes URLs**, le même contenu, les mêmes catégories. Google et les gens ne voient presque rien changer.

---

## Principe

1. **On copie d’abord** (nouveau site en parallèle de Wix)  
2. **On vérifie** (échantillon + contrôles auto)  
3. **On bascule** le nom de domaine **ensuite**  
4. Wix reste allumé jusqu’au feu vert  

Jamais « on éteint Wix et on reconstruit dans le noir ».

---

## Ce qu’on transfère (tout)

| Élément | Comment |
|---------|---------|
| Titre, extrait, date, auteur | Via API Wix Blog |
| Texte + images dans l’article | Export du contenu riche → format propre |
| Image de couverture | Téléchargée + stockée chez nous |
| **Slug / URL** `/post/...` | **Identique** (y compris accents) |
| Catégories (17) | Mêmes labels **et mêmes slugs** |
| Tags (~377) | Importés ; ménage typos plus tard |
| Articles liés | Recolés si les IDs matchent |
| SEO (title / meta si présents) | Conservés |

Les **161 redirections** déjà dans `contenu/imports/Export_URL_Redirigees.csv` sont **rejouées** sur le nouveau site (anciennes URLs `/jurisprudence/...` etc.).

---

## Les 4 filets de sécurité

1. **Même adresse** — un article qui est sur  
   `…/post/mon-article` reste sur `…/post/mon-article`  
2. **Liste de contrôle** — script qui compare : 422 côté Wix = 422 côté nouveau (+ catégories)  
3. **Échantillon humain** — tu ouvres 10–15 articles au hasard (dont Médias, Ressources, un long, un avec images)  
4. **Basculer seulement quand la checklist est verte** — sinon on corrige, on ne coupe pas

---

## Ordre concret

```
Wix (toujours en ligne)
    ↓ API
Script d’import → base + fichiers médias
    ↓
Préprod (ex. plouton.vercel.app) — tu testes
    ↓ corrections
admin.jplouton-avocat.fr — l’équipe peut déjà rédiger les NOUVEAUX articles
    ↓
Jour J : DNS vers le nouveau site + 301 déjà en place
    ↓
Wix éteint (quand Cooked + Ads + spot-check OK)
```

Pendant la transition : **nouveaux** articles idéalement écrits **dans le nouveau backoffice** (éviter de publier sur Wix “pour rien”). Les anciens = importés une fois (ou resync si besoin avant le jour J).

---

## Ce qui peut casser (et comment on l’évite)

| Risque | Parade |
|--------|--------|
| URL changée | Interdiction de renommer les slugs à l’import |
| Image cassée | Re-télécharger depuis Wix, pas laisser un lien Wix mourir |
| Catégorie “Médias” / “Ressources” | Reproduire la taxonomie (`docs/07-taxonomie-blog.md`) |
| Double contenu Wix + nouveau | Un seul site public au jour J ; préprod en noindex |
| Pubs / Cooked | Brancher avant la bascule (cf. décisions Nomad + Cooked) |

---

## Ce qu’on ne fait pas

- Réécrire les 422 textes avec l’IA  
- “En profiter” pour changer toutes les URLs  
- Migrer à la main un par un dans l’éditeur  

---

## Lien avec le backoffice

Dès que Demandes + Blog tournent en admin :  
l’équipe **publie le futur** dans `admin.jplouton-avocat.fr` ;  
le script s’occupe du **passé** (les 422).
