// Drawing model + the renderers (clean editing view built in; crayon, marker, ink, chalk… are style plugins).
//
// Everything (figures and props) is described as a list of clean "primitives":
//   { pts:[[x,y]...], closed, smooth, stroke:colour|null, w, fill:null|'paper'|colour, hatch:{color,angle,gap}|null, hole?, op? }
// The CLEAN renderer draws them as sharp vectors (editing).
// A STYLE (plugins/styles/*.js) turns the same primitives into a hand-drawn look (preview + export).
// Paper fills stay crisp in every style so layering still hides what is behind.

// ---------- builder ----------
class Pen {
  constructor(colors = {}) { this.o = []; this.c = colors; }
  col(k) { if (k == null || k === false) return null; if (k === 'paper') return 'paper'; return this.c[k] || k; }
  path(pts, o = {}) {
    const p = { pts, closed: !!o.closed, smooth: !!o.smooth, stroke: o.stroke === false ? null : this.col(o.stroke ?? 'line'), w: o.w ?? 4.5, fill: o.fill ? this.col(o.fill) : null };
    if (o.hatch) p.hatch = { color: this.col(o.hatch), angle: o.ha ?? -40, gap: o.hg ?? 6, alpha: o.halpha };
    if (o.hole) p.hole = o.hole;
    if (o.op != null) p.op = o.op;
    this.o.push(p); return this;
  }
  line(pts, o = {}) { return this.path(pts, { ...o, closed: false }); }
  curve(pts, o = {}) { return this.path(pts, { ...o, smooth: true }); }
  poly(pts, o = {}) { return this.path(pts, { ...o, closed: true }); }
  rect(x, y, w, h, o = {}) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], o); }
  ell(cx, cy, rx, ry, o = {}, n = 28) {
    const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return this.path(pts, { ...o, closed: true, smooth: true });
  }
  circ(cx, cy, r, o = {}) { return this.ell(cx, cy, r, r, o, r < 6 ? 12 : 28); }
  arc(cx, cy, rx, ry, a0, a1, o = {}, n = 16) {
    const pts = []; for (let i = 0; i <= n; i++) { const a = U.rad(U.lerp(a0, a1, i / n)); pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return this.path(pts, { ...o, closed: false, smooth: true });
  }
  text(str, x, y, h, o = {}) { GLYPH.draw(this, str, x, y, h, o); return this; }
  textWidth(str, h) { return GLYPH.width(str, h); }
}

