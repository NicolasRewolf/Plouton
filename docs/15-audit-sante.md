# Audit santé — site web

_Fait le 2026-07-17, sur le code réel. Instantané : à refaire aux grandes étapes._

**Note globale : V1 solide (~8/10).** Fondations excellentes, contenu sain.
Ce qui manque = des **modules pas encore construits** (surtout le backoffice), pas des défauts de structure.

---

## Architecture — bon ✅

- `site/src/app/` = les pages (+ routes dynamiques) · `components/` = **9 briques réutilisables**
  (Header, Footer, ContactForm, ExpertisePageView, PostCard, FaqAccordion, StickyCta…) ·
  `lib/` = **5 modules de fonctions** (contenu, blog, SEO, store…).
- **41 fichiers, ~3 550 lignes.** TypeScript. Sitemap + robots + couche SEO présents.
- Principe « **peu de gabarits, beaucoup de données** » respecté (une vue d'expertise nourrie par des fichiers, pas 14 pages copiées).
- `store.ts` bien conçu : bascule automatique **fichiers locaux → Supabase** selon l'environnement, sans rien changer ailleurs. Clé secrète **côté serveur uniquement**.

## Santé du contenu — très bon ✅

| Contrôle (422 articles) | Résultat |
|---|---|
| Total | 422, **tous publiés** |
| Sans corps de texte | **0** |
| Slugs en double | **0** (URLs intactes → SEO préservé) |
| Covers encore chez Wix | **0** (tout rapatrié) |
| Sans cover / sans meta SEO | 1 / 4 (mineur) |

Exports Wix d'origine **archivés** dans `contenu/sources/wix/` (`Posts.csv`, `Categories.csv`, `Equipe.csv`) — filet de sécurité intact.

## GitHub ↔ Supabase — câblé, à tester ⚙️

Chaîne réelle : **GitHub → (déploie) → Vercel → (au runtime, via les clés) → Supabase.**
Câblage correct, clés sur Production, table `demandes` présente.
**Reste à faire** : un test d'envoi de bout en bout en prod (le site est derrière le login Vercel).

## Limites connues — à construire ⚠️

Par priorité :

1. **Backoffice « Demandes » : n'existe pas** — c'est la pièce V1 la plus importante (voir les leads, pièces jointes, statuts).
2. **Auth de l'admin : aucune** — l'URL `/admin` est ouverte à qui la connaît (juste `noindex`). À brancher sur Supabase Auth.
3. **Édition d'articles en prod : bloquée** (volontairement « à venir » — nécessite la table `posts` + auth). Marche seulement en local.
4. **Pièces jointes du formulaire : POC** — envoie le **nom** du fichier, pas le fichier ; le bucket `pieces-jointes` n'est pas encore utilisé par le code.
5. **Email d'alerte nouvelle demande : non branché.**
6. **Mineurs** : pas de tests automatisés ; pas d'anti-spam / limite de débit sur le formulaire ; 1 cover + 4 metas manquantes.

## À ne pas retoucher (sain) 🛡️

Slugs des articles (URLs), redirections 301, structure des données, couche SEO. Voir [`06-ne-pas-perdre.md`](06-ne-pas-perdre.md).
