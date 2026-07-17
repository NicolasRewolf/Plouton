#!/usr/bin/env node
// Harnais de convergence : spec-diff (signal primaire, actionnable) +
// pixel-diff par section (signal secondaire) entre le live Wix figé et le local.
//
//   node diff.mjs --page <id> --viewport <id|all> [--origin http://localhost:3000]
//                 [--only fonts|color|layout|all[,…]] [--skip-capture] [--no-pixel]
//
// Entrées : contenu/reference/<page>/<vw>/spec.json (+ .cache/visual/shots/live/…)
//           capture locale fraîche (même pipeline) sauf --skip-capture
// Sorties : reports/visual/<page>/<vw>/spec-diff.{json,md} + sections/*.png
// Exit    : 0 si gates OK (0 majeur non couvert par déviation, ≤10 mineurs,
//           pixel texte ≤1.5% [posts 2%], hauteur ±2%), 1 sinon.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import {
  REPO_ROOT,
  loadManifest,
  refDir,
  cachePath,
  reportDir,
  capturePage,
  persistCapture,
} from './capture-lib.mjs';

// ---------------------------------------------------------------- utilitaires
const PROP_GROUPS = {
  fonts: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform'],
  color: ['color', 'backgroundColor', 'borderColor'],
  layout: ['x', 'w', 'h', 'deltaY', 'padding', 'margin', 'display', 'gap', 'maxWidth', 'textAlign', 'borderRadius', 'borderWidth', 'boxShadow', 'textDecorationLine'],
};
PROP_GROUPS.tokens = [...PROP_GROUPS.fonts, ...PROP_GROUPS.color];

function parseArgs(argv) {
  const a = { page: null, viewport: 'all', origin: null, only: 'all', skipCapture: false, pixel: true };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--page') a.page = argv[++i];
    else if (arg === '--viewport') a.viewport = argv[++i];
    else if (arg === '--origin') a.origin = argv[++i];
    else if (arg === '--only') a.only = argv[++i];
    else if (arg === '--skip-capture') a.skipCapture = true;
    else if (arg === '--no-pixel') a.pixel = false;
    else { console.error(`Argument inconnu : ${arg}`); process.exit(2); }
  }
  if (!a.page) { console.error('Usage : --page <id> [--viewport id|all] [--origin URL] [--only fonts,color,layout|all] [--skip-capture] [--no-pixel]'); process.exit(2); }
  return a;
}

const px = (v) => (v == null ? null : parseFloat(v));
const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);

function parseCssColor(s) {
  if (!s) return null;
  const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/.exec(s);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  return null;
}
function srgbToLab({ r, g, b }) {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [f(r), f(g), f(b)];
  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  const g2 = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [g2(X / 0.95047), g2(Y), g2(Z / 1.08883)];
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b2: 200 * (fy - fz) };
}
function deltaE(c1, c2) {
  const l1 = srgbToLab(c1); const l2 = srgbToLab(c2);
  return Math.hypot(l1.L - l2.L, l1.a - l2.a, l1.b2 - l2.b2);
}

function firstFamily(s, aliases) {
  if (!s) return '';
  let f = s.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
  return (aliases[f] || f);
}

// -------------------------------------------------- comparaison d'une paire
function compareColor(prop, lv, lc, out) {
  const a = parseCssColor(lv); const b = parseCssColor(lc);
  if (!a || !b) { if (lv !== lc) out.push({ prop, live: lv, local: lc, sev: 'minor', note: 'couleur non parsée' }); return; }
  if (Math.abs(a.a - b.a) > 0.05) { out.push({ prop, live: lv, local: lc, sev: 'major', note: `alpha ${a.a} vs ${b.a}` }); return; }
  if (a.a < 0.05 && b.a < 0.05) return; // deux transparents
  const dE = deltaE(a, b);
  if (dE > 2) out.push({ prop, live: lv, local: lc, sev: 'major', note: `ΔE ${dE.toFixed(1)}` });
  else if (dE > 1) out.push({ prop, live: lv, local: lc, sev: 'minor', note: `ΔE ${dE.toFixed(1)}` });
}

