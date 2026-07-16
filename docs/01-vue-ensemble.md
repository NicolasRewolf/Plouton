# Vue d’ensemble

## Le problème

Le site du cabinet est sur Wix : lent, bordélique, difficile à piloter.  
Il y a ~470 pages (surtout le blog). Le client ne peut pas publier sereinement. Les demandes de contact ne sont pas gérées dans un vrai outil.

## La solution

Un seul projet avec deux faces :

1. **Backoffice** — le client écrit des articles et traite les formulaires  
2. **Site public** — ce que voient les visiteurs (rapide, propre, hors Wix)

Les deux partagent la même mémoire (les données).  
On écrit une fois → ça s’affiche partout correctement.

## Ce que ce projet n’est pas

- Ce n’est **pas** Cooked (Cooked mesure d’où viennent les clients)  
- Ce n’est **pas** une refonte graphique improvisée : on sort de Wix avec méthode  
- On ne réécrit pas les 422 articles à la main : on les **migre**

## Ordre de construction

1. Backoffice (besoin immédiat)  
2. Site public branché dessus  
3. Migration du contenu Wix  
4. Coupure de Wix
