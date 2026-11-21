// Clothes: Tunic (to knees). See ../README.md for the clothes context (c.J, c.style, c.skirtHull(), c.bodice(), …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'clothes', id: 'tunic', name: 'Tunic (to knees)', legSpread: 8, armOffset: 8, skirt: 0.55,
  draw(pen, c) {
    pen.poly(c.skirtHull(), { ...c.style, fill: 'paper' });
    c.bodice();
    pen.line([c.J.neck, U.add(c.J.neck, U.mul(c.down, 18 * c.k))], { stroke: c.color, w: c.W * 0.6 });
  },
});