function comparePair(live, local, { tier, aliases, props }) {
  const out = [];
  const has = (p) => props.has(p);
  const ls = live.style; const cs = local.style;

  if (has('fontFamily')) {
    const a = firstFamily(ls.fontFamily, aliases); const b = firstFamily(cs.fontFamily, aliases);
    if (a !== b) out.push({ prop: 'fontFamily', live: a, local: b, sev: 'major' });
  }
  if (has('fontSize')) {
    const d = Math.abs(px(ls.fontSize) - px(cs.fontSize));
    if (d > 1) out.push({ prop: 'fontSize', live: ls.fontSize, local: cs.fontSize, sev: 'major', delta: d });
    else if (d > 0.5) out.push({ prop: 'fontSize', live: ls.fontSize, local: cs.fontSize, sev: 'minor', delta: d });
  }
  if (has('fontWeight') && String(ls.fontWeight) !== String(cs.fontWeight))
    out.push({ prop: 'fontWeight', live: ls.fontWeight, local: cs.fontWeight, sev: 'major' });
  if (has('fontStyle') && ls.fontStyle !== cs.fontStyle)
    out.push({ prop: 'fontStyle', live: ls.fontStyle, local: cs.fontStyle, sev: 'major' });
  if (has('lineHeight')) {
    const a = ls.lineHeight; const b = cs.lineHeight;
    if (a === 'normal' || b === 'normal') {
      if (a !== b) out.push({ prop: 'lineHeight', live: a, local: b, sev: 'major' });
    } else {
      const d = Math.abs(px(a) - px(b));
      if (d > 2) out.push({ prop: 'lineHeight', live: a, local: b, sev: 'major', delta: d });
      else if (d > 0.5) out.push({ prop: 'lineHeight', live: a, local: b, sev: 'minor', delta: d });
    }
  }
  if (has('letterSpacing')) {
    const a = ls.letterSpacing === 'normal' ? 0 : px(ls.letterSpacing);
    const b = cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing);
    const d = Math.abs(a - b);
    if (d > 1) out.push({ prop: 'letterSpacing', live: ls.letterSpacing, local: cs.letterSpacing, sev: 'major', delta: d });
    else if (d > 0.2) out.push({ prop: 'letterSpacing', live: ls.letterSpacing, local: cs.letterSpacing, sev: 'minor', delta: d });
  }
  if (has('textTransform') && ls.textTransform !== cs.textTransform)
    out.push({ prop: 'textTransform', live: ls.textTransform, local: cs.textTransform, sev: 'major' });

  if (has('color')) compareColor('color', ls.color, cs.color, out);
  if (has('backgroundColor')) compareColor('backgroundColor', ls.backgroundColor, cs.backgroundColor, out);
  if (has('borderColor') && px(ls.borderWidth) !== 0) compareColor('borderColor', ls.borderColor, cs.borderColor, out);

  if (tier === 'block') {
    if (has('w')) {
      const d = Math.abs(live.w - local.w);
      if (d > 8) out.push({ prop: 'w', live: live.w, local: local.w, sev: 'major', delta: d });
      else if (d > 2) out.push({ prop: 'w', live: live.w, local: local.w, sev: 'minor', delta: d });
    }
    if (has('h')) {
      const d = Math.abs(live.h - local.h);
      if (d > 8) out.push({ prop: 'h', live: live.h, local: local.h, sev: 'major', delta: d });
      else if (d > 2) out.push({ prop: 'h', live: live.h, local: local.h, sev: 'minor', delta: d });
    }
    if (has('x')) {
      const d = Math.abs(live.x - local.x);
      if (d > 8) out.push({ prop: 'x', live: live.x, local: local.x, sev: 'major', delta: d });
      else if (d > 2) out.push({ prop: 'x', live: live.x, local: local.x, sev: 'minor', delta: d });
    }
    if (has('textAlign')) {
      // start≡left et end≡right en LTR — équivalence visuelle, pas un écart.
      const normAlign = (v) => (v === 'start' ? 'left' : v === 'end' ? 'right' : v);
      if (normAlign(ls.textAlign) !== normAlign(cs.textAlign))
        out.push({ prop: 'textAlign', live: ls.textAlign, local: cs.textAlign, sev: 'major' });
    }
    if (has('borderRadius') && ls.borderRadius !== cs.borderRadius) {
      const d = Math.abs((px(ls.borderRadius) || 0) - (px(cs.borderRadius) || 0));
      out.push({ prop: 'borderRadius', live: ls.borderRadius, local: cs.borderRadius, sev: d > 2 ? 'major' : 'minor', delta: d });
    }
    for (const p of ['padding', 'margin']) {
      if (!has(p)) continue;
      if (ls[p] !== cs[p]) {
        const la = (ls[p] || '').split(' ').map(px); const lb = (cs[p] || '').split(' ').map(px);
        const d = Math.max(...la.map((v, i) => Math.abs((v || 0) - (lb[i] ?? lb[0] ?? 0))));
        out.push({ prop: p, live: ls[p], local: cs[p], sev: 'minor', delta: isNum(d) ? d : null });
      }
    }
    if (has('boxShadow') && (ls.boxShadow === 'none') !== (cs.boxShadow === 'none'))
      out.push({ prop: 'boxShadow', live: ls.boxShadow, local: cs.boxShadow, sev: 'minor' });
  } else {
    // inline : largeur indicative seulement
    if (has('w')) {
      const d = Math.abs(live.w - local.w);
      if (d > 12) out.push({ prop: 'w', live: live.w, local: local.w, sev: 'minor', delta: d });
    }
    if (has('textDecorationLine') && ls.textDecorationLine !== cs.textDecorationLine)
      out.push({ prop: 'textDecorationLine', live: ls.textDecorationLine, local: cs.textDecorationLine, sev: 'minor' });
  }
  return out;
}

