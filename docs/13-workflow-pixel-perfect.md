# Workflow pixel-perfect (validé sur l’accueil)

Objectif : **copié-collé** du site live — textes complets + mise en page proche.

## Étapes (toujours dans cet ordre)

1. **Capture live** — ouvrir la page Wix, screenshot desktop (~1440–1800px).
2. **Textes complets** — extraire le contenu affiché (DOM / dump), **sans résumer**. Stocker dans `contenu/pages/….json`.
3. **Mesures** — couleurs, polices, tailles via styles calculés (inspecteur / CDP).
4. **Assets** — images / logos exacts depuis Wix ou Drive.
5. **Reconstruction** — coder la page à partir du JSON + tokens.
6. **Comparaison** — screenshot POC vs live, même largeur, corriger écart par écart.

## Accueil (2026-07-17)

- Source contenu : `contenu/pages/accueil.json`
- Tokens : navy `#17475e`, navySoft `#3f6e84`, accent `#fe4b42`
- Layout hero desktop : texte gauche + photo 3 barres droite + ticker ACTUALITÉS + « Lire »

## Hors scope pour l’instant

- Blog ticker = articles locaux POC (pas encore les 422 posts Wix)
- Bios équipe (photos + textes longs) à importer ensuite
