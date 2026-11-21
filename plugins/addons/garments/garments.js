// Garment add-ons: clothes on a hanger. Fit props with a "garment" slot (the clothes rack / wardrobe).
// The top edge of the slot box is the rail: the hanger hook sits over it and the garment hangs down.
// Every garment has its own colour option (stored per slot, so each hanger can be a different colour).
(() => {
  // map garment coordinates (0,0 = top of hanger hook, about 130 wide x 270 tall) into the slot box
  function fit(pen, b) {
    const s = Math.min(b.w / 130, b.h / 270), ox = b.cx, oy = b.y;
    const T = (pts) => pts.map(([u, v]) => [ox + u * s, oy + v * s]);
    const W = (w) => Math.max(1, w * Math.min(1, s * 1.15));
    return {
      s,
      line: (pts, o = {}) => pen.line(T(pts), { ...o, w: W(o.w ?? 3) }),
      curve: (pts, o = {}) => pen.curve(T(pts), { ...o, w: W(o.w ?? 3) }),
      poly: (pts, o = {}) => pen.poly(T(pts), { ...o, w: W(o.w ?? 3.5), hg: o.hg ? o.hg * Math.max(0.5, s) : undefined }),
      circ: (u, v, r, o = {}) => pen.circ(ox + u * s, oy + v * s, Math.max(1.2, r * s), { ...o, w: W(o.w ?? 2) }),
    };
  }
  function hanger(g) {
    g.curve([[5, 16], [9, 2], [2, -9], [-7, -4]], { stroke: '#6f6f6f', w: 2.5 }); // hook over the rail
    g.poly([[0, 14], [-46, 34], [46, 34]], { stroke: '#6f6f6f', w: 2.5 });
  }
  const look = (c) => ({ stroke: c, w: 3.5, fill: 'paper', hatch: c, hg: 6, halpha: 0.55 });
  const colorParam = (def) => [{ key: 'color', label: 'Colour', type: 'color', def }];
  const garment = (id, name, order, color, body) => ({
    api: 1, version: '1.0.0', type: 'addon', kind: 'garment', id, name, order, params: colorParam(color),
    draw(pen, b, a) { const g = fit(pen, b); const c = a.params.color || color; body(g, c, look(c)); hanger(g); },
  });

  CP.register({ api: 1, items: [
    garment('robe', 'Long robe', 1, '#6a4fb3', (g, c, L) => {
      g.poly([[-14, 24], [-46, 36], [-42, 90], [-50, 190], [-60, 262], [-30, 255], [0, 262], [30, 255], [60, 262], [50, 190], [42, 90], [46, 36], [14, 24], [0, 44]], { ...L, smooth: true });
      g.line([[0, 44], [0, 260]], { stroke: c, w: 2.5 });
      g.line([[-14, 24], [-6, 60], [0, 44], [6, 60], [14, 24]], { stroke: c, w: 2.5 }); // collar
      for (const s of [-1, 1]) g.poly([[s * 44, 36], [s * 64, 70], [s * 76, 172], [s * 54, 178], [s * 46, 96]], { ...L, smooth: true, ha: s * 40 }); // wide sleeves
    }),
    garment('dress', 'Dress', 2, '#e8559a', (g, c, L) => {
      g.poly([[-12, 26], [-30, 32], [-28, 62], [-22, 104], [-72, 228], [-36, 236], [0, 230], [36, 236], [72, 228], [22, 104], [28, 62], [30, 32], [12, 26], [0, 38]], { ...L, smooth: true });
      g.line([[-23, 104], [23, 104]], { stroke: c, w: 3 }); // waist
      for (const s of [-1, 1]) g.poly([[s * 28, 32], [s * 46, 40], [s * 44, 60], [s * 28, 58]], { ...L, smooth: true }); // puff sleeves
      for (let i = -2; i <= 2; i++) g.circ(i * 22, 196 - Math.abs(i) * 4, 5, { stroke: c, fill: c });
    }),
    garment('shirt', 'T-shirt', 3, '#2f8fd6', (g, c, L) => {
      g.poly([[-12, 26], [-44, 36], [-66, 62], [-52, 82], [-38, 70], [-38, 158], [38, 158], [38, 70], [52, 82], [66, 62], [44, 36], [12, 26]], L);
      g.curve([[-12, 26], [0, 40], [12, 26]], { stroke: c, w: 3 });
    }),
    garment('coat', 'Coat', 4, '#8d5a3b', (g, c, L) => {
      g.poly([[-14, 24], [-46, 36], [-46, 220], [46, 220], [46, 36], [14, 24], [0, 40]], L);
      for (const s of [-1, 1]) g.poly([[s * 46, 36], [s * 62, 56], [s * 62, 184], [s * 46, 184]], { ...L, ha: s * 40 }); // sleeves
      g.line([[-14, 24], [-22, 50], [-4, 90]], { stroke: c, w: 3 }); g.line([[14, 24], [22, 50], [4, 90]], { stroke: c, w: 3 }); // lapels
      g.line([[0, 90], [0, 218]], { stroke: c, w: 2.5 });
      for (const v of [110, 140, 170]) g.circ(-9, v, 4, { stroke: '#3a3a3a', fill: '#3a3a3a' });
      for (const s of [-1, 1]) g.line([[s * 16, 176], [s * 36, 176]], { stroke: c, w: 2.5 }); // pockets
    }),
    garment('cape', 'Superhero cape', 5, '#d32f2f', (g, c, L) => {
      g.poly([[-16, 24], [-30, 40], [-62, 236], [-30, 226], [0, 236], [30, 226], [62, 236], [30, 40], [16, 24]], { ...L, smooth: true });
      g.curve([[-16, 26], [0, 34], [16, 26]], { stroke: '#f9a825', w: 4 }); // collar tie
      g.circ(0, 34, 6, { stroke: '#f9a825', fill: '#fbc02d' });
    }),
    garment('trousers', 'Trousers', 6, '#3f5f8a', (g, c, L) => {
      // folded over the hanger bar
      g.poly([[-40, 34], [40, 34], [44, 210], [8, 210], [0, 70], [-8, 210], [-44, 210]], L);
      g.line([[-40, 46], [40, 46]], { stroke: c, w: 2.5 }); // waistband
    }),
    garment('smock', 'Art smock', 7, '#9e9e9e', (g, c, L) => {
      g.poly([[-12, 26], [-44, 36], [-50, 200], [50, 200], [44, 36], [12, 26], [0, 40]], { ...L, halpha: 0.3 });
      for (const s of [-1, 1]) g.poly([[s * 44, 36], [s * 64, 60], [s * 66, 150], [s * 48, 150]], { ...L, halpha: 0.3 });
      g.line([[-26, 120], [26, 120]], { stroke: c, w: 2.5 }); g.line([[-26, 120], [-26, 158], [26, 158], [26, 120]], { stroke: c, w: 2.5 }); // pocket
      [['#e53935', -24, 70, 9], ['#fbc02d', 18, 92, 8], ['#1e88e5', -10, 176, 8], ['#43a047', 30, 180, 7], ['#8e24aa', 50, 128, 6]].forEach(([k, u, v, r]) => g.circ(u, v, r, { stroke: k, fill: k })); // paint splotches
    }),
  ] });
})();
