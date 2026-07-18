#!/usr/bin/env node
// Extraction des tokens du thème Wix depuis le CSS inline du site live.
//
//   node extract-tokens.mjs [--from-cache]
//
// Produit :
//   contenu/reference/tokens/wix-raw.css   — CSS inline concaténé (irremplaçable après cutover)
//   contenu/reference/tokens/tokens.json   — tokens parsés (--color_N, --font_N, --site-width…)
//   site/src/app/theme.wix.css             — fichier AUTO-GÉNÉRÉ consommé par l'app
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, loadManifest } from './capture-lib.mjs';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const tokensDir = path.join(REPO_ROOT, 'contenu', 'reference', 'tokens');
const rawCssPath = path.join(tokensDir, 'wix-raw.css');
const tokensJsonPath = path.join(tokensDir, 'tokens.json');
const themeCssPath = path.join(REPO_ROOT, 'site', 'src', 'app', 'theme.wix.css');

const fromCache = process.argv.includes('--from-cache');

async function getRawCss() {
  if (fromCache && fs.existsSync(rawCssPath)) {
    console.log(`CSS brut depuis le cache : ${rawCssPath}`);
    return fs.readFileSync(rawCssPath, 'utf8');
  }
  const origin = loadManifest().liveOrigin;
  console.log(`Téléchargement de ${origin}/ …`);
  const res = await fetch(origin + '/', { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur la home live`);
  const html = await res.text();
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  if (styles.length === 0) throw new Error('Aucun bloc <style> trouvé — structure inattendue.');
  const raw = styles.join('\n\n/* ---- bloc style suivant ---- */\n\n');
  fs.mkdirSync(tokensDir, { recursive: true });
  fs.writeFileSync(rawCssPath, raw);
  console.log(`${styles.length} blocs <style> (${(raw.length / 1024).toFixed(0)} KB) → wix-raw.css`);
  return raw;
}

/** Toutes les définitions `--name: value;` avec dédoublonnage (première gagne, conflits signalés). */
function collectVarDefs(css, pattern) {
  const defs = new Map();
  const conflicts = new Map();
  for (const m of css.matchAll(pattern)) {
    const name = m[1];
    const value = m[2].trim();
    if (!defs.has(name)) defs.set(name, value);
    else if (defs.get(name) !== value) {
      if (!conflicts.has(name)) conflicts.set(name, new Set([defs.get(name)]));
      conflicts.get(name).add(value);
    }
  }
  return { defs, conflicts };
}

/**
 * Décompose un shorthand `font:` Wix. Gère les tailles fluides en calc(), ex :
 * `normal normal 400 calc(39 * var(--theme-spx-ratio))/normal wfont_…,wf_…,orig_google_sans_medium`
 */
const CALC_SRC = 'calc\\((?:[^()]|\\([^()]*\\))*\\)';
function parseFontShorthand(value) {
  const v = value.trim();
  const re = new RegExp(
    '^(?:(italic|oblique|normal)\\s+)?(?:(small-caps|normal)\\s+)?(?:(\\d{3}|bold|normal)\\s+)?' +
      `(${CALC_SRC}|[\\d.]+(?:px|em|rem|%))` +
      `\\s*/\\s*(${CALC_SRC}|[\\d.]+(?:em|px|%)?|normal)` +
      '\\s+(.+)$'
  );
  const m = re.exec(v);
  if (!m) return { raw: v, families: [] };
  const families = m[6].split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
  return {
    raw: v,
    style: m[1] || 'normal',
    weight: m[3] || 'normal',
    size: m[4],
    lineHeight: m[5],
    family: m[6].trim(),
    firstFamily: families[0],
    families,
  };
}

const css = await getRawCss();

const colors = collectVarDefs(css, /--color_(\d+)\s*:\s*([^;}]+)[;}]/g);
const fonts = collectVarDefs(css, /--font_(\d+)\s*:\s*([^;}]+)[;}]/g);
const wixColors = collectVarDefs(css, /--wix-color-(\d+)\s*:\s*([^;}]+)[;}]/g);

const siteWidth = /--site-width\s*:\s*([^;}]+)[;}]/.exec(css)?.[1]?.trim() ?? null;
const spxDefs = [...css.matchAll(/--theme-spx-ratio\s*:\s*([^;}]+)[;}]/g)].map((m) => m[1].trim());
const scalingDefs = [...css.matchAll(/--scaling-factor\s*:\s*([^;}]+)[;}]/g)].map((m) =>
  m[1].trim()
);

// @font-face — pour fetch-fonts.mjs et la génération des déclarations locales.
const fontFaces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
  const block = m[1];
  const family = /font-family\s*:\s*([^;]+);/.exec(block)?.[1]?.trim().replace(/^["']|["']$/g, '');
  const weight = /font-weight\s*:\s*([^;]+);/.exec(block)?.[1]?.trim() ?? 'normal';
  const style = /font-style\s*:\s*([^;]+);/.exec(block)?.[1]?.trim() ?? 'normal';
  const srcs = [...block.matchAll(/url\(([^)]+)\)\s*(?:format\(["']?([^"')]+)["']?\))?/g)].map(
    (u) => ({ url: u[1].replace(/^["']|["']$/g, ''), format: u[2] || null })
  );
  return { family, weight, style, srcs };
});

const parsedFonts = {};
for (const [n, v] of fonts.defs) parsedFonts[n] = parseFontShorthand(v);

const tokens = {
  extractedAt: new Date().toISOString(),
  siteWidth,
  themeSpxRatioDefs: spxDefs,
  scalingFactorDefs: scalingDefs.slice(0, 5),
  colors: Object.fromEntries([...colors.defs].sort((a, b) => +a[0] - +b[0])),
  colorConflicts: Object.fromEntries(
    [...colors.conflicts].map(([k, v]) => [k, [...v]])
  ),
  wixColors: Object.fromEntries([...wixColors.defs].sort((a, b) => +a[0] - +b[0])),
  fonts: parsedFonts,
  fontConflicts: Object.fromEntries([...fonts.conflicts].map(([k, v]) => [k, [...v]])),
  fontFaces,
};
fs.mkdirSync(tokensDir, { recursive: true });
fs.writeFileSync(tokensJsonPath, JSON.stringify(tokens, null, 2));

// ---- Génération de theme.wix.css -------------------------------------------
const lines = [];
lines.push('/* AUTO-GÉNÉRÉ par scripts/visual/extract-tokens.mjs — NE PAS ÉDITER À LA MAIN.');
lines.push(` * Source : CSS inline de ${loadManifest().liveOrigin} (${tokens.extractedAt})`);
lines.push(' * Régénérer : node scripts/visual/extract-tokens.mjs --from-cache */');
lines.push('');
const stopperMin = /--spx-stopper-min\s*:\s*([^;}]+)[;}]/.exec(css)?.[1]?.trim() ?? '0px';
const stopperMax = /--spx-stopper-max\s*:\s*([^;}]+)[;}]/.exec(css)?.[1]?.trim() ?? '9999px';
lines.push(':root {');
lines.push(`  /* Réplique du ratio de typo fluide Wix Studio (référence 1500px).`);
lines.push(`   * Chaîne live : --theme-spx-ratio: ${spxDefs[0] || '(non trouvée)'} ;`);
lines.push(`   * --scaling-factor: ${scalingDefs[0] || '(non trouvée)'} ;`);
lines.push(`   * stoppers: min=${stopperMin} max=${stopperMax} → effectif = 100vw. */`);
lines.push(`  --theme-spx-ratio: calc(clamp(${stopperMin}, 100vw, ${stopperMax}) / 1500);`);
if (siteWidth) lines.push(`  --site-width: ${siteWidth};`);
lines.push('');
for (const [n, v] of [...colors.defs].sort((a, b) => +a[0] - +b[0])) {
  const isTriplet = /^\d+\s*,\s*\d+\s*,\s*\d+$/.test(v);
  lines.push(`  --wix-color-${n}-rgb: ${v};`);
  lines.push(`  --wix-color-${n}: ${isTriplet ? `rgb(${v})` : v};`);
}
lines.push('');
for (const [n] of [...fonts.defs].sort((a, b) => +a[0] - +b[0])) {
  const f = parsedFonts[n];
  if (f && f.family) {
    lines.push(`  --wix-font-${n}: ${f.raw};`);
    lines.push(`  --wix-font-${n}-family: ${f.family};`);
    lines.push(`  --wix-font-${n}-size: ${f.size};`);
    lines.push(`  --wix-font-${n}-lh: ${f.lineHeight};`);
    lines.push(`  --wix-font-${n}-weight: ${f.weight};`);
  } else {
    lines.push(`  --wix-font-${n}: ${fonts.defs.get(n)};`);
  }
}
lines.push('}');
lines.push('');
for (const [n] of [...fonts.defs].sort((a, b) => +a[0] - +b[0])) {
  lines.push(`.wix-font-${n} { font: var(--wix-font-${n}); }`);
}
lines.push('');
fs.writeFileSync(themeCssPath, lines.join('\n'));

console.log(`tokens.json : ${colors.defs.size} couleurs, ${fonts.defs.size} fonts, ${fontFaces.length} @font-face`);
if (colors.conflicts.size || fonts.conflicts.size) {
  console.log(
    `⚠ Conflits de définition — couleurs: ${[...colors.conflicts.keys()].join(',') || '∅'} | fonts: ${[...fonts.conflicts.keys()].join(',') || '∅'} (voir tokens.json)`
  );
}
console.log(`theme.wix.css généré → ${path.relative(REPO_ROOT, themeCssPath)}`);
console.log(`--site-width: ${siteWidth} | spx-ratio défs: ${spxDefs.length || 'aucune (JS)'}`);
