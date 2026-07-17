// Pipeline de capture partagé (capture.mjs et diff.mjs).
// Même pipeline pour live et local : c'est ce qui rend la comparaison équitable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { walkSpec } from './spec-walker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const MANIFEST_PATH = path.join(__dirname, 'manifest.json');

export function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

export function refDir(pageId, vwId) {
  return path.join(REPO_ROOT, 'contenu', 'reference', pageId, vwId);
}

export function cachePath(...segs) {
  return path.join(REPO_ROOT, '.cache', 'visual', ...segs);
}

export function reportDir(pageId, vwId) {
  return path.join(REPO_ROOT, 'reports', 'visual', pageId, vwId);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// CSS injecté : tue animations/transitions + smooth-scroll (les deux côtés).
const KILL_CSS = `
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
html { scroll-behavior: auto !important; }
`;

export async function newContext(browser, viewport) {
  return browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    reducedMotion: 'reduce',
  });
}

/**
 * Capture une page : screenshot pleine page (PNG) + spec JSON de styles calculés.
 * @returns {Promise<{spec: object, png: Buffer}>}
 */
export async function capturePage(browser, { manifest, pageDef, viewport, target, origin }) {
  const context = await newContext(browser, viewport);
  const page = await context.newPage();
  const blocked = manifest.blockedUrlParts || [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (blocked.some((part) => url.includes(part))) return route.abort();
    return route.continue();
  });

  try {
    const fullUrl = origin.replace(/\/$/, '') + pageDef.path;
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });

    const hideCss = (manifest.hideSelectors || [])
      .map((sel) => `${sel} { display: none !important; }`)
      .join('\n');
    await page.addStyleTag({ content: KILL_CSS + hideCss });

    // Forcer le chargement immédiat des images lazy avant l'auto-scroll.
    await page.evaluate(() => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
    });

    // Auto-scroll par pas de 80% de viewport (déclenche les lazy-loads Wix).
    // Cap à 30 000px : les feeds Wix ont un infinite-scroll qui ferait grandir
    // la page sans fin (et de façon non déterministe) si on scrollait "jusqu'en bas".
    const SCROLL_CAP = 30_000;
    await page.evaluate(async (cap) => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          y += window.innerHeight * 0.8;
          window.scrollTo(0, y);
          const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          if (y < Math.min(max, cap)) setTimeout(step, 180);
          else resolve();
        };
        step();
      });
    }, SCROLL_CAP);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));

    await page
      .waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 20_000 })
      .catch(() => {});
    await page
      .waitForFunction(
        () => Array.from(document.images).every((i) => !i.src || i.complete),
        null,
        { timeout: 20_000 }
      )
      .catch(() => {});
    await page.waitForTimeout(500);

    const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
    const spec = await page.evaluate(walkSpec, { maxTextLen: 80 });
    spec.meta = {
      ...spec.meta,
      pageId: pageDef.id,
      path: pageDef.path,
      template: pageDef.template,
      viewportId: viewport.id,
      target,
      origin,
      capturedAt: new Date().toISOString(),
    };
    return { spec, png };
  } finally {
    await context.close();
  }
}

/** Écrit les artefacts d'une capture aux bons emplacements selon la cible. */
export async function persistCapture({ spec, png }, { pageDef, viewport, target }) {
  const pngPath = cachePath('shots', target, pageDef.id, `${viewport.id}.png`);
  ensureDir(path.dirname(pngPath));
  fs.writeFileSync(pngPath, png);

  if (target === 'live') {
    const dir = refDir(pageDef.id, viewport.id);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1));
    // Le format JPEG plafonne à 65 500px de haut — au-delà, on réduit l'archive
    // visuelle (le PNG du cache et le spec.json restent à l'échelle 1:1).
    const meta = await sharp(png).metadata();
    let jpegPipeline = sharp(png);
    if (meta.height > 65_000) {
      const scale = 65_000 / meta.height;
      jpegPipeline = jpegPipeline.resize({ height: 65_000, width: Math.round(meta.width * scale) });
    }
    await jpegPipeline.jpeg({ quality: 85, mozjpeg: true }).toFile(path.join(dir, 'screenshot.jpg'));
  } else {
    const specPath = cachePath('spec', target, pageDef.id, `${viewport.id}.json`);
    ensureDir(path.dirname(specPath));
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 1));
  }
  return { pngPath };
}

/** Liste (pageDef, viewport) à traiter d'après le manifest et les filtres CLI. */
export function planCaptures(manifest, { pageFilter = 'all', viewportFilter = 'all' } = {}) {
  const wantedPages =
    pageFilter === 'all' ? null : new Set(pageFilter.split(',').map((s) => s.trim()));
  const wantedVws =
    viewportFilter === 'all' ? null : new Set(viewportFilter.split(',').map((s) => s.trim()));

  const jobs = [];
  for (const pageDef of manifest.pages) {
    if (!pageDef.path) continue; // placeholders (post-table / post-media avant Phase 2)
    if (wantedPages && !wantedPages.has(pageDef.id)) continue;
    for (const vw of manifest.viewports) {
      if (wantedVws && !wantedVws.has(vw.id)) continue;
      jobs.push({ pageDef, viewport: vw });
    }
    for (const vw of manifest.extraViewports || []) {
      if (!(vw.pages || []).includes(pageDef.id)) continue;
      if (wantedVws && !wantedVws.has(vw.id)) continue;
      jobs.push({ pageDef, viewport: vw });
    }
  }
  return jobs;
}
