// Picture add-on — night sky with moon and stars. Uses a.rng() for star positions (same every time for this item).
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'picture', id: 'night', name: 'Night sky', order: 11,
  draw(pen, b, a) {
    pen.rect(b.x + 3, b.y + 3, b.w - 6, b.h - 6, { stroke: false, hatch: '#283593', hg: 3.5, halpha: 0.75 });
    const r = Math.min(b.w, b.h) * 0.16; pen.circ(b.x + b.w * 0.72, b.y + b.h * 0.32, r, { stroke: '#fbc02d', w: 2.5, fill: '#fff59d' });
    for (let i = 0; i < 8; i++) pen.poly(CP.helpers.starPts(b.x + b.w * (0.08 + a.rng() * 0.55), b.y + b.h * (0.12 + a.rng() * 0.7), r * 0.35, r * 0.15), { stroke: '#fbc02d', w: 1.5, fill: '#fbc02d' });
  },
});
