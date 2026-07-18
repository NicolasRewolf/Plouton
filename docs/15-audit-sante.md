# Audit santé — site web

_Fait le 2026-07-17, sur le code réel. **Addendum 2026-07-18** ci-dessous._

**Note globale : V1 solide (~8,5/10).** Fondations excellentes, contenu sain.
Ce qui manque = des **modules pas encore construits** (surtout le backoffice Demandes), pas des défauts de structure.

---

## Addendum 2026-07-18

- Architecture approfondie : `queries.ts`, `expertise-loader.ts`, `poles-registry.json`, `demande-intake.ts`
- UX expertises / formulaire / home / header nettement plus aboutis
- Perf listes (index articles) + lazy below-fold
- **Inchangé :** pas de backoffice Demandes, pas d’auth admin, PJ = noms seulement, mail alerte non branché
- **Ne pas** migrer tout le contenu JSON → Postgres en priorité (décision implicite session : Demandes d’abord)

---

## Architecture — bon ✅

- `site/src/app/` = les pages (+ routes dynamiques) · `components/` = briques réutilisables
  (Header, Footer, ContactForm, ExpertisePageView, ExpertiseBody, PostCard, FaqAccordion…) ·
  `lib/` = contenu, queries, SEO, store, registry, loader…
- Principe « **peu de gabarits, beaucoup de données** » respecté.
- `store.ts` : bascule **fichiers locaux → Supabase** selon l'environnement. Clé secrète **serveur uniquement**.

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
