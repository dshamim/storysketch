// Fonts: letter outlines stored as plain data (plugins/fonts/*.js, made by tools/build_fonts.py from OFL fonts).
// The page never asks the computer to draw text in a font: it reads these outlines and turns them into ordinary filled shapes
// (drawing primitives), so every style can finish them and every export is the same on every machine.
//   FONTS.register(def) / get / has / list         the registry (CP.register({ type: 'font' }) lands here)
//   FONTS.advances(str, fontId, weight, size, sp)  how far each letter moves the pen; kerning is folded into the first letter of a pair
//   FONTS.has(fontId, ch)                          true if the font draws this character (others fall back to the handwriting letter)
//   FONTS.glyph(fontId, weight, ch, size, x, y)    the letter as { pts, more } contours at a position (y = the baseline)
// Item property: text.font is "hand" (the built-in single-stroke handwriting) or a font plugin id. An unknown id draws as "hand".
// Outlines are y-down on a 1000-unit em with the baseline at 0; numbers are plain float maths (deterministic everywhere).
// (Part of the core; no DOM. Plain <script> files share globals and load in the order listed in index.html.)
const FONTS = (() => {
  const fonts = {}; const cache = new Map();
  const CAPFIT = 0.92; // the capital letters are this fraction of `size` tall (the handwriting letters are 1.0, its lowercase is small), so switching fonts keeps the box about the same
  const ALIAS = { ' ': ' ', '−': '-', '‐': '-', '‑': '-', '‒': '-', '―': '—', '′': "'", '″': '"', '­': '' };
  const norm = (ch) => ALIAS[ch] ?? ch;

  // a plugin stores each letter as [advance, outline]; it is opened up into { a, d } once, when the font is registered
  function register(def) { for (const w of Object.values(def.weights)) for (const ch of Object.keys(w.glyphs)) if (Array.isArray(w.glyphs[ch])) w.glyphs[ch] = { a: w.glyphs[ch][0], d: w.glyphs[ch][1] }; fonts[def.id] = def; for (const k of [...cache.keys()]) if (k.startsWith(def.id + '|')) cache.delete(k); }
  const get = (id) => fonts[id] || null;
  const list = () => Object.values(fonts).sort((a, b) => (a.order ?? 50) - (b.order ?? 50) || String(a.name).localeCompare(b.name));
  const weightOf = (f, weight) => (f && (f.weights[weight === 'bold' ? 'bold' : 'regular'] || f.weights.regular)) || null;
  /** The glyph for a character, or null if this font does not draw it. */
  const glyphOf = (id, weight, ch) => { const w = weightOf(fonts[id], weight); const g = w && w.glyphs[norm(ch)]; return g || null; };
  const has = (id, ch, weight) => !!glyphOf(id, weight || 'regular', ch);
  /** Pixels per font unit at this text size. */
  const scaleOf = (id, weight, size) => { const w = weightOf(fonts[id], weight); return w ? size * CAPFIT / (w.metrics.cap || 700) : 0; };

  // ---- parsing the path text into contours of commands (once per glyph) ----
  const ARGS = { M: 2, L: 2, H: 1, V: 1, Q: 4, C: 6, Z: 0 };
  function parse(d) { // M L H V Q C Z, absolute. A command may carry several sets of numbers (after M they are lines); H and V become plain L
    const out = []; let cur = null, px = 0, py = 0; const re = /([MLHVQCZ])([^MLHVQCZ]*)/g; let m;
    while ((m = re.exec(d))) {
      const n = m[2].match(/-?\d+(?:\.\d+)?/g)?.map(Number) || []; let c = m[1]; const k = ARGS[c];
      if (c === 'Z') { if (cur) cur.push(['Z']); continue; }
      for (let i = 0; i + k <= n.length; i += k) {
        const a = n.slice(i, i + k);
        if (c === 'M' && i === 0) { cur = []; out.push(cur); cur.push(['M', a[0], a[1]]); px = a[0]; py = a[1]; continue; }
        if (!cur) break;
        if (c === 'H') px = a[0]; else if (c === 'V') py = a[0]; else { px = a[a.length - 2]; py = a[a.length - 1]; }
        cur.push(c === 'H' || c === 'V' || c === 'M' ? ['L', px, py] : [c, ...a]);
      }
    }
    return out;
  }
  /** Flatten commands to a polyline in font units. `q` = pieces per curve. */
  function flatten(cmds, q) {
    const pts = []; let x = 0, y = 0;
    for (const c of cmds) {
      if (c[0] === 'M' || c[0] === 'L') { x = c[1]; y = c[2]; pts.push([x, y]); }
      else if (c[0] === 'Q') {
        const [, cx, cy, ex, ey] = c; for (let i = 1; i <= q; i++) { const t = i / q, u = 1 - t; pts.push([u * u * x + 2 * u * t * cx + t * t * ex, u * u * y + 2 * u * t * cy + t * t * ey]); } x = ex; y = ey;
      } else if (c[0] === 'C') {
        const [, c1x, c1y, c2x, c2y, ex, ey] = c; for (let i = 1; i <= q; i++) { const t = i / q, u = 1 - t; pts.push([u * u * u * x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex, u * u * u * y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey]); } x = ex; y = ey;
      }
    }
    // the closing line back to the start is implied; drop a repeated last point
    const a = pts[0], b = pts[pts.length - 1]; if (pts.length > 1 && a[0] === b[0] && a[1] === b[1]) pts.pop();
    return pts;
  }
  /** The contours of a glyph in font units, flattened at quality q (cached). The largest contour (by box) comes first. */
  function contours(id, weight, ch, q) {
    const key = `${id}|${weight === 'bold' ? 'b' : 'r'}|${norm(ch)}|${q}`; let r = cache.get(key); if (r) return r;
    const g = glyphOf(id, weight, ch); r = [];
    if (g && g.d) {
      if (!g.cmds) g.cmds = parse(g.d);
      r = g.cmds.map((c) => flatten(c, q)).filter((p) => p.length > 2);
      const area = (p) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return (x1 - x0) * (y1 - y0); };
      r.sort((a, b) => area(b) - area(a));
    }
    cache.set(key, r); return r;
  }
  const quality = (size) => Math.max(2, Math.min(12, Math.ceil(size / 22))); // pieces per curve: more for big letters

  /** The letter as contours at (x, baseline y) at this text size. { pts: biggest outline, more: the others (holes, dots) } or null. */
  function glyph(id, weight, ch, size, x, y) {
    const cs = contours(id, weight, ch, quality(size)); if (!cs.length) return null; const k = scaleOf(id, weight, size);
    const map = (p) => p.map(([u, v]) => [x + u * k, y + v * k]);
    return { pts: map(cs[0]), more: cs.length > 1 ? cs.slice(1).map(map) : null };
  }

  /** The pen's step for every character of `str` (kerning with the next letter folded into the first). `handAdv(ch)` gives the step for characters the font lacks. */
  function advances(str, id, weight, size, sp, handAdv) {
    const w = weightOf(fonts[id], weight); const k = scaleOf(id, weight, size); const out = [];
    for (let i = 0; i < str.length; i++) {
      const ch = norm(str[i]), g = w.glyphs[ch];
      if (!g) { out.push(handAdv ? handAdv(str[i]) : size * 0.5); continue; }
      let a = g.a; const nx = norm(str[i + 1] || ''); if (ch !== ' ' && nx && nx !== ' ') a += w.kern[ch + nx] || 0;
      out.push(a * k + sp * size);
    }
    return out;
  }
  return { register, get, list, has, glyph, advances, scaleOf, weightOf, norm, CAPFIT };
})();
