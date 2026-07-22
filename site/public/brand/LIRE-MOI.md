# Brand (site public)

```
public/brand/
├── logo-mark.svg          ← picto 3 barres
├── typologo-noir.svg      ← wordmark
├── hero-home.jpg          ← accueil
├── equipe-home.png        ← découpe équipe (accueil / OG)
├── equipe-groupe.jpg      ← bandeau CTA articles
├── equipe/                ← portraits 3:4 + carrés (square-*.jpg)
├── avatars/               ← auteurs blog (256×256)
└── expertises/            ← 1 hero / page expertise (slug.jpg)
```

Pas de doublons. Toute nouvelle image d’expertise → `expertises/{slug}.jpg` + entrée dans `contenu/expertises-heroes.json` si utile.

Portraits et avatars : chemins listés dans `contenu/equipe.json` et `contenu/auteurs.json`. Orthographe fichier Axelle = **fesneau** (pas fresneau).