// ---------- hand-drawn single-stroke digits, maths symbols, letters + punctuation ----------
const GLYPH = (() => {
  // unit box 0..1, y down; each glyph = list of [smooth?, pts]
  const G = {
    '0': [[1, [[0.5, 0.02], [0.82, 0.25], [0.82, 0.75], [0.5, 0.98], [0.18, 0.75], [0.18, 0.25], [0.5, 0.02], [0.6, 0.06]]]],
    '1': [[0, [[0.28, 0.24], [0.56, 0.03], [0.56, 0.98]]]],
    '2': [[1, [[0.16, 0.24], [0.42, 0.03], [0.76, 0.12], [0.78, 0.38], [0.5, 0.65], [0.15, 0.98]]], [0, [[0.15, 0.98], [0.86, 0.98]]]],
    '3': [[1, [[0.16, 0.12], [0.5, 0.02], [0.8, 0.18], [0.72, 0.42], [0.42, 0.5]]], [1, [[0.42, 0.5], [0.8, 0.6], [0.84, 0.84], [0.5, 0.99], [0.13, 0.88]]]],
    '4': [[0, [[0.66, 0.98], [0.66, 0.02], [0.1, 0.68], [0.9, 0.68]]]],
    '5': [[0, [[0.8, 0.03], [0.26, 0.03], [0.22, 0.45]]], [1, [[0.22, 0.45], [0.55, 0.38], [0.83, 0.6], [0.76, 0.9], [0.45, 0.99], [0.14, 0.88]]]],
    '6': [[1, [[0.76, 0.08], [0.45, 0.04], [0.2, 0.38], [0.18, 0.76], [0.45, 0.99], [0.78, 0.84], [0.76, 0.58], [0.46, 0.5], [0.2, 0.66]]]],
    '7': [[0, [[0.12, 0.03], [0.88, 0.03], [0.4, 0.98]]]],
    '8': [[1, [[0.5, 0.48], [0.78, 0.26], [0.5, 0.02], [0.22, 0.26], [0.5, 0.48], [0.84, 0.74], [0.5, 0.99], [0.16, 0.74], [0.5, 0.48]]]],
    '9': [[1, [[0.8, 0.32], [0.55, 0.5], [0.22, 0.36], [0.28, 0.07], [0.6, 0.03], [0.8, 0.3], [0.76, 0.7], [0.5, 0.98], [0.24, 0.94]]]],
    'x': [[0, [[0.22, 0.38], [0.78, 0.94]]], [0, [[0.78, 0.38], [0.22, 0.94]]]],
    '×': null, '+': [[0, [[0.5, 0.32], [0.5, 0.92]]], [0, [[0.2, 0.62], [0.8, 0.62]]]],
    '=': [[0, [[0.2, 0.5], [0.8, 0.5]]], [0, [[0.2, 0.76], [0.8, 0.76]]]],
    '-': [[0, [[0.22, 0.62], [0.78, 0.62]]]],
    '?': [[1, [[0.2, 0.26], [0.45, 0.03], [0.8, 0.2], [0.62, 0.48], [0.5, 0.72]]], [0, [[0.5, 0.92], [0.5, 0.97]]]],    'A': [[0, [[0.12, 0.98], [0.5, 0.02], [0.88, 0.98]]], [0, [[0.27, 0.62], [0.73, 0.62]]]],
    'B': [[0, [[0.2, 0.02], [0.2, 0.98]]], [1, [[0.2, 0.02], [0.62, 0.06], [0.72, 0.26], [0.58, 0.46], [0.2, 0.48]]], [1, [[0.2, 0.48], [0.7, 0.54], [0.82, 0.76], [0.66, 0.96], [0.2, 0.98]]]],
    'C': [[1, [[0.82, 0.18], [0.55, 0.02], [0.22, 0.18], [0.15, 0.5], [0.22, 0.82], [0.55, 0.98], [0.82, 0.82]]]],
  };
  G['×'] = G.x; G['*'] = G.x;
  // letters + punctuation, hand-printed like a teacher on a whiteboard. Units of the text height h, both ways:
  // [width, strokes]; capitals 0 (top) .. 1 (baseline), small letters from 0.46, tails down to 1.3.
  const L = {
    D: [0.58, [[0, [[0, 0], [0, 1]]], [1, [[0, 0], [0.35, 0.04], [0.58, 0.3], [0.58, 0.7], [0.35, 0.96], [0, 1]]]]],
    E: [0.48, [[0, [[0.48, 0], [0, 0], [0, 1], [0.48, 1]]], [0, [[0, 0.5], [0.4, 0.5]]]]],
    F: [0.46, [[0, [[0.46, 0], [0, 0], [0, 1]]], [0, [[0, 0.5], [0.38, 0.5]]]]],
    G: [0.62, [[1, [[0.6, 0.16], [0.35, 0], [0.07, 0.2], [0, 0.5], [0.08, 0.82], [0.35, 1], [0.6, 0.86], [0.62, 0.58]]], [0, [[0.62, 0.58], [0.36, 0.58]]]]],
    H: [0.56, [[0, [[0, 0], [0, 1]]], [0, [[0.56, 0], [0.56, 1]]], [0, [[0, 0.5], [0.56, 0.5]]]]],
    I: [0.3, [[0, [[0.15, 0], [0.15, 1]]], [0, [[0, 0], [0.3, 0]]], [0, [[0, 1], [0.3, 1]]]]],
    J: [0.45, [[1, [[0.45, 0], [0.45, 0.62], [0.38, 0.9], [0.2, 1], [0, 0.86]]]]],
    K: [0.54, [[0, [[0, 0], [0, 1]]], [0, [[0.54, 0], [0, 0.56]]], [0, [[0.17, 0.42], [0.56, 1]]]]],
    L: [0.44, [[0, [[0, 0], [0, 1], [0.44, 1]]]]],
    M: [0.74, [[0, [[0, 1], [0, 0], [0.37, 0.6], [0.74, 0], [0.74, 1]]]]],
    N: [0.6, [[0, [[0, 1], [0, 0], [0.6, 1], [0.6, 0]]]]],
    O: [0.7, [[1, [[0.35, 0], [0.64, 0.18], [0.7, 0.5], [0.62, 0.84], [0.35, 1], [0.08, 0.84], [0, 0.5], [0.06, 0.18], [0.35, 0], [0.46, 0.04]]]]],
    P: [0.52, [[0, [[0, 1], [0, 0]]], [1, [[0, 0], [0.34, 0.02], [0.52, 0.25], [0.38, 0.48], [0, 0.52]]]]],
    Q: [0.72, [[1, [[0.35, 0], [0.64, 0.18], [0.7, 0.5], [0.62, 0.84], [0.35, 1], [0.08, 0.84], [0, 0.5], [0.06, 0.18], [0.35, 0], [0.46, 0.04]]], [0, [[0.42, 0.72], [0.72, 1.05]]]]],
    R: [0.55, [[0, [[0, 1], [0, 0]]], [1, [[0, 0], [0.34, 0.02], [0.52, 0.25], [0.38, 0.48], [0, 0.52]]], [0, [[0.2, 0.52], [0.55, 1]]]]],
    S: [0.52, [[1, [[0.5, 0.14], [0.3, 0], [0.05, 0.08], [0.04, 0.3], [0.26, 0.48], [0.48, 0.62], [0.5, 0.86], [0.25, 1], [0, 0.88]]]]],
    T: [0.58, [[0, [[0, 0], [0.58, 0]]], [0, [[0.29, 0], [0.29, 1]]]]],
    U: [0.58, [[1, [[0, 0], [0, 0.66], [0.1, 0.92], [0.29, 1], [0.48, 0.92], [0.58, 0.66], [0.58, 0]]]]],
    V: [0.6, [[0, [[0, 0], [0.3, 1], [0.6, 0]]]]],
    W: [0.84, [[0, [[0, 0], [0.2, 1], [0.42, 0.35], [0.64, 1], [0.84, 0]]]]],
    X: [0.58, [[0, [[0, 0], [0.58, 1]]], [0, [[0.58, 0], [0, 1]]]]],
    Y: [0.6, [[0, [[0, 0], [0.3, 0.5], [0.6, 0]]], [0, [[0.3, 0.5], [0.3, 1]]]]],
    Z: [0.54, [[0, [[0, 0], [0.54, 0], [0, 1], [0.54, 1]]]]],
    a: [0.45, [[1, [[0.45, 0.56], [0.25, 0.46], [0.03, 0.6], [0.03, 0.88], [0.22, 1], [0.45, 0.85]]], [0, [[0.45, 0.47], [0.45, 1]]]]],
    b: [0.45, [[0, [[0, 0], [0, 1]]], [1, [[0, 0.62], [0.2, 0.46], [0.42, 0.56], [0.45, 0.8], [0.25, 1], [0, 0.92]]]]],
    c: [0.42, [[1, [[0.42, 0.55], [0.22, 0.46], [0.02, 0.6], [0.02, 0.86], [0.22, 1], [0.42, 0.92]]]]],
    d: [0.45, [[1, [[0.45, 0.6], [0.25, 0.46], [0.03, 0.6], [0.03, 0.86], [0.22, 1], [0.45, 0.86]]], [0, [[0.45, 0], [0.45, 1]]]]],
    e: [0.45, [[1, [[0.04, 0.72], [0.43, 0.72], [0.38, 0.51], [0.2, 0.46], [0.02, 0.62], [0.04, 0.88], [0.22, 1], [0.42, 0.92]]]]],
    f: [0.32, [[1, [[0.32, 0.05], [0.2, 0], [0.1, 0.12], [0.1, 0.45], [0.1, 1]]], [0, [[0, 0.46], [0.3, 0.46]]]]],
    g: [0.45, [[1, [[0.45, 0.56], [0.25, 0.46], [0.03, 0.58], [0.04, 0.82], [0.24, 0.92], [0.45, 0.8]]], [1, [[0.45, 0.47], [0.45, 1.1], [0.35, 1.27], [0.15, 1.3], [0.02, 1.2]]]]],
    h: [0.45, [[0, [[0, 0], [0, 1]]], [1, [[0, 0.62], [0.2, 0.46], [0.4, 0.5], [0.45, 0.7], [0.45, 1]]]]],
    i: [0.1, [[0, [[0.05, 0.47], [0.05, 1]]], [0, [[0.05, 0.25], [0.05, 0.3]]]]],
    j: [0.25, [[1, [[0.22, 0.47], [0.22, 1.1], [0.14, 1.27], [0, 1.25]]], [0, [[0.22, 0.25], [0.22, 0.3]]]]],
    k: [0.42, [[0, [[0, 0], [0, 1]]], [0, [[0.4, 0.46], [0, 0.76]]], [0, [[0.14, 0.66], [0.42, 1]]]]],
    l: [0.1, [[0, [[0.05, 0], [0.05, 1]]]]],
    m: [0.7, [[0, [[0, 0.46], [0, 1]]], [1, [[0, 0.6], [0.15, 0.46], [0.32, 0.52], [0.35, 0.7], [0.35, 1]]], [1, [[0.35, 0.62], [0.5, 0.46], [0.67, 0.52], [0.7, 0.7], [0.7, 1]]]]],
    n: [0.45, [[0, [[0, 0.46], [0, 1]]], [1, [[0, 0.62], [0.2, 0.46], [0.4, 0.5], [0.45, 0.7], [0.45, 1]]]]],
    o: [0.48, [[1, [[0.24, 0.45], [0.44, 0.55], [0.48, 0.75], [0.42, 0.94], [0.24, 1], [0.06, 0.94], [0, 0.75], [0.04, 0.55], [0.24, 0.45], [0.32, 0.47]]]]],
    p: [0.45, [[0, [[0, 0.46], [0, 1.3]]], [1, [[0, 0.6], [0.2, 0.46], [0.42, 0.56], [0.45, 0.78], [0.25, 0.98], [0, 0.9]]]]],
    q: [0.5, [[1, [[0.45, 0.6], [0.25, 0.46], [0.03, 0.58], [0.03, 0.85], [0.22, 1], [0.45, 0.88]]], [0, [[0.45, 0.46], [0.45, 1.3], [0.52, 1.22]]]]],
    r: [0.35, [[0, [[0, 0.46], [0, 1]]], [1, [[0, 0.66], [0.12, 0.5], [0.25, 0.45], [0.35, 0.5]]]]],
    s: [0.38, [[1, [[0.36, 0.52], [0.2, 0.45], [0.03, 0.52], [0.05, 0.67], [0.2, 0.72], [0.35, 0.8], [0.35, 0.94], [0.18, 1], [0, 0.94]]]]],
    t: [0.32, [[0, [[0.12, 0.15], [0.12, 0.9], [0.2, 1], [0.32, 0.96]]], [0, [[0, 0.46], [0.3, 0.46]]]]],
    u: [0.45, [[1, [[0, 0.46], [0, 0.82], [0.15, 1], [0.35, 0.96], [0.45, 0.8]]], [0, [[0.45, 0.46], [0.45, 1]]]]],
    v: [0.45, [[0, [[0, 0.46], [0.225, 1], [0.45, 0.46]]]]],
    w: [0.65, [[0, [[0, 0.46], [0.16, 1], [0.325, 0.6], [0.49, 1], [0.65, 0.46]]]]],
    y: [0.45, [[0, [[0, 0.46], [0.22, 0.95]]], [0, [[0.45, 0.46], [0.15, 1.3]]]]],
    z: [0.4, [[0, [[0, 0.46], [0.4, 0.46], [0, 1], [0.4, 1]]]]],
    '.': [0.1, [[0, [[0.05, 0.94], [0.05, 1]]]]],
    ',': [0.12, [[0, [[0.08, 0.92], [0.03, 1.13]]]]],
    '!': [0.1, [[0, [[0.05, 0], [0.05, 0.7]]], [0, [[0.05, 0.94], [0.05, 1]]]]],
    "'": [0.08, [[0, [[0.04, 0], [0.04, 0.2]]]]],
    ':': [0.1, [[0, [[0.05, 0.5], [0.05, 0.56]]], [0, [[0.05, 0.94], [0.05, 1]]]]],
    '/': [0.4, [[0, [[0.4, 0], [0, 1]]]]],
    '(': [0.2, [[1, [[0.2, 0], [0.03, 0.3], [0.03, 0.75], [0.2, 1.08]]]]],
    ')': [0.2, [[1, [[0, 0], [0.17, 0.3], [0.17, 0.75], [0, 1.08]]]]],
    '"': [0.2, [[0, [[0.04, 0], [0.04, 0.2]]], [0, [[0.16, 0], [0.16, 0.2]]]]],
  };
  Object.assign(L, {
    ';': [0.12, [[0, [[0.05, 0.5], [0.05, 0.56]]], [0, [[0.09, 0.92], [0.03, 1.13]]]]],
    '_': [0.5, [[0, [[0, 1.1], [0.5, 1.1]]]]],
    '<': [0.45, [[0, [[0.45, 0.3], [0, 0.62], [0.45, 0.94]]]]],
    '>': [0.45, [[0, [[0, 0.3], [0.45, 0.62], [0, 0.94]]]]],
    '[': [0.2, [[0, [[0.2, 0], [0.02, 0], [0.02, 1.08], [0.2, 1.08]]]]],
    ']': [0.2, [[0, [[0, 0], [0.18, 0], [0.18, 1.08], [0, 1.08]]]]],
    '|': [0.08, [[0, [[0.04, 0], [0.04, 1.2]]]]],
    '\\': [0.4, [[0, [[0, 0], [0.4, 1]]]]],
    '~': [0.55, [[1, [[0, 0.62], [0.14, 0.5], [0.3, 0.6], [0.43, 0.5], [0.55, 0.58]]]]],
    '#': [0.6, [[0, [[0.22, 0.05], [0.14, 0.95]]], [0, [[0.5, 0.05], [0.42, 0.95]]], [0, [[0.05, 0.35], [0.6, 0.35]]], [0, [[0.02, 0.68], [0.57, 0.68]]]]],
    '%': [0.7, [[0, [[0.62, 0.02], [0.06, 0.98]]], [1, [[0.1, 0.02], [0.2, 0], [0.28, 0.1], [0.2, 0.22], [0.1, 0.18], [0.1, 0.02]]], [1, [[0.5, 0.78], [0.6, 0.74], [0.68, 0.84], [0.6, 0.98], [0.5, 0.94], [0.5, 0.78]]]]],
    '&': [0.62, [[1, [[0.62, 1], [0.24, 0.54], [0.1, 0.3], [0.26, 0.02], [0.48, 0.16], [0.4, 0.42], [0.1, 0.74], [0.14, 0.94], [0.4, 1], [0.6, 0.74]]]]],
    '$': [0.5, [[1, [[0.46, 0.2], [0.3, 0.06], [0.07, 0.16], [0.1, 0.34], [0.28, 0.46], [0.46, 0.62], [0.44, 0.86], [0.22, 0.96], [0.02, 0.84]]], [0, [[0.25, -0.05], [0.25, 1.05]]]]],
  });
  L['’'] = L["'"]; L['‘'] = L["'"]; L['“'] = L['"']; L['”'] = L['"'];
  const supported = (ch) => ch === ' ' || !!G[ch] || !!L[ch];
  const adv = 0.72, GAP = 0.16;
  // a string that only uses the old digits / maths / A B C keeps the old wide spacing, so older pages look the same
  const wordy = (chars) => chars.some((ch) => L[ch] && ch !== ' ');
  const LX = [0.42, [[0, [[0, 0.46], [0.42, 1]]], [0, [[0.42, 0.46], [0, 1]]]]]; // small letter x inside words (on its own, x is the times sign)
  const letter = (ch, wd) => L[ch] || (wd && ch === 'x' ? LX : null);
  const advOf = (ch, h, wd, sp = 0) => { const g = letter(ch, wd); return ((ch === ' ' ? (wd ? 0.42 : adv) : g ? g[0] + GAP : adv) + sp) * h; };
  const width = (str, h, sp = 0) => { const chars = [...String(str)].filter(supported); const wd = wordy(chars); return chars.reduce((a, ch) => a + advOf(ch, h, wd, sp), 0); };
  // how far each UTF-16 code unit of str moves the pen (0 for characters that can't be drawn), so a caret can be placed between any two letters
  const wordyOf = (str) => wordy([...String(str)].filter(supported));
  const advances = (str, h, sp = 0, wdIn) => { const s = String(str); const wd = wdIn ?? wordy([...s].filter(supported)); return s.split('').map((ch) => (supported(ch) ? advOf(ch, h, wd, sp) : 0)); };
  function draw(pen, str, x, y, h, o = {}) {
    const chars = [...String(str)].filter(supported); const wd = o.wordy ?? wordy(chars);
    const sp = o.spacing || 0; const total = chars.reduce((a, ch) => a + advOf(ch, h, wd, sp), 0);
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
    const wx = h * 0.6; let k = 0;
    for (const ch of chars) {
      const a = advOf(ch, h, wd, sp);
      const stroke = o.strokes ? o.strokes[k % o.strokes.length] : (o.stroke ?? 'ink');
      const style = { stroke, w: o.w ?? Math.max(3, h * 0.09) };
      const lg = letter(ch, wd);
      if (lg) for (const [smooth, pts] of lg[1]) pen.path(pts.map(([u, v]) => [cx + (GAP / 2) * h + u * h, y + v * h]), { ...style, smooth: !!smooth });
      else if (G[ch]) for (const [smooth, pts] of G[ch]) pen.path(pts.map(([u, v]) => [cx + (adv * h - wx) / 2 + u * wx, y + v * h]), { ...style, smooth: !!smooth });
      if (ch !== ' ') k++;
      cx += a;
    }
  }
  return { draw, width, advances, wordyOf, supported };
})();

