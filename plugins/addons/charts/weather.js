// Chart add-on: weather chart.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'chart', id: 'weather', name: 'Weather', order: 4,
  draw(pen, b) {
    const s = Math.min(b.w / 5, b.h / 3); const y = b.cy;
    const sx = b.x + b.w * 0.2; pen.circ(sx, y, s * 0.55, { stroke: '#fbc02d', w: 3, hatch: '#fbc02d', hg: 3, halpha: 0.9 });
    for (let i = 0; i < 8; i++) { const d = U.dir(i * 45); pen.line([[sx + d[0] * s * 0.75, y + d[1] * s * 0.75], [sx + d[0] * s, y + d[1] * s]], { stroke: '#fbc02d', w: 2.5 }); }
    pen.poly(CP.helpers.bumpy(b.cx, y, s * 0.8, s * 0.42, 6, 0.22), { stroke: '#90a4ae', w: 3, fill: 'paper', hatch: '#90a4ae', hg: 4, halpha: 0.4, smooth: true });
    const rx = b.x + b.w * 0.8; pen.poly(CP.helpers.bumpy(rx, y - s * 0.3, s * 0.65, s * 0.32, 5, 0.22), { stroke: '#607d8b', w: 3, fill: 'paper', smooth: true });
    for (let i = -1; i <= 1; i++) pen.line([[rx + i * s * 0.35, y + s * 0.15], [rx + i * s * 0.35 - s * 0.12, y + s * 0.5]], { stroke: '#1e88e5', w: 2.5 });
  },
});
