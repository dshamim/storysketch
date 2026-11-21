// Picture add-on: Stamp prints — rows of stamped stars, hearts, flowers, potato prints, handprints, leaves.
// Also shared as CP.helpers.stampPrints(pen, box, rng, {shape, count, mixed}) and CP.helpers.stampShape(...) for the stamp props.
(() => {
  const PAL = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#d81b60', '#00897b'];
  const SHAPES = ['star', 'heart', 'flower', 'potato', 'hand', 'leaf'];
  const ellPts = (cx, cy, rx, ry, rot = 0, n = 18) => { const k = U.rad(rot), c = Math.cos(k), s = Math.sin(k), out = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * c - y * s, cy + x * s + y * c]); } return out; };

  // the parts of one print around (0,0), size s: [{pts, smooth, hole?}] — hole = a gap in the ink (paper colour)
  function parts(kind, s) {
    const H = CP.helpers;
    if (kind === 'star') return [{ pts: H.starPts(0, 0, s, s * 0.45), smooth: false }];
    if (kind === 'heart') return [{ pts: H.heartPts(0, 0, s * 0.95), smooth: true }];
    if (kind === 'flower') return [{ pts: H.bumpy(0, 0, s * 0.68, s * 0.68, 5, 0.45, 60), smooth: true }, { pts: ellPts(0, 0, s * 0.22, s * 0.22), smooth: true, hole: true }];
    if (kind === 'potato') return [{ pts: H.bumpy(0, 0, s * 0.85, s * 0.72, 3, 0.07, 40), smooth: true }, { pts: [[-s * 0.45, -s * 0.05], [s * 0.45, s * 0.05]], open: true, hole: true }, { pts: [[-s * 0.05, -s * 0.4], [s * 0.05, s * 0.4]], open: true, hole: true }];
    if (kind === 'hand') {
      const out = [{ pts: ellPts(0, s * 0.28, s * 0.46, s * 0.5), smooth: true }];
      [-0.33, -0.11, 0.11, 0.32].forEach((x, i) => out.push({ pts: ellPts(x * s * 1.05, -s * (0.38 + (i === 1 || i === 2 ? 0.1 : 0)), s * 0.11, s * 0.3, (x) * 25), smooth: true }));
      out.push({ pts: ellPts(s * 0.56, s * 0.12, s * 0.11, s * 0.28, -50), smooth: true });
      return out;
    }
    // leaf with veins
    const L = [[0, s], [s * 0.55, s * 0.25], [s * 0.35, -s * 0.55], [0, -s], [-s * 0.35, -s * 0.55], [-s * 0.55, s * 0.25]];
    const out = [{ pts: L, smooth: true }, { pts: [[0, s * 0.9], [0, -s * 0.8]], open: true, hole: true }];
    for (const y of [-0.4, 0, 0.4]) for (const d of [-1, 1]) out.push({ pts: [[0, y * s + s * 0.15], [d * s * 0.35, y * s - s * 0.1]], open: true, hole: true });
    return out;
  }
  // one print at (cx, cy), size s, turned by rot degrees
  function stampShape(pen, kind, cx, cy, s, c, rot = 0, r = Math.random) {
    const k = U.rad(rot), co = Math.cos(k), si = Math.sin(k);
    const T = ([x, y]) => [cx + x * co - y * si, cy + x * si + y * co];
    for (const pt of parts(kind, s)) {
      const pts = pt.pts.map(T);
      if (pt.hole) { if (pt.open) pen.line(pts, { stroke: 'paper', w: Math.max(1.5, s * 0.1) }); else pen.poly(pts, { stroke: false, fill: 'paper', smooth: pt.smooth }); continue; }
      pen.poly(pts, { stroke: c, w: Math.max(1.2, s * 0.08), fill: c, smooth: pt.smooth, op: 0.75 + r() * 0.2 });
    }
  }
  // rows of prints filling a box
  function stampPrints(pen, b, r, P = {}) {
    const n = Math.max(1, Math.min(30, +P.count || 9)), shape = P.shape || 'star';
    const cols = Math.max(1, Math.round(Math.sqrt(n * b.w / b.h))), rows = Math.ceil(n / cols);
    const cw = b.w / cols, ch = b.h / rows, s = Math.min(cw, ch) * 0.36;
    const one = PAL[Math.floor(r() * PAL.length)];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols), col = i % cols, inRow = Math.min(cols, n - row * cols);
      const cx = b.x + (b.w - inRow * cw) / 2 + (col + 0.5) * cw + (r() - 0.5) * cw * 0.2, cy = b.y + (row + 0.5) * ch + (r() - 0.5) * ch * 0.2;
      const kind = shape === 'mixed' ? SHAPES[Math.floor(r() * SHAPES.length)] : shape;
      stampShape(pen, kind, cx, cy, s * (0.85 + r() * 0.25), P.mixed === false ? one : PAL[(i * 3 + Math.floor(r() * 2)) % PAL.length], kind === 'hand' ? (r() - 0.5) * 30 : (r() - 0.5) * 50, r);
    }
  }
  CP.helpers.stampPrints = stampPrints; CP.helpers.stampShape = stampShape;

  const SHAPE_OPTS = { star: 'Stars', heart: 'Hearts', flower: 'Flowers', potato: 'Potato prints', hand: 'Handprints', leaf: 'Leaf prints', mixed: 'A mix' };
  CP.register({
    api: 1, version: '1.0.0',
    type: 'addon', kind: 'picture', id: 'picstamps', name: 'Stamp prints', order: 8,
    params: [
      { key: 'shape', label: 'Stamp', type: 'select', def: 'star', options: SHAPE_OPTS },
      { key: 'count', label: 'How many prints', type: 'range', min: 1, max: 24, step: 1, def: 9 },
      { key: 'mixed', label: 'Lots of colours', type: 'toggle', def: true },
    ],
    draw(pen, b, a) { stampPrints(pen, b, a.rng, a.params || {}); },
  });
})();
