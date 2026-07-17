#!/usr/bin/env node
// Capture de vérité terrain (live) ou de l'état local (dev server).
//
//   node capture.mjs --target live  [--page all|id[,id]] [--viewport all|id[,id]] [--check]
//   node capture.mjs --target local [--origin http://localhost:3000] [--page …] [--viewport …]
//
// live  → contenu/reference/<page>/<vw>/{spec.json, screenshot.jpg} (committés)
//         + .cache/visual/shots/live/<page>/<vw>.png (pour le pixel-diff)
// local → .cache/visual/{spec,shots}/local/…
// --check : capture le live DEUX fois et mesure la stabilité pixel (zones
//           instables → candidates aux masks du manifest).
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import {
  loadManifest,
  capturePage,
  persistCapture,
  planCaptures,
} from './capture-lib.mjs';

function parseArgs(argv) {
  const args = { target: null, page: 'all', viewport: 'all', origin: null, check: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target') args.target = argv[++i];
    else if (a === '--page') args.page = argv[++i];
    else if (a === '--viewport') args.viewport = argv[++i];
    else if (a === '--origin') args.origin = argv[++i];
    else if (a === '--check') args.check = true;
    else {
      console.error(`Argument inconnu : ${a}`);
      process.exit(2);
    }
  }
  if (args.target !== 'live' && args.target !== 'local') {
    console.error('Usage : --target live|local [--page all|id,id] [--viewport all|id,id] [--origin URL] [--check]');
    process.exit(2);
  }
  return args;
}

function pixelStability(pngA, pngB) {
  const a = PNG.sync.read(pngA);
  const b = PNG.sync.read(pngB);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  if (a.width !== b.width || a.height !== b.height) {
    return { ratio: 1, note: `dimensions différentes ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  }
  const diff = new PNG({ width: w, height: h });
  const changed = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.12, includeAA: false });
  return { ratio: changed / (w * h), note: null };
}

const args = parseArgs(process.argv);
const manifest = loadManifest();
const origin =
  args.origin || (args.target === 'live' ? manifest.liveOrigin : manifest.localOrigin);

const jobs = planCaptures(manifest, { pageFilter: args.page, viewportFilter: args.viewport });
if (jobs.length === 0) {
  console.error('Aucune capture à faire (filtres trop stricts ou paths null).');
  process.exit(2);
}

console.log(`Cible ${args.target} (${origin}) — ${jobs.length} capture(s)…`);
const browser = await chromium.launch();
const failures = [];

for (const job of jobs) {
  const label = `${job.pageDef.id} @${job.viewport.id}`;
  const t0 = Date.now();
  try {
    const result = await capturePage(browser, {
      manifest,
      pageDef: job.pageDef,
      viewport: job.viewport,
      target: args.target,
      origin,
    });
    await persistCapture(result, { ...job, target: args.target });
    const m = result.spec.meta;
    let stability = '';
    if (args.check && args.target === 'live') {
      const second = await capturePage(browser, {
        manifest,
        pageDef: job.pageDef,
        viewport: job.viewport,
        target: args.target,
        origin,
      });
      const s = pixelStability(result.png, second.png);
      stability = ` | stabilité: ${(s.ratio * 100).toFixed(3)}%${s.note ? ` (${s.note})` : ''}`;
      if (s.ratio > 0.001) stability += '  ⚠ instable — ajouter un mask ?';
    }
    console.log(
      `✓ ${label} — ${((Date.now() - t0) / 1000).toFixed(1)}s | hauteur ${m.pageHeight}px | ` +
        `${m.blockCount} blocs, ${m.inlineCount} inlines, ${m.imageCount} img | ` +
        `couverture texte ${(m.textCoverage * 100).toFixed(1)}%${stability}`
    );
  } catch (err) {
    failures.push({ label, err: String(err).split('\n')[0] });
    console.error(`✗ ${label} — ${String(err).split('\n')[0]}`);
  }
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} échec(s) : ${failures.map((f) => f.label).join(', ')}`);
  process.exit(1);
}
console.log('\nCaptures terminées.');