// ---------------------------------------------------------------- déviations
function loadDeviations() {
  const p = path.join(REPO_ROOT, 'contenu', 'reference', 'deviations.json');
  if (!fs.existsSync(p)) return [];
  return (JSON.parse(fs.readFileSync(p, 'utf8')).deviations || []);
}
function globToRe(g) {
  return new RegExp('^' + g.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
}
function deviationCovers(dev, { pageId, vwId, key, prop }) {
  if (dev.page !== '*' && dev.page !== pageId) return false;
  if (dev.viewport && dev.viewport !== '*' && dev.viewport !== vwId) return false;
  if (!globToRe(dev.keyPattern || '*').test(key)) return false;
  const props = dev.props || ['*'];
  return props.includes('*') || props.includes(prop);
}

// ------------------------------------------------------------------ sections
function buildSections(spec) {
  const flow = spec.blocks.filter((b) => !b.fixed);
  const sections = [];
  let current = { id: '⟨avant-premier-titre⟩', startY: 0, blocks: [] };
  for (const b of flow) {
    if (b.role === 'h1' || b.role === 'h2') {
      if (current.blocks.length) { current.endY = b.y; sections.push(current); }
      current = { id: `${b.role}:${b.text.slice(0, 50)}`, startY: b.y, blocks: [] };
    }
    current.blocks.push(b);
  }
  current.endY = spec.meta.pageHeight;
  sections.push(current);
  for (const s of sections) {
    let imgArea = 0;
    for (const img of spec.images) if (img.y >= s.startY && img.y < s.endY) imgArea += img.w * img.h;
    const area = spec.meta.viewportW * Math.max(1, s.endY - s.startY);
    s.imageHeavy = imgArea / area > 0.3;
  }
  return sections;
}

async function cropPng(buf, { top, height, width }) {
  return sharp(buf)
    .extract({ left: 0, top: Math.max(0, Math.round(top)), width: Math.round(width), height: Math.round(height) })
    .png()
    .toBuffer();
}

// =========================================================================
const args = parseArgs(process.argv);
const manifest = loadManifest();
const aliases = Object.fromEntries(
  Object.entries(manifest.fontAliases || {}).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()])
);
const pageDef = manifest.pages.find((p) => p.id === args.page);
if (!pageDef || !pageDef.path) { console.error(`Page inconnue ou sans path : ${args.page}`); process.exit(2); }

const vwIds = args.viewport === 'all'
  ? manifest.viewports.map((v) => v.id)
  : args.viewport.split(',');
