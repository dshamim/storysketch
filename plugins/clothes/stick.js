// Clothes: Stick. See ../README.md for the clothes context (c.J, c.style, c.skirtHull(), c.bodice(), …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'clothes', id: 'stick', name: 'Stick', legSpread: 0,
  draw(pen, c) {
    pen.line([c.J.neck, c.J.hip], { stroke: c.cast.color, w: c.W });
  },
});
