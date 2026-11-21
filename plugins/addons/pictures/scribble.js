// Picture add-on: Scribble — the kind a young child makes. "Messy" is the original one; the others are
// loops, zigzags, round and round, coloured-in patches and lots-of-colours.
// box = the area to draw in { x, y, w, h, cx, cy }; a.seed keeps random details the same every time.
(() => {
  const PAL = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#d81b60', '#00897b'];
  function draw(pen, b, a) {
    const style = (a.params && a.params.style) || 'messy';
    if (style === 'messy') { CP.helpers.paintingOn(pen, 'scribble', b.x, b.y, b.w, b.h, a.seed); return; }
    const r = a.rng || U.rng(U.hash(a.seed)); const pick = () => PAL[Math.floor(r() * PAL.length)];
    const pad = Math.min(b.w, b.h) * 0.1, x0 = b.x + pad, y0 = b.y + pad, W = b.w - 2 * pad, H = b.h - 2 * pad;
    const w = Math.max(2, Math.min(4, Math.min(W, H) * 0.025));
    if (style === 'loops') { // joined-up loops, like pretend writing
      for (const [k, row] of [[0, 0.3], [1, 0.72]]) {
        const R = H * 0.13, n = Math.max(3, Math.round(W / (R * 1.6))), pts = [], c = pick();
        for (let i = 0; i <= n * 12; i++) { const t = i / (n * 12), ang = t * n * Math.PI * 2 + k; pts.push([x0 + R + t * (W - 2 * R) - Math.cos(ang) * R * (0.85 + r() * 0.25), y0 + H * row - Math.sin(ang) * R * 1.2 + Math.sin(t * 6) * R * 0.3]); }
        pen.curve(pts, { stroke: c, w });
      }
    } else if (style === 'zigzag') {
      for (let k = 0; k < 3; k++) {
        const y = y0 + H * (0.18 + k * 0.32), n = Math.max(6, Math.round(W / (H * 0.08))), pts = [];
        for (let i = 0; i <= n; i++) pts.push([x0 + i * W / n, y + (i % 2 ? -1 : 1) * H * 0.1 * (0.7 + r() * 0.5)]);
        pen.line(pts, { stroke: pick(), w });
      }
    } else if (style === 'round') { // round and round and round
      const c = pick(), cx = x0 + W / 2, cy = y0 + H / 2, pts = [];
      for (let i = 0; i < 170; i++) { const ang = i / 170 * Math.PI * 2 * 7, k = 0.55 + 0.35 * Math.sin(i / 170 * Math.PI * 3 + 1) + r() * 0.08; pts.push([cx + Math.cos(ang) * W * 0.45 * k, cy + Math.sin(ang) * H * 0.45 * k]); }
      pen.curve(pts, { stroke: c, w });
    } else if (style === 'colourin') { // big coloured-in patches, going over the lines
      for (let k = 0; k < 3; k++) {
        const c = pick(), cx = x0 + W * (0.22 + k * 0.28 + (r() - 0.5) * 0.1), cy = y0 + H * (0.3 + r() * 0.4);
        pen.poly(CP.helpers.bumpy(cx, cy, W * (0.14 + r() * 0.06), H * (0.22 + r() * 0.1), 4 + Math.floor(r() * 4), 0.18), { stroke: c, w, smooth: true, hatch: c, hg: 2.6, halpha: 0.9, ha: -70 + r() * 140 });
      }
    } else { // rainbow: lots of colours on top of each other
      for (let k = 0; k < 5; k++) { const pts = []; for (let i = 0; i < 10; i++) pts.push([x0 + r() * W, y0 + r() * H]); pen.curve(pts, { stroke: PAL[(k * 3 + Math.floor(r() * 2)) % PAL.length], w }); }
    }
  }
  CP.register({
    api: 1, version: '1.1.0',
    type: 'addon', kind: 'picture', id: 'scribble', name: 'Scribble', order: 6,
    params: [{ key: 'style', label: 'Scribble', type: 'select', def: 'messy', options: { messy: 'Messy', loops: 'Loopy loops', zigzag: 'Zigzags', round: 'Round and round', colourin: 'Coloured-in patches', rainbow: 'Lots of colours' } }],
    draw,
  });
})();
