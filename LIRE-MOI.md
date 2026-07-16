# Plouton — le plan de la maison

Ce repo, c’est le **cabinet en ligne** : site public + backoffice (blog & demandes).

Cooked (mesure / analytics) reste **à part**. Ici = la boutique. Cooked = le compteur.

---

## Où est quoi ?

| Dossier / fichier | Pour qui | À quoi ça sert |
|-------------------|----------|----------------|
| **`LIRE-MOI.md`** | Toi | Ce plan |
| **`JOURNAL.md`** | Toi | Ce qui a changé à chaque livraison |
| **`AGENTS.md`** | IA | Règles pour construire sans faire n’importe quoi |
| **`docs/`** | Toi + IA | Mode d’emploi (surtout `09-architecture-site.md`) |
| **`admin/`** | Client + toi | Backoffice : blog + demandes |
| **`site/`** | Visiteurs | Site public |
| **`contenu/`** | Toi | Imports, identité, futurs articles |
| **`base/`** | IA | Mémoire données (Supabase) |

---

## Par où commencer ?

1. **`JOURNAL.md`** — dernière livraison  
2. **`docs/09-architecture-site.md`** — comment le site est câblé  
3. **`docs/11-stack-technique.md`** — Supabase / Vercel / Cooked / DNS  
4. **`docs/06-ne-pas-perdre.md`** — ce qu’il ne faut pas casser  
5. **`docs/10-blocs-reutilisables.md`** — les briques UI  
6. **`AGENTS.md`** — règles pour l’IA  

---

## État actuel

**POC local vivant** dans `site/` (pas de cloud payant) :

- Accueil, contact, article blog, page expertise `/defense-penale/droit-penal`
- Backoffice blog `/admin`
- Contenu = fichiers dans `contenu/`

```bash
cd site && npm install && npm run dev
```

→ http://localhost:3000 — détail dans `site/LIRE-MOI.md`

---

## Liens utiles

- Site actuel : https://www.jplouton-avocat.fr  
- Tracking : **Cooked**  
- Exemple migré : **outremerplouton**  
- UI skills (plus tard) : https://www.ui-skills.com/skills/jakubkrehel
