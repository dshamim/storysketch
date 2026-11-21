// Flower add-on: Daisies. Fits props with a "flower" slot (the potted plant). Stems rise from below the box into it.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'flower', id: 'daisy', name: 'Daisies', order: 1,
  draw(pen, b) {
    const s = Math.min(b.w, b.h) * 0.22; const base = [b.cx, b.y + b.h + 70];
    const heads = [[b.x + b.w * 0.22, b.y + b.h * 0.55], [b.cx, b.y + b.h * 0.25], [b.x + b.w * 0.78, b.y + b.h * 0.5]];
    for (const [fx, fy] of heads) pen.curve([base, [(base[0] + fx) / 2, (base[1] + fy) / 2 + 6], [fx, fy]], { stroke: '#2e7d32', w: 3 });
    for (const [fx, fy] of heads) {
      for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2; pen.ell(fx + Math.cos(ang) * s * 0.55, fy + Math.sin(ang) * s * 0.55, s * 0.32, s * 0.32, { stroke: '#9e9e9e', w: 1.5, fill: 'paper' }, 10); }
      pen.circ(fx, fy, s * 0.35, { stroke: '#f9a825', w: 2, fill: '#fbc02d' });
    }
  },
});
