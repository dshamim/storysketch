// Hat add-ons. Fit props with a "hat" slot (on top of the clothes rack post or the wardrobe).
// The bottom of the slot box is where the hat sits. Each hat has its own colour option.
(() => {
  function fit(pen, b, tilt) {
    const s = Math.min(b.w / 90, b.h / 100), ox = b.cx, oy = b.y + b.h, c = Math.cos(U.rad(tilt)), sn = Math.sin(U.rad(tilt));
    const T = (pts) => pts.map(([u, v]) => [ox + (u * c - v * sn) * s, oy + (u * sn + v * c) * s]);
    const W = (w) => Math.max(1, w * Math.min(1, s * 1.1));
    return {
      line: (pts, o = {}) => pen.line(T(pts), { ...o, w: W(o.w ?? 3) }),
      poly: (pts, o = {}) => pen.poly(T(pts), { ...o, w: W(o.w ?? 3.5), hg: o.hg ? o.hg * Math.max(0.5, s) : undefined }),
    };
  }
  const look = (c) => ({ stroke: c, w: 3.5, fill: 'paper', hatch: c, hg: 5, halpha: 0.55 });
  const hat = (id, name, order, color, tilt, body) => ({
    api: 1, version: '1.0.0', type: 'addon', kind: 'hat', id, name, order, params: [{ key: 'color', label: 'Colour', type: 'color', def: color }],
    draw(pen, b, a) { const c = a.params.color || color; body(fit(pen, b, tilt), c, look(c)); },
  });
  const ell = (cx, cy, rx, ry, n = 18) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; });

  CP.register({ api: 1, items: [
    hat('wizard', 'Wizard hat', 1, '#6a4fb3', 10, (g, c, L) => {
      g.poly([[-34, 0], [4, -98], [34, 0]], L);
      g.poly(CP.helpers.starPts(2, -40, 14, 6).map(([x, y]) => [x, y]), { stroke: '#f9a825', w: 2.5, fill: '#fbc02d' });
      g.line([[-44, 0], [44, 0]], { stroke: c, w: 4 });
    }),
    hat('crown', 'Crown', 2, '#f2b705', 0, (g, c, L) => {
      g.poly([[-36, 0], [-40, -48], [-20, -26], [0, -56], [20, -26], [40, -48], [36, 0]], L);
      for (const u of [-20, 0, 20]) g.poly(ell(u, -12, 5, 5, 10), { stroke: '#d32f2f', w: 2, fill: '#e53935' });
    }),
    hat('tophat', 'Top hat', 3, '#3a3a3a', -6, (g, c, L) => {
      g.poly([[-26, -6], [-28, -78], [28, -78], [26, -6]], L);
      g.poly(ell(0, -3, 44, 7), { stroke: c, w: 3.5, fill: c });
      g.line([[-27, -22], [27, -22]], { stroke: '#d32f2f', w: 5 });
    }),
    hat('party', 'Party hat', 4, '#1e88e5', 8, (g, c, L) => {
      g.poly([[-28, 0], [0, -80], [28, 0]], L);
      for (const v of [-20, -42]) g.line([[-20 * (1 + v / 80) - 6, v], [20 * (1 + v / 80) + 6, v + 6]], { stroke: '#fbc02d', w: 4 });
      g.poly(ell(0, -84, 8, 8, 10), { stroke: '#e53935', w: 2, fill: '#e53935' });
    }),
    hat('cap', 'Cap', 5, '#43a047', 0, (g, c, L) => {
      g.poly([[-32, 0], [-30, -24], [-14, -40], [14, -40], [30, -24], [32, 0]], { ...L, smooth: true });
      g.poly([[28, -2], [60, 0], [58, 8], [28, 6]], { stroke: c, w: 3, fill: c });
    }),
  ] });
})();
