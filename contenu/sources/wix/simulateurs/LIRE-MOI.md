# Les simulateurs Wix — la source du calcul

> Fournis par Nicolas le 2026-07-21, depuis l'éditeur Velo du site en ligne.

**Pourquoi ces fichiers sont ici.** Quand les simulateurs ont été écrits côté
Next.js, cette source était introuvable. Les deux fichiers portaient l'aveu :

> « Aucune formule Wix / Velo trouvée dans `contenu/sources` (champs UI
> seulement). »
> « **Formule Wix introuvable dans les sources exportées** : on reproduit le
> barème officiel (pas une copie de JS Wix). »

Un calcul a donc été refait de zéro, à l'aveugle. Comparé au modèle réel une
fois celui-ci retrouvé, il annonçait jusqu'à **38 % d'écart** sur la prestation
compensatoire. Décision de Nicolas le 21/07 : **c'est le modèle Wix qui fait
foi**, et Next.js doit le reproduire.

Ces fichiers sont la référence de ce portage. Ne pas les modifier : ils
décrivent ce qui tourne en production sur `jplouton-avocat.fr`.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `calc.web.js` | **Prestation compensatoire** — modèle « Grenoble prior » v2.5.2. Le calcul de fond. |
| `pension.js` | **Pension alimentaire** — la table du barème officiel, 44 lignes de revenu × 6 enfants × 3 modes de garde. |
| `pension.web.js` | La validation d'entrée de la pension. |
| `page-simulateurs.js` | Le code de page Wix : c'est lui qui porte l'**auto-bénéficiaire** (échange des deux conjoints) et l'**arrondi à 500 €** de l'affichage. |

## Ce que le portage doit respecter

1. **Le refus, pas la valeur par défaut.** `calc.web.js` refuse de calculer si
   un âge sort de 16–100 ans, si un revenu est négatif, si les années de
   mariage dépassent 80. Il ne devine jamais.
2. **L'auto-bénéficiaire est dans la page**, pas dans le calcul : le front
   échange les deux conjoints pour que le bénéficiaire soit toujours celui aux
   revenus les plus faibles, santé comprise.
3. **L'arrondi à 500 € est de l'affichage**, pas du calcul.
4. **La pension part de 648 €** de minimum vital — la table le confirme à
   0,004 € près sur 90 points. La version Next.js utilisait 652 € en citant
   justice.fr au 02/04/2024 ; l'écart vaut 0,54 €/mois pour un enfant en garde
   classique. Le portage retient **648 €**, valeur du site en ligne. Si un
   avocat tranche pour 652, c'est une constante à changer, à un seul endroit.

Vérifié par `cd site && npm run check:baremes`.
