# AGENTS.md — règles pour construire Plouton

Tu construis le site + backoffice du Cabinet Plouton.  
Nicolas n’est pas développeur : livrer clair, documenter dans `JOURNAL.md`.

## Lire d’abord (dans cet ordre)

1. `LIRE-MOI.md`
2. `docs/09-architecture-site.md` ← **obligatoire** (gabarits + CMS)
3. `docs/06-ne-pas-perdre.md`
4. `docs/05-decisions.md`
5. `docs/11-stack-technique.md` si tu touches infra / déploiement

## Principes non négociables

### Économie de code
- **Peu de gabarits**, beaucoup de données.
- Une page expertise = instance du gabarit `ExpertisePage`, pas une page React unique.
- Réutiliser : FAQ, formulaire, PostCard, Team, Header/Footer.

### Données
- **Une** FAQ unifiée (pas 3 collections comme Wix).
- Blog : **slugs intouchables** ; catégories = liste fermée documentée.
- Formulaires : pièces jointes + UTM + Cooked + `page_source`.

### Perf (raison d’être de la migration)
- LCP / INP mobiles d’abord.
- Simulateurs et below-fold en lazy.
- Pas de copier le JS Wix / tags inutiles.

### Backoffice (`admin/`)
- URL cible : `admin.jplouton-avocat.fr`
- Modules V1 : **Demandes** (prospects + onglet candidatures) + **Blog**
- Tous les avocats + Nicolas : brouillon **et** publish libres
- Statuts Demandes = libellés Outlook (à finaliser avec Alexia)
- Mail alertes : `accueil@jplouton-avocat.fr`
- Secib : pas d’API en V1

### Docs
- Toute décision métier → `docs/05-decisions.md`
- Toute livraison → entrée courte dans `JOURNAL.md`

## Références externes

- Tracking : repo **Cooked** (ne pas fusionner ici)
- Style site public plus tard : https://www.ui-skills.com/skills/jakubkrehel
- Exemple landing : **outremerplouton**
- Identité : `contenu/identite/` (Drive)
- Imports : `contenu/imports/` (301 OK en git ; CSV formulaires = PII, gitignoré)

## Interdit

- Renommer des URLs `/post/...` “pour faire plus joli”
- Réécrire les 422 articles à la main / à l’IA
- Inventer un nouveau type de page sans mettre à jour `09-architecture-site.md`
- Committer le CSV des formulaires (données perso)