// ---------- renderers ----------
const RENDER = (() => {
  const f = (n) => Math.round(n * 10) / 10;
  const dPoly = (pts, closed) => pts.length ? 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + (closed ? 'Z' : '') : '';
  const dSmooth = (pts, closed) => {
    const n = pts.length; if (n < 3) return dPoly(pts, closed);
    const P = (i) => closed ? pts[((i % n) + n) % n] : pts[U.clamp(i, 0, n - 1)];
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`; const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  };
  const dOf = (p) => p.smooth ? dSmooth(p.pts, p.closed) : dPoly(p.pts, p.closed);
  const dFill = (p) => dOf(p) + (p.hole ? dSmooth(p.hole, true) : '');
  const paperOf = (ctx) => ctx.paper || '#ffffff';

  // ---- clean (editing) ----
  function clean(prims, ctx) {
    let s = '';
    for (const p of prims) {
      const op = p.op != null ? ` opacity="${p.op}"` : '';
      const fr = p.hole ? ' fill-rule="evenodd"' : '';
      if (p.fill) s += `<path d="${dFill(p)}" fill="${p.fill === 'paper' ? paperOf(ctx) : colour(p.fill, ctx)}"${fr}${op}/>`;
      if (p.hatch) s += `<path d="${dFill(p)}" fill="${colour(p.hatch.color, ctx)}" fill-opacity="${(p.hatch.alpha ?? 0.6) * 0.45}"${fr}/>`;
      if (p.stroke && p.w > 0) s += `<path d="${dOf(p)}" fill="none" stroke="${colour(p.stroke, ctx)}" stroke-width="${f(p.w)}" stroke-linecap="round" stroke-linejoin="round"${op}/>`;
    }
    return s;
  }

  // ---- styles (preview / export) ----
  // A style turns the clean primitives into a finished look. Styles are plugins (plugins/styles/*.js) that call
  // RENDER.registerStyle({ id, name, defs, render(prims, ctx, h), defaultPaper? }). "clean" is built in (editing view).
  const STYLES = {};
  function registerStyle(def) { STYLES[def.id] = def; }
  const styleList = () => Object.values(STYLES).sort((a, b) => (a.order ?? 50) - (b.order ?? 50) || String(a.name).localeCompare(b.name)); // `order`: lower first (Crayon, the default, leads)
  const arcLens = (pts) => { const a = [0]; for (let i = 1; i < pts.length; i++) a.push(a[i - 1] + U.len(U.sub(pts[i], pts[i - 1]))); return a; };
  // a dark page (chalkboard): dark line colours would vanish, so they are drawn in chalk-white instead
  const darkPaper = (ctx) => U.lum(paperOf(ctx)) < 0.35;
  const colour = (c, ctx) => { const t = U.tone(c, ctx.mode); return darkPaper(ctx) && /^#[0-9a-f]{3,6}$/i.test(t) && U.lum(t) < 0.38 ? '#f3f0e6' : t; };
  // Shared building blocks for style plugins.
  // runs(): walks the primitives in order. Paper fills are drawn crisp (they hide what is behind); everything else goes
  // through fn(p, seed, i) -> svg and is grouped, per stretch between paper fills, under one SVG filter (grain, edge, dust…).
  function runs(prims, ctx, filterId, fn) {
    let s = '', run = '', box = null;
    const grow = (pts, pad) => { const b = U.bbox(pts); if (!box) box = { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad }; else { box.x0 = Math.min(box.x0, b.x0 - pad); box.y0 = Math.min(box.y0, b.y0 - pad); box.x1 = Math.max(box.x1, b.x1 + pad); box.y1 = Math.max(box.y1, b.y1 + pad); } };
    const flush = () => {
      if (!run) return;
      // invisible rect guarantees a non-degenerate filter region (e.g. a lone horizontal line)
      s += filterId ? `<g filter="url(#${filterId})"><rect x="${f(box.x0)}" y="${f(box.y0)}" width="${f(box.x1 - box.x0)}" height="${f(box.y1 - box.y0)}" fill="none"/>${run}</g>` : `<g>${run}</g>`;
      run = ''; box = null;
    };
    prims.forEach((p, i) => {
      const seed = U.hash(ctx.seed + ':' + i);
      if (p.fill === 'paper') { flush(); s += `<path d="${dFill(p)}" fill="${paperOf(ctx)}"${p.hole ? ' fill-rule="evenodd"' : ''}/>`; }
      const out = fn(p, seed, i); if (out) { run += out; grow(p.pts, (p.w || 0) * 2 + 12); }
    });
    flush();
    return s;
  }
  // Back-and-forth hatching clipped to a shape: { color, angle (deg), gap, width, alpha, jitter, vary (row spacing 0..1) }
  function hatchLines(p, seed, ctx, o) {
    const id = `${ctx.idp}h${ctx.n++}`;
    const bb = U.bbox(p.pts); const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2; const R = Math.hypot(bb.w, bb.h) / 2 + 4;
    const ang = U.rad(o.angle ?? -40), ca = Math.cos(ang), sa = Math.sin(ang);
    const gap = o.gap ?? 6, r = U.rng(seed), vary = o.vary ?? 0.5, jit = o.jitter ?? 1.5;
    const pts = []; let flip = false;
    for (let y = -R; y <= R; y += gap * (1 - vary / 2 + r() * vary)) {
      pts.push(...(flip ? [[R, y], [-R, y + gap * 0.3]] : [[-R, y], [R, y + gap * 0.3]])); flip = !flip;
    }
    const q = pts.map(([x, y]) => [cx + x * ca - y * sa + (r() - 0.5) * jit, cy + x * sa + y * ca + (r() - 0.5) * jit]);
    return `<clipPath id="${id}"><path d="${dFill(p)}"${p.hole ? ' clip-rule="evenodd"' : ''}/></clipPath>` +
      `<path clip-path="url(#${id})" d="${dPoly(q, false)}" fill="none" stroke="${o.color}" stroke-width="${f(o.width ?? Math.max(1.8, gap * 0.42))}" stroke-opacity="${o.alpha ?? 0.6}" stroke-linejoin="round"/>`;
  }
  // a stroke's centre-line, densified and nudged sideways by smooth noise (the pen/brush hand-drift)
  function wobblePath(p, seed, amp, wavelength, step = 3) {
    let pts = p.smooth ? U.spline(p.pts, p.closed, step) : U.densify(p.pts, p.closed, step);
    if (pts.length < 2) return null;
    const al = arcLens(pts); const r = U.rng(seed); const n1 = U.noise1(seed + 101); const ph = r() * 40; const wl = wavelength * (0.8 + r() * 0.4);
    const q = pts.map((pt, k) => {
      const prev = pts[Math.max(0, k - 1)], next = pts[Math.min(pts.length - 1, k + 1)];
      const t = U.sub(next, prev); const l = U.len(t) || 1; const off = n1(al[k] / wl + ph) * amp;
      return [pt[0] - t[1] / l * off, pt[1] + t[0] / l * off];
    });
    return { q, al, L: al[al.length - 1], r };
  }
  // helpers handed to style plugins
  const helpers = { f, dPoly, dSmooth, dOf, dFill, paperOf, arcLens, colour, darkPaper, runs, hatchLines, wobblePath };

  function render(prims, ctx) {
    const st = ctx.style && STYLES[ctx.style];
    return st ? st.render(prims, ctx, helpers) : clean(prims, ctx);
  }
  const defs = () => styleList().map((st) => (typeof st.defs === 'function' ? st.defs() : st.defs || '')).join('');

  function primsBBox(prims) {
    const all = []; let pad = 0;
    for (const p of prims) { all.push(...p.pts); pad = Math.max(pad, (p.w || 0) / 2 + 2); }
    if (!all.length) return { x0: 0, y0: 0, x1: 1, y1: 1, w: 1, h: 1 };
    const b = U.bbox(all); return { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad, w: b.w + 2 * pad, h: b.h + 2 * pad };
  }

  // stand-alone small SVG (thumbnails, previews). `style` = a registered style id; `crayon: true` is the old spelling.
  function thumb(prims, { style = null, crayon: cr = false, mode = 'colour', pad = 8, paper = '#ffffff', seed = 'thumb', bg = null, box = null } = {}) {
    const b = box || primsBBox(prims);
    const vb = `${f(b.x0 - pad)} ${f(b.y0 - pad)} ${f(b.w + pad * 2)} ${f(b.h + pad * 2)}`;
    const sid = style || (cr ? 'crayon' : null);
    const ctx = { mode, paper, seed, idp: 't' + U.uid(), n: 0, style: sid };
    const body = render(prims, ctx);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${sid ? `<defs>${defs()}</defs>` : ''}${bg ? `<rect x="${f(b.x0 - pad)}" y="${f(b.y0 - pad)}" width="${f(b.w + pad * 2)}" height="${f(b.h + pad * 2)}" fill="${bg}"/>` : ''}${body}</svg>`;
  }

  return { clean, render, registerStyle, styleList, styles: STYLES, defs, helpers, primsBBox, thumb, dOf };
})();
