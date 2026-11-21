// Small math / colour / random helpers shared by everything.
const U = (() => {
  const hash = (s) => {
    let h = 2166136261 >>> 0; s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  };
  const rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0; let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // smooth 1-D value noise in [-1, 1]
  const noise1 = (seed) => {
    const r = rng(seed); const v = Array.from({ length: 256 }, () => r() * 2 - 1);
    return (x) => { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f); const a = v[i & 255], b = v[(i + 1) & 255]; return a + (b - a) * t; };
  };
  const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI;
  const dir = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const normA = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const angleOf = (v) => deg(Math.atan2(v[1], v[0]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // polyline helpers
  const densify = (pts, closed, step) => {
    const out = []; const n = pts.length; const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = pts[i], b = pts[(i + 1) % n]; const k = Math.max(1, Math.ceil(len(sub(b, a)) / step));
      for (let j = 0; j < k; j++) out.push(lerp2(a, b, j / k));
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  };
  const spline = (pts, closed, step) => {
    const n = pts.length; if (n < 3) return densify(pts, closed, step);
    const P = (i) => closed ? pts[((i % n) + n) % n] : pts[clamp(i, 0, n - 1)];
    const out = []; const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const k = Math.max(2, Math.ceil(len(sub(p2, p1)) / step));
      for (let j = 0; j < k; j++) {
        const t = j / k, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((d) => 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  };
  const bbox = (pts) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  };
  const hull = (points) => { // monotone chain convex hull
    const p = points.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop(); return lo.concat(up);
  };

  // colours
  const hex2rgb = (h) => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex([0, 1, 2].map((i) => lerp(x[i], y[i], t))); };
  const lum = (c) => { const [r, g, b] = hex2rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  // colour modes: colour (as drawn) | faded | grey (graphite pencil)
  const tone = (c, mode) => {
    if (!c || c === 'paper' || c[0] !== '#' || !mode || mode === 'colour' || mode === 'auto') return c;
    const l = lum(c); const v = Math.round(72 + l * 95); const grey = rgb2hex([v, v, v + 3]);
    if (mode === 'grey') return grey;
    if (mode === 'faded') return mix(mix(c, grey, 0.55), '#ffffff', 0.2);
    return c;
  };

  // Two-bone IK in the plane: where must the middle joint go so that a chain of lengths a, b starting at S reaches T?
  // bend = +1 / -1 picks which side the joint bows to. Returns [upperAngle, lowerAngle] (degrees, absolute); an
  // unreachable target is clamped to a fully stretched (or fully folded) limb.
  const solve2 = (S, T, a, b, bend) => {
    let dist = len(sub(T, S)); dist = clamp(dist, Math.abs(a - b) + 0.01, a + b - 0.01);
    const th = angleOf(sub(T, S));
    const al = deg(Math.acos(clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1)));
    const up = th + bend * al; const E = add(S, mul(dir(up), a));
    return [up, angleOf(sub(T, E))];
  };
  return { solve2, hash, rng, noise1, rad, deg, dir, add, sub, mul, len, lerp, lerp2, clamp, normA, angleOf, uid, clone, esc, densify, spline, bbox, hull, hex2rgb, rgb2hex, mix, lum, tone };
})();
