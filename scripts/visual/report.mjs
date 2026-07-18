#!/usr/bin/env node
// Galerie d'acceptation : triptyque live / local / verdicts par page & viewport.
//
//   node report.mjs            → reports/visual/index.html (ouvrir dans un navigateur)
//
// Sources : contenu/reference/<page>/<vw>/screenshot.jpg (live),
//           .cache/visual/shots/local/<page>/<vw>.png (dernière capture locale),
//           reports/visual/<page>/<vw>/spec-diff.json (dernier diff).
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, loadManifest, refDir, cachePath, reportDir } from './capture-lib.mjs';

const manifest = loadManifest();
const outPath = path.join(REPO_ROOT, 'reports', 'visual', 'index.html');
const outDir = path.dirname(outPath);
fs.mkdirSync(outDir, { recursive: true });

const rel = (p) => path.relative(outDir, p);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const rows = [];
const cards = [];
let pass = 0, fail = 0, pending = 0;

for (const pageDef of manifest.pages) {
  if (!pageDef.path) continue;
  const vws = [
    ...manifest.viewports,
    ...(manifest.extraViewports || []).filter((v) => (v.pages || []).includes(pageDef.id)),
  ];
  for (const vw of vws) {
    const liveJpg = path.join(refDir(pageDef.id, vw.id), 'screenshot.jpg');
    const localPng = cachePath('shots', 'local', pageDef.id, `${vw.id}.png`);
    const diffJson = path.join(reportDir(pageDef.id, vw.id), 'spec-diff.json');
    const hasLive = fs.existsSync(liveJpg);
    const hasLocal = fs.existsSync(localPng);
    const diff = fs.existsSync(diffJson) ? JSON.parse(fs.readFileSync(diffJson, 'utf8')) : null;

    let verdict = '—';
    let cls = 'pending';
    if (diff) {
      verdict = diff.pass
        ? '✓ PASS'
        : `✗ ${diff.counts.majors} majeurs / ${diff.counts.minors} mineurs`;
      cls = diff.pass ? 'pass' : 'fail';
      diff.pass ? pass++ : fail++;
    } else pending++;

    rows.push(
      `<tr class="${cls}"><td>${pageDef.id}</td><td>${vw.id}</td><td>${verdict}</td>` +
        `<td>${diff ? `Δh ${diff.pageHeight.delta}%` : ''}</td>` +
        `<td>${diff ? `<a href="#${pageDef.id}-${vw.id}">détail</a>` : ''}</td></tr>`
    );

    if (hasLive || hasLocal) {
      const clusters = (diff?.clusters || [])
        .slice(0, 6)
        .map((c) => `<li>[${c.count}×] ${esc(c.sig)}</li>`)
        .join('');
      const mdLink = fs.existsSync(path.join(reportDir(pageDef.id, vw.id), 'spec-diff.md'))
        ? `<a href="${rel(path.join(reportDir(pageDef.id, vw.id), 'spec-diff.md'))}">spec-diff.md</a>`
        : '';
      cards.push(`
<section id="${pageDef.id}-${vw.id}" class="${cls}">
  <h2>${pageDef.id} @${vw.id} <small>${esc(pageDef.path)}</small> — ${verdict} ${mdLink}</h2>
  ${clusters ? `<ul class="clusters">${clusters}</ul>` : ''}
  <div class="pair">
    <figure><figcaption>LIVE (référence figée)</figcaption>${
      hasLive ? `<img loading="lazy" src="${rel(liveJpg)}">` : '<p>pas de capture</p>'
    }</figure>
    <figure><figcaption>LOCAL (dernière capture)</figcaption>${
      hasLocal ? `<img loading="lazy" src="${rel(localPng)}">` : '<p>pas de capture locale — lancer diff.mjs</p>'
    }</figure>
  </div>
</section>`);
    }
  }
}

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Plouton — galerie de convergence visuelle</title>
<style>
  body { font: 14px/1.5 -apple-system, sans-serif; margin: 2rem; color: #17475e; }
  table { border-collapse: collapse; margin-bottom: 2rem; }
  td, th { border: 1px solid #e6e8ea; padding: .35rem .7rem; }
  tr.pass td:nth-child(3) { color: #067d3f; font-weight: 600; }
  tr.fail td:nth-child(3) { color: #c02b22; font-weight: 600; }
  section { margin: 2.5rem 0; border-top: 2px solid #e6e8ea; padding-top: 1rem; }
  section h2 small { color: #6b7280; font-weight: 400; }
  .pair { display: flex; gap: 1rem; align-items: flex-start; }
  .pair figure { flex: 1; margin: 0; min-width: 0; }
  .pair img { width: 100%; border: 1px solid #e6e8ea; }
  figcaption { font-weight: 600; margin-bottom: .4rem; }
  .clusters { color: #c02b22; }
</style></head><body>
<h1>Convergence visuelle Wix → Next.js</h1>
<p>Généré le ${new Date().toISOString()} — ${pass} PASS, ${fail} FAIL, ${pending} sans diff.</p>
<table><tr><th>page</th><th>vw</th><th>verdict</th><th>hauteur</th><th></th></tr>${rows.join('\n')}</table>
${cards.join('\n')}
</body></html>`;

fs.writeFileSync(outPath, html);
console.log(`Galerie : ${outPath} (${pass} PASS, ${fail} FAIL, ${pending} sans diff)`);
