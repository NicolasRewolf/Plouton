// Marcheur de specs — injecté dans la page via Playwright page.evaluate(walkSpec, opts).
// Code DOM pur : aucune capture de portée module, aucun import utilisé à l'intérieur.
//
// Principe : le contenu texte est identique entre le site Wix live et la réplique
// Next.js (migration verbatim). On ancre donc chaque élément par SON TEXTE, pas par
// sa structure DOM (les deux DOM n'ont rien à voir : soupe de div Wix vs HTML
// sémantique). Clé d'ancre = tier:role:texte-normalisé:index-d'occurrence.
//
// Trois familles d'ancres :
//  - blocks  : blocs "feuilles" porteurs de texte (aucun descendant bloc avec texte).
//              Comparés sur boîte + typo + espacements. Le Y absolu n'est JAMAIS
//              comparé directement : on enregistre deltaY vers le bloc précédent
//              (une erreur d'espacement en haut de page ne cascade pas).
//  - inlines : liens/boutons non-blocs (typo + couleurs + pilule, pas les marges).
//  - images  : ancrées par l'ID média wixstatic (survit au changement de DOM),
//              fallback alt.

export function walkSpec(opts) {
  const o = opts || {};
  const MAX_TEXT = o.maxTextLen || 80;

  const norm = (s) => (s || '').normalize('NFC').replace(/\s+/g, ' ').trim();

  const BLOCKISH = {
    block: 1, flex: 1, grid: 1, 'list-item': 1, table: 1,
    'table-cell': 1, 'table-caption': 1, 'flow-root': 1,
  };

  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, IFRAME: 1, SVG: 1, PATH: 1 };

  const round2 = (v) => Math.round(v * 100) / 100;

  const roleOf = (el) => {
    const t = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(t)) return t;
    if (t === 'a') return 'a';
    if (t === 'button' || el.getAttribute('role') === 'button') return 'button';
    if (t === 'li') return 'li';
    if (t === 'td' || t === 'th') return 'cell';
    return 'p';
  };

  const blockStyle = (cs) => ({
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
    textAlign: cs.textAlign,
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    padding: cs.padding,
    margin: cs.margin,
    borderRadius: cs.borderRadius,
    borderWidth: `${cs.borderTopWidth} ${cs.borderRightWidth} ${cs.borderBottomWidth} ${cs.borderLeftWidth}`,
    borderColor: cs.borderTopColor,
    boxShadow: cs.boxShadow,
    display: cs.display,
    flexDirection: cs.flexDirection,
    gap: cs.gap,
    maxWidth: cs.maxWidth,
    position: cs.position,
    textDecorationLine: cs.textDecorationLine,
  });

  const inlineStyle = (cs) => ({
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    textDecorationLine: cs.textDecorationLine,
    borderRadius: cs.borderRadius,
    borderWidth: cs.borderTopWidth,
    borderColor: cs.borderTopColor,
    paddingTop: cs.paddingTop,
    paddingLeft: cs.paddingLeft,
  });

  // ---- Parcours unique du DOM ----------------------------------------------
  const all = document.body.querySelectorAll('*');
  const rendered = new Map(); // el -> { cs, r }
  for (const el of all) {
    if (SKIP_TAGS[el.tagName]) continue;
    if (el.closest('svg')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    rendered.set(el, { cs, r });
  }

  // Candidats blocs : display bloc-ish + texte non vide.
  const candidates = [];
  for (const [el, v] of rendered) {
    if (!BLOCKISH[v.cs.display]) continue;
    const txt = norm(el.textContent);
    if (!txt) continue;
    candidates.push(el);
  }
  // Feuilles = candidats ne contenant aucun autre candidat (marquage des ancêtres).
  const hasBlockTextDesc = new Set();
  for (const el of candidates) {
    let p = el.parentElement;
    while (p && p !== document.body) {
      hasBlockTextDesc.add(p);
      p = p.parentElement;
    }
  }
  const leaves = candidates.filter((el) => !hasBlockTextDesc.has(el));

  // Zone structurelle — permet au diff d'exclure une zone gelée (ex. Header
  // figé côté produit) ou de cibler une brique (--zone footer).
  // Un <header>/<footer> imbriqué dans <main> ou <article> est du contenu
  // (HTML5 : footer d'article — Wix en met 4 par post), pas une zone de site.
  const zoneOf = (el) => {
    const h = el.closest('header, [data-zone="header"]');
    if (h && !h.closest('main, article')) return 'header';
    const f = el.closest('footer, [role="contentinfo"], [data-zone="footer"]');
    if (f && !f.closest('main, article')) return 'footer';
    return 'main';
  };

  const scrollY = window.scrollY || 0;
  const occ = Object.create(null);
  const keyFor = (tier, role, text) => {
    const base = `${tier}:${role}:${text}`;
    const n = (occ[base] = (occ[base] || 0) + 1);
    return `${base}#${n}`;
  };

  const blocks = [];
  let prevFlowBlock = null;
  const leafSet = new Set(leaves);
  for (const el of leaves) {
    const { cs, r } = rendered.get(el);
    const text = norm(el.textContent);
    const short = text.slice(0, MAX_TEXT);
    const role = roleOf(el);
    const fixed = cs.position === 'fixed' || cs.position === 'sticky';
    const entry = {
      key: keyFor('b', role, short),
      role,
      zone: zoneOf(el),
      text: short,
      fullTextLen: text.length,
      x: round2(r.x),
      y: round2(r.y + scrollY),
      w: round2(r.width),
      h: round2(r.height),
      fixed,
      deltaY: null,
      style: blockStyle(cs),
    };
    if (!fixed) {
      if (prevFlowBlock) entry.deltaY = round2(entry.y - prevFlowBlock.y);
      prevFlowBlock = entry;
    }
    blocks.push(entry);
  }

  // Inlines : liens/boutons qui ne sont pas déjà des blocs-feuilles.
  const inlines = [];
  for (const [el, v] of rendered) {
    const t = el.tagName.toLowerCase();
    const isBtn = t === 'button' || el.getAttribute('role') === 'button';
    if (t !== 'a' && !isBtn) continue;
    if (leafSet.has(el)) continue;
    const text = norm(el.textContent);
    if (!text) continue;
    const short = text.slice(0, MAX_TEXT);
    inlines.push({
      key: keyFor('i', isBtn ? 'button' : 'a', short),
      role: isBtn ? 'button' : 'a',
      zone: zoneOf(el),
      text: short,
      x: round2(v.r.x),
      y: round2(v.r.y + scrollY),
      w: round2(v.r.width),
      h: round2(v.r.height),
      href: t === 'a' ? el.getAttribute('href') : null,
      style: inlineStyle(v.cs),
    });
  }

  // Images : ancrées par l'ID média wixstatic (ou alt, ou nom de fichier).
  const images = [];
  for (const img of document.images) {
    const v = rendered.get(img);
    if (!v) continue;
    const src = img.currentSrc || img.src || '';
    const m = /\/media\/([^/.]+)/.exec(src);
    const stem = m ? m[1].replace(/~.*$/, '') : null;
    const anchor = stem || norm(img.alt) || (src.split('/').pop() || '').slice(0, 60) || 'img';
    images.push({
      key: keyFor('img', 'img', anchor),
      anchor,
      zone: zoneOf(img),
      alt: norm(img.alt).slice(0, MAX_TEXT),
      x: round2(v.r.x),
      y: round2(v.r.y + scrollY),
      w: round2(v.r.width),
      h: round2(v.r.height),
      style: {
        objectFit: v.cs.objectFit,
        borderRadius: v.cs.borderRadius,
      },
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
    });
  }

  // Couverture texte : part du texte VISIBLE de la page portée par des ancres
  // blocs. innerText (et non textContent) : exclut les <script>/<style> — dont le
  // JSON wix-warmup-data de plusieurs MB — et les sous-arbres display:none.
  const bodyLen = norm(document.body.innerText).length || 1;
  let coveredLen = 0;
  for (const b of blocks) coveredLen += b.fullTextLen;

  return {
    meta: {
      url: location.href,
      pageHeight: Math.round(Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      )),
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      textCoverage: round2(Math.min(1, coveredLen / bodyLen)),
      blockCount: blocks.length,
      inlineCount: inlines.length,
      imageCount: images.length,
    },
    blocks,
    inlines,
    images,
  };
}
