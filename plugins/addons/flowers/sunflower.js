// Flower add-on: Sunflower. Fits props with a "flower" slot (the potted plant). Stems rise from below the box into it.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'flower', id: 'sunflower', name: 'Sunflower', order: 3,
  draw(pen, b) {
    const s = Math.min(b.w, b.h) * 0.22; const base = [b.cx, b.y + b.h + 70];
    const heads = [[b.x + b.w * 0.22, b.y + b.h * 0.55], [b.cx, b.y + b.h * 0.25], [b.x + b.w * 0.78, b.y + b.h * 0.5]];
    for (const [fx, fy] of [heads[1]]) pen.curve([base, [(base[0] + fx) / 2, (base[1] + fy) / 2 + 6], [fx, fy]], { stroke: '#2e7d32', w: 3 });
    const [fx, fy] = heads[1];
    for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2; pen.ell(fx + Math.cos(ang) * s * 1.1, fy + Math.sin(ang) * s * 1.1, s * 0.4, s * 0.4, { stroke: '#f9a825', w: 2, hatch: '#fbc02d', hg: 2.5, halpha: 0.9 }, 10); }
    pen.circ(fx, fy, s * 0.75, { stroke: '#6d4c41', w: 2.5, hatch: '#6d4c41', hg: 2.5, halpha: 0.9 });
  },
});
