#!/usr/bin/env node
// Téléchargement des polices RÉELLES servies par le site live (auto-hébergées
// par Wix sur static.wixstatic.com/ufonts/…) → site/src/fonts/wix/.
//
//   node fetch-fonts.mjs            (nécessite contenu/reference/tokens/wix-raw.css)
//
// Le CSS live contient les piles d'alias explicites, une par police custom :
//   wfont_<site>_<hash32>, wf_<hash25>, orig_<nom_humain>
// et chaque binaire existe en ttf/woff/woff2 à l'URL prévisible
//   https://static.wixstatic.com/ufonts/<site>_<hash32>/woff2/file.woff2
// On télécharge le woff2 et on le déclare sous TOUS ses alias : la font-family
// calculée côté local devient identique verbatim au live.
//
// NOTE fidélité : les @font-face live déclarent tous font-weight normal — le
// gras Wix passe soit par changement de famille (…_semibold), soit par
// synthèse navigateur. Ne PAS mettre `font-synthesis: none` côté Next.js.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { REPO_ROOT } from './capture-lib.mjs';

const rawCssPath = path.join(REPO_ROOT, 'contenu', 'reference', 'tokens', 'wix-raw.css');
if (!fs.existsSync(rawCssPath)) {
  console.error('wix-raw.css absent — lancer d’abord : node scripts/visual/extract-tokens.mjs');
  process.exit(2);
}
const css = fs.readFileSync(rawCssPath, 'utf8');

const outDir = path.join(REPO_ROOT, 'site', 'src', 'fonts', 'wix');
fs.mkdirSync(outDir, { recursive: true });

// Piles d'alias explicites du CSS live.
const triples = [
  ...new Set(
    [...css.matchAll(/wfont_([0-9a-f]+_[0-9a-f]{16,})\s*,\s*(wf_[0-9a-f]+)\s*,\s*(orig_[a-z0-9_]+)/g)].map(
      (m) => JSON.stringify({ ufontId: m[1], wfont: `wfont_${m[1]}`, wf: m[2], orig: m[3] })
    )
  ),
].map((s) => JSON.parse(s));

if (triples.length === 0) {
  console.error('Aucune pile wfont/wf/orig trouvée dans wix-raw.css — structure inattendue.');
  process.exit(1);
}
console.log(`${triples.length} police(s) custom détectée(s) :`);
for (const t of triples) console.log(`  ${t.orig}  (ufonts/${t.ufontId})`);

const manifest = [];
const cssLines = [
  '/* AUTO-GÉNÉRÉ par scripts/visual/fetch-fonts.mjs — NE PAS ÉDITER À LA MAIN.',
  ' * Polices exactes du site live (ufonts wixstatic), déclarées sous tous leurs',
  ' * alias Wix pour que la font-family calculée soit identique verbatim au live.',
  ' * Les @font-face live sont tous en weight normal (le gras = famille dédiée ou',
  ' * synthèse navigateur) — ne pas mettre font-synthesis: none dans l’app. */',
  '',
];
let downloaded = 0;

for (const t of triples) {
  const url = `https://static.wixstatic.com/ufonts/${t.ufontId}/woff2/file.woff2`;
  const fileName = `${t.orig}.woff2`;
  const filePath = path.join(outDir, fileName);

  if (!fs.existsSync(filePath)) {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`✗ ${t.orig} : HTTP ${res.status} sur ${url}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buf);
    downloaded++;
    console.log(`✓ ${fileName} (${(buf.length / 1024).toFixed(0)} KB)`);
  } else {
    console.log(`= ${fileName} (déjà présent)`);
  }

  const buf = fs.readFileSync(filePath);
  const aliases = [t.wfont, t.wf, t.orig];
  manifest.push({
    file: fileName,
    aliases,
    weight: 'normal',
    style: 'normal',
    sourceUrl: url,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    bytes: buf.length,
  });

  for (const alias of aliases) {
    cssLines.push('@font-face {');
    cssLines.push(`  font-family: "${alias}";`);
    cssLines.push('  font-weight: normal;');
    cssLines.push('  font-style: normal;');
    cssLines.push('  font-display: swap;');
    cssLines.push(`  src: url("./${fileName}") format("woff2");`);
    cssLines.push('}');
    cssLines.push('');
  }
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(outDir, 'fonts.css'), cssLines.join('\n'));
console.log(
  `\n${manifest.length}/${triples.length} binaire(s) OK (${downloaded} téléchargé(s)), ${manifest.length * 3} @font-face → ${path.relative(REPO_ROOT, outDir)}/`
);
if (manifest.length < triples.length) process.exit(1);
