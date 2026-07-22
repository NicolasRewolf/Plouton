# sources/live-md/

Ces `.md` = **source de vérité rédactionnelle Wix**.  
Le JSON expertise (`contenu/expertises/{slug}.json`) doit respecter la hiérarchie titres.

## Emplacement

```
contenu/sources/live-md/expertises/{slug}.md
```

Noms = slugs JSON (`droit-penal.md`, `defense-des-elus.md`, …) — **15 fichiers**.

## Origine

- Export Wix « Page - … » / dumps rédactionnels (Downloads, archives Domtom, etc.)
- Ou snapshot live via `python3 scripts/audit-expertises-live.py`
- Optionnel : `{slug}.live.json` (métadonnées scrape)

## Règle de fidélité (non négociable)

Voir `docs/05-decisions.md` et `AGENTS.md` :

| MD Wix | JSON expertise |
|--------|----------------|
| **H2** | une `section` (même titre) |
| **H3** sous ce H2 | un bloc enfant (`headingLevel: 3`) |
| **H4** | sous-bloc / `headingLevel: 4` (pas aplatir au niveau H3) |
| Paragraphes, listes, liens | conserver dans `body` / `bullets` |

**Interdit :** fusionner sections, inventer du texte, « simplifier » les listes en prose.
