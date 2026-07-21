# Audit santé — site web

> ⛔ **ARCHIVE — ne décrit PAS le code actuel.**
> État courant : [`../etat/etat.md`](../etat/etat.md) · Architecture : [`../socle/architecture-contenu.md`](../socle/architecture-contenu.md) · Changements : [`/CHANGELOG.md`](../../CHANGELOG.md)

_Fait le 2026-07-17, sur le code réel. **Addendum 2026-07-18 soir** ci-dessous._

**Note globale : V1 solide (~8,5/10).** Fondations excellentes, contenu sain.
Ce qui manque = surtout **C5** (lecture publique DB) + polish / modules secondaires — pas des défauts de structure.

---

## Addendum 2026-07-18 (soir — pré-C5)

- **C0–C4** mergés · dual-run : public = JSON ; admin = DB
- Pages : médias, ressources, hubs, élus, redirects, uniformité UI ✅
- UI canon : **`AffaireCard`** + **`SiteCta`** ([`16-composants-ui.md`](16-composants-ui.md))
- Pixel 4–6 **pause** · next = **C5**

## Addendum 2026-07-18 (soir — C4)

- **C0–C3** livrés (demandes, PJ, auth, mail, CSV) · **C4 MVP** : table `posts` + 422 seedés + écriture admin
- Dual-run : public = JSON git ; admin = DB
- Suite **C5** : `/post/{slug}` lit la DB + publish sans commit

## Addendum 2026-07-18 (matin)

- Architecture approfondie : `queries.ts`, `expertise-loader.ts`, `poles-registry.json`, `demande-intake.ts`
- UX expertises / formulaire / home / header nettement plus aboutis
- Perf listes (index articles) + lazy below-fold

---

## Architecture — bon ✅

- `site/src/app/` = les pages (+ routes dynamiques) · `components/` = briques réutilisables
  (Header, Footer, ContactForm, ExpertisePageView, ExpertiseBody, **AffaireCard**, **SiteCta**, FaqAccordion…) ·
  `lib/` = contenu, queries, SEO, store, registry, loader…
- Principe « **peu de gabarits, beaucoup de données** » respecté.
- `store.ts` : bascule **fichiers locaux → Supabase** selon l'environnement. Clé secrète **serveur uniquement**.
- `PostCard` = wrapper déprécié → `AffaireCard` (ne plus étendre).

## Santé du contenu — très bon ✅

| Contrôle (422 articles) | Résultat |
|---|---|
| Total | 422, **tous publiés** |
| Sans corps de texte | **0** |
| Slugs en double | **0** (URLs intactes → SEO préservé) |
| Covers encore chez Wix | **0** (tout rapatrié) |
| Sans cover / sans meta SEO | 1 / 4 (mineur) |

Exports Wix d'origine **archivés** dans `contenu/sources/wix/` (`Posts.csv`, `Categories.csv`, `Equipe.csv`) — filet de sécurité intact.

## GitHub ↔ Supabase — câblé ⚙️

Chaîne réelle : **GitHub → (déploie) → Vercel → (au runtime, via les clés) → Supabase.**  
Tables `demandes` + `posts` (C4). Auth admin.  
**Reste :** **C5** lecture publique + smoke tests prod (site derrière login Vercel).

## Limites connues — à construire ⚠️

Par priorité :

1. **C5** — lecture publique des posts depuis la DB + publish live (ISR/cache) + covers Storage.
2. Recherche + simulateurs divorce.
3. **Mineurs** : pas de tests automatisés ; anti-spam formulaire ; 1 cover + 4 metas manquantes.

## À ne pas retoucher (sain) 🛡️

Slugs des articles (URLs), redirections 301, structure des données, couche SEO. Voir [`06-ne-pas-perdre.md`](06-ne-pas-perdre.md).