const onlyGroups = args.only === 'all' ? Object.keys(PROP_GROUPS) : args.only.split(',');
const props = new Set(onlyGroups.flatMap((g) => PROP_GROUPS[g] || []));
const doPixel = args.pixel && onlyGroups.includes('layout');

const deviations = loadDeviations();
const localOrigin = args.origin || manifest.localOrigin;
let browser = null;
let exitCode = 0;

for (const vwId of vwIds) {
  const viewport = [...manifest.viewports, ...(manifest.extraViewports || [])].find((v) => v.id === vwId);
  if (!viewport) { console.error(`Viewport inconnu : ${vwId}`); exitCode = 1; continue; }

  const liveSpecPath = path.join(refDir(pageDef.id, vwId), 'spec.json');
  if (!fs.existsSync(liveSpecPath)) {
    console.error(`✗ Référence live absente (${liveSpecPath}) — lancer : node capture.mjs --target live --page ${pageDef.id} --viewport ${vwId}`);
    exitCode = 1; continue;
  }
  const liveSpec = JSON.parse(fs.readFileSync(liveSpecPath, 'utf8'));

  // ---- capture locale
  let localSpec; let localPngPath = cachePath('shots', 'local', pageDef.id, `${vwId}.png`);
  const localSpecPath = cachePath('spec', 'local', pageDef.id, `${vwId}.json`);
  if (args.skipCapture && fs.existsSync(localSpecPath)) {
    localSpec = JSON.parse(fs.readFileSync(localSpecPath, 'utf8'));
  } else {
    browser ??= await chromium.launch();
    try {
      const res = await capturePage(browser, { manifest, pageDef, viewport, target: 'local', origin: localOrigin });
      await persistCapture(res, { pageDef, viewport, target: 'local' });
      localSpec = res.spec;
    } catch (err) {
      console.error(`✗ Capture locale ${pageDef.id}@${vwId} impossible (${localOrigin}${pageDef.path}) : ${String(err).split('\n')[0]}`);
      exitCode = 1; continue;
    }
  }

  // ---- appariement des ancres
  const ctx = { pageId: pageDef.id, vwId };
  const mismatches = []; const assumed = []; const pairs = [];
  const unmatchedLive = []; const unmatchedLocal = new Map();

  // Clé d'appariement = texte casse-insensible + index d'occurrence, SANS le
  // rôle : le live balise souvent en <p> ce que nous balisons en <a>/<h*>
  // (amélioration sémantique voulue), et le live met la casse via CSS
  // text-transform là où nous l'écrivons en dur. Le rôle divergent est signalé
  // en mineur, il ne casse pas l'appariement.
  const indexByText = (list) => {
    const occ = new Map();
    return list.map((e) => {
      const base = (e.text || e.anchor || '').toLowerCase();
      const n = (occ.get(base) || 0) + 1;
      occ.set(base, n);
      return { e, mkey: `${base}#${n}`, prefix: base.slice(0, 40) };
    });
  };
  for (const tier of ['blocks', 'inlines', 'images']) {
    const liveIdx = indexByText(liveSpec[tier]);
    const localIdx = indexByText(localSpec[tier]);
    const localByKey = new Map(localIdx.map((x) => [x.mkey, x]));
    const usedLocal = new Set();
    const tierPairs = [];
    for (const lx of liveIdx) {
      let cx = localByKey.get(lx.mkey);
      if (cx && usedLocal.has(cx)) cx = null;
      if (!cx) cx = localIdx.find((c) => !usedLocal.has(c) && c.prefix === lx.prefix && c.prefix.length >= 8);
      if (cx) {
        usedLocal.add(cx);
        tierPairs.push([lx.e, cx.e]);
        if (tier !== 'images' && lx.e.role !== cx.e.role) {
          const rec = { tier, key: lx.e.key, text: (lx.e.text || '').slice(0, 60), prop: 'role', live: lx.e.role, local: cx.e.role, sev: 'minor' };
          const dev = deviations.find((x) => deviationCovers(x, { ...ctx, key: lx.e.key, prop: 'role' }));
          if (dev) assumed.push({ ...rec, reason: dev.reason }); else mismatches.push(rec);
        }
      } else unmatchedLive.push({ tier, key: lx.e.key });
    }
    for (const c of localIdx) if (!usedLocal.has(c)) {
      unmatchedLocal.set(`${tier}:${c.e.key}`, { tier, key: c.e.key });
    }
    pairs.push({ tier, tierPairs });
  }

  // ---- comparaison de propriétés
  for (const { tier, tierPairs } of pairs) {
    const t = tier === 'blocks' ? 'block' : tier === 'inlines' ? 'inline' : 'image';
    for (const [le, ce] of tierPairs) {
      let diffs = [];
      if (t === 'image') {
        for (const [p, thr] of [['w', 8], ['h', 8], ['x', 8]]) {
          if (!props.has(p)) continue;
          const d = Math.abs(le[p] - ce[p]);
          if (d > thr) diffs.push({ prop: p, live: le[p], local: ce[p], sev: 'major', delta: d });
        }
        if (props.has('borderRadius') && le.style.borderRadius !== ce.style.borderRadius)
          diffs.push({ prop: 'borderRadius', live: le.style.borderRadius, local: ce.style.borderRadius, sev: 'minor' });
      } else {
        diffs = comparePair(le, ce, { tier: t, aliases, props });
      }
      for (const d of diffs) {
        const rec = { tier, key: le.key, text: (le.text || le.anchor || '').slice(0, 60), y: le.y, ...d };
        const dev = deviations.find((x) => deviationCovers(x, { ...ctx, key: le.key, prop: d.prop }));
        if (dev) assumed.push({ ...rec, reason: dev.reason, rule: dev.rule });
        else mismatches.push(rec);
      }
    }
  }

  // ---- deltaY recalculé sur la séquence de blocs APPARIÉS uniquement
  if (props.has('deltaY')) {
    const blockPairs = pairs.find((p) => p.tier === 'blocks').tierPairs
      .filter(([le]) => !le.fixed)
      .sort((a, b) => a[0].y - b[0].y || a[0].x - b[0].x);
    for (let i = 1; i < blockPairs.length; i++) {
      const [lPrev, cPrev] = blockPairs[i - 1];
      const [lCur, cCur] = blockPairs[i];
      const dLive = lCur.y - lPrev.y;
      const dLocal = cCur.y - cPrev.y;
      const d = Math.abs(dLive - dLocal);
      if (d <= 2) continue;
      const rec = {
        tier: 'blocks', key: lCur.key, text: lCur.text.slice(0, 60), y: lCur.y,
        prop: 'deltaY', live: Math.round(dLive), local: Math.round(dLocal),
        sev: d > 8 ? 'major' : 'minor', delta: Math.round(d * 10) / 10,
        after: lPrev.text.slice(0, 40),
      };
      const dev = deviations.find((x) => deviationCovers(x, { ...ctx, key: lCur.key, prop: 'deltaY' }));
      if (dev) assumed.push({ ...rec, reason: dev.reason }); else mismatches.push(rec);
    }
  }

  // ---- ancres non appariées → majeurs (hors déviations "missing")
  for (const u of unmatchedLive) {
    const dev = deviations.find((x) => deviationCovers(x, { ...ctx, key: u.key, prop: 'presence' }));
    const rec = { tier: u.tier, key: u.key, prop: 'presence', live: 'présent', local: 'ABSENT', sev: 'major' };
    if (dev) assumed.push({ ...rec, reason: dev.reason }); else mismatches.push(rec);
  }

  // ---- clustering par cause racine
  const majors = mismatches.filter((m) => m.sev === 'major');
  const minors = mismatches.filter((m) => m.sev === 'minor');
  const clusters = new Map();
  for (const m of majors) {
    const sig = `${m.prop} | ${m.live} → ${m.local}`;
    if (!clusters.has(sig)) clusters.set(sig, []);
    clusters.get(sig).push(m);
  }
  const clusterList = [...clusters.entries()]
    .map(([sig, items]) => ({ sig, count: items.length, examples: items.slice(0, 3) }))
    .sort((a, b) => b.count - a.count);

  // ---- pixel-diff par section
  const sectionResults = [];
  let pixelGateFail = false;
  if (doPixel) {
    const livePngPath = cachePath('shots', 'live', pageDef.id, `${vwId}.png`);
    let livePng = fs.existsSync(livePngPath) ? fs.readFileSync(livePngPath) : null;
    if (!livePng) {
      browser ??= await chromium.launch();
      console.log(`  (PNG live absent du cache — recapture de ${pageDef.id}@${vwId})`);
      const res = await capturePage(browser, { manifest, pageDef, viewport, target: 'live', origin: manifest.liveOrigin });
      await persistCapture(res, { pageDef, viewport, target: 'live' });
      livePng = res.png;
    }
    const localPng = fs.readFileSync(localPngPath);
    const liveSections = buildSections(liveSpec);
    const localSections = buildSections(localSpec);
    const localById = new Map(localSections.map((s) => [s.id, s]));
    const outSecDir = path.join(reportDir(pageDef.id, vwId), 'sections');
    fs.mkdirSync(outSecDir, { recursive: true });

    const masks = (manifest.masks || {})[pageDef.id] || [];
    const maskBandsFor = (spec) =>
      masks.flatMap((mk) =>
        spec.blocks
          .filter((b) => b.text.includes(mk.anchorContains))
          .map((b) => ({ top: b.y - 8, bottom: b.y + b.h + 8 }))
      );
    const liveBands = maskBandsFor(liveSpec);
    const localBands = maskBandsFor(localSpec);

    const liveMeta = await sharp(livePng).metadata();
    const localMeta = await sharp(localPng).metadata();
    const width = Math.min(liveMeta.width, localMeta.width);

    const threshold = pageDef.template === 'post' ? 0.02 : 0.015;
    for (const ls of liveSections) {
      const cs = localById.get(ls.id);
      if (!cs) { sectionResults.push({ id: ls.id, ratio: null, note: 'section absente en local' }); continue; }
      const h = Math.round(Math.min(ls.endY - ls.startY, cs.endY - cs.startY));
      if (h < 8) continue;
      const hCap = Math.min(h, Math.round(liveMeta.height - ls.startY), Math.round(localMeta.height - cs.startY));
      if (hCap < 8) continue;
      const [aBuf, bBuf] = await Promise.all([
        cropPng(livePng, { top: ls.startY, height: hCap, width }),
        cropPng(localPng, { top: cs.startY, height: hCap, width }),
      ]);
      const A = PNG.sync.read(aBuf); const B = PNG.sync.read(bBuf);
      const blank = (img, bands, offset) => {
        for (const band of bands) {
          const y0 = Math.max(0, Math.round(band.top - offset));
          const y1 = Math.min(img.height, Math.round(band.bottom - offset));
          for (let y = y0; y < y1; y++) img.data.fill(0, y * img.width * 4, (y + 1) * img.width * 4);
        }
      };
      blank(A, liveBands, ls.startY); blank(B, liveBands, ls.startY);
      blank(A, localBands, cs.startY); blank(B, localBands, cs.startY);
      const D = new PNG({ width: A.width, height: A.height });
      const changed = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0.12, includeAA: false });
      const ratio = changed / (A.width * A.height);
      const safe = ls.id.replace(/[^a-z0-9àâéèêëîïôùûüç_-]+/gi, '_').slice(0, 60);
      fs.writeFileSync(path.join(outSecDir, `${safe}.png`), PNG.sync.write(D));
      const blocking = !ls.imageHeavy && ratio > threshold;
      if (blocking && majors.length === 0) pixelGateFail = true;
      sectionResults.push({ id: ls.id, ratio, imageHeavy: ls.imageHeavy, blocking });
    }
  }

  // ---- hauteur de page
  const hLive = liveSpec.meta.pageHeight; const hLocal = localSpec.meta.pageHeight;
  const heightDelta = (hLocal - hLive) / hLive;

  // ---- gates
  const gates = {
    majors: majors.length === 0,
    minors: minors.length <= 10,
    pixel: !pixelGateFail,
    height: Math.abs(heightDelta) <= 0.02,
  };
  const pass = Object.values(gates).every(Boolean);
  if (!pass) exitCode = 1;

  // ---- rapports
  const outDir = reportDir(pageDef.id, vwId);
  fs.mkdirSync(outDir, { recursive: true });
  const result = {
    page: pageDef.id, viewport: vwId, ranAt: new Date().toISOString(),
    origins: { live: manifest.liveOrigin, local: localOrigin },
    pageHeight: { live: hLive, local: hLocal, delta: Math.round(heightDelta * 1000) / 10 },
    counts: {
      majors: majors.length, minors: minors.length, assumed: assumed.length,
      unmatchedLive: unmatchedLive.length, unmatchedLocal: unmatchedLocal.size,
    },
    gates, pass, clusters: clusterList, majors, minors, assumed,
    unmatchedLocal: [...unmatchedLocal.values()],
    sections: sectionResults,
  };
  fs.writeFileSync(path.join(outDir, 'spec-diff.json'), JSON.stringify(result, null, 1));

  const md = [];
  md.push(`# spec-diff ${pageDef.id} @${vwId} — ${result.ranAt}`);
  md.push('');
  md.push(`Hauteur page : live ${hLive}px vs local ${hLocal}px (Δ ${result.pageHeight.delta}%) ${gates.height ? '✓' : '✗'}`);
  md.push(`Gates : majeurs=${majors.length} ${gates.majors ? '✓' : '✗'} | mineurs=${minors.length} ${gates.minors ? '✓' : '✗'} | pixel ${gates.pixel ? '✓' : '✗'} | **${pass ? 'PASS' : 'FAIL'}**`);
  md.push('');
  if (clusterList.length) {
    md.push(`## Clusters majeurs (cause racine probable — corriger UNE cause, re-lancer)`);
    clusterList.slice(0, 15).forEach((c, i) => {
      md.push(`${i + 1}. **[${c.count}×] ${c.sig}**`);
      for (const e of c.examples) md.push(`   - ${e.key}${e.after ? ` (après « ${e.after} »)` : ''}`);
    });
    md.push('');
  }
  if (assumed.length) {
    md.push(`## Déviations assumées (${assumed.length})`);
    for (const a of assumed.slice(0, 20)) md.push(`- ${a.key} [${a.prop}] — ${a.reason || ''}`);
    md.push('');
  }
  if (minors.length) {
    md.push(`## Mineurs (${minors.length})`);
    for (const m of minors.slice(0, 25))
      md.push(`- ${m.key} [${m.prop}] ${m.live} vs ${m.local}${m.delta != null ? ` (Δ${m.delta})` : ''}`);
    md.push('');
  }
  if (unmatchedLive.length || unmatchedLocal.size) {
    md.push(`## Non appariés`);
    md.push(`- Live sans équivalent local (${unmatchedLive.length}) : ${unmatchedLive.slice(0, 15).map((u) => u.key).join(' ; ')}`);
    md.push(`- Local sans équivalent live (${unmatchedLocal.size}) : ${[...unmatchedLocal.values()].slice(0, 15).map((u) => u.key).join(' ; ')}`);
    md.push('');
  }
  if (sectionResults.length) {
    md.push(`## Pixel par section (seuil texte ${pageDef.template === 'post' ? '2' : '1.5'}%, image 4% non bloquant)`);
    md.push(`| section | ratio | type | verdict |`);
    md.push(`|---|---|---|---|`);
    for (const s of sectionResults)
      md.push(`| ${s.id.slice(0, 50)} | ${s.ratio == null ? '—' : (s.ratio * 100).toFixed(2) + '%'} | ${s.imageHeavy ? 'image' : 'texte'} | ${s.note || (s.blocking ? '✗' : '✓')} |`);
  }
  fs.writeFileSync(path.join(outDir, 'spec-diff.md'), md.join('\n'));

  console.log(
    `${pass ? '✓' : '✗'} ${pageDef.id} @${vwId} — majeurs ${majors.length} (clusters ${clusterList.length}), ` +
      `mineurs ${minors.length}, assumés ${assumed.length}, hauteur Δ${result.pageHeight.delta}% → ${path.relative(REPO_ROOT, path.join(outDir, 'spec-diff.md'))}`
  );
}

if (browser) await browser.close();
process.exit(exitCode);
