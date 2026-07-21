# Vue d’ensemble

> **Fondation 16/07** — pour l’état **courant**, lire [`14-etat.md`](../etat/etat.md) et [`11-stack-technique.md`](stack-technique.md).  
> Soir 18/07 : C0–C4 ✅ · next **C5** · pixel Phases 4–6 en pause.

## Le problème

Le site du cabinet est sur Wix : lent, bordélique, difficile à piloter.  
Il y a ~470 pages (surtout le blog). Le client ne peut pas publier sereinement. Les demandes de contact ne sont pas gérées dans un vrai outil.

## La solution

Un seul projet avec deux faces :

1. **Backoffice** — le client écrit des articles et traite les formulaires (`site/src/app/admin/` aujourd’hui)
2. **Site public** — ce que voient les visiteurs (rapide, propre, hors Wix)

Les deux partagent la même mémoire (les données).  
On écrit une fois → ça s’affiche partout correctement.

## Ce que ce projet n’est pas

- Ce n’est **pas** Cooked (Cooked mesure d’où viennent les clients)  
- Ce n’est **pas** une refonte graphique improvisée : on sort de Wix avec méthode  
- On ne réécrit pas les 422 articles à la main : on les **migre** (fait → seed C4)

## Ordre de construction (historique → actuel)

1. ~~Backoffice (besoin immédiat)~~ → POC admin dans `site/` (C0–C4)
2. ~~Site public branché dessus~~ → live Vercel, lecture encore JSON (dual-run)
3. ~~Migration du contenu Wix~~ → JSON + seed `posts`
4. **C5** puis cutover DNS / coupure Wix
