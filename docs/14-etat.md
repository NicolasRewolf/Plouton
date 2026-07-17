# État d'avancement — Plouton

_Mis à jour : 2026-07-17_

Vue unique de « où on en est ». À relire en premier, mettre à jour à chaque grande étape.
Détail des livraisons dans [`../JOURNAL.md`](../JOURNAL.md).

---

## 🟢 En ligne maintenant

- **Site en production sur Vercel** — build au vert, **512 pages** générées.
  URL : <https://plouton-rewolf-s-projects.vercel.app>
  🔒 Protégé par **login Vercel + `noindex`** → invisible pour le public et Google.
  C'est **voulu** tant que le vrai domaine n'est pas branché.
- **Base Supabase** (projet `Plouton`) — table **`demandes`** créée (sécurité RLS + index).
  Buckets `pieces-jointes` (privé) + `medias` (public).
- **Clés Supabase** posées sur Vercel pour **Production** (+ Preview), chiffrées.
- **Déploiement automatique** : chaque fusion dans `main` (GitHub) redéploie la prod.

## ✅ Fait — contenu & site

- **422 articles**, 17 catégories, ~377 tags, **6 membres** d'équipe, **FAQ unifiée**
- **14 pages expertises** (3 pôles) + pages cabinet (honoraires, notre-cabinet, médias, affaires, mentions)
- `/blog` + 17 pages catégories ; **161 redirections 301** ; **474 médias** rapatriés (zéro dépendance Wix)
- Gabarit article `/post/[slug]` en **copie du live Wix**
- SEO : titres/metas live servis verbatim — contrôle « aucune perte » **452/452 URLs en HTTP 200**
- Backoffice **blog** en POC (`/admin`, brouillon → publier)

## 🔧 Câblé, à finir de valider

- **Formulaire de contact → Supabase** : la table est prête et les clés sont en prod.
  Reste le **test de bout en bout** en production, et décider de l'**email d'alerte** (`accueil@`).

## 🔜 Prochaines étapes

- Backoffice **Demandes** (interface + connexion avocats / Nicolas)
- **Envoi d'email** d'alerte nouvelle demande → `accueil@jplouton-avocat.fr`
- Import de l'**historique des demandes** (CSV)
- **Cutover domaine** `www.jplouton-avocat.fr` + `admin.` vers Vercel (jour J, coordination Nomad)
- **Cooked** tracker + tag conversion **Nomad** avant bascule Ads
- Peaufinages visuels (FAQ live complète, micro-espacements, photos équipe, ticker accueil)

## 🙋 Ce qui dépend de Nicolas

- **Authentifier le MCP Supabase** (Claude Code) : `claude` → `/mcp` → `supabase` → Authenticate
- Prendre les forfaits **Pro** (Vercel + Supabase) avant le cutover — voir [`11-stack-technique.md`](11-stack-technique.md)
- Cliquer **« Merge »** sur les Pull Requests : le garde-fou de sécurité exige un humain pour publier en prod
