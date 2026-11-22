// Shapes, lines and arrows: ordinary items (type "shape" and "line") drawn from the same primitives as everything else,
// so every style (crayon, marker, ink, chalk, clean) draws them and export keeps them as lines. Pure functions, no DOM.
//   SHP.make(kind, x, y)        -> a new item ("box" "circle" "triangle" "line" "arrow" "double")
//   SHP.prims(item)             -> drawing primitives (outline, fill or shading, dashes, arrowheads, words inside a shape)
//   SHP.box(item)               -> the box around it in its own units, centred on the item's origin
//   SHP.resize / fromDrag / setEnds / snapAngle -> what dragging a handle or drawing with the mouse does
// A shape's origin (x, y) is the centre of its box (w by h). A line's origin is its midpoint and its two points are
// stored relative to it, so move, turn, scale, flip, group, snap and arrange work for both exactly as for text.
const SHP = (() => {
  const KINDS = { box: { name: 'Box', w: 200, h: 130 }, circle: { name: 'Circle', w: 150, h: 150 }, triangle: { name: 'Triangle', w: 170, h: 150 } };
  const LINES = { line: { name: 'Line', start: 'none', end: 'none' }, arrow: { name: 'Arrow', start: 'none', end: 'arrow' }, double: { name: 'Double arrow', start: 'arrow', end: 'arrow' } };
  const SHAPE_DEFAULTS = { shape: 'box', w: 200, h: 130, fill: 'none', fillColor: '#ffd966', stroke: '#2a2a2a', width: 5, dash: 'none', radius: 0, opacity: 1, text: '', textSize: 40, textColor: '#2a2a2a' };
  const LINE_DEFAULTS = { pts: [[-110, 0], [110, 0]], stroke: '#2a2a2a', width: 5, dash: 'none', start: 'none', end: 'arrow', opacity: 1 };
  const LIMITS = { w: [12, 4000], h: [12, 4000], width: [0, 40], radius: [0, 200], opacity: [0.1, 1], textSize: [8, 400] };
  const MIN = 12; // smallest side of a shape / length of a line
  const FILLS = { none: 'No fill', colour: 'Colour', hatch: 'Shading lines', solid: 'Solid (hides what is behind)' };
  const DASHES = { none: 'Solid line', dashed: 'Dashed', dotted: 'Dotted' };
  const normShape = (it) => ({ ...SHAPE_DEFAULTS, ...it });
  const normLine = (it) => ({ ...LINE_DEFAULTS, ...it });
  const clampTo = (k, v) => { const [a, b] = LIMITS[k]; return Math.min(b, Math.max(a, +v)); };
  const round = (n) => Math.round(n);

  // ---- the item's own frame <-> the page (same maths as the rest of the editor) ----
  const toPage = (it, L) => { const x = (it.flip ? -L[0] : L[0]) * it.s, y = L[1] * it.s; const a = U.rad(it.rot || 0); return [it.x + x * Math.cos(a) - y * Math.sin(a), it.y + x * Math.sin(a) + y * Math.cos(a)]; };
  const toLocal = (it, P) => {
    const d = [P[0] - it.x, P[1] - it.y]; const a = U.rad(-(it.rot || 0));
    let x = (d[0] * Math.cos(a) - d[1] * Math.sin(a)) / it.s; const y = (d[0] * Math.sin(a) + d[1] * Math.cos(a)) / it.s;
    if (it.flip) x = -x; return [x, y];
  };

  // ---- outlines ----
  function cornerPts(w, h, radius) { // a box; with rounded corners a polygon with 8 steps per corner
    const hw = w / 2, hh = h / 2, r = Math.min(+radius || 0, hw, hh);
    if (r < 0.5) return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    const pts = []; const arc = (cx, cy, a0) => { for (let i = 0; i <= 8; i++) { const a = U.rad(a0 + 90 * i / 8); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
    arc(hw - r, -hh + r, -90); arc(hw - r, hh - r, 0); arc(-hw + r, hh - r, 90); arc(-hw + r, -hh + r, 180); return pts;
  }
  const ellipsePts = (hw, hh, n) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [hw * Math.cos(a), hh * Math.sin(a)]; });
  /** The closed outline. `dense` = many points (for cutting into dashes); otherwise a circle stays a smooth curve. */
  function outline(item, dense) {
    const it = normShape(item); const hw = it.w / 2, hh = it.h / 2;
    if (it.shape === 'circle') return { pts: ellipsePts(hw, hh, dense ? 96 : 32), smooth: !dense };
    if (it.shape === 'triangle') return { pts: [[0, -hh], [hw, hh], [-hw, hh]], smooth: false };
    return { pts: cornerPts(it.w, it.h, it.radius), smooth: false };
  }

  // ---- dashes: cut the outline into short open pieces, so every style draws them with no extra support ----
  const patternOf = (dash, w) => (dash === 'dotted' ? [0.6, Math.max(8, w * 2.2)] : [Math.max(10, w * 3), Math.max(8, w * 2)]); // [dash, gap]
  /** Split a path into dashes. Closed paths get a whole number of dashes; open ones start and end on a dash. */
  function dashes(pts, closed, dash, w) {
    const P = closed ? [...pts, pts[0]] : pts; const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + U.len(U.sub(P[i], P[i - 1])));
    const total = cum[cum.length - 1]; const [on0, off0] = patternOf(dash, w);
    if (total < on0 + off0) return [P];
    let n, on, off;
    if (closed) { n = Math.max(1, Math.round(total / (on0 + off0))); const k = total / (n * (on0 + off0)); on = on0 * k; off = off0 * k; }
    else { n = Math.max(1, Math.round((total + off0) / (on0 + off0))); const k = total / (n * on0 + (n - 1) * off0); on = on0 * k; off = off0 * k; }
    const at = (d) => { let i = 0; while (i < cum.length - 2 && cum[i + 1] < d) i++; const t = (d - cum[i]) / Math.max(1e-9, cum[i + 1] - cum[i]); return U.lerp2(P[i], P[i + 1], U.clamp(t, 0, 1)); };
    const out = [];
    for (let j = 0; j < n; j++) {
      const a = j * (on + off), b = a + on; const piece = [at(a)];
      for (let i = 1; i < cum.length - 1; i++) if (cum[i] > a && cum[i] < b) piece.push(P[i]);
      piece.push(at(b)); out.push(piece);
    }
    return out;
  }

  // ---- arrowheads: an open "V" at the tip, in the line's own colour and thickness ----
  const headSize = (w, len) => Math.min(Math.max(18, w * 4.5), 90, Math.max(8, len * 0.45));
  /** The three points of a head at `tip` for a line arriving from `from` (wing, tip, wing). */
  function headPts(tip, from, size) {
    const d = U.sub(tip, from); const l = U.len(d); const u = l > 1e-6 ? [d[0] / l, d[1] / l] : [1, 0]; const n = [-u[1], u[0]]; const a = U.rad(30);
    const back = [u[0] * Math.cos(a) * size, u[1] * Math.cos(a) * size], side = [n[0] * Math.sin(a) * size, n[1] * Math.sin(a) * size];
    return [[tip[0] - back[0] + side[0], tip[1] - back[1] + side[1]], [tip[0], tip[1]], [tip[0] - back[0] - side[0], tip[1] - back[1] - side[1]]];
  }

  // ---- words inside a shape (the text engine, centred) ----
  /** The text to lay out inside a shape: a text item centred on the shape's origin, shifted down by `dy` (a triangle's middle is low). */
  function textView(item) {
    const it = normShape(item); const k = it.shape; const inner = k === 'circle' ? 0.72 : k === 'triangle' ? 0.55 : 1;
    const w = Math.max(30, Math.round(it.w * inner - 2 * (16 + it.width)));
    return { dy: k === 'triangle' ? it.h * 0.16 : 0, item: { ...TXT.DEFAULTS, type: 'text', text: it.text, size: it.textSize, color: it.textColor, align: 'center', w } };
  }

  // ---- drawing ----
  function shapePrims(item) {
    const it = normShape(item); const pen = new Pen({}); const w = clampTo('width', it.width); const { pts, smooth } = outline(it, false);
    const dashed = it.dash !== 'none' && w > 0; const stroke = w > 0 ? it.stroke : false; const base = { closed: true, smooth };
    if (it.fill === 'solid') pen.path(pts, { ...base, stroke: false, fill: 'paper' }); // hides what is behind, in every style
    const o = { ...base, stroke: dashed ? false : stroke, w };
    if (it.fill === 'solid' || it.fill === 'colour') o.fill = it.fillColor; else if (it.fill === 'hatch') o.hatch = it.fillColor;
    if (o.fill || o.hatch || o.stroke) pen.path(pts, o);
    if (dashed) { const d = outline(it, true); for (const pc of dashes(d.pts, true, it.dash, w)) pen.line(pc, { stroke, w }); }
    if (String(it.text).trim()) { const v = textView(it); for (const p of TXT.prims(v.item)) pen.o.push(v.dy ? { ...p, pts: p.pts.map(([x, y]) => [x, y + v.dy]) } : p); }
    return pen.o;
  }
  function linePrims(item) {
    const it = normLine(item); const [a, b] = it.pts; const w = clampTo('width', it.width); const pen = new Pen({}); const len = U.len(U.sub(b, a));
    if (w > 0) {
      if (it.dash !== 'none') for (const pc of dashes([a, b], false, it.dash, w)) pen.line(pc, { stroke: it.stroke, w });
      else pen.line([a, b], { stroke: it.stroke, w });
      const hs = headSize(w, len);
      if (it.end === 'arrow') pen.line(headPts(b, a, hs), { stroke: it.stroke, w });
      if (it.start === 'arrow') pen.line(headPts(a, b, hs), { stroke: it.stroke, w });
    }
    return pen.o;
  }
  const prims = (it) => (it.type === 'line' ? linePrims(it) : shapePrims(it));
  /** The box around the item in its own units (centred on the origin for shapes; a thin box along the line for lines). */
  function box(it) {
    if (it.type === 'line') return RENDER.primsBBox(linePrims(it));
    const t = normShape(it); const pad = clampTo('width', t.width) / 2 + 2;
    return { x0: -t.w / 2 - pad, y0: -t.h / 2 - pad, x1: t.w / 2 + pad, y1: t.h / 2 + pad, w: t.w + 2 * pad, h: t.h + 2 * pad };
  }
  /** Plain name: "Box", "Arrow", … (with the words inside a shape, if any). */
  function name(it) {
    if (it.type === 'line') { const t = normLine(it); return t.start === 'arrow' && t.end === 'arrow' ? 'Double arrow' : t.start === 'arrow' || t.end === 'arrow' ? 'Arrow' : 'Line'; }
    const t = normShape(it); const nm = (KINDS[t.shape] || KINDS.box).name; const words = String(t.text).replace(/\s+/g, ' ').trim();
    return words ? `${nm} “${words.length > 20 ? words.slice(0, 19) + '…' : words}”` : nm;
  }

  // ---- making and dragging ----
  const base = (x, y) => ({ x: round(x), y: round(y), s: 1, rot: 0, flip: false, mode: 'auto' });
  /** A new item centred on (x, y): kind is a shape ("box" "circle" "triangle") or a line ("line" "arrow" "double"). */
  function make(kind, x = 500, y = 375, opts = {}) {
    if (LINES[kind]) { const L = LINES[kind]; return { type: 'line', ...base(x, y), ...LINE_DEFAULTS, start: L.start, end: L.end, ...opts }; }
    const K = KINDS[kind] || KINDS.box; return { type: 'shape', ...base(x, y), ...SHAPE_DEFAULTS, shape: KINDS[kind] ? kind : 'box', w: K.w, h: K.h, ...opts };
  }
  /** Where a shape drawn by dragging from page point A to B goes. `square` (Shift) makes the sides equal. */
  function fromDrag(A, B, square) {
    let dx = B[0] - A[0], dy = B[1] - A[1];
    if (square) { const m = Math.max(Math.abs(dx), Math.abs(dy)); dx = (dx < 0 ? -1 : 1) * m; dy = (dy < 0 ? -1 : 1) * m; }
    return { x: round(A[0] + dx / 2), y: round(A[1] + dy / 2), w: Math.max(MIN, round(Math.abs(dx))), h: Math.max(MIN, round(Math.abs(dy))) };
  }
  /** B moved so the line A→B points along a multiple of `step` degrees (Shift while drawing or dragging an end). */
  function snapAngle(A, B, step = 15) {
    const d = U.sub(B, A); const l = U.len(d); if (l < 1e-6) return B; const a = U.rad(Math.round(U.angleOf(d) / step) * step);
    return [A[0] + l * Math.cos(a), A[1] + l * Math.sin(a)];
  }
  /** Point a line from page point A to page point B: origin at the midpoint, points along its own x axis, turned to match. */
  function setEnds(it, A, B) {
    const d = U.sub(B, A); const l = Math.max(MIN / 2, U.len(d)); const ang = U.len(d) < 1e-6 ? (it.rot || 0) : U.angleOf(d);
    it.x = round((A[0] + B[0]) / 2); it.y = round((A[1] + B[1]) / 2); it.rot = +U.normA(ang).toFixed(2); it.flip = false;
    const half = l / (2 * (it.s || 1)); it.pts = [[-half, 0], [half, 0]]; return it;
  }
  const ends = (it) => normLine(it).pts.map((p) => toPage(it, p)); // the two ends on the page
  /**
   * Drag a handle of a shape. `dirs` is which sides move: 'e' 'w' 's' 'n' or a corner like 'se'; the opposite sides stay put.
   * P is the pointer on the page; `keep` (Shift on a corner) keeps the shape's proportions. Returns { x, y, w, h }.
   */
  function resize(item, dirs, P, keep) {
    const it = normShape(item); const L = toLocal(it, P); let x0 = -it.w / 2, x1 = it.w / 2, y0 = -it.h / 2, y1 = it.h / 2;
    if (dirs.includes('e')) x1 = Math.max(L[0], x0 + MIN); if (dirs.includes('w')) x0 = Math.min(L[0], x1 - MIN);
    if (dirs.includes('s')) y1 = Math.max(L[1], y0 + MIN); if (dirs.includes('n')) y0 = Math.min(L[1], y1 - MIN);
    if (keep && dirs.length === 2) {
      const k = Math.max((x1 - x0) / it.w, (y1 - y0) / it.h); const w = it.w * k, h = it.h * k;
      if (dirs.includes('e')) x1 = x0 + w; else x0 = x1 - w; if (dirs.includes('s')) y1 = y0 + h; else y0 = y1 - h;
    }
    const c = toPage(it, [(x0 + x1) / 2, (y0 + y1) / 2]);
    return { x: round(c[0]), y: round(c[1]), w: Math.max(MIN, round(x1 - x0)), h: Math.max(MIN, round(y1 - y0)) };
  }

  return { KINDS, LINES, SHAPE_DEFAULTS, LINE_DEFAULTS, LIMITS, MIN, FILLS, DASHES, normShape, normLine, clampTo, toPage, toLocal, outline, dashes, headSize, headPts, textView, prims, shapePrims, linePrims, box, name, make, fromDrag, snapAngle, setEnds, ends, resize };
})();
