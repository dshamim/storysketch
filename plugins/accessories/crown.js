// Accessory: crown (head slot — drawn on top of the hair).
CP.register({
  api: 1, version: '1.0.0',
  type: 'accessory', id: 'crown', name: 'Crown', slot: 'head', color: '#f2b705',
  draw(pen, a) {
    const F = a.F;
    pen.poly([F(-0.55, -0.88), F(-0.62, -1.55), F(-0.3, -1.18), F(0, -1.7), F(0.3, -1.18), F(0.62, -1.55), F(0.55, -0.88)], { stroke: a.color, w: a.W * 0.8, hatch: a.color, hg: 3.5, halpha: 0.8 });
  },
});
