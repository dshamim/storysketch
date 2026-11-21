// Flower add-on: Tulips. Fits props with a "flower" slot (the potted plant). Stems rise from below the box into it.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'flower', id: 'tulip', name: 'Tulips', order: 2,
  draw(pen, b) {
    const s = Math.min(b.w, b.h) * 0.22; const base = [b.cx, b.y + b.h + 70];
    const heads = [[b.x + b.w * 0.22, b.y + b.h * 0.55], [b.cx, b.y + b.h * 0.25], [b.x + b.w * 0.78, b.y + b.h * 0.5]];
    for (const [fx, fy] of heads) pen.curve([base, [(base[0] + fx) / 2, (base[1] + fy) / 2 + 6], [fx, fy]], { stroke: '#2e7d32', w: 3 });
    heads.forEach(([fx, fy], i) => { const c = ['#e53935', '#d81b60', '#fb8c00'][i % 3];
      pen.poly([[fx - s * 0.6, fy - s * 0.2], [fx - s * 0.3, fy - s * 0.9], [fx, fy - s * 0.4], [fx + s * 0.3, fy - s * 0.9], [fx + s * 0.6, fy - s * 0.2], [fx + s * 0.4, fy + s * 0.5], [fx - s * 0.4, fy + s * 0.5]], { stroke: c, w: 2.5, hatch: c, hg: 3, halpha: 0.85, smooth: true }); });
  },
});
