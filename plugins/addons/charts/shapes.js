// Chart add-on: shapes.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'chart', id: 'shapes', name: 'Shapes', order: 3,
  draw(pen, b) {
    const s = Math.min(b.w / 6, b.h / 3.2), y1 = b.y + b.h * 0.32, y2 = b.y + b.h * 0.75;
    pen.circ(b.x + b.w * 0.25, y1, s, { stroke: '#e53935', w: 3, hatch: '#e53935', hg: 4, halpha: 0.45 });
    pen.rect(b.x + b.w * 0.75 - s, y1 - s, s * 2, s * 2, { stroke: '#1e88e5', w: 3, hatch: '#1e88e5', hg: 4, halpha: 0.45 });
    pen.poly([[b.x + b.w * 0.25 - s, y2 + s * 0.8], [b.x + b.w * 0.25, y2 - s], [b.x + b.w * 0.25 + s, y2 + s * 0.8]], { stroke: '#43a047', w: 3, hatch: '#43a047', hg: 4, halpha: 0.45 });
    pen.poly(CP.helpers.starPts(b.x + b.w * 0.75, y2, s * 1.05, s * 0.45), { stroke: '#fbc02d', w: 3, hatch: '#fbc02d', hg: 4, halpha: 0.6 });
  },
});
